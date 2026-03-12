const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MONTO_BASE = 20;               // Monto base

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Bot activo");

    try {
      const data = await request.json();

      // -------------------
      // Mensajes de Telegram
      // -------------------
      if (data.message) {
        const chat_id = data.message.chat.id;
        const user_id = data.message.from.id;
        const nombre = data.message.from.first_name || "Jugador";
        const text = data.message.text || "";

        if (text === "/start") {

          // Contar cuántos registros hay en PAGOS
          let numeroJugador = 0;
          try {
            const count = await env.d1.prepare(`SELECT COUNT(*) AS total FROM PAGOS`).first();
            numeroJugador = count.total || 0;
          } catch (e) {
            console.log("Error al contar jugadores, se usará 0:", e);
            numeroJugador = 0;
          }

          const centavos = numeroJugador % 100;
          const pesosExtra = Math.floor(numeroJugador / 100);
          const monto_unico = (MONTO_BASE + pesosExtra + centavos / 100).toFixed(2);

          // Guardar en D1
          try {
            await env.d1.prepare(`
              INSERT INTO PAGOS (telegram_id, monto, pagado)
              VALUES (?, ?, 0)
            `).bind(user_id, parseFloat(monto_unico)).run();
          } catch (e) {
            console.log("Error al insertar jugador:", e);
          }

          // Enviar mensaje Telegram
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id,
              text: `¡Hola ${nombre}! Tu monto único para pagar es: $${monto_unico}`
            })
          });

          return new Response("ok");
        }

        return new Response("ok");
      }

      return new Response("ok");
    } catch (err) {
      console.log("Error general:", err);
      return new Response("Error: " + err.message);
    }
  }
};