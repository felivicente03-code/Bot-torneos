const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765"; // Mercado Pago
const MONTO_BASE = 20; // monto base en pesos

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

          // ---- Crear tabla PAGOS si no existe ----
          await env.d1.prepare(`
            CREATE TABLE IF NOT EXISTS PAGOS (
              telegram_id INTEGER,
              monto REAL,
              pagado BOOLEAN DEFAULT 0
            )
          `).run();

          // ---- Contar jugadores para asignar monto único ----
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

          // ---- Guardar jugador ----
          try {
            await env.d1.prepare(`
              INSERT INTO PAGOS (telegram_id, monto, pagado)
              VALUES (?, ?, 0)
            `).bind(user_id, parseFloat(monto_unico)).run();
          } catch (e) {
            console.log("Error al insertar jugador:", e);
          }

          // ---- Enviar mensaje Telegram ----
          try {
            const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id,
                text: `Hola ${nombre}! Tu monto único es: $${monto_unico}`
              })
            });
            const json = await res.json();
            if (!json.ok) console.log("Error Telegram:", json);
          } catch (e) {
            console.log("Error al enviar mensaje Telegram:", e);
          }

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