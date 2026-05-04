const appTitle = document.querySelector('header h1');
const appDescription = document.querySelector('header p');
const topicList = document.getElementById('topicList');
const topicCard = document.getElementById('topicCard');
const installButton = document.getElementById('installButton');
const offlineStatus = document.getElementById('offlineStatus');
const cacheStatus = document.getElementById('cacheStatus');
const dataUrl = './data.json';
let installPromptEvent = null;
let appData = null;

async function fetchAppData() {
  try {
    const response = await fetch(dataUrl);
    appData = await response.json();
    appTitle.textContent = appData.appName;
    appDescription.textContent = appData.description;
    buildTopicMenu(appData.topics);
    loadTopic(appData.topics[0]?.id);
  } catch (error) {
    topicCard.innerHTML = '<p class="error">Unable to load app data. Check your connection or server.</p>';
  }
}

function buildTopicMenu(topics) {
  topicList.innerHTML = topics
    .map(topic => `
      <li>
        <button type="button" data-id="${topic.id}">${topic.title || 'Untitled'}</button>
      </li>
    `)
    .join('');

  topicList.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      loadTopic(button.dataset.id);
      document.querySelectorAll('#topicList button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });
}

function loadTopic(topicId) {
  if (!appData) return;
  const topic = appData.topics.find(item => item.id === topicId) || appData.topics[0];
  if (!topic) return;
  topicCard.innerHTML = `
    <div class="topic-header">
      <div class="topic-image">
        <img src="${topic.image || 'images/placeholder.svg'}" alt="${topic.title || 'Untitled'}" loading="lazy">
      </div>
      <div>
        <h2>${topic.title || 'Untitled'}</h2>
        <p>${topic.text || 'Add your content here.'}</p>
      </div>
    </div>
    <div class="status-bar">
      <span><strong>Category:</strong> ${topic.category || 'None'}</span>
      <span><strong>Audio tip:</strong> Tap play or use the speaker icon.</span>
    </div>
    <button id="playAudio" class="install">Play audio explanation</button>
  `;

  document.querySelectorAll('#topicList button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.id === topic.id);
  });

  const playButton = document.getElementById('playAudio');
  playButton.addEventListener('click', () => speakText(topic.audioText || 'Add your audio text here.'));
}

function speakText(text) {
  if (!window.speechSynthesis) {
    alert('Speech synthesis is not available in this browser.');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1;
  utterance.volume = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPromptEvent = event;
  installButton.classList.remove('hidden');
});

installButton.addEventListener('click', async () => {
  if (!installPromptEvent) return;
  installPromptEvent.prompt();
  const { outcome } = await installPromptEvent.userChoice;
  installButton.classList.add('hidden');
  installPromptEvent = null;
  if (outcome === 'accepted') {
    console.log('User accepted the install prompt.');
  }
});

window.addEventListener('appinstalled', () => {
  cacheStatus.textContent = 'App installed successfully.';
  installButton.classList.add('hidden');
});

function updateOnlineStatus() {
  offlineStatus.textContent = navigator.onLine ? 'Online' : 'Offline';
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service worker registered with scope:', registration.scope);
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
}

fetchAppData();
updateOnlineStatus();
registerServiceWorker();
