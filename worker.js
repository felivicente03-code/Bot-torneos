import fetch from "node-fetch";

const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";


export default {
  async fetch(request, env) {
    const data = await request.json();

    if (data.message && data.message.text === "/start") {
      const chat_id = data.message.chat.id;

      // 1️⃣ Crear preferencia de pago en Mercado Pago
      const preference = {
        items: [
          {
            title: "Inscripción Torneo",
            quantity: 1,
            unit_price: 100, // monto a cobrar
            currency_id: "ARS"
          }
        ],
        payment_methods: {
          excluded_payment_types: [{ id: "credit_card" }],
          excluded_payment_methods: []
        },
        back_urls: {
          success: "https://tuweb.com/pago-exitoso",
          pending: "https://tuweb.com/pago-pendiente",
          failure: "https://tuweb.com/pago-fallido"
        },
        auto_return: "approved"
      };

      const mpResponse = await fetch(
        "https://api.mercadopago.com/checkout/preferences",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`
          },
          body: JSON.stringify(preference)
        }
      );

      const mpData = await mpResponse.json();

      // 2️⃣ Obtener QR
      // Mercado Pago genera el QR en la URL del init_point o QR code con QR API
      const qrUrl = mpData.sandbox_init_point || mpData.init_point;

      // 3️⃣ Enviar mensaje al usuario con link y QR
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text: `📲 Escanea este QR o entra al link para pagar la inscripción:\n${qrUrl}`
        })
      });

      return new Response("ok");
    }

    return new Response("ok");
  }
};