/* Chat */
function sys(t){
    const d=document.createElement('div');
    d.className='sys';
    d.textContent=t;
    $('#log').appendChild(d);scroll()
}

/* Short pop-up for things the person must notice even when the chat isn't on screen (also logged in chat) */
let toastT;
function toast(t){
    const e=$('#toast');e.textContent=t;e.classList.remove('hidden');
    clearTimeout(toastT);toastT=setTimeout(()=>e.classList.add('hidden'),4500);
    sys(t)
}

function scroll(){
    const l=$('#log');
    l.scrollTop=l.scrollHeight;
}

function addMsg(name,color,text,mine,fromSync){
    if(!mine){
        hist.chat.push({name,color,text});
    }
    else {
        hist.chat.push({name:me.name,color:me.color,text});
    }

    if(hist.chat.length>100) hist.chat.shift();
     const w=document.createElement('div');w.className='m'+(mine?' me':'');
    const n=document.createElement('div');n.className='n';n.textContent=mine?'You':name;n.style.color=color;
    const b=document.createElement('div');b.className='b';b.textContent=text;
     w.append(n,b);$('#log').appendChild(w);scroll();
}

$('#sendf').onsubmit=e=>{e.preventDefault();const t=$('#msg').value.trim();if(!t)return;
 addMsg(me.name,me.color,t,true);send({t:'chat',text:t});$('#msg').value=''};
