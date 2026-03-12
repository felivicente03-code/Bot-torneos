const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";

export default {
  async fetch(request) {
    if (request.method !== "POST") return new Response("Bot activo");

    try {
      const data = await request.json();

      if (data.message) {
        const chat_id = data.message.chat.id;
        const text = data.message.text || "";

        // Siempre responder al /start
        if (text === "/start") {
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id,
              text: `¡Hola! Recibí tu /start correctamente.`
            })
          });
        }

        // Responder a cualquier otro mensaje opcional
        else {
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id,
              text: `Recibí tu mensaje: "${text}"`
            })
          });
        }

        return new Response("ok");
      }

      return new Response("ok");
    } catch (err) {
      console.log("Error general:", err);
      return new Response("Error: " + err.message);
    }
  }
};