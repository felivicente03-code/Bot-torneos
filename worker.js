const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";

// Monto base en pesos
const MONTO_BASE = 200;

// Simulamos una "base de datos" de jugadores
// En producción usar D1, SQLite, etc.
let jugadores = []; // {telegram_id, nombre, monto_unico, pagado}

export default {
  async fetch(request) {
    if (request.method !== "POST") return new Response("Bot activo");

    try {
      const data = await request.json();

      // Si es mensaje
      if (data.message) {
        const chat_id = data.message.chat.id;
        const user_id = data.message.from.id;
        const nombre = data.message.from.first_name || "Jugador";

        // Comando /start
        if (data.message.text === "/start") {
          // Asignar monto único
          const numeroJugador = jugadores.length;
          const centavos = numeroJugador % 100;
          const pesosExtra = Math.floor(numeroJugador / 100);
          const monto_unico = (MONTO_BASE + pesosExtra + centavos / 100).toFixed(2);

          // Guardamos jugador
          jugadores.push({
            telegram_id: user_id,
            nombre: nombre,
            monto_unico: parseFloat(monto_unico),
            pagado: false
          });

          // Mensaje al jugador
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

      // Si es webhook de Mercado Pago
      if (data.type === "payment") {
        const payment = data.data;
        const montoRecibido = parseFloat(payment.transaction_amount);

        // Buscar jugador con ese monto que no haya pagado
        const jugador = jugadores.find(j => j.monto_unico === montoRecibido && !j.pagado);

        if (jugador) {
          jugador.pagado = true;

          // Enviar mensaje de confirmación
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: jugador.telegram_id,
              text: `✅ Pago recibido: $${montoRecibido}\n¡${jugador.nombre}, tu inscripción al torneo se completó correctamente!`
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