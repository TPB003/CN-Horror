const $ = (id) => document.getElementById(id);
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
const state = { started: false, phase: 0, clues: new Set(), knocks: 0, ending: null, sound: false };
const clueData = {
  letter: { title: '无署名的家书', text: '「七月半，提灯归。有人在老地方等你。」信纸泛黄，折痕里夹着一小片槐叶。收信人的名字，是沈归。' },
  notice: { title: '夜归须知', text: '一、来客叩门三声。二、借灯者，天明前须还。三、若听见有人唤你的名字，提灯向前，切莫回头。' },
  mirror: { title: '铜镜中的字', text: '镜中从左到右，浮着「人、门、灯」三个字。镜框底下的细字写着：「镜里左右皆反。」' },
  lantern: { title: '纸灯上的小字', text: '灯罩内侧写着：「借灯入门，照见归人。三字取自镜中，依真实次序，左起填入门环。」' },
  register: { title: '最后一位归客', text: '客簿停在二十年前的七月十五。最后一行是「沈归，借灯一盏，待归」。你的名字旁，始终没有写上离店的日子。' },
  oldLetter: { title: '母亲留下的信', text: '「阿归，你总说巷子太黑。娘就把灯留着。等你回来，把灯放在门口，天就亮了。若有人在身后学我的声音，别理它。我在有光的地方等你。」' }
};
let toastTimer;
let dialogReturnFocus = null;
function toast(text) {
  clearTimeout(toastTimer);
  $('toast').textContent = text;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3200);
}
function openDialog(title, content, kicker = '槐安异闻录') {
  if (!$('story-dialog').open) dialogReturnFocus = document.activeElement;
  $('dialog-title').textContent = title;
  $('dialog-kicker').textContent = kicker;
  $('dialog-content').innerHTML = content;
  if (!$('story-dialog').open) $('story-dialog').showModal();
  document.body.style.overflow = 'hidden';
}
function closeDialog() { $('story-dialog').close(); }
$('story-dialog').addEventListener('close', () => {
  document.body.style.overflow = '';
  if (dialogReturnFocus?.isConnected && dialogReturnFocus !== document.body && !dialogReturnFocus.closest('[hidden]')) dialogReturnFocus.focus({ preventScroll: true });
  else if (!$('play-screen').hidden) $('scene-title').focus({ preventScroll: true });
});
$('close-dialog').addEventListener('click', closeDialog);
$('story-dialog').addEventListener('click', (event) => {
  if (event.target !== $('story-dialog')) return;
  const box = $('story-dialog').getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog();
});
function actionButton(text, id = 'dialog-action') {
  return `<button class="primary-button dialog-action" id="${id}">${text}${icon('arrow')}</button>`;
}
function collect(id) {
  if (state.clues.has(id)) return;
  state.clues.add(id);
  updateCounts();
  toast(`已收入手记：${clueData[id].title}`);
  if (state.started && state.ending === null) updateScene();
}
function updateCounts() {
  $('clue-count').textContent = state.clues.size;
  $('clue-count').hidden = !state.clues.size;
  $('inventory-count').textContent = `${state.clues.size} 件线索`;
}
function showLetter() {
  collect('letter');
  openDialog('一封迟来的家书', `<div class="letter-paper"><p>阿归：</p><p>七月半，提灯归。<br>有人在老地方等你。</p><p>走过石桥，沿着槐树往里。<br>看见那盏红灯，就到家了。</p><p class="signature">七月十五 · 字迹已模糊</p></div><p class="dialog-note">信封上，是你多年未用的名字：沈归。</p>${actionButton('收好家书')}`, '壹封家书 · 无人落款');
  $('dialog-action').addEventListener('click', closeDialog);
}
function showJournal() {
  const entries = [...state.clues].map((id, i) => `<article class="journal-entry"><h3><span>${String(i + 1).padStart(2, '0')}</span>${clueData[id].title}</h3><p>${clueData[id].text}</p></article>`).join('');
  openDialog('归客手记', entries ? `<div class="journal-list">${entries}</div><p class="dialog-note">走过的路，总会留下痕迹。</p>` : '<p class="empty-journal">手记还是空白的。<br>展开家书，或提灯入巷，看看故人留下了什么。</p>', `已寻得 ${state.clues.size} 件线索`);
}
function showGuide() {
  openDialog('入夜之前', '<ol class="guide-list"><li>点击「提灯入巷」进入故事，依次探索三个场景。</li><li>点击场景里的物品标记阅读线索。已发现的内容可以在「归客手记」中重读。</li><li>遇到门锁时，结合纸灯和铜镜的提示排列三个字。卡住时可以「灯下求一签」。</li><li>环境音默认关闭，可用右上角按钮开启。声音不影响解谜。</li></ol><p class="dialog-note">本篇约 5 分钟，含阴暗场景与悬疑文字。刷新页面会重新开始。</p>');
}
function showScreen(name) {
  for (const id of ['home', 'play', 'ending']) $(`${id}-screen`).hidden = id !== name;
  document.body.classList.toggle('playing', name === 'play');
  $('prologue-button').classList.toggle('active', name === 'home');
  if (name === 'home') $('prologue-button').setAttribute('aria-current', 'page');
  else $('prologue-button').removeAttribute('aria-current');
  $('scene-image').classList.toggle('interior', name === 'play' && state.phase > 0);
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function showHome() {
  showScreen('home');
  $('start-label').textContent = state.ending !== null ? '重温结局' : state.started ? '继续前行' : '提灯入巷';
}
function startGame() {
  if (state.ending !== null) { renderEnding(state.ending); return; }
  state.started = true;
  collect('letter');
  updateScene();
  showScreen('play');
  $('scene-title').focus({ preventScroll: true });
}
function advancePhase(phase) {
  closeDialog();
  state.phase = phase;
  updateScene();
  showScreen('play');
  $('scene-title').focus({ preventScroll: true });
}
const phases = [
  { eyebrow: '壹 · 入巷', title: '有客来', text: '<p>镇上的钟，停在了子时。</p><p>巷子里空无一人。客栈的门缝透着红光，门内忽然传来一句：<br><em>「归客，请叩门。」</em></p>', time: '第一夜 · 子时', instruction: '先看看门边的告示。' },
  { eyebrow: '贰 · 叩门', title: '镜中人', text: '<p>客栈里，茶还是温的。</p><p>铜镜蒙着灰，纸灯无风自转。柜台上的客簿摊开着，后门挂着一副三字门环。</p><p>你在这里，听见了自己的名字。</p>', time: '第一夜 · 子时三刻', instruction: '点击铜镜、纸灯和客簿，寻找开门的办法。' },
  { eyebrow: '叁 · 归灯', title: '有人在等', text: '<p>门开了。门后，竟还是这间客栈。</p><p>桌上的旧信换了位置，信封上写着「阿归亲启」。你提起纸灯，身后传来母亲的声音：<br><em>「阿归，回头看看娘。」</em></p>', time: '第一夜 · 将晓', instruction: '读完最后一封信，再决定往哪走。' }
];
function allRoomClues() { return ['mirror', 'lantern', 'register'].every((key) => state.clues.has(key)); }
function hotspot(label, id, x, y, action) {
  const btn = document.createElement('button');
  btn.className = `hotspot${state.clues.has(id) ? ' inspected' : ''}`;
  btn.style.setProperty('--x', `${x}%`);
  btn.style.setProperty('--y', `${y}%`);
  btn.style.setProperty('--mx', `${x}%`);
  btn.style.setProperty('--my', `${y}%`);
  btn.setAttribute('aria-label', `${label}${state.clues.has(id) ? '，已记入手记' : '，查看线索'}`);
  btn.innerHTML = `<span class="hotspot-marker" aria-hidden="true"></span>${label}`;
  btn.addEventListener('click', action);
  $('explore-area').appendChild(btn);
}
function sceneAction(text, action, secondary = false) {
  const btn = document.createElement('button');
  btn.className = secondary ? 'choice-button' : 'primary-button';
  btn.innerHTML = `${text}${icon('arrow')}`;
  btn.addEventListener('click', action);
  $('scene-actions').appendChild(btn);
}
function updateScene() {
  const phase = phases[state.phase];
  $('scene-eyebrow').textContent = phase.eyebrow;
  $('scene-title').textContent = phase.title;
  $('scene-time').textContent = phase.time;
  $('narrative-text').innerHTML = phase.text;
  $('scene-instruction').textContent = phase.instruction;
  $('scene-actions').replaceChildren();
  $('explore-area').replaceChildren();
  $('explore-area').classList.toggle('interior-map', state.phase > 0);
  $('scene-image').classList.toggle('interior', state.phase > 0 && !$('play-screen').hidden);
  for (let i = 0; i < 3; i++) {
    $(`step-${i}`).className = i === state.phase ? 'current' : i < state.phase ? 'complete' : '';
    if (i === state.phase) $(`step-${i}`).setAttribute('aria-current', 'step');
    else $(`step-${i}`).removeAttribute('aria-current');
  }
  if (state.phase === 0) {
    $('objective').textContent = state.clues.has('notice') ? '依照夜归须知，叩门三声。' : '阅读门边的夜归须知。';
    hotspot('门边告示', 'notice', 40, 37, readNotice);
    hotspot('叩响木门', 'door', 66, 71, knockDoor);
  } else if (state.phase === 1) {
    $('objective').textContent = allRoomClues() ? '线索已齐，试着解开三字门环。' : '查看铜镜、纸灯和客簿，找出门环的三个字。';
    hotspot('旧铜镜', 'mirror', 20, 44, () => readRoomClue('mirror'));
    hotspot('红纸灯', 'lantern', 66, 23, () => readRoomClue('lantern'));
    hotspot('归客簿', 'register', 80, 77, () => readRoomClue('register'));
    sceneAction('查看三字门环', showPuzzle);
  } else {
    $('objective').textContent = state.clues.has('oldLetter') ? '是提灯向前，还是回头应声？' : '读一读桌上写给你的旧信。';
    hotspot('桌上旧信', 'oldLetter', 82, 75, readOldLetter);
    if (state.clues.has('oldLetter')) {
      sceneAction('提灯向前', () => renderEnding('home'));
      sceneAction('回头应声', () => renderEnding('loop'), true);
    }
  }
}
function readNotice() {
  collect('notice');
  openDialog('夜归须知', `<div class="letter-paper"><p>一、来客叩门三声。</p><p>二、借灯者，天明前须还。</p><p>三、若听见有人唤你的名字，提灯向前，<strong>切莫回头</strong>。</p></div><p class="dialog-note">最后一行的墨迹，比其余字迹新得多。</p>${actionButton('记下须知')}`, '门边告示 · 墨迹未干');
  $('dialog-action').addEventListener('click', closeDialog);
}
function knockDoor() {
  if (!state.clues.has('notice')) {
    openDialog('门没有动', `<div class="dialog-body"><p>你刚抬起手，风就吹得门边的告示沙沙作响。</p><p>似乎有人在提醒你，<strong>先看看这里的规矩</strong>。</p></div>${actionButton('阅读夜归须知')}`);
    $('dialog-action').addEventListener('click', readNotice);
    return;
  }
  const draw = () => {
    const lines = ['你的手停在木门前。门的另一边，也有什么停了下来。', '第一声。檐下的雨忽然停了。', '第二声。有人拖着椅子，缓缓走近。', '第三声。门向里退开半寸，露出一道温暖的光。'];
    openDialog('叩门三声', `<div class="dialog-body"><p>${lines[state.knocks]}</p></div><p class="dialog-note" role="status">已叩 ${state.knocks} / 3 声</p>${actionButton(state.knocks < 3 ? '轻叩木门' : '提灯进门')}`, '有客来 · 请叩门');
    $('dialog-action').addEventListener('click', () => {
      if (state.knocks < 3) { state.knocks++; playKnock(); draw(); $('dialog-action').focus(); }
      else advancePhase(1);
    });
  };
  draw();
}
function readRoomClue(id) {
  collect(id);
  const descriptions = {
    mirror: '<p>你擦去镜上的灰。镜中照出了整间屋子，唯独没有你的影子。</p><p>镜面上，从左到右浮着三个字：<br><strong class="mirror-characters">人　门　灯</strong></p><p>镜框底下刻着一行细字：<br>「镜里左右皆反。」</p>',
    lantern: '<p>你托起纸灯，里面没有蜡烛，却依然亮着。</p><p>灯罩内侧藏着一行字：<br><strong>「借灯入门，照见归人。」</strong></p><p>再下面写着：<br>「三字取自镜中，依真实次序，左起填入门环。」</p>',
    register: '<p>你翻到客簿的最后一页。</p><p>日期停在二十年前的七月十五。最后一行写着：<br><strong>「沈归，借灯一盏，待归。」</strong></p><p>你的名字旁，始终没有写上离店的日子。像是这里的时间，一直在等你。</p>'
  };
  openDialog(clueData[id].title, `<div class="dialog-body">${descriptions[id]}</div>${actionButton('收入手记，继续探索')}`, '贰 · 叩门');
  $('dialog-action').addEventListener('click', closeDialog);
}
function showPuzzle() {
  if (!allRoomClues()) {
    const missing = ['mirror', 'lantern', 'register'].filter((id) => !state.clues.has(id)).map((id) => ({ mirror: '铜镜', lantern: '纸灯', register: '客簿' })[id]).join('、');
    openDialog('门环纹丝不动', `<div class="dialog-body"><p>三枚木环上都刻着字，门缝里没有一点光。</p><p>先看看<strong>${missing}</strong>。这间屋子里，还有你没读完的故事。</p></div>${actionButton('继续寻找')}`);
    $('dialog-action').addEventListener('click', closeDialog);
    return;
  }
  const options = '<option value="">选字</option><option value="人">人</option><option value="门">门</option><option value="灯">灯</option>';
  openDialog('三字门环', `<p class="puzzle-lead">将木环上的字排成真实的次序，门便会认出归客。</p><p class="puzzle-quote">镜中所见：人　门　灯<br>「镜里左右皆反。」</p><form id="lock-form"><div class="lock-slots">${['左环', '中环', '右环'].map((name, i) => `<div class="lock-slot"><label for="ring-${i}">${name}</label><select id="ring-${i}" name="ring-${i}" required>${options}</select></div>`).join('')}</div><p id="puzzle-feedback" class="puzzle-feedback" role="status" aria-live="polite"></p><button type="submit" class="primary-button dialog-action">转动门环${icon('arrow')}</button></form>`, '贰 · 最后一把锁');
  $('lock-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const answer = [0, 1, 2].map((i) => $(`ring-${i}`).value).join('');
    if (answer === '灯门人') {
      playKnock();
      openDialog('门认出了你', `<div class="dialog-body"><p>「灯、门、人。」</p><p>三枚木环同时落定。门后传来一声很轻的叹息。</p><p><strong>「等你好久了，阿归。」</strong></p></div>${actionButton('推开最后一扇门')}`, '贰 · 门已开');
      $('dialog-action').addEventListener('click', () => advancePhase(2));
    } else {
      $('puzzle-feedback').textContent = '门环没有松动。想一想，镜子里的左右，与现实有什么不同？';
    }
  });
}
function readOldLetter() {
  collect('oldLetter');
  openDialog('娘留着灯呢', `<div class="letter-paper"><p>阿归：</p><p>你总说巷子太黑。<br>娘就把灯留着。</p><p>等你回来，把灯放在门口，<br>天就亮了。</p><p>若有人在身后学我的声音，别理它。<br>我在有光的地方等你。</p><p class="signature">娘 · 七月十五</p></div>${actionButton('收起旧信')}`, '叁 · 最后一封信');
  $('dialog-action').addEventListener('click', closeDialog);
}
function showHint() {
  const hints = [
    state.clues.has('notice') ? '选择「叩响木门」，在弹窗中轻叩三次，就可以提灯进门。' : '先点「门边告示」，记住夜归的三条规矩。',
    allRoomClues() ? '镜中从左到右是「人、门、灯」。把左右反过来，门环应当依次填「灯、门、人」。' : '分别点开旧铜镜、红纸灯和归客簿。铜镜告诉你有哪些字，纸灯告诉你怎样排列。',
    state.clues.has('oldLetter') ? '母亲在信中说，她在有光的地方等你。夜归须知也提醒过你：提灯向前，切莫回头。' : '点击「桌上旧信」，读完母亲留下的话。'
  ];
  openDialog('灯下的一点光', `<div class="dialog-body"><p>${hints[state.phase]}</p></div>${actionButton('继续前行')}`, '求得一签');
  $('dialog-action').addEventListener('click', closeDialog);
}
function renderEnding(kind) {
  state.ending = kind;
  showScreen('ending');
  const isHome = kind === 'home';
  $('ending-title').textContent = isHome ? '灯火有归处' : '又逢七月半';
  document.querySelector('.ending-subtitle').textContent = isHome ? '你终于知道，是谁一直在等。' : '你应了一声，整条巷子都醒了。';
  $('ending-story').innerHTML = isHome
    ? '<p>你没有回头。只把那盏纸灯，轻轻放在门口。</p><p>身后的声音散了。天边泛白，长巷尽头，<br>母亲站在旧屋门前，像每次等你放学那样。</p><p>客簿上「待归」二字，终于慢慢变成了「已归」。</p>'
    : '<p>你转过身。灯灭了。</p><p>身后空无一人。客簿自己翻开，<br>你的名字下面，又多了一行：「借灯一盏，待归。」</p><p>远处的钟敲了三下。<br>你站在巷口，手里攥着一封没有署名的家书。</p>';
  document.querySelector('.ending-footnote').textContent = isHome ? '有些灯，亮着就算团圆。' : '下一次，记得别回头。';
  document.querySelector('.ending-seal').textContent = isHome ? '归' : '困';
  for (let i = 0; i < 3; i++) { $(`step-${i}`).className = 'complete'; $(`step-${i}`).removeAttribute('aria-current'); }
  $('ending-title').focus({ preventScroll: true });
}
function resetGame() {
  state.started = false;
  state.phase = 0;
  state.clues.clear();
  state.knocks = 0;
  state.ending = null;
  updateCounts();
  startGame();
}

let audioContext, masterGain;
function createSoundscape() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('Audio unavailable');
  audioContext = new AudioContextClass();
  masterGain = audioContext.createGain();
  masterGain.gain.value = .2;
  masterGain.connect(audioContext.destination);
  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 4, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < channel.length; i++) { last = (last + .024 * (Math.random() * 2 - 1)) / 1.024; channel[i] = last * 3; }
  const wind = audioContext.createBufferSource();
  wind.buffer = buffer;
  wind.loop = true;
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 750;
  const windGain = audioContext.createGain();
  windGain.gain.value = .3;
  wind.connect(filter).connect(windGain).connect(masterGain);
  wind.start();
  for (const frequency of [65.4, 98.1]) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    const gain = audioContext.createGain();
    gain.gain.value = .07;
    oscillator.connect(gain).connect(masterGain);
    oscillator.start();
  }
}
async function toggleSound() {
  $('sound-button').disabled = true;
  try {
    if (!audioContext) createSoundscape();
    if (state.sound) { await audioContext.suspend(); state.sound = false; }
    else { await audioContext.resume(); state.sound = audioContext.state === 'running'; }
    $('sound-button').setAttribute('aria-pressed', String(state.sound));
    $('sound-button').setAttribute('aria-label', state.sound ? '关闭环境音' : '开启环境音');
    $('sound-icon').setAttribute('href', state.sound ? '#icon-sound' : '#icon-muted');
    $('sound-label').textContent = `环境音：${state.sound ? '开' : '关'}`;
    if (!state.sound && audioContext.state !== 'suspended') toast('请再点一次环境音按钮以开启声音。');
  } catch { toast('当前浏览器暂时无法播放环境音，仍可继续探索。'); }
  finally { $('sound-button').disabled = false; }
}
function playKnock() {
  if (!state.sound || !audioContext || audioContext.state !== 'running') return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + .13);
  gain.gain.setValueAtTime(.001, now);
  gain.gain.exponentialRampToValueAtTime(.6, now + .006);
  gain.gain.exponentialRampToValueAtTime(.001, now + .22);
  osc.connect(gain).connect(masterGain);
  osc.start(now);
  osc.stop(now + .23);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}
document.addEventListener('visibilitychange', () => {
  if (!audioContext || !state.sound) return;
  if (document.hidden) audioContext.suspend().catch(() => {});
  else audioContext.resume().catch(() => {});
});
window.addEventListener('pagehide', () => { if (audioContext) audioContext.suspend().catch(() => {}); });
window.addEventListener('pageshow', () => { if (audioContext && state.sound) audioContext.resume().catch(() => {}); });
$('home-button').addEventListener('click', showHome);
$('prologue-button').addEventListener('click', showHome);
$('leave-scene').addEventListener('click', showHome);
$('journal-button').addEventListener('click', showJournal);
$('inventory-button').addEventListener('click', showJournal);
$('ending-journal').addEventListener('click', showJournal);
$('guide-button').addEventListener('click', showGuide);
$('letter-button').addEventListener('click', showLetter);
$('start-button').addEventListener('click', startGame);
$('hint-button').addEventListener('click', showHint);
$('replay-button').addEventListener('click', resetGame);
$('sound-button').addEventListener('click', toggleSound);
updateCounts();
