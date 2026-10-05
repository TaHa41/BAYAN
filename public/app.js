(() => {
  const form=document.querySelector("#search-form");
  const q=document.querySelector("#q");
  const lang=document.querySelector("#lang");
  const theme=document.querySelector("#theme");
  form?.addEventListener("submit",e=>{
    e.preventDefault();
    const value=q.value.trim();
    if(value) location.href="/search?q="+encodeURIComponent(value);
  });
  lang?.addEventListener("click",()=>location.href="/?lang=en");
  theme?.addEventListener("click",()=>document.documentElement.classList.toggle("force-dark"));
})();