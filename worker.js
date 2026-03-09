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
// CREAR TORNEO
if (text && text.startsWith("/creartorneo")) {
  const nombre = text.replace("/creartorneo", "").trim();

  // Insertar torneo
  await env.torneos_db.prepare(
    "INSERT INTO torneos (nombre) VALUES (?)"
  )
  .bind(nombre)
  .run();

  // Enviar mensaje al admin solo con el nombre
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      chat_id: chat_id,
      text: `✅ Torneo creado:\n🏆 ${nombre}`
    })
  });
}

// BORRAR TORNEO POR NOMBRE
if (text && text.startsWith("/borrartorneo")) {
  const nombre = text.replace("/borrartorneo", "").trim();

  // Borrar torneo usando el nombre
  await env.torneos_db.prepare(
    "DELETE FROM torneos WHERE nombre = ?"
  )
  .bind(nombre)
  .run();

  // Mandar mensaje de confirmación
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      chat_id: chat_id,
      text: `🗑️ Torneo eliminado: ${nombre}`
    })
  });
}
      }

      return new Response("ok");
    }

    return new Response("Worker activo");
  }
};
