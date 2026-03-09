export default {
  async fetch(request, env) {

    const result = await env.torneos_db.prepare(
      "SELECT 1 as prueba"
    ).all();

    return new Response(JSON.stringify(result));

  }
};