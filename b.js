function resumo(){
  const D=items.filter(i=>i.type==='debt'),G=items.filter(i=>i.type==='goal');
  const tot=D.reduce((s,i)=>s+i.total,0),pg=D.reduce((s,i)=>s+i.paid,0),falta=tot-pg;
  const alvo=G.reduce((s,i)=>s+i.total,0),jun=G.reduce((s,i)=>s+i.paid,0);
  const mens=G.reduce((s,i)=>s+(i.monthly||0),0);
  let por=['a','b','j'].map(k=>{const f=D.filter(i=>i.who===k).reduce((s,i)=>s+i.total-i.paid,0);return `<div class="row"><span>${who(k)}</span><b>${R(f)}</b></div>`}).join('');
  const prox=D.filter(i=>i.paid<i.total&&i.due).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,3)
    .map(i=>`<div class="row"><span>${esc(i.name)}</span><span class="mut">${new Date(i.due+'T12:00').toLocaleDateString('pt-BR')}</span></div>`).join('');
  return avisosHtml()+evAvisosHtml()+`<div class="card"><div class="mut">Ainda devemos</div><div class="big" style="color:var(--ac)">${R(falta)}</div>
  <div class="bar d"><i style="width:${tot?pg/tot*100:0}%"></i></div><div class="mut">Já pagamos ${R(pg)} de ${R(tot)}</div></div>
  <div class="card"><div class="mut">Juntado nas metas</div><div class="big" style="color:var(--ok)">${R(jun)}</div>
  <div class="bar"><i style="width:${alvo?Math.min(100,jun/alvo*100):0}%"></i></div>
  <div class="mut">Objetivo total ${R(alvo)} · planejado ${R(mens)}/mês</div>
  ${mens>0&&alvo>jun?`<div class="pill">Com esse ritmo, ~${Math.ceil((alvo-jun)/mens)} meses para completar tudo</div>`:''}</div>
  <div class="card"><b>Quanto cada um deve</b><div style="margin-top:8px">${por}</div></div>
  <div class="card"><b>Dívidas por categoria</b>${porCat()}</div>
  <div class="card"><b>Evolução por mês</b><div style="margin-top:8px">${grafico()}</div></div>
  ${prox?`<div class="card"><b>Próximos vencimentos</b><div style="margin-top:8px">${prox}</div></div>`:''}`;
}
function lista(t){
  const L=items.filter(i=>i.type===t);
  const isD=t==='debt';
  const cards=L.map(i=>{
    const p=i.total?Math.min(100,i.paid/i.total*100):0,left=Math.max(0,i.total-i.paid);
    let extra='';
    if(!isD&&i.monthly>0&&left>0)extra=`<div class="pill">Faltam ${Math.ceil(left/i.monthly)} meses (${R(i.monthly)}/mês)</div>`;
    if(isD&&i.due&&left>0)extra=`<div class="mut">Vence em ${new Date(i.due+'T12:00').toLocaleDateString('pt-BR')}</div>`;
    const h=(i.log||[]).slice(-3).reverse().map(l=>`${new Date(l.d).toLocaleDateString('pt-BR')} · ${R(l.v)} · ${who(l.w)}`).join('<br>');
    return `<div class="card"><div class="row"><b>${esc(i.name)}</b><span class="tag">${esc(i.cat||'Outros')} · ${who(i.who)}</span></div>
    <div class="bar ${isD?'d':''}"><i style="width:${p}%"></i></div>
    <div class="row"><span class="mut">${isD?'Pago':'Juntado'} ${R(i.paid)} / ${R(i.total)}</span><b>${left?R(left):'✅ Concluído'}</b></div>
    ${extra}${i.note?`<div class="mut">${esc(i.note)}</div>`:''}${h?`<div class="hist">${h}</div>`:''}
    <div class="row" style="margin-top:10px"><button class="s" onclick="pay('${i.id}')">${isD?'+ Pagamento':'+ Depósito'}</button>
    <span><button class="x" onclick="edit('${i.id}')">Editar</button><button class="x" onclick="del('${i.id}')">🗑</button></span></div></div>`}).join('');
  return (isD?avisosHtml():'')+`<button style="width:100%;margin-bottom:12px" onclick="newItem('${t}')">+ ${isD?'Nova dívida / conta':'Nova meta'}</button>${cards||`<div class="empty">Nada por aqui ainda.</div>`}`;
}
function newItem(t){form={type:t,name:'',total:'',paid:0,who:'j',cat:'Outros',due:'',monthly:'',note:'',isNew:true};render()}
function edit(id){form={...items.find(i=>i.id===id)};render()}
function formHtml(f){
  const isD=f.type==='debt';
  if(f.type==='code')return `<div class="card"><b>Código do casal</b><div class="mut" style="margin:6px 0">Inventem um código e usem o mesmo nos dois celulares (só letras minúsculas, números e hífen). Ex: amor-isa-2026-xk39</div>
  <input id="f_k" placeholder="seu-codigo-aqui" autocapitalize="none" autocomplete="off"><button style="width:100%" onclick="setCode()">Entrar</button></div>`;
  if(f.type==='del')return `<div class="card"><b>Apagar este item?</b><div class="g2" style="margin-top:12px"><button class="g" onclick="form=null;render()">Cancelar</button><button onclick="doDel('${f.id}')">Apagar</button></div></div>`;
  if(f.type==='pay')return `<div class="card"><b>${esc(f.name)}</b><br><br><label>Quanto (R$)</label><input id="f_v" type="number" step="0.01" inputmode="decimal">
  <label>Quem</label><select id="f_w"><option value="a">${esc(names.a)}</option><option value="b">${esc(names.b)}</option><option value="j" selected>Juntos</option></select>
  <div class="g2"><button class="g" onclick="form=null;render()">Cancelar</button><button onclick="doPay('${f.id}')">Salvar</button></div></div>`;
  if(f.type==='cfg')return `<div class="card"><b>Configurações</b><br><br><label>Seu nome</label><input id="f_a" value="${esc(names.a)}"><label>Nome do seu namorado(a)</label><input id="f_b" value="${esc(names.b)}">
  <div class="g2"><button class="g" onclick="form=null;render()">Cancelar</button><button onclick="doCfg()">Salvar</button></div>
  <button class="g" style="width:100%;margin-top:12px" onclick="try{localStorage.removeItem('casal-code')}catch(e){};location.reload()">Trocar código do casal</button></div>`;
  if(f.type==='event')return `<div class="card"><b>${f.isNew?'Novo compromisso':'Editar compromisso'}</b><br><br>
  <label>O que é</label><input id="f_n" value="${esc(f.name)}" placeholder="Ex: Jantar, consulta, pagar boleto">
  <div class="g2"><div><label>Data</label><input id="f_dt" type="date" value="${f.date}"></div><div><label>Hora (opcional)</label><input id="f_h" type="time" value="${f.time||''}"></div></div>
  <label>De quem é</label><select id="f_w"><option value="a" ${f.who==='a'?'selected':''}>${esc(names.a)}</option><option value="b" ${f.who==='b'?'selected':''}>${esc(names.b)}</option><option value="j" ${f.who==='j'?'selected':''}>Juntos</option></select>
  <label>Observação</label><input id="f_o" value="${esc(f.note||'')}">
  <div class="g2"><button class="g" onclick="form=null;render()">Cancelar</button><button onclick="submitForm()">Salvar</button></div></div>`;
  if(f.type==='note')return `<div class="card"><b>${f.isNew?'Nova nota':'Editar nota'}</b><br><br>
  <label>Título</label><input id="f_n" value="${esc(f.name)}">
  <label>Texto</label><textarea id="f_x">${esc(f.text)}</textarea>
  <label>Quem escreveu</label><select id="f_w"><option value="a" ${f.who==='a'?'selected':''}>${esc(names.a)}</option><option value="b" ${f.who==='b'?'selected':''}>${esc(names.b)}</option><option value="j" ${f.who==='j'?'selected':''}>Juntos</option></select>
  <div class="g2"><button class="g" onclick="form=null;render()">Cancelar</button><button onclick="submitForm()">Salvar</button></div></div>`;
  return `<div class="card"><b>${f.isNew?'Novo':'Editar'}</b><br><br>
  <label>Nome</label><input id="f_n" value="${esc(f.name)}" placeholder="${isD?'Ex: Cartão, aluguel, empréstimo':'Ex: Viagem, reserva de emergência'}">
  <label>Categoria</label><select id="f_c">${CATS.map(c=>`<option ${(f.cat||'Outros')===c?'selected':''}>${c}</option>`).join('')}</select>
  <div class="g2"><div><label>${isD?'Valor total':'Valor da meta'}</label><input id="f_t" type="number" step="0.01" inputmode="decimal" value="${f.total}"></div>
  <div><label>${isD?'Já pago':'Já juntado'}</label><input id="f_p" type="number" step="0.01" inputmode="decimal" value="${f.paid}"></div></div>
  <label>De quem é</label><select id="f_w"><option value="a" ${f.who==='a'?'selected':''}>${esc(names.a)}</option><option value="b" ${f.who==='b'?'selected':''}>${esc(names.b)}</option><option value="j" ${f.who==='j'?'selected':''}>Juntos</option></select>
  ${isD?`<label>Vencimento</label><input id="f_d" type="date" value="${f.due}">`:`<label>Quanto planejam juntar por mês</label><input id="f_m" type="number" step="0.01" inputmode="decimal" value="${f.monthly}">`}
  <label>Observação</label><input id="f_o" value="${esc(f.note)}">
  <div class="g2"><button class="g" onclick="form=null;render()">Cancelar</button><button onclick="submitForm()">Salvar</button></div></div>`;
}
async function submitForm(){
  const f=form;
  if(f.type==='event'){const nm=$('#f_n').value.trim(),dt=$('#f_dt').value;if(!nm||!dt)return;
    const ev={id:f.id||'e'+Date.now().toString(36),type:'event',name:nm,date:dt,time:$('#f_h').value,who:$('#f_w').value,note:$('#f_o').value.trim()};
    selDay=dt;cal=new Date(+dt.slice(0,4),+dt.slice(5,7)-1,1);form=null;await save(ev);render();return}
  if(f.type==='note'){const nm=$('#f_n').value.trim(),tx=$('#f_x').value;if(!nm&&!tx.trim())return;
    const nt={id:f.id||'n'+Date.now().toString(36),type:'note',name:nm,text:tx,who:$('#f_w').value,ts:f.ts||Date.now()};
    form=null;await save(nt);render();return}
  const n=$('#f_n').value.trim();if(!n)return;
  const it={id:f.id||'i'+Date.now().toString(36),type:f.type,name:n,total:+$('#f_t').value||0,paid:+$('#f_p').value||0,who:$('#f_w').value,cat:$('#f_c').value,
    due:f.type==='debt'?$('#f_d').value:'',monthly:f.type==='goal'?(+$('#f_m').value||0):0,note:$('#f_o').value.trim(),log:f.log||[]};
  form=null;await save(it);render();
}
function pay(id){const it=items.find(i=>i.id===id);form={type:'pay',id,name:it.name};render()}
function doPay(id){
  const it=items.find(i=>i.id===id),v=parseFloat(($('#f_v').value||'').replace(',','.'));
  if(!v)return;
  const k=$('#f_w').value;form=null;
  save({...it,paid:it.paid+v,log:[...(it.log||[]),{d:Date.now(),v,w:k}].slice(-30)});
}
function cfg(){form={type:'cfg'};render()}
async function doCfg(){
  names={a:$('#f_a').value.trim()||'Eu',b:$('#f_b').value.trim()||'Amor'};form=null;
  if(db){try{await db.doc('config/names').set(names)}catch(e){}}else{lsSave()}
  render();
}
const FIREBASE_CONFIG={
  apiKey:"AIzaSyAyTemP5s7mHnxyObPVl-8Fi0chEuKQVLM",
  authDomain:"contas-do-casal-cb209.firebaseapp.com",
  projectId:"contas-do-casal-cb209",
  storageBucket:"contas-do-casal-cb209.firebasestorage.app",
  messagingSenderId:"121006618422",
  appId:"1:121006618422:web:9a1627a35c18e728562597"
};
function loadJs(src){return new Promise((ok,no)=>{const e=document.createElement('script');e.src=src;e.onload=ok;e.onerror=()=>no(new Error('não carregou '+src.split('/').pop()));document.head.appendChild(e)})}
async function connect(code){
  try{
    $('#st').textContent='conectando…';
    const B='https://www.gstatic.com/firebasejs/10.12.2/';
    await Promise.race([loadJs(B+'firebase-app-compat.js').then(()=>loadJs(B+'firebase-firestore-compat.js')),new Promise((_,r)=>setTimeout(()=>r(new Error('tempo esgotado')),12000))]);
    firebase.initializeApp(FIREBASE_CONFIG);
    const fs=firebase.firestore(),base='casais/'+code;
    db={collection:p=>fs.collection(base+'/'+p),doc:p=>fs.doc(base+'/'+p)};
    $('#st').textContent='sincronizado entre vocês ✓';
    const er=e=>{$('#st').textContent='erro: '+(e.code||e.message||e)};
    db.collection('items').onSnapshot(s=>{items=s.docs.map(x=>({...x.data(),id:x.id}));render()},er);
    db.doc('config/names').onSnapshot(s=>{const d=s.data();if(d){names={...names,...d};render()}},()=>{});
  }catch(e){db=null;$('#st').textContent='modo local — '+(e.message||e)}
}
function setCode(){
  const k=($('#f_k').value||'').trim().toLowerCase().replace(/[^a-z0-9-]/g,'');
  if(k.length<4)return;
  try{localStorage.setItem('casal-code',k)}catch(e){}
  needCode=false;render();connect(k);
}
function start(){
  lsLoad();render();
  try{if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
  let code='';try{code=localStorage.getItem('casal-code')||''}catch(e){}
  if(!code){needCode=true;$('#st').textContent='digite o código do casal';render();return}
  connect(code);
      }
