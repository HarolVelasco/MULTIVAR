/**
 * render3D.js — Motor de escenas Three.js.
 * createScene(canvas, conic, opts) → { dispose }
 * initScene / disposeScene — alias para modal.js
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── Colores ────────────────────────────────────────────────
const COL = {
  circle:0x00e5ff, sphere:0x00e5ff,
  ellipse:0x7c5cfc, ellipsoid:0x7c5cfc,
  parabola:0xff6d9d, paraboloid:0xff6d9d,
  hyperbola:0xffd166, hyperboloid:0xffd166,
};
const getCol = k => COL[k] ?? 0x7c5cfc;

// ── Material ───────────────────────────────────────────────
function makeMat(color) {
  return new THREE.MeshStandardMaterial({
    color, metalness:0.15, roughness:0.3,
    side:THREE.DoubleSide, transparent:true, opacity:0.88,
    emissive:new THREE.Color(color), emissiveIntensity:0.12,
  });
}

// ── Geometrías ─────────────────────────────────────────────
function mkSphere({r=1},c) {
  return new THREE.Mesh(new THREE.SphereGeometry(Math.max(r/5,0.45),48,36), makeMat(c));
}
function mkEllipsoid({a=3,b=4},c) {
  const mx=Math.max(a,b);
  const m=new THREE.Mesh(new THREE.SphereGeometry(1,48,36), makeMat(c));
  m.scale.set(a/mx, b/mx, (a+b)/2/mx);
  return m;
}
function mkParaboloid({p=2},c) {
  const pts=[];
  for(let i=0;i<=70;i++){const t=(i/70)*2.6; pts.push(new THREE.Vector2(t,(t*t)/(2*p)));}
  const geo=new THREE.LatheGeometry(pts,64);
  const m=new THREE.Mesh(geo, makeMat(c));
  geo.computeBoundingBox();
  const {min,max}=geo.boundingBox;
  const sc=1.5/Math.max(max.y-min.y,0.01);
  m.scale.setScalar(sc);
  m.position.y=-((min.y+max.y)/2)*sc;
  return m;
}
function mkHyperboloid({a=2,b=3},c) {
  const pts=[];
  for(let i=0;i<=80;i++){
    const t=((i/80)*2-1)*1.6;
    pts.push(new THREE.Vector2((a/3)*Math.cosh(t),(b/3)*Math.sinh(t)));
  }
  return new THREE.Mesh(new THREE.LatheGeometry(pts,64), makeMat(c));
}
const BUILDERS={
  circle:mkSphere,sphere:mkSphere,
  ellipse:mkEllipsoid,ellipsoid:mkEllipsoid,
  parabola:mkParaboloid,paraboloid:mkParaboloid,
  hyperbola:mkHyperboloid,hyperboloid:mkHyperboloid,
};
function buildMesh(conic){
  const k=conic.render3D??conic.type??'ellipse';
  return (BUILDERS[k]??mkEllipsoid)(conic.params??{},getCol(k));
}
function addWireframe(scene,mesh){
  const w=new THREE.LineSegments(
    new THREE.WireframeGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.07})
  );
  w.scale.copy(mesh.scale); w.position.copy(mesh.position); scene.add(w);
}

// ── Sprite numérico (sin texImage3D error) ─────────────────
function makeNumberSprite(text, hexColor) {
  const size=64;
  const cv=document.createElement('canvas');
  cv.width=cv.height=size;
  const ctx=cv.getContext('2d');
  ctx.clearRect(0,0,size,size);
  ctx.fillStyle='#'+hexColor.toString(16).padStart(6,'0');
  ctx.font='bold 28px sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(text,size/2,size/2);

  const tex=new THREE.CanvasTexture(cv);
  // Evitar el error texImage3D FLIP_Y:
  tex.flipY=true;
  tex.generateMipmaps=false;
  tex.minFilter=THREE.LinearFilter;
  tex.magFilter=THREE.LinearFilter;

  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,opacity:0.9,depthTest:false}));
  sp.scale.set(0.28,0.28,1);
  return sp;
}

// ── Ejes X(rojo) Y(verde) Z(azul) ─────────────────────────
function addAxes(scene, size=2.5){
  const defs=[
    {dir:new THREE.Vector3(1,0,0), col:0xff3333, rz:-Math.PI/2, rx:0},
    {dir:new THREE.Vector3(0,1,0), col:0x33ff55, rz:0,          rx:0},
    {dir:new THREE.Vector3(0,0,1), col:0x3388ff, rz:0,          rx:Math.PI/2},
  ];
  defs.forEach(({dir,col,rz,rx})=>{
    const lm=new THREE.LineBasicMaterial({color:col,transparent:true,opacity:0.85});
    const nm=new THREE.LineBasicMaterial({color:col,transparent:true,opacity:0.2});
    // eje positivo
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),dir.clone().multiplyScalar(size)]),lm));
    // eje negativo
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),dir.clone().multiplyScalar(-size*0.3)]),nm));
    // flecha (cono)
    const cone=new THREE.Mesh(
      new THREE.ConeGeometry(0.055,0.2,10),
      new THREE.MeshBasicMaterial({color:col})
    );
    cone.position.copy(dir.clone().multiplyScalar(size));
    if(rz) cone.rotation.z=rz;
    if(rx) cone.rotation.x=rx;
    scene.add(cone);
    // ticks + etiquetas
    for(let i=1;i<=Math.floor(size);i++){
      const origin=dir.clone().multiplyScalar(i);
      const perp=dir.x!==0?new THREE.Vector3(0,0.06,0):new THREE.Vector3(0.06,0,0);
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([origin.clone().sub(perp),origin.clone().add(perp)]),lm));
      const sp=makeNumberSprite(String(i),col);
      sp.position.copy(origin);
      if(dir.x!==0) sp.position.y+=0.22;
      else if(dir.y!==0) sp.position.x+=0.22;
      else sp.position.y+=0.22;
      scene.add(sp);
    }
  });
}

// ══════════════════════════════════════════════════════════
//  createScene
// ══════════════════════════════════════════════════════════
export function createScene(canvas, conic, opts={}){
  const {mini=false, autoRotateSpeed=0.8}=opts;
  if(!canvas) throw new Error('[render3D] canvas null');

  // Usar atributos del canvas como fallback (más fiables que clientWidth en algunos browsers)
  const w=canvas.clientWidth||canvas.width||(mini?280:480);
  const h=canvas.clientHeight||canvas.height||(mini?200:340);

  const renderer=new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setSize(w,h,true);   // true = actualiza style CSS también
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setClearColor(0x000000,0);

  const scene=new THREE.Scene();

  const camera=new THREE.PerspectiveCamera(50,w/h,0.1,100);
  camera.position.set(mini?4.5:5.0, mini?3.2:3.5, mini?5.5:6.5);

  scene.add(new THREE.AmbientLight(0xffffff,0.5));
  const dl=new THREE.DirectionalLight(0xffffff,1.2);
  dl.position.set(5,8,6); scene.add(dl);
  const k=conic.render3D??conic.type??'ellipse';
  const fl=new THREE.PointLight(getCol(k),1.4,18);
  fl.position.set(-3,-2,3); scene.add(fl);

  addAxes(scene, mini?3.2:3.8);

  const grid=new THREE.GridHelper(mini?8:10,12,0x1e1a4a,0x13113a);
  grid.position.y=-2.0; scene.add(grid);

  const mesh=buildMesh(conic);
  scene.add(mesh);
  addWireframe(scene,mesh);

  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true; controls.dampingFactor=0.07;
  controls.autoRotate=true; controls.autoRotateSpeed=autoRotateSpeed;
  controls.minDistance=1.5; controls.maxDistance=mini?14:20;
  // Zoom habilitado también en mini para explorar mejor

  const ro=new ResizeObserver(()=>{
    const nw=canvas.clientWidth||w, nh=canvas.clientHeight||h;
    renderer.setSize(nw,nh,true);
    camera.aspect=nw/nh; camera.updateProjectionMatrix();
  });
  ro.observe(canvas);

  let rafId=null;
  function animate(){
    rafId=requestAnimationFrame(animate);
    controls.update();
    mesh.rotation.y+=0.003;
    renderer.render(scene,camera);
  }
  animate();

  function dispose(){
    if(rafId) cancelAnimationFrame(rafId);
    ro.disconnect();
    controls.dispose();
    scene.traverse(o=>{
      o.geometry?.dispose();
      if(o.material){Array.isArray(o.material)?o.material.forEach(m=>m.dispose()):o.material.dispose();}
    });
    scene.clear();
    renderer.dispose();
  }
  return {dispose};
}

// ── Alias modal.js ─────────────────────────────────────────
let _h=null;
export function initScene(canvas,conic){_h?.dispose();_h=createScene(canvas,conic,{mini:false});}
export function disposeScene(){_h?.dispose();_h=null;}