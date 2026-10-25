import { STAGES, REVIEW, brandById, memberById } from './model.js';
import { emailjsConfig } from './config.js';

export const emailEnabled = () => Boolean(emailjsConfig?.publicKey && emailjsConfig?.serviceId && emailjsConfig?.templateId);

// Menentukan siapa yang perlu diberi email setelah satu pekerjaan disimpan. Fungsi murni agar mudah diuji.
export function notificationsFor(prev, next, actor) {
  const out = [];
  const human = id => id && id !== 'gpt' && id !== actor && memberById(id);
  const where = `${brandById(next.brand)?.name || next.brand} · ${next.title}`;
  const push = (to, subject, message) => { if (human(to) && !out.some(n => n.to === to && n.subject === subject)) out.push({ to, subject, message }); };
  const by = memberById(actor)?.name || actor;

  if (next.assignee && next.assignee !== prev?.assignee)
    push(next.assignee, `Tugas baru: ${next.title}`, `${by} menugaskan kamu sebagai PIC untuk "${where}". Tahap sekarang: ${STAGES[next.stage]}.${next.due ? ` Deadline: ${next.due}.` : ''}`);

  const before = new Set((prev?.subtasks || []).map(s => s.title + '\u0000' + s.assignee));
  for (const s of next.subtasks || [])
    if (s.assignee && !s.done && !before.has(s.title + '\u0000' + s.assignee))
      push(s.assignee, `Subtask baru: ${s.title}`, `${by} menugaskan kamu subtask "${s.title}" di "${where}".`);

  if (prev && prev.stage !== next.stage) {
    if (REVIEW.includes(next.stage))
      push('aldyan', `Perlu review: ${next.title}`, `${by} mengajukan "${where}" untuk ${STAGES[next.stage].toLowerCase()}. Mohon dicek dan beri approval atau catatan revisi.`);
    const last = next.history.at(-1);
    if (REVIEW.includes(prev.stage) && last && ['approve', 'reject'].includes(last.kind)) {
      const ok = last.kind === 'approve';
      push(next.assignee, `${ok ? 'Disetujui' : 'Perlu revisi'}: ${next.title}`, `${by} ${ok ? 'menyetujui' : 'meminta revisi untuk'} "${where}". ${last.text}. Tahap sekarang: ${STAGES[next.stage]}.`);
    }
  }
  return out;
}

export async function sendEmails(list, contacts, actor) {
  if (!emailEnabled() || !list.length) return 0;
  let sent = 0;
  for (const n of list) {
    const email = contacts[n.to];
    if (!email) continue;
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: emailjsConfig.serviceId,
        template_id: emailjsConfig.templateId,
        user_id: emailjsConfig.publicKey,
        template_params: {
          to_email: email,
          to_name: memberById(n.to)?.name || n.to,
          from_name: memberById(actor)?.name || actor,
          subject: n.subject,
          message: n.message,
          link: location.origin + location.pathname,
        },
      }),
    });
    if (!res.ok) throw Error('Email ke ' + (memberById(n.to)?.name || n.to) + ' gagal terkirim: ' + (await res.text()));
    sent++;
  }
  return sent;
}
