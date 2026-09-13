import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VillageCanvas from './VillageCanvas';
import { Soundscape } from './audio';
import { StoryRuntime } from './storyRuntime';
import { ChapterRail, EndingChoices, JournalPanel, SourcePanel, StoryReader } from './components/StoryPanels';
import type { SavedState, StoryData } from './types';

const SAVE_KEY = 'guideng-lianyungang-save-v1';
const SCENE_FILES = [
  '01-hutong-entry', '02-alley-sign', '03-old-bookstall', '04-old-house',
  '05-red-white-procession-v2', '06-paper-shop', '07-pursuit-stone-alley-v2', '08-theatre',
  '09-old-cinema', '10-game-arcade', '11-huai-an-inn', '12-lantern-ending',
];
const PROP_FILES = ['old-letter', 'alley-sign', 'book-pages', 'family-photo', 'lantern', 'paper-house', 'mirror-fragment', 'lantern', 'film-frames', 'arcade-screen', 'door-rings', 'guestbook'];

function loadSave(): SavedState | undefined {
  try {
    const value = localStorage.getItem(SAVE_KEY);
    return value ? JSON.parse(value) as SavedState : undefined;
  } catch {
    return undefined;
  }
}

function App() {
  const [story, setStory] = useState<StoryData>();
  const [loadError, setLoadError] = useState('');
  const [currentId, setCurrentId] = useState(loadSave()?.currentId ?? 'intro');
  const [visited, setVisited] = useState<string[]>(loadSave()?.visited ?? []);
  const [clues, setClues] = useState<string[]>(loadSave()?.collected ?? []);
  const [choiceMemory, setChoiceMemory] = useState<Record<string, string>>(loadSave()?.choices ?? {});
  const [solvedPuzzles, setSolvedPuzzles] = useState<string[]>(loadSave()?.puzzles ?? []);
  const [endingId, setEndingId] = useState(loadSave()?.endingId);
  const [started, setStarted] = useState(loadSave()?.currentId !== undefined && loadSave()?.currentId !== 'intro');
  const [explored, setExplored] = useState<string[]>(loadSave()?.explored ?? []);
  const [dialog, setDialog] = useState<'map' | 'journal' | 'sources' | 'settings' | null>(null);
  const [message, setMessage] = useState('');
  const [choice, setChoice] = useState('');
  const [answer, setAnswer] = useState('');
  const [soundOn, setSoundOn] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [inkLines, setInkLines] = useState<string[]>([]);
  const [storyPage, setStoryPage] = useState(0);
  const [inkChoices, setInkChoices] = useState<Array<{ index: number; text: string }>>([]);
  const runtime = useRef<StoryRuntime | undefined>(undefined);
  const sound = useRef(new Soundscape());
  const dialogPanel = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const locations = useMemo(() => story ? story.chapters : [], [story]);
  const pageIndex = locations.findIndex((chapter) => chapter.id === currentId);
  const chapter = pageIndex >= 0 ? locations[pageIndex] : undefined;
  const ending = story?.endings?.find((item) => item.id === endingId || item.knot === endingId);
  const intro = !started || currentId === 'intro';
  const collected = useMemo(() => new Set(clues), [clues]);
  const puzzleSolved = chapter ? solvedPuzzles.includes(chapter.id) : false;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/story/chapters.json').then((response) => {
        if (!response.ok) throw new Error('剧情章节数据不可用');
        return response.json() as Promise<StoryData>;
      }),
      fetch('/story/story.json').then((response) => {
        if (!response.ok) throw new Error('Ink 故事运行文件不可用');
        return response.text();
      }),
    ]).then(([data, ink]) => {
      if (cancelled) return;
      setStory(data);
      runtime.current = new StoryRuntime(ink);
      const saved = loadSave();
      const validIds = new Set(data.chapters.map((item) => item.id));
      const validEndings = new Set((data.endings ?? []).map((item) => item.id));
      if (saved?.currentId && (validIds.has(saved.currentId) || validEndings.has(saved.currentId))) {
        setCurrentId(saved.currentId);
        setStarted(true);
        setVisited((saved.visited ?? []).filter((id) => validIds.has(id)));
        const clueIds = new Set(data.chapters.map((item) => item.clue.id));
        setClues((saved.collected ?? []).filter((id) => clueIds.has(id)));
        const exploredIds = saved.explored ?? data.chapters.filter((item) => saved.collected?.includes(item.clue.id)).map((item) => item.id);
        setExplored(exploredIds.filter((id) => validIds.has(id)));
        setChoiceMemory(saved.choices ?? {});
        setSolvedPuzzles(saved.puzzles ?? []);
        setEndingId(saved.endingId);
      } else {
        setCurrentId('intro');
        setStarted(false);
        setEndingId(undefined);
      }
    }).catch((error: unknown) => {
      if (!cancelled) setLoadError(error instanceof Error ? error.message : '无法载入故事资料');
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!story || !chapter || !runtime.current) return;
    try {
      const lines = runtime.current.readKnot(chapter.knot ?? chapter.id);
      const choices = runtime.current.choices().map(({ index, text }) => ({ index, text }));
      setInkLines(lines.length ? lines : chapter.prose);
      setInkChoices(choices);
    } catch {
      setInkLines(chapter.prose);
      setInkChoices([]);
    }
    setAnswer('');
    setChoice('');
    setStoryPage(0);
    setMessage('');
    sound.current.setScene(Math.max(0, pageIndex));
  }, [story, currentId, chapter, pageIndex]);

  useEffect(() => {
    if (!dialog) {
      returnFocus.current?.focus();
      returnFocus.current = null;
      return;
    }

    if (!returnFocus.current && document.activeElement instanceof HTMLElement) {
      returnFocus.current = document.activeElement;
    }
    const panel = dialogPanel.current;
    if (!panel) return;
    const getFocusable = () => Array.from(panel.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.getClientRects().length > 0);
    const initialFocus = requestAnimationFrame(() => getFocusable()[0]?.focus());
    const containTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', containTab);
    return () => {
      cancelAnimationFrame(initialFocus);
      document.removeEventListener('keydown', containTab);
    };
  }, [dialog]);

  useEffect(() => {
    if (chapter) setChoice(choiceMemory[chapter.id] ?? '');
  }, [chapter, choiceMemory]);

  useEffect(() => {
    if (!story || intro) return;
    const data: SavedState = { currentId, collected: clues, visited, choices: choiceMemory, explored, puzzles: solvedPuzzles, endingId };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* The story remains playable if storage is unavailable. */ }
  }, [story, intro, currentId, clues, visited, choiceMemory, explored, solvedPuzzles, endingId]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const goTo = useCallback((id: string) => {
    setCurrentId(id);
    setStarted(true);
    setEndingId(undefined);
    setDialog(null);
    setVisited((old) => old.includes(id) ? old : [...old, id]);
    setMessage('');
  }, []);

  const startJourney = useCallback(async () => {
    if (!story?.chapters.length) return;
    if (!soundOn) {
      try {
        await sound.current.start();
        sound.current.setVolume(volume * 0.3);
        setSoundOn(sound.current.isEnabled);
      } catch { setMessage('浏览器没有开放声音；你仍可以继续阅读，声音提示也会显示在画面上。'); }
    }
    goTo(story.chapters[0].id);
  }, [story, soundOn, volume, goTo]);

  const toggleSound = async () => {
    if (soundOn) {
      sound.current.stop();
      setSoundOn(false);
      return;
    }
    try {
      await sound.current.start();
      sound.current.setVolume(volume * 0.3);
      sound.current.setScene(Math.max(0, pageIndex));
      setSoundOn(sound.current.isEnabled);
    } catch { setMessage('浏览器没有开放声音。'); }
  };

  const updateVolume = (next: number) => {
    setVolume(next);
    sound.current.setVolume(next * 0.3);
  };

  const inspectScene = () => {
    if (!chapter) return;
    if (inkChoices.length > 1 && pageIndex !== locations.length - 1 && !choice) {
      setMessage('先选一个行动，再继续前进。');
      return;
    }
    if (pageIndex === 10 && !puzzleSolved) {
      const cleaned = answer.replace(/[\s、,，；;。]/g, '');
      const expected = (chapter.puzzle?.answer ?? '').replace(/[\s、,，；;。]/g, '');
      const isCorrect = expected.length > 0 && cleaned === expected;
      if (!isCorrect) {
        setMessage(chapter.puzzle?.hint ?? '黑白差役仍没有落笔：两个姓名，各自写回各自一栏。');
        sound.current.cue('knock');
        return;
      }
      setSolvedPuzzles((old) => old.includes(chapter.id) ? old : [...old, chapter.id]);
    }
    if (!explored.includes(chapter.id)) {
      const clue = chapter.clue;
      setClues((old) => old.includes(clue.id) ? old : [...old, clue.id]);
      setExplored((old) => [...old, chapter.id]);
      if (runtime.current && inkChoices.length) {
        try { runtime.current.choose(0); } catch { /* exported chapter text remains the fallback */ }
      }
      sound.current.cue(pageIndex === 6 ? 'footstep' : 'paper');
      setMessage(`线索已记入手记：${clue.title}`);
    } else {
      setMessage('你已经看过这里。线索仍留在手记里。');
    }
  };

  const chooseInkAction = (index: number) => {
    if (!chapter) return;
    const selected = inkChoices[index];
    if (!selected) return;
    if (pageIndex === locations.length - 1 && story?.endings?.[index]) {
      chooseEnding(story.endings[index].id);
      return;
    }
    setChoice(selected.text);
    setChoiceMemory((old) => ({ ...old, [chapter.id]: selected.text }));
    setInkChoices([]);
    const outcome = (() => {
      try { return runtime.current?.choose(selected.index) ?? []; } catch { return []; }
    })();
    if (!explored.includes(chapter.id)) {
      setClues((old) => old.includes(chapter.clue.id) ? old : [...old, chapter.clue.id]);
      setExplored((old) => [...old, chapter.id]);
      setMessage(`${outcome[0] ?? selected.text} · 线索已记入手记：${chapter.clue.title}`);
    } else {
      setMessage(outcome[0] ?? selected.text);
    }
    sound.current.cue(pageIndex === 6 ? 'footstep' : pageIndex === 2 ? 'knock' : pageIndex === 7 ? 'whisper' : 'paper');
  };

  const moveNext = async () => {
    if (!chapter) return;
    if (pageIndex === locations.length - 1) {
      setDialog('sources');
      setMessage('终章的选择已写进客簿。请从结局卡选择这盏灯的去向。');
      return;
    }
    const next = locations[pageIndex + 1];
    setVisited((old) => old.includes(next.id) ? old : [...old, next.id]);
    goTo(next.id);
  };

  const chooseEnding = (id: string) => {
    const picked = story?.endings?.find((item) => item.id === id || item.knot === id)
      ?? story?.endings?.[0];
    if (!picked) return;
    const pickedIndex = story?.endings?.indexOf(picked) ?? 0;
    if (runtime.current && inkChoices.length > pickedIndex) {
      try { runtime.current.choose(inkChoices[pickedIndex].index); } catch { /* Keep the authored ending available. */ }
    }
    try { if (runtime.current) setInkLines(runtime.current.readKnot(picked.knot ?? picked.id)); } catch { /* Use the exported novel text. */ }
    setStoryPage(0);
    setEndingId(picked.id);
    setCurrentId(picked.id);
    setDialog(null);
    setMessage('');
    sound.current.cue('sting');
  };

  const newGame = () => {
    localStorage.removeItem(SAVE_KEY);
    sound.current.stop();
    setSoundOn(false);
    setStarted(false);
    setCurrentId('intro');
    setVisited([]);
    setClues([]);
    setChoiceMemory({});
    setSolvedPuzzles([]);
    setExplored([]);
    setEndingId(undefined);
    setDialog(null);
  };

  const branchEcho = pageIndex === 3 && choiceMemory['station-03']
    ? choiceMemory['station-03'].includes('按住')
      ? '笔尖被按住后仍越过竖线；那一抹蓝墨留在你的指腹。'
      : '你松开笔杆后，桌底多出的敲击一路跟到了院门。'
    : pageIndex === 7 && choiceMemory['station-07']
      ? choiceMemory['station-07'].includes('藏身')
        ? '你曾躲进侧门；挂布外留下的湿手印没有追进来。'
        : '你曾从尸身手臂下穿出；湿脚印一路跟到了戏台侧门。'
      : pageIndex === 10 && choiceMemory['station-10']
        ? choiceMemory['station-10'].includes('左侧')
          ? '你沿左侧石阶数过回环；旧钥匙的齿缝里仍有盐粒。'
          : '你跟随白灯穿过仓门；旧钥匙像从屏幕另一侧递来。'
        : '';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDialog(null); return; }
      if (dialog || intro || ending || !chapter) return;
      if (event.key === 'ArrowRight' && pageIndex < locations.length - 1) void moveNext();
      if (event.key === 'ArrowLeft' && pageIndex > 0) goTo(locations[pageIndex - 1].id);
      if (event.key.toLowerCase() === 'j') setDialog('journal');
      if (event.key.toLowerCase() === 'm') setDialog('map');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialog, intro, ending, chapter, pageIndex, locations, goTo]);

  if (loadError) return <main className="fatal-state"><div className="seal">归</div><p>故事暂时没有接上。</p><small>{loadError} · 请重新构建项目</small></main>;
  if (!story) return <main className="loading-state"><span className="loading-lamp" /><p>灯还没有亮</p><small>正在翻开客簿……</small></main>;

  const sceneImage = ending ? SCENE_FILES[11] : SCENE_FILES[Math.max(0, pageIndex)];

  return (
    <main className={`app-shell ${intro ? 'is-intro' : ''} ${ending ? 'is-ending' : ''}`}>
      <div className="grain" aria-hidden="true" />
      <div className="scene-backdrop" style={{ backgroundImage: `url(/assets/scenes/${sceneImage}.webp)` }} />
      <div className="scene-vignette" />
      <header className="topbar">
        <button className="brand-lockup" type="button" onClick={() => intro ? undefined : setDialog('map')} aria-label="打开连云老街路线图">
          <span className="brand-seal">归</span><span><b>归灯</b><i>连云老街异闻录</i></span>
        </button>
        <div className="top-center"><span className="live-dot" />沿海旧街 · 雾夜 01:17</div>
        <div className="top-actions">
          <button className="icon-button sound-button" type="button" onClick={() => void toggleSound()} aria-label={soundOn ? '关闭环境声' : '开启环境声'} title={soundOn ? '关闭环境声' : '开启环境声'}>
            <span className={`sound-glyph ${soundOn ? 'is-playing' : ''}`}>{soundOn ? '♫' : '◖'}</span><span className="sound-label">{soundOn ? '声场开启' : '声音关闭'}</span>
          </button>
          <button className="icon-button settings-button" type="button" onClick={() => setDialog('settings')} aria-label="声音与无障碍设置" title="声音与无障碍设置">⚙</button>
          <button className="icon-button journal-button" type="button" onClick={() => setDialog('journal')} aria-label={`打开线索手记，已有 ${clues.length} 条`}>
            <span className="book-icon">▤</span><span className="sound-label">手记 <b>{String(clues.length).padStart(2, '0')}</b></span>
          </button>
          <button className="icon-button map-button" type="button" onClick={() => setDialog('map')} aria-label="打开街区模型与路线">街区 <span>⌖</span></button>
        </div>
      </header>

      {intro ? (
        <section className="intro-screen" aria-labelledby="intro-title">
          <div className="intro-model">{dialog !== 'map' && <VillageCanvas selectedId="01" onSelect={(id) => { const target = locations.find((item) => item.id.endsWith(id) || item.id === id); if (target) goTo(target.id); }} />}</div>
          <div className="intro-copy">
            <p className="eyebrow"><span />二十年前，旧客簿上多出一个名字</p>
            <h1 id="intro-title">归灯<span>，</span><br /><em>先看灯下的影子。</em></h1>
            <p className="intro-lead">一封没有邮戳的信，把沈归带回连云老街。<br />天亮以前，他要从一册被水泡开的客簿里，<br />分清谁的名字被写错，谁又在巷口等他回家。</p>
            <div className="intro-meta"><span>单人叙事体验</span><i />12 个剧情站点<i /><span>建议戴耳机</span></div>
            {story.chapters[0]?.introQuote && <p className="letter-quote">{story.chapters[0].introQuote}</p>}
            <div className="intro-actions">
              <button className="primary-button" type="button" onClick={() => void startJourney()}><span className="button-lamp" />举灯入巷 <span className="button-arrow">↗</span></button>
              <button className="quiet-button" type="button" onClick={() => setDialog('map')}>先看街区模型 <span>⌁</span></button>
            </div>
            <div className="disclaimer">故事为虚构创作；现实地理与资料来源可随时查阅。</div>
          </div>
          <div className="model-hint"><span>拖动旋转</span><i /><span>滚轮缩放模型</span></div>
          <div className="intro-index"><span>夜行档案</span><b>01</b><i>/</i><b>12</b></div>
        </section>
      ) : ending ? (
        <section className="ending-screen">
          <div className="ending-orbit" aria-hidden="true"><span>灯</span></div>
          <div className="ending-copy">
            <p className="eyebrow">天亮了 · 客簿最后一页</p>
            <h1>{ending.title}</h1>
            <StoryReader lines={inkLines.length ? inkLines : ending.prose ?? []} page={storyPage} onPageChange={setStoryPage} />
            <div className="ending-actions"><button className="primary-button" type="button" onClick={newGame}>重新走一遍 <span className="button-arrow">↺</span></button><button className="quiet-button" type="button" onClick={() => setDialog('journal')}>查看手记 <span>▤</span></button></div>
            <p className="ending-note">这段故事的声音会在此处停下。</p>
          </div>
        </section>
      ) : chapter ? (
        <section className="chapter-screen" key={chapter.id} aria-labelledby="chapter-title">
          <ChapterRail chapters={locations} currentIndex={pageIndex} visited={visited} onNavigate={goTo} onOpenMap={() => setDialog('map')} />

          <div className="chapter-copy">
            <div className="chapter-meta"><span className="chapter-number">{String(pageIndex + 1).padStart(2, '0')}</span><span className="meta-rule" /><span>{chapter.weather ?? '雾气压低，雨没有停'}</span><span className="meta-dot">·</span><span>{chapter.lantern ?? '灯火在雾中偏向一侧'}</span></div>
            <h1 id="chapter-title">{chapter.title.replace(/^\d+[｜|.、]\s*/, '')}</h1>
            <p className="chapter-subtitle">{chapter.subtitle}</p>
            <StoryReader lines={inkLines.length ? inkLines : chapter.prose} page={storyPage} onPageChange={setStoryPage} ariaLive />
            {branchEcho && <p className="branch-echo">旧路留下的痕迹：{branchEcho}</p>}
            {inkChoices.length > 1 && pageIndex !== locations.length - 1 && <div className="choice-deck" aria-label="选择行动">{inkChoices.map((option) => <button key={`${option.index}-${option.text}`} type="button" onClick={() => chooseInkAction(option.index)}>{option.text.replace(/^\[|\]$/g, '')}<span>↗</span></button>)}</div>}
            {chapter.npc && <div className="npc-line"><span className="npc-mark">说</span><span>{chapter.npc}</span></div>}
            <figure className="prop-object"><img src={`/assets/props/${PROP_FILES[pageIndex]}.webp`} alt={`${chapter.clue.title}相关线索物件`} /><figcaption><i>现场物证</i><span>{chapter.clue.title}</span></figcaption></figure>
            <div className="interaction-card">
              <div className="interaction-icon">{pageIndex === 2 ? '♧' : pageIndex === 6 ? '◉' : pageIndex === 10 ? '◌' : '⌕'}</div>
              <div className="interaction-content"><span className="interaction-kicker">可调查线索</span><b>{chapter.interaction.label}</b><small>{chapter.interaction.detail}</small></div>
              {pageIndex === 10 && !puzzleSolved ? (
              <div className="puzzle-input"><input aria-label={chapter.puzzle?.prompt ?? '填写核名答案'} value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') inspectScene(); }} placeholder="输入两个姓名" maxLength={32} /><button type="button" onClick={inspectScene} aria-label="核对姓名">↵</button></div>
              ) : pageIndex === locations.length - 1 ? <span className="choice-prompt">选择结局，写下归路</span> : inkChoices.length > 1 ? <span className="choice-prompt">选择行动后继续</span> : (
                <button className={`inspect-button ${explored.includes(chapter.id) ? 'complete' : ''}`} type="button" onClick={inspectScene} aria-label={explored.includes(chapter.id) ? '线索已记录' : '调查并记录线索'}>{explored.includes(chapter.id) ? '已记录 ✓' : '调查'}<span>↗</span></button>
              )}
            </div>
            {choice && <div className="decision-tag">你选择：{choice}</div>}
            {message && <div className="toast-message" role="status">{message}</div>}
            <div className="chapter-footer">
              <div className="source-access"><button type="button" onClick={() => setDialog('sources')}>史料与创作边界 <span>↗</span></button><span>·</span><span>{chapter.sources.length} 条来源</span></div>
              <div className="chapter-nav"><button type="button" disabled={pageIndex === 0} onClick={() => goTo(locations[pageIndex - 1].id)} aria-label="上一站">←</button><span>{String(pageIndex + 1).padStart(2, '0')} <i>/</i> {String(locations.length).padStart(2, '0')}</span><button type="button" onClick={() => void moveNext()} aria-label={pageIndex === locations.length - 1 ? '查看结局选择' : '下一站'}>{pageIndex === locations.length - 1 ? '✓' : '→'}</button></div>
            </div>
          </div>

          <div className="scene-caption"><span className="caption-line" /><span>{chapter.scene}</span><span className="caption-place">连云老街 · 叙事空间</span></div>
          <div className="sound-cue" aria-hidden="true"><span className={soundOn ? 'wave active' : 'wave'} /><span>{soundOn ? '雨声停了一拍' : '开启声音，听见巷子'}</span></div>
          <div className="chapter-clue-preview"><span className="clue-preview-mark">簿</span><span><i>手记线索</i><b>{collected.size ? `${collected.size} 项已收` : '尚未找到'}</b></span><button type="button" onClick={() => setDialog('journal')} aria-label="查看已收线索">↗</button></div>
        </section>
      ) : null}

      {dialog && <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
        <section ref={dialogPanel} className={`overlay-panel ${dialog === 'map' ? 'map-panel' : ''}`} role="dialog" aria-modal="true" aria-label={dialog === 'map' ? '连云老街街区模型' : dialog === 'journal' ? '线索手记' : dialog === 'sources' ? '史料来源与创作转译' : '声音设置'} tabIndex={-1}>
          <header className="panel-header"><div><span className="panel-kicker">{dialog === 'map' ? '街区沙盘' : dialog === 'journal' ? '随身记录' : dialog === 'sources' ? '资料簿' : '声场设置'}</span><h2>{dialog === 'map' ? '沿石街往里走' : dialog === 'journal' ? '沈归的手记' : dialog === 'sources' ? '史料与创作边界' : '把声音留在巷里'}</h2></div><button type="button" className="close-button" onClick={() => setDialog(null)} aria-label="关闭">×</button></header>
          {dialog === 'map' ? <>
            <p className="map-intro">拖动旋转、滚轮缩放。点亮的灯火可直接进入对应章节；地图为叙事路线模型，非实测测绘图。</p>
            <div className="map-canvas"><VillageCanvas selectedId={String(Math.max(1, pageIndex + 1)).padStart(2, '0')} onSelect={(id) => { const target = locations.find((item, index) => item.id.endsWith(id) || String(index + 1).padStart(2, '0') === id); if (target) goTo(target.id); }} /></div>
            <div className="map-legend"><span><i className="legend-gold" />当前所在</span><span><i className="legend-ash" />已到访</span><span><i className="legend-red" />异象线索</span></div>
            <div className="map-locations">{locations.map((item, index) => <button type="button" key={item.id} className={`${currentId === item.id ? 'selected' : ''} ${visited.includes(item.id) ? 'arrived' : ''}`} onClick={() => goTo(item.id)} aria-label={`第 ${String(index + 1).padStart(2, '0')} 站：${item.title.replace(/^\d+[｜|.、]\s*/, '')}`}><small>{String(index + 1).padStart(2, '0')}</small><span>{item.title.replace(/^\d+[｜|.、]\s*/, '')}</span><i>{visited.includes(item.id) ? '●' : '○'}</i></button>)}</div>
          </> : dialog === 'journal' ? <JournalPanel chapters={locations} collected={collected} /> : dialog === 'sources' ? <SourcePanel chapter={chapter} /> : <div className="settings-panel"><p>声音在你点击「举灯入巷」后才会播放。重要听声线索也会显示为文字提示。</p><button className="primary-button" type="button" onClick={() => void toggleSound()}>{soundOn ? '关闭环境声' : '开启环境声'}</button><label>环境音量 <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => updateVolume(Number(event.target.value))} /><b>{Math.round(volume * 100)}%</b></label><button className="quiet-button" type="button" onClick={newGame}>清除存档并重新开始</button></div>}
        </section>
      </div>}
      {!intro && !ending && <div className="bottom-hint"><span>J</span> 手记 <i /> <span>M</span> 街区 <i /> <span>← →</span> 前后章节</div>}
      {story.endings?.length && !intro && !ending && pageIndex === locations.length - 1 && <EndingChoices endings={story.endings} onChoose={chooseEnding} />}
      <footer className="footer-mark"><span>归灯</span><i />基于真实地点考据的虚构故事</footer>
    </main>
  );
}

export default App;
