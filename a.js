let tab='r',items=[],names={a:'Eu',b:'Amor'},db=null,form=null,cal=new Date(new Date().getFullYear(),new Date().getMonth(),1),selDay=null,needCode=false;
const $=s=>document.querySelector(s);
const R=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const who=k=>k==='a'?names.a:k==='b'?names.b:'Juntos';
const LS='contas-casal';
const CATS=['Moradia','Alimentação','Transporte','Lazer','Viagem','Saúde','Cartão','Outros'];
function dias(i){return Math.round((new Date(i.due+'T12:00')-new Date(new Date().toDateString()+' 12:00'))/864e5)}
function avisos(){return items.filter(i=>i.type==='debt'&&i.due&&i.paid<i.total).map(i=>({i,d:dias(i)})).filter(x=>x.d<=7).sort((a,b)=>a.d-b.d)}
function avisosHtml(){return avisos().map(({i,d})=>`<div class="alert ${d<0?'r':''}">${d<0?'⚠️ Atrasada há '+(-d)+' dia(s)':d===0?'⏰ Vence hoje':'🔔 Vence em '+d+' dia(s)'}: <b>${esc(i.name)}</b> · falta ${R(i.total-i.paid)}</div>`).join('')}
function mensal(){const m={};items.forEach(i=>(i.log||[]).forEach(l=>{const d=new Date(l.d),k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');m[k]=m[k]||{p:0,j:0};m[k][i.type==='debt'?'p':'j']+=l.v}));return Object.keys(m).sort().slice(-6).map(k=>({k,...m[k]}))}
function grafico(){const M=mensal();if(!M.length)return '<div class="mut">Registre pagamentos e depósitos para ver o gráfico.</div>';const mx=Math.max(...M.map(x=>Math.max(x.p,x.j)),1),w=300,h=120,bw=w/M.length;let g='';M.forEach((x,n)=>{const hp=x.p/mx*(h-20),hj=x.j/mx*(h-20),x0=n*bw+bw*.12;g+=`<rect x="${x0}" y="${h-hp}" width="${bw*.36}" height="${hp}" rx="3" fill="var(--ac)"/><rect x="${x0+bw*.38}" y="${h-hj}" width="${bw*.36}" height="${hj}" rx="3" fill="var(--ok)"/><text x="${n*bw+bw/2}" y="${h+14}" font-size="10" text-anchor="middle" fill="var(--mut)">${x.k.slice(5)}/${x.k.slice(2,4)}</text>`});return `<svg viewBox="0 0 ${w} ${h+20}" width="100%" role="img">${g}</svg><div class="mut"><span style="color:var(--ac)">■</span> Pago em dívidas &nbsp; <span style="color:var(--ok)">■</span> Juntado nas metas</div>`}
function porCat(){const c={};items.filter(i=>i.type==='debt').forEach(i=>{const k=i.cat||'Outros';c[k]=(c[k]||0)+Math.max(0,i.total-i.paid)});const e=Object.entries(c).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]),t=e.reduce((s,x)=>s+x[1],0)||1;return e.map(([k,v])=>`<div style="margin-top:8px"><div class="row"><span>${esc(k)}</span><b>${R(v)}</b></div><div class="bar d"><i style="width:${v/t*100}%"></i></div></div>`).join('')||'<div class="mut">Nada pendente 🎉</div>'}
function notas(){const L=items.filter(i=>i.type==='note').sort((a,b)=>b.ts-a.ts);return `<button style="width:100%;margin-bottom:12px" onclick="newNote()">+ Nova nota</button>`+(L.map(i=>`<div class="card"><div class="row"><b>${esc(i.name||'Sem título')}</b><span class="mut">${new Date(i.ts).toLocaleDateString('pt-BR')} · ${who(i.who)}</span></div><div style="white-space:pre-wrap;margin-top:6px">${esc(i.text)}</div><div style="margin-top:8px;text-align:right"><button class="x" onclick="edit('${i.id}')">Editar</button><button class="x" onclick="del('${i.id}')">🗑</button></div></div>`).join('')||'<div class="empty">Nenhuma nota ainda.</div>')}
const pad=n=>String(n).padStart(2,'0');
function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function br(s){return new Date(s+'T12:00').toLocaleDateString('pt-BR')}
function mes(n){cal=new Date(cal.getFullYear(),cal.getMonth()+n,1);render()}
function agenda(){
  if(!selDay)selDay=ymd(new Date());
  const y=cal.getFullYear(),m=cal.getMonth(),first=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate(),hoje=ymd(new Date());
  const ev=items.filter(i=>i.type==='event'),dv=items.filter(i=>i.type==='debt'&&i.due&&i.paid<i.total);
  let c=['D','S','T','Q','Q','S','S'].map(x=>`<div class="wd">${x}</div>`).join('');
  for(let k=0;k<first;k++)c+='<div></div>';
  for(let d=1;d<=n;d++){const s=y+'-'+pad(m+1)+'-'+pad(d);
    c+=`<button class="day ${s===hoje?'hoje':''} ${s===selDay?'sel':''}" onclick="selDay='${s}';render()">${d}<span class="dots">${ev.some(x=>x.date===s)?'<i></i>':''}${dv.some(x=>x.due===s)?'<i class="dv"></i>':''}</span></button>`}
  const dia=ev.filter(x=>x.date===selDay).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const contas=dv.filter(x=>x.due===selDay);
  const lst=dia.map(i=>`<div class="card"><div class="row"><b>${i.time?esc(i.time)+' · ':''}${esc(i.name)}</b><span class="tag">${who(i.who)}</span></div>${i.note?`<div class="mut">${esc(i.note)}</div>`:''}<div style="text-align:right"><button class="x" onclick="edit('${i.id}')">Editar</button><button class="x" onclick="del('${i.id}')">🗑</button></div></div>`).join('')
   +contas.map(i=>`<div class="alert">💸 Vence: <b>${esc(i.name)}</b> · falta ${R(i.total-i.paid)}</div>`).join('');
  return `<div class="card"><div class="row" style="margin-bottom:10px"><button class="g s" onclick="mes(-1)">‹</button><b style="text-transform:capitalize">${cal.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</b><button class="g s" onclick="mes(1)">›</button></div><div class="cal">${c}</div>
  <div class="mut" style="margin-top:8px"><span style="color:var(--ok)">●</span> compromisso &nbsp; <span style="color:var(--warn)">●</span> vencimento de conta</div></div>
  <div class="row" style="margin-bottom:10px"><b>${br(selDay)}</b><button class="s" onclick="newEvent()">+ Compromisso</button></div>${lst||'<div class="empty">Nada neste dia.</div>'}`;
}
function newEvent(){form={type:'event',name:'',date:selDay||ymd(new Date()),time:'',who:'j',note:'',isNew:true};render()}
function evAvisosHtml(){const h=ymd(new Date()),a=ymd(new Date(Date.now()+864e5));return items.filter(i=>i.type==='event'&&(i.date===h||i.date===a)).sort((x,y)=>(x.date+(x.time||'')).localeCompare(y.date+(y.time||''))).map(i=>`<div class="alert">📅 ${i.date===h?'Hoje':'Amanhã'}${i.time?' às '+esc(i.time):''}: <b>${esc(i.name)}</b></div>`).join('')}
function newNote(){form={type:'note',name:'',text:'',who:'j',isNew:true};render()}
function lsLoad(){try{const d=JSON.parse(localStorage.getItem(LS)||'{}');items=d.items||[];names=d.names||names}catch(e){}}
function lsSave(){try{localStorage.setItem(LS,JSON.stringify({items,names}))}catch(e){}}
async function save(it){
  if(db){try{await db.collection('items').doc(it.id).set(it)}catch(e){$('#st').textContent='Erro ao salvar'}}
  else{const i=items.findIndex(x=>x.id===it.id);i<0?items.push(it):items[i]=it;lsSave();render()}
}
function del(id){form={type:'del',id};render()}
async function doDel(id){form=null;
  if(db){try{await db.collection('items').doc(id).delete()}catch(e){}}
  else{items=items.filter(x=>x.id!==id);lsSave()}
  render()}
function go(t){tab=t;form=null;render()}
function render(){
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
  const nb=avisos().length;document.querySelector('nav button[data-t=d]').innerHTML='Dívidas'+(nb?`<span class="badge">${nb}</span>`:'');
  const F=form||(needCode?{type:'code'}:null);
  $('#v').innerHTML=F?formHtml(F):tab==='r'?resumo():tab==='d'?lista('debt'):tab==='m'?lista('goal'):tab==='a'?agenda():notas();
}
