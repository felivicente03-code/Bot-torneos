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
      const user_id = data.message.from.id;

const estado = await env.torneos_db.prepare(
  "SELECT * FROM estados WHERE telegram_id = ?"
).bind(user_id).first();
     //ID JUEGO
   if (estado && estado.paso === 1) {

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
    //NICK
    if (estado && estado.paso === 2) {

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
      //APELLIDO
      if (estado && estado.paso === 3) {

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
       // NOMBRE
if (estado && estado.paso === 4) {

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
  keyboard: [
    [{ text: "🇦🇷 Argentina" }]
  ],
  resize_keyboard: true,
  one_time_keyboard: true
}
    })
  });

     // PAIS
if (estado && estado.paso === 5 && text === "🇦🇷 Argentina") {

  await env.torneos_db.prepare(
    "UPDATE estados SET pais = ?, paso = 6 WHERE telegram_id = ?"
  ).bind("Argentina", user_id).run();

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat_id,
      text: "✅ País registrado"
    })
  });

  return new Response("ok");

}

  return new Response("ok");

}
        

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
   
    return new Response("ok");

  }
};