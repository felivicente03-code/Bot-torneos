const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";


export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Bot activo");

    const data = await request.json();

    // Solo mensajes de texto
    if (data.message) {
      const chat_id = data.message.chat.id;
      const text = data.message.text || "";

      if (text === "/start") {
        // 1️⃣ Crear preferencia en Mercado Pago
        const preferenceBody = {
          items: [
            {
              title: "Inscripción Torneo",
              quantity: 1,
              unit_price: 100 // Precio
            }
          ],
          payment_methods: {
            excluded_payment_types: [
              { id: "credit_card" } // Excluir tarjeta
            ],
            default_payment_type_id: "ticket" // Mercado Pago Ticket / QR
          },
          back_urls: {
            success: "https://tusitio.com/success",
            failure: "https://tusitio.com/failure",
            pending: "https://tusitio.com/pending"
          },
          auto_return: "approved"
        };

        const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(preferenceBody)
        });

        const mpData = await mpResponse.json();
        const initPoint = mpData.init_point; // Link de pago

        // 2️⃣ Generar QR con Google Chart API
        const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(initPoint)}`;

        // 3️⃣ Enviar QR + link a Telegram
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chat_id,
            photo: qrUrl,
            caption: `💰 Escanea este QR o haz clic en el link para pagar la inscripción:\n${initPoint}`
          })
        });

        return new Response("ok");
      }
    }

    return new Response("ok");
  }
};