const messages=document.querySelector('#messages'),input=document.querySelector('#question'),send=document.querySelector('#send');
function inline(t){return t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`(.+?)`/g,'<code>$1</code>')}
function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function markdown(text){
  const lines=escapeHtml(String(text).replace(/\\n/g,'\n').replace(/<br\s*\/?\s*>/gi,'\n')).split(/\r?\n/),out=[];
  let list=null,table=[];
  function closeList(){if(list){out.push('</'+list+'>');list=null}}
  function closeTable(){if(table.length){out.push('<div class="table-scroll"><table><thead><tr>'+table[0].map(x=>'<th>'+inline(x)+'</th>').join('')+'</tr></thead><tbody>'+table.slice(1).map(r=>'<tr>'+r.map(x=>'<td>'+inline(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>');table=[]}}
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(line.startsWith('|')&&line.endsWith('|')){const cells=line.slice(1,-1).split('|').map(x=>x.trim());if(cells.every(x=>/^:?-{3,}:?$/.test(x)))continue;closeList();table.push(cells);continue}
    closeTable();
    if(!line){closeList();continue}
    const h=line.match(/^(#{1,4})\s+(.+)$/);if(h){closeList();out.push('<h'+Math.min(4,h[1].length+1)+'>'+inline(h[2])+'</h'+Math.min(4,h[1].length+1)+'>');continue}
    const item=line.match(/^(?:[-*•]\s+|(\d+)\.\s+)(.*)$/);
    if(item){const kind=item[1]?'ol':'ul';if(list!==kind){closeList();out.push('<'+kind+'>');list=kind}out.push('<li>'+inline(item[2])+'</li>');continue}
    closeList();out.push('<p>'+inline(line)+'</p>')
  }
  closeTable();closeList();return out.join('')
}
function bubble(text,who='bot',sources=[]){const wrap=document.createElement('div');wrap.className='bubble '+who;if(who==='bot'){const av=document.createElement('span');av.className='avatar';av.textContent='✦';wrap.appendChild(av)}const content=document.createElement('div');content.className='content';if(who==='bot'){content.classList.add('rendered');content.innerHTML=markdown(text)}else{content.textContent=text}if(sources.length){const links=document.createElement('div');links.className='sources';links.textContent='Sources:';for(const s of sources){try{const u=new URL(s.url);if(!['http:','https:'].includes(u.protocol))continue;const a=document.createElement('a');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=s.title||u.hostname;links.appendChild(a)}catch(e){}}content.appendChild(links)}wrap.appendChild(content);messages.appendChild(wrap);messages.scrollTop=messages.scrollHeight;return wrap}
// Browser-only chat history. No chats are uploaded to a storage service.
const STORAGE_KEY='carmate-chat-history-v1';
const WELCOME="Hi! I'm CarMate AI. 🚗\n\nI can help you find a new car, compare models and understand specifications using our car dataset. What's your budget, and how will you use the car?";
const chatList=document.querySelector('#chat-list');
const search=document.querySelector('#chat-search');
const counter=document.querySelector('#history-count');
let chats=[],activeId=null,busy=false;
function uid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2)}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({chats,activeId}))}catch(e){console.warn('Chat history could not be saved',e)}}
function load(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');if(Array.isArray(raw.chats)){chats=raw.chats.filter(c=>c&&typeof c.id==='string'&&Array.isArray(c.messages)).slice(0,150).map(c=>({...c,messages:c.messages.filter(m=>m&&['user','bot'].includes(m.role)&&typeof m.text==='string')}));activeId=raw.activeId}}catch(e){chats=[];activeId=null}}
function current(){return chats.find(c=>c.id===activeId)}
function createChat(){const now=Date.now();const c={id:uid(),title:'New chat',created:now,updated:now,messages:[]};chats.unshift(c);activeId=c.id;persist();render();return c}
function dateGroup(ms){const d=new Date(ms),today=new Date();const start=new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime();if(ms>=start)return 'Today';if(ms>=start-86400000)return 'Yesterday';if(ms>=start-7*86400000)return 'Previous 7 days';return 'Older'}
function renderList(){chatList.replaceChildren();const q=search.value.trim().toLowerCase();const ordered=[...chats].sort((a,b)=>(b.updated||0)-(a.updated||0));let last='';let visible=0;
for(const c of ordered){if(q&&!((c.title||'').toLowerCase().includes(q)||c.messages.some(m=>m.text.toLowerCase().includes(q))))continue;visible++;const group=dateGroup(c.updated||c.created||0);if(group!==last){const h=document.createElement('div');h.className='history-group';h.textContent=group;chatList.appendChild(h);last=group}
const row=document.createElement('div');row.className='chat-entry'+(c.id===activeId?' active':'');const open=document.createElement('button');open.className='chat-open';open.title=c.title;open.textContent=c.title||'Untitled chat';open.addEventListener('click',()=>switchChat(c.id));row.appendChild(open);
const menu=document.createElement('button');menu.className='chat-more';menu.textContent='⋯';menu.title='Chat options';menu.setAttribute('aria-label','Options for '+c.title);menu.addEventListener('click',()=>{const options=row.querySelector('.chat-actions');options.hidden=!options.hidden});row.appendChild(menu);
const actions=document.createElement('div');actions.className='chat-actions';actions.hidden=true;const rename=document.createElement('button');rename.textContent='Rename';rename.addEventListener('click',()=>{const name=prompt('Rename conversation',c.title);if(name!==null&&name.trim()){c.title=name.trim().slice(0,80);c.updated=Date.now();persist();renderList()}});const del=document.createElement('button');del.textContent='Delete';del.className='delete-chat';del.addEventListener('click',()=>{if(!confirm('Delete this conversation permanently from this browser?'))return;chats=chats.filter(x=>x.id!==c.id);if(activeId===c.id)activeId=chats[0]?.id||null;if(!activeId)createChat();else{persist();render()} });actions.append(rename,del);row.appendChild(actions);chatList.appendChild(row)}
counter.textContent=chats.length?String(chats.length):'';if(!visible){const empty=document.createElement('div');empty.className='history-empty';empty.textContent=q?'No matching chats':'No saved chats';chatList.appendChild(empty)}}
function render(){messages.replaceChildren();const c=current();if(!c||!c.messages.length)bubble(WELCOME);else for(const m of c.messages)bubble(m.text,m.role,m.sources||[]);renderList()}
function switchChat(id){if(busy)return;activeId=id;persist();render()}
function appendMessage(role,text,sources=[]){const c=current();if(!c)return;c.messages.push({role,text,sources});c.updated=Date.now();if(role==='user'&&c.title==='New chat')c.title=text.replace(/\s+/g,' ').slice(0,54)+(text.length>54?'…':'');persist();bubble(text,role,sources);renderList()}
async function ask(message){message=(message||input.value).trim();if(!message||busy)return;let c=current();if(!c)c=createChat();const history=c.messages.slice(-12).map(m=>({role:m.role==='user'?'user':'model',text:m.text}));input.value='';appendMessage('user',message);busy=true;send.disabled=true;document.querySelector('#reset').disabled=true;const pending=bubble('Checking your preferences and car data…');try{const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history,live_search:false})});const data=await response.json();pending.remove();if(!response.ok)appendMessage('bot',data.error||'Something went wrong.');else appendMessage('bot',data.reply,data.sources||[])}catch(e){pending.remove();appendMessage('bot','Could not connect to the server. Check that Flask is running.')}finally{busy=false;send.disabled=false;document.querySelector('#reset').disabled=false;input.focus()}}
send.addEventListener('click',()=>ask());input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask()}});document.querySelectorAll('.prompt').forEach(b=>b.addEventListener('click',()=>ask(b.dataset.prompt)));document.querySelector('#reset').addEventListener('click',()=>{if(!busy){createChat();input.focus()}});search.addEventListener('input',renderList);
load();if(!current())createChat();else render();
