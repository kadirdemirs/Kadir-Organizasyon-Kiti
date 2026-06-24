"use strict";
// =====================================================================
// Kade Organizasyon Kiti -- app.js v5 -- Definitive Edition
// Temiz, tam, çakışmasız mimari
// =====================================================================

const STORE_KEY   = "kade-kit-v5";
const UNDO_LIMIT  = 15;
const MAX_LOG     = 80;
const MAX_HISTORY = 10;

// ── FORMAT YARDIMCILARI ───────────────────────────────────────────────
const fmt = {
  try: new Intl.NumberFormat("tr-TR", { style:"currency", currency:"TRY", maximumFractionDigits:0 }),
  usd: new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", minimumFractionDigits:2, maximumFractionDigits:2 }),
  date(d){ if(!d)return"—"; try{ return new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"short"}).format(new Date(d)) }catch{ return d } },
  dt(ts){ try{ return new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(ts)) }catch{ return "" } },
  time(){ return new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}) },
};

// ── SABİTLER ─────────────────────────────────────────────────────────
const stages = [
  {id:"draft",      label:"Taslaklar",       color:"indigo"},
  {id:"production", label:"Prodüksiyon",      color:"teal"},
  {id:"post",       label:"Post-prodüksiyon", color:"gold"},
  {id:"published",  label:"Yayınlanan",       color:"violet"},
  {id:"cancelled",  label:"İptal",            color:"coral"},
];

const productionTags = [
  {id:"vlog",         label:"Vlog",       color:"teal"},
  {id:"komedi",       label:"Komedi",     color:"gold"},
  {id:"challenge",    label:"Challenge",  color:"coral"},
  {id:"seyahat",      label:"Seyahat",    color:"indigo"},
  {id:"kolaborasyon", label:"Kolabo",     color:"violet"},
];

const imageModels = [
  {id:"nano-banana-pro", name:"Nano Banana Pro", cost:0.18},
  {id:"nano-banana-2",   name:"Nano Banana 2",   cost:0.14},
  {id:"gpt-image-2",     name:"GPT Image 2",     cost:0.22},
];

const videoModels = [
  {id:"seadance-2",   name:"Seadance 2.0",  base:3.0},
  {id:"veo-style",    name:"Veo Style",     base:2.4},
  {id:"runway-style", name:"Runway Style",  base:2.1},
];

const themeDefinitions = [
  {name:"Doğallık ve samimiyet",  keywords:["samimi","dogal","gercek","icten","sohbet"],        next:"Dogal ekip sohbetlerini kesme; kamera arkasi anlari kisa bloklar halinde tut."},
  {name:"Konsept övgüsü",         keywords:["konsept","seri","format","tur","restoran","bolum"], next:"Konsepti seri formatina cevir; her bolumde kucuk bir kural degisikligi dene."},
  {name:"Ekip dinamiği",          keywords:["emir","emre","cagri","berkin","merve","ekip"],      next:"Ekip eslesmelerini baslikta ve kapaklarda daha gorünür yap."},
  {name:"Kurgu ve tempo",         keywords:["kurgu","tempo","uzun","sikici","akici","montaj"],   next:"Orta bolumde tempo olcumu yap; 30s uzun dusuk aksiyon bloklarini isaretle."},
  {name:"Kamusal alan sesi",      keywords:["gurultu","otobüs","rahatsiz","ses","bagir"],        next:"Kamusal alan sahnelerinde daha kisa, kontrollü ses kullan."},
  {name:"Kural ihlali",           keywords:["galeri","telefon","bakma","hile","uydurma"],        next:"Kural ihlali algilanan anlari cikar ya da ekranda gerekcenlendir."},
];

const positiveWords = ["mükemmel","harika","cok iyi","efsane","güzel","bayildim","seviyorum","komik","samimi","basarili","süper","güldüm","inanilmaz"];
const negativeWords = ["kötü","sikici","fazla","rahatsiz","gurultu","begenmedi","uzun","hile","yapay","eksik","berbat","zayif"];
const stopWords = new Set("ve veya ama icin gibi daha cok bir bu su o da de mi ma mu mü ile ise ben sen biz siz onlar burada boyle olarak kadar sonra once zaten hep hic ne nasil ya yani sadece".split(" "));

const defaultPromptTemplates = [
  {id:"tpl-1", name:"YouTube Kapak",    prompt:"@ana-kisi ve @ikinci-kisi yüksek kontrast neon arka planda, sok ifadesiyle kameraya bakiyor, sinematik isik, YouTube kapak kompozisyonu."},
  {id:"tpl-2", name:"Restoran Konsept", prompt:"@ana-kisi 1 yildizli restoranin önünde, eski soluk tabela ön planda, dramatik sinema renklendirmesi, büyütecle yemegi inceliyor."},
  {id:"tpl-3", name:"Challenge Kapak",  prompt:"@ana-kisi ve @ikinci-kisi abartili yarisma pozu, konfeti, trofeler arka planda, ultra-canli renk paleti."},
  {id:"tpl-4", name:"Seyahat Acilis",   prompt:"@ana-kisi egzotik sehir siluetinin önünde, günes batiyor, sinematik seyahat belgeseli estetiği, genis aci kompozisyon."},
  {id:"tpl-5", name:"Kamera Arkasi",    prompt:"Prodüksiyon ekibi sette calisirken, kameralar ve isiklar görünür, samimi belgesel stili, soft bokeh arka plan."},
];

const radarSources = [
  {icon:"🏆", title:"LM Arena",           desc:"Hangi AI modelinin su an dünyada birinci oldugunu gosteren bagimsiz siralama.", url:"https://lmarena.ai",            color:"teal"},
  {icon:"📊", title:"Artificial Analysis", desc:"Görsel/video modellerini kalite ve maliyet bazinda karsilastir.",              url:"https://artificialanalysis.ai", color:"indigo"},
  {icon:"🧡", title:"Hacker News",         desc:"Teknolojideki en yeni gelismelere buradan ulasirsin.",                        url:"https://news.ycombinator.com",  color:"gold"},
  {icon:"📦", title:"GitHub Trending",     desc:"O gün yayinlanan en iyi acik kaynak kütüphaneleri.",                         url:"https://github.com/trending",   color:"violet"},
  {icon:"🤖", title:"Google AI Studio",    desc:"Gemini modellerini ücretsiz dene, API key al.",                              url:"https://aistudio.google.com",   color:"teal"},
  {icon:"🚀", title:"Vercel",              desc:"Projeyi internete almak icin en hizli yol; Git push et, link hazir.",         url:"https://vercel.com",            color:"indigo"},
];

const modelMatrixData = [
  {name:"Gemini 2.5 Pro",    use:"Karmasik kodlama, uzun baglam",    rank:"🥇"},
  {name:"Claude Sonnet 4.5", use:"Kod yazma, mantik, yaraticilik",  rank:"🥇"},
  {name:"GPT-4o",            use:"Genel sohbet, cok modlu görevler", rank:"🥈"},
  {name:"Gemini Flash 2.5",  use:"Hizli yanit, düsük maliyet",      rank:"⚡"},
  {name:"Nano Banana Pro",   use:"YouTube kapak görseli üretimi",   rank:"🖼"},
  {name:"Seadance 2.0",      use:"Sahne devam ettirme, video",      rank:"🎬"},
];

const vibeStepsData = [
  {title:"Platform sec",     desc:"Basit projeler icin Google AI Studio; karmasik projeler icin Cursor.",              tools:["Google AI Studio","Cursor","VS Code"]},
  {title:"Tanimla",          desc:"Uygulamanin ne yapacagini madde madde veya ekran görüntüsü yapistirarak AI'ya anlat.", tools:["Claude Opus 4.7","Gemini 2.5 Pro"]},
  {title:"Tasarim al",       desc:"Google Stitch, Claude veya Figma'ya 'Bana bir arayüz ciz' de, cikan kodu projeye ekle.", tools:["Google Stitch","Figma","Claude Design"]},
  {title:"Veritabani bagla", desc:"Kullanici verilerini tutmak icin Supabase (2 projeye kadar ücretsiz) ya da Firebase.", tools:["Supabase","Firebase","MCP"]},
  {title:"API ekle",         desc:"AI konusturmak icin Google AI Studio'dan API key al, ortam degiskenine kopyala.",  tools:["Gemini API","OpenAI API",".env"]},
  {title:"Yayinla",          desc:"Projeyi GitHub'a push et, Vercel'e bagla. Birkac dakikada canli link hazir.",       tools:["Vercel","Railway","GitHub"]},
];

const shortcutsData = [
  {keys:"Ctrl + K", action:"Komut paleti"},
  {keys:"Ctrl + Z", action:"Son islemi geri al"},
  {keys:"1 – 7",    action:"Hizli görünüm gecisi"},
  {keys:"Escape",   action:"Dialog / paleti kapat"},
  {keys:"Ctrl + S", action:"Radar notu kaydet"},
  {keys:"Ctrl + E", action:"SentScan analiz et"},
  {keys:"Ctrl + B", action:"JSON yedek al"},
];

const sampleComments = [
  {likes:421, text:"Bu format cok samimi olmus, dusuk puanli tur serisi kesinlikle devam etmeli!"},
  {likes:318, text:"Emir ve Emre'nin dinamigi efsane, kahkaha attim."},
  {likes:274, text:"Samimi anlarin bu kadar dogal cikmasi cok nadir bir sey, ekip kimyasi süper."},
  {likes:210, text:"Otobüs icinde biraz fazla gurultu var, insanlar rahatsiz olmus olabilir."},
  {likes:166, text:"Galeriye bakma kismi biraz hile gibi durdu, sonraki bölümde olmasa daha iyi."},
  {likes:144, text:"Kurgu cok akici, dogallik hissi videoyu tasiyor. Montaj harika!"},
  {likes:99,  text:"Dusuk bütceli restoran konsepti ayri bir seri olsun, cok iyi fikir."},
  {likes:77,  text:"[16:58] Kilise mum yakma sahnesi inanilmazdi, o an gercekten büyüleyiciydi."},
  {likes:64,  text:"Video biraz uzun ama samimi oldugu icin sikilmadim, efsane icerik."},
  {likes:39,  text:"Kapak fotografi konsepti cok iyi, restoran puani daha büyük yazilabilir."},
  {likes:24,  text:"[23:44] Tavernada gecen diyalog cok güzeldi, o bölüm cok dogal cikmis."},
  {likes:18,  text:"Ses miksaji biraz eksik kalmis, arka plan müzigi bazen konusmanin önüne geciyor."},
  {likes:12,  text:"Her bölümde farkli bir ekip üyesi öne ciksa, seyirci etkilesimi artar."},
];

// ── BAŞLANGIÇ VERİSİ ─────────────────────────────────────────────────
const initialState = {
  settings:{ teamName:"Kade Kit", monthlyBudget:650000, members:["Orkun","Emir","Emre","Cagri","Berkin","Merve"] },
  references:[
    {id:"ref-main",    tag:"@ana-kisi",    label:"Ana kisi",        tone:"indigo"},
    {id:"ref-second",  tag:"@ikinci-kisi", label:"Ikinci kisi",     tone:"teal"},
    {id:"ref-costume", tag:"@kostum",      label:"Padisah kostümü", tone:"gold"},
  ],
  productions:[
    {
      id:"p-001", title:"Hangisi Gercek: Medium Bölümü",
      channel:"Orkun Isitmak", stage:"production",
      shootDate:"2026-06-28", publishDate:"2026-07-05",
      ideaId:"i-001", owner:"Emir", tags:["vlog","challenge"],
      updates:["Konuk listesi netlesiyor.","Mekan onayi bekleniyor."],
      tasks:[
        {id:"t-001",title:"Konuk teyidi al",      assignee:"Cagri",  priority:"Yüksek",due:"2026-06-25",done:false,desc:"3 konuk listesini onayla, 1 yedek hazirla."},
        {id:"t-002",title:"Cekim listesi hazirla",assignee:"Emir",   priority:"Orta",  due:"2026-06-26",done:false,desc:""},
      ],
      budgets:[
        {category:"Ulasim", items:[{id:"bi-001",label:"Otopark",amount:310,spender:"Emir"},{id:"bi-002",label:"Taksi",amount:600,spender:"Emre"}]},
        {category:"Prop",   items:[{id:"bi-003",label:"Masa sali",amount:420,spender:"Emir"},{id:"bi-004",label:"Lamba",amount:1260,spender:"Merve"}]},
      ],
    },
    {
      id:"p-002", title:"En Düsük Puanli Restoranlar",
      channel:"Orkun Isitmak", stage:"post",
      shootDate:"2026-06-14", publishDate:"2026-06-30",
      ideaId:"i-002", owner:"Berkin", tags:["vlog","komedi"],
      updates:["Kapak icin 40 görsel denendi.","Ses miksaji ikinci turda."],
      tasks:[
        {id:"t-003",title:"Kapak varyasyonlarini sec",assignee:"Berkin",priority:"Yüksek",due:"2026-06-24",done:false,desc:"En az 5 versiyonu kiyasla."},
        {id:"t-004",title:"Final render kontrolü",    assignee:"Merve", priority:"Orta",  due:"2026-06-27",done:false,desc:""},
      ],
      budgets:[
        {category:"Yemek",         items:[{id:"bi-005",label:"Restoran denemeleri",amount:18400,spender:"Cagri"},{id:"bi-006",label:"Ekip yemegi",amount:3200,spender:"Emir"}]},
        {category:"Görsel üretim", items:[{id:"bi-007",label:"Banana kapak denemeleri",amount:2150,spender:"Berkin"}]},
      ],
    },
    {
      id:"p-003", title:"Paris Katakomblari",
      channel:"Orkun V2", stage:"published",
      shootDate:"2026-05-18", publishDate:"2026-06-10",
      ideaId:"i-003", owner:"Merve", tags:["seyahat"],
      updates:["Yayinlandi, yorum analizi olumlu."],
      tasks:[{id:"t-005",title:"Yorum analizini raporla",assignee:"Emre",priority:"Düsük",due:"2026-06-24",done:true,desc:""}],
      budgets:[{category:"Seyahat",items:[{id:"bi-008",label:"Ucak",amount:142000,spender:"Merve"},{id:"bi-009",label:"Konaklama",amount:88000,spender:"Emir"}]}],
    },
    {
      id:"p-004", title:"Oyuncak Kapma Makinesi Kacisi",
      channel:"Orkun V2", stage:"draft",
      shootDate:"2026-07-09", publishDate:"2026-07-19",
      ideaId:"i-004", owner:"Cagri", tags:["challenge","komedi"],
      updates:["Banana video referanslari hazirlaniyor."],
      tasks:[{id:"t-006",title:"Mekan izinleri",assignee:"Cagri",priority:"Yüksek",due:"2026-07-01",done:false,desc:"AVM yönetiminden yazili izin al."}],
      budgets:[{category:"Mekan",items:[{id:"bi-010",label:"Ön ödeme",amount:12500,spender:"Cagri"}]}],
    },
    {
      id:"p-005", title:"Dedektif Serisi: Galeri Kurali",
      channel:"Orkun Isitmak", stage:"cancelled",
      shootDate:"2026-06-03", publishDate:"2026-06-22",
      ideaId:"i-005", owner:"Emre", tags:[],
      updates:["Yorum geri bildirimi nedeniyle iptal edildi."],
      tasks:[],
      budgets:[{category:"Hazirlik",items:[{id:"bi-011",label:"Arastirma",amount:5600,spender:"Emre"}]}],
    },
  ],
  ideas:[
    {id:"i-001",title:"Hangisi Gercek: Medium",       channel:"Orkun Isitmak",notes:"Konuklarin iddialarini ekip canli test eder."},
    {id:"i-002",title:"En Düsük Puanli Restoranlar",  channel:"Orkun Isitmak",notes:"1 yildizli mekanlardan yemek ve dürüst yorum."},
    {id:"i-003",title:"Paris Katakomblari",            channel:"Orkun V2",      notes:"Magnus Mitbo ve Sam & Colby referansli kesif."},
    {id:"i-004",title:"Oyuncak Kapma Makinesi",        channel:"Orkun V2",      notes:"Iki kisi makinenin icinde saklanir."},
    {id:"i-005",title:"Dedektif: Galeriye Bakma",      channel:"Orkun Isitmak",notes:"Yorumlardan gelen elestiri sonrasi kural netlesti."},
  ],
  inventory:[
    {id:"inv-001",name:"LED panel",      qty:8,  location:"Depo A / Raf 2"},
    {id:"inv-002",name:"Masa sali",      qty:2,  location:"Prop kutusu"},
    {id:"inv-003",name:"Yaka mikrofonu", qty:14, location:"Ses cantasi"},
    {id:"inv-004",name:"Oyuncak ayicik", qty:34, location:"Yeni ofis depo"},
    {id:"inv-005",name:"Gimbal",         qty:3,  location:"Kamera cantasi"},
    {id:"inv-006",name:"ND filtresi",    qty:12, location:"Depo A / Raf 1"},
  ],
  docs:[
    {title:"Ekip Bilgileri & IK",      type:"IK",      owner:"Operasyon",  icon:"👥"},
    {title:"Sirket Hesaplari",          type:"Finans",  owner:"Yönetim",    icon:"💰"},
    {title:"Grafik & Marka Paketleri",  type:"Tasarim", owner:"Kurgu",      icon:"🎨"},
    {title:"Prodüksiyon Sözlesmeleri",  type:"Hukuk",   owner:"Prodüksiyon",icon:"📄"},
    {title:"AI Arac Rehberleri",        type:"Teknik",  owner:"Tüm ekip",   icon:"🤖"},
    {title:"Kase ve Ücret Tablosu",     type:"Finans",  owner:"Yönetim",    icon:"💳"},
  ],
  media:[],videos:[],brainstorm:[],
  users:[
    {name:"Orkun",  images:42,  videos:9,  spend:87},
    {name:"Berkin", images:118, videos:3,  spend:52},
    {name:"Merve",  images:35,  videos:5,  spend:31},
  ],
  totalUsdSpent:170,
  radarNotes:["WiFi sinyaliyle 3B hareket algilama: RuView GitHub reposunu incele.","Seadance 2.0 benchmark sonuclarina bak."],
  promptHistory:[],
  promptTemplates:null,
  analysisHistory:[],
  activityLog:[],
  kanbanTagFilter:null,
  selectedTasks:[],
};

// ── STATE ─────────────────────────────────────────────────────────────
let state = null;
let undoStack = [];
let currentProductionId = null;
let activeFilter = "all";
let dragSrcId = null;
let activeWordFilter = null;
let commandPaletteIndex = 0;

// ── PERSISTENCE ───────────────────────────────────────────────────────
function clone(v){ return JSON.parse(JSON.stringify(v)) }
function uid(p="x"){ return `${p}-${Math.random().toString(36).slice(2,9)}` }

function deepMerge(base,patch){
  if(typeof patch!=="object"||!patch||Array.isArray(patch))return patch;
  const out={...base};
  for(const k of Object.keys(patch)){
    if(Array.isArray(patch[k]))out[k]=patch[k];
    else if(patch[k]&&typeof patch[k]==="object")out[k]=deepMerge(base[k]||{},patch[k]);
    else out[k]=patch[k];
  }
  return out;
}

function loadState(){
  try{
    const s=localStorage.getItem(STORE_KEY);
    if(!s)return buildInitial();
    const saved=JSON.parse(s);
    const merged=deepMerge(buildInitial(),saved);
    return merged;
  }catch{ return buildInitial() }
}

function buildInitial(){
  const s=clone(initialState);
  s.promptTemplates=clone(defaultPromptTemplates);
  return s;
}

function saveState(){
  localStorage.setItem(STORE_KEY,JSON.stringify(state));
  const el=document.getElementById("saveStatus");
  if(el)el.textContent=`Kaydedildi ${fmt.time()}`;
  updateBadge();
  syncUndoBtn();
}

function snapshotUndo(){ undoStack.push(clone(state)); if(undoStack.length>UNDO_LIMIT)undoStack.shift(); syncUndoBtn() }
function undoLast(){ if(!undoStack.length)return; state=undoStack.pop(); saveState(); renderAll(); showToast("Geri alindi","info") }
function syncUndoBtn(){ const b=document.getElementById("undoBtn"); if(b)b.disabled=!undoStack.length }

// ── AKTİVİTE LOGU ────────────────────────────────────────────────────
function logActivity(message,type="info"){
  state.activityLog=[{id:uid("log"),message,type,ts:Date.now()},...state.activityLog].slice(0,MAX_LOG);
}

// ── BOOTSTRAP ────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded",()=>{
  state=loadState();
  loadTheme();
  populateSelects();
  bindNavigation();
  bindGlobalActions();
  bindThemeToggle();
  bindDashboardFilter();
  bindCommentSection();
  bindCrm();
  bindBanana();
  bindVibe();
  bindRadar();
  bindSettings();
  bindKeyboardShortcuts();
  bindCommandPalette();
  bindBackupRestore();
  setSampleComments();
  renderAll();
  runCommentAnalysis();
  updateBadge();
  syncUndoBtn();
});

// ── YARDIMCILAR ───────────────────────────────────────────────────────
function esc(s){ return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;") }
function totalSpent(prods){ return(prods||state.productions).reduce((t,p)=>t+productionSpent(p),0) }
function productionSpent(p){ return p.budgets.reduce((s,g)=>s+g.items.reduce((a,i)=>a+Number(i.amount||0),0),0) }
function openTasks(){ return state.productions.flatMap(p=>p.tasks.filter(t=>!t.done).map(t=>({task:t,production:p}))) }
function upcomingTasksList(){ return openTasks().sort((a,b)=>String(a.task.due).localeCompare(String(b.task.due))).slice(0,6) }
function priorityColor(p){ return{"Yüksek":"coral","Orta":"gold","Düsük":"teal","Yüksek":"coral","Düşük":"teal"}[p]||"indigo" }
function containsAny(text,list){ const l=text.toLocaleLowerCase("tr-TR"); return list.some(w=>l.includes(w)) }
function refreshIcons(){ if(window.lucide)window.lucide.createIcons() }
function updateBadge(){ const n=openTasks().length; const el=document.getElementById("badge-tasks"); if(!el)return; el.textContent=n>0?n:""; el.style.display=n>0?"":"none" }

function filteredProductions(){
  if(activeFilter==="all")return state.productions;
  const now=new Date(),thisStart=new Date(now.getFullYear(),now.getMonth(),1),lastStart=new Date(now.getFullYear(),now.getMonth()-1,1),lastEnd=new Date(now.getFullYear(),now.getMonth(),0);
  return state.productions.filter(p=>{ const d=new Date(p.publishDate||p.shootDate); if(activeFilter==="thismonth")return d>=thisStart; if(activeFilter==="lastmonth")return d>=lastStart&&d<=lastEnd; return true });
}

function findTask(id){ for(const p of state.productions)for(const t of p.tasks)if(t.id===id)return t; return null }

function countdownBadge(prod){
  if(["published","cancelled"].includes(prod.stage))return`<span class="countdown-badge done">${prod.stage==="published"?"✓ Yayinda":"Iptal"}</span>`;
  if(!prod.publishDate)return"";
  const days=Math.ceil((new Date(prod.publishDate)-new Date())/86400000);
  if(days<0)return`<span class="countdown-badge late">âš  ${Math.abs(days)}g gecikti</span>`;
  if(days<=3)return`<span class="countdown-badge warn">⏰ ${days}g kaldi</span>`;
  return`<span class="countdown-badge ok">📅 ${days}g kaldi</span>`;
}

function calcProgress(prod){ const total=prod.tasks.length,done=prod.tasks.filter(t=>t.done).length; return{total,done,pct:total>0?Math.round((done/total)*100):0} }

function tagEl(tagId){ const t=productionTags.find(t=>t.id===tagId); if(!t)return""; return`<span class="tag-chip ${t.color}">${esc(t.label)}</span>` }

// ── TOAST ────────────────────────────────────────────────────────────
function showToast(msg,type="success"){
  const icons={success:"✓",error:"✗",info:"ℹ",warning:"⚠"};
  const c=document.getElementById("toastContainer");
  if(!c)return;
  const t=document.createElement("div");
  t.className=`toast ${type}`;
  t.innerHTML=`<span>${icons[type]||"✓"}</span><span>${esc(msg)}</span>`;
  c.appendChild(t);
  t.addEventListener("click",()=>removeToast(t));
  setTimeout(()=>removeToast(t),3500);
}
function removeToast(t){ t.classList.add("toast-out"); t.addEventListener("animationend",()=>t.remove(),{once:true}) }

// ── TEMA ─────────────────────────────────────────────────────────────
function loadTheme(){ const s=localStorage.getItem("kade-theme")||"dark"; document.documentElement.setAttribute("data-theme",s); updateThemeBtn(s) }
function bindThemeToggle(){ document.getElementById("themeToggle").addEventListener("click",()=>{ const c=document.documentElement.getAttribute("data-theme")||"dark",n=c==="dark"?"light":"dark"; document.documentElement.setAttribute("data-theme",n); localStorage.setItem("kade-theme",n); updateThemeBtn(n); showToast(n==="dark"?"Karanlik mod":"Aydinlik mod","info") }) }
function updateThemeBtn(t){ const b=document.getElementById("themeToggle"); if(b)b.textContent=t==="dark"?"🌙":"☀️" }

// ── MOBİL MENÜ ───────────────────────────────────────────────────────
function toggleMobileMenu(){ const s=document.getElementById("sidebar"),o=document.getElementById("mobileOverlay"),isOpen=s.classList.contains("mobile-open"); s.classList.toggle("mobile-open",!isOpen); o.classList.toggle("visible",!isOpen) }
function closeMobileMenu(){ document.getElementById("sidebar")?.classList.remove("mobile-open"); document.getElementById("mobileOverlay")?.classList.remove("visible") }

// ── NAVİGASYON ───────────────────────────────────────────────────────
const viewOrder=["dashboard","comments","crm","banana","vibe","radar","settings"];

function bindNavigation(){
  document.querySelectorAll(".nav-item[data-view]").forEach(btn=>{
    btn.addEventListener("click",()=>{ navigateTo(btn.dataset.view); closeMobileMenu() });
  });
}

function navigateTo(viewId){
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  const btn=document.querySelector(`.nav-item[data-view="${viewId}"]`);
  const view=document.getElementById(viewId);
  if(btn)btn.classList.add("active");
  if(view){
    view.classList.add("active");
    document.getElementById("viewTitle").textContent  =view.dataset.title  ||"";
    document.getElementById("viewEyebrow").textContent=view.dataset.eyebrow||"";
  }
  if(viewId==="crm")setTimeout(renderGanttChart,50);
  refreshIcons();
}

// ── KOMUT PALETİ ─────────────────────────────────────────────────────
function bindCommandPalette(){
  document.getElementById("commandInput").addEventListener("input",renderCommandResults);
  document.getElementById("commandInput").addEventListener("keydown",onCommandKey);
  document.getElementById("globalSearch").addEventListener("focus",()=>openCommandPalette());
}
function openCommandPalette(){ const p=document.getElementById("commandPalette"); p.style.display="flex"; document.getElementById("commandInput").focus(); renderCommandResults(); refreshIcons() }
function closeCommandPalette(e){ if(!e||e.target===document.getElementById("commandPalette")){ document.getElementById("commandPalette").style.display="none"; document.getElementById("commandInput").value=""; commandPaletteIndex=0 } }

function buildCommandItems(query){
  const q=(query||"").toLocaleLowerCase("tr-TR");
  const labels=["Özet","SentScan","Prodüksiyon CRM","Banana Studio","Vibe Coding","AI Radar","Ayarlar"];
  const icons=["layout-dashboard","message-square-text","kanban-square","sparkles","code-2","radio-tower","settings"];
  const items=[
    ...viewOrder.map((v,i)=>({label:labels[i]||v,sub:document.getElementById(v)?.dataset.eyebrow||"",icon:icons[i],action:()=>navigateTo(v)})),
    ...state.productions.map(p=>({label:p.title,sub:`${p.channel} · ${stages.find(s=>s.id===p.stage)?.label||p.stage}`,icon:"clapperboard",action:()=>{ navigateTo("crm"); openProduction(p.id) }})),
    {label:"JSON Yedek Al",        sub:"Tüm veriyi indir",    icon:"download-cloud",action:doBackup},
    {label:"Tema Degistir",         sub:"Dark / Light",        icon:"sun",           action:()=>document.getElementById("themeToggle").click()},
    {label:"Yeni Prodüksiyon Karti",sub:"CRM Kanban",          icon:"plus-circle",   action:()=>{ navigateTo("crm"); document.getElementById("quickAddProduction").click() }},
    {label:"Analiz Et",             sub:"SentScan",            icon:"bar-chart-3",   action:()=>{ navigateTo("comments"); runCommentAnalysis() }},
  ];
  if(!q)return items.slice(0,8);
  return items.filter(i=>`${i.label} ${i.sub}`.toLocaleLowerCase("tr-TR").includes(q)).slice(0,10);
}

function renderCommandResults(){
  const q=document.getElementById("commandInput").value;
  const items=buildCommandItems(q);
  const el=document.getElementById("commandResults");
  commandPaletteIndex=0;
  el.innerHTML=items.length
    ?items.map((item,i)=>`<button class="command-item${i===0?" focused":""}" data-ci="${i}" onclick="execCommand(${i})"><i data-lucide="${esc(item.icon)}" class="command-item-icon"></i><div><div class="command-item-label">${esc(item.label)}</div><div class="command-item-sub">${esc(item.sub)}</div></div></button>`).join("")
    :`<div class="command-empty">Sonuc bulunamadi</div>`;
  el._items=items;
  refreshIcons();
}

function execCommand(idx){ const items=document.getElementById("commandResults")._items||[]; if(items[idx]){ items[idx].action(); closeCommandPalette({target:document.getElementById("commandPalette")}) } }

function onCommandKey(e){
  const btns=document.getElementById("commandResults").querySelectorAll(".command-item");
  if(!btns.length)return;
  if(e.key==="ArrowDown"){e.preventDefault();commandPaletteIndex=Math.min(commandPaletteIndex+1,btns.length-1)}
  if(e.key==="ArrowUp"){e.preventDefault();commandPaletteIndex=Math.max(commandPaletteIndex-1,0)}
  if(e.key==="Enter"){e.preventDefault();execCommand(commandPaletteIndex);return}
  if(e.key==="Escape"){closeCommandPalette({target:document.getElementById("commandPalette")});return}
  btns.forEach((b,i)=>b.classList.toggle("focused",i===commandPaletteIndex));
}

// ── KLAVYE KISAYOLLARI ────────────────────────────────────────────────
function bindKeyboardShortcuts(){
  document.addEventListener("keydown",e=>{
    const typing=["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName);
    if(e.key==="k"&&(e.ctrlKey||e.metaKey)){e.preventDefault();openCommandPalette();return}
    if(e.key==="z"&&(e.ctrlKey||e.metaKey)&&!e.shiftKey){e.preventDefault();undoLast();return}
    if(e.key==="b"&&(e.ctrlKey||e.metaKey)){e.preventDefault();doBackup();return}
    if(e.key==="e"&&(e.ctrlKey||e.metaKey)){e.preventDefault();navigateTo("comments");runCommentAnalysis();return}
    if(e.key==="s"&&(e.ctrlKey||e.metaKey)&&document.getElementById("radar")?.classList.contains("active")){e.preventDefault();const inp=document.getElementById("radarNoteInput");if(inp?.value.trim())document.getElementById("radarNoteForm")?.dispatchEvent(new Event("submit"));return}
    if(e.key==="Escape"){document.getElementById("commandPalette").style.display="none";document.getElementById("productionDialog")?.close();return}
    if(!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey){const idx=parseInt(e.key,10)-1;if(idx>=0&&idx<viewOrder.length)navigateTo(viewOrder[idx])}
  });
}

// ── GLOBAL AKSİYONLAR ────────────────────────────────────────────────
function bindGlobalActions(){
  document.getElementById("resetBtn").addEventListener("click",doReset);
  document.getElementById("printBtn").addEventListener("click",()=>window.print());
  document.getElementById("undoBtn").addEventListener("click",undoLast);
  document.getElementById("assistantForm").addEventListener("submit",e=>{ e.preventDefault(); answerAssistant(document.getElementById("assistantInput").value) });
}

function doReset(){
  if(!confirm("Demo verisi yenilensin mi?"))return;
  snapshotUndo(); state=buildInitial(); activeFilter="all";
  saveState(); renderAll(); runCommentAnalysis(); syncFilterChips();
  showToast("Demo verisi yüklendi","info");
}

// ── YEDEK & GERİ YÜKLEME ─────────────────────────────────────────────
function bindBackupRestore(){
  document.getElementById("backupBtn").addEventListener("click",doBackup);
  document.getElementById("restoreBtn").addEventListener("click",()=>document.getElementById("restoreFile").click());
  document.getElementById("settingsBackup")?.addEventListener("click",doBackup);
  document.getElementById("settingsRestore")?.addEventListener("click",()=>document.getElementById("restoreFile").click());
  document.getElementById("settingsReset")?.addEventListener("click",doReset);
  document.getElementById("restoreFile").addEventListener("change",e=>{
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{ try{ const data=JSON.parse(ev.target.result); if(!data.productions)throw new Error(); snapshotUndo(); state=deepMerge(buildInitial(),data); saveState(); renderAll(); showToast("Yedek yüklendi!","success"); logActivity("Yedek dosyasi geri yüklendi","success") }catch{ showToast("Gecersiz yedek dosyasi","error") } e.target.value="" };
    reader.readAsText(file);
  });
}

function doBackup(){
  const data=JSON.stringify(state,null,2);
  const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
  const date=new Date().toISOString().slice(0,10);
  const a=Object.assign(document.createElement("a"),{href:url,download:`kade-kit-yedek-${date}.json`});
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast("Yedek indirildi","success"); logActivity("JSON yedek alindi","success");
}

// ── DASHBOARD FİLTRE ─────────────────────────────────────────────────
function bindDashboardFilter(){ document.getElementById("dashFilter").addEventListener("click",e=>{ const c=e.target.closest("[data-filter]"); if(!c)return; activeFilter=c.dataset.filter; syncFilterChips(); renderDashboard() }) }
function syncFilterChips(){ document.querySelectorAll("[data-filter]").forEach(c=>c.classList.toggle("active",c.dataset.filter===activeFilter)) }

// ── KPI KARTI ────────────────────────────────────────────────────────
function kpi(label,value,meta,color,icon){
  return`<div class="kpi ${color}">${icon?`<div class="kpi-icon"><i data-lucide="${icon}"></i></div>`:""}<div class="label">${esc(label)}</div><div class="value">${esc(String(value))}</div><div class="meta">${esc(meta)}</div></div>`;
}

// ── RENDER ALL ────────────────────────────────────────────────────────
function renderAll(){ renderDashboard(); renderCrm(); renderBanana(); renderVibe(); renderRadar(); renderSettingsView(); refreshIcons() }

// ── DONUT SVG ────────────────────────────────────────────────────────
function donutSvg(pct,color){
  const r=52,cx=60,cy=60,circ=2*Math.PI*r,dash=circ*Math.min(pct/100,1);
  const cols={teal:"#00d4aa",indigo:"#6c8ef5",coral:"#ff6b6b",gold:"#ffd166",violet:"#c77dff"};
  const c=cols[color]||"#00d4aa";
  return`<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="10" stroke-dasharray="${dash} ${circ}" stroke-dashoffset="${circ/4}" stroke-linecap="round" style="transition:stroke-dasharray 800ms ease"/><text x="${cx}" y="${cy+6}" text-anchor="middle" font-size="18" font-weight="800" fill="${c}">${pct}%</text></svg>`;
}

// ── DASHBOARD ────────────────────────────────────────────────────────
function renderDashboard(){
  const prods=filteredProductions(),spent=totalSpent(prods),active=prods.filter(p=>!["published","cancelled"].includes(p.stage)).length,open=openTasks().length,pct=Math.min(100,Math.round((spent/state.settings.monthlyBudget)*100));
  document.getElementById("dashKpis").innerHTML=[
    kpi("Aylik bütce",fmt.try.format(state.settings.monthlyBudget),`${pct}% kullanildi`,"teal","wallet"),
    kpi("Harcanan",fmt.try.format(spent),`${fmt.try.format(Math.max(state.settings.monthlyBudget-spent,0))} kaldi`,"gold","trending-up"),
    kpi("Aktif prods",active,`${state.ideas.length} fikir havuzda`,"indigo","clapperboard"),
    kpi("Acik görev",open,`${state.inventory.length} envanter`,"coral","list-checks"),
  ].join("");
  renderBudgetOverview(prods); renderUpcomingTasks(); renderRecentMedia(); renderActivityFeed(); renderTeamWorkload();
  answerAssistant(document.getElementById("assistantInput").value);
}

function renderBudgetOverview(prods){
  const spent=totalSpent(prods),pct=Math.min(100,Math.round((spent/state.settings.monthlyBudget)*100));
  let warning="";
  if(pct>=100)warning=`<div class="budget-warning danger">🔴 Bütce asimi! ${fmt.try.format(spent-state.settings.monthlyBudget)} fazla harcandi.</div>`;
  else if(pct>=90)warning=`<div class="budget-warning caution">⚠️ Dikkat: Bütcenin %${pct}'i kullanildi.</div>`;
  const catMap=new Map();
  (prods||state.productions).forEach(p=>p.budgets.forEach(g=>{ const t=g.items.reduce((s,i)=>s+Number(i.amount||0),0); catMap.set(g.category,(catMap.get(g.category)||0)+t) }));
  const topCats=[...catMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
  document.getElementById("budgetOverview").innerHTML=`${warning}<div class="donut-wrap">${donutSvg(pct,pct>=100?"coral":pct>=90?"gold":"teal")}<div class="donut-legend"><div style="font-size:13px;color:var(--ink3);margin-bottom:10px">${fmt.try.format(spent)} / ${fmt.try.format(state.settings.monthlyBudget)}</div>${topCats.map(([name,amount])=>`<div class="donut-entry"><div class="donut-dot"></div><span style="flex:1;font-size:13px">${esc(name)}</span><span class="donut-pct">${fmt.try.format(amount)}</span></div>`).join("")}</div></div><div style="margin-top:16px"><div class="progress"><span style="width:${pct}%"></span></div></div>`;
}

function renderUpcomingTasks(){
  const tasks=upcomingTasksList();
  document.getElementById("upcomingTasks").innerHTML=tasks.map(({task,production})=>`<div class="task-row"><div><div class="row-title">${esc(task.title)}</div><div class="row-meta">${esc(production.title)} · ${esc(task.assignee)} · ${fmt.date(task.due)}</div></div><span class="pill ${priorityColor(task.priority)}">${esc(task.priority)}</span></div>`).join("")||`<div class="empty-state">Tüm görevler tamamlandi 🎉</div>`;
}

function renderRecentMedia(){
  const fallback=[{title:"1 yildizli pizza",model:"Nano Banana Pro",cost:0.72,src:makeThumb("pizza",2)},{title:"Oyuncak makine",model:"GPT Image 2",cost:0.88,src:makeThumb("oyuncak",3)},{title:"Katakomb kesfi",model:"Nano Banana 2",cost:0.56,src:makeThumb("paris",4)}];
  const items=state.media.length?state.media.slice(-3).reverse():fallback;
  document.getElementById("recentMedia").innerHTML=items.map(m=>`<div class="media-tile"><img src="${esc(m.src)}" alt="${esc(m.title)}" loading="lazy"/><div><strong style="font-size:13px">${esc(m.title)}</strong><div class="row-meta">${fmt.usd.format(m.cost)} · ${esc(m.model)}</div></div></div>`).join("");
}

function renderActivityFeed(){
  const el=document.getElementById("activityFeed");if(!el)return;
  const logs=state.activityLog.slice(0,7);
  el.innerHTML=logs.length?logs.map(log=>`<div class="activity-item"><div class="activity-dot ${log.type}"></div><div style="flex:1"><div style="font-size:13px">${esc(log.message)}</div><div class="row-meta" style="font-size:11px">${fmt.dt(log.ts)}</div></div></div>`).join(""):`<div class="empty-state">Henüz aksiyon yok.</div>`;
}

function renderTeamWorkload(){
  const el=document.getElementById("teamWorkload");if(!el)return;
  const countMap=new Map();
  state.productions.flatMap(p=>p.tasks.filter(t=>!t.done)).forEach(t=>countMap.set(t.assignee,(countMap.get(t.assignee)||0)+1));
  const entries=[...countMap.entries()].sort((a,b)=>b[1]-a[1]),max=Math.max(...entries.map(([,v])=>v),1);
  el.innerHTML=entries.length?entries.map(([name,count])=>`<div class="bar-row"><div class="bar-label">${esc(name)}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.round((count/max)*100)}%;background:${count>=5?"#ff6b6b":count>=3?"#ffd166":"#00d4aa"}"></div></div><div class="bar-val">${count} görev</div></div>`).join(""):`<div class="empty-state">Acik görev yok.</div>`;
}

// ── AI ASISTAN ────────────────────────────────────────────────────────
function answerAssistant(question){
  const q=(question||"").toLocaleLowerCase("tr-TR"),spent=totalSpent();
  let ans=`Bu ay toplam ${fmt.try.format(spent)} harcandi (aylik bütcenin %${Math.round((spent/state.settings.monthlyBudget)*100)}'i).`;
  if(q.includes("kameraman")||q.includes("kase")||q.includes("ücret"))ans="Kameraman kase ücreti 8.500 TL - 12.000 TL araligindadir. Kütüphane > Kase Tablosu'na bak.";
  else if(q.includes("pahali")||q.includes("en fazla")){ const top=[...state.productions].sort((a,b)=>productionSpent(b)-productionSpent(a))[0]; ans=`En pahali: "${top.title}" — ${fmt.try.format(productionSpent(top))}.` }
  else if(q.includes("görev")||q.includes("bekleyen")){ const tasks=upcomingTasksList(); ans=`Acik görev: ${tasks.length}. Ilk sirada "${tasks[0]?.task.title||"—"}" (${tasks[0]?.task.assignee}, teslim: ${fmt.date(tasks[0]?.task.due)}).` }
  else if(q.includes("envanter")||q.includes("depo")){ const top=[...state.inventory].sort((a,b)=>b.qty-a.qty)[0]; ans=`Envanterde ${state.inventory.length} kalem. En cok: ${top?.name} (${top?.qty} adet).` }
  else if(q.includes("fikir"))ans=`Havuzda ${state.ideas.length} konsept var. En son: "${state.ideas[0]?.title}".`;
  else if(q.includes("banana")||q.includes("görsel"))ans=`Banana Studio: ${fmt.usd.format(state.totalUsdSpent)} harcandi, ${state.media.length} görsel üretildi.`;
  document.getElementById("assistantAnswer").textContent=ans;
}

// ── SENTSCAN ─────────────────────────────────────────────────────────
function bindCommentSection(){
  document.getElementById("loadSampleComments").addEventListener("click",()=>{ setSampleComments(); runCommentAnalysis() });
  document.getElementById("commentForm").addEventListener("submit",e=>{ e.preventDefault(); runCommentAnalysis() });
  document.getElementById("exportCsv").addEventListener("click",exportCommentsCsv);
  document.getElementById("saveAnalysis").addEventListener("click",saveAnalysisSession);
}
function setSampleComments(){ const el=document.getElementById("commentsInput"); if(el)el.value=sampleComments.map(c=>`[${c.likes}] ${c.text}`).join("\n") }
function runCommentAnalysis(){ const raw=document.getElementById("commentsInput").value; const result=analyzeComments(raw); renderCommentResult(result); renderVideoScore(result); renderAnalysisHistory(); refreshIcons() }

function analyzeComments(raw){
  const comments=raw.split(/\n+/).map((line,i)=>{ const m=line.match(/^\s*\[(\d+)\]\s*(.+)$/); return{text:m?m[2].trim():line.trim(),likes:m?Number(m[1]):Math.max(1,80-i*4)} }).filter(c=>c.text.length>2);
  const total=Math.max(comments.length,1);
  const themes=themeDefinitions.map(td=>{ const hits=comments.filter(c=>containsAny(c.text,td.keywords)); return{...td,count:hits.length,percent:Math.round((hits.length/total)*100),examples:hits.slice(0,2)} }).filter(t=>t.count>0).sort((a,b)=>b.count-a.count);
  const sentiment=comments.reduce((acc,c)=>{ const t=c.text.toLocaleLowerCase("tr-TR"); if(containsAny(t,positiveWords))acc.positive++; if(containsAny(t,negativeWords))acc.negative++; return acc },{positive:0,negative:0});
  const timestamps=comments.map(c=>({...c,stamps:[...c.text.matchAll(/\b\d{1,2}[:.]?\d{2}\b/g)].map(m=>m[0])})).filter(c=>c.stamps.length);
  const score=calcVideoScore(sentiment,total);
  return{total,themes,sentiment,timestamps,score,words:buildWordCloud(comments.map(c=>c.text).join(" ")),topComments:[...comments].sort((a,b)=>b.likes-a.likes).slice(0,8)};
}

function calcVideoScore(sentiment,total){ const posRate=sentiment.positive/Math.max(total,1),negRate=sentiment.negative/Math.max(total,1),raw=5+posRate*5-negRate*4; return Math.min(10,Math.max(1,parseFloat(raw.toFixed(1)))) }

function renderVideoScore(result){
  const el=document.getElementById("videoScore");if(!el)return;
  const score=result.score,color=score>=8?"teal":score>=6?"gold":"coral",label=score>=8?"Harika icerik! Izleyiciler cok memnun.":score>=6?"Iyi icerik. Kücük iyilestirmeler etkili olur.":"Yogun elestirimekte. Önerileri incele.";
  el.innerHTML=`<div style="display:flex;align-items:center;gap:20px;padding:8px 0"><div style="text-align:center"><div style="font-size:52px;font-weight:900;color:var(--${color});line-height:1">${score}</div><div style="font-size:12px;color:var(--ink3);margin-top:4px">/ 10 puan</div></div><div style="flex:1"><div class="progress" style="margin-bottom:10px"><span style="width:${score*10}%;background:var(--${color})"></span></div><div style="font-size:13px;line-height:1.6;color:var(--ink2)">${label}</div><div style="display:flex;gap:10px;margin-top:10px"><span class="pill teal">+${result.sentiment.positive} pozitif</span><span class="pill coral">-${result.sentiment.negative} negatif</span><span class="pill indigo">${result.total} yorum</span></div></div></div>`;
}

function renderCommentResult(result){
  const themeColors=["teal","indigo","gold","violet","coral"];
  document.getElementById("commentSummary").innerHTML=result.themes.length?`<div class="summary-bars">${result.themes.map((t,i)=>`<div class="summary-bar"><header><span>${esc(t.name)}</span><span class="pill ${themeColors[i%themeColors.length]}">${t.percent}%</span></header><div class="progress"><span style="width:${Math.max(t.percent,3)}%"></span></div><div class="row-meta">${t.count} yorum</div></div>`).join("")}</div>`:`<div class="empty-state">Analiz icin yorum ekle.</div>`;
  document.getElementById("recommendations").innerHTML=result.themes.length?`<ul class="recommendation-list">${result.themes.slice(0,5).map(t=>`<li><div class="rec-theme">💡 ${esc(t.name)}</div><div class="rec-action">${esc(t.next)}</div></li>`).join("")}</ul>`:`<div class="empty-state">Öneri icin analiz yap.</div>`;
  document.getElementById("wordCloud").innerHTML=result.words.map(w=>`<span class="word ${w.sentiment}${activeWordFilter===w.word?" selected":""}" style="font-size:${w.size}px" data-word="${esc(w.word)}" onclick="filterByWord('${esc(w.word)}')">${esc(w.word)}</span>`).join(" ");
  const raw=document.getElementById("commentsInput").value;
  const allComments=raw.split(/\n+/).map(line=>{ const m=line.match(/^\s*\[(\d+)\]\s*(.+)$/); return{text:m?m[2].trim():line.trim(),likes:m?Number(m[1]):0} }).filter(c=>c.text.length>2);
  const filtered=activeWordFilter?allComments.filter(c=>c.text.toLocaleLowerCase("tr-TR").includes(activeWordFilter)):[...allComments].sort((a,b)=>b.likes-a.likes).slice(0,8);
  document.getElementById("topComments").innerHTML=`<table class="data-table"><thead><tr><th>👍</th><th>Yorum</th></tr></thead><tbody>${filtered.slice(0,8).map(c=>`<tr><td><span class="pill teal">${c.likes}</span></td><td style="font-size:13px">${esc(c.text)}</td></tr>`).join("")}</tbody></table>`;
  document.getElementById("timestampComments").innerHTML=result.timestamps.length?result.timestamps.map(c=>`<div class="ts-row"><div>${c.stamps.map(s=>`<span class="ts-badge">${esc(s)}</span>`).join(" ")}</div><div class="ts-text">${esc(c.text)}</div></div>`).join(""):`<div class="empty-state">Zaman damgali yorum yok.</div>`;
}

function filterByWord(word){ if(activeWordFilter===word){clearWordFilter();return} activeWordFilter=word; document.getElementById("wordFilterLabel").textContent=`"${word}" iceren yorumlar`; document.getElementById("wordFilterBar").style.display="flex"; const raw=document.getElementById("commentsInput").value; renderCommentResult(analyzeComments(raw)); refreshIcons() }
function clearWordFilter(){ activeWordFilter=null; document.getElementById("wordFilterBar").style.display="none"; const raw=document.getElementById("commentsInput").value; renderCommentResult(analyzeComments(raw)); refreshIcons() }

function buildWordCloud(text){
  const counts=new Map();
  text.toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(w=>w.length>3&&!stopWords.has(w)).forEach(w=>counts.set(w,(counts.get(w)||0)+1));
  return[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,28).map(([word,count])=>({word,size:13+Math.min(22,count*5),sentiment:containsAny(word,positiveWords)?"positive":containsAny(word,negativeWords)?"negative":"neutral"}));
}

function saveAnalysisSession(){
  const url=document.getElementById("videoUrl").value,raw=document.getElementById("commentsInput").value;
  if(!raw.trim()){showToast("Önce yorum gir","error");return}
  const result=analyzeComments(raw);
  snapshotUndo();
  state.analysisHistory=[{id:uid("as"),videoUrl:url,ts:Date.now(),total:result.total,score:result.score,themes:result.themes.slice(0,3)},...state.analysisHistory].slice(0,MAX_HISTORY);
  saveState(); renderAnalysisHistory(); showToast("Analiz kaydedildi","success"); logActivity(`Analiz kaydedildi: ${url||"Demo"}","success`);
}

function renderAnalysisHistory(){
  const el=document.getElementById("analysisHistory");if(!el)return;
  el.innerHTML=state.analysisHistory.length?`<div style="display:grid;gap:10px">${state.analysisHistory.map(s=>`<div class="analysis-history-item"><div style="flex:1"><div style="font-weight:600;font-size:13px">${esc(s.videoUrl||"Demo video")}</div><div class="row-meta">${fmt.dt(s.ts)} · ${s.total} yorum · <span class="pill teal">${s.score}/10</span></div></div><button type="button" class="ghost-btn" style="font-size:12px" onclick="loadAnalysisSession('${s.id}')">Yükle</button><button type="button" onclick="deleteAnalysisSession('${s.id}')" style="border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:18px;padding:0 4px">×</button></div>`).join("")}</div>`:`<div class="empty-state">Analiz kaydet butonuyla gecmise ekle.</div>`;
}

function loadAnalysisSession(id){ const s=state.analysisHistory.find(h=>h.id===id); if(!s)return; if(s.videoUrl)document.getElementById("videoUrl").value=s.videoUrl; showToast("Oturum yüklendi","info") }
function deleteAnalysisSession(id){ snapshotUndo(); state.analysisHistory=state.analysisHistory.filter(h=>h.id!==id); saveState(); renderAnalysisHistory(); showToast("Oturum silindi","warning") }

function exportCommentsCsv(){
  const raw=document.getElementById("commentsInput").value,result=analyzeComments(raw);
  const rows=[["Video",document.getElementById("videoUrl").value,""],["Skor",result.score+"/10",""],["","",""],["Tip","Icerik","Deger"],...result.themes.map(t=>["Tema",t.name,`${t.percent}%`]),["","",""],["Sentiment","Pozitif",result.sentiment.positive],["Sentiment","Negatif",result.sentiment.negative],["","",""],...result.topComments.map(c=>["Yorum",c.text,c.likes]),...result.timestamps.map(c=>["Zaman",c.stamps.join(" "),c.text])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
  const a=Object.assign(document.createElement("a"),{href:url,download:`sentscan-${Date.now()}.csv`});
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  showToast("CSV indirildi","success");
}

// ── CRM ───────────────────────────────────────────────────────────────
function bindCrm(){
  document.querySelectorAll("[data-crm-tab]").forEach(btn=>btn.addEventListener("click",()=>switchTab("crm",btn.dataset.crmTab)));
  document.getElementById("quickAddProduction").addEventListener("click",()=>{
    snapshotUndo();
    const idea=state.ideas[0];
    state.productions.unshift({id:uid("p"),title:idea?idea.title:"Yeni prodüksiyon",channel:idea?.channel||"Kade",stage:"draft",shootDate:"",publishDate:"",ideaId:idea?.id||"",owner:state.settings.members[0]||"Operasyon",tags:[],updates:["Kart olusturuldu."],tasks:[],budgets:[{category:"Hazirlik",items:[]}]});
    saveState();renderAll();showToast("Yeni kart olusturuldu","success");logActivity("Yeni prodüksiyon karti acildi","success");
  });
  document.getElementById("kanbanBoard").addEventListener("click",e=>{ const card=e.target.closest("[data-production-id]"); if(card)openProduction(card.dataset.productionId) });
  document.getElementById("dialogBody").addEventListener("click",handleDialogClick);
  document.getElementById("dialogBody").addEventListener("change",handleDialogChange);
  document.getElementById("deleteProductionBtn").addEventListener("click",()=>{
    const prod=state.productions.find(p=>p.id===currentProductionId);
    if(!prod||!confirm(`"${prod.title}" silinsin mi?`))return;
    snapshotUndo(); state.productions=state.productions.filter(p=>p.id!==currentProductionId);
    document.getElementById("productionDialog").close(); saveState();renderAll();
    showToast(`"${prod.title}" silindi`,"warning"); logActivity(`Prodüksiyon silindi: ${prod.title}`,"warning");
  });
  document.getElementById("duplicateProductionBtn").addEventListener("click",()=>{
    const prod=state.productions.find(p=>p.id===currentProductionId);if(!prod)return;
    snapshotUndo();
    const copy={...clone(prod),id:uid("p"),title:prod.title+" (kopya)",stage:"draft",updates:[`"${prod.title}"den kopyalandi.`],tasks:prod.tasks.map(t=>({...clone(t),id:uid("t"),done:false}))};
    state.productions.unshift(copy); document.getElementById("productionDialog").close(); saveState();renderAll();
    showToast("Kart kopyalandi","info"); logActivity(`Kart kopyalandi: ${prod.title}`,"info");
  });
  document.getElementById("ideaForm").addEventListener("submit",e=>{ e.preventDefault(); snapshotUndo(); state.ideas.unshift({id:uid("i"),title:document.getElementById("ideaTitle").value,channel:document.getElementById("ideaChannel").value,notes:document.getElementById("ideaNotes").value}); e.target.reset(); document.getElementById("ideaChannel").value="Orkun Isitmak"; saveState();renderAll();showToast("Fikir eklendi","success") });
  document.getElementById("inventoryForm").addEventListener("submit",e=>{ e.preventDefault(); snapshotUndo(); state.inventory.unshift({id:uid("inv"),name:document.getElementById("inventoryName").value,qty:Number(document.getElementById("inventoryQty").value||1),location:document.getElementById("inventoryLocation").value}); e.target.reset(); document.getElementById("inventoryQty").value=1; document.getElementById("inventoryLocation").value="Depo A / Raf 1"; saveState();renderAll();showToast("Envanter eklendi","success") });
}

function switchTab(prefix,tab){ document.querySelectorAll(`.${prefix}-tab`).forEach(n=>n.classList.remove("active")); document.querySelectorAll(`[data-${prefix}-tab]`).forEach(n=>n.classList.remove("active")); document.getElementById(`${prefix}-${tab}`)?.classList.add("active"); document.querySelector(`[data-${prefix}-tab="${tab}"]`)?.classList.add("active"); if(tab==="gantt")setTimeout(renderGanttChart,50); refreshIcons() }

function renderCrm(){
  const spent=totalSpent(),active=state.productions.filter(p=>!["published","cancelled"].includes(p.stage)).length;
  document.getElementById("crmKpis").innerHTML=[kpi("Bütce",fmt.try.format(state.settings.monthlyBudget),"Aylik hedef","teal","wallet"),kpi("Harcanan",fmt.try.format(spent),`%${Math.round((spent/state.settings.monthlyBudget)*100)}`,"gold","trending-up"),kpi("Aktif",active,"Canli prodüksiyon","indigo","clapperboard"),kpi("Fikir",state.ideas.length,"Havuzda","violet","lightbulb"),kpi("Envanter",state.inventory.length,"Kayit","coral","boxes")].join("");
  renderTagFilterBar(); renderKanban(); renderIdeas(); renderGeneralTasks(); renderGanttChart(); renderInventory(); renderLibrary();
}

function renderTagFilterBar(){
  const el=document.getElementById("tagFilterBar");if(!el)return;
  el.innerHTML=`<span style="font-size:12px;color:var(--ink3);font-weight:700">Etiket:</span><button class="filter-chip${!state.kanbanTagFilter?" active":""}" onclick="setTagFilter(null)">Tümü</button>${productionTags.map(t=>`<button class="filter-chip tag-chip-filter ${state.kanbanTagFilter===t.id?"active":""}" onclick="setTagFilter('${t.id}')">${esc(t.label)}</button>`).join("")}`;
}
function setTagFilter(tagId){ state.kanbanTagFilter=tagId; renderTagFilterBar(); renderKanban() }

function renderKanban(){
  const tagF=state.kanbanTagFilter;
  const board=document.getElementById("kanbanBoard");
  board.innerHTML=stages.map(stage=>{
    let items=state.productions.filter(p=>p.stage===stage.id);
    if(tagF)items=items.filter(p=>(p.tags||[]).includes(tagF));
    const cards=items.map(p=>{
      const prog=calcProgress(p);
      const tags=(p.tags||[]).length
        ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${(p.tags||[]).map(tagEl).join("")}</div>`
        : "";
      const progress=prog.total>0
        ? `<div style="margin-top:8px"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink3);margin-bottom:3px"><span>${prog.done}/${prog.total}</span><span>${prog.pct}%</span></div><div class="progress" style="height:4px"><span style="width:${prog.pct}%"></span></div></div>`
        : "";
      return `<button class="production-card" draggable="true" data-production-id="${p.id}"><strong style="font-size:14px;text-align:left;display:block;margin-bottom:6px">${esc(p.title)}</strong><div class="card-meta"><span class="pill ${stage.color}" style="font-size:11px">${esc(p.channel)}</span>${countdownBadge(p)}</div>${tags}${progress}<div class="row-meta" style="margin-top:6px">${esc(p.owner)} · ${fmt.try.format(productionSpent(p))}</div></button>`;
    }).join("");
    return `<section class="kanban-column" data-stage="${stage.id}"><header><span>${esc(stage.label)}</span><span class="pill ${stage.color}">${items.length}</span></header><div class="kanban-list">${cards}</div></section>`;
  }).join("");
  document.querySelectorAll(".production-card[draggable]").forEach(card=>{
    card.addEventListener("dragstart",e=>{dragSrcId=card.dataset.productionId;card.classList.add("dragging");e.dataTransfer.effectAllowed="move"});
    card.addEventListener("dragend",()=>{card.classList.remove("dragging");document.querySelectorAll(".kanban-column").forEach(c=>c.classList.remove("drag-over"))});
  });
  document.querySelectorAll(".kanban-column").forEach(col=>{
    col.addEventListener("dragover",e=>{e.preventDefault();document.querySelectorAll(".kanban-column").forEach(c=>c.classList.remove("drag-over"));col.classList.add("drag-over")});
    col.addEventListener("dragleave",e=>{if(!col.contains(e.relatedTarget))col.classList.remove("drag-over")});
    col.addEventListener("drop",e=>{
      e.preventDefault();
      col.classList.remove("drag-over");
      const targetStage=col.dataset.stage;
      if(!dragSrcId||!targetStage)return;
      const prod=state.productions.find(p=>p.id===dragSrcId);
      if(prod&&prod.stage!==targetStage){
        snapshotUndo();
        const stageName=stages.find(s=>s.id===targetStage)?.label||targetStage;
        prod.stage=targetStage;
        prod.updates.unshift(`Asama "${stageName}" olarak degistirildi.`);
        saveState();
        renderAll();
        showToast(`"${prod.title}" → ${stageName}`,"success");
        logActivity(`"${prod.title}" → ${stageName}`,"success");
      }
      dragSrcId=null;
    });
  });
}

function openProduction(id){
  currentProductionId=id;
  const prod=state.productions.find(p=>p.id===id);if(!prod)return;
  const idea=state.ideas.find(i=>i.id===prod.ideaId),stage=stages.find(s=>s.id===prod.stage),prog=calcProgress(prod),members=state.settings.members;
  document.getElementById("dialogStage").textContent=stage?.label||"Kart";
  document.getElementById("dialogTitle").textContent=prod.title;
  document.getElementById("dialogBody").innerHTML=`<div class="dialog-grid"><div><div class="section-block"><h3>Detay</h3>${prog.total>0?`<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink3);margin-bottom:4px"><span>${prog.done}/${prog.total} görev</span><span>${prog.pct}%</span></div><div class="progress"><span style="width:${prog.pct}%"></span></div></div>`:""}<table class="data-table"><tbody><tr><td style="width:110px;font-weight:600;font-size:13px">Baslik</td><td><input class="editable-field" style="width:100%" data-edit="title" value="${esc(prod.title)}"/></td></tr><tr><td style="font-weight:600;font-size:13px">Sahip</td><td><select class="editable-field" data-edit="owner">${members.map(m=>`<option${prod.owner===m?" selected":""}>${esc(m)}</option>`).join("")}</select></td></tr><tr><td style="font-weight:600;font-size:13px">Cekim</td><td><input class="editable-field" type="date" data-edit="shootDate" value="${prod.shootDate||""}"/></td></tr><tr><td style="font-weight:600;font-size:13px">Yayin</td><td><input class="editable-field" type="date" data-edit="publishDate" value="${prod.publishDate||""}"/></td></tr><tr><td style="font-weight:600;font-size:13px">Fikir</td><td class="row-meta">${esc(idea?.title||"—")}</td></tr><tr><td style="font-weight:600;font-size:13px">Harcama</td><td><span class="pill gold">${fmt.try.format(productionSpent(prod))}</span></td></tr></tbody></table></div><div class="section-block"><h3>Etiketler</h3><div style="display:flex;flex-wrap:wrap;gap:8px">${productionTags.map(t=>{ const active=(prod.tags||[]).includes(t.id); return`<button type="button" class="tag-chip ${t.color}${active?" tag-active":""}" onclick="toggleProdTag('${t.id}')">${esc(t.label)}</button>` }).join("")}</div></div><div class="section-block"><h3>Asama</h3><div class="status-actions">${stages.map(s=>`<button type="button" class="status-btn${prod.stage===s.id?" active-stage":""}" data-move-stage="${s.id}">${esc(s.label)}</button>`).join("")}</div></div><div class="section-block"><h3>Güncellemeler</h3>${prod.updates.map(u=>`<div class="simple-row" style="font-size:13px">· ${esc(u)}</div>`).join("")}<div class="mini-form" style="margin-top:8px"><input id="newUpdateText" placeholder="Durum güncellemesi…"/><button type="button" class="icon-btn" data-add-update><i data-lucide="plus"></i></button></div></div></div><div><div class="section-block"><h3>Görevler</h3>${prod.tasks.map(t=>`<div class="task-item" style="border-bottom:1px solid var(--border);padding-bottom:10px;margin-bottom:10px"><label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer"><input type="checkbox" data-dialog-task="${t.id}" ${t.done?"checked":""} style="margin-top:3px"/><div style="flex:1"><div style="font-weight:600;font-size:13px;${t.done?"text-decoration:line-through;opacity:.5":""}">${esc(t.title)}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px"><select data-task-priority="${t.id}" style="font-size:11px;padding:2px 6px;min-height:auto;border-radius:6px;width:auto">${["Yüksek","Orta","Düsük"].map(p=>`<option${t.priority===p?" selected":""}>${p}</option>`).join("")}</select><input type="date" data-task-due="${t.id}" value="${t.due||""}" style="font-size:11px;padding:2px 6px;min-height:auto;border-radius:6px;width:auto"/><select data-task-assignee="${t.id}" style="font-size:11px;padding:2px 6px;min-height:auto;border-radius:6px;width:auto">${members.map(m=>`<option${t.assignee===m?" selected":""}>${esc(m)}</option>`).join("")}</select></div></div><button type="button" onclick="deleteTask('${prod.id}','${t.id}')" style="border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:18px;padding:0">×</button></label></div>`).join("")||`<div class="empty-state">Görev yok.</div>`}<div class="mini-form" style="margin-top:8px"><input id="newTaskText" placeholder="Yeni görev…"/><button type="button" class="icon-btn" data-add-task><i data-lucide="plus"></i></button></div></div><div class="section-block"><h3>Bütce</h3>${prod.budgets.map((g,gi)=>`<div style="margin-bottom:16px"><div style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">${esc(g.category)}</div><table class="data-table"><thead><tr><th>Kalem</th><th>Tutar</th><th>Kisi</th><th></th></tr></thead><tbody>${g.items.map(item=>`<tr><td style="font-size:13px">${esc(item.label)}</td><td><span class="pill gold">${fmt.try.format(item.amount)}</span></td><td class="row-meta">${esc(item.spender)}</td><td><button type="button" onclick="deleteBudgetItem('${gi}','${item.id}')" style="border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:16px;padding:0">×</button></td></tr>`).join("")}</tbody></table><div class="budget-add-form" data-budget-group="${gi}"><input placeholder="Kalem adi" data-ba-label/><input type="number" placeholder="Tutar" data-ba-amount min="0"/><select data-ba-spender>${members.map(m=>`<option>${esc(m)}</option>`).join("")}</select><button type="button" class="add-item-btn" data-add-budget="${gi}">+ Ekle</button></div></div>`).join("")}<button type="button" class="ghost-btn" style="font-size:12px;min-height:30px" data-add-category><i data-lucide="plus" style="width:13px;height:13px"></i> Kategori ekle</button></div></div></div>`;
  const dialog=document.getElementById("productionDialog");
  if(!dialog.open)dialog.showModal();
  refreshIcons();
}

function toggleProdTag(tagId){ const prod=state.productions.find(p=>p.id===currentProductionId);if(!prod)return;if(!prod.tags)prod.tags=[];const idx=prod.tags.indexOf(tagId);if(idx===-1)prod.tags.push(tagId);else prod.tags.splice(idx,1);saveState();renderKanban();openProduction(prod.id) }
function deleteTask(prodId,taskId){ const prod=state.productions.find(p=>p.id===prodId);if(!prod||!confirm("Görev silinsin mi?"))return;snapshotUndo();prod.tasks=prod.tasks.filter(t=>t.id!==taskId);saveState();renderAll();openProduction(prodId);showToast("Görev silindi","warning") }
function deleteBudgetItem(groupIdx,itemId){ const prod=state.productions.find(p=>p.id===currentProductionId);if(!prod||!confirm("Bütce kalemi silinsin mi?"))return;snapshotUndo();const group=prod.budgets[Number(groupIdx)];if(group)group.items=group.items.filter(i=>String(i.id)!==String(itemId));saveState();renderAll();openProduction(prod.id);showToast("Kalemi silindi","warning") }

function handleDialogClick(e){
  const prod=state.productions.find(p=>p.id===currentProductionId);if(!prod)return;
  const stageBtn=e.target.closest("[data-move-stage]");
  if(stageBtn){snapshotUndo();prod.stage=stageBtn.dataset.moveStage;const stageName=stages.find(s=>s.id===prod.stage)?.label||prod.stage;prod.updates.unshift(`Asama "${stageName}" olarak güncellendi.`);saveState();renderAll();openProduction(prod.id);showToast(`Asama: ${stageName}`,"success");logActivity(`"${prod.title}" → ${stageName}`,"success");return}
  const taskBox=e.target.closest("[data-dialog-task]");if(taskBox){toggleTask(taskBox.dataset.dialogTask,taskBox.checked);return}
  if(e.target.closest("[data-add-update]")){const inp=document.getElementById("newUpdateText");if(inp.value.trim()){snapshotUndo();prod.updates.unshift(inp.value.trim());saveState();renderAll();openProduction(prod.id);showToast("Güncelleme eklendi","success")}return}
  if(e.target.closest("[data-add-task]")){const inp=document.getElementById("newTaskText");if(inp.value.trim()){snapshotUndo();prod.tasks.unshift({id:uid("t"),title:inp.value.trim(),assignee:state.settings.members[0]||"Operasyon",priority:"Orta",due:"",done:false,desc:""});saveState();renderAll();openProduction(prod.id);showToast("Görev eklendi","success")}return}
  const budgetAddBtn=e.target.closest("[data-add-budget]");
  if(budgetAddBtn){const gi=Number(budgetAddBtn.dataset.addBudget),form=budgetAddBtn.closest(".budget-add-form"),label=form.querySelector("[data-ba-label]").value.trim(),amount=Number(form.querySelector("[data-ba-amount]").value),spender=form.querySelector("[data-ba-spender]").value;if(!label||!amount){showToast("Kalem adi ve tutar zorunludur","error");return}snapshotUndo();prod.budgets[gi].items.push({id:uid("bi"),label,amount,spender});saveState();renderAll();openProduction(prod.id);showToast(`${fmt.try.format(amount)} eklendi`,"success");return}
  if(e.target.closest("[data-add-category]")){const name=prompt("Yeni kategori adi:");if(name?.trim()){snapshotUndo();prod.budgets.push({category:name.trim(),items:[]});saveState();renderAll();openProduction(prod.id);showToast("Kategori eklendi","success")}}
}

function handleDialogChange(e){
  const prod=state.productions.find(p=>p.id===currentProductionId);if(!prod)return;
  const editField=e.target.closest("[data-edit]");if(editField){prod[editField.dataset.edit]=editField.value;if(editField.dataset.edit==="title")document.getElementById("dialogTitle").textContent=editField.value;saveState();renderKanban();return}
  const prioSel=e.target.closest("[data-task-priority]");if(prioSel){const t=findTask(prioSel.dataset.taskPriority);if(t){t.priority=prioSel.value;saveState()}return}
  const dueSel=e.target.closest("[data-task-due]");if(dueSel){const t=findTask(dueSel.dataset.taskDue);if(t){t.due=dueSel.value;saveState()}return}
  const assigneeSel=e.target.closest("[data-task-assignee]");if(assigneeSel){const t=findTask(assigneeSel.dataset.taskAssignee);if(t){t.assignee=assigneeSel.value;saveState();renderGeneralTasks()}return}
}

function toggleTask(id,done){ const t=findTask(id);if(t)t.done=done;saveState();renderDashboard();renderGeneralTasks();updateBadge();refreshIcons() }

function renderIdeas(){
  document.getElementById("ideaList").innerHTML=state.ideas.map(idea=>`<div class="idea-item"><h3>${esc(idea.title)}</h3><span class="pill teal">${esc(idea.channel)}</span><p class="row-meta" style="font-size:13px;margin-top:6px">${esc(idea.notes)}</p><div style="display:flex;gap:8px;margin-top:10px"><button type="button" class="ghost-btn" style="font-size:12px" onclick="ideaToProduction('${idea.id}')"><i data-lucide="arrow-right" style="width:13px;height:13px"></i> Prodüksiyona Tasi</button><button type="button" onclick="deleteIdea('${idea.id}')" style="border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:18px;padding:0">×</button></div></div>`).join("")||`<div class="empty-state">Fikir havuzu bos.</div>`;
}

function ideaToProduction(ideaId){ const idea=state.ideas.find(i=>i.id===ideaId);if(!idea||!confirm(`"${idea.title}" → prodüksiyon karti acilsin mi?`))return;snapshotUndo();state.productions.unshift({id:uid("p"),title:idea.title,channel:idea.channel,stage:"draft",shootDate:"",publishDate:"",ideaId:idea.id,owner:state.settings.members[0]||"Operasyon",tags:[],updates:[`"${idea.title}" fikrinden olusturuldu.`],tasks:[],budgets:[{category:"Hazirlik",items:[]}]});saveState();renderAll();switchTab("crm","productions");showToast("Prodüksiyon karti acildi","success");logActivity(`Fikir prodüksiyona tasindi: ${idea.title}`,"success") }
function deleteIdea(id){ if(!confirm("Fikir silinsin mi?"))return;snapshotUndo();state.ideas=state.ideas.filter(i=>i.id!==id);saveState();renderIdeas();showToast("Fikir silindi","warning") }

function renderGeneralTasks(){
  const assigneeSel=document.getElementById("taskAssigneeFilter");
  const currentAssignee=assigneeSel?.value||"";
  if(assigneeSel){ const assignees=[...new Set(state.productions.flatMap(p=>p.tasks.map(t=>t.assignee)))].sort(); assigneeSel.innerHTML=`<option value="">— Tümü —</option>`+assignees.map(a=>`<option${a===currentAssignee?" selected":""}>${esc(a)}</option>`).join("") }
  const filterAssignee=document.getElementById("taskAssigneeFilter")?.value||"",filterStatus=document.getElementById("taskStatusFilter")?.value||"",filterPrio=document.getElementById("taskPrioFilter")?.value||"";
  const tasks=state.productions.flatMap(p=>p.tasks.map(t=>({task:t,production:p}))).filter(({task})=>(!filterAssignee||task.assignee===filterAssignee)&&(!filterStatus||(filterStatus==="open"?!task.done:task.done))&&(!filterPrio||task.priority===filterPrio));
  const selected=state.selectedTasks||[];
  const toolbar=document.getElementById("bulkTaskToolbar");if(toolbar){toolbar.style.display=selected.length?"flex":"none";const cnt=document.getElementById("bulkCount");if(cnt)cnt.textContent=`${selected.length} secili`}
  document.getElementById("generalTasks").innerHTML=tasks.length?`<table class="data-table"><thead><tr><th><input type="checkbox" id="selectAllTasks" onchange="toggleSelectAll(this.checked)"/></th><th>Görev</th><th>Prodüksiyon</th><th>Sahip</th><th>Öncelik</th><th>Tarih</th></tr></thead><tbody>${tasks.map(({task,production})=>`<tr><td><input type="checkbox" class="bulk-task-cb" data-tid="${task.id}" ${selected.includes(task.id)?"checked":""} onchange="toggleBulkSelect('${task.id}',this.checked)"/></td><td style="font-weight:600;font-size:13px;${task.done?"text-decoration:line-through;opacity:.5":""}">${esc(task.title)}</td><td class="row-meta">${esc(production.title)}</td><td class="row-meta">${esc(task.assignee)}</td><td><span class="pill ${priorityColor(task.priority)}">${esc(task.priority)}</span></td><td class="row-meta">${fmt.date(task.due)}</td></tr>`).join("")}</tbody></table>`:`<div class="empty-state">Bu kriterlere göre görev bulunamadi.</div>`;
}

function toggleSelectAll(checked){ const cbs=document.querySelectorAll(".bulk-task-cb");state.selectedTasks=checked?[...cbs].map(cb=>cb.dataset.tid):[];cbs.forEach(cb=>cb.checked=checked);const toolbar=document.getElementById("bulkTaskToolbar");if(toolbar)toolbar.style.display=checked&&cbs.length?"flex":"none";const cnt=document.getElementById("bulkCount");if(cnt)cnt.textContent=`${state.selectedTasks.length} secili` }
function toggleBulkSelect(taskId,checked){ if(!state.selectedTasks)state.selectedTasks=[];if(checked)state.selectedTasks.push(taskId);else state.selectedTasks=state.selectedTasks.filter(id=>id!==taskId);const toolbar=document.getElementById("bulkTaskToolbar");if(toolbar)toolbar.style.display=state.selectedTasks.length?"flex":"none";const cnt=document.getElementById("bulkCount");if(cnt)cnt.textContent=`${state.selectedTasks.length} secili` }
function bulkCompleteTasks(){ if(!state.selectedTasks?.length)return;snapshotUndo();state.productions.forEach(p=>p.tasks.forEach(t=>{if(state.selectedTasks.includes(t.id))t.done=true}));state.selectedTasks=[];saveState();renderAll();showToast("Secili görevler tamamlandi","success") }
function clearBulkSelect(){ state.selectedTasks=[];renderGeneralTasks() }

function renderInventory(){
  document.getElementById("inventoryTable").innerHTML=`<table class="data-table"><thead><tr><th>Ürün</th><th>Adet</th><th>Konum</th></tr></thead><tbody>${state.inventory.map(item=>`<tr><td style="font-weight:600;font-size:13px">${esc(item.name)}</td><td><div class="qty-control"><button class="qty-btn" onclick="adjustQty('${item.id}',-1)">−</button><span class="qty-display">${item.qty}</span><button class="qty-btn" onclick="adjustQty('${item.id}',1)">+</button></div></td><td class="row-meta">${esc(item.location)}</td></tr>`).join("")}</tbody></table>`;
}
function adjustQty(id,delta){ const item=state.inventory.find(i=>i.id===id);if(!item)return;item.qty=Math.max(0,item.qty+delta);saveState();renderInventory();showToast(`${item.name}: ${item.qty} adet`,"info") }
function renderLibrary(){ document.getElementById("libraryList").innerHTML=state.docs.map(doc=>`<div class="doc-item"><div style="font-size:28px">${doc.icon||"📄"}</div><h3>${esc(doc.title)}</h3><div class="card-meta"><span class="pill indigo">${esc(doc.type)}</span><span class="row-meta">${esc(doc.owner)}</span></div></div>`).join("") }

function renderGanttChart(){
  const el=document.getElementById("ganttChart");if(!el)return;
  const now=new Date(),start=new Date(now.getFullYear(),now.getMonth()-1,1),end=new Date(now.getFullYear(),now.getMonth()+3,0),totalMs=end-start;
  const months=[],stageColors={draft:"#6c8ef5",production:"#00d4aa",post:"#ffd166",published:"#c77dff",cancelled:"#ff6b6b"};
  let cur=new Date(start);while(cur<=end){months.push(new Date(cur));cur=new Date(cur.getFullYear(),cur.getMonth()+1,1)}
  const todayPct=Math.max(0,Math.min(100,((now-start)/totalMs)*100)),prods=state.productions.filter(p=>p.publishDate||p.shootDate);
  el.innerHTML=`<div class="gantt-header"><div class="gantt-label-col">Prodüksiyon</div><div class="gantt-months">${months.map(m=>`<div class="gantt-month">${m.toLocaleDateString("tr-TR",{month:"short",year:"2-digit"})}</div>`).join("")}</div></div>${!prods.length?`<div class="empty-state">Tarih girilmis prodüksiyon yok.</div>`:prods.map(p=>{ const s2=new Date(p.shootDate||p.publishDate),e2=new Date(p.publishDate||p.shootDate),l=Math.max(0,Math.min(100,((s2-start)/totalMs)*100)),r=Math.max(0,Math.min(100,((e2-start)/totalMs)*100)),w=Math.max(1,r-l);return`<div class="gantt-row" onclick="openProduction('${p.id}')" style="cursor:pointer"><div class="gantt-row-label">${esc(p.title.slice(0,26))}${p.title.length>26?"…":""}<div class="row-meta">${esc(p.owner)}</div></div><div class="gantt-track"><div class="gantt-today" style="left:${todayPct}%"></div><div class="gantt-bar" style="left:${l}%;width:${w}%;background:${stageColors[p.stage]||"#6c8ef5"}">${w>8?esc(p.title.slice(0,12)):""}</div></div></div>` }).join("")}`;
}

// ── BANANA STUDIO ─────────────────────────────────────────────────────
function populateSelects(){
  const setOpts=(id,opts)=>{ const el=document.getElementById(id);if(!el)return;el.innerHTML=opts.map(o=>`<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("") };
  setOpts("imageModel",imageModels.map(m=>({value:m.id,label:`${m.name} ($${m.cost}/img)`})));
  setOpts("imageRatio",[{value:"16:9",label:"16:9 YouTube"},{value:"9:16",label:"9:16 Reels"},{value:"1:1",label:"1:1 Kare"},{value:"4:3",label:"4:3 Klasik"}]);
  setOpts("imageResolution",[{value:"1920x1080",label:"1920×1080 FHD"},{value:"2560x1440",label:"2560×1440 QHD"},{value:"3840x2160",label:"3840×2160 4K"}]);
  setOpts("videoModel",videoModels.map(m=>({value:m.id,label:`${m.name} ($${m.base}/10s)`})));
  setOpts("videoDuration",[{value:"5",label:"5 sn"},{value:"10",label:"10 sn"},{value:"15",label:"15 sn"},{value:"30",label:"30 sn"}]);
  setOpts("videoResolution",[{value:"1080p",label:"1080p FHD"},{value:"4K",label:"4K Ultra HD"}]);
}

function bindBanana(){
  document.querySelectorAll("[data-banana-tab]").forEach(btn=>btn.addEventListener("click",()=>switchTab("banana",btn.dataset.bananaTab)));
  document.getElementById("brainstormImage").addEventListener("click",()=>{ state.brainstorm=createBrainstorm(document.getElementById("imagePrompt").value);saveState();renderBanana() });
  document.getElementById("enhanceImagePrompt").addEventListener("click",()=>{ const el=document.getElementById("imagePrompt");el.value=enhanceImagePrompt(el.value);showToast("Prompt iyilestirildi","info") });
  document.getElementById("enhanceVideoPrompt").addEventListener("click",()=>{ const el=document.getElementById("videoPrompt");el.value=enhanceVideoPrompt(el.value);showToast("Prompt iyilestirildi","info") });
  document.getElementById("saveTemplate").addEventListener("click",()=>{ const prompt=document.getElementById("imagePrompt").value.trim();if(!prompt){showToast("Önce bir prompt yaz","error");return}snapshotUndo();const name=prompt.slice(0,30)+(prompt.length>30?"…":"");if(!state.promptTemplates)state.promptTemplates=[];state.promptTemplates.push({id:uid("tpl"),name,prompt});saveState();renderPromptTemplates();showToast("Sablon kaydedildi","success") });
  document.getElementById("imageForm").addEventListener("submit",e=>{ e.preventDefault();const model=imageModels.find(m=>m.id===document.getElementById("imageModel").value)||imageModels[0],count=Number(document.getElementById("imageCount").value||1),prompt=document.getElementById("imagePrompt").value,cost=model.cost*count;snapshotUndo();for(let i=0;i<count;i++)state.media.push({id:uid("img"),title:`Görsel ${state.media.length+1}`,prompt,model:model.name,cost:model.cost,src:makeThumb(prompt,state.media.length+i)});state.media=state.media.slice(-24);state.users[0].images+=count;state.users[0].spend+=cost;state.totalUsdSpent=(state.totalUsdSpent||0)+cost;if(!state.promptHistory)state.promptHistory=[];state.promptHistory=[prompt,...state.promptHistory.filter(p=>p!==prompt)].slice(0,8);saveState();renderBanana();renderRecentMedia();showToast(`${count} görsel üretildi (${fmt.usd.format(cost)})`,"success");logActivity(`Banana: ${count} görsel üretildi`,"success") });
  document.getElementById("videoForm").addEventListener("submit",e=>{ e.preventDefault();const model=videoModels.find(m=>m.id===document.getElementById("videoModel").value)||videoModels[0],dur=Number(document.getElementById("videoDuration").value||10),cost=model.base*(dur/10);snapshotUndo();state.videos.push({id:uid("vid"),title:`Video ${state.videos.length+1}`,prompt:document.getElementById("videoPrompt").value,model:model.name,cost,dur});state.videos=state.videos.slice(-12);state.users[0].videos++;state.totalUsdSpent=(state.totalUsdSpent||0)+cost;saveState();renderBanana();showToast(`Video üretildi (${fmt.usd.format(cost)})`,"success") });
  document.getElementById("continueVideo").addEventListener("click",()=>{ const el=document.getElementById("videoPrompt");el.value=`[DEVAM] ${el.value}`;el.focus() });
  document.getElementById("referenceForm").addEventListener("submit",e=>{ e.preventDefault();const tag=document.getElementById("referenceTag").value.trim();if(!tag)return;state.references.push({id:uid("ref"),tag:tag.startsWith("@")?tag:`@${tag}`,label:tag.replace("@",""),tone:"teal"});document.getElementById("referenceTag").value="";saveState();renderBanana();refreshIcons() });
}

function renderBanana(){ document.getElementById("bananaCost").textContent=`${fmt.usd.format(state.totalUsdSpent||0)} harcandi`;renderBananaReferences();renderPromptTemplates();renderBrainstorm();renderPromptHistory();renderImageGallery();renderVideoHistory();renderYoutubeRefs();renderAdminSpend();renderModelCosts();renderSpendingChart() }
function renderBananaReferences(){ document.getElementById("referenceList").innerHTML=state.references.map(r=>`<div class="reference-row"><div class="avatar">${esc(r.label.slice(0,2).toUpperCase())}</div><div style="flex:1"><div style="font-size:13px;font-weight:600">${esc(r.tag)}</div><div class="row-meta">${esc(r.label)}</div></div><span class="pill ${r.tone||"teal"}">Aktif</span></div>`).join("")||`<div class="empty-state">Referans ekle.</div>` }

function renderPromptTemplates(){
  const el=document.getElementById("promptTemplates");if(!el)return;
  const templates=state.promptTemplates||[];
  el.innerHTML=templates.length?templates.map(t=>`<div class="prompt-history-item"><span class="prompt-history-text">${esc(t.name)}</span><button class="prompt-history-use" onclick="useTemplate('${t.id}')">Kullan</button><button onclick="deleteTemplate('${t.id}')" style="border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:16px;padding:0 4px">×</button></div>`).join(""):`<div class="empty-state">Prompt yazıp sablon olarak kaydet.</div>`;
}
function useTemplate(id){ const t=(state.promptTemplates||[]).find(t=>t.id===id);if(t){document.getElementById("imagePrompt").value=t.prompt;showToast("Sablon yüklendi","info")} }
function deleteTemplate(id){ state.promptTemplates=(state.promptTemplates||[]).filter(t=>t.id!==id);saveState();renderPromptTemplates();showToast("Sablon silindi","warning") }

function renderBrainstorm(){ document.getElementById("brainstormList").innerHTML=state.brainstorm.length?state.brainstorm.map(item=>`<button type="button" style="width:100%;padding:10px 12px;border:0;border-radius:8px;background:transparent;text-align:left;color:var(--ink2);font-size:13px;cursor:pointer;border-bottom:1px solid var(--border)" onclick="document.getElementById('imagePrompt').value=this.dataset.prompt" data-prompt="${esc(item.prompt)}"><span style="color:var(--teal);margin-right:8px">→</span>${esc(item.prompt.slice(0,100))}…</button>`).join(""):`<div class="empty-state">Brainstorm'a bas; AI fikir üretsin.</div>` }
function renderPromptHistory(){ const el=document.getElementById("promptHistory");if(!el)return;const history=state.promptHistory||[];el.innerHTML=history.length?history.map((p,i)=>`<div class="prompt-history-item"><span class="prompt-history-text">${esc(p.slice(0,100))}${p.length>100?"…":""}</span><button class="prompt-history-use" onclick="document.getElementById('imagePrompt').value=(state.promptHistory||[])[${i}];showToast('Prompt yüklendi','info')">Kullan</button></div>`).join(""):`<div class="empty-state">Görsel üretince burada görünür.</div>` }
function renderImageGallery(){ const fallback=[{title:"1 yildizli pizza",model:"Nano Banana Pro",cost:0.72,src:makeThumb("pizza",5)},{title:"Sacli sandvic",model:"GPT Image 2",cost:0.88,src:makeThumb("sandvic",6)},{title:"Neon tabela",model:"Nano Banana 2",cost:0.56,src:makeThumb("neon",7)}];const items=state.media.length?state.media.slice(-9).reverse():fallback;document.getElementById("imageGallery").innerHTML=items.map(m=>`<div class="image-tile"><img src="${esc(m.src)}" alt="${esc(m.title)}" loading="lazy"/><div><div style="font-size:12px;font-weight:600">${esc(m.title)}</div><div class="row-meta" style="font-size:11px">${fmt.usd.format(m.cost)} · ${esc(m.model)}</div></div></div>`).join("") }
function renderVideoHistory(){ const fallback=[{title:"Oyuncak makine",model:"Seadance 2.0",cost:3.0,dur:10},{title:"Padisah sahne",model:"Seadance 2.0",cost:1.5,dur:5},{title:"Dovas devam",model:"Veo Style",cost:2.4,dur:10}];const items=state.videos.length?state.videos.slice(-6).reverse():fallback;document.getElementById("videoHistory").innerHTML=items.map(v=>`<div class="video-tile"><div class="video-thumb"><i data-lucide="play-circle"></i></div><div><div style="font-size:13px;font-weight:600">${esc(v.title)}</div><div class="row-meta" style="font-size:11px">${fmt.usd.format(v.cost)} · ${esc(v.model)} · ${v.dur}s</div></div></div>`).join("") }
function renderYoutubeRefs(){ const refs=[{title:"En Dusuk Puanli Restoranlar EP.1",date:"2025-11-10"},{title:"En Dusuk Puanli Restoranlar EP.2",date:"2025-12-22"},{title:"Dedektif Serisi: Tuhaf Olaylar",date:"2026-01-18"}];document.getElementById("youtubeReferences").innerHTML=refs.map(r=>`<div class="reference-row"><div style="font-size:20px">â–¶</div><div style="flex:1"><div class="row-title" style="font-size:13px">${esc(r.title)}</div><div class="row-meta">${fmt.date(r.date)}</div></div><button type="button" class="ghost-btn" style="font-size:12px" onclick="document.getElementById('videoPrompt').value+='[Ref: ${esc(r.title)}]'">Ref al</button></div>`).join("") }
function renderAdminSpend(){ document.getElementById("adminSpend").innerHTML=`<table class="data-table"><thead><tr><th>Kullanici</th><th>Görsel</th><th>Video</th><th>Harcama</th></tr></thead><tbody>${state.users.map(u=>`<tr><td style="font-weight:700">${esc(u.name)}</td><td><span class="pill indigo">${u.images}</span></td><td><span class="pill violet">${u.videos}</span></td><td><span class="cost-chip">${fmt.usd.format(u.spend)}</span></td></tr>`).join("")}</tbody></table><div style="margin-top:14px;padding:14px;border:1px solid var(--border);border-radius:10px;background:var(--gold-dim)"><div style="font-size:11px;font-weight:700;color:var(--gold);margin-bottom:4px">TOPLAM — GERCEK DOLAR</div><div style="font-size:28px;font-weight:900;color:var(--gold)">${fmt.usd.format(state.totalUsdSpent||0)}</div></div>` }
function renderModelCosts(){ document.getElementById("modelCosts").innerHTML=`<table class="data-table"><thead><tr><th>Model</th><th>Tip</th><th>Birim</th></tr></thead><tbody>${imageModels.map(m=>`<tr><td style="font-weight:700;font-size:13px">${esc(m.name)}</td><td><span class="pill teal">Görsel</span></td><td><span class="cost-chip">${fmt.usd.format(m.cost)}</span></td></tr>`).join("")}${videoModels.map(m=>`<tr><td style="font-weight:700;font-size:13px">${esc(m.name)}</td><td><span class="pill violet">Video</span></td><td><span class="cost-chip">${fmt.usd.format(m.base)}/10s</span></td></tr>`).join("")}</tbody></table>` }
function renderSpendingChart(){ const el=document.getElementById("spendingChart");if(!el)return;const max=Math.max(...state.users.map(u=>u.spend),1),cls=["#00d4aa","#6c8ef5","#c77dff"];el.innerHTML=state.users.map((u,i)=>`<div class="bar-row"><div class="bar-label">${esc(u.name)}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.round((u.spend/max)*100)}%;background:${cls[i%cls.length]}"></div></div><div class="bar-val">${fmt.usd.format(u.spend)}</div></div>`).join("") }
function createBrainstorm(cur){ return["Zehirlenme konsepti: @ana-kisi suheli yemegin önünde, abartili yüz ifadesi, gicirdayan restoran tabelasi.","Böcekli dürüm: @ana-kisi büyütecle inceliyor, karanlik neon isigi, ultra-gercekci doku.","1 Yildizli Restoran: Eski soluk tabela ön planda, @ana-kisi ve @ikinci-kisi saskin bakis.","Sac cikan yemek: @ana-kisi dehsetle geri cekiliyor, stüdyo isigi, sinema rengi.","Paket servisi felaketi: Sekillsiz paket, neon cerceveli sahne, @ikinci-kisi dehsette."].map((p,i)=>({id:uid("bs"),prompt:p,idx:i})) }
function enhanceImagePrompt(raw){ const refs=state.references.map(r=>r.tag).join(", ");return`${raw.trim()}\n\n— Sistem: sinematik aydinlatma, ultra-gercekci doku, sigi alan derinligi, profesyonel YouTube kapak kompozisyonu. Referanslar: ${refs||"@ana-kisi"}. Stil: edgy editorial, vibrant renk paleti.` }
function enhanceVideoPrompt(raw){ return`${raw.trim()}\n\n[Sistem: kamera=dinamik el kamerasi, isik=dramatik kontrast, fps=24, gercekcilik=yüksek]` }

// ── VİBE CODİNG ──────────────────────────────────────────────────────
function bindVibe(){
  document.getElementById("briefForm").addEventListener("submit",e=>{ e.preventDefault();const idea=document.getElementById("briefIdea").value,users=document.getElementById("briefUsers").value,can=document.getElementById("briefCan").value,cannot=document.getElementById("briefCannot").value;document.getElementById("briefOutput").textContent=`# Uygulama Brief'i — ${idea}\n\n## Hedef\n${idea}\n\n## Kullanicilar\n${users}\n\n## Yapabilecekler\n${can}\n\n## Kisitlamalar\n${cannot}\n\n## Önerilen Stack\n- Platform : Cursor + Claude Sonnet 4.5 / Gemini 2.5 Pro\n- Veritabani: Supabase veya Firebase\n- UI        : Vanilla HTML/CSS + localStorage\n- AI        : Google AI Studio API (Gemini Flash 2.5)\n- Deploy    : Vercel veya Railway\n\n## Cursor'a Yapistırilacak Prompt\n"${idea}" uygulamasi yaz.\nKullanicilar: ${users}\nYapabilsin : ${can.replace(/\n/g,", ")}\nYapamasin  : ${cannot.replace(/\n/g,", ")}` });
  document.getElementById("copyBrief").addEventListener("click",()=>{ navigator.clipboard.writeText(document.getElementById("briefOutput").textContent).then(()=>{ const btn=document.getElementById("copyBrief");btn.innerHTML='<i data-lucide="check"></i>Kopyalandi!';refreshIcons();setTimeout(()=>{btn.innerHTML='<i data-lucide="copy"></i>Kopyala';refreshIcons()},2000) }) });
}
function renderVibe(){ document.getElementById("vibeSteps").innerHTML=vibeStepsData.map((s,i)=>`<div class="vibe-step"><div class="vibe-num">${i+1}</div><div class="vibe-content"><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p><div class="vibe-tools">${s.tools.map(t=>`<span class="vibe-tool-tag">${esc(t)}</span>`).join("")}</div></div></div>`).join("") }

// ── AI RADAR ─────────────────────────────────────────────────────────
function bindRadar(){
  document.getElementById("radarNoteForm").addEventListener("submit",e=>{ e.preventDefault();const val=document.getElementById("radarNoteInput").value.trim();if(!val)return;snapshotUndo();state.radarNotes.unshift(val);document.getElementById("radarNoteInput").value="";saveState();renderRadar();showToast("Not eklendi","success");logActivity("Radar notu eklendi","info") });
}
function renderRadar(){
  document.getElementById("radarCards").innerHTML=radarSources.map(s=>`<div class="radar-card"><div class="radar-icon">${s.icon}</div><div class="radar-title">${esc(s.title)}</div><div class="radar-desc">${esc(s.desc)}</div><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" class="radar-link">Ac <i data-lucide="external-link" style="width:13px;height:13px"></i></a></div>`).join("");
  document.getElementById("modelMatrix").innerHTML=modelMatrixData.map(m=>`<div class="model-row"><div class="model-name">${esc(m.name)}</div><div class="model-use">${esc(m.use)}</div><div style="font-size:18px">${m.rank}</div></div>`).join("");
  document.getElementById("radarNotes").innerHTML=state.radarNotes.length?state.radarNotes.map((note,i)=>`<div class="note-row" style="display:flex;gap:8px;padding:10px 12px;border-radius:8px"><span style="color:var(--teal);flex:0 0 auto">→</span><span style="font-size:13px;flex:1">${esc(note)}</span><button onclick="deleteRadarNote(${i})" style="border:0;background:transparent;color:var(--coral);cursor:pointer;font-size:18px;padding:0">×</button></div>`).join(""):`<div class="empty-state">Ilk notunu ekle.</div>`;
}
function deleteRadarNote(i){ snapshotUndo();state.radarNotes.splice(i,1);saveState();renderRadar();showToast("Not silindi","warning") }

// ── AYARLAR ───────────────────────────────────────────────────────────
function bindSettings(){
  document.getElementById("settingsForm").addEventListener("submit",e=>{ e.preventDefault();snapshotUndo();const teamName=document.getElementById("setTeamName").value.trim(),budget=Number(document.getElementById("setBudget").value),membersRaw=document.getElementById("setMembers").value;if(teamName)state.settings.teamName=teamName;if(budget>0)state.settings.monthlyBudget=budget;if(membersRaw.trim())state.settings.members=membersRaw.split(",").map(m=>m.trim()).filter(Boolean);saveState();renderAll();document.getElementById("appTeamName").textContent=state.settings.teamName;showToast("Ayarlar kaydedildi","success");logActivity("Ayarlar güncellendi","info") });
}

function renderSettingsView(){
  const s=state.settings;
  const n=document.getElementById("setTeamName"),b=document.getElementById("setBudget"),m=document.getElementById("setMembers");
  if(n)n.value=s.teamName;if(b)b.value=s.monthlyBudget;if(m)m.value=s.members.join(", ");
  const tnEl=document.getElementById("appTeamName");if(tnEl)tnEl.textContent=s.teamName;
  const st=document.getElementById("shortcutsTable");
  if(st)st.innerHTML=`<thead><tr><th>Kisayol</th><th>Aksiyon</th></tr></thead><tbody>${shortcutsData.map(s=>`<tr><td><kbd class="kbd">${esc(s.keys)}</kbd></td><td style="font-size:13px">${esc(s.action)}</td></tr>`).join("")}</tbody>`;
  const fal=document.getElementById("fullActivityLog");
  if(fal){const logs=state.activityLog;fal.innerHTML=logs.length?`<div style="max-height:280px;overflow-y:auto">${logs.map(log=>`<div class="activity-item"><div class="activity-dot ${log.type}"></div><div style="flex:1"><div style="font-size:12px">${esc(log.message)}</div><div class="row-meta" style="font-size:11px">${fmt.dt(log.ts)}</div></div></div>`).join("")}</div>`:`<div class="empty-state">Henüz aksiyon logu yok.</div>`}
}

// ── THUMBNAIL ────────────────────────────────────────────────────────
function makeThumb(text,seed){
  const palettes=[["#00d4aa","#0a2a25"],["#6c8ef5","#0a1228"],["#ffd166","#2a1a00"],["#ff6b6b","#2a0808"],["#c77dff","#1a0828"],["#06d6a0","#001a12"],["#f72585","#180014"],["#4cc9f0","#001624"]];
  const[fg,bg]=palettes[(seed||1)%palettes.length],words=(text||"gorsel").split(" ").slice(0,2).join(" ");
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect width='320' height='180' fill='${bg}'/><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='${fg}' stop-opacity='.4'/><stop offset='100%' stop-color='transparent'/></linearGradient></defs><rect width='320' height='180' fill='url(#g)'/><text x='50%' y='46%' dominant-baseline='middle' text-anchor='middle' font-family='Inter,sans-serif' font-size='20' font-weight='800' fill='${fg}'>${words}</text><text x='50%' y='68%' dominant-baseline='middle' text-anchor='middle' font-family='Inter,sans-serif' font-size='11' fill='${fg}' opacity='.55'>Banana Studio</text></svg>`;
  return`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

