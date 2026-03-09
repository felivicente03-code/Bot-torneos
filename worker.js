export default {
  async fetch(request, env) {
    const result = await env.MY_DB.prepare(
      "SELECT Id, CustomerName, OrderDate FROM [Order] ORDER BY ShippedDate DESC LIMIT 100"
    ).run();
    return new Response(JSON.stringify(result));
  }
};
