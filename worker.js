const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";

export default {
  async fetch(request, env) {

    if (request.method !== "POST") {
      return new Response("Bot activo");
    }

    const data = await request.json();

    if (data.message) {

      const chat_id = data.message.chat.id;
      const text = data.message.text;

      if (text && text.toLowerCase() === "torneo") {

  const torneos = await env.torneos_db.prepare(
    "SELECT id, nombre FROM torneos"
  ).all();

  const botones = torneos.results.map(t => [{
    text: t.nombre,
    callback_data: "torneo_" + t.id
  }]);

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat_id,
      text: "🏆 ¿A qué torneo quieres inscribirte?",
      reply_markup: {
        inline_keyboard: botones
      }
    })
  });

}

    return new Response("ok");
  }
};