const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const ADMIN_ID = 8581898801;





export default {
  async fetch(request, env) {

    if (request.method === "POST") {

      const data = await request.json();

      if (data.message) {

        const chat_id = data.message.chat.id;
        const text = data.message.text;
        const user_id = data.message.from.id;
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
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chat_id,
      text: "🏆 Hola!!!\n¿A cuál torneo quieres inscribirte? 🎮",
      reply_markup: {
        inline_keyboard: botones
      }
    })
  });

}

if (text && text.startsWith("/") && user_id != ADMIN_ID) {
  return new Response("No autorizado");
}

        if (text === "/torneo") {

          await env.torneos_db.prepare(
            "INSERT INTO torneos (nombre, fecha, jugadores) VALUES (?, ?, ?)"
          )
          .bind("Torneo automático", new Date().toISOString(), 0)
          .run();

        }

      }

      return new Response("ok");
    }

    return new Response("Worker activo");
  }
};