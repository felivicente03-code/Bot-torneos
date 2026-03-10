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

    }
if (data.callback_query) {

  const chat_id = data.callback_query.message.chat.id;
  const user_id = data.callback_query.from.id;
  const callback_data = data.callback_query.data;

  if (callback_data.startsWith("torneo_")) {

    const torneo_id = callback_data.replace("torneo_", "");

    const torneo = await env.torneos_db.prepare(
      "SELECT nombre FROM torneos WHERE id = ?"
    ).bind(torneo_id).first();

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat_id,
        text: `🏆 Vas a jugar en el torneo "${torneo.nombre}"\n\n🎮 ¿Cuál es tu ID en el juego?`
      })
    });

    await env.torneos_db.prepare(
      "INSERT OR REPLACE INTO estados (telegram_id, paso, torneo_id) VALUES (?, ?, ?)"
    ).bind(user_id, 1, torneo_id).run();

  }

}
    return new Response("ok");

  }
};