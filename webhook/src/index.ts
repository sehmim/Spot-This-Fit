interface Env {
  VERIFY_TOKEN: string;
  APP_SECRET: string;
  PAGE_ACCESS_TOKEN: string;
  PROCESSING_QUEUE: Queue;
  SIGHTENGINE_API_USER: string;
  SIGHTENGINE_API_SECRET: string;
  OPENAI_API_KEY: string;
  RATE_LIMIT_KV: KVNamespace;
}

const DAILY_LIMIT = 5;

/**
 * Check if a user has exceeded their daily limit. Returns true if allowed.
 */
async function checkRateLimit(senderId: string, env: Env): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `rate:${senderId}:${today}`;
  const current = parseInt((await env.RATE_LIMIT_KV.get(key)) ?? "0", 10);
  if (current >= DAILY_LIMIT) return false;
  await env.RATE_LIMIT_KV.put(key, String(current + 1), { expirationTtl: 86400 });
  return true;
}

interface QueueMessage {
  senderId: string;
  contentUrl: string;
  mid: string;
  mode: "ai_detect" | "products";
}

// Prefix used in quick_reply payloads to identify our choice buttons
const PAYLOAD_PREFIX_AI = "SPOT_AI:";
const PAYLOAD_PREFIX_PRODUCTS = "SPOT_PRODUCTS:";

export default {
  // HTTP handler — receives webhooks, enqueues work, returns 200 instantly
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET") {
      return handleVerification(url, env);
    }

    if (request.method === "POST") {
      return handleWebhook(request, env);
    }

    return new Response("Method not allowed", { status: 405 });
  },

  // Queue consumer — processes reel screenshots/vectorization with no time pressure
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      const { senderId, contentUrl, mode } = msg.body;
      console.log(`Queue processing (${mode}) for ${senderId}`);
      try {
        if (mode === "ai_detect") {
          await processAiDetection(senderId, contentUrl, env);
        } else {
          await processAndReply(senderId, contentUrl, env);
        }
        msg.ack();
      } catch (err) {
        console.error(`Queue processing error: ${err}`);
        msg.retry();
      }
    }
  },
};

/**
 * Meta webhook verification — responds to the subscription challenge.
 */
function handleVerification(url: URL, env: Env): Response {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.VERIFY_TOKEN) {
    console.log("Webhook verified");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * Receive Instagram webhook, enqueue work, return 200 instantly.
 */
async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const body = await request.text();

  // Validate signature if APP_SECRET is configured
  if (env.APP_SECRET) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!signature) {
      return new Response("Unauthorized", { status: 401 });
    }

    const isValid = await verifySignature(body, signature, env.APP_SECRET);
    if (!isValid) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const payload = JSON.parse(body);
  console.log(`IG webhook payload: ${JSON.stringify(payload)}`);

  const messagesToEnqueue: QueueMessage[] = [];

  if (payload.object === "instagram") {
    for (const entry of payload.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        const senderId = event.sender?.id;
        const message = event.message;

        // Skip non-message events (read receipts, delivery confirmations, etc.)
        if (!message) continue;

        // Skip echo messages (sent by the bot itself)
        if (message.is_echo) continue;

        const mid = message.mid;
        console.log(`Message from ${senderId}: mid=${mid}, attachments=${JSON.stringify(message.attachments)}, text=${message.text}, quick_reply=${JSON.stringify(message.quick_reply)}`);

        // Handle quick reply selections (user chose AI detect or Products)
        if (message.quick_reply?.payload) {
          const payload = message.quick_reply.payload as string;
          if (payload.startsWith(PAYLOAD_PREFIX_AI)) {
            const contentUrl = payload.slice(PAYLOAD_PREFIX_AI.length);
            console.log(`User chose AI detect for: ${contentUrl}`);
            messagesToEnqueue.push({ senderId, contentUrl, mid, mode: "ai_detect" });
          } else if (payload.startsWith(PAYLOAD_PREFIX_PRODUCTS)) {
            const contentUrl = payload.slice(PAYLOAD_PREFIX_PRODUCTS.length);
            console.log(`User chose Products for: ${contentUrl}`);
            messagesToEnqueue.push({ senderId, contentUrl, mid, mode: "products" });
          }
          continue;
        }

        // When user sends a reel/post, prompt them to choose
        let contentUrl: string | null = null;

        if (message.attachments) {
          for (const attachment of message.attachments) {
            console.log(`Attachment type=${attachment.type}, url=${attachment.payload?.url}`);
            if (["ig_reel", "share", "link"].includes(attachment.type)) {
              contentUrl = attachment.payload?.url;
              break;
            }
          }
        }

        // Instagram sometimes sends the reel URL as plain text
        if (!contentUrl && message?.text) {
          const igUrlMatch = message.text.match(
            /https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p|reels)\/[\w-]+/
          );
          if (igUrlMatch) {
            contentUrl = igUrlMatch[0];
          }
        }

        if (contentUrl) {
          const allowed = await checkRateLimit(senderId, env);
          if (!allowed) {
            console.log(`Rate limit reached for ${senderId}`);
            await sendTextReply(
              senderId,
              "You've reached your daily limit of 5 analyses. Try again tomorrow or contact us at https://www.spotthis.fit/contact",
              env
            );
            continue;
          }
          console.log(`Sending choice buttons to ${senderId} for: ${contentUrl}`);
          await sendChoiceButtons(senderId, contentUrl, env);
        }
      }
    }
  }

  // Enqueue each message individually for background processing
  if (messagesToEnqueue.length > 0) {
    await env.PROCESSING_QUEUE.sendBatch(
      messagesToEnqueue.map((m) => ({ body: m }))
    );
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}

const SCREENSHOT_API = "https://instag-playwright.shadidhaque2014.workers.dev";
const VECTORIZE_API = "https://vertorize-img-get-similar-products.shadidhaque2014.workers.dev";
const SIGHTENGINE_IMAGE_API = "https://api.sightengine.com/1.0/check.json";
const OPENAI_API = "https://api.openai.com/v1/chat/completions";

/**
 * Screenshot the reel, analyze each frame with Sightengine image AI detection,
 * summarize the overall AI percentage with GPT-4o, and reply.
 */
async function processAiDetection(
  senderId: string,
  contentUrl: string,
  env: Env
): Promise<void> {
  await sendTextReply(
    senderId,
    "Analyzing your video for AI-generated content...",
    env
  );

  // Step 1: Screenshot the reel/post (6 evenly spaced frames)
  console.log(`Screenshotting: ${contentUrl}`);
  const screenshotRes = await fetch(SCREENSHOT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: contentUrl,
      count: 6,
      prefix: "insta",
    }),
  });

  if (!screenshotRes.ok) {
    const err = await screenshotRes.text();
    console.error(`Screenshot API failed: ${screenshotRes.status} ${err}`);
    await sendTextReply(senderId, "Sorry, we couldn't process the video. Please try again.", env);
    return;
  }

  const screenshotData: {
    runId: string;
    count: number;
    keys: string[];
  } = await screenshotRes.json();
  console.log(`Screenshot done: ${screenshotData.keys.length} frames captured`);

  const { keys } = screenshotData;

  // Step 2: Analyze each frame with Sightengine (in parallel)
  console.log("Sending frames to Sightengine...");
  const results = await Promise.all(
    keys.map(async (key, index) => {
      const imgUrl = `${SCREENSHOT_API}/?key=${key}`;
      const params = new URLSearchParams({
        url: imgUrl,
        models: "genai",
        api_user: env.SIGHTENGINE_API_USER,
        api_secret: env.SIGHTENGINE_API_SECRET,
      });

      const res = await fetch(`${SIGHTENGINE_IMAGE_API}?${params}`);
      const resText = await res.text();

      if (!res.ok) {
        console.error(`Sightengine failed for frame ${index + 1}: ${res.status} ${resText}`);
        return null;
      }

      const data: { status: string; type: { ai_generated: number } } = JSON.parse(resText);
      console.log(`Frame ${index + 1}: ai_generated=${data.type?.ai_generated}`);

      if (data.status !== "success") return null;
      return data.type.ai_generated;
    })
  );

  const scores = results.filter((s): s is number => s !== null);
  if (scores.length === 0) {
    await sendTextReply(senderId, "Sorry, we couldn't analyze this video. Please try again later.", env);
    return;
  }

  // Step 3: Compute percentage of video that is AI-generated
  const aiFrameCount = scores.filter((s) => s >= 0.5).length;
  const aiPercentage = Math.round((aiFrameCount / scores.length) * 100);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  console.log(`AI analysis: ${aiPercentage}% AI (${aiFrameCount}/${scores.length} frames), avg score: ${avgScore.toFixed(2)}`);

  // Step 4: Summarize with GPT-4o
  console.log("Sending to GPT-4o for summary...");
  const gptRes = await fetch(OPENAI_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI detection analyst. Write a short, friendly Instagram DM response about whether a video is AI-generated. Do NOT mention frames, samples, or how the analysis was done. Just tell the user the result as if you analyzed the whole video.

Format:

🔍 AI Detection Report

Verdict: [Likely AI-Generated / Partially AI / Likely Real]

📊 Results:
• Estimated AI content: X% of the video

💡 [One sentence plain-English interpretation — e.g. "This video appears to be almost entirely generated by AI" or "This looks like authentic real footage"]`,
        },
        {
          role: "user",
          content: `AI percentage: ${aiPercentage}%, average confidence score: ${avgScore.toFixed(2)}`,
        },
      ],
      max_tokens: 300,
    }),
  });

  if (!gptRes.ok) {
    const err = await gptRes.text();
    console.error(`OpenAI API failed: ${gptRes.status} ${err}`);
    await sendTextReply(senderId, "Sorry, we couldn't generate a summary. Please try again later.", env);
    return;
  }

  const gptData: {
    choices: Array<{ message: { content: string } }>;
  } = await gptRes.json();

  const summary = gptData.choices?.[0]?.message?.content ?? "Unable to generate summary.";
  console.log(`GPT-4o summary: ${summary}`);

  // Step 5: Send summary back to user
  await sendTextReply(senderId, summary, env);
}

/**
 * Take a permalink, screenshot it, vectorize each frame, and reply with results link.
 */
async function processAndReply(
  senderId: string,
  permalink: string,
  env: Env
): Promise<void> {
  // Send an immediate acknowledgement
  await sendTextReply(
    senderId,
    "We received your message! Currently finding products with great deals for you...",
    env
  );

  // Step 1: Screenshot the reel/post
  const screenshotRes = await fetch(SCREENSHOT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: permalink,
      count: 6,
      prefix: "insta",
    }),
  });

  if (!screenshotRes.ok) {
    const err = await screenshotRes.text();
    console.error(`Screenshot API failed: ${screenshotRes.status} ${err}`);
    return;
  }

  const screenshotData: {
    runId: string;
    count: number;
    keys: string[];
  } = await screenshotRes.json();

  const { runId, keys } = screenshotData;
  console.log(`Screenshot done. runId: ${runId}, keys: ${keys.length}`);

  // Step 2: Vectorize each screenshot in parallel
  const vectorizePromises = keys.map((key) => {
    const imgUrl = `${SCREENSHOT_API}/?key=${key}`;
    return fetch(VECTORIZE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: runId,
        img_url: imgUrl,
        top_k: 15,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.text();
        console.error(`Vectorize failed for ${key}: ${res.status} ${err}`);
      } else {
        console.log(`Vectorized: ${key}`);
      }
    });
  });

  await Promise.all(vectorizePromises);

  // Step 3: Reply with results link
  const keysParam = keys.map((k) => encodeURIComponent(k)).join(",");
  const shopUrl = `https://www.spotthis.fit/results?id=${runId}&keys=${keysParam}`;
  console.log(`Results URL: ${shopUrl}`);
  await sendButtonReply(senderId, shopUrl, env);
}

/**
 * Send quick reply buttons letting user choose between AI detection and product spotting.
 */
async function sendChoiceButtons(
  recipientId: string,
  contentUrl: string,
  env: Env
): Promise<void> {
  const response = await fetch(
    `https://graph.instagram.com/v22.0/me/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAGE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          text: "What would you like to do with this content?",
          quick_replies: [
            {
              content_type: "text",
              title: "🔍 Spot AI",
              payload: `${PAYLOAD_PREFIX_AI}${contentUrl}`,
            },
            {
              content_type: "text",
              title: "🛍️ Spot Products",
              payload: `${PAYLOAD_PREFIX_PRODUCTS}${contentUrl}`,
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to send choice buttons: ${response.status} ${error}`);
  } else {
    console.log(`Choice buttons sent to ${recipientId}`);
  }
}

async function sendTextReply(
  recipientId: string,
  text: string,
  env: Env
): Promise<void> {
  const response = await fetch(
    `https://graph.instagram.com/v22.0/me/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAGE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to send text reply: ${response.status} ${error}`);
  }
}

/**
 * Send a reply with a "Shop Now" button linking to spotthis.fit.
 */
async function sendButtonReply(
  recipientId: string,
  shopUrl: string,
  env: Env
): Promise<void> {
  const response = await fetch(
    `https://graph.instagram.com/v22.0/me/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAGE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [
                {
                  title: "We found some great deals!",
                  subtitle: "Checkout what we found for you",
                  buttons: [
                    {
                      type: "web_url",
                      url: shopUrl,
                      title: "Shop Now",
                    },
                  ],
                },
              ],
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to send button reply: ${response.status} ${error}`);
  } else {
    console.log(`Button reply sent to ${recipientId}`);
  }
}

/**
 * Verify the X-Hub-Signature-256 header using HMAC-SHA256.
 */
async function verifySignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const digest = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const expected = `sha256=${digest}`;

  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  const a = encoder.encode(expected);
  const b = encoder.encode(signature);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}
