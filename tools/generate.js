#!/usr/bin/env node
"use strict";
/**
 * Generator für die Übungs-HTLMs (Lückentext).
 * Liest die Theme-Daten unten und schreibt selbstständige HTML-Dateien nach public/.
 * Nutzung: node tools/generate.js
 */
const fs = require("fs");
const path = require("path");

const PUBLIC = path.join(__dirname, "..", "public");

/* ------------------------------------------------------------------ */
/* Engine-Vorlage (identisch für alle Übungen)                        */
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
  .wrap{max-width:880px; margin:0 auto; padding:32px 20px 80px}

  .page-head{margin-bottom:18px}
  .page-head h1{font-size:1.9rem; margin:0 0 6px}
  .sub{color:var(--muted); margin:0 0 4px}
  .hint{color:var(--muted); font-size:.88rem; margin:6px 0 0}

  .result{
    background:var(--card); border:1px solid var(--border); border-radius:12px;
    padding:14px 18px; margin-bottom:16px; box-shadow:0 1px 2px rgba(16,24,40,.05);
  }
  .result-text{font-weight:600; margin-bottom:10px}
  .progress{height:10px; background:#e5e7eb; border-radius:999px; overflow:hidden; position:relative}
  .progress .bar{position:absolute; top:0; left:0; bottom:0; border-radius:999px; transition:width .35s ease}
  .progress .bar.answered{background:var(--accent)}
  .progress .bar.correct{background:var(--ok); z-index:1}

  .toolbar{display:flex; flex-wrap:wrap; gap:8px; margin-bottom:22px}
  .btn{
    font:inherit; font-size:.8rem; font-weight:600; padding:5px 10px; border-radius:7px;
    border:1px solid var(--border); background:#fff; color:var(--text); cursor:pointer;
    transition:background .15s ease;
  }
  .btn:hover{background:#eef1f4}
  .btn.primary{background:var(--accent); border-color:var(--accent); color:#fff}
  .btn.primary:hover{background:#1d4ed8}
  .btn.ok{border-color:#bbf7d0; color:var(--ok)}
  .btn.ok.active{background:var(--ok); border-color:var(--ok); color:#fff}
  .btn.no{border-color:#fecaca; color:var(--bad)}
  .btn.no.active{background:var(--bad); border-color:var(--bad); color:#fff}

  .card{
    background:var(--card); border:1px solid var(--border); border-radius:12px;
    padding:10px 14px; margin-bottom:8px; box-shadow:0 1px 2px rgba(16,24,40,.05);
    display:grid; grid-template-columns:minmax(0,1fr) auto;
    grid-template-areas:"head actions" "satz actions" "fun actions";
    column-gap:12px;
  }
  .card-head{grid-area:head; display:flex; align-items:center; gap:6px; margin-bottom:0}
  .chip{
    display:inline-block; font-size:.7rem; font-weight:700; text-transform:uppercase;
    letter-spacing:.05em; padding:3px 9px; border-radius:999px;
    background:#eef1f4; color:var(--muted);
  }
  .chip.ok{background:var(--ok-soft); color:var(--ok)}
  .chip.bad{background:var(--bad-soft); color:var(--bad)}
  .chip.seen{background:var(--seen-soft); color:var(--seen)}

  .satz{grid-area:satz; font-size:1.08rem; margin:4px 0 3px}
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

  .fun{grid-area:fun; font-size:.82rem; color:var(--muted); font-style:italic; margin:0 0 6px}

  .card-actions{grid-area:actions; align-self:center; justify-self:end; display:flex; flex-wrap:nowrap; gap:6px}

  @media (max-width:600px){
    .card{display:block}
    .card-actions{flex-wrap:wrap}
  }

  .foot{margin-top:28px; text-align:center; color:var(--muted); font-size:.85rem}
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
    <div class="result-text" id="resultText">0 von __TOTAL__ beantwortet · davon – % richtig</div>
    <div class="progress" aria-hidden="true">
      <div class="bar answered" id="progAnswered" style="width:0%"></div>
      <div class="bar correct" id="progCorrect" style="width:0%"></div>
    </div>
  </section>

  <nav class="toolbar">
    <button class="btn primary" id="btnShuffle">🔀 Zufällige Reihenfolge</button>
    <button class="btn" id="btnRevealAll">👁 Alle aufdecken</button>
    <button class="btn" id="btnReset">↺ Zurücksetzen</button>
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

const TOTAL = ITEMS.length;
const STORE_KEY = "__STORE_KEY__";

/* ---------- State ---------- */
let state = loadState();
function freshOrder(){ return shuffle(ITEMS.map(function(t){ return t.id; })); }
let order = freshOrder();

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}
function saveState(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }catch(e){}
}
function getState(id){
  if(!state[id]) state[id] = { revealed:false, graded:false, correct:false };
  return state[id];
}

/* ---------- Helfer ---------- */
function el(tag, cls, text){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(text !== undefined) n.textContent = text;
  return n;
}
function norm(s){
  return (s || "").toLowerCase().trim().replace(/[\\u2018\\u2019]/g, "'");
}

/* ---------- Rendern ---------- */
function render(){
  const list = document.getElementById("list");
  list.textContent = "";
  order.forEach(function(id){ list.appendChild(card(id)); });
  updateResult();
}

function chip(kl, txt){ return el("span", "chip " + kl, txt); }

function card(id){
  const item = ITEMS.find(function(t){ return t.id === id; });
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
    c.appendChild(el("p", "fun", "Regel: " + RULES[item.r]));
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
  input.setAttribute("aria-label", "Präposition eintragen");
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
  grade(item.id, item.ans.indexOf(val) !== -1);
}

function grade(id, correct){
  const s = getState(id);
  s.graded = true;
  s.correct = !!correct;
  s.revealed = true;
  saveState();
  render();
}

function toggleReveal(id){
  const s = getState(id);
  s.revealed = !s.revealed;
  saveState();
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

function updateResult(){
  let graded = 0, correct = 0, revealed = 0;
  ITEMS.forEach(function(t){
    const s = state[t.id];
    if(!s) return;
    if(s.graded) graded++;
    if(s.graded && s.correct) correct++;
    if(s.revealed) revealed++;
  });
  const pAns = TOTAL ? Math.round(graded / TOTAL * 100) : 0;
  const pCor = graded ? Math.round(correct / graded * 100) : 0;
  document.getElementById("resultText").textContent =
    graded + " von " + TOTAL + " beantwortet (" + pAns + " %) · davon " +
    correct + " richtig (" + pCor + " %) · aufgedeckt: " + revealed;
  document.getElementById("progAnswered").style.width = pAns + "%";
  document.getElementById("progCorrect").style.width = (TOTAL ? Math.round(correct / TOTAL * 100) : 0) + "%";
}

/* ---------- Werkzeugleiste ---------- */
document.getElementById("btnShuffle").addEventListener("click", function(){
  order = shuffle(ITEMS.map(function(t){ return t.id; }));
  render();
});
document.getElementById("btnRevealAll").addEventListener("click", function(){
  ITEMS.forEach(function(t){ getState(t.id).revealed = true; });
  saveState();
  render();
});
document.getElementById("btnReset").addEventListener("click", function(){
  if(confirm("Status und Ergebnis dieser Übung wirklich zurücksetzen?")){
    state = {};
    order = freshOrder();
    localStorage.removeItem(STORE_KEY);
    render();
  }
});

/* ---------- Start ---------- */
render();
</script>
</body>
</html>`;

/* ------------------------------------------------------------------ */
/* Daten: Regeln (Funktionstexte) + 50 Sätze je Präposition            */
/* Item-Format: [regelNr, pre, disp, ans[], post]                       */
/* ------------------------------------------------------------------ */

const THEMES = [
  {
    nr: 1, slug: "di", title: "Präposition DI", base: "di",
    forms: "di · del · della · dell' · degli · dei · d'",
    tags: "italienisch, grammatik, präpositionen, di, lückentext",
    rules: {
      1: 'Indicare la città da cui si viene con il verbo "essere"',
      2: 'Indicare il posto dove qualcuno va o sta con "qui", "qua", "là" e "lì"',
      3: "Indicare l'età di una persona",
      4: "Indicare il momento preciso di un fatto",
      5: "Introdurre la causa con espressioni che indicano lo stato d'animo",
      6: "Indicare gli argomenti di cui si parla",
      7: "Indicare chi è l'autore",
      8: "Spiegare la materia con cui sono fatti gli oggetti",
      9: "Indicare e specificare un oggetto o una persona che fa parte di un gruppo più grande",
      10: "Indicare la quantità",
      11: "Introdurre i verbi all'infinito (verbo + di + infinito)",
      12: 'Confrontare 2 cose o persone con le parole "più" o "meno"',
      13: "Indicare la proprietà di una cosa",
    },
    items: [
      [1, "Mia sorella è ", "di", ["di"], " Napoli."],
      [1, "Il mio professore è ", "di", ["di"], " Torino."],
      [1, "I miei nonni sono ", "di", ["di"], " Palermo."],
      [1, "Quel musicista è ", "di", ["di"], " Roma."],
      [2, "Il gatto è ", "di", ["di"], " là."],
      [2, "I bambini sono ", "di", ["di"], " qua."],
      [3, "Mio cugino è un ragazzo ", "di", ["di"], " 16 anni."],
      [3, "La bambina ", "di", ["di"], " 8 anni canta benissimo."],
      [3, "Ho un cane ", "di", ["di"], " tre anni."],
      [3, "Il signore ", "di", ["di"], " 90 anni fa ancora lunghe passeggiate."],
      [4, "Bevo sempre un caffè ", "di", ["di"], " mattina."],
      [4, "Studio l'italiano ", "di", ["di"], " pomeriggio."],
      [4, "Il centro è tranquillo ", "di", ["di"], " notte."],
      [4, "Il negozio è chiuso ", "di", ["di"], " domenica."],
      [5, "Muoio ", "di", ["di"], " fame."],
      [5, "Sto morendo ", "di", ["di"], " sonno."],
      [5, "Morivo ", "di", ["di"], " noia alla riunione."],
      [5, "In agosto muoio ", "di", ["di"], " caldo."],
      [6, "Parliamo ", "di", ["di"], " musica."],
      [6, "Ho parlato ", "di", ["di"], " lavoro con il mio capo."],
      [6, "Scrive articoli ", "di", ["di"], " viaggio."],
      [6, "Discutono sempre ", "di", ["di"], " politica."],
      [7, "Leggo un romanzo ", "di", ["di"], " Calvino."],
      [7, "Ascoltiamo le canzoni ", "di", ["di"], " Mina."],
      [7, "Ho visto un film ", "di", ["di"], " Fellini."],
      [7, "Conosco bene le poesie ", "di", ["di"], " Montale."],
      [8, "Ho regalato un anello ", "d'", ["d'", "di"], "argento."],
      [8, "Il tavolo è fatto ", "di", ["di"], " legno."],
      [8, "La statua è fatta ", "di", ["di"], " bronzo."],
      [8, "Un braccialetto ", "d'", ["d'", "di"], "oro non costa poco."],
      [9, "La porta ", "della", ["della", "di"], " biblioteca è chiusa."],
      [9, "Il tetto ", "dell'", ["dell'", "di"], "edificio è rosso."],
      [9, "Uno ", "degli", ["degli", "di"], " studenti parla tedesco."],
      [9, "Il gatto ", "del", ["del", "di"], " vicino è nero."],
      [10, "Vorrei un po' ", "di", ["di"], " pane."],
      [10, "Mi dà ", "del", ["del", "di"], " formaggio?"],
      [10, "Ho comprato ", "del", ["del", "di"], " vino rosso."],
      [10, "C'è ", "della", ["della", "di"], " gente per strada."],
      [11, "Penso ", "di", ["di"], " partire domani."],
      [11, "Ho dimenticato ", "di", ["di"], " telefonare."],
      [11, "Ha smesso ", "di", ["di"], " fumare."],
      [11, "Finisce ", "di", ["di"], " leggere il libro stasera."],
      [12, "Questo libro è più interessante ", "di", ["di"], " quello."],
      [12, "Maria è più alta ", "di", ["di"], " sua madre."],
      [12, "Il vino rosso costa più ", "del", ["del", "di"], " vino bianco."],
      [12, "L'aereo è più veloce ", "del", ["del", "di"], " treno."],
      [13, "L'auto ", "di", ["di"], " Marco è rossa."],
      [13, "La voce ", "di", ["di"], " Anna è bellissima."],
      [13, "La casa ", "dei", ["dei", "di"], " miei genitori è in campagna."],
      [13, "Il computer ", "di", ["di"], " Luca è nuovo."],
    ],
  },

  {
    nr: 2, slug: "a", title: "Präposition A", base: "a",
    forms: "a · al · allo · alla · all' · ai · agli · alle",
    tags: "italienisch, grammatik, präpositionen, a, lückentext",
    rules: {
      1: "Indicare la città dove qualcuno è o va",
      2: "Indicare il posto dove qualcuno è o va (con le preposizioni articolate)",
      3: "Indicare il posto dove qualcuno è o va con i verbi all'infinito",
      4: "Indicare lo spazio che manca per arrivare in un posto",
      5: 'Indicare il luogo dopo le parole "vicino", "davanti", "dietro" e "sopra"',
      6: "Indicare il momento preciso di un fatto davanti ai nomi dei giorni importanti",
      7: "Indicare la fine di un periodo di tempo",
      8: "Indicare l'età di una persona",
      9: "Indicare l'ora esatta",
      10: "Indicare il fine con un verbo seguito da un altro verbo all'infinito",
      11: 'Introdurre il mezzo di trasporto a piedi o a cavallo',
      12: "Spiegare in che modo è qualcosa o qualcuno",
      13: "Unire due parole per creare una parola nuova",
      14: "Confrontare 2 cose o persone simili o uguali",
      15: "Introdurre il complemento di termine",
      16: "Introdurre l'infinito dopo alcuni verbi",
    },
    items: [
      [1, "Domani volo ", "a", ["a"], " Roma."],
      [1, "Vado ", "a", ["a"], " Milano per lavoro."],
      [1, "Maria vive ", "a", ["a"], " Bologna."],
      [1, "Siamo stati ", "a", ["a"], " Venezia."],
      [2, "Mio padre è ", "al", ["al", "a"], " mare."],
      [2, "Vado ", "alla", ["alla", "a"], " stazione."],
      [2, "Lavora ", "all'", ["all'", "a"], "ospedale."],
      [2, "Siamo ", "ai", ["ai", "a"], " giardini pubblici."],
      [3, "Vado ", "a", ["a"], " nuotare ogni sabato."],
      [3, "Esco ", "a", ["a"], " correre."],
      [3, "Vengo ", "a", ["a"], " trovarti la settimana prossima."],
      [4, "Il supermercato è ", "a", ["a"], " due minuti da qui."],
      [4, "La stazione è ", "a", ["a"], " 500 metri."],
      [4, "Siamo ", "a", ["a"], " pochi chilometri dal mare."],
      [5, "Il parcheggio è vicino ", "a", ["a"], " casa."],
      [5, "Marco è seduto davanti ", "a", ["a"], " me."],
      [5, "Il cinema è vicino ", "alla", ["alla", "a"], " stazione."],
      [6, "La famiglia si riunisce ", "a", ["a"], " Natale."],
      [6, "Mangiamo la colomba ", "a", ["a"], " Pasqua."],
      [6, "Ci vediamo ", "a", ["a"], " Ferragosto."],
      [7, "Il museo è aperto fino ", "alle", ["alle", "a"], " diciotto."],
      [7, "La piscina è chiusa dalle 12 ", "alle", ["alle", "a"], " 15."],
      [7, "Il negozio resta aperto dalle 9 ", "alle", ["alle", "a"], " 20."],
      [8, "Ho iniziato la scuola ", "a", ["a"], " sei anni."],
      [8, "Ha aperto il negozio ", "a", ["a"], " vent'anni."],
      [8, "Ha preso la patente ", "a", ["a"], " diciotto anni."],
      [9, "Il treno parte ", "alle", ["alle", "a"], " otto."],
      [9, "Il concerto inizia ", "alle", ["alle", "a"], " nove e mezza."],
      [9, "L'appuntamento è ", "all'", ["all'", "a"], "una."],
      [10, "Riesco ", "a", ["a"], " parlare con Luca."],
      [10, "Insegna ai bambini ", "a", ["a"], " leggere."],
      [10, "Si mette ", "a", ["a"], " ridere."],
      [11, "Vado ", "a", ["a"], " piedi al lavoro."],
      [11, "In montagna andiamo ", "a", ["a"], " cavallo."],
      [11, "Preferisco andare ", "a", ["a"], " piedi."],
      [12, "Abita in una casa ", "a", ["a"], " schiera."],
      [12, "Indossa una camicia ", "a", ["a"], " righe."],
      [12, "Il vestito ", "a", ["a"], " fiori è nel guardaroba."],
      [13, "La barca ", "a", ["a"], " vela entra nel porto."],
      [13, "La macchina ", "a", ["a"], " benzina è cara."],
      [13, "Il mulino ", "a", ["a"], " vento gira piano."],
      [14, "Questa giacca è uguale ", "alla", ["alla", "a"], " mia."],
      [14, "Il tuo cane è simile ", "al", ["al", "a"], " mio."],
      [14, "Il lavoro di oggi è uguale ", "a", ["a"], " quello di ieri."],
      [15, "Scrivo una lettera ", "ai", ["ai", "a"], " nonni."],
      [15, "Penso sempre ", "alla", ["alla", "a"], " mia famiglia."],
      [15, "Il regalo va ", "alla", ["alla", "a"], " nonna."],
      [16, "Comincio ", "a", ["a"], " studiare alle otto."],
      [16, "Imparo ", "a", ["a"], " guidare."],
      [16, "Sono riuscito ", "a", ["a"], " telefonare."],
    ],
  },

  {
    nr: 3, slug: "da", title: "Präposition DA", base: "da",
    forms: "da · dal · dallo · dalla · dall' · dai · dagli · dalle",
    tags: "italienisch, grammatik, präpositionen, da, lückentext",
    rules: {
      1: "Indicare il posto di partenza o di origine",
      2: "Indicare la persona da cui si va (o si è)",
      3: "Introdurre il luogo attraverso cui si passa",
      4: "Indicare l'inizio di un periodo di tempo",
      5: "Indicare un periodo di tempo che va dal passato al momento presente",
      6: 'Indicare un periodo della vita (con "giovane", "vecchio", "bambino", "ragazzo" ecc.)',
      7: "Introdurre la causa con espressioni che indicano lo stato d'animo",
      8: "Spiegare in che modo è qualcosa o qualcuno",
      9: "Unire due parole per creare una parola nuova",
      10: "Confrontare 2 cose o persone diverse",
      11: "Creare la forma passiva",
    },
    items: [
      [1, "Vengo ", "da", ["da"], " Firenze."],
      [1, "Questo treno parte ", "da", ["da"], " Roma."],
      [1, "Il volo arriva ", "da", ["da"], " Parigi."],
      [1, "Ho ricevuto una cartolina ", "da", ["da"], " Napoli."],
      [1, "L'autobus esce ", "dal", ["dal", "da"], " deposito."],
      [2, "Questa sera dormo ", "da", ["da"], " Marco."],
      [2, "Devo andare ", "dal", ["dal", "da"], " dottore."],
      [2, "Sono stato ", "dal", ["dal", "da"], " parrucchiere."],
      [2, "Vado ", "dalla", ["dalla", "da"], " nonna a pranzo."],
      [2, "Il pacco è ", "dall'", ["dall'", "da"], "avvocato."],
      [3, "L'acqua esce ", "dal", ["dal", "da"], " rubinetto."],
      [3, "Il fumo esce ", "dal", ["dal", "da"], " camino."],
      [3, "Passa ", "da", ["da"], " me dopo il lavoro."],
      [3, "La palla è volata ", "dalla", ["dalla", "da"], " finestra."],
      [3, "Si entra in casa ", "dal", ["dal", "da"], " garage."],
      [4, "Il bar è aperto ", "dalle", ["dalle", "da"], " 7 alle 13."],
      [4, "Lavoro ", "dal", ["dal", "da"], " lunedì al venerdì."],
      [4, "La mostra va ", "da", ["da"], " marzo a giugno."],
      [4, "Lavoriamo ", "dalle", ["dalle", "da"], " nove alle cinque."],
      [4, "La piscina è aperta ", "dal", ["dal", "da"], " primo maggio."],
      [5, "Studio l'italiano ", "da", ["da"], " due anni."],
      [5, "Conosco Marta ", "da", ["da"], " molto tempo."],
      [5, "Lavoro in questa azienda ", "da", ["da"], " cinque anni."],
      [5, "Non lo vedo ", "dal", ["dal", "da"], " 2019."],
      [5, "Aspetto il treno ", "da", ["da"], " mezz'ora."],
      [6, "Abitava in campagna ", "da", ["da"], " bambina."],
      [6, "Giocava a calcio ", "da", ["da"], " giovane."],
      [6, "Leggeva molto ", "da", ["da"], " ragazzo."],
      [6, "Ripenserà a questi giorni ", "da", ["da"], " vecchio."],
      [6, "Aveva un gatto ", "da", ["da"], " piccola."],
      [7, "Si piega ", "dal", ["dal", "da"], " ridere."],
      [7, "Scoppio ", "dalla", ["dalla", "da"], " rabbia."],
      [7, "Salta ", "dalla", ["dalla", "da"], " gioia."],
      [7, "Tremano ", "dal", ["dal", "da"], " freddo."],
      [8, "Un uomo ", "dai", ["dai", "da"], " capelli grigi mi guarda."],
      [8, "La ragazza ", "dagli", ["dagli", "da"], " occhi azzurri è mia cugina."],
      [8, "Un ragazzo ", "dai", ["dai", "da"], " modi gentili."],
      [8, "Una casa ", "dal", ["dal", "da"], " giardino enorme."],
      [9, "La macchina ", "da", ["da"], " corsa è velocissima."],
      [9, "Porto gli occhiali ", "da", ["da"], " sole."],
      [9, "Ha comprato un abito ", "da", ["da"], " sera."],
      [9, "Il tavolo ", "da", ["da"], " cucina è rotondo."],
      [10, "Marco è diverso ", "da", ["da"], " suo fratello."],
      [10, "Questo libro è differente ", "dall'", ["dall'", "da"], "altro."],
      [10, "Il clima è diverso ", "da", ["da"], " quello del nord."],
      [10, "Le mie abitudini sono diverse ", "dalle", ["dalle", "da"], " tue."],
      [11, "La torta è stata mangiata ", "dai", ["dai", "da"], " bambini."],
      [11, "Il film è stato diretto ", "da", ["da"], " Fellini."],
      [11, "La lettera è stata scritta ", "da", ["da"], " Maria."],
      [11, "Il vetro è stato rotto ", "dal", ["dal", "da"], " vento."],
    ],
  },

  {
    nr: 4, slug: "in", title: "Präposition IN", base: "in",
    forms: "in · nel · nello · nella · nell' · nei · negli · nelle",
    tags: "italienisch, grammatik, präpositionen, in, lückentext",
    rules: {
      1: "Indicare il posto dove si va o si è quando il luogo è una località geografica che non è una città",
      2: "Indicare il posto dove qualcuno è o va (con le preposizioni articolate)",
      3: "Indicare il momento preciso di un fatto",
      4: "Indicare il periodo di tempo in cui si compie un'azione",
      5: "Introdurre il mezzo di trasporto",
      6: "Spiegare la materia con cui sono fatti gli oggetti",
    },
    items: [
      [1, "L'anno prossimo vado ", "in", ["in"], " Francia."],
      [1, "Mio zio vive ", "in", ["in"], " Spagna."],
      [1, "Passiamo le vacanze ", "in", ["in"], " Sicilia."],
      [1, "Hanno comprato una casa ", "in", ["in"], " Toscana."],
      [1, "Studio l'inglese ", "in", ["in"], " Inghilterra."],
      [1, "Andremo ", "in", ["in"], " Grecia a settembre."],
      [1, "Lavora ", "in", ["in"], " Svizzera da tre anni."],
      [1, "Ho viaggiato ", "in", ["in"], " Portogallo."],
      [2, "Il piatto è ", "nel", ["nel", "in"], " lavandino."],
      [2, "I libri sono ", "nella", ["nella", "in"], " borsa."],
      [2, "Mio fratello è ", "nell'", ["nell'", "in"], "esercito."],
      [2, "La chiave è ", "nella", ["nella", "in"], " tasca."],
      [2, "Passeggiamo ", "nei", ["nei", "in"], " parchi."],
      [2, "Gli studenti sono ", "nelle", ["nelle", "in"], " aule."],
      [2, "Il gatto vive ", "nello", ["nello", "in"], " stesso appartamento."],
      [2, "Ho messo la spesa ", "nelle", ["nelle", "in"], " buste."],
      [2, "Mangiamo ", "nel", ["nel", "in"], " giardino."],
      [3, "Sono nata ", "nel", ["nel", "in"], " 1995."],
      [3, "Il teatro fu inaugurato ", "nel", ["nel", "in"], " 1987."],
      [3, "Mio figlio è nato ", "nel", ["nel", "in"], " 2001."],
      [3, "La riunione si è svolta ", "nel", ["nel", "in"], " 2010."],
      [3, "Ci siamo conosciuti ", "nel", ["nel", "in"], " 2018."],
      [3, "Napoleone è nato ", "nel", ["nel", "in"], " 1769."],
      [3, "Il parco è stato aperto ", "nel", ["nel", "in"], " 1975."],
      [3, "Il museo è stato fondato ", "nel", ["nel", "in"], " 1901."],
      [4, "Riesce a raggiungere l'isola ", "in", ["in"], " tre ore."],
      [4, "Ho finito il libro ", "in", ["in"], " due giorni."],
      [4, "Riesco a fare i compiti ", "in", ["in"], " un'ora."],
      [4, "Ho completato il modulo ", "in", ["in"], " dieci minuti."],
      [4, "Gli operai riescono a rifare la strada ", "in", ["in"], " una settimana."],
      [4, "Riesco a leggere questo giornale ", "in", ["in"], " cinque minuti."],
      [4, "Ha imparato l'italiano ", "in", ["in"], " sei mesi."],
      [4, "Riesce a tradurre la lettera ", "in", ["in"], " un'ora."],
      [4, "Riusciamo ad attraversare la città ", "in", ["in"], " mezz'ora."],
      [5, "Vado ", "in", ["in"], " treno a Torino."],
      [5, "Viaggiamo ", "in", ["in"], " aereo."],
      [5, "Andiamo al mare ", "in", ["in"], " bici."],
      [5, "Preferisco spostarmi ", "in", ["in"], " metro."],
      [5, "Sono venuto ", "in", ["in"], " autobus."],
      [5, "Attraversano l'oceano ", "in", ["in"], " nave."],
      [5, "Giriamo la città ", "in", ["in"], " moto."],
      [5, "Arrivo al lavoro ", "in", ["in"], " macchina."],
      [6, "Bevo solo acqua ", "in", ["in"], " bottiglia."],
      [6, "Preferisco il tonno ", "in", ["in"], " scatola."],
      [6, "Il caffè ", "in", ["in"], " cialde è comodo."],
      [6, "La birra ", "in", ["in"], " lattina si raffredda presto."],
      [6, "Compro lo zucchero ", "in", ["in"], " cubetti."],
      [6, "Il cioccolato ", "in", ["in"], " tavolette si spezza."],
      [6, "Il latte ", "in", ["in"], " polvere dura a lungo."],
      [6, "Il formaggio ", "in", ["in"], " scaglie è per l'insalata."],
    ],
  },

  {
    nr: 5, slug: "con", title: "Präposition CON", base: "con",
    forms: "con",
    tags: "italienisch, grammatik, präpositionen, con, lückentext",
    rules: {
      1: "Introdurre il mezzo di trasporto",
      2: "Introdurre i mezzi che usiamo come strumento di comunicazione",
      3: "Indicare i mezzi che usiamo per lavorare o per fare le cose di tutti i giorni",
      4: "Indicare le persone o le cose che stanno insieme",
      5: "Spiegare il modo di essere di qualcosa o di qualcuno",
    },
    items: [
      [1, "Vado al lavoro ", "con", ["con"], " lo scooter."],
      [1, "Attraversiamo il fiume ", "con", ["con"], " il traghetto."],
      [1, "Si raggiunge l'isola ", "con", ["con"], " la nave."],
      [1, "I ragazzi vanno a scuola ", "con", ["con"], " il pulmino."],
      [1, "Il bambino si muove ", "con", ["con"], " il monopattino."],
      [1, "Arrivo ", "con", ["con"], " il volo delle nove."],
      [1, "Sono tornato ", "con", ["con"], " il primo treno."],
      [1, "Partiamo ", "con", ["con"], " il volo diretto."],
      [1, "Saliamo ", "con", ["con"], " l'ultimo autobus."],
      [1, "Torno a casa ", "con", ["con"], " il motorino di mio fratello."],
      [2, "Ti chiamo ", "con", ["con"], " il telefono."],
      [2, "Ho inviato il messaggio ", "con", ["con"], " il cellulare."],
      [2, "Mandiamo la lettera ", "con", ["con"], " la posta."],
      [2, "Ho mandato il documento ", "con", ["con"], " il fax."],
      [2, "Comunica ", "con", ["con"], " la posta elettronica."],
      [2, "Invio il documento ", "con", ["con"], " il computer."],
      [2, "Scrivo ai colleghi ", "con", ["con"], " l'app."],
      [2, "Ho avvisato tutti ", "con", ["con"], " una telefonata."],
      [2, "La registrazione è stata fatta ", "con", ["con"], " il microfono."],
      [2, "Diffondiamo la notizia ", "con", ["con"], " i social."],
      [3, "Compilo i moduli ", "con", ["con"], " il computer."],
      [3, "Scrivo ", "con", ["con"], " la penna."],
      [3, "Taglio il pane ", "con", ["con"], " il coltello."],
      [3, "Disegna ", "con", ["con"], " la matita."],
      [3, "Lavo i piatti ", "con", ["con"], " l'acqua calda."],
      [3, "Cucio ", "con", ["con"], " l'ago e il filo."],
      [3, "Preparo il caffè ", "con", ["con"], " la moka."],
      [3, "Guarda la luna ", "con", ["con"], " il telescopio."],
      [3, "Misura la temperatura ", "con", ["con"], " il termometro."],
      [3, "Apro la porta ", "con", ["con"], " la chiave."],
      [4, "Io abito ", "con", ["con"], " mia sorella."],
      [4, "Vado in vacanza ", "con", ["con"], " gli amici."],
      [4, "Mangio sempre ", "con", ["con"], " i colleghi."],
      [4, "Esce ", "con", ["con"], " il suo ragazzo."],
      [4, "Faccio una passeggiata ", "con", ["con"], " il cane."],
      [4, "Gioca a carte ", "con", ["con"], " i nonni."],
      [4, "Ho un appuntamento ", "con", ["con"], " il medico."],
      [4, "Parlo ", "con", ["con"], " la vicina ogni giorno."],
      [4, "Condivido la casa ", "con", ["con"], " due studenti."],
      [4, "Faccio colazione ", "con", ["con"], " il latte."],
      [5, "La casa ha un giardino ", "con", ["con"], " molti fiori."],
      [5, "Ho prenotato una stanza ", "con", ["con"], " due letti."],
      [5, "Cerchiamo un albergo ", "con", ["con"], " piscina."],
      [5, "Ho comprato una giacca ", "con", ["con"], " cappuccio."],
      [5, "Lei è una persona ", "con", ["con"], " molta pazienza."],
      [5, "Preferisco la stanza ", "con", ["con"], " la vista sul mare."],
      [5, "Vuole una bici ", "con", ["con"], " il cambio."],
      [5, "Ho letto un romanzo ", "con", ["con"], " un finale felice."],
      [5, "Il libro ", "con", ["con"], " la copertina rossa è mio."],
      [5, "Servono panini ", "con", ["con"], " il prosciutto."],
    ],
  },

  {
    nr: 6, slug: "su", title: "Präposition SU", base: "su",
    forms: "su · sul · sullo · sulla · sull' · sui · sugli · sulle",
    tags: "italienisch, grammatik, präpositionen, su, lückentext",
    rules: {
      1: "Indicare, in alcuni casi particolari, il posto dove si è o si va",
      2: "Introdurre, in alcuni casi particolari, gli argomenti di cui si parla",
    },
    items: [
      [1, "Il libro è ", "sul", ["sul", "su"], " tavolo."],
      [1, "Il quadro è ", "sulla", ["sulla", "su"], " parete."],
      [1, "Il gatto dorme ", "sul", ["sul", "su"], " divano."],
      [1, "Sono seduto ", "sulla", ["sulla", "su"], " panchina."],
      [1, "Il vaso è ", "sul", ["sul", "su"], " davanzale."],
      [1, "La lettera è ", "sulla", ["sulla", "su"], " scrivania."],
      [1, "Il cappello è ", "sulla", ["sulla", "su"], " testa del bambino."],
      [1, "Le foto sono ", "sullo", ["sullo", "su"], " scaffale."],
      [1, "Cammino ", "sull'", ["sull'", "su"], "erba."],
      [1, "La neve è ", "sulle", ["sulle", "su"], " montagne."],
      [1, "I piatti sono ", "sul", ["sul", "su"], " fornello."],
      [1, "Appoggio la borsa ", "sul", ["sul", "su"], " banco."],
      [1, "La tazza è ", "sul", ["sul", "su"], " tavolino."],
      [1, "Dorme ", "sull'", ["sull'", "su"], "amaca."],
      [1, "Il villaggio si trova ", "sulla", ["sulla", "su"], " cima della montagna."],
      [1, "La coperta è ", "sulla", ["sulla", "su"], " poltrona."],
      [1, "Il piatto è ", "sul", ["sul", "su"], " ripiano."],
      [1, "Saltiamo ", "sulle", ["sulle", "su"], " onde."],
      [1, "C'è un tappeto ", "sul", ["sul", "su"], " pavimento."],
      [1, "Il bambino sale ", "sulle", ["sulle", "su"], " spalle del papà."],
      [1, "Il pinguino scivola ", "sul", ["sul", "su"], " ghiaccio."],
      [1, "La sella è ", "sul", ["sul", "su"], " dorso del cavallo."],
      [1, "L'antenna è ", "sul", ["sul", "su"], " tetto."],
      [1, "Il cigno è ", "sulla", ["sulla", "su"], " superficie del lago."],
      [1, "L'etichetta è ", "sulla", ["sulla", "su"], " bottiglia."],
      [2, "Abbiamo discusso ", "sul", ["sul", "su"], " progetto."],
      [2, "Ho letto un articolo ", "sulla", ["sulla", "su"], " storia."],
      [2, "La lezione di oggi è ", "sulla", ["sulla", "su"], " pace."],
      [2, "Ho un'opinione ", "su", ["su"], " questo tema."],
      [2, "Il documentario è ", "sui", ["sui", "su"], " vulcani."],
      [2, "Scrivo un tema ", "sulle", ["sulle", "su"], " vacanze."],
      [2, "Ho letto un libro ", "sull'", ["sull'", "su"], "amicizia."],
      [2, "Il dibattito è ", "sulla", ["sulla", "su"], " scuola."],
      [2, "Il film è ", "sulla", ["sulla", "su"], " seconda guerra mondiale."],
      [2, "Ho dei dubbi ", "su", ["su"], " questa scelta."],
      [2, "La conferenza è ", "sul", ["sul", "su"], " clima."],
      [2, "Il questionario è ", "sulle", ["sulle", "su"], " abitudini."],
      [2, "Scrivo un saggio ", "sugli", ["sugli", "su"], " animali."],
      [2, "Il prossimo capitolo è ", "sul", ["sul", "su"], " medioevo."],
      [2, "Riflettiamo molto ", "sul", ["sul", "su"], " problema."],
      [2, "Ho visto un programma ", "sul", ["sul", "su"], " vino."],
      [2, "La mostra è ", "sull'", ["sull'", "su"], "arte moderna."],
      [2, "Il testo è ", "sui", ["sui", "su"], " diritti dei bambini."],
      [2, "Ho una domanda ", "su", ["su"], " questo argomento."],
      [2, "Il giornale ha un articolo ", "sulla", ["sulla", "su"], " moda."],
      [2, "La discussione è ", "sui", ["sui", "su"], " costumi."],
      [2, "Il corso di oggi è ", "sull'", ["sull'", "su"], "economia."],
      [2, "Ho dei libri ", "sulle", ["sulle", "su"], " piante."],
      [2, "La poesia è ", "sulla", ["sulla", "su"], " libertà."],
      [2, "Ci siamo informati ", "sul", ["sul", "su"], " programma."],
    ],
  },

  {
    nr: 7, slug: "per", title: "Präposition PER", base: "per",
    forms: "per",
    tags: "italienisch, grammatik, präpositionen, per, lückentext",
    rules: {
      1: "Indicare, in alcuni casi particolari, il posto dove si è o si va",
      2: "Introdurre il luogo attraverso il quale si passa",
      3: "Indicare per quanto tempo il soggetto continua a compiere un'azione",
      4: "Indicare il fine di un'azione",
      5: "Introdurre la causa di un'azione",
      6: "Introdurre la causa con espressioni che indicano lo stato d'animo",
      7: "Indicare i mezzi che usiamo come strumento per comunicare",
    },
    items: [
      [1, "Ho rovesciato il caffè ", "per", ["per"], " terra."],
      [1, "I vestiti sono sparsi ", "per", ["per"], " terra."],
      [1, "Il bambino gioca ", "per", ["per"], " terra."],
      [1, "Dormiamo ", "per", ["per"], " terra quando campeggiamo."],
      [1, "Viaggiamo ", "per", ["per"], " mare."],
      [1, "Prendiamo il treno ", "per", ["per"], " Genova."],
      [1, "Siamo andati ", "per", ["per"], " la strada più lunga."],
      [2, "Camminiamo ", "per", ["per"], " il centro storico."],
      [2, "Il fiume scorre ", "per", ["per"], " la valle."],
      [2, "Passeggiamo ", "per", ["per"], " il parco."],
      [2, "I turisti girano ", "per", ["per"], " le vie del centro."],
      [2, "Abbiamo viaggiato ", "per", ["per"], " tutta la Toscana."],
      [2, "La notizia si è sparsa ", "per", ["per"], " il quartiere."],
      [2, "Andiamo ", "per", ["per"], " questa strada, è più veloce."],
      [3, "Ho abitato a Milano ", "per", ["per"], " tre anni."],
      [3, "Il seminario è durato ", "per", ["per"], " una settimana intera."],
      [3, "Abbiamo aspettato ", "per", ["per"], " due ore."],
      [3, "Ha piovuto ", "per", ["per"], " tutta la notte."],
      [3, "Ha lavorato ", "per", ["per"], " molti anni in banca."],
      [3, "Camminiamo ", "per", ["per"], " un'ora ogni giorno."],
      [3, "Il negozio resta chiuso ", "per", ["per"], " due settimane."],
      [4, "Studia ", "per", ["per"], " diventare medico."],
      [4, "Vado in palestra ", "per", ["per"], " stare in forma."],
      [4, "Leggo ", "per", ["per"], " imparare."],
      [4, "Chiamo ", "per", ["per"], " prenotare un tavolo."],
      [4, "Parte presto ", "per", ["per"], " non perdere il treno."],
      [4, "Risparmio ", "per", ["per"], " comprare una casa."],
      [4, "Uso la mappa ", "per", ["per"], " orientarmi."],
      [4, "Il caffè serve ", "per", ["per"], " svegliarsi."],
      [5, "L'aeroporto è chiuso ", "per", ["per"], " la nebbia."],
      [5, "Non esco ", "per", ["per"], " il brutto tempo."],
      [5, "La scuola è sospesa ", "per", ["per"], " la neve."],
      [5, "Il concerto è stato annullato ", "per", ["per"], " la pioggia."],
      [5, "Resta a casa ", "per", ["per"], " il mal di testa."],
      [5, "Sono in ritardo ", "per", ["per"], " il traffico."],
      [5, "Il volo è partito tardi ", "per", ["per"], " il vento."],
      [6, "È tornata a casa ", "per", ["per"], " la nostalgia."],
      [6, "Ho saltato la festa ", "per", ["per"], " la stanchezza."],
      [6, "Ho cambiato lavoro ", "per", ["per"], " lo stress."],
      [6, "Ha sbattuto la porta ", "per", ["per"], " il nervosismo."],
      [6, "Non ho chiuso occhio ", "per", ["per"], " l'ansia."],
      [6, "Si è licenziata ", "per", ["per"], " la rabbia."],
      [6, "Il pubblico si è alzato ", "per", ["per"], " l'entusiasmo."],
      [7, "Ho mandato il documento ", "per", ["per"], " fax."],
      [7, "Abbiamo avvisato tutti ", "per", ["per"], " email."],
      [7, "Contattaci ", "per", ["per"], " telefono."],
      [7, "Ho inviato il messaggio ", "per", ["per"], " posta."],
      [7, "La notizia è arrivata ", "per", ["per"], " radio."],
      [7, "Trasmettono la partita ", "per", ["per"], " televisione."],
      [7, "Scrivici ", "per", ["per"], " lettera."],
    ],
  },

  {
    nr: 8, slug: "tra-fra", title: "Präposition TRA / FRA", base: "tra o fra",
    forms: "tra / fra",
    tags: "italienisch, grammatik, präpositionen, tra, fra, lückentext",
    rules: {
      1: "Indicare lo spazio che manca per arrivare in un posto",
      2: "Indicare l'inizio di un periodo di tempo entro il quale si svolge un'azione",
      3: "Indicare dopo quanto tempo avviene un'azione",
    },
    items: [
      [1, "", "Fra", ["tra", "fra"], " dieci chilometri arriveremo all'area di sosta."],
      [1, "", "Fra", ["tra", "fra"], " pochi chilometri raggiungeremo il prossimo paese."],
      [1, "", "Fra", ["tra", "fra"], " cento metri saremo in cima."],
      [1, "", "Fra", ["tra", "fra"], " due chilometri arriverai alla stazione."],
      [1, "", "Fra", ["tra", "fra"], " cinquanta chilometri arriveremo al mare."],
      [1, "", "Tra", ["tra", "fra"], " un chilometro saremo a casa."],
      [1, "", "Tra", ["tra", "fra"], " due fermate devi scendere dall'autobus."],
      [1, "", "Fra", ["tra", "fra"], " qualche centinaio di metri sarai al bivio."],
      [1, "", "Fra", ["tra", "fra"], " tre chilometri saremo al confine."],
      [1, "", "Tra", ["tra", "fra"], " cento metri arriverai al parcheggio."],
      [1, "", "Fra", ["tra", "fra"], " tre uscite devi uscire dall'autostrada."],
      [1, "", "Tra", ["tra", "fra"], " cinque chilometri arriveremo al villaggio."],
      [1, "", "Fra", ["tra", "fra"], " due isolati sarai alla banca."],
      [1, "", "Fra", ["tra", "fra"], " trecento metri saremo alla fine del sentiero."],
      [1, "", "Tra", ["tra", "fra"], " mezzo chilometro saremo all'uscita."],
      [1, "", "Fra", ["tra", "fra"], " cinquecento metri arriveremo alla riserva naturale."],
      [2, "Mario arriverà ", "tra", ["tra", "fra"], " le cinque e le sei."],
      [2, "Il pacchetto arriva ", "fra", ["tra", "fra"], " martedì e mercoledì."],
      [2, "Ti richiamo ", "tra", ["tra", "fra"], " mezz'ora e un'ora."],
      [2, "Il risultato sarà pronto ", "fra", ["tra", "fra"], " domani e dopodomani."],
      [2, "La consegna avviene ", "tra", ["tra", "fra"], " le dieci e le dodici."],
      [2, "Il medico ti visita ", "fra", ["tra", "fra"], " le quattro e le cinque."],
      [2, "L'autobus passa ", "tra", ["tra", "fra"], " le sette e le sette e mezza."],
      [2, "Il volo decolla ", "tra", ["tra", "fra"], " mezzogiorno e l'una."],
      [2, "Il saldo scade ", "fra", ["tra", "fra"], " una settimana e dieci giorni."],
      [2, "Il corso inizierà ", "tra", ["tra", "fra"], " febbraio e marzo."],
      [2, "L'idraulico passerà ", "fra", ["tra", "fra"], " le nove e le dieci."],
      [2, "L'incontro è previsto ", "tra", ["tra", "fra"], " le otto e le nove."],
      [2, "Il traghetto salpa ", "fra", ["tra", "fra"], " le cinque e le sei."],
      [2, "La riunione si tiene ", "tra", ["tra", "fra"], " lunedì e mercoledì."],
      [2, "Il pagamento va fatto ", "fra", ["tra", "fra"], " oggi e venerdì."],
      [2, "La pizza sarà pronta ", "tra", ["tra", "fra"], " venti e trenta minuti."],
      [2, "Il libro uscirà ", "fra", ["tra", "fra"], " primavera ed estate."],
      [3, "Ci vediamo ", "tra", ["tra", "fra"], " mezz'ora."],
      [3, "Mio fratello torna ", "fra", ["tra", "fra"], " un'ora."],
      [3, "La cena sarà pronta ", "tra", ["tra", "fra"], " dieci minuti."],
      [3, "Partiamo ", "fra", ["tra", "fra"], " poco."],
      [3, "Il film comincia ", "tra", ["tra", "fra"], " cinque minuti."],
      [3, "La banca chiude ", "fra", ["tra", "fra"], " mezz'ora."],
      [3, "Arriverò ", "tra", ["tra", "fra"], " un momento."],
      [3, "Ti chiamo ", "fra", ["tra", "fra"], " cinque minuti."],
      [3, "La frutta matura ", "tra", ["tra", "fra"], " un mese."],
      [3, "Il progetto finisce ", "fra", ["tra", "fra"], " due settimane."],
      [3, "Il treno parte ", "tra", ["tra", "fra"], " un quarto d'ora."],
      [3, "La ditta consegna ", "fra", ["tra", "fra"], " tre giorni."],
      [3, "Ci sposiamo ", "tra", ["tra", "fra"], " un anno."],
      [3, "Il sole tramonta ", "fra", ["tra", "fra"], " un'ora."],
      [3, "La pausa inizia ", "tra", ["tra", "fra"], " venti minuti."],
      [3, "Il concerto finisce ", "fra", ["tra", "fra"], " un paio d'ore."],
      [3, "Torno ", "tra", ["tra", "fra"], " due giorni."],
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Build (eine Datei mit allen Präpositionen gemischt)                */
/* ------------------------------------------------------------------ */

const DATE = "22.08.2026";

function pad(n){ return String(n).padStart(3, "0"); }
function pid(n){ return "n" + String(n).padStart(2, "0"); }

function buildAll(){
  const rules = {};
  const items = [];

  THEMES.forEach(function(theme){
    Object.keys(theme.rules).forEach(function(k){
      rules[theme.slug + "-" + k] = theme.rules[k];
    });
    theme.items.forEach(function(it, idx){
      items.push({
        id: theme.slug + "-" + pid(idx + 1),
        r: theme.slug + "-" + it[0],
        pre: it[1],
        disp: it[2],
        ans: theme.slug === "tra-fra" ? ["tra", "fra"] : [it[2]],
        post: it[4]
      });
    });
  });

  return { rules: rules, items: items };
}

function buildHtml(){
  const data = buildAll();
  const total = data.items.length;

  const title = "Präpositionen";
  const meta = "Italienisch-Übung (Lückentext): alle Präpositionen di, a, da, in, con, su, per, tra/fra. 400 eigene Beispielsätze, gemischt. Erstellt am " + DATE + ". Tags: italienisch, grammatik, präpositionen, lückentext";
  const subtitle = "Italienisch · " + total + " gemischte Lückentext-Sätze · di · a · da · in · con · su · per · tra/fra";
  const hint = "Welche Präposition fehlt? Tippen und weiterklicken – die Regel erscheint erst nach der Antwort. Bei verschmolzenen Formen ist die konkrete Form gefragt; tra und fra sind gleichwertig.";
  const storeKey = "uebung.001-preposizione.v3";

  return TEMPLATE
    .split("__TITLE__").join(title)
    .split("__META__").join(meta)
    .split("__SUBTITLE__").join(subtitle)
    .split("__HINT__").join(hint)
    .split("__TOTAL__").join(String(total))
    .split("__STORE_KEY__").join(storeKey)
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
    </tbody>
  </table>
</div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* Run                                                                 */
/* ------------------------------------------------------------------ */

fs.mkdirSync(PUBLIC, { recursive: true });

const html = buildHtml();
const outFile = "001-preposizione.html";
fs.writeFileSync(path.join(PUBLIC, outFile), html);
fs.writeFileSync(path.join(PUBLIC, "index.html"), buildIndex());

/* Bericht */
const all = buildAll();
const ids = all.items.map(function(it){ return it.id; });
const unique = new Set(ids).size === ids.length;
const counts = THEMES.map(function(t){
  return t.slug + "=" + t.items.length;
}).join("  ");
console.log("geschrieben: " + outFile + "  (" + all.items.length + " Sätze)");
console.log("unique ids: " + (unique ? "ja" : "NEIN"));
console.log("pro Thema: " + counts);
if(all.items.length !== 400 || !unique){
  process.exit(1);
}
console.log("Fertig.");
