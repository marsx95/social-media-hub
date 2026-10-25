import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTask, transition, editTask } from '../src/model.js';
import { notificationsFor } from '../src/notify.js';

test('notifikasi: PIC baru, review ke Aldyan, hasil approval ke PIC', () => {
  const t = makeTask({ id: 'n1', title: 'Semut Rangrang', brand: 'rimba', stage: 'draft', brief: 'Hook' });
  const assigned = editTask(t, { assignee: 'nduy' }, 'amar');
  assert.deepEqual(notificationsFor(t, assigned, 'amar').map(n => n.to), ['nduy']);
  assert.equal(notificationsFor(t, assigned, 'nduy').length, 0, 'tidak mengirim ke diri sendiri');
  assert.equal(notificationsFor(t, editTask(t, { assignee: 'gpt' }, 'amar'), 'amar').length, 0, 'GPT tidak dikirimi email');

  const review = transition(assigned, 'draft_review', 'nduy', [assigned]);
  assert.deepEqual(notificationsFor(assigned, review, 'nduy').map(n => n.to), ['aldyan']);

  const ok = transition(review, 'draft_approved', 'aldyan', [review]);
  const sent = notificationsFor(review, ok, 'aldyan');
  assert.deepEqual(sent.map(n => n.to), ['nduy']);
  assert.match(sent[0].subject, /^Disetujui/);

  const back = transition(review, 'draft', 'aldyan', [review], 'Hook kurang kuat');
  const rev = notificationsFor(review, back, 'aldyan');
  assert.match(rev[0].subject, /^Perlu revisi/);
  assert.match(rev[0].message, /Hook kurang kuat/);
});

test('notifikasi: subtask baru untuk anggota lain', () => {
  const t = makeTask({ id: 'n2', title: 'Reels Tarsius', brand: 'rimba', type: 'reel', stage: 'draft', assignee: 'amar' });
  const next = editTask(t, { subtasks: [{ title: 'Sound design', assignee: 'arin', done: false }] }, 'amar');
  assert.deepEqual(notificationsFor(t, next, 'amar').map(n => n.to), ['arin']);
  assert.equal(notificationsFor(next, editTask(next, { title: 'Reels Tarsius v2' }, 'amar'), 'amar').length, 0);
});
