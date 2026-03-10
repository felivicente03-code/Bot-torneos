const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Bot activo");

    const data = await request.json();

    if (data.message) {
      const chat_id = data.message.chat.id;
      const user_id = data.message.from.id;
      const text = data.message.text || "";

      if (text === "/start") {
        // Crear checkout Mercado Pago solo con pago tipo boleto / transferencia
        const mp_res = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            items: [
              {
                title: "Inscripción Torneo",
                quantity: 1,
                unit_price: 500
              }
            ],
            payer: { email: "usuario@example.com" }, // opcional
            payment_methods: {
              excluded_payment_types: [
                { id: "credit_card" },
                { id: "atm" } // opcional, deja solo transferencias/boletos
              ]
            },
            back_urls: {
              success: "https://tu-dominio.com/success",
              pending: "https://tu-dominio.com/pending"
            },
            auto_return: "approved",
            external_reference: user_id.toString()
          })
        });

        const preference = await mp_res.json();

        // Enviar link de pago al usuario
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id,
            text: `💰 Hola! Para pagar tu inscripción, abre este link:\n${preference.init_point}\n\nAhí podés pagar por transferencia o generar el QR.`
          })
        });

        return new Response("ok");
      }
    }

    return new Response("Bot activo");
  }
};