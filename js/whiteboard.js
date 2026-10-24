/* Shared whiteboard (mouse, finger and pen) */
const cv=$('#cv'),ctx=cv.getContext('2d');ctx.lineCap='round';ctx.lineJoin='round';
let pen='#111111',drawing=false,last=null;
['#111111','#ff3b4e','#2563eb','#16a34a','#f59e0b'].forEach((c,i)=>{
 const s=document.createElement('button');s.className='sw'+(i?'':' on');s.style.background=c;s.setAttribute('aria-label','Pen colour '+c);
 s.onclick=()=>{pen=c;$$('.sw').forEach(x=>x.classList.toggle('on',x===s))};$('#wbtools').appendChild(s)});
function seg(m){ctx.strokeStyle=m.c;ctx.lineWidth=m.w;ctx.beginPath();
 ctx.moveTo(m.x0*cv.width,m.y0*cv.height);ctx.lineTo(m.x1*cv.width,m.y1*cv.height);ctx.stroke();
 hist.strokes.push({x0:m.x0,y0:m.y0,x1:m.x1,y1:m.y1,c:m.c,w:m.w});if(hist.strokes.length>6000)hist.strokes.shift()}
function pos(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
/* The canvas is 1200px wide internally; on a phone it is shown ~3x smaller, so thicken the line to stay visible */
function lineW(){const w=cv.getBoundingClientRect().width||cv.width;return Math.max(4,Math.min(12,Math.round(2.5*cv.width/w)))}
function stroke(a,b){const m={t:'draw',x0:a.x,y0:a.y,x1:b.x,y1:b.y,c:pen,w:lineW()};seg(m);send(m)}
cv.onpointerdown=e=>{if(!e.isPrimary)return;drawing=true;last=pos(e);cv.setPointerCapture(e.pointerId);stroke(last,last)}; // a tap leaves a dot
cv.onpointermove=e=>{if(!drawing||!e.isPrimary)return;const p=pos(e);stroke(last,p);last=p};
cv.onpointerup=cv.onpointercancel=()=>drawing=false;
$('#clr').onclick=()=>{hist.strokes=[];ctx.clearRect(0,0,cv.width,cv.height);send({t:'clear'})};
