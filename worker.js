const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";


export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Bot activo");

    try {
      const data = await request.json();

      // 🔹 Mensajes de texto
      if (data.message) {
        const chat_id = data.message.chat.id;
        const text = data.message.text || "";
        const user_id = data.message.from.id;

        // 🔹 Comando /start
        if (text.toLowerCase() === "/start") {
          // Mensaje inicial
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text: "👋 ¡Hola! Para inscribirte al torneo, realiza tu pago por transferencia bancaria."
            })
          });

          // Crear preferencia en Mercado Pago
          const preferenceData = {
            items: [
              {
                title: "Inscripción Torneo",
                quantity: 1,
                unit_price: 1000 // Cambiar monto según tu torneo
              }
            ],
            payer: {
              email: "user@example.com" // Opcional: puedes usar un email ficticio
            },
            payment_methods: {
              excluded_payment_types: [{ id: "credit_card" }], // Excluye tarjeta
              installments: 1
            },
            external_reference: `user_${user_id}_torneo_1` // Identificador único
          };

          const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(preferenceData)
          });

          const mpData = await mpResponse.json();

          // Enviar link del checkout al usuario
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text: `💳 Haz tu pago mediante transferencia bancaria usando este link:\n${mpData.init_point}`
            })
          });

          return new Response("ok");
        }
      }

      return new Response("ok");
    } catch (err) {
      console.log("Error:", err);
      return new Response("Error: " + err.message);
    }
  }
};