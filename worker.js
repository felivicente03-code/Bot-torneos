const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";


export default {
  async fetch(request) {
    if (request.method !== "POST") return new Response("Bot activo");

    try {
      const data = await request.json();

      if (data.message) {
        const chat_id = data.message.chat.id;

        // Respuesta rápida
        fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chat_id,
            text: "👋 Hola, funcionó el bot!"
          })
        }).catch(err => console.log("Error enviando mensaje:", err));

        // Telegram recibe respuesta inmediatamente
        return new Response("ok");
      }

      return new Response("ok");
    } catch (err) {
      return new Response("Error: " + err.message);
    }
  }
};