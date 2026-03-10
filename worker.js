const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Bot activo");

    const data = await request.json();

    if (data.message) {
      const chat_id = data.message.chat.id;
      const text = (data.message.text || "").toLowerCase();

      if (text === "/start") {
        // 1️⃣ Crear preferencia en Mercado Pago (sin tarjeta)
        const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            items: [
              {
                title: "Inscripción Torneo",
                quantity: 1,
                currency_id: "ARS",
                unit_price: 500
              }
            ],
            payment_methods: {
              excluded_payment_types: [{ id: "credit_card" }] // excluir tarjeta
            },
            back_urls: {
              success: "https://tuservidor.com/success",
              failure: "https://tuservidor.com/failure",
              pending: "https://tuservidor.com/pending"
            },
            auto_return: "approved"
          })
        });

        const mpData = await mpResponse.json();

        if (!mpData.init_point) {
          return new Response("Error al generar el link de Mercado Pago", { status: 500 });
        }

        // 2️⃣ Generar link al QR usando Google Charts
        const qrLink = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(mpData.init_point)}`;

        // 3️⃣ Enviar mensaje con el link al QR
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chat_id,
            text: `📲 Hacé click aquí para ver tu QR de pago: ${qrLink}\n\nEscanealo con tu app de banco y pagá tu inscripción.`
          })
        });

        return new Response("ok");
      }
    }

    return new Response("ok");
  }
};