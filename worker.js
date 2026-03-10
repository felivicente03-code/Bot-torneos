const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";


export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Bot activo");
    }

    const data = await request.json();

    // 🔹 Si el usuario envía /start
    if (data.message && data.message.text === "/start") {
      const chat_id = data.message.chat.id;

      // 1️⃣ Crear preferencia en Mercado Pago (pago QR)
      const preference = {
        items: [
          {
            title: "Inscripción Torneo",
            quantity: 1,
            unit_price: 1000 // precio en la moneda local
          }
        ],
        payment_methods: {
          excluded_payment_types: [{ id: "credit_card" }], // excluye tarjetas
          excluded_payment_methods: [], // permite todo lo demás (bancos, QR, efectivo)
          installments: 1
        },
        back_urls: {
          success: "https://tusitio.com/success",
          failure: "https://tusitio.com/failure",
          pending: "https://tusitio.com/pending"
        },
        auto_return: "approved"
      };

      // Crear preferencia
      const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(preference)
      });

      const mpData = await mpRes.json();

      // mpData.init_point → link de pago Mercado Pago
      // mpData.sandbox_init_point → link de prueba

      // 2️⃣ Enviar mensaje al usuario con el link de pago
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat_id,
          text: `💰 Hola! Para inscribirte en el torneo, paga con este link:\n\n${mpData.init_point}`
        })
      });

      return new Response("ok");
    }

    return new Response("ok");
  }
};