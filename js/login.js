/* Login page: pick a name, then host a new room or join with a code */
const mkCode=()=>Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
const myCode=mkCode();
$('#mycode').textContent=myCode;
$('#mycode').onclick=()=>navigator.clipboard&&navigator.clipboard.writeText(myCode).then(()=>msg('Code copied.')).catch(()=>{});

function msg(t,bad){const e=$('#err');e.textContent=t;e.classList.toggle('bad',!!bad)}

// Prefill from a shared link (index.html#ABC123) and show errors sent back from the room page
const q=location.hash.slice(1).toUpperCase();
if(/^[A-Z0-9]{6}$/.test(q))$('#jcode').value=q;
const e=new URLSearchParams(location.search).get('err');
if(e)msg(e,1);

function go(host){
 const n=$('#uname').value.trim(),c=host?myCode:$('#jcode').value.trim().toUpperCase();
 if(!n)return msg('Please pick a username.',1);
 if(!/^[A-Z0-9]{6}$/.test(c))return msg('Enter a valid 6-character code.',1);
 try{sessionStorage.setItem('ptop.name',n)}catch(x){return msg('Your browser blocked session storage.',1)}
 location.href='room.html?code='+c+(host?'&host=1':'');
}
$('#host').onclick=()=>go(true);
$('#join').onclick=()=>go(false);
$('#jcode').addEventListener('keydown',ev=>{if(ev.key==='Enter')go(false)});
$('#uname').addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();$('#jcode').value?go(false):$('#jcode').focus()}});
