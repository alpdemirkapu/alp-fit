'use strict';
(() => {
  const STORE_KEY = 'alpfit-app-data-v1';
  const APP_VERSION = 1; // Yerel veri şeması v1 kalır: mevcut kayıtlar silinmez.
  const APP_LABEL = '1.1';
  const $ = (selector) => document.querySelector(selector);
  const app = $('#app');
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const uid = () => 'id_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number = (value, fallback=0) => {const n = Number(value); return Number.isFinite(n) ? n : fallback;};
  const fmt = (num, digits=0) => number(num).toLocaleString('tr-TR',{maximumFractionDigits:digits});
  const round = value => Math.round(number(value)*10)/10;
  const dateLabel = date => new Date(date+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'});
  const dateShort = date => new Date(date+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'short'});
  const offsetDate = (date, delta) => {const d = new Date(date+'T12:00:00'); d.setDate(d.getDate()+delta);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  // Mevcut v1 kayıt anahtarı değişmiyor; sürüm yükseltme yalnızca eksik alanları ekler.
  const initialProfile = () => ({heightCm:173,weightKg:78,age:31,sex:'male',activity:'moderate',goal:'lose',confirmed:false});
  const initialDay = n => ({id:`day${n}`,name:`${n}. Gün`,focus:'Hareketleri ekle',exercises:[]});
  const emptyData = () => ({version:APP_VERSION,accent:'lime',goals:{calories:null,protein:null},
    days:[1,2,3,4,5].map(initialDay),workoutLogs:{},foodLogs:{},customFoods:[],weightLogs:{},profile:initialProfile()});
  function normalizeData(d){
    if(!d || d.version!==APP_VERSION || !Array.isArray(d.days) || !d.workoutLogs || !d.foodLogs || !d.goals) return emptyData();
    d.profile={...initialProfile(),...(d.profile||{})};
    d.days=d.days.filter(day=>day && typeof day==='object');
    // İlk üç günün adları, hareketleri, setleri ve log ID'leri aynen korunur.
    for(let n=d.days.length+1;n<=5;n++) d.days.push(initialDay(n));
    if(!d.weightLogs || typeof d.weightLogs!=='object') d.weightLogs={};
    if(!Array.isArray(d.customFoods)) d.customFoods=[];
    if(!['lime','blue','orange'].includes(d.accent))d.accent='lime';
    return d;
  }
  function load(){try{return normalizeData(JSON.parse(localStorage.getItem(STORE_KEY)));}catch(e){return emptyData();}}
  let data=load();
  let view='home', selectedDate=today(), selectedDayId=data.days[0]?.id || 'day1', timerUntil=0, timerSeconds=0, toastTimeout=0;
  const foodLibrary = [
    {id:'oats',name:'Yulaf ezmesi',emoji:'🥣',unit:'g',base:100,kcal:389,p:16.9,c:66.3,f:6.9},
    {id:'nesquik',name:'Nesquik gevrek (tahmini)',emoji:'🍫',unit:'g',base:100,kcal:382,p:8,c:77,f:3.1},
    {id:'milk',name:'Az yağlı süt',emoji:'🥛',unit:'ml',base:100,kcal:47,p:3.4,c:4.8,f:1.5},
    {id:'eggwhite',name:'Yumurta beyazı',emoji:'🥚',unit:'adet',base:1,kcal:17,p:3.6,c:0.2,f:0.1},
    {id:'chicken',name:'Tavuk göğsü, pişmiş',emoji:'🍗',unit:'g',base:100,kcal:165,p:31,c:0,f:3.6},
    {id:'rice',name:'Beyaz pirinç, pişmiş',emoji:'🍚',unit:'g',base:100,kcal:130,p:2.7,c:28.2,f:0.3},
    {id:'yogurt',name:'Yoğurt, sade',emoji:'🥄',unit:'g',base:100,kcal:61,p:3.5,c:4.7,f:3.3},
    {id:'banana',name:'Muz',emoji:'🍌',unit:'g',base:100,kcal:89,p:1.1,c:22.8,f:0.3},
    {id:'salmon',name:'Somon, pişmiş',emoji:'🐟',unit:'g',base:100,kcal:206,p:22.1,c:0,f:12.4},
    {id:'tuna',name:'Ton balığı, suda',emoji:'🐟',unit:'g',base:100,kcal:116,p:25.5,c:0,f:0.8},
    {id:'apple',name:'Elma',emoji:'🍎',unit:'g',base:100,kcal:52,p:0.3,c:13.8,f:0.2},
    {id:'bread',name:'Tam buğday ekmeği',emoji:'🍞',unit:'g',base:100,kcal:247,p:13,c:41,f:4.2}
  ];
  const foodById = id => [...foodLibrary,...data.customFoods].find(food => food.id===id);
  const meals = ['Öğün 1','Öğün 2','Ara öğün','Diğer'];
  function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(data));return true;}catch(err){toast('Kayıt yapılamadı. Depolama alanını kontrol et.');return false;}}
  function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),2600);}
  function getDay(){return data.days.find(d=>d.id===selectedDayId) || data.days[0];}
  function sessionKey(dayId=selectedDayId,date=selectedDate){return `${date}|${dayId}`;}
  function getSession(dayId=selectedDayId,date=selectedDate){return data.workoutLogs[sessionKey(dayId,date)] || {sets:{},completedAt:null};}
  function getFoods(date=selectedDate){return Array.isArray(data.foodLogs[date])?data.foodLogs[date]:[];}
  function nutritionTotals(date=selectedDate){return getFoods(date).reduce((a,item)=>{for(const k of ['kcal','p','c','f']) a[k]+=number(item[k])*number(item.amount)/number(item.base,100);return a;},{kcal:0,p:0,c:0,f:0});}
  function sessionStats(day,date=selectedDate){const log=getSession(day.id,date);const total=day.exercises.reduce((n,ex)=>n+number(ex.sets),0);const done=day.exercises.reduce((n,ex)=>n+Array.from({length:number(ex.sets)},(_,i)=>log.sets?.[ex.id+'-'+i]?.done?1:0).reduce((a,b)=>a+b,0),0);return {done,total,completed:!!log.completedAt};}
  const pct = (val,target) => target>0?Math.max(0,Math.min(100,Math.round(val/target*100))):0;
  function sectionTitle(text, extra=''){return `<div class="section-title"><h2>${text}</h2>${extra}</div>`;}
  function bodyEstimate(profile=data.profile){
    const h=number(profile.heightCm), w=number(profile.weightKg), age=number(profile.age);
    if(!(h>=130&&h<=220&&w>=30&&w<=250&&age>=18&&age<=90&&['male','female'].includes(profile.sex))) return null;
    const activityFactors={sedentary:1.2,light:1.375,moderate:1.55,high:1.725};
    const factor=activityFactors[profile.activity]||1.375;
    const rmr=10*w+6.25*h-5*age+(profile.sex==='male'?5:-161);
    const tdee=rmr*factor;
    const g=['lose','maintain','gain'].includes(profile.goal)?profile.goal:'maintain';
    const energyFactor={lose:.85,maintain:1,gain:1.08}[g];
    const proteinFactor={lose:2,maintain:1.6,gain:1.8}[g];
    return {bmi:w/((h/100)**2),rmr:Math.round(rmr),tdee:Math.round(tdee),
      calories:Math.round(tdee*energyFactor/10)*10,
      protein:Math.round(w*proteinFactor/5)*5,goal:g,proteinFactor};
  }
  function currentBmiInfo(){const x=bodyEstimate();return x?`<span class="pill muted-pill">VKİ ${fmt(x.bmi,1)}</span>`:'';}
  function goalsSummary(){const totals=nutritionTotals();const cals=data.goals.calories,p=data.goals.protein;
    const diffC=cals>0?(cals>=totals.kcal?`${fmt(cals-totals.kcal)} kcal kaldı`:`${fmt(totals.kcal-cals)} kcal üstünde`):'Hedef henüz ayarlanmadı';
    const diffP=p>0?(p>=totals.p?`${fmt(p-totals.p,1)} g kaldı`:`${fmt(totals.p-p,1)} g üstünde`):'Hedef henüz ayarlanmadı';
    return `<div class="stats">
    <div class="stat"><div class="lbl">🔥 Günlük kalori</div><div class="num">${fmt(totals.kcal)} <small>kcal</small></div><div class="sub">${cals ? `Hedef ${fmt(cals)} kcal · ${diffC}`:diffC}</div><div class="progress"><span style="width:${pct(totals.kcal,cals)}%"></span></div></div>
    <div class="stat"><div class="lbl">💪 Günlük protein</div><div class="num">${fmt(totals.p,1)} <small>g</small></div><div class="sub">${p ? `Hedef ${fmt(p)} g · ${diffP}`:diffP}</div><div class="progress"><span style="width:${pct(totals.p,p)}%"></span></div></div>
  </div>`;}
  function dateNav(){return `<div class="date-nav"><button class="mini-btn" data-action="prev-date" aria-label="Önceki gün">‹</button><input type="date" id="date-select" value="${esc(selectedDate)}" aria-label="Takip edilen tarih"><button class="mini-btn" data-action="next-date" aria-label="Sonraki gün">›</button><button class="mini-btn" data-action="today" title="Bugün" aria-label="Bugün">●</button></div>`;}
  function renderHome(){
    const sessions=Object.values(data.workoutLogs).filter(s=>s.completedAt).length;
    const logsToday=data.days.map(d=>({...sessionStats(d),day:d}));
    const anyFinished=logsToday.find(x=>x.completed), anyInProgress=logsToday.find(x=>x.done>0 && !x.completed);
    app.innerHTML = `<p class="eyebrow">KİŞİSEL TAKİP ASİSTANIN</p><h1>Her tekrar, <span style="color:var(--accent)">ileri.</span></h1><p class="lead">${esc(dateLabel(selectedDate))} · Antrenmanını ve beslenmeni tek yerden yönet.</p>
      <div class="hero"><div><div class="eyebrow" style="color:#3a5c0b">BUGÜNÜN PLANI</div><h2>${anyFinished?'Antrenman tamamlandı!':anyInProgress?'Güzel gidiyorsun. Devam!':'Hazırsan başlayalım.'}</h2><p>${anyFinished?esc(anyFinished.day.name)+' tamamlandı.':anyInProgress?`${anyInProgress.done} seti bitirdin.`:'Hareketlerini ve yediklerini kaydet. Küçük adımlar fark yaratır.'}</p><button class="secondary" data-nav="workout" style="margin-top:14px;background:#122008;color:#efffd8;border:0;min-height:38px">Antrenmana git →</button></div><div class="hero-art" aria-hidden="true">✦</div></div>
      ${dateNav()}${goalsSummary()}
      ${sectionTitle('Hızlı işlemler')}<div class="quick-grid">
      <button class="quick" data-nav="workout"><span class="emoji">🏋️</span><strong>Antrenman</strong><small>Set & ağırlık kaydet</small></button>
      <button class="quick" data-action="favorite-breakfast"><span class="emoji">🥣</span><strong>Kahvaltı ekle</strong><small>Hazır tarif, tek dokunuş</small></button>
      <button class="quick" data-action="open-food"><span class="emoji">🍽️</span><strong>Öğün kaydet</strong><small>Kalori & makrolar</small></button>
      <button class="quick" data-nav="progress"><span class="emoji">📈</span><strong>Gelişimim</strong><small>${sessions} tamamlanan antrenman</small></button>
      </div>
      ${sectionTitle('Programın',`<button class="ghost" data-nav="workout">Tümünü gör →</button>`)}
      ${data.days.map((d,i)=>{const s=sessionStats(d);return `<div class="card between"><div><div class="eyebrow" style="margin-bottom:6px">GÜN ${i+1}</div><h3>${esc(d.name)}</h3><p class="hint">${esc(d.focus)} · ${d.exercises.length} hareket</p></div><div style="text-align:right"><span class="pill ${s.completed?'':'muted-pill'}">${s.completed?'✓ Bitti':s.total?`${s.done}/${s.total} set`:'Boş'}</span><div style="margin-top:10px"><button class="secondary" data-action="select-day" data-id="${esc(d.id)}">Aç →</button></div></div></div>`;}).join('')}`;
  }
  function renderWorkout(){
    const day=getDay(), sess=getSession(), stats=sessionStats(day);
    app.innerHTML=`<p class="eyebrow">ANTRENMAN TAKİBİ</p><h1>Programım</h1><p class="lead">Hareketlerini düzenle; her setin ağırlığını ve tekrarını kaydet.</p>${dateNav()}
      <div class="chips">${data.days.map((d,i)=>`<button class="${d.id===day.id?'active':''}" data-action="select-day" data-id="${esc(d.id)}">${esc(d.name)}</button>`).join('')}</div>
      <div class="card"><div class="between"><div><div class="eyebrow">SEÇİLİ GÜN</div><h2>${esc(day.name)}</h2><p class="hint">${esc(day.focus)}</p></div><button class="icon-mini" data-action="edit-day" title="Günü düzenle" aria-label="Günü düzenle">✎</button></div>
      <div class="kpi-list"><span class="pill">${day.exercises.length} hareket</span><span class="pill">${stats.done} / ${stats.total} set</span>${sess.completedAt?'<span class="pill">✓ Tamamlandı</span>':''}</div><div class="progress"><span style="width:${pct(stats.done,stats.total)}%"></span></div></div>
      ${sectionTitle('Hareketler',`<button class="secondary" data-action="add-exercise">+ Hareket ekle</button>`)}
      ${day.exercises.length?day.exercises.map((ex,k)=>renderExercise(ex,k,sess)).join(''):`<div class="empty"><div class="emoji">🏋️</div><strong>Bu günün hareketleri henüz eklenmedi</strong><p>Önce konuştuğumuz programın ayrıntıları burada mevcut değil. Hareketlerini ekleyerek gerçek programını oluşturabilirsin.</p><button class="primary" data-action="add-exercise">+ İlk hareketi ekle</button></div>`}
      ${day.exercises.length?`<div class="button-row"><button class="primary" data-action="complete-session">${sess.completedAt?'✓ Tamamlandı · Tekrar kaydet':'✓ Antrenmanı tamamla'}</button></div>`:''}
      <p class="hint" style="margin-top:16px">Setleri işaretlediğinde kayıt otomatik saklanır. Ağırlık ve tekrar alanlarını da değiştirebilirsin. ${sess.completedAt?'Tamamlanan seansı değiştirebilirsin.':''}</p>`;
  }
  function renderExercise(ex,index,sess){
    const sets=number(ex.sets), keys=Array.from({length:sets},(_,i)=>`${ex.id}-${i}`);
    const done=keys.filter(k=>sess.sets?.[k]?.done).length;
    return `<div class="card exercise"><div class="exercise-head"><div class="exercise-icon">${index+1}</div><div class="grow"><h3>${esc(ex.name)}</h3><div class="exercise-meta">${sets} set · ${esc(ex.reps)} tekrar · ${number(ex.rest)} sn dinlenme</div></div><div class="exercise-actions"><button class="icon-mini" data-action="edit-exercise" data-id="${esc(ex.id)}" title="Düzenle" aria-label="Hareketi düzenle">✎</button><button class="icon-mini" data-action="delete-exercise" data-id="${esc(ex.id)}" title="Sil" aria-label="Hareketi sil">✕</button></div></div>
      <div class="set-head"><span>SET</span><span>KG</span><span>TEKRAR</span><span>BİTTİ</span></div>
      ${keys.map((key,i)=>{const s=sess.sets?.[key]||{};return `<div class="set-row ${s.done?'done':''}"><span class="set-n">${i+1}. set</span><input type="number" inputmode="decimal" min="0" max="1000" step="0.5" placeholder="—" aria-label="${esc(ex.name)} ${i+1}. set kilo" data-set-field="weight" data-exid="${esc(ex.id)}" data-setindex="${i}" value="${esc(s.weight ?? ex.weight ?? '')}"><input type="number" inputmode="numeric" min="0" max="1000" step="1" placeholder="${esc(ex.reps)}" aria-label="${esc(ex.name)} ${i+1}. set tekrar" data-set-field="reps" data-exid="${esc(ex.id)}" data-setindex="${i}" value="${esc(s.reps ?? '')}"><div class="set-check"><input type="checkbox" aria-label="${esc(ex.name)} ${i+1}. set tamamlandı" data-set-field="done" data-exid="${esc(ex.id)}" data-setindex="${i}" ${s.done?'checked':''}></div></div>`;}).join('')}
      <div class="between" style="margin-top:14px"><span class="tiny muted">${done}/${sets} set tamamlandı</span><button class="ghost" style="min-height:34px;padding:6px 10px" data-action="start-rest" data-seconds="${number(ex.rest,90)}">⏱ ${number(ex.rest,90)} sn dinlenme</button></div></div>`;
  }
  function renderNutrition(){
    const totals=nutritionTotals(), items=getFoods();
    app.innerHTML=`<p class="eyebrow">BESLENME TAKİBİ</p><h1>Beslenmem</h1><p class="lead">Öğünlerini kaydet; kalori ve makrolarını gör. Değerler yaklaşık hesaplanır.</p>${dateNav()}${goalsSummary()}
      <div class="macro-row"><div class="macro"><strong>${fmt(totals.c,1)} g</strong><small>Karbonhidrat</small></div><div class="macro"><strong>${fmt(totals.f,1)} g</strong><small>Yağ</small></div><div class="macro"><strong>${fmt(totals.p,1)} g</strong><small>Protein</small></div></div>
      ${sectionTitle('Hızlı ekle')}<div class="card"><div class="between" style="align-items:flex-start"><div class="grow"><h3>🥣 Alıştığım kahvaltı</h3><p class="hint">50 g yulaf + 50 g Nesquik gevrek + 200 ml az yağlı süt</p><p class="hint">Yumurta beyazını ayrıca ekleyebilirsin.</p></div><button class="primary" data-action="favorite-breakfast">+ Ekle</button></div></div>
      <div class="button-row"><button class="primary" data-action="open-food">+ Besin ekle</button><button class="secondary" data-action="custom-food">+ Yeni besin tanımla</button></div>
      ${meals.map(meal=>{
         const list=items.filter(item=>item.meal===meal);const subtotal=list.reduce((a,it)=>{const n=number(it.amount)/number(it.base,100);a.kcal+=number(it.kcal)*n;a.p+=number(it.p)*n;return a;},{kcal:0,p:0});
         return `${sectionTitle(esc(meal),`<span class="small muted">${fmt(subtotal.kcal)} kcal · ${fmt(subtotal.p,1)} g protein</span>`)}<div class="card">${list.length?list.map(item=>foodRow(item)).join(''):`<div class="small muted">Bu öğünde henüz kayıt yok.</div>`}</div>`;
      }).join('')}
      <p class="hint">Besin değerleri ürün, marka ve pişirme şekline göre değişir. Paket üzerindeki değerleri temel alarak kendi besinini tanımlayabilirsin.</p>`;
  }
  function foodRow(it){const kcal=number(it.kcal)*number(it.amount)/number(it.base,100); const p=number(it.p)*number(it.amount)/number(it.base,100);
    return `<div class="food-item"><div class="food-icon">${esc(it.emoji||'🍽️')}</div><div class="grow"><div class="food-name">${esc(it.name)}</div><div class="food-desc">${fmt(it.amount,1)} ${esc(it.unit)} · ${fmt(p,1)} g protein</div></div><div class="food-cal">${fmt(kcal)}<small>kcal</small></div><button class="icon-mini" data-action="edit-food-entry" data-id="${esc(it.id)}" title="Düzenle" aria-label="Düzenle">✎</button><button class="icon-mini" data-action="delete-food-entry" data-id="${esc(it.id)}" title="Sil" aria-label="Sil">✕</button></div>`;
  }
  function renderProgress(){
    const allSessions=Object.entries(data.workoutLogs).map(([key,log])=>({key,...log})).filter(log=>log.completedAt).sort((a,b)=>(b.completedAt||'').localeCompare(a.completedAt||''));
    const weightEntries=Object.entries(data.weightLogs).filter(([,w])=>number(w)>0).sort(([a],[b])=>a.localeCompare(b));
    const last14=Array.from({length:14},(_,i)=>offsetDate(today(),i-13)); const values=last14.map(d=>nutritionTotals(d).kcal); const maxV=Math.max(1,...values);
    const bars=last14.map((day,i)=>`<div class="bar-day" title="${esc(dateShort(day))}: ${fmt(values[i])} kcal"><div class="bar" style="height:${Math.max(2,Math.round(values[i]/maxV*112))}px"></div><small>${i%2===0?esc(new Date(day+'T12:00:00').getDate()):'·'}</small></div>`).join('');
    const totalSets=allSessions.reduce((a,s)=>a+Object.values(s.sets||{}).filter(x=>x.done).length,0);
    app.innerHTML=`<p class="eyebrow">İLERLEME TABLOSU</p><h1>Gelişimim</h1><p class="lead">Kaydettiğin verilerle ilerlemeni takip et.</p><div class="stats"><div class="stat"><div class="lbl">Bitirilen antrenman</div><div class="num">${allSessions.length}</div></div><div class="stat"><div class="lbl">Tamamlanan set</div><div class="num">${totalSets}</div></div></div>
       ${sectionTitle('Vücut ağırlığı',`<button class="secondary" data-action="add-weight">+ Kilo kaydet</button>`)}
       <div class="card"><div class="kpi-list" style="margin-top:0;margin-bottom:12px">${currentBmiInfo()}<button class="ghost" data-nav="settings" style="min-height:32px;padding:5px 10px">Boy / hedef hesabı →</button></div>${weightEntries.length?weightChart(weightEntries.slice(-15)):'<div class="empty" style="margin:0"><div class="emoji">⚖️</div><strong>Henüz kilo kaydı yok</strong><p>Ölçüm eklediğinde değişimi grafik üzerinde göreceksin.</p></div>'}${weightEntries.length?`<div class="between"><span class="small muted">Son ölçüm: ${esc(dateShort(weightEntries.at(-1)[0]))}</span><strong>${fmt(weightEntries.at(-1)[1],1)} kg</strong></div>`:''}</div>
       ${sectionTitle('Son 14 gün · Kalori')}<div class="card"><div class="bars">${bars}</div><p class="chart-note">Çubuklar kaydettiğin öğünlerin toplamını gösterir; boş günler sıfırdır.</p></div>
       ${sectionTitle('Antrenman geçmişi')}<div class="card">${allSessions.length?allSessions.slice(0,20).map(log=>{const day=data.days.find(d=>d.id===log.dayId);const done=Object.values(log.sets||{}).filter(x=>x.done).length;return `<div class="food-item"><div class="food-icon">✓</div><div class="grow"><div class="food-name">${esc(day?.name||'Silinmiş gün')}</div><div class="food-desc">${esc(dateShort(log.date))} · ${done} set</div></div><span class="pill">Bitti</span></div>`;}).join(''):'<p class="small muted" style="margin:0">Henüz tamamlanan antrenman yok.</p>'}</div>`;
  }
  function weightChart(entries){
    if(entries.length<2) return `<p class="small muted">Grafik için ikinci ölçümü ekle. İlk kayıt: ${fmt(entries[0][1],1)} kg.</p>`;
    const weights=entries.map(([,w])=>number(w)); const low=Math.min(...weights)-0.7, high=Math.max(...weights)+0.7;const width=330,height=135,pad=18;
    const pts=entries.map(([,w],i)=>({x:pad+(width-2*pad)*i/(entries.length-1),y:height-pad-(number(w)-low)/(high-low)*(height-2*pad)}));
    return `<svg class="weight-svg" viewBox="0 0 ${width} ${height+14}" role="img" aria-label="Vücut ağırlığı gelişim grafiği"><line x1="18" y1="${height-pad}" x2="312" y2="${height-pad}" stroke="#485950"/><polyline fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}"/>${pts.map(p=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="var(--accent)"/>`).join('')}<text x="18" y="${height+9}" fill="#92a29e" font-size="10">${esc(dateShort(entries[0][0]))}</text><text x="312" y="${height+9}" fill="#92a29e" font-size="10" text-anchor="end">${esc(dateShort(entries.at(-1)[0]))}</text></svg>`;
  }
  function renderSettings(){
    const p=data.profile||initialProfile(), estimate=p.confirmed?bodyEstimate(p):null;
    const goalNames={lose:'Yağ kaybı / kilo verme',maintain:'Kiloyu koruma',gain:'Kas kazanımı'};
    const goalDesc={lose:'Günlük enerji ihtiyacından yaklaşık %15 düşük',maintain:'Tahmini günlük enerji ihtiyacı kadar',gain:'Günlük enerji ihtiyacından yaklaşık %8 yüksek'};
    app.innerHTML=`<p class="eyebrow">KİŞİSELLEŞTİRME</p><h1>Ayarlar</h1><p class="lead">Vücut ölçülerine ve hedefine göre kalori ile protein ihtiyacını tahmin et.</p>
      ${sectionTitle('Vücut analizim')}<div class="card"><form data-form="body-profile">
      <div class="two-cols"><div class="field"><label for="profile-height">Boy (cm)</label><input id="profile-height" name="height" type="number" inputmode="decimal" min="130" max="220" step="0.1" required value="${esc(p.heightCm)}"></div><div class="field"><label for="profile-weight">Kilo (kg)</label><input id="profile-weight" name="weight" type="number" inputmode="decimal" min="30" max="250" step="0.1" required value="${esc(p.weightKg)}"></div></div>
      <div class="two-cols"><div class="field"><label for="profile-age">Yaş</label><input id="profile-age" name="age" type="number" min="18" max="90" step="1" inputmode="numeric" required value="${esc(p.age)}"></div><div class="field"><label for="profile-sex">Hesaplamada kullanılan cinsiyet</label><select id="profile-sex" name="sex"><option value="male" ${p.sex==='male'?'selected':''}>Erkek</option><option value="female" ${p.sex==='female'?'selected':''}>Kadın</option></select></div></div>
      <div class="field"><label for="profile-activity">Günlük hareketlilik düzeyi</label><select id="profile-activity" name="activity">
      <option value="sedentary" ${p.activity==='sedentary'?'selected':''}>Düşük · çoğunlukla oturuyorum</option>
      <option value="light" ${p.activity==='light'?'selected':''}>Hafif · gün içinde biraz hareket</option>
      <option value="moderate" ${p.activity==='moderate'?'selected':''}>Orta · hareketli yaşam + düzenli spor</option>
      <option value="high" ${p.activity==='high'?'selected':''}>Yüksek · çok hareketli yaşam / yoğun spor</option></select><p class="hint">Haftada 5 antrenman yapmak tek başına yüksek aktivite anlamına gelmez; gün boyu hareketini de hesaba kat.</p></div>
      <div class="field"><label for="profile-goal">Hedefim</label><select id="profile-goal" name="goal"><option value="lose" ${p.goal==='lose'?'selected':''}>Yağ kaybı / kilo verme</option><option value="maintain" ${p.goal==='maintain'?'selected':''}>Kilomu koruma</option><option value="gain" ${p.goal==='gain'?'selected':''}>Kas kazanımı</option></select></div>
      <button type="submit" class="primary wide">📐 Boy-kilo analizimi hesapla</button><p class="hint">Başlangıçtaki 173 cm, 78 kg ve 31 yaş değerleri önceden konuştuğumuz bilgilerdir; istersen değiştir.</p></form></div>
      ${estimate?`<div class="card analysis-results"><div class="between"><h3>Hedefine göre tahmini sonuç</h3><span class="pill">${esc(goalNames[estimate.goal])}</span></div>
      <div class="analysis-grid"><div><span class="small muted">Vücut kitle indeksi</span><strong>${fmt(estimate.bmi,1)}</strong><span class="tiny muted">kg/m² (kas oranını göstermez)</span></div><div><span class="small muted">Dinlenme enerjisi</span><strong>${fmt(estimate.rmr)}</strong><span class="tiny muted">kcal/gün</span></div><div><span class="small muted">Tahmini günlük ihtiyaç</span><strong>${fmt(estimate.tdee)}</strong><span class="tiny muted">kcal/gün</span></div></div>
      <p class="hint">${goalDesc[estimate.goal]}. Protein hesabı: ${fmt(estimate.proteinFactor,1)} g/kg.</p>
      <div class="suggestion"><div><span class="tiny">GÜNLÜK KALORİ</span><strong>${fmt(estimate.calories)} <small>kcal</small></strong></div><div><span class="tiny">GÜNLÜK PROTEİN</span><strong>${fmt(estimate.protein)} <small>g</small></strong></div></div>
      <button class="primary wide" data-action="apply-estimate">✓ Önerilen hedefleri beslenmeye uygula</button>
      <p class="hint">Hesaplama mevcut günlük hedeflerini otomatik değiştirmez. Bu butona basarsan uygular. Kilo veya aktivite değişiminde yeniden hesaplayabilirsin.</p></div>`:`<div class="card soft"><p class="small" style="margin:0">Boy, kilo, yaş ve hedef bilgilerini kontrol edip <strong>Hesapla</strong> tuşuna bas. Sonucu onayladıktan sonra beslenme ekranına aktarabilirsin.</p></div>`}
      ${sectionTitle('Günlük hedefler · elle düzenle')}<div class="card"><form data-form="goals"><div class="two-cols"><div class="field"><label for="goal-calories">Kalori (kcal)</label><input id="goal-calories" name="calories" type="number" inputmode="numeric" min="0" max="10000" placeholder="Henüz belirlenmedi" value="${data.goals.calories??''}"></div><div class="field"><label for="goal-protein">Protein (g)</label><input id="goal-protein" name="protein" type="number" inputmode="decimal" min="0" max="1000" step="0.1" placeholder="Henüz belirlenmedi" value="${data.goals.protein??''}"></div></div><button type="submit" class="secondary wide">Hedefleri elle kaydet</button><p class="hint">Otomatik önerileri kullanmak istemiyorsan kalori ve protein hedeflerini kendin girebilirsin.</p></form></div>
      ${sectionTitle('Tema rengi')}<div class="card"><div class="color-choice">${[['lime','#b8fb5b','Yeşil'],['blue','#8edcff','Mavi'],['orange','#ffc17f','Turuncu']].map(([id,color,name])=>`<button data-action="accent" data-id="${id}" class="${data.accent===id?'selected':''}"><span class="swatch" style="background:${color}"></span>${name}</button>`).join('')}</div></div>
      ${sectionTitle('Veri yedekleme')}<div class="card"><h3>📦 Kayıtların sende kalsın</h3><p class="hint" style="margin-bottom:16px">Kayıtlar bu cihazın yerel depolamasındadır. Güncellemeden veya telefon değiştirmeden önce JSON yedeğini özel bir alana indir.</p><div class="button-row"><button class="primary" data-action="export">↓ Yedek indir</button><button class="secondary" data-action="import">↑ Yedek yükle</button></div></div>
      ${sectionTitle('Hakkında')}<div class="card"><h3>ALP FIT v${APP_LABEL}</h3><p class="hint">Ücretsiz, reklamsız, çevrimdışı çalışabilen kişisel web uygulaması. Hesap veya bulut senkronizasyonu yoktur. Başka cihazdaki kayıtlar otomatik gelmez.</p><p class="hint">Besin değerleri yaklaşık tahminidir. Kalori hesabı Mifflin–St Jeor formülü ve aktivite katsayısı kullanır; bireysel ihtiyaçtan farklı olabilir. Protein miktarı sağlıklı, direnç egzersizi yapan yetişkinler için genel hedef niteliğindedir. VKİ kas/yağ ayrımı yapmaz. Tıbbi öneri yerine geçmez.</p></div>
      <div class="card"><h3 style="color:var(--danger)">Tehlikeli bölge</h3><p class="hint" style="margin-bottom:12px">Sıfırlamak tüm antrenman, yemek ve kilo kayıtlarını bu cihazdan siler. Önce yedek al.</p><button class="danger-button" data-action="reset">Tüm verileri sıfırla</button></div>`;
  }
  function render(){
    document.documentElement.dataset.accent=data.accent||'lime';
    $('#today-chip').textContent=new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'short'}).toUpperCase();
    const tabs=[['home','⌂','Ana Sayfa'],['workout','▣','Antrenman'],['nutrition','◉','Beslenme'],['progress','▥','Gelişim'],['settings','⚙','Ayarlar']];
    $('#bottom-nav').innerHTML=tabs.map(([id,ico,label])=>`<button class="nav-link ${view===id?'active':''}" data-nav="${id}" aria-current="${view===id?'page':'false'}"><span class="nav-icon" aria-hidden="true">${ico}</span>${label}</button>`).join('');
    ({home:renderHome,workout:renderWorkout,nutrition:renderNutrition,progress:renderProgress,settings:renderSettings}[view]||renderHome)();
  }
  function openDialog(title,body){$('#dialog-title').textContent=title;$('#dialog-content').innerHTML=body;$('#dialog-backdrop').hidden=false;document.body.style.overflow='hidden';const el=$('#dialog-content input, #dialog-content select');if(el) setTimeout(()=>el.focus(),80);}
  function closeDialog(){$('#dialog-backdrop').hidden=true;$('#dialog-content').innerHTML='';document.body.style.overflow='';}
  function moveTo(tab){view=tab;closeDialog();render();window.scrollTo({top:0,behavior:'instant'});}
  function editDay(){const d=getDay();openDialog('Antrenman gününü düzenle',`<form data-form="edit-day"><div class="field"><label>Gün adı</label><input name="name" maxlength="45" required value="${esc(d.name)}" placeholder="Örn. Göğüs & Triceps"></div><div class="field"><label>Odak / açıklama</label><input name="focus" maxlength="90" value="${esc(d.focus)}" placeholder="Örn. Üst vücut"></div><button class="primary wide" type="submit">Kaydet</button></form>`);}
  function exerciseForm(ex){const editing=!!ex;openDialog(editing?'Hareketi düzenle':'Yeni hareket ekle',`<form data-form="exercise" data-exid="${editing?esc(ex.id):''}">
      <div class="field"><label>Hareket adı</label><input name="name" required maxlength="70" placeholder="Örn. Bench Press" value="${esc(ex?.name||'')}"></div>
      <div class="two-cols"><div class="field"><label>Set sayısı</label><input type="number" name="sets" min="1" max="15" required value="${number(ex?.sets,3)}"></div><div class="field"><label>Tekrar hedefi</label><input type="text" name="reps" maxlength="15" required placeholder="Örn. 10-12" value="${esc(ex?.reps||'10')}"></div></div>
      <div class="two-cols"><div class="field"><label>Başlangıç ağırlığı (kg)</label><input type="number" name="weight" min="0" max="1000" step="0.5" inputmode="decimal" placeholder="İsteğe bağlı" value="${esc(ex?.weight??'')}"></div><div class="field"><label>Dinlenme (saniye)</label><input type="number" name="rest" min="10" max="900" required value="${number(ex?.rest,90)}"></div></div>
      <p class="hint" style="margin-bottom:16px">Hareketi ekledikten sonra her setin gerçek ağırlık ve tekrarını ayrıca girebilirsin.</p><button type="submit" class="primary wide">${editing?'Değişiklikleri kaydet':'Hareketi ekle'}</button></form>`);}
  function getFoodQuantity(food){return food.unit==='adet'?1:food.id==='milk'?200:food.id==='oats'||food.id==='nesquik'?50:100;}
  function foodForm(entry){const edit=!!entry;const foods=[...foodLibrary,...data.customFoods];
    openDialog(edit?'Öğün kaydını düzenle':'Besin kaydet',`<form data-form="food-entry" data-entryid="${esc(entry?.id||'')}">
      ${edit?`<div class="field"><label>Besin</label><input value="${esc(entry.name)}" disabled></div>`:`<div class="field"><label>Besin seç</label><select name="foodid" required>${foods.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('')}</select></div>`}
      <div class="two-cols"><div class="field"><label>Miktar <span id="unit-label">(${esc(entry?.unit||'g')})</span></label><input name="amount" type="number" min="0.1" max="10000" step="0.1" inputmode="decimal" required value="${esc(entry?.amount ?? 50)}"></div><div class="field"><label>Hangi öğün?</label><select name="meal">${meals.map(m=>`<option ${entry?.meal===m?'selected':''}>${esc(m)}</option>`).join('')}</select></div></div>
      <p class="hint" style="margin-bottom:16px">Kalori ve makrolar miktara göre hesaplanır. Etiket bilgileri yaklaşık olabilir.</p>
      <button type="submit" class="primary wide">${edit?'Kaydı güncelle':'Öğüne ekle'}</button></form>`);
    if(!edit){const sel=$('#dialog-content [name=foodid]');const update=()=>{const f=foodById(sel.value);$('#unit-label').textContent=`(${f?.unit||'g'})`;$('#dialog-content [name=amount]').value=getFoodQuantity(f);};sel.addEventListener('change',update);update();}
  }
  function customFoodForm(){openDialog('Özel besin tanımla',`<form data-form="custom-food"><div class="field"><label>Besin adı</label><input name="name" required maxlength="90" placeholder="Örn. Kullandığım protein tozu"></div>
      <div class="two-cols"><div class="field"><label>Birim</label><select name="unit"><option value="g">Gram</option><option value="ml">Mililitre</option><option value="adet">Adet</option></select></div><div class="field"><label>Bilgiler hangi miktar için?</label><input name="base" type="number" min="0.1" max="10000" step="0.1" value="100" required></div></div>
      <div class="two-cols"><div class="field"><label>Kalori (kcal)</label><input name="kcal" type="number" min="0" max="10000" step="0.1" required value="0"></div><div class="field"><label>Protein (g)</label><input name="p" type="number" min="0" max="1000" step="0.1" required value="0"></div><div class="field"><label>Karbonhidrat (g)</label><input name="c" type="number" min="0" max="1000" step="0.1" required value="0"></div><div class="field"><label>Yağ (g)</label><input name="f" type="number" min="0" max="1000" step="0.1" required value="0"></div></div>
      <p class="hint" style="margin-bottom:15px">Paketin üzerinde yazdığı porsiyon veya 100 g/ml değerlerini kullan.</p><button type="submit" class="primary wide">Besin kütüphaneme ekle</button></form>`);}
  function weightForm(){openDialog('Vücut ağırlığı kaydet',`<form data-form="weight"><div class="field"><label>Ölçüm tarihi</label><input type="date" name="date" value="${esc(selectedDate)}" required></div><div class="field"><label>Ağırlık (kg)</label><input type="number" name="weight" min="20" max="400" step="0.1" inputmode="decimal" required placeholder="Örn. 78,5" value="${esc(data.weightLogs[selectedDate]??'')}"></div><button class="primary wide" type="submit">Ölçümü kaydet</button></form>`);}
  function addFood(food,amount,meal='Öğün 1'){
    (data.foodLogs[selectedDate] ||= []).push({id:uid(),meal,name:food.name,emoji:food.emoji,unit:food.unit,base:food.base,amount, kcal:food.kcal,p:food.p,c:food.c,f:food.f});
  }
  function setValue(exid,setIndex,field,value){
    const log=(data.workoutLogs[sessionKey()] ||= {date:selectedDate,dayId:selectedDayId,sets:{},completedAt:null});
    const key=`${exid}-${setIndex}`;const record=(log.sets[key] ||= {});
    if(field==='done') record.done=!!value;
    else record[field]=value===''?'':Math.max(0,number(value));
    save(); if(field==='done') render();
  }
  function openRest(seconds){timerSeconds=Math.min(900,Math.max(10,number(seconds,90)));timerUntil=Date.now()+timerSeconds*1000;updateRest();toast(`${timerSeconds} saniyelik dinlenme başladı`);}
  function updateRest(){const remain=Math.max(0,Math.ceil((timerUntil-Date.now())/1000));const el=$('#timer-floating');if(!timerUntil){el.hidden=true;return;}
    if(remain===0){timerUntil=0;el.hidden=true;toast('Dinlenme bitti, sıradaki sete geç!');if('vibrate' in navigator) navigator.vibrate([160,70,160]);return;}
    el.hidden=false;const m=String(Math.floor(remain/60)).padStart(2,'0'), s=String(remain%60).padStart(2,'0');el.innerHTML=`<div class="between"><div><div class="tiny" style="font-weight:900;letter-spacing:.8px">DİNLENME SAYACI</div><strong style="font-size:23px;letter-spacing:1px">${m}:${s}</strong></div><button data-action="stop-rest">Durdur ✕</button></div>`;
  }
  setInterval(updateRest,500);
  function exportBackup(){const content=JSON.stringify({format:'ALP-FIT-BACKUP',exportedAt:new Date().toISOString(),data},null,2);const blob=new Blob([content],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=`alp-fit-yedek-${today()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);toast('Yedek dosyası oluşturuldu.');}
  function validBackup(parsed){const d=parsed?.format==='ALP-FIT-BACKUP'?parsed.data:parsed;
    if(!d||d.version!==1||!Array.isArray(d.days)||d.days.length<1||d.days.length>10||!d.goals||typeof d.workoutLogs!=='object'||!d.workoutLogs||typeof d.foodLogs!=='object'||!d.foodLogs||typeof d.weightLogs!=='object'||!d.weightLogs||!Array.isArray(d.customFoods))throw Error('ALP FIT yedeği değil.');
    for(const day of d.days){if(typeof day.name!=='string'||!Array.isArray(day.exercises)||day.exercises.length>80)throw Error('Geçersiz antrenman listesi.');for(const ex of day.exercises){if(!Number.isFinite(Number(ex.sets))||Number(ex.sets)>15||Number(ex.sets)<1)throw Error('Hatalı set sayısı.');}}
    d.goals.calories=d.goals.calories==null?null:Math.min(10000,Math.max(0,number(d.goals.calories)));
    d.goals.protein=d.goals.protein==null?null:Math.min(1000,Math.max(0,number(d.goals.protein)));
    d.accent=['lime','blue','orange'].includes(d.accent)?d.accent:'lime';return d;
  }
  async function importBackup(file){if(!file)return;if(file.size>2_000_000){toast('Dosya çok büyük (maksimum 2 MB).');return;}
    try{const parsed=JSON.parse(await file.text());const next=validBackup(parsed);if(!confirm('Bu yedek, şu anki bütün kayıtlarının üzerine yazacak. Devam edilsin mi?'))return;data=normalizeData(next);selectedDayId=data.days[0].id;save();render();toast('Yedek yüklendi.');}catch(e){toast('Yedek açılamadı: '+e.message);}finally{$('#import-file').value='';}
  }
  document.addEventListener('click',e=>{
    if(e.target.id==='dialog-backdrop') {closeDialog();return;}
    const close=e.target.closest('[data-close-dialog]');if(close){closeDialog();return;}
    const nav=e.target.closest('[data-nav]');if(nav){moveTo(nav.dataset.nav);return;}
    const btn=e.target.closest('[data-action]');if(!btn)return;
    const action=btn.dataset.action, id=btn.dataset.id;
    switch(action){
      case 'prev-date': selectedDate=offsetDate(selectedDate,-1);render();break;
      case 'next-date': selectedDate=offsetDate(selectedDate,1);render();break;
      case 'today': selectedDate=today();render();break;
      case 'select-day':selectedDayId=id;moveTo('workout');break;
      case 'edit-day':editDay();break;
      case 'add-exercise':exerciseForm(null);break;
      case 'edit-exercise':exerciseForm(getDay().exercises.find(ex=>ex.id===id));break;
      case 'delete-exercise':if(confirm('Bu hareketi programdan silmek istiyor musun? Geçmişteki kayıtların yedekte kalır.')){getDay().exercises=getDay().exercises.filter(ex=>ex.id!==id);save();render();toast('Hareket silindi.');}break;
      case 'start-rest':openRest(btn.dataset.seconds);break;
      case 'stop-rest':timerUntil=0;updateRest();break;
      case 'complete-session':{
        const day=getDay(),s=sessionStats(day);
        if(s.done<1){toast('Önce en az bir seti tamamla.');break;}
        const log=data.workoutLogs[sessionKey()];log.completedAt=new Date().toISOString();save();render();toast('Antrenman kaydedildi! 💪');break;
      }
      case 'favorite-breakfast':{
        if(!confirm('50 g yulaf, 50 g Nesquik gevrek ve 200 ml az yağlı sütü Öğün 1’e ekleyelim mi?'))break;
        addFood(foodById('oats'),50);addFood(foodById('nesquik'),50);addFood(foodById('milk'),200);save();render();toast('Kahvaltı eklendi!');break;
      }
      case 'open-food':foodForm(null);break;
      case 'custom-food':customFoodForm();break;
      case 'edit-food-entry':foodForm(getFoods().find(it=>it.id===id));break;
      case 'delete-food-entry':if(confirm('Bu öğün kaydı silinsin mi?')){data.foodLogs[selectedDate]=getFoods().filter(it=>it.id!==id);save();render();toast('Kayıt silindi.');}break;
      case 'add-weight':weightForm();break;
      case 'apply-estimate':{const estimate=bodyEstimate();if(!estimate || !data.profile.confirmed){toast('Önce vücut analizini hesapla.');break;}data.goals={calories:estimate.calories,protein:estimate.protein};save();render();toast('Kalori ve protein hedeflerin güncellendi!');break;}
      case 'accent':data.accent=id;save();render();toast('Tema güncellendi.');break;
      case 'export':exportBackup();break;
      case 'import':$('#import-file').click();break;
      case 'reset':if(confirm('TÜM kayıtlar silinecek. Önce yedek aldın mı?')&&confirm('Son kararın mı? Bütün veriler sıfırlanacak.')){data=emptyData();selectedDayId=data.days[0].id;selectedDate=today();save();moveTo('home');toast('Veriler sıfırlandı.');}break;
    }
  });
  document.addEventListener('change',e=>{
    const target=e.target;
    if(target.id==='date-select'){if(/^\d{4}-\d{2}-\d{2}$/.test(target.value)){selectedDate=target.value;render();}return;}
    if(target.dataset.setField){setValue(target.dataset.exid,target.dataset.setindex,target.dataset.setField,target.type==='checkbox'?target.checked:target.value);return;}
  });
  document.addEventListener('submit',e=>{
    const form=e.target.closest('form[data-form]');if(!form)return;e.preventDefault();const fd=new FormData(form);const val=name=>String(fd.get(name)??'').trim();
    switch(form.dataset.form){
      case 'body-profile':{
        const profile={heightCm:number(val('height')),weightKg:number(val('weight')),age:number(val('age')),
          sex:val('sex'),activity:val('activity'),goal:val('goal'),confirmed:true};
        if(!bodyEstimate(profile) || !['sedentary','light','moderate','high'].includes(profile.activity) || !['lose','maintain','gain'].includes(profile.goal)){
          toast('Boy, kilo, yaş ve aktivite bilgilerini kontrol et.');return;
        }
        data.profile=profile;save();render();toast('Analizin hesaplandı. Hedefi uygulamak için aşağıdaki butona bas.');
        break;
      }
      case 'goals': data.goals={calories:val('calories')?Math.max(0,number(val('calories'))):null,protein:val('protein')?Math.max(0,number(val('protein'))):null};save();render();toast('Hedefler kaydedildi.');break;
      case 'edit-day':{const day=getDay();day.name=val('name');day.focus=val('focus')||'Kişisel program';save();closeDialog();render();toast('Gün güncellendi.');break;}
      case 'exercise':{
        const day=getDay(),id=form.dataset.exid;const ex={id:id||uid(),name:val('name'),sets:Math.min(15,Math.max(1,number(val('sets'),3))),reps:val('reps'),weight:val('weight')===''?'':number(val('weight')),rest:Math.min(900,Math.max(10,number(val('rest'),90)))};
        if(!ex.name||!ex.reps){toast('Hareket adı ve tekrar sayısı gerekli.');return;}
        if(id){const i=day.exercises.findIndex(x=>x.id===id);if(i>=0)day.exercises[i]=ex;}else day.exercises.push(ex);
        save();closeDialog();render();toast(id?'Hareket güncellendi.':'Hareket eklendi.');break;
      }
      case 'food-entry':{
        const id=form.dataset.entryid, amount=number(val('amount'));if(amount<=0||amount>10000){toast('Geçerli miktar gir.');return;}
        const meal=val('meal');if(!meals.includes(meal))return;
        if(id){const item=getFoods().find(x=>x.id===id);if(!item)return;item.amount=amount;item.meal=meal;}
        else{const food=foodById(val('foodid'));if(!food){toast('Besin bulunamadı.');return;}addFood(food,amount,meal);}
        save();closeDialog();render();toast(id?'Öğün güncellendi.':'Besin eklendi.');break;
      }
      case 'custom-food':{
        const f={id:uid(),name:val('name'),emoji:'🍽️',unit:val('unit'),base:number(val('base')),kcal:number(val('kcal')),p:number(val('p')),c:number(val('c')),f:number(val('f'))};
        if(!f.name||f.base<=0||!['g','ml','adet'].includes(f.unit)){toast('Besin bilgilerini kontrol et.');return;}
        data.customFoods.push(f);save();closeDialog();render();toast('Yeni besin eklendi; öğün ekleme listesinden seçebilirsin.');break;
      }
      case 'weight':{
        const date=val('date'),weight=number(val('weight'));if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||weight<20||weight>400){toast('Geçerli tarih ve kilo gir.');return;}
        data.weightLogs[date]=weight;const dates=Object.keys(data.weightLogs).sort();if(dates.at(-1)===date){data.profile.weightKg=weight;data.profile.confirmed=false;}save();closeDialog();render();toast('Kilo kaydı eklendi. Güncel hedef için analizi yeniden hesapla.');break;
      }
    }
  });
  $('#import-file').addEventListener('change',e=>importBackup(e.target.files?.[0]));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDialog();});
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  save(); // Eksik gün/profil alanlarını ekleyerek eski kaydı aynı anahtarda güncelle.
  render();
})();
