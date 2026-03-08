export default {
  async fetch(request, env) {

    if (request.method !== "POST") {
      return new Response("Bot activo");
    }

    const data = await request.json();

    if (data.message) {
      const chatId = data.message.chat.id;
      const text = data.message.text;

      if (text === "/start") {

        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Bot funcionando en Cloudflare 🚀"
          })
        });

      }
    }

    return new Response("ok");
  }
}
