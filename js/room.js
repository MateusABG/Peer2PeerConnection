/* Room page entry point: read the login details and connect to the mesh */
const params=new URLSearchParams(location.search);
code=(params.get('code')||'').toUpperCase();
isHost=params.get('host')==='1';
try{me.name=sessionStorage.getItem('ptop.name')||''}catch(e){}

function fail(m){location.replace('index.html?err='+encodeURIComponent(m)+(code?'#'+code:''))}

let retries=0;

function connect(){
 if(typeof Peer==='undefined')return fail('PeerJS failed to load (check your connection).');
 peer=new Peer(isHost?ROOM_PREFIX+code:undefined,PEER_OPTS);
 peer.on('open',id=>{retries=0;me.id=id;if(shown)return;   // 'open' fires again after a reconnect
  if(isHost)showApp();else wire(peer.connect(ROOM_PREFIX+code,{reliable:true}))});
 /* phones drop the signaling socket when the app is backgrounded or the network switches (wifi <-> 4G/5G): re-register */
 peer.on('disconnected',()=>{
  if(!shown||peer.destroyed||retries>=10)return;
  retries++;
  setTimeout(()=>{if(peer.disconnected&&!peer.destroyed&&!document.hidden)try{peer.reconnect()}catch(x){}},Math.min(2000*retries,10000));
 });
 peer.on('connection',wire);
 peer.on('call',onCall);
 peer.on('error',e=>{
  if(shown){if(!/^(network|socket-error|socket-closed|server-error)$/.test(e.type))sys('Network: '+e.type);return}
  try{peer.destroy()}catch(x){}
  fail(e.type==='peer-unavailable'?'No room found with that code.':e.type==='unavailable-id'?'That room code is already hosting. Go back and get a new one.':'Could not reach the signaling server ('+e.type+').');
 });
}

function showApp(){
 shown=true;$('#connecting').classList.add('hidden');$('#app').classList.remove('hidden');
 $('#meName').textContent='<'+me.name+'>';$('#roomTag').textContent='Room '+code;$('#roomChip').textContent=code;
 sys(isHost?'Room created. Share the code '+code+' with your friends.':'You joined room '+code);render();
}

function leave(){try{peer&&peer.destroy()}catch(e){}location.href='index.html'}
/* Phones: open the share sheet (WhatsApp, Messages, ...) with a link that pre-fills the code on the login page */
async function invite(){
 const url=new URL('index.html#'+code,location.href).href;
 try{
  if(navigator.share){await navigator.share({title:'Join my room',text:'Join my room with code '+code,url});return}
  await navigator.clipboard.writeText(url);toast('Invite link copied.');
 }catch(e){if(!e||e.name!=='AbortError')toast('Room code: '+code)}
}
$('#roomChip').onclick=invite;
$('#roomTag').onclick=()=>navigator.clipboard&&navigator.clipboard.writeText(code).catch(()=>{});
$('#leave').onclick=leave;
addEventListener('pagehide',()=>{try{peer&&peer.destroy()}catch(e){}});
addEventListener('pageshow',e=>{if(e.persisted)location.reload()});   // restored from the back/forward cache with a dead connection

if(!/^[A-Z0-9]{6}$/.test(code)||!me.name)location.replace('index.html');
else connect();
