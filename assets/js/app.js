const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbw76uZdz2NAVSjMs-N5Oy2xly6knsfIr77Q6ZQYTQ0-OmP54vYc9BE2twCXVrStaoC6Og/exec';

const state = {
  view: 'customer',
  lineUserId: '',
  menus: [],
  slots: {},
  selectedMenuId: '',
  selectedDate: '',
  selectedTime: '',
  bookings: [],
  settings: {},
  template: ''
};

window.sayakaState = state;

function addPageDebugLog(message, payload) {
  const existing = document.getElementById('sayakaDebugLog');
  if (!existing) {
    const box = document.createElement('div');
    box.id = 'sayakaDebugLog';
    box.style.position = 'fixed';
    box.style.left = '12px';
    box.style.bottom = '12px';
    box.style.right = '12px';
    box.style.maxHeight = '220px';
    box.style.overflow = 'auto';
    box.style.background = 'rgba(0,0,0,0.82)';
    box.style.color = '#fff';
    box.style.fontSize = '12px';
    box.style.lineHeight = '1.5';
    box.style.padding = '10px';
    box.style.borderRadius = '8px';
    box.style.zIndex = '99999';
    box.style.fontFamily = 'monospace';
    box.style.whiteSpace = 'pre-wrap';
    box.style.border = '1px solid rgba(255,255,255,0.15)';
    document.body.appendChild(box);
  }

  const target = document.getElementById('sayakaDebugLog');
  const stamp = new Date().toLocaleTimeString();
  const detail = typeof payload === 'undefined' ? '' : '\n' + JSON.stringify(payload, null, 2);
  const line = '[' + stamp + '] ' + String(message) + detail;
  const current = target.textContent ? target.textContent + '\n---\n' + line : line;
  target.textContent = current.slice(-3000);
}

window.addEventListener('DOMContentLoaded', async function () {
  addPageDebugLog('DOMContentLoaded', { view: state.view, gasUrl: GAS_API_URL });
  bindUI();
  if (window.sayakaLiff && typeof window.sayakaLiff.init === 'function') {
    addPageDebugLog('LIFF init start');
    try {
      await window.sayakaLiff.init();
      addPageDebugLog('LIFF init success');
    } catch (error) {
      addPageDebugLog('LIFF init error', { message: error && error.message ? error.message : String(error) });
    }
  } else {
    addPageDebugLog('LIFF not found or init not available');
  }
  await loadRemoteData();
  renderAll();
});

function bindUI() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      if (view) setView(view);
    });
  });

  document.querySelectorAll('[data-scroll]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.getElementById('prevMonth')?.addEventListener('click', () => {
    const current = new Date(state.selectedDate || new Date());
    current.setMonth(current.getMonth() - 1);
    renderCalendar(current);
  });

  document.getElementById('nextMonth')?.addEventListener('click', () => {
    const current = new Date(state.selectedDate || new Date());
    current.setMonth(current.getMonth() + 1);
    renderCalendar(current);
  });

  document.getElementById('submitBooking')?.addEventListener('click', handleBookingSubmit);
  document.getElementById('loginAdmin')?.addEventListener('click', handleAdminLogin);
  document.getElementById('saveSettings')?.addEventListener('click', handleSaveSettings);
  document.querySelectorAll('[data-admin-tab]').forEach((tab) => {
    tab.addEventListener('click', () => showAdminTab(tab.dataset.adminTab));
  });
}

function setView(view) {
  state.view = view;
  document.getElementById('customerView').classList.toggle('hidden', view !== 'customer');
  document.getElementById('adminView').classList.toggle('hidden', view !== 'admin');
}

function showAdminTab(tabName) {
  const panels = [
    'adminLoginPanel',
    'adminSettingsPanel',
    'adminMenusPanel',
    'adminSlotsPanel',
    'adminBookingsPanel'
  ];

  panels.forEach((panelId) => {
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('hidden');
  });

  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.adminTab === tabName));

  const map = {
    login: 'adminLoginPanel',
    settings: 'adminSettingsPanel',
    menus: 'adminMenusPanel',
    slots: 'adminSlotsPanel',
    bookings: 'adminBookingsPanel'
  };

  const target = document.getElementById(map[tabName]);
  if (target) target.classList.remove('hidden');
}

async function loadRemoteData() {
  try {
    addPageDebugLog('loadRemoteData start');
    const settingsRes = await fetchJson('getSettings');
    const menusRes = await fetchJson('getMenus');
    const slotsRes = await fetchJson('getSlots');
    const bookingsRes = await fetchJson('listBookings');
    const templateRes = await fetchJson('getTemplate');

    addPageDebugLog('loadRemoteData response', {
      settingsRes,
      menusRes,
      slotsRes,
      bookingsRes,
      templateRes
    });

    if (settingsRes && settingsRes.ok && settingsRes.settings) {
      state.settings = settingsRes.settings;
    }
    if (menusRes && menusRes.ok && Array.isArray(menusRes.menus)) {
      state.menus = menusRes.menus;
    }
    if (slotsRes && slotsRes.ok && slotsRes.slots) {
      state.slots = slotsRes.slots;
    }
    if (bookingsRes && bookingsRes.ok && Array.isArray(bookingsRes.bookings)) {
      state.bookings = bookingsRes.bookings;
    }
    if (templateRes && templateRes.ok && templateRes.template) {
      state.template = templateRes.template;
    }

    addPageDebugLog('loadRemoteData state', {
      settings: state.settings,
      menusCount: state.menus.length,
      slotsKeys: Object.keys(state.slots),
      bookingsCount: state.bookings.length,
      templateSet: !!state.template
    });
  } catch (error) {
    addPageDebugLog('loadRemoteData error', {
      message: error && error.message ? error.message : String(error)
    });
    console.warn('loadRemoteData error', error);
  }
}

async function fetchJson(action, data = {}) {
  const payload = JSON.stringify({ action, data });
  addPageDebugLog('fetchJson start', { action, gasUrl: GAS_API_URL });

  try {
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: payload
    });

    addPageDebugLog('fetchJson response', {
      action,
      status: response && response.status,
      ok: response && response.ok,
      type: response && response.type,
      url: response && response.url
    });

    const text = await response.text();
    addPageDebugLog('fetchJson body', { action, text });

    try {
      const parsed = JSON.parse(text);
      addPageDebugLog('fetchJson parsed', { action, parsed });
      return parsed;
    } catch (error) {
      addPageDebugLog('fetchJson parse error', { action, raw: text });
      return { ok: false, raw: text };
    }
  } catch (error) {
    addPageDebugLog('fetchJson network error', {
      action,
      message: error && error.message ? error.message : String(error)
    });
    throw error;
  }
}

function renderAll() {
  renderMenus();
  renderCalendar(new Date());
  updateSummary();
  updateAdminStatus();
}

function renderMenus() {
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = '';

  state.menus.forEach((menu) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'menu-card' + (state.selectedMenuId === menu.id ? ' selected' : '');
    card.innerHTML = `
      <div class="menu-thumb">
        <img src="${menu.icon || ''}" alt="${menu.title}" onerror="this.style.display='none'" />
      </div>
      <div class="menu-head">
        <h3>${menu.title}</h3>
        <div class="menu-meta">
          <span>${menu.duration}</span>
          <strong>¥${Number(menu.price || 0).toLocaleString()}</strong>
        </div>
      </div>
      <p>${menu.description || ''}</p>
      <ul>${(menu.includes || []).map((item) => '<li>' + item + '</li>').join('')}</ul>
    `;
    card.addEventListener('click', () => {
      state.selectedMenuId = menu.id;
      renderMenus();
      updateSummary();
    });
    grid.appendChild(card);
  });

  if (!state.menus.length) {
    grid.innerHTML = '<div class="panel">メニューがまだありません。</div>';
  }
}

function renderCalendar(date) {
  const calendar = document.getElementById('calendar');
  const monthLabel = document.getElementById('monthLabel');
  if (!calendar || !monthLabel) return;

  const current = new Date(date.getFullYear(), date.getMonth(), 1);
  monthLabel.textContent = `${current.getFullYear()}年 ${current.getMonth() + 1}月`;
  calendar.innerHTML = '';

  const firstWeekday = new Date(current.getFullYear(), current.getMonth(), 1).getDay();
  const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();

  for (let i = 0; i < firstWeekday; i++) {
    const blank = document.createElement('div');
    blank.className = 'calendar-day muted';
    calendar.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const value = new Date(current.getFullYear(), current.getMonth(), day);
    const dateKey = formatDate(value);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'calendar-day' + (dateKey === state.selectedDate ? ' selected' : '');
    btn.innerHTML = `<span>${day}</span>`;
    btn.addEventListener('click', () => {
      state.selectedDate = dateKey;
      renderCalendar(current);
      renderSlotsForDate(dateKey);
      updateSummary();
    });
    calendar.appendChild(btn);
  }

  if (state.selectedDate) {
    renderSlotsForDate(state.selectedDate);
  }
}

function renderSlotsForDate(dateKey) {
  const slotBox = document.getElementById('slotBox');
  const slotGrid = document.getElementById('slotGrid');
  if (!slotBox || !slotGrid) return;

  const allSlots = state.slots[dateKey] || [];
  slotGrid.innerHTML = '';

  if (!allSlots.length) {
    slotBox.classList.add('hidden');
    return;
  }

  slotBox.classList.remove('hidden');
  allSlots.forEach((time) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'slot-button' + (state.selectedTime === time ? ' selected' : '');
    button.textContent = time;
    button.addEventListener('click', () => {
      state.selectedTime = time;
      renderSlotsForDate(dateKey);
      updateSummary();
    });
    slotGrid.appendChild(button);
  });
}

function updateSummary() {
  const summary = document.getElementById('summary');
  if (!summary) return;

  const selectedMenu = state.menus.find((menu) => menu.id === state.selectedMenuId) || state.menus[0];
  const menuLabel = selectedMenu ? selectedMenu.title : '未選択';
  const dateLabel = state.selectedDate || '未選択';
  const timeLabel = state.selectedTime || '未選択';

  summary.innerHTML = `
    <div><strong>メニュー:</strong> ${menuLabel}</div>
    <div><strong>日付:</strong> ${dateLabel}</div>
    <div><strong>時間:</strong> ${timeLabel}</div>
  `;
}

function updateAdminStatus() {
  document.getElementById('adminLineId').textContent = state.settings.adminLineId || '-';
  document.getElementById('adminLineUrl').textContent = state.settings.lineUrl || '-';
  document.getElementById('adminPasswordStatus').textContent = state.settings.password ? '設定済み' : '未設定';
}

async function handleBookingSubmit() {
  const guestName = document.getElementById('guestName').value.trim();
  const lineName = document.getElementById('lineName').value.trim();
  const consultation = document.getElementById('consultation').value.trim();

  if (!state.selectedMenuId || !state.selectedDate || !state.selectedTime || !guestName) {
    alert('メニュー・日付・時間・お名前を入力してください');
    return;
  }

  const selectedMenu = state.menus.find((menu) => menu.id === state.selectedMenuId) || {};
  const bookingData = {
    menuId: state.selectedMenuId,
    menuTitle: selectedMenu.title || '',
    date: state.selectedDate,
    time: state.selectedTime,
    name: guestName,
    lineName,
    consultation,
    lineUserId: state.lineUserId || '',
    price: selectedMenu.price || '',
    duration: selectedMenu.duration || ''
  };

  try {
    const result = await fetchJson('createBooking', bookingData);
    if (result && result.ok) {
      alert('予約を登録しました');
    } else {
      alert(result && result.message ? result.message : '予約の登録に失敗しました');
    }
  } catch (error) {
    alert('予約登録中にエラーが発生しました');
  }
}

async function handleAdminLogin() {
  const password = document.getElementById('adminPassword').value;
  const result = await fetchJson('loginAdmin', { password });
  if (result && result.ok) {
    alert('ログインしました');
    showAdminTab('settings');
  } else {
    alert('パスワードが違います');
  }
}

async function handleSaveSettings() {
  const settings = {
    lineUrl: document.getElementById('lineUrlInput').value,
    lineId: document.getElementById('lineIdInput').value,
    adminLineId: document.getElementById('adminLineIdInput').value,
    password: document.getElementById('passwordInput').value
  };

  const result = await fetchJson('saveSettings', settings);
  if (result && result.ok) {
    alert('設定を保存しました');
  } else {
    alert('設定の保存に失敗しました');
  }
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
