const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";

export default {
  async fetch(request) {
    if (request.method !== "POST") return new Response("Bot activo");

    try {
      const data = await request.json();

      if (data.message) {
        const chat_id = data.message.chat.id;

        // Mensaje inicial
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id,
            text: "👋 Hola! Generando tu QR para pagar..."
          })
        });

        // Crear preferencia para QR / transfer
        const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            items: [
              { title: "Inscripción Torneo", quantity: 1, unit_price: 1000 }
            ],
            payment_methods: {
              excluded_payment_types: [{ id: "credit_card" }],
              excluded_payment_methods: []
            }
          })
        });

        const preference = await resp.json();

        // Aquí es donde necesitamos el QR
        // Actualmente Mercado Pago no devuelve QR directamente desde init_point
        // Pero podemos usar el link del init_point que genera QR en la app
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id,
            text: `💰 Escaneá este link en tu app o navegador para ver el QR y pagar:\n\n${preference.init_point}`
          })
        });

        return new Response("ok");
      }

      return new Response("ok");
    } catch (err) {
      return new Response("Error: " + err.message);
    }
  }
};