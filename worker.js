const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const ADMIN_ID = 8581898801;

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Solo POST");

    const data = await request.json();

    // Variables unificadas
    let chat_id, user_id, text;
    if (data.message) {
      chat_id = data.message.chat.id;
      user_id = data.message.from.id;
      text = data.message.text;
    } else if (data.callback_query) {
      chat_id = data.callback_query.message.chat.id;
      user_id = data.callback_query.from.id;
    }

    // === PROCESAR CALLBACK QUERY ===
    if (data.callback_query) {
      const callback_data = data.callback_query.data;

      if (callback_data.startsWith("torneo_")) {
        // Responder callback
        await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: data.callback_query.id })
        });

        const torneo = await env.torneos_db.prepare(
          "SELECT nombre FROM torneos WHERE id = ?"
        ).bind(Number(callback_data.replace("torneo_", ""))).first();

        const nombreTorneo = torneo?.nombre || `ID ${callback_data.replace("torneo_", "")}`;

        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id,
            text: `🏆 Vas a jugar en el torneo "${nombreTorneo}" ✅\n🎮 ¿Cuál es tu ID en el juego?`
          })
        });

        // Guardar estado
        await env.estados_db.prepare(
          "INSERT INTO estados (id_telegram, estado, torneo) VALUES (?, ?, ?)"
        ).bind(user_id, "ESPERANDO_ID_JUEGO", nombreTorneo).run();

        return new Response("ok");
      }

      return new Response("ok");
    }

    // === PROCESAR MENSAJES ===
    if (!text) return new Response("ok");

    // Comandos de administrador
    if (text.startsWith("/") && user_id != ADMIN_ID) return new Response("No autorizado");

    // Crear torneo
    if (text.startsWith("/creartorneo")) {
      const nombre = text.replace("/creartorneo", "").trim();
      await env.torneos_db.prepare("INSERT INTO torneos (nombre) VALUES (?)").bind(nombre).run();
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text: `✅ Torneo creado:\n🏆 ${nombre}` })
      });
      return new Response("ok");
    }

    // Borrar torneo
    if (text.startsWith("/borrartorneo")) {
      const nombre = text.replace("/borrartorneo", "").trim();
      const torneoExistente = await env.torneos_db.prepare("SELECT nombre FROM torneos WHERE nombre = ?")
        .bind(nombre).first();
      let mensaje = torneoExistente ? `🗑️ Torneo eliminado: ${nombre}` : `⚠️ No se encontró un torneo con ese nombre: ${nombre}`;
      if (torneoExistente) await env.torneos_db.prepare("DELETE FROM torneos WHERE nombre = ?").bind(nombre).run();
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text: mensaje })
      });
      return new Response("ok");
    }

    // Mostrar torneos
    if (text.toLowerCase() === "torneo") {
      const torneos = await env.torneos_db.prepare("SELECT id, nombre FROM torneos").all();
      const botones = torneos.results.map(t => [{ text: t.nombre, callback_data: "torneo_" + t.id }]);
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text: "🏆 Hola!!!\n¿A cuál torneo quieres inscribirte? 🎮", reply_markup: { inline_keyboard: botones } })
      });
      return new Response("ok");
    }

    // === REGISTRO DE JUGADORES ===
    const estadoJugador = await env.estados_db.prepare(
      "SELECT * FROM estados WHERE id_telegram = ?"
    ).bind(user_id).first();

    if (estadoJugador) {
      const torneo = estadoJugador.torneo;
      switch (estadoJugador.estado) {
        case "ESPERANDO_ID_JUEGO":
          await env.jugadores_db.prepare(
            "INSERT INTO jugadores (id_telegram, torneo, id_juego) VALUES (?, ?, ?)"
          ).bind(user_id, torneo, text).run();
          await env.estados_db.prepare("UPDATE estados SET estado = ? WHERE id_telegram = ?")
            .bind("ESPERANDO_NICK", user_id).run();
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id, text: "✏️ Ahora, ¿cuál es tu nick en el juego?" })
          });
          break;
        case "ESPERANDO_NICK":
          await env.jugadores_db.prepare("UPDATE jugadores SET nick = ? WHERE id_telegram = ? AND torneo = ?")
            .bind(text, user_id, torneo).run();
          await env.estados_db.prepare("UPDATE estados SET estado = ? WHERE id_telegram = ?")
            .bind("ESPERANDO_APELLIDO", user_id).run();
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id, text: "✏️ Ahora, tu apellido:" })
          });
          break;
        case "ESPERANDO_APELLIDO":
          await env.jugadores_db.prepare("UPDATE jugadores SET apellido = ? WHERE id_telegram = ? AND torneo = ?")
            .bind(text, user_id, torneo).run();
          await env.estados_db.prepare("UPDATE estados SET estado = ? WHERE id_telegram = ?")
            .bind("ESPERANDO_NOMBRE", user_id).run();
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id, text: "✏️ Ahora, tu nombre:" })
          });
          break;
        case "ESPERANDO_NOMBRE":
          await env.jugadores_db.prepare("UPDATE jugadores SET nombre = ? WHERE id_telegram = ? AND torneo = ?")
            .bind(text, user_id, torneo).run();
          await env.estados_db.prepare("UPDATE estados SET estado = ? WHERE id_telegram = ?")
            .bind("ESPERANDO_PAIS", user_id).run();
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id, text: "🌎 Por último, tu país:" })
          });
          break;
        case "ESPERANDO_PAIS":
          await env.jugadores_db.prepare("UPDATE jugadores SET pais = ? WHERE id_telegram = ? AND torneo = ?")
            .bind(text, user_id, torneo).run();
          await env.estados_db.prepare("DELETE FROM estados WHERE id_telegram = ?").bind(user_id).run();
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id, text: "✅ Registro completo. ¡Buena suerte en el torneo!" })
          });
          break;
      }
    }

    return new Response("ok");
  }
};