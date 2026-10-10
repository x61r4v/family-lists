// Edge-to-edge proxy: serve the family-lists Worker through this pages.dev
// domain for networks that cannot reach *.workers.dev. All methods, paths,
// query strings, headers (incl. Cookie / Authorization) and bodies pass through.
// Origin/Referer are rewritten to the worker origin so Next.js server-action
// origin checks (Host vs Origin) pass.
const ORIGIN = "https://family-lists.x61r4v.workers.dev";

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const target = ORIGIN + url.pathname + url.search;
  const headers = new Headers(request.headers);
  headers.delete("host");
  if (headers.has("origin")) headers.set("origin", ORIGIN);
  if (headers.has("referer")) {
    headers.set("referer", headers.get("referer")!.replace(url.origin, ORIGIN));
  }
  const init: RequestInit & { duplex?: string } = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }
  const resp = await fetch(target, init);
  return new Response(resp.body, resp);
};
