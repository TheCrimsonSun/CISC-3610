// ═══════════════════════════════════════════════════════════════════
// SERVICE WORKER REGISTRATION
// ═══════════════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => console.log('[SW] registered, scope:', reg.scope))
      .catch(err => console.warn('[SW] failed:', err));
  });
}

// ═══════════════════════════════════════════════════════════════════
// PWA INSTALL
// beforeinstallprompt fires in Chrome/Edge on HTTPS or localhost.
// Brave blocks it unless shields are down — we handle that gracefully.
// Firefox and Safari never fire it — we show browser-specific tips.
// ═══════════════════════════════════════════════════════════════════
let deferredPrompt = null;

// Detect browser so we can show the right fallback instructions
function getBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Brave') || navigator.brave) return 'brave';
  if (ua.includes('Firefox'))  return 'firefox';
  if (ua.includes('Edg/'))     return 'edge';
  if (ua.includes('Chrome'))   return 'chrome';
  if (ua.includes('Safari'))   return 'safari';
  return 'other';
}

// Per-browser instructions for when the prompt isn't available
const INSTALL_TIPS = {
  brave:   'In Brave: click the ⋮ menu → "Install Gensokyo Archive…"\n(You may also need to go to brave://settings/shields and disable Brave Shields for this site.)',
  firefox: 'In Firefox: click the install icon (⊕) in the address bar, or go to the browser menu → "Install this site as an app".',
  safari:  'In Safari on iPhone/iPad: tap the Share button (□↑) → "Add to Home Screen".',
  edge:    'In Edge: click the install icon (⊕) in the address bar.',
  chrome:  'In Chrome: click the install icon (⊕) in the address bar.',
  other:   'Look for an install or "Add to Home Screen" option in your browser\'s menu.',
};

function getAllInstallBtns() {
  return ['install-btn', 'install-btn-2']
    .map(id => document.getElementById(id))
    .filter(Boolean);
}

function markInstallReady() {
  getAllInstallBtns().forEach(btn => {
    btn.disabled = false;
    btn.innerHTML = '📥 Install App';
  });
  const note = document.getElementById('install-note');
  if (note) note.textContent = 'Click to install — your browser is ready!';
  const banner = document.getElementById('install-banner');
  if (banner) banner.classList.remove('hidden');
}

function markInstallDone() {
  getAllInstallBtns().forEach(btn => {
    btn.disabled = true;
    btn.innerHTML = '✅ Installed!';
  });
  const success = document.getElementById('install-success');
  if (success) success.style.display = 'block';
  const note = document.getElementById('install-note');
  if (note) note.style.display = 'none';
  const banner = document.getElementById('install-banner');
  if (banner) banner.classList.add('hidden');
}

function showInstallFallback() {
  const browser = getBrowser();
  const tip = INSTALL_TIPS[browser] || INSTALL_TIPS.other;

  // Update the note text instead of using alert()
  const note = document.getElementById('install-note');
  if (note) {
    note.style.display = 'block';
    note.style.color = '#fbbf24';
    note.textContent = tip;
  }

  // Also show a visible in-page message on the install buttons
  getAllInstallBtns().forEach(btn => {
    btn.disabled = false;
    btn.innerHTML = '📥 Install App';
    btn.title = tip;
  });

  // Show a styled toast if we're on the main app page
  const banner = document.getElementById('install-banner');
  if (banner) {
    banner.querySelector('span').textContent = tip;
    banner.classList.remove('hidden');
  }
}

async function triggerInstall() {
  if (deferredPrompt) {
    // Standard path: Chrome/Edge on HTTPS
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] install outcome:', outcome);
    deferredPrompt = null;
    if (outcome === 'accepted') {
      markInstallDone();
    }
  } else {
    // Brave / Firefox / Safari — show friendly browser-specific tip
    showInstallFallback();
  }
}

// Browser fires this when install criteria are met (Chrome/Edge, not Brave)
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] beforeinstallprompt — install available');
  markInstallReady();
});

window.addEventListener('appinstalled', () => {
  console.log('[PWA] installed!');
  deferredPrompt = null;
  markInstallDone();
});

// Wire up buttons after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  getAllInstallBtns().forEach(btn => btn.addEventListener('click', triggerInstall));

  const dismissBtn = document.getElementById('dismiss-btn');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      const banner = document.getElementById('install-banner');
      if (banner) banner.classList.add('hidden');
    });
  }

  // On Chrome/Edge: show address bar tip proactively in the note
  // if beforeinstallprompt hasn't fired yet after a short delay
  setTimeout(() => {
    if (!deferredPrompt) {
      const browser = getBrowser();
      const note = document.getElementById('install-note');
      if (note && (browser === 'brave' || browser === 'firefox' || browser === 'safari')) {
        note.textContent = INSTALL_TIPS[browser];
        note.style.display = 'block';
      }
    }
  }, 2000);
});

// ═══════════════════════════════════════════════════════════════════
// STOP HERE if not the main app page (no topic-menu = promo/home page)
// ═══════════════════════════════════════════════════════════════════
if (!document.getElementById('topic-menu')) {
  // promo.html / home.html — install logic above is all that's needed
} else {

// ═══════════════════════════════════════════════════════════════════
// APP STATE & LOGIC
// ═══════════════════════════════════════════════════════════════════
let topics        = [];
let currentIndex  = 0;
let speaking      = false;
let progressTimer = null;
let audioEl       = null;

const topicMenu       = document.getElementById('topic-menu');
const welcomeScreen   = document.getElementById('welcome-screen');
const characterCard   = document.getElementById('character-card');
const cardCategory    = document.getElementById('card-category');
const cardTitle       = document.getElementById('card-title');
const cardImage       = document.getElementById('card-image');
const cardText        = document.getElementById('card-text');
const playBtn         = document.getElementById('play-btn');
const stopBtn         = document.getElementById('stop-btn');
const progressBar     = document.getElementById('progress-bar');
const progressLabel   = document.getElementById('progress-label');
const prevBtn         = document.getElementById('prev-btn');
const nextBtn         = document.getElementById('next-btn');
const cardCounter     = document.getElementById('card-counter');
const userNameDisplay = document.getElementById('user-name-display');
const sidebar         = document.getElementById('sidebar');
const hamburger       = document.getElementById('hamburger');

hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
document.addEventListener('click', e => {
  if (!sidebar.contains(e.target) && e.target !== hamburger) {
    sidebar.classList.remove('open');
  }
});

async function loadData() {
  try {
    const res  = await fetch('./data.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.user?.name) userNameDisplay.textContent = '👤 ' + data.user.name;
    topics = data.topics || [];
    if (!topics.length) throw new Error('No topics in data.json');
    buildMenu();
  } catch (err) {
    console.error('[App] data.json load failed:', err);
    topicMenu.innerHTML = `<li style="color:#f87171;padding:12px 16px;font-size:0.9rem;line-height:1.6;">
      ⚠️ Could not load data.json<br><small>Serve via a local server, not file://</small></li>`;
  }
}

function buildMenu() {
  topicMenu.innerHTML = '';
  topics.forEach((topic, i) => {
    const li  = document.createElement('li');
    const btn = document.createElement('button');
    btn.innerHTML = `<span class="menu-title">${topic.title}</span><span class="menu-cat">${topic.category || ''}</span>`;
    btn.addEventListener('click', () => { currentIndex = i; showTopic(i); sidebar.classList.remove('open'); });
    li.appendChild(btn);
    topicMenu.appendChild(li);
  });
}

function showTopic(index) {
  stopAudio();
  const topic = topics[index];
  if (!topic) return;
  topicMenu.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === index));
  cardCategory.textContent    = topic.category || '';
  cardTitle.textContent       = topic.title;
  cardText.textContent        = topic.text;
  cardCounter.textContent     = `${index + 1} / ${topics.length}`;
  prevBtn.disabled            = index === 0;
  nextBtn.disabled            = index === topics.length - 1;
  if (topic.image) { cardImage.src = topic.image; cardImage.alt = topic.title; cardImage.style.display = 'block'; }
  else { cardImage.style.display = 'none'; }
  welcomeScreen.classList.add('hidden');
  characterCard.classList.remove('hidden');
  progressBar.style.width = '0%';
  progressLabel.textContent = '';
}

function playAudio() {
  const topic = topics[currentIndex];
  if (topic.audio?.trim()) { playAudioFile(topic.audio); }
  else { playTTS(topic.audioText || topic.text || topic.title); }
}

function playAudioFile(src) {
  stopAudio();
  audioEl = new Audio(src);
  audioEl.volume = 0.9;
  audioEl.addEventListener('play', () => { speaking = true; playBtn.classList.add('hidden'); stopBtn.classList.remove('hidden'); progressLabel.textContent = 'Playing…'; });
  audioEl.addEventListener('timeupdate', () => { if (audioEl.duration) progressBar.style.width = (audioEl.currentTime / audioEl.duration * 100) + '%'; });
  audioEl.addEventListener('ended', onAudioEnd);
  audioEl.addEventListener('error', () => { progressLabel.textContent = 'Audio error — using TTS.'; playTTS(topics[currentIndex].audioText || topics[currentIndex].text); });
  audioEl.play();
}

function playTTS(text) {
  if (!('speechSynthesis' in window)) { progressLabel.textContent = 'TTS not supported.'; return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.volume = 0.9; utt.rate = 0.9; utt.pitch = 1;
  utt.onstart = () => { speaking = true; playBtn.classList.add('hidden'); stopBtn.classList.remove('hidden'); progressLabel.textContent = 'Playing…'; animateProgress(estimateDuration(text)); };
  utt.onend   = onAudioEnd;
  utt.onerror = e => { progressLabel.textContent = 'TTS error: ' + e.error; stopAudio(); };
  window.speechSynthesis.speak(utt);
}

function onAudioEnd() {
  speaking = false; clearInterval(progressTimer);
  playBtn.classList.remove('hidden'); stopBtn.classList.add('hidden');
  progressBar.style.width = '100%'; progressLabel.textContent = 'Done';
  setTimeout(() => { progressBar.style.width = '0%'; progressLabel.textContent = ''; }, 1200);
}

function stopAudio() {
  if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; audioEl = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  speaking = false; clearInterval(progressTimer);
  playBtn.classList.remove('hidden'); stopBtn.classList.add('hidden');
  progressBar.style.width = '0%'; progressLabel.textContent = '';
}

function estimateDuration(text) { return (text.split(/\s+/).length / 150) * 60000 / 0.9; }

function animateProgress(duration) {
  clearInterval(progressTimer);
  const start = Date.now();
  progressTimer = setInterval(() => {
    const pct = Math.min(((Date.now() - start) / duration) * 100, 99);
    progressBar.style.width = pct + '%';
    if (Date.now() - start >= duration) clearInterval(progressTimer);
  }, 100);
}

playBtn.addEventListener('click', playAudio);
stopBtn.addEventListener('click', stopAudio);
prevBtn.addEventListener('click', () => { if (currentIndex > 0) showTopic(--currentIndex); });
nextBtn.addEventListener('click', () => { if (currentIndex < topics.length - 1) showTopic(++currentIndex); });
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' && !nextBtn.disabled) nextBtn.click();
  if (e.key === 'ArrowLeft'  && !prevBtn.disabled) prevBtn.click();
  if (e.key === ' ') { e.preventDefault(); speaking ? stopAudio() : playAudio(); }
});

loadData();

} // end app-only block
