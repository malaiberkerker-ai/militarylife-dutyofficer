import {roomById} from './camp.js';
import {SAVE_KEY} from './engine.js';
import {LAST_BACKUP,UPGRADE_BACKUP,decodeSave,importSave,recoverBackup} from './save-store.js';
export function createSaveUI(ctx){const $=s=>document.querySelector(s),make=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};const panel=make('section');panel.id='save-panel';panel.className='panel range-panel hidden';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','save-title');$('#overlay').append(panel);const entry=make('button','▣ 存檔備份與匯入');entry.className='secondary';entry.onclick=open;$('#menu').insertBefore(entry,$('#resume-btn'));
function button(text,fn){const b=make('button',text);b.className='secondary';b.onclick=fn;panel.append(b);return b;}
function download(raw,name){if(!raw){ctx.toast('沒有這份存檔');return;}const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=make('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function open(){panel.replaceChildren();const h=make('h2','本機存檔管理');h.id='save-title';panel.append(h,make('p','版本2：升級前備份永久保留，另保留前一次自動存檔。匯入與恢復前會再保存目前原檔；檔案只在你的瀏覽器處理。'));let storage;try{storage=localStorage;}catch{panel.append(make('p','目前瀏覽器禁止使用本機儲存。'));button('返回',()=>ctx.panel('menu'));ctx.panel('save-panel');return;}
if(!ctx.canWrite())panel.append(make('p','自動儲存目前暫停，以保護原檔。請先匯出，再選擇有效備份恢復或匯入。'));
button('匯出目前原檔',()=>download(storage.getItem(SAVE_KEY)??JSON.stringify(ctx.state()),'值星官存檔.json'));
button('匯出升級前備份',()=>download(storage.getItem(UPGRADE_BACKUP),'值星官升級前備份.json')).disabled=!storage.getItem(UPGRADE_BACKUP);
button('匯出前次自動存檔',()=>download(storage.getItem(LAST_BACKUP),'值星官前次備份.json')).disabled=!storage.getItem(LAST_BACKUP);
for(const [key,label]of [[SAVE_KEY+'.before-import','匯出匯入前原檔'],[SAVE_KEY+'.before-recovery','匯出恢復前原檔']])button(label,()=>download(storage.getItem(key),label+'.json')).disabled=!storage.getItem(key);
const input=make('input');input.type='file';input.accept='.json,application/json';input.setAttribute('aria-label','選擇要匯入的存檔');panel.append(input);const status=make('p');status.setAttribute('role','status');panel.append(status);let pending=null;
input.onchange=async()=>{pending=null;const file=input.files?.[0];if(!file)return;if(file.size>2000000){status.textContent='檔案超過2MB，未讀取。';return;}const raw=await file.text();const state=decodeSave(raw);if(!state){status.textContent='無效或不支援的存檔；原進度未變。';return;}pending=raw;status.textContent='預覽：地點 '+roomById(state.location).name+'，精力 '+state.energy+'，'+(state.morning?'上午 '+Math.floor(state.morning.clock/60)+':'+String(state.morning.clock%60).padStart(2,'0'):'原章節')+'。確認後取代目前進度。';};
button('確認匯入已預覽的存檔',()=>{try{if(!pending)throw Error('請先選擇有效存檔並查看預覽');ctx.restore(importSave(storage,pending));ctx.toast('匯入完成，原進度已另行備份。');ctx.panel(null);}catch(e){status.textContent=e.message;}});
button('預覽可恢復備份',()=>{const raw=[storage.getItem(LAST_BACKUP),storage.getItem(UPGRADE_BACKUP)].find(r=>decodeSave(r));const s=decodeSave(raw);status.textContent=s?'備份有效：'+roomById(s.location).name+'，精力 '+s.energy+'。按下方確認恢復才會取代進度。':'沒有可恢復的有效備份。';});
let recoveryConfirmed=false;button('確認恢復備份',()=>{try{if(!recoveryConfirmed){recoveryConfirmed=true;status.textContent='這會恢復先前進度並備份目前原檔。再按一次「確認恢復備份」執行。';return;}ctx.restore(recoverBackup(storage));ctx.toast('備份恢復完成。');ctx.panel(null);}catch(e){status.textContent=e.message;}});button('返回選單',()=>ctx.panel('menu'));ctx.panel('save-panel');}
return {open};}

