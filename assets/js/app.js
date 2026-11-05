const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbw76uZdz2NAVSjMs-N5Oy2xly6knsfIr77Q6ZQYTQ0-OmP54vYc9BE2twCXVrStaoC6Og/exec';

function ensurePageDebugBox() {
  let box = document.getElementById('pageDebugBox');
  if (box) return box;

  box = document.createElement('div');
  box.id = 'pageDebugBox';
  box.style.position = 'fixed';
  box.style.left = '12px';
  box.style.right = '12px';
  box.style.bottom = '12px';
  box.style.maxHeight = '260px';
  box.style.overflow = 'auto';
  box.style.background = 'rgba(0,0,0,0.85)';
  box.style.color = '#fff';
  box.style.fontSize = '12px';
  box.style.lineHeight = '1.6';
  box.style.padding = '10px';
  box.style.borderRadius = '8px';
  box.style.zIndex = '2147483647';
  box.style.fontFamily = 'monospace';
  box.style.whiteSpace = 'pre-wrap';
  box.style.border = '1px solid rgba(255,255,255,0.2)';
  document.body.appendChild(box);
  return box;
}

function pageLog(label, data) {
  const box = ensurePageDebugBox();
  const text = typeof data === 'undefined'
    ? String(label)
    : String(label) + ' ' + JSON.stringify(data, null, 2);

  const line = document.createElement('div');
  line.textContent = '[' + new Date().toLocaleTimeString('ja-JP') + '] ' + text;
  line.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
  line.style.paddingBottom = '4px';
  box.appendChild(line);

  while (box.children.length > 40) {
    box.removeChild(box.firstChild);
  }
}

window.addEventListener('error', function (event) {
  pageLog('window error', {
    message: event && event.message ? event.message : String(event),
    filename: event && event.filename ? event.filename : '',
    lineno: event && event.lineno ? event.lineno : '',
    colno: event && event.colno ? event.colno : ''
  });
});

async function testPingFromPage() {
  pageLog('POST START', { gasUrl: GAS_API_URL });

  try {
    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        action: 'ping',
        data: {
          source: 'page-debug',
          ok: true
        }
      })
    });

    const text = await res.text();
    pageLog('POST RESULT', {
      status: res.status,
      ok: res.ok,
      body: text
    });
  } catch (error) {
    pageLog('POST FAIL', {
      message: error && error.message ? error.message : String(error)
    });
  }
}

window.addEventListener('DOMContentLoaded', function () {
  pageLog('DOM loaded', { gasUrl: GAS_API_URL });
  testPingFromPage();
});
