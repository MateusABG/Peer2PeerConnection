/* Shared settings and helpers */

/* Set this to use your own PeerServer, e.g. {host:'localhost',port:9000,path:'/'}.
   Add TURN servers via config:{iceServers:[...]} if some users can’t connect. */
const PEER_OPTS={};
const ROOM_PREFIX='ptop-';
const PAL=['#ff3b4e','#19e6a7','#ffb020','#5ea0ff','#c77dff','#ff7ad9','#a3e635'];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
