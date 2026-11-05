const GAS_URL = 'https://script.google.com/macros/s/AKfycbw76uZdz2NAVSjMs-N5Oy2xly6knsfIr77Q6ZQYTQ0-OmP54vYc9BE2twCXVrStaoC6Og/exec';

function pageLog(msg, obj) {
  const box = document.getElementById('probeBox') || (() => {
    const d = document.createElement('div');
    d.id = 'probeBox';
    d.style.position = 'fixed';
    d.style.left = '12px';
    d.style.right = '12px';
    d.style.bottom = '12px';
    d.style.maxHeight = '260px';
    d.style.overflow = 'auto';
    d.style.background = 'rgba(0,0,0,0.85)';
    d.style.color = '#fff';
    d.style.fontSize = '12px';
    d.style.lineHeight = '1.6';
    d.style.padding = '10px';
    d.style.zIndex = '999999';
    d.style.fontFamily = 'monospace';
    d.style.whiteSpace = 'pre-wrap';
    document.body.appendChild(d);
    return d;
  })();

  const el = document.createElement('div');
  el.textContent = '[' + new Date().toLocaleTimeString('ja-JP') + '] ' + msg + ' ' + JSON.stringify(obj, null, 2);
  box.appendChild(el);
  while (box.children.length > 20) box.removeChild(box.firstChild);
}

async function testGetOnly() {
  pageLog('GET START', { url: GAS_URL + '?action=health' });

  try {
    const res = await fetch(GAS_URL + '?action=health', {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store'
    });
    const text = await res.text();
    pageLog('GET RESULT', {
      status: res.status,
      ok: res.ok,
      body: text
    });
  } catch (error) {
    pageLog('GET FAIL', {
      message: error && error.message ? error.message : String(error)
    });
  }
}

window.addEventListener('DOMContentLoaded', function () {
  testGetOnly();
});
