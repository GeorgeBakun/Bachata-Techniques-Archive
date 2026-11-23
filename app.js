const CATEGORIES=["Работа ног","Работа корпуса","Повороты","Связки","Музыкальность"];
const el={nav:document.querySelector("#category-nav"),all:document.querySelector("#all-count"),count:document.querySelector("#results-count"),search:document.querySelector("#search-input"),level:document.querySelector("#level-filter"),format:document.querySelector("#format-filter"),sort:document.querySelector("#sort-order"),reset:document.querySelector("#reset-filters"),grid:document.querySelector("#video-grid"),empty:document.querySelector("#empty-state"),emptyTitle:document.querySelector("#empty-title"),emptyCopy:document.querySelector("#empty-copy"),modal:document.querySelector("#video-modal"),title:document.querySelector("#modal-title"),description:document.querySelector("#modal-description"),meta:document.querySelector("#modal-meta"),player:document.querySelector("#player-wrap")};
let videos=[],category="Все",lastFocus=null;
function dateLabel(value){if(!value)return"Дата не указана";const d=new Date(value+"T00:00:00");return Number.isNaN(d.getTime())?"Дата не указана":new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",year:"numeric"}).format(d)}
function fillCardDate(node,value){if(!value){node.textContent="Дата не указана";return}const d=new Date(value+"T00:00:00");if(Number.isNaN(d.getTime())){node.textContent="Дата не указана";return}const parts=new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",year:"numeric",weekday:"long"}).formatToParts(d);const part=name=>parts.find(p=>p.type===name)?.value||"";node.append(document.createTextNode(`${part("day")} ${part("month")} `));const weekday=part("weekday");const day=document.createElement("span");day.className=weekday==="вторник"?"weekday-tuesday":weekday==="пятница"?"weekday-friday":"";day.textContent=`(${weekday})`;node.append(day,document.createTextNode(` ${part("year")} г.`))}
function embedUrl(code){if(typeof code!=="string")return null;const doc=new DOMParser().parseFromString(code,"text/html"),src=doc.querySelector("iframe")?.getAttribute("src");if(!src)return null;try{const u=new URL(src);if(u.protocol!=="https:"||!["vk.ru","www.vk.ru","vk.com","www.vk.com"].includes(u.hostname)||!u.pathname.endsWith("clip_ext.php"))return null;return u.href}catch{return null}}
function pill(text){const n=document.createElement("span");n.className="pill";n.textContent=text;return n}
function videoCategories(v){return Array.isArray(v.categories)?v.categories:(v.category?[v.category]:[])}
function card(v){const a=document.createElement("article");a.className="card";const top=document.createElement("div");top.className="card-top";const cat=document.createElement("span");cat.className="card-category";cat.textContent=videoCategories(v).join(" · ");const date=document.createElement("time");date.className="date";date.dateTime=v.lessonDate;fillCardDate(date,v.lessonDate);top.append(cat,date);const h=document.createElement("h3");h.textContent=v.title;const p=document.createElement("p");p.className="description";p.textContent=v.description||"Описание пока не добавлено.";const bottom=document.createElement("div");bottom.className="card-bottom";const pills=document.createElement("div");pills.className="pills";if(v.level)pills.append(pill(v.level));if(v.format)pills.append(pill(v.format));const watch=document.createElement("button");watch.className="watch";watch.type="button";watch.innerHTML='Смотреть <span aria-hidden="true">↗</span>';watch.addEventListener("click",()=>openVideo(v));bottom.append(pills,watch);a.append(top,h,p,bottom);return a}
function filtered(){const q=el.search.value.trim().toLocaleLowerCase("ru");return videos.filter(v=>(category==="Все"||videoCategories(v).includes(category))&&(!q||((v.title+" "+(v.description||"")).toLocaleLowerCase("ru").includes(q)))&&(!el.level.value||v.level===el.level.value)&&(!el.format.value||v.format===el.format.value)).sort((a,b)=>el.sort.value==="oldest"?(a.lessonDate||"").localeCompare(b.lessonDate||""):(b.lessonDate||"").localeCompare(a.lessonDate||""))}
function render(){const list=filtered();el.grid.replaceChildren(...list.map(card));el.count.textContent=list.length;el.empty.hidden=list.length>0;el.grid.hidden=list.length===0;if(!videos.length){el.emptyTitle.textContent="Архив готов к первым урокам";el.emptyCopy.innerHTML='Добавь первый ролик в файл <code>videos.json</code> в репозитории GitHub — он появится здесь после обновления сайта.'}else if(!list.length){el.emptyTitle.textContent="Ничего не нашлось";el.emptyCopy.textContent="Попробуй изменить запрос или сбросить фильтры."}el.all.textContent=videos.length;el.nav.querySelectorAll("[data-category]").forEach(b=>{b.classList.toggle("active",b.dataset.category===category);const old=b.querySelector(".count");if(old)old.remove();if(b.dataset.category!=="Все"){const n=document.createElement("span");n.className="count";n.textContent=videos.filter(v=>videoCategories(v).includes(b.dataset.category)).length;b.append(n)}})}
function openVideo(v){
 const src=embedUrl(v.vkEmbed);if(!src){alert("Не удалось прочитать iframe-код. Проверь, что это полный код экспорта клипа VK.");return}
 lastFocus=document.activeElement;el.title.textContent=v.title;el.description.textContent=v.description||"";el.meta.replaceChildren();[...videoCategories(v),v.level,v.format,v.lessonDate?dateLabel(v.lessonDate):""].filter(Boolean).forEach(x=>el.meta.append(pill(x)));
 const frame=document.createElement("iframe");const frameUrl=new URL(src);
 // Use VK's native video player for every archive clip. Its built-in controls include the seek bar.
 frameUrl.hostname="vk.com";frameUrl.pathname="/video_ext.php";frameUrl.searchParams.delete("js_api");
 frame.src=frameUrl.href;frame.title="Видео: "+v.title;frame.allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock";frame.allowFullscreen=true;frame.referrerPolicy="strict-origin-when-cross-origin";
 el.player.replaceChildren(frame);
 el.modal.hidden=false;el.modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";el.modal.querySelector(".close").focus()
}
function closeVideo(){if(el.modal.hidden)return;el.modal.hidden=true;el.modal.setAttribute("aria-hidden","true");el.player.replaceChildren();document.body.style.overflow="";lastFocus?.focus()}
function reset(){category="Все";el.search.value="";el.level.value="";el.format.value="";render()}
el.nav.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b){category=b.dataset.category;render()}});
[el.search,el.level,el.format,el.sort].forEach(n=>n.addEventListener(n===el.search?"input":"change",render));
el.reset.addEventListener("click",reset);document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",closeVideo));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeVideo();if(e.key==="/"&&document.activeElement.tagName!=="INPUT"){e.preventDefault();el.search.focus()}});
async function load(){try{const r=await fetch("./videos.json",{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);const data=await r.json();if(!Array.isArray(data))throw Error("Ожидался массив");videos=data.filter(v=>v&&typeof v.id==="string"&&typeof v.title==="string"&&Array.isArray(v.categories)&&v.categories.length>0&&v.categories.every(c=>CATEGORIES.includes(c))&&typeof v.lessonDate==="string"&&typeof v.vkEmbed==="string")}catch(err){console.error("Ошибка videos.json",err);el.emptyTitle.textContent="Не удалось загрузить каталог";el.emptyCopy.textContent="Проверь, что videos.json существует и содержит корректный JSON."}render()}
load();

// Интерактивный енот Koboyo: следит за курсором и реагирует на нажатие.
(() => {
  const mascot = document.querySelector("#page-mascot");
  if (!mascot) return;

  const directionsLayer = mascot.querySelector(".mascot-directions");
  const reactionsLayer = mascot.querySelector(".mascot-reactions");
  const squash = mascot.querySelector(".mascot-squash");

  const directionCells = {
    "up-left": 0, up: 1, "up-right": 2,
    left: 3, center: 4, right: 5,
    "down-left": 6, down: 7, "down-right": 8
  };
  const reactionCells = {
    blink: 0, heart: 1, sparkle: 2,
    surprised: 3, wink: 4, bashful: 5,
    sleepy: 6, dizzy: 7, delighted: 8
  };
  const clockwise = ["right", "down-right", "down", "down-left",
                     "left", "up-left", "up", "up-right"];
  const sectorSize = Math.PI * 2 / clockwise.length;
  const deadZone = 70;
  const hysteresis = 0.12;
  const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

  let sector = -1;
  let reactionTimer1 = 0;
  let reactionTimer2 = 0;
  let clickCount = 0;
  let lastClick = 0;

  function showCell(layer, index) {
    const col = index % 3;
    const row = Math.floor(index / 3);
    layer.style.backgroundPosition = `${col * 50}% ${row * 50}%`;
  }

  function setDirection(name) {
    showCell(directionsLayer, directionCells[name]);
  }

  function setReaction(name) {
    if (!name) {
      reactionsLayer.style.opacity = "0";
      directionsLayer.style.opacity = "1";
      return;
    }
    showCell(reactionsLayer, reactionCells[name]);
    reactionsLayer.style.opacity = "1";
    directionsLayer.style.opacity = "0";
  }

  setDirection("center");
  setReaction(null);

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let pointer = null;
    function aim() {
      if (!pointer) return;
      const rect = mascot.getBoundingClientRect();
      const dx = pointer.x - (rect.left + rect.width / 2);
      const dy = pointer.y - (rect.top + rect.height / 2);

      if (Math.hypot(dx, dy) < deadZone) {
        sector = -1;
        setDirection("center");
        return;
      }

      const angle = Math.atan2(dy, dx);
      if (sector !== -1 &&
          Math.abs(wrap(angle - sector * sectorSize)) < sectorSize / 2 + hysteresis) {
        return;
      }
      sector = (Math.round(angle / sectorSize) + clockwise.length) % clockwise.length;
      setDirection(clockwise[sector]);
    }

    window.addEventListener("pointermove", event => {
      pointer = { x: event.clientX, y: event.clientY };
      aim();
    }, { passive: true });
    window.addEventListener("scroll", aim, { passive: true });
  }

  mascot.addEventListener("click", () => {
    window.clearTimeout(reactionTimer1);
    window.clearTimeout(reactionTimer2);

    const now = Date.now();
    clickCount = now - lastClick < 1600 ? clickCount + 1 : 1;
    lastClick = now;

    if (clickCount >= 4) {
      clickCount = 0;
      setReaction("dizzy");
      reactionTimer2 = window.setTimeout(() => setReaction(null), 1100);
    } else {
      const payoff = ["heart", "sparkle", "delighted"][(clickCount - 1) % 3];
      setReaction("blink");
      reactionTimer1 = window.setTimeout(() => setReaction(payoff), 120);
      reactionTimer2 = window.setTimeout(() => setReaction(null), 560);
    }

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        typeof squash.animate === "function") {
      squash.animate([
        { transform: "scale(1, 1)" },
        { transform: "scale(1.10, 0.86)", offset: 0.18 },
        { transform: "scale(0.95, 1.08)", offset: 0.45 },
        { transform: "scale(1.03, 0.97)", offset: 0.72 },
        { transform: "scale(1, 1)" }
      ], { duration: 420, easing: "ease-in-out" });
    }
  });
})();
