const assert = require('node:assert/strict');
const { calcularPrim } = require('../algoritmo.js');

function prueba(nombre, funcion) {funcion();console.log('✓',nombre);}
function nodos(ids) {return ids.map(id=>({id}));}
function red(pares) {return pares.map(([a,b,peso],i)=>({id:`e${i}`,a,b,peso}));}
function kruskal(ids,aristas) {
  const padre=new Map(ids.map(id=>[id,id]));
  function raiz(x){while(padre.get(x)!==x)x=padre.get(x);return x;}
  let costo=0,tomadas=0;
  for(const e of [...aristas].sort((a,b)=>a.peso-b.peso)) {
    const pa=raiz(e.a),pb=raiz(e.b);
    if(pa!==pb){padre.set(pa,pb);costo+=e.peso;tomadas++;}
  }
  return {costo,tomadas};
}

prueba('Ejercicio de la clase: árbol mínimo 20 km',()=>{
 const vertices=nodos(['1','2','3','4','5','6','7']);
 const enlaces=red([['1','2',7],['1','3',10],['2','5',5],['2','4',2],['3','4',3],['3','6',5],['4','6',7],['4','7',12],['5','7',1],['6','7',2]]);
 const r=calcularPrim(vertices,enlaces,'1');
 assert.equal(r.conectado,true);assert.equal(r.total,20);
 assert.equal(r.elegidas.length,6);assert.equal(r.pasos.length,7);
 assert.deepEqual(r.elegidas.map(e=>`${e.desde}-${e.hacia}`),['1-2','2-4','4-3','3-6','6-7','7-5']);
});
prueba('Red pequeña con costo 6',()=>{
 const r=calcularPrim(nodos(['A','B','C','D']),red([['A','B',4],['A','C',2],['B','C',1],['B','D',5],['C','D',3]]),'A');
 assert.equal(r.total,6);assert.equal(r.elegidas.length,3);
});
prueba('Red desconectada: no informa solución completa',()=>{
 const r=calcularPrim(nodos(['A','B','C','D']),red([['A','B',4],['C','D',3]]),'A');
 assert.equal(r.conectado,false);assert.deepEqual(r.sinConectar,['C','D']);
});
prueba('Nodo aislado y sin conexiones',()=>{
 const r=calcularPrim(nodos(['A']),[],'A');assert.equal(r.conectado,true);assert.equal(r.total,0);
});
prueba('Los costos pueden tener decimales',()=>{
 const r=calcularPrim(nodos(['A','B','C']),red([['A','B',1.25],['B','C',0.5],['A','C',5]]),'A');
 assert.equal(r.total,1.75);
});
prueba('Rechaza costos negativos o iguales a cero',()=>{
 for(const x of [-2,0]) assert.throws(()=>calcularPrim(nodos(['A','B']),red([['A','B',x]]),'A'));
});
prueba('Rechaza nodo inexistente y autoenlace',()=>{
 assert.throws(()=>calcularPrim(nodos(['A','B']),red([['A','C',4]]),'A'));
 assert.throws(()=>calcularPrim(nodos(['A','B']),red([['A','A',4]]),'A'));
});
prueba('Rechaza inicio inexistente y nodos duplicados',()=>{
 assert.throws(()=>calcularPrim(nodos(['A','B']),[],'X'));
 assert.throws(()=>calcularPrim(nodos(['A','A']),[],'A'));
});
prueba('Resultados invariantes respecto del nodo inicial',()=>{
 const v=nodos(['A','B','C','D']);const a=red([['A','B',10],['A','C',4],['C','B',5],['B','D',3],['C','D',8]]);
 for(const n of v) assert.equal(calcularPrim(v,a,n.id).total,12);
});
prueba('Comparación con Kruskal en 180 grafos pseudoaleatorios',()=>{
 let seed=987654;
 const azar=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let test=0;test<180;test++){
   const n=2+Math.floor(azar()*12),ids=Array.from({length:n},(_,i)=>String(i));
   const aristas=[];
   for(let i=1;i<n;i++)aristas.push({id:'t'+i,a:ids[i],b:ids[Math.floor(azar()*i)],peso:1+Math.floor(azar()*50)});
   for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(azar()<.27&&!aristas.some(e=>(e.a===ids[i]&&e.b===ids[j])||(e.a===ids[j]&&e.b===ids[i])))aristas.push({id:'z'+i+'_'+j,a:ids[i],b:ids[j],peso:1+Math.floor(azar()*50)});
   const espera=kruskal(ids,aristas);
   const r=calcularPrim(nodos(ids),aristas,ids[Math.floor(azar()*n)]);
   assert.equal(r.conectado,true);assert.equal(r.elegidas.length,n-1);assert.equal(r.total,espera.costo);
 }
});
console.log('\nTodas las pruebas matemáticas completadas.');
