const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";
const MONTO_BASE = 20;

export default {
  async fetch(request, env) {

    if (request.method !== "POST") return new Response("Bot activo");

    try {

      const data = await request.json();

      // LOG 1 — ver todo el JSON recibido
      console.log("JSON recibido:", JSON.stringify(data));

      // ------------------
      // MENSAJES TELEGRAM
      // ------------------
      if (data.message) {

        const chat_id = data.message.chat.id;
        const text = data.message.text || "";
        const user_id = data.message.from.id;
        const nombre = data.message.from.first_name || "Jugador";

        console.log("Mensaje Telegram:", text, "Usuario:", user_id);

        if (text === "/start") {

          let numeroJugador = 0;

          try {

            const count = await env.torneos_db
              .prepare(`SELECT COUNT(*) AS total FROM PAGOS`)
              .first();

            numeroJugador = count.total || 0;

            console.log("Cantidad jugadores:", numeroJugador);

          } catch (e) {
            console.log("Error contando jugadores:", e);
          }

          const centavos = numeroJugador % 100;
          const pesosExtra = Math.floor(numeroJugador / 100);

          const monto_unico =
            (MONTO_BASE + pesosExtra + centavos / 100).toFixed(2);

          console.log("Monto asignado:", monto_unico);

          try {

            await env.torneos_db.prepare(`
              INSERT INTO PAGOS (telegram_id, monto, pagado)
              VALUES (?, ?, 0)
            `).bind(user_id, parseFloat(monto_unico)).run();

            console.log("Jugador guardado en D1");

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
      if (
        data.type === "payment" ||
        data.action === "payment.created" ||
        data.action === "payment.updated"
      ) {

        console.log("Evento Mercado Pago detectado");

        const payment_id = data.data.id;

        console.log("Payment ID:", payment_id);

        const mp = await fetch(
          `https://api.mercadopago.com/v1/payments/${payment_id}`,
          {
            headers: {
              Authorization: `Bearer ${MP_ACCESS_TOKEN}`
            }
          }
        );

        const payment = await mp.json();

        // LOG pago completo
        console.log("Pago completo:", JSON.stringify(payment));

        // Verificar que el pago esté aprobado
        if (payment.status !== "approved") {
          console.log("Pago no aprobado todavía:", payment.status);
          return new Response("Pago no aprobado");
        }

        let montoRecibido = payment.transaction_amount;

        console.log("Monto recibido raw:", montoRecibido);

        // soporta coma o punto
        if (typeof montoRecibido === "string") {
          montoRecibido = montoRecibido.replace(",", ".");
        }

        montoRecibido = parseFloat(montoRecibido);

        console.log("Monto convertido:", montoRecibido);

        // Buscar jugador en D1
        const jugador = await env.torneos_db.prepare(`
          SELECT telegram_id, monto
          FROM PAGOS
          WHERE ABS(monto - ?) < 0.01
          AND pagado = 0
          LIMIT 1
        `).bind(montoRecibido).first();

        console.log("Jugador encontrado:", jugador);

        if (jugador) {

          await env.torneos_db.prepare(`
            UPDATE PAGOS
            SET pagado = 1
            WHERE telegram_id = ?
            AND ABS(monto - ?) < 0.01
          `).bind(jugador.telegram_id, montoRecibido).run();

          console.log("Pago marcado como pagado");

          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {

            method: "POST",
            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({
              chat_id: jugador.telegram_id,
              text: `✅ Pago recibido\nMonto: $${montoRecibido}\nInscripción confirmada`
            })

          });

          console.log("Mensaje enviado a Telegram");
        } else {

          console.log("No se encontró jugador con ese monto");
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