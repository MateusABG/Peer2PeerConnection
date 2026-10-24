/* Voice + screen/camera sharing (WebRTC calls to every peer)
   Screens: one main stage (#screen) + a row of small thumbnails (#thumbs). Click a thumbnail to put it on the stage.
   Phones can't capture their screen from the browser, so there the share button shares the camera instead. */
const streams=new Map();            // peer id -> {stream, name, mine}
const NONE='<span>No one is streaming</span>';
const CAN_SCREEN=!!(navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia);
const SHARE_TXT=CAN_SCREEN?'Share my screen':'Share my camera';
const unmute=$('#unmute');
let selected=null,mainV=null,mainTag=null,facing='user';
$('#share').textContent=SHARE_TXT;

function mediaBlocked(){
 if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)return false;
 toast(window.isSecureContext?'This browser can’t access the microphone or camera.':'Mic and camera need HTTPS. Open the site with https://');
 return true;
}

function callPeer(id,kind,st){const c=peer.call(id,st,{metadata:{kind}});calls.set(id+kind,c)}

function onCall(call){
 call.answer();
 const id=call.peer,kind=call.metadata&&call.metadata.kind;
 call.on('stream',s=>{
  if(kind==='voice'){
   let a=document.getElementById('a-'+id);
   if(!a){
    a=document.createElement('audio');
    a.id='a-'+id;a.autoplay=true;a.playsInline=true;
    document.body.appendChild(a)}
   a.srcObject=s;
   a.play().catch(needUnlock);
  }else{
   addStream(id,s,(peers.get(id)||{}).name||'Someone',false);
  }
 });
 call.on('close',()=>killMedia(id,kind));
}

/* iOS/Android block sound until the person has tapped the page: show a button, then start every audio element */
function needUnlock(){unmute.classList.remove('hidden')}
function unlockAudio(){unmute.classList.add('hidden');$$('audio').forEach(a=>a.play().catch(needUnlock))}
['click','touchend'].forEach(ev=>document.addEventListener(ev,()=>{if(!unmute.classList.contains('hidden'))unlockAudio()}));

function killMedia(id,kind){
 if(!kind||kind==='voice'){const a=document.getElementById('a-'+id);a&&a.remove()}
 if(!kind||kind==='screen')removeStream(id);
}

/* ---------- stage + thumbnails ---------- */
function addStream(id,s,name,mine){
 const old=streams.get(id);
 if(old&&old.stream.id===s.id)return;
 if(old)removeStream(id);
 streams.set(id,{stream:s,name,mine});
 const t=document.createElement('div');
      t.className='thumb';
      t.id='t-'+id;
      t.title='Click to show on the main screen';

   const v=document.createElement('video');
   v.autoplay=true;v.playsInline=true;v.muted=true;v.srcObject=s;

   const l=document.createElement('span');
   l.className='name';
   l.textContent=mine?'You':name;

   t.append(v,l);
   t.onclick=()=>select(id);
   t.ondblclick=()=>{select(id);fullscreen()};
   $('#thumbs').appendChild(t);

   if(!selected)select(id);
   else markSelected();
}

function select(id){
 selected=streams.has(id)?id:null;
 const sc=$('#screen'),e=streams.get(selected);
 if(!e){sc.innerHTML=NONE}
 else{
  if(!mainV){
   mainV=document.createElement('video');
   mainV.autoplay=true;
   mainV.playsInline=true;
   mainV.muted=true;
   mainTag=document.createElement('div');
   mainTag.className='tag';
  }
  mainV.srcObject=e.stream;
  mainTag.textContent=e.mine?(CAN_SCREEN?'You are streaming':'Your camera is live'):e.name+' is streaming';
  sc.replaceChildren(mainV,mainTag);
 }
 markSelected();
}
function markSelected(){$$('.thumb').forEach(t=>t.classList.toggle('on',t.id==='t-'+selected))}

function removeStream(id){
 if(!streams.delete(id))return;
 const t=document.getElementById('t-'+id);t&&t.remove();
 if(selected===id)select(streams.keys().next().value);   // fall back to another stream, or "No one is streaming"
}

function fullscreen(){
 const sc=$('#screen');
 if(sc.requestFullscreen)sc.requestFullscreen().catch(()=>{});
 else if(mainV&&mainV.webkitEnterFullscreen)mainV.webkitEnterFullscreen();   // iPhone only allows fullscreen on the <video> itself
 else if(sc.webkitRequestFullscreen)sc.webkitRequestFullscreen();
}
$('#fs').onclick=fullscreen;

/* ---------- outgoing calls ---------- */
function stopOut(kind){
 peers.forEach((p,id)=>{const c=calls.get(id+kind);c&&c.close();calls.delete(id+kind)});
}

/* ---------- mic (side panel button on desktop, header button + Voice tab on phones) ---------- */
function micUI(){
 $('#mic').textContent=me.mic?'MIC ON':'MIC OFF';
 $('#mic').classList.toggle('on',me.mic);
 $('#hmic').classList.toggle('on',me.mic);
}

async function toggleMic(){
 if(me.mic){micStream.getTracks().forEach(t=>t.stop());micStream=null;me.mic=false;stopOut('voice')}
 else{
  if(mediaBlocked())return;
  try{
   micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   me.mic=true;
   micStream.getAudioTracks()[0].onended=()=>{if(me.mic)toggleMic()};   // e.g. an incoming phone call took the mic
   peers.forEach((p,id)=>callPeer(id,'voice',micStream));
  }catch(e){return toast('Microphone unavailable: '+(e.message||e.name))}
 }
 micUI();send({t:'mic',on:me.mic});render();
}
$('#mic').onclick=$('#hmic').onclick=toggleMic;

/* ---------- screen share (desktop) / camera share (phones) ---------- */
function endShare(){
 const b=$('#share');
 if(screenStream){screenStream.getTracks().forEach(t=>t.stop());screenStream=null}
 stopOut('screen');removeStream(me.id);
 b.textContent=SHARE_TXT;b.classList.remove('red');
 $('#flip').classList.add('hidden');
}

async function startShare(){
 if(!CAN_SCREEN&&mediaBlocked())return;
 try{
  screenStream=CAN_SCREEN
   ?await navigator.mediaDevices.getDisplayMedia({video:true})
   :await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1280},height:{ideal:720}},audio:false});
  addStream(me.id,screenStream,me.name,true);
  $('#share').textContent='Stop sharing';$('#share').classList.add('red');
  $('#flip').classList.toggle('hidden',CAN_SCREEN);
  peers.forEach((p,id)=>callPeer(id,'screen',screenStream));
  screenStream.getVideoTracks()[0].onended=endShare;
 }catch(e){toast((CAN_SCREEN?'Screen share':'Camera')+' unavailable: '+(e.message||e.name))}
}

$('#share').onclick=()=>screenStream?endShare():startShare();
$('#flip').onclick=async()=>{facing=facing==='user'?'environment':'user';endShare();await startShare()};
