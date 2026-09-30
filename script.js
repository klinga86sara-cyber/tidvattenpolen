
"use strict";

/* =========================================================
   TIDVATTENPÖLEN v4.0 – REN VERSION
   En enda implementation per system.
   ========================================================= */

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const SAVE_KEY = "tidvattenpolen-v4-clean";

const screens = {
  start: $("#start-screen"),
  quiz: $("#quiz-screen"),
  game: $("#game-screen")
};

let state = null;
let questionIndex = 0;
let quizScores = {};
let timers = {};
let actionLocked = false;
let dragState = null;

const TRAITS = ["curious","playful","calm","social","clever","bold","careful","independent","persistent"];

const QUESTIONS = [
  {q:"Du hittar en mystisk låda på stranden. Vad gör du?",a:[
    ["Öppnar den direkt",{curious:2,bold:1}],
    ["Skakar den och försöker lista ut vad som finns i",{curious:1,careful:2}],
    ["Kollar om någon verkar ha tappat den",{social:2,careful:1}],
    ["Låter den vara",{calm:2,independent:1}]
  ]},
  {q:"Du har en helt ledig dag. Vad väljer du helst?",a:[
    ["Åker någonstans jag aldrig varit",{curious:2,bold:1}],
    ["Gör något roligt tillsammans med andra",{social:2,playful:1}],
    ["Bygger, skapar eller löser något",{curious:1,clever:2}],
    ["Stannar hemma och tar det lugnt",{calm:2,independent:1}]
  ]},
  {q:"Du fastnar på en riktigt svår nivå i ett spel. Vad gör du?",a:[
    ["Fortsätter tills jag klarar den",{persistent:2,bold:1}],
    ["Testar en helt ny taktik",{clever:2,playful:1}],
    ["Tar en paus och försöker senare",{calm:2,careful:1}],
    ["Ber någon om hjälp",{social:2,careful:1}]
  ]},
  {q:"Du hör ett konstigt ljud mitt i natten. Vad gör du?",a:[
    ["Går direkt och kollar",{bold:2,curious:1}],
    ["Lyssnar först och försöker förstå ljudet",{careful:2,clever:1}],
    ["Tänder lampan och undersöker försiktigt",{careful:2,bold:1}],
    ["Väntar och ser om det försvinner",{calm:2,independent:1}]
  ]},
  {q:"Du får en konstig pryl du aldrig sett förut. Vad gör du?",a:[
    ["Trycker på allt direkt",{playful:2,bold:1}],
    ["Undersöker den noggrant först",{curious:2,clever:1}],
    ["Frågar någon vad den används till",{social:2,careful:1}],
    ["Lägger undan den tills vidare",{calm:2,independent:1}]
  ]}
];

const PERSONALITY_COPY = {
  curious:["Nyfiken","Den vill undersöka nästan allt och kan överraska dig med egna små upptäckter."],
  playful:["Lekfull","Den gillar rörelse, leksaker och att hitta på bus."],
  calm:["Lugn","Den tycker om trygghet, mjuka rutiner och favoritplatser."],
  social:["Social","Den blir snabbt uppmärksam på dig och söker kontakt."],
  clever:["Klurig","Den älskar problem, burkar och saker att lösa."],
  bold:["Modig","Den tvekar sällan inför nya saker."],
  careful:["Försiktig","Den observerar först och agerar sedan."],
  independent:["Självständig","Den gillar att bestämma själv."],
  persistent:["Envis","När den försöker med något ger den sig inte lätt."]
};

const JEWELRY = [
  {name:"Guldhalsband med rubin",emoji:"📿",chain:"#d8b04a",gem:"#d74461"},
  {name:"Silverhalsband med safir",emoji:"📿",chain:"#c8d4da",gem:"#4b78d4"},
  {name:"Pärlhalsband",emoji:"📿",chain:"#fff6df",gem:"#fff9ec",pearl:true},
  {name:"Korallhalsband",emoji:"📿",chain:"#de7f78",gem:"#d74461"},
  {name:"Turkost halsband",emoji:"📿",chain:"#55c8c3",gem:"#49c4c1"},
  {name:"Halsband med smaragd",emoji:"📿",chain:"#d8b04a",gem:"#54a76b"},
  {name:"Halsband med ametist",emoji:"📿",chain:"#c8d4da",gem:"#8d62bd"},
  {name:"Liten amulett",emoji:"🧿",chain:"#d8b04a",gem:"#49c4c1"}
];

const THREAD_COLORS = [
  ["rosa","#d95b93"],["blå","#4789d6"],["grön","#4aa76c"],
  ["lila","#8b62c7"],["orange","#e8893d"],["gul","#d7b936"],["turkos","#3aaeb1"]
];

const BLOCKS = [
  ["Röd kloss","🟥"],["Blå kloss","🟦"],["Gul kloss","🟨"],
  ["Grön kloss","🟩"],["Lila kloss","🟪"],["Orange kloss","🟧"]
];

const BUILD_ITEMS = {
  kelp:{label:"Alger",emoji:"🌿",type:"kelp",unlock:"hello"},
  shell:{label:"Snäcka",emoji:"🐚",type:"shell",unlock:"sandScout"},
  ball:{label:"Boll",emoji:"🔵",type:"ball",unlock:"firstFind"},
  ring:{label:"Ring",emoji:"⭕",type:"ring",unlock:"explorer"},
  blocks:{label:"Färgade klossar",emoji:"🟥",type:"blocks",unlock:"ball"},
  wand:{label:"Trollstav",emoji:"🪄",type:"wand",unlock:"jar"}
};

const JARS = {
  basic:{label:"Enkel burk",emoji:"🫙",unlock:"ring"},
  color:{label:"Färgburk",emoji:"🩵",unlock:"jar"},
  pearl:{label:"Pärlburk",emoji:"🤍",unlock:"puzzler"},
  luxury:{label:"Lyxburk",emoji:"✨",unlock:"magic"}
};

const HOMES = {
  basic:{label:"Enkel koja",emoji:"🏠",unlock:null},
  shell:{label:"Snäckkoja",emoji:"🐚",unlock:"builder"},
  coral:{label:"Korallkoja",emoji:"🪸",unlock:"thread"},
  pearl:{label:"Pärlkoja",emoji:"🤍",unlock:"puzzler"},
  luxury:{label:"Lyxkoja",emoji:"✨",unlock:"magic"},
  palace:{label:"Palatskoja",emoji:"👑",unlock:"skilled"}
};

const QUESTS = [
  {id:"hello",stage:1,title:"Lär känna din bläckfisk",stat:"pet",goal:2,reward:"Alger"},
  {id:"sandScout",stage:1,title:"Vad finns i sanden?",stat:"dig",goal:1,reward:"Snäcka"},
  {id:"firstFind",stage:1,title:"Första skatten",stat:"found",goal:1,reward:"Boll",requires:["sandScout"]},
  {id:"explorer",stage:2,title:"Nyfiken upptäckare",stat:"inspect",goal:2,reward:"Ring",requires:["hello","firstFind"]},
  {id:"ball",stage:2,title:"Bolltalang",stat:"ball",goal:2,reward:"Klossar",requires:["explorer"]},
  {id:"ring",stage:3,title:"Ringakrobat",stat:"ring",goal:2,reward:"Enkel burk",requires:["ball"]},
  {id:"builder",stage:3,title:"Byggmästaren",stat:"tower",goal:1,reward:"Snäckkoja",requires:["ball"]},
  {id:"jar",stage:4,title:"Burkexperten",stat:"jar",goal:2,reward:"Färgburk",requires:["ring"]},
  {id:"thread",stage:4,title:"Trådmästaren",stat:"thread",goal:2,reward:"Korallkoja",requires:["builder"]},
  {id:"puzzler",stage:5,title:"Pusselvän",stat:"puzzle",goal:3,reward:"Pärlkoja",requires:["jar"]},
  {id:"magic",stage:5,title:"Lilla magikern",stat:"magic",goal:3,reward:"Lyxburk",requires:["jar"]},
  {id:"skilled",stage:6,title:"Snabblärd",stat:"skills",goal:5,reward:"Palatskoja",requires:["thread","puzzler"]},
  {id:"allround",stage:7,title:"Akvariets stjärna",stat:"completed",goal:10,reward:"🏆 Mästartrofé",requires:["skilled","magic"]}
];

const SKILLS = {
  ringSwim:{label:"Simma genom ring",need:2},
  ringHoop:{label:"Rocka med ring",need:3},
  ballThrow:{label:"Kasta boll",need:3},
  blockStack:{label:"Bygga torn",need:2},
  colorSort:{label:"Sortera färger",need:3},
  jarOpen:{label:"Öppna burk",need:2},
  dieThrow:{label:"Kasta tärning",need:2},
  threadPlay:{label:"Nysta upp tråd",need:2}
};

function clamp(v){ return Math.max(0,Math.min(100,v)); }
function uid(prefix="id"){ return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }
function delay(ms){ return new Promise(r=>setTimeout(r,ms)); }
function rand(a,b){ return a+Math.random()*(b-a); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function now(){ return Date.now(); }

function showOnly(name){
  Object.values(screens).forEach(s=>s.hidden=true);
  screens[name].hidden=false;
}
function save(){
  if(!state) return;
  state.lastPlayed=now();
  localStorage.setItem(SAVE_KEY,JSON.stringify(state));
}
function load(){
  try{return JSON.parse(localStorage.getItem(SAVE_KEY))}catch{return null}
}
function freshScores(){
  const o={}; TRAITS.forEach(t=>o[t]=0); return o;
}

function newState(name,primary,scores){
  const hidden={};
  TRAITS.forEach(t=>hidden[t]=Math.round(clamp(32+(scores[t]||0)*9+rand(-8,8))));
  return {
    version:4,
    name,
    bornAt:now(),
    lastPlayed:now(),
    primaryTrait:primary,
    hiddenTraits:hidden,
    needs:{hunger:82,energy:88,safety:80,stimulation:80,mood:84},
    trust:18,
    careMoments:0,
    placedItems:[],
    foundItems:[],
    foods:[],
    wornJewelry:null,
    jarStyle:null,
    homeStyle:null,
    puzzle:{placed:0,total:6},
    stats:{pet:0,dig:0,found:0,inspect:0,ball:0,ring:0,tower:0,jar:0,thread:0,puzzle:0,magic:0,skills:0,completed:0},
    doneQuests:{},
    skills:{},
    discoveredTraits:{},
    story:"Din lilla bläckfisk tittar försiktigt ut över sitt tomma akvarium.",
    questTab:"active",
    buildTab:"toys"
  };
}

function ensureState(){
  if(!state) return;
  state.placedItems ||= [];
  state.foundItems ||= [];
  state.foods ||= [];
  state.stats ||= {};
  ["pet","dig","found","inspect","ball","ring","tower","jar","thread","puzzle","magic","skills","completed"].forEach(k=>state.stats[k] ||= 0);
  state.doneQuests ||= {};
  state.skills ||= {};
  state.discoveredTraits ||= {};
  state.puzzle ||= {placed:0,total:6};
  state.needs ||= {hunger:82,energy:88,safety:80,stimulation:80,mood:84};
}

function story(text){
  if(!state) return;
  state.story=text;
  $("#story-text").textContent=text;
}
function toast(text){
  const e=$("#event-toast");
  e.textContent=text;
  e.classList.add("show");
  clearTimeout(timers.toast);
  timers.toast=setTimeout(()=>e.classList.remove("show"),2400);
}
function thought(text){
  const b=$("#thought-bubble");
  b.textContent=text;b.hidden=false;
  clearTimeout(timers.thought);
  timers.thought=setTimeout(()=>b.hidden=true,1700);
}

function setTime(){
  const h=new Date().getHours();
  $("#tank").className="tank "+(h>=7&&h<17?"day":h>=17&&h<21?"evening":"night");
}
function profile(){
  $("#pet-name-heading").textContent=state.name;
  $("#pet-name-needs").textContent=state.name;
  const d=new Date(state.bornAt);
  const days=Math.floor((now()-state.bornAt)/86400000);
  $("#birthday-text").textContent=d.toLocaleDateString("sv-SE",{day:"numeric",month:"long",year:"numeric"});
  $("#age-text").textContent=days?`${days} ${days===1?"dag":"dagar"} gammal`:"född idag";
  const stage=state.careMoments>=24||days>=14?"vuxen":state.careMoments>=12||days>=5?"ung":state.careMoments>=6||days>=2?"växande":"bebis";
  $("#stage-badge").textContent=stage;
  $("#octopus").dataset.s=stage==="bebis"?".54":stage==="växande"?".67":stage==="ung"?".8":".92";
}
function calcMood(){
  const n=state.needs;
  n.mood=clamp(n.hunger*.24+n.energy*.22+n.safety*.25+n.stimulation*.29);
}
function renderNeeds(){
  calcMood();
  const box=$("#needs-grid");box.replaceChildren();
  [["hunger","Mättnad"],["energy","Energi"],["safety","Trygghet"],["stimulation","Stimulans"],["mood","Humör"]].forEach(([k,l])=>{
    const el=document.createElement("div");el.className="need";
    el.innerHTML=`<div class="need-top"><span>${l}</span><strong>${Math.round(state.needs[k])}%</strong></div><div class="need-track"><div class="need-fill" style="width:${state.needs[k]}%"></div></div>`;
    box.append(el);
  });
  const m=state.needs.mood;
  $("#mood-label").textContent=m>=78?"Pigg och nöjd":m>=55?"Nyfiken men lite rastlös":m>=35?"Behöver dig":"Mår inte så bra just nu";
  $("#mood-face").textContent=m>=78?"⌣":m>=55?"◡":m>=35?"•︵•":"︵";
}

function octoXY(){
  const tank=$("#tank").getBoundingClientRect();
  const r=$("#octopus").getBoundingClientRect();
  return {x:((r.left+r.width/2-tank.left)/tank.width)*100,y:((r.top+r.height/2-tank.top)/tank.height)*100};
}
function moveOcto(x,y,z=.65,duration=850){
  const o=$("#octopus");
  const base=Number(o.dataset.s||.54);
  const scale=base*(.84+z*.36);
  o.style.transition=`left ${duration}ms ease, top ${duration}ms ease, transform ${duration}ms ease`;
  o.style.left=`${clamp(x)}%`;
  o.style.top=`${Math.max(10,Math.min(90,y))}%`;
  o.style.transform=`translate(-50%,-50%) scale(${scale})`;
  o.style.zIndex=Math.round(80+z*40);
}
async function approach(x,y,side=-1){
  moveOcto(x+side*7,y-7,.7,850);
  await delay(900);
}
function working(on=true){ $("#octopus").classList.toggle("v4-working",on); }

function ensureLayers(){
  let layer=$("#v4-action-layer");
  if(!layer){
    layer=document.createElement("div");
    layer.id="v4-action-layer";
    Object.assign(layer.style,{position:"absolute",inset:"0",pointerEvents:"none",zIndex:"300"});
    $("#tank").append(layer);
  }
  let menu=$("#v4-action-menu");
  if(!menu){
    menu=document.createElement("div");menu.id="v4-action-menu";menu.hidden=true;
    $("#tank").append(menu);
  }
}
function clearActionProps(){ $("#v4-action-layer")?.replaceChildren(); }

function itemEmoji(item){
  if(item.emoji) return item.emoji;
  return {kelp:"🌿",shell:"🐚",ball:"🔵",ring:"⭕",jar:"🫙",home:"🏠"}[item.type]||"❓";
}
function renderTank(){
  ensureLayers();
  const layer=$("#decor-layer");layer.replaceChildren();

  state.placedItems.forEach(item=>{
    const b=document.createElement("button");
    b.type="button";
    b.className=`v4-object v4-${item.type}`;
    b.dataset.id=item.id;b.dataset.kind="placed";
    b.style.left=`${item.x}%`;b.style.top=`${item.y}%`;
    b.innerHTML=`<span class="v4-emoji">${itemEmoji(item)}</span>`;
    layer.append(b);
  });

  state.foundItems.forEach(f=>{
    const b=document.createElement("button");
    b.type="button";
    b.className=`v4-object v4-found${f.kind==="block"?" v4-block":""}`;
    b.dataset.id=f.id;b.dataset.kind="found";
    b.style.left=`${f.x}%`;b.style.top=`${f.y}%`;
    b.innerHTML=`<span class="v4-emoji">${f.emoji}</span>`;
    layer.append(b);
  });

  renderFoods();
  renderJewelry();
  renderStatusPanel();
}
function renderFoods(){
  const layer=$("#food-layer");layer.replaceChildren();
  state.foods.forEach(food=>{
    const b=document.createElement("button");
    b.type="button";b.className="v4-food";
    b.dataset.foodId=food.id;
    b.style.left=`${food.x}%`;b.style.top=`${food.y}%`;
    b.textContent=food.emoji;
    layer.append(b);
  });
}
function renderJewelry(){
  $("#v4-necklace-svg")?.remove();
  if(!state.wornJewelry) return;
  const svg=$("#octopus .octopus-svg"); if(!svg) return;
  const ns="http://www.w3.org/2000/svg";
  const g=document.createElementNS(ns,"g");g.id="v4-necklace-svg";g.classList.add("v4-necklace");
  const hit=document.createElementNS(ns,"path");hit.setAttribute("d","M92 145 Q134 170 176 145");hit.classList.add("v4-necklace-hit");
  const chain=document.createElementNS(ns,"path");chain.setAttribute("d","M92 145 Q134 170 176 145");chain.classList.add("v4-necklace-chain");chain.setAttribute("stroke",state.wornJewelry.chain);
  if(state.wornJewelry.pearl){chain.setAttribute("stroke-dasharray","1 9");chain.setAttribute("stroke-width","7")}
  const gem=document.createElementNS(ns,"path");gem.setAttribute("d","M134 164 L142 174 L134 183 L126 174 Z");gem.classList.add("v4-necklace-gem");gem.setAttribute("fill",state.wornJewelry.gem);
  g.append(hit,chain,gem);svg.append(g);
  g.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();takeOffJewelry()});
}
function renderStatusPanel(){
  let panel=$("#v4-status-panel");
  if(!panel){
    panel=document.createElement("section");panel.id="v4-status-panel";panel.className="v4-status-panel";
    $(".story-card").append(panel);
  }
  const learned=Object.entries(state.skills).filter(([,v])=>v.unlocked).map(([k])=>SKILLS[k]?.label).filter(Boolean);
  panel.innerHTML=`<strong>Färdigheter</strong><div class="v4-chip-row">${learned.length?learned.map(x=>`<span class="v4-chip">${x}</span>`).join(""):`<span class="v4-small">Lär sig genom att undersöka och träna.</span>`}</div>`;
}

function startQuiz(){
  questionIndex=0;quizScores=freshScores();
  showOnly("quiz");$("#quiz-form").hidden=false;$("#quiz-result").hidden=true;renderQuestion();
}
function renderQuestion(){
  const q=QUESTIONS[questionIndex];
  $("#quiz-progress").textContent=`Fråga ${questionIndex+1} av ${QUESTIONS.length}`;
  $("#quiz-question").textContent=q.q;
  $("#quiz-options").replaceChildren();
  q.a.forEach(([txt,score])=>{
    const b=document.createElement("button");b.type="button";b.className="quiz-answer";b.textContent=txt;
    b.onclick=()=>{
      Object.entries(score).forEach(([k,v])=>quizScores[k]+=v);
      questionIndex++;
      questionIndex<QUESTIONS.length?renderQuestion():showQuizResult();
    };
    $("#quiz-options").append(b);
  });
}
function showQuizResult(){
  const weighted={};TRAITS.forEach(t=>weighted[t]=(quizScores[t]||0)+Math.random()*1.3);
  const primary=TRAITS.reduce((a,b)=>weighted[b]>weighted[a]?b:a);
  $("#quiz-form").hidden=true;$("#quiz-result").hidden=false;$("#quiz-result").dataset.p=primary;
  $("#personality-title").textContent=`Du har fått en ${PERSONALITY_COPY[primary][0].toLowerCase()} liten bläckfisk`;
  $("#personality-description").textContent=PERSONALITY_COPY[primary][1];
}
function createPet(){
  const name=$("#octopus-name").value.trim();
  if(!name){$("#name-error").textContent="Skriv ett namn först.";return}
  state=newState(name,$("#quiz-result").dataset.p,quizScores);
  save();enterGame();
}
function enterGame(){
  ensureState();showOnly("game");setTime();profile();renderNeeds();renderTank();renderQuests();renderBuildMenu();
  story(state.story);
  startLoops();
  clearTimeout(timers.continue);
  timers.continue=setTimeout(()=>$("#continue-dialog").showModal(),300000);
}
function resetPet(){
  if(!confirm("Vill du skapa en ny bläckfisk? Den nuvarande utvecklingen försvinner.")) return;
  localStorage.removeItem(SAVE_KEY);
  state=null;
  showOnly("start");
  $("#octopus-name").value="";
}

function questUnlocked(q){
  return (q.requires||[]).every(id=>state.doneQuests[id]);
}
function activeQuests(){
  const open=QUESTS.filter(q=>!state.doneQuests[q.id]&&questUnlocked(q));
  if(!open.length) return [];
  const stage=Math.min(...open.map(q=>q.stage));
  return open.filter(q=>q.stage===stage).slice(0,5);
}
function stat(key,inc=1){
  state.stats[key]=(state.stats[key]||0)+inc;
  checkQuests();save();
}
function checkQuests(){
  state.stats.skills=Object.values(state.skills).filter(s=>s.unlocked).length;
  let changed=true;
  while(changed){
    changed=false;
    for(const q of QUESTS){
      if(state.doneQuests[q.id]||!questUnlocked(q)) continue;
      if((state.stats[q.stat]||0)>=q.goal){
        state.doneQuests[q.id]=true;
        state.stats.completed=Object.values(state.doneQuests).filter(Boolean).length;
        toast(`Uppdrag klart: ${q.title} – ${q.reward}`);
        story(`${state.name} klarade "${q.title}" och låste upp ${q.reward}.`);
        if(q.id==="allround" && !state.foundItems.some(f=>f.name==="Mästartrofé")){
          addFound({name:"Mästartrofé",emoji:"🏆",kind:"odd",x:72,y:78},false);
        }
        changed=true;
      }
    }
  }
  renderQuests();renderBuildMenu();
}
function renderQuests(){
  const list=$("#quests-list"); if(!list) return;
  let tabs=$(".v4-quest-tabs",$("#quests-dialog"));
  if(!tabs){
    tabs=document.createElement("div");tabs.className="v4-quest-tabs";
    tabs.innerHTML=`<button data-tab="active">Aktiva</button><button data-tab="done">Färdiga</button><button data-tab="locked">Låsta</button>`;
    list.before(tabs);
    tabs.onclick=e=>{const b=e.target.closest("button[data-tab]");if(!b)return;state.questTab=b.dataset.tab;save();renderQuests()};
  }
  $$("button",tabs).forEach(b=>b.classList.toggle("active",b.dataset.tab===state.questTab));
  list.replaceChildren();
  let qs=state.questTab==="done"?QUESTS.filter(q=>state.doneQuests[q.id]):
         state.questTab==="locked"?QUESTS.filter(q=>!state.doneQuests[q.id]&&!questUnlocked(q)):
         activeQuests();
  qs.slice(0,7).forEach(q=>{
    const d=document.createElement("div");d.className=`v4-quest-card ${state.doneQuests[q.id]?"v4-done":""} ${!questUnlocked(q)&&!state.doneQuests[q.id]?"v4-locked":""}`;
    const val=Math.min(q.goal,state.stats[q.stat]||0);
    d.innerHTML=`<div>${state.doneQuests[q.id]?"✓":"🎯"}</div><div><strong class="v4-qtitle">${q.title}</strong><div class="v4-small">Belöning: ${q.reward}</div>${!questUnlocked(q)?`<div class="v4-small">Kräver: ${(q.requires||[]).map(id=>QUESTS.find(x=>x.id===id)?.title).join(", ")}</div>`:""}</div><div>${state.doneQuests[q.id]?"Klar":questUnlocked(q)?`${val}/${q.goal}`:"Låst"}</div>`;
    list.append(d);
  });
  $("#quest-badge").textContent=activeQuests().length;
}

function unlockedByQuest(id){ return !id || !!state.doneQuests[id]; }
function buildCard(icon,name,info,disabled,onClick){
  const d=document.createElement("div");d.className=`v4-build-card${disabled?" v4-locked":""}`;
  d.innerHTML=`<div style="font-size:28px">${icon}</div><div><strong>${name}</strong><div class="v4-small">${info}</div></div>`;
  const b=document.createElement("button");b.type="button";b.textContent=disabled?"Låst":"Välj";b.disabled=disabled;
  if(!disabled)b.onclick=onClick;d.append(b);return d;
}
function renderBuildMenu(){
  const grid=$("#inventory-grid"); if(!grid) return;
  let tabs=$(".v4-build-tabs",$("#inventory-dialog"));
  if(!tabs){
    tabs=document.createElement("div");tabs.className="v4-build-tabs";
    tabs.innerHTML=`<button data-tab="toys">Leksaker & saker</button><button data-tab="jars">Burkar</button><button data-tab="homes">Hem</button>`;
    grid.before(tabs);
    tabs.onclick=e=>{const b=e.target.closest("button[data-tab]");if(!b)return;state.buildTab=b.dataset.tab;save();renderBuildMenu()};
  }
  $$("button",tabs).forEach(b=>b.classList.toggle("active",b.dataset.tab===state.buildTab));
  grid.replaceChildren();

  if(state.buildTab==="toys"){
    Object.entries(BUILD_ITEMS).forEach(([key,d])=>{
      const ok=unlockedByQuest(d.unlock);
      grid.append(buildCard(d.emoji,d.label,ok?"Placera i akvariet":`Lås upp genom uppdrag`,!ok,()=>placeBuildItem(key,d)));
    });
  }else if(state.buildTab==="jars"){
    Object.entries(JARS).forEach(([key,d])=>{
      const ok=unlockedByQuest(d.unlock), current=state.jarStyle===key&&state.placedItems.some(x=>x.type==="jar");
      grid.append(buildCard(d.emoji,d.label,current?"Används nu":ok?"Ersätter nuvarande burk":"Inte upplåst ännu",!ok||current,()=>replaceJar(key,d)));
    });
  }else{
    Object.entries(HOMES).forEach(([key,d])=>{
      const ok=unlockedByQuest(d.unlock), current=state.homeStyle===key&&state.placedItems.some(x=>x.type==="home");
      grid.append(buildCard(d.emoji,d.label,current?"Används nu":ok?"Ersätter nuvarande hem":"Inte upplåst ännu",!ok||current,()=>replaceHome(key,d)));
    });
  }
}
function placeBuildItem(key,d){
  if(d.type==="blocks"){
    for(let i=0;i<6;i++){const [name,emoji]=pick(BLOCKS);addFound({name,emoji,kind:"block",x:32+i*7,y:78+Math.floor(i/3)*5},false)}
  }else if(d.type==="wand"){
    if(!state.foundItems.some(f=>f.type==="wand"))addFound({name:"Trollstav",emoji:"🪄",kind:"odd",type:"wand",x:55,y:78},false);
  }else{
    if(state.placedItems.some(p=>p.type===d.type)){toast(`${d.label} finns redan i akvariet.`);return}
    state.placedItems.push({id:uid(d.type),type:d.type,emoji:d.emoji,x:rand(28,72),y:rand(68,84)});
  }
  save();renderTank();$("#inventory-dialog").close();
}
function replaceJar(key,d){
  state.placedItems=state.placedItems.filter(p=>p.type!=="jar");
  state.jarStyle=key;
  state.placedItems.push({id:uid("jar"),type:"jar",emoji:d.emoji,x:58,y:78,contents:randomJarReward()});
  save();renderTank();$("#inventory-dialog").close();
}
function replaceHome(key,d){
  const old=state.placedItems.find(p=>p.type==="home");
  const x=old?.x??56,y=old?.y??79;
  state.placedItems=state.placedItems.filter(p=>p.type!=="home");
  state.homeStyle=key;
  state.placedItems.push({id:uid("home"),type:"home",emoji:d.emoji,x,y});
  save();renderTank();$("#inventory-dialog").close();
}

function addFound(f,count=true){
  f.id ||= uid("found");
  f.x ??= rand(20,80);f.y ??= rand(72,88);
  state.foundItems.push(f);
  if(count){state.stats.found++;checkQuests()}
  save();renderTank();return f;
}
function removeFound(id){state.foundItems=state.foundItems.filter(f=>f.id!==id);save();renderTank()}
function randomDigFind(){
  const options=[
    ()=>({name:"Mynt",emoji:"🪙",kind:"odd",type:"coin"}),
    ()=>({name:"Nyckel",emoji:"🔑",kind:"odd",type:"key"}),
    ()=>({name:"Pusselbit",emoji:"🧩",kind:"odd",type:"puzzle-piece"}),
    ()=>({name:"Tärning",emoji:"🎲",kind:"odd",type:"die"}),
    ()=>({name:"Glittrande sten",emoji:"💎",kind:"odd",type:"gem"}),
    ()=>{const [n,c]=pick(THREAD_COLORS);return {name:`${n[0].toUpperCase()+n.slice(1)} tråd`,emoji:"🧵",kind:"odd",type:"thread",threadColor:c}},
    ()=>{const j={...pick(JEWELRY)};return {...j,kind:"odd",type:"jewelry"}},
    ()=>({name:"Bjällra",emoji:"🔔",kind:"odd",type:"bell"})
  ];
  if(!state.foundItems.some(f=>f.type==="mirror")) options.push(()=>({name:"Spegel",emoji:"🪞",kind:"odd",type:"mirror"}));
  return pick(options)();
}
async function digAt(x,y){
  if(actionLocked)return;
  actionLocked=true;working(true);
  await approach(x,y,-1);
  story(`${state.name} gräver på platsen du klickade på.`);
  thought("Vad finns här?");
  await delay(900);
  const f=randomDigFind();f.x=x;f.y=y;
  addFound(f,true);stat("dig",1);
  story(`${state.name} hittade ${f.name.toLowerCase()} i sanden.`);
  working(false);actionLocked=false;
}

function openActionMenu(title,actions,x,y){
  ensureLayers();
  const menu=$("#v4-action-menu");menu.hidden=false;
  menu.style.left=`${Math.max(12,Math.min(78,x))}%`;menu.style.top=`${Math.max(12,Math.min(76,y-8))}%`;
  menu.innerHTML=`<strong>${title}</strong>`;
  actions.forEach(a=>{const b=document.createElement("button");b.type="button";b.textContent=a.label;b.onclick=()=>{menu.hidden=true;a.run()};menu.append(b)});
}
function closeActionMenu(){const m=$("#v4-action-menu");if(m)m.hidden=true}

function actionsForPlaced(item){
  if(item.type==="ball") return [
    {label:"⚽ Putta bollen",run:()=>pushBall(item)},
    {label:"🐙 Kasta bollen",run:()=>throwBall(item)},
    {label:"🔎 Undersök",run:()=>inspectPlaced(item)}
  ];
  if(item.type==="ring") return [
    {label:"🌊 Simma genom hålet",run:()=>swimRing(item)},
    {label:"⭕ Rocka med ringen",run:()=>hoopRing(item)},
    {label:"🔎 Undersök",run:()=>inspectPlaced(item)}
  ];
  if(item.type==="kelp") return [
    {label:"🌿 Dra i algerna",run:()=>pullKelp(item)},
    {label:"🙈 Göm dig i algerna",run:()=>hideKelp(item)},
    {label:"🔎 Undersök",run:()=>inspectPlaced(item)}
  ];
  if(item.type==="shell") return [
    {label:"🐚 Kryp in i snäckan",run:()=>enterShell(item)},
    {label:"🔎 Undersök öppningen",run:()=>inspectPlaced(item)}
  ];
  if(item.type==="jar") return [
    {label:"🫙 Öppna burken",run:()=>openJar(item)},
    {label:"🔎 Undersök burken",run:()=>inspectPlaced(item)}
  ];
  if(item.type==="home") return [
    {label:"🏠 Kryp in",run:()=>enterHome(item)},
    {label:"😴 Vila",run:()=>restHome(item)},
    {label:"🔎 Undersök",run:()=>inspectPlaced(item)}
  ];
  return [{label:"🔎 Undersök",run:()=>inspectPlaced(item)}];
}
function actionsForFound(f){
  if(f.kind==="block") return [
    {label:"🏗️ Samla alla & bygg torn",run:()=>buildTower(f)},
    {label:"🎨 Sortera färger",run:()=>sortBlocks()},
    {label:"🔎 Undersök",run:()=>inspectFound(f)}
  ];
  switch(f.type){
    case "mirror": return [{label:"🪞 Titta i spegeln",run:()=>useMirror(f)},{label:"🔎 Undersök",run:()=>inspectFound(f)}];
    case "jewelry": return [{label:"📿 Ta på smycket",run:()=>wearJewelry(f)},{label:"🔎 Undersök",run:()=>inspectFound(f)}];
    case "thread": return [{label:"🧵 Dra upp tråden",run:()=>unravelThread(f)},{label:"🔎 Undersök",run:()=>inspectFound(f)}];
    case "die": return [{label:"🎲 Kasta tärningen",run:()=>throwFound(f,"die")},{label:"🔎 Undersök",run:()=>inspectFound(f)}];
    case "coin": return [{label:"🪙 Kasta myntet",run:()=>throwFound(f,"coin")},{label:"🔎 Undersök",run:()=>inspectFound(f)}];
    case "puzzle-piece": return [{label:"🧩 Lägg pusslet",run:()=>placePuzzlePiece(f)},{label:"🔎 Undersök",run:()=>inspectFound(f)}];
    case "wand": return [{label:"✨ Trolla",run:()=>magic(f)},{label:"🔎 Undersök",run:()=>inspectFound(f)}];
    case "bell": return [{label:"🔔 Skaka bjällran",run:()=>shakeBell(f)},{label:"🔎 Undersök",run:()=>inspectFound(f)}];
    case "key": return [{label:"🔑 Prova nyckeln",run:()=>tryKey(f)},{label:"🔎 Undersök",run:()=>inspectFound(f)}];
    default: return [{label:"🔎 Undersök",run:()=>inspectFound(f)}];
  }
}

async function inspectPlaced(item){
  if(actionLocked)return;actionLocked=true;working(true);
  await approach(item.x,item.y,-1);story(`${state.name} undersöker ${labelFor(item).toLowerCase()} med armarna.`);
  await delay(1200);stat("inspect",1);working(false);actionLocked=false;
}
async function inspectFound(f){
  if(actionLocked)return;actionLocked=true;working(true);
  await approach(f.x,f.y,-1);story(`${state.name} plockar upp ${f.name.toLowerCase()} och undersöker den.`);
  await delay(1200);stat("inspect",1);working(false);actionLocked=false;
}
function labelFor(item){
  return {ball:"Bollen",ring:"Ringen",kelp:"Algerna",shell:"Snäckan",jar:"Burken",home:"Kojan"}[item.type]||"Föremålet";
}

function makeProp(emoji,x,y,cls="v4-prop-emoji"){
  const p=document.createElement("div");p.className=`v4-prop ${cls}`;p.textContent=emoji;p.style.left=`${x}%`;p.style.top=`${y}%`;$("#v4-action-layer").append(p);return p;
}
function hideRendered(kind,id){
  const el=$(`.v4-object[data-kind="${kind}"][data-id="${id}"]`);if(el)el.style.visibility="hidden";
}
function updatePlaced(item,x,y){item.x=x;item.y=y;save()}
function updateFound(f,x,y){f.x=x;f.y=y;save()}

async function pushBall(item){
  if(actionLocked)return;actionLocked=true;working(true);
  const dir=item.x<55?1:-1, start={x:item.x,y:item.y}, end={x:Math.max(8,Math.min(92,item.x+dir*20)),y:Math.min(90,item.y+3)};
  await approach(start.x,start.y,-dir);
  hideRendered("placed",item.id);const ball=makeProp(item.emoji||"🔵",start.x,start.y);
  story(`${state.name} lägger en arm mot bollen.`);
  await delay(650);
  ball.style.left=`${start.x+dir*9}%`;ball.style.transform="translate(-50%,-50%) rotate(240deg)";
  moveOcto(start.x+dir*2,start.y-7,.7,650);await delay(700);
  ball.style.left=`${end.x}%`;ball.style.top=`${end.y}%`;ball.style.transform="translate(-50%,-50%) rotate(620deg)";
  moveOcto(end.x-dir*7,end.y-7,.7,650);story(`${state.name} följer efter och puttar bollen.`);
  await delay(750);updatePlaced(item,end.x,end.y);clearActionProps();renderTank();stat("ball",1);
  working(false);actionLocked=false;
}
async function throwBall(item){
  if(actionLocked)return;actionLocked=true;working(true);
  const dir=item.x<55?1:-1,start={x:item.x,y:item.y},end={x:Math.max(8,Math.min(92,item.x+dir*26)),y:Math.min(90,item.y+4)};
  await approach(start.x,start.y,-dir);
  story(`${state.name} står bredvid bollen och tar upp den med armarna.`);
  hideRendered("placed",item.id);const ball=makeProp(item.emoji||"🔵",start.x,start.y);
  await delay(650);const q=octoXY();ball.style.left=`${q.x+dir*3}%`;ball.style.top=`${q.y+7}%`;await delay(650);
  story(`${state.name} kastar bollen från platsen där den står.`);
  ball.style.left=`${end.x}%`;ball.style.top=`${Math.max(32,end.y-20)}%`;ball.style.transform="translate(-50%,-50%) rotate(600deg)";
  await delay(750);ball.style.top=`${end.y}%`;ball.style.transform="translate(-50%,-50%) rotate(980deg)";await delay(650);
  updatePlaced(item,end.x,end.y);clearActionProps();renderTank();learn("ballThrow");stat("ball",1);
  moveOcto(end.x-dir*7,end.y-7,.68,700);working(false);actionLocked=false;
}
async function swimRing(item){
  if(actionLocked)return;actionLocked=true;working(true);
  await approach(item.x,item.y,-1);
  hideRendered("placed",item.id);
  const stage=document.createElement("div");stage.className="v4-prop v4-ring";stage.style.left=`${item.x}%`;stage.style.top=`${item.y}%`;
  stage.innerHTML=`<div class="v4-ring-back"></div><div class="v4-ring-front"></div>`;$("#v4-action-layer").append(stage);
  story(`${state.name} sticker armarna genom själva hålet.`);
  moveOcto(item.x-12,item.y,.55,700);await delay(750);
  $("#octopus").classList.add("v4-squeeze");moveOcto(item.x,item.y,.42,850);story(`${state.name} pressar kroppen genom ringens öppning.`);await delay(900);
  moveOcto(item.x+12,item.y,.58,850);await delay(900);
  $("#octopus").classList.remove("v4-squeeze");moveOcto(item.x+24,item.y-2,.7,750);
  story(`${state.name} kommer helt ut på andra sidan av ringen.`);
  await delay(700);clearActionProps();renderTank();learn("ringSwim");stat("ring",1);working(false);actionLocked=false;
}
async function hoopRing(item){
  if(actionLocked)return;actionLocked=true;working(true);await approach(item.x,item.y,-1);
  hideRendered("placed",item.id);const ring=document.createElement("div");ring.className="v4-prop v4-ring";ring.style.left=`${item.x}%`;ring.style.top=`${item.y}%`;$("#v4-action-layer").append(ring);
  const q=octoXY();ring.style.left=`${q.x}%`;ring.style.top=`${q.y+7}%`;story(`${state.name} trär ringen runt kroppen.`);
  await delay(700);
  for(let i=0;i<4;i++){ring.style.transform=`translate(-50%,-50%) rotate(${i*180+180}deg) scaleX(${i%2?.5:1})`;await delay(430)}
  story(`${state.name} rockar ringen runt kroppen.`);await delay(500);clearActionProps();renderTank();learn("ringHoop");stat("ring",1);working(false);actionLocked=false;
}
async function pullKelp(item){
  if(actionLocked)return;actionLocked=true;working(true);await approach(item.x,item.y,-1);
  hideRendered("placed",item.id);const p=makeProp("🌿",item.x,item.y);story(`${state.name} tar tag i algerna med flera armar.`);
  for(let i=0;i<4;i++){p.style.transform=`translate(-50%,-50%) rotate(${i%2?-18:18}deg) scaleY(${i%2?.9:1.08})`;await delay(420)}
  story(`${state.name} släpper algerna igen.`);clearActionProps();renderTank();working(false);actionLocked=false;
}
async function hideKelp(item){
  if(actionLocked)return;actionLocked=true;await approach(item.x,item.y,-1);story(`${state.name} slingrar sig in mellan algerna och gömmer sig.`);moveOcto(item.x,item.y,.35,700);await delay(1800);moveOcto(item.x+10,item.y-6,.65,700);actionLocked=false;
}
async function enterShell(item){
  if(actionLocked)return;actionLocked=true;working(true);await approach(item.x,item.y,-1);story(`${state.name} känner på öppningen och kryper in i snäckan.`);
  $("#octopus").style.opacity=".12";moveOcto(item.x,item.y,.25,650);await delay(1900);$("#octopus").style.opacity="1";moveOcto(item.x+10,item.y-6,.62,650);story(`${state.name} kommer ut igen.`);working(false);actionLocked=false;
}
async function enterHome(item){
  if(actionLocked)return;actionLocked=true;await approach(item.x,item.y,-1);story(`${state.name} kryper in i sitt hem.`);$("#octopus").style.opacity=".12";moveOcto(item.x,item.y,.25,650);await delay(1900);$("#octopus").style.opacity="1";moveOcto(item.x+10,item.y-5,.6,650);actionLocked=false;
}
async function restHome(item){
  if(actionLocked)return;actionLocked=true;await approach(item.x,item.y,-1);story(`${state.name} kryper in och vilar.`);$("#octopus").style.opacity=".12";moveOcto(item.x,item.y,.22,650);
  for(let i=0;i<4;i++){await delay(700);state.needs.energy=clamp(state.needs.energy+7);state.needs.safety=clamp(state.needs.safety+3);renderNeeds()}
  $("#octopus").style.opacity="1";moveOcto(item.x+10,item.y-5,.6,650);save();actionLocked=false;
}
function randomJarReward(){
  const p=pick([
    {name:"Pusselbit",emoji:"🧩",kind:"odd",type:"puzzle-piece"},
    {name:"Tärning",emoji:"🎲",kind:"odd",type:"die"},
    {name:"Mynt",emoji:"🪙",kind:"odd",type:"coin"},
    {name:"Glittrande sten",emoji:"💎",kind:"odd",type:"gem"},
    (()=>{const [n,e]=pick(BLOCKS);return{name:n,emoji:e,kind:"block"}})()
  ]);
  return p;
}
async function openJar(item){
  if(actionLocked)return;actionLocked=true;working(true);await approach(item.x,item.y,-1);
  hideRendered("placed",item.id);
  const jar=document.createElement("div");jar.className="v4-prop v4-jar-visual";jar.style.left=`${item.x}%`;jar.style.top=`${item.y}%`;
  const reward=item.contents||randomJarReward();jar.innerHTML=`<div class="v4-jar-lid"></div><div class="v4-jar-content">${reward.emoji}</div>`;$("#v4-action-layer").append(jar);
  story(`${state.name} håller burken med flera armar och arbetar med locket.`);await delay(900);
  $(".v4-jar-lid",jar).classList.add("open");story(`Locket lossnar.`);await delay(700);
  const q=octoXY();
  const a1=document.createElement("div"),a2=document.createElement("div");a1.className=a2.className="v4-jar-arm";
  Object.assign(a1.style,{left:`${q.x+2}%`,top:`${q.y+5}%`,width:"12px",transform:"rotate(8deg)"});
  Object.assign(a2.style,{left:`${q.x+2}%`,top:`${q.y+8}%`,width:"12px",transform:"rotate(-4deg)"});
  $("#v4-action-layer").append(a1,a2);await delay(80);a1.style.width="84px";a2.style.width="80px";
  story(`${state.name} kör ner två armar i burken.`);await delay(850);
  const prop=makeProp(reward.emoji,item.x,item.y);const q2=octoXY();prop.style.left=`${q2.x+5}%`;prop.style.top=`${q2.y+7}%`;$(".v4-jar-content",jar).style.opacity="0";
  story(`${state.name} drar upp ${reward.name.toLowerCase()} ur burken.`);await delay(800);
  const dropX=Math.min(92,item.x+13),dropY=Math.min(91,item.y+7);prop.style.left=`${dropX}%`;prop.style.top=`${dropY}%`;await delay(650);
  addFound({...reward,x:dropX,y:dropY},true);item.contents=randomJarReward();clearActionProps();renderTank();learn("jarOpen");stat("jar",1);working(false);actionLocked=false;
}

async function buildTower(clicked){
  if(actionLocked)return;
  const blocks=state.foundItems.filter(f=>f.kind==="block");if(blocks.length<2){toast("Det behövs minst två klossar.");return}
  actionLocked=true;working(true);const buildX=clicked.x,buildY=clicked.y;
  story(`${state.name} ska samla ihop alla klossar själv.`);
  const props=new Map();
  blocks.forEach(b=>{hideRendered("found",b.id);props.set(b.id,makeProp(b.emoji,b.x,b.y))});
  for(const b of blocks){
    await approach(b.x,b.y,-1);const p=props.get(b.id);const q=octoXY();p.style.left=`${q.x+4}%`;p.style.top=`${q.y+7}%`;await delay(450);
    moveOcto(buildX-7,buildY-7,.7,650);p.style.left=`${buildX+rand(-6,6)}%`;p.style.top=`${buildY+rand(0,5)}%`;await delay(700);
  }
  story(`${state.name} står kvar vid högen och bygger tornet.`);
  moveOcto(buildX-8,buildY-8,.72,500);
  const tower=blocks.slice(0,Math.min(6,blocks.length));
  for(let i=0;i<tower.length;i++){const b=tower[i],p=props.get(b.id);p.style.left=`${buildX}%`;p.style.top=`${buildY-i*5}%`;await delay(550);b.x=buildX;b.y=buildY-i*5}
  blocks.slice(tower.length).forEach((b,i)=>{b.x=buildX+14+(i%2)*7;b.y=buildY+Math.floor(i/2)*5});
  save();clearActionProps();renderTank();learn("blockStack");stat("tower",1);working(false);actionLocked=false;
}
async function sortBlocks(){
  const blocks=state.foundItems.filter(f=>f.kind==="block");if(!blocks.length)return;
  if(actionLocked)return;actionLocked=true;working(true);
  const cx=50,cy=80;story(`${state.name} samlar klossarna och sorterar dem efter färg.`);
  for(let i=0;i<blocks.length;i++){const b=blocks[i];await approach(b.x,b.y,-1);b.x=cx+(i%6-2.5)*7;b.y=cy+Math.floor(i/6)*6}
  save();renderTank();learn("colorSort");working(false);actionLocked=false;
}
async function useMirror(f){
  if(actionLocked)return;actionLocked=true;working(true);await approach(f.x,f.y,-1);hideRendered("found",f.id);
  const m=document.createElement("div");m.className="v4-prop v4-mirror";m.style.left=`${f.x}%`;m.style.top=`${f.y}%`;m.innerHTML=`<div class="v4-reflection"></div>`;$("#v4-action-layer").append(m);
  const q=octoXY();m.style.left=`${q.x+7}%`;m.style.top=`${q.y+3}%`;story(`${state.name} håller spegeln framför ansiktet och ser sin egen spegelbild.`);await delay(1800);
  clearActionProps();renderTank();working(false);actionLocked=false;
}
async function wearJewelry(f){
  if(actionLocked)return;actionLocked=true;working(true);await approach(f.x,f.y,-1);story(`${state.name} tar upp ${f.name.toLowerCase()} och för det runt halsområdet.`);await delay(850);
  state.wornJewelry={name:f.name,emoji:f.emoji,chain:f.chain,gem:f.gem,pearl:f.pearl};removeFound(f.id);renderJewelry();story(`${state.name} bär nu ${f.name.toLowerCase()} runt halsen.`);working(false);actionLocked=false;save();
}
function takeOffJewelry(){
  if(!state.wornJewelry)return;const j=state.wornJewelry,q=octoXY();state.wornJewelry=null;
  addFound({...j,kind:"odd",type:"jewelry",x:Math.min(92,q.x+10),y:Math.min(90,q.y+10)},false);story(`${state.name} tar av sig smycket och lägger det på sanden.`);save();renderTank();
}
async function unravelThread(f){
  if(actionLocked)return;actionLocked=true;working(true);await approach(f.x,f.y,-1);hideRendered("found",f.id);
  const ball=document.createElement("div");ball.className="v4-prop v4-thread-ball";ball.style.setProperty("--thread",f.threadColor||"#d95b93");ball.style.left=`${f.x}%`;ball.style.top=`${f.y}%`;
  const line=document.createElement("div");line.className="v4-thread-line";line.style.setProperty("--thread",f.threadColor||"#d95b93");line.style.left="50%";line.style.top="50%";line.style.width="8px";ball.append(line);$("#v4-action-layer").append(ball);
  const events=["en stor ögla bildas","nystanet rullar över sanden","tråden fastnar kring en arm","den byter arm och drar åt andra hållet","tråden sträcks långt över sanden"];
  for(let i=0;i<5;i++){line.style.width=`${45+i*38}px`;ball.style.transform=`translate(-50%,-50%) rotate(${i*70}deg) scale(${1-i*.12})`;story(`${state.name} drar i tråden – ${pick(events)}.`);await delay(700)}
  story(`${state.name} har nystat upp nästan hela tråden.`);await delay(500);clearActionProps();renderTank();learn("threadPlay");stat("thread",1);working(false);actionLocked=false;
}
async function throwFound(f,kind){
  if(actionLocked)return;actionLocked=true;working(true);await approach(f.x,f.y,-1);hideRendered("found",f.id);const p=makeProp(f.emoji,f.x,f.y);
  const q=octoXY();p.style.left=`${q.x+4}%`;p.style.top=`${q.y+7}%`;await delay(600);
  const dir=f.x<55?1:-1,endX=Math.max(8,Math.min(92,f.x+dir*24)),endY=Math.min(90,f.y+3);
  p.style.left=`${endX}%`;p.style.top=`${Math.max(35,endY-20)}%`;p.style.transform="translate(-50%,-50%) rotate(720deg)";story(`${state.name} kastar ${kind==="die"?"tärningen":"myntet"}.`);
  await delay(700);p.style.top=`${endY}%`;await delay(600);updateFound(f,endX,endY);clearActionProps();renderTank();if(kind==="die")learn("dieThrow");working(false);actionLocked=false;
}
function ensurePuzzleBoard(){
  let b=$("#v4-puzzle-board");
  if(b)return b;
  b=document.createElement("div");b.id="v4-puzzle-board";
  Object.assign(b.style,{position:"absolute",left:"58%",top:"70%",width:"180px",height:"120px",transform:"translate(-50%,-50%)",zIndex:"60",border:"6px solid #7d5a43",borderRadius:"12px",background:"linear-gradient(#a8dfe7 0 60%,#d6bc7a 60%)",overflow:"hidden"});
  $("#tank").append(b);return b;
}
function renderPuzzleBoard(){
  $("#v4-puzzle-board")?.remove();
  if(!state.puzzle.placed)return;
  const b=ensurePuzzleBoard();
  b.innerHTML=`<div style="position:absolute;left:15px;top:18px;font-size:34px">🐠</div><div style="position:absolute;right:18px;top:14px;font-size:28px">☀️</div><div style="position:absolute;left:65px;bottom:12px;font-size:36px">🪸</div>`;
  for(let i=state.puzzle.placed;i<state.puzzle.total;i++){const c=document.createElement("div");Object.assign(c.style,{position:"absolute",left:`${(i%3)*33.33}%`,top:`${Math.floor(i/3)*50}%`,width:"33.33%",height:"50%",background:"#d5bb84",border:"1px solid rgba(0,0,0,.16)"});b.append(c)}
}
async function placePuzzlePiece(f){
  if(actionLocked)return;actionLocked=true;working(true);await approach(f.x,f.y,-1);hideRendered("found",f.id);const p=makeProp("🧩",f.x,f.y);const b=ensurePuzzleBoard();const br=b.getBoundingClientRect(),tr=$("#tank").getBoundingClientRect();const bx=((br.left+br.width/2-tr.left)/tr.width)*100,by=((br.top+br.height/2-tr.top)/tr.height)*100;
  p.style.left=`${bx}%`;p.style.top=`${by}%`;moveOcto(bx-8,by,.7,750);story(`${state.name} bär pusselbiten till pusslet och passar in den.`);await delay(950);
  removeFound(f.id);state.puzzle.placed=Math.min(state.puzzle.total,state.puzzle.placed+1);renderPuzzleBoard();stat("puzzle",1);working(false);actionLocked=false;save();
}
async function magic(f){
  if(actionLocked)return;actionLocked=true;working(true);await approach(f.x,f.y,-1);story(`${state.name} tar trollstaven och trollar.`);
  const objects=$$(".v4-object");const effect=pick(["float","big","small","color","sparkle"]);
  if(effect==="float")objects.slice(0,5).forEach(el=>el.style.transform="translate(-50%,-70%)");
  if(effect==="big")objects.slice(0,5).forEach(el=>el.style.transform="translate(-50%,-50%) scale(1.45)");
  if(effect==="small")objects.slice(0,5).forEach(el=>el.style.transform="translate(-50%,-50%) scale(.6)");
  if(effect==="color")objects.slice(0,5).forEach((el,i)=>el.style.filter=`hue-rotate(${80+i*50}deg)`);
  if(effect==="sparkle"){for(let i=0;i<10;i++)makeProp("✨",rand(10,90),rand(30,82))}
  await delay(2100);renderTank();clearActionProps();story("Trollningen försvinner och allt återgår till normalt.");stat("magic",1);working(false);actionLocked=false;
}
async function shakeBell(f){
  if(actionLocked)return;actionLocked=true;working(true);await approach(f.x,f.y,-1);hideRendered("found",f.id);const p=makeProp("🔔",f.x,f.y);const q=octoXY();p.style.left=`${q.x+5}%`;p.style.top=`${q.y+6}%`;
  for(let i=0;i<5;i++){p.style.transform=`translate(-50%,-50%) rotate(${i%2?-25:25}deg)`;await delay(250)}story(`${state.name} skakar bjällran och lyssnar.`);await delay(500);clearActionProps();renderTank();working(false);actionLocked=false;
}
async function tryKey(f){
  if(actionLocked)return;actionLocked=true;working(true);await approach(f.x,f.y,-1);story(`${state.name} plockar upp nyckeln och provar den mot olika saker i närheten.`);await delay(1300);working(false);actionLocked=false;
}

function learn(key){
  const def=SKILLS[key];if(!def)return;
  const s=state.skills[key] ||= {xp:0,unlocked:false};
  if(s.unlocked)return;
  s.xp++;
  if(s.xp>=def.need){s.unlocked=true;toast(`Ny färdighet: ${def.label}`)}
  state.stats.skills=Object.values(state.skills).filter(x=>x.unlocked).length;
  checkQuests();save();renderStatusPanel();
}

function spawnFood(force=false){
  if(state.foods.length>=1&&!force)return;
  const food=pick([{emoji:"🦐",name:"räka"},{emoji:"🦀",name:"krabba"}]);
  state.foods=[{id:uid("food"),...food,x:rand(25,78),y:rand(45,72)}];save();renderFoods();
}
async function eatFood(food){
  if(actionLocked)return;actionLocked=true;working(true);
  await approach(food.x,food.y,-1);const p=makeProp(food.emoji,food.x,food.y);
  $("#food-layer").replaceChildren();
  story(`${state.name} tar maten med armarna.`);await delay(650);const q=octoXY();p.style.left=`${q.x}%`;p.style.top=`${q.y+1}%`;p.style.transform="translate(-50%,-50%) scale(.65)";
  story(`${state.name} för maten hela vägen till munnen.`);await delay(650);p.style.transform="translate(-50%,-50%) scale(.2)";p.style.opacity=".45";story(`${state.name} stoppar maten i munnen och äter upp den.`);await delay(650);
  state.foods=[];state.needs.hunger=clamp(state.needs.hunger+28);state.needs.mood=clamp(state.needs.mood+4);clearActionProps();renderNeeds();save();working(false);actionLocked=false;
}

function startLoops(){
  Object.values(timers).forEach(t=>{if(typeof t==="number")clearInterval(t)});
  clearInterval(timers.decay);clearInterval(timers.idle);clearInterval(timers.food);
  timers.decay=setInterval(()=>{
    state.needs.hunger=clamp(state.needs.hunger-2.1);
    state.needs.energy=clamp(state.needs.energy-1.35);
    state.needs.stimulation=clamp(state.needs.stimulation-2.4);
    state.needs.safety=clamp(state.needs.safety-.35);
    renderNeeds();save();
  },8000);
  timers.idle=setInterval(()=>{
    if(actionLocked)return;
    moveOcto(rand(18,82),rand(34,68),rand(.45,.75),1200);
    if(Math.random()<.33)story(`${state.name} simmar lugnt runt och tittar på omgivningen.`);
  },9000);
  timers.food=setInterval(()=>{
    if(state.needs.hunger<72&&!state.foods.length)spawnFood();
  },5000);
  if(state.needs.hunger<72&&!state.foods.length)spawnFood();
}

function installDragging(){
  const tank=$("#tank");
  tank.addEventListener("pointerdown",e=>{
    const obj=e.target.closest(".v4-object");
    if(!obj||actionLocked)return;
    const kind=obj.dataset.kind,id=obj.dataset.id;
    const item=kind==="placed"?state.placedItems.find(x=>x.id===id):state.foundItems.find(x=>x.id===id);
    if(!item)return;
    dragState={obj,item,kind,startX:e.clientX,startY:e.clientY,moved:false};
    obj.setPointerCapture?.(e.pointerId);
  });
  tank.addEventListener("pointermove",e=>{
    if(!dragState)return;
    const dx=e.clientX-dragState.startX,dy=e.clientY-dragState.startY;
    if(Math.hypot(dx,dy)>6)dragState.moved=true;
    if(!dragState.moved)return;
    const r=tank.getBoundingClientRect();const x=Math.max(4,Math.min(96,((e.clientX-r.left)/r.width)*100)),y=Math.max(48,Math.min(94,((e.clientY-r.top)/r.height)*100));
    dragState.item.x=x;dragState.item.y=y;dragState.obj.style.left=`${x}%`;dragState.obj.style.top=`${y}%`;
  });
  tank.addEventListener("pointerup",e=>{
    if(!dragState)return;
    const d=dragState;dragState=null;
    if(d.moved){save();return}
    const item=d.item;
    openActionMenu(d.kind==="placed"?labelFor(item):item.name,d.kind==="placed"?actionsForPlaced(item):actionsForFound(item),item.x,item.y);
  });
}

function installEvents(){
  $("#start-button").onclick=startQuiz;
  $("#create-pet-button").onclick=createPet;
  $("#new-pet-button").onclick=resetPet;
  $("#quests-button").onclick=()=>{renderQuests();$("#quests-dialog").showModal()};
  $("#inventory-button").onclick=()=>{renderBuildMenu();$("#inventory-dialog").showModal()};
  $("#octopus").onclick=()=>{if(actionLocked)return;state.trust=clamp(state.trust+3);state.careMoments++;state.needs.safety=clamp(state.needs.safety+5);stat("pet",1);renderNeeds();profile();story(`${state.name} kommer närmare och känner igen din hand.`);thought("Hej!")};
  $("#food-layer").onclick=e=>{const b=e.target.closest("[data-food-id]");if(!b)return;const food=state.foods.find(x=>x.id===b.dataset.foodId);if(food)eatFood(food)};
  $("#tank").addEventListener("click",e=>{
    if(e.target.closest(".v4-object,.v4-food,#octopus,#v4-action-menu"))return;
    if(actionLocked)return;
    const r=$("#tank").getBoundingClientRect();const relY=(e.clientY-r.top)/r.height;
    if(relY<.56)return;
    const x=Math.max(5,Math.min(95,((e.clientX-r.left)/r.width)*100)),y=Math.max(58,Math.min(93,((e.clientY-r.top)/r.height)*100));
    closeActionMenu();digAt(x,y);
  });
  document.addEventListener("click",e=>{if(!e.target.closest("#v4-action-menu,.v4-object"))closeActionMenu()});
  installDragging();
}

/* PWA/continue dialog */
$("#continue-dialog")?.addEventListener("close",()=>{});

/* START */
installEvents();
state=load();
if(state){
  ensureState();
  enterGame();
}else{
  showOnly("start");
}


/* =========================================================
   TIDVATTENPÖLEN v4.1
   Fix:
   - klick på föremål öppnar meny
   - föremål går att dra
   - endast klick på SANDEN startar grävning
   - klick i vattnet gör ingenting
   ========================================================= */

function v41InstallInteractionFixes(){
  const tank = $("#tank");
  const sand = $(".sand-bed");
  if(!tank || !sand) return;

  /*
    Den rena v4.0 hade en generell klicklyssnare på hela nedre halvan av tanken.
    Den kunde därför tolka klick i vattnet som ett sandklick.
    Vi stoppar den lyssnaren i capture-fasen och styr sanden själva.
  */
  tank.addEventListener("click", e=>{
    /* Låt klick på objekt, mat, bläckfisken och menyer fungera normalt. */
    if(e.target.closest(".v4-object,.v4-food,#octopus,#v4-action-menu,#v4-puzzle-board,#v4-puzzle-reopen")) return;

    /* Klick direkt på sanden = gräv. */
    if(e.target.closest(".sand-bed")){
      e.preventDefault();
      e.stopImmediatePropagation();

      if(actionLocked) return;

      const r=tank.getBoundingClientRect();
      const x=Math.max(5,Math.min(95,((e.clientX-r.left)/r.width)*100));
      const y=Math.max(68,Math.min(93,((e.clientY-r.top)/r.height)*100));

      closeActionMenu();
      digAt(x,y);
      return;
    }

    /* Alla andra tomma klick i vattnet ska INTE gräva. */
    e.preventDefault();
    e.stopImmediatePropagation();
    closeActionMenu();
  }, true);

  /*
    Gör dragningen robust även när pekaren lämnar själva emoji-elementet.
  */
  let activePointer = null;

  tank.addEventListener("pointerdown", e=>{
    const obj=e.target.closest(".v4-object");
    if(!obj || actionLocked) return;

    const kind=obj.dataset.kind;
    const id=obj.dataset.id;
    const item=kind==="placed"
      ? state.placedItems.find(x=>x.id===id)
      : state.foundItems.find(x=>x.id===id);

    if(!item) return;

    e.preventDefault();
    e.stopPropagation();

    activePointer=e.pointerId;
    dragState={
      obj,item,kind,
      startX:e.clientX,
      startY:e.clientY,
      moved:false
    };

    try{ obj.setPointerCapture(e.pointerId); }catch{}
  }, true);

  tank.addEventListener("pointermove", e=>{
    if(!dragState || activePointer!==e.pointerId) return;

    const dx=e.clientX-dragState.startX;
    const dy=e.clientY-dragState.startY;

    if(Math.hypot(dx,dy)>5) dragState.moved=true;
    if(!dragState.moved) return;

    e.preventDefault();
    e.stopPropagation();

    const r=tank.getBoundingClientRect();
    const x=Math.max(4,Math.min(96,((e.clientX-r.left)/r.width)*100));
    const y=Math.max(50,Math.min(94,((e.clientY-r.top)/r.height)*100));

    dragState.item.x=x;
    dragState.item.y=y;
    dragState.obj.style.left=`${x}%`;
    dragState.obj.style.top=`${y}%`;
  }, true);

  tank.addEventListener("pointerup", e=>{
    if(!dragState || activePointer!==e.pointerId) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const d=dragState;
    dragState=null;
    activePointer=null;

    if(d.moved){
      save();
      return;
    }

    /* Ett vanligt klick öppnar Sims-menyn. */
    const item=d.item;
    openActionMenu(
      d.kind==="placed" ? labelFor(item) : item.name,
      d.kind==="placed" ? actionsForPlaced(item) : actionsForFound(item),
      item.x,
      item.y
    );
  }, true);
}

setTimeout(v41InstallInteractionFixes, 50);


/* =========================================================
   TIDVATTENPÖLEN v4.2 – synlig sortering av klossar
   Han hämtar varje kloss själv och placerar samma färger ihop.
   ========================================================= */

async function sortBlocks(){
  const blocks=state.foundItems.filter(f=>f.kind==="block");
  if(!blocks.length) return;
  if(actionLocked) return;

  actionLocked=true;
  working(true);

  /* grupper efter själva färg-emojin, så dubletter hamnar ihop */
  const colorOrder=["🟥","🟧","🟨","🟩","🟦","🟪"];
  const grouped={};
  blocks.forEach(b=>{
    const key=b.emoji||"⬜";
    (grouped[key] ||= []).push(b);
  });

  const colors=Object.keys(grouped).sort((a,b)=>{
    const ia=colorOrder.indexOf(a), ib=colorOrder.indexOf(b);
    return (ia<0?99:ia)-(ib<0?99:ib);
  });

  /* välj en tydlig sorteringsyta */
  const startX=28;
  const groupGap=11;
  const baseY=80;

  /* skapa synliga tillfälliga klossar och dölj originalen */
  const props=new Map();
  blocks.forEach(b=>{
    hideRendered("found",b.id);
    const p=makeProp(b.emoji,b.x,b.y);
    props.set(b.id,p);
  });

  story(`${state.name} börjar samla klossarna en efter en och sortera dem efter färg.`);

  let groupIndex=0;
  for(const color of colors){
    const group=grouped[color];
    const gx=Math.min(86,startX+groupIndex*groupGap);

    for(let i=0;i<group.length;i++){
      const b=group[i];
      const p=props.get(b.id);

      /* simma till just den klossen */
      await approach(b.x,b.y,-1);
      story(`${state.name} simmar fram till ${b.name.toLowerCase()} och tar den med armarna.`);

      const q=octoXY();
      p.style.left=`${q.x+4}%`;
      p.style.top=`${q.y+7}%`;
      await delay(500);

      /* bär klossen till färggruppen */
      const targetX=gx + (i%2)*4;
      const targetY=baseY - Math.floor(i/2)*5;

      moveOcto(targetX-7,targetY-7,.7,650);
      p.style.left=`${targetX}%`;
      p.style.top=`${targetY}%`;
      story(`${state.name} bär den till de andra ${b.name.split(" ")[0].toLowerCase()} klossarna.`);
      await delay(700);

      /* spara den riktiga nya positionen */
      b.x=targetX;
      b.y=targetY;
    }

    groupIndex++;
  }

  story(`${state.name} har sorterat klart. Klossar med samma färg ligger nu tillsammans.`);
  save();
  clearActionProps();
  renderTank();

  learn("colorSort");
  state.needs.stimulation=clamp(state.needs.stimulation+10);
  renderNeeds();

  working(false);
  actionLocked=false;
}


/* =========================================================
   TIDVATTENPÖLEN v4.3
   ========================================================= */

/* ---------- MER VARIERADE SMYCKEN ---------- */

const V43_JEWELRY = [
  {name:"Tunt guldkedjehalsband",emoji:"📿",chain:"#d8b04a",gem:"#f0c75e"},
  {name:"Silverhalsband med safir",emoji:"💙",chain:"#c8d4da",gem:"#4b78d4"},
  {name:"Pärlhalsband",emoji:"🤍",chain:"#fff6df",gem:"#fff9ec",pearl:true},
  {name:"Korallpärlor",emoji:"🪸",chain:"#de7f78",gem:"#f2a49d"},
  {name:"Turkos amulett",emoji:"🧿",chain:"#55c8c3",gem:"#49c4c1"},
  {name:"Smaragdhänge",emoji:"💚",chain:"#d8b04a",gem:"#54a76b"},
  {name:"Ametisthänge",emoji:"💜",chain:"#c8d4da",gem:"#8d62bd"},
  {name:"Snäckhalsband",emoji:"🐚",chain:"#d8b04a",gem:"#f6e5c8"}
];

function v43OwnedJewelryNames(){
  const names=new Set(
    (state.foundItems||[])
      .filter(f=>f.type==="jewelry")
      .map(f=>f.name)
      .filter(Boolean)
  );
  if(state.wornJewelry?.name) names.add(state.wornJewelry.name);
  return names;
}

function v43RandomJewelry(){
  const owned=v43OwnedJewelryNames();
  let choices=V43_JEWELRY.filter(j=>!owned.has(j.name));
  if(!choices.length) choices=V43_JEWELRY.slice();
  return {...pick(choices)};
}

const v43RandomDigBase = randomDigFind;
randomDigFind = function(){
  const r=v43RandomDigBase();
  if(r?.type==="jewelry"){
    const j=v43RandomJewelry();
    return {...j,kind:"odd",type:"jewelry"};
  }
  return r;
};

/* ---------- PUSSEL SOM GÅR ATT KRYSSA NER ---------- */

state.puzzleHidden ??= false;

function v43RemovePuzzleReopen(){
  $("#v4-puzzle-reopen")?.remove();
}

function v43ShowPuzzleReopen(){
  v43RemovePuzzleReopen();
  if(!state.puzzle?.placed || !state.puzzleHidden) return;

  const b=document.createElement("button");
  b.id="v4-puzzle-reopen";
  b.type="button";
  b.textContent="🧩 Visa pusslet";
  b.onclick=()=>{
    state.puzzleHidden=false;
    save();
    renderPuzzleBoard();
  };
  $("#tank").append(b);
}

const v43EnsurePuzzleBase = ensurePuzzleBoard;
ensurePuzzleBoard = function(){
  if(state.puzzleHidden){
    v43ShowPuzzleReopen();
    return null;
  }

  const b=v43EnsurePuzzleBase();
  if(!b) return null;

  let close=$("#v4-puzzle-close",b);
  if(!close){
    close=document.createElement("button");
    close.id="v4-puzzle-close";
    close.type="button";
    close.textContent="×";
    close.title="Stäng pusslet";
    close.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      state.puzzleHidden=true;
      save();
      b.remove();
      v43ShowPuzzleReopen();
    };
    b.append(close);
  }

  v43RemovePuzzleReopen();
  return b;
};

const v43RenderPuzzleBase = renderPuzzleBoard;
renderPuzzleBoard = function(){
  $("#v4-puzzle-board")?.remove();

  if(!state.puzzle?.placed) {
    v43RemovePuzzleReopen();
    return;
  }

  if(state.puzzleHidden){
    v43ShowPuzzleReopen();
    return;
  }

  v43RenderPuzzleBase();

  const b=$("#v4-puzzle-board");
  if(!b) return;

  let close=$("#v4-puzzle-close",b);
  if(!close){
    close=document.createElement("button");
    close.id="v4-puzzle-close";
    close.type="button";
    close.textContent="×";
    close.title="Stäng pusslet";
    close.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      state.puzzleHidden=true;
      save();
      b.remove();
      v43ShowPuzzleReopen();
    };
    b.append(close);
  }
};

/* Lägg pussel ska öppna pusslet tillfälligt så biten syns sättas på plats. */
const v43PlacePuzzleBase = placePuzzlePiece;
placePuzzlePiece = async function(f){
  state.puzzleHidden=false;
  save();
  v43RemovePuzzleReopen();
  return v43PlacePuzzleBase(f);
};

/* ---------- SPEGEL: VISA SJÄLVA BLÄCKFISKEN ---------- */

async function useMirror(f){
  if(actionLocked) return;
  actionLocked=true;
  working(true);

  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);

  const mirror=document.createElement("div");
  mirror.className="v4-prop v43-mirror";
  mirror.style.left=`${f.x}%`;
  mirror.style.top=`${f.y}%`;

  const reflection=document.createElement("div");
  reflection.className="v43-mirror-reflection";

  /*
    Klona den riktiga SVG-bläckfisken. Det betyder att spegeln visar
    samma kropp/ögon/armar som spelaren faktiskt ser, fast spegelvänd.
  */
  const realSvg=$("#octopus .octopus-svg");
  if(realSvg){
    const clone=realSvg.cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll("#v4-necklace-svg").forEach(x=>x.remove());
    reflection.append(clone);
  }

  mirror.append(reflection);
  $("#v4-action-layer").append(mirror);

  const q=octoXY();
  mirror.style.left=`${q.x+8}%`;
  mirror.style.top=`${q.y+1}%`;

  story(`${state.name} håller spegeln framför sig och tittar på sin egen spegelbild.`);
  await delay(1200);

  /* Liten huvud-/armrörelse medan spegelbilden följer samma figur. */
  reflection.style.transform="translate(-50%,-50%) scaleX(-.50) scaleY(.50) rotate(-6deg)";
  story(`${state.name} vrider lite på sig och granskar sin spegelbild.`);
  await delay(1000);

  reflection.style.transform="translate(-50%,-50%) scaleX(-.46) scaleY(.46) rotate(5deg)";
  await delay(700);

  clearActionProps();
  renderTank();
  working(false);
  actionLocked=false;
}

/* Säkerställ att pusselstatus visas korrekt när spelet renderas. */
const v43RenderTankBase = renderTank;
renderTank = function(){
  v43RenderTankBase();
  renderPuzzleBoard();
};


/* =========================================================
   TIDVATTENPÖLEN v4.4 – BYGG OM FIX
   ========================================================= */

function v44BuildMessage(text){
  let msg=$("#v44-build-message");
  const grid=$("#inventory-grid");
  if(!grid) return;

  if(!msg){
    msg=document.createElement("div");
    msg.id="v44-build-message";
    grid.before(msg);
  }
  msg.textContent=text;
}

function v44FlashAdded(name){
  v44BuildMessage(`${name} har lagts i akvariet.`);
  toast(`${name} tillagd`);
}

/* Ersätter byggkortet så knappen ALDRIG kan skicka dialog-formuläret. */
buildCard = function(icon,name,info,disabled,onClick){
  const d=document.createElement("div");
  d.className=`v4-build-card${disabled?" v4-locked":""}`;

  d.innerHTML=`
    <div style="font-size:28px">${icon}</div>
    <div>
      <strong>${name}</strong>
      <div class="v4-small">${info}</div>
    </div>`;

  const b=document.createElement("button");
  b.type="button";
  b.textContent=disabled?"Låst":"Lägg in";
  b.disabled=disabled;

  if(!disabled){
    b.addEventListener("click", e=>{
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
  }

  d.append(b);
  return d;
};

/* Lägg in leksak – men STÄNG INTE Bygg om. */
placeBuildItem = function(key,d){
  if(d.type==="blocks"){
    for(let i=0;i<6;i++){
      const [name,emoji]=pick(BLOCKS);
      addFound({
        name,
        emoji,
        kind:"block",
        x:32+(i%3)*8,
        y:76+Math.floor(i/3)*7
      },false);
    }
    save();
    renderTank();
    v44FlashAdded("Klossarna");
    renderBuildMenu();
    return;
  }

  if(d.type==="wand"){
    if(!state.foundItems.some(f=>f.type==="wand")){
      addFound({
        name:"Trollstav",
        emoji:"🪄",
        kind:"odd",
        type:"wand",
        x:55,
        y:78
      },false);
      save();
      renderTank();
      v44FlashAdded("Trollstaven");
    }else{
      v44BuildMessage("Trollstaven finns redan i akvariet.");
    }
    renderBuildMenu();
    return;
  }

  if(state.placedItems.some(p=>p.type===d.type)){
    v44BuildMessage(`${d.label} finns redan i akvariet.`);
    return;
  }

  state.placedItems.push({
    id:uid(d.type),
    type:d.type,
    emoji:d.emoji,
    x:rand(30,70),
    y:rand(70,84)
  });

  save();
  renderTank();
  v44FlashAdded(d.label);
  renderBuildMenu();
};

/* Burkbyte – stanna kvar i Bygg om. */
replaceJar = function(key,d){
  state.placedItems=state.placedItems.filter(p=>p.type!=="jar");
  state.jarStyle=key;

  state.placedItems.push({
    id:uid("jar"),
    type:"jar",
    emoji:d.emoji,
    x:58,
    y:78,
    contents:randomJarReward()
  });

  save();
  renderTank();
  v44FlashAdded(d.label);
  renderBuildMenu();
};

/* Hembyte – stanna kvar i Bygg om. */
replaceHome = function(key,d){
  const old=state.placedItems.find(p=>p.type==="home");
  const x=old?.x??56;
  const y=old?.y??79;

  state.placedItems=state.placedItems.filter(p=>p.type!=="home");
  state.homeStyle=key;

  state.placedItems.push({
    id:uid("home"),
    type:"home",
    emoji:d.emoji,
    x,
    y
  });

  save();
  renderTank();
  v44FlashAdded(d.label);
  renderBuildMenu();
};

/*
  När Bygg om öppnas:
  - återställ statusraden
  - bygg om listan
  - dialogen stängs endast med X
*/
const v44InventoryButton=$("#inventory-button");
if(v44InventoryButton){
  v44InventoryButton.onclick=()=>{
    renderBuildMenu();
    v44BuildMessage("Välj vad du vill lägga in. Bygg om stannar öppet tills du trycker på ×.");
    $("#inventory-dialog").showModal();
  };
}

/* Förhindra att andra knappar i Bygg om råkar stänga method=dialog-formuläret. */
$("#inventory-dialog")?.addEventListener("click", e=>{
  const button=e.target.closest("button");
  if(!button) return;

  if(button.classList.contains("close-button")) return;

  button.type="button";
}, true);


/* =========================================================
   TIDVATTENPÖLEN v4.5 – pusselkrysset ska alltid fungera
   ========================================================= */

function v45InstallPuzzleControls(){
  const tank=$("#tank");
  if(!tank) return;

  tank.addEventListener("pointerdown", e=>{
    const close=e.target.closest("#v4-puzzle-close");
    if(close){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      state.puzzleHidden=true;
      save();
      $("#v4-puzzle-board")?.remove();
      v43ShowPuzzleReopen?.();
      return;
    }

    const reopen=e.target.closest("#v4-puzzle-reopen");
    if(reopen){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      state.puzzleHidden=false;
      save();
      renderPuzzleBoard();
    }
  }, true);
}

setTimeout(v45InstallPuzzleControls,100);


/* =========================================================
   TIDVATTENPÖLEN v4.6 – klappa fungerar igen
   ========================================================= */

function v46PetOctopus(){
  if(!state || actionLocked) return;

  state.trust=clamp((state.trust||0)+3);
  state.careMoments=(state.careMoments||0)+1;
  state.needs.safety=clamp((state.needs.safety||0)+5);
  state.needs.mood=clamp((state.needs.mood||0)+3);

  stat("pet",1);
  renderNeeds();
  profile();

  const o=$("#octopus");
  o?.classList.remove("v46-petted");
  void o?.offsetWidth;
  o?.classList.add("v46-petted");

  story(`${state.name} kommer närmare när du klappar den och känner igen din hand.`);
  thought("♥");

  save();
}

/*
  Använd pointerdown i capture-fasen så klappen registreras innan
  akvariets övriga klickhantering hinner fånga händelsen.
*/
$("#tank")?.addEventListener("pointerdown", e=>{
  const oct=e.target.closest("#octopus");
  if(!oct) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  v46PetOctopus();
}, true);

/* Förhindra att samma klapp också blir sand/vatten-klick efter pointerup/click. */
$("#tank")?.addEventListener("pointerup", e=>{
  if(e.target.closest("#octopus")){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}, true);

$("#tank")?.addEventListener("click", e=>{
  if(e.target.closest("#octopus")){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}, true);


/* =========================================================
   TIDVATTENPÖLEN v4.7 – bilder på alla behov
   ========================================================= */

renderNeeds = function(){
  calcMood();

  const box=$("#needs-grid");
  if(!box) return;
  box.replaceChildren();

  const needs=[
    ["hunger","Mättnad","🦐","Mat / mättnad"],
    ["energy","Energi","⚡","Energi"],
    ["safety","Trygghet","🛡️","Trygghet"],
    ["stimulation","Stimulans","🎾","Lek / stimulans"],
    ["mood","Humör","❤️","Humör"]
  ];

  needs.forEach(([k,label,icon,aria])=>{
    const el=document.createElement("div");
    el.className="need";
    el.dataset.need=k;
    el.setAttribute("aria-label",`${aria}: ${Math.round(state.needs[k])} procent`);

    el.innerHTML=`
      <div class="need-top">
        <span class="v47-need-label">
          <span class="v47-need-icon" aria-hidden="true">${icon}</span>
          <span class="v47-need-name">${label}</span>
        </span>
        <strong>${Math.round(state.needs[k])}%</strong>
      </div>
      <div class="need-track" aria-hidden="true">
        <div class="need-fill" style="width:${state.needs[k]}%"></div>
      </div>`;

    box.append(el);
  });

  const m=state.needs.mood;
  $("#mood-label").textContent=
    m>=78?"Pigg och nöjd":
    m>=55?"Nyfiken men lite rastlös":
    m>=35?"Behöver dig":
    "Mår inte så bra just nu";

  $("#mood-face").textContent=
    m>=78?"⌣":
    m>=55?"◡":
    m>=35?"•︵•":
    "︵";
};

/* Uppdatera direkt om ett sparat spel öppnas. */
setTimeout(()=>{
  if(state) renderNeeds();
},150);


/* =========================================================
   TIDVATTENPÖLEN v4.8
   - Bläckfisken gömmer sig bakom algerna på riktigt
   - Mindre tjatiga sandfynd
   - Fler pusselbitar, klossar och roliga saker
   ========================================================= */

state.v48RecentFindTypes ||= [];

/* ---------- GÖMMA SIG BAKOM ALGER ---------- */

async function hideKelp(item){
  if(actionLocked) return;
  actionLocked=true;

  const kelpEl=$(`.v4-object[data-kind="placed"][data-id="${item.id}"]`);
  const oct=$("#octopus");

  await approach(item.x,item.y,-1);

  story(`${state.name} simmar in bakom algerna.`);

  if(kelpEl) kelpEl.classList.add("v48-kelp-front");
  if(oct) oct.classList.add("v48-hidden-behind-kelp");

  /* Samma plats som algerna, men bläckfisken ligger bakom i z-led. */
  moveOcto(item.x,item.y,.34,700);
  await delay(700);

  thought("🙈");
  story(`${state.name} gömmer nästan hela kroppen bakom algerna.`);
  await delay(1900);

  /* Titta fram lite bakom algerna. */
  moveOcto(item.x+2,item.y-2,.35,450);
  story(`${state.name} kikar försiktigt fram mellan algerna.`);
  await delay(900);

  /* Kom ut igen. */
  moveOcto(item.x+12,item.y-7,.65,700);
  await delay(700);

  if(kelpEl) kelpEl.classList.remove("v48-kelp-front");
  if(oct) oct.classList.remove("v48-hidden-behind-kelp");

  story(`${state.name} simmar fram från sitt gömställe igen.`);
  actionLocked=false;
}

/* ---------- SAND: BÄTTRE VARIATION ---------- */

function v48CountType(type){
  return (state.foundItems||[]).filter(f=>f.type===type).length;
}

function v48HasRecent(type){
  return (state.v48RecentFindTypes||[]).includes(type);
}

function v48Remember(type){
  state.v48RecentFindTypes ||= [];
  state.v48RecentFindTypes.push(type);
  state.v48RecentFindTypes=state.v48RecentFindTypes.slice(-3);
}

/* Viktad slumpning. Pussel + klossar får större chans.
   Unika/sällsynta saker hålls nere så sanden inte fylls av samma prylar. */
function randomDigFind(){
  const candidates=[];

  const add=(weight,type,make,allow=true)=>{
    if(!allow) return;
    let w=weight;

    /* Undvik samma typ flera gånger på raken. */
    if(v48HasRecent(type)) w=Math.max(1,Math.floor(w*.28));

    for(let i=0;i<w;i++) candidates.push({type,make});
  };

  /* Pussel ska vara ganska vanligt så man faktiskt kan bygga klart det. */
  add(26,"puzzle-piece",()=>({
    name:"Pusselbit",
    emoji:"🧩",
    kind:"odd",
    type:"puzzle-piece"
  }));

  /* Klossar är vanliga och får gärna ha samma färg ibland. */
  add(24,"block",()=>{
    const [name,emoji]=pick(BLOCKS);
    return {name,emoji,kind:"block",type:"block"};
  });

  /* Roliga användbara fynd. */
  add(11,"thread",()=>{
    const [n,c]=pick(THREAD_COLORS);
    return {
      name:`${n[0].toUpperCase()+n.slice(1)} tråd`,
      emoji:"🧵",
      kind:"odd",
      type:"thread",
      threadColor:c
    };
  });

  add(8,"jewelry",()=>{
    const j=typeof v43RandomJewelry==="function" ? v43RandomJewelry() : {...pick(JEWELRY)};
    return {...j,kind:"odd",type:"jewelry"};
  });

  add(7,"die",()=>({
    name:"Tärning",
    emoji:"🎲",
    kind:"odd",
    type:"die"
  }), v48CountType("die")<1);

  add(6,"bell",()=>({
    name:"Bjällra",
    emoji:"🔔",
    kind:"odd",
    type:"bell"
  }), v48CountType("bell")<1);

  add(5,"coin",()=>({
    name:"Mynt",
    emoji:"🪙",
    kind:"odd",
    type:"coin"
  }), v48CountType("coin")<2);

  add(4,"key",()=>({
    name:"Nyckel",
    emoji:"🔑",
    kind:"odd",
    type:"key"
  }), v48CountType("key")<1);

  add(5,"gem",()=>({
    name:"Glittrande sten",
    emoji:"💎",
    kind:"odd",
    type:"gem"
  }), v48CountType("gem")<2);

  add(3,"mirror",()=>({
    name:"Spegel",
    emoji:"🪞",
    kind:"odd",
    type:"mirror"
  }), v48CountType("mirror")<1);

  /* Lite fler roliga engångsfynd. */
  add(5,"star-toy",()=>({
    name:"Liten sjöstjärna",
    emoji:"⭐",
    kind:"odd",
    type:"star-toy"
  }), v48CountType("star-toy")<1);

  add(5,"spinner",()=>({
    name:"Snurrleksak",
    emoji:"🌀",
    kind:"odd",
    type:"spinner"
  }), v48CountType("spinner")<1);

  add(4,"shell-toy",()=>({
    name:"Liten rasselsnäcka",
    emoji:"🐚",
    kind:"odd",
    type:"shell-toy"
  }), v48CountType("shell-toy")<1);

  if(!candidates.length){
    const [name,emoji]=pick(BLOCKS);
    return {name,emoji,kind:"block",type:"block"};
  }

  const chosen=pick(candidates);
  const result=chosen.make();
  v48Remember(chosen.type);
  save();
  return result;
}

/* ---------- HANDLINGAR FÖR NYA ROLIGA FYND ---------- */

const v48ActionsForFoundBase=actionsForFound;
actionsForFound=function(f){
  if(f.type==="star-toy"){
    return [
      {label:"⭐ Lek med sjöstjärnan",run:()=>v48PlayFound(f,"sjöstjärnan")},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }

  if(f.type==="spinner"){
    return [
      {label:"🌀 Snurra leksaken",run:()=>v48SpinFound(f)},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }

  if(f.type==="shell-toy"){
    return [
      {label:"🐚 Skaka snäckan",run:()=>v48PlayFound(f,"snäckan")},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }

  return v48ActionsForFoundBase(f);
};

async function v48PlayFound(f,label){
  if(actionLocked) return;
  actionLocked=true;
  working(true);

  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);

  const p=makeProp(f.emoji,f.x,f.y);
  const q=octoXY();

  p.style.left=`${q.x+5}%`;
  p.style.top=`${q.y+7}%`;
  story(`${state.name} tar upp ${label} med armarna.`);
  await delay(650);

  for(let i=0;i<4;i++){
    p.style.transform=`translate(-50%,-50%) rotate(${i%2?25:-25}deg) scale(${i%2?1.08:.94})`;
    await delay(350);
  }

  story(`${state.name} leker en stund och lägger sedan tillbaka ${label}.`);
  await delay(500);

  clearActionProps();
  renderTank();
  state.needs.stimulation=clamp(state.needs.stimulation+8);
  renderNeeds();
  save();

  working(false);
  actionLocked=false;
}

async function v48SpinFound(f){
  if(actionLocked) return;
  actionLocked=true;
  working(true);

  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);

  const p=makeProp(f.emoji,f.x,f.y);
  const q=octoXY();
  p.style.left=`${q.x+6}%`;
  p.style.top=`${q.y+7}%`;

  story(`${state.name} petar till snurrleksaken med en arm.`);
  await delay(500);

  p.style.transition="transform 1.8s ease-out";
  p.style.transform="translate(-50%,-50%) rotate(1440deg)";
  await delay(1800);

  story(`${state.name} följer snurran med blicken tills den stannar.`);
  clearActionProps();
  renderTank();

  state.needs.stimulation=clamp(state.needs.stimulation+8);
  renderNeeds();
  save();

  working(false);
  actionLocked=false;
}


/* =========================================================
   TIDVATTENPÖLEN v4.9
   - Ring ser ut som EN ring
   - Bläckfisken passerar faktiskt genom hålet
   - Fler lekval på boll, ring, klossar och nya leksaker
   ========================================================= */

/* ---------- RING: EN VISUELL RING + RIKTIG PASSAGE ---------- */

async function swimRing(item){
  if(actionLocked) return;
  actionLocked=true;
  working(true);

  const dir=item.x<55 ? 1 : -1;
  const startX=item.x-dir*24;
  const centerX=item.x;
  const endX=item.x+dir*24;

  /* Han börjar tydligt på ena sidan av ringen. */
  moveOcto(startX,item.y,.66,850);
  await delay(900);

  hideRendered("placed",item.id);

  const stage=document.createElement("div");
  stage.className="v4-prop v49-ring";
  stage.style.left=`${item.x}%`;
  stage.style.top=`${item.y}%`;
  stage.innerHTML=`
    <div class="v49-ring-back"></div>
    <div class="v49-ring-hole"></div>
    <div class="v49-ring-front"></div>`;
  $("#v4-action-layer").append(stage);

  story(`${state.name} ställer sig framför ringen och siktar på hålet.`);
  await delay(700);

  /* Först armarna in i hålet. */
  working(true);
  moveOcto(item.x-dir*10,item.y,.56,700);
  story(`${state.name} för in armarna genom själva hålet.`);
  await delay(800);

  /*
    Kroppen går CENTRERAT genom öppningen.
    När den är mitt i hålet skalas den lite och främre ringhalvan ligger ovanpå,
    vilket gör att det ser ut som att kroppen är INNE I ringen.
  */
  const oct=$("#octopus");
  oct.classList.add("v4-squeeze");
  oct.style.zIndex="300";
  moveOcto(centerX,item.y,.42,900);
  story(`${state.name} pressar kroppen genom ringens hål.`);
  await delay(950);

  /* Kommer ut på andra sidan. */
  oct.style.zIndex="460";
  moveOcto(item.x+dir*11,item.y,.56,800);
  await delay(800);

  oct.classList.remove("v4-squeeze");
  moveOcto(endX,item.y-2,.68,800);
  story(`${state.name} kommer helt ut på andra sidan.`);
  await delay(700);

  oct.style.zIndex="";
  clearActionProps();
  renderTank();

  learn("ringSwim");
  stat("ring",1);
  state.needs.stimulation=clamp(state.needs.stimulation+8);
  renderNeeds();

  working(false);
  actionLocked=false;
}

/* ---------- FLER LEKVAL ---------- */

const v49ActionsPlacedBase=actionsForPlaced;
actionsForPlaced=function(item){
  if(item.type==="ball"){
    return [
      {label:"⚽ Putta bollen",run:()=>pushBall(item)},
      {label:"🐙 Kasta bollen",run:()=>throwBall(item)},
      {label:"🌀 Rulla runt bollen",run:()=>v49RollAroundBall(item)},
      {label:"🫳 Håll fast bollen",run:()=>v49HoldBall(item)},
      {label:"🔎 Undersök",run:()=>inspectPlaced(item)}
    ];
  }

  if(item.type==="ring"){
    return [
      {label:"🌊 Simma genom hålet",run:()=>swimRing(item)},
      {label:"⭕ Rocka med ringen",run:()=>hoopRing(item)},
      {label:"🫳 Håll ringen",run:()=>v49HoldRing(item)},
      {label:"🔄 Snurra ringen",run:()=>v49SpinRing(item)},
      {label:"🔎 Undersök",run:()=>inspectPlaced(item)}
    ];
  }

  return v49ActionsPlacedBase(item);
};

const v49ActionsFoundBase=actionsForFound;
actionsForFound=function(f){
  if(f.kind==="block"){
    return [
      {label:"🏗️ Samla alla & bygg torn",run:()=>buildTower(f)},
      {label:"🎨 Sortera färger",run:()=>sortBlocks()},
      {label:"🧱 Bygg en rad",run:()=>v49BuildBlockLine()},
      {label:"🎲 Lek med en kloss",run:()=>v49PlayOneBlock(f)},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }

  if(f.type==="star-toy"){
    return [
      {label:"⭐ Vänd och snurra",run:()=>v49FlipStar(f)},
      {label:"🫳 Bär runt",run:()=>v49CarryToy(f)},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }

  if(f.type==="spinner"){
    return [
      {label:"🌀 Snurra snabbt",run:()=>v48SpinFound(f)},
      {label:"🐙 Stoppa med en arm",run:()=>v49StopSpinner(f)},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }

  if(f.type==="shell-toy"){
    return [
      {label:"🐚 Skaka snäckan",run:()=>v48PlayFound(f,"snäckan")},
      {label:"👂 Lyssna på snäckan",run:()=>v49ListenShell(f)},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }

  return v49ActionsFoundBase(f);
};

/* ---------- NYA FYSISKA LEKAR ---------- */

async function v49RollAroundBall(item){
  if(actionLocked)return;
  actionLocked=true;
  working(true);

  await approach(item.x,item.y,-1);
  hideRendered("placed",item.id);
  const p=makeProp(item.emoji||"🔵",item.x,item.y);

  story(`${state.name} lägger två armar runt bollen och börjar rulla den runt sig.`);
  for(let i=0;i<4;i++){
    const q=octoXY();
    const angle=i*Math.PI/2;
    p.style.left=`${q.x+Math.cos(angle)*8}%`;
    p.style.top=`${q.y+Math.sin(angle)*6}%`;
    p.style.transform=`translate(-50%,-50%) rotate(${i*180}deg)`;
    await delay(450);
  }

  clearActionProps();
  renderTank();
  stat("ball",1);
  state.needs.stimulation=clamp(state.needs.stimulation+7);
  renderNeeds();
  working(false);
  actionLocked=false;
}

async function v49HoldBall(item){
  if(actionLocked)return;
  actionLocked=true;
  working(true);
  await approach(item.x,item.y,-1);

  hideRendered("placed",item.id);
  const p=makeProp(item.emoji||"🔵",item.x,item.y);
  const q=octoXY();

  p.style.left=`${q.x+3}%`;
  p.style.top=`${q.y+8}%`;
  story(`${state.name} håller bollen tätt mot kroppen med flera armar.`);
  await delay(1800);

  clearActionProps();
  renderTank();
  working(false);
  actionLocked=false;
}

async function v49HoldRing(item){
  if(actionLocked)return;
  actionLocked=true;
  working(true);
  await approach(item.x,item.y,-1);
  hideRendered("placed",item.id);

  const ring=document.createElement("div");
  ring.className="v4-prop v49-ring";
  ring.style.left=`${item.x}%`;
  ring.style.top=`${item.y}%`;
  $("#v4-action-layer").append(ring);

  const q=octoXY();
  ring.style.left=`${q.x+7}%`;
  ring.style.top=`${q.y+4}%`;
  story(`${state.name} tar tag i ringen med flera armar och håller upp den.`);
  await delay(1700);

  clearActionProps();
  renderTank();
  working(false);
  actionLocked=false;
}

async function v49SpinRing(item){
  if(actionLocked)return;
  actionLocked=true;
  working(true);
  await approach(item.x,item.y,-1);
  hideRendered("placed",item.id);

  const ring=document.createElement("div");
  ring.className="v4-prop v49-ring";
  ring.style.left=`${item.x}%`;
  ring.style.top=`${item.y}%`;
  $("#v4-action-layer").append(ring);

  story(`${state.name} håller ringen med en arm och ger den fart.`);
  for(let i=0;i<5;i++){
    ring.style.transform=`translate(-50%,-50%) rotate(${i*260}deg)`;
    await delay(320);
  }

  clearActionProps();
  renderTank();
  state.needs.stimulation=clamp(state.needs.stimulation+7);
  renderNeeds();
  working(false);
  actionLocked=false;
}

async function v49BuildBlockLine(){
  const blocks=state.foundItems.filter(f=>f.kind==="block");
  if(!blocks.length||actionLocked)return;
  actionLocked=true;
  working(true);

  const baseX=30, baseY=81;
  for(let i=0;i<blocks.length;i++){
    const b=blocks[i];
    await approach(b.x,b.y,-1);
    hideRendered("found",b.id);
    const p=makeProp(b.emoji,b.x,b.y);
    const q=octoXY();
    p.style.left=`${q.x+4}%`;p.style.top=`${q.y+7}%`;
    await delay(400);

    const tx=baseX+(i%7)*8;
    const ty=baseY+Math.floor(i/7)*6;
    moveOcto(tx-6,ty-7,.7,600);
    p.style.left=`${tx}%`;p.style.top=`${ty}%`;
    await delay(600);

    b.x=tx;b.y=ty;
    clearActionProps();
    renderTank();
  }

  story(`${state.name} har lagt klossarna i en lång rad.`);
  learn("blockStack");
  state.needs.stimulation=clamp(state.needs.stimulation+8);
  renderNeeds();
  working(false);
  actionLocked=false;
  save();
}

async function v49PlayOneBlock(f){
  if(actionLocked)return;
  actionLocked=true;
  working(true);
  await approach(f.x,f.y,-1);

  hideRendered("found",f.id);
  const p=makeProp(f.emoji,f.x,f.y);
  const q=octoXY();
  p.style.left=`${q.x+4}%`;
  p.style.top=`${q.y+7}%`;

  story(`${state.name} vänder och vrider på ${f.name.toLowerCase()}.`);
  for(let i=0;i<4;i++){
    p.style.transform=`translate(-50%,-50%) rotate(${i*90}deg)`;
    await delay(400);
  }

  clearActionProps();
  renderTank();
  working(false);
  actionLocked=false;
}

async function v49CarryToy(f){
  if(actionLocked)return;
  actionLocked=true;
  working(true);
  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);

  const p=makeProp(f.emoji,f.x,f.y);
  const q=octoXY();
  p.style.left=`${q.x+4}%`;p.style.top=`${q.y+7}%`;
  story(`${state.name} bär runt leksaken med en arm.`);

  const nx=rand(28,72), ny=rand(58,82);
  moveOcto(nx,ny,.68,850);
  p.style.left=`${nx+4}%`;p.style.top=`${ny+7}%`;
  await delay(900);

  f.x=nx+6;f.y=ny+8;
  save();
  clearActionProps();
  renderTank();
  working(false);
  actionLocked=false;
}

async function v49FlipStar(f){
  if(actionLocked)return;
  actionLocked=true;
  working(true);
  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);

  const p=makeProp(f.emoji,f.x,f.y);
  const q=octoXY();
  p.style.left=`${q.x+5}%`;p.style.top=`${q.y+7}%`;
  story(`${state.name} vänder sjöstjärnan mellan armarna.`);

  for(let i=0;i<5;i++){
    p.style.transform=`translate(-50%,-50%) rotate(${i*120}deg) scaleX(${i%2?.55:1})`;
    await delay(330);
  }

  clearActionProps();
  renderTank();
  working(false);
  actionLocked=false;
}

async function v49StopSpinner(f){
  if(actionLocked)return;
  actionLocked=true;
  working(true);
  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);

  const p=makeProp(f.emoji,f.x,f.y);
  story(`${state.name} sätter fart på snurran.`);
  p.style.transition="transform 1.4s linear";
  p.style.transform="translate(-50%,-50%) rotate(1100deg)";
  await delay(900);

  p.style.transition="transform .18s ease";
  p.style.transform="translate(-50%,-50%) rotate(1180deg)";
  story(`${state.name} stoppar snurran med spetsen av en arm.`);
  await delay(700);

  clearActionProps();
  renderTank();
  working(false);
  actionLocked=false;
}

async function v49ListenShell(f){
  if(actionLocked)return;
  actionLocked=true;
  working(true);
  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);

  const p=makeProp(f.emoji,f.x,f.y);
  const q=octoXY();
  p.style.left=`${q.x+2}%`;
  p.style.top=`${q.y+1}%`;
  story(`${state.name} håller snäckan nära huvudet och lyssnar.`);
  thought("🌊");
  await delay(1800);

  clearActionProps();
  renderTank();
  working(false);
  actionLocked=false;
}


/* =========================================================
   TIDVATTENPÖLEN v5.0 – TILLVÄXTKALAS
   När han går upp en tydlig storleksnivå blir det kalas.
   ========================================================= */

function v50StageFromState(){
  const days=Math.floor((Date.now()-state.bornAt)/86400000);
  return state.careMoments>=24||days>=14 ? "vuxen" :
         state.careMoments>=12||days>=5 ? "ung" :
         state.careMoments>=6||days>=2 ? "växande" :
         "bebis";
}

function v50StageLabel(stage){
  return {
    bebis:"bebis",
    växande:"växande bläckfisk",
    ung:"ung bläckfisk",
    vuxen:"vuxen bläckfisk"
  }[stage] || stage;
}

function v50EnsureParty(){
  let wrap=$("#v50-growth-party");
  if(wrap) return wrap;

  wrap=document.createElement("div");
  wrap.id="v50-growth-party";
  wrap.hidden=true;
  wrap.innerHTML=`
    <div class="v50-confetti"></div>
    <div class="v50-party-card">
      <div class="v50-party-icons">🎉 🎂 🐙</div>
      <h2>Nu har den blivit större!</h2>
      <p id="v50-party-text"></p>
      <p>Man ser tydligt att kroppen har vuxit.</p>
      <button type="button" id="v50-party-close">Fortsätt</button>
    </div>`;
  $("#tank")?.append(wrap);

  $("#v50-party-close",wrap)?.addEventListener("click",()=>{
    wrap.hidden=true;
    $(".v50-confetti",wrap).replaceChildren();
  });

  return wrap;
}

function v50Confetti(){
  const wrap=v50EnsureParty();
  const box=$(".v50-confetti",wrap);
  box.replaceChildren();

  const bits=["🎉","✨","🎊","⭐","💗"];
  for(let i=0;i<24;i++){
    const s=document.createElement("span");
    s.textContent=pick(bits);
    s.style.left=`${Math.random()*100}%`;
    s.style.animationDelay=`${Math.random()*.8}s`;
    s.style.animationDuration=`${2.1+Math.random()*1.5}s`;
    box.append(s);
  }
}

function v50CelebrateGrowth(newStage){
  const wrap=v50EnsureParty();
  $("#v50-party-text",wrap).textContent=
    `${state.name} är nu en ${v50StageLabel(newStage)}.`;

  wrap.hidden=false;
  v50Confetti();

  const o=$("#octopus");
  o?.classList.add("v50-grow-pop");
  setTimeout(()=>o?.classList.remove("v50-grow-pop"),1300);

  story(`🎉 ${state.name} har vuxit och blivit större!`);
  thought("🎂");
}

const v50ProfileBase = profile;
profile = function(){
  if(!state) return;

  const previous=state.growthStage || "bebis";
  const next=v50StageFromState();

  v50ProfileBase();

  state.growthStage=next;
  save();

  if(previous!==next){
    /* Vi vill bara fira när storleken går UPP, inte vid laddning av gammalt sparat spel. */
    const order=["bebis","växande","ung","vuxen"];
    if(order.indexOf(next)>order.indexOf(previous)){
      setTimeout(()=>v50CelebrateGrowth(next),250);
    }
  }
};

/* Ge äldre sparningar en startnivå utan att trigga falskt kalas direkt. */
setTimeout(()=>{
  if(!state) return;
  if(!state.growthStage){
    state.growthStage=v50StageFromState();
    save();
  }
},120);


/* =========================================================
   TIDVATTENPÖLEN v5.1 – PARTY MED KOMPISAR, DISCO OCH MUSIK
   ========================================================= */

let v51AudioCtx=null;
let v51PartyTimer=null;

function v51FriendHTML(cls){
  return `
    <div class="v51-friend ${cls}">
      <div class="head"></div>
      <div class="eye left"></div>
      <div class="eye right"></div>
      <div class="arms">〰〰〰</div>
    </div>`;
}

function v51InstallPartyScene(){
  const wrap=v50EnsureParty();
  if(!wrap) return;

  let scene=$("#v51-party-scene",wrap);
  if(!scene){
    scene=document.createElement("div");
    scene.id="v51-party-scene";
    scene.innerHTML=`
      <div class="v51-disco-light a"></div>
      <div class="v51-disco-light b"></div>
      <div class="v51-disco-light c"></div>
      <div class="v51-disco-ball">🪩</div>
      ${v51FriendHTML("one")}
      ${v51FriendHTML("two")}
      ${v51FriendHTML("three")}
      <div class="v51-music-note n1">♪</div>
      <div class="v51-music-note n2">♫</div>
      <div class="v51-music-note n3">♩</div>`;
    wrap.prepend(scene);
  }

  $(".v50-party-card",wrap)?.classList.add("v51-party-card-front");
}

function v51StopMusic(){
  if(v51PartyTimer){
    clearInterval(v51PartyTimer);
    v51PartyTimer=null;
  }
  if(v51AudioCtx){
    try{v51AudioCtx.close()}catch{}
    v51AudioCtx=null;
  }
}

function v51PlayTone(freq=180,duration=.11,volume=.025,type="sine"){
  if(!v51AudioCtx) return;
  const ctx=v51AudioCtx;
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();

  osc.type=type;
  osc.frequency.value=freq;
  gain.gain.setValueAtTime(volume,ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime+duration);
}

/* Enkel egenproducerad discorytm – inga externa ljudfiler behövs. */
function v51StartMusic(){
  v51StopMusic();

  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!AudioContext) return;

  try{
    v51AudioCtx=new AudioContext();

    let step=0;
    const bass=[110,110,130,110,146,130,110,98];

    const beat=()=>{
      if(!v51AudioCtx) return;
      const f=bass[step%bass.length];

      /* kick/bas */
      v51PlayTone(f,.13,.035,"sine");

      /* liten hi-hat på varannan puls */
      if(step%2===1) v51PlayTone(900,.045,.009,"square");

      /* disco-pluck */
      if(step%4===2) v51PlayTone(f*2,.08,.012,"triangle");

      step++;
    };

    beat();
    v51PartyTimer=setInterval(beat,310);
  }catch{}
}

const v51CelebrateBase=v50CelebrateGrowth;
v50CelebrateGrowth=function(newStage){
  v51CelebrateBase(newStage);

  const wrap=v50EnsureParty();
  v51InstallPartyScene();

  const txt=$("#v50-party-text",wrap);
  if(txt){
    txt.textContent=
      `${state.name} är nu en ${v50StageLabel(newStage)}. Kompisarna har kommit för att fira!`;
  }

  const card=$(".v50-party-card",wrap);
  if(card){
    let extra=$("#v51-party-extra",card);
    if(!extra){
      extra=document.createElement("p");
      extra.id="v51-party-extra";
      extra.textContent="Det blir disco, dans och musik i akvariet. 🎶🪩";
      card.insertBefore(extra,$("#v50-party-close",card));
    }
  }

  /* Browser kräver normalt användarinteraktion innan ljud får starta.
     Försök direkt; om det blockeras startar musiken när spelaren klickar på festen. */
  v51StartMusic();

  const startOnTap=()=>{
    if(v51AudioCtx?.state==="suspended"){
      v51AudioCtx.resume?.();
    }else if(!v51AudioCtx){
      v51StartMusic();
    }
  };

  wrap.addEventListener("pointerdown",startOnTap,{once:true});
};

const v51EnsurePartyBase=v50EnsureParty;
v50EnsureParty=function(){
  const wrap=v51EnsurePartyBase();

  const close=$("#v50-party-close",wrap);
  if(close && !close.dataset.v51){
    close.dataset.v51="1";
    close.addEventListener("click",()=>{
      v51StopMusic();
    });
  }

  return wrap;
};

/* Om dialogen döljs på annat sätt ska musiken också sluta. */
document.addEventListener("visibilitychange",()=>{
  if(document.hidden) v51StopMusic();
});


/* =========================================================
   TIDVATTENPÖLEN v5.2
   - Bläckfisken börjar liten
   - Tillväxtkalas pågår en liten stund
   - Kompisarna är kopior av samma bläckfiskmodell i olika färger
   - Spelaren kan välja discospår
   - Rutan går att stänga efter kalaset
   ========================================================= */

let v52AudioCtx=null;
let v52BeatTimer=null;
let v52PartyEndTimer=null;
let v52CountdownTimer=null;
let v52PartyRemaining=12;
let v52Track="techno";

function v52StopMusic(){
  if(v52BeatTimer){clearInterval(v52BeatTimer);v52BeatTimer=null}
  if(v52AudioCtx){
    try{v52AudioCtx.close()}catch{}
    v52AudioCtx=null;
  }
}

function v52Tone(freq,dur=.08,vol=.02,type="sine"){
  if(!v52AudioCtx) return;
  const ctx=v52AudioCtx;
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  osc.type=type;
  osc.frequency.value=freq;
  gain.gain.setValueAtTime(vol,ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime+dur);
}

function v52StartMusic(track=v52Track){
  v52StopMusic();

  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) return;

  try{
    v52AudioCtx=new AC();
    let step=0;

    const patterns={
      techno:{
        speed:220,
        bass:[92,92,110,92,123,110,92,82],
        beat(){
          const f=this.bass[step%this.bass.length];
          v52Tone(f,.14,.04,"sine");
          if(step%2===1)v52Tone(1100,.035,.012,"square");
          if(step%4===2)v52Tone(f*2,.07,.014,"triangle");
        }
      },
      bubble:{
        speed:285,
        bass:[130,164,196,164,146,196,164,130],
        beat(){
          const f=this.bass[step%this.bass.length];
          v52Tone(f,.09,.022,"triangle");
          if(step%2===0)v52Tone(f*2,.045,.01,"sine");
        }
      },
      deep:{
        speed:255,
        bass:[73,82,73,98,73,110,82,73],
        beat(){
          const f=this.bass[step%this.bass.length];
          v52Tone(f,.17,.042,"sine");
          if(step%4===3)v52Tone(700,.04,.009,"square");
        }
      }
    };

    const p=patterns[track]||patterns.techno;
    const beat=()=>{p.beat();step++};
    beat();
    v52BeatTimer=setInterval(beat,p.speed);
  }catch{}
}

function v52CloneOctopus(){
  const real=$("#octopus .octopus-svg");
  if(!real) return null;
  const clone=real.cloneNode(true);
  clone.removeAttribute("id");
  clone.querySelectorAll("#v4-necklace-svg").forEach(n=>n.remove());
  return clone;
}

function v52BuildPartyScene(){
  const wrap=v50EnsureParty();
  if(!wrap) return;

  $("#v51-party-scene",wrap)?.remove();
  $("#v52-party-stage",wrap)?.remove();

  const stage=document.createElement("div");
  stage.id="v52-party-stage";
  stage.innerHTML=`
    <div class="v52-beam a"></div>
    <div class="v52-beam b"></div>
    <div class="v52-beam c"></div>
    <div class="v52-disco-ball">🪩</div>`;

  const classes=["purple","blue","green","orange"];
  classes.forEach(cls=>{
    const f=document.createElement("div");
    f.className=`v52-friend ${cls}`;
    const c=v52CloneOctopus();
    if(c) f.append(c);
    stage.append(f);
  });

  const main=document.createElement("div");
  main.className="v52-main-copy";
  const mc=v52CloneOctopus();
  if(mc) main.append(mc);
  stage.append(main);

  wrap.prepend(stage);
}

function v52InstallTrackPicker(){
  const card=$(".v50-party-card");
  if(!card) return;

  $("#v52-track-picker",card)?.remove();
  $("#v52-party-countdown",card)?.remove();

  const picker=document.createElement("div");
  picker.id="v52-track-picker";
  picker.innerHTML=`
    <button type="button" data-track="techno">🎧 Techno</button>
    <button type="button" data-track="bubble">🫧 Bubbel-disco</button>
    <button type="button" data-track="deep">🌊 Djup bas</button>`;

  picker.addEventListener("click",e=>{
    const b=e.target.closest("button[data-track]");
    if(!b) return;
    v52Track=b.dataset.track;
    $$("#v52-track-picker button").forEach(x=>x.classList.toggle("active",x===b));
    v52StartMusic(v52Track);
    if(v52AudioCtx?.state==="suspended") v52AudioCtx.resume?.();
  });

  const countdown=document.createElement("div");
  countdown.id="v52-party-countdown";

  const close=$("#v50-party-close",card);
  card.insertBefore(picker,close);
  card.insertBefore(countdown,close);

  $(`#v52-track-picker button[data-track="${v52Track}"]`)?.classList.add("active");
}

function v52StartCountdown(){
  const close=$("#v50-party-close");
  if(!close) return;

  close.disabled=true;
  close.textContent="Party pågår…";
  v52PartyRemaining=12;

  const tick=()=>{
    const el=$("#v52-party-countdown");
    if(el) el.textContent=`Discot fortsätter i ${v52PartyRemaining} sekunder`;
    v52PartyRemaining--;

    if(v52PartyRemaining<0){
      clearInterval(v52CountdownTimer);
      v52CountdownTimer=null;
      close.disabled=false;
      close.textContent="Fortsätt";
      const el2=$("#v52-party-countdown");
      if(el2) el2.textContent="Kalaset är klart – du kan fortsätta när du vill.";
    }
  };

  tick();
  v52CountdownTimer=setInterval(tick,1000);
}

const v52CelebrateBase=v50CelebrateGrowth;
v50CelebrateGrowth=function(newStage){
  v52CelebrateBase(newStage);

  const wrap=v50EnsureParty();
  v52BuildPartyScene();
  v52InstallTrackPicker();

  const txt=$("#v50-party-text",wrap);
  if(txt){
    txt.textContent=`${state.name} har blivit större! Kompisarna kommer in i akvariet för att fira.`;
  }

  let extra=$("#v52-party-extra");
  if(!extra){
    extra=document.createElement("p");
    extra.id="v52-party-extra";
    extra.textContent="Välj musik och titta på discot en liten stund. 🎶";
    $("#v50-party-close")?.before(extra);
  }

  v52StartMusic(v52Track);
  wrap.addEventListener("pointerdown",()=>{
    if(v52AudioCtx?.state==="suspended")v52AudioCtx.resume?.();
  },{once:true});

  v52StartCountdown();
};

/* Stängknappen ska alltid fungera när den väl blivit aktiverad. */
document.addEventListener("pointerdown",e=>{
  const close=e.target.closest("#v50-party-close");
  if(!close || close.disabled) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const wrap=$("#v50-growth-party");
  if(wrap) wrap.hidden=true;

  if(v52CountdownTimer){clearInterval(v52CountdownTimer);v52CountdownTimer=null}
  v52StopMusic();
},true);

/* ---------- LITEN NÄR SPELET BÖRJAR ---------- */

const v52ProfileBase=profile;
profile=function(){
  v52ProfileBase();

  if(!state) return;

  const days=Math.floor((Date.now()-state.bornAt)/86400000);
  const stage=v50StageFromState?.() || state.growthStage || "bebis";

  /* Ny bläckfisk = tydligt liten bebis. */
  const o=$("#octopus");
  if(o){
    const scaleMap={
      bebis:.42,
      växande:.58,
      ung:.74,
      vuxen:.92
    };
    o.dataset.s=String(scaleMap[stage] ?? .42);
  }

  $("#stage-badge").textContent=
    stage==="bebis" ? "liten bebis" :
    stage==="växande" ? "växande" :
    stage==="ung" ? "ung" : "vuxen";
};

/* Se till att storleken används direkt efter att spelet öppnas. */
setTimeout(()=>{
  if(state){
    profile();
    const q=octoXY();
    moveOcto(q.x,q.y,.62,0);
  }
},180);


/* =========================================================
   TIDVATTENPÖLEN v5.3
   Först visas informationsrutan.
   När spelaren klickar "Se festen" försvinner rutan,
   men discot, kompisarna och musiken fortsätter ovanpå akvariet.
   ========================================================= */

function v53EndParty(){
  const wrap=$("#v50-growth-party");
  if(!wrap) return;

  wrap.hidden=true;
  wrap.classList.remove("v53-party-open");

  if(v52CountdownTimer){
    clearInterval(v52CountdownTimer);
    v52CountdownTimer=null;
  }

  v52StopMusic();
}

function v53OpenAquariumParty(){
  const wrap=$("#v50-growth-party");
  if(!wrap) return;

  wrap.classList.add("v53-party-open");

  /* Räkna festen som pågående först NU när rutan är borta. */
  v52PartyRemaining=12;

  if(v52CountdownTimer){
    clearInterval(v52CountdownTimer);
    v52CountdownTimer=null;
  }

  v52CountdownTimer=setInterval(()=>{
    v52PartyRemaining--;

    if(v52PartyRemaining<=0){
      clearInterval(v52CountdownTimer);
      v52CountdownTimer=null;

      /* Låt sista dansrörelsen synas lite innan allt försvinner. */
      setTimeout(v53EndParty,700);
    }
  },1000);

  story(`${state.name} firar med sina kompisar i akvariet! 🪩🎶`);
}

/* Byt beteende på tillväxtkalaset:
   rutan är bara introduktion – själva festen syns efter att den stängts. */
const v53CelebrateBase=v50CelebrateGrowth;
v50CelebrateGrowth=function(newStage){
  v53CelebrateBase(newStage);

  const wrap=v50EnsureParty();
  wrap.classList.remove("v53-party-open");

  const close=$("#v50-party-close",wrap);
  if(close){
    close.disabled=false;
    close.textContent="Se festen 🎉";
  }

  const countdown=$("#v52-party-countdown",wrap);
  if(countdown){
    countdown.textContent="Klicka på Se festen för att stänga rutan och titta på discot i akvariet.";
  }

  /* Ta bort den gamla nedräkningen som låste knappen. */
  if(v52CountdownTimer){
    clearInterval(v52CountdownTimer);
    v52CountdownTimer=null;
  }
};

/* Fånga knappen innan äldre stänglogik körs. */
document.addEventListener("pointerdown",e=>{
  const close=e.target.closest("#v50-party-close");
  if(!close) return;

  const wrap=$("#v50-growth-party");
  if(!wrap || wrap.hidden) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  /* Första trycket: bara rutan försvinner – festen fortsätter. */
  if(!wrap.classList.contains("v53-party-open")){
    v53OpenAquariumParty();
  }
},true);


/* =========================================================
   TIDVATTENPÖLEN v5.4
   - En synlig hand klappar bläckfisken
   - Stimulans ökar konsekvent av lek, problemlösning och undersökning
   ========================================================= */

function v54Stimulate(amount=5,label=""){
  state.needs.stimulation=clamp((state.needs.stimulation||0)+amount);
  renderNeeds();
  save();

  const q=octoXY();
  const pop=document.createElement("div");
  pop.className="v54-stim-pop";
  pop.style.left=`${q.x}%`;
  pop.style.top=`${Math.max(12,q.y-8)}%`;
  pop.textContent=`🎲 +${amount}`;
  $("#tank")?.append(pop);
  setTimeout(()=>pop.remove(),1300);

  if(label) story(`${state.name} blir stimulerad av ${label}.`);
}

async function v54PetWithHand(){
  if(!state || actionLocked) return;

  actionLocked=true;

  const tank=$("#tank");
  const q=octoXY();

  let hand=$("#v54-hand");
  if(!hand){
    hand=document.createElement("div");
    hand.id="v54-hand";
    hand.textContent="🖐️";
    tank.append(hand);
  }

  hand.style.opacity="1";
  hand.style.left=`${Math.min(92,q.x+14)}%`;
  hand.style.top=`${Math.max(12,q.y-18)}%`;

  await delay(350);

  hand.style.left=`${q.x+4}%`;
  hand.style.top=`${q.y-8}%`;
  hand.classList.add("pet");

  story(`Du klappar ${state.name} försiktigt med handen.`);
  thought("♥");

  state.trust=clamp((state.trust||0)+4);
  state.careMoments=(state.careMoments||0)+1;
  state.needs.safety=clamp((state.needs.safety||0)+7);
  state.needs.mood=clamp((state.needs.mood||0)+4);

  stat("pet",1);
  renderNeeds();
  profile();
  save();

  await delay(1900);

  hand.classList.remove("pet");
  hand.style.opacity="0";
  setTimeout(()=>hand?.remove(),350);

  actionLocked=false;
}

/* Ersätt den gamla rena klick-klappen med den synliga handen. */
v46PetOctopus = v54PetWithHand;

/* Fånga klick direkt på bläckfisken och visa handen. */
$("#tank")?.addEventListener("pointerdown", e=>{
  if(!e.target.closest("#octopus")) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  v54PetWithHand();
}, true);

/* ---------- STIMULANS PER AKTIVITET ---------- */

/* Undersökning ger lite stimulans. */
const v54InspectPlacedBase=inspectPlaced;
inspectPlaced=async function(item){
  await v54InspectPlacedBase(item);
  v54Stimulate(3,"att undersöka något nytt");
};

const v54InspectFoundBase=inspectFound;
inspectFound=async function(f){
  await v54InspectFoundBase(f);
  v54Stimulate(3,"att undersöka fyndet");
};

/* Boll */
const v54PushBallBase=pushBall;
pushBall=async function(item){
  await v54PushBallBase(item);
  v54Stimulate(7,"bollleken");
};

const v54ThrowBallBase=throwBall;
throwBall=async function(item){
  await v54ThrowBallBase(item);
  v54Stimulate(9,"att kasta bollen");
};

/* Ring */
const v54SwimRingBase=swimRing;
swimRing=async function(item){
  await v54SwimRingBase(item);
  v54Stimulate(8,"att simma genom ringen");
};

const v54HoopRingBase=hoopRing;
hoopRing=async function(item){
  await v54HoopRingBase(item);
  v54Stimulate(8,"ringträningen");
};

/* Klossar */
const v54BuildTowerBase=buildTower;
buildTower=async function(f){
  await v54BuildTowerBase(f);
  v54Stimulate(10,"att bygga med klossarna");
};

const v54SortBlocksBase=sortBlocks;
sortBlocks=async function(){
  await v54SortBlocksBase();
  v54Stimulate(9,"att sortera klossarna");
};

/* Burk och pussel */
const v54OpenJarBase=openJar;
openJar=async function(item){
  await v54OpenJarBase(item);
  v54Stimulate(10,"problemlösningen med burken");
};

const v54PuzzleBase=placePuzzlePiece;
placePuzzlePiece=async function(f){
  await v54PuzzleBase(f);
  v54Stimulate(9,"att lägga pussel");
};

/* Tråd */
const v54ThreadBase=unravelThread;
unravelThread=async function(f){
  await v54ThreadBase(f);
  v54Stimulate(8,"att leka med tråden");
};

/* Magi */
const v54MagicBase=magic;
magic=async function(f){
  await v54MagicBase(f);
  v54Stimulate(8,"trollandet");
};

/* Nya leksaker */
if(typeof v48PlayFound==="function"){
  const v54PlayFoundBase=v48PlayFound;
  v48PlayFound=async function(f,label){
    await v54PlayFoundBase(f,label);
    v54Stimulate(8,`leken med ${label}`);
  };
}

if(typeof v48SpinFound==="function"){
  const v54SpinBase=v48SpinFound;
  v48SpinFound=async function(f){
    await v54SpinBase(f);
    v54Stimulate(8,"snurrleken");
  };
}

/* Tydligare ikon: 🎲 = lek/aktivering */
const v54RenderNeedsBase=renderNeeds;
renderNeeds=function(){
  v54RenderNeedsBase();

  const stim=$('.need[data-need="stimulation"] .v47-need-icon');
  if(stim) stim.textContent="🎲";
};


/* =========================================================
   TIDVATTENPÖLEN v5.5 – riktig gömning bakom algerna
   ========================================================= */

async function hideKelp(item){
  if(actionLocked) return;
  actionLocked=true;

  const kelpEl=$(`.v4-object[data-kind="placed"][data-id="${item.id}"]`);
  const oct=$("#octopus");

  if(!kelpEl || !oct){
    actionLocked=false;
    return;
  }

  /* Först fram till algerna */
  await approach(item.x,item.y,-1);
  story(`${state.name} simmar fram till algerna.`);

  /* Algerna flyttas visuellt framför honom */
  kelpEl.classList.add("v55-kelp-front");
  oct.classList.add("v55-behind-kelp");

  /* Ställ honom exakt bakom algerna */
  moveOcto(item.x,item.y+1,.34,700);
  await delay(800);

  /* Justera så bara lite av huvudet/armarna kan kika fram */
  moveOcto(item.x+1,item.y+2,.33,450);
  story(`${state.name} gömmer sig helt bakom algerna.`);
  thought("🙈");
  await delay(1800);

  /* Kika fram från sidan utan att lämna gömstället */
  moveOcto(item.x+4,item.y-1,.34,420);
  story(`${state.name} kikar fram lite från sidan av algerna.`);
  await delay(900);

  /* Tillbaka bakom igen en kort stund */
  moveOcto(item.x,item.y+1,.33,420);
  await delay(700);

  /* Sen kommer han ut */
  moveOcto(item.x+13,item.y-7,.65,700);
  await delay(750);

  kelpEl.classList.remove("v55-kelp-front");
  oct.classList.remove("v55-behind-kelp");

  story(`${state.name} kommer fram från bakom algerna.`);
  actionLocked=false;
}


/* =========================================================
   TIDVATTENPÖLEN v5.6
   - Ingen stor ruta vid tillväxt
   - Direkt party i akvariet
   - Endast liten notis
   - Låtval ligger som liten kontroll, inte modal
   ========================================================= */

function v56GrowthNote(stage){
  $("#v56-growth-note")?.remove();

  const n=document.createElement("div");
  n.id="v56-growth-note";
  n.textContent=`🎉 ${state.name} har blivit större – nu blir det kalas!`;
  $("#tank")?.append(n);

  setTimeout(()=>{
    n.style.transition="opacity .35s ease, transform .35s ease";
    n.style.opacity="0";
    n.style.transform="translateX(-50%) translateY(-8px)";
    setTimeout(()=>n.remove(),380);
  },3300);
}

function v56MusicStrip(){
  $("#v56-music-strip")?.remove();

  const bar=document.createElement("div");
  bar.id="v56-music-strip";
  bar.innerHTML=`
    <button type="button" data-track="techno">🎧 Techno</button>
    <button type="button" data-track="bubble">🫧 Bubbel-disco</button>
    <button type="button" data-track="deep">🌊 Djup bas</button>`;

  bar.addEventListener("pointerdown",e=>{
    const b=e.target.closest("button[data-track]");
    if(!b) return;

    e.preventDefault();
    e.stopPropagation();

    v52Track=b.dataset.track;
    $$("#v56-music-strip button").forEach(x=>x.classList.toggle("active",x===b));
    v52StartMusic(v52Track);

    if(v52AudioCtx?.state==="suspended"){
      v52AudioCtx.resume?.();
    }
  });

  $("#tank")?.append(bar);
  $(`#v56-music-strip button[data-track="${v52Track}"]`)?.classList.add("active");
}

function v56FinishParty(){
  const wrap=$("#v50-growth-party");
  if(wrap){
    wrap.hidden=true;
    wrap.classList.remove("v56-live-party","v53-party-open");
  }

  $("#v56-music-strip")?.remove();
  v52StopMusic();

  if(v52CountdownTimer){
    clearInterval(v52CountdownTimer);
    v52CountdownTimer=null;
  }

  story(`${state.name} vinkar av sina kompisar efter kalaset. 🎉`);
}

function v56StartLiveParty(newStage){
  const wrap=v50EnsureParty();
  if(!wrap) return;

  /* bygg kompisar/scen från v5.2 */
  v52BuildPartyScene();

  wrap.hidden=false;
  wrap.classList.remove("v53-party-open");
  wrap.classList.add("v56-live-party");

  v56GrowthNote(newStage);
  v56MusicStrip();

  story(`${state.name} firar med sina kompisar i akvariet! 🪩🎶`);

  /* Försök starta vald musik direkt. Om webbläsaren blockerar ljud
     kan spelaren trycka på någon av de små låtknapparna. */
  v52StartMusic(v52Track);

  let remaining=14;
  if(v52CountdownTimer){
    clearInterval(v52CountdownTimer);
  }

  v52CountdownTimer=setInterval(()=>{
    remaining--;
    if(remaining<=0){
      clearInterval(v52CountdownTimer);
      v52CountdownTimer=null;
      v56FinishParty();
    }
  },1000);
}

/* Ersätt hela stora modalflödet. */
v50CelebrateGrowth=function(newStage){
  const o=$("#octopus");
  o?.classList.add("v50-grow-pop");
  setTimeout(()=>o?.classList.remove("v50-grow-pop"),1300);

  thought("🎂");
  v56StartLiveParty(newStage);
};

/* Om gamla eventhandlers försöker använda gamla party-knappen,
   gör ingenting eftersom kortet inte längre visas. */
document.addEventListener("pointerdown",e=>{
  if(e.target.closest("#v50-party-close") && $("#v50-growth-party")?.classList.contains("v56-live-party")){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
},true);


/* =========================================================
   TIDVATTENPÖLEN v5.7
   ========================================================= */


/* =========================================================
   v8.1 – säker klickhantering
   ========================================================= */
function v81IsRealOctopusHit(e){
  if(!e?.target?.closest) return false;

  /* Hatt och halsband har egna klickfunktioner. */
  if(e.target.closest("#v66-hat,.v66-hat,#v4-necklace-svg")) return false;

  const svg=e.target.closest(".octopus-svg");
  if(!svg || !svg.closest("#octopus")) return false;

  const tag=(e.target.tagName||"").toLowerCase();
  return ["path","circle","ellipse","polygon","rect"].includes(tag);
}

/* ---------- HÖRNHANDEN SKA RÖRA SIG OCH KLAPPA ---------- */

function v57FindCornerHand(){
  return $("#hand-button") || $(".hand-button") || $("#pet-button");
}

async function v57PetFromCorner(){
  if(!state || actionLocked) return;
  actionLocked=true;

  const tank=$("#tank");
  const source=v57FindCornerHand();
  const tankRect=tank.getBoundingClientRect();
  const q=octoXY();

  let startX=90, startY=14;

  if(source){
    const r=source.getBoundingClientRect();
    startX=((r.left+r.width/2-tankRect.left)/tankRect.width)*100;
    startY=((r.top+r.height/2-tankRect.top)/tankRect.height)*100;
  }

  const hand=document.createElement("div");
  hand.id="v57-corner-hand-fly";
  hand.textContent="🖐️";
  hand.style.left=`${startX}%`;
  hand.style.top=`${startY}%`;
  tank.append(hand);

  if(source) source.style.opacity=".25";

  await delay(120);

  hand.style.left=`${q.x+4}%`;
  hand.style.top=`${q.y-8}%`;

  story(`Handen kommer fram och klappar ${state.name}.`);
  await delay(760);

  hand.classList.add("pet");
  thought("♥");

  state.trust=clamp((state.trust||0)+5);
  state.careMoments=(state.careMoments||0)+1;
  state.needs.safety=clamp((state.needs.safety||0)+8);
  state.needs.mood=clamp((state.needs.mood||0)+5);

  stat("pet",1);
  renderNeeds();
  profile();
  save();

  await delay(1700);

  hand.classList.remove("pet");
  hand.style.left=`${startX}%`;
  hand.style.top=`${startY}%`;
  await delay(650);

  hand.style.opacity="0";
  setTimeout(()=>hand.remove(),300);
  if(source) source.style.opacity="";

  actionLocked=false;
}

/* Klick på hörnhanden startar klappen. */
document.addEventListener("pointerdown",e=>{
  const source=e.target.closest("#hand-button,.hand-button,#pet-button");
  if(!source) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  v57PetFromCorner();
},true);

/* Klick direkt PÅ den målade bläckfisken använder handen.
   Genomskinligt område runt figuren släpper igenom klicket. */
document.addEventListener("pointerdown",e=>{
  if(!v81IsRealOctopusHit(e)) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  v57PetFromCorner();
},true);

/* ---------- GÖMMA SIG BAKOM ALGERNA PÅ RIKTIGT ---------- */

async function hideKelp(item){
  if(actionLocked) return;
  actionLocked=true;

  const oct=$("#octopus");
  const kelp=$(`.v4-object[data-kind="placed"][data-id="${item.id}"]`);

  if(!oct || !kelp){
    actionLocked=false;
    return;
  }

  await approach(item.x,item.y,-1);
  story(`${state.name} simmar fram till algerna för att gömma sig.`);

  /* Skapa en FRONTKOPIA av algerna som alltid ligger ovanpå bläckfisken. */
  const cover=kelp.cloneNode(true);
  cover.classList.add("v57-kelp-cover");
  cover.removeAttribute("data-id");
  cover.removeAttribute("data-kind");
  cover.style.left=`${item.x}%`;
  cover.style.top=`${item.y}%`;
  $("#tank").append(cover);

  /* Dölj originalet under tiden så det inte blir dubbla alger. */
  kelp.style.visibility="hidden";

  oct.classList.add("v57-behind-kelp");
  moveOcto(item.x,item.y+2,.28,700);

  await delay(750);
  story(`${state.name} är nu bakom algerna.`);
  thought("🙈");

  await delay(1500);

  /* Kikar fram lite från ena sidan men fortfarande bakom frontlagret. */
  moveOcto(item.x+3,item.y,.3,420);
  story(`${state.name} kikar fram lite mellan algerna.`);
  await delay(850);

  moveOcto(item.x,item.y+2,.28,380);
  await delay(650);

  /* Kommer ut igen. */
  moveOcto(item.x+14,item.y-7,.65,700);
  await delay(700);

  oct.classList.remove("v57-behind-kelp");
  cover.remove();
  kelp.style.visibility="";

  story(`${state.name} kommer fram från bakom algerna.`);
  actionLocked=false;
}

/* ---------- STIMULANS SKA GÅ UPP MER ---------- */

function v57Stimulate(amount=8,label="aktiviteten"){
  const before=state.needs.stimulation||0;
  state.needs.stimulation=clamp(before+amount);

  renderNeeds();
  save();

  const q=octoXY();
  const pop=document.createElement("div");
  pop.className="v57-stim-burst";
  pop.style.left=`${q.x}%`;
  pop.style.top=`${Math.max(10,q.y-8)}%`;
  pop.textContent=`🎲 +${amount}`;
  $("#tank").append(pop);
  setTimeout(()=>pop.remove(),1200);

  story(`${state.name} blir mer stimulerad av ${label}.`);
}

/* Sätt större ökningar för de viktigaste aktiviteterna. */
const v57PushBase=pushBall;
pushBall=async function(item){
  await v57PushBase(item);
  v57Stimulate(12,"bollleken");
};

const v57ThrowBase=throwBall;
throwBall=async function(item){
  await v57ThrowBase(item);
  v57Stimulate(14,"att kasta bollen");
};

const v57RingBase=swimRing;
swimRing=async function(item){
  await v57RingBase(item);
  v57Stimulate(13,"ringträningen");
};

const v57HoopBase=hoopRing;
hoopRing=async function(item){
  await v57HoopBase(item);
  v57Stimulate(12,"att leka med ringen");
};

const v57TowerBase=buildTower;
buildTower=async function(f){
  await v57TowerBase(f);
  v57Stimulate(15,"att bygga torn");
};

const v57SortBase=sortBlocks;
sortBlocks=async function(){
  await v57SortBase();
  v57Stimulate(14,"att sortera klossar");
};

const v57JarBase=openJar;
openJar=async function(item){
  await v57JarBase(item);
  v57Stimulate(15,"problemlösningen med burken");
};

const v57PuzzleBase=placePuzzlePiece;
placePuzzlePiece=async function(f){
  await v57PuzzleBase(f);
  v57Stimulate(14,"att lägga pussel");
};

const v57ThreadBase=unravelThread;
unravelThread=async function(f){
  await v57ThreadBase(f);
  v57Stimulate(12,"att leka med tråd");
};

const v57MagicBase=magic;
magic=async function(f){
  await v57MagicBase(f);
  v57Stimulate(12,"trollandet");
};

const v57InspectPlacedBase=inspectPlaced;
inspectPlaced=async function(item){
  await v57InspectPlacedBase(item);
  v57Stimulate(5,"att undersöka föremålet");
};

const v57InspectFoundBase=inspectFound;
inspectFound=async function(f){
  await v57InspectFoundBase(f);
  v57Stimulate(5,"att undersöka fyndet");
};

/* Extra lekfunktioner från senare versioner */
if(typeof v49RollAroundBall==="function"){
  const base=v49RollAroundBall;
  v49RollAroundBall=async function(item){
    await base(item);
    v57Stimulate(12,"att rulla runt bollen");
  };
}
if(typeof v49HoldBall==="function"){
  const base=v49HoldBall;
  v49HoldBall=async function(item){
    await base(item);
    v57Stimulate(8,"att hålla bollen");
  };
}
if(typeof v49SpinRing==="function"){
  const base=v49SpinRing;
  v49SpinRing=async function(item){
    await base(item);
    v57Stimulate(11,"att snurra ringen");
  };
}
if(typeof v49BuildBlockLine==="function"){
  const base=v49BuildBlockLine;
  v49BuildBlockLine=async function(){
    await base();
    v57Stimulate(13,"att bygga en rad med klossarna");
  };
}
if(typeof v49PlayOneBlock==="function"){
  const base=v49PlayOneBlock;
  v49PlayOneBlock=async function(f){
    await base(f);
    v57Stimulate(8,"att leka med klossen");
  };
}


/* =========================================================
   TIDVATTENPÖLEN v5.8
   ========================================================= */

let v58IdleToken=0;
let v58LastUserAction=Date.now();
let v58IdleBusy=false;

/* Spelarens klick går alltid först och avbryter bus direkt. */
document.addEventListener("pointerdown",()=>{
  v58LastUserAction=Date.now();
  v58IdleToken++;
  v58IdleBusy=false;

  $("#octopus")?.classList.remove("v58-dancing");
  $(".v58-idle-note")?.remove();
  $(".v58-idle-kelp-cover")?.remove();
  $$(".v4-object.v4-kelp").forEach(k=>k.style.visibility="");

  const oct=$("#octopus");
  if(oct){
    oct.style.zIndex="";
    oct.style.opacity="1";
  }
},true);

function v58IdleNote(text){
  $(".v58-idle-note")?.remove();
  const n=document.createElement("div");
  n.className="v58-idle-note";
  n.textContent=text;
  $("#tank")?.append(n);
  setTimeout(()=>n.remove(),2200);
}

function v58CanIdle(){
  if(!state || actionLocked || v58IdleBusy) return false;
  if(Date.now()-v58LastUserAction<9000) return false;
  if($("#game-screen")?.hidden) return false;
  const party=$("#v50-growth-party");
  if(party && !party.hidden) return false;
  return true;
}

/* ---------- EN ENDA RING + TYDLIG PASSAGE GENOM HÅLET ---------- */
async function swimRing(item){
  if(actionLocked)return;
  actionLocked=true;
  working(true);

  const oct=$("#octopus");
  const dir=item.x<55?1:-1;
  const startX=item.x-dir*27;
  const nearX=item.x-dir*11;
  const centerX=item.x;
  const emergeX=item.x+dir*11;
  const finishX=item.x+dir*28;

  moveOcto(startX,item.y,.68,850);
  await delay(900);

  hideRendered("placed",item.id);

  const stage=document.createElement("div");
  stage.className="v58-ring-stage";
  stage.style.left=`${item.x}%`;
  stage.style.top=`${item.y}%`;
  stage.innerHTML=`<div class="v58-ring-back"></div><div class="v58-ring-front"></div>`;
  $("#v4-action-layer").append(stage);

  oct.classList.add("v58-through-ring");

  story(`${state.name} simmar fram till hålet i ringen.`);
  moveOcto(nearX,item.y,.57,700);
  await delay(760);

  story(`${state.name} för armarna genom hålet först.`);
  await delay(600);

  oct.classList.add("v4-squeeze");
  moveOcto(centerX,item.y,.42,900);
  story(`${state.name} är mitt inne i ringens hål.`);
  await delay(950);

  moveOcto(emergeX,item.y,.55,820);
  story(`${state.name} kommer ut genom hålet på andra sidan.`);
  await delay(850);

  oct.classList.remove("v4-squeeze");
  moveOcto(finishX,item.y-2,.7,850);
  await delay(780);

  oct.classList.remove("v58-through-ring");
  clearActionProps();
  renderTank();

  learn("ringSwim");
  stat("ring",1);
  if(typeof v57Stimulate==="function")v57Stimulate(15,"att simma genom ringen");

  working(false);
  actionLocked=false;
}

/* ---------- BOLLKAST BLIR OLIKA VARJE GÅNG ---------- */
async function v58ThrowBallVariant(item,spontaneous=false){
  if(actionLocked)return;
  actionLocked=true;
  working(true);

  const start={x:item.x,y:item.y};
  const dir=start.x<50?1:-1;
  const variants=[
    {dx:14,arc:12,rot:420,y:3,text:"ett litet snabbt kast"},
    {dx:25,arc:28,rot:900,y:1,text:"ett högt kast"},
    {dx:20,arc:18,rot:650,y:-7,text:"ett snett kast"},
    {dx:10,arc:8,rot:260,y:8,text:"ett busigt kort kast"},
    {dx:30,arc:20,rot:1100,y:5,text:"ett långt kast"}
  ];
  const v=pick(variants);
  const endX=Math.max(8,Math.min(92,start.x+dir*v.dx));
  const endY=Math.max(55,Math.min(91,start.y+v.y));

  await approach(start.x,start.y,-dir);
  hideRendered("placed",item.id);
  const ball=makeProp(item.emoji||"🔵",start.x,start.y);

  const q=octoXY();
  ball.style.left=`${q.x+dir*3}%`;
  ball.style.top=`${q.y+7}%`;
  story(spontaneous?`${state.name} hittar på egen bolllek och gör ${v.text}.`:`${state.name} tar upp bollen och gör ${v.text}.`);
  await delay(650);

  ball.style.left=`${endX}%`;
  ball.style.top=`${Math.max(28,endY-v.arc)}%`;
  ball.style.transform=`translate(-50%,-50%) rotate(${v.rot}deg)`;
  await delay(720);

  ball.style.top=`${endY}%`;
  await delay(620);

  item.x=endX;item.y=endY;
  save();
  clearActionProps();
  renderTank();

  learn("ballThrow");
  stat("ball",1);
  if(typeof v57Stimulate==="function")v57Stimulate(spontaneous?9:14,"bollkastet");

  working(false);
  actionLocked=false;
}
throwBall=v58ThrowBallVariant;

/* ---------- BYGGA KLOSSAR MED SMÅ MISSTAG ---------- */
async function buildTower(clicked){
  if(actionLocked)return;
  const blocks=state.foundItems.filter(f=>f.kind==="block");
  if(blocks.length<2){toast("Det behövs minst två klossar.");return}

  actionLocked=true;
  working(true);

  const buildX=clicked.x,buildY=clicked.y;
  story(`${state.name} börjar samla klossarna för att bygga ett torn.`);

  const props=new Map();
  blocks.forEach(b=>{
    hideRendered("found",b.id);
    props.set(b.id,makeProp(b.emoji,b.x,b.y));
  });

  const tower=blocks.slice(0,Math.min(6,blocks.length));

  for(let i=0;i<tower.length;i++){
    const b=tower[i],p=props.get(b.id);

    await approach(b.x,b.y,-1);
    const q=octoXY();
    p.style.left=`${q.x+4}%`;p.style.top=`${q.y+7}%`;
    await delay(420);

    moveOcto(buildX-7,buildY-7,.7,620);
    p.style.left=`${buildX}%`;
    p.style.top=`${buildY-i*5}%`;
    await delay(600);

    /* Ibland tappar han klossen och får hämta upp den igen. */
    if(Math.random()<.28){
      const dropX=Math.max(8,Math.min(92,buildX+rand(-10,10)));
      const dropY=Math.min(91,buildY+8);
      p.style.left=`${dropX}%`;
      p.style.top=`${dropY}%`;
      p.style.transform="translate(-50%,-50%) rotate(90deg)";
      story(`${state.name} tappar klossen!`);
      thought("😮");
      await delay(650);

      moveOcto(dropX-6,dropY-6,.68,520);
      await delay(540);
      p.style.left=`${buildX}%`;
      p.style.top=`${buildY-i*5}%`;
      p.style.transform="translate(-50%,-50%) rotate(0deg)";
      story(`${state.name} plockar upp den och försöker igen.`);
      await delay(650);
    }

    b.x=buildX;b.y=buildY-i*5;
  }

  blocks.slice(tower.length).forEach((b,i)=>{
    b.x=buildX+14+(i%2)*7;
    b.y=buildY+Math.floor(i/2)*5;
  });

  story(`${state.name} tittar nöjt på tornet.`);
  save();
  clearActionProps();
  renderTank();

  learn("blockStack");
  stat("tower",1);
  if(typeof v57Stimulate==="function")v57Stimulate(15,"att bygga torn");

  working(false);
  actionLocked=false;
}

/* ---------- SJÄLVGÅENDE BUS NÄR SPELAREN ÄR PASSIV ---------- */
async function v58IdleDance(token){
  if(token!==v58IdleToken)return;
  v58IdleBusy=true;
  const oct=$("#octopus");
  v58IdleNote(`${state.name} börjar dansa lite själv 🎶`);
  story(`${state.name} hittar på lite eget och börjar dansa.`);
  oct.classList.add("v58-dancing");

  for(let i=0;i<5;i++){
    if(token!==v58IdleToken)break;
    moveOcto(rand(35,65),rand(42,62),rand(.5,.72),520);
    await delay(560);
  }

  oct.classList.remove("v58-dancing");
  v58IdleBusy=false;
}

async function v58IdleHide(token){
  const kelps=state.placedItems.filter(p=>p.type==="kelp");
  if(!kelps.length)return v58IdleDance(token);
  if(token!==v58IdleToken)return;

  v58IdleBusy=true;
  const item=pick(kelps);
  const real=$(`.v4-object[data-kind="placed"][data-id="${item.id}"]`);
  const oct=$("#octopus");
  if(!real||!oct){v58IdleBusy=false;return}

  v58IdleNote(`${state.name} smyger iväg och gömmer sig 🙈`);
  moveOcto(item.x-8,item.y-6,.55,700);
  await delay(720);
  if(token!==v58IdleToken){v58IdleBusy=false;return}

  const cover=real.cloneNode(true);
  cover.classList.add("v57-kelp-cover","v58-idle-kelp-cover");
  cover.removeAttribute("data-id");
  cover.removeAttribute("data-kind");
  cover.style.left=`${item.x}%`;
  cover.style.top=`${item.y}%`;
  $("#tank").append(cover);
  real.style.visibility="hidden";

  oct.style.zIndex="170";
  moveOcto(item.x,item.y+2,.28,650);
  story(`${state.name} gömmer sig bakom algerna.`);
  await delay(1500);

  if(token===v58IdleToken){
    moveOcto(item.x+3,item.y,.3,400);
    story(`${state.name} kikar fram lite busigt.`);
    await delay(800);
  }

  cover.remove();
  real.style.visibility="";
  oct.style.zIndex="";
  if(token===v58IdleToken)moveOcto(item.x+13,item.y-7,.62,650);
  v58IdleBusy=false;
}

async function v58IdleBall(token){
  const balls=state.placedItems.filter(p=>p.type==="ball");
  if(!balls.length)return v58IdleDance(token);
  if(token!==v58IdleToken)return;

  v58IdleBusy=true;
  const ball=pick(balls);

  /* 50/50 mellan spontan putt och varierat kast. */
  if(Math.random()<.5){
    v58IdleNote(`${state.name} hittar bollen och börjar leka själv ⚽`);
    v58IdleBusy=false;
    await v58ThrowBallVariant(ball,true);
  }else{
    v58IdleNote(`${state.name} rullar iväg bollen själv ⚽`);
    v58IdleBusy=false;
    await pushBall(ball);
  }
}

async function v58IdleSwim(token){
  if(token!==v58IdleToken)return;
  v58IdleBusy=true;
  v58IdleNote(`${state.name} gör en liten simtur 🐙`);
  for(let i=0;i<3;i++){
    if(token!==v58IdleToken)break;
    moveOcto(rand(18,82),rand(34,68),rand(.45,.72),900);
    await delay(950);
  }
  v58IdleBusy=false;
}

function v58RunIdle(){
  if(!v58CanIdle())return;

  const token=++v58IdleToken;
  const choices=[
    ()=>v58IdleDance(token),
    ()=>v58IdleSwim(token)
  ];

  if(state.placedItems.some(p=>p.type==="kelp")){
    choices.push(()=>v58IdleHide(token),()=>v58IdleHide(token));
  }
  if(state.placedItems.some(p=>p.type==="ball")){
    choices.push(()=>v58IdleBall(token),()=>v58IdleBall(token));
  }

  pick(choices)();
  v58LastUserAction=Date.now();
}

function v58InstallIdle(){
  if(timers?.idle)clearInterval(timers.idle);
  timers.idle=setInterval(v58RunIdle,5000);
}
setTimeout(v58InstallIdle,300);

/* Nya spel som går in senare ska också få nya idle-systemet. */
const v58StartLoopsBase=startLoops;
startLoops=function(){
  v58StartLoopsBase();
  setTimeout(v58InstallIdle,60);
};

/* ---------- MISSNÖJD MIN NÄR BEHOVEN INTE ÄR BRA ---------- */
function v58UpdateExpression(){
  if(!state)return;
  const oct=$("#octopus");
  const mouth=$("#octopus .mouth");
  if(!oct||!mouth)return;

  const n=state.needs;
  const bad=Math.min(n.hunger,n.energy,n.safety,n.stimulation)<35 || n.mood<42;
  const medium=!bad && (Math.min(n.hunger,n.energy,n.safety,n.stimulation)<55 || n.mood<58);

  oct.classList.toggle("v58-unhappy",bad);

  if(bad){
    /* Frown: mitten går upp istället för ner. */
    mouth.setAttribute("d","M119 132 Q134 118 149 132");
  }else if(medium){
    mouth.setAttribute("d","M119 130 Q134 128 149 130");
  }else{
    mouth.setAttribute("d","M119 128 Q134 138 149 128");
  }
}

const v58RenderNeedsBase=renderNeeds;
renderNeeds=function(){
  v58RenderNeedsBase();
  v58UpdateExpression();
};
setTimeout(v58UpdateExpression,200);


/* =========================================================
   TIDVATTENPÖLEN v5.9
   ========================================================= */

/* ---------- hjärtan ---------- */
function v59Hearts(count=20){
  const q=octoXY();
  const tank=$("#tank");
  const symbols=["❤️","💗","💕","💖"];
  for(let i=0;i<count;i++){
    const h=document.createElement("div");
    h.className="v59-heart";
    h.textContent=pick(symbols);
    h.style.left=`${q.x+rand(-10,10)}%`;
    h.style.top=`${q.y+rand(-6,8)}%`;
    h.style.animationDelay=`${Math.random()*.45}s`;
    h.style.fontSize=`${16+Math.random()*14}px`;
    tank.append(h);
    setTimeout(()=>h.remove(),2100);
  }
}

/* ---------- stora handen nere till höger klappar ---------- */
async function v59PetWithRealHand(){
  if(!state || actionLocked) return;
  actionLocked=true;

  const hand=$("#hand");
  const oct=$("#octopus");
  const tank=$("#tank");
  if(!hand || !oct || !tank){
    actionLocked=false;
    return;
  }

  const tankRect=tank.getBoundingClientRect();
  const handRect=hand.getBoundingClientRect();
  const startX=((handRect.left+handRect.width/2-tankRect.left)/tankRect.width)*100;
  const startY=((handRect.top+handRect.height/2-tankRect.top)/tankRect.height)*100;

  const old={
    position:hand.style.position,
    left:hand.style.left,
    top:hand.style.top,
    transform:hand.style.transform
  };

  hand.style.position="absolute";
  hand.style.left=`${startX}%`;
  hand.style.top=`${startY}%`;

  const q=octoXY();
  hand.style.left=`${q.x+5}%`;
  hand.style.top=`${q.y-7}%`;
  story(`Handen kommer fram och klappar ${state.name}.`);
  await delay(750);

  hand.classList.add("v59-petting");
  oct.classList.add("v59-cuddle");
  working(true);

  moveOcto(q.x+2,q.y-2,.7,350);
  story(`${state.name} gosar tillbaka mot handen.`);
  thought("❤️");
  v59Hearts(24);

  state.trust=clamp((state.trust||0)+6);
  state.careMoments=(state.careMoments||0)+1;
  state.needs.safety=clamp((state.needs.safety||0)+10);
  state.needs.mood=clamp((state.needs.mood||0)+7);

  stat("pet",1);
  renderNeeds();
  profile();
  save();

  await delay(1500);

  const n=state.needs;
  const doingWell=
    n.hunger>=60 && n.energy>=55 && n.safety>=60 &&
    n.stimulation>=55 && n.mood>=60;

  if(doingWell){
    oct.classList.remove("v59-cuddle");
    oct.classList.add("v59-happy-bus");
    story(`${state.name} mår bra och börjar busa med handen!`);
    for(let i=0;i<3;i++){
      const qq=octoXY();
      moveOcto(
        Math.max(12,Math.min(88,qq.x+rand(-9,9))),
        Math.max(24,Math.min(78,qq.y+rand(-7,6))),
        .72,430
      );
      v59Hearts(6);
      await delay(470);
    }
    oct.classList.remove("v59-happy-bus");
  }

  hand.classList.remove("v59-petting");
  oct.classList.remove("v59-cuddle");
  working(false);

  hand.style.left=`${startX}%`;
  hand.style.top=`${startY}%`;
  await delay(700);

  hand.style.position=old.position;
  hand.style.left=old.left;
  hand.style.top=old.top;
  hand.style.transform=old.transform;
  actionLocked=false;
}

v46PetOctopus=v59PetWithRealHand;
if(typeof v54PetWithHand==="function")v54PetWithHand=v59PetWithRealHand;
if(typeof v57PetFromCorner==="function")v57PetFromCorner=v59PetWithRealHand;

document.addEventListener("pointerdown",e=>{
  const handHit=e.target.closest?.("#hand");
  const octHit=v81IsRealOctopusHit(e);
  if(!handHit && !octHit) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  v59PetWithRealHand();
},true);

/* ---------- exakt EN ring ---------- */
async function swimRing(item){
  if(actionLocked)return;
  actionLocked=true;
  working(true);

  const oct=$("#octopus");
  const original=$(`.v4-object[data-kind="placed"][data-id="${item.id}"]`);
  if(original) original.style.visibility="hidden";

  const dir=item.x<55?1:-1;
  const stage=document.createElement("div");
  stage.className="v59-ring-stage";
  stage.style.left=`${item.x}%`;
  stage.style.top=`${item.y}%`;

  stage.innerHTML=`
    <svg class="v59-ring-back" viewBox="0 0 120 120" aria-hidden="true">
      <path d="M17 60 A43 43 0 0 1 103 60"
            fill="none" stroke="#e4b44c" stroke-width="14" stroke-linecap="round"/>
    </svg>
    <svg class="v59-ring-front" viewBox="0 0 120 120" aria-hidden="true">
      <path d="M17 60 A43 43 0 0 0 103 60"
            fill="none" stroke="#e4b44c" stroke-width="14" stroke-linecap="round"/>
    </svg>`;
  $("#v4-action-layer").append(stage);

  moveOcto(item.x-dir*28,item.y,.68,850);
  await delay(900);
  story(`${state.name} simmar rakt mot hålet i ringen.`);
  moveOcto(item.x-dir*11,item.y,.56,700);
  await delay(700);

  oct.classList.add("v4-squeeze");
  moveOcto(item.x,item.y,.42,900);
  story(`${state.name} är mitt inne i ringens hål.`);
  await delay(900);

  moveOcto(item.x+dir*11,item.y,.55,820);
  story(`${state.name} kommer ut genom hålet på andra sidan.`);
  await delay(850);

  oct.classList.remove("v4-squeeze");
  moveOcto(item.x+dir*29,item.y-2,.7,850);
  await delay(700);

  clearActionProps();
  if(original) original.style.visibility="";
  renderTank();

  learn("ringSwim");
  stat("ring",1);
  if(typeof v57Stimulate==="function")v57Stimulate(15,"att simma genom ringen");
  working(false);
  actionLocked=false;
}

/* ---------- behov sjunker långsammare ---------- */
const v59StartLoopsBase=startLoops;
startLoops=function(){
  v59StartLoopsBase();

  if(timers.decay)clearInterval(timers.decay);
  timers.decay=setInterval(()=>{
    state.needs.hunger=clamp(state.needs.hunger-.75);
    state.needs.energy=clamp(state.needs.energy-.42);
    state.needs.stimulation=clamp(state.needs.stimulation-1.0);
    state.needs.safety=clamp(state.needs.safety-.15);
    renderNeeds();
    save();
  },8000);
};

/* ---------- fler roliga sandfynd ---------- */
function v59CountType(type){
  return (state.foundItems||[]).filter(f=>f.type===type).length;
}

function randomDigFind(){
  const pool=[];
  const add=(weight,type,make,allow=true)=>{
    if(!allow)return;
    let w=weight;
    if((state.v48RecentFindTypes||[]).includes(type))w=Math.max(1,Math.floor(w*.3));
    for(let i=0;i<w;i++)pool.push({type,make});
  };

  add(24,"puzzle-piece",()=>({name:"Pusselbit",emoji:"🧩",kind:"odd",type:"puzzle-piece"}));
  add(24,"block",()=>{
    const [name,emoji]=pick(BLOCKS);
    return {name,emoji,kind:"block",type:"block"};
  });

  add(9,"rubber-duck",()=>({name:"Liten badanka",emoji:"🐤",kind:"odd",type:"rubber-duck"}),v59CountType("rubber-duck")<1);
  add(9,"tiny-boat",()=>({name:"Liten leksaksbåt",emoji:"⛵",kind:"odd",type:"tiny-boat"}),v59CountType("tiny-boat")<1);
  add(8,"marble",()=>({name:"Glaskula",emoji:"🔮",kind:"odd",type:"marble"}),v59CountType("marble")<2);
  add(8,"feather",()=>({name:"Mjuk fjäder",emoji:"🪶",kind:"odd",type:"feather"}),v59CountType("feather")<1);
  add(7,"tiny-crown",()=>({name:"Liten krona",emoji:"👑",kind:"odd",type:"tiny-crown"}),v59CountType("tiny-crown")<1);
  add(7,"star-toy",()=>({name:"Sjöstjärneleksak",emoji:"⭐",kind:"odd",type:"star-toy"}),v59CountType("star-toy")<1);
  add(7,"spinner",()=>({name:"Snurrleksak",emoji:"🌀",kind:"odd",type:"spinner"}),v59CountType("spinner")<1);
  add(7,"shell-toy",()=>({name:"Rasselsnäcka",emoji:"🐚",kind:"odd",type:"shell-toy"}),v59CountType("shell-toy")<1);

  add(10,"thread",()=>{
    const [n,c]=pick(THREAD_COLORS);
    return {name:`${n[0].toUpperCase()+n.slice(1)} tråd`,emoji:"🧵",kind:"odd",type:"thread",threadColor:c};
  });

  add(7,"jewelry",()=>{
    const j=typeof v43RandomJewelry==="function"?v43RandomJewelry():{...pick(JEWELRY)};
    return {...j,kind:"odd",type:"jewelry"};
  });

  add(5,"coin",()=>({name:"Mynt",emoji:"🪙",kind:"odd",type:"coin"}),v59CountType("coin")<2);
  add(4,"key",()=>({name:"Nyckel",emoji:"🔑",kind:"odd",type:"key"}),v59CountType("key")<1);
  add(4,"die",()=>({name:"Tärning",emoji:"🎲",kind:"odd",type:"die"}),v59CountType("die")<1);
  add(3,"mirror",()=>({name:"Spegel",emoji:"🪞",kind:"odd",type:"mirror"}),v59CountType("mirror")<1);
  add(5,"gem",()=>({name:"Glittrande sten",emoji:"💎",kind:"odd",type:"gem"}),v59CountType("gem")<2);

  const chosen=pick(pool);
  const result=chosen.make();
  state.v48RecentFindTypes ||= [];
  state.v48RecentFindTypes.push(chosen.type);
  state.v48RecentFindTypes=state.v48RecentFindTypes.slice(-3);
  save();
  return result;
}

/* ---------- mer varierade saker i burken, inkl gosig bläckfisk ---------- */
function randomJarReward(){
  const rewards=[
    {name:"Pusselbit",emoji:"🧩",kind:"odd",type:"puzzle-piece"},
    {name:"Tärning",emoji:"🎲",kind:"odd",type:"die"},
    {name:"Mynt",emoji:"🪙",kind:"odd",type:"coin"},
    {name:"Glittrande sten",emoji:"💎",kind:"odd",type:"gem"},
    {name:"Mjuk liten bläckfisk",emoji:"🐙",kind:"odd",type:"octo-plush"},
    {name:"Liten badanka",emoji:"🐤",kind:"odd",type:"rubber-duck"},
    {name:"Miniatyrbåt",emoji:"⛵",kind:"odd",type:"tiny-boat"},
    {name:"Liten krona",emoji:"👑",kind:"odd",type:"tiny-crown"},
    {name:"Färgad glaskula",emoji:"🔮",kind:"odd",type:"marble"},
    (()=>{
      const [name,emoji]=pick(BLOCKS);
      return {name,emoji,kind:"block",type:"block"};
    })()
  ];
  return {...pick(rewards)};
}

/* ---------- egna handlingar för nya fynd ---------- */
const v59ActionsFoundBase=actionsForFound;
actionsForFound=function(f){
  if(f.type==="octo-plush"){
    return [
      {label:"🐙 Gosa med bläckfisken",run:()=>v59CuddlePlush(f)},
      {label:"🫳 Bär runt",run:()=>v49CarryToy(f)},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }
  if(f.type==="rubber-duck"||f.type==="marble"){
    return [
      {label:"👉 Putta iväg",run:()=>v59PushFound(f)},
      {label:"🫳 Bär runt",run:()=>v49CarryToy(f)},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }
  if(f.type==="tiny-boat"){
    return [
      {label:"⛵ Segla med båten",run:()=>v59SailBoat(f)},
      {label:"🫳 Bär runt",run:()=>v49CarryToy(f)},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }
  if(f.type==="feather"){
    return [
      {label:"🪶 Kittla sig",run:()=>v59Feather(f)},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }
  if(f.type==="tiny-crown"){
    return [
      {label:"👑 Prova kronan",run:()=>v59Crown(f)},
      {label:"🔎 Undersök",run:()=>inspectFound(f)}
    ];
  }
  return v59ActionsFoundBase(f);
};

async function v59CuddlePlush(f){
  if(actionLocked)return;
  actionLocked=true;working(true);
  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);
  const p=makeProp(f.emoji,f.x,f.y);
  const q=octoXY();
  p.style.left=`${q.x+3}%`;p.style.top=`${q.y+8}%`;
  story(`${state.name} håller den lilla mjuka bläckfisken tätt intill sig.`);
  thought("💕");
  v59Hearts(8);
  await delay(1700);
  clearActionProps();renderTank();
  state.needs.safety=clamp(state.needs.safety+6);
  state.needs.mood=clamp(state.needs.mood+5);
  if(typeof v57Stimulate==="function")v57Stimulate(7,"goset med mjukdjuret");
  renderNeeds();save();
  working(false);actionLocked=false;
}

async function v59PushFound(f){
  if(actionLocked)return;
  actionLocked=true;working(true);
  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);
  const p=makeProp(f.emoji,f.x,f.y);
  const dir=f.x<55?1:-1;
  const nx=Math.max(8,Math.min(92,f.x+dir*18));
  const ny=Math.min(91,f.y+3);
  p.style.left=`${nx}%`;p.style.top=`${ny}%`;p.style.transform="translate(-50%,-50%) rotate(420deg)";
  moveOcto(nx-dir*7,ny-6,.68,700);
  await delay(850);
  f.x=nx;f.y=ny;save();
  clearActionProps();renderTank();
  if(typeof v57Stimulate==="function")v57Stimulate(9,"leken");
  working(false);actionLocked=false;
}

async function v59SailBoat(f){
  if(actionLocked)return;
  actionLocked=true;working(true);
  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);
  const p=makeProp(f.emoji,f.x,f.y);
  const nx=Math.max(10,Math.min(90,f.x+rand(-22,22)));
  const ny=Math.max(45,Math.min(82,f.y-18));
  story(`${state.name} puttar ut den lilla båten och simmar efter den.`);
  p.style.left=`${nx}%`;p.style.top=`${ny}%`;
  moveOcto(nx-7,ny+4,.65,900);
  await delay(950);
  f.x=nx;f.y=ny;save();
  clearActionProps();renderTank();
  if(typeof v57Stimulate==="function")v57Stimulate(10,"båtleken");
  working(false);actionLocked=false;
}

async function v59Feather(f){
  if(actionLocked)return;
  actionLocked=true;working(true);
  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);
  const p=makeProp(f.emoji,f.x,f.y);
  const q=octoXY();p.style.left=`${q.x+3}%`;p.style.top=`${q.y+4}%`;
  story(`${state.name} kittlar sig med fjädern och sprattlar till.`);
  $("#octopus")?.classList.add("v59-happy-bus");
  await delay(1300);
  $("#octopus")?.classList.remove("v59-happy-bus");
  clearActionProps();renderTank();
  if(typeof v57Stimulate==="function")v57Stimulate(9,"kittelleken");
  working(false);actionLocked=false;
}

async function v59Crown(f){
  if(actionLocked)return;
  actionLocked=true;working(true);
  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);
  const p=makeProp("👑",f.x,f.y);
  const q=octoXY();p.style.left=`${q.x}%`;p.style.top=`${q.y-11}%`;
  story(`${state.name} provar den lilla kronan och poserar stolt.`);
  await delay(1700);
  clearActionProps();renderTank();
  if(typeof v57Stimulate==="function")v57Stimulate(8,"att prova kronan");
  working(false);actionLocked=false;
}

/* ---------- pusslet ska gå att flytta ---------- */
state.puzzlePos ||= {x:58,y:70};

const v59EnsurePuzzleBase=ensurePuzzleBoard;
ensurePuzzleBoard=function(){
  const b=v59EnsurePuzzleBase();
  if(!b)return b;
  b.style.left=`${state.puzzlePos.x}%`;
  b.style.top=`${state.puzzlePos.y}%`;
  return b;
};

function v59InstallPuzzleDrag(){
  const tank=$("#tank");
  if(!tank)return;

  let drag=null;

  tank.addEventListener("pointerdown",e=>{
    const board=e.target.closest("#v4-puzzle-board");
    if(!board)return;
    if(e.target.closest("#v4-puzzle-close"))return;

    e.preventDefault();
    e.stopPropagation();

    drag={board,pid:e.pointerId};
    board.classList.add("v59-dragging");
    try{board.setPointerCapture(e.pointerId)}catch{}
  },true);

  tank.addEventListener("pointermove",e=>{
    if(!drag || drag.pid!==e.pointerId)return;
    e.preventDefault();
    e.stopPropagation();

    const r=tank.getBoundingClientRect();
    const x=Math.max(12,Math.min(88,((e.clientX-r.left)/r.width)*100));
    const y=Math.max(18,Math.min(86,((e.clientY-r.top)/r.height)*100));

    state.puzzlePos={x,y};
    drag.board.style.left=`${x}%`;
    drag.board.style.top=`${y}%`;
  },true);

  tank.addEventListener("pointerup",e=>{
    if(!drag || drag.pid!==e.pointerId)return;
    e.preventDefault();
    e.stopPropagation();
    drag.board.classList.remove("v59-dragging");
    drag=null;
    save();
  },true);
}

setTimeout(v59InstallPuzzleDrag,180);


/* =========================================================
   TIDVATTENPÖLEN v6.0
   ========================================================= */

state.soundOn = state.soundOn ?? true;
state.puzzleRound = state.puzzleRound || 1;
state.puzzleCompleted = state.puzzleCompleted || 0;

/* ---------- LJUD ---------- */
let v60AudioCtx=null;

function v60Ctx(){
  if(!state.soundOn) return null;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) return null;
  if(!v60AudioCtx){
    try{v60AudioCtx=new AC()}catch{return null}
  }
  if(v60AudioCtx.state==="suspended"){
    v60AudioCtx.resume?.();
  }
  return v60AudioCtx;
}

function v60Tone(freq=440,dur=.08,vol=.025,type="sine",delaySec=0){
  const ctx=v60Ctx();
  if(!ctx) return;
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  const start=ctx.currentTime+delaySec;
  osc.type=type;
  osc.frequency.setValueAtTime(freq,start);
  gain.gain.setValueAtTime(vol,start);
  gain.gain.exponentialRampToValueAtTime(.0001,start+dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start+dur);
}

function v60Sound(name){
  if(!state.soundOn)return;
  const sounds={
    pet:()=>{v60Tone(520,.08,.02,"sine");v60Tone(660,.11,.018,"sine",.09);v60Tone(780,.12,.016,"sine",.18)},
    heart:()=>{v60Tone(700,.06,.015,"triangle");v60Tone(880,.08,.012,"triangle",.07)},
    dig:()=>{v60Tone(150,.05,.012,"square");v60Tone(120,.05,.009,"square",.06)},
    find:()=>{v60Tone(660,.07,.018,"triangle");v60Tone(880,.1,.016,"triangle",.09)},
    ball:()=>{v60Tone(220,.05,.018,"sine");v60Tone(330,.06,.014,"sine",.12)},
    blockdrop:()=>{v60Tone(140,.08,.022,"square");},
    puzzle:()=>{v60Tone(523,.08,.02,"triangle");v60Tone(659,.08,.018,"triangle",.09);v60Tone(784,.1,.018,"triangle",.18)},
    win:()=>{v60Tone(523,.11,.022,"triangle");v60Tone(659,.11,.02,"triangle",.12);v60Tone(784,.12,.02,"triangle",.24);v60Tone(1046,.18,.022,"triangle",.38)},
    splash:()=>{v60Tone(240,.04,.012,"sine");v60Tone(180,.08,.009,"sine",.05)}
  };
  sounds[name]?.();
}

function v60InstallSoundToggle(){
  if($("#v60-sound-toggle"))return;
  const b=document.createElement("button");
  b.id="v60-sound-toggle";
  b.type="button";
  b.textContent=state.soundOn?"🔊 Ljud":"🔇 Ljud";
  b.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    state.soundOn=!state.soundOn;
    b.textContent=state.soundOn?"🔊 Ljud":"🔇 Ljud";
    save();
    if(state.soundOn)v60Sound("find");
  });
  $("#tank")?.append(b);
}
setTimeout(v60InstallSoundToggle,250);

/* ---------- HJÄRTAN ---------- */
function v60Hearts(count=26){
  const q=octoXY();
  const tank=$("#tank");
  const chars=["❤️","💗","💕","💖","💞"];
  for(let i=0;i<count;i++){
    const h=document.createElement("div");
    h.className="v60-heart";
    h.textContent=pick(chars);
    h.style.left=`${q.x+rand(-12,12)}%`;
    h.style.top=`${q.y+rand(-8,8)}%`;
    h.style.animationDelay=`${Math.random()*.45}s`;
    h.style.fontSize=`${16+Math.random()*16}px`;
    tank.append(h);
    setTimeout(()=>h.remove(),2200);
  }
}

/* ---------- ENDAST DEN BEFINTLIGA HANDEN NERE TILL HÖGER ---------- */
async function v60PetWithExistingHand(){
  if(!state || actionLocked)return;
  actionLocked=true;

  const hand=$("#hand");
  const oct=$("#octopus");
  const tank=$("#tank");

  if(!hand || !oct || !tank){
    actionLocked=false;
    return;
  }

  /* Spara handens riktiga hörnläge. Ingen extra hand skapas. */
  const tankRect=tank.getBoundingClientRect();
  const r=hand.getBoundingClientRect();
  const startX=((r.left+r.width/2-tankRect.left)/tankRect.width)*100;
  const startY=((r.top+r.height/2-tankRect.top)/tankRect.height)*100;

  const old={
    position:hand.style.position,
    left:hand.style.left,
    top:hand.style.top,
    right:hand.style.right,
    bottom:hand.style.bottom,
    transform:hand.style.transform
  };

  hand.classList.add("v60-moving");
  hand.style.right="auto";
  hand.style.bottom="auto";
  hand.style.left=`${startX}%`;
  hand.style.top=`${startY}%`;

  const q=octoXY();
  hand.style.left=`${q.x+6}%`;
  hand.style.top=`${q.y-5}%`;
  story(`Handen kommer fram för att mysa med ${state.name}.`);
  v60Sound("pet");
  await delay(720);

  hand.classList.add("v60-mys");
  oct.classList.add("v60-mys-back");
  thought("❤️");
  v60Hearts(30);

  state.trust=clamp((state.trust||0)+7);
  state.careMoments=(state.careMoments||0)+1;
  state.needs.safety=clamp((state.needs.safety||0)+11);
  state.needs.mood=clamp((state.needs.mood||0)+8);

  stat("pet",1);
  renderNeeds();
  profile();
  save();

  story(`${state.name} gosar tillbaka mot handen.`);
  await delay(1750);

  const n=state.needs;
  const feelsGreat=
    n.hunger>=62 && n.energy>=58 && n.safety>=65 &&
    n.stimulation>=58 && n.mood>=65;

  if(feelsGreat){
    const tricks=[
      async()=>{story(`${state.name} blir överlycklig och gör en liten dans!`);oct.classList.add("v59-happy-bus");await delay(1200);oct.classList.remove("v59-happy-bus");},
      async()=>{story(`${state.name} cirklar busigt runt handen.`);moveOcto(q.x-7,q.y-4,.7,430);await delay(450);moveOcto(q.x+8,q.y-5,.7,430);await delay(450);moveOcto(q.x,q.y,.7,430);await delay(450);},
      async()=>{story(`${state.name} sträcker armarna mot handen och vill mysa mer.`);v60Hearts(18);v60Sound("heart");await delay(1200);}
    ];
    await pick(tricks)();
  }

  hand.classList.remove("v60-mys");
  oct.classList.remove("v60-mys-back");

  hand.style.left=`${startX}%`;
  hand.style.top=`${startY}%`;
  await delay(650);

  hand.classList.remove("v60-moving");
  hand.style.position=old.position;
  hand.style.left=old.left;
  hand.style.top=old.top;
  hand.style.right=old.right;
  hand.style.bottom=old.bottom;
  hand.style.transform=old.transform;

  actionLocked=false;
}

/* Blockera äldre extra-handssystem och använd bara #hand. */
v46PetOctopus=v60PetWithExistingHand;
v54PetWithHand=v60PetWithExistingHand;
v57PetFromCorner=v60PetWithExistingHand;
v59PetWithRealHand=v60PetWithExistingHand;

document.addEventListener("pointerdown",e=>{
  const handHit=e.target.closest?.("#hand");
  const octHit=v81IsRealOctopusHit(e);
  if(!handHit && !octHit)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  v60PetWithExistingHand();
},true);

/* Ta bort eventuella gamla tillfälliga händer om någon äldre kod hann skapa dem. */
function v60RemoveFakeHands(){
  $("#v54-hand")?.remove();
  $("#v57-corner-hand-fly")?.remove();
}
setInterval(v60RemoveFakeHands,500);

/* ---------- PUSSEL: KLART = KONFETTI + NYTT PUSSEL ---------- */
function v60Confetti(count=50){
  const tank=$("#tank");
  const q={x:50,y:45};
  const bits=["🎉","✨","🎊","⭐","💫"];
  for(let i=0;i<count;i++){
    const c=document.createElement("div");
    c.className="v60-confetti";
    c.textContent=pick(bits);
    c.style.left=`${q.x+rand(-8,8)}%`;
    c.style.top=`${q.y+rand(-5,5)}%`;
    c.style.setProperty("--dx",`${rand(-180,180)}px`);
    c.style.setProperty("--dy",`${rand(-150,190)}px`);
    c.style.setProperty("--rot",`${rand(-540,540)}deg`);
    c.style.animationDelay=`${Math.random()*.3}s`;
    tank.append(c);
    setTimeout(()=>c.remove(),2400);
  }
}

function v60PuzzleWinNote(){
  $("#v60-puzzle-win")?.remove();
  const n=document.createElement("div");
  n.id="v60-puzzle-win";
  n.textContent="🎉 Pusslet är klart! Nu finns ett nytt pussel att leta efter.";
  $("#tank")?.append(n);
  setTimeout(()=>n.remove(),3600);
}

function v60ResetPuzzleForNextRound(){
  state.puzzleRound=(state.puzzleRound||1)+1;
  state.puzzleCompleted=(state.puzzleCompleted||0)+1;

  /* Ta bort pusselbitar från gamla pusslet så nästa omgång börjar från noll. */
  state.foundItems=(state.foundItems||[]).filter(f=>f.type!=="puzzle-piece");

  /* Återställ de vanligaste pusselräknarna som använts i tidigare versioner. */
  state.puzzlePieces=0;
  state.puzzleProgress=0;
  state.puzzleHidden=true;

  save();
  $("#v4-puzzle-board")?.remove();
  renderTank();

  story(`Ett nytt pussel har gömts i sanden. Leta efter nya pusselbitar! 🧩`);
}

function v60PuzzleIsComplete(){
  const pieces=(state.foundItems||[]).filter(f=>f.type==="puzzle-piece");
  const explicitTotal=Number(state.puzzleTotal||state.puzzleNeeded||0);

  if(explicitTotal>0)return pieces.length>=explicitTotal;

  /* Om gamla pusslet använder visuella platser, räkna dem. */
  const board=$("#v4-puzzle-board");
  if(board){
    const slots=board.querySelectorAll(".puzzle-slot,.v4-puzzle-slot,[data-puzzle-slot]").length;
    const filled=board.querySelectorAll(".filled,.done,.placed,[data-filled='true']").length;
    if(slots>0 && filled>=slots)return true;
  }

  /* Fallback för prototypen: sex pusselbitar = ett färdigt pussel. */
  return pieces.length>=6;
}

let v60PuzzleCelebrating=false;
async function v60CheckPuzzleComplete(){
  if(v60PuzzleCelebrating || !v60PuzzleIsComplete())return;
  v60PuzzleCelebrating=true;

  v60Sound("win");
  v60Confetti(55);
  v60PuzzleWinNote();
  story(`${state.name} klarade pusslet! 🎉`);
  state.needs.stimulation=clamp((state.needs.stimulation||0)+18);
  state.needs.mood=clamp((state.needs.mood||0)+10);
  renderNeeds();
  save();

  await delay(3000);
  v60ResetPuzzleForNextRound();
  v60PuzzleCelebrating=false;
}

/* Kontrollera efter varje pusselbit som placeras. */
const v60PuzzlePlaceBase=placePuzzlePiece;
placePuzzlePiece=async function(f){
  await v60PuzzlePlaceBase(f);
  v60Sound("puzzle");
  setTimeout(v60CheckPuzzleComplete,120);
};

/* ---------- några ljud på befintliga handlingar ---------- */
const v60DigBase=digAt;
digAt=async function(...args){
  v60Sound("dig");
  const before=(state.foundItems||[]).length;
  const r=await v60DigBase(...args);
  if((state.foundItems||[]).length>before)v60Sound("find");
  return r;
};

const v60ThrowBallBase=throwBall;
throwBall=async function(...args){
  v60Sound("ball");
  return await v60ThrowBallBase(...args);
};

/* Klossmiss från v5.8 har texten "tappar klossen"; ljud triggas via story-wrapper. */
const v60StoryBase=story;
story=function(msg){
  if(typeof msg==="string" && msg.includes("tappar klossen"))v60Sound("blockdrop");
  return v60StoryBase(msg);
};


/* =========================================================
   TIDVATTENPÖLEN v6.1 – fler livsstadier
   ========================================================= */

/* Nya steg efter vuxen.
   Trösklarna bygger främst på omsorgstillfällen så de går att visa i skol-demo. */
v50StageFromState=function(){
  const days=Math.floor((Date.now()-state.bornAt)/86400000);
  const care=state.careMoments||0;

  if(care>=48 || days>=35) return "senior";
  if(care>=34 || days>=24) return "äldre";
  if(care>=24 || days>=14) return "vuxen";
  if(care>=12 || days>=5) return "ung";
  if(care>=6 || days>=2) return "växande";
  return "bebis";
};

function v61StageLabel(stage){
  return ({
    bebis:"liten bebis",
    växande:"växande",
    ung:"ung",
    vuxen:"vuxen",
    äldre:"äldre",
    senior:"senior"
  })[stage]||stage;
}

function v61AddGrayHair(stage){
  const svg=$("#octopus .octopus-svg");
  if(!svg)return;

  svg.querySelector(".v61-gray-hair")?.remove();

  const oct=$("#octopus");
  oct.classList.toggle("v61-older",stage==="äldre");
  oct.classList.toggle("v61-senior",stage==="senior");

  if(stage!=="äldre" && stage!=="senior")return;

  const ns="http://www.w3.org/2000/svg";
  const g=document.createElementNS(ns,"g");
  g.setAttribute("class","v61-gray-hair");

  const paths = stage==="senior" ? [
    "M112 59 Q108 46 116 39",
    "M122 55 Q120 40 128 34",
    "M134 54 Q135 38 143 33",
    "M146 58 Q151 43 158 39",
    "M103 65 Q96 55 100 47",
    "M157 65 Q164 54 161 46"
  ] : [
    "M118 58 Q114 47 120 41",
    "M133 55 Q132 43 139 38",
    "M148 60 Q153 49 158 45"
  ];

  paths.forEach(d=>{
    const p=document.createElementNS(ns,"path");
    p.setAttribute("d",d);
    g.appendChild(p);
  });

  svg.appendChild(g);
}

function v61ApplyStageVisual(stage){
  const o=$("#octopus");
  if(!o)return;

  const scaleMap={
    bebis:.42,
    växande:.58,
    ung:.74,
    vuxen:.92,
    äldre:.95,
    senior:.92
  };

  o.dataset.s=String(scaleMap[stage]??.42);
  v61AddGrayHair(stage);

  const badge=$("#stage-badge");
  if(badge)badge.textContent=v61StageLabel(stage);
}

function v61AgeNote(stage){
  $("#v61-age-note")?.remove();

  const n=document.createElement("div");
  n.id="v61-age-note";

  if(stage==="äldre"){
    n.textContent=`🎉 ${state.name} har blivit äldre – några grå hår har dykt upp!`;
  }else if(stage==="senior"){
    n.textContent=`🎉 ${state.name} har blivit senior – dags för ännu ett kalas!`;
  }else{
    n.textContent=`🎉 ${state.name} har blivit ${v61StageLabel(stage)}!`;
  }

  $("#tank")?.append(n);
  setTimeout(()=>n.remove(),3600);
}

/* Återanvänd det befintliga akvariepartyt för nya ålderssteg. */
function v61CelebrateAge(stage){
  v61AgeNote(stage);

  if(typeof v56StartLiveParty==="function"){
    v56StartLiveParty(stage);
  }else if(typeof v50CelebrateGrowth==="function"){
    v50CelebrateGrowth(stage);
  }

  if(stage==="äldre"){
    story(`${state.name} har blivit äldre. Kompisarna kommer tillbaka för att fira! 🎂🪩`);
  }else if(stage==="senior"){
    story(`${state.name} är nu senior och får ett nytt stort kalas! 🎂🎉`);
  }

  if(typeof v60Sound==="function")v60Sound("win");
}

/* Profilen håller koll på steget och startar kalas när det går framåt. */
const v61ProfileBase=profile;
profile=function(){
  v61ProfileBase();

  if(!state)return;

  const order=["bebis","växande","ung","vuxen","äldre","senior"];
  const current=v50StageFromState();
  const previous=state.growthStage || "bebis";

  v61ApplyStageVisual(current);

  const prevIndex=order.indexOf(previous);
  const curIndex=order.indexOf(current);

  if(curIndex>prevIndex){
    state.growthStage=current;
    save();

    /* Låt normal render bli klar innan festen startar. */
    setTimeout(()=>{
      v61ApplyStageVisual(current);
      v61CelebrateAge(current);
    },280);
  }else if(current!==previous){
    state.growthStage=current;
    save();
  }
};

/* Rendera hår och storlek även efter tank-omritning. */
const v61RenderTankBase=renderTank;
renderTank=function(...args){
  const r=v61RenderTankBase(...args);
  setTimeout(()=>{
    if(state)v61ApplyStageVisual(v50StageFromState());
  },0);
  return r;
};

/* För gamla sparfiler: sätt steg utan falskt kalas om det saknas helt. */
setTimeout(()=>{
  if(!state)return;
  if(!state.growthStage){
    state.growthStage=v50StageFromState();
    save();
  }
  v61ApplyStageVisual(v50StageFromState());
},350);


/* =========================================================
   TIDVATTENPÖLEN v6.2 – fler ljudeffekter
   ========================================================= */

function v62NoiseBurst(dur=.08, vol=.012, delaySec=0){
  const ctx=typeof v60Ctx==="function" ? v60Ctx() : null;
  if(!ctx) return;

  const length=Math.max(1, Math.floor(ctx.sampleRate*dur));
  const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<length;i++){
    data[i]=(Math.random()*2-1)*(1-i/length);
  }

  const src=ctx.createBufferSource();
  const gain=ctx.createGain();
  const start=ctx.currentTime+delaySec;

  gain.gain.setValueAtTime(vol,start);
  gain.gain.exponentialRampToValueAtTime(.0001,start+dur);

  src.buffer=buffer;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(start);
}

function v62Sound(name){
  if(!state?.soundOn) return;

  switch(name){
    case "splash":
      v60Tone(260,.045,.012,"sine");
      v60Tone(190,.09,.009,"sine",.04);
      v62NoiseBurst(.07,.006,.01);
      break;

    case "kelp":
      v62NoiseBurst(.15,.008);
      v60Tone(240,.07,.008,"triangle",.04);
      break;

    case "ballbounce":
      v60Tone(190,.05,.02,"sine");
      v60Tone(260,.045,.016,"sine",.11);
      v60Tone(210,.04,.013,"sine",.22);
      break;

    case "ballroll":
      v62NoiseBurst(.18,.006);
      v60Tone(120,.11,.009,"sine");
      break;

    case "blocks":
      v60Tone(180,.045,.018,"square");
      v60Tone(230,.04,.014,"square",.08);
      break;

    case "jar":
      v60Tone(330,.05,.016,"triangle");
      v60Tone(520,.08,.016,"triangle",.08);
      v62NoiseBurst(.06,.006,.03);
      break;

    case "puzzleclick":
      v60Tone(600,.045,.016,"triangle");
      v60Tone(760,.055,.013,"triangle",.055);
      break;

    case "hide":
      v62NoiseBurst(.13,.006);
      v60Tone(180,.08,.007,"sine",.05);
      break;

    case "happy":
      v60Tone(620,.055,.016,"triangle");
      v60Tone(760,.055,.014,"triangle",.07);
      v60Tone(920,.08,.012,"triangle",.14);
      break;

    case "dance":
      v60Tone(120,.07,.018,"sine");
      v60Tone(220,.045,.011,"square",.09);
      v60Tone(140,.07,.018,"sine",.18);
      v60Tone(260,.045,.011,"square",.27);
      break;

    case "ring":
      v60Tone(420,.06,.014,"triangle");
      v60Tone(610,.07,.012,"triangle",.08);
      v60Tone(820,.08,.011,"triangle",.16);
      break;

    case "toy":
      v60Tone(500,.05,.012,"triangle");
      v60Tone(700,.05,.01,"triangle",.09);
      break;
  }
}

/* Simning genom ringen */
const v62RingBase=swimRing;
swimRing=async function(...args){
  v62Sound("ring");
  return await v62RingBase(...args);
};

/* Gömning i alger */
const v62HideBase=hideKelp;
hideKelp=async function(...args){
  v62Sound("kelp");
  const r=await v62HideBase(...args);
  v62Sound("hide");
  return r;
};

/* Boll */
const v62ThrowBase=throwBall;
throwBall=async function(...args){
  v62Sound("ballbounce");
  return await v62ThrowBase(...args);
};

const v62PushBase=pushBall;
pushBall=async function(...args){
  v62Sound("ballroll");
  return await v62PushBase(...args);
};

/* Klossar */
const v62TowerBase=buildTower;
buildTower=async function(...args){
  v62Sound("blocks");
  return await v62TowerBase(...args);
};

const v62SortBase=sortBlocks;
sortBlocks=async function(...args){
  v62Sound("blocks");
  return await v62SortBase(...args);
};

/* Burk */
const v62JarBase=openJar;
openJar=async function(...args){
  v62Sound("jar");
  return await v62JarBase(...args);
};

/* Pusselbit */
const v62PuzzleBase=placePuzzlePiece;
placePuzzlePiece=async function(...args){
  v62Sound("puzzleclick");
  return await v62PuzzleBase(...args);
};

/* Mys */
const v62PetBase=v60PetWithExistingHand;
v60PetWithExistingHand=async function(...args){
  v62Sound("happy");
  return await v62PetBase(...args);
};
v46PetOctopus=v60PetWithExistingHand;
v54PetWithHand=v60PetWithExistingHand;
v57PetFromCorner=v60PetWithExistingHand;
v59PetWithRealHand=v60PetWithExistingHand;

/* Självgående dans */
if(typeof v58IdleDance==="function"){
  const v62IdleDanceBase=v58IdleDance;
  v58IdleDance=async function(...args){
    v62Sound("dance");
    return await v62IdleDanceBase(...args);
  };
}

/* Spontan simtur */
if(typeof v58IdleSwim==="function"){
  const v62IdleSwimBase=v58IdleSwim;
  v58IdleSwim=async function(...args){
    v62Sound("splash");
    return await v62IdleSwimBase(...args);
  };
}

/* Några nya fynd/leksaker */
if(typeof v59CuddlePlush==="function"){
  const base=v59CuddlePlush;
  v59CuddlePlush=async function(...args){
    v62Sound("happy");
    return await base(...args);
  };
}
if(typeof v59SailBoat==="function"){
  const base=v59SailBoat;
  v59SailBoat=async function(...args){
    v62Sound("splash");
    return await base(...args);
  };
}
if(typeof v59Feather==="function"){
  const base=v59Feather;
  v59Feather=async function(...args){
    v62Sound("toy");
    return await base(...args);
  };
}


/* =========================================================
   TIDVATTENPÖLEN v6.3 – levande bakgrund
   ========================================================= */

let v63BubbleTimer=null;
let v63AmbientTimer=null;
let v63VisitorBusy=false;
let v63AmbientToken=0;

function v63AmbientLayer(){
  let layer=$("#v63-ambient-layer");
  if(layer)return layer;
  layer=document.createElement("div");
  layer.id="v63-ambient-layer";
  $("#tank")?.prepend(layer);
  return layer;
}

function v63Bubble(){
  if(!state || $("#game-screen")?.hidden)return;
  const layer=v63AmbientLayer();
  const b=document.createElement("div");
  b.className="v63-bubble";
  b.style.left=`${rand(6,94)}%`;
  b.style.setProperty("--s",`${rand(7,18)}px`);
  b.style.setProperty("--d",`${(4+Math.random()*4).toFixed(1)}s`);
  b.style.setProperty("--drift",`${rand(-28,28)}px`);
  layer.append(b);
  setTimeout(()=>b.remove(),8500);
}

function v63StartBubbles(){
  if(v63BubbleTimer)clearInterval(v63BubbleTimer);
  v63BubbleTimer=setInterval(()=>{
    if(Math.random()<.8){
      v63Bubble();
      if(Math.random()<.35)setTimeout(v63Bubble,300);
    }
  },1500);
}

function v63AmbientNote(text){
  $(".v63-ambient-note")?.remove();
  const n=document.createElement("div");
  n.className="v63-ambient-note";
  n.textContent=text;
  $("#tank")?.append(n);
  setTimeout(()=>n.remove(),2300);
}

async function v63MusselVisit(){
  if(!state || actionLocked || v63VisitorBusy)return;
  const layer=v63AmbientLayer();
  const m=document.createElement("div");
  m.className="v63-mussel";
  m.textContent="🦪";
  m.style.left=`${rand(14,86)}%`;
  m.style.top=`${rand(72,88)}%`;
  layer.append(m);

  v63AmbientNote("En liten mussla tittar fram ur sanden 🦪");
  if(typeof v62Sound==="function")v62Sound("splash");

  await delay(3500+rand(0,1800));
  m.style.transition="opacity .5s ease";
  m.style.opacity="0";
  setTimeout(()=>m.remove(),550);
}

function v63CloneFriend(){
  const real=$("#octopus .octopus-svg");
  if(!real)return null;
  const clone=real.cloneNode(true);
  clone.querySelectorAll(".v61-gray-hair,#v4-necklace-svg").forEach(n=>n.remove());
  return clone;
}

async function v63FriendVisit(){
  if(!state || actionLocked || v63VisitorBusy)return;
  v63VisitorBusy=true;
  const token=++v63AmbientToken;

  const friend=document.createElement("div");
  friend.className=`v63-visitor ${pick(["friend-a","friend-b","friend-c"])}`;
  friend.style.left=Math.random()<.5?"-8%":"108%";
  friend.style.top=`${rand(36,62)}%`;
  const clone=v63CloneFriend();
  if(clone)friend.append(clone);
  $("#tank")?.append(friend);

  const fromLeft=parseFloat(friend.style.left)<0;
  const meetX=fromLeft?38:62;
  const meetY=rand(40,58);

  v63AmbientNote("En kompis kommer förbi och vill leka 🐙");
  friend.style.left=`${meetX}%`;
  friend.style.top=`${meetY}%`;

  if(typeof v62Sound==="function")v62Sound("happy");
  await delay(900);

  if(token!==v63AmbientToken || actionLocked){
    friend.remove();
    v63VisitorBusy=false;
    return;
  }

  /* Kompisen leker nära huvudbläckfisken, utan att ta över spelarens val. */
  const q=octoXY();
  friend.style.left=`${Math.max(12,Math.min(88,q.x+12))}%`;
  friend.style.top=`${Math.max(22,Math.min(76,q.y-4))}%`;
  story(`${state.name} får besök av en kompis en liten stund.`);
  await delay(1000);

  for(let i=0;i<3;i++){
    if(token!==v63AmbientToken || actionLocked)break;
    const qq=octoXY();

    friend.style.left=`${Math.max(12,Math.min(88,qq.x+rand(-14,14)))}%`;
    friend.style.top=`${Math.max(24,Math.min(75,qq.y+rand(-8,8)))}%`;

    /* Huvudbläckfisken svarar bara om spelaren inte gör något. */
    if(!actionLocked && Date.now()-v58LastUserAction>3500){
      moveOcto(
        Math.max(16,Math.min(84,qq.x+rand(-8,8))),
        Math.max(28,Math.min(72,qq.y+rand(-6,6))),
        .65,520
      );
    }
    await delay(760);
  }

  if(token===v63AmbientToken && !actionLocked){
    story(`${state.name} och kompisen busar klart för den här gången.`);
  }

  friend.style.left=fromLeft?"108%":"-8%";
  friend.style.top=`${rand(34,60)}%`;
  friend.style.opacity=".7";
  await delay(850);
  friend.remove();
  v63VisitorBusy=false;
}

/* Spelaren ska alltid vinna över bakgrundshändelser. */
document.addEventListener("pointerdown",()=>{
  v63AmbientToken++;
  const friend=$(".v63-visitor");
  if(friend){
    friend.style.opacity="0";
    setTimeout(()=>friend.remove(),250);
  }
  v63VisitorBusy=false;
},true);

function v63AmbientTick(){
  if(!state || actionLocked || $("#game-screen")?.hidden)return;
  const party=$("#v50-growth-party");
  if(party && !party.hidden)return;

  const r=Math.random();
  if(r<.40){
    v63MusselVisit();
  }else if(r<.68 && Date.now()-v58LastUserAction>7000){
    v63FriendVisit();
  }else{
    /* extra bubbelskur */
    v63Bubble();
    setTimeout(v63Bubble,220);
    setTimeout(v63Bubble,480);
  }
}

function v63StartAmbient(){
  v63AmbientLayer();
  v63StartBubbles();
  if(v63AmbientTimer)clearInterval(v63AmbientTimer);
  v63AmbientTimer=setInterval(v63AmbientTick,11000);
}

setTimeout(v63StartAmbient,450);

/* Efter tank-omritning ska ambient-lagret finnas kvar. */
const v63RenderTankBase=renderTank;
renderTank=function(...args){
  const r=v63RenderTankBase(...args);
  setTimeout(v63AmbientLayer,0);
  return r;
};


/* =========================================================
   TIDVATTENPÖLEN v6.4
   Pusslet stannar kvar efter vinst tills spelaren klickar ner det.
   Då startar nästa pusselomgång.
   ========================================================= */

state.puzzleWaitingClose = state.puzzleWaitingClose || false;

function v64Trumpet(){
  if(!state.soundOn)return;
  const ctx=typeof v60Ctx==="function" ? v60Ctx() : null;
  if(!ctx)return;

  /* Enkel fanfar/trumpet-känsla med sawtooth-toner. */
  const seq=[
    [392,0,.13],
    [523,.15,.13],
    [659,.30,.14],
    [784,.47,.24],
    [659,.72,.10],
    [784,.84,.28]
  ];

  seq.forEach(([freq,delay,dur])=>{
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    const start=ctx.currentTime+delay;
    osc.type="sawtooth";
    osc.frequency.setValueAtTime(freq,start);
    gain.gain.setValueAtTime(.022,start);
    gain.gain.exponentialRampToValueAtTime(.0001,start+dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start+dur);
  });
}

function v64TrumpetNotes(){
  const tank=$("#tank");
  const chars=["🎺","♪","♫","✨"];
  for(let i=0;i<16;i++){
    const n=document.createElement("div");
    n.className="v64-trumpet-note";
    n.textContent=pick(chars);
    n.style.left=`${50+rand(-15,15)}%`;
    n.style.top=`${43+rand(-5,6)}%`;
    n.style.animationDelay=`${Math.random()*.35}s`;
    tank.append(n);
    setTimeout(()=>n.remove(),2200);
  }
}

function v64AddCompleteBar(){
  const board=$("#v4-puzzle-board");
  if(!board)return;

  board.classList.add("v64-complete");

  let bar=$("#v64-puzzle-complete-bar",board);
  if(!bar){
    bar=document.createElement("div");
    bar.id="v64-puzzle-complete-bar";
    bar.innerHTML=`
      <span>🎉 Pusslet är klart!</span>
      <button type="button" id="v64-puzzle-close" aria-label="Stäng det färdiga pusslet">✕</button>`;
    board.prepend(bar);
  }
}

function v64CloseCompletedPuzzle(){
  if(!state.puzzleWaitingClose)return;

  state.puzzleWaitingClose=false;
  state.puzzleRound=(state.puzzleRound||1)+1;
  state.puzzleCompleted=(state.puzzleCompleted||0)+1;

  state.foundItems=(state.foundItems||[]).filter(f=>f.type!=="puzzle-piece");
  state.puzzlePieces=0;
  state.puzzleProgress=0;
  state.puzzleHidden=true;

  save();
  $("#v4-puzzle-board")?.remove();

  renderTank();
  story("Ett nytt pussel har gömts i sanden. Leta efter nya pusselbitar! 🧩");
}

document.addEventListener("pointerdown",e=>{
  const b=e.target.closest("#v64-puzzle-close");
  if(!b)return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  v64CloseCompletedPuzzle();
},true);

/* Ersätt v6.0:s automatiska reset efter tre sekunder. */
v60CheckPuzzleComplete=async function(){
  if(v60PuzzleCelebrating || state.puzzleWaitingClose || !v60PuzzleIsComplete())return;

  v60PuzzleCelebrating=true;
  state.puzzleWaitingClose=true;

  v60Confetti(70);
  v64Trumpet();
  v64TrumpetNotes();

  story(`${state.name} klarade pusslet! 🎉`);
  thought("🎉");

  state.needs.stimulation=clamp((state.needs.stimulation||0)+20);
  state.needs.mood=clamp((state.needs.mood||0)+12);
  renderNeeds();

  /* Behåll pusslet öppet tills spelaren själv stänger det. */
  state.puzzleHidden=false;
  save();

  setTimeout(()=>{
    v64AddCompleteBar();
    v60PuzzleCelebrating=false;
  },180);
};

/* Om spelaren laddar om medan ett färdigt pussel väntar på stängning. */
const v64RenderPuzzleBase=renderPuzzleBoard;
renderPuzzleBoard=function(...args){
  const r=v64RenderPuzzleBase(...args);
  if(state?.puzzleWaitingClose){
    setTimeout(v64AddCompleteBar,0);
  }
  return r;
};

/* Skydda färdig-knappen mot äldre tank-events. */
$("#tank")?.addEventListener("pointerdown",e=>{
  if(!e.target.closest("#v64-puzzle-close"))return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  v64CloseCompletedPuzzle();
},true);


/* =========================================================
   TIDVATTENPÖLEN v6.5
   Färdigt pussel firas och försvinner sedan automatiskt.
   Därefter börjar en ny pusselomgång.
   ========================================================= */

function v65FinishPuzzleAndReset(){
  state.puzzleWaitingClose=false;
  state.puzzleRound=(state.puzzleRound||1)+1;
  state.puzzleCompleted=(state.puzzleCompleted||0)+1;

  state.foundItems=(state.foundItems||[]).filter(f=>f.type!=="puzzle-piece");
  state.puzzlePieces=0;
  state.puzzleProgress=0;
  state.puzzleHidden=true;

  save();

  const board=$("#v4-puzzle-board");
  if(board){
    board.style.transition="opacity .35s ease, transform .35s ease";
    board.style.opacity="0";
    board.style.transform="scale(.94)";
    setTimeout(()=>board.remove(),380);
  }

  setTimeout(()=>{
    renderTank();
    story("Det färdiga pusslet är undanlagt. Nu kan du leta efter ett nytt pussel i sanden! 🧩");
  },420);
}

/* Ingen manuell stängning längre. */
v60CheckPuzzleComplete=async function(){
  if(v60PuzzleCelebrating || !v60PuzzleIsComplete())return;

  v60PuzzleCelebrating=true;
  state.puzzleWaitingClose=true;

  v60Confetti(70);
  v64Trumpet();
  v64TrumpetNotes();

  story(`${state.name} klarade pusslet! 🎉`);
  thought("🎉");

  state.needs.stimulation=clamp((state.needs.stimulation||0)+20);
  state.needs.mood=clamp((state.needs.mood||0)+12);
  renderNeeds();

  state.puzzleHidden=false;
  save();

  /* Visa det färdiga pusslet en kort stund, sedan försvinner det. */
  setTimeout(()=>{
    v65FinishPuzzleAndReset();
    v60PuzzleCelebrating=false;
  },2600);
};

/* Dölj gammal färdig-rad/knapp om den skulle hinna skapas av äldre kod. */
const v65AddCompleteBarBase=v64AddCompleteBar;
v64AddCompleteBar=function(){
  /* Gör inget i v6.5 */
};

setTimeout(()=>{
  $("#v64-puzzle-complete-bar")?.remove();
},200);


/* =========================================================
   TIDVATTENPÖLEN v6.6
   ========================================================= */

state.jarStoredItems ||= [];
state.wornHat ||= null;

const V66_HATS=[
  {name:"Partyhatt",emoji:"🥳"},
  {name:"Kungakrona",emoji:"👑"},
  {name:"Häxhatt",emoji:"🧙‍♀️"},
  {name:"Cowboyhatt",emoji:"🤠"},
  {name:"Sommarhatt",emoji:"👒"},
  {name:"Studentmössa",emoji:"🎓"},
  {name:"Sjökaptenshatt",emoji:"🧢"}
];

/* ---------- HATTAR ---------- */
function v66RenderHat(){
  $("#v66-hat")?.remove();
  if(!state.wornHat)return;
  const oct=$("#octopus");
  if(!oct)return;

  const h=document.createElement("div");
  h.id="v66-hat";
  h.textContent=state.wornHat.emoji;
  h.title=`${state.wornHat.name} – klicka för att ta av`;
  oct.append(h);
}

async function v66WearHat(f){
  if(actionLocked)return;
  actionLocked=true;working(true);

  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);
  const p=makeProp(f.emoji,f.x,f.y);
  const q=octoXY();
  p.style.left=`${q.x}%`;
  p.style.top=`${q.y-12}%`;
  story(`${state.name} provar ${f.name.toLowerCase()}.`);
  await delay(800);

  state.wornHat={name:f.name,emoji:f.emoji};
  save();

  clearActionProps();
  renderTank();
  v66RenderHat();
  thought("✨");
  if(typeof v62Sound==="function")v62Sound("happy");
  if(typeof v57Stimulate==="function")v57Stimulate(8,"att prova hatten");

  working(false);actionLocked=false;
}

function v66RemoveHat(){
  if(!state.wornHat)return;
  story(`${state.name} tar av sig ${state.wornHat.name.toLowerCase()}.`);
  state.wornHat=null;
  save();
  v66RenderHat();
}

document.addEventListener("pointerdown",e=>{
  if(!e.target.closest("#v66-hat"))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  v66RemoveHat();
},true);

/* Hattar kan hittas i sanden */
const v66RandomDigBase=randomDigFind;
randomDigFind=function(){
  if(Math.random()<.17){
    const found=new Set((state.foundItems||[]).filter(x=>x.type==="hat").map(x=>x.name));
    const fresh=V66_HATS.filter(h=>!found.has(h.name));
    const h={...(fresh.length?pick(fresh):pick(V66_HATS))};
    return {...h,kind:"odd",type:"hat"};
  }
  return v66RandomDigBase();
};

/* ---------- LÄGGA SAKER I BURKEN ---------- */
function v66Jar(){
  return (state.placedItems||[]).find(p=>p.type==="jar");
}

async function v66PutInJar(f){
  const jar=v66Jar();
  if(!jar){toast("Du behöver en burk i akvariet först.");return}
  if(actionLocked)return;

  actionLocked=true;working(true);
  await approach(f.x,f.y,-1);

  hideRendered("found",f.id);
  const prop=makeProp(f.emoji,f.x,f.y);
  let q=octoXY();
  prop.style.left=`${q.x+4}%`;
  prop.style.top=`${q.y+7}%`;
  story(`${state.name} plockar upp ${f.name.toLowerCase()}.`);
  await delay(600);

  moveOcto(jar.x-7,jar.y-6,.68,650);
  prop.style.left=`${jar.x}%`;
  prop.style.top=`${jar.y-4}%`;
  story(`${state.name} lägger ${f.name.toLowerCase()} i burken.`);
  if(typeof v62Sound==="function")v62Sound("jar");
  await delay(800);

  state.jarStoredItems.push({...f});
  state.foundItems=state.foundItems.filter(x=>x.id!==f.id);
  save();

  clearActionProps();
  renderTank();
  working(false);actionLocked=false;
}

async function v66TakeFromJar(jar,index){
  const f=state.jarStoredItems[index];
  if(!f||actionLocked)return;

  actionLocked=true;working(true);
  await approach(jar.x,jar.y,-1);
  story(`${state.name} öppnar burken och tar ut ${f.name.toLowerCase()}.`);
  if(typeof v62Sound==="function")v62Sound("jar");
  await delay(650);

  const restored={...f,x:Math.max(8,Math.min(92,jar.x+rand(-10,10))),y:Math.min(90,jar.y+8)};
  state.foundItems.push(restored);
  state.jarStoredItems.splice(index,1);
  save();
  renderTank();

  working(false);actionLocked=false;
}

const v66ActionsFoundBase=actionsForFound;
actionsForFound=function(f){
  let acts=v66ActionsFoundBase(f)||[];

  if(f.type==="hat"){
    acts=[
      {label:"🎩 Sätt på hatten",run:()=>v66WearHat(f)},
      ...acts
    ];
  }

  if(v66Jar() && f.type!=="puzzle-piece"){
    acts.push({label:"🫙 Lägg i burken",run:()=>v66PutInJar(f)});
  }
  return acts;
};

const v66ActionsPlacedBase=actionsForPlaced;
actionsForPlaced=function(item){
  let acts=v66ActionsPlacedBase(item)||[];

  if(item.type==="jar" && state.jarStoredItems.length){
    state.jarStoredItems.slice(0,6).forEach((f,i)=>{
      acts.push({label:`📦 Ta ut ${f.name}`,run:()=>v66TakeFromJar(item,i)});
    });
  }
  return acts;
};

/* ---------- TYDLIG MAGI ---------- */
function v66MagicFlash(){
  const x=document.createElement("div");
  x.className="v66-magic-flash";
  $("#tank")?.append(x);
  setTimeout(()=>x.remove(),950);
}

function v66MagicNumber(text,x,y){
  const n=document.createElement("div");
  n.className="v66-magic-number";
  n.textContent=text;
  n.style.left=`${x}%`;
  n.style.top=`${y}%`;
  $("#tank")?.append(n);
  setTimeout(()=>n.remove(),1800);
}

function v66MagicResult(lines){
  $("#v66-magic-result")?.remove();
  const box=document.createElement("div");
  box.id="v66-magic-result";
  box.innerHTML=`✨ <strong>Trollningen ändrade:</strong><br>${lines.join(" • ")}`;
  $("#tank")?.append(box);
  setTimeout(()=>box.remove(),3000);
}

async function magic(f){
  if(actionLocked)return;
  actionLocked=true;working(true);

  await approach(f.x,f.y,-1);
  story(`${state.name} koncentrerar sig och trollar...`);
  thought("✨");
  if(typeof v62Sound==="function")v62Sound("toy");
  await delay(650);

  v66MagicFlash();

  const options=[
    {key:"hunger",label:"Mättnad",emoji:"🦐",delta:pick([10,12,15,-6])},
    {key:"energy",label:"Energi",emoji:"⚡",delta:pick([8,12,14,-5])},
    {key:"safety",label:"Trygghet",emoji:"🛡️",delta:pick([7,10,12,-4])},
    {key:"stimulation",label:"Stimulans",emoji:"🎲",delta:pick([10,14,16,-5])},
    {key:"mood",label:"Humör",emoji:"❤️",delta:pick([10,15,18,-6])}
  ];

  const selected=[...options].sort(()=>Math.random()-.5).slice(0,Math.random()<.55?3:2);
  const pos={hunger:[22,31],energy:[38,27],safety:[52,31],stimulation:[68,27],mood:[81,31]};
  const lines=[];

  selected.forEach(c=>{
    const before=state.needs[c.key];
    state.needs[c.key]=clamp(before+c.delta);
    const actual=Math.round(state.needs[c.key]-before);
    const sign=actual>=0?"+":"";
    lines.push(`${c.emoji} ${c.label} ${sign}${actual}`);
    const [x,y]=pos[c.key];
    v66MagicNumber(`${c.emoji} ${sign}${actual}`,x,y);
  });

  renderNeeds();save();
  v66MagicResult(lines);

  if(selected.some(c=>c.delta>0)){
    story(`Trollningen lyckades: ${lines.join(", ")}.`);
  }else{
    story(`Oj, trollningen blev lite tokig: ${lines.join(", ")}.`);
  }

  await delay(1700);
  if(typeof v57Stimulate==="function")v57Stimulate(10,"trollandet");
  working(false);actionLocked=false;
}

/* ---------- KOJOR SOM SER UT SOM KOJOR ---------- */
function v66HomeMarkup(style="basic"){
  const detail={
    basic:"🌿",
    shell:"🐚",
    coral:"🪸",
    pearl:"🤍",
    luxury:"✨",
    palace:"👑"
  }[style]||"🌿";

  return `
    <span class="v66-home ${style}">
      <span class="v66-home-roof"></span>
      <span class="v66-home-body"></span>
      <span class="v66-home-door"></span>
      <span class="v66-home-detail">${detail}</span>
    </span>`;
}

function v66RenderHomeVisuals(){
  $$(".v4-object.v4-home").forEach(el=>{
    const id=el.dataset.id;
    const item=(state.placedItems||[]).find(x=>x.id===id);
    if(!item)return;
    const style=state.homeStyle||"basic";
    el.innerHTML=v66HomeMarkup(style);
    el.setAttribute("aria-label",`${({basic:"Enkel koja",shell:"Snäckkoja",coral:"Korallkoja",pearl:"Pärlkoja",luxury:"Lyxkoja",palace:"Palatskoja"})[style]||"Koja"}`);
  });
}

/* Hatt + koja efter varje tank-rendering */
const v66RenderTankBase=renderTank;
renderTank=function(...args){
  const r=v66RenderTankBase(...args);
  setTimeout(()=>{
    v66RenderHomeVisuals();
    v66RenderHat();
  },0);
  return r;
};

setTimeout(()=>{
  v66RenderHomeVisuals();
  v66RenderHat();
},250);


/* =========================================================
   TIDVATTENPÖLEN v6.7
   Handen kommer när spelaren trycker mitt på bläckfisken.
   Klick ute på armar/kanter startar inte klappningen.
   ========================================================= */

function v67IsCenterOfOctopus(event){
  const oct=$("#octopus");
  if(!oct) return false;

  const r=oct.getBoundingClientRect();
  if(!r.width || !r.height) return false;

  const x=(event.clientX-r.left)/r.width;
  const y=(event.clientY-r.top)/r.height;

  /* Kroppens centrala del: huvud/mantel och området precis under.
     Medvetet snävare än hela SVG:n så armarna inte räknas. */
  return x>=0.28 && x<=0.72 && y>=0.14 && y<=0.62;
}

/* v8.1: äldre centrala klickfångaren får bara reagera på faktisk kropp. */
document.addEventListener("pointerdown",e=>{
  if(!v81IsRealOctopusHit(e)) return;
  /* Tidigare handlyssnare sköter själva klappningen. */
},true);


/* =========================================================
   TIDVATTENPÖLEN v6.8
   Musslan går nu att fånga innan den försvinner.
   ========================================================= */

let v68MusselTimer=null;
let v68MusselBusy=false;

function v68CatchNote(x,y,text){
  const tank=$("#tank");
  if(!tank)return;
  const n=document.createElement("div");
  n.className="v68-catch-note";
  n.style.left=`${x}%`;
  n.style.top=`${y}%`;
  n.textContent=text;
  tank.append(n);
  setTimeout(()=>n.remove(),1250);
}

function v68CatchMussel(el){
  if(!el || el.dataset.caught==="1")return;

  el.dataset.caught="1";
  el.classList.add("v68-caught");

  const x=parseFloat(el.style.left)||50;
  const y=parseFloat(el.style.top)||55;

  /* Belöning: ett litet fynd + stimulans eftersom spelaren hann reagera. */
  state.foundItems=state.foundItems||[];
  state.foundItems.push({
    id:`mussel-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    kind:"shell-toy",
    name:"Fångad mussla",
    emoji:"🐚",
    x:Math.max(8,Math.min(92,x)),
    y:Math.max(58,Math.min(90,y+10))
  });

  if(state.needs){
    state.needs.stimulation=clamp((state.needs.stimulation||0)+12);
    state.needs.mood=clamp((state.needs.mood||0)+5);
  }

  save();
  renderNeeds();
  renderTank();

  v68CatchNote(x,y,"Fångad! 🐚");
  story(`${state.name} hann fånga musslan innan den försvann!`);
  thought("✨");

  if(v68MusselTimer){
    clearTimeout(v68MusselTimer);
    v68MusselTimer=null;
  }

  setTimeout(()=>el.remove(),500);
  v68MusselBusy=false;
}

/* Använd denna när en mussla dyker upp:
   den stannar några sekunder så spelaren hinner trycka på den. */
function v68SpawnCatchableMussel(opts={}){
  const tank=$("#tank");
  if(!tank || v68MusselBusy)return null;

  v68MusselBusy=true;

  const el=document.createElement("button");
  el.type="button";
  el.className="v68-mussel";
  el.setAttribute("aria-label","Fånga musslan");
  el.textContent="🐚";

  const x=Number.isFinite(opts.x)?opts.x:rand(18,82);
  const y=Number.isFinite(opts.y)?opts.y:rand(52,78);

  el.style.left=`${x}%`;
  el.style.top=`${y}%`;

  el.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    v68CatchMussel(el);
  },true);

  tank.append(el);

  story("En mussla dyker upp! Tryck på den innan den försvinner.");

  const lifetime=Number.isFinite(opts.lifetime)?opts.lifetime:4500;
  v68MusselTimer=setTimeout(()=>{
    if(el.dataset.caught==="1")return;
    el.style.transition="opacity .35s ease, transform .35s ease";
    el.style.opacity="0";
    el.style.transform="translate(-50%,-50%) scale(.65)";
    story("Musslan hann försvinna.");
    setTimeout(()=>el.remove(),380);
    v68MusselBusy=false;
  },lifetime);

  return el;
}

/* Om äldre kod redan har en funktion som heter ungefär så här,
   låter vi den istället skapa den klickbara versionen. */
if(typeof spawnMussel==="function"){
  spawnMussel=function(x,y){
    return v68SpawnCatchableMussel({x,y,lifetime:4500});
  };
}
if(typeof showMussel==="function"){
  showMussel=function(x,y){
    return v68SpawnCatchableMussel({x,y,lifetime:4500});
  };
}
if(typeof spawnShellEvent==="function"){
  const v68OldShellEvent=spawnShellEvent;
  spawnShellEvent=function(...args){
    const result=v68OldShellEvent(...args);
    setTimeout(()=>v68SpawnCatchableMussel({lifetime:4500}),120);
    return result;
  };
}

/* Säker reserv: om spelet inte redan har en särskild mussel-eventfunktion
   kan musslan dyka upp ibland när spelaren varit passiv en stund. */
let v68LastAutoMussel=0;
setInterval(()=>{
  if(!state || actionLocked || v68MusselBusy)return;
  if(Date.now()-v58LastUserAction<12000)return;
  if(Date.now()-v68LastAutoMussel<30000)return;
  if(Math.random()>.28)return;

  v68LastAutoMussel=Date.now();
  v68SpawnCatchableMussel({lifetime:5000});
},5000);


/* =========================================================
   TIDVATTENPÖLEN v6.9 – NY PUSSELFUNKTION
   ========================================================= */

function v69EnsurePuzzleState(){
  state.puzzle ||= {placed:0,total:6};
  state.puzzle.round ??= 0;
  state.puzzle.celebrating ??= false;
}

const V69_PUZZLES=[
  {emoji:"🐠🪸",title:"Korallrevet"},
  {emoji:"🐙⭐",title:"Bläckfiskens natt"},
  {emoji:"🐚🌊",title:"Snäckviken"},
  {emoji:"🦀🌿",title:"Krabbans gömställe"},
  {emoji:"🐡🫧",title:"Bubbelhavet"},
  {emoji:"🪼🌙",title:"Manetnatten"}
];

function v69CurrentPuzzle(){
  v69EnsurePuzzleState();
  return V69_PUZZLES[state.puzzle.round % V69_PUZZLES.length];
}

/* Behåll gamla pusselbrädet och stängknappen, men byt själva motivet
   så nästa färdiga pussel faktiskt blir ett nytt pussel. */
const v69RenderPuzzleBase=renderPuzzleBoard;
renderPuzzleBoard=function(){
  v69EnsurePuzzleState();
  v69RenderPuzzleBase();

  const b=$("#v4-puzzle-board");
  if(!b) return;

  /* Ta bort det gamla fasta fisk/sol/korall-motivet. */
  [...b.children].forEach(el=>{
    const t=(el.textContent||"").trim();
    if(t==="🐠" || t==="☀️" || t==="🪸") el.remove();
  });

  $("#v69-puzzle-motif",b)?.remove();
  $("#v69-puzzle-title",b)?.remove();

  const p=v69CurrentPuzzle();

  const motif=document.createElement("div");
  motif.id="v69-puzzle-motif";
  motif.className="v69-puzzle-motif";
  motif.textContent=p.emoji;
  b.prepend(motif);

  const title=document.createElement("div");
  title.id="v69-puzzle-title";
  title.className="v69-puzzle-title";
  title.textContent=p.title;
  b.append(title);

  /* De beige saknade bitarna ska ligga ovanpå motivet. */
  [...b.children].forEach(el=>{
    if(el.style?.background==="#d5bb84" || (el.style?.background||"").includes("d5bb84")){
      el.style.zIndex="4";
    }
  });

  const close=$("#v4-puzzle-close",b);
  if(close) close.style.zIndex="8";
};

function v69TrumpetFanfare(){
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) return;

  try{
    const ctx=new AC();
    const notes=[
      [523.25,0,.16],
      [659.25,.17,.16],
      [783.99,.34,.18],
      [1046.5,.54,.42]
    ];

    notes.forEach(([freq,start,dur])=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.type="sawtooth";
      osc.frequency.value=freq;

      gain.gain.setValueAtTime(.0001,ctx.currentTime+start);
      gain.gain.exponentialRampToValueAtTime(.045,ctx.currentTime+start+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+start+dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime+start);
      osc.stop(ctx.currentTime+start+dur+.03);
    });

    setTimeout(()=>{try{ctx.close()}catch{}},1400);
  }catch{}
}

function v69CelebratePuzzle(){
  if(state.puzzle.celebrating) return;
  state.puzzle.celebrating=true;
  save();

  const tank=$("#tank");
  if(!tank) return;

  $("#v69-puzzle-celebration")?.remove();

  const layer=document.createElement("div");
  layer.id="v69-puzzle-celebration";

  const banner=document.createElement("div");
  banner.id="v69-puzzle-banner";
  banner.textContent="🎺 Pusslet är klart! 🎉";
  layer.append(banner);

  const pieces=["🎉","✨","🎊","⭐","💗"];
  for(let i=0;i<34;i++){
    const c=document.createElement("span");
    c.className="v69-confetti";
    c.textContent=pick(pieces);
    c.style.left=`${rand(2,98)}%`;
    c.style.animationDelay=`${Math.random()*.7}s`;
    c.style.animationDuration=`${2+Math.random()*1.3}s`;
    c.style.fontSize=`${12+Math.random()*15}px`;
    layer.append(c);
  }

  tank.append(layer);
  thought("🎉");
  story(`${state.name} klarade hela pusslet! Trumpetfanfar och konfetti!`);
  v69TrumpetFanfare();

  /* Visa det färdiga motivet en liten stund. */
  setTimeout(()=>{
    layer.remove();

    state.puzzle.round=(state.puzzle.round||0)+1;
    state.puzzle.placed=0;
    state.puzzle.celebrating=false;
    state.puzzleHidden=false;
    save();

    $("#v4-puzzle-board")?.remove();
    $("#v4-puzzle-reopen")?.remove();

    const next=v69CurrentPuzzle();
    toast(`Nytt pussel: ${next.title} 🧩`);
    story(`Ett nytt pussel väntar: ${next.title}. Hitta nya pusselbitar i sanden!`);
  },4200);
}

/* Lägg pusselbiten som vanligt. När sista biten hamnar på plats
   startar konfetti/fanfaren och därefter förbereds nästa pussel. */
const v69PlacePuzzleBase=placePuzzlePiece;
placePuzzlePiece=async function(f){
  v69EnsurePuzzleState();
  const wasComplete=state.puzzle.placed>=state.puzzle.total;

  await v69PlacePuzzleBase(f);

  if(!wasComplete && state.puzzle.placed>=state.puzzle.total){
    renderPuzzleBoard();
    setTimeout(v69CelebratePuzzle,180);
  }
};

setTimeout(()=>{
  if(state){
    v69EnsurePuzzleState();
    save();
    renderPuzzleBoard();
  }
},250);


/* =========================================================
   TIDVATTENPÖLEN v7.0 – PERSISTENT HATT
   Hatten flyttas från sanden till huvudet och stannar där
   tills spelaren själv klickar på hatten och tar av den.
   ========================================================= */

function v70RestoreWornHatToSand(){
  if(!state.wornHat) return;

  const h=state.wornHat;

  /* Äldre sparfiler kan sakna id/x/y. */
  const restored={
    id:h.id || uid("found"),
    name:h.name || "Hatt",
    emoji:h.emoji || "🎩",
    kind:h.kind || "odd",
    type:"hat",
    x:Number.isFinite(h.x) ? h.x : Math.max(12,Math.min(88,octoXY().x+10)),
    y:Number.isFinite(h.y) ? h.y : 82
  };

  if(!state.foundItems.some(f=>f.id===restored.id)){
    state.foundItems.push(restored);
  }
}

async function v66WearHat(f){
  if(actionLocked)return;
  actionLocked=true;
  working(true);

  /* Om en annan hatt redan sitter på huvudet läggs den först tillbaka på sanden. */
  if(state.wornHat && state.wornHat.id!==f.id){
    v70RestoreWornHatToSand();
  }

  await approach(f.x,f.y,-1);

  hideRendered("found",f.id);
  const p=makeProp(f.emoji,f.x,f.y);
  const q=octoXY();

  p.style.left=`${q.x}%`;
  p.style.top=`${q.y-12}%`;

  story(`${state.name} sätter på sig ${f.name.toLowerCase()}.`);
  await delay(750);

  /* Hatten tas bort från sanden medan den används. */
  state.foundItems=state.foundItems.filter(x=>x.id!==f.id);

  /* Spara hela hatten så den överlever renderingar och omladdning. */
  state.wornHat={
    id:f.id,
    name:f.name,
    emoji:f.emoji,
    kind:f.kind || "odd",
    type:"hat",
    x:f.x,
    y:f.y
  };

  save();

  clearActionProps();
  renderTank();
  v66RenderHat();

  thought("✨");
  if(typeof v62Sound==="function")v62Sound("happy");
  if(typeof v57Stimulate==="function")v57Stimulate(8,"att bära hatten");

  working(false);
  actionLocked=false;
}

function v66RemoveHat(){
  if(!state.wornHat)return;

  const oldName=state.wornHat.name || "hatten";

  /* Först tillbaka till sanden, sedan bort från huvudet. */
  v70RestoreWornHatToSand();
  state.wornHat=null;

  save();
  renderTank();
  v66RenderHat();

  story(`${state.name} tar av sig ${oldName.toLowerCase()} och lägger den på sanden.`);
}

/* Säkerställ att hatten alltid ritas om efter alla tank-renderingar. */
const v70RenderTankBase=renderTank;
renderTank=function(...args){
  const r=v70RenderTankBase(...args);
  setTimeout(()=>v66RenderHat(),0);
  return r;
};

/* Äldre sparfiler: om hatten redan är på ska den fortsätta vara på. */
setTimeout(()=>{
  if(state?.wornHat){
    v66RenderHat();
  }
},300);


/* =========================================================
   TIDVATTENPÖLEN v7.1
   Besökare kan dyka upp av sig själva.
   De gör INGENTING med bläckfisken förrän spelaren klickar på dem.
   ========================================================= */

let v71Visitor=null;
let v71VisitorTimer=null;
let v71LastVisitorAt=0;

function v71EnsureVisitorLayer(){
  let layer=$("#v71-visitor-layer");
  if(layer)return layer;

  layer=document.createElement("div");
  layer.id="v71-visitor-layer";
  $("#tank")?.append(layer);
  return layer;
}

function v71FriendClone(){
  const real=$("#octopus .octopus-svg");
  if(!real)return null;
  const c=real.cloneNode(true);
  c.removeAttribute("id");
  c.querySelectorAll("#v4-necklace-svg,#v66-hat").forEach(n=>n.remove());
  return c;
}

const V71_VISITORS=[
  {type:"friend",name:"bläckfiskkompis",filter:"hue-rotate(70deg) saturate(1.2)"},
  {type:"friend",name:"bläckfiskkompis",filter:"hue-rotate(155deg) saturate(1.2)"},
  {type:"fish",name:"liten fisk",emoji:"🐠"},
  {type:"crab",name:"krabba",emoji:"🦀"},
  {type:"shrimp",name:"räka",emoji:"🦐"}
];

function v71RemoveVisitor(){
  v71Visitor?.el?.remove();
  v71Visitor=null;
}

function v71SpawnVisitor(){
  if(!state || actionLocked || v71Visitor)return;
  if($("#game-screen")?.hidden)return;
  const party=$("#v50-growth-party");
  if(party && !party.hidden)return;

  const data=pick(V71_VISITORS);
  const layer=v71EnsureVisitorLayer();
  if(!layer)return;

  const el=document.createElement("button");
  el.type="button";
  el.className=`v71-visitor ${data.type==="friend"?"friend":"animal"}`;
  el.setAttribute("aria-label",`Besök av ${data.name}`);
  el.style.left=`${rand(14,86)}%`;
  el.style.top=`${rand(30,70)}%`;

  if(data.type==="friend"){
    const clone=v71FriendClone();
    if(!clone)return;
    clone.style.filter=data.filter;
    el.append(clone);
  }else{
    el.textContent=data.emoji;
  }

  el.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    v71InteractVisitor();
  },true);

  layer.append(el);
  v71Visitor={...data,el};

  story(`En ${data.name} har kommit på besök. Klicka på den om du vill se vad som händer.`);
  v71LastVisitorAt=Date.now();

  /* Besökaren kan stå kvar länge utan att något händer.
     Försvinner bara lugnt efter 18 sekunder om spelaren inte klickar. */
  v71VisitorTimer=setTimeout(()=>{
    if(!v71Visitor)return;
    story(`${data.name.charAt(0).toUpperCase()+data.name.slice(1)} simmar vidare.`);
    v71RemoveVisitor();
  },18000);
}

async function v71InteractVisitor(){
  if(!v71Visitor || actionLocked)return;

  actionLocked=true;
  const v=v71Visitor;
  const el=v.el;

  if(v71VisitorTimer){
    clearTimeout(v71VisitorTimer);
    v71VisitorTimer=null;
  }

  el.classList.add("v71-active");

  const r=el.getBoundingClientRect();
  const tr=$("#tank").getBoundingClientRect();
  const x=((r.left+r.width/2-tr.left)/tr.width)*100;
  const y=((r.top+r.height/2-tr.top)/tr.height)*100;

  moveOcto(Math.max(8,Math.min(92,x-8)),Math.max(18,Math.min(82,y)),.65,750);
  await delay(800);

  if(v.type==="friend"){
    story(`${state.name} hälsar på sin bläckfiskkompis.`);
    thought("💗");
    await delay(650);

    if(Math.random()<.5){
      story(`De gör en liten dans tillsammans.`);
      $("#octopus")?.classList.add("v58-dancing");
      el.classList.add("v71-active");
      await delay(1800);
      $("#octopus")?.classList.remove("v58-dancing");
    }else{
      story(`De simmar runt varandra och leker.`);
      moveOcto(x+8,y-5,.62,650);
      await delay(700);
      moveOcto(x-5,y+4,.58,650);
      await delay(700);
    }

    state.needs.mood=clamp((state.needs.mood||0)+8);
    state.needs.stimulation=clamp((state.needs.stimulation||0)+10);
  }

  if(v.type==="fish"){
    story(`${state.name} simmar nyfiket efter fisken.`);
    thought("👀");
    moveOcto(x+10,y-4,.58,700);
    await delay(750);
    state.needs.stimulation=clamp((state.needs.stimulation||0)+8);
  }

  if(v.type==="crab"){
    story(`${state.name} undersöker krabban försiktigt.`);
    thought("🦀");
    await delay(1100);
    state.needs.stimulation=clamp((state.needs.stimulation||0)+9);
  }

  if(v.type==="shrimp"){
    story(`${state.name} följer räkan med blicken och försöker komma nära.`);
    thought("🦐");
    moveOcto(x+6,y,.55,650);
    await delay(700);
    state.needs.stimulation=clamp((state.needs.stimulation||0)+9);
  }

  renderNeeds();
  save();

  el.style.transition="opacity .5s ease, transform .5s ease";
  el.style.opacity="0";
  el.style.transform="translate(-50%,-70%) scale(.8)";
  await delay(520);

  v71RemoveVisitor();
  actionLocked=false;
}

/* Besökare får dyka upp ibland, men är helt passiva tills spelaren klickar. */
setInterval(()=>{
  if(!state || actionLocked || v71Visitor)return;
  if(Date.now()-v71LastVisitorAt<35000)return;
  if(Date.now()-v58LastUserAction<10000)return;
  if(Math.random()>.24)return;
  v71SpawnVisitor();
},5000);


/* =========================================================
   TIDVATTENPÖLEN v7.2 – FIX: färdigt pussel ska försvinna
   och ett nytt pussel ska börja tomt.
   ========================================================= */

function v72ResetPuzzleBoard(){
  if(!state) return;

  state.puzzle ||= {placed:0,total:6,round:0};
  state.puzzle.placed = 0;
  state.puzzle.celebrating = false;
  state.puzzleHidden = false;

  /* Ta bort gamla färdiga pusselrutan helt. */
  $("#v4-puzzle-board")?.remove();
  $("#v4-puzzle-reopen")?.remove();

  /* Ta bort gamla eventuella bitar/markeringar som blivit kvar i DOM. */
  $$(".v4-puzzle-piece,.puzzle-piece,.v69-puzzle-piece").forEach(el=>el.remove());

  save();

  /* Bygg nästa pussel från noll. */
  setTimeout(()=>{
    try{
      renderPuzzleBoard();
    }catch{}
  },80);
}

function v72CelebratePuzzle(){
  if(state?.puzzle?.celebrating) return;

  v69EnsurePuzzleState?.();
  state.puzzle.celebrating = true;
  save();

  const tank=$("#tank");
  if(!tank) return;

  $("#v69-puzzle-celebration")?.remove();

  const layer=document.createElement("div");
  layer.id="v69-puzzle-celebration";

  const banner=document.createElement("div");
  banner.id="v69-puzzle-banner";
  banner.textContent="🎺 Pusslet är klart! 🎉";
  layer.append(banner);

  const pieces=["🎉","✨","🎊","⭐","💗"];
  for(let i=0;i<34;i++){
    const c=document.createElement("span");
    c.className="v69-confetti";
    c.textContent=pick(pieces);
    c.style.left=`${rand(2,98)}%`;
    c.style.animationDelay=`${Math.random()*.7}s`;
    c.style.animationDuration=`${2+Math.random()*1.3}s`;
    c.style.fontSize=`${12+Math.random()*15}px`;
    layer.append(c);
  }

  tank.append(layer);

  thought("🎉");
  story(`${state.name} klarade pusslet!`);
  try{ v69TrumpetFanfare(); }catch{}

  /* Visa klart-pusslet kort, sedan bort med det och fram med ett nytt tomt. */
  setTimeout(()=>{
    layer.remove();

    state.puzzle.round=(state.puzzle.round||0)+1;
    v72ResetPuzzleBoard();

    const next = typeof v69CurrentPuzzle==="function" ? v69CurrentPuzzle() : null;
    if(next){
      toast(`Nytt pussel: ${next.title} 🧩`);
      story(`Nu börjar ett nytt pussel: ${next.title}. Hitta nya pusselbitar i sanden!`);
    }else{
      toast("Nytt pussel! 🧩");
      story("Nu börjar ett nytt pussel. Hitta nya pusselbitar i sanden!");
    }
  },3200);
}

/* Kör vår nya avslutning efter sista biten. */
const v72PlacePuzzleBase = placePuzzlePiece;
placePuzzlePiece = async function(f){
  v69EnsurePuzzleState?.();

  const before = state?.puzzle?.placed || 0;
  await v72PlacePuzzleBase(f);

  const total = state?.puzzle?.total || 6;
  const after = state?.puzzle?.placed || 0;

  if(before < total && after >= total){
    /* Hindra äldre completion-kod från att lämna klart pussel kvar. */
    setTimeout(v72CelebratePuzzle,120);
  }
};

/* Om en sparfil redan råkat fastna med färdigt pussel:
   städa upp den direkt vid start. */
setTimeout(()=>{
  if(!state?.puzzle) return;
  const total=state.puzzle.total || 6;

  if((state.puzzle.placed||0) >= total && !state.puzzle.celebrating){
    state.puzzle.round=(state.puzzle.round||0)+1;
    v72ResetPuzzleBoard();
    const next = typeof v69CurrentPuzzle==="function" ? v69CurrentPuzzle() : null;
    if(next) toast(`Nytt pussel: ${next.title} 🧩`);
  }
},500);


/* =========================================================
   TIDVATTENPÖLEN v7.3
   - personligheten påverkar självgående beteende
   - favoriter upptäcks över tid
   - vanor lärs av spelarens handlingar
   ========================================================= */

function v73EnsureState(){
  if(!state) return;

  state.v73 ||= {};
  state.v73.activityCounts ||= {};
  state.v73.favorite ||= null;
  state.v73.favoriteScore ||= {};
  state.v73.habits ||= {};
  state.v73.discoveries ||= [];
  state.v73.lastHabitAt ||= 0;
  state.v73.lastFavoriteAt ||= 0;
  state.v73.lastPersonalityAt ||= 0;
}

function v73Note(text){
  $("#v73-discovery-note")?.remove();
  const n=document.createElement("div");
  n.id="v73-discovery-note";
  n.textContent=text;
  $("#tank")?.append(n);
  setTimeout(()=>n.remove(),2900);
}

function v73HeartAt(x,y){
  const h=document.createElement("div");
  h.className="v73-heart";
  h.textContent="💗";
  h.style.left=`${x}%`;
  h.style.top=`${y}%`;
  $("#tank")?.append(h);
  setTimeout(()=>h.remove(),1450);
}

function v73RecordActivity(kind, item=null, amount=1){
  v73EnsureState();

  state.v73.activityCounts[kind]=(state.v73.activityCounts[kind]||0)+amount;

  if(item?.id){
    const key=`${kind}:${item.id}`;
    state.v73.favoriteScore[key]=(state.v73.favoriteScore[key]||0)+amount;
  }else{
    state.v73.favoriteScore[kind]=(state.v73.favoriteScore[kind]||0)+amount;
  }

  /* Lär sig vanor efter upprepning. */
  const count=state.v73.activityCounts[kind]||0;
  const thresholds={pet:4,ball:4,hide:3,puzzle:3,blocks:3,jar:3,ring:3,inspect:5};

  if(thresholds[kind] && count>=thresholds[kind] && !state.v73.habits[kind]){
    state.v73.habits[kind]=true;

    const labels={
      pet:`${state.name} har börjat förstå att handen betyder mys.`,
      ball:`${state.name} har fått en vana att söka efter bollen.`,
      hide:`${state.name} verkar ha fått för vana att smyga bakom algerna.`,
      puzzle:`${state.name} verkar gilla problemlösning.`,
      blocks:`${state.name} har börjat tycka om att bygga med klossar.`,
      jar:`${state.name} har blivit van vid att öppna burkar.`,
      ring:`${state.name} söker sig gärna till ringen.`,
      inspect:`${state.name} har blivit en riktig liten undersökare.`
    };

    v73Note(`Ny vana: ${labels[kind]||kind}`);
    story(labels[kind]||`${state.name} har lärt sig en ny vana.`);
  }

  v73UpdateFavorite();
  save();
}

function v73UpdateFavorite(){
  v73EnsureState();
  const entries=Object.entries(state.v73.favoriteScore);
  if(!entries.length) return;

  entries.sort((a,b)=>b[1]-a[1]);
  const [bestKey,bestScore]=entries[0];

  /* Favorit visas först när valet är tydligt och inte efter en enda lek. */
  if(bestScore<4) return;

  if(state.v73.favorite!==bestKey){
    state.v73.favorite=bestKey;

    const label=v73FavoriteLabel(bestKey);
    v73Note(`Ny favorit: ${label} 💗`);
    story(`${state.name} verkar ha fått en favorit: ${label}.`);

    const q=octoXY();
    v73HeartAt(q.x,q.y-6);
  }
}

function v73FavoriteLabel(key){
  if(key.startsWith("ball")) return "bollen";
  if(key.startsWith("ring")) return "ringen";
  if(key.startsWith("blocks")) return "klossarna";
  if(key.startsWith("puzzle")) return "pusslet";
  if(key.startsWith("jar")) return "burkarna";
  if(key.startsWith("hide")) return "att gömma sig";
  if(key.startsWith("pet")) return "att bli klappad";
  if(key.startsWith("inspect")) return "att undersöka saker";
  return "en aktivitet";
}

/* ---------- PERSONLIGHET ---------- */

function v73Traits(){
  const t=state?.traits || state?.personalityTraits || {};
  return {
    curiosity:Number(t.curiosity ?? t.nyfiken ?? 50),
    playfulness:Number(t.playfulness ?? t.lekfull ?? 50),
    calm:Number(t.calm ?? t.lugn ?? 50),
    social:Number(t.social ?? t.sociality ?? 50),
    courage:Number(t.courage ?? t.bravery ?? 50),
    independence:Number(t.independence ?? 50),
    cleverness:Number(t.cleverness ?? t.problemSolving ?? 50),
    stress:Number(t.stressSensitivity ?? t.stress ?? 50)
  };
}

function v73WeightedIdleChoice(){
  v73EnsureState();
  const t=v73Traits();
  const choices=[];

  const add=(name,weight)=>choices.push({name,weight:Math.max(1,weight)});

  add("dance",20 + t.playfulness*.5);
  add("swim",20 + t.calm*.25 + t.independence*.2);
  add("hide",8 + (100-t.courage)*.32 + t.stress*.2);
  add("inspect",8 + t.curiosity*.45 + t.cleverness*.18);
  add("ball",8 + t.playfulness*.45);
  add("rest",8 + t.calm*.35);

  /* Inlärda vanor förstärker sannolikheten. */
  if(state.v73.habits.ball) choices.find(x=>x.name==="ball").weight+=28;
  if(state.v73.habits.hide) choices.find(x=>x.name==="hide").weight+=24;
  if(state.v73.habits.inspect) choices.find(x=>x.name==="inspect").weight+=24;

  /* Favoriten förstärker beteendet ytterligare. */
  if(state.v73.favorite?.startsWith("ball")) choices.find(x=>x.name==="ball").weight+=34;
  if(state.v73.favorite?.startsWith("hide")) choices.find(x=>x.name==="hide").weight+=34;
  if(state.v73.favorite?.startsWith("inspect")) choices.find(x=>x.name==="inspect").weight+=34;

  const total=choices.reduce((s,x)=>s+x.weight,0);
  let r=Math.random()*total;
  for(const c of choices){
    r-=c.weight;
    if(r<=0)return c.name;
  }
  return "swim";
}

async function v73IdleInspect(token){
  if(token!==v58IdleToken)return;
  v58IdleBusy=true;

  const all=[
    ...(state.placedItems||[]).map(x=>({...x,_kind:"placed"})),
    ...(state.foundItems||[]).map(x=>({...x,_kind:"found"}))
  ];

  if(!all.length){
    v58IdleBusy=false;
    return v58IdleSwim(token);
  }

  const item=pick(all);
  v58IdleNote(`${state.name} blir nyfiken på ${item.name||"något i akvariet"} 👀`);
  moveOcto(Math.max(8,item.x-7),Math.max(20,item.y-5),.58,750);
  await delay(800);

  if(token===v58IdleToken){
    thought("?");
    story(`${state.name} undersöker ${item.name||"föremålet"} på egen hand.`);
    await delay(950);
  }

  v58IdleBusy=false;
}

async function v73IdleRest(token){
  if(token!==v58IdleToken)return;
  v58IdleBusy=true;
  v58IdleNote(`${state.name} tar det lugnt en stund 😌`);
  moveOcto(rand(25,75),rand(48,68),.42,800);
  await delay(850);

  if(token===v58IdleToken){
    thought("💤");
    state.needs.energy=clamp((state.needs.energy||0)+4);
    renderNeeds();
    save();
    await delay(1200);
  }
  v58IdleBusy=false;
}

/* Ersätt v5.8-idlevalet med personlighetsstyrt val.
   Spelarens klick har fortfarande alltid prioritet via v58IdleToken. */
v58RunIdle=function(){
  if(!v58CanIdle())return;

  const token=++v58IdleToken;
  const choice=v73WeightedIdleChoice();

  if(choice==="hide" && state.placedItems.some(p=>p.type==="kelp")){
    v58IdleHide(token);
  }else if(choice==="ball" && state.placedItems.some(p=>p.type==="ball")){
    v58IdleBall(token);
  }else if(choice==="inspect"){
    v73IdleInspect(token);
  }else if(choice==="rest"){
    v73IdleRest(token);
  }else if(choice==="dance"){
    v58IdleDance(token);
  }else{
    v58IdleSwim(token);
  }

  v58LastUserAction=Date.now();
};

/* ---------- LÄR AV SPELARENS HANDLINGAR ---------- */

if(typeof v57PetFromCorner==="function"){
  const v73PetBase=v57PetFromCorner;
  v57PetFromCorner=async function(...args){
    const r=await v73PetBase(...args);
    v73RecordActivity("pet",null,1);
    return r;
  };
}

if(typeof pushBall==="function"){
  const v73PushBase=pushBall;
  pushBall=async function(item,...args){
    const r=await v73PushBase(item,...args);
    v73RecordActivity("ball",item,1);
    return r;
  };
}

if(typeof throwBall==="function"){
  const v73ThrowBase=throwBall;
  throwBall=async function(item,...args){
    const r=await v73ThrowBase(item,...args);
    v73RecordActivity("ball",item,1.2);
    return r;
  };
}

if(typeof swimRing==="function"){
  const v73RingBase=swimRing;
  swimRing=async function(item,...args){
    const r=await v73RingBase(item,...args);
    v73RecordActivity("ring",item,1);
    return r;
  };
}

if(typeof hideKelp==="function"){
  const v73HideBase=hideKelp;
  hideKelp=async function(item,...args){
    const r=await v73HideBase(item,...args);
    v73RecordActivity("hide",item,1);
    return r;
  };
}

if(typeof buildTower==="function"){
  const v73BlocksBase=buildTower;
  buildTower=async function(item,...args){
    const r=await v73BlocksBase(item,...args);
    v73RecordActivity("blocks",item,1);
    return r;
  };
}

if(typeof openJar==="function"){
  const v73JarBase=openJar;
  openJar=async function(item,...args){
    const r=await v73JarBase(item,...args);
    v73RecordActivity("jar",item,1);
    return r;
  };
}

if(typeof placePuzzlePiece==="function"){
  const v73PuzzleBase=placePuzzlePiece;
  placePuzzlePiece=async function(item,...args){
    const r=await v73PuzzleBase(item,...args);
    v73RecordActivity("puzzle",item,1);
    return r;
  };
}

if(typeof inspectPlaced==="function"){
  const v73InspectPlacedBase=inspectPlaced;
  inspectPlaced=async function(item,...args){
    const r=await v73InspectPlacedBase(item,...args);
    v73RecordActivity("inspect",item,1);
    return r;
  };
}

if(typeof inspectFound==="function"){
  const v73InspectFoundBase=inspectFound;
  inspectFound=async function(item,...args){
    const r=await v73InspectFoundBase(item,...args);
    v73RecordActivity("inspect",item,1);
    return r;
  };
}

/* ---------- PROFIL: VISA FAVORIT + VANOR ---------- */

function v73ProfileExtras(){
  v73EnsureState();

  const panel=$("#profile-content") || $("#profile-dialog .dialog-body") || $("#profile-dialog");
  if(!panel) return;

  let box=$("#v73-profile-extra",panel);
  if(!box){
    box=document.createElement("div");
    box.id="v73-profile-extra";
    box.style.marginTop="12px";
    box.style.padding="10px 12px";
    box.style.borderRadius="14px";
    box.style.background="rgba(0,175,168,.08)";
    panel.append(box);
  }

  const habits=Object.keys(state.v73.habits).filter(k=>state.v73.habits[k]);
  const habitNames={
    pet:"söker mys",
    ball:"söker bollen",
    hide:"gömmer sig gärna",
    puzzle:"gillar pussel",
    blocks:"gillar klossar",
    jar:"öppnar gärna burkar",
    ring:"söker ringen",
    inspect:"undersöker gärna saker"
  };

  box.innerHTML=`
    <strong>Upptäckta vanor</strong><br>
    <span>${habits.length ? habits.map(h=>habitNames[h]||h).join(" • ") : "Inte upptäckta ännu"}</span>
    <br><br>
    <strong>Favorit</strong><br>
    <span>${state.v73.favorite ? v73FavoriteLabel(state.v73.favorite) : "Inte upptäckt ännu"}</span>
  `;
}

const v73ProfileBase=profile;
profile=function(...args){
  const r=v73ProfileBase(...args);
  setTimeout(v73ProfileExtras,0);
  return r;
};

setTimeout(()=>{
  if(state){
    v73EnsureState();
    save();
    v73ProfileExtras();
  }
},500);


/* =========================================================
   TIDVATTENPÖLEN v7.4 – RIKTIGA HEM
   ========================================================= */

/* Namnen i Bygg om ändras också, så det känns som riktiga bostäder. */
HOMES.basic.label="Stengrotta";
HOMES.basic.emoji="🪨";

HOMES.shell.label="Snäckhus";
HOMES.shell.emoji="🐚";

HOMES.coral.label="Korallkoja";
HOMES.coral.emoji="🪸";

HOMES.pearl.label="Sjunket skepp";
HOMES.pearl.emoji="⛵";

HOMES.luxury.label="Undervattensslott";
HOMES.luxury.emoji="🏰";

HOMES.palace.label="Kungligt havsslott";
HOMES.palace.emoji="👑";

function v74HomeMarkup(style="basic"){
  if(style==="basic"){
    return `
      <span class="v74-home basic">
        <span class="v74-top"></span>
        <span class="v74-main"></span>
        <span class="v74-door"></span>
      </span>`;
  }

  if(style==="shell"){
    return `
      <span class="v74-home shell">
        <span class="v74-main"></span>
        <span class="v74-door"></span>
      </span>`;
  }

  if(style==="coral"){
    return `
      <span class="v74-home coral">
        <span class="v74-top"></span>
        <span class="v74-main"></span>
        <span class="v74-door"></span>
      </span>`;
  }

  if(style==="pearl"){
    return `
      <span class="v74-home pearl">
        <span class="v74-mast"></span>
        <span class="v74-sail"></span>
        <span class="v74-top"></span>
        <span class="v74-main"></span>
        <span class="v74-door"></span>
      </span>`;
  }

  return `
    <span class="v74-home ${style}">
      <span class="v74-main"></span>
      <span class="v74-tower left"></span>
      <span class="v74-tower right"></span>
      <span class="v74-flag"></span>
      <span class="v74-window w1"></span>
      <span class="v74-window w2"></span>
      <span class="v74-door"></span>
    </span>`;
}

/* Ersätt den gamla "vanliga lilla koja"-grafiken. */
v66HomeMarkup=function(style="basic"){
  return v74HomeMarkup(style);
};

v66RenderHomeVisuals=function(){
  $$(".v4-object.v4-home").forEach(el=>{
    const id=el.dataset.id;
    const item=(state.placedItems||[]).find(x=>x.id===id);
    if(!item)return;

    const style=state.homeStyle||"basic";
    el.innerHTML=v74HomeMarkup(style);

    const labels={
      basic:"Stengrotta",
      shell:"Snäckhus",
      coral:"Korallkoja",
      pearl:"Sjunket skepp",
      luxury:"Undervattensslott",
      palace:"Kungligt havsslott"
    };
    el.setAttribute("aria-label",labels[style]||"Hem");
  });
};

/* Direkt uppdatering även för gamla sparfiler. */
setTimeout(()=>{
  if(state){
    v66RenderHomeVisuals();
  }
},300);


/* =========================================================
   TIDVATTENPÖLEN v7.5
   FIX: Klick precis bredvid bläckfisken får INTE fram handen.
   Handen visas bara när spelaren träffar en synlig del av kroppen.
   ========================================================= */

function v75IsRealOctopusHit(e){
  const oct=e.target.closest?.("#octopus");
  if(!oct) return false;

  /* Hatt och halsband har egna funktioner och ska inte klappa. */
  if(e.target.closest?.("#v66-hat,.v66-hat,#v4-necklace-svg")){
    return false;
  }

  /* Ett riktigt klick på kroppen ska landa på en målad SVG-form,
     inte bara på den genomskinliga behållaren runt figuren. */
  const tag=(e.target.tagName||"").toLowerCase();
  return ["path","circle","ellipse","polygon","rect"].includes(tag)
      && !!e.target.closest?.(".octopus-svg");
}

/* Den här körs före äldre klickhanterare.
   Om klicket ligger i bläckfiskens rektangel men INTE på själva kroppen,
   stoppas den gamla "klappa överallt"-logiken. */
document.addEventListener("pointerdown",e=>{
  /* v8.1: detta lager får aldrig svälja klick bredvid bläckfisken.
     Klappningen hanteras redan av den första riktiga kroppsträffen. */
  if(!v81IsRealOctopusHit(e)) return;
},true);


/* =========================================================
   TIDVATTENPÖLEN v8.2 – MER MAGI
   Tre trollningar krävs fortfarande för "Lilla magikern",
   men varje trollning får nu en tydlig fysisk händelse.
   ========================================================= */

function v82MagicLayer(){
  $("#v82-magic-layer")?.remove();
  const layer=document.createElement("div");
  layer.id="v82-magic-layer";
  $("#tank")?.append(layer);
  return layer;
}

function v82MagicBurst(layer,count=18){
  for(let i=0;i<count;i++){
    const s=document.createElement("span");
    s.className="v82-spark";
    s.textContent=pick(["✨","⭐","💫","✦"]);
    s.style.left=`${rand(8,92)}%`;
    s.style.top=`${rand(28,82)}%`;
    s.style.animationDelay=`${Math.random()*.45}s`;
    layer.append(s);
  }
}

async function v82MagicBubbles(layer){
  story(`${state.name} trollar fram ett helt hav av bubblor!`);
  for(let i=0;i<24;i++){
    const b=document.createElement("span");
    b.className="v82-bubble";
    b.textContent="🫧";
    b.style.left=`${rand(4,96)}%`;
    b.style.animationDelay=`${Math.random()*.75}s`;
    layer.append(b);
  }
  thought("🫧");
  await delay(2600);
}

async function v82MagicFish(layer){
  story(`${state.name} trollar fram ett stim av små fiskar!`);
  for(let i=0;i<7;i++){
    const f=document.createElement("span");
    f.className="v82-fish";
    f.textContent=pick(["🐠","🐟","🐡"]);
    f.style.top=`${rand(28,72)}%`;
    f.style.animationDelay=`${i*.18}s`;
    layer.append(f);
  }
  thought("😲");
  await delay(2900);
}

async function v82MagicObjects(layer){
  story(`${state.name} får sakerna i akvariet att sväva och dansa!`);
  const objects=$$(".v4-object").slice(0,8);
  objects.forEach((el,i)=>{
    el.classList.add(i%2 ? "v82-object-float" : "v82-object-wiggle");
  });
  v82MagicBurst(layer,12);
  await delay(2200);
  objects.forEach(el=>el.classList.remove("v82-object-float","v82-object-wiggle"));
}

async function v82MagicRainbow(layer){
  story(`${state.name} färgar hela akvariet med magiskt ljus!`);
  const r=document.createElement("div");
  r.className="v82-rainbow";
  layer.append(r);
  v82MagicBurst(layer,16);
  thought("🌈");
  await delay(2350);
}

async function v82MagicStarfall(layer){
  story(`${state.name} trollar fram ett stjärnregn!`);
  for(let i=0;i<26;i++){
    const s=document.createElement("span");
    s.className="v82-starfall";
    s.textContent=pick(["⭐","✨","💫"]);
    s.style.left=`${rand(3,97)}%`;
    s.style.animationDelay=`${Math.random()*.65}s`;
    layer.append(s);
  }
  await delay(2350);
}

async function v82MagicDance(layer){
  story(`Trollstaven får ${state.name} att göra en tokig magidans!`);
  const oct=$("#octopus");
  oct?.classList.add("v82-magic-dance");
  v82MagicBurst(layer,20);
  thought("🎩");
  await delay(2200);
  oct?.classList.remove("v82-magic-dance");
}

magic=async function(f){
  if(actionLocked)return;

  actionLocked=true;
  working(true);

  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);

  const wand=makeProp(f.emoji||"🪄",f.x,f.y);
  const q=octoXY();
  wand.style.left=`${q.x+5}%`;
  wand.style.top=`${q.y+2}%`;

  story(`${state.name} tar trollstaven och börjar trolla...`);
  thought("✨");
  await delay(650);

  const layer=v82MagicLayer();
  const effects=[
    v82MagicBubbles,
    v82MagicFish,
    v82MagicObjects,
    v82MagicRainbow,
    v82MagicStarfall,
    v82MagicDance
  ];

  const effect=pick(effects);
  await effect(layer);

  /* Varje lyckad trollning räknas mot uppdraget. */
  stat("magic",1);

  state.needs.stimulation=clamp((state.needs.stimulation||0)+14);
  state.needs.mood=clamp((state.needs.mood||0)+6);
  renderNeeds();
  save();

  clearActionProps();
  layer.remove();
  renderTank();

  story("Magin tonar bort, men bläckfisken verkar väldigt nöjd.");
  working(false);
  actionLocked=false;
};


/* =========================================================
   TIDVATTENPÖLEN v8.3
   - Magi räknas säkert mot uppdraget
   - Bläckfiskvänner saknar vit knappbakgrund och reagerar på klick
   - Mjukdjuret är en bläckfisk, inte en nalle
   - Fler klickbara små händelser dyker upp i omgivningen
   ========================================================= */

/* ---------- FIX: MJUKDJURET SKA VARA EN BLÄCKFISK ---------- */

function v83FixOctoPlush(){
  if(!state?.foundItems) return;
  let changed=false;
  state.foundItems.forEach(f=>{
    if(f.type==="octo-plush"){
      if(f.emoji!=="🐙"){ f.emoji="🐙"; changed=true; }
      if(!/bläckfisk/i.test(f.name||"")){
        f.name="Mjuk liten bläckfisk";
        changed=true;
      }
    }
  });
  if(changed) save();
}

setTimeout(()=>{
  if(state){
    v83FixOctoPlush();
    renderTank();
  }
},450);

/* ---------- FIX: MAGI SKA ALLTID RÄKNAS ---------- */

function v83RegisterMagic(){
  state.stats ||= {};
  state.stats.magic=(state.stats.magic||0)+1;

  checkQuests();
  save();
  renderQuests();
  renderBuildMenu();

  const q=QUESTS.find(x=>x.id==="magic");
  const n=Math.min(q?.goal||3,state.stats.magic||0);

  if(state.doneQuests?.magic){
    toast("✨ Lilla magikern klar – Lyxburken är upplåst!");
    story(`${state.name} har klarat Lilla magikern och låst upp Lyxburken.`);
  }else{
    toast(`✨ Magiträning ${n}/3`);
  }
}

/* Ersätt v8.2-magin med samma effekter men robust uppdragsräkning.
   Framsteget räknas direkt när en trollning startar, så det inte kan tappas. */
magic=async function(f){
  if(actionLocked)return;

  actionLocked=true;
  working(true);

  await approach(f.x,f.y,-1);
  hideRendered("found",f.id);

  const wand=makeProp(f.emoji||"🪄",f.x,f.y);
  const q=octoXY();
  wand.style.left=`${q.x+5}%`;
  wand.style.top=`${q.y+2}%`;

  story(`${state.name} tar trollstaven och börjar trolla...`);
  thought("✨");

  /* Räknas direkt mot 0/3 → 1/3 → 2/3 → klar. */
  v83RegisterMagic();

  await delay(500);

  const layer=v82MagicLayer();
  const effects=[
    v82MagicBubbles,
    v82MagicFish,
    v82MagicObjects,
    v82MagicRainbow,
    v82MagicStarfall,
    v82MagicDance
  ];

  await pick(effects)(layer);

  state.needs.stimulation=clamp((state.needs.stimulation||0)+14);
  state.needs.mood=clamp((state.needs.mood||0)+6);
  renderNeeds();
  save();

  clearActionProps();
  layer.remove();
  renderTank();

  story("Magin tonar bort, men bläckfisken verkar väldigt nöjd.");
  working(false);
  actionLocked=false;
};

/* ---------- BLÄCKFISKVÄNNER: SÄKRA KLICK + LEK ---------- */

async function v83PlayWithVisitor(){
  if(!v71Visitor || actionLocked)return;

  actionLocked=true;
  const v=v71Visitor;
  const el=v.el;

  if(v71VisitorTimer){
    clearTimeout(v71VisitorTimer);
    v71VisitorTimer=null;
  }

  el.classList.add("v71-active");

  const r=el.getBoundingClientRect();
  const tr=$("#tank").getBoundingClientRect();
  const x=((r.left+r.width/2-tr.left)/tr.width)*100;
  const y=((r.top+r.height/2-tr.top)/tr.height)*100;

  moveOcto(Math.max(9,x-10),Math.max(20,y),.62,700);
  await delay(760);

  if(v.type==="friend"){
    story(`${state.name} simmar fram till sin bläckfiskkompis.`);
    thought("💗");
    await delay(450);

    const games=["dance","circle","peek"];
    const g=pick(games);

    if(g==="dance"){
      story("De börjar dansa tillsammans!");
      $("#octopus")?.classList.add("v58-dancing");
      el.classList.add("v71-active");
      await delay(1900);
      $("#octopus")?.classList.remove("v58-dancing");
    }else if(g==="circle"){
      story("De jagar varandra runt i en liten cirkel.");
      moveOcto(x+9,y-5,.58,620); await delay(650);
      moveOcto(x+1,y+8,.56,620); await delay(650);
      moveOcto(x-9,y-2,.6,620); await delay(650);
    }else{
      story("Kompisen gömmer sig lite och de leker tittut.");
      el.style.opacity=".25";
      await delay(650);
      el.style.opacity="1";
      thought("😄");
      await delay(700);
    }

    state.needs.mood=clamp((state.needs.mood||0)+10);
    state.needs.stimulation=clamp((state.needs.stimulation||0)+12);
  }else{
    /* De andra djuren behåller egna beteenden. */
    if(v.type==="fish"){
      story(`${state.name} simmar nyfiket efter fisken.`);
      moveOcto(x+10,y-4,.58,700);
      await delay(750);
    }else if(v.type==="crab"){
      story(`${state.name} petar försiktigt på krabban och backar snabbt.`);
      thought("🦀");
      await delay(900);
    }else if(v.type==="shrimp"){
      story(`${state.name} följer räkan och försöker komma nära.`);
      moveOcto(x+6,y,.55,650);
      await delay(700);
    }
    state.needs.stimulation=clamp((state.needs.stimulation||0)+9);
  }

  renderNeeds();
  save();

  el.style.transition="opacity .45s ease, transform .45s ease";
  el.style.opacity="0";
  await delay(470);

  v71RemoveVisitor();
  actionLocked=false;
}

/* Oavsett vilken äldre visitor-listener som sattes: fånga klicket här först. */
document.addEventListener("pointerdown",e=>{
  const el=e.target.closest?.(".v71-visitor");
  if(!el) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  v83PlayWithVisitor();
},true);

/* ---------- FLER KLICKBARA SAKER I OMGIVNINGEN ---------- */

let v83Ambient=null;
let v83AmbientTimer=null;
let v83LastAmbientAt=0;

function v83AmbientLayer(){
  let l=$("#v83-ambient-layer");
  if(l) return l;
  l=document.createElement("div");
  l.id="v83-ambient-layer";
  $("#tank")?.append(l);
  return l;
}

const V83_AMBIENTS=[
  {type:"bubble",emoji:"🫧",name:"en stor bubbla"},
  {type:"star",emoji:"⭐",name:"en blinkande sjöstjärna"},
  {type:"shell",emoji:"🐚",name:"en snäcka"},
  {type:"pearl",emoji:"⚪",name:"en pärla"},
  {type:"leaf",emoji:"🌿",name:"ett drivande sjöblad"}
];

function v83RemoveAmbient(){
  v83Ambient?.el?.remove();
  v83Ambient=null;
}

function v83SpawnAmbient(){
  if(!state || actionLocked || v83Ambient) return;
  if($("#game-screen")?.hidden) return;

  const d=pick(V83_AMBIENTS);
  const el=document.createElement("button");
  el.type="button";
  el.className="v83-ambient";
  el.textContent=d.emoji;
  el.setAttribute("aria-label",`Klicka på ${d.name}`);
  el.style.left=`${rand(12,88)}%`;
  el.style.top=`${rand(28,72)}%`;

  el.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    v83UseAmbient();
  },true);

  v83AmbientLayer().append(el);
  v83Ambient={...d,el};
  v83LastAmbientAt=Date.now();

  story(`${d.name.charAt(0).toUpperCase()+d.name.slice(1)} dyker upp. Klicka om du vill se vad som händer.`);

  v83AmbientTimer=setTimeout(()=>{
    if(v83Ambient?.el===el){
      el.style.opacity="0";
      setTimeout(v83RemoveAmbient,350);
    }
  },15000);
}

async function v83UseAmbient(){
  if(!v83Ambient || actionLocked) return;

  actionLocked=true;
  const a=v83Ambient;
  const el=a.el;
  if(v83AmbientTimer){clearTimeout(v83AmbientTimer);v83AmbientTimer=null}

  el.classList.add("active");

  const r=el.getBoundingClientRect();
  const tr=$("#tank").getBoundingClientRect();
  const x=((r.left+r.width/2-tr.left)/tr.width)*100;
  const y=((r.top+r.height/2-tr.top)/tr.height)*100;

  moveOcto(Math.max(8,x-8),Math.max(20,y),.58,650);
  await delay(700);

  if(a.type==="bubble"){
    story(`${state.name} petar på bubblan – POP!`);
    el.textContent="✨";
    thought("😮");
  }else if(a.type==="star"){
    story(`${state.name} snurrar sjöstjärnan och den glittrar.`);
    el.textContent="💫";
    thought("⭐");
  }else if(a.type==="shell"){
    story(`${state.name} öppnar snäckan och tittar in.`);
    el.textContent="🦪";
    thought("👀");
  }else if(a.type==="pearl"){
    story(`${state.name} balanserar pärlan på en arm.`);
    moveOcto(x,y-4,.54,500);
    thought("⚪");
  }else{
    story(`${state.name} försöker fånga sjöbladet och dansar med det.`);
    $("#octopus")?.classList.add("v58-dancing");
    thought("🌿");
  }

  state.needs.stimulation=clamp((state.needs.stimulation||0)+8);
  state.needs.mood=clamp((state.needs.mood||0)+4);
  renderNeeds();
  save();

  await delay(1400);
  $("#octopus")?.classList.remove("v58-dancing");

  el.style.opacity="0";
  await delay(300);
  v83RemoveAmbient();
  actionLocked=false;
}

/* De dyker upp ibland men gör ingenting förrän man klickar. */
setInterval(()=>{
  if(!state || actionLocked || v83Ambient) return;
  if(Date.now()-v83LastAmbientAt<22000) return;
  if(Date.now()-v58LastUserAction<7000) return;
  if(Math.random()>.32) return;
  v83SpawnAmbient();
},4500);


/* =========================================================
   TIDVATTENPÖLEN v8.4 – snabbare och tydligare tillväxt
   Bebisstadiet ska inte kännas för långt i en 5-minutersdemo.
   ========================================================= */

function v84GrowthStage(){
  if(!state) return "bebis";

  const care = Number(state.careMoments || 0);
  const born = Number(state.bornAt || Date.now());
  const minutes = Math.max(0, (Date.now() - born) / 60000);

  /* Ny balans:
     bebis: första stunden
     växande: efter ca 3 omsorgs-/lekstunder eller 1,5 minut
     ung: efter ca 7 stunder eller 4 minuter
     vuxen: efter ca 14 stunder eller 10 minuter
  */
  if(care >= 14 || minutes >= 10) return "vuxen";
  if(care >= 7  || minutes >= 4)  return "ung";
  if(care >= 3  || minutes >= 1.5) return "växande";
  return "bebis";
}

/* Alla senare system som frågar efter tillväxtstadium ska använda den nya balansen. */
v50StageFromState = v84GrowthStage;

function v84ApplyGrowthVisual(){
  if(!state) return;

  const stage = v84GrowthStage();
  const scaleMap = {
    bebis: .42,
    växande: .58,
    ung: .74,
    vuxen: .92
  };

  const oct = $("#octopus");
  if(oct) oct.dataset.s = String(scaleMap[stage] ?? .42);

  const badge = $("#stage-badge");
  if(badge){
    badge.textContent =
      stage === "bebis" ? "liten bebis" :
      stage === "växande" ? "växande" :
      stage === "ung" ? "ung" : "vuxen";
  }
}

/* Kontrollera tillväxt oftare så förändringen syns under spelpasset. */
let v84LastStage = null;

function v84CheckGrowth(){
  if(!state) return;

  const newStage = v84GrowthStage();
  const oldStage = state.growthStage || "bebis";

  v84ApplyGrowthVisual();

  if(newStage !== oldStage){
    const order = ["bebis","växande","ung","vuxen"];
    if(order.indexOf(newStage) > order.indexOf(oldStage)){
      state.growthStage = newStage;
      save();

      if(typeof v50CelebrateGrowth === "function"){
        setTimeout(()=>v50CelebrateGrowth(newStage), 120);
      }
    }else{
      state.growthStage = newStage;
      save();
    }
  }

  v84LastStage = newStage;
}

setInterval(v84CheckGrowth, 5000);
setTimeout(v84CheckGrowth, 250);

/* Varje tydlig omsorgshändelse kan nu hjälpa tillväxten framåt direkt. */
if(typeof v57PetFromCorner === "function"){
  const v84PetBase = v57PetFromCorner;
  v57PetFromCorner = async function(...args){
    const r = await v84PetBase(...args);
    v84CheckGrowth();
    return r;
  };
}

if(typeof pushBall === "function"){
  const v84PushBase = pushBall;
  pushBall = async function(...args){
    const r = await v84PushBase(...args);
    state.careMoments = (state.careMoments || 0) + 1;
    save();
    v84CheckGrowth();
    return r;
  };
}

if(typeof throwBall === "function"){
  const v84ThrowBase = throwBall;
  throwBall = async function(...args){
    const r = await v84ThrowBase(...args);
    state.careMoments = (state.careMoments || 0) + 1;
    save();
    v84CheckGrowth();
    return r;
  };
}

if(typeof placePuzzlePiece === "function"){
  const v84PuzzleBase = placePuzzlePiece;
  placePuzzlePiece = async function(...args){
    const r = await v84PuzzleBase(...args);
    state.careMoments = (state.careMoments || 0) + 1;
    save();
    v84CheckGrowth();
    return r;
  };
}


/* =========================================================
   TIDVATTENPÖLEN v8.5 – lite längre tid mellan tillväxtstegen
   ========================================================= */

function v85GrowthStage(){
  if(!state) return "bebis";

  const care = Number(state.careMoments || 0);
  const born = Number(state.bornAt || Date.now());
  const minutes = Math.max(0, (Date.now() - born) / 60000);

  /* Lite lugnare tempo än v8.4:
     växande: ca 4 omsorgs-/lekstunder eller 2,5 min
     ung: ca 9 stunder eller 6 min
     vuxen: ca 18 stunder eller 14 min
  */
  if(care >= 18 || minutes >= 14) return "vuxen";
  if(care >= 9  || minutes >= 6)  return "ung";
  if(care >= 4  || minutes >= 2.5) return "växande";
  return "bebis";
}

v50StageFromState = v85GrowthStage;

function v85ApplyGrowthVisual(){
  if(!state) return;
  const stage=v85GrowthStage();
  const scaleMap={bebis:.42,växande:.58,ung:.74,vuxen:.92};

  const oct=$("#octopus");
  if(oct) oct.dataset.s=String(scaleMap[stage] ?? .42);

  const badge=$("#stage-badge");
  if(badge){
    badge.textContent=
      stage==="bebis" ? "liten bebis" :
      stage==="växande" ? "växande" :
      stage==="ung" ? "ung" : "vuxen";
  }
}

function v85CheckGrowth(){
  if(!state) return;

  const newStage=v85GrowthStage();
  const oldStage=state.growthStage || "bebis";

  v85ApplyGrowthVisual();

  if(newStage!==oldStage){
    const order=["bebis","växande","ung","vuxen"];

    if(order.indexOf(newStage)>order.indexOf(oldStage)){
      state.growthStage=newStage;
      save();
      if(typeof v50CelebrateGrowth==="function"){
        setTimeout(()=>v50CelebrateGrowth(newStage),120);
      }
    }else{
      state.growthStage=newStage;
      save();
    }
  }
}

setInterval(v85CheckGrowth,5000);
setTimeout(v85CheckGrowth,250);


/* =========================================================
   TIDVATTENPÖLEN v8.6 – ytterligare livsstadium: gammal
   ========================================================= */

function v86GrowthStage(){
  if(!state) return "bebis";

  const care = Number(state.careMoments || 0);
  const born = Number(state.bornAt || Date.now());
  const minutes = Math.max(0, (Date.now() - born) / 60000);

  /* Livssteg:
     bebis   -> växande -> ung -> vuxen -> gammal
     "gammal" tar tydligt längre tid så utvecklingen känns naturlig.
  */
  if(care >= 32 || minutes >= 30) return "gammal";
  if(care >= 18 || minutes >= 14) return "vuxen";
  if(care >= 9  || minutes >= 6)  return "ung";
  if(care >= 4  || minutes >= 2.5) return "växande";
  return "bebis";
}

v50StageFromState = v86GrowthStage;

function v86ApplyGrowthVisual(){
  if(!state) return;

  const stage=v86GrowthStage();
  const scaleMap={
    bebis:.42,
    växande:.58,
    ung:.74,
    vuxen:.92,
    gammal:.96
  };

  const oct=$("#octopus");
  if(oct){
    oct.dataset.s=String(scaleMap[stage] ?? .42);
    oct.classList.toggle("v86-old",stage==="gammal");
  }

  const badge=$("#stage-badge");
  if(badge){
    badge.textContent=
      stage==="bebis" ? "liten bebis" :
      stage==="växande" ? "växande" :
      stage==="ung" ? "ung" :
      stage==="vuxen" ? "vuxen" : "gammal";
  }
}

function v86CheckGrowth(){
  if(!state) return;

  const newStage=v86GrowthStage();
  const oldStage=state.growthStage || "bebis";
  const order=["bebis","växande","ung","vuxen","gammal"];

  v86ApplyGrowthVisual();

  if(newStage!==oldStage){
    state.growthStage=newStage;
    save();

    if(order.indexOf(newStage)>order.indexOf(oldStage)){
      if(newStage==="gammal"){
        toast(`${state.name} har blivit gammal 💗`);
        story(`${state.name} har blivit en äldre bläckfisk. Den rör sig lite lugnare men känner igen sina vanor och favoriter.`);
        thought("💗");
      }else if(typeof v50CelebrateGrowth==="function"){
        setTimeout(()=>v50CelebrateGrowth(newStage),120);
      }
    }
  }
}

setInterval(v86CheckGrowth,5000);
setTimeout(v86CheckGrowth,250);

/* Äldre bläckfisk tar det lite lugnare när den hittar på saker själv. */
const v86WeightedIdleBase=v73WeightedIdleChoice;
v73WeightedIdleChoice=function(){
  if(v86GrowthStage()!=="gammal"){
    return v86WeightedIdleBase();
  }

  const choices=[
    "rest","rest","swim","inspect","hide","dance"
  ];
  return pick(choices);
};


/* =========================================================
   TIDVATTENPÖLEN v8.7
   1) Ny bläckfisk är liten DIREKT när akvariet visas.
   2) Handen klappar bara när man faktiskt klickar på den målade kroppen.
   ========================================================= */

function v87StageNow(){
  if(!state) return "bebis";
  if(typeof v86GrowthStage==="function") return v86GrowthStage();
  if(typeof v85GrowthStage==="function") return v85GrowthStage();
  if(typeof v50StageFromState==="function") return v50StageFromState();
  return state.growthStage || "bebis";
}

function v87ApplySizeBeforePaint(){
  if(!state) return;

  const stage=v87StageNow();
  const scales={
    bebis:.42,
    växande:.58,
    ung:.74,
    vuxen:.92,
    gammal:.96
  };

  const oct=$("#octopus");
  if(oct){
    const s=scales[stage] ?? .42;
    oct.dataset.s=String(s);

    /* Sätt även inline-transform direkt, innan första bildrutan målas. */
    const x=parseFloat(oct.style.left)||50;
    const y=parseFloat(oct.style.top)||48;
    oct.style.left=`${x}%`;
    oct.style.top=`${y}%`;
    oct.style.transform=`translate(-50%,-50%) scale(${s})`;
  }

  const game=$("#game-screen");
  if(game) game.dataset.v87GrowthReady="1";
}

/* Ny state får uttryckligen bebisstadium från första millisekunden. */
const v87NewStateBase=newState;
newState=function(name,primary,scores){
  const s=v87NewStateBase(name,primary,scores);
  s.growthStage="bebis";
  return s;
};

/* Viktigast: applicera storleken INNAN original-enterGame visar skärmen. */
const v87EnterGameBase=enterGame;
enterGame=function(){
  if(state){
    ensureState();
    v87ApplySizeBeforePaint();
  }
  const result=v87EnterGameBase();
  v87ApplySizeBeforePaint();
  return result;
};

/* Vid "Ny bläckfisk" ska nästa öppning åter börja i bebisstorlek. */
const v87ResetBase=resetPet;
resetPet=function(){
  const r=v87ResetBase();
  const game=$("#game-screen");
  if(game) delete game.dataset.v87GrowthReady;
  const oct=$("#octopus");
  if(oct){
    oct.dataset.s=".42";
    oct.style.transform="translate(-50%,-50%) scale(.42)";
  }
  return r;
};

/* ---------------------------------------------------------
   Exakt träfftest på SVG:n.
   Fungerar även när #octopus själv har pointer-events:none.
   --------------------------------------------------------- */

function v87PointHitsOctopus(clientX,clientY){
  const svg=$("#octopus .octopus-svg");
  if(!svg) return false;

  const shapes=svg.querySelectorAll("path,circle,ellipse,polygon,rect");
  const point=new DOMPoint(clientX,clientY);

  for(const shape of shapes){
    /* Smycken/extra grafik ska inte räknas som kroppen. */
    if(shape.closest("#v4-necklace-svg,#v66-hat,.v66-hat")) continue;

    try{
      const ctm=shape.getScreenCTM();
      if(!ctm) continue;
      const local=point.matrixTransform(ctm.inverse());

      if(typeof shape.isPointInFill==="function" && shape.isPointInFill(local)){
        return true;
      }
      if(typeof shape.isPointInStroke==="function" && shape.isPointInStroke(local)){
        return true;
      }
    }catch{}
  }
  return false;
}

/* Lägg lyssnaren på tanken. Då kan klicken gå igenom den osynliga
   rektangeln runt bläckfisken, men vi kan ändå känna igen kroppen exakt. */
$("#tank")?.addEventListener("pointerdown",e=>{
  if(!state || actionLocked) return;

  /* Hatt och halsband får behålla sina egna funktioner. */
  if(e.target.closest?.("#v66-hat,.v66-hat,#v4-necklace-svg")) return;

  if(!v87PointHitsOctopus(e.clientX,e.clientY)) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  if(typeof v60PetWithExistingHand==="function"){
    v60PetWithExistingHand();
  }else if(typeof v59PetWithRealHand==="function"){
    v59PetWithRealHand();
  }else if(typeof v57PetFromCorner==="function"){
    v57PetFromCorner();
  }
},true);

/* Kör även direkt vid laddning, innan eventloopens senare tillväxtkontroller. */
v87ApplySizeBeforePaint();


/* =========================================================
   TIDVATTENPÖLEN v8.8 – Bygg om: flikar ska INTE stänga menyn
   ========================================================= */

function v88IsBuildDialogOpen(){
  const dlg=$("#inventory-dialog");
  return !!dlg && dlg.open;
}

/* Fånga klick på flikar/knappar inne i Bygg om innan äldre kod hinner
   behandla dem som submit/stängning. */
document.addEventListener("pointerdown",e=>{
  const dlg=e.target.closest?.("#inventory-dialog");
  if(!dlg || !dlg.open) return;

  const tab=e.target.closest?.(
    '[data-tab],[data-build-tab],.build-tab,.inventory-tab,.v4-build-tab,.tab-button'
  );

  if(!tab) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  /* Gör knappen uttryckligen icke-submit. */
  if(tab.tagName==="BUTTON"){
    tab.type="button";
  }

  const wanted =
    tab.dataset.buildTab ||
    tab.dataset.tab ||
    tab.getAttribute("aria-controls") ||
    tab.textContent?.trim();

  /* Om det finns en befintlig flikfunktion, använd den.
     Annars simulera bara aktiv flik utan att stänga dialogen. */
  if(typeof selectBuildTab==="function"){
    try{ selectBuildTab(wanted); }catch{}
  }else if(typeof setBuildTab==="function"){
    try{ setBuildTab(wanted); }catch{}
  }else if(typeof renderBuildMenu==="function"){
    /* Många äldre versioner läser aktiv flik från dataset/state. */
    if(state){
      state.buildTab = wanted || state.buildTab;
      save();
    }
    try{ renderBuildMenu(); }catch{}
  }

  /* Säkerställ att dialogen fortfarande är öppen efter render. */
  setTimeout(()=>{
    const d=$("#inventory-dialog");
    if(d && !d.open){
      try{ d.showModal(); }catch{}
    }
  },0);
},true);

/* Äldre form-submit i dialogen ska aldrig stänga den när det bara är
   ett flik- eller byggval. Endast X/stäng-knappen får stänga. */
document.addEventListener("submit",e=>{
  const form=e.target;
  const dlg=form?.closest?.("#inventory-dialog");
  if(!dlg) return;

  e.preventDefault();
  e.stopPropagation();

  setTimeout(()=>{
    if(!dlg.open){
      try{ dlg.showModal(); }catch{}
    }
  },0);
},true);

/* Alla knappar i Bygg om, utom uttryckliga stängknappar, ska vara type=button. */
function v88NormalizeBuildButtons(){
  const dlg=$("#inventory-dialog");
  if(!dlg) return;

  dlg.querySelectorAll("button").forEach(b=>{
    const isClose =
      b.matches('[data-close],.close-button,.dialog-close,#inventory-close') ||
      /stäng|×|✕|x/i.test((b.textContent||"").trim());

    if(!isClose){
      b.type="button";
    }
  });
}

const v88RenderBuildBase = typeof renderBuildMenu==="function" ? renderBuildMenu : null;
if(v88RenderBuildBase){
  renderBuildMenu=function(...args){
    const r=v88RenderBuildBase(...args);
    setTimeout(v88NormalizeBuildButtons,0);
    return r;
  };
}

setTimeout(v88NormalizeBuildButtons,300);


/* =========================================================
   TIDVATTENPÖLEN v8.9 – FIX: kalaset får inte gå på repeat
   ========================================================= */

/*
  Flera äldre tillväxtkontroller ligger kvar i spelet från tidigare
  versioner. De använde olika tidsgränser och kunde därför växla
  growthStage fram och tillbaka. Det kunde starta samma kalas om igen.
  Från och med v8.9 använder ALLA äldre kontroller samma stadium.
*/

function v89GrowthStage(){
  if(!state) return "bebis";

  const care = Number(state.careMoments || 0);
  const born = Number(state.bornAt || Date.now());
  const minutes = Math.max(0, (Date.now() - born) / 60000);

  if(care >= 32 || minutes >= 30) return "gammal";
  if(care >= 18 || minutes >= 14) return "vuxen";
  if(care >= 9  || minutes >= 6)  return "ung";
  if(care >= 4  || minutes >= 2.5) return "växande";
  return "bebis";
}

/* Äldre timers anropar dessa funktioner dynamiskt – gör dem enhetliga. */
v84GrowthStage = v89GrowthStage;
v85GrowthStage = v89GrowthStage;
v86GrowthStage = v89GrowthStage;
v50StageFromState = v89GrowthStage;

/* Spara vilka livssteg som redan har firats. */
function v89EnsureCelebrations(){
  if(!state) return;
  state.celebratedGrowthStages ||= {};
}

/* Lägg ett hårt skydd runt hela kalasfunktionen.
   Ett livssteg får bara starta sitt kalas EN gång. */
const v89CelebrateBase = v50CelebrateGrowth;
v50CelebrateGrowth = function(stage){
  if(!state) return;

  v89EnsureCelebrations();

  /* Gammal har sitt lugna meddelande och ska inte ha disco. */
  if(stage === "gammal") return;

  if(state.celebratedGrowthStages[stage]){
    return;
  }

  state.celebratedGrowthStages[stage] = true;
  save();

  return v89CelebrateBase(stage);
};

/* Stoppa eventuella dubbla party-lager om en äldre loop redan hunnit skapa fler. */
function v89CleanDuplicateParty(){
  const parties = [...document.querySelectorAll("#v50-growth-party")];
  parties.slice(1).forEach(p=>p.remove());

  const stages = [...document.querySelectorAll("#v52-party-stage")];
  stages.slice(1).forEach(p=>p.remove());

  const notes = [...document.querySelectorAll("#v56-growth-note")];
  notes.slice(1).forEach(p=>p.remove());
}

/* Säker canonical tillväxtkontroll. */
function v89CheckGrowth(){
  if(!state) return;

  v89EnsureCelebrations();

  const newStage = v89GrowthStage();
  const oldStage = state.growthStage || "bebis";
  const order = ["bebis","växande","ung","vuxen","gammal"];

  /* Bara tillåt framåtriktad utveckling. Aldrig backa ett stadium. */
  if(order.indexOf(newStage) > order.indexOf(oldStage)){
    state.growthStage = newStage;
    save();

    if(newStage === "gammal"){
      toast(`${state.name} har blivit gammal 💗`);
      story(`${state.name} har blivit en äldre bläckfisk.`);
      thought("💗");
    }else{
      v50CelebrateGrowth(newStage);
    }
  }else if(order.indexOf(newStage) < order.indexOf(oldStage)){
    /*
      Äldre timers kan försöka skriva ett yngre stadium.
      Sätt tillbaka det högsta stadium som redan uppnåtts.
    */
    state.growthStage = oldStage;
  }

  v89CleanDuplicateParty();
}

setInterval(v89CheckGrowth, 3000);
setTimeout(v89CheckGrowth, 350);


/* =========================================================
   TIDVATTENPÖLEN v9.0 – STABILISERING
   Inga nya stora funktioner. Detta lager minskar konflikter mellan
   äldre prototypversioner och gör de viktigaste systemen entydiga.
   ========================================================= */

/* ---------- 1. PUSSEL: bara ETT avslutningssystem ---------- */

/*
  v6.0–v6.5 hade ett separat pussel-completion-system som fortfarande
  kunde schemalägga en extra reset/fanfare. v7.2 är nu den enda
  completion-logiken som ska styra färdigt pussel.
*/
v60CheckPuzzleComplete = async function(){};

/* Städa gammal väntestatus från sparfiler. */
function v90NormalizePuzzle(){
  if(!state) return;
  state.puzzleWaitingClose=false;
  if(state.puzzle){
    state.puzzle.total = Number(state.puzzle.total || 6);
    state.puzzle.placed = Math.max(0, Math.min(state.puzzle.total, Number(state.puzzle.placed || 0)));
    state.puzzle.celebrating = !!state.puzzle.celebrating;
  }
}

/* ---------- 2. BESÖKARE: inga gamla automatiska kompis-event ---------- */

/*
  v6.3 hade ett äldre system där en kompis kunde dyka upp och börja
  leka automatiskt. Det krockar med den senare regeln att besökare
  bara gör något när spelaren klickar.
*/
function v90StopLegacyAmbient(){
  if(typeof v63AmbientTimer!=="undefined" && v63AmbientTimer){
    clearInterval(v63AmbientTimer);
    v63AmbientTimer=null;
  }
}

/* ---------- 3. BYGG OM: flikbyte får aldrig stänga dialogen ---------- */

function v90InstallBuildTabs(){
  const dlg=$("#inventory-dialog");
  if(!dlg) return;

  const tabs=$(".v4-build-tabs",dlg);
  if(!tabs) return;

  tabs.querySelectorAll("button[data-tab]").forEach(btn=>{
    btn.type="button";

    /* onclick-propertyn ersätts med en enda enkel handler. */
    btn.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();

      if(!state) return;
      state.buildTab=btn.dataset.tab || "toys";
      save();

      renderBuildMenu();

      const d=$("#inventory-dialog");
      if(d && !d.open){
        try{ d.showModal(); }catch{}
      }
    };
  });
}

const v90RenderBuildBase=renderBuildMenu;
renderBuildMenu=function(...args){
  const r=v90RenderBuildBase(...args);
  v88NormalizeBuildButtons?.();
  setTimeout(v90InstallBuildTabs,0);
  return r;
};

/* ---------- 4. KALAS: aldrig två party-sessioner samtidigt ---------- */

let v90PartyRunning=false;

const v90PartyBase=v50CelebrateGrowth;
v50CelebrateGrowth=function(stage){
  if(!state || stage==="gammal") return;

  v89EnsureCelebrations?.();

  if(state.celebratedGrowthStages?.[stage]) return;
  if(v90PartyRunning) return;

  v90PartyRunning=true;
  state.celebratedGrowthStages ||= {};
  state.celebratedGrowthStages[stage]=true;
  save();

  /*
    v89 hade redan ett celebrations-skydd. För att inte blockeras av
    dess wrapper anropar vi den underliggande partyfunktionen som
    v89 sparade innan sitt skydd.
  */
  const fn=(typeof v89CelebrateBase==="function") ? v89CelebrateBase : v90PartyBase;
  const result=fn(stage);

  /* Party-animationen är ca 14 sek. Lås ny party-start tills den är klar. */
  setTimeout(()=>{v90PartyRunning=false},15500);
  return result;
};

/* ---------- 5. STARTSTORLEK: applicera bebisstorlek före visning ---------- */

function v90ApplyGrowthVisual(){
  if(!state) return;

  const stage=v89GrowthStage();
  const scale={
    bebis:.42,
    växande:.58,
    ung:.74,
    vuxen:.92,
    gammal:.96
  }[stage] ?? .42;

  const oct=$("#octopus");
  if(oct){
    oct.dataset.s=String(scale);
    oct.style.transform=`translate(-50%,-50%) scale(${scale})`;
    oct.classList.toggle("v86-old",stage==="gammal");
  }

  const game=$("#game-screen");
  if(game) game.dataset.v87GrowthReady="1";
}

const v90EnterGameBase=enterGame;
enterGame=function(...args){
  if(state) v90ApplyGrowthVisual();
  const r=v90EnterGameBase(...args);
  v90ApplyGrowthVisual();
  v90StopLegacyAmbient();
  v90NormalizePuzzle();
  setTimeout(v90InstallBuildTabs,0);
  return r;
};

/* ---------- 6. HAND/KLICK: bara slutliga exakta träfftestet används ---------- */

/*
  Alla äldre handlers blir i praktiken passiva eftersom #octopus inte
  tar pointer-events. Den här är den enda avsiktliga klappvägen.
*/
function v90PetAtPoint(e){
  if(!state || actionLocked) return false;
  if(!v87PointHitsOctopus(e.clientX,e.clientY)) return false;

  if(typeof v60PetWithExistingHand==="function"){
    v60PetWithExistingHand();
    return true;
  }
  if(typeof v59PetWithRealHand==="function"){
    v59PetWithRealHand();
    return true;
  }
  return false;
}

/* ---------- 7. SPARFILSKONTROLL ---------- */

function v90NormalizeState(){
  if(!state) return;

  state.needs ||= {};
  for(const key of ["hunger","energy","safety","stimulation","mood"]){
    state.needs[key]=clamp(Number(state.needs[key] ?? 70));
  }

  state.placedItems ||= [];
  state.foundItems ||= [];
  state.foods ||= [];
  state.doneQuests ||= {};
  state.stats ||= {};
  state.celebratedGrowthStages ||= {};

  v90NormalizePuzzle();
  v73EnsureState?.();
  v89EnsureCelebrations?.();

  /* En hatt ska antingen vara buren eller ligga i sanden, aldrig dubbelt. */
  if(state.wornHat?.id){
    state.foundItems=state.foundItems.filter(f=>f.id!==state.wornHat.id);
  }

  save();
}

/* ---------- 8. STARTA STABILISERINGEN ---------- */

setTimeout(()=>{
  if(!state) return;

  v90NormalizeState();
  v90ApplyGrowthVisual();
  v90StopLegacyAmbient();
  v89CleanDuplicateParty?.();

  renderNeeds();
  renderTank();
  renderQuests();
  renderBuildMenu();
},600);


/* =========================================================
   TIDVATTENPÖLEN v9.1 – FIX: X i Bygg om ska stänga dialogen
   ========================================================= */

/* Det gamla v8.8-skyddet stoppade ALLA submit-händelser i dialogen,
   även den riktiga X-knappen. Här fångar vi X först och stänger
   dialogen manuellt. */
document.addEventListener("pointerdown", e=>{
  const close = e.target.closest?.("#inventory-dialog .close-button");
  if(!close) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const dlg=$("#inventory-dialog");
  if(dlg?.open){
    try{ dlg.close("cancel"); }catch{}
  }
}, true);

/* Samma sak för vanligt click som extra säkerhet. */
document.addEventListener("click", e=>{
  const close = e.target.closest?.("#inventory-dialog .close-button");
  if(!close) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const dlg=$("#inventory-dialog");
  if(dlg?.open){
    try{ dlg.close("cancel"); }catch{}
  }
}, true);

/* Gör stängknappen tydligt till en vanlig knapp.
   Vi stänger den själva ovan, så den behöver inte submit-formuläret. */
function v91NormalizeBuildClose(){
  const close=$("#inventory-dialog .close-button");
  if(close){
    close.type="button";
    close.setAttribute("aria-label","Stäng Bygg om");
  }
}

const v91RenderBuildBase=renderBuildMenu;
renderBuildMenu=function(...args){
  const r=v91RenderBuildBase(...args);
  setTimeout(v91NormalizeBuildClose,0);
  return r;
};

setTimeout(v91NormalizeBuildClose,250);


/* =========================================================
   TIDVATTENPÖLEN v9.2 – fler besök och små händelser
   ========================================================= */

/*
  De gamla intervallen var ganska försiktiga. En bläckfiskvän kunde
  i praktiken dröja länge eftersom flera villkor + slump skulle träffa
  samtidigt. Här gör vi besöken tydligare utan att fylla akvariet.
*/

let v92LastVisitorSpawn = 0;
let v92LastAmbientSpawn = 0;
let v92LastMusselSpawn = 0;

function v92GameIsCalm(){
  if(!state || actionLocked) return false;
  if($("#game-screen")?.hidden) return false;

  const party=$("#v50-growth-party");
  if(party && !party.hidden) return false;

  return true;
}

/* Vänner/djur: ungefär var 22–35 sekund när spelet är lugnt.
   De gör fortfarande INGENTING förrän spelaren klickar på dem. */
setInterval(()=>{
  if(!v92GameIsCalm()) return;
  if(typeof v71Visitor!=="undefined" && v71Visitor) return;

  const now=Date.now();
  if(now-v92LastVisitorSpawn < 22000) return;

  /* Efter 35 sekunder blir nästa kontroll garanterad. */
  const overdue = now-v92LastVisitorSpawn >= 35000;
  if(!overdue && Math.random() > .48) return;

  v92LastVisitorSpawn=now;
  try{ v71SpawnVisitor(); }catch{}
},4000);

/* Små klickbara omgivningssaker: lite oftare än vänner.
   Bubbla, sjöstjärna, snäcka, pärla, sjöblad osv. */
setInterval(()=>{
  if(!v92GameIsCalm()) return;
  if(typeof v83Ambient!=="undefined" && v83Ambient) return;

  const now=Date.now();
  if(now-v92LastAmbientSpawn < 14000) return;

  const overdue = now-v92LastAmbientSpawn >= 24000;
  if(!overdue && Math.random() > .52) return;

  v92LastAmbientSpawn=now;
  try{ v83SpawnAmbient(); }catch{}
},3500);

/* Musslan: ska fortfarande kännas lite speciell, men inte sällsynt.
   Ungefär var 28–45 sekund när ingen annan mussla är aktiv. */
setInterval(()=>{
  if(!v92GameIsCalm()) return;
  if(typeof v68MusselBusy!=="undefined" && v68MusselBusy) return;

  const now=Date.now();
  if(now-v92LastMusselSpawn < 28000) return;

  const overdue = now-v92LastMusselSpawn >= 45000;
  if(!overdue && Math.random() > .38) return;

  v92LastMusselSpawn=now;
  try{ v68SpawnCatchableMussel({lifetime:6000}); }catch{}
},5000);

/* Vid nytt spel räknar vi från start, så första besöket kan dyka upp
   relativt snart istället för att man ska vänta flera minuter. */
setTimeout(()=>{
  const now=Date.now();
  v92LastVisitorSpawn=now-17000;
  v92LastAmbientSpawn=now-10000;
  v92LastMusselSpawn=now-22000;
},700);


/* =========================================================
   TIDVATTENPÖLEN v9.3
   Sandfynd:
   - mycket fler pusselbitar
   - klossar får gärna komma flera gånger
   - inga dubbla mynt/nycklar/tärningar/speglar m.m.
   ========================================================= */

function v93OwnedItems(){
  return [
    ...(state?.foundItems || []),
    ...(state?.jarStoredItems || [])
  ];
}

function v93HasType(type){
  return v93OwnedItems().some(x=>x.type===type);
}

function v93HasNamed(type,name){
  return v93OwnedItems().some(x=>x.type===type && x.name===name);
}

function v93WeightedPick(entries){
  const pool=[];
  for(const entry of entries){
    if(entry.allow===false) continue;

    let weight=entry.weight;

    /* Undvik att exakt samma fyndtyp kommer flera grävningar i rad.
       Pussel och klossar påverkas mindre eftersom de SKA kunna återkomma. */
    const recent=(state.v48RecentFindTypes||[]);
    if(recent.includes(entry.type)){
      const factor=(entry.type==="puzzle-piece" || entry.type==="block") ? .72 : .22;
      weight=Math.max(1,Math.round(weight*factor));
    }

    for(let i=0;i<weight;i++) pool.push(entry);
  }

  return pick(pool);
}

randomDigFind=function(){
  const entries=[];

  const add=(weight,type,make,allow=true)=>{
    entries.push({weight,type,make,allow});
  };

  /* Huvudfynden: pussel ska nu vara vanligast. */
  add(44,"puzzle-piece",
    ()=>({name:"Pusselbit",emoji:"🧩",kind:"odd",type:"puzzle-piece"}));

  add(31,"block",()=>{
    const [name,emoji]=pick(BLOCKS);
    return {name,emoji,kind:"block",type:"block"};
  });

  /* Tråd kan återkomma eftersom olika färger används i leken. */
  add(9,"thread",()=>{
    const [n,c]=pick(THREAD_COLORS);
    return {
      name:`${n[0].toUpperCase()+n.slice(1)} tråd`,
      emoji:"🧵",
      kind:"odd",
      type:"thread",
      threadColor:c
    };
  });

  /* Smycken får variera, men v43RandomJewelry försöker välja en ny sort. */
  add(7,"jewelry",()=>{
    const j=typeof v43RandomJewelry==="function"
      ? v43RandomJewelry()
      : {...pick(JEWELRY)};
    return {...j,kind:"odd",type:"jewelry"};
  });

  /* Hattar: bara en av varje modell. */
  const hats=(typeof V66_HATS!=="undefined" ? V66_HATS : []);
  const freshHats=hats.filter(h=>!v93HasNamed("hat",h.name));
  if(freshHats.length){
    add(5,"hat",()=>{
      const h={...pick(freshHats)};
      return {...h,kind:"odd",type:"hat"};
    });
  }

  /* Unika fynd – när man väl hittat dem tas de ur sandlotteriet. */
  add(3,"coin",
    ()=>({name:"Mynt",emoji:"🪙",kind:"odd",type:"coin"}),
    !v93HasType("coin"));

  add(3,"key",
    ()=>({name:"Nyckel",emoji:"🔑",kind:"odd",type:"key"}),
    !v93HasType("key"));

  add(3,"die",
    ()=>({name:"Tärning",emoji:"🎲",kind:"odd",type:"die"}),
    !v93HasType("die"));

  add(2,"mirror",
    ()=>({name:"Spegel",emoji:"🪞",kind:"odd",type:"mirror"}),
    !v93HasType("mirror"));

  add(3,"gem",
    ()=>({name:"Glittrande sten",emoji:"💎",kind:"odd",type:"gem"}),
    !v93HasType("gem"));

  add(4,"rubber-duck",
    ()=>({name:"Liten badanka",emoji:"🐤",kind:"odd",type:"rubber-duck"}),
    !v93HasType("rubber-duck"));

  add(4,"tiny-boat",
    ()=>({name:"Liten leksaksbåt",emoji:"⛵",kind:"odd",type:"tiny-boat"}),
    !v93HasType("tiny-boat"));

  add(3,"feather",
    ()=>({name:"Mjuk fjäder",emoji:"🪶",kind:"odd",type:"feather"}),
    !v93HasType("feather"));

  add(3,"tiny-crown",
    ()=>({name:"Liten krona",emoji:"👑",kind:"odd",type:"tiny-crown"}),
    !v93HasType("tiny-crown"));

  add(4,"star-toy",
    ()=>({name:"Sjöstjärneleksak",emoji:"⭐",kind:"odd",type:"star-toy"}),
    !v93HasType("star-toy"));

  add(4,"spinner",
    ()=>({name:"Snurrleksak",emoji:"🌀",kind:"odd",type:"spinner"}),
    !v93HasType("spinner"));

  add(4,"shell-toy",
    ()=>({name:"Rasselsnäcka",emoji:"🐚",kind:"odd",type:"shell-toy"}),
    !v93HasType("shell-toy"));

  const chosen=v93WeightedPick(entries);
  const result=chosen.make();

  state.v48RecentFindTypes ||= [];
  state.v48RecentFindTypes.push(chosen.type);
  state.v48RecentFindTypes=state.v48RecentFindTypes.slice(-3);
  save();

  return result;
};


/* =========================================================
   TIDVATTENPÖLEN v9.4 – MER LEVANDE BLÄCKFISKVÄN
   Vännen står fortfarande bara lugnt tills spelaren klickar.
   Efter klick får både vännen och spelarens bläckfisk röra sig mer.
   ========================================================= */

async function v94MoveFriend(el,x,y,duration=550){
  if(!el) return;
  el.style.transition=`left ${duration}ms ease, top ${duration}ms ease`;
  el.style.left=`${Math.max(8,Math.min(92,x))}%`;
  el.style.top=`${Math.max(18,Math.min(82,y))}%`;
  await delay(duration+40);
}

v83PlayWithVisitor=async function(){
  if(!v71Visitor || actionLocked)return;

  actionLocked=true;
  const v=v71Visitor;
  const el=v.el;

  if(v71VisitorTimer){
    clearTimeout(v71VisitorTimer);
    v71VisitorTimer=null;
  }

  el.classList.add("v71-active");

  const tr=$("#tank").getBoundingClientRect();
  const getPos=()=>{
    const r=el.getBoundingClientRect();
    return {
      x:((r.left+r.width/2-tr.left)/tr.width)*100,
      y:((r.top+r.height/2-tr.top)/tr.height)*100
    };
  };

  let p=getPos();
  moveOcto(Math.max(9,p.x-10),Math.max(20,p.y),.62,700);
  await delay(760);

  if(v.type==="friend"){
    story(`${state.name} simmar fram till sin bläckfiskkompis.`);
    thought("💗");
    await delay(400);

    const games=["dance","chase","spin","peek","circle"];
    const g=pick(games);

    if(g==="dance"){
      story("De börjar dansa tillsammans!");
      $("#octopus")?.classList.add("v58-dancing");
      el.classList.add("v94-friend-dance");

      for(let i=0;i<4;i++){
        p=getPos();
        moveOcto(
          Math.max(12,Math.min(88,p.x + (i%2 ? 10 : -10))),
          Math.max(24,Math.min(76,p.y + (i%2 ? -5 : 5))),
          .58,
          420
        );
        await v94MoveFriend(
          el,
          p.x + (i%2 ? -7 : 7),
          p.y + (i%2 ? 5 : -5),
          420
        );
      }

      $("#octopus")?.classList.remove("v58-dancing");
      el.classList.remove("v94-friend-dance");

    }else if(g==="chase"){
      story("De jagar varandra runt i akvariet!");
      const path=[
        [28,42],[55,32],[75,52],[58,67],[34,62]
      ];

      for(const [x,y] of path){
        await v94MoveFriend(el,x,y,430);
        moveOcto(Math.max(10,x-9),Math.max(20,y+3),.56,430);
        await delay(300);
      }

    }else if(g==="spin"){
      story("Kompisen gör en tokig snurr och de dansar efteråt.");
      el.classList.add("v94-friend-spin");
      $("#octopus")?.classList.add("v58-dancing");
      await delay(1500);
      el.classList.remove("v94-friend-spin");
      el.classList.add("v94-friend-dance");
      await delay(1200);
      el.classList.remove("v94-friend-dance");
      $("#octopus")?.classList.remove("v58-dancing");

    }else if(g==="peek"){
      story("De leker tittut och hoppar fram på varsin sida.");
      for(let i=0;i<3;i++){
        el.style.opacity=".18";
        await delay(350);
        p=getPos();
        await v94MoveFriend(el,p.x+(i%2?12:-12),p.y,320);
        el.style.opacity="1";
        thought("😄");
        await delay(500);
      }

    }else{
      story("De simmar runt varandra i små cirklar.");
      const center=getPos();
      const pts=[
        [center.x+10,center.y],
        [center.x,center.y+8],
        [center.x-10,center.y],
        [center.x,center.y-8]
      ];

      for(const [x,y] of pts){
        await v94MoveFriend(el,x,y,390);
        moveOcto(
          Math.max(10,center.x-(x-center.x)),
          Math.max(20,center.y-(y-center.y)),
          .55,
          390
        );
        await delay(250);
      }
    }

    state.needs.mood=clamp((state.needs.mood||0)+11);
    state.needs.stimulation=clamp((state.needs.stimulation||0)+13);

  }else{
    /* Övriga djur behåller sina egna reaktioner. */
    p=getPos();

    if(v.type==="fish"){
      story(`${state.name} simmar nyfiket efter fisken.`);
      await v94MoveFriend(el,p.x+12,p.y-5,500);
      moveOcto(p.x+5,p.y-4,.58,650);
      await delay(650);
    }else if(v.type==="crab"){
      story(`${state.name} petar försiktigt på krabban och backar snabbt.`);
      thought("🦀");
      moveOcto(p.x-7,p.y,.52,420);
      await delay(450);
      moveOcto(p.x-15,p.y-4,.58,420);
      await delay(500);
    }else if(v.type==="shrimp"){
      story(`${state.name} följer räkan när den skuttar iväg.`);
      await v94MoveFriend(el,p.x+10,p.y-7,430);
      moveOcto(p.x+4,p.y-3,.55,480);
      await delay(500);
    }

    state.needs.stimulation=clamp((state.needs.stimulation||0)+9);
  }

  renderNeeds();
  save();

  el.style.transition="opacity .45s ease, transform .45s ease";
  el.style.opacity="0";
  await delay(470);

  v71RemoveVisitor();
  actionLocked=false;
};

/* Säkerställ att visitor-klicket använder den uppdaterade leken. */
document.addEventListener("pointerdown",e=>{
  const el=e.target.closest?.(".v71-visitor");
  if(!el) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  v83PlayWithVisitor();
},true);
