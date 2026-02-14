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
const MAX_VIDEO_SIZE_MB = 10;
const RATE_LIMIT_WHITELIST = new Set(["2340229259795647"]);

// Feature toggles — flip to true to re-enable
const ENABLE_PRODUCTS = false;

/**
 * Check if a user has exceeded their daily limit. Returns true if allowed.
 */
async function checkRateLimit(senderId: string, env: Env): Promise<boolean> {
  if (RATE_LIMIT_WHITELIST.has(senderId)) return true;
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

        // Handle quick reply selections (only active when products are enabled)
        if (ENABLE_PRODUCTS && message.quick_reply?.payload) {
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

        // Extract content URL from attachments or text
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
              "You've reached your daily limit of 5 analyses. Try again tomorrow!\n\n☕ Support us: https://www.spotthis.fit/donate\n📬 Contact: https://www.spotthis.fit/contact",
              env
            );
            continue;
          }

          if (ENABLE_PRODUCTS) {
            // Show choice buttons when products feature is enabled
            console.log(`Sending choice buttons to ${senderId} for: ${contentUrl}`);
            await sendChoiceButtons(senderId, contentUrl, env);
          } else {
            // Go straight to AI detection
            console.log(`Enqueuing AI detect for ${senderId}: ${contentUrl}`);
            messagesToEnqueue.push({ senderId, contentUrl, mid, mode: "ai_detect" });
          }
        } else {
          // No valid content URL found — figure out what the user sent and guide them

          // Check if user directly uploaded media (video, image, audio, etc.)
          const hasDirectUpload = message.attachments?.some(
            (a: { type: string }) =>
              ["video", "image", "audio", "file"].includes(a.type)
          );

          if (hasDirectUpload) {
            console.log(`Direct upload from ${senderId} — rejecting`);
            await sendTextReply(
              senderId,
              "We can't analyze videos or images sent directly. Please share a public Instagram reel or post instead — just tap the share button (paper plane icon) on the reel/post and send it to us here!",
              env
            );
          } else if (message.text) {
            // Plain text with no IG URL
            console.log(`Unrecognized text from ${senderId}: ${message.text}`);
            await sendTextReply(
              senderId,
              "To use SpotThisFit, share an Instagram reel or post with us! Just tap the share button (paper plane icon) on any reel or post and send it here. We'll analyze it for AI-generated content.",
              env
            );
          }
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
const SIGHTENGINE_VIDEO_API = "https://api.sightengine.com/1.0/video/check-sync.json";
const OPENAI_API = "https://api.openai.com/v1/chat/completions";

/**
 * Fetch video from IG CDN, upload to Sightengine video AI detection,
 * use GPT-4o to highlight which parts are AI-generated, and reply.
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

  // Step 1: Fetch video bytes from IG CDN
  console.log(`Fetching video from IG CDN: ${contentUrl}`);
  const videoRes = await fetch(contentUrl, {
    headers: {
      "User-Agent": "curl/8.0",
    },
  });

  if (!videoRes.ok) {
    console.error(`Failed to fetch video: ${videoRes.status} ${videoRes.statusText}`);
    await sendTextReply(senderId, "Sorry, we couldn't download the video. Please try again.", env);
    return;
  }

  const videoBuffer = await videoRes.arrayBuffer();
  const sizeMB = (videoBuffer.byteLength / 1024 / 1024).toFixed(1);
  const contentType = videoRes.headers.get("content-type");
  console.log(`Video fetched: ${sizeMB}MB, content-type: ${contentType}`);

  if (videoBuffer.byteLength < 1000 || contentType?.includes("text/html")) {
    console.error("Video fetch returned HTML or empty body — CDN URL may require browser access");
    await sendTextReply(senderId, "Sorry, we couldn't download the video. Please try again.", env);
    return;
  }

  const videoSizeMB = videoBuffer.byteLength / (1024 * 1024);
  if (videoSizeMB > MAX_VIDEO_SIZE_MB) {
    console.log(`Video too large: ${videoSizeMB.toFixed(1)}MB (limit ${MAX_VIDEO_SIZE_MB}MB)`);
    await sendTextReply(
      senderId,
      `This video is too large to analyze (${videoSizeMB.toFixed(0)}MB). We can only process videos under 1 minute. Please try a shorter reel!`,
      env
    );
    return;
  }

  // Step 2: Run genai and deepfake detection sequentially
  // (Sightengine plan limits concurrent video streams to 1)
  console.log("Uploading video to Sightengine (genai then deepfake)...");
  const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });

  const buildForm = (models: string): FormData => {
    const fd = new FormData();
    fd.append("media", videoBlob, "video.mp4");
    fd.append("models", models);
    fd.append("api_user", env.SIGHTENGINE_API_USER);
    fd.append("api_secret", env.SIGHTENGINE_API_SECRET);
    return fd;
  };

  const genaiRes = await fetch(SIGHTENGINE_VIDEO_API, { method: "POST", body: buildForm("genai") });
  const deepfakeRes = await fetch(SIGHTENGINE_VIDEO_API, { method: "POST", body: buildForm("deepfake") });

  const genaiText = await genaiRes.text();
  const deepfakeText = await deepfakeRes.text();
  console.log(`Sightengine genai response: ${genaiText}`);
  console.log(`Sightengine deepfake response: ${deepfakeText}`);

  if (!genaiRes.ok || !deepfakeRes.ok) {
    console.error(`Sightengine API failed: genai=${genaiRes.status} deepfake=${deepfakeRes.status}`);
    await sendTextReply(senderId, "Sorry, the AI analysis failed. Please try again later.", env);
    return;
  }

  interface SightFrame {
    info: { id: string; position: number };
    type: { ai_generated?: number; deepfake?: number };
  }
  interface SightResponse {
    status: string;
    data: { frames: SightFrame[] };
  }

  const genaiData: SightResponse = JSON.parse(genaiText);
  const deepfakeData: SightResponse = JSON.parse(deepfakeText);

  if (
    genaiData.status !== "success" || !genaiData.data?.frames?.length ||
    deepfakeData.status !== "success" || !deepfakeData.data?.frames?.length
  ) {
    console.error("Sightengine unexpected response format");
    await sendTextReply(senderId, "Sorry, we couldn't analyze this video. It may not be supported.", env);
    return;
  }

  const genaiFrames = genaiData.data.frames;
  const deepfakeFrames = deepfakeData.data.frames;
  console.log(`Sightengine analyzed ${genaiFrames.length} genai frames, ${deepfakeFrames.length} deepfake frames`);

  // Build a lookup of deepfake scores by position for merging
  const deepfakeByPosition = new Map<number, number>();
  for (const f of deepfakeFrames) {
    deepfakeByPosition.set(f.info.position, f.type.deepfake ?? 0);
  }

  // Step 3: Compute metrics
  const genaiScores = genaiFrames.map((f) => f.type.ai_generated ?? 0);
  const aiFrameCount = genaiScores.filter((s) => s >= 0.5).length;
  const aiPercentage = Math.round((aiFrameCount / genaiScores.length) * 100);

  const deepfakeScores = deepfakeFrames.map((f) => f.type.deepfake ?? 0);
  const dfFrameCount = deepfakeScores.filter((s) => s >= 0.5).length;
  const deepfakePercentage = Math.round((dfFrameCount / deepfakeScores.length) * 100);

  // Build combined timeline
  const timeline = genaiFrames.map((f) => {
    const totalSecs = Math.floor(f.info.position / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const ts = `${mins}:${secs.toString().padStart(2, "0")}`;
    const genaiScore = (f.type.ai_generated ?? 0).toFixed(2);
    const dfScore = (deepfakeByPosition.get(f.info.position) ?? 0).toFixed(2);
    return `${ts} → genai=${genaiScore}, deepfake=${dfScore}`;
  });

  // Collect video metadata for LLM context
  const videoMeta = {
    fileSizeMB: videoSizeMB.toFixed(1),
    contentType: contentType ?? "unknown",
    sourceUrl: contentUrl,
  };

  console.log(`AI analysis: genai=${aiPercentage}%, deepfake=${deepfakePercentage}%`);

  // Step 4: Summarize with GPT-4o using both signals + metadata
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
          content: `You are an AI detection analyst. You receive TWO detection signals for a video and must combine them into a single verdict.

Signals:
1. **GenAI detection** — detects fully AI-generated/synthetic video content (score 0-1 per frame)
2. **Deepfake detection** — detects face-swapping and facial manipulation in otherwise real footage (score 0-1 per frame)

You also receive video metadata (file size, content type, source URL) which may provide additional context clues.

Rules for your verdict — consider BOTH signals:
- If genai% > 20% OR deepfake% > 20%: Verdict is YES
- If genai% is 1-20% OR deepfake% is 1-20%: Verdict is PARTIAL
- If both are 0%: Verdict is NO
- If genai is high but deepfake is low: the video is likely fully AI-generated (not a face swap)
- If deepfake is high but genai is low: the video is likely real footage with manipulated/swapped faces
- If both are high: the video has multiple forms of AI manipulation

Be definitive. Do NOT say "likely" or "possibly". Do NOT mention frames, sampling methodology, or the detection tools by name.

Format exactly:

🔍 AI Detection Report

Verdict: [YES - AI Generated / YES - Deepfake Detected / YES - Multiple AI Manipulations / PARTIAL - Some AI Content / NO - Not AI Generated]
AI-Generated Content: X%
Deepfake Content: X%

🕐 Timeline:
[Group consecutive sections into time ranges. For each range, note what was detected (AI-generated, deepfake, or both). Keep it concise.]

💡 [One or two confident sentences summarizing what kind of AI manipulation was found (or not), and what that means for the viewer]`,
        },
        {
          role: "user",
          content: `GenAI percentage: ${aiPercentage}%\nDeepfake percentage: ${deepfakePercentage}%\n\nVideo metadata:\n- File size: ${videoMeta.fileSizeMB} MB\n- Content type: ${videoMeta.contentType}\n- Source: ${videoMeta.sourceUrl}\n\nPer-frame timeline (genai and deepfake scores):\n${timeline.join("\n")}`,
        },
      ],
      max_tokens: 500,
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
      count: 7,
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
