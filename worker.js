const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";


export default {
  async fetch(request) {
    if (request.method !== "POST") return new Response("Bot activo");

    try {
      const data = await request.json();

      // Mensajes de Telegram
      if (data.message) {
        const chat_id = data.message.chat.id;
        const text = data.message.text || "";

        // Detectamos /start
        if (text === "/start") {
          // 1️⃣ Enviar mensaje de hola
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text: "👋 Hola! Generando tu QR de pago..."
            })
          });

          // 2️⃣ Crear preferencia en Mercado Pago (QR)
          const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
              items: [
                {
                  title: "Inscripción Torneo",
                  quantity: 1,
                  currency_id: "ARS",
                  unit_price: 1000
                }
              ],
              payment_methods: {
                excluded_payment_types: [
                  { id: "credit_card" }  // Evitamos tarjeta
                ],
                installments: 1
              },
              back_urls: {
                success: "https://tusitio.com/success",
                failure: "https://tusitio.com/failure",
                pending: "https://tusitio.com/pending"
              },
              auto_return: "approved"
            })
          });

          const mpData = await mpResponse.json();

          // 3️⃣ Obtener QR (el link del QR se genera en init_point)
          const qr_url = mpData.init_point;

          // 4️⃣ Enviar QR como link o imagen
          // Telegram no puede mostrar init_point como imagen directamente,
          // pero podemos enviarlo como mensaje con link
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text: `Escanea tu QR o toca el link para pagar:\n${qr_url}`
            })
          });

          return new Response("ok");
        }
      }

      return new Response("ok");
    } catch (err) {
      return new Response("Error: " + err.message);
    }
  }
};