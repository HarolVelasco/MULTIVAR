/**
 * quizMode.js — Desafío Cónico 3D: Quiz por Niveles
 * Imports estáticos. Canvas con atributos fijos. KaTeX triple-fallback.
 */

import katex            from 'katex';
import { shuffledBank } from '../data/conicsBank.js';
import { createScene }  from '../engine/render3D.js';
import { BASE_URL }     from '../config.js';

// ══════════════════════════════════════════════════════════
//  ESTADO
// ══════════════════════════════════════════════════════════
let container    = null;
let onExitCb     = null;
let bank         = [];
let levelIndex   = 0;
let score        = 0;
let correct      = 0;
let total        = 0;
let sceneHandles = [];
let pendingRaf = [];

function destroyScenes(){
  pendingRaf.forEach(id=>{ try{clearTimeout(id);}catch(_){} });
  pendingRaf=[];
  sceneHandles.forEach(h=>{ try{h?.dispose();}catch(_){} });
  sceneHandles=[];
}

function shuffleArr(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

function getBank(){
  try{
    const b=shuffledBank();
    if(Array.isArray(b)&&b.length>0) return b;
  }catch(e){console.error('[quiz] shuffledBank:',e);}
  // Banco mínimo de emergencia
  return shuffleArr([
    {
      question:{id:'em1',type:'circle',label:'Círculo',latex:'x^2+y^2=25',params:{r:5},
        description:'Círculo radio 5.',mathInfo:{canonical:'x^2+y^2=25',center:'(0,0)',radius:'r=5',ecc:'e=0'}},
      distractors:[
        {id:'em1d1',type:'ellipse',label:'Elipse',latex:'\\dfrac{x^2}{25}+\\dfrac{y^2}{9}=1',params:{a:5,b:3}},
        {id:'em1d2',type:'parabola',label:'Parábola',latex:'y=\\dfrac{x^2}{8}',params:{p:2,orientation:'up'}},
      ],
    },
    {
      question:{id:'em2',type:'ellipse',label:'Elipse',latex:'\\dfrac{x^2}{9}+\\dfrac{y^2}{16}=1',params:{a:3,b:4},
        description:'Elipse b=4.',mathInfo:{canonical:'\\dfrac{x^2}{9}+\\dfrac{y^2}{16}=1',center:'(0,0)',vertices:'(0,\\pm4)',ecc:'e\\approx0.661'}},
      distractors:[
        {id:'em2d1',type:'circle',label:'Círculo',latex:'x^2+y^2=9',params:{r:3}},
        {id:'em2d2',type:'hyperbola',label:'Hipérbola',latex:'\\dfrac{x^2}{9}-\\dfrac{y^2}{16}=1',params:{a:3,b:4,orientation:'horizontal'}},
      ],
    },
    {
      question:{id:'em3',type:'parabola',label:'Parábola',latex:'y=\\dfrac{x^2}{8}',params:{p:2,orientation:'up'},
        description:'Parábola, foco (0,2).',mathInfo:{canonical:'x^2=8y',vertex:'(0,0)',focus:'(0,2)',directrix:'y=-2',ecc:'e=1'}},
      distractors:[
        {id:'em3d1',type:'circle',label:'Círculo',latex:'x^2+y^2=16',params:{r:4}},
        {id:'em3d2',type:'ellipse',label:'Elipse',latex:'\\dfrac{x^2}{4}+\\dfrac{y^2}{9}=1',params:{a:2,b:3}},
      ],
    },
    {
      question:{id:'em4',type:'hyperbola',label:'Hipérbola',latex:'\\dfrac{x^2}{4}-\\dfrac{y^2}{9}=1',params:{a:2,b:3,orientation:'horizontal'},
        description:'Hipérbola horizontal.',mathInfo:{canonical:'\\dfrac{x^2}{4}-\\dfrac{y^2}{9}=1',vertices:'(\\pm2,0)',asymptotes:'y=\\pm\\dfrac{3}{2}x',ecc:'e\\approx1.803'}},
      distractors:[
        {id:'em4d1',type:'hyperbola',label:'Hipérbola vert.',latex:'\\dfrac{y^2}{4}-\\dfrac{x^2}{9}=1',params:{a:2,b:3,orientation:'vertical'}},
        {id:'em4d2',type:'ellipse',label:'Elipse',latex:'\\dfrac{x^2}{4}+\\dfrac{y^2}{9}=1',params:{a:2,b:3}},
      ],
    },
  ]);
}

// ══════════════════════════════════════════════════════════
//  KATEX
// ══════════════════════════════════════════════════════════
function renderKatex(el, latex, display=true){
  if(!el) return;
  const src=String(latex??'').trim();
  if(!src){ el.textContent='(sin ecuación)'; el.style.color='rgba(255,255,255,0.4)'; return; }
  try{ katex.render(src,el,{throwOnError:true,displayMode:display,output:'html'}); return; }catch(_){}
  try{ katex.render(src,el,{throwOnError:true,displayMode:false,output:'html'}); return; }catch(_){}
  el.textContent=src;
  Object.assign(el.style,{fontFamily:'monospace',fontSize:'1rem',color:'#e8e0ff',whiteSpace:'pre-wrap'});
}

// ══════════════════════════════════════════════════════════
//  FICHA MATEMÁTICA
// ══════════════════════════════════════════════════════════
function renderSheet(el, conic){
  if(!el) return;
  const info=conic.mathInfo??{};
  const rows=[
    ['Ecuación canónica', info.canonical??conic.latex],
    ['Ecuación general',  info.general],
    ['Centro',            info.center],
    ['Radio',             info.radius],
    ['Vértice(s)',        info.vertices??info.vertex],
    ['Foco(s)',           info.foci??info.focus],
    ['Directriz',         info.directrix],
    ['Asíntotas',         info.asymptotes],
    ['Excentricidad',     info.ecc],
  ].filter(([,v])=>v);

  el.innerHTML=`<table class="mathsheet"><tbody>${
    rows.map(([label],i)=>`<tr class="mathsheet__row">
      <td class="mathsheet__label">${label}</td>
      <td class="mathsheet__value" id="msc${i}"></td>
    </tr>`).join('')
  }</tbody></table>`;

  rows.forEach(([,latex],i)=>renderKatex(el.querySelector(`#msc${i}`),latex,false));
}

function buildQR(conic){
  try{
    const p=new URLSearchParams({type:conic.type??'',label:conic.label??'',...(conic.params??{})});
    const url=`${BASE_URL}?viewer=1&${p}`;
    const src=`https://api.qrserver.com/v1/create-qr-code/?size=110x110&color=7c5cfc&bgcolor=0e0a1c&data=${encodeURIComponent(url)}`;
    return `<div class="quiz-feedback__qr">
      <img src="${src}" alt="QR" width="90" height="90" loading="lazy" class="modal__qr-img"/>
      <p class="modal__qr-label">Escanear<br>en móvil</p>
    </div>`;
  }catch{return '';}
}

// ══════════════════════════════════════════════════════════
//  RENDER NIVEL
// ══════════════════════════════════════════════════════════
const CV_W=440, CV_H=300;

function renderLevel(){
  destroyScenes();
  if(levelIndex>=bank.length){ renderFinish(); return; }

  const rawItem=bank[levelIndex];

  // Normalizar: soporta estructura { question, distractors }
  // Y también estructura plana { id, type, latex, correctParams, distractors }
  let question, distractors;
  if(rawItem?.question){
    // Estructura correcta: { question: {...}, distractors: [...] }
    question=rawItem.question;
    distractors=rawItem.distractors;
  } else if(rawItem?.latex || rawItem?.id){
    // Estructura plana: el item mismo ES la pregunta
    // params puede estar en correctParams o params
    question={
      id:    rawItem.id    ?? `item-${levelIndex}`,
      type:  rawItem.type  ?? 'circle',
      label: rawItem.label ?? rawItem.type ?? 'Cónica',
      latex: rawItem.latex ?? '',
      params: rawItem.params ?? rawItem.correctParams ?? {},
      description: rawItem.description ?? '',
      mathInfo: rawItem.mathInfo ?? {},
    };
    distractors=rawItem.distractors ?? [];
  } else {
    console.error('[quiz] item desconocido en índice',levelIndex,rawItem);
    levelIndex++;
    renderLevel();
    return;
  }

  if(!question.latex){
    console.error('[quiz] question sin latex en índice',levelIndex,question);
    levelIndex++;
    renderLevel();
    return;
  }

  // Normalizar distractores (pueden ser planos también)
  const normDistractor = (d,i) => d ? {
    id:    d.id    ?? `d${i}`,
    type:  d.type  ?? 'circle',
    label: d.label ?? d.type ?? 'Cónica',
    latex: d.latex ?? '',
    params: d.params ?? d.correctParams ?? {},
    description: d.description ?? '',
  } : {id:`fallback${i}`,type:'circle',label:'Círculo',latex:'x^2+y^2=1',params:{r:1}};

  const d0=normDistractor(distractors[0], 0);
  const d1=normDistractor(distractors[1], 1);

  const options=shuffleArr([
    {conic:question, isCorrect:true},
    {conic:d0,       isCorrect:false},
    {conic:d1,       isCorrect:false},
  ]);

  // ── HTML ────────────────────────────────────────────────
  container.innerHTML=`
    <div class="quiz__wrapper">
      <div class="quiz__header">
        <button class="menu__back-btn" id="qz-exit">← Salir</button>
        <div class="quiz__meta">
          <span class="quiz__level">Nivel ${levelIndex+1} / ${bank.length}</span>
          <span class="quiz__score">⭐ ${score}</span>
        </div>
      </div>

      <div class="quiz__equation-wrap">
        <p class="quiz__instruction">¿Cuál superficie 3D corresponde a esta ecuación?</p>
        <div id="qz-eq" class="quiz__equation"></div>
      </div>

      <div class="quiz__options">
        ${options.map((_,i)=>`
          <div class="quiz__option">
            <div style="display:flex;align-items:center;justify-content:center;
                        background:radial-gradient(ellipse at center,#0d0a1e,#06040f);
                        border-radius:10px;overflow:hidden;width:100%;">
              <canvas id="qcv${i}" width="${CV_W}" height="${CV_H}"
                      style="display:block;max-width:100%;height:auto;"></canvas>
            </div>
            <button class="quiz__select-btn" data-index="${i}">Seleccionar</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // ── KaTeX (síncrono, nodo existe) ───────────────────────
  renderKatex(container.querySelector('#qz-eq'), question.latex, true);

  // ── Eventos ─────────────────────────────────────────────
  container.querySelector('#qz-exit')?.addEventListener('click',()=>{
    destroyScenes(); container.innerHTML=''; onExitCb?.();
  });

  container.querySelectorAll('.quiz__select-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      container.querySelectorAll('.quiz__select-btn').forEach(b=>b.disabled=true);
      handleAnswer(options[Number(btn.dataset.index)],question);
    });
  });

  // ── Three.js: doble rAF garantiza layout completo ───────
  const rafTimer=setTimeout(()=>{
    options.forEach((opt,i)=>{
      const cv=container?.querySelector(`#qcv${i}`);
      if(!cv) return;
      // El canvas ya tiene width/height en atributos → WebGL lee canvas.width directamente
      try{
        const h=createScene(cv, opt.conic, {mini:true, autoRotateSpeed:1.0});
        sceneHandles.push(h);
      }catch(err){
        console.error(`[quiz] createScene ${i}:`,err);
        const ctx=cv.getContext('2d');
        if(ctx){
          ctx.fillStyle='#0d0a1e'; ctx.fillRect(0,0,CV_W,CV_H);
          ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='13px sans-serif';
          ctx.textAlign='center'; ctx.fillText('Vista 3D no disponible',CV_W/2,CV_H/2);
        }
      }
    });
  }, 80);
  pendingRaf.push(rafTimer);
}

// ══════════════════════════════════════════════════════════
//  RESPUESTA
// ══════════════════════════════════════════════════════════
function handleAnswer(sel,question){
  total++;
  if(sel.isCorrect){score+=100;correct++;}
  showFeedback(sel.isCorrect,question);
}

function showFeedback(isCorrect,question){
  const ov=document.createElement('div');
  ov.className='quiz-feedback__overlay';
  ov.innerHTML=`
    <div class="quiz-feedback__card">
      <div class="quiz-feedback__verdict quiz-feedback__verdict--${isCorrect?'ok':'fail'}">
        ${isCorrect?'✓ ¡CORRECTO!':'✗ INCORRECTO'}
      </div>
      <p class="quiz-feedback__name">${question.label??''}</p>
      <p class="quiz-feedback__desc">${question.description??''}</p>
      <div class="quiz-feedback__body">
        <div class="modal__sheet-wrap" id="fb-sh"></div>
        ${buildQR(question)}
      </div>
      <button class="menu__start-btn" id="qz-next" style="margin-top:0.7rem">
        ${levelIndex+1<bank.length?'Siguiente nivel →':'Ver resultados →'}
      </button>
    </div>
  `;
  container.appendChild(ov);
  renderSheet(ov.querySelector('#fb-sh'),question);
  ov.querySelector('#qz-next')?.addEventListener('click',()=>{ov.remove();levelIndex++;renderLevel();});
}

// ══════════════════════════════════════════════════════════
//  FINAL
// ══════════════════════════════════════════════════════════
function renderFinish(){
  const pct=total>0?Math.round((correct/total)*100):0;
  const rank=pct>=90?'A+':pct>=75?'A':pct>=60?'B':'C';
  const cls=rank.toLowerCase().replace('+','plus');

  container.innerHTML=`
    <div class="quiz__wrapper">
      <div class="overlay__card results__card" style="margin:2rem auto">
        <div class="results__rank results__rank--${cls}">${rank}</div>
        <h2 class="overlay__title overlay__title--win" style="font-size:1.8rem">¡Desafío completado!</h2>
        <div class="results__grid">
          <div class="results__stat"><span class="results__stat-label">Puntaje</span><span class="results__stat-value">${score}</span></div>
          <div class="results__stat"><span class="results__stat-label">Aciertos</span><span class="results__stat-value">${correct}/${total}</span></div>
          <div class="results__stat"><span class="results__stat-label">Precisión</span><span class="results__stat-value">${pct}%</span></div>
        </div>
        <div class="results__actions">
          <button class="overlay__btn" id="qf-restart">Jugar de nuevo</button>
          <button class="overlay__btn" id="qf-exit" style="opacity:0.65">Menú principal</button>
        </div>
      </div>
    </div>
  `;
  container.querySelector('#qf-restart')?.addEventListener('click',()=>start());
  container.querySelector('#qf-exit')?.addEventListener('click',()=>{container.innerHTML='';onExitCb?.();});
}

// ══════════════════════════════════════════════════════════
//  API
// ══════════════════════════════════════════════════════════
function start(){
  destroyScenes();
  bank=getBank();
  levelIndex=0; score=0; correct=0; total=0;
  renderLevel();
}

const QuizMode={
  init(el,cb){container=el; onExitCb=cb;},
  start(){start();},
  destroy(){destroyScenes(); if(container) container.innerHTML='';},
};
export default QuizMode;