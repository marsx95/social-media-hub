export const MEMBERS = [
  { id: 'amar', name: 'Amar', initials: 'AM', role: 'admin', color: '#dcebbb' },
  { id: 'nduy', name: 'Nduy', initials: 'ND', role: 'editor', color: '#dbdefa' },
  { id: 'arin', name: 'Arin', initials: 'AR', role: 'editor', color: '#f4d9c9' },
  { id: 'gpt', name: 'GPT', initials: 'AI', role: 'assistant', color: '#d4e9e2' },
  { id: 'aldyan', name: 'Aldyan', initials: 'AL', role: 'lead', color: '#efe3b4' },
];
export const BRANDS = [
  { id: 'rimba', name: 'Rimba Raya', short: 'RR', color: '#6a8c43', note: 'Idea bank tersedia · lanjutkan draft November', target: 16 },
  { id: 'kvm', name: 'Karnos Visual Magic', short: 'KV', color: '#a177c7', note: 'Menunggu KV & identitas visual', target: 16 },
  { id: 'film', name: 'Karnos Film', short: 'KF', color: '#d18f57', note: 'Menunggu KV & identitas visual', target: 16 },
  { id: 'megan', name: 'MEGAN', short: 'ME', color: '#6d99b4', note: 'Brief dan format konten perlu disiapkan', target: 16 },
  { id: 'padel', name: 'Djakarta Padel Project', short: 'DP', color: '#b0a248', note: 'Format → ide → draft · produksi oleh Amar', target: 0 },
];
export const MONTHS = ['2026-11','2026-12','2027-01','2027-02','2027-03','2027-04'];
export const TYPES = { carousel: 'Carousel / Static', reel: 'Reels / Video', foundation: 'Fondasi / Branding' };
export const STAGES = {
  idea: 'Idea bank', draft: 'Draft konten', draft_review: 'Review draft', draft_approved: 'Draft disetujui',
  production: 'Produksi desain', storyboard: 'Storyboard & keyframe', storyboard_review: 'Review storyboard',
  video_generation: 'Video oleh Aldyan', editing: 'Editing video', final_review: 'Review final', ready: 'Siap posting',
  todo: 'Belum mulai', in_progress: 'Dikerjakan',
};
export const REVIEW = ['draft_review','storyboard_review','final_review'];
export const COMPLETE = t => t.stage === 'ready' || (t.brand === 'padel' && t.type !== 'foundation' && t.stage === 'draft_approved');
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
export const labelMonth = m => new Intl.DateTimeFormat('id-ID', {month:'long',year:'numeric'}).format(new Date(m+'-01T12:00:00'));
export const brandById = id => BRANDS.find(b=>b.id===id);
export const memberById = id => MEMBERS.find(m=>m.id===id);
export const uid = () => globalThis.crypto.randomUUID();
export function safeUrl(value) { try { const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
export function blockers(task, tasks) {
  const dependencies=[...new Set([...task.dependencies,...(task.type!=='foundation'&&['kvm','film'].includes(task.brand)?[task.brand+'-kv']:[])])];
  return [task.blocker, ...dependencies.filter(id=> !tasks.some(t=>t.id===id && COMPLETE(t))).map(id=> 'Menunggu: '+(tasks.find(t=>t.id===id)?.title || 'dependensi yang tidak ditemukan'))].filter(Boolean);
}
export function bucket(t, tasks) {
  if (blockers(t,tasks).length) return 'blocked';
  if (COMPLETE(t)) return 'ready';
  if (REVIEW.includes(t.stage)) return 'review';
  if (['production','storyboard','video_generation','editing','in_progress','draft_approved'].includes(t.stage)) return 'production';
  return 'planning';
}
export function makeTask(input = {}) {
  const now = new Date().toISOString();
  return { id: uid(), title: '', brand: 'rimba', type: 'carousel', month: MONTHS[0], stage: 'idea', assignee: '', priority:'normal', due:'', brief:'', caption:'', draftUrl:'', storyboardUrl:'', finalUrl:'', blocker:'', dependencies:[], subtasks:[], history:[], revision:0, createdAt:now, updatedAt:now, ...input };
}
export function validateTask(t) {
  if (!t || typeof t !== 'object' || typeof t.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(t.id)) throw Error('ID pekerjaan tidak valid.');
  for (const k of ['title','brief','caption','blocker','due','draftUrl','storyboardUrl','finalUrl']) if (typeof t[k] !== 'string') throw Error('Data '+k+' tidak valid.');
  if (!t.title.trim() || t.title.length>180) throw Error('Judul wajib diisi, maksimal 180 karakter.');
  if (!brandById(t.brand) || !TYPES[t.type] || !STAGES[t.stage] || !MONTHS.includes(t.month)) throw Error('Brand, format, periode, atau status tidak valid.');
  const allowed = t.type==='foundation' ? ['todo','in_progress','final_review','ready'] : t.brand==='padel' ? ['idea','draft','draft_review','draft_approved'] : t.type==='carousel' ? ['idea','draft','draft_review','draft_approved','production','final_review','ready'] : ['idea','draft','draft_review','draft_approved','storyboard','storyboard_review','video_generation','editing','final_review','ready'];
  if (!allowed.includes(t.stage)) throw Error('Status tidak sesuai alur brand dan format.');
  if (t.assignee && !memberById(t.assignee)) throw Error('Assignee tidak dikenal.');
  if (!['normal','high','low'].includes(t.priority)) throw Error('Prioritas tidak valid.');
  if (t.due && (!/^\d{4}-\d{2}-\d{2}$/.test(t.due) || Number.isNaN(Date.parse(t.due)) || new Date(t.due).toISOString().slice(0,10)!==t.due)) throw Error('Tanggal tidak valid.');
  if (t.brief.length>16000 || t.caption.length>8000 || t.blocker.length>1000) throw Error('Teks terlalu panjang.');
  for (const k of ['draftUrl','storyboardUrl','finalUrl']) if (t[k] && (!safeUrl(t[k]) || t[k].length>2000)) throw Error('Tautan harus menggunakan https:// atau http://.');
  if (!Array.isArray(t.dependencies) || t.dependencies.length>5 || t.dependencies.some(id=>typeof id!=='string'||id===t.id)) throw Error('Dependensi tidak valid (maksimal 5).');
  if (!Array.isArray(t.subtasks) || t.subtasks.length>40 || t.subtasks.some(s=>typeof s.title!=='string'||!s.title.trim()||s.title.length>200||typeof s.done!=='boolean'||(s.assignee&&!memberById(s.assignee)))) throw Error('Subtask tidak valid.');
  if (!Array.isArray(t.history) || t.history.length>300 || t.history.some(e=>typeof e.text!=='string'||e.text.length>3000||!memberById(e.actor)||typeof e.at!=='string'||Number.isNaN(Date.parse(e.at)))) throw Error('Riwayat tidak valid.');
  if (!Number.isInteger(t.revision)||t.revision<0) throw Error('Versi data tidak valid.');
  return t;
}
export function actionsFor(task, actor, tasks) {
  if (blockers(task,tasks).length || COMPLETE(task)) return [];
  const lead = actor==='aldyan';
  const action = (label,to,kind='advance') => ({label,to,kind});
  const map = {
    idea:[action('Mulai draft','draft')], draft:[action('Ajukan review draft','draft_review')],
    draft_review: lead ? [action('Setujui draft','draft_approved','approve'),action('Minta revisi draft','draft','reject')] : [],
    draft_approved:[action(task.type==='reel'?'Mulai storyboard':'Mulai desain',task.type==='reel'?'storyboard':'production')],
    production:[action('Ajukan hasil final','final_review')], storyboard:[action('Ajukan storyboard','storyboard_review')],
    storyboard_review:lead ? [action('Setujui & lanjut video','video_generation','approve'),action('Revisi storyboard','storyboard','reject')] : [],
    video_generation:[action('Video diterima · mulai editing','editing')], editing:[action('Ajukan hasil final','final_review')],
    final_review:lead ? [action(task.type==='foundation'?'Setujui & selesaikan':'Setujui · siap posting','ready','approve'),action('Minta revisi final',task.type==='foundation'?'in_progress':task.type==='reel'?'editing':'production','reject')] : [],
    todo:[action('Mulai pekerjaan','in_progress')], in_progress:[action('Ajukan review hasil','final_review')],
  };
  return actor==='gpt' ? [] : (map[task.stage] || []);
}
export function addEvent(task, actor, text, kind='edit') {
  if (!memberById(actor) || actor==='gpt') throw Error('Gunakan akun anggota manusia. GPT hanya assignee.');
  if (task.history.length>=300) throw Error('Batas riwayat tercapai. Buat pekerjaan lanjutan.');
  return {...task, revision: task.revision+1, updatedAt:new Date().toISOString(), history:[...task.history,{actor,text,kind,at:new Date().toISOString()}]};
}
export function transition(task,to,actor,tasks,note='') {
  const action=actionsFor(task,actor,tasks).find(a=>a.to===to);
  if (!action) throw Error('Perubahan status tidak diizinkan. Periksa approval dan dependensi.');
  if (action.kind==='reject'&&!note.trim()) throw Error('Tulis catatan revisi sebelum mengembalikan pekerjaan.');
  if (to==='draft_review' && !task.brief.trim()&&!task.draftUrl) throw Error('Tambahkan draft atau tautan draft sebelum review.');
  if (to==='storyboard_review'&&!task.storyboardUrl) throw Error('Tambahkan tautan PPT storyboard dan keyframe.');
  if (['editing','final_review'].includes(to)&&!task.finalUrl) throw Error('Tambahkan tautan hasil produksi.');
  if (to==='final_review'&&task.type!=='foundation'&&!task.caption.trim()) throw Error('Isi copywriting / caption sebelum review final.');
  if (to==='final_review'&&task.subtasks.some(s=>!s.done)) throw Error('Selesaikan seluruh subtask sebelum review final.');
  return validateTask(addEvent({...task,stage:to},actor,action.label+(note.trim()?' — '+note.trim():''),action.kind));
}
export function editTask(task, patch, actor) {
  const allowed=['title','assignee','priority','due','brief','caption','draftUrl','storyboardUrl','finalUrl','blocker','dependencies','subtasks'];
  if (Object.keys(patch).some(k=>!allowed.includes(k))) throw Error('Field tidak boleh diubah.');
  let next={...task,...patch};
  let reset='';
  const changed=key=>key in patch&&patch[key]!==task[key];
  if (task.type!=='foundation'&&(changed('brief')||changed('draftUrl'))&&!['idea','draft'].includes(task.stage)) {next.stage='draft';reset='Draft berubah; approval perlu diulang.';}
  else if (changed('storyboardUrl')&&['storyboard_review','video_generation','editing','final_review','ready'].includes(task.stage)) {next.stage='storyboard';reset='Storyboard berubah; approval perlu diulang.';}
  else if ((changed('finalUrl')||changed('caption')||changed('subtasks'))&&['final_review','ready'].includes(task.stage)) {next.stage=task.type==='foundation'?'in_progress':task.type==='reel'?'editing':'production';reset='Hasil berubah; review final perlu diulang.';}
  return validateTask(addEvent(next,actor,reset||'Memperbarui detail pekerjaan.'));
}
// Draft Rimba Raya yang sudah ditulis di deck "Draft Konten Rimba Raya" (Drive), siap diajukan ke Aldyan.
const RIMBA_DRAFT_DECK='https://drive.google.com/file/d/1pr_h4Dl9OySw0He4X21B73E__sVEsFgS/view';
const RIMBA_DRAFTS={
  carousel:[
    {title:'Semut Rangrang, Si Penjahit Daun',brief:'Konten 1 · Footage Binatang · carousel tanpa karakter, 8 slide 4:5. Hook: "Daun ini dijahit. Penjahitnya bukan manusia." Tujuan save & share. Detail slide, caption, dan hashtag ada di deck draft.'},
    {title:'3 Ayah Paling Sabar di Alam Indonesia',due:'2026-11-05',brief:'Konten 2 · Footage Binatang · carousel dengan karakter, 8 slide 4:5. Tayang Hari Ayah Nasional, Kamis 12 November 2026. Kasuari, kuda laut, rangkong. Detail di deck draft.'},
    {title:'Ketemu Penyu Bertelur? Ini Aturan Rimba',brief:'Konten 4 · Rimba Tarzan · carousel 8 slide 4:5. 3 "Jangan" + 3 "Lakukan" saat bertemu penyu bertelur. Aturan diverifikasi dengan pengelola konservasi. Detail di deck draft.'},
    {title:'24 Jam Camping di Tepi Mangrove',brief:'Konten 6 · Rimba Adventure · carousel 8 slide 4:5 dengan jam di tiap slide. Lokasi mangrove berizin + pemandu lokal. Detail di deck draft.'},
    {title:'Episode Passport (ide bonus)',brief:'Ide bonus B1 · The Series · carousel recurring per episode: sampul paspor, Lokasi, Habitat, Satwa, Penemuan Kunci, Momen yang Diingat. Detail di deck draft.'},
  ],
  reel:[
    {title:'Ikan Kok Jalan di Darat?',brief:'Konten 3 · Footage Binatang · reels 30–36 detik 9:16, 6 scene. Hook: "Ini ikan. Lagi jalan." Puyang memicu, Raya bertanya, Rimba menjelaskan ikan gelodok. Storyboard di deck draft.'},
    {title:'Lucu, Tapi Bukan Peliharaan: Tarsius',brief:'Konten 5 · Rimba Tarzan · reels 35–40 detik 9:16, 6 scene. Hook: "Lucu banget… boleh dipelihara nggak?" Tanpa memegang satwa dan tanpa flash. Storyboard di deck draft.'},
    {title:'Masak Ikan dalam Bambu',brief:'Konten 7 · Rimba Adventure · reels 45–55 detik 9:16 tanpa voice-over, food ASMR bersama nelayan lokal. Storyboard di deck draft.'},
    {title:'Suara Siapa Ini? (ide bonus)',brief:'Ide bonus B2 · Footage Binatang · Story kuis tebak suara (pagi) + Reels 15 detik jawaban (sore). Kandidat: rangkong, owa, katak pohon, tokek.'},
  ],
};
export function seedTasks() {
  const tasks=[];
  const add = data => {const t=makeTask({id:'seed-'+String(tasks.length+1).padStart(3,'0'),...data});tasks.push(t);return t.id;};
  for (const brand of BRANDS) {
    let kv='';
    if (['kvm','film'].includes(brand.id)) {
      kv=add({id:brand.id+'-kv',title:'Logo & key visual branding',brand:brand.id,type:'foundation',stage:'todo',due:'2026-10-30',priority:'high',brief:'Kunci identitas visual dan minta approval Aldyan. Menjadi prasyarat pengembangan draft konten.'});
    }
    if (['kvm','film','megan'].includes(brand.id)) for (const title of ['Credentials · design only','Proposal deck template · design only','Web interface · design material']) add({title,brand:brand.id,type:'foundation',stage:'todo',due:'2026-11-13',dependencies:kv?[kv]:[]});
    const format=add({id:brand.id+'-formats',title:brand.id==='rimba'?'Adaptasi idea bank ke draft November':'Content format, pilar & idea bank',brand:brand.id,type:'foundation',stage:'todo',assignee:brand.id==='padel'?'gpt':'',priority:'high',due:'2026-10-29',dependencies:kv?[kv]:[],brief:brand.note});
    add({title:'Strategi sosial media & timeline 6 bulan',brand:brand.id,type:'foundation',stage:'todo',due:'2026-11-06',assignee:brand.id==='padel'?'amar':'',dependencies:kv?[kv]:[]});
    if (brand.id==='padel') {add({title:'Draft konten awal · Djakarta Padel',brand:'padel',type:'carousel',assignee:'gpt',due:'2026-10-31',dependencies:[format],brief:'Format & idea bank → draft → approval Aldyan → diserahkan ke Amar. Desain dan reels dikerjakan Amar; target jumlah belum ditetapkan.'});continue;}
    for (const type of ['carousel','reel']) for (let n=1;n<=8;n++) {
      const named=brand.id==='rimba'?RIMBA_DRAFTS[type][n-1]:null;
      if (named) {add({title:named.title,brand:'rimba',type,stage:'draft',due:named.due||'2026-10-31',priority:'high',draftUrl:RIMBA_DRAFT_DECK,brief:named.brief,subtasks:type==='reel'?[{title:'Sound design',assignee:'',done:false},{title:'Caption / subtitle video',assignee:'',done:false}]:[]});continue;}
      add({title:`Draft ${type==='reel'?'reels':'carousel'} ${String(n).padStart(2,'0')} · November`,brand:brand.id,type,stage:brand.id==='rimba'?'draft':'idea',due:'2026-10-31',priority:'high',dependencies:kv?[kv]:brand.id==='megan'?[format]:[],brief:brand.id==='rimba'?'Pilih satu ide dari idea bank Rimba Raya yang sudah tersedia. Isi hook, isi utama, CTA, dan arahan visual sebelum diajukan ke Aldyan.':'',subtasks:type==='reel'?[{title:'Sound design',assignee:'',done:false},{title:'Caption / subtitle video',assignee:'',done:false}]:[]});
    }
  }
  return tasks;
}
