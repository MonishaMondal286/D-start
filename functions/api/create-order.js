export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const amount = Number(body.amount || 0);
    if (!amount || amount < 1) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400 });
    }

    const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const orderPayload = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `kdsac_${Date.now()}`,
      payment_capture: 1,
      notes: {
        category: body.category || "",
        name: body.name || "",
      },
    };

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error || data }), { status: 400 });
    }

    return new Response(
      JSON.stringify({
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
        keyId: env.RAZORPAY_KEY_ID,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Order creation failed" }), { status: 500 });
  }
}
