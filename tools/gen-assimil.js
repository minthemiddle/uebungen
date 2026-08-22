#!/usr/bin/env node
"use strict";
/**
 * Generator für die große Assimil-Übungseinheit (Lektionen 1–45).
 * Liest die Item-Gruppen aus in/002-assimil-1-45/g*.json und baut daraus
 * eine selbstständige Single-File-HTML-Datei nach public/002-assimil-1-45.html
 * plus aktualisierte Übersicht public/index.html.
 *
 * Nutzung: node tools/gen-assimil.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT, "in", "002-assimil-1-45");
const PUBLIC = path.join(ROOT, "public");

const DATE = "22.08.2026";
const OUT_FILE = "002-assimil-1-45.html";
const STORE_KEY = "uebung.002-assimil-1-45.v1";
const TITLE = "Assimil Italienisch · Lektionen 1–45";
const SUBTITLE = "Italienisch · __TOTAL__ Lückentext-Sätze · Vokabeln und Grammatik des Grundkurses, gemischt";
const HINT = "Das fehlende Wort einsetzen: Tippen und mit Enter bestätigen – Regel, Übersetzung und Erklärung erscheinen erst danach. Alle gültigen Formen werden akzeptiert (z. B. tra/fra, un' / una).";

/* ------------------------------------------------------------------ */
/* Engine-Vorlage (aktueller Skill-Stand)                             */
/* ------------------------------------------------------------------ */
const TEMPLATE = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>__TITLE__ – Italienisch Übung</title>
<meta name="description" content="__META__">
<style>
  :root{
    --bg:#f4f6f8; --card:#ffffff; --border:#e2e6ea;
    --text:#1f2937; --muted:#6b7280;
    --accent:#2563eb; --accent-soft:#dbeafe;
    --ok:#16a34a; --ok-soft:#dcfce7;
    --bad:#dc2626; --bad-soft:#fee2e2;
    --seen:#0891b2; --seen-soft:#cffafe;
  }
  *{box-sizing:border-box}
  body{
    margin:0; font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
    background:var(--bg); color:var(--text); line-height:1.55;
  }
  .wrap{max-width:880px; margin:0 auto; padding:20px 16px 60px}

  .page-head{margin-bottom:12px}
  .page-head h1{font-size:1.7rem; margin:0 0 4px}
  .sub{color:var(--muted); margin:0 0 3px}
  .hint{color:var(--muted); font-size:.85rem; margin:4px 0 0}

  .result{
    background:var(--card); border:1px solid var(--border); border-radius:12px;
    padding:10px 14px; margin-bottom:10px; box-shadow:0 1px 2px rgba(16,24,40,.05);
  }
  .result-text{font-weight:600; font-size:.92rem; margin-bottom:8px}
  .progress{height:9px; background:#e5e7eb; border-radius:999px; overflow:hidden; position:relative}
  .progress .bar{position:absolute; top:0; left:0; bottom:0; border-radius:999px; transition:width .35s ease}
  .progress .bar.answered{background:var(--accent)}
  .progress .bar.correct{background:var(--ok); z-index:1}

  .toolbar{display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px}
  .row-label{
    align-self:center; font-size:.72rem; font-weight:700; text-transform:uppercase;
    letter-spacing:.05em; color:var(--muted); margin-right:2px;
  }
  .btn{
    font:inherit; font-size:.78rem; font-weight:600; padding:4px 10px; border-radius:7px;
    border:1px solid var(--border); background:#fff; color:var(--text); cursor:pointer;
    transition:background .15s ease;
  }
  .btn:hover{background:#eef1f4}
  .btn:disabled{opacity:.45; cursor:default}
  .btn:disabled:hover{background:#fff}
  .btn.primary{background:var(--accent); border-color:var(--accent); color:#fff}
  .btn.primary:hover{background:#1d4ed8}
  .btn.ok{border-color:#bbf7d0; color:var(--ok)}
  .btn.ok.active{background:var(--ok); border-color:var(--ok); color:#fff}
  .btn.no{border-color:#fecaca; color:var(--bad)}
  .btn.no.active{background:var(--bad); border-color:var(--bad); color:#fff}
  .btn.view.active{background:var(--accent); border-color:var(--accent); color:#fff}

  .card{
    background:var(--card); border:1px solid var(--border); border-radius:12px;
    padding:8px 12px; margin-bottom:6px; box-shadow:0 1px 2px rgba(16,24,40,.05);
    display:grid; grid-template-columns:minmax(0,1fr) auto;
    grid-template-areas:"head actions" "satz actions" "fun actions";
    column-gap:12px;
  }
  .card-head{grid-area:head; display:flex; align-items:center; gap:6px}
  .chip{
    display:inline-block; font-size:.68rem; font-weight:700; text-transform:uppercase;
    letter-spacing:.05em; padding:2px 8px; border-radius:999px;
    background:#eef1f4; color:var(--muted);
  }
  .chip.ok{background:var(--ok-soft); color:var(--ok)}
  .chip.bad{background:var(--bad-soft); color:var(--bad)}
  .chip.seen{background:var(--seen-soft); color:var(--seen)}

  .satz{grid-area:satz; font-size:1.05rem; margin:3px 0 2px}
  .gap-input{
    font:inherit; border:none; border-bottom:2px dashed var(--accent);
    background:var(--accent-soft); border-radius:5px 5px 0 0; padding:1px 6px;
    min-width:3ch; color:var(--text); text-align:center; vertical-align:baseline;
  }
  .gap-input:focus{outline:2px solid var(--accent); outline-offset:1px}
  .gap-answer{
    display:inline-block; min-width:3ch; padding:1px 9px; border-radius:6px;
    font-weight:700; text-align:center;
  }
  .gap-answer.correct{background:var(--ok-soft); color:var(--ok); border-bottom:2px solid var(--ok)}
  .gap-answer.wrong{background:var(--bad-soft); color:var(--bad); border-bottom:2px solid var(--bad)}
  .gap-answer.revealed{background:var(--seen-soft); color:var(--seen); border-bottom:2px solid var(--seen)}

  .fun{grid-area:fun; font-size:.8rem; color:var(--muted); margin:0 0 4px}
  .fun .de{color:#374151}
  .fun p{margin:2px 0}

  .card-actions{grid-area:actions; align-self:center; justify-self:end; display:flex; flex-wrap:nowrap; gap:6px}

  .card.flash{outline:3px solid var(--accent); outline-offset:1px; transition:outline .3s ease}

  .empty{
    background:var(--card); border:1px dashed var(--border); border-radius:12px;
    padding:18px 16px; text-align:center; color:var(--muted); font-size:.9rem;
  }

  @media (max-width:600px){
    .card{display:block}
    .card-actions{flex-wrap:wrap; justify-content:flex-start; margin-top:6px}
  }

  .foot{margin-top:22px; text-align:center; color:var(--muted); font-size:.85rem}
  .foot a{color:var(--accent); text-decoration:none}
  .foot a:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="wrap">

  <header class="page-head">
    <h1>__TITLE__</h1>
    <p class="sub">__SUBTITLE__</p>
    <p class="hint">__HINT__</p>
  </header>

  <section class="result" aria-live="polite">
    <div class="result-text" id="resultText">0 von __TOTAL__ beantwortet (0 %) · davon – % richtig</div>
    <div class="progress" aria-hidden="true">
      <div class="bar answered" id="progAnswered" style="width:0%"></div>
      <div class="bar correct" id="progCorrect" style="width:0%"></div>
    </div>
  </section>

  <nav class="toolbar" aria-label="Aktionen">
    <button class="btn primary" id="btnShuffle">🔀 Unbeantwortete mischen</button>
    <button class="btn" id="btnNextOpen">↘ Gehe zu Unbeantworteten</button>
    <button class="btn" id="btnRevealAll">👁 Alle aufdecken</button>
    <button class="btn" id="btnReset">↺ Zurücksetzen</button>
  </nav>

  <nav class="toolbar" aria-label="Filter">
    <span class="row-label">Filter</span>
    <button class="btn view" data-filter="all">Alle</button>
    <button class="btn view" data-filter="open">Unbeantwortete</button>
    <button class="btn view" data-filter="wrong">Falsche</button>
    <button class="btn view" data-filter="right">Richtige</button>
  </nav>

  <nav class="toolbar" aria-label="Sortierung">
    <span class="row-label">Sortierung</span>
    <button class="btn view" data-sort="std">Standard</button>
    <button class="btn view" data-sort="open">Unbeantwortete zuerst</button>
    <button class="btn view" data-sort="wrong">Falsche zuerst</button>
    <button class="btn view" data-sort="right">Richtige zuerst</button>
  </nav>

  <main id="list"></main>

  <footer class="foot">
    <a href="index.html">← Zur Übersicht</a>
  </footer>
</div>

<script>
"use strict";

const DATA = __DATA__;
const RULES = DATA.rules;
const ITEMS = DATA.items;
const BY_ID = {};
ITEMS.forEach(function(t){ BY_ID[t.id] = t; });

const TOTAL = ITEMS.length;
const STORE_KEY = "__STORE_KEY__";

/* ---------- State (Status + Ansicht in einem Speicher) ---------- */
let store = loadStore();
if(!store.items) store.items = {};
if(!store.view) store.view = { filter:"all", sort:"std" };

let baseOrder = ITEMS.map(function(t){ return t.id; });   /* Originalreihenfolge, deterministisch */

function loadStore(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : { items:{}, view:{ filter:"all", sort:"std" } };
  }catch(e){ return { items:{}, view:{ filter:"all", sort:"std" } }; }
}
function save(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(store)); }catch(e){}
}
function getState(id){
  if(!store.items[id]) store.items[id] = { revealed:false, graded:false, correct:false };
  return store.items[id];
}

/* ---------- Helfer ---------- */
function el(tag, cls, text){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(text !== undefined) n.textContent = text;
  return n;
}

/* Tolerante Normalisierung: Groß/Klein, Apostrophvarianten, Akzentvarianten
   (é/è, ó/ò …) und die Schreibweise "e'" für "è". */
function norm(s){
  let v = (s || "").toLowerCase().trim().replace(/\\s+/g, " ");
  v = v.replace(/[\\u2018\\u2019\\u02bc\\u0060´']/g, "'");
  v = v.replace(/\\u00e1/g,"\\u00e0").replace(/\\u00e9/g,"\\u00e8")
       .replace(/\\u00ed/g,"\\u00ec").replace(/\\u00f3/g,"\\u00f2").replace(/\\u00fa/g,"\\u00f9");
  v = v.replace(/\\b([eaoui])'(?![a-z])/g, function(m, c){
    return { e:"\\u00e8", a:"\\u00e0", o:"\\u00f2", u:"\\u00f9", i:"\\u00ec" }[c];
  });
  return v;
}

/* ---------- Ansicht: Filter + Sortierung (nur Ansicht, keine Mutation) ---------- */
function matchesFilter(id, f){
  const s = store.items[id];
  if(f === "open")   return !s || !s.graded;
  if(f === "wrong")  return !!s && !!s.graded && !s.correct;
  if(f === "right")  return !!s && !!s.graded && !!s.correct;
  return true;
}
function viewOrder(){
  const f = store.view.filter;
  const sort = store.view.sort;
  let ids = baseOrder.filter(function(id){ return matchesFilter(id, f); });
  if(sort !== "std"){
    const prio = ids.filter(function(id){ return matchesFilter(id, sort); });
    const rest = ids.filter(function(id){ return !matchesFilter(id, sort); });
    ids = prio.concat(rest);
  }
  return ids;
}
function countGroup(f){
  return baseOrder.filter(function(id){ return matchesFilter(id, f); }).length;
}

/* ---------- Rendern ---------- */
function render(){
  const docScroll = window.scrollY;
  const list = document.getElementById("list");
  list.textContent = "";
  const ids = viewOrder();
  if(ids.length === 0){
    list.appendChild(el("p", "empty", "Keine Karten in dieser Ansicht."));
  }else{
    const frag = document.createDocumentFragment();
    ids.forEach(function(id){ frag.appendChild(card(id)); });
    list.appendChild(frag);
  }
  updateResult();
  updateToolbar();
  window.scrollTo(0, docScroll);
}

function chip(kl, txt){ return el("span", "chip " + kl, txt); }

function card(id){
  const item = BY_ID[id];
  const s = getState(id);

  const c = el("article", "card");
  c.dataset.id = id;

  const head = el("header", "card-head");
  if(s.graded && s.correct)      head.appendChild(chip("ok",   "✓ richtig"));
  else if(s.graded)              head.appendChild(chip("bad",  "✗ falsch"));
  else if(s.revealed)            head.appendChild(chip("seen", "◌ aufgedeckt"));
  else                           head.appendChild(chip("",     "◦ unbeantwortet"));
  c.appendChild(head);

  const satz = el("p", "satz");
  if(item.pre) satz.appendChild(document.createTextNode(item.pre));
  satz.appendChild(renderGap(item, s));
  if(item.post) satz.appendChild(document.createTextNode(item.post));
  c.appendChild(satz);

  if(s.graded || s.revealed){
    const fun = el("div", "fun");
    const r = el("p", null, "Regel: " + RULES[item.r]);
    fun.appendChild(r);
    if(item.tr){
      const tr = el("p", "de", "🇩🇪 " + item.tr);
      fun.appendChild(tr);
    }
    if(item.expl){
      const ex = el("p", "de", "💡 " + item.expl);
      fun.appendChild(ex);
    }
    c.appendChild(fun);
  }

  const foot = el("footer", "card-actions");
  if(!s.graded){
    const bR = el("button", "btn", "Aufdecken");
    bR.setAttribute("type","button");
    bR.addEventListener("click", function(){ toggleReveal(item.id); });
    foot.appendChild(bR);
  }
  const bOk = el("button", "btn ok" + (s.graded && s.correct ? " active" : ""), "✓ Richtig");
  bOk.setAttribute("type","button");
  bOk.addEventListener("click", function(){ grade(item.id, true); });

  const bNo = el("button", "btn no" + (s.graded && !s.correct ? " active" : ""), "✗ Falsch");
  bNo.setAttribute("type","button");
  bNo.addEventListener("click", function(){ grade(item.id, false); });

  foot.appendChild(bOk);
  foot.appendChild(bNo);
  c.appendChild(foot);

  return c;
}

function renderGap(item, s){
  const wrap = el("span", "gap-wrap");

  if(s.graded){
    wrap.appendChild(el("span", "gap-answer " + (s.correct ? "correct" : "wrong"), item.disp));
    return wrap;
  }
  if(s.revealed){
    wrap.appendChild(el("span", "gap-answer revealed", item.disp));
    return wrap;
  }
  const input = document.createElement("input");
  input.type = "text";
  input.className = "gap-input";
  input.placeholder = "…";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-label", "Antwort eintragen");
  const w = item.ans.concat([item.disp]).reduce(function(m,a){ return Math.max(m, a.length); }, 0) + 1;
  input.style.width = Math.max(5, w) + "ch";
  input.addEventListener("keydown", function(e){
    if(e.key === "Enter"){ e.preventDefault(); gradeFromInput(item, input); }
  });
  input.addEventListener("blur", function(){ gradeFromInput(item, input); });
  wrap.appendChild(input);
  return wrap;
}

/* ---------- Aktionen ---------- */
function gradeFromInput(item, input){
  const val = norm(input.value);
  if(!val) return;
  const hit = item.ans.some(function(a){ return norm(a) === val; });
  grade(item.id, hit);
}

function grade(id, correct){
  const s = getState(id);
  s.graded = true;
  s.correct = !!correct;
  s.revealed = true;
  save();
  render();
}

function toggleReveal(id){
  const s = getState(id);
  s.revealed = !s.revealed;
  save();
  render();
}

function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

/* Mischt ausschließlich noch nicht bewertete Lücken neu;
   beantwortete Karten bleiben an ihrem Platz. */
document.getElementById("btnShuffle").addEventListener("click", function(){
  const openIds = baseOrder.filter(function(id){ return !getState(id).graded; });
  const mixed = shuffle(openIds);
  let k = 0;
  baseOrder = baseOrder.map(function(id){
    return getState(id).graded ? id : mixed[k++];
  });
  render();
});

/* Springt zur ersten unbewerteten Lücke der aktuellen Ansicht. */
document.getElementById("btnNextOpen").addEventListener("click", function(){
  let ids = viewOrder().filter(function(id){ return !getState(id).graded; });
  if(ids.length === 0){
    if(store.view.filter !== "all"){
      store.view.filter = "all";
      save();
      render();
      ids = viewOrder().filter(function(id){ return !getState(id).graded; });
    }
    if(ids.length === 0) return;
  }
  const first = document.querySelector('.card[data-id="' + ids[0] + '"]');
  if(!first) return;
  first.scrollIntoView({ behavior:"smooth", block:"center" });
  first.classList.add("flash");
  setTimeout(function(){ first.classList.remove("flash"); }, 1200);
  const input = first.querySelector(".gap-input");
  if(input) input.focus();
});

/* Alle aufdecken / alle zudecken (nur noch nicht bewertete Lücken). */
document.getElementById("btnRevealAll").addEventListener("click", function(){
  const open = baseOrder.filter(function(id){ return !getState(id).graded; });
  if(open.length === 0) return;
  const anyHidden = open.some(function(id){ return !getState(id).revealed; });
  open.forEach(function(id){ getState(id).revealed = anyHidden; });
  save();
  render();
});

document.getElementById("btnReset").addEventListener("click", function(){
  if(confirm("Status und Ergebnis dieser Übung wirklich zurücksetzen?")){
    store = { items:{}, view:{ filter:"all", sort:"std" } };
    baseOrder = ITEMS.map(function(t){ return t.id; });
    localStorage.removeItem(STORE_KEY);
    render();
  }
});

/* Filter + Sortierung als reine Ansichten, Auswahl bleibt gespeichert. */
document.querySelectorAll("[data-filter]").forEach(function(btn){
  btn.addEventListener("click", function(){
    store.view.filter = btn.dataset.filter;
    save();
    render();
  });
});
document.querySelectorAll("[data-sort]").forEach(function(btn){
  btn.addEventListener("click", function(){
    store.view.sort = btn.dataset.sort;
    save();
    render();
  });
});

function updateToolbar(){
  document.querySelectorAll("[data-filter]").forEach(function(btn){
    const f = btn.dataset.filter;
    btn.classList.toggle("active", store.view.filter === f);
    let label = { all:"Alle", open:"Unbeantwortete", wrong:"Falsche", right:"Richtige" }[f];
    btn.textContent = label + " (" + countGroup(f) + ")";
  });
  document.querySelectorAll("[data-sort]").forEach(function(btn){
    btn.classList.toggle("active", store.view.sort === btn.dataset.sort);
  });
  const answered = countGroup("wrong") + countGroup("right");
  document.getElementById("btnNextOpen").disabled = answered === TOTAL;
  const open = baseOrder.filter(function(id){ return !getState(id).graded; });
  const anyHidden = open.some(function(id){ return !getState(id).revealed; });
  document.getElementById("btnRevealAll").textContent = anyHidden ? "👁 Alle aufdecken" : "🙈 Alle zudecken";
}

function updateResult(){
  let graded = 0, correct = 0;
  ITEMS.forEach(function(t){
    const s = store.items[t.id];
    if(!s) return;
    if(s.graded) graded++;
    if(s.graded && s.correct) correct++;
  });
  const pAns = TOTAL ? Math.round(graded / TOTAL * 100) : 0;
  const pCor = graded ? Math.round(correct / graded * 100) : 0;
  document.getElementById("resultText").textContent =
    graded + " von " + TOTAL + " beantwortet (" + pAns + " %) · davon " +
    correct + " richtig (" + pCor + " %)";
  document.getElementById("progAnswered").style.width = pAns + "%";
  document.getElementById("progCorrect").style.width = (TOTAL ? Math.round(correct / TOTAL * 100) : 0) + "%";
}

/* ---------- Start: deterministische Originalreihenfolge ---------- */
render();
</script>
</body>
</html>`;

/* ------------------------------------------------------------------ */
/* Daten laden, normalisieren, validieren, mergen                      */
/* ------------------------------------------------------------------ */

const APOSTROPHE_VARIANTS = /[\u2018\u2019\u02bc`´']/g;
function fixApos(s){ return String(s).replace(APOSTROPHE_VARIANTS, "\u2019"); }

function loadGroups(){
  const groups = [];
  fs.readdirSync(SRC_DIR)
    .filter(f => /^g\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10))
    .forEach(f => groups.push(JSON.parse(fs.readFileSync(path.join(SRC_DIR, f), "utf8"))));
  const partsDir = path.join(SRC_DIR, "parts");
  if(fs.existsSync(partsDir)){
    fs.readdirSync(partsDir)
      .filter(f => /^l\d{2}\.json$/.test(f))
      .sort()
      .forEach(f => groups.push(JSON.parse(fs.readFileSync(path.join(partsDir, f), "utf8"))));
  }
  if(groups.length === 0) throw new Error("keine Quelldaten in " + SRC_DIR);
  return groups;
}

function buildData(){
  const rules = {};
  const items = [];

  loadGroups().forEach(function(group){
    Object.keys(group.rules || {}).forEach(function(k){
      if(rules[k]) throw new Error("Doppelte Regel: " + k);
      rules[k] = String(group.rules[k]).trim();
    });
    (group.items || []).forEach(function(it){
      items.push({
        id: String(it.id),
        r: String(it.r),
        pre: fixApos(it.pre || ""),
        disp: fixApos(it.disp),
        ans: (it.ans || []).map(fixApos),
        post: fixApos(it.post || ""),
        tr: String(it.tr || "").trim(),
        expl: String(it.expl || "").trim()
      });
    });
  });

  return { rules: rules, items: items };
}

function validate(data){
  const errors = [];
  const seenIds = new Set();
  const seenSentences = new Map();

  Object.keys(data.rules).forEach(function(k){
    if(!data.rules[k]) errors.push("Leere Regel: " + k);
    if(/lezione|assimil|kapitel|seite/i.test(data.rules[k])) errors.push("Buchreferenz in Regel " + k);
  });

  data.items.forEach(function(it){
    const p = it.id;
    if(seenIds.has(p)) errors.push("Doppelte ID: " + p);
    seenIds.add(p);
    if(!/^l\d{2}n\d{2}$/.test(p)) errors.push("ID-Schema falsch: " + p);
    if(!data.rules[it.r]) errors.push(p + ": unbekannte Regel " + it.r);
    if(!it.disp) errors.push(p + ": disp fehlt");
    if(it.ans.length === 0) errors.push(p + ": ans leer");
    if(!it.pre && !it.post) errors.push(p + ": weder pre noch post");
    if(it.ans.indexOf(it.disp) === -1) errors.push(p + ": disp nicht in ans");
    if(!it.tr) errors.push(p + ": tr fehlt");
    if(!it.expl) errors.push(p + ": expl fehlt");
    if(/assimil|lezione \d|kapitel \d|seite \d/i.test((it.pre + " " + it.post + " " + it.tr + " " + it.expl))) errors.push(p + ": Buchreferenz im Text");
    const sentence = normDeep(it.pre + "\u0001" + it.disp + "\u0001" + it.post);
    if(seenSentences.has(sentence)) errors.push(p + ": Duplikat von " + seenSentences.get(sentence));
    seenSentences.set(sentence, p);
  });

  return errors;
}
function normDeep(s){
  return s.toLowerCase().replace(APOSTROPHE_VARIANTS, "'").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/* ------------------------------------------------------------------ */
/* HTML + Übersicht                                                    */
/* ------------------------------------------------------------------ */

function buildHtml(data){
  const total = data.items.length;
  const meta = "Italienisch-Übung (Lückentext): Vokabeln und Grammatik nach Assimil „Italian With Ease“, Lektionen 1–45. " +
    total + " eigene Übungssätze. Erstellt am " + DATE + ". Tags: italienisch, assimil, vokabeln, grammatik, lückentext";
  return TEMPLATE
    .split("__TITLE__").join(TITLE)
    .split("__META__").join(meta)
    .split("__SUBTITLE__").join(SUBTITLE.split("__TOTAL__").join(String(total)))
    .split("__HINT__").join(HINT)
    .split("__TOTAL__").join(String(total))
    .split("__STORE_KEY__").join(STORE_KEY)
    .split("__DATA__").join(JSON.stringify(data));
}

function buildIndex(){
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Italienisch-Übungen – Übersicht</title>
<meta name="description" content="Übersicht aller Italienisch-Übungen (Lückentext). Erstellt am ${DATE}. Tags: italienisch, grammatik, übungen, lückentext">
<style>
  :root{
    --bg:#f4f6f8; --card:#ffffff; --border:#e2e6ea;
    --text:#1f2937; --muted:#6b7280; --accent:#2563eb;
  }
  *{box-sizing:border-box}
  body{
    margin:0; font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
    background:var(--bg); color:var(--text); line-height:1.55;
  }
  .wrap{max-width:920px; margin:0 auto; padding:40px 20px 80px}
  h1{font-size:1.9rem; margin:0 0 6px}
  .sub{color:var(--muted); margin:0 0 24px}
  table{
    width:100%; border-collapse:collapse; background:var(--card);
    border:1px solid var(--border); border-radius:12px; overflow:hidden;
    box-shadow:0 1px 2px rgba(16,24,40,.05);
  }
  th, td{text-align:left; padding:12px 16px; border-bottom:1px solid var(--border); vertical-align:top}
  th{background:#eef1f4; font-size:.8rem; text-transform:uppercase; letter-spacing:.05em; color:var(--muted)}
  tr:last-child td{border-bottom:none}
  td.nr{font-variant-numeric:tabular-nums; color:var(--muted); white-space:nowrap}
  td.tags{font-size:.85rem; color:var(--muted)}
  a{color:var(--accent); text-decoration:none; font-weight:600}
  a:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="wrap">
  <h1>Italienisch-Übungen</h1>
  <p class="sub">Übersicht aller Lückentext-Übungen</p>

  <table>
    <thead>
      <tr>
        <th>Nr.</th>
        <th>Titel</th>
        <th>Erstellt</th>
        <th>Tags</th>
        <th>Link</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="nr">001</td>
        <td>Präpositionen</td>
        <td>${DATE}</td>
        <td class="tags">italienisch, grammatik, präpositionen, lückentext</td>
        <td><a href="001-preposizione.html">Öffnen</a></td>
      </tr>
      <tr>
        <td class="nr">002</td>
        <td>Assimil Italienisch · Lektionen 1–45</td>
        <td>${DATE}</td>
        <td class="tags">italienisch, assimil, vokabeln, grammatik, lückentext</td>
        <td><a href="002-assimil-1-45.html">Öffnen</a></td>
      </tr>
    </tbody>
  </table>
</div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* Run                                                                 */
/* ------------------------------------------------------------------ */

const data = buildData();
const errors = validate(data);

/* Item-Anzahl je Lektion prüfen (Soll: 10 je Lektion 1–45) */
const perLesson = {};
data.items.forEach(function(it){
  const l = it.id.slice(0, 3);
  perLesson[l] = (perLesson[l] || 0) + 1;
});
for(let i = 1; i <= 45; i++){
  const k = "l" + String(i).padStart(2, "0");
  if((perLesson[k] || 0) !== 10) errors.push("Lektion " + i + ": " + (perLesson[k] || 0) + " Items (Soll 10)");
}

if(errors.length){
  console.error("VALIDIERUNG FEHLGESCHLAGEN (" + errors.length + "):");
  errors.forEach(e => console.error("  - " + e));
  process.exit(1);
}

fs.mkdirSync(PUBLIC, { recursive: true });
fs.writeFileSync(path.join(PUBLIC, OUT_FILE), buildHtml(data));
fs.writeFileSync(path.join(PUBLIC, "index.html"), buildIndex());

const ruleCount = Object.keys(data.rules).length;
console.log("geschrieben: " + OUT_FILE + "  (" + data.items.length + " Sätze, " + ruleCount + " Regeln)");
console.log("Fertig.");
