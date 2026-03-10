const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";

export default {
  async fetch(request) {
    if (request.method !== "POST") return new Response("Solo POST");

    const data = await request.json();

    // Obtenemos chat_id y texto
    let chat_id, text;
    if (data.message) {
      chat_id = data.message.chat.id;
      text = data.message.text;
    } else {
      return new Response("ok"); // Ignorar callbacks
    }

    // Si el mensaje es /start
    if (text === "/start") {
      // Enviar mensaje a Telegram
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text: "Hola mundo"
        })
      });
    }

    return new Response("ok");
  }
};