/* Mesh networking: data connections between every peer */
function wire(c){
 if(known.has(c.peer)||c.peer===me.id){c.close();return}
 known.add(c.peer);
 c.on('open',()=>{
  peers.set(c.peer,{conn:c,name:'…',color:'#888',mic:false});
  c.send({t:'hello',name:me.name,color:me.color,mic:me.mic});
  if(isHost&&c.peer!==me.id){
   c.send({t:'peers',ids:[...peers.keys()].filter(i=>i!==c.peer)});
   c.send({t:'sync',chat:hist.chat,strokes:hist.strokes});
  }
  if(!shown)showApp();
  if(micStream)callPeer(c.peer,'voice',micStream);
  if(screenStream)callPeer(c.peer,'screen',screenStream);
  render();
 });
 c.on('data',d=>onMsg(c.peer,d));
 c.on('close',()=>drop(c.peer));
 c.on('error',()=>drop(c.peer));
}
function drop(id){const p=peers.get(id);known.delete(id);if(!p)return;peers.delete(id);
 ['voice','screen'].forEach(k=>{const x=calls.get(id+k);x&&x.close();calls.delete(id+k)});
 killMedia(id);sys(p.name+' left');render()}
function send(m){peers.forEach(p=>p.conn.open&&p.conn.send(m))}
function onMsg(id,m){
 const p=peers.get(id);if(!p)return;
 switch(m.t){
  case 'hello':{const first=p.name==='…';Object.assign(p,{name:m.name,color:m.color,mic:m.mic});if(first)sys(m.name+' joined');break}
  case 'mic':p.mic=m.on;break;
  case 'peers':m.ids.forEach(i=>{if(!known.has(i)&&i!==me.id)wire(peer.connect(i,{reliable:true}))});break;
  case 'sync':if(!synced){synced=true;m.chat.forEach(x=>addMsg(x.name,x.color,x.text,false,true));m.strokes.forEach(seg)}break;
  case 'chat':addMsg(p.name,p.color,m.text,false);break;
  case 'draw':seg(m);break;
  case 'clear':hist.strokes=[];ctx.clearRect(0,0,cv.width,cv.height);break;
 }
 render();
}
function render(){
 $('#cnt').textContent=$('#cnt2').textContent=peers.size+1;
 const l=$('#vcl');l.innerHTML='';
 [[me.name+' (you)',me.color,me.mic],...[...peers.values()].map(p=>[p.name,p.color,p.mic])].forEach(([n,c,mic])=>{
  const d=document.createElement('div');d.className='v'+(mic?' live':'');
  d.innerHTML='<i></i><span></span>';d.lastChild.textContent=n;d.lastChild.style.color=c;l.appendChild(d)});
}
