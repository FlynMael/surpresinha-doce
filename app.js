/* =========================================================
   DADOS
   ========================================================= */
const CHAVE = 'surpresinha-doce-v1';
let db = { ingredientes: [], receitas: [], vendas: [], compras: [], despesas: [] };
let editIng = null, editRec = null;

function carregar(){
  try{
    const s = localStorage.getItem(CHAVE);
    if(s){ const d = JSON.parse(s);
      db.ingredientes = d.ingredientes || [];
      db.receitas = d.receitas || [];
      db.vendas = d.vendas || [];
      db.compras = d.compras || [];
      db.despesas = d.despesas || [];
    }
  }catch(e){ console.warn('Não foi possível ler os dados salvos', e); }
}
function salvar(){
  try{ localStorage.setItem(CHAVE, JSON.stringify(db)); }
  catch(e){ alert('Não consegui salvar os dados neste navegador.'); }
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

/* =========================================================
   UNIDADES  (base: g / ml / un)
   ========================================================= */
const FAM = { kg:'peso', g:'peso', L:'vol', ml:'vol', un:'un' };
const FATOR = { kg:1000, g:1, L:1000, ml:1, un:1 };
const BASE = { peso:'g', vol:'ml', un:'un' };
const UNS_DE = { peso:['kg','g'], vol:['L','ml'], un:['un'] };
function paraBase(qtd, un){ return qtd * FATOR[un]; }

/* custo por unidade base (por grama, por ml ou por unidade) */
function custoBase(ing){
  const q = paraBase(ing.qtd, ing.un);
  return q > 0 ? ing.preco / q : 0;
}
const brl = v => 'R$ ' + (isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct = v => (isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}) + '%';
const num = v => { const n = parseFloat(String(v).replace(',','.')); return isFinite(n)?n:0; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* =========================================================
   NAVEGAÇÃO
   ========================================================= */
function irAba(a){
  document.querySelectorAll('.aba').forEach(s=>s.classList.remove('on'));
  document.getElementById('aba-'+a).classList.add('on');
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on', b.dataset.aba===a));
  window.scrollTo({top:0,behavior:'smooth'});
  if(a==='rec') atualizarSelectsIng();
  if(a==='preco') montarSelectPreco();
  if(a==='fin') abrirFin();
  if(a==='resumo') montarResumo();
}

/* =========================================================
   INGREDIENTES
   ========================================================= */
function previewIng(){
  const p = num(document.getElementById('i-preco').value);
  const q = num(document.getElementById('i-qtd').value);
  const u = document.getElementById('i-un').value;
  const el = document.getElementById('i-preview');
  if(p>0 && q>0){
    const c = p / paraBase(q,u);
    const b = BASE[FAM[u]];
    const rot = b==='un' ? 'cada unidade' : ('cada ' + (b==='g'?'grama':'ml'));
    const mil = b==='un' ? '' : ' &nbsp;•&nbsp; ' + (b==='g'?'1 kg':'1 litro') + ' = <b>'+brl(c*1000)+'</b>';
    el.style.display='block';
    el.innerHTML = '🧮 '+rot+' custa <b>'+brl(c).replace('R$ ','R$ ')+'</b>'+mil;
  } else el.style.display='none';
}
['i-preco','i-qtd','i-un'].forEach(id=>document.getElementById(id).addEventListener('input',previewIng));
document.getElementById('i-un').addEventListener('change',previewIng);

function salvarIng(){
  const nome = document.getElementById('i-nome').value.trim();
  const preco = num(document.getElementById('i-preco').value);
  const qtd = num(document.getElementById('i-qtd').value);
  const un = document.getElementById('i-un').value;
  if(!nome) return alert('Escreva o nome do ingrediente.');
  if(preco<=0) return alert('Coloque o preço que você pagou.');
  if(qtd<=0) return alert('Coloque a quantidade da embalagem.');

  if(editIng){
    const i = db.ingredientes.find(x=>x.id===editIng);
    Object.assign(i,{nome,preco,qtd,un});
  } else {
    db.ingredientes.push({id:uid(),nome,preco,qtd,un});
  }
  salvar(); cancelarIng(); renderIng(); atualizarSelectsIng(); montarSelectPreco();
}
function editarIng(id){
  const i = db.ingredientes.find(x=>x.id===id); if(!i) return;
  editIng = id;
  document.getElementById('i-nome').value=i.nome;
  document.getElementById('i-preco').value=i.preco;
  document.getElementById('i-qtd').value=i.qtd;
  document.getElementById('i-un').value=i.un;
  document.getElementById('tit-ing').textContent='Editar ingrediente';
  document.getElementById('i-btn').textContent='Salvar alterações';
  document.getElementById('i-cancel').style.display='block';
  previewIng();
  irAba('ing');
}
function cancelarIng(){
  editIng=null;
  ['i-nome','i-preco','i-qtd'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('i-un').value='kg';
  document.getElementById('tit-ing').textContent='Novo ingrediente';
  document.getElementById('i-btn').textContent='Adicionar ingrediente';
  document.getElementById('i-cancel').style.display='none';
  document.getElementById('i-preview').style.display='none';
}
function excluirIng(id){
  const usos = db.receitas.filter(r=>r.itens.some(it=>it.ing===id));
  if(usos.length && !confirm('Este ingrediente é usado em '+usos.length+' receita(s). Apagar mesmo assim?')) return;
  if(!usos.length && !confirm('Apagar este ingrediente?')) return;
  db.ingredientes = db.ingredientes.filter(x=>x.id!==id);
  salvar(); renderIng(); atualizarSelectsIng(); montarSelectPreco();
}

function renderIng(){
  const el = document.getElementById('lista-ing');
  document.getElementById('ing-contador').textContent = db.ingredientes.length;
  if(!db.ingredientes.length){
    el.innerHTML = '<div class="vazio"><span class="em">🥣</span>Nenhum ingrediente ainda.<br>Comece cadastrando farinha, açúcar, leite…</div>';
    return;
  }
  el.innerHTML = db.ingredientes
    .slice().sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'))
    .map(i=>{
      const c = custoBase(i);
      const b = BASE[FAM[i.un]];
      const ref = b==='un' ? brl(c)+' / unidade'
                : b==='g' ? brl(c*1000)+' / kg'
                : brl(c*1000)+' / litro';
      return '<div class="item">'
        +'<div class="info"><div class="nome">'+esc(i.nome)+'</div>'
        +'<div class="sub">'+brl(i.preco)+' • '+i.qtd.toLocaleString("pt-BR")+' '+i.un+' &nbsp;→&nbsp; <b>'+ref+'</b></div></div>'
        +'<div class="acoes">'
        +'<button class="ico" onclick="editarIng(\''+i.id+'\')">✏️</button>'
        +'<button class="ico del" onclick="excluirIng(\''+i.id+'\')">🗑️</button>'
        +'</div></div>';
    }).join('');
}

/* =========================================================
   RECEITAS — montagem do formulário
   ========================================================= */
function opcoesIng(sel){
  if(!db.ingredientes.length) return '<option value="">— cadastre ingredientes —</option>';
  return '<option value="">Escolher…</option>' + db.ingredientes
    .slice().sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'))
    .map(i=>'<option value="'+i.id+'"'+(i.id===sel?' selected':'')+'>'+esc(i.nome)+'</option>').join('');
}
function addLinhaItem(dados){
  const d = dados || {ing:'',qtd:'',un:''};
  const div = document.createElement('div');
  div.className = 'ri-wrap';
  div.innerHTML =
    '<div class="ri">'
    +'<div class="g1"><select class="s-ing" onchange="mudouIng(this)">'+opcoesIng(d.ing)+'</select></div>'
    +'<div class="g2"><input class="s-qtd" type="number" inputmode="decimal" step="0.001" placeholder="Qtd" value="'+(d.qtd||'')+'" oninput="calcRec()"></div>'
    +'<div class="g3"><select class="s-un" onchange="calcRec()"></select></div>'
    +'<button class="ico del" onclick="this.closest(\'.ri-wrap\').remove();calcRec()">✕</button>'
    +'</div><div class="custo-ri"></div>';
  document.getElementById('r-itens').appendChild(div);
  preencherUn(div.querySelector('.s-ing'), d.un);
  calcRec();
}
function preencherUn(selIng, escolhida){
  const wrap = selIng.closest('.ri-wrap');
  const selUn = wrap.querySelector('.s-un');
  const ing = db.ingredientes.find(x=>x.id===selIng.value);
  const fam = ing ? FAM[ing.un] : 'peso';
  selUn.innerHTML = UNS_DE[fam].map(u=>'<option value="'+u+'">'+(u==='un'?'unid.':u)+'</option>').join('');
  if(escolhida && UNS_DE[fam].includes(escolhida)) selUn.value = escolhida;
  else selUn.value = BASE[fam];
}
function mudouIng(sel){ preencherUn(sel); calcRec(); }

/* mantém as listas de ingredientes das receitas sempre atualizadas */
function atualizarSelectsIng(){
  document.querySelectorAll('#r-itens .ri-wrap').forEach(w=>{
    const sel = w.querySelector('.s-ing');
    const un = w.querySelector('.s-un').value;
    const atual = sel.value;
    sel.innerHTML = opcoesIng(atual);
    if(atual && !db.ingredientes.some(i=>i.id===atual)) sel.value='';
    preencherUn(sel, un);
  });
  calcRec();
}

function addLinhaExtra(dados){
  const d = dados || {nome:'',valor:''};
  const div = document.createElement('div');
  div.className = 'ri-wrap';
  div.innerHTML =
    '<div class="ri">'
    +'<div class="g1"><input class="e-nome" placeholder="Ex.: Embalagem" value="'+esc(d.nome)+'"></div>'
    +'<div class="g2"><input class="e-val" type="number" inputmode="decimal" step="0.01" placeholder="R$" value="'+(d.valor||'')+'" oninput="calcRec()"></div>'
    +'<button class="ico del" onclick="this.closest(\'.ri-wrap\').remove();calcRec()">✕</button>'
    +'</div>';
  document.getElementById('r-extras').appendChild(div);
  calcRec();
}

function lerFormRec(){
  const itens = [];
  document.querySelectorAll('#r-itens .ri-wrap').forEach(w=>{
    const id = w.querySelector('.s-ing').value;
    const q = num(w.querySelector('.s-qtd').value);
    const u = w.querySelector('.s-un').value;
    if(id && q>0) itens.push({ing:id, qtd:q, un:u});
  });
  const extras = [];
  document.querySelectorAll('#r-extras .ri-wrap').forEach(w=>{
    const n = w.querySelector('.e-nome').value.trim();
    const v = num(w.querySelector('.e-val').value);
    if(v>0) extras.push({nome:n||'Outro custo', valor:v});
  });
  return {
    nome: document.getElementById('r-nome').value.trim(),
    itens, extras,
    venda: num(document.getElementById('r-venda').value),
    rende: Math.max(1, num(document.getElementById('r-rende').value) || 1)
  };
}

/* =========================================================
   CÁLCULO
   ========================================================= */
function custoItem(it){
  const ing = db.ingredientes.find(x=>x.id===it.ing);
  if(!ing) return 0;
  return paraBase(it.qtd, it.un) * custoBase(ing);
}
function calcular(r){
  const cIng = r.itens.reduce((s,it)=>s+custoItem(it),0);
  const cExtra = r.extras.reduce((s,e)=>s+e.valor,0);
  const custo = cIng + cExtra;
  const lucro = r.venda - custo;
  const margem = r.venda>0 ? (lucro/r.venda)*100 : 0;
  const markup = custo>0 ? r.venda/custo : 0;
  return {cIng,cExtra,custo,lucro,margem,markup,
          rende:r.rende||1,
          custoUn: custo/(r.rende||1), vendaUn: r.venda/(r.rende||1)};
}

function calcRec(){
  const r = lerFormRec();
  /* custo por linha */
  document.querySelectorAll('#r-itens .ri-wrap').forEach(w=>{
    const id = w.querySelector('.s-ing').value;
    const q = num(w.querySelector('.s-qtd').value);
    const u = w.querySelector('.s-un').value;
    const alvo = w.querySelector('.custo-ri');
    if(id && q>0) alvo.textContent = '= ' + brl(custoItem({ing:id,qtd:q,un:u}));
    else alvo.textContent = '';
  });

  const c = calcular(r);
  const el = document.getElementById('r-resultado');
  if(c.custo<=0 && r.venda<=0){ el.innerHTML=''; return; }

  let classe='alerta', tag='Preço de venda não informado', cor='amarelo';
  if(r.venda>0){
    if(c.lucro>0){ classe='lucro'; tag='Lucro'; cor='verde'; }
    else { classe='prej'; tag='Prejuízo'; cor='vermelho'; }
  }
  let aviso='';
  if(r.venda>0 && c.margem>0 && c.margem<20)
    aviso = '<div class="dica" style="margin-top:10px">⚠️ Margem baixa. Na confeitaria costuma-se trabalhar com margem de 40% a 65%.</div>';

  el.innerHTML =
    '<div class="res '+classe+'">'
    +'<div class="rl"><span>Ingredientes</span><b>'+brl(c.cIng)+'</b></div>'
    +(c.cExtra>0?'<div class="rl"><span>Outros custos</span><b>'+brl(c.cExtra)+'</b></div>':'')
    +'<div class="rl"><span>Custo total</span><b>'+brl(c.custo)+'</b></div>'
    +(r.venda>0?'<div class="rl"><span>Preço de venda</span><b>'+brl(r.venda)+'</b></div>':'')
    +'<hr class="sep" style="margin:8px 0">'
    +'<div class="big '+cor+'">'+brl(c.lucro)+'</div>'
    +'<div class="tag '+cor+'">'+tag+(r.venda>0?' • margem '+pct(c.margem):'')+'</div>'
    +(r.venda>0?'<div class="rl" style="margin-top:8px"><span>Multiplicador do custo</span><b>'+c.markup.toLocaleString('pt-BR',{maximumFractionDigits:2})+'×</b></div>':'')
    +(c.rende>1?'<div class="rl"><span>Por unidade ('+c.rende+')</span><b>custo '+brl(c.custoUn)+' • venda '+brl(c.vendaUn)+'</b></div>':'')
    +'</div>'+aviso;
}

/* =========================================================
   RECEITAS — CRUD
   ========================================================= */
function salvarRec(){
  const r = lerFormRec();
  if(!r.nome) return alert('Dê um nome para a receita.');
  if(!r.itens.length) return alert('Adicione pelo menos um ingrediente.');
  if(editRec){
    const x = db.receitas.find(y=>y.id===editRec);
    Object.assign(x, r);
  } else {
    db.receitas.push(Object.assign({id:uid()}, r));
  }
  salvar(); cancelarRec(); renderRec(); montarSelectPreco();
}
function editarRec(id){
  const r = db.receitas.find(x=>x.id===id); if(!r) return;
  editRec = id;
  document.getElementById('r-nome').value = r.nome;
  document.getElementById('r-venda').value = r.venda || '';
  document.getElementById('r-rende').value = r.rende || 1;
  document.getElementById('r-itens').innerHTML='';
  document.getElementById('r-extras').innerHTML='';
  r.itens.forEach(it=>addLinhaItem(it));
  r.extras.forEach(e=>addLinhaExtra(e));
  document.getElementById('tit-rec').textContent='Editar receita';
  document.getElementById('r-btn').textContent='Salvar alterações';
  document.getElementById('r-cancel').style.display='block';
  irAba('rec'); calcRec();
}
function duplicarRec(id){
  const r = db.receitas.find(x=>x.id===id); if(!r) return;
  const c = JSON.parse(JSON.stringify(r));
  c.id = uid(); c.nome = r.nome + ' (cópia)';
  db.receitas.push(c); salvar(); renderRec(); montarSelectPreco();
}
function cancelarRec(){
  editRec=null;
  document.getElementById('r-nome').value='';
  document.getElementById('r-venda').value='';
  document.getElementById('r-rende').value=1;
  document.getElementById('r-itens').innerHTML='';
  document.getElementById('r-extras').innerHTML='';
  document.getElementById('r-resultado').innerHTML='';
  document.getElementById('tit-rec').textContent='Nova receita / bolo';
  document.getElementById('r-btn').textContent='Salvar receita';
  document.getElementById('r-cancel').style.display='none';
  addLinhaItem();
}
function excluirRec(id){
  if(!confirm('Apagar esta receita?')) return;
  db.receitas = db.receitas.filter(x=>x.id!==id);
  salvar(); renderRec(); montarSelectPreco();
}
function renderRec(){
  const el = document.getElementById('lista-rec');
  document.getElementById('rec-contador').textContent = db.receitas.length;
  if(!db.receitas.length){
    el.innerHTML='<div class="vazio"><span class="em">🎂</span>Nenhuma receita ainda.<br>Monte seu primeiro bolo acima.</div>';
    return;
  }
  el.innerHTML = db.receitas.map(r=>{
    const c = calcular(r);
    const cor = r.venda<=0 ? 'amarelo' : (c.lucro>0?'verde':'vermelho');
    return '<div class="item">'
      +'<div class="info"><div class="nome">'+esc(r.nome)+'</div>'
      +'<div class="sub">Custo <b>'+brl(c.custo)+'</b> • Venda <b>'+brl(r.venda)+'</b> • '
      +'<b class="'+cor+'">'+brl(c.lucro)+' ('+pct(c.margem)+')</b></div></div>'
      +'<div class="acoes">'
      +'<button class="ico" onclick="editarRec(\''+r.id+'\')">✏️</button>'
      +'<button class="ico" onclick="duplicarRec(\''+r.id+'\')">⧉</button>'
      +'<button class="ico del" onclick="excluirRec(\''+r.id+'\')">🗑️</button>'
      +'</div></div>';
  }).join('');
}

/* =========================================================
   PRECIFICAR
   ========================================================= */
let modo = 'margem';
function modoPreco(m){
  modo = m;
  document.getElementById('p-t-margem').classList.toggle('on', m==='margem');
  document.getElementById('p-t-markup').classList.toggle('on', m==='markup');
  document.getElementById('p-box-margem').style.display = m==='margem'?'block':'none';
  document.getElementById('p-box-markup').style.display = m==='markup'?'block':'none';
  calcPreco();
}
function montarSelectPreco(){
  const s = document.getElementById('p-rec');
  const atual = s.value;
  s.innerHTML = db.receitas.length
    ? db.receitas.map(r=>'<option value="'+r.id+'">'+esc(r.nome)+'</option>').join('')
    : '<option value="">— nenhuma receita cadastrada —</option>';
  if(atual && db.receitas.some(r=>r.id===atual)) s.value = atual;
  calcPreco();
}
function calcPreco(){
  const el = document.getElementById('p-resultado');
  const r = db.receitas.find(x=>x.id===document.getElementById('p-rec').value);
  if(!r){ el.innerHTML='<div class="vazio"><span class="em">🎂</span>Cadastre uma receita primeiro.</div>'; return; }
  const c = calcular(r);
  if(c.custo<=0){ el.innerHTML='<div class="vazio">Esta receita ainda não tem custo calculado.</div>'; return; }

  let sug;
  if(modo==='margem'){
    const m = Math.min(95, Math.max(0, num(document.getElementById('p-margem').value)));
    sug = c.custo / (1 - m/100);
  } else {
    const k = Math.max(1, num(document.getElementById('p-markup').value) || 1);
    sug = c.custo * k;
  }
  const lucro = sug - c.custo;
  const margem = sug>0 ? (lucro/sug)*100 : 0;

  el.innerHTML =
    '<div class="res lucro">'
    +'<div class="rl"><span>Custo da receita</span><b>'+brl(c.custo)+'</b></div>'
    +'<div class="tag verde" style="margin-top:8px">Preço sugerido</div>'
    +'<div class="big verde">'+brl(sug)+'</div>'
    +'<div class="rl"><span>Lucro</span><b>'+brl(lucro)+'</b></div>'
    +'<div class="rl"><span>Margem</span><b>'+pct(margem)+'</b></div>'
    +'<div class="rl"><span>Multiplicador</span><b>'+(sug/c.custo).toLocaleString('pt-BR',{maximumFractionDigits:2})+'×</b></div>'
    +(c.rende>1?'<div class="rl"><span>Por unidade ('+c.rende+')</span><b>'+brl(sug/c.rende)+'</b></div>':'')
    +(r.venda>0?'<div class="rl"><span>Preço atual</span><b>'+brl(r.venda)+'</b></div>':'')
    +'</div>';
}

/* =========================================================
   FINANCEIRO — vendas, compras e despesas
   ========================================================= */
let modoF = 'venda';
let editVenda = null, editCompra = null, editDespesa = null;

const hojeISO = () => { const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
const mesDe   = iso => (iso||'').slice(0,7);
const dataBR  = iso => { const p=(iso||'').split('-'); return p.length===3 ? p[2]+'/'+p[1] : ''; };
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const mesBR = m => { const p=(m||'').split('-'); return p.length===2 ? MESES[+p[1]-1]+' de '+p[0] : m; };

function modoFin(m){
  modoF = m;
  ['venda','compra','despesa'].forEach(k=>{
    document.getElementById('f-t-'+k).classList.toggle('on', k===m);
    document.getElementById('box-'+k).style.display = k===m ? 'block' : 'none';
  });
}

/* ---------- seletor de mês ---------- */
function mesesComDados(){
  const s = new Set([mesDe(hojeISO())]);
  db.vendas.forEach(v=>s.add(mesDe(v.data)));
  db.compras.forEach(c=>s.add(mesDe(c.data)));
  db.despesas.forEach(d=>s.add(mesDe(d.data)));
  return [...s].filter(Boolean).sort().reverse();
}
function montarSelectMes(){
  const s = document.getElementById('f-mes');
  const atual = s.value;
  const lista = mesesComDados();
  s.innerHTML = lista.map(m=>'<option value="'+m+'">'+mesBR(m)+'</option>').join('');
  s.value = (atual && lista.includes(atual)) ? atual : lista[0];
}
const mesSel = () => document.getElementById('f-mes').value || mesDe(hojeISO());

/* ---------- cálculo do mês ---------- */
function totaisMes(m){
  const vendas   = db.vendas.filter(v=>mesDe(v.data)===m);
  const compras  = db.compras.filter(c=>mesDe(c.data)===m);
  const despesas = db.despesas.filter(d=>mesDe(d.data)===m);
  const recebido = vendas.reduce((s,v)=>s+v.valor,0);
  const custoVendido = vendas.reduce((s,v)=>s+(v.custoUnit||0)*v.qtd,0);
  const gastoCompras = compras.reduce((s,c)=>s+c.valor,0);
  const gastoDespesas = despesas.reduce((s,d)=>s+d.valor,0);
  return {vendas, compras, despesas, recebido, custoVendido,
          gastoCompras, gastoDespesas,
          gasto: gastoCompras+gastoDespesas,
          saldo: recebido-gastoCompras-gastoDespesas,
          lucro: recebido-custoVendido-gastoDespesas};
}
function htmlResumoMes(m){
  const t = totaisMes(m);
  if(!t.vendas.length && !t.compras.length && !t.despesas.length)
    return '<div class="vazio"><span class="em">📅</span>Nada registrado em '+mesBR(m)+' ainda.</div>';

  const cor = t.saldo>0?'verde':(t.saldo<0?'vermelho':'amarelo');
  const classe = t.saldo>0?'lucro':(t.saldo<0?'prej':'alerta');

  // mais vendidos
  const cont = {};
  t.vendas.forEach(v=>{ cont[v.nome] = (cont[v.nome]||0) + v.qtd; });
  const top = Object.entries(cont).sort((a,b)=>b[1]-a[1]).slice(0,3);

  return '<div class="res '+classe+'">'
    +'<div class="rl"><span>Recebido em vendas</span><b class="verde">'+brl(t.recebido)+'</b></div>'
    +'<div class="rl"><span>Compras de ingredientes</span><b>'+brl(t.gastoCompras)+'</b></div>'
    +'<div class="rl"><span>Outras despesas</span><b>'+brl(t.gastoDespesas)+'</b></div>'
    +'<hr class="sep" style="margin:8px 0">'
    +'<div class="big '+cor+'">'+brl(t.saldo)+'</div>'
    +'<div class="tag '+cor+'">'+(t.saldo>=0?'Sobrou no mês':'Faltou no mês')+'</div>'
    +'<div class="rl" style="margin-top:10px"><span>Lucro das vendas</span><b>'+brl(t.lucro)+'</b></div>'
    +'<div class="rl"><span>Custo do que foi vendido</span><b>'+brl(t.custoVendido)+'</b></div>'
    +'<div class="rl"><span>Vendas registradas</span><b>'+t.vendas.length+'</b></div>'
    +'</div>'
    +(top.length ? '<div class="dica">🏆 Mais vendidos: '
        + top.map(([n,q])=>'<b>'+esc(n)+'</b> ('+q.toLocaleString('pt-BR')+')').join(' &nbsp;•&nbsp; ')
        + '</div>' : '');
}
function montarFin(){
  const m = mesSel();
  document.getElementById('f-resumo').innerHTML = htmlResumoMes(m);
  renderVendas(); renderCompras(); renderDespesas();
  const rf = document.getElementById('r-fin');
  if(rf) rf.innerHTML = htmlResumoMes(m);
}
function abrirFin(){
  montarSelectMes();
  montarSelectVenda();
  montarSelectCompraIng();
  if(!document.getElementById('s-data').value) document.getElementById('s-data').value = hojeISO();
  if(!document.getElementById('c-data').value) document.getElementById('c-data').value = hojeISO();
  if(!document.getElementById('d-data').value) document.getElementById('d-data').value = hojeISO();
  if(!editVenda && !num(document.getElementById('s-valor').value)) sugerirValor();
  montarFin();
}

/* ---------- VENDAS ---------- */
function montarSelectVenda(){
  const s = document.getElementById('s-rec');
  const atual = s.value;
  s.innerHTML = db.receitas.map(r=>'<option value="'+r.id+'">'+esc(r.nome)+'</option>').join('')
              + '<option value="__livre">Outro produto…</option>';
  if(atual) s.value = atual;
  mudouProduto();
}
function mudouProduto(){
  const v = document.getElementById('s-rec').value;
  document.getElementById('s-box-livre').style.display = (v==='__livre'||!v) ? 'block' : 'none';
}
function sugerirValor(){
  mudouProduto();
  const r = db.receitas.find(x=>x.id===document.getElementById('s-rec').value);
  const q = Math.max(1, num(document.getElementById('s-qtd').value)||1);
  const campo = document.getElementById('s-valor');
  if(r && r.venda>0 && !editVenda) campo.value = (r.venda*q).toFixed(2);
  previewVenda();
}
function previewVenda(){
  const r = db.receitas.find(x=>x.id===document.getElementById('s-rec').value);
  const q = Math.max(1, num(document.getElementById('s-qtd').value)||1);
  const valor = num(document.getElementById('s-valor').value);
  const el = document.getElementById('s-preview');
  if(!r || valor<=0){ el.innerHTML=''; return; }
  const custo = calcular(r).custo * q;
  const lucro = valor - custo;
  const margem = valor>0 ? lucro/valor*100 : 0;
  const cor = lucro>=0?'verde':'vermelho';
  el.innerHTML = '<div class="res '+(lucro>=0?'lucro':'prej')+'">'
    +'<div class="rl"><span>Custo estimado</span><b>'+brl(custo)+'</b></div>'
    +'<div class="rl"><span>Lucro desta venda</span><b class="'+cor+'">'+brl(lucro)+' ('+pct(margem)+')</b></div>'
    +'</div>';
}
function salvarVenda(){
  const data = document.getElementById('s-data').value || hojeISO();
  const recId = document.getElementById('s-rec').value;
  const r = db.receitas.find(x=>x.id===recId);
  const nome = r ? r.nome : document.getElementById('s-livre').value.trim();
  const qtd = Math.max(1, num(document.getElementById('s-qtd').value)||1);
  const valor = num(document.getElementById('s-valor').value);
  if(!nome) return alert('Diga o que foi vendido.');
  if(valor<=0) return alert('Informe o valor recebido.');
  const custoUnit = r ? calcular(r).custo : 0;
  const dados = {data, rec:(r?r.id:''), nome, qtd, valor, custoUnit,
                 cliente:document.getElementById('s-cliente').value.trim(),
                 pgto:document.getElementById('s-pgto').value};
  if(editVenda) Object.assign(db.vendas.find(v=>v.id===editVenda), dados);
  else db.vendas.push(Object.assign({id:uid()}, dados));
  salvar(); cancelarVenda(); montarSelectMes(); montarFin();
}
function editarVenda(id){
  const v = db.vendas.find(x=>x.id===id); if(!v) return;
  editVenda = id; modoFin('venda');
  document.getElementById('s-data').value = v.data;
  document.getElementById('s-rec').value = v.rec || '__livre';
  mudouProduto();
  document.getElementById('s-livre').value = v.rec ? '' : v.nome;
  document.getElementById('s-qtd').value = v.qtd;
  document.getElementById('s-valor').value = v.valor;
  document.getElementById('s-cliente').value = v.cliente || '';
  document.getElementById('s-pgto').value = v.pgto || 'Pix';
  document.getElementById('tit-venda').textContent = 'Editar venda';
  document.getElementById('s-btn').textContent = 'Salvar alterações';
  document.getElementById('s-cancel').style.display = 'block';
  previewVenda(); window.scrollTo({top:0,behavior:'smooth'});
}
function cancelarVenda(){
  editVenda = null;
  document.getElementById('s-data').value = hojeISO();
  document.getElementById('s-qtd').value = 1;
  document.getElementById('s-valor').value = '';
  document.getElementById('s-cliente').value = '';
  document.getElementById('s-livre').value = '';
  document.getElementById('s-preview').innerHTML = '';
  document.getElementById('tit-venda').textContent = 'Nova venda';
  document.getElementById('s-btn').textContent = 'Registrar venda';
  document.getElementById('s-cancel').style.display = 'none';
}
function excluirVenda(id){
  if(!confirm('Apagar esta venda?')) return;
  db.vendas = db.vendas.filter(v=>v.id!==id);
  salvar(); montarSelectMes(); montarFin();
}
function renderVendas(){
  const m = mesSel();
  const lista = db.vendas.filter(v=>mesDe(v.data)===m).sort((a,b)=>b.data.localeCompare(a.data));
  document.getElementById('s-contador').textContent = lista.length;
  const el = document.getElementById('lista-venda');
  if(!lista.length){
    el.innerHTML = '<div class="vazio"><span class="em">💵</span>Nenhuma venda em '+mesBR(m)+'.</div>';
    return;
  }
  el.innerHTML = lista.map(v=>{
    const lucro = v.valor - (v.custoUnit||0)*v.qtd;
    const cor = v.custoUnit ? (lucro>=0?'verde':'vermelho') : '';
    return '<div class="item">'
      +'<div class="info"><div class="nome">'+dataBR(v.data)+' · '+esc(v.nome)+(v.qtd>1?' ×'+v.qtd:'')+'</div>'
      +'<div class="sub"><b>'+brl(v.valor)+'</b> · '+esc(v.pgto||'')
      +(v.cliente?' · '+esc(v.cliente):'')
      +(v.custoUnit?' · lucro <b class="'+cor+'">'+brl(lucro)+'</b>':'')+'</div></div>'
      +'<div class="acoes">'
      +'<button class="ico" onclick="editarVenda(\''+v.id+'\')">✏️</button>'
      +'<button class="ico del" onclick="excluirVenda(\''+v.id+'\')">🗑️</button>'
      +'</div></div>';
  }).join('');
}

/* ---------- COMPRAS ---------- */
function montarSelectCompraIng(){
  const s = document.getElementById('c-ing');
  const atual = s.value;
  s.innerHTML = db.ingredientes.length
    ? db.ingredientes.slice().sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'))
        .map(i=>'<option value="'+i.id+'">'+esc(i.nome)+'</option>').join('')
    : '<option value="">— cadastre ingredientes —</option>';
  if(atual && db.ingredientes.some(i=>i.id===atual)) s.value = atual;
  mudouCompraIng();
}
function mudouCompraIng(){
  const ing = db.ingredientes.find(x=>x.id===document.getElementById('c-ing').value);
  const sel = document.getElementById('c-un');
  const fam = ing ? FAM[ing.un] : 'peso';
  sel.innerHTML = UNS_DE[fam].map(u=>'<option value="'+u+'">'+(u==='un'?'unid.':u)+'</option>').join('');
  if(ing) sel.value = ing.un;
  previewCompra();
}
function previewCompra(){
  const ing = db.ingredientes.find(x=>x.id===document.getElementById('c-ing').value);
  const valor = num(document.getElementById('c-valor').value);
  const qtd = num(document.getElementById('c-qtd').value);
  const un = document.getElementById('c-un').value;
  const el = document.getElementById('c-preview');
  if(!ing || valor<=0 || qtd<=0){ el.innerHTML=''; return; }
  const novo = valor / paraBase(qtd, un);
  const antigo = custoBase(ing);
  const b = BASE[FAM[ing.un]];
  const rot = b==='un' ? '/ unidade' : (b==='g' ? '/ kg' : '/ litro');
  const f = b==='un' ? 1 : 1000;
  let msg = 'Preço novo: <b>'+brl(novo*f)+' '+rot+'</b>';
  if(antigo>0){
    const dif = (novo-antigo)/antigo*100;
    msg += ' &nbsp;•&nbsp; antes '+brl(antigo*f)+' ('
        + (dif>0?'subiu ':(dif<0?'baixou ':'igual '))
        + (dif===0?'':pct(Math.abs(dif))) + ')';
  }
  el.innerHTML = '<div class="dica">🧮 '+msg+'</div>';
}
function salvarCompra(){
  const ing = db.ingredientes.find(x=>x.id===document.getElementById('c-ing').value);
  const data = document.getElementById('c-data').value || hojeISO();
  const valor = num(document.getElementById('c-valor').value);
  const qtd = num(document.getElementById('c-qtd').value);
  const un = document.getElementById('c-un').value;
  if(!ing) return alert('Escolha o ingrediente. Se ainda não existe, cadastre na aba Ingredientes.');
  if(valor<=0) return alert('Informe o valor pago.');
  if(qtd<=0) return alert('Informe a quantidade comprada.');
  const dados = {data, ing:ing.id, nome:ing.nome, qtd, un, valor};
  if(editCompra) Object.assign(db.compras.find(c=>c.id===editCompra), dados);
  else db.compras.push(Object.assign({id:uid()}, dados));
  if(document.getElementById('c-atualiza').checked){
    ing.preco = valor; ing.qtd = qtd; ing.un = un;
  }
  salvar(); cancelarCompra(); renderIng(); atualizarSelectsIng();
  montarSelectMes(); montarFin();
}
function editarCompra(id){
  const c = db.compras.find(x=>x.id===id); if(!c) return;
  editCompra = id; modoFin('compra');
  document.getElementById('c-data').value = c.data;
  document.getElementById('c-ing').value = c.ing;
  mudouCompraIng();
  document.getElementById('c-un').value = c.un;
  document.getElementById('c-qtd').value = c.qtd;
  document.getElementById('c-valor').value = c.valor;
  document.getElementById('c-atualiza').checked = false;
  document.getElementById('tit-compra').textContent = 'Editar compra';
  document.getElementById('c-btn').textContent = 'Salvar alterações';
  document.getElementById('c-cancel').style.display = 'block';
  previewCompra(); window.scrollTo({top:0,behavior:'smooth'});
}
function cancelarCompra(){
  editCompra = null;
  document.getElementById('c-data').value = hojeISO();
  document.getElementById('c-valor').value = '';
  document.getElementById('c-qtd').value = '';
  document.getElementById('c-atualiza').checked = true;
  document.getElementById('c-preview').innerHTML = '';
  document.getElementById('tit-compra').textContent = 'Nova compra';
  document.getElementById('c-btn').textContent = 'Registrar compra';
  document.getElementById('c-cancel').style.display = 'none';
}
function excluirCompra(id){
  if(!confirm('Apagar esta compra?')) return;
  db.compras = db.compras.filter(c=>c.id!==id);
  salvar(); montarSelectMes(); montarFin();
}
function renderCompras(){
  const m = mesSel();
  const lista = db.compras.filter(c=>mesDe(c.data)===m).sort((a,b)=>b.data.localeCompare(a.data));
  document.getElementById('c-contador').textContent = lista.length;
  const el = document.getElementById('lista-compra');
  if(!lista.length){
    el.innerHTML = '<div class="vazio"><span class="em">🛍️</span>Nenhuma compra em '+mesBR(m)+'.</div>';
    return;
  }
  el.innerHTML = lista.map(c=>'<div class="item">'
    +'<div class="info"><div class="nome">'+dataBR(c.data)+' · '+esc(c.nome)+'</div>'
    +'<div class="sub"><b>'+brl(c.valor)+'</b> · '+c.qtd.toLocaleString('pt-BR')+' '+c.un+'</div></div>'
    +'<div class="acoes">'
    +'<button class="ico" onclick="editarCompra(\''+c.id+'\')">✏️</button>'
    +'<button class="ico del" onclick="excluirCompra(\''+c.id+'\')">🗑️</button>'
    +'</div></div>').join('');
}

/* ---------- DESPESAS ---------- */
function salvarDespesa(){
  const data = document.getElementById('d-data').value || hojeISO();
  const valor = num(document.getElementById('d-valor').value);
  const cat = document.getElementById('d-cat').value;
  const desc = document.getElementById('d-desc').value.trim();
  if(valor<=0) return alert('Informe o valor da despesa.');
  const dados = {data, cat, desc, valor};
  if(editDespesa) Object.assign(db.despesas.find(d=>d.id===editDespesa), dados);
  else db.despesas.push(Object.assign({id:uid()}, dados));
  salvar(); cancelarDespesa(); montarSelectMes(); montarFin();
}
function editarDespesa(id){
  const d = db.despesas.find(x=>x.id===id); if(!d) return;
  editDespesa = id; modoFin('despesa');
  document.getElementById('d-data').value = d.data;
  document.getElementById('d-valor').value = d.valor;
  document.getElementById('d-cat').value = d.cat;
  document.getElementById('d-desc').value = d.desc || '';
  document.getElementById('tit-despesa').textContent = 'Editar despesa';
  document.getElementById('d-btn').textContent = 'Salvar alterações';
  document.getElementById('d-cancel').style.display = 'block';
  window.scrollTo({top:0,behavior:'smooth'});
}
function cancelarDespesa(){
  editDespesa = null;
  document.getElementById('d-data').value = hojeISO();
  document.getElementById('d-valor').value = '';
  document.getElementById('d-desc').value = '';
  document.getElementById('tit-despesa').textContent = 'Nova despesa';
  document.getElementById('d-btn').textContent = 'Registrar despesa';
  document.getElementById('d-cancel').style.display = 'none';
}
function excluirDespesa(id){
  if(!confirm('Apagar esta despesa?')) return;
  db.despesas = db.despesas.filter(d=>d.id!==id);
  salvar(); montarSelectMes(); montarFin();
}
function renderDespesas(){
  const m = mesSel();
  const lista = db.despesas.filter(d=>mesDe(d.data)===m).sort((a,b)=>b.data.localeCompare(a.data));
  document.getElementById('d-contador').textContent = lista.length;
  const el = document.getElementById('lista-despesa');
  if(!lista.length){
    el.innerHTML = '<div class="vazio"><span class="em">🧰</span>Nenhuma despesa em '+mesBR(m)+'.</div>';
    return;
  }
  el.innerHTML = lista.map(d=>'<div class="item">'
    +'<div class="info"><div class="nome">'+dataBR(d.data)+' · '+esc(d.cat)+'</div>'
    +'<div class="sub"><b>'+brl(d.valor)+'</b>'+(d.desc?' · '+esc(d.desc):'')+'</div></div>'
    +'<div class="acoes">'
    +'<button class="ico" onclick="editarDespesa(\''+d.id+'\')">✏️</button>'
    +'<button class="ico del" onclick="excluirDespesa(\''+d.id+'\')">🗑️</button>'
    +'</div></div>').join('');
}

/* =========================================================
   RESUMO
   ========================================================= */
function montarResumo(){
  montarSelectMes();
  document.getElementById('r-fin').innerHTML = htmlResumoMes(mesSel());
  document.getElementById('k-ing').textContent = db.ingredientes.length;
  document.getElementById('k-rec').textContent = db.receitas.length;
  const comPreco = db.receitas.filter(r=>r.venda>0);
  const media = comPreco.length
    ? comPreco.reduce((s,r)=>s+calcular(r).margem,0)/comPreco.length : 0;
  document.getElementById('k-marg').textContent = comPreco.length ? pct(media) : '—';

  const el = document.getElementById('resumo-lista');
  if(!db.receitas.length){
    el.innerHTML='<div class="vazio"><span class="em">📊</span>Nada para mostrar ainda.</div>';
    return;
  }
  const lista = db.receitas.map(r=>({r, c:calcular(r)}))
    .sort((a,b)=>b.c.lucro-a.c.lucro);
  const maxL = Math.max(...lista.map(x=>Math.abs(x.c.lucro)), 1);
  el.innerHTML = lista.map(({r,c})=>{
    const cor = r.venda<=0?'#C29455':(c.lucro>0?'#1F8A6D':'#C7455C');
    const larg = Math.max(4, Math.abs(c.lucro)/maxL*100);
    return '<div style="padding:11px 0;border-bottom:1px solid var(--linha)">'
      +'<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600">'
      +'<span>'+esc(r.nome)+'</span><span style="color:'+cor+'">'+brl(c.lucro)+'</span></div>'
      +'<div style="height:8px;background:var(--rosa-claro);border-radius:6px;margin-top:7px;overflow:hidden">'
      +'<div style="height:100%;width:'+larg+'%;background:'+cor+';border-radius:6px"></div></div>'
      +'<div class="sub" style="font-size:12px;color:var(--suave);margin-top:5px">'
      +'custo '+brl(c.custo)+' • venda '+brl(r.venda)+' • margem '+pct(c.margem)+'</div>'
      +'</div>';
  }).join('');
}

/* =========================================================
   BACKUP
   ========================================================= */
function exportar(){
  const blob = new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'surpresinha-doce-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click(); URL.revokeObjectURL(a.href);
}
function importar(ev){
  const f = ev.target.files[0]; if(!f) return;
  const rd = new FileReader();
  rd.onload = e => {
    try{
      const d = JSON.parse(e.target.result);
      if(!d.ingredientes && !d.receitas && !d.vendas) throw 0;
      if(!confirm('Isso vai substituir os dados atuais. Continuar?')) return;
      db.ingredientes = d.ingredientes||[]; db.receitas = d.receitas||[];
      db.vendas = d.vendas||[]; db.compras = d.compras||[]; db.despesas = d.despesas||[];
      salvar(); renderIng(); renderRec(); atualizarSelectsIng(); montarSelectPreco(); abrirFin(); montarResumo();
      alert('Backup restaurado! ✅');
    }catch(err){ alert('Arquivo inválido.'); }
  };
  rd.readAsText(f); ev.target.value='';
}
function apagarTudo(){
  if(!confirm('Isso apaga TODOS os ingredientes, receitas, vendas, compras e despesas. Tem certeza?')) return;
  if(!confirm('Confirma mesmo? Não dá para desfazer.')) return;
  db = {ingredientes:[],receitas:[],vendas:[],compras:[],despesas:[]}; salvar();
  renderIng(); renderRec(); montarSelectPreco(); abrirFin(); montarResumo();
}

/* =========================================================
   INÍCIO
   ========================================================= */
carregar();
renderIng();
renderRec();
addLinhaItem();
montarSelectPreco();
abrirFin();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
