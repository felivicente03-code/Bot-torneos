const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Solo POST");

    const data = await request.json();

    if (data.message) {
      const chat_id = data.message.chat.id;
      const text = data.message.text;

      if (text === "/start") {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text: "Hola Mundo" })
        });
      }
    }

    return new Response("ok");
  }
};