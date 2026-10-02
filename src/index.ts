export interface Env {
  BAYAN_ENVIRONMENT?: string;
  BAYAN_VERSION?: string;
  BAYAN_COMMIT_SHA?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return json({
        name: "BAYAN | بيان",
        status: "foundation",
        message: "المعلومة أولًا. الدليل قبل الادعاء. الجودة قبل السرعة. الاستقرار قبل التوسع."
      });
    }

    if (url.pathname === "/health") {
      return json({
        status: "ok",
        version: env.BAYAN_VERSION ?? "0.1.0",
        commit: env.BAYAN_COMMIT_SHA ?? "local",
        environment: env.BAYAN_ENVIRONMENT ?? "development",
        timestamp: new Date().toISOString()
      });
    }

    return json({
      error: "Not Found",
      path: url.pathname
    }, 404);
  }
};
