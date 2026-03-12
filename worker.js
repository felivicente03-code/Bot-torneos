const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";
const MONTO_BASE = 20;

export default {
  async fetch(request, env) {

    if (request.method !== "POST") return new Response("Bot activo");

    try {

      const data = await request.json();

      // -------------------
      // MENSAJES TELEGRAM
      // -------------------
      if (data.message) {

        const chat_id = data.message.chat.id;
        const text = data.message.text || "";
        const user_id = data.message.from.id;
        const nombre = data.message.from.first_name || "Jugador";

        if (text === "/start") {

          let numeroJugador = 0;

          try {

            const count = await env.torneos_db
              .prepare(`SELECT COUNT(*) AS total FROM PAGOS`)
              .first();

            numeroJugador = count.total || 0;

          } catch (e) {
            console.log("Error contando jugadores:", e);
          }

          const centavos = numeroJugador % 100;
          const pesosExtra = Math.floor(numeroJugador / 100);

          const monto_unico =
            (MONTO_BASE + pesosExtra + centavos / 100).toFixed(2);

          try {

            await env.torneos_db.prepare(`
              INSERT INTO PAGOS (telegram_id, monto, pagado)
              VALUES (?, ?, 0)
            `).bind(user_id, parseFloat(monto_unico)).run();

          } catch (e) {
            console.log("Error insertando jugador:", e);
          }

          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {

            method: "POST",
            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({
              chat_id,
              text: `Hola ${nombre}\nTu monto único es: $${monto_unico}`
            })

          });

          return new Response("ok");
        }

        return new Response("ok");
      }

      // -------------------
      // WEBHOOK MERCADO PAGO
      // -------------------
      if (data.type === "payment") {

        const payment_id = data.data.id;

        // Pedimos info real del pago
        const mp = await fetch(
          `https://api.mercadopago.com/v1/payments/${payment_id}`,
          {
            headers: {
              Authorization: `Bearer ${MP_ACCESS_TOKEN}`
            }
          }
        );

        const payment = await mp.json();

        let montoRecibido = payment.transaction_amount;

        // soporta coma o punto
        if (typeof montoRecibido === "string") {
          montoRecibido = montoRecibido.replace(",", ".");
        }

        montoRecibido = parseFloat(montoRecibido);

        // Buscar en tabla
        const jugador = await env.torneos_db.prepare(`
          SELECT telegram_id, monto
          FROM PAGOS
          WHERE monto = ? AND pagado = 0
          LIMIT 1
        `).bind(montoRecibido).first();

        if (jugador) {

          await env.torneos_db.prepare(`
            UPDATE PAGOS
            SET pagado = 1
            WHERE telegram_id = ? AND monto = ?
          `).bind(jugador.telegram_id, montoRecibido).run();

          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {

            method: "POST",
            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({
              chat_id: jugador.telegram_id,
              text: `✅ Pago recibido\nMonto: $${montoRecibido}\nInscripción confirmada`
            })

          });

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