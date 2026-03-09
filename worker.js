export default {
  async fetch(request, env) {
    const { results } = await env.MY_DB.prepare(
      "SELECT * FROM Customers LIMIT 100"
    ).run();

    return new Response(JSON.stringify(results));
  }
};
