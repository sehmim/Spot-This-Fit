interface Env {
  VERIFY_TOKEN: string;
  APP_SECRET: string;
  PAGE_ACCESS_TOKEN: string;
}

// Track processed message IDs to prevent duplicate processing.
// Instagram re-delivers the same webhook when processing takes too long.
const processedMessages = new Set<string>();

export default {
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
 * Receive and log Instagram messaging webhook payloads.
 */
async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const body = await request.text();

  // Validate signature if APP_SECRET is configured
  if (env.APP_SECRET) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!signature) {
      console.error("Missing x-hub-signature-256 header");
      return new Response("Unauthorized", { status: 401 });
    }

    const isValid = await verifySignature(body, signature, env.APP_SECRET);
    if (!isValid) {
      console.error("Invalid signature");
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const payload = JSON.parse(body);

  // Log the full payload for analysis
  console.log("=== INSTAGRAM WEBHOOK PAYLOAD ===");
  console.log(JSON.stringify(payload, null, 2));

  // Walk through entries and look for shared content (reels/posts)
  if (payload.object === "instagram") {
    for (const entry of payload.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        const senderId = event.sender?.id;
        const message = event.message;

        // Skip non-message events (read receipts, delivery confirmations, etc.)
        if (!message) {
          console.log("Skipping non-message event");
          continue;
        }

        // Skip echo messages (sent by the bot itself) to prevent infinite loops
        if (message.is_echo) {
          console.log("Skipping echo message");
          continue;
        }

        // Deduplicate: Instagram re-delivers the same message when processing is slow
        const mid = message.mid;
        if (mid && processedMessages.has(mid)) {
          console.log(`Skipping already-processed message: ${mid}`);
          continue;
        }
        if (mid) {
          processedMessages.add(mid);
          // Prevent the set from growing forever — clean up after 10 minutes
          setTimeout(() => processedMessages.delete(mid), 10 * 60 * 1000);
        }

        if (message.attachments) {
          for (const attachment of message.attachments) {
            if (["ig_reel", "share", "link"].includes(attachment.type)) {
              const contentUrl = attachment.payload?.url;
              const reelVideoId = attachment.payload?.reel_video_id;
              console.log("=== SHARED CONTENT DETECTED ===");
              console.log(`Sender: ${senderId}`);
              console.log(`Type: ${attachment.type}`);
              console.log(`URL: ${contentUrl}`);
              console.log(`Reel Video ID: ${reelVideoId}`);
              console.log(`Title: ${attachment.payload?.title}`);

              if (contentUrl) {
                await processAndReply(senderId, contentUrl, env);
              }
            }
          }
        }

        // Instagram sometimes sends the reel URL as plain text
        if (message?.text) {
          const igUrlMatch = message.text.match(
            /https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p|reels)\/[\w-]+/
          );
          if (igUrlMatch) {
            const contentUrl = igUrlMatch[0];
            console.log("=== INSTAGRAM LINK IN TEXT ===");
            console.log(`Sender: ${senderId}`);
            console.log(`URL: ${contentUrl}`);

            await processAndReply(senderId, contentUrl, env);
          }
        }
      }
    }
  }

  // Meta requires a 200 response within 20 seconds
  return new Response("EVENT_RECEIVED", { status: 200 });
}

const SCREENSHOT_API = "https://instag-playwright.shadidhaque2014.workers.dev";
const VECTORIZE_API = "https://vertorize-img-get-similar-products.shadidhaque2014.workers.dev";

/**
 * Take a permalink, screenshot it, vectorize each frame, and reply with results link.
 */
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

async function processAndReply(
  senderId: string,
  permalink: string,
  env: Env
): Promise<void> {
  try {
    // Send an immediate acknowledgement
    await sendTextReply(
      senderId,
      "We received your message! Currently finding products with great deals for you...",
      env
    );

    // Step 1: Screenshot the reel/post
    console.log(`Screenshotting: ${permalink}`);
    const screenshotRes = await fetch(SCREENSHOT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: permalink,
        count: 3,
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
      console.log(`Vectorizing: ${imgUrl}`);
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

    // Step 3: Reply with results link (include keys as comma-separated param)
    const keysParam = keys.map((k) => encodeURIComponent(k)).join(",");
    const shopUrl = `https://www.spotthis.fit/results?id=${runId}&keys=${keysParam}`;
    console.log(`Results URL: ${shopUrl}`);
    await sendButtonReply(senderId, shopUrl, env);
  } catch (err) {
    console.error(`processAndReply error: ${err}`);
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
                  title: "We received your message!",
                  subtitle: "Checkout what we found",
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
