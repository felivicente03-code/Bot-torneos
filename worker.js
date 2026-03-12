const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const MP_ACCESS_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";


export default {
async fetch(request, env) {

if (request.method !== "POST") {
return new Response("Bot activo");
}

const data = await request.json();

console.log("JSON recibido:", JSON.stringify(data));

if (data.message) {

const chat_id = data.message.chat.id;
const text = (data.message.text || "").toLowerCase();

console.log("Mensaje Telegram:", text, "Usuario:", chat_id);


// ===============================
// START
// ===============================

if (text === "/start") {

const cantidad = await env.DB.prepare(`
SELECT COUNT(*) as total FROM PAGOS
`).first();

const numero = cantidad.total + 1;

const monto = (20 + numero * 0.01).toFixed(2);

console.log("Cantidad jugadores:", numero);
console.log("Monto asignado:", monto);

await env.DB.prepare(`
INSERT INTO PAGOS (telegram_id, monto, pagado)
VALUES (?, ?, 0)
`).bind(chat_id, monto).run();

console.log("Jugador guardado en D1");

await enviarTelegram(
chat_id,
`Tu inscripción cuesta $${monto}\n\nTransfiere ese monto a Mercado Pago.\n\nCuando pagues escribe: si`
);

return new Response("ok");

}


// ===============================
// CONFIRMAR PAGO
// ===============================

if (text === "si") {

console.log("Usuario dice que pagó");

const jugador = await env.DB.prepare(`
SELECT telegram_id, monto
FROM PAGOS
WHERE telegram_id = ?
AND pagado = 0
`).bind(chat_id).first();

if (!jugador) {

await enviarTelegram(chat_id, "No tienes pagos pendientes.");
return new Response("ok");

}

const monto = parseFloat(jugador.monto);

console.log("Buscando pago de:", monto);

const mp = await fetch(
"https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=10",
{
headers: {
Authorization: `Bearer ${MP_ACCESS_TOKEN}`
}
}
);

const pagos = await mp.json();

console.log("Pagos recibidos:", JSON.stringify(pagos));

let pagoEncontrado = null;

for (const p of pagos.results) {

if (
p.status === "approved" &&
Math.abs(p.transaction_amount - monto) < 0.01
) {
pagoEncontrado = p;
break;
}

}

if (!pagoEncontrado) {

console.log("Pago no encontrado todavía");

await enviarTelegram(
chat_id,
"Aún no veo tu pago. Espera unos segundos y escribe 'si' nuevamente."
);

return new Response("ok");

}

console.log("Pago encontrado:", pagoEncontrado.id);

await env.DB.prepare(`
UPDATE PAGOS
SET pagado = 1
WHERE telegram_id = ?
`).bind(chat_id).run();

await enviarTelegram(
chat_id,
"✅ Pago confirmado. Estás inscrito en el torneo."
);

return new Response("ok");

}

}

return new Response("ok");

}
};


// ===============================
// ENVIAR MENSAJE TELEGRAM
// ===============================

async function enviarTelegram(chat_id, texto) {

await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
chat_id: chat_id,
text: texto
})
});

}