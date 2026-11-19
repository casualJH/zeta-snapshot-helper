// ==UserScript==
// @name         제타 짤뽑 도우미
// @namespace    zeta-snapshot-helper
// @version      0.2.1
// @description  원본 메시지 직접 선택 · 유저/캐릭터 프로필 사진 감지 및 미리보기 (개발판)
// @author       casualJH
// @homepageURL  https://github.com/casualJH/zeta-snapshot-helper
// @updateURL    https://raw.githubusercontent.com/casualJH/zeta-snapshot-helper/main/zeta-snapshot-helper.user.js
// @downloadURL  https://raw.githubusercontent.com/casualJH/zeta-snapshot-helper/main/zeta-snapshot-helper.user.js
// @match        https://zeta-ai.io/*
// @match        https://*.zeta-ai.io/*
// @match        https://frame.pingpong.ai/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
(function () {
  'use strict';
  const VERSION = '0.2.1';
  const FRAME_ORIGIN = 'https://frame.pingpong.ai';
  const API_ORIGIN = 'https://api.zeta-ai.io';
  const PROTOCOL = 'zeta-snapshot-helper:selection:v1';
  const UI_KEY = 'zeta-snapshot-helper:ui:v1';
  const ROOM_PATTERN = /\/rooms\/([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})(?:[/?#]|$)/i;
  const ROW_SELECTOR = '[data-index][data-key^="message-MESSAGE-"]';
  const BODY_SELECTOR = '[data-sentry-component="BodyView"]';

  function isChatFrameUrl(url) {
    return url.origin === FRAME_ORIGIN && /^\/v\d+\/index\.html$/.test(url.pathname);
  }
  function parseUrl(value, base = location.href) {
    try { return new URL(String(value), base); } catch (_) { return null; }
  }
  function roomFrom(value) {
    const m = ROOM_PATTERN.exec(String(value || ''));
    return m ? m[1].toLowerCase() : null;
  }

  // Chat iframe: no top-level UI or API interception is initialized here.
  if (location.origin === FRAME_ORIGIN) {
    if (window.parent !== window && isChatFrameUrl(new URL(location.href))) initChatFrame();
    return;
  }
  if (window.parent !== window || !/^(?:[a-z0-9-]+\.)?zeta-ai\.io$/i.test(location.hostname)) return;
  if (window.__zetaSnapshotHelper010) return;
  window.__zetaSnapshotHelper010 = true;

  const defaults = () => ({
    buttonX: null, buttonY: null, buttonSize: 100, buttonLabel: '🖼️',
    panelX: null, panelY: null, panelW: 390, panelH: 600, theme: 'system'
  });
  function readPrefs() {
    let obj = {};
    try {
      // GM storage takes precedence when offered by the execution environment.
      const str = typeof GM_getValue === 'function' ? GM_getValue(UI_KEY, '{}') : localStorage.getItem(UI_KEY);
      obj = JSON.parse(str || '{}') || {};
    } catch (_) {}
    const prefs = Object.assign(defaults(), obj);
    // Migrate existing separate launcher fields; keep previously customized values.
    if (!Object.prototype.hasOwnProperty.call(obj, 'buttonLabel')) {
      const oldText = String(obj.buttonText ?? '짤뽑').trim();
      const oldEmoji = String(obj.buttonEmoji ?? '🖼️').trim();
      prefs.buttonLabel = oldText === '짤뽑' && oldEmoji === '🖼️'
        ? '🖼️' : ([oldEmoji, oldText].filter(Boolean).join(' ') || '🖼️');
    }
    delete prefs.buttonText;
    delete prefs.buttonEmoji;
    return prefs;
  }
  let ui = readPrefs();
  function savePrefs() {
    try {
      const value = JSON.stringify(ui);
      if (typeof GM_setValue === 'function') GM_setValue(UI_KEY, value);
      else localStorage.setItem(UI_KEY, value);
    } catch (_) {}
  }

  let rootHost, root, launch, panel, statusBox, accessDialog, rawPreview, selectedSummary;
  let loaded = [], chosen = new Set(), room = roomFrom(location.pathname), pageKey = location.pathname + location.search;
  let requestRoomHint = null, requestRoomPage = null;
  let headers = null, selectionMode = false, running = false, aborter = null, generation = 0;
  let totalMessages = 0, pages = 0, complete = false;
  let currentInfo = '대화방을 열고 과거 대화를 불러오세요.';
  let lastText = '', ignoreLauncherClick = false, imagesRequested = false, lastFrame = null, validatedFrame = null;
  const knownRequestHeaders = ['authorization', 'x-client-native-version', 'x-client-type', 'x-client-version', 'x-device-type', 'x-user-language'];
  const profileState = {room: room, user: null, userStatus: '미확인', characters: [], candidates: [], plotId: null, source: '', updatedAt: 0};
  let profileRefreshBusy = false, lastFrameSnapshot = '', profileEpoch = 0;
  const expandedDescriptions = new Set();
  const attemptedPersonas = new Set();
  const IMAGE_KEYS = ['avatarUrl', 'avatar_url', 'profileImageUrl', 'profile_image_url', 'imageUrl', 'image_url', 'thumbnailUrl', 'thumbnail_url'];
  function cleanImage(value) {
    if (typeof value !== 'string' || value.length > 2000) return '';
    if (!/^https?:\/\//i.test(value)) return '';
    const url = parseUrl(value);
    return url && ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  }
  function personFrom(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const name = ['name', 'displayName', 'display_name', 'nickname', 'title']
      .map(k => raw[k]).find(v => typeof v === 'string' && v.trim());
    const id = ['id','uuid','profileId','profile_id','characterId','character_id']
      .map(k => raw[k]).find(v => typeof v === 'string' || typeof v === 'number');
    const image = IMAGE_KEYS.map(k => cleanImage(raw[k])).find(Boolean) || '';
    const description = typeof raw.description === 'string' ? raw.description.slice(0, 30000) : '';
    if (!name && !image && !description.trim()) return null;
    return {id: id == null ? '' : String(id).slice(0, 140),
      name: typeof name === 'string' ? name.trim().slice(0, 160) : '', image, description};
  }
  function resetProfileState() {
    profileEpoch++;
    profileState.room = currentRoom(); profileState.user = null; profileState.userStatus = '미확인';
    profileState.characters = []; profileState.candidates = []; profileState.plotId = null;
    profileState.source = ''; profileState.updatedAt = 0; lastFrameSnapshot = ''; attemptedPersonas.clear();
    expandedDescriptions.clear();
    renderProfiles();
  }
  function observeProfilePayload(path, payload, sourceRoom) {
    if (!sourceRoom || sourceRoom !== currentRoom() || !payload || typeof payload !== 'object') return;
    const pathname = String(path).replace(/\/$/, '');
    if (pathname === `/v1/rooms/${sourceRoom}` && payload.plot && typeof payload.plot === 'object') {
      const plot = payload.plot;
      const characters = Array.isArray(plot.characters) ? plot.characters : null;
      if (characters) {
        const mapped = characters.map(personFrom).filter(Boolean);
        // Keep the array as provided by the room's plot; never dedupe by name.
        profileState.characters = mapped;
        profileState.plotId = typeof plot.id === 'string' ? plot.id : null;
        profileState.source = '현재 채팅방 상세 정보';
        profileState.updatedAt = Date.now();
        tryAutoPersona(sourceRoom, profileState.plotId);
      }
      renderProfiles();
      return;
    }
    const persona = /^\/v1\/plots\/[^/]+\/rooms\/([^/]+)\/user-personas\/(select|selected)$/.exec(pathname);
    if (persona && persona[1].toLowerCase() === sourceRoom.toLowerCase()) {
      const item = personFrom(payload);
      if (item) { profileState.user = {...item, source: '선택된 대화 프로필 API'};
        profileState.userStatus = item.image ? '확인됨' : '프로필 확인됨 · 사진 없음';
      } else { profileState.userStatus = '선택 프로필 응답에서 사진 미확인'; }
      renderProfiles();
    }
  }
  async function tryAutoPersona(sourceRoom, plotId) {
    if (!plotId || !sourceRoom || !headers?.authorization || profileState.user) return;
    if (!/^[0-9a-f-]{36}$/i.test(plotId)) return;
    const key = sourceRoom + '/' + plotId;
    if (attemptedPersonas.has(key)) return;
    attemptedPersonas.add(key);
    try {
      const url = `${API_ORIGIN}/v1/plots/${plotId}/rooms/${sourceRoom}/user-personas/selected`;
      const resp = await nativeFetch.call(window, url, {headers:{...headers}, credentials:'include', cache:'no-store'});
      await readProfileResponse(resp, url, sourceRoom);
    } catch (_) { /* An unavailable persona endpoint is not a profile detection success. */ }
  }
  async function readProfileResponse(response, url, sourceRoom) {
    if (!response?.ok || !sourceRoom) return;
    const parsed = parseUrl(url); if (!parsed || parsed.origin !== API_ORIGIN) return;
    const path = parsed.pathname;
    if (!(path.replace(/\/$/,'') === `/v1/rooms/${sourceRoom}` ||
      /^\/v1\/plots\/[^/]+\/rooms\/[^/]+\/user-personas\/(select|selected)\/?$/.test(path))) return;
    if (Number(response.headers.get('content-length')) > 900000) return;
    const epoch = profileEpoch;
    try {
      const json = await response.clone().json();
      if (epoch === profileEpoch && currentRoom() === sourceRoom) observeProfilePayload(path, json, sourceRoom);
    } catch (_) { /* A site response may be empty or not JSON. */ }
  }
  function readProfileXhr(xhr, url, sourceRoom) {
    if (xhr.status < 200 || xhr.status >= 300 || !sourceRoom) return;
    const parsed = parseUrl(url); if (!parsed || parsed.origin !== API_ORIGIN) return;
    const path = parsed.pathname;
    if (!(path.replace(/\/$/,'') === `/v1/rooms/${sourceRoom}` ||
      /^\/v1\/plots\/[^/]+\/rooms\/[^/]+\/user-personas\/(select|selected)\/?$/.test(path))) return;
    try {
      const json = xhr.responseType === 'json' ? xhr.response :
        (!xhr.responseType || xhr.responseType === 'text') && xhr.responseText.length < 900000 ? JSON.parse(xhr.responseText) : null;
      observeProfilePayload(path, json, sourceRoom);
    } catch (_) {}
  }
  function acceptFrameProfile(payload) {
    if (!payload || payload.room !== currentRoom()) return;
    const sig = JSON.stringify(payload);
    if (sig === lastFrameSnapshot) return;
    lastFrameSnapshot = sig;
    // Only a uniquely identified selected card can confirm the user photo.
    if (payload.user?.state === 'ok' && cleanImage(payload.user.image)) {
      profileState.user = {id:payload.user.key || '', name:payload.user.name || '현재 대화 프로필',
        image: cleanImage(payload.user.image), description:profileState.user?.description || '', source:'선택된 대화 프로필 카드'};
      profileState.userStatus = '확인됨';
    } else if (!profileState.user) {
      profileState.userStatus = ({'dialog-closed':'대화 프로필 창을 열면 선택 사진 확인 가능',
        'list-unavailable':'프로필 목록 불러오는 중', 'selection-unknown':'선택된 프로필을 하나로 식별할 수 없음',
        'image-unavailable':'선택된 카드의 사진 아직 없음'})[payload.user?.state] || '미확인';
    }
    profileState.candidates = Array.isArray(payload.candidates) ? payload.candidates
      .filter(p => p && typeof p.name === 'string' && cleanImage(p.image))
      .slice(0, 100).map(p => ({name:p.name.slice(0,160), image:cleanImage(p.image)})) : [];
    renderProfiles();
  }
  function profileCandidates() {
    const selected = profileState.characters;
    if (selected.length) return selected.map(c => {
      const matches = profileState.candidates.filter(p => p.name === c.name);
      const unambiguousName = selected.filter(person => person.name === c.name).length === 1;
      const fallback = unambiguousName && matches.length === 1 ? matches[0].image : '';
      return {...c, image: c.image || fallback};
    });
    // No room detail: only show displayed chat avatars as *unverified* candidates.
    return profileState.candidates.map(c => ({...c, id:'', candidate:true}));
  }
  async function copyProfileDescription(value) {
    if (!value.trim()) { setInfo('복사할 프로필 설명을 확인하지 못했습니다.'); return; }
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const temp = document.createElement('textarea');
        temp.value = value;
        temp.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        root.appendChild(temp);
        temp.focus(); temp.select();
        try { if (!document.execCommand('copy')) throw new Error('copy unsupported'); }
        finally { temp.remove(); }
      }
      setInfo('프로필 설명을 복사했습니다.');
    } catch (_) { setInfo('자동 복사를 사용할 수 없습니다. 설명을 직접 선택하여 복사해 주세요.'); }
  }
  function renderProfiles() {
    if (!root) return;
    const holder = root.getElementById('profile-cards');
    if (!holder) return;
    root.getElementById('refresh-profiles').disabled = profileRefreshBusy;
    holder.replaceChildren();
    const title = root.getElementById('profile-status');
    const chars = profileCandidates();
    const status = profileState.source || (chars.length ? '화면 아바타 후보 · 채팅방 정보 미확인' : '아직 감지된 프로필 없음');
    title.textContent = `${status} · 유저: ${profileState.userStatus} · ${profileState.characters.length ? '캐릭터' : '인물 후보'} ${chars.length}명`;
    function card(person, role) {
      const item = document.createElement('div'); item.className = 'profile-card';
      const thumb = document.createElement('div'); thumb.className = 'profile-thumb';
      if (person?.image) {
        const picture = document.createElement('img'); picture.src = person.image;
        picture.alt = (person.name || role) + ' 프로필 사진'; picture.loading = 'lazy';
        picture.addEventListener('error', () => { picture.hidden = true; thumb.textContent = '사진 오류'; });
        thumb.appendChild(picture);
      } else thumb.textContent = '사진 없음';
      const body = document.createElement('div'); body.className = 'profile-details';
      const name = document.createElement('strong'); name.textContent = person?.name || (role === 'user' ? '유저 대화 프로필' : '이름 미확인');
      const info = document.createElement('small'); info.textContent = role === 'user' ?
        `유저 · ${person?.source || profileState.userStatus}` :
        (person.candidate ? '화면 아바타 후보 · 인물 정보 미확인' : `캐릭터 · ${person.image ? '사진 확인됨' : '사진 미확인'}`);
      body.append(name, info);
      if (person?.image) {
        const link = document.createElement('a'); link.textContent = '이미지 보기'; link.href = person.image;
        link.target = '_blank'; link.rel = 'noopener noreferrer';
        body.appendChild(link);
      }
      const key = role + ':' + (person?.id || '') + ':' + (person?.name || '');
       const actions = document.createElement('div'); actions.className = 'profile-actions';
       const detailButton = document.createElement('button');
       detailButton.type = 'button'; detailButton.className = 'profile-description-toggle';
       const expanded = expandedDescriptions.has(key);
       detailButton.textContent = expanded ? '설명 닫기' : '설명';
       detailButton.setAttribute('aria-expanded', String(expanded));
       actions.appendChild(detailButton);
       item.append(thumb, body, actions);
       const section = document.createElement('div'); section.className = 'profile-description';
       section.hidden = !expanded;
       const description = String(person?.description || '');
       const textarea = document.createElement('textarea');
       textarea.readOnly = true; textarea.value = description;
       textarea.setAttribute('aria-label', (person?.name || role) + ' 프로필 설명');
       textarea.placeholder = '프로필 설명을 확인하지 못했습니다.';
       const copy = document.createElement('button');
       copy.type = 'button'; copy.textContent = '설명 복사'; copy.disabled = !description.trim();
       copy.addEventListener('click', () => copyProfileDescription(textarea.value));
       section.append(textarea, copy);
       detailButton.addEventListener('click', () => {
         const show = section.hidden;
         section.hidden = !show;
         detailButton.textContent = show ? '설명 닫기' : '설명';
         detailButton.setAttribute('aria-expanded', String(show));
         if (show) expandedDescriptions.add(key);
         else expandedDescriptions.delete(key);
       });
       item.appendChild(section);
       return item;
    }
    holder.appendChild(card(profileState.user, 'user'));
    for (const p of chars) holder.appendChild(card(p, 'character'));
  }
  async function refreshProfiles() {
    roomChanged();
    const target = currentRoom();
    if (!target || profileRefreshBusy) return;
    profileRefreshBusy = true; renderProfiles();
    const generationAtStart = profileEpoch;
    let roomResult = '방 정보 미확인', frameResult = 'iframe 미확인';
    try {
      if (headers?.authorization) {
        try {
          const response = await nativeFetch.call(window, `${API_ORIGIN}/v1/rooms/${target}`, {
            headers:{...headers}, credentials:'include', cache:'no-store'});
          if (response.ok) { await readProfileResponse(response, response.url, target); roomResult = '채팅방 정보 조회 완료'; }
          else roomResult = `채팅방 조회 HTTP ${response.status}`;
        } catch (_) { roomResult = '채팅방 조회 실패'; }
      } else roomResult = '대화방을 새로고침해 인증 요청 감지 필요';
      const frame = chatFrame();
      if (frame) {
        let ok = await requestFrame(frame);
        if (!ok && currentRoom() === target) { await pause(450); ok = await requestFrame(chatFrame()); }
        if (ok && frame === chatFrame()) {
          try {
            const answer = await requestProfileFrame(frame, target);
            frameResult = answer ? '화면 프로필 조회 완료' : '화면 프로필 정보 없음';
          } catch (_) { frameResult = '화면 프로필 조회 실패'; }
        } else { frameResult = 'iframe 연결 미확인'; showAccess(); }
      } else frameResult = '채팅 iframe 없음';
      if (target === currentRoom() && generationAtStart === profileEpoch)
        setInfo(`프로필 새로고침: ${roomResult} · ${frameResult}`);
    } finally { profileRefreshBusy = false; renderProfiles(); }
  }
  async function requestProfileFrame(frame, targetRoom) {
    const nonce = crypto.randomUUID?.() || String(Math.random());
    const target = frame.contentWindow;
    return new Promise(resolve => {
      const channel = new MessageChannel(); let doneAlready = false;
      const timer = setTimeout(() => done(null), 1800);
      function done(data) {
        if (doneAlready) return;
        doneAlready = true; clearTimeout(timer); channel.port1.onmessage = null;
        channel.port1.close();
        if (frame !== chatFrame() || frame.contentWindow !== target || targetRoom !== currentRoom()) return resolve(null);
        if (data?.protocol !== PROTOCOL || data?.nonce !== nonce || data?.ok !== true) return resolve(null);
        acceptFrameProfile({...data.snapshot, room: targetRoom}); resolve(data.snapshot);
      }
      channel.port1.onmessage = e => done(e.data);
      try { target.postMessage({protocol: PROTOCOL, type:'profile-read', nonce, room:targetRoom}, FRAME_ORIGIN, [channel.port2]); }
      catch (_) { channel.port2.close(); done(null); }
    });
  }

  function requestUrl(value) {
    if (typeof value === 'string') return value;
    if (value instanceof URL) return value.href;
    return value && typeof value.url === 'string' ? value.url : '';
  }
  function headerEntries(h) {
    try {
      if (!h) return [];
      if (h instanceof Headers) return Array.from(h.entries());
      return Array.isArray(h) ? h : Object.entries(h);
    } catch (_) { return []; }
  }
  function capture(url, entries) {
    const u = parseUrl(url);
    if (!u || u.origin !== API_ORIGIN) return;
    const foundRoom = roomFrom(u.pathname);
    if (foundRoom) { requestRoomHint = foundRoom; requestRoomPage = location.pathname + location.search; }
    if (entries) {
      const result = {};
      for (const [k, v] of entries) {
        const key = String(k).toLowerCase();
        if (knownRequestHeaders.includes(key) && v != null) result[key] = String(v);
      }
      if (result.authorization) headers = result;
    }
  }
  const nativeFetch = window.fetch;
  if (typeof nativeFetch === 'function') {
    window.fetch = function (input, init) {
      try {
        capture(requestUrl(input), headerEntries((init && init.headers) || (input && input.headers)));
      } catch (_) {}
      const response = nativeFetch.apply(this, arguments);
      try {
        const url = requestUrl(input), sourceRoom = currentRoom();
        Promise.resolve(response).then(r => readProfileResponse(r, url, sourceRoom), () => {});
      } catch (_) {}
      return response;
    };
  }
  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  const nativeSend = XMLHttpRequest.prototype.send;
  const xhrMap = new WeakMap();
  XMLHttpRequest.prototype.open = function (method, url) {
    xhrMap.set(this, {url: String(url), entries: []});
    return nativeOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
    const meta = xhrMap.get(this);
    if (meta) meta.entries.push([key, value]);
    return nativeSetHeader.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    const meta = xhrMap.get(this);
    if (meta) {
      try { capture(meta.url, meta.entries); } catch (_) {}
      const sourceRoom = currentRoom();
      this.addEventListener('loadend', () => { try { readProfileXhr(this, meta.url, sourceRoom); } catch (_) {} }, {once:true});
    }
    return nativeSend.apply(this, arguments);
  };

  function currentRoom() {
    return roomFrom(location.pathname) ||
      (requestRoomPage === location.pathname + location.search ? requestRoomHint : null);
  }
  function roomChanged() {
    const nextPage = location.pathname + location.search;
    const next = currentRoom();
    if (nextPage === pageKey && next === room) return;
    pageKey = nextPage;
    if (next === room) return;
    room = next;
    generation++;
    if (aborter) aborter.abort();
    aborter = null; running = false;
    selectionMode = false; validatedFrame = null; loaded = []; chosen.clear(); totalMessages = 0; pages = 0; complete = false;
    resetProfileState();
    lastText = ''; currentInfo = room ? '채팅방이 변경되었습니다. 대화를 새로 불러오세요.' : '대화방을 열어 주세요.';
    syncFrame(); render();
  }
  window.addEventListener('popstate', roomChanged);
  window.addEventListener('hashchange', roomChanged);
  setInterval(() => {
    roomChanged();
    const now = chatFrame();
    if (lastFrame === now) return;
    lastFrame = now; lastFrameSnapshot = '';
    if (now && currentRoom()) refreshFrameSnapshot(now);
    else { profileState.candidates = []; renderProfiles(); }
    if (selectionMode && validatedFrame !== now) {
      selectionMode = false; validatedFrame = null;
      setInfo('채팅 iframe이 교체되었습니다. 현재 프레임에 다시 연결한 뒤 선택하세요.');
    }
  }, 850);

  function infoValue(value) {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }
  function infoItems(section) {
    const lines = [];
    if (!section || typeof section !== 'object') return lines;
    for (const item of Array.isArray(section.items) ? section.items : []) {
      if (!item || typeof item !== 'object') continue;
      const label = infoValue(item.label), value = infoValue(item.value);
      if (value) lines.push(label ? `${label}: ${value}` : value);
      else if (label) lines.push(label);
    }
    if (!lines.length) {
      const value = infoValue(section.value) || infoValue(section.description);
      if (value) lines.push(value);
    }
    return lines;
  }
  function infoBox(content) {
    const parts = [];
    for (const scene of Array.isArray(content.scenes) ? content.scenes : []) {
      const text = infoItems(scene);
      if (text.length) parts.push([infoValue(scene?.name) || infoValue(scene?.title), ...text].filter(Boolean).join('\n'));
    }
    for (const character of Array.isArray(content.characters) ? content.characters : []) {
      const text = infoItems(character);
      if (text.length) parts.push([infoValue(character?.name), ...text].filter(Boolean).join('\n'));
    }
    if (!parts.length) {
      const text = infoItems(content);
      if (text.length) parts.push(text.join('\n'));
      else if (typeof content.text === 'string') parts.push(content.text);
    }
    return parts.join('\n\n');
  }
  function normalize(raw) {
    const records = [];
    let index = 0;
    for (const msg of raw) {
      if (!msg || typeof msg.id !== 'string') continue;
      const parts = [];
      const role = msg.sender?.type === 'USER' ? 'user' : msg.sender?.type ? 'character' : 'unknown';
      for (const part of Array.isArray(msg.contents) ? msg.contents : []) {
        if (!part || typeof part !== 'object') continue;
        if (part.type === 'TEXT' && typeof part.text === 'string' && part.text.trim()) {
          parts.push({speaker: role === 'user' ? '사용자' : (part.speakerName || '캐릭터'), text: part.text, kind: 'text'});
        } else if (part.type === 'INFO_BOX') {
          const text = infoBox(part);
          if (text.trim()) parts.push({speaker: '상태창', text, kind: 'info_box'});
        }
      }
      if (parts.length) records.push({id: msg.id, time: msg.messageTime || null, role, parts, index: index++});
    }
    records.sort((a, b) => (Date.parse(a.time) || 0) - (Date.parse(b.time) || 0) || a.index - b.index);
    return records;
  }
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  function setInfo(text) { currentInfo = text; render(); }
  async function loadMessages() {
    roomChanged();
    if (running) return;
    const target = currentRoom();
    if (!target) { setInfo('현재 채팅방 ID를 확인할 수 없습니다. 채팅방 안에서 실행해 주세요.'); return; }
    if (!headers?.authorization) { setInfo('인증 헤더를 아직 감지하지 못했습니다. 채팅방을 새로고침해 대화가 나타난 뒤 다시 시도하세요.'); return; }
    const epoch = ++generation;
    running = true; selectionMode = false; validatedFrame = null; chosen.clear(); loaded = []; complete = false;
    totalMessages = 0; pages = 0; syncFrame();
    setInfo('대화 원문을 불러오고 있습니다...');
    const seen = new Set(), collected = [], seenCursors = new Set();
    const snapshotHeaders = {...headers};
    let cursor = null, limit = 100, throttles = 0, note = '';
    try {
      for (let p = 1; p <= 300; p++) {
        if (epoch !== generation || currentRoom() !== target) { note = '채팅방이 변경되어 중단되었습니다.'; break; }
        aborter = new AbortController();
        const url = `${API_ORIGIN}/v1/rooms/${target}/messages?limit=${limit}${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`;
        let response;
        try { response = await nativeFetch.call(window, url, {headers: snapshotHeaders, credentials: 'include', cache: 'no-store', signal: aborter.signal}); }
        catch (err) { note = `연결 오류: ${String(err?.message || err)}`; break; }
        if (epoch !== generation || currentRoom() !== target) { note = '채팅방이 변경되어 중단되었습니다.'; break; }
        if ([400, 422].includes(response.status) && limit !== 20) { limit = 20; p--; continue; }
        if (response.status === 429) {
          if (++throttles > 4) { note = '요청 제한(429)이 반복되어 불러오기를 중단했습니다.'; break; }
          await pause(2500); p--; continue;
        }
        throttles = 0;
        if (!response.ok) { note = `HTTP ${response.status}: 일부 메시지만 불러왔을 수 있습니다.`; break; }
        const payload = await response.json();
        if (epoch !== generation || currentRoom() !== target) break;
        const batch = Array.isArray(payload?.messages) ? payload.messages : [];
        if (!batch.length) { complete = true; break; }
        for (const item of batch) {
          if (!item || typeof item.id !== 'string' || seen.has(item.id)) continue;
          seen.add(item.id); collected.push(item);
        }
        pages = p; totalMessages = seen.size; loaded = normalize(collected);
        setInfo(`원본 메시지 ${totalMessages}개 확인 · ${pages}페이지 수집 중...`);
        if (!payload.nextCursor) { complete = true; break; }
        if (typeof payload.nextCursor !== 'string' || seenCursors.has(payload.nextCursor)) { note = '페이지 커서가 유효하지 않아 중단했습니다.'; break; }
        seenCursors.add(payload.nextCursor); cursor = payload.nextCursor;
        if (p === 300) note = '300페이지 수집 제한에 도달했습니다.';
        await pause(250);
      }
    } catch (error) { note = `데이터 처리 오류: ${String(error?.message || error)}`; }
    finally {
      if (epoch !== generation) return;
      aborter = null; running = false;
      setInfo(`대화 ${loaded.length}개 수집 · 원본 ${totalMessages}개 · ${pages}페이지 · ${complete ? '전체 수집 완료' : '부분 수집'}${note ? '\n' + note : ''}`);
    }
  }
  function stopLoad() {
    if (!running) return;
    generation++;
    aborter?.abort(); aborter = null; running = false;
    setInfo(`불러오기가 중지되었습니다. 수집된 원본 ${loaded.length}개만 확인할 수 있습니다.`);
  }

  function chatFrame() {
    const matches = [...document.querySelectorAll('iframe[src]')].filter(el => {
      const url = parseUrl(el.src);
      return url && isChatFrameUrl(url) && el.getClientRects().length;
    });
    return matches.length === 1 ? matches[0] : null;
  }
  function frameState() {
    return selectionMode ? {enabled:true,known:loaded.map(m => m.id),chosen:[...chosen]} : {enabled:false,known:[],chosen:[]};
  }
  function syncFrame() {
    const frame = chatFrame();
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage({protocol: PROTOCOL, type: 'state', state: frameState()}, FRAME_ORIGIN);
  }
  function requestFrame(frame) {
    if (!frame?.contentWindow) return Promise.resolve(false);
    const target = frame.contentWindow;
    const startRoom = currentRoom();
    const nonce = (crypto.randomUUID?.() || String(Math.random()));
    return new Promise(resolve => {
      const channel = new MessageChannel();
      let finished = false;
      const timer = setTimeout(() => done(false), 1700);
      function done(ok) {
        if (finished) return;
        finished = true; clearTimeout(timer);
        channel.port1.onmessage = null; channel.port1.close();
        resolve(Boolean(ok && chatFrame() === frame && frame.contentWindow === target && currentRoom() === startRoom));
      }
      channel.port1.onmessage = event => done(event.data?.protocol === PROTOCOL && event.data?.nonce === nonce && event.data?.ok === true);
      try { target.postMessage({protocol: PROTOCOL, type: 'ping', nonce}, FRAME_ORIGIN, [channel.port2]); }
      catch (_) { channel.port2.close(); done(false); }
    });
  }
  async function refreshFrameSnapshot(frame) {
    const roomAtStart = currentRoom();
    if (!frame || !roomAtStart) return;
    const ok = await requestFrame(frame);
    if (ok && frame === chatFrame() && roomAtStart === currentRoom())
      await requestProfileFrame(frame, roomAtStart);
  }
  let probing = false;
  async function startSelecting() {
    roomChanged();
    if (probing || running) return;
    if (!loaded.length) { setInfo('먼저 과거 대화를 불러오세요.'); return; }
    const frame = chatFrame();
    const when = currentRoom();
    probing = true;
    setInfo('채팅 iframe 연결을 확인하고 있습니다...');
    try {
      let connected = await requestFrame(frame);
      if (!connected && when === currentRoom()) {
        await pause(500);
        connected = await requestFrame(chatFrame());
      }
      if (when !== currentRoom()) return;
      if (!connected) { setInfo('채팅 iframe 연결을 확인하지 못했습니다.'); showAccess(); return; }
      validatedFrame = chatFrame();
      selectionMode = true;
      if (panel) panel.hidden = true;
      syncFrame(); render();
      flash('말풍선을 눌러 원본 메시지를 선택하세요. 버튼을 눌러 돌아올 수 있습니다.');
    } finally { probing = false; }
  }
  function endSelecting() {
    selectionMode = false; validatedFrame = null;
    syncFrame(); render();
  }
  function toggleMessage(id) {
    if (!selectionMode || validatedFrame !== chatFrame() || !loaded.some(item => item.id === id)) return;
    if (chosen.has(id)) chosen.delete(id); else chosen.add(id);
    render();
    flash(`원본 메시지 ${chosen.size}개 선택됨`);
  }
  window.addEventListener('message', event => {
    if (event.origin !== FRAME_ORIGIN || event.source !== chatFrame()?.contentWindow || event.data?.protocol !== PROTOCOL) return;
    if (event.data.type === 'ready') {
      if (selectionMode && validatedFrame === chatFrame()) syncFrame();
      if (accessDialog?.open) requestFrame(chatFrame()).then(ok => { if (ok) closeAccess(); });
      refreshFrameSnapshot(chatFrame());
      return;
    }
    if (event.data.type === 'profile-snapshot') {
      if (event.data.room === currentRoom()) acceptFrameProfile(event.data.snapshot);
      return;
    }
    if (event.data.type === 'toggle' && typeof event.data.id === 'string') toggleMessage(event.data.id);
  });
  function selectedRaw() {
    const selected = loaded.filter(item => chosen.has(item.id));
    return selected.map(item => item.parts.map(part => `${part.speaker}: ${part.text}`).join('\n\n')).join('\n\n');
  }
  function render() {
    if (!root) return;
    const count = loaded.filter(item => chosen.has(item.id)).length;
    root.getElementById('collected').textContent = `${loaded.length}개`;
    root.getElementById('selected').textContent = `${count}개`;
    statusBox.textContent = currentInfo;
    root.getElementById('load').disabled = running;
    root.getElementById('stop').disabled = !running;
    root.getElementById('start').disabled = running || !loaded.length || probing;
    root.getElementById('start').textContent = selectionMode ? '선택 완료' : '말풍선 직접 선택';
    launch.querySelector('.zsh-count').textContent = selectionMode ? `선택 ${count}` : '';
    root.getElementById('clear').disabled = !chosen.size;
    root.getElementById('copy').disabled = !chosen.size;
    const text = selectedRaw();
    rawPreview.value = text;
    root.getElementById('chars').textContent = `${text.length.toLocaleString('ko-KR')}자`;
    selectedSummary.textContent = count ? `선택한 원본 메시지 ${count}개 · 실제 대화 순서로 표시` : '선택한 메시지가 없습니다.';
    syncFrame();
    renderProfiles();
  }
  async function copyRaw() {
    const text = rawPreview.value;
    if (!text.trim()) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        rawPreview.focus(); rawPreview.select();
        if (!document.execCommand('copy')) throw new Error('clipboard API를 사용할 수 없습니다.');
      }
      setInfo('선택 대화 원문을 복사했습니다.');
    } catch (_) { setInfo('자동 복사가 허용되지 않았습니다. 원문을 길게 눌러 직접 복사해 주세요.'); }
  }

  function effectiveMode() {
    return ui.theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : ui.theme;
  }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function limitPositions() {
    const vw = Math.max(300, window.innerWidth), vh = Math.max(300, window.innerHeight);
    ui.panelW = clamp(Number(ui.panelW) || 390, Math.min(300, vw - 12), vw - 12);
    ui.panelH = clamp(Number(ui.panelH) || 600, Math.min(300, vh - 12), vh - 12);
    if (!Number.isFinite(ui.panelX)) ui.panelX = Math.round((vw - ui.panelW) / 2);
    if (!Number.isFinite(ui.panelY)) ui.panelY = Math.round((vh - ui.panelH) / 2);
    ui.panelX = clamp(ui.panelX, 6, Math.max(6, vw - ui.panelW - 6));
    ui.panelY = clamp(ui.panelY, 6, Math.max(6, vh - ui.panelH - 6));
    if (!Number.isFinite(ui.buttonX)) ui.buttonX = Math.max(6, vw - 112);
    if (!Number.isFinite(ui.buttonY)) ui.buttonY = Math.max(6, vh - 98);
    ui.buttonX = clamp(ui.buttonX, 0, Math.max(0, vw - 70));
    ui.buttonY = clamp(ui.buttonY, 0, Math.max(0, vh - 38));
    ui.buttonSize = clamp(Number(ui.buttonSize) || 100, 65, 155);
    ui.buttonLabel = String(ui.buttonLabel ?? '🖼️').slice(0, 36);
    if (!['light', 'dark', 'system'].includes(ui.theme)) ui.theme = 'system';
  }
  function applyUi() {
    if (!root) return;
    limitPositions();
    rootHost.setAttribute('data-effective', effectiveMode());
    launch.style.left = `${ui.buttonX}px`; launch.style.top = `${ui.buttonY}px`;
    launch.style.fontSize = `${Math.round(13 * ui.buttonSize / 100)}px`;
    launch.querySelector('.zsh-text').textContent = ui.buttonLabel.trim() || '🖼️';
    panel.style.left = `${ui.panelX}px`; panel.style.top = `${ui.panelY}px`;
    panel.style.width = `${ui.panelW}px`; panel.style.height = `${ui.panelH}px`;
    root.getElementById('size').value = String(ui.buttonSize);
    root.getElementById('size-val').textContent = `${ui.buttonSize}%`;
    if (root.activeElement !== root.getElementById('btn-label')) root.getElementById('btn-label').value = ui.buttonLabel;
    root.querySelectorAll('[data-theme]').forEach(btn => {
      const active = btn.dataset.theme === ui.theme;
      btn.setAttribute('aria-pressed', String(active));
    });
  }
  function bindDrag(handle, target, xKey, yKey, exclude = '') {
    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0 || (exclude && e.target.closest(exclude))) return;
      const x0 = e.clientX, y0 = e.clientY, startX = ui[xKey], startY = ui[yKey];
      let moved = false;
      handle.setPointerCapture(e.pointerId);
      const move = evt => {
        const dx = evt.clientX - x0, dy = evt.clientY - y0;
        if (Math.hypot(dx, dy) > 5) moved = true;
        if (!moved) return;
        evt.preventDefault();
        ui[xKey] = startX + dx; ui[yKey] = startY + dy;
        limitPositions(); applyUi();
      };
      const end = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', end);
        handle.removeEventListener('pointercancel', end);
        if (moved) {
          if (target === launch) { ignoreLauncherClick = true; setTimeout(() => { ignoreLauncherClick = false; }, 60); }
          savePrefs();
        }
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
    });
  }
  function bindResize(handle) {
    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      const x0 = e.clientX, y0 = e.clientY, w = ui.panelW, h = ui.panelH;
      handle.setPointerCapture(e.pointerId);
      const move = evt => {
        evt.preventDefault();
        ui.panelW = w + evt.clientX - x0;
        ui.panelH = h + evt.clientY - y0;
        limitPositions(); applyUi();
      };
      const end = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', end);
        handle.removeEventListener('pointercancel', end);
        savePrefs();
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
    });
  }
  function flash(text) {
    if (!root) return;
    const tip = root.getElementById('tip');
    tip.textContent = text; tip.hidden = false;
    clearTimeout(flash.timer);
    flash.timer = setTimeout(() => { tip.hidden = true; }, 2400);
  }

  function accessUrl() {
    const frame = chatFrame();
    const url = frame && parseUrl(frame.src);
    return url && isChatFrameUrl(url) ? url.origin + url.pathname : FRAME_ORIGIN + '/';
  }
  async function loadReferenceImages() {
    if (imagesRequested) return;
    imagesRequested = true;
    // Reuse the exact embedded Safari/Chrome screenshots from the designated
    // zeta-profiles-mob v1.0.5 source, only when an access dialog is required.
    const ref = 'https://raw.githubusercontent.com/casualJH/zeta-profiles-mob/1befb93e9160ec956a55ec1227fde9b48dc1936b/zeta-profiles-mob.user.js';
    try {
      const response = await fetch(ref, {credentials:'omit', cache:'force-cache'});
      if (!response.ok) throw new Error('기준 이미지 불러오기 실패');
      const source = await response.text();
      const images = [...source.matchAll(/<img\s+alt="(Safari|Chrome)[^"]*"[^>]*src="(data:image\/jpeg;base64,[a-zA-Z0-9+/=]+)"/g)];
      for (const m of images) {
        const img = root.getElementById(m[1].toLowerCase() + '-guide-image');
        if (img && m[2].length < 400000) img.src = m[2];
      }
      for (const type of ['safari', 'chrome']) {
        const img = root.getElementById(type + '-guide-image');
        root.getElementById(type + '-guide-status').hidden = Boolean(img?.getAttribute('src'));
      }
    } catch (_) {
      // The exact source is not available offline. Retain the textual guide.
      for (const type of ['safari', 'chrome']) {
        const note = root.getElementById(type + '-guide-status');
        if (note) note.textContent = '안내 이미지를 불러오지 못했습니다. 아래 권한 설정 문구를 참고하세요.';
      }
    }
  }
  function showAccess() {
    if (!accessDialog || accessDialog.open) return;
    root.getElementById('access-link').href = accessUrl();
    root.querySelectorAll('#access details').forEach(d => { d.open = false; });
    try { accessDialog.showModal(); } catch (_) { accessDialog.setAttribute('open',''); }
    loadReferenceImages();
  }
  function closeAccess() {
    if (!accessDialog?.open) return;
    try { accessDialog.close(); } catch (_) { accessDialog.removeAttribute('open'); }
  }

  function mount() {
    if (!document.body || root) return;
    rootHost = document.createElement('div');
    rootHost.id = 'zsh-root';
    root = rootHost.attachShadow({mode: 'open'});
    root.innerHTML = `
<style>
:host{--bg:#fff;--muted:#f4f5f7;--ink:#22252b;--sub:#606773;--line:#e2e4e8;--accent:#405a85;--accent-ink:#fff;color-scheme:light;font:13px/1.5 system-ui,-apple-system,sans-serif}
:host([data-effective="dark"]){--bg:#25262b;--muted:#30323a;--ink:#f4f4f6;--sub:#b9bdc7;--line:#494b54;--accent:#7e9dd5;--accent-ink:#18202f;color-scheme:dark}
*{box-sizing:border-box}button,input,textarea{font:inherit}button{cursor:pointer}button:disabled{opacity:.45;cursor:default}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
[hidden]{display:none!important}#launch{position:fixed;display:flex;align-items:center;justify-content:center;gap:5px;text-align:center;z-index:2147483625;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);padding:.64em .9em;box-shadow:0 4px 16px #0003;white-space:nowrap;touch-action:none;user-select:none;min-width:70px}
#launch .zsh-count{color:var(--accent);font-weight:700}
#panel{position:fixed;z-index:2147483630;background:var(--bg);color:var(--ink);border:1px solid var(--line);box-shadow:0 10px 38px #0005;border-radius:15px;overflow:hidden;min-width:280px;min-height:250px;display:flex;flex-direction:column}
#head{display:flex;align-items:center;gap:10px;background:var(--muted);padding:11px 13px;border-bottom:1px solid var(--line);touch-action:none;cursor:move;user-select:none;flex:none}#head strong{font-size:14px;flex:1}#head .version{font-size:11px;color:var(--sub)}
#head button{font-size:12px;background:var(--bg);color:var(--ink);border:1px solid var(--line);padding:5px 10px;border-radius:8px}
#scroll{padding:13px 14px 23px;overflow:auto;overscroll-behavior:contain;flex:1}#scroll h3{font-size:13px;margin:16px 0 7px}#scroll h3:first-child{margin-top:2px}#scroll p{margin:6px 0;color:var(--sub)}
#scroll .row{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:9px 0}#scroll button{border:1px solid var(--line);border-radius:8px;background:var(--muted);color:var(--ink);padding:8px 10px;min-height:34px}#scroll button.primary{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
#status{white-space:pre-wrap;padding:9px 10px;border:1px solid var(--line);border-radius:9px;background:var(--muted);color:var(--sub);min-height:40px;font-size:12px}
.stats{display:flex;gap:8px;margin:10px 0}.stat{flex:1;background:var(--muted);border-radius:9px;padding:10px}.stat small{display:block;color:var(--sub)}.stat strong{display:block;font-size:19px}
#preview{resize:vertical;width:100%;min-height:148px;max-height:430px;white-space:pre-wrap;background:var(--muted);border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:10px;font:12px/1.6 ui-monospace,SFMono-Regular,monospace}
#summary{font-size:12px;color:var(--sub)}.profile-card{display:flex;flex-wrap:wrap;gap:10px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:9px;margin:8px 0;background:var(--muted);min-width:0}.profile-thumb{width:58px;height:58px;min-width:58px;border-radius:9px;background:var(--bg);display:flex;justify-content:center;align-items:center;overflow:hidden;color:var(--sub);text-align:center;font-size:10px}.profile-thumb img{width:100%;height:100%;object-fit:cover}.profile-details{display:flex;flex:1;flex-direction:column;gap:3px;min-width:0;overflow-wrap:anywhere}.profile-details strong{font-size:12px}.profile-details small{font-size:11px;color:var(--sub)}.profile-details a{font-size:11px;color:var(--accent);text-decoration:underline}
.profile-actions{margin-left:auto;flex:none}
.profile-description-toggle,.profile-description button{border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);padding:6px 9px;min-height:32px;font-size:11px}
.profile-description{flex:0 0 100%;min-width:0;display:flex;flex-direction:column;gap:7px;border-top:1px solid var(--line);padding-top:9px}
.profile-description textarea{width:100%;min-height:90px;max-height:240px;resize:vertical;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);padding:9px;white-space:pre-wrap;font:12px/1.5 system-ui,-apple-system,sans-serif}
.profile-description button{align-self:flex-end}.note{font-size:11px;color:var(--sub);white-space:pre-line}.settings{border-top:1px solid var(--line);margin-top:18px;padding-top:8px}.settings label{display:block;margin:9px 0 4px}.settings input[type="text"]{width:100%;padding:7px;border-radius:7px;background:var(--bg);border:1px solid var(--line);color:var(--ink)}.settings input[type="range"]{width:100%;accent-color:var(--accent)}
.segment{display:flex;gap:3px;padding:3px;background:var(--muted);border:1px solid var(--line);border-radius:10px}.segment button{flex:1;padding:6px 3px!important;font-size:12px;background:transparent!important;border:0!important;border-radius:8px!important}.segment button[aria-pressed="true"]{background:var(--bg)!important;box-shadow:0 1px 3px #0002}
#resize{position:absolute;right:3px;bottom:2px;width:30px;height:27px;display:grid;place-items:center;cursor:nwse-resize;touch-action:none;color:var(--sub);font-size:21px;user-select:none}
#tip{position:fixed;z-index:2147483646;top:calc(env(safe-area-inset-top,0px) + 16px);left:50%;transform:translateX(-50%);border-radius:10px;max-width:min(90vw,420px);padding:9px 13px;background:#263b33;border:1px solid #60c99e;color:#fff;box-shadow:0 4px 12px #0003;text-align:center;pointer-events:none}
#access{position:fixed;inset:0;margin:auto;width:min(320px,90vw);height:fit-content;max-height:85vh;overflow:auto;box-sizing:border-box;color:#f5f5f5;background:#30303a;border:1px solid #777;border-radius:12px;padding:14px;z-index:2147483645;font:14px/1.5 system-ui,sans-serif}
#access::backdrop{background:#0008}#access p{margin:8px 0}#access details{margin:8px 0}#access summary{cursor:pointer;padding:6px 0;font-weight:700}#access img{display:block;width:100%;height:auto;border-radius:6px}#access a{color:#9fd5ff;text-decoration:underline}#access #close-access{width:100%;text-align:center;color:#f5f5f5;background:#383946;border:1px solid #696b79;border-radius:9px;min-height:40px;padding:7px 10px;margin-top:10px}
</style>
<button id="launch" type="button" aria-label="제타 짤뽑 도우미 열기"><span class="zsh-text"></span><span class="zsh-count"></span></button>
<section id="panel" hidden aria-label="제타 짤뽑 도우미">
 <header id="head"><strong>제타 짤뽑 도우미</strong><span class="version">v${VERSION}</span><button id="close" type="button">닫기</button></header>
 <div id="scroll">
  <h3>대화 불러오기</h3>
  <div id="status" role="status"></div>
  <div class="stats"><div class="stat"><small>불러온 원본 메시지</small><strong id="collected">0개</strong></div><div class="stat"><small>선택한 원본 메시지</small><strong id="selected">0개</strong></div></div>
  <div class="row"><button id="load" type="button">과거 대화 불러오기</button><button id="stop" type="button">중지</button></div>
  <h3>말풍선 직접 선택</h3>
  <p class="note">원본 메시지 단위만 선택합니다. 말풍선을 누르면 그 원본 메시지 전체가 선택됩니다. 다시 누르면 해제됩니다.</p>
  <div class="row"><button id="start" class="primary" type="button">말풍선 직접 선택</button><button id="clear" type="button">선택 해제</button></div>
  <h3>프로필 사진 자동 감지</h3>
   <p class="note">현재 채팅방의 유저·캐릭터 사진을 확인합니다.\n[프로필 새로고침]을 눌러주세요.</p>
   <div class="row"><button id="refresh-profiles" type="button">프로필 새로고침</button></div>
   <p id="profile-status" class="note" aria-live="polite">아직 감지된 프로필 없음</p>
   <div id="profile-cards"></div>
   <h3>선택 대화 원문</h3>
  <p id="summary" aria-live="polite">선택한 메시지가 없습니다.</p>
  <textarea id="preview" readonly placeholder="선택한 원본 메시지가 여기에 표시됩니다."></textarea>
  <div class="row"><span id="chars" class="note">0자</span><button id="copy" type="button">선택 원문 복사</button></div>
  <p class="note">현재는 0.2.1 개발판입니다. 이미지 클립보드 복사, 1인·2인·다인 모드 및 프롬프트 생성은 후속 버전에 추가됩니다.</p>
  <div class="settings"><h3>설정</h3><label for="size">실행 버튼 크기 <span id="size-val">100%</span></label><input id="size" type="range" min="65" max="155" step="5">
   <label for="btn-label">실행 버튼 표시 (글자·이모지)</label><input id="btn-label" type="text" maxlength="36" placeholder="🖼️">
   <label>테마 &gt; 화면 모드</label><div class="segment" role="group" aria-label="화면 모드"><button type="button" data-theme="light">라이트 모드</button><button type="button" data-theme="dark">다크 모드</button><button type="button" data-theme="system">기기 설정</button></div>
   <div class="row"><button id="reset" type="button">UI 설정 초기화</button></div>
  </div>
 </div><div id="resize" role="separator" aria-label="팝업창 크기 조절">◢</div>
</section>
<div id="tip" hidden role="status"></div>
<dialog id="access" aria-labelledby="access-title">
 <strong id="access-title">Tampermonkey 사이트 접근 안내</strong>
 <p>스크립트 실행을 위해, 아래 링크에서 Tampermonkey 접근 허용 설정을 해주세요.</p>
 <p><a id="access-link" href="https://frame.pingpong.ai/" target="_blank" rel="noopener noreferrer">frame.pingpong.ai 열기 ↗</a></p>
 <details><summary>Safari</summary><img id="safari-guide-image" alt="Safari Tampermonkey 사이트 접근 설정 예시"><p id="safari-guide-status">안내 이미지 불러오는 중</p><p>링크를 눌러 새 탭에서 사이트를 열고, Tampermonkey 메뉴를 열어 [이 웹사이트에서 항상 허용]을 누르세요.</p></details>
 <details><summary>Chrome</summary><img id="chrome-guide-image" alt="Chrome Tampermonkey 사이트 접근 설정 예시"><p id="chrome-guide-status">안내 이미지 불러오는 중</p><p>링크를 눌러 새 탭에서 사이트를 열고, Tampermonkey 메뉴를 열어 [사이트 데이터를 읽고 변경할 수 있음]-[frame.pingpong.ai에서]를 누르세요.</p></details>
 <button id="close-access" type="button">닫기</button>
</dialog>`;
    document.body.appendChild(rootHost);
    launch = root.getElementById('launch'); panel = root.getElementById('panel');
    statusBox = root.getElementById('status'); rawPreview = root.getElementById('preview');
    selectedSummary = root.getElementById('summary'); accessDialog = root.getElementById('access');
    limitPositions(); applyUi(); render();
    bindDrag(launch, launch, 'buttonX', 'buttonY');
    bindDrag(root.getElementById('head'), panel, 'panelX', 'panelY', 'button');
    bindResize(root.getElementById('resize'));
    launch.addEventListener('click', () => {
      if (ignoreLauncherClick) return;
      if (selectionMode) endSelecting();
      panel.hidden = !panel.hidden;
      if (!panel.hidden) { limitPositions(); applyUi(); render(); }
    });
    root.getElementById('close').addEventListener('click', () => { panel.hidden = true; });
    root.getElementById('load').addEventListener('click', loadMessages);
    root.getElementById('refresh-profiles').addEventListener('click', refreshProfiles);
    root.getElementById('stop').addEventListener('click', stopLoad);
    root.getElementById('start').addEventListener('click', () => selectionMode ? endSelecting() : startSelecting());
    root.getElementById('clear').addEventListener('click', () => { chosen.clear(); render(); });
    root.getElementById('copy').addEventListener('click', copyRaw);
    root.getElementById('size').addEventListener('input', e => { ui.buttonSize = Number(e.target.value); applyUi(); savePrefs(); });
    root.getElementById('btn-label').addEventListener('input', e => { ui.buttonLabel = e.target.value; applyUi(); savePrefs(); });
    root.querySelectorAll('[data-theme]').forEach(btn => btn.addEventListener('click', () => { ui.theme = btn.dataset.theme; applyUi(); savePrefs(); }));
    root.getElementById('reset').addEventListener('click', () => { ui = defaults(); applyUi(); savePrefs(); flash('UI 설정만 초기화했습니다.'); });
    root.getElementById('close-access').addEventListener('click', closeAccess);
    accessDialog.addEventListener('cancel', e => { e.preventDefault(); closeAccess(); });
    window.addEventListener('resize', () => { limitPositions(); applyUi(); savePrefs(); });
    window.visualViewport?.addEventListener('resize', () => { limitPositions(); applyUi(); });
    const media = matchMedia('(prefers-color-scheme: dark)');
    if (media.addEventListener) media.addEventListener('change', applyUi);
    else if (media.addListener) media.addListener(applyUi);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true});
  else mount();

  // Frame implementation. All messages carry a script-specific protocol and
  // verify the current parent origin; no cross-origin DOM access is needed.
  function initChatFrame() {
    if (window.__zetaSnapshotFrame010) return;
    window.__zetaSnapshotFrame010 = true;
    let origin = '';
    try {
      const supplied = new URLSearchParams(location.hash.slice(1)).get('host');
      if (supplied) origin = new URL(supplied).origin;
      else if (document.referrer) origin = new URL(document.referrer).origin;
    } catch (_) { return; }
    if (!/^https:\/\/(?:[a-z0-9-]+\.)?zeta-ai\.io$/i.test(origin)) return;
    let known = new Set(), selected = new Set(), enabled = false;
    let highlight = null, scheduled = false, lastProfileSent = '', activeRoom = '';
    function selectedUserProfile() {
      const dialog = document.querySelector('[role="dialog"][aria-label="대화 프로필"]');
      if (!dialog?.getClientRects().length) return {state:'dialog-closed'};
      if (!dialog.querySelector('[role="group"][aria-label="My chat profiles"]'))
        return {state:'list-unavailable'};
      const matches = [];
      for (const edit of dialog.querySelectorAll('button[aria-label^="edit-"]')) {
        const parent = edit.parentElement;
        if (!parent) continue;
        const selection = [...parent.children].find(el => el.matches('button:disabled') && el.querySelector('img'));
        if (selection) matches.push({edit, selection});
      }
      if (matches.length !== 1) return {state:'selection-unknown'};
      const {edit, selection} = matches[0];
      const image = selection.querySelector('img');
      const url = cleanImage(image?.currentSrc || (image?.getAttribute('src') ? image.src : ''));
      return {state:url?'ok':'image-unavailable', key:edit.getAttribute('aria-label') || '', image:url,
        name:''};
    }
    function displayedAvatars() {
      const byName = new Map();
      const scope = document.querySelector('[aria-label="Chat messages"]');
      if (!scope) return [];
      for (const img of scope.querySelectorAll('img[alt]')) {
        if (!img.closest(ROW_SELECTOR) || !img.alt.trim()) continue;
        const image = cleanImage(img.currentSrc || (img.getAttribute('src') ? img.src : ''));
        if (!image) continue;
        if (!byName.has(img.alt.trim())) byName.set(img.alt.trim(), new Set());
        byName.get(img.alt.trim()).add(image);
      }
      // A name with multiple distinct photos must not be assigned automatically.
      return [...byName].filter(([name, images]) => images.size === 1)
        .slice(0, 100).map(([name, images]) => ({name, image:[...images][0]}));
    }
    function takeProfileSnapshot() {return {user:selectedUserProfile(), candidates:displayedAvatars()};}
    function sendProfileSnapshot() {
      const snapshot = takeProfileSnapshot(), signature = JSON.stringify(snapshot);
      if (signature === lastProfileSent) return;
      lastProfileSent = signature;
      if (!activeRoom) return;
      window.parent.postMessage({protocol:PROTOCOL, type:'profile-snapshot', room:activeRoom, snapshot:{...snapshot, room:activeRoom}}, origin);
    }
    const messageId = row => row.getAttribute('data-key')?.slice('message-'.length) || null;
    function messageElements(row) {
      const slide = row.querySelector('.swiper-slide-active');
      if (row.querySelector('.swiper-slide') && !slide) return [];
      const base = slide || row;
      const bodies = [...base.querySelectorAll(BODY_SELECTOR)].filter(el => el.closest(ROW_SELECTOR) === row);
      if (bodies.length) return bodies;
      return slide ? [slide] : (row.firstElementChild ? [row.firstElementChild] : []);
    }
    function clickedMessage(event) {
      const target = event.target instanceof Element ? event.target : event.target?.parentElement;
      if (!target || target.closest('a,button,input,textarea,select,[contenteditable="true"]')) return null;
      const row = target.closest(ROW_SELECTOR);
      return row && messageElements(row).some(el => el.contains(target)) ? messageId(row) : null;
    }
    document.addEventListener('click', event => {
      if (!enabled) return;
      const id = clickedMessage(event);
      if (!id || !known.has(id)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      window.parent.postMessage({protocol: PROTOCOL, type: 'toggle', id}, origin);
    }, true);
    function redraw() {
      scheduled = false;
      if (!enabled || !document.body) { highlight?.remove(); highlight = null; return; }
      if (!highlight) {
        highlight = document.createElement('div');
        highlight.id = 'zsh-selected-overlay';
        highlight.setAttribute('aria-hidden', 'true');
        highlight.style.cssText = 'position:fixed;inset:0;z-index:2147483600;pointer-events:none;overflow:hidden';
        document.body.appendChild(highlight);
      }
      const fragment = document.createDocumentFragment();
      for (const row of document.querySelectorAll(ROW_SELECTOR)) {
        if (!selected.has(messageId(row))) continue;
        for (const body of messageElements(row)) {
          const rect = body.getBoundingClientRect();
          if (rect.width <= 1 || rect.height <= 1 || rect.bottom < 0 || rect.top > innerHeight) continue;
          const div = document.createElement('div');
          div.style.cssText = `position:absolute;box-sizing:border-box;border:3px solid #40c889;border-radius:16px;background:rgba(64,200,137,.055);left:${Math.max(0,rect.left)}px;top:${Math.max(0,rect.top)}px;width:${Math.min(innerWidth,rect.right)-Math.max(0,rect.left)}px;height:${rect.height}px`;
          fragment.appendChild(div);
        }
      }
      highlight.replaceChildren(fragment);
    }
    function schedule() {
      if (scheduled) return;
      scheduled = true; requestAnimationFrame(redraw);
    }
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.addEventListener('message', e => {
      if (e.origin !== origin || e.source !== window.parent || e.data?.protocol !== PROTOCOL) return;
      if (e.data.type === 'ping') {
        if (e.ports.length !== 1 || typeof e.data.nonce !== 'string') return;
        const port = e.ports[0];
        port.postMessage({protocol: PROTOCOL, nonce: e.data.nonce, ok: true});
        port.close();
      } else if (e.data.type === 'profile-read') {
        if (e.ports.length !== 1 || typeof e.data.nonce !== 'string' || typeof e.data.room !== 'string') return;
        activeRoom = e.data.room;
        const port = e.ports[0];
        port.postMessage({protocol:PROTOCOL, nonce:e.data.nonce, ok:true, snapshot:takeProfileSnapshot()});
        port.close();
      } else if (e.data.type === 'state') {
        const next = e.data.state;
        if (!next || !Array.isArray(next.known) || !Array.isArray(next.chosen)) return;
        enabled = next.enabled === true;
        known = new Set(next.known.filter(s => typeof s === 'string'));
        selected = new Set(next.chosen.filter(s => typeof s === 'string'));
        schedule();
      }
    });
    function ready() {
      if (!document.body) return;
      const observer = new MutationObserver(entries => {
        if (enabled && entries.some(e => !e.target?.closest?.('#zsh-selected-overlay'))) schedule();
      });
      observer.observe(document.body, {childList: true, subtree: true});
      const profileObserver = new MutationObserver(() => {
        clearTimeout(profileObserver.timer);
        profileObserver.timer = setTimeout(sendProfileSnapshot, 300);
      });
      profileObserver.observe(document.body, {childList:true, subtree:true, attributes:true,
        attributeFilter:['src','class','disabled','aria-label']});
      window.parent.postMessage({protocol: PROTOCOL, type: 'ready'}, origin);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once: true});
    else ready();
  }
})();
