(function() {
'use strict';

// ══ STATE ══════════════════════════════════════════════════════════
const S = {
  logs: [],
  network: [],
  dbs: [],
  activeTab: 'console',
  activeStorage: 'indexeddb',
  isPicking: false,
  replHistory: [],
  replHistoryIdx: -1,
  errorCount: 0,
  settings: {
    timestamps: true,
    autoScroll: true,
    maxEntries: 500,
    fontSize: 12,
    monitorNetwork: true,
    captureErrors: true,
    theme: 'dark',
  }
};

// ══ SETTINGS PERSISTENCE ══════════════════════════════════════════
function saveSettings() {
  try { localStorage.setItem('__dc_settings', JSON.stringify(S.settings)); } catch(e) {}
}

function loadSettings() {
  try {
    const saved = localStorage.getItem('__dc_settings');
    if (saved) S.settings = { ...S.settings, ...JSON.parse(saved) };
  } catch(e) {}
}

loadSettings();

// ══ ELEMENTS ══════════════════════════════════════════════════════
const el = {
  fab:      () => document.getElementById('dc-fab'),
  panel:    () => document.getElementById('dc-panel'),
  drag:     () => document.getElementById('dc-drag'),
  consOut:  () => document.getElementById('console-output'),
  netOut:   () => document.getElementById('network-output'),
  storOut:  () => document.getElementById('storage-output'),
  domOut:   () => document.getElementById('dom-output'),
  sysOut:   () => document.getElementById('system-output'),
  settOut:  () => document.getElementById('settings-output'),
  replIn:   () => document.getElementById('repl-input'),
  replRun:  () => document.getElementById('repl-run'),
  netFlt:   () => document.getElementById('net-filter'),
  badge:    () => document.getElementById('dc-error-badge'),
  cntC:     () => document.getElementById('cnt-console'),
  cntN:     () => document.getElementById('cnt-network'),
};

// ══ UTILS ═════════════════════════════════════════════════════════
function ts() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`;
}

function formatArg(a) {
  if (a === null) return '<span style="color:#aaa">null</span>';
  if (a === undefined) return '<span style="color:#aaa">undefined</span>';
  if (typeof a === 'object') {
    try {
      const s = JSON.stringify(a, null, 2);
      return `<pre>${escHtml(s)}</pre>`;


} catch(e) { return String(a); }


}
return escHtml(String(a));
}

function escHtml(s) {
return s.replace(/&/g,’&’).replace(/</g,’<’).replace(/>/g,’>’);
}

function truncUrl(url, max=55) {
if (!url || url.length <= max) return url;
try {
const u = new URL(url);
const tail = u.pathname.split(’/’).pop() || ‘’;
return `${u.hostname}/…/${tail}`;
} catch(e) {
return url.slice(0,max)+’…’;
}
}

function statusClass(code) {
if (!code) return ‘’;
if (code < 300) return ‘s-ok’;
if (code < 400) return ‘s-redir’;
return ‘s-err’;
}

function methodClass(m) {
return `m-${['GET','POST','PUT','DELETE','PATCH'].includes(m) ? m : 'UNK'}`;
}

// ══ CONSOLE INTERCEPT ═════════════════════════════════════════════
const _orig = {};
[‘log’,‘warn’,‘error’,‘info’].forEach(level => {
_orig[level] = console[level].bind(console);
console[level] = (…args) => {
_orig[level](...args);
addLog(level, args);
};
});

function addLog(type, args) {
if (type === ‘error’) {
S.errorCount++;
const b = el.badge();
if (b) { b.textContent = S.errorCount > 99 ? ‘99+’ : S.errorCount; b.style.display = ‘flex’; }
}
S.logs.push({ type, args, ts: ts() });
if (S.logs.length > S.settings.maxEntries) S.logs.shift();
updateTabCount(‘console’, S.logs.length);
if (S.activeTab === ‘console’) renderConsole();
}

function renderConsole() {
const o = el.consOut(); if (!o) return;
const frag = document.createDocumentFragment();
S.logs.forEach(log => {
const d = document.createElement(‘div’);
d.className = `dc-entry dc-entry-${log.type}`;
const tsHtml = S.settings.timestamps ? `<span class="dc-ts">${log.ts}</span>` : ‘’;
const msgHtml = log.args.map(formatArg).join(’ ’);
d.innerHTML = `${tsHtml}<span>${msgHtml}</span>`;
d.style.fontSize = S.settings.fontSize + ‘px’;
frag.appendChild(d);
});
o.innerHTML = ‘’;
o.appendChild(frag);
if (S.settings.autoScroll) o.scrollTop = o.scrollHeight;
}

// ══ ERROR CAPTURE ═════════════════════════════════════════════════
if (S.settings.captureErrors) {
window.onerror = (msg, src, line, col) => {
addLog(‘error’, [`${msg} @ ${src}:${line}:${col}`]);
return false;
};
window.addEventListener(‘unhandledrejection’, e => {
addLog(‘error’, [`Unhandled Promise Rejection: ${e.reason}`]);
});
}

// ══ NETWORK INTERCEPT ═════════════════════════════════════════════
const _origFetch = window.fetch;
window.fetch = async (…args) => {
const startTime = Date.now();
let method = ‘GET’;
let url = args[0] instanceof Request ? args[0].url : String(args[0]);
if (args[1] && args[1].method) method = args[1].method.toUpperCase();
if (args[0] instanceof Request) method = args[0].method.toUpperCase();
const req = { method, url, ts: ts(), startTime, status: null, duration: null, headers: {}, error: null };

try {
const res = await _origFetch(…args);
req.status = res.status;
req.statusText = res.statusText;
req.duration = Date.now() - startTime;
try { res.headers.forEach((v,k) => { req.headers[k] = v; }); } catch(e) {}
addNetReq(req);
return res;
} catch(e) {
req.error = e.message;
req.duration = Date.now() - startTime;
addNetReq(req);
throw e;
}
};

const _origOpen = XMLHttpRequest.prototype.open;
const _origSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url) {
this.__dcReq = { method: method.toUpperCase(), url: String(url), ts: ts(), startTime: 0 };
return _origOpen.apply(this, arguments);
};

XMLHttpRequest.prototype.send = function(body) {
if (this.__dcReq) {
const req = this.__dcReq;
req.startTime = Date.now();
this.addEventListener(‘loadend’, () => {
req.status = this.status;
req.statusText = this.statusText;
req.duration = Date.now() - req.startTime;
req.headers = {};
const raw = this.getAllResponseHeaders();
if (raw) raw.split(’\r\n’).filter(Boolean).forEach(line => {
const i = line.indexOf(’: ’);
if (i > 0) req.headers[line.slice(0,i)] = line.slice(i+2);
});
req.error = this.status === 0 ? ‘Request failed’ : null;
addNetReq(req);
});
}
return _origSend.apply(this, arguments);
};

function addNetReq(req) {
S.network.unshift(req);
if (S.network.length > S.settings.maxEntries) S.network.pop();
updateTabCount(‘network’, S.network.length);
if (S.activeTab === ‘network’) renderNetwork();
}

function renderNetwork(filter) {
const o = el.netOut(); if (!o) return;
filter = filter !== undefined ? filter : (el.netFlt() ? el.netFlt().value : ‘’);
const filtered = filter
? S.network.filter(r => r.url.toLowerCase().includes(filter.toLowerCase()) || r.method.toLowerCase().includes(filter.toLowerCase()))
: S.network;

o.innerHTML = filtered.map((req, i) => {
const sc = req.error ? ‘s-err’ : statusClass(req.status);
const mc = methodClass(req.method);
const statusLabel = req.status ? `<span class="dc-req-status ${sc}">${req.status}</span>` : (req.error ? `<span class="dc-req-status s-err">ERR</span>` : ‘<span class="dc-req-status" style="color:var(--text2)">…</span>’);
const durLabel = req.duration != null ? `${req.duration}ms · ` : ‘’;
const headersHtml = Object.keys(req.headers).length
? Object.entries(req.headers).map(([k,v]) => `<div class="dc-detail-row"><span class="dc-detail-key">${escHtml(k)}: </span>${escHtml(v)}</div>`).join(’’)
: ‘<div class="dc-detail-row" style="color:var(--text2)">none</div>’;
return `<div class="dc-req" id="req-${i}" onclick="window.__dcToggleReq(${i})">
  <div class="dc-req-top">
    <span class="dc-method ${mc}">${req.method}</span>
    <span class="dc-req-url" title="${escHtml(req.url)}">${escHtml(truncUrl(req.url))}</span>
    ${statusLabel}
  </div>
  <div class="dc-req-meta">${durLabel}${req.ts}${req.error ? ' · ' + escHtml(req.error) : ''}</div>
  <div class="dc-req-detail" id="req-detail-${i}">
    <div class="dc-detail-section">
      <div class="dc-detail-title">General</div>
      <div class="dc-detail-row"><span class="dc-detail-key">URL: </span>${escHtml(req.url)}</div>
      <div class="dc-detail-row"><span class="dc-detail-key">Method: </span>${req.method}</div>
      <div class="dc-detail-row"><span class="dc-detail-key">Status: </span>${req.status || req.error || '–'} ${req.statusText || ''}</div>
      <div class="dc-detail-row"><span class="dc-detail-key">Duration: </span>${req.duration != null ? req.duration+'ms' : '–'}</div>
    </div>
    <div class="dc-detail-section">
      <div class="dc-detail-title">Response Headers</div>
      ${headersHtml}
    </div>
  </div>
</div>`;

}).join(’’) || ‘<div class="dc-empty">No requests captured yet</div>’;
}

window.__dcToggleReq = function(i) {
const detail = document.getElementById(`req-detail-${i}`);
const card   = document.getElementById(`req-${i}`);
if (!detail) return;
const isOpen = detail.classList.contains(‘open’);
detail.classList.toggle(‘open’, !isOpen);
card.classList.toggle(‘expanded’, !isOpen);
};

// ══ STORAGE ═══════════════════════════════════════════════════════
async function loadStorage() {
S.dbs = [];
if (!window.indexedDB) return;
try {
if (indexedDB.databases) {
const list = await indexedDB.databases();
for (const d of list) {
try { await inspectDb(d.name, d.version); } catch(e) {}
}
}
} catch(e) {}
renderStorage();
}

function inspectDb(name, version) {
return new Promise((res, rej) => {
const req = indexedDB.open(name, version);
req.onerror = () => rej(req.error);
req.onsuccess = () => {
const db = req.result;
const info = { name: db.name, version: db.version, stores: [] };
const storeNames = […db.objectStoreNames];
let pending = storeNames.length;
if (!pending) { db.close(); S.dbs.push(info); return res(info); }


  storeNames.forEach(storeName => {
    inspectStore(db, storeName).then(storeInfo => {
      info.stores.push(storeInfo);
      if (--pending === 0) { db.close(); S.dbs.push(info); res(info); }
    }).catch(() => {
      info.stores.push({ name: storeName, count: 0, keyPath: null, data: [] });
      if (--pending === 0) { db.close(); S.dbs.push(info); res(info); }
    });
  });
};


});
}

function inspectStore(db, storeName) {
return new Promise((res, rej) => {
const tx = db.transaction([storeName], ‘readonly’);
const store = tx.objectStore(storeName);
const cntReq = store.count();
cntReq.onsuccess = () => {
const info = { name: storeName, count: cntReq.result, keyPath: store.keyPath, data: [] };
const getReq = store.getAll(undefined, 20);
getReq.onsuccess = () => { info.data = getReq.result; res(info); };
getReq.onerror = () => res(info);
};
cntReq.onerror = () => res({ name: storeName, count: 0, keyPath: null, data: [] });
});
}

function renderStorage() {
const o = el.storOut(); if (!o) return;
switch (S.activeStorage) {
case ‘indexeddb’:   renderIDB(o);   break;
case ‘localstorage’:  renderKV(o, localStorage, ‘localStorage’);  break;
case ‘sessionstorage’: renderKV(o, sessionStorage, ‘sessionStorage’); break;
}
}

function renderIDB(o) {
if (!S.dbs.length) { o.innerHTML = ‘<div class="dc-empty">No IndexedDB databases found</div>’; return; }
o.innerHTML = S.dbs.map((db, di) => `<div class="dc-db-card" id="db-card-${di}"> <div class="dc-db-header" onclick="window.__dcToggleDb(${di})"> <div> <div class="dc-db-name">${escHtml(db.name)}</div> <div class="dc-db-meta">v${db.version} · ${db.stores.length} store${db.stores.length !== 1 ? 's' : ''}</div> </div> <span style="color:var(--text2); font-size:11px">▼</span> </div> <div class="dc-db-body"> ${db.stores.map((st, si) =>`
<div class="dc-store-item" onclick="window.__dcToggleStore(${di},${si})">
<div class="dc-store-name">${escHtml(st.name)}</div>
<div class="dc-store-meta">${st.count} records · keyPath: ${st.keyPath || ‘none’}</div>
<div class="dc-data-viewer" id="store-${di}-${si}">
${st.data.length ? st.data.slice(0,20).map(item => ` <div class="dc-data-row"> <div class="dc-data-key">· ${escHtml(getKey(item, st.keyPath))}</div> <div class="dc-data-val">${escHtml(fmtVal(item))}</div> </div>`).join(’’) : ‘<div style="color:var(--text2);font-family:var(--mono);font-size:11px;padding:8px">Empty store</div>’}
</div>
</div>`).join('')} </div> </div>`).join(’’);
}

function getKey(obj, keyPath) {
if (!keyPath) return ‘—’;
return typeof keyPath === ‘string’ ? String(obj[keyPath] ?? ‘—’) : JSON.stringify(keyPath);
}

function fmtVal(v) {
if (typeof v === ‘object’ && v !== null) {
const s = JSON.stringify(v, null, 2);
return s.length > 300 ? s.slice(0, 300) + ‘…’ : s;
}
const s = String(v);
return s.length > 200 ? s.slice(0,200)+’…’ : s;
}

function renderKV(o, storage, name) {
const items = [];
for (let i = 0; i < storage.length; i++) {
const k = storage.key(i);
items.push({ k, v: storage.getItem(k) });
}
if (!items.length) { o.innerHTML = `<div class="dc-empty">No ${name} items</div>`; return; }
o.innerHTML = `<div style="padding:4px 0">` + items.map(({k,v}) => ` <div class="dc-kv-row"> <span class="dc-kv-key">${escHtml(k)}</span> <span class="dc-kv-val">${escHtml(fmtVal(v))}</span> </div>`).join(’’) + `</div>`;
}

window.__dcToggleDb = function(di) {
const card = document.getElementById(`db-card-${di}`);
if (card) card.classList.toggle(‘open’);
};

window.__dcToggleStore = function(di, si) {
const viewer = document.getElementById(`store-${di}-${si}`);
if (viewer) viewer.classList.toggle(‘open’);
};

// ══ DOM TREE ══════════════════════════════════════════════════════
function renderDomTree() {
const o = el.domOut(); if (!o) return;
o.innerHTML = ‘’;
const tree = document.createElement(‘div’);
tree.className = ‘dc-tree’;
tree.appendChild(buildNode(document.body));
o.appendChild(tree);
}

function buildNode(el) {
const wrap = document.createElement(‘div’);
const children = […el.children];
const hasChildren = children.length > 0;

const label = document.createElement(‘div’);
label.className = ‘dc-node-label’;

const arrow = document.createElement(‘span’);
arrow.className = ‘dc-arrow’;
arrow.textContent = hasChildren ? ‘▶’ : ’ ’;
label.appendChild(arrow);

const tag = document.createElement(‘span’);
tag.className = ‘dc-tag’;
tag.textContent = `<${el.tagName.toLowerCase()}`;
label.appendChild(tag);

if (el.id) {
const id = document.createElement(‘span’);
id.className = ‘dc-id’;
id.textContent = ` #${el.id}`;
label.appendChild(id);
}

if (el.className && typeof el.className === ‘string’ && el.className.trim()) {
const cls = document.createElement(‘span’);
cls.className = ‘dc-cls’;
const clsStr = el.className.trim().split(/\s+/).slice(0,3).map(c => `.${c}`).join(’’);
cls.textContent = clsStr;
label.appendChild(cls);
}

const close = document.createElement(‘span’);
close.className = ‘dc-tag’;
close.textContent = ‘>’;
label.appendChild(close);

const txtContent = el.childNodes.length ? ([…el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim())) : null;
if (txtContent) {
const preview = document.createElement(‘span’);
preview.className = ‘dc-txt-preview’;
preview.textContent = ’ ’ + txtContent.textContent.trim().slice(0,30);
label.appendChild(preview);
}

label.addEventListener(‘click’, (e) => {
e.stopPropagation();
if (hasChildren) {
const childDiv = wrap.querySelector(’:scope > .dc-children’);
const isOpen = childDiv && childDiv.classList.contains(‘open’);
if (childDiv) childDiv.classList.toggle(‘open’, !isOpen);
arrow.textContent = (!isOpen) ? ‘▼’ : ‘▶’;
}
showNodeDetail(el);
});

wrap.appendChild(label);

if (hasChildren) {
const childDiv = document.createElement(‘div’);
childDiv.className = ‘dc-children’;
children.forEach(child => childDiv.appendChild(buildNode(child)));
wrap.appendChild(childDiv);
}

return wrap;
}

function showNodeDetail(targetEl) {
const existing = document.getElementById(‘dc-node-detail’);
if (existing) existing.remove();

const d = document.createElement(‘div’);
d.className = ‘dc-node-detail’;
d.id = ‘dc-node-detail’;

const tag = `<${targetEl.tagName.toLowerCase()}>`;
const attrs = […targetEl.attributes];
const styles = window.getComputedStyle(targetEl);

d.innerHTML = `<div style="color:var(--accent2);font-family:var(--mono);font-size:12px;font-weight:700;margin-bottom:8px">${escHtml(tag)}</div> ${attrs.length ?`<div class="dc-detail-title">Attributes</div>${attrs.map(a => `<div class="dc-attr-row"><span class="dc-attr-name">${escHtml(a.name)}</span>=<span class="dc-attr-val">"${escHtml(a.value)}"</span></div>`).join(’’)}`: ''} <div class="dc-detail-title" style="margin-top:8px">Geometry</div> <div class="dc-attr-row"><span class="dc-attr-name">size: </span><span class="dc-attr-val">${Math.round(targetEl.offsetWidth)}×${Math.round(targetEl.offsetHeight)}</span></div> <div class="dc-attr-row"><span class="dc-attr-name">display: </span><span class="dc-attr-val">${styles.display}</span></div> <div class="dc-attr-row"><span class="dc-attr-name">position: </span><span class="dc-attr-val">${styles.position}</span></div>`;
el.domOut().prepend(d);
}

// Element picker
let _pickHandler = null;
let _pickedEl = null;

function startPicking() {
S.isPicking = true;
document.getElementById(‘dom-pick-btn’).classList.add(‘picking’);

_pickHandler = (e) => {
if (e.target.closest(’#dc-panel’) || e.target.closest(’#dc-fab’)) return;
e.preventDefault(); e.stopPropagation();
if (_pickedEl) _pickedEl.classList.remove(‘dc-pick-highlight’);
_pickedEl = e.target;
_pickedEl.classList.add(‘dc-pick-highlight’);
showNodeDetail(_pickedEl);
stopPicking();
};

document.addEventListener(‘click’, _pickHandler, true);
document.addEventListener(‘mouseover’, (e) => {
if (!S.isPicking) return;
if (e.target.closest(’#dc-panel’) || e.target.closest(’#dc-fab’)) return;
if (_pickedEl) _pickedEl.classList.remove(‘dc-pick-highlight’);
_pickedEl = e.target;
_pickedEl.classList.add(‘dc-pick-highlight’);
}, true);
}

function stopPicking() {
S.isPicking = false;
const btn = document.getElementById(‘dom-pick-btn’);
if (btn) btn.classList.remove(‘picking’);
if (_pickHandler) { document.removeEventListener(‘click’, _pickHandler, true); _pickHandler = null; }
}

// ══ SYSTEM INFO ═══════════════════════════════════════════════════
function renderSystem() {
const o = el.sysOut(); if (!o) return;
const nav = navigator;
const perf = window.performance;
const mem = perf && perf.memory;
const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

const cards = [
[‘Screen’, `${screen.width}×${screen.height} (devicePR: ${window.devicePixelRatio})`],
[‘Viewport’, `${window.innerWidth}×${window.innerHeight}`],
[‘Platform’, nav.platform || ‘—’],
[‘Language’, nav.language || ‘—’],
[‘Online’, nav.onLine ? ‘✅ Online’ : ‘❌ Offline’],
[‘Cookies’, nav.cookieEnabled ? ‘Enabled’ : ‘Disabled’],
[‘HW Concurrency’, nav.hardwareConcurrency || ‘—’],
];

if (conn) {
cards.push([‘Connection’, `${conn.effectiveType || '—'} · ${conn.downlink || '—'} Mbps`]);
cards.push([‘RTT’, conn.rtt != null ? `${conn.rtt}ms` : ‘—’]);
}

if (mem) {
const mb = v => (v / 1048576).toFixed(1) + ’ MB’;
cards.push([‘Heap Used’, mb(mem.usedJSHeapSize)]);
cards.push([‘Heap Limit’, mb(mem.jsHeapSizeLimit)]);
}

if (perf) {
const nav2 = perf.getEntriesByType && perf.getEntriesByType(‘navigation’)[0];
if (nav2) {
cards.push([‘Page Load’, `${Math.round(nav2.loadEventEnd)}ms`]);
cards.push([‘DOM Ready’, `${Math.round(nav2.domContentLoadedEventEnd)}ms`]);
}
}

o.innerHTML = cards.map(([label, val]) =>
`<div class="dc-sys-card"><div class="dc-sys-label">${label}</div><div class="dc-sys-val">${escHtml(String(val))}</div></div>`
).join(’’) +
`<div class="dc-sys-card dc-sys-full"><div class="dc-sys-label">User Agent</div><div class="dc-sys-val" style="word-break:break-all;font-size:10px">${escHtml(nav.userAgent)}</div></div>`;
}

// ══ SETTINGS RENDER ═══════════════════════════════════════════════
function renderSettings() {
const o = el.settOut(); if (!o) return;
o.innerHTML = `<div class="dc-setting-row"> <div class="dc-setting-info"> <div class="dc-setting-name">Timestamps</div> <div class="dc-setting-desc">Show time prefix on each log entry</div> </div> <label class="dc-toggle"><input type="checkbox" id="s-ts" ${S.settings.timestamps ? 'checked' : ''}><span class="dc-toggle-track"></span></label> </div> <div class="dc-setting-row"> <div class="dc-setting-info"> <div class="dc-setting-name">Auto-scroll</div> <div class="dc-setting-desc">Scroll to latest entry automatically</div> </div> <label class="dc-toggle"><input type="checkbox" id="s-as" ${S.settings.autoScroll ? 'checked' : ''}><span class="dc-toggle-track"></span></label> </div> <div class="dc-setting-row"> <div class="dc-setting-info"> <div class="dc-setting-name">Capture Global Errors</div> <div class="dc-setting-desc">window.onerror + unhandledrejection</div> </div> <label class="dc-toggle"><input type="checkbox" id="s-ce" ${S.settings.captureErrors ? 'checked' : ''}><span class="dc-toggle-track"></span></label> </div> <div class="dc-setting-row"> <div class="dc-setting-info"> <div class="dc-setting-name">Monitor Network</div> <div class="dc-setting-desc">Intercept fetch + XHR requests</div> </div> <label class="dc-toggle"><input type="checkbox" id="s-mn" ${S.settings.monitorNetwork ? 'checked' : ''}><span class="dc-toggle-track"></span></label> </div> <div class="dc-setting-row"> <div class="dc-setting-info"> <div class="dc-setting-name">Font Size</div> <div class="dc-setting-desc">Console output font size (px)</div> </div> <select class="dc-select" id="s-fs"> ${[10,11,12,13,14].map(s =>`<option value=”${s}” ${S.settings.fontSize===s?‘selected’:’’}>${s}px</option>`).join('')} </select> </div> <div class="dc-setting-row"> <div class="dc-setting-info"> <div class="dc-setting-name">Max Log Entries</div> <div class="dc-setting-desc">Older entries are discarded</div> </div> <select class="dc-select" id="s-me"> ${[100,250,500,1000,2000].map(s => `<option value=”${s}” ${S.settings.maxEntries===s?‘selected’:’’}>${s}</option>`).join('')} </select> </div> <div class="dc-setting-row" style="border:none"> <div class="dc-setting-info"> <div class="dc-setting-name" style="color:var(--red)">Clear All Data</div> <div class="dc-setting-desc">Wipe logs and network history</div> </div> <button class="dc-clear-btn" onclick="window.__dcClearAll()">Clear</button> </div>`;

document.getElementById(‘s-ts’).onchange = e => { S.settings.timestamps = e.target.checked; saveSettings(); renderConsole(); };
document.getElementById(‘s-as’).onchange = e => { S.settings.autoScroll = e.target.checked; saveSettings(); };
document.getElementById(‘s-ce’).onchange = e => { S.settings.captureErrors = e.target.checked; saveSettings(); };
document.getElementById(‘s-mn’).onchange = e => { S.settings.monitorNetwork = e.target.checked; saveSettings(); };
document.getElementById(‘s-fs’).onchange = e => { S.settings.fontSize = parseInt(e.target.value); saveSettings(); if (S.activeTab === ‘console’) renderConsole(); };
document.getElementById(‘s-me’).onchange = e => { S.settings.maxEntries = parseInt(e.target.value); saveSettings(); };
}

window.__dcClearAll = function() {
S.logs = []; S.network = []; S.errorCount = 0;
const b = el.badge(); if (b) { b.style.display = ‘none’; }
updateTabCount(‘console’, 0);
updateTabCount(‘network’, 0);
if (S.activeTab === ‘console’) renderConsole();
if (S.activeTab === ‘network’) renderNetwork();
};

// ══ TABS ══════════════════════════════════════════════════════════
function switchTab(name) {
S.activeTab = name;
document.querySelectorAll(’.dc-tab’).forEach(b => b.classList.toggle(‘active’, b.dataset.tab === name));
document.querySelectorAll(’.dc-panel’).forEach(p => p.classList.toggle(‘active’, p.id === `panel-${name}`));

switch(name) {
case ‘console’:  renderConsole();  break;
case ‘network’:  renderNetwork();  break;
case ‘storage’:  loadStorage();    break;
case ‘dom’:      renderDomTree();  break;
case ‘system’:   renderSystem();   break;
case ‘settings’: renderSettings(); break;
}
}

function updateTabCount(tab, n) {
const el2 = document.getElementById(`cnt-${tab}`);
if (!el2) return;
if (n > 0) { el2.textContent = n > 999 ? ‘999+’ : n; el2.style.display = ‘inline-flex’; }
else el2.style.display = ‘none’;
}

// ══ PANEL TOGGLE ══════════════════════════════════════════════════
let _panelOpen = false;

function togglePanel() {
_panelOpen = !_panelOpen;
const panel = el.panel();
if (_panelOpen) {
panel.style.display = ‘flex’;
requestAnimationFrame(() => { panel.classList.add(‘visible’); });
switchTab(S.activeTab);
} else {
panel.classList.remove(‘visible’);
setTimeout(() => { panel.style.display = ‘none’; }, 260);
}
el.fab().innerHTML = _panelOpen ? ‘✕<span class="dc-fab-badge" id="dc-error-badge" style="display:' + (S.errorCount>0?'flex':'none') + '">’ + S.errorCount + ‘</span>’ : ‘⌥<span class="dc-fab-badge" id="dc-error-badge" style="display:' + (S.errorCount>0?'flex':'none') + '">’ + S.errorCount + ‘</span>’;
}

// ══ DRAG RESIZE ═══════════════════════════════════════════════════
(function initDrag() {
const handle = document.getElementById(‘dc-drag’);
const panel  = document.getElementById(‘dc-panel’);
let dragging = false, startY = 0, startH = 0;

function onStart(e) {
dragging = true;
startY = e.clientY || e.touches[0].clientY;
startH = panel.offsetHeight;
document.body.style.userSelect = ‘none’;
}
function onMove(e) {
if (!dragging) return;
const y = e.clientY || e.touches[0].clientY;
const newH = Math.max(120, Math.min(window.innerHeight * 0.85, startH + (startY - y)));
panel.style.height = newH + ‘px’;
}
function onEnd() {
dragging = false;
document.body.style.userSelect = ‘’;
}

handle.addEventListener(‘mousedown’, onStart);
handle.addEventListener(‘touchstart’, onStart, { passive: true });
document.addEventListener(‘mousemove’, onMove);
document.addEventListener(‘touchmove’, onMove, { passive: true });
document.addEventListener(‘mouseup’, onEnd);
document.addEventListener(‘touchend’, onEnd);
})();

// ══ REPL ══════════════════════════════════════════════════════════
function initRepl() {
const input = el.replIn();
const run   = el.replRun();
if (!input || !run) return;

function execute() {
const code = input.value.trim();
if (!code) return;
S.replHistory.unshift(code);
if (S.replHistory.length > 50) S.replHistory.pop();
S.replHistoryIdx = -1;

const entry = document.createElement('div');
entry.className = 'dc-entry dc-entry-cmd';
entry.style.fontSize = S.settings.fontSize + 'px';
entry.innerHTML = `<span class="dc-ts">${ts()}</span><span>▶ ${escHtml(code)}</span>`;
el.consOut().appendChild(entry);

try {
  // eslint-disable-next-line no-eval
  const result = (0, eval)(code);
  if (result !== undefined) {
    const resEntry = document.createElement('div');
    resEntry.className = 'dc-entry dc-entry-log';
    resEntry.style.fontSize = S.settings.fontSize + 'px';
    resEntry.innerHTML = `<span class="dc-ts">${ts()}</span><span>${formatArg(result)}</span>`;
    el.consOut().appendChild(resEntry);
  }
} catch(err) {
  const errEntry = document.createElement('div');
  errEntry.className = 'dc-entry dc-entry-error';
  errEntry.style.fontSize = S.settings.fontSize + 'px';
  errEntry.innerHTML = `<span class="dc-ts">${ts()}</span><span>${escHtml(err.toString())}</span>`;
  el.consOut().appendChild(errEntry);
}

input.value = '';
if (S.settings.autoScroll) el.consOut().scrollTop = el.consOut().scrollHeight;
switchTab('console');

}

input.addEventListener(‘keydown’, e => {
if (e.key === ‘Enter’) { execute(); return; }
if (e.key === ‘ArrowUp’) {
e.preventDefault();
S.replHistoryIdx = Math.min(S.replHistoryIdx + 1, S.replHistory.length - 1);
input.value = S.replHistory[S.replHistoryIdx] || ‘’;
}
if (e.key === ‘ArrowDown’) {
e.preventDefault();
S.replHistoryIdx = Math.max(S.replHistoryIdx - 1, -1);
input.value = S.replHistoryIdx >= 0 ? S.replHistory[S.replHistoryIdx] : ‘’;
}
});

run.addEventListener(‘click’, execute);
}

// ══ EVENT WIRING ══════════════════════════════════════════════════
document.getElementById(‘dc-fab’).addEventListener(‘click’, togglePanel);
document.getElementById(‘dc-minimize-btn’).addEventListener(‘click’, togglePanel);

document.querySelectorAll(’.dc-tab’).forEach(btn => {
btn.addEventListener(‘click’, () => switchTab(btn.dataset.tab));
});

document.getElementById(‘dc-clear-btn’).addEventListener(‘click’, () => {
switch(S.activeTab) {
case ‘console’: S.logs = []; updateTabCount(‘console’, 0); renderConsole(); break;
case ‘network’: S.network = []; updateTabCount(‘network’, 0); renderNetwork(); break;
default: break;
}
});

document.getElementById(‘dc-copy-btn’).addEventListener(‘click’, () => {
let text = ‘’;
if (S.activeTab === ‘console’) {
text = S.logs.map(l => `[${l.ts}] [${l.type.toUpperCase()}] ${l.args.map(a => typeof a === 'object' ? JSON.stringify(a,null,2) : String(a)).join(' ')}`).join(’\n’);
} else if (S.activeTab === ‘network’) {
text = S.network.map(r => `[${r.ts}] ${r.method} ${r.url} → ${r.status || 'ERR'} (${r.duration}ms)`).join(’\n’);
}
if (text) {
navigator.clipboard ? navigator.clipboard.writeText(text).catch(() => {}) : (() => {})();
console.log(‘📋 Copied to clipboard’);
}
});

// Network filter
el.netFlt().addEventListener(‘input’, e => renderNetwork(e.target.value));
document.getElementById(‘net-clear’).addEventListener(‘click’, () => { S.network = []; updateTabCount(‘network’, 0); renderNetwork(); });

// Storage sub-tabs
document.querySelectorAll(’.dc-st-btn’).forEach(btn => {
btn.addEventListener(‘click’, () => {
S.activeStorage = btn.dataset.storage;
document.querySelectorAll(’.dc-st-btn’).forEach(b => b.classList.toggle(‘active’, b === btn));
renderStorage();
});
});

document.getElementById(‘storage-refresh’).addEventListener(‘click’, loadStorage);

// DOM toolbar
document.getElementById(‘dom-refresh-btn’).addEventListener(‘click’, renderDomTree);
document.getElementById(‘dom-pick-btn’).addEventListener(‘click’, () => {
S.isPicking ? stopPicking() : startPicking();
});
document.getElementById(‘dom-collapse-btn’).addEventListener(‘click’, () => {
document.querySelectorAll(’.dc-children.open’).forEach(c => c.classList.remove(‘open’));
document.querySelectorAll(’.dc-arrow’).forEach(a => { if (a.textContent === ‘▼’) a.textContent = ‘▶’; });
});

// ══ SPA / DOM CHANGE WATCHER ══════════════════════════════════════
let _lastUrl = location.href;
setInterval(() => {
if (location.href !== _lastUrl) {
_lastUrl = location.href;
addLog(‘info’, [‘🔄 SPA navigation detected:’, location.href]);
}
}, 1000);

// ══ INIT ══════════════════════════════════════════════════════════
initRepl();
renderConsole();

// Boot message
addLog(‘log’, [‘✅ DevConsole v2.0 loaded — click ⌥ to open’]);

})();

function spamLogs() {
const types = [‘log’,‘warn’,‘error’,‘info’];
for (let i = 0; i < 12; i++) {
const t = types[i % 4];
console[t](`[${t.toUpperCase()}] Auto-generated entry #${i+1}`, { index: i, rand: Math.random().toFixed(4) });
}
}
