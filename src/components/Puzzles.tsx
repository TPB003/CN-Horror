import { useState } from 'react';

// ---------------------------------------------------------------------------
// S5 问卦「困」: 掷三枚铜钱六次，得困卦，九五"利用祭祀"。
// 流程与虚实边界严格按 docs/puzzles-phase2.md。不断吉凶。
// ---------------------------------------------------------------------------

// 困卦：兑上坎下。自下而上六爻：阴、阳、阴、阳、阴、阳。
// 这一卦是注定的（UI 明示），爻序固定以保证六爻恰成困卦。
const KUN_SEQUENCE = ['少阴', '少阳', '少阴', '少阳', '少阴', '少阳'] as const;
const TOSS_COINS = [
  ['背', '背', '字'],
  ['字', '字', '背'],
  ['背', '字', '背'],
  ['字', '背', '字'],
  ['字', '背', '背'],
  ['背', '字', '字'],
] as const;

export function DivinationPanel({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [tosses, setTosses] = useState<number>(0);
  const done = tosses >= 6;

  return (
    <div className="puzzle-panel" role="group" aria-label="问卦：三枚铜钱">
      <p className="puzzle-kicker">石街灵棚 · 问卦</p>
      <h3>三枚铜钱</h3>
      <p className="puzzle-note">这一卦是注定的——不是天意，是街坊们早就算好的安慰。点铜钱，掷六次。</p>
      <div className="divination-coins" aria-live="polite">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`toss-row${i < tosses ? ' is-done' : ''}`}>
            <span className="toss-index">第{i + 1}爻</span>
            {i < tosses ? (
              <span className="toss-result">{TOSS_COINS[i].join(' · ')}（{KUN_SEQUENCE[i]}）</span>
            ) : (
              <span className="toss-pending">未掷</span>
            )}
          </div>
        ))}
      </div>
      {!done ? (
        <button type="button" className="primary-button" onClick={() => setTosses((t) => t + 1)}>
          掷铜钱（{tosses}/6）
        </button>
      ) : (
        <div className="divination-result">
          <p className="gua-name">六爻既成，是为<b>困卦</b> ☱☵</p>
          <p className="gua-ci">「困：亨，贞大人吉，无咎，<b>有言不信</b>。」</p>
          <p className="gua-yao">九五：「劓刖，困于赤绂，乃徐有说，<b>利用祭祀</b>。」</p>
          <p className="puzzle-hint">签纸上只有四个字被圈了起来：<b>利用祭祀</b>。去看看祭案——香、烛、纸钱都在，单单酒盏是空的。</p>
          <div className="fiction-boundary">
            <b>虚实边界</b>：起卦流程与卦辞爻辞原文是真实的（《周易正义》，维基文库十三经注疏本）；
            "掷出此卦＝亡魂在求祭品""这一卦注定出现"是游戏虚构。<b>不断吉凶</b>。
          </div>
          <div className="puzzle-actions">
            <button type="button" className="primary-button" onClick={onDone}>去祭案看看</button>
            <button type="button" className="quiet-button" onClick={onClose}>稍后再说</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// S4 残缺命书：三位生肖转盘，答案 狗 → 鼠 → 龙（时支生肖→日支生肖→月支生肖）。
// 断语涂黑，不做任何命理断言。
// ---------------------------------------------------------------------------

const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const;
const DIAL_ANSWER = ['狗', '鼠', '龙'] as const;
const DIAL_LABELS = ['第一位 · 时支生肖', '第二位 · 日支生肖', '第三位 · 月支生肖'];

export function DialPanel({ onSolved, onClose }: { onSolved: () => void; onClose: () => void }) {
  const [dials, setDials] = useState<[number, number, number]>([0, 0, 0]);
  const [tried, setTried] = useState(false);
  const correct = dials[0] === ZODIAC.indexOf(DIAL_ANSWER[0])
    && dials[1] === ZODIAC.indexOf(DIAL_ANSWER[1])
    && dials[2] === ZODIAC.indexOf(DIAL_ANSWER[2]);

  const turn = (index: number, delta: 1 | -1) => {
    setTried(false);
    setDials((old) => {
      const next = [...old] as [number, number, number];
      next[index] = (next[index] + delta + 12) % 12;
      return next;
    });
  };

  const check = () => {
    setTried(true);
    if (correct) onSolved();
  };

  return (
    <div className="puzzle-panel" role="group" aria-label="梁记转盘锁">
      <p className="puzzle-kicker">祖宅 · 梁记锁铺木盒</p>
      <h3>三位生肖转盘锁</h3>
      <p className="puzzle-note">
        命书残页：年柱<b>戊午</b>、月柱<b>丙辰</b>、日柱<b>甲子</b>，时柱被撕去，断语栏全涂黑。
        旁注母亲小字：「<b>时上起，遁得之</b>」。户籍卡：「沈映禾<b>生于戌时</b>」。
        锁梁刻字：「懂规矩者开，不问命者开。」
      </p>
      <div className="dial-row">
        {dials.map((value, index) => (
          <div key={index} className="dial">
            <span className="dial-label">{DIAL_LABELS[index]}</span>
            <button type="button" className="dial-turn" onClick={() => turn(index, 1)} aria-label={`${DIAL_LABELS[index]}向上拨一位`}>▲</button>
            <span className="dial-value" aria-live="polite">{ZODIAC[value]}</span>
            <button type="button" className="dial-turn" onClick={() => turn(index, -1)} aria-label={`${DIAL_LABELS[index]}向下拨一位`}>▼</button>
          </div>
        ))}
      </div>
      <p className="puzzle-hint">五鼠遁：「甲己还加甲」——日干甲，子时为甲子；顺数至戌时得甲戌。<b>时支戌＝狗，日支子＝鼠，月支辰＝龙</b>。</p>
      {tried && !correct && <p className="puzzle-miss" role="status">锁芯纹丝不动。梁叔的手艺，不认糊弄。</p>}
      <div className="fiction-boundary">
        <b>虚实边界</b>：五鼠遁、时辰与生肖对照是真实的子平术规则（文献，2026-10-02已对校《三命通會》卷二《論遁月時》）；
        "排出的时柱能打开这把锁"是游戏虚构（锁是梁叔按此规则定制的机关）。本作不呈现、不认可任何命理断言。
      </div>
      <div className="puzzle-actions">
        <button type="button" className="primary-button" onClick={check}>试开此锁</button>
        <button type="button" className="quiet-button" onClick={onClose}>稍后再说</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// S12 七魄灯：按 尸狗 → 伏矢 → 雀阴 → 吞贼 → 非毒 → 除秽 → 臭肺 顺序点亮。
// 只用名目顺序的计数对应，不做"安魂生效"机制。
// ---------------------------------------------------------------------------

const SEVEN_PO = ['尸狗', '伏矢', '雀阴', '吞贼', '非毒', '除秽', '臭肺'] as const;

export function LampsPanel({ onSolved, onClose }: { onSolved: () => void; onClose: () => void }) {
  const [lit, setLit] = useState<string[]>([]);
  const [missed, setMissed] = useState(false);

  const light = (name: string) => {
    const expected = SEVEN_PO[lit.length];
    if (name === expected) {
      const next = [...lit, name];
      setLit(next);
      setMissed(false);
      if (next.length === SEVEN_PO.length) onSolved();
    } else {
      setLit([]);
      setMissed(true);
    }
  };

  return (
    <div className="puzzle-panel" role="group" aria-label="七魄灯">
      <p className="puzzle-kicker">黎明 · 门槛两侧</p>
      <h3>七盏灯</h3>
      <p className="puzzle-note">
        七盏灯都灭着。秦姨数过：七魄有名——<b>尸狗、伏矢、雀阴、吞贼、非毒、除秽、臭肺</b>。
        按这个顺序，一盏一盏点亮。点错一盏，火就全灭了。
      </p>
      <div className="lamps-row" role="group" aria-label="七盏待点的灯">
        {SEVEN_PO.map((name) => {
          const isLit = lit.includes(name);
          const isNext = SEVEN_PO[lit.length] === name && !isLit;
          return (
            <button
              key={name}
              type="button"
              className={`lamp${isLit ? ' is-lit' : ''}${isNext ? ' is-next' : ''}`}
              onClick={() => light(name)}
              aria-label={`点亮${name}之灯${isLit ? '（已点亮）' : ''}`}
              aria-pressed={isLit}
            >
              <span className="lamp-flame" aria-hidden="true">{isLit ? '🕯' : '◯'}</span>
              <span className="lamp-name">{name}</span>
            </button>
          );
        })}
      </div>
      <p className="lamps-progress" aria-live="polite">已点亮 {lit.length} / 7{lit.length > 0 && `：${lit.join(' → ')}`}</p>
      {missed && <p className="puzzle-miss" role="status">火苗晃了一下，全灭了。顺序错了——从头再来。</p>}
      <div className="fiction-boundary">
        <b>虚实边界</b>：七魄名目与顺序出自《云笈七签》（文献）；"按此顺序点灯即安魂"是游戏虚构，只作用于虚构人物。
      </div>
      <div className="puzzle-actions">
        <button type="button" className="quiet-button" onClick={onClose}>稍后再说</button>
      </div>
    </div>
  );
}
