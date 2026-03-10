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
        // 1️⃣ Crear preferencia de pago en Mercado Pago
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
                unit_price: 500  // Cambiá el valor según tu inscripción
              }
            ],
            payment_methods: {
              excluded_payment_types: [{ id: "credit_card" }], // Excluir tarjeta
              excluded_payment_methods: []
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
          return new Response("Error al generar el QR de Mercado Pago", { status: 500 });
        }

        // 2️⃣ Generar URL del QR usando Google Charts
        const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(mpData.init_point)}`;

        // 3️⃣ Enviar el QR a Telegram
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chat_id,
            photo: qrUrl,
            caption: "📲 Escaneá este QR con tu app de banco para pagar tu inscripción al torneo."
          })
        });

        return new Response("ok");
      }
    }

    return new Response("ok");
  }
};