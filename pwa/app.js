// ─── Service Worker Registration ─────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}

// ─── PWA Install Prompt ───────────────────────────────────────────
let deferredPrompt = null;
const installBanner = document.getElementById('install-banner');
const installBtn    = document.getElementById('install-btn');
const dismissBtn    = document.getElementById('dismiss-btn');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  installBanner.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('Install outcome:', outcome);
  deferredPrompt = null;
  installBanner.classList.add('hidden');
});

dismissBtn.addEventListener('click', () => installBanner.classList.add('hidden'));

window.addEventListener('appinstalled', () => {
  installBanner.classList.add('hidden');
  console.log('App installed successfully');
});

// ─── State ────────────────────────────────────────────────────────
let topics        = [];
let currentIndex  = 0;
let speaking      = false;
let progressTimer = null;
let audioEl       = null; // for audio file playback

// ─── DOM Refs ─────────────────────────────────────────────────────
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

// ─── Mobile Sidebar Toggle ────────────────────────────────────────
hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
document.addEventListener('click', e => {
  if (!sidebar.contains(e.target) && e.target !== hamburger) {
    sidebar.classList.remove('open');
  }
});

// ─── Load Data ────────────────────────────────────────────────────
async function loadData() {
  try {
    const res  = await fetch('data.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    if (data.user && data.user.name) {
      userNameDisplay.textContent = '👤 ' + data.user.name;
    }

    topics = data.topics || [];
    if (topics.length === 0) throw new Error('No topics found in data.json');
    buildMenu();
  } catch (err) {
    console.error('Failed to load data.json:', err);
    topicMenu.innerHTML = `<li style="color:#f87171;padding:12px 16px;font-size:0.9rem;">
      ⚠️ Could not load data.json.<br>
      <small>Open via a local server, not file://</small>
    </li>`;
  }
}

// ─── Build Menu ───────────────────────────────────────────────────
function buildMenu() {
  topicMenu.innerHTML = '';
  topics.forEach((topic, i) => {
    const li  = document.createElement('li');
    const btn = document.createElement('button');
    btn.innerHTML = `
      <span class="menu-title">${topic.title}</span>
      <span class="menu-cat">${topic.category || ''}</span>
    `;
    btn.addEventListener('click', () => {
      currentIndex = i;
      showTopic(i);
      sidebar.classList.remove('open');
    });
    li.appendChild(btn);
    topicMenu.appendChild(li);
  });
}

// ─── Show Topic ───────────────────────────────────────────────────
function showTopic(index) {
  stopAudio();
  const topic = topics[index];
  if (!topic) return;

  // Active menu highlight
  topicMenu.querySelectorAll('button').forEach((b, i) =>
    b.classList.toggle('active', i === index)
  );

  cardCategory.textContent = topic.category || '';
  cardTitle.textContent    = topic.title;
  cardText.textContent     = topic.text;

  if (topic.image) {
    cardImage.src          = topic.image;
    cardImage.alt          = topic.title;
    cardImage.style.display = 'block';
  } else {
    cardImage.style.display = 'none';
  }

  cardCounter.textContent = `${index + 1} / ${topics.length}`;
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === topics.length - 1;

  welcomeScreen.classList.add('hidden');
  characterCard.classList.remove('hidden');

  progressBar.style.width = '0%';
  progressLabel.textContent = '';
}

// ─── Audio Playback ───────────────────────────────────────────────
// Priority: 1) audio file if provided, 2) Web Speech API (TTS)
function playAudio() {
  const topic = topics[currentIndex];

  // 1) Audio file
  if (topic.audio && topic.audio.trim() !== '') {
    playAudioFile(topic.audio);
    return;
  }

  // 2) TTS fallback
  playTTS(topic.audioText || topic.text || topic.title);
}

function playAudioFile(src) {
  stopAudio();
  audioEl = new Audio(src);
  audioEl.volume = 0.9;

  audioEl.addEventListener('play', () => {
    speaking = true;
    playBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    progressLabel.textContent = 'Playing…';
  });

  audioEl.addEventListener('timeupdate', () => {
    if (audioEl.duration) {
      progressBar.style.width = (audioEl.currentTime / audioEl.duration * 100) + '%';
    }
  });

  audioEl.addEventListener('ended', onAudioEnd);
  audioEl.addEventListener('error', () => {
    progressLabel.textContent = 'Audio file error — falling back to TTS.';
    playTTS(topics[currentIndex].audioText || topics[currentIndex].text);
  });

  audioEl.play();
}

function playTTS(text) {
  if (!('speechSynthesis' in window)) {
    progressLabel.textContent = 'Text-to-speech not supported in this browser.';
    return;
  }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.volume = 0.9;
  utt.rate   = 0.9;
  utt.pitch  = 1;

  utt.onstart = () => {
    speaking = true;
    playBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    progressLabel.textContent = 'Playing…';
    animateProgress(estimateDuration(text));
  };
  utt.onend   = onAudioEnd;
  utt.onerror = e => { progressLabel.textContent = 'TTS error: ' + e.error; stopAudio(); };

  window.speechSynthesis.speak(utt);
}

function onAudioEnd() {
  speaking = false;
  clearInterval(progressTimer);
  playBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  progressBar.style.width = '100%';
  progressLabel.textContent = 'Done';
  setTimeout(() => { progressBar.style.width = '0%'; progressLabel.textContent = ''; }, 1200);
}

function stopAudio() {
  if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; audioEl = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  speaking = false;
  clearInterval(progressTimer);
  playBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  progressBar.style.width = '0%';
  progressLabel.textContent = '';
}

function estimateDuration(text) {
  return (text.split(/\s+/).length / 150) * 60000 / 0.9;
}

function animateProgress(duration) {
  clearInterval(progressTimer);
  const start = Date.now();
  progressTimer = setInterval(() => {
    const pct = Math.min(((Date.now() - start) / duration) * 100, 99);
    progressBar.style.width = pct + '%';
    if (Date.now() - start >= duration) clearInterval(progressTimer);
  }, 100);
}

// ─── Controls ─────────────────────────────────────────────────────
playBtn.addEventListener('click', playAudio);
stopBtn.addEventListener('click', stopAudio);
prevBtn.addEventListener('click', () => { if (currentIndex > 0) showTopic(--currentIndex); });
nextBtn.addEventListener('click', () => { if (currentIndex < topics.length - 1) showTopic(++currentIndex); });

// Keyboard nav
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' && !nextBtn.disabled) nextBtn.click();
  if (e.key === 'ArrowLeft'  && !prevBtn.disabled) prevBtn.click();
  if (e.key === ' ') { e.preventDefault(); speaking ? stopAudio() : playAudio(); }
});

// ─── Init ─────────────────────────────────────────────────────────
loadData();
