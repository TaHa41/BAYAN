export interface Env { ASSETS: Fetcher }
export default { async fetch(request: Request, env: Env): Promise<Response> {
 const u=new URL(request.url);
 if(u.pathname==="/api/health") return Response.json({ok:true,name:"BAYAN",version:"1.0.0"});
 if(u.pathname==="/api/features") return Response.json({version:"1.0.0",principles:["evidence-first","ar","en","mobile-first"]});
 if(u.pathname==="/robots.txt") return new Response("User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n",{headers:{"content-type":"text/plain; charset=utf-8"}});
 if(u.pathname==="/sitemap.xml") return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://bayan.tahaomar411.workers.dev/</loc></url></urlset>',{headers:{"content-type":"application/xml; charset=utf-8"}});
 return env.ASSETS.fetch(request);
}};