const installButton = document.getElementById('installButton');

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  installButton.classList.remove('hidden');
});

installButton.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installButton.classList.add('hidden');
  console.log('Install result:', choice.outcome);
});

window.addEventListener('appinstalled', () => {
  console.log('PWA installed');
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service worker registered:', reg.scope))
      .catch(err => console.error('Service worker registration failed:', err));
  }
}

registerServiceWorker();
