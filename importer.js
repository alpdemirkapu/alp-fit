/* ALP FIT v2.1 · Metinden antrenman programı aktarma.
   Girdi yalnızca tarayıcıda işlenir, metin sunucuya gönderilmez.
   Bu modül veri kaydetmez; kayıt için her zaman önizleme ve açık onay gerekir. */
(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ALPFIT_IMPORTER = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';
  const limit = (s, n) => String(s || '').trim().slice(0,n);
  const normalizeName = value => String(value || '').toLocaleLowerCase('tr-TR').replace(/\s+/g,' ').trim();
  const isDivider = line => /^\|?[\s:|\-–—]+\|?$/.test(line);
  const noteLine = line => /^(?:notlar?|notes?|açıklama|aciklama|ısınma|isinma|cool\s*down|soğuma|toplam|haftalık|haftalik|öneri|oneri|tempo|rpe|rır|rir)\s*[:\-]/i.test(line);
  function dayHeader(input) {
    const line=input.replace(/^\s*#{1,6}\s*/, '').replace(/\*\*/g,'').trim();
    // 'Gün 1 - Sabah' / '1. Gün: Göğüs' / 'Program 7 | Akşam'
    let match=line.match(/^(?:gün|gun|day|program|antrenman)\s*([1-7])\s*(?:[.):-]|[–—|])?\s*(.*)$/i);
    if (!match) match=line.match(/^([1-7])\s*[.)-]?\s*(?:gün|gun|day|program|antrenman)\s*(?:[.):-]|[–—|])?\s*(.*)$/i);
    if (!match) return null;
    return { index:Number(match[1])-1, title:limit(match[2].replace(/^[\s:\-–—|]+/,''),90) };
  }
  function looksLikeHeader(line) {
    const l=line.toLocaleLowerCase('tr-TR').replace(/^\s*#+\s*/,'').trim();
    return /^(?:[a-zçğıöşü\s]+\s+)?(?:sabah|akşam|aksam)\s+(?:antrenman[ıi]?|program[ıi]?)?$/.test(l)
      || /^(?:göğüs|gogus|sırt|sirt|bacak|omuz|kol|dinlenme|full body|push|pull|legs)\s*(?:&|\/|\+|ve\s+)?\s*[a-zçğıöşü\s]*$/.test(l)
      || /^#{1,6}\s+\S/.test(line);
  }
  function parseMetricParts(text) {
    let rest=90, weight='';
    // 1,5 dk / 90 sn / dinlenme: 90 saniye
    const rests=[...text.matchAll(/(?:dinlenme\s*[:=]\s*)?(\d{1,3}(?:[.,]\d+)?)\s*(sn|saniye|saniyelik|sec|s|dk|dakika|dak|min)\b/gi)];
    if (rests.length) {
      const m=rests[rests.length-1]; const val=Number(m[1].replace(',','.'));
      rest=Math.round(val * (/^(dk|dak|dakika|min)$/i.test(m[2])?60:1));
    }
    const restLabel=text.match(/\bdinlenme\s*[:=]\s*(\d{1,3})\b/i);
    if (!rests.length && restLabel) rest=Number(restLabel[1]);
    // 2x20 kg dumbbell için tek dambılın ağırlığı 20 kg olarak alınır.
    const weights=[...text.matchAll(/(?:(?:\d\s*[x×]\s*)?)(\d{1,3}(?:[.,]\d+)?)\s*(?:kg|kilo)\b/gi)];
    if (weights.length) weight=Number(weights[weights.length-1][1].replace(',','.'));
    return {rest,weight};
  }
  function normalizeEx(name,sets,reps,meta) {
    name=String(name||'').replace(/^\s*(?:[-*•]|\d{1,2}[.)])\s*/, '')
      .replace(/\*\*|__|`/g,'').replace(/^[\s|:–—-]+|[\s|:–—-]+$/g,'').trim();
    reps=String(reps||'').replace(/\s*[–—]\s*/g,'-').replace(/\s*[-]\s*/g,'-').trim();
    if (!name || name.length>70 || /^(hareket|exercise|egzersiz)$/i.test(name) || !/^[\p{L}\d]/u.test(name))return null;
    if (!Number.isInteger(Number(sets)) || Number(sets)<1 || Number(sets)>15 || !reps || reps.length>20)return null;
    if (!Number.isInteger(meta.rest) || meta.rest<10 || meta.rest>900)return null;
    if (meta.weight!=='' && (!Number.isFinite(meta.weight)||meta.weight<0||meta.weight>1000))return null;
    return {name,sets:Number(sets),reps,weight:meta.weight,rest:meta.rest};
  }
  function parseExercise(line) {
    const cleaned=line.replace(/^\s*[-•*]+\s*/, '').replace(/\*\*/g,'').trim();
    if (!cleaned || isDivider(cleaned) || noteLine(cleaned))return null;
    let pieces=null;
    if (cleaned.includes('|')) pieces=cleaned.split('|').map(s=>s.trim()).filter(Boolean);
    else if (cleaned.includes('\t')) pieces=cleaned.split(/\t+/).map(s=>s.trim()).filter(Boolean);
    else if (cleaned.includes(';')) pieces=cleaned.split(';').map(s=>s.trim()).filter(Boolean);
    if (pieces?.length>=3 && !/^(hareket|exercise|egzersiz|name)$/i.test(pieces[0])) {
      const firstSet=pieces[1].match(/^(\d{1,2})\s*(?:set)?$/i);
      const firstRep=pieces[2].match(/^(\d{1,3}(?:\s*[-–]\s*\d{1,3})?|\d{1,3}\+|amrap|max|tükeniş)$/i);
      if (firstSet && firstRep) {
        let weight='',rest=90;
        for (const p of pieces.slice(3)) {
          const m=parseMetricParts(p); if (m.weight!=='')weight=m.weight;if(m.rest!==90)rest=m.rest;
        }
        if(pieces[3] && /^\d+(?:[.,]\d+)?$/.test(pieces[3]))weight=Number(pieces[3].replace(',','.'));
        if(pieces[4] && /^\d{1,3}$/.test(pieces[4]))rest=Number(pieces[4]);
        return normalizeEx(pieces[0], firstSet[1], firstRep[1], {weight,rest});
      }
    }
    const normalized=cleaned.replace(/[×]/g,'x').replace(/[–—]/g,'-');
    // Örn. 'Bench Press - 4 x 8-12 - 60 kg - 90 sn'.
    // KG / dinlenme sayıları tekrar aralığına yanlışlıkla karışmasın.
    const strippedMetrics=normalized.replace(/\d+(?:[.,]\d+)?\s*(?:kg|kilo|sn|saniye|sec|dk|dakika|dak|min)\b/gi,part=>' '.repeat(part.length));
    let match=strippedMetrics.match(/\b(1[0-5]|[1-9])\s*[x*]\s*(\d{1,3}(?:\s*-\s*\d{1,3})?|\d{1,3}\+|amrap|max|tükeniş)\b/i);
    if (!match) match=strippedMetrics.match(/\b(1[0-5]|[1-9])\s*set(?:\s*[x:\-]?\s*)(\d{1,3}(?:\s*-\s*\d{1,3})?|\d{1,3}\+|amrap|max|tükeniş)\s*(?:tekrar|rep)?\b/i);
    if (!match)return null;
    const meta=parseMetricParts(normalized);
    let head=normalized.slice(0,match.index).replace(/[\s:|,;\-]+$/,'').trim();
    const tail=normalized.slice(match.index+match[0].length);
    if(!head){head=tail.replace(/(?:\d+(?:[.,]\d+)?\s*(?:kg|kilo|sn|dk|saniye|dakika)\b.*$)/i,'').replace(/^[\s:|,;\-]+/,'').trim();}
    head=head.replace(/\s*\b(?:set|tekrar|repeat)\s*$/i,'');
    return normalizeEx(head,match[1],match[2],meta);
  }
  function parseWorkoutText(text) {
    text=String(text||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
    if(text.length>120000)throw Error('Metin çok uzun (en fazla 120.000 karakter).');
    const groups=[],skipped=[];let current=null, numHeaders=0;
    function start(index=null,title=''){
      current={dayIndex:index,title,exercises:[]};groups.push(current);return current;
    }
    for(const raw of text.split('\n')){
      const line=raw.trim();
      if(!line || isDivider(line) || /^\|?\s*(hareket|exercise|egzersiz)\s*[|\t]/i.test(line))continue;
      const header=dayHeader(line);
      if(header){start(header.index,header.title);numHeaders++;continue;}
      if(looksLikeHeader(line) && !parseExercise(line)){
        // Gün numarası olmayan başlıklar not sayılır: hedefi kullanıcı seçer.
        if(current&& !current.exercises.length && !current.title)current.title=limit(line.replace(/^#+\s*/,''),90);
        continue;
      }
      const ex=parseExercise(line);
      if(ex){if(!current)start();current.exercises.push(ex);}
      else if(skipped.length<50 && !/^(?:\|?\s*(set|tekrar|kg|ağırlık|agirlik|dinlenme)\b)/i.test(line))skipped.push(limit(line,160));
    }
    const usable=groups.filter(g=>g.exercises.length);
    const total=usable.reduce((sum,g)=>sum+g.exercises.length,0);
    return {groups:usable,skipped,matched:total,hasDayHeaders:numHeaders>0};
  }
  return {parseWorkoutText,parseExercise,normalizeName};
});
