// app.js にそのまま追加
const TEST_API_URL = GAS_API_URL;

async function testPostAvailability() {
  console.log('[POST TEST] start', TEST_API_URL);

  try {
    const response = await fetch(TEST_API_URL, {
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
        data: { ok: true, source: 'browser' }
      })
    });

    const text = await response.text();
    console.log('[POST TEST] status=', response.status);
    console.log('[POST TEST] body=', text);

    alert('POSTテスト結果: ' + response.status + ' / ' + text);
    return { status: response.status, text };
  } catch (error) {
    console.log('[POST TEST] ERROR', error);
    alert('POSTテスト失敗: ' + (error && error.message ? error.message : String(error)));
    return { error: String(error) };
  }
}

// 画面読み込み時に自動実行
window.addEventListener('DOMContentLoaded', function () {
  testPostAvailability();
});
