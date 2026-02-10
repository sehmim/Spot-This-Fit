interface Env {
  VERIFY_TOKEN: string;
  APP_SECRET: string;
  PAGE_ACCESS_TOKEN: string;
}

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

        if (message?.attachments) {
          for (const attachment of message.attachments) {
            if (["ig_reel", "share", "link"].includes(attachment.type)) {
              const contentUrl = attachment.payload?.url;
              console.log("=== SHARED CONTENT DETECTED ===");
              console.log(`Sender: ${senderId}`);
              console.log(`Type: ${attachment.type}`);
              console.log(`URL: ${contentUrl}`);
              console.log(`Reel Video ID: ${attachment.payload?.reel_video_id}`);
              console.log(`Title: ${attachment.payload?.title}`);

              const shopUrl = `https://www.spotthis.fit/results?url=${encodeURIComponent(contentUrl)}`;
              await sendButtonReply(senderId, shopUrl, env);
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

            const shopUrl = `https://www.spotthis.fit/results?url=${encodeURIComponent(contentUrl)}`;
            await sendButtonReply(senderId, shopUrl, env);
          }
        }
      }
    }
  }

  // Meta requires a 200 response within 20 seconds
  return new Response("EVENT_RECEIVED", { status: 200 });
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
