export default {
  async fetch(request, env) {

    if (request.method === "POST") {

      const data = await request.json();

      if (data.message) {

        const chat_id = data.message.chat.id;
        const text = data.message.text;

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