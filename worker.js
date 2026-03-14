const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";



export default {
  async fetch(request, env) {

    if (request.method !== "POST") {
      return new Response("Bot activo");
    }

    const data = await request.json();
// 🔹 Webhook de Mercado Pago
if (data.type === "payment") {

  const payment_id = data.data.id;

  // Consultar pago en Mercado Pago
  const pago = await fetch(
    `https://api.mercadopago.com/v1/payments/${payment_id}`,
    {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`
      }
    }
  );

  const pagoData = await pago.json();

  if (pagoData.status === "approved") {

    const telegram_id = pagoData.metadata.telegram_id;
    const torneo_id = pagoData.metadata.torneo_id;

    // Actualizar estado en la base
    await env.torneos_db.prepare(
      `UPDATE inscripciones
       SET estado = 'pagado'
       WHERE telegram_id = ?
       AND torneo_id = ?
       AND estado = 'esperando_pago'`
    ).bind(telegram_id, torneo_id).run();

    // 🔹 Obtener nombre del torneo
    const torneo = await env.torneos_db.prepare(
      "SELECT nombre FROM torneos WHERE id = ?"
    ).bind(torneo_id).first();

    // 🔹 Enviar mensaje al jugador en Telegram
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegram_id,
        text: `✅ Pago confirmado

🏆 Ya estás inscrito en el torneo "${torneo.nombre}"

📅 Pronto recibirás información del inicio del torneo.`
      })
    });

  }

  return new Response("ok");
}

    // 🔹 Mensajes de texto
    if (data.message) {

      const chat_id = data.message.chat.id;
      const text = data.message.text || "";
      const user_id = data.message.from.id;

      if (text.toLowerCase() === "torneo") {

        await env.torneos_db.prepare(
          "DELETE FROM estados WHERE telegram_id = ?"
        ).bind(user_id).run();

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
            reply_markup: { inline_keyboard: botones }
          })
        });

        return new Response("ok");
      }

      const estado = await env.torneos_db.prepare(
        "SELECT * FROM estados WHERE telegram_id = ?"
      ).bind(user_id).first();

      // 🔹 Flujo de pasos
      if (estado) {

        if (estado.paso === 1) {

          // Verificar si ya está en jugadores
          const jugador_existente = await env.torneos_db.prepare(
            "SELECT * FROM jugadores WHERE id_juego = ?"
          ).bind(text).first();

          if (jugador_existente) {
          // Obtener precio del torneo
          const torneo = await env.torneos_db.prepare(
          "SELECT precio FROM torneos WHERE id = ?"
         ).bind(estado.torneo_id).first();

        // Crear inscripción
        await env.torneos_db.prepare(
       `INSERT INTO inscripciones (telegram_id, torneo_id, id_juego, nick, monto, metodo, estado)
VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
        user_id,
estado.torneo_id,
text,
jugador_existente.nick,
torneo.precio,
       "link",
       "esperando_pago"
       ).run();
// 🔹 Crear link de pago en Mercado Pago
const pago = await fetch("https://api.mercadopago.com/checkout/preferences", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
  },
  body: JSON.stringify({
  items: [
    {
      title: "Inscripción Torneo",
      quantity: 1,
      unit_price: torneo.precio
    }
  ],
  metadata: {
    telegram_id: user_id,
    torneo_id: estado.torneo_id
  },
  notification_url: "https://bot-torneos.felivicente03.workers.dev"
})
});

const pagoData = await pago.json();
const link_pago = pagoData.init_point;
await env.torneos_db.prepare(
"DELETE FROM estados WHERE telegram_id = ?"
).bind(user_id).run();

            // Si ya existe, enviar mensaje especial
            await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chat_id,
                text: `Perfecto ${jugador_existente.nick}!!!

💳 Paga tu inscripción aquí:

${link_pago}`
              })
            });

            return new Response("ok");
          }

          // Si no existe, continuar con el flujo normal
          await env.torneos_db.prepare(
            "UPDATE estados SET id_juego = ?, paso = 2 WHERE telegram_id = ?"
          ).bind(text, user_id).run();

          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text: "✏️ Ahora escribe tu NICK en el juego"
            })
          });

          return new Response("ok");
        }

        if (estado.paso === 2) {

          await env.torneos_db.prepare(
            "UPDATE estados SET nick = ?, paso = 3 WHERE telegram_id = ?"
          ).bind(text, user_id).run();

          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text: "✏️ Ahora escribe tu APELLIDO"
            })
          });

          return new Response("ok");
        }

        if (estado.paso === 3) {

          await env.torneos_db.prepare(
            "UPDATE estados SET apellido = ?, paso = 4 WHERE telegram_id = ?"
          ).bind(text, user_id).run();

          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text: "✏️ Ahora escribe tu NOMBRE"
            })
          });

          return new Response("ok");
        }

        if (estado.paso === 4) {

          await env.torneos_db.prepare(
            "UPDATE estados SET nombre = ?, paso = 5 WHERE telegram_id = ?"
          ).bind(text, user_id).run();

          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text: "🌎 Selecciona tu país",
              reply_markup: {
                keyboard: [[{ text: "🇦🇷 Argentina" }]],
                resize_keyboard: true,
                one_time_keyboard: true
              }
            })
          });

          return new Response("ok");
        }

        if (estado.paso === 5 && text.includes("Argentina")) {

          // Actualizo el estado
          await env.torneos_db.prepare(
            "UPDATE estados SET pais = ?, paso = 6 WHERE telegram_id = ?"
          ).bind("Argentina", user_id).run();

          // Traigo los datos actualizados
          const datos = await env.torneos_db.prepare(
            "SELECT * FROM estados WHERE telegram_id = ?"
          ).bind(user_id).first();

          // Inserto en jugadores (evito errores con OR REPLACE)
          await env.torneos_db.prepare(
"INSERT OR REPLACE INTO jugadores (id_juego, nick, apellido, nombre, pais) VALUES (?, ?, ?, ?, ?)"
).bind(
datos.id_juego,
datos.nick,
datos.apellido,
datos.nombre,
"Argentina"
).run();
// Obtener torneo
const torneo = await env.torneos_db.prepare(
"SELECT precio FROM torneos WHERE id = ?"
).bind(datos.torneo_id).first();

// Crear inscripción
await env.torneos_db.prepare(
`INSERT INTO inscripciones (telegram_id, torneo_id, id_juego, nick, monto, metodo, estado)
VALUES (?, ?, ?, ?, ?, ?, ?)`
).bind(
user_id,
datos.torneo_id,
datos.id_juego,
datos.nick,
torneo.precio,
"link",
"esperando_pago"
).run();

// Crear link de pago en Mercado Pago
const pago = await fetch("https://api.mercadopago.com/checkout/preferences", {
method: "POST",
headers: {
"Content-Type": "application/json",
"Authorization": `Bearer ${MP_ACCESS_TOKEN}`
},
body: JSON.stringify({
items: [
{
title: "Inscripción Torneo",
quantity: 1,
unit_price: torneo.precio
}
],
metadata: {
telegram_id: user_id,
torneo_id: datos.torneo_id
},
notification_url: "https://bot-torneos.felivicente03.workers.dev"
})
});

const pagoData = await pago.json();
const link_pago = pagoData.init_point;
await env.torneos_db.prepare(
"DELETE FROM estados WHERE telegram_id = ?"
).bind(user_id).run();

          // Envío mensaje de registro completado
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text: `✅ Registro completado

💳 Para confirmar tu lugar paga aquí:

${link_pago}

Cuando el pago se confirme quedarás inscrito.`,
              reply_markup: { remove_keyboard: true }
            })
          });

          return new Response("ok");
        }
      }

    } // <-- aquí se cierra if(data.message)

    // 🔹 Callback queries (botones inline)
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
