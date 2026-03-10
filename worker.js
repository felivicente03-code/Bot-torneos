const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";


export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Bot activo");

    const data = await request.json();

    // 🔹 Comando /start
    if (data.message) {
      const chat_id = data.message.chat.id;
      const text = data.message.text || "";

      if (text === "/start") {
        // Crear preferencia Mercado Pago
        const preference = {
          items: [
            {
              title: "Inscripción Torneo",
              quantity: 1,
              unit_price: 500, // monto a pagar
              currency_id: "ARS"
            }
          ],
          payment_methods: {
            excluded_payment_types: [
              { id: "credit_card" }, // excluye tarjeta
              { id: "ticket" }       // excluye QR/boletos
            ]
          },
          back_urls: {
            success: "https://tu-dominio.com/success",
            failure: "https://tu-dominio.com/failure",
            pending: "https://tu-dominio.com/pending"
          },
          auto_return: "approved"
        };

        // Crear preferencia en Mercado Pago
        const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(preference)
        });

        const mpData = await mpResponse.json();

        // Enviar link de pago al usuario
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chat_id,
            text: `💰 Para inscribirte en el torneo, haz clic aquí y paga desde tu banco:\n\n${mpData.init_point}`
          })
        });

        return new Response("ok");
      }
    }

    return new Response("ok");
  }
};