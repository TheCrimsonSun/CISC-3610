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

dismissBtn.addEventListener('click', () => {
  installBanner.classList.add('hidden');
});

// ─── State ────────────────────────────────────────────────────────
let topics       = [];
let currentIndex = 0;
let utterance    = null;
let speaking     = false;
let progressTimer = null;

// ─── DOM Refs ─────────────────────────────────────────────────────
const topicMenu      = document.getElementById('topic-menu');
const welcomeScreen  = document.getElementById('welcome-screen');
const characterCard  = document.getElementById('character-card');
const cardCategory   = document.getElementById('card-category');
const cardTitle      = document.getElementById('card-title');
const cardImage      = document.getElementById('card-image');
const cardText       = document.getElementById('card-text');
const playBtn        = document.getElementById('play-btn');
const stopBtn        = document.getElementById('stop-btn');
const progressBar    = document.getElementById('progress-bar');
const progressLabel  = document.getElementById('progress-label');
const prevBtn        = document.getElementById('prev-btn');
const nextBtn        = document.getElementById('next-btn');
const cardCounter    = document.getElementById('card-counter');
const userNameDisplay = document.getElementById('user-name-display');

// Mobile hamburger
const hamburger = document.createElement('button');
hamburger.id = 'hamburger';
hamburger.setAttribute('aria-label', 'Toggle menu');
hamburger.innerHTML = '<span></span><span></span><span></span>';
document.body.appendChild(hamburger);
const sidebar = document.getElementById('sidebar');
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
    const data = await res.json();

    // Display user name
    if (data.user && data.user.name) {
      userNameDisplay.textContent = '👤 ' + data.user.name;
    }

    topics = data.topics || [];
    buildMenu();
  } catch (err) {
    console.error('Failed to load data.json:', err);
    topicMenu.innerHTML = '<li style="color:#f87171;padding:12px 16px;font-size:0.9rem;">Could not load data.json</li>';
  }
}

// ─── Build Sidebar Menu ───────────────────────────────────────────
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

  // Update active menu item
  const buttons = topicMenu.querySelectorAll('button');
  buttons.forEach((b, i) => b.classList.toggle('active', i === index));

  // Populate card
  cardCategory.textContent = topic.category || '';
  cardTitle.textContent    = topic.title;
  cardText.textContent     = topic.text;

  if (topic.image) {
    cardImage.src = topic.image;
    cardImage.alt = topic.title;
    cardImage.style.display = 'block';
  } else {
    cardImage.style.display = 'none';
  }

  // Counter
  cardCounter.textContent = `${index + 1} / ${topics.length}`;

  // Nav buttons
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === topics.length - 1;

  // Show card, hide welcome
  welcomeScreen.classList.add('hidden');
  characterCard.classList.remove('hidden');

  // Reset progress
  progressBar.style.width = '0%';
  progressLabel.textContent = '';
}

// ─── Audio (Web Speech API) ───────────────────────────────────────
function playAudio() {
  if (!('speechSynthesis' in window)) {
    progressLabel.textContent = 'Text-to-speech not supported in this browser.';
    return;
  }

  const topic = topics[currentIndex];
  const text  = topic.audioText || topic.text || topic.title;

  window.speechSynthesis.cancel();
  utterance = new SpeechSynthesisUtterance(text);

  // Apply preferences from data.json if available
  utterance.volume = 0.9;
  utterance.rate   = 0.9;
  utterance.pitch  = 1;

  utterance.onstart = () => {
    speaking = true;
    playBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    progressLabel.textContent = 'Playing…';
    animateProgress(estimateDuration(text));
  };

  utterance.onend = () => {
    speaking = false;
    playBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    progressBar.style.width = '100%';
    progressLabel.textContent = 'Done';
    clearInterval(progressTimer);
    setTimeout(() => {
      progressBar.style.width = '0%';
      progressLabel.textContent = '';
    }, 1200);
  };

  utterance.onerror = (e) => {
    progressLabel.textContent = 'Audio error: ' + e.error;
    stopAudio();
  };

  window.speechSynthesis.speak(utterance);
}

function stopAudio() {
  window.speechSynthesis && window.speechSynthesis.cancel();
  speaking = false;
  clearInterval(progressTimer);
  playBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  progressBar.style.width = '0%';
  progressLabel.textContent = '';
}

function estimateDuration(text) {
  // ~150 words per minute at rate 0.9
  const words = text.split(/\s+/).length;
  return (words / 150) * 60 * 1000 / 0.9;
}

function animateProgress(duration) {
  clearInterval(progressTimer);
  const start = Date.now();
  progressTimer = setInterval(() => {
    const elapsed = Date.now() - start;
    const pct = Math.min((elapsed / duration) * 100, 99);
    progressBar.style.width = pct + '%';
    if (elapsed >= duration) clearInterval(progressTimer);
  }, 100);
}

// ─── Event Listeners ─────────────────────────────────────────────
playBtn.addEventListener('click', playAudio);
stopBtn.addEventListener('click', stopAudio);

prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    showTopic(currentIndex);
  }
});

nextBtn.addEventListener('click', () => {
  if (currentIndex < topics.length - 1) {
    currentIndex++;
    showTopic(currentIndex);
  }
});

// ─── Keyboard Navigation ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' && !nextBtn.disabled) nextBtn.click();
  if (e.key === 'ArrowLeft'  && !prevBtn.disabled) prevBtn.click();
  if (e.key === ' ') { e.preventDefault(); speaking ? stopAudio() : playAudio(); }
});

// ─── Init ─────────────────────────────────────────────────────────
loadData();
