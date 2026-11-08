// BAYAN design system: one mobile-first stylesheet for every page (RTL and LTR through logical properties, light and dark, any screen width).
// Layout rule of thumb: nothing has a fixed width; grids use auto-fill with min(100%, size) so a phone gets one column and never scrolls sideways.
export const CSS = `
:root{color-scheme:light dark;--bg:#f6f5f1;--card:#fff;--card2:#f0eee8;--ink:#14181f;--mut:#566070;--line:#e2dfd6;--navy:#0b1a38;--navy2:#13264f;--gold:#b8892b;--gold2:#d9a93e;--link:#0b4fa8;--ok:#1f7a4d;--bad:#c0392b;--r:16px;--r-sm:10px;--sh:0 1px 2px rgba(15,23,42,.06),0 8px 24px -12px rgba(15,23,42,.18);--serif:'Noto Naskh Arabic','Readex Pro',Georgia,'Times New Roman',serif;--sans:'Readex Pro',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;--ease:cubic-bezier(.22,.8,.3,1);--gut:clamp(14px,4vw,32px)}
@media(prefers-color-scheme:dark){:root{--bg:#090e1a;--card:#111a2d;--card2:#0e1627;--ink:#edf0f6;--mut:#9aa6bb;--line:#222d45;--navy:#0b1a38;--navy2:#16295a;--gold2:#e6bb52;--link:#8db5ff;--sh:0 1px 2px rgba(0,0,0,.4),0 10px 28px -12px rgba(0,0,0,.6)}}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;scroll-behavior:smooth;scroll-padding-top:120px}
body{margin:0;min-height:100vh;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);font:400 16px/1.75 var(--sans);overflow-wrap:break-word;-webkit-font-smoothing:antialiased;padding-inline:env(safe-area-inset-left) env(safe-area-inset-right)}
[dir=rtl] body{line-height:1.9}
img,svg,video{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
.full a:not([class]),.sources a,.cover a{color:var(--link);text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}
h1,h2,h3,h4{margin:0;line-height:1.35;font-family:var(--serif);font-weight:700;text-wrap:balance}
p{margin:0 0 1em}
ul,ol{margin:0 0 1em;padding-inline-start:1.4em}
li{margin:.3em 0}
button,input,select,textarea{font:inherit;color:inherit}
:focus-visible{outline:3px solid var(--gold2);outline-offset:2px;border-radius:6px}
::selection{background:var(--gold2);color:#111}
.aurora{display:none}
.wrap{width:100%;max-width:1240px;margin-inline:auto;padding-inline:var(--gut)}
main.wrap{flex:1;padding-block:clamp(18px,4vw,40px) clamp(32px,6vw,72px);min-width:0}
.progress{position:fixed;inset:0 0 auto 0;height:3px;z-index:60;background:linear-gradient(90deg,var(--gold),var(--gold2));transform-origin:left;transform:scaleX(0)}
[dir=rtl] .progress{transform-origin:right}
@supports(animation-timeline:scroll()){.progress{animation:prog linear both;animation-timeline:scroll(root)}@keyframes prog{to{transform:scaleX(1)}}}

/* ---------- header ---------- */
header.top{position:sticky;top:0;z-index:50;background:var(--navy);color:#fff;box-shadow:0 2px 14px rgba(0,0,0,.25);padding-top:env(safe-area-inset-top)}
.bar{display:flex;align-items:center;gap:10px;min-height:56px;padding-block:8px}
.logo{display:flex;align-items:baseline;gap:6px;font:700 clamp(22px,5vw,28px)/1 var(--serif);color:#fff;margin-inline-end:auto}
.logo b{color:var(--gold2)}
.logo small{font:500 11px/1 var(--sans);letter-spacing:.2em;opacity:.65}
.date{display:none;font-size:13px;opacity:.7;white-space:nowrap}
.pill{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 16px;border-radius:999px;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,.28);color:#fff;transition:background .25s,border-color .25s,color .25s;white-space:nowrap}
.pill:hover{background:rgba(255,255,255,.12)}
.pill.gold{background:var(--gold2);border-color:transparent;color:#1a1403}
.pill.gold:hover{background:#f0c764}
.ribbon{background:var(--navy2);border-top:1px solid rgba(255,255,255,.08)}
.ribbon .in{display:flex;gap:4px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;scrollbar-width:none;padding-block:6px;-webkit-overflow-scrolling:touch}
.ribbon .in::-webkit-scrollbar{display:none}
.ribbon a{flex:none;display:inline-flex;align-items:center;gap:7px;min-height:38px;padding:0 13px;border-radius:999px;font-size:14px;color:rgba(255,255,255,.82);scroll-snap-align:start;transition:background .2s,color .2s}
.ribbon a svg{width:17px;height:17px;opacity:.85}
.ribbon a:hover{background:rgba(255,255,255,.1);color:#fff}
.ribbon a[aria-current=page]{background:var(--gold2);color:#1a1403;font-weight:600}
.ticker{display:flex;align-items:center;gap:12px;background:#08122a;color:#dfe6f5;font-size:13.5px;overflow:hidden;padding-inline:var(--gut)}
.ticker-label{flex:none;background:var(--gold2);color:#1a1403;font-weight:700;border-radius:6px;padding:2px 10px;margin-block:7px}
.ticker-view{flex:1;min-width:0;overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}
.ticker-track{display:inline-flex;gap:36px;white-space:nowrap;padding-inline-end:36px;animation:tick 70s linear infinite}
.ticker-track a:hover{color:var(--gold2)}
.ticker-copy{display:inline-flex;gap:36px}
.ticker-view:hover .ticker-track{animation-play-state:paused}
@keyframes tick{to{transform:translateX(-50%)}}
[dir=rtl] .ticker-track{animation-name:tickr}
@keyframes tickr{to{transform:translateX(50%)}}

/* ---------- page heads and titles ---------- */
.page-head{margin-bottom:clamp(14px,3vw,26px);padding-bottom:14px;border-bottom:1px solid var(--line)}
.page-head h1{font-size:clamp(28px,6vw,46px)}
.page-head p{margin:8px 0 0;color:var(--mut);max-width:70ch}
.sec-title{font-size:clamp(22px,4.4vw,30px);margin:clamp(30px,6vw,52px) 0 clamp(12px,2.5vw,18px);display:flex;align-items:center;gap:12px}
main>.sec-title:first-child{margin-top:0}
.sec-title::before{content:"";flex:none;width:6px;height:1.1em;border-radius:3px;background:var(--gold2)}
.kicker{display:inline-block;font:600 12.5px/1.4 var(--sans);letter-spacing:.02em;color:var(--gold);text-transform:none}
@media(prefers-color-scheme:dark){.kicker{color:var(--gold2)}}
.badge{display:inline-block;margin-top:8px;margin-inline-end:6px;padding:2px 10px;border-radius:999px;background:var(--card2);border:1px solid var(--line);color:var(--mut);font-size:12px}
.meta{margin:0 0 10px;color:var(--mut);font-size:14px}
.updated{color:var(--mut);font-size:13.5px}
.verdict{margin:14px 0;padding:14px 18px;border-radius:var(--r-sm);background:var(--card);border:1px solid var(--line);border-inline-start:4px solid var(--gold2);color:var(--ink)}
.note{color:var(--mut);font-size:14px}
.tag{display:inline-flex;gap:8px;align-items:center;font-size:13px;color:var(--gold2)}
.ext{color:var(--link);font-size:14px;font-weight:600;text-decoration:underline;text-underline-offset:3px}

/* ---------- forms ---------- */
.search,.tool-form{display:flex;gap:8px;max-width:680px;margin:18px 0}
.search input,.tool-form input,.contribute input,.contribute textarea,.contribute select{width:100%;min-width:0;min-height:48px;padding:10px 16px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:16px}
.search input,.tool-form input{flex:1}
.search input::placeholder,.tool-form input::placeholder{color:var(--mut)}
.search input:focus,.tool-form input:focus,.contribute :is(input,textarea,select):focus{border-color:var(--gold2);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--gold2) 35%,transparent)}
.search button,.tool-form button,.contribute button{flex:none;min-height:48px;padding:0 22px;border-radius:14px;border:0;background:var(--navy);color:var(--gold2);font-weight:700;cursor:pointer;transition:transform .2s,filter .2s}
.search button:hover,.tool-form button:hover,.contribute button:hover{filter:brightness(1.2)}
.search button:active,.tool-form button:active,.contribute button:active{transform:scale(.97)}
.hp{position:absolute!important;width:1px!important;height:1px!important;min-height:0!important;margin:-1px!important;padding:0!important;border:0!important;overflow:hidden;clip:rect(0 0 0 0);opacity:0}
.contribute{display:grid;gap:12px;max-width:680px}
.contribute textarea{min-height:170px;resize:vertical}
.save-btn{display:inline-flex;align-items:center;min-height:40px;margin:10px 0;padding:0 16px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:14px;cursor:pointer;transition:border-color .2s,background .2s}
.save-btn:hover{border-color:var(--gold2)}
.save-btn[aria-pressed=true]{background:var(--navy);color:var(--gold2);border-color:transparent}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 4px}
.chips a{display:inline-flex;align-items:center;min-height:40px;padding:0 16px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-size:14px;font-weight:500;transition:border-color .2s,background .2s}
.chips a:hover{border-color:var(--gold2);background:var(--card2)}

/* ---------- hero and front page ---------- */
.hero{margin:0 0 28px;padding:clamp(22px,5vw,48px);border-radius:calc(var(--r) + 6px);background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff}
.hero-title{font-size:clamp(28px,6.4vw,52px);margin:12px 0}
.hero-title em{font-style:normal;color:var(--gold2)}
.hero .lead{color:rgba(255,255,255,.82);max-width:62ch}
.hero .note{color:rgba(255,255,255,.65)}
.hero .search input{border-color:transparent}
.lead{font-size:clamp(17px,2.4vw,20px);color:var(--mut);line-height:1.8}
.front{display:grid;gap:18px;margin-top:20px}
.lead-story{position:relative;display:flex;flex-direction:column;overflow:hidden;border-radius:calc(var(--r) + 4px);background:var(--navy);color:#fff;box-shadow:var(--sh)}
.lead-story img{width:100%;aspect-ratio:16/9;object-fit:cover;background:var(--navy2);transition:transform .8s var(--ease)}
.lead-story:hover img{transform:scale(1.03)}
.lead-story .tx{padding:clamp(16px,3vw,28px)}
.lead-story h2,.lead-story h3{font-size:clamp(22px,4vw,34px);margin:8px 0}
.lead-story p{margin:0;color:rgba(255,255,255,.8);font-size:15.5px}
.lead-story .kicker{color:var(--gold2)}
.side{display:grid;gap:12px;align-content:start}
.side a{display:flex;gap:14px;align-items:stretch;padding:10px;border-radius:var(--r);background:var(--card);border:1px solid var(--line);box-shadow:var(--sh);transition:transform .3s var(--ease),border-color .3s}
.side a:hover{transform:translateY(-3px);border-color:var(--gold2)}
.side img{flex:none;width:min(36%,150px);aspect-ratio:4/3;object-fit:cover;border-radius:var(--r-sm)}
.side h3{font-size:clamp(15.5px,2.4vw,18px);margin-top:4px}
.side div{min-width:0}
@media(min-width:900px){.front{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)}}

/* ---------- cards and grids ---------- */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:clamp(12px,2vw,20px)}
.card{position:relative;display:flex;flex-direction:column;min-width:0;overflow:hidden;border-radius:var(--r);background:var(--card);border:1px solid var(--line);box-shadow:var(--sh);transition:transform .35s var(--ease),border-color .3s,box-shadow .3s;animation:rise .55s var(--ease) both}
a.card:hover{transform:translateY(-4px);border-color:var(--gold2)}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.art-card img,.art-card .noimg{width:100%;aspect-ratio:16/10;object-fit:cover;background:var(--card2)}
.noimg{display:grid;place-items:center;color:var(--mut)}
.noimg svg{width:44px;height:44px;opacity:.5}
.art-card .in,.ref-card{padding:16px 18px 18px;display:flex;flex-direction:column;flex:1;min-width:0}
.card h3{font-size:clamp(17px,2.4vw,20px);margin:6px 0}
.card p{margin:0;color:var(--mut);font-size:14.5px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card .badge{align-self:flex-start}
.ref-card{border-style:dashed}
.result{padding:18px 20px}
.result p{-webkit-line-clamp:5}

/* ---------- sections hub ---------- */
.grp{margin-top:clamp(26px,5vw,44px)}
.grp-head{display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--line)}
.grp-head h3{font-size:clamp(20px,4vw,26px)}
.grp-head p{margin:2px 0 0;font-size:14px;color:var(--mut)}
.grp-head .num{display:grid;place-items:center;flex:none;width:44px;height:44px;border-radius:14px;background:var(--navy);color:var(--gold2);font:700 15px var(--sans)}
.grp-head .cnt{margin-inline-start:auto;flex:none;padding:3px 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--mut);font-size:12.5px}
.sec-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:clamp(12px,2vw,18px)}
.sec-card{min-height:170px;padding:18px;border-top:3px solid hsl(var(--h) 62% 48%)}
.sec-card:hover{box-shadow:0 18px 36px -18px hsl(var(--h) 60% 30% / .5);border-color:hsl(var(--h) 62% 48%)}
.sec-card .top{display:flex;align-items:center;justify-content:space-between}
.sec-card i{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:hsl(var(--h) 70% 50% / .14);color:hsl(var(--h) 65% 38%)}
@media(prefers-color-scheme:dark){.sec-card i,.sec-card .cta{color:hsl(var(--h) 75% 72%)}}
.sec-card i svg{width:24px;height:24px}
.sec-card h3{margin-top:auto;padding-top:14px;font-size:21px}
.sec-card p{-webkit-line-clamp:2}
.sec-card .wm{position:absolute;inset-block-end:-10px;inset-inline-end:-6px;color:hsl(var(--h) 60% 45%);opacity:.07;pointer-events:none}
.sec-card .wm svg{width:110px;height:110px}
.sec-card .go{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;border:1px solid var(--line);color:var(--mut);font-weight:400;transition:background .3s,color .3s,border-color .3s}
.sec-card:hover .go{background:hsl(var(--h) 62% 48%);border-color:transparent;color:#fff}
.sec-card .cta{margin-top:10px;font-size:13px;font-weight:600;color:hsl(var(--h) 65% 38%)}
.tools-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:14px}
.tool{display:flex;gap:14px;align-items:center;padding:16px 18px;border-radius:var(--r);border:1px solid var(--line);background:var(--card);box-shadow:var(--sh);transition:transform .3s var(--ease),border-color .3s}
.tool:hover{transform:translateY(-3px);border-color:hsl(var(--h) 62% 48%)}
.tool i{display:grid;place-items:center;flex:none;width:44px;height:44px;border-radius:12px;background:hsl(var(--h) 70% 50% / .14);color:hsl(var(--h) 65% 38%)}
.tool i svg{width:22px;height:22px}
.tool b{display:block}
.tool span{display:block;margin-top:2px;font-size:13px;color:var(--mut)}

/* ---------- articles ---------- */
.full{max-width:760px;margin-inline:auto;font-size:clamp(17px,2.2vw,19px)}
.full h1{font-size:clamp(28px,5.6vw,44px);margin:6px 0 14px}
.full h2{font-size:clamp(22px,3.6vw,29px);margin:1.8em 0 .5em;padding-top:.2em}
.full h3{font-size:clamp(19px,3vw,23px);margin:1.5em 0 .4em}
.full p,.full li{line-height:1.95}
.full .lead{margin:0 0 1.2em}
.full blockquote{margin:1.2em 0;padding:.4em 1.1em;border-inline-start:4px solid var(--gold2);color:var(--mut)}
.full table{display:block;max-width:100%;overflow-x:auto;border-collapse:collapse}
.full th,.full td{padding:8px 12px;border:1px solid var(--line)}
.hero-img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:calc(var(--r) + 2px);background:var(--card2);box-shadow:var(--sh)}
.lead-text p{font-size:clamp(17.5px,2.4vw,20px)}
.sources{margin-top:2em;padding:18px 20px;border-radius:var(--r);background:var(--card);border:1px solid var(--line)}
.sources h2{margin:0 0 .5em;font-size:20px}
.sources ul{margin:0}
.cover{list-style:none;padding:0}
.cover li{padding:14px 16px;margin:10px 0;border-radius:var(--r-sm);background:var(--card);border:1px solid var(--line);border-inline-start:4px solid var(--gold2)}

/* ---------- live tools ---------- */
.stat-grid,.times{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,160px),1fr));gap:12px}
.stat{display:flex;flex-direction:column;gap:2px;padding:16px;border-radius:var(--r);background:var(--card);border:1px solid var(--line);box-shadow:var(--sh);animation:rise .5s var(--ease) both}
.stat small{color:var(--mut);font-size:13px}
.stat b{font:700 clamp(22px,4vw,30px)/1.2 var(--sans);font-variant-numeric:tabular-nums}
.stat span{color:var(--mut);font-size:13px}
.stat.big{grid-column:1/-1;background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;border:0}
.stat.big small,.stat.big span{color:rgba(255,255,255,.75)}
.stat.big b{font-size:clamp(34px,8vw,56px);color:var(--gold2)}
@media(min-width:640px){.stat.big{grid-column:span 2}}

/* ---------- misc blocks ---------- */
.wisdom{margin-top:clamp(30px,6vw,56px);padding:clamp(18px,3vw,28px);border-radius:var(--r);background:var(--card);border:1px solid var(--line);border-inline-start:4px solid var(--gold2);font:600 clamp(17px,2.6vw,21px)/1.8 var(--serif)}
.wisdom small{display:block;margin-bottom:6px;font:600 12.5px var(--sans);color:var(--gold);letter-spacing:.04em}
footer{background:var(--navy);color:rgba(255,255,255,.82);padding:clamp(24px,5vw,40px) 0 calc(24px + env(safe-area-inset-bottom));margin-top:auto}
footer nav{display:flex;flex-wrap:wrap;gap:6px 18px;margin-bottom:14px}
footer nav a{padding:6px 0;font-size:14.5px}
footer a:hover{color:var(--gold2)}
.legal{display:flex;flex-wrap:wrap;gap:6px 18px;margin:0;font-size:13.5px;opacity:.75}
.legal a{padding:4px 0}

/* ---------- wider screens ---------- */
@media(min-width:760px){.date{display:inline}.bar{gap:14px}}
@media(min-width:1100px){.ribbon .in{flex-wrap:wrap;overflow:visible}}
@media(max-width:420px){.logo small{display:none}.pill{padding:0 12px}.search,.tool-form{flex-direction:column}.search button,.tool-form button{width:100%}.grp-head .cnt{display:none}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.ticker-view{overflow-x:auto}}
@media print{header.top,footer,.ticker,.progress,.save-btn{display:none!important}body{background:#fff;color:#000}.card,.sources{box-shadow:none}}
`;
