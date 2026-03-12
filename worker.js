const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MONTO_BASE = 20; // monto base


export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Bot activo");

    try {
      const data = await request.json();

      if (data.message) {
        const chat_id = data.message.chat.id;
        const user_id = data.message.from.id;
        const nombre = data.message.from.first_name || "Jugador";

        if (data.message.text === "/start") {
          // Contar cuántos registros hay en D1
          const count = await env.d1.prepare(`SELECT COUNT(*) AS total FROM jugadores_prueba`).first();
          const numeroJugador = count.total || 0;

          const centavos = numeroJugador % 100;
          const pesosExtra = Math.floor(numeroJugador / 100);
          const monto_unico = (MONTO_BASE + pesosExtra + centavos / 100).toFixed(2);

          // Guardar en D1
          await env.d1.prepare(`
            INSERT INTO jugadores_prueba (telegram_id, monto, pagado)
            VALUES (?, ?, 0)
          `).bind(user_id, parseFloat(monto_unico)).run();

          // Enviar mensaje usando await
          const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id,
              text: `Hola ${nombre}! Tu monto único de prueba es: $${monto_unico}`
            })
          });

          // Revisar si Telegram respondió OK
          const json = await res.json();
          if (!json.ok) {
            console.log("Error Telegram:", json);
          }

          return new Response("ok");
        }

        return new Response("ok");
      }

      return new Response("ok");
    } catch (err) {
      console.log("Error:", err);
      return new Response("Error: " + err.message);
    }
  }
};