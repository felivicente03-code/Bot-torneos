const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";

export default {
  async fetch(request) {
    if (request.method !== "POST") return new Response("Bot activo");

    try {
      const data = await request.json();

      // Si es mensaje de Telegram
      if (data.message) {
        const chat_id = data.message.chat.id;
        const text = data.message.text || "";

        // Enviar respuesta simple
        const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id,
            text: `¡Hola! Recibí tu mensaje: "${text}"`
          })
        });

        const json = await res.json();
        if (!json.ok) console.log("Error Telegram:", json);

        return new Response("ok");
      }

      return new Response("ok");
    } catch (err) {
      console.log("Error:", err);
      return new Response("Error: " + err.message);
    }
  }
};