/* Phone helpers: follow the on-screen keyboard, keep the screen awake, recover after the phone slept */
const vv=window.visualViewport;
let maxH=0,lastW=0;

function fit(){
 if(vv&&vv.scale>1.02)return;                      // person is pinch-zooming, leave the layout alone
 const h=Math.round(vv?vv.height:innerHeight);
 if(innerWidth!==lastW){lastW=innerWidth;maxH=0}   // rotated: forget the old "full height"
 maxH=Math.max(maxH,h);
 const l=document.getElementById('log'),atEnd=l&&l.scrollHeight-l.scrollTop-l.clientHeight<80;
 document.documentElement.style.setProperty('--app-h',h+'px');
 document.body.classList.toggle('short',h<430&&h<maxH*.75);   // keyboard is taking most of the screen
 if(vv&&vv.offsetTop)scrollTo(0,0);                // iOS scrolls the page up when the keyboard opens
 if(atEnd)l.scrollTop=l.scrollHeight;
}
fit();
addEventListener('resize',fit);
addEventListener('orientationchange',()=>setTimeout(fit,250));
if(vv){vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit)}

/* Screen lock would drop every call, so ask the browser to keep the display on while the room is open */
let wl=null;
async function keepAwake(){
 try{
  if(!('wakeLock' in navigator)||document.visibilityState!=='visible'||wl)return;
  wl=await navigator.wakeLock.request('screen');
  wl.addEventListener('release',()=>{wl=null});
 }catch(e){wl=null}
}
keepAwake();

/* Phones freeze connections in the background. When the page comes back: re-register with the signaling server,
   and if a guest was away for a while, simply rejoin the room (the host re-sends chat + whiteboard). */
let hiddenAt=0;
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='hidden'){hiddenAt=Date.now();return}
 keepAwake();
 if(!shown||!peer)return;
 if(peer.disconnected&&!peer.destroyed)try{peer.reconnect()}catch(e){}
 if(!isHost&&hiddenAt&&Date.now()-hiddenAt>15000)location.reload();
 hiddenAt=0;
});
