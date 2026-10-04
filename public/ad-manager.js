(()=>{"use strict";
const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
async function loadAdSense(clientId){
  if(!clientId||document.querySelector('script[data-bayan-adsense]'))return;
  await new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.async=true;
    s.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+encodeURIComponent(clientId);
    s.crossOrigin="anonymous";
    s.dataset.bayanAdsense="true";
    s.onload=resolve;s.onerror=reject;
    document.head.appendChild(s);
  });
}
function mountSlot(node,clientId,slot){
  if(!node||!clientId||!slot)return;
  node.hidden=false;
  node.innerHTML='<div class="ad-label">'+(document.documentElement.lang==="en"?"Advertisement":"إعلان")+'</div><ins class="adsbygoogle bayan-ad" style="display:block" data-ad-client="'+esc(clientId)+'" data-ad-slot="'+esc(slot)+'" data-ad-format="auto" data-full-width-responsive="true"></ins>';
  try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch{}
}
async function init(){
  try{
    const r=await fetch("/api/ads/config",{cache:"no-store"});
    if(!r.ok)return;
    const cfg=await r.json();
    if(!cfg.enabled||cfg.provider!=="adsense"||!cfg.clientId)return;
    await loadAdSense(cfg.clientId);
    const map={"home-top":cfg.slots?.homeTop,"section-top":cfg.slots?.sectionTop,"article":cfg.slots?.article,"home-bottom":cfg.slots?.homeBottom};
    document.querySelectorAll("[data-ad-slot]").forEach(n=>mountSlot(n,cfg.clientId,map[n.dataset.adSlot]));
  }catch{}
}
window.BAYAN_ADS={init};
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init):init();
})();