(function () {
  let deferredPrompt = null;
  const installBtn = document.getElementById('installBtn');
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone()) installBtn.classList.add('hidden');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  installBtn.addEventListener('click', async () => {
    if (isStandalone()) { alert('Апликација је већ инсталирана.'); return; }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (e) {}
      deferredPrompt = null;
      return;
    }
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    alert(isIos
      ? 'iPhone/iPad (Safari): тапни „Подели" (□↑) → „Add to Home Screen" → „Add".'
      : 'Android (Chrome): мени (⋮) → „Install app" / „Add to Home screen".');
  });

  window.addEventListener('appinstalled', () => installBtn.classList.add('hidden'));
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('service-worker.js', { updateViaCache: 'none' })
      .catch(() => {});
  });
}
