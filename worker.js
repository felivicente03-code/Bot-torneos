const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";


export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Bot activo");

    try {
      const data = await request.json();

      if (data.message) {
        const chat_id = data.message.chat.id;
        const text = (data.message.text || "").toLowerCase();

        if (text === "/start") {
          // Enviar mensaje "Hola"
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text: "👋 Hola! Este es un mensaje de prueba."
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