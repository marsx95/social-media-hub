import test from 'node:test';
import assert from 'node:assert/strict';
import { seedTasks,validateTask,makeTask,transition,editTask,actionsFor,COMPLETE,blockers,safeUrl,MONTHS } from '../src/model.js';
const task = values=>makeTask({title:'Konten uji',brief:'Hook, isi, CTA',...values});
test('seed: 64 slot empat brand, enam bulan dan jalur Padel',()=>{
 const all=seedTasks();all.forEach(validateTask);
 assert.equal(new Set(all.map(t=>t.id)).size,all.length);
 for(const brand of ['rimba','kvm','film','megan'])for(const type of ['carousel','reel'])assert.equal(all.filter(t=>t.brand===brand&&t.type===type).length,8);
 assert.equal(MONTHS.length,6);assert.equal(MONTHS[5],'2027-04');
 assert.ok(all.filter(t=>t.brand==='kvm'&&t.type!=='foundation').every(t=>blockers(t,all).length));
 assert.ok(all.filter(t=>t.brand==='film'&&t.type!=='foundation').every(t=>blockers(t,all).length));
});
test('approval draft hanya Aldyan, revisi wajib catatan',()=>{
 let t=task({stage:'draft'});t=transition(t,'draft_review','nduy',[t]);
 for(const actor of ['amar','nduy','arin','gpt'])assert.throws(()=>transition(t,'draft_approved',actor,[t]));
 assert.throws(()=>transition(t,'draft','aldyan',[t]),/catatan/);
 assert.equal(transition(t,'draft','aldyan',[t],'Perbaiki hook').stage,'draft');
 assert.equal(transition(t,'draft_approved','aldyan',[t]).stage,'draft_approved');
});
test('carousel melewati draft, desain, final dan approval',()=>{
 let t=task();for(const [to,actor] of [['draft','amar'],['draft_review','arin'],['draft_approved','aldyan'],['production','nduy']])t=transition(t,to,actor,[t]);
 assert.throws(()=>transition(t,'ready','amar',[t]));
 assert.throws(()=>transition(t,'final_review','amar',[t]),/tautan/);
 t=editTask(t,{finalUrl:'https://example.com/design',caption:'Caption final'},'arin');
 t=transition(t,'final_review','arin',[t]);t=transition(t,'ready','aldyan',[t]);
 assert.ok(COMPLETE(t));assert.equal(t.history.at(-1).actor,'aldyan');
});
test('reels memerlukan storyboard, review, video dan finishing',()=>{
 let t=task({type:'reel',stage:'draft_approved',subtasks:[{title:'Sound',assignee:'arin',done:false}]});
 t=transition(t,'storyboard','amar',[t]);assert.throws(()=>transition(t,'storyboard_review','amar',[t]),/storyboard/);
 t=editTask(t,{storyboardUrl:'https://example.com/ppt'},'amar');t=transition(t,'storyboard_review','amar',[t]);
 t=transition(t,'video_generation','aldyan',[t]);assert.throws(()=>transition(t,'editing','amar',[t]),/tautan/);
 t=editTask(t,{finalUrl:'https://example.com/video',caption:'Caption'},'nduy');t=transition(t,'editing','nduy',[t]);
 assert.throws(()=>transition(t,'final_review','arin',[t]),/subtask/);
 t=editTask(t,{subtasks:[{title:'Sound',assignee:'arin',done:true}]},'arin');t=transition(t,'final_review','arin',[t]);t=transition(t,'ready','aldyan',[t]);assert.ok(COMPLETE(t));
});
test('Padel berhenti setelah draft approved, tidak masuk produksi',()=>{
 const t=task({brand:'padel',stage:'draft_review'});const approved=transition(t,'draft_approved','aldyan',[t]);
 assert.ok(COMPLETE(approved));assert.deepEqual(actionsFor(approved,'amar',[approved]),[]);
 assert.throws(()=>transition(approved,'production','amar',[approved]));
});
test('perubahan draft dan hasil membatalkan approval terkait',()=>{
 let t=task({stage:'ready'});assert.equal(editTask(t,{brief:'Draft baru'},'amar').stage,'draft');
 assert.equal(editTask(t,{finalUrl:'https://example.com/v2'},'nduy').stage,'production');
 assert.equal(editTask(t,{assignee:'arin'},'amar').stage,'ready');
 t=task({type:'reel',stage:'editing'});assert.equal(editTask(t,{storyboardUrl:'https://example.com/new-ppt'},'amar').stage,'storyboard');
});
test('prasyarat menahan pekerjaan hingga selesai',()=>{
 const pre=task({id:'dependency',type:'foundation',stage:'in_progress'}),t=task({dependencies:['dependency']});
 assert.throws(()=>transition(t,'draft','amar',[t,pre]));assert.equal(blockers(t,[t]).length,1);
 assert.equal(transition(t,'draft','amar',[t,{...pre,stage:'ready'}]).stage,'draft');
});
test('validasi menolak tautan skrip, status ilegal dan tanggal tidak nyata',()=>{
 assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('data:text/html,hello'),'');
 assert.throws(()=>validateTask(task({finalUrl:'javascript:alert(1)'})));
 assert.throws(()=>validateTask(task({stage:'video_generation'})));
 assert.throws(()=>validateTask(task({brand:'padel',stage:'production'})));
 assert.throws(()=>validateTask(task({due:'2026-02-30'})));
 assert.throws(()=>editTask(task(),{stage:'ready'},'amar'));
});
