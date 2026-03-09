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

  // Verificar si existe
  const torneoExistente = await env.torneos_db.prepare(
    "SELECT nombre FROM torneos WHERE nombre = ?"
  )
  .bind(nombre)
  .first();

  let mensaje;

  if (torneoExistente) {
    // Si existe, borrar
    await env.torneos_db.prepare(
      "DELETE FROM torneos WHERE nombre = ?"
    )
    .bind(nombre)
    .run();

    mensaje = `🗑️ Torneo eliminado: ${nombre}`;
  } else {
    // No existe
    mensaje = `⚠️ No se encontró un torneo con ese nombre: ${nombre}`;
  }

  // Enviar mensaje de confirmación o error al admin
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      chat_id: chat_id,
      text: mensaje
    })
  });
}

      }
if (data.callback_query) {
  const chat_id = data.callback_query.message.chat.id;
  const user_id = data.callback_query.from.id;
  const callback_data = data.callback_query.data;

  if (callback_data.startsWith("torneo_")) {
    const torneoId = Number(callback_data.replace("torneo_", ""));

    // ⚡ RESPONDER CALLBACK INMEDIATAMENTE
    await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        callback_query_id: data.callback_query.id,
        text: "✅ Inscripción iniciada", // opcional
        show_alert: false
      })
    });

    // Traer nombre del torneo
    const torneo = await env.torneos_db.prepare(
      "SELECT nombre FROM torneos WHERE id = ?"
    ).bind(torneoId).first();
    const nombreTorneo = torneo?.nombre || torneoId;

    // Mensaje de confirmación
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: chat_id,
        text: `🏆 Vas a jugar en el torneo "${nombreTorneo}" ✅`
      })
    });

    // Pedir ID del juego
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: chat_id,
        text: `🎮 ¿Cuál es tu ID en el juego?`
      })
    });

    // Guardar estado
    await env.estados_db.prepare(
      "INSERT INTO estados (id_telegram, estado, torneo) VALUES (?, ?, ?)"
    ).bind(user_id, "ESPERANDO_ID_JUEGO", nombreTorneo).run();
  }
}
      return new Response("ok");
    }

    return new Response("Worker activo");
  }
};
