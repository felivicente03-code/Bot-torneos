const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765"; // Mercado Pago
const MONTO_BASE = 20; // monto base en pesos

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

        if (data.message.text === "/start") {
          // Contar cuántos registros hay en PAGOS
          const count = await env.d1.prepare(`SELECT COUNT(*) AS total FROM PAGOS`).first();
          const numeroJugador = count.total || 0;

          const centavos = numeroJugador % 100;
          const pesosExtra = Math.floor(numeroJugador / 100);
          const monto_unico = (MONTO_BASE + pesosExtra + centavos / 100).toFixed(2);

          // Guardar en D1
          await env.d1.prepare(`
            INSERT INTO PAGOS (telegram_id, monto, pagado)
            VALUES (?, ?, 0)
          `).bind(user_id, parseFloat(monto_unico)).run();

          // Mensaje Telegram
          const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id,
              text: `Hola ${nombre}! Tu monto único es: $${monto_unico}\nTransferí este monto exacto para inscribirte automáticamente.`
            })
          });

          const json = await res.json();
          if (!json.ok) console.log("Error Telegram:", json);

          return new Response("ok");
        }

        return new Response("ok");
      }

      // -------------------
      // Webhook de Mercado Pago
      // -------------------
      if (data.type === "payment") {
        const payment = data.data;
        const montoRecibido = parseFloat(payment.transaction_amount);

        // Buscar jugador con ese monto que no haya pagado
        const jugador = await env.d1.prepare(`
          SELECT * FROM PAGOS WHERE monto = ? AND pagado = 0
        `).bind(montoRecibido).first();

        if (jugador) {
          // Marcar como pagado
          await env.d1.prepare(`
            UPDATE PAGOS SET pagado = 1 WHERE telegram_id = ? AND monto = ?
          `).bind(jugador.telegram_id, jugador.monto).run();

          // Enviar mensaje de confirmación
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: jugador.telegram_id,
              text: `✅ Pago recibido: $${montoRecibido}\n¡${jugador.telegram_id}, tu inscripción se completó correctamente!`
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