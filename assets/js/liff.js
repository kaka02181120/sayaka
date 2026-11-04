(function () {
  const LIFF_SDK_URL = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
  const LIFF_ID = '2012352355-qrHWqTHH';

  function addLineDebug(message) {
    const debugNode = document.getElementById('lineUserIdDebug');
    if (!debugNode) return;
    const current = debugNode.textContent.trim();
    if (current === '未取得' || current === '') {
      debugNode.textContent = message;
    }
  }

  async function loadLiffSdk() {
    if (window.liff) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = LIFF_SDK_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('LIFF SDK load failed'));
      document.head.appendChild(script);
    });
  }

  async function init() {
    try {
      if (!window.liff) {
        addLineDebug('LIFF SDK not loaded yet, loading...');
        await loadLiffSdk();
      }

      if (!window.liff) {
        addLineDebug('LIFF SDK unavailable');
        return;
      }

      addLineDebug('calling liff.init');
      await liff.init({ liffId: LIFF_ID });
      addLineDebug('liff.init success');

      if (!liff.isLoggedIn()) {
        addLineDebug('not logged in; login requested');
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      const state = window.sayakaState || {};
      state.lineUserId = profile.userId || '';
      const lineUserIdDebug = document.getElementById('lineUserIdDebug');
      if (lineUserIdDebug) {
        lineUserIdDebug.textContent = state.lineUserId || '未取得';
      }
      addLineDebug('userId=' + state.lineUserId);

      const lineNameInput = document.getElementById('lineName');
      if (lineNameInput) {
        lineNameInput.value = profile.displayName || '';
      }
    } catch (error) {
      addLineDebug('LIFF error: ' + (error && error.message ? error.message : String(error)));
      const lineUserIdDebug = document.getElementById('lineUserIdDebug');
      if (lineUserIdDebug) {
        lineUserIdDebug.textContent = '未取得';
      }
    }
  }

  window.sayakaLiff = {
    LIFF_ID,
    loadLiffSdk,
    init,
    addLineDebug
  };
}());
