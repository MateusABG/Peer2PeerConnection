/* Shared room state (used by every room script) */
const me={id:'',name:'',color:PAL[Math.floor(Math.random()*PAL.length)],mic:false};
const peers=new Map(),known=new Set(),hist={chat:[],strokes:[]},calls=new Map();
let peer=null,code='',isHost=false,shown=false,micStream=null,screenStream=null,synced=false;
