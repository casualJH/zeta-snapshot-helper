// ==UserScript==
// @name         제타 짤뽑 도우미
// @namespace    zeta-snapshot-helper
// @version      0.4.12
// @description  1인 스냅샷 프롬프트 생성 · 원본 메시지 선택 · 프로필 감지 (개발판)
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
  const VERSION = '0.4.12';
  const FRAME_ORIGIN = 'https://frame.pingpong.ai';
  const API_ORIGIN = 'https://api.zeta-ai.io';
  const PROTOCOL = 'zeta-snapshot-helper:selection:v1';
  const UI_KEY = 'zeta-snapshot-helper:ui:v1';
  const SOLO_SNAPSHOT_TEMPLATE = "[1인 스냅샷 생성 프롬프트]\n\n{{CHAT_BLOCK}}{{USER_INPUT}}\n\n{{REFERENCE_BLOCK}}\n\n첨부한 인물의 이미지를 참고하여, 동일한 그림체와 외형을 유지한 새로운 1인 스냅샷 일러스트를 생성한다.\n\n1. 인물 및 그림체 유지 (최우선)\n\n- 첨부 사진 속 인물의 얼굴형, 이목구비, 눈매, 코, 입술, 턱선, 헤어스타일, 머리색과 고유한 분위기를 최대한 정확하게 재현한다.\n- 원본 특유의 그림체, 선화, 채색 방식, 명암, 피부와 머리카락의 표현을 일관되게 유지한다.\n- 얼굴의 고유한 특징과 인상을 유지하여 어떤 각도에서도 동일인물로 인식되도록 한다.\n- 임의로 미화하거나 실사화하지 않으며, 다른 화풍으로 재해석하지 않는다.\n- 원본에 없는 문신, 피어싱, 흉터 등 외형적 특징을 임의로 추가하지 않는다.\n- 인물의 기존 성별, 체격, 신체 비율과 분위기를 자연스럽게 유지한다.\n\n2. 구도 및 자세 독립 생성 (매우 중요)\n\n- 첨부 사진은 인물의 외형과 그림체를 참고하기 위한 자료이며, 기존 얼굴 각도나 구도를 복제하기 위한 자료가 아니다.\n- 원본 사진의 얼굴 방향, 고개 각도, 시선, 표정, 자세와 카메라 구도를 그대로 가져다 쓰지 않는다.\n- 새로운 장면에 어울리는 얼굴 각도와 신체 방향을 독자적으로 구성한다.\n- 정면, 측면, 3/4 측면, 고개를 살짝 돌린 모습 등 자연스러운 각도를 상황에 맞게 자유롭게 활용한다.\n- 매번 정면을 바라보거나 동일한 표정과 자세를 반복하는 단조로운 구도를 피한다.\n- 자연스러운 원근감과 인체 비율을 유지하고, 인물의 키와 체격을 정확하게 반영한다.\n- 얼굴 각도가 달라지더라도 이목구비의 비율과 고유한 인상이 달라지지 않도록 한다.\n\n3. 자연스러운 인물 표현 및 행동\n\n- 인물이 실제로 해당 공간에 존재하는 듯한 자연스러운 장면을 연출한다.\n- 인물의 성격과 상황에 맞춰 시선, 손짓, 자세, 표정과 행동을 독립적으로 구성한다.\n- 반드시 카메라를 바라볼 필요는 없으며, 다른 곳을 응시하거나 특정 행동에 집중하는 모습도 자연스럽게 표현한다.\n- 억지로 포즈를 취하거나 과장된 표정을 짓지 않고, 일상 속 우연히 포착된 순간처럼 표현한다.\n- 인물의 자세와 행동이 주변 환경 및 사물과 자연스럽게 연결되도록 한다.\n- 불필요한 인물이나 신체 부위를 추가하지 않는다.\n\n4. 스냅샷 연출 및 완성도\n\n- 제3자가 자연스럽게 촬영한 듯한 생동감 있는 스냅샷 구도를 사용한다.\n- 장면에 어울리는 카메라 높이, 촬영 거리, 원근감과 프레이밍을 독자적으로 결정한다.\n- 정면 구도에만 집착하지 않고 로우앵글, 하이앵글, 사선 구도, 측면 촬영 등 다양한 시점을 상황에 맞게 활용한다.\n- 인물이 배경과 같은 광원의 영향을 받도록 조명과 그림자를 자연스럽게 통일한다.\n- 손가락 개수, 관절, 팔과 다리의 연결, 신체 비율을 정확하게 표현한다.\n- 높은 일러스트 완성도를 유지하되, 원본 그림체를 훼손할 정도의 과도한 보정은 금지한다.\n- 장면에 적합한 자연스러운 프레이밍을 사용하며, 부자연스러운 신체 절단이나 과도한 클로즈업을 피한다.\n\n5. 최종 핵심 원칙\n\n원본의 얼굴과 그림체는 최대한 정확하게 유지하되, 얼굴 각도·표정·시선·자세·카메라 구도는 새로운 장면에 맞춰 완전히 새롭게 구성한다.\n\n얼굴을 유지한다는 것은 원본의 얼굴 각도를 복사한다는 의미가 아니라, 어떤 각도에서도 동일한 인물로 보이도록 고유한 이목구비와 인상을 재현한다는 의미다.\n\n결과물은 기존 사진의 얼굴이나 신체를 단순히 복사하거나 배경만 교체한 이미지가 아니라, 동일한 캐릭터가 새로운 상황에서 자연스럽게 촬영된 한 장의 독립적인 일러스트여야 한다.";
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
  const scene={mode:'2',solo:'user',pair:0,pairPeople:new Set(['user']),pairInitialized:false,multiUser:true,multi:new Set(),initialized:false};
  let selectionBeforeStart=null;
  let includeChat=false, generatedRoom=room;
  const modeDrafts=Object.fromEntries(['1','2','multi'].map(k=>[k,{input:'',output:'',includeChat:false,generatedRoom:room}]));
  function saveModeDraft() {
    if(!root)return;
    const d=modeDrafts[scene.mode];
    d.input=root.getElementById('snapshot-user-input').value;
    d.output=root.getElementById('snapshot-output').value;
    d.includeChat=includeChat;d.generatedRoom=generatedRoom;
  }
  function restoreModeDraft() {
    const d=modeDrafts[scene.mode];includeChat=d.includeChat;generatedRoom=d.generatedRoom;
    if(!root)return;
    root.getElementById('snapshot-user-input').value=d.input;
    root.getElementById('snapshot-output').value=d.output;
  }
  function switchSceneMode(mode){
    if(mode===scene.mode)return;
    saveModeDraft();scene.mode=mode;restoreModeDraft();renderSceneModes();
  }
  const plotIntroductions = new Map();
  const screenDescriptions = new Map();
  let descriptionReadScheduled = false;
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
    expandedDescriptions.clear(); plotIntroductions.clear(); screenDescriptions.clear();
    scene.pair=0;scene.solo='user';scene.pairPeople=new Set(['user']);scene.pairInitialized=false;scene.multiUser=true;scene.multi.clear();scene.initialized=false;
    selectionBeforeStart=null;
    includeChat=false;generatedRoom=currentRoom();
    for(const d of Object.values(modeDrafts)){d.input='';d.output='';d.includeChat=false;d.generatedRoom=generatedRoom;}
    if(root){
      const input=root.getElementById('snapshot-user-input'),output=root.getElementById('snapshot-output');
      if(input)input.value='';
      if(output)output.value='';
      updateSnapshotControls();
    }
    renderProfiles();
  }
  function collectVisibleProfileDescription() {
    if (!document.body || !currentRoom()) return;
    const characters = profileState.characters, candidates = [];
    for (const title of document.querySelectorAll('h3, [role="heading"]')) {
      if (!title.getClientRects().length) continue;
      const name = String(title.textContent || '').trim();
      if (!name || characters.filter(c => c.name.trim() === name).length !== 1) continue;
      const header = title.parentElement;
      const close = header?.querySelector('button[aria-label="Close"], button[aria-label="닫기"]');
      if (!close?.getClientRects().length) continue;
      const overlay = header.parentElement;
      if (!overlay || overlay.closest('[aria-hidden="true"], [hidden]')) continue;
      const sections = [...overlay.children].filter(section => section !== header && section.getClientRects().length);
      const known = sections.filter(section => section.matches('[data-sentry-component="CharacterDescription"]'));
      for (const section of known.length ? known : sections) {
        const body = section.matches('.whitespace-pre-wrap') ? section : section.querySelector('.whitespace-pre-wrap');
        if (!body || !body.getClientRects().length || body.closest('[aria-hidden="true"], [hidden]')) continue;
        const description = String(body.innerText || '').trim();
        if (description) candidates.push({name, description: description.slice(0, 30000)});
      }
    }
    if (candidates.length !== 1) return;
    const {name, description} = candidates[0];
    if (screenDescriptions.get(name) !== description) {
      screenDescriptions.set(name, description);
      renderProfiles();
    }
  }
  function scheduleProfileDescriptionRead() {
    if (descriptionReadScheduled) return;
    descriptionReadScheduled = true;
    setTimeout(() => {
      descriptionReadScheduled = false;
      collectVisibleProfileDescription();
    }, 180);
  }
  function observeProfilePayload(path, payload, sourceRoom) {
    if (!sourceRoom || sourceRoom !== currentRoom() || !payload || typeof payload !== 'object') return;
    const pathname = String(path).replace(/\/$/, '');
    const plotDetail = /^\/v1\/plots\/([0-9a-f-]{36})$/i.exec(pathname);
    if (plotDetail && plotDetail[1] === profileState.plotId && payload.id === profileState.plotId &&
        Array.isArray(payload.about?.characters)) {
      plotIntroductions.clear();
      for (const item of payload.about.characters) {
        if (item && typeof item.characterId === 'string' && typeof item.description === 'string' && item.description.trim())
          plotIntroductions.set(item.characterId, item.description.slice(0, 30000));
      }
      renderProfiles();
      return;
    }
    if (pathname === `/v1/rooms/${sourceRoom}` && payload.plot && typeof payload.plot === 'object') {
      const plot = payload.plot;
      const characters = Array.isArray(plot.characters) ? plot.characters : null;
      if (characters) {
        const mapped = characters.map(personFrom).filter(Boolean);
        // Keep the array as provided by the room's plot; never dedupe by name.
        profileState.characters = mapped;
        const nextPlotId = typeof plot.id === 'string' ? plot.id : null;
        if (profileState.plotId !== nextPlotId) {
          plotIntroductions.clear(); screenDescriptions.clear();
        }
        profileState.plotId = nextPlotId;
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
      /^\/v1\/plots\/[^/]+\/rooms\/[^/]+\/user-personas\/(select|selected)\/?$/.test(path) ||
      /^\/v1\/plots\/[0-9a-f-]{36}\/?$/i.test(path))) return;
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
      /^\/v1\/plots\/[^/]+\/rooms\/[^/]+\/user-personas\/(select|selected)\/?$/.test(path) ||
      /^\/v1\/plots\/[0-9a-f-]{36}\/?$/i.test(path))) return;
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
      return {...c, image: c.image || fallback,
        description: (unambiguousName && screenDescriptions.get(c.name)) ||
          (c.id && plotIntroductions.get(c.id)) || c.description || ''};
    });
    // No room detail: only show displayed chat avatars as *unverified* candidates.
    return profileState.candidates.map(c => ({...c, id:'', candidate:true}));
  }

  async function writeText(text) {
    if(navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const t=document.createElement('textarea');t.value=text;t.style.cssText='position:fixed;left:-9999px';
    root.appendChild(t);
    try {t.focus();t.select();if(!document.execCommand('copy'))throw Error('Copy denied');}
    finally{t.remove();}
  }
  async function copyProfileUrl(url,name) {
    try {await writeText(url);flash(name+' · 이미지 URL을 복사했습니다.');}
    catch(_){flash('URL 복사 실패 · 이미지 보기 링크에서 직접 복사해 주세요.');}
  }
  async function toPng(url) {
    const response=await fetch(url,{mode:'cors',credentials:'omit'});
    if(!response.ok)throw Error('Image fetch failed');
    const blob=await response.blob();
    if(blob.type==='image/png')return blob;
    let bitmap=null,el=null,objectUrl='';
    try {
      if(typeof createImageBitmap==='function')try{bitmap=await createImageBitmap(blob);}catch(_){}
      if(!bitmap) {
        objectUrl=URL.createObjectURL(blob);
        el=await new Promise((resolve,reject)=>{
          const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=objectUrl;
        });
      }
      const w=bitmap?bitmap.width:el.naturalWidth,h=bitmap?bitmap.height:el.naturalHeight;
      if(!w||!h)throw Error('Invalid image');
      const ratio=Math.min(1,4096/Math.max(w,h));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(w*ratio));canvas.height=Math.max(1,Math.round(h*ratio));
      const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
      ctx.drawImage(bitmap||el,0,0,canvas.width,canvas.height);
      return await new Promise((resolve,reject)=>
        canvas.toBlob(data=>data?resolve(data):reject(Error('Conversion failed')),'image/png'));
    } finally {bitmap?.close?.();if(objectUrl)URL.revokeObjectURL(objectUrl);}
  }
  async function copyProfileImage(url,name) {
    if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined'){
      flash('이미지 복사 미지원 · URL 복사를 사용해 주세요.');return;
    }
    try {
      const promise=toPng(url);
      await navigator.clipboard.write([new ClipboardItem({'image/png':promise})]);
      flash(name+' · 이미지 복사 완료');
    } catch(_){flash('이미지 복사 실패 · URL 복사를 사용해 주세요.');}
  }
  function renderSceneModes(characters=profileCandidates()) {
    if(!root)return;
    const host=root.getElementById('scene-controls'),picker=root.getElementById('snapshot-person-picker');
    const preview=root.getElementById('scene-summary');
    if(!host||!picker||!preview)return;
    const scroll=root.getElementById('scroll'),top=scroll?.scrollTop;
    if(!scene.initialized&&characters.length){
      scene.multi=new Set(characters.map((_,i)=>i));scene.initialized=true;
    }
    host.replaceChildren();
    const tabs=document.createElement('div');tabs.className='scene-tabs';
    for(const [mode,label] of [['1','1인'],['2','2인'],['multi','다인']]){
      const b=document.createElement('button');b.type='button';b.textContent=label;
      b.setAttribute('aria-pressed',String(scene.mode===mode));
      b.addEventListener('click',()=>switchSceneMode(mode));tabs.appendChild(b);
    }
    host.appendChild(tabs);
    // The mode tabs above already identify the number of people.
    picker.replaceChildren();
    function chip(label,active,action,disabled=false){
      const b=document.createElement('button');b.type='button';b.textContent=label;
      b.setAttribute('aria-pressed',String(Boolean(active)));b.disabled=disabled;
      if(!disabled)b.addEventListener('click',action);
      picker.appendChild(b);
    }
    const included=[];
    if(scene.mode==='1'){
      if(scene.solo!=='user'&&!characters[Number(scene.solo.split(':')[1])])scene.solo='user';
      chip('유저',scene.solo==='user',()=>{scene.solo='user';renderSceneModes();});
      characters.forEach((c,i)=>chip(c.name||'캐릭터 '+(i+1),scene.solo==='char:'+i,()=>{scene.solo='char:'+i;renderSceneModes();}));
      if(scene.solo==='user')included.push(['유저',profileState.user]);
      else{const c=characters[Number(scene.solo.split(':')[1])];if(c)included.push(['캐릭터',c]);}
    }else if(scene.mode==='2'){
      // A pair may contain any two different people; the user is not required.
      if(!scene.pairInitialized&&characters.length){
        scene.pairPeople=new Set(['user','char:0']);scene.pairInitialized=true;
      }
      const validKeys=new Set(['user',...characters.map((_,i)=>'char:'+i)]);
      scene.pairPeople=new Set([...scene.pairPeople].filter(key=>validKeys.has(key)));
      const togglePair=(key)=>{
        if(scene.pairPeople.has(key))scene.pairPeople.delete(key);
        else{
          if(scene.pairPeople.size>=2)scene.pairPeople.delete(scene.pairPeople.values().next().value);
          scene.pairPeople.add(key);
        }
        renderSceneModes();
      };
      chip('유저',scene.pairPeople.has('user'),()=>togglePair('user'));
      characters.forEach((c,i)=>chip(c.name||'캐릭터 '+(i+1),
        scene.pairPeople.has('char:'+i),()=>togglePair('char:'+i)));
      if(scene.pairPeople.has('user'))included.push(['유저',profileState.user]);
      characters.forEach((c,i)=>{if(scene.pairPeople.has('char:'+i))included.push(['캐릭터',c]);});
    }else{
      chip('유저',scene.multiUser,()=>{scene.multiUser=!scene.multiUser;renderSceneModes();});
      characters.forEach((c,i)=>chip(c.name||'캐릭터 '+(i+1),scene.multi.has(i),()=>{
        if(scene.multi.has(i))scene.multi.delete(i);else scene.multi.add(i);renderSceneModes();
      }));
      if(scene.multiUser)included.push(['유저',profileState.user]);
      characters.forEach((c,i)=>{if(scene.multi.has(i))included.push(['캐릭터',c]);});
    }
    preview.replaceChildren();
    const head=document.createElement('strong');head.textContent='포함 인물 '+included.length+'명';preview.appendChild(head);
    included.forEach(([role,person],i)=>{
      const line=document.createElement('div');
      line.textContent='첨부사진'+(i+1)+' — '+(person?.name||(role==='유저'?'유저 프로필 미확인':'캐릭터 미확인'))+
        ' ('+role+') · '+(person?.image?'사진 확인됨':'사진 미확인');
      preview.appendChild(line);
    });
    if(!included.length)preview.appendChild(document.createTextNode('선택된 인물이 없습니다.'));
    updateSnapshotControls();
    if(scroll&&Number.isFinite(top))scroll.scrollTop=top;
  }

  // Resolve people in the same order used by the on-screen numbered image summary.
  function selectedScenePeople(characters=profileCandidates()) {
    if(scene.mode==='1') {
      if(scene.solo==='user')return [{role:'유저',person:profileState.user}];
      const match=/^char:(\d+)$/.exec(scene.solo);
      const person=match?characters[Number(match[1])]:null;
      return person?[{role:'캐릭터',person}]:[];
    }
    const people=[];
    const addUser=()=>people.push({role:'유저',person:profileState.user});
    if(scene.mode==='2') {
      if(scene.pairPeople.has('user'))addUser();
      characters.forEach((person,i)=>{
        if(scene.pairPeople.has('char:'+i))people.push({role:'캐릭터',person});
      });
    }else if(scene.mode==='multi'){
      if(scene.multiUser)addUser();
      characters.forEach((person,i)=>{
        if(scene.multi.has(i))people.push({role:'캐릭터',person});
      });
    }
    return people;
  }
  function formatSceneReferenceBlock(people) {
    return '[등장인물 및 참조 이미지]\n\n'+people.map(({role,person},i)=>{
      const name=person?.name|| (role==='유저'?'유저 프로필 미확인':'캐릭터 이름 미확인');
      const purpose=role==='유저'?'인물 외형':'인물 외형 + 그림체 기준';
      return '첨부사진'+(i+1)+'\n이름: '+name+
        '\n이미지 URL: '+(person?.image||'사진 미확인')+
        '\n참조 용도: '+purpose;
    }).join('\n\n');
  }
  function generateSceneReferences() {
    const people=selectedScenePeople();
    if(scene.mode==='2'&&people.length!==2){
      flash('2인 모드에서는 인물 2명을 선택해 주세요.');return;
    }
    if(scene.mode==='multi'&&people.length<2){
      flash('다인 모드에서는 인물 2명 이상을 선택해 주세요.');return;
    }
    if(!people.length){flash('인물을 선택해 주세요.');return;}
    const raw=includeChat?selectedRaw():'';
    if(includeChat&&!raw.trim()){flash('첨부할 대화를 선택해 주세요.');return;}
    const text=root.getElementById('snapshot-user-input').value;
    const additions=text.trim()?'[추가사항]\n\n'+text+'\n\n':'';
    const conversation=raw.trim()?'[대화 원문]\n\n'+raw+'\n\n':'';
    const result=conversation+additions+formatSceneReferenceBlock(people);
    root.getElementById('snapshot-output').value=result;
    generatedRoom=currentRoom();saveModeDraft();updateSnapshotControls();
    flash('선택 인물의 이름과 이미지 URL을 정리했습니다.');
  }
  function generateSnapshot() {
    if(scene.mode==='1')generateSoloSnapshot();
    else generateSceneReferences();
  }
  function selectedSoloProfile() {
    if(scene.mode!=='1')return null;
    if(scene.solo==='user')return {type:'유저',person:profileState.user};
    const match=/^char:(\d+)$/.exec(scene.solo);
    if(!match)return null;
    const person=profileCandidates()[Number(match[1])];
    return person?{type:'캐릭터',person}:null;
  }
  function updateSnapshotControls() {
    if(!root)return;
    const gen=root.getElementById('snapshot-generate');
    const toggle=root.getElementById('snapshot-attach');
    const copy=root.getElementById('snapshot-copy');
    const label=root.getElementById('snapshot-attach-info');
    const output=root.getElementById('snapshot-output');
    if(!gen||!toggle||!copy||!label||!output)return;
    const one=scene.mode==='1';
    const countPeople=selectedScenePeople().length;
    gen.disabled=!one&&((scene.mode==='2'&&countPeople!==2)||(scene.mode==='multi'&&countPeople<2));
    gen.textContent=one?'프롬프트 생성':'참조 이미지 목록 생성';
    toggle.disabled=false;
    root.getElementById('snapshot-template-note').hidden=one;
    toggle.setAttribute('aria-pressed',String(includeChat));
    toggle.textContent=includeChat?'대화 내용 첨부 해제':'대화 내용 첨부';
    copy.disabled=!output.value.trim();
    const count=loaded.filter(x=>chosen.has(x.id)).length;
    label.textContent=includeChat?'선택 메시지 '+count+'개 · 생성 시 대화 내용 삽입':'';
  }
  function toggleSnapshotChat() {
    if(!includeChat&&!selectedRaw().trim()) {
      flash('먼저 대화 말풍선을 선택해 주세요.');
      return;
    }
    includeChat=!includeChat;
    updateSnapshotControls();
  }
  function generateSoloSnapshot() {
    if(scene.mode!=='1'){
      flash('1인 모드에서만 생성할 수 있습니다.');return;
    }
    const subject=selectedSoloProfile();
    if(!subject){flash('인물을 먼저 선택해 주세요.');return;}
    const raw=includeChat?selectedRaw():'';
    if(includeChat&&!raw.trim()){
      flash('첨부할 대화를 선택해 주세요.');return;
    }
    const chatBlock=raw.trim()
      ? '[대화 원문]\n\n'+raw+'\n\n'
      : '';
    const userInput=root.getElementById('snapshot-user-input').value;
    const formattedInput=userInput.trim()?'[추가사항]\n\n'+userInput:'';
    const url=subject.person?.image||'';
    const result=SOLO_SNAPSHOT_TEMPLATE
      .replace('{{CHAT_BLOCK}}',chatBlock)
      .replace('{{USER_INPUT}}',formattedInput)
      .replace('{{REFERENCE_BLOCK}}',formatSceneReferenceBlock([{role:subject.type,person:subject.person}]));
    root.getElementById('snapshot-output').value=result;
    generatedRoom=currentRoom();
    saveModeDraft();
    updateSnapshotControls();
    flash(url?'1인 스냅샷 프롬프트를 생성했습니다.':'이미지 URL이 미확인입니다. 결과에서 직접 입력할 수 있습니다.');
  }
  async function copySoloSnapshot() {
    const field=root.getElementById('snapshot-output');
    if(!field?.value.trim())return;
    if(generatedRoom!==currentRoom()){
      flash('채팅방이 변경되었습니다. 다시 생성해 주세요.');return;
    }
    try {
      await writeText(field.value);
      flash('프롬프트 전체를 복사했습니다.');
    } catch(_) {
      field.focus();field.select();
      flash('자동 복사를 사용할 수 없습니다. 직접 복사해 주세요.');
    }
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
        `유저 · ${person?.image ? '사진 확인됨' : '사진 미확인'}` :
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
       item.classList.toggle("has-description", expanded);
       detailButton.textContent = expanded ? '설명 닫기' : '설명';
       detailButton.setAttribute('aria-expanded', String(expanded));
       if(person?.image) {
         const imageButton=document.createElement('button');
         imageButton.type='button';imageButton.textContent='이미지 복사';
         imageButton.addEventListener('click',()=>copyProfileImage(person.image,person.name||role));
         const urlButton=document.createElement('button');
         urlButton.type='button';urlButton.textContent='URL 복사';
         urlButton.addEventListener('click',()=>copyProfileUrl(person.image,person.name||role));
         actions.append(imageButton,urlButton);
       }
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
         item.classList.toggle("has-description", show);
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
    renderSceneModes(chars);
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
          const plotId = profileState.plotId;
          if (generationAtStart === profileEpoch && target === currentRoom() &&
              plotId && /^[0-9a-f-]{36}$/i.test(plotId)) {
            try {
              const plotResponse = await nativeFetch.call(window, `${API_ORIGIN}/v1/plots/${plotId}`, {
                headers:{...headers}, credentials:'include', cache:'no-store'});
              if (plotResponse.ok) await readProfileResponse(plotResponse, plotResponse.url, target);
            } catch (_) { /* Plot introduction data is optional. */ }
          }
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
      if (target === currentRoom() && generationAtStart === profileEpoch) {
        collectVisibleProfileDescription();
        setInfo(`프로필 새로고침: ${roomResult} · ${frameResult}`);
      }
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
  function watchProfilePanels() {
    if (!document.body) return;
    new MutationObserver(scheduleProfileDescriptionRead).observe(document.body, {childList:true,subtree:true});
    scheduleProfileDescriptionRead();
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', watchProfilePanels, {once:true});
  else watchProfilePanels();
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
      selectionBeforeStart=new Set(chosen);
      selectionMode = true;
      if (panel) panel.hidden = true;
      syncFrame(); render();
      flash('말풍선을 선택한 뒤 상단의 선택 완료 또는 취소를 눌러주세요.');
    } finally { probing = false; }
  }
  function endSelecting() {
    selectionMode = false; validatedFrame = null;
    selectionBeforeStart=null;
    syncFrame(); render();
  }
  function finishSelectingFromTop(){
    if(!selectionMode)return;
    endSelecting();
    panel.hidden=false;limitPositions();applyUi();render();
  }
  function cancelSelectingFromTop(){
    if(!selectionMode)return;
    if(selectionBeforeStart)chosen=new Set(selectionBeforeStart);
    endSelecting();
    panel.hidden=false;limitPositions();applyUi();render();
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
    const scroller=root.getElementById('scroll'),position=scroller?.scrollTop;
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
    updateSnapshotControls();
    syncFrame();
    root.getElementById('selection-actions').hidden=!selectionMode;
    root.getElementById('tip').dataset.selecting=String(selectionMode);
    // Avoid DOM rebuilding above the scroller on every asynchronous history status update.
    if(scroller&&Number.isFinite(position))scroller.scrollTop=position;
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
    launch.dataset.jhDockIcon = '🖼️';
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
    tip.dataset.selecting=String(selectionMode);
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
#launch .zsh-text{display:inline-block;text-align:center}
#launch .zsh-count{color:var(--accent);font-weight:700}
#launch .zsh-count:empty{display:none}
#panel{position:fixed;z-index:2147483630;background:var(--bg);color:var(--ink);border:1px solid var(--line);box-shadow:0 10px 38px #0005;border-radius:15px;overflow:hidden;min-width:280px;min-height:250px;display:flex;flex-direction:column}
#head{display:flex;align-items:center;gap:10px;background:var(--muted);padding:11px 13px;border-bottom:1px solid var(--line);touch-action:none;cursor:move;user-select:none;flex:none}#head strong{font-size:14px;flex:1}#head .version{font-size:11px;color:var(--sub)}
#head button{font-size:12px;background:var(--bg);color:var(--ink);border:1px solid var(--line);padding:5px 10px;border-radius:8px}
#scroll{padding:13px 14px 23px;overflow:auto;overscroll-behavior:contain;flex:1}#scroll h3{font-size:13px;margin:16px 0 7px}#scroll h3:first-child{margin-top:2px}#scroll p{margin:6px 0;color:var(--sub)}
#scroll .row{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:9px 0}#scroll button{border:1px solid var(--line);border-radius:8px;background:var(--muted);color:var(--ink);padding:8px 10px;min-height:34px}#scroll button.primary{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
#status{white-space:pre-wrap;padding:9px 10px;border:1px solid var(--line);border-radius:9px;background:var(--muted);color:var(--sub);min-height:40px;font-size:12px}
.stats{display:flex;gap:8px;margin:10px 0}.stat{flex:1;background:var(--muted);border-radius:9px;padding:10px}.stat small{display:block;color:var(--sub)}.stat strong{display:block;font-size:19px}
#preview{resize:vertical;width:100%;min-height:148px;max-height:430px;white-space:pre-wrap;background:var(--muted);border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:10px;font:12px/1.6 ui-monospace,SFMono-Regular,monospace}
#snapshot-user-input,#snapshot-output{display:block;width:100%;background:var(--muted);color:var(--ink);border:1px solid var(--line);border-radius:9px;resize:vertical;padding:10px;white-space:pre-wrap}
#snapshot-user-input{min-height:96px;font:12px/1.5 system-ui,-apple-system,sans-serif}
#snapshot-output{min-height:205px;max-height:550px;font:12px/1.5 ui-monospace,SFMono-Regular,monospace}
#snapshot-attach[aria-pressed="true"]{background:var(--accent)!important;border-color:var(--accent)!important;color:var(--accent-ink)!important}
#snapshot-copy{margin-left:auto}

#summary{font-size:12px;color:var(--sub)}
#profile-cards{container-type:inline-size;container-name:zsh-profiles;min-width:0}
.profile-card{
 display:grid;
 grid-template-columns:58px minmax(0,1fr);
 grid-template-areas:"thumb info" ". actions";
 column-gap:10px;row-gap:6px;align-items:start;align-content:start;grid-auto-rows:min-content;
 border:1px solid var(--line);border-radius:10px;padding:11px 10px;margin:8px 0;
 background:var(--muted);min-width:0;max-width:100%;
}
.profile-card.has-description{grid-template-areas:"thumb info" ". actions" "description description"}
.profile-thumb{grid-area:thumb;width:58px;height:58px;border-radius:9px;background:var(--bg);display:flex;justify-content:center;align-items:center;overflow:hidden;color:var(--sub);text-align:center;font-size:10px}
.profile-thumb img{width:100%;height:100%;object-fit:cover}
.profile-details{grid-area:info;display:flex;flex-direction:column;gap:3px;min-width:0;max-width:100%;word-break:keep-all;overflow-wrap:break-word}
.profile-details strong{font-size:12px}.profile-details small{font-size:11px;color:var(--sub)}.profile-details a{font-size:11px;color:var(--accent);text-decoration:underline}
.profile-actions{grid-area:actions;min-width:0;width:100%;display:flex;gap:5px;flex-wrap:wrap;align-items:center;justify-content:flex-start;justify-self:stretch;align-self:start;margin:0;padding:0}
#scroll .profile-actions button{border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);padding:4px 7px;min-height:32px;font-size:11px;line-height:1.3;white-space:nowrap;flex:none}
#scroll .profile-description button{border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);padding:4px 7px;min-height:32px;font-size:11px;line-height:1.3;white-space:nowrap;flex:none}
.profile-actions .profile-description-toggle{order:3}
.profile-description{grid-area:description;min-width:0;display:flex;flex-direction:column;gap:7px;border-top:1px solid var(--line);padding-top:9px}
/* Compact: keep actions directly below the image-view link in the info column.
   Wide: photo, identity and actions share one row, with actions aligned right. */
@container zsh-profiles (min-width:370px){
 .profile-card{
  grid-template-columns:58px minmax(0,1fr) max-content;
  grid-template-areas:"thumb info actions";
  align-items:center;
 }
 .profile-card.has-description{grid-template-areas:"thumb info actions" "description description description"}
 .profile-actions{width:auto;justify-self:end;justify-content:flex-end;flex-wrap:nowrap;align-self:center}
 #scroll .profile-actions button{padding-inline:5px;font-size:10px;min-height:32px}
}
.profile-description textarea{width:100%;min-height:90px;max-height:240px;resize:vertical;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);padding:9px;white-space:pre-wrap;font:12px/1.5 system-ui,-apple-system,sans-serif}
.profile-description button{align-self:flex-end}.note{font-size:11px;color:var(--sub);white-space:pre-line}.settings{border-top:1px solid var(--line);margin-top:18px;padding-top:8px}.settings label{display:block;margin:9px 0 4px}.settings input[type="text"]{width:100%;padding:7px;border-radius:7px;background:var(--bg);border:1px solid var(--line);color:var(--ink)}.settings input[type="range"]{width:100%;accent-color:var(--accent)}
.scene-tabs{display:flex;gap:3px;border-radius:10px;border:1px solid var(--line);background:var(--muted);padding:3px}
.scene-tabs button{flex:1!important;border:0!important;background:transparent!important;border-radius:8px!important}
.scene-tabs button[aria-pressed="true"]{background:var(--bg)!important;box-shadow:0 1px 4px #0002}
.scene-pickers{display:flex;flex-direction:column;gap:9px;margin:10px 0}
#snapshot-person-picker{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,105px),1fr));gap:4px;margin:9px 0;padding:4px;background:var(--muted);border:1px solid var(--line);border-radius:11px;min-width:0}
#snapshot-person-picker button{width:100%;min-width:0;min-height:46px;padding:10px!important;border:0!important;border-radius:8px!important;background:transparent!important;color:var(--ink)!important;text-align:center;overflow-wrap:anywhere}
#snapshot-person-picker button[aria-pressed="true"]{background:var(--bg)!important;box-shadow:0 1px 4px #0002;font-weight:700}
#snapshot-person-picker button:disabled{opacity:.75}
#snapshot-workflow{min-width:0}
#snapshot-workflow h3{margin-top:18px}
.snapshot-step{margin:17px 0 9px;font-size:13px;font-weight:700;color:var(--ink)}
#snapshot-chat-section{margin:16px 0;border:1px solid var(--line);border-radius:10px;background:var(--muted);overflow:hidden}
#snapshot-chat-section>summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:48px;padding:12px 13px;font-size:13px;font-weight:700;color:var(--ink)}
#snapshot-chat-section>summary::-webkit-details-marker{display:none}
#snapshot-chat-section>summary:after{content:'⌄';font-size:20px;line-height:1;color:var(--sub);transition:transform .15s ease}
#snapshot-chat-section[open]>summary:after{transform:rotate(180deg)}
.snapshot-chat-body{border-top:1px solid var(--line);padding:12px;background:var(--bg);min-width:0}
.snapshot-chat-body .stats{margin:9px 0}
.snapshot-chat-body #preview{min-height:120px}
.snapshot-step-generate{margin-top:18px}
#snapshot-workflow label[for="snapshot-user-input"],#snapshot-workflow label[for="snapshot-output"]{display:block;margin:8px 0 6px}
#snapshot-user-input{min-height:115px}
#snapshot-attach-info{flex:1 1 100%;min-width:0}
#scroll #refresh-profiles,#scroll #snapshot-generate,#scroll #snapshot-copy,#scroll #snapshot-attach{display:block;width:100%;min-height:44px;margin:0;text-align:center;flex:0 0 100%}
#scroll #load,#scroll #snapshot-attach,#scroll #snapshot-copy{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
#scroll #copy{margin-left:auto}
#snapshot-template-note{font-size:11px;color:var(--sub);margin:8px 0}
#selection-actions{position:fixed;z-index:2147483644;top:calc(env(safe-area-inset-top,0px) + 16px);left:50%;transform:translateX(-50%);display:flex;gap:8px;align-items:center;justify-content:center;white-space:nowrap}
#selection-actions button{min-height:41px;padding:9px 18px;border-radius:999px;border:1px solid var(--line);background:var(--bg);color:var(--ink);box-shadow:0 3px 16px #0005;touch-action:manipulation;font:13px/1.4 system-ui,-apple-system,sans-serif}
#selection-done{background:var(--accent)!important;color:var(--accent-ink)!important;border-color:var(--accent)!important}
#tip[data-selecting="true"]{top:calc(env(safe-area-inset-top,0px) + 70px)}
.settings>summary{cursor:pointer;list-style:none;padding:11px 0;font-size:13px;font-weight:700;color:var(--ink)}
.settings>summary::-webkit-details-marker{display:none}
.settings>summary:before{content:'⏵ ';color:var(--sub)}
.settings[open]>summary:before{content:'⏷ '}
.settings-body{padding:4px 0 10px}


.scene-checkbox{display:flex;gap:8px;align-items:center}.scene-checkbox input{accent-color:var(--accent);width:17px;height:17px}
.scene-summary{padding:10px;margin:8px 0 16px;border:1px solid var(--line);background:var(--muted);border-radius:9px;color:var(--sub);font-size:11px}
.scene-summary strong{display:block;color:var(--ink);font-size:12px;margin-bottom:5px}
.segment{display:flex;gap:3px;padding:3px;background:var(--muted);border:1px solid var(--line);border-radius:10px}.segment button{flex:1;padding:6px 3px!important;font-size:12px;background:transparent!important;border:0!important;border-radius:8px!important}.segment button[aria-pressed="true"]{background:var(--bg)!important;box-shadow:0 1px 3px #0002}
#resize{position:absolute;right:3px;bottom:2px;width:30px;height:27px;display:grid;place-items:center;cursor:nwse-resize;touch-action:none;color:var(--sub);font-size:21px;user-select:none}
#tip{position:fixed;z-index:2147483646;top:calc(env(safe-area-inset-top,0px) + 16px);left:50%;transform:translateX(-50%);border-radius:10px;max-width:min(90vw,420px);padding:9px 13px;background:#263b33;border:1px solid #60c99e;color:#fff;box-shadow:0 4px 12px #0003;text-align:center;pointer-events:none}
#access{position:fixed;inset:0;margin:auto;width:min(320px,90vw);height:fit-content;max-height:85vh;overflow:auto;box-sizing:border-box;color:#f5f5f5;background:#30303a;border:1px solid #777;border-radius:12px;padding:14px;z-index:2147483645;font:14px/1.5 system-ui,sans-serif}
#access::backdrop{background:#0008}#access p{margin:8px 0}#access details{margin:8px 0}#access summary{cursor:pointer;padding:6px 0;font-weight:700}#access img{display:block;width:100%;height:auto;border-radius:6px}#access a{color:#9fd5ff;text-decoration:underline}#access #close-access{width:100%;text-align:center;color:#f5f5f5;background:#383946;border:1px solid #696b79;border-radius:9px;min-height:40px;padding:7px 10px;margin-top:10px}
</style>
<button id="launch" type="button" aria-label="짤뽑 도우미" title="짤뽑 도우미"><span class="zsh-text"></span><span class="zsh-count"></span></button>
<section id="panel" hidden aria-label="제타 짤뽑 도우미">
 <header id="head"><strong>제타 짤뽑 도우미</strong><span class="version">v${VERSION}</span><button id="close" type="button">닫기</button></header>
 <div id="scroll">
  <h3>프로필 사진 자동 감지</h3>
  <p class="note">현재 채팅방의 유저·캐릭터 사진을 확인합니다.\n[프로필 새로고침]을 눌러주세요.</p>
  <div class="row"><button id="refresh-profiles" class="primary" type="button">프로필 새로고침</button></div>
  <p id="profile-status" class="note" aria-live="polite">아직 감지된 프로필 없음</p>
  <div id="profile-cards"></div>
  <h3>장면 인원수</h3>
  <div id="scene-controls"></div>
  <section id="snapshot-workflow">
   <div class="snapshot-step">1. 인물 선택</div>
   <div id="snapshot-person-picker" role="group" aria-label="스냅샷 인물 선택"></div>
   <div id="scene-summary" class="scene-summary" aria-live="polite"></div>
   <div class="snapshot-step">2. 추가사항 (내용 · 분위기) 입력</div>
   <textarea id="snapshot-user-input" aria-label="추가사항 (내용 · 분위기) 입력" placeholder="예: 카페 창가에서 책을 읽는 장면, 따뜻하고 잔잔한 분위기"></textarea>
   <details id="snapshot-chat-section">
    <summary>3. 대화 내용 첨부</summary>
    <div class="snapshot-chat-body">
     <div id="status" role="status"></div>
     <div class="stats"><div class="stat"><small>불러온 원본 메시지</small><strong id="collected">0개</strong></div><div class="stat"><small>선택한 원본 메시지</small><strong id="selected">0개</strong></div></div>
     <div class="row"><button id="load" class="primary" type="button">과거 대화 불러오기</button><button id="stop" type="button">중지</button></div>
     <p class="note">원본 메시지 단위만 선택합니다. 말풍선을 누르면 전체 원본 메시지가 선택됩니다. 다시 누르면 해제됩니다.</p>
     <div class="row"><button id="start" class="primary" type="button">말풍선 직접 선택</button><button id="clear" type="button">선택 해제</button></div>
     <p id="summary" aria-live="polite">선택한 메시지가 없습니다.</p>
     <textarea id="preview" readonly aria-label="선택 대화 원문" placeholder="선택한 원본 메시지가 여기에 표시됩니다."></textarea>
     <div class="row"><span id="chars" class="note">0자</span><button id="copy" type="button">선택 원문 복사</button></div>
     <div class="row"><button id="snapshot-attach" class="primary" type="button" aria-pressed="false">대화 내용 첨부</button><span id="snapshot-attach-info" class="note" aria-live="polite"></span></div>
    </div>
   </details>
   <div class="snapshot-step snapshot-step-generate">4. 프롬프트 생성</div>
   <p id="snapshot-template-note" class="note" hidden>2인·다인 전용 프롬프트는 아직 등록되지 않았습니다. 현재는 선택 인물의 첨부사진 번호·이름·이미지 URL 목록을 생성하고 복사할 수 있습니다.</p>
   <div class="row"><button id="snapshot-generate" class="primary" type="button">프롬프트 생성</button></div>
   <label for="snapshot-output">프롬프트 미리보기 (수정 가능)</label>
   <textarea id="snapshot-output" placeholder="프롬프트를 생성한 후 직접 수정할 수 있습니다."></textarea>
   <div class="row"><button id="snapshot-copy" class="primary" type="button">프롬프트 복사</button></div>
  </section>
  <details id="settings-section" class="settings"><summary>설정</summary><div class="settings-body"><label for="size">실행 버튼 크기 <span id="size-val">100%</span></label><input id="size" type="range" min="65" max="155" step="5">
   <label for="btn-label">실행 버튼 표시 (글자·이모지)</label><input id="btn-label" type="text" maxlength="36" placeholder="🖼️">
   <label>테마 &gt; 화면 모드</label><div class="segment" role="group" aria-label="화면 모드"><button type="button" data-theme="light">라이트 모드</button><button type="button" data-theme="dark">다크 모드</button><button type="button" data-theme="system">기기 설정</button></div>
   <div class="row"><button id="reset" type="button">UI 설정 초기화</button></div>
  </div></details>
 </div><div id="resize" role="separator" aria-label="팝업창 크기 조절">◢</div>
</section>
<div id="selection-actions" hidden><button id="selection-done" type="button">선택 완료</button><button id="selection-cancel" type="button">취소</button></div>
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
    limitPositions(); applyUi(); render(); renderProfiles();
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
    root.getElementById('selection-done').addEventListener('click',finishSelectingFromTop);
    root.getElementById('selection-cancel').addEventListener('click',cancelSelectingFromTop);
    root.getElementById('snapshot-attach').addEventListener('click',toggleSnapshotChat);
    root.getElementById('snapshot-generate').addEventListener('click',generateSnapshot);
    root.getElementById('snapshot-copy').addEventListener('click',copySoloSnapshot);
    root.getElementById('snapshot-output').addEventListener('input',updateSnapshotControls);
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
