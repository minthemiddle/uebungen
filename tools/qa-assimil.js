#!/usr/bin/env node
"use strict";
/**
 * QA-Report über die Item-Gruppen in in/002-assimil-1-45/g*.json:
 * Statistik + Stichproben für manuelle Kontrolle + Heuristik-Warnungen.
 * Nutzung: node tools/qa-assimil.js [stichproben_je_gruppe]
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "in", "002-assimil-1-45");
const sampleN = parseInt(process.argv[2] || "3", 10);

const files = [];
fs.readdirSync(SRC).filter(f => /^g\d+\.json$/.test(f)).sort().forEach(f => files.push(f));
const partsDir = path.join(SRC, "parts");
if(fs.existsSync(partsDir)){
  fs.readdirSync(partsDir).filter(f => /^l\d{2}\.json$/.test(f)).sort().forEach(f => files.push("parts/" + f));
}
const warnings = [];
let total = 0;

files.forEach(f => {
  const g = JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));
  const rules = g.rules || {};
  const items = g.items || [];
  total += items.length;

  /* Regel-Verwendung */
  const used = new Set(items.map(i => i.r));
  Object.keys(rules).forEach(k => {
    if (!used.has(k)) warnings.push(`${f}: Regel ${k} unbenutzt`);
  });

  const perLesson = {};
  items.forEach(it => {
    const l = it.id.slice(0, 3);
    perLesson[l] = (perLesson[l] || 0) + 1;

    /* Whitespace/Format-Heuristik */
    if (it.pre && !/[ ${}'"\u2019]$/.test(it.pre) && !/^[.,;:!?']/.test(it.post || "")) {
      warnings.push(`${f} ${it.id}: pre endet ohne Leerzeichen, post beginnt ohne Satzzeichen (${JSON.stringify(it.pre.slice(-14))} | ${JSON.stringify((it.post || "").slice(0, 14))})`);
    }
    if (/ {2,}/.test(it.pre) || / {2,}/.test(it.post)) warnings.push(`${f} ${it.id}: Doppelleerzeichen`);
    const gapPre = it.pre.endsWith(" ") || it.pre.endsWith("'") || it.pre.endsWith("\u2019");
    const gapPost = (it.post || "").startsWith(" ") || /^[.,;:!?'\u2019]/.test(it.post || "");
    if (!gapPre && !gapPost) warnings.push(`${f} ${it.id}: pre endet ohne Leerzeichen/Apostroph und post ohne Leerzeichen/Satzzeichen`);

    /* Antworten */
    if (it.disp.length > 22) warnings.push(`${f} ${it.id}: disp sehr lang (${it.disp.length} Zeichen)`);
    if (it.ans.some(a => a !== a.toLowerCase()) && it.ans.every(a => a !== a.toLowerCase())) {
      /* ok: Großschreibung erlaubt, z. B. Eigennamen – nur melden, wenn alle Varianten groß */
    }
    if (/\d/.test(it.disp)) warnings.push(`${f} ${it.id}: disp enthält Ziffern`);

    /* tr / expl */
    if (!/[.!?…"'»]$/.test(it.tr)) warnings.push(`${f} ${it.id}: tr endet ohne Satzzeichen`);
    if (it.tr.length < 12) warnings.push(`${f} ${it.id}: tr verdächtig kurz`);
    if (it.expl.length < 25) warnings.push(`${f} ${it.id}: expl verdächtig kurz`);
    if (/[<>]/.test(it.tr + it.expl)) warnings.push(`${f} ${it.id}: HTML-Zeichen in tr/expl`);
  });

  Object.keys(perLesson).forEach(l => {
    if (perLesson[l] !== 10) warnings.push(`${f}: Lektion ${l} hat ${perLesson[l]} Items (Soll 10)`);
  });

  /* Stichprobe */
  console.log(`\n### ${f}: ${items.length} Items, ${Object.keys(rules).length} Regeln – Lektionen ${Object.keys(perLesson).join(", ")}`);
  const step = Math.max(1, Math.floor(items.length / sampleN));
  for (let i = 0; i < items.length && sampleN > 0; i += step) {
    const it = items[i];
    console.log(`  [${it.id}] ${it.pre}⟨${it.disp}⟩${it.post}`);
    console.log(`      ans=${JSON.stringify(it.ans)} | Regel: ${rules[it.r]}`);
    console.log(`      🇩🇪 ${it.tr}`);
    console.log(`      💡 ${it.expl}`);
  }
});

console.log(`\n=== Gesamt: ${total} Items in ${files.length} Gruppen ===`);
if (warnings.length) {
  console.log(`\nWARNUNGEN (${warnings.length}):`);
  warnings.slice(0, 200).forEach(w => console.log("  - " + w));
  if (warnings.length > 200) console.log(`  … und ${warnings.length - 200} weitere`);
} else {
  console.log("Keine Warnungen.");
}
