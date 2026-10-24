/* Sidebar / tab-bar navigation between views (on phones "Voice" opens the voice panel as a sheet) */
const TITLES={chat:'Chat Room',stream:'Live',wb:'Whiteboard',miro:'Miro'};
let curView='chat';

function setView(v){
 curView=v;
 document.body.classList.remove('vcopen');
 $('#vcbtn').classList.remove('on');
 $$('nav button[data-v]').forEach(x=>x.classList.toggle('on',x.dataset.v===v));
 $$('.view').forEach(x=>x.classList.toggle('on',x.id==='v-'+v));
 $('#title').textContent=TITLES[v];
 if(v==='chat')scroll();
}
$$('nav button[data-v]').forEach(b=>b.onclick=()=>setView(b.dataset.v));

$('#vcbtn').onclick=()=>{
 if(document.body.classList.contains('vcopen'))return setView(curView);
 document.body.classList.add('vcopen');
 $$('nav button[data-v]').forEach(x=>x.classList.remove('on'));
 $('#vcbtn').classList.add('on');
 $('#title').textContent='Voice';
};
