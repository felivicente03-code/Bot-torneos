const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";
const MONTO_BASE = 200; // pesos base

// KV Namespace para guardar jugadores
// Define un KV llamado "JUGADORES" en tu entorno de Workers
// Cada jugador se guarda con key = telegram_id, value = JSON {nombre, monto_unico, pagado}
export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Bot activo");

    try {
      const data = await request.json();

      // === MENSAJE DE TELEGRAM ===
      if (data.message) {
        const chat_id = data.message.chat.id;
        const user_id = data.message.from.id;
        const nombre = data.message.from.first_name || "Jugador";

        if (data.message.text === "/start") {
          // Contar cuántos jugadores ya existen para calcular centavos
          const todos = await env.JUGADORES.list({ prefix: "player_" });
          const numeroJugador = todos.keys.length;

          const centavos = numeroJugador % 100;
          const pesosExtra = Math.floor(numeroJugador / 100);
          const monto_unico = (MONTO_BASE + pesosExtra + centavos / 100).toFixed(2);

          // Guardar jugador en KV
          await env.JUGADORES.put(
            `player_${user_id}`,
            JSON.stringify({ nombre, monto_unico: parseFloat(monto_unico), pagado: false })
          );

          // Enviar mensaje con monto único
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              text: `Hola ${nombre}! Tu monto único para pagar es: $${monto_unico}.\nTransferí este monto exacto a la cuenta indicada para inscribirte automáticamente.`
            })
          });

          return new Response("ok");
        }

        return new Response("ok");
      }

      // === WEBHOOK MERCADO PAGO ===
      if (data.type === "payment" || data.action === "payment.created") {
        const payment_id = data.data.id;

        // Obtener datos completos del pago
        const res = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
          headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
        });
        const payment = await res.json();

        const montoRecibido = parseFloat(payment.transaction_amount);

        // Buscar jugador con ese monto único y que no haya pagado
        const todos = await env.JUGADORES.list({ prefix: "player_" });
        for (const key of todos.keys) {
          const jugadorJSON = await env.JUGADORES.get(key.name);
          const jugador = JSON.parse(jugadorJSON);

          if (!jugador.pagado && Math.abs(jugador.monto_unico - montoRecibido) < 0.001) {
            // Marcar como pagado
            jugador.pagado = true;
            await env.JUGADORES.put(key.name, JSON.stringify(jugador));

            // Enviar mensaje de confirmación
            const telegram_id = key.name.replace("player_", "");
            await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: telegram_id,
                text: `✅ Pago recibido: $${montoRecibido}\n¡${jugador.nombre}, tu inscripción al torneo se completó correctamente!`
              })
            });

            break;
          }
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