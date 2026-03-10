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

  const torneos = await env.DB.prepare(
    "SELECT id, nombre FROM torneos"
  ).all();

  let mensaje = "🏆 Torneos disponibles:\n\n";

  torneos.results.forEach(t => {
    mensaje += `${t.id} - ${t.nombre}\n`;
  });

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat_id,
      text: mensaje
    })
  });

}

    }

    return new Response("ok");
  }
};