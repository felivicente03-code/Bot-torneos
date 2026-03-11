const TELEGRAM_TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";

const ADMIN_CHAT_ID = "8581898801";

const CBU = "0000003100079795148802";
const ALIAS = "felipeelgoat.mp";


export default {
  async fetch(request) {

    const url = new URL(request.url);

    // TELEGRAM WEBHOOK
    if (request.method === "POST") {

      const data = await request.json();

      if (data.message) {

        const chat_id = data.message.chat.id;
        const text = data.message.text || "";

        if (text === "/start") {

          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text:
`💳 Transferí para inscribirte:

CBU:
${CBU}

Alias:
${ALIAS}

Cuando el pago llegue se detectará automáticamente.`
            })
          });

        }

      }

      return new Response("ok");
    }

    // CONSULTAR PAGOS
    if (url.pathname === "/check") {

  const res = await fetch(
    "https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc",
    {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`
      }
    }
  );

  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    return new Response("no hay pagos");
  }

  // SOLO EL ULTIMO PAGO
  const pago = data.results[0];

  const texto = JSON.stringify(pago, null, 2);

  const partes = texto.match(/[\s\S]{1,3500}/g);

  for (const parte of partes) {

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: parte
      })
    });

  }

  return new Response("ultimo pago enviado");
}

    return new Response("bot activo");
  }
};