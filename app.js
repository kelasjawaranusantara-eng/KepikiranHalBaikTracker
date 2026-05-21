/* ═══════════════════════════════════════════════════════════
   @kepikiranhalbaik — Content Hub App Logic
   ═══════════════════════════════════════════════════════════ */

// ─── State ───
const STATE = {
  trackerEntries: [],
  ideas: [],
  currentModal: { slot: '', pic: '', format: '', pillar: '', idea: '' },
  currentTemplate: 'caption',
};

// ─── Local Storage Keys ───
const KEYS = {
  tracker: 'kpb_tracker',
  ideas: 'kpb_ideas',
  checks: 'kpb_checks',
};

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  setCurrentWeek();
  setReportWeek();
  loadFromStorage();
  renderIdeas();
  renderTrackerTable();
  updatePerfStats();
  restoreCheckboxes();
});

// ─── Navigation ───
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  event.target.classList.add('active');
}

// ─── Week Display ───
function setCurrentWeek() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = d => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  document.getElementById('currentWeek').textContent = `Minggu ${fmt(start)} – ${fmt(end)}`;
}

function setReportWeek() {
  const now = new Date();
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  const el = document.getElementById('rtWeek');
  if (el) el.textContent = `Laporan Mingguan · ${now.toLocaleDateString('id-ID', opts)}`;
}

// ─── Storage ───
function loadFromStorage() {
  const t = localStorage.getItem(KEYS.tracker);
  const i = localStorage.getItem(KEYS.ideas);
  if (t) STATE.trackerEntries = JSON.parse(t);
  if (i) STATE.ideas = JSON.parse(i);
  else STATE.ideas = getDefaultIdeas();
}

function saveTracker() { localStorage.setItem(KEYS.tracker, JSON.stringify(STATE.trackerEntries)); }
function saveIdeas() { localStorage.setItem(KEYS.ideas, JSON.stringify(STATE.ideas)); }
function saveChecks() {
  const checks = {};
  document.querySelectorAll('.done-check').forEach((c, i) => { checks[i] = c.checked; });
  localStorage.setItem(KEYS.checks, JSON.stringify(checks));
}

function restoreCheckboxes() {
  const saved = localStorage.getItem(KEYS.checks);
  if (!saved) return;
  const checks = JSON.parse(saved);
  document.querySelectorAll('.done-check').forEach((c, i) => {
    if (checks[i]) { c.checked = true; markDone(c); }
  });
}

// ─── Checkbox / Done Mark ───
function markDone(checkbox) {
  const card = checkbox.closest('.content-card');
  if (checkbox.checked) {
    card.classList.add('done');
  } else {
    card.classList.remove('done');
  }
  saveChecks();
}

// ─── Tracker ───
function addTrackerEntry() {
  const date = document.getElementById('t-date').value;
  const title = document.getElementById('t-title').value.trim();
  const pic = document.getElementById('t-pic').value;
  const format = document.getElementById('t-format').value;
  const pillar = document.getElementById('t-pillar').value;
  const likes = parseInt(document.getElementById('t-likes').value) || 0;
  const comments = parseInt(document.getElementById('t-comments').value) || 0;
  const shares = parseInt(document.getElementById('t-shares').value) || 0;
  const reach = parseInt(document.getElementById('t-reach').value) || 0;
  const impressions = parseInt(document.getElementById('t-impressions').value) || 0;
  const notes = document.getElementById('t-notes').value.trim();

  if (!date || !title) {
    alert('Tanggal dan judul wajib diisi ya!');
    return;
  }

  const entry = { id: Date.now(), date, title, pic, format, pillar, likes, comments, shares, reach, impressions, notes };
  STATE.trackerEntries.unshift(entry);
  saveTracker();
  renderTrackerTable();
  updatePerfStats();

  // reset form
  ['t-date','t-title','t-likes','t-comments','t-shares','t-reach','t-impressions','t-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function deleteEntry(id) {
  if (!confirm('Hapus data ini?')) return;
  STATE.trackerEntries = STATE.trackerEntries.filter(e => e.id !== id);
  saveTracker();
  renderTrackerTable();
  updatePerfStats();
}

function renderTrackerTable() {
  const tbody = document.getElementById('trackerBody');
  if (!STATE.trackerEntries.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8">Belum ada data. Input konten pertamamu di sebelah kiri ☝</td></tr>';
    return;
  }
  tbody.innerHTML = STATE.trackerEntries.map(e => {
    const eng = e.reach > 0 ? ((e.likes + e.comments * 2 + e.shares * 3) / e.reach * 100).toFixed(1) : 0;
    const engClass = eng > 5 ? 'eng-high' : eng > 2 ? 'eng-mid' : 'eng-low';
    const fmt = e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString('id-ID', { day:'numeric', month:'short' }) : '—';
    const av = e.pic ? `<span class="avatar av-${e.pic.toLowerCase()}">${e.pic.slice(0,2).toUpperCase()}</span>` : '';
    const pillarBadge = { 'Growth Mindset':'pillar-growth','Mental Health':'pillar-mental','Reminder':'pillar-reminder' }[e.pillar] || '';
    return `<tr>
      <td>${fmt}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.title}</td>
      <td>${av} ${e.pic}</td>
      <td><span class="badge ${pillarBadge}">${e.pillar}</span></td>
      <td>${e.likes.toLocaleString()}</td>
      <td>${e.reach.toLocaleString()}</td>
      <td><span class="eng-chip ${engClass}">${eng}%</span></td>
      <td><button class="delete-btn" onclick="deleteEntry(${e.id})">✕</button></td>
    </tr>`;
  }).join('');
}

function updatePerfStats() {
  const entries = STATE.trackerEntries;
  const total = entries.length;
  const avgLikes = total ? Math.round(entries.reduce((s, e) => s + e.likes, 0) / total) : 0;
  const avgReach = total ? Math.round(entries.reduce((s, e) => s + e.reach, 0) / total) : 0;

  const fmtCounts = {};
  entries.forEach(e => { fmtCounts[e.format] = (fmtCounts[e.format] || 0) + 1; });
  const topFormat = Object.entries(fmtCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';

  document.getElementById('st-total').textContent = total;
  document.getElementById('st-likes').textContent = avgLikes.toLocaleString();
  document.getElementById('st-reach').textContent = avgReach.toLocaleString();
  document.getElementById('st-format').textContent = topFormat;
}

function exportReport() {
  if (!STATE.trackerEntries.length) { alert('Belum ada data untuk diekspor!'); return; }
  const headers = ['Tanggal','Judul','PIC','Format','Pilar','Likes','Comments','Shares/Save','Reach','Impressions','Catatan'];
  const rows = STATE.trackerEntries.map(e =>
    [e.date, `"${e.title}"`, e.pic, e.format, e.pillar, e.likes, e.comments, e.shares, e.reach, e.impressions, `"${e.notes}"`].join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `kepikiranhalbaik_tracker_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ─── Ideas ───
function getDefaultIdeas() {
  return [
    { id: 1, title: '5 tanda kamu sedang people pleasing tanpa sadar', pillar: 'mental', format: 'carousel', desc: 'Edukasi ringan tentang perilaku yang sering dianggap normal tapi melelahkan', pic: 'Nanda', fav: false },
    { id: 2, title: 'Ganti "aku harus produktif" jadi "aku boleh istirahat"', pillar: 'reminder', format: 'single', desc: 'Reframing quotes yang relate buat young professional yang mudah burnout', pic: 'Alif', fav: false },
    { id: 3, title: 'POV: kamu akhirnya berhenti minta maaf terus', pillar: 'growth', format: 'reels', desc: 'Video storytelling dengan audio trending, angle self-worth', pic: 'Guntur', fav: true },
    { id: 4, title: 'Cara beda antara malas dan butuh recharge', pillar: 'mental', format: 'carousel', desc: 'Edukasi membedakan rasa malas dan kelelahan mental — penting untuk self-awareness', pic: 'Nanda', fav: false },
    { id: 5, title: 'Hal kecil yang diam-diam bikin kamu berkembang', pillar: 'growth', format: 'carousel', desc: 'Carousel inspiring tentang micro-growth yang sering kita lewatkan', pic: 'Alif', fav: false },
    { id: 6, title: 'Ini bukan fase stuck, ini fase akar tumbuh', pillar: 'reminder', format: 'single', desc: 'Quote visual untuk kamu yang merasa stagnan', pic: '', fav: false },
    { id: 7, title: 'Kamu nggak harus selalu oke', pillar: 'mental', format: 'reels', desc: 'Monolog validasi emosi untuk yang sering pura-pura baik-baik saja', pic: 'Guntur', fav: true },
    { id: 8, title: 'Batas itu bukan tembok, itu pintu yang kamu kontrol', pillar: 'growth', format: 'single', desc: 'Reframing tentang boundaries yang sering disalahpahami', pic: 'Nanda', fav: false },
  ];
}

function filterIdeas(filterKey, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderIdeas(filterKey);
}

function renderIdeas(filter = 'all') {
  const grid = document.getElementById('ideasGrid');
  let ideas = STATE.ideas;

  if (filter !== 'all') {
    ideas = ideas.filter(i => i.pillar === filter || i.format === filter);
  }

  if (!ideas.length) {
    grid.innerHTML = '<div style="color:var(--ink-light);font-size:13px;padding:2rem">Belum ada ide untuk filter ini.</div>';
    return;
  }

  const pillarBadge = { growth: 'pillar-growth', mental: 'pillar-mental', reminder: 'pillar-reminder' };
  const pillarLabel = { growth: 'Growth Mindset', mental: 'Mental Health', reminder: 'Reminder' };
  const formatBadge = { carousel: 'format-carousel', single: 'format-single', reels: 'format-reels' };
  const formatLabel = { carousel: 'Carousel', single: 'Single Post', reels: 'Reels' };
  const avClass = { Alif: 'av-alif', Guntur: 'av-guntur', Nanda: 'av-nanda' };

  grid.innerHTML = ideas.map(idea => `
    <div class="idea-card" data-id="${idea.id}">
      <div class="idea-card-header">
        <div class="idea-card-badges">
          <span class="badge ${pillarBadge[idea.pillar]}">${pillarLabel[idea.pillar]}</span>
          <span class="badge ${formatBadge[idea.format]}">${formatLabel[idea.format]}</span>
        </div>
        <button class="idea-fav ${idea.fav ? 'active' : ''}" onclick="toggleFav(${idea.id})" title="Favorit">★</button>
      </div>
      <div class="idea-title">${idea.title}</div>
      <div class="idea-desc">${idea.desc}</div>
      <div class="idea-meta">
        ${idea.pic ? `<span class="avatar ${avClass[idea.pic] || ''}">${idea.pic.slice(0,2).toUpperCase()}</span><span>${idea.pic}</span>` : '<span style="color:var(--ink-light)">PIC belum ditentukan</span>'}
        <button class="idea-del" onclick="deleteIdea(${idea.id})">Hapus</button>
      </div>
    </div>
  `).join('');
}

function toggleFav(id) {
  const idea = STATE.ideas.find(i => i.id === id);
  if (idea) { idea.fav = !idea.fav; saveIdeas(); renderIdeas(); }
}

function deleteIdea(id) {
  if (!confirm('Hapus ide ini?')) return;
  STATE.ideas = STATE.ideas.filter(i => i.id !== id);
  saveIdeas(); renderIdeas();
}

function openAddIdea() { document.getElementById('ideaModal').classList.add('open'); }
function closeIdeaModal() { document.getElementById('ideaModal').classList.remove('open'); }

function saveIdea() {
  const title = document.getElementById('idea-title').value.trim();
  const pillar = document.getElementById('idea-pillar').value;
  const format = document.getElementById('idea-format').value;
  const desc = document.getElementById('idea-desc').value.trim();
  const pic = document.getElementById('idea-pic').value;
  if (!title) { alert('Judul ide wajib diisi!'); return; }
  STATE.ideas.unshift({ id: Date.now(), title, pillar, format, desc, pic, fav: false });
  saveIdeas(); renderIdeas(); closeIdeaModal();
  ['idea-title','idea-desc'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('idea-pic').value = '';
}

// ─── Caption Modal ───
function openCaptionHelper(slot, pic, format, pillar, idea) {
  STATE.currentModal = { slot, pic, format, pillar, idea };
  document.getElementById('modalTitle').textContent = format === 'Reels' ? 'Script Reels' : 'Tulis Caption';
  document.getElementById('modalSub').textContent = `${slot} · ${pic} · ${pillar}`;
  document.getElementById('captionModal').classList.add('open');
  setTemplate('caption', document.querySelector('.tmpl-tab'));
}

function closeCaptionModal() { document.getElementById('captionModal').classList.remove('open'); }

function closeModal(e) {
  if (e.target.classList.contains('modal-overlay')) {
    closeCaptionModal();
    closeIdeaModal();
  }
}

function setTemplate(type, btn) {
  document.querySelectorAll('.tmpl-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  STATE.currentTemplate = type;
  const { slot, pic, format, pillar, idea } = STATE.currentModal;
  const output = document.getElementById('templateOutput');
  output.textContent = generateTemplate(type, { slot, pic, format, pillar, idea });
}

function generateTemplate(type, ctx) {
  const { idea, pillar, format } = ctx;

  if (type === 'hook') {
    return getHooks(idea, pillar);
  }

  if (type === 'script') {
    return getScript(idea, pillar);
  }

  if (type === 'hashtag') {
    return getHashtags(pillar);
  }

  // caption default
  return getCaption(idea, pillar, format);
}

function getCaption(idea, pillar, format) {
  const openers = {
    'Growth Mindset': [
      'Pernah nggak kamu ngerasa...',
      'Ini untuk kamu yang lagi belajar...',
      'Satu hal yang sering kita lupa:',
    ],
    'Mental Health': [
      'Aku mau bilang sesuatu yang mungkin kamu butuh dengar:',
      'Boleh jujur nggak?',
      'Ini reminder kecil buat kamu:',
    ],
    'Reminder': [
      'Hey, sebentar.',
      'Pause sejenak ya.',
      'Pengingat untuk kamu yang lagi sibuk:',
    ],
  };

  const pillarOpeners = openers[pillar] || openers['Reminder'];
  const opener = pillarOpeners[Math.floor(Math.random() * pillarOpeners.length)];

  return `${opener}

${idea}.

Kadang kita terlalu keras sama diri sendiri — padahal yang kita butuhkan cuma sedikit ruang untuk napas dan percaya bahwa kita udah cukup baik.

Kalau kamu ngerasain hal yang sama, simpan ini. Bagikan ke orang yang mungkin butuh dengar hal ini hari ini. 🌿

—
💬 Cerita di kolom komentar, yuk. Apa yang paling kamu struggle-kan minggu ini?

#kepikiranhalbaik #TemanBaikBertumbuhMu`;
}

function getHooks(idea, pillar) {
  return `💡 3 PILIHAN HOOK untuk konten ini:

─── Hook 1: Pertanyaan reflektif ───
"Kamu pernah nggak, ${idea.toLowerCase()}?"

─── Hook 2: Statement berani ───
"Jujur: ${idea}. Dan itu valid."

─── Hook 3: POV / storytelling ───
"POV: kamu akhirnya sadar bahwa ${idea.toLowerCase()}."

─────────────────────────────────
Tips: Hook terbaik untuk ${pillar} biasanya yang bikin orang ngangguk dalam hati. Pilih yang paling relate sama audiens yang lagi kamu targetin minggu ini.`;
}

function getScript(idea, pillar) {
  return `🎬 SCRIPT REELS (~30-45 detik)

[OPENING — 0-3 detik]
Text on screen: "${idea}"
Visual: B-roll tenang / aesthetic / POV shot

[HOOK — 3-8 detik]
Voiceover atau text: "Kalau kamu lagi nonton ini, mungkin kamu butuh dengar ini..."

[INTI PESAN — 8-30 detik]
Text muncul satu per satu:
→ "${idea}"
→ "Dan itu bukan kelemahan."
→ "Itu tandamu manusia."
→ "Kamu nggak sendirian."

[CTA — 30-40 detik]
Text: "Simpan ini buat hari-hari yang berat. 🌿"
Atau: "Bagikan ke teman yang butuh ini."

[OUTRO — fade]
Logo / watermark @kepikiranhalbaik

─────────────────────────────────
🎵 Audio: Pilih audio trending yang soft/lofi
📐 Rasio: 9:16 vertikal
🖋 Font: Clean, readable, kontras tinggi`;
}

function getHashtags(pillar) {
  const base = '#kepikiranhalbaik #TemanBaikBertumbuhMu #selfgrowth #mentalhealthawareness #reminderhari';
  const byPillar = {
    'Growth Mindset': '#growthmindset #berkembang #mindsetpositif #selfimprovement #belajarterus',
    'Mental Health': '#mentalhealth #kesehataanmental #selfcare #wellbeing #emotionalhealth',
    'Reminder': '#dailyreminder #pengingatharian #quotesharian #positifvibes #motivasihari',
  };

  return `📌 SET HASHTAG REKOMENDASI

── Wajib (branding) ──
#kepikiranhalbaik #TemanBaikBertumbuhMu

── Pilar: ${pillar} ──
${byPillar[pillar] || ''}

── Niche luas ──
#selfgrowth #mentalhealthawareness #quotesid
#selfcare #mindsetshift #youngprofessional
#freshgraduate #berkembang #indonesiabertumbuh

── Lokal & trending ──
#quotesindonesia #motivasiindonesia
#selfloveid #growthjourney

─────────────────────────────
💡 Tips: Gunakan 15-20 hashtag. Mix besar (>500K post) dan niche (<100K). Rotasi hashtag tiap minggu agar jangkauan lebih luas.`;
}

function copyTemplate() {
  const text = document.getElementById('templateOutput').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    btn.textContent = '✅ Tersalin!';
    setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
  });
}

// ─── Report Generator ───
function generateReport() {
  const published = document.getElementById('rp-published').value || '14';
  const top = document.getElementById('rp-top').value || '(belum diisi)';
  const likes = document.getElementById('rp-likes').value || '0';
  const reach = document.getElementById('rp-reach').value || '0';
  const wins = document.getElementById('rp-wins').value || '(belum diisi)';
  const challenges = document.getElementById('rp-challenges').value || '(belum diisi)';
  const next = document.getElementById('rp-next').value || '(belum diisi)';

  const now = new Date();
  const fmt = d => d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });

  const report = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 LAPORAN MINGGUAN @kepikiranhalbaik
${fmt(now)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PERFORMA MINGGU INI
• Konten dipublish: ${published}/14 slot
• Konten terpopuler: ${top}
• Total likes: ${parseInt(likes).toLocaleString('id-ID')}
• Total reach: ${parseInt(reach).toLocaleString('id-ID')}

✅ PENCAPAIAN TIM
${wins}

⚠️ TANTANGAN & CATATAN
${challenges}

🎯 FOKUS MINGGU DEPAN
${next}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌿 @kepikiranhalbaik · #TemanBaikBertumbuhMu
Generated: ${fmt(now)}`;

  const out = document.getElementById('reportOutput');
  out.textContent = report;
  out.style.display = 'block';
}
