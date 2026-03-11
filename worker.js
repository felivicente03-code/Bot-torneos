const TOKEN = "8750689884:AAGX4mL-lUxs-5zEbgONWvyzFW6bXDiJB3A";
const OCR_API_KEY = "K86140584888957";
const MP_TOKEN = "APP_USR-4428056520434568-030317-d98e43dabb9342447235c8b040971678-2127284765";

export default {
async fetch(request) {

if (request.method !== "POST") {
return new Response("Bot activo");
}

const data = await request.json();

if (!data.message) return new Response("ok");

const chat_id = data.message.chat.id;

/* START */

if (data.message.text === "/start") {

await sendMessage(chat_id,
"💳 Enviá el comprobante de transferencia y verificaré el pago automáticamente.");

return new Response("ok");
}

/* FOTO */

if (data.message.photo) {

const photo = data.message.photo.pop();
const file_id = photo.file_id;

/* OBTENER IMAGEN */

const fileRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${file_id}`);
const fileData = await fileRes.json();

const file_path = fileData.result.file_path;

const file_url = `https://api.telegram.org/file/bot${TOKEN}/${file_path}`;

/* OCR */

const ocrRes = await fetch("https://api.ocr.space/parse/imageurl", {
method: "POST",
headers: {
"Content-Type": "application/x-www-form-urlencoded"
},
body: `apikey=${OCR_API_KEY}&url=${file_url}&language=spa`
});

const ocrData = await ocrRes.json();

let texto = ocrData.ParsedResults?.[0]?.ParsedText || "";

/* NORMALIZAR TEXTO */

texto = texto.toUpperCase();

/* ENVIAR TEXTO OCR PARA DEBUG */

await sendMessage(chat_id, "📄 TEXTO LEÍDO:\n\n" + texto);

/* ELIMINAR ESPACIOS */

const textoLimpio = texto.replace(/\s+/g, "");

/* BUSCAR POSIBLES IDS */

const posibles = textoLimpio.match(/[A-Z0-9]{10,40}/g) || [];

let idOperacion = null;

for (let id of posibles) {

if (id.length >= 20) {
idOperacion = id;
break;
}

}

if (!idOperacion) {

await sendMessage(chat_id,
"❌ No pude detectar el ID de operación en el comprobante.");

return new Response("ok");
}

/* MOSTRAR ID DETECTADO */

await sendMessage(chat_id,
"🔎 ID detectado:\n" + idOperacion);

/* CONSULTAR PAGOS */

const pagosRes = await fetch(
"https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc",
{
headers: {
Authorization: `Bearer ${MP_TOKEN}`
}
}
);

const pagosData = await pagosRes.json();

const pagos = pagosData.results || [];

for (let pago of pagos) {

const api_e2e =
pago.point_of_interaction?.
transaction_data?.
e2e_id;

if (api_e2e === idOperacion) {

await sendMessage(chat_id,
`✅ Pago confirmado\n\n💰 Monto: $${pago.transaction_amount}`);

return new Response("ok");
}

}

await sendMessage(chat_id,
"⚠️ No encontré ese pago en Mercado Pago.");

}

return new Response("ok");

}
};

/* FUNCION MENSAJE */

async function sendMessage(chat_id, text) {

await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
chat_id: chat_id,
text: text
})
});

}