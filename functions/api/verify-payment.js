function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const paymentId = String(body.paymentId || "");
    const orderId = String(body.orderId || "");
    const signature = String(body.signature || "");

    if (!paymentId || !orderId || !signature) {
      return new Response(JSON.stringify({ error: "Missing payment details" }), { status: 400 });
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.RAZORPAY_KEY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const data = encoder.encode(`${orderId}|${paymentId}`);
    const digest = await crypto.subtle.sign("HMAC", key, data);
    const expected = toHex(digest);
    const verified = expected === signature;

    return new Response(
      JSON.stringify({ verified }),
      { status: verified ? 200 : 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Verification failed" }), { status: 500 });
  }
}
