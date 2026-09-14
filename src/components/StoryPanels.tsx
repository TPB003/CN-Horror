import type { StoryChapter } from '../types';

export function StoryReader({ lines, page, onPageChange, ariaLive = false }: {
  lines: string[];
  page: number;
  onPageChange: (next: number) => void;
  ariaLive?: boolean;
}) {
  const pageCount = Math.max(1, Math.ceil(lines.length / 2));
  const visible = lines.slice(page * 2, page * 2 + 2);
  return <>
    <div className="story-text" aria-live={ariaLive ? 'polite' : undefined}>
      {visible.map((line, index) => <p key={`${page}-${index}`}>{line}</p>)}
    </div>
    {pageCount > 1 && <nav className="story-page-controls" aria-label="故事文字分页">
      <button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)} aria-label="上一页故事文字">←</button>
      <span>{String(page + 1).padStart(2, '0')} / {String(pageCount).padStart(2, '0')}</span>
      <button type="button" disabled={page >= pageCount - 1} onClick={() => onPageChange(page + 1)} aria-label="下一页故事文字">→</button>
    </nav>}
  </>;
}

export function ChapterRail({ chapters, currentIndex, visited, onNavigate, onOpenMap }: {
  chapters: StoryChapter[];
  currentIndex: number;
  visited: string[];
  onNavigate: (id: string) => void;
  onOpenMap: () => void;
}) {
  return <div className="chapter-rail">
    <span className="rail-caption">路线 / 夜行</span>
    <div className="chapter-dots" role="navigation" aria-label="剧情章节">
      {chapters.map((item, index) => <button key={item.id} className={`chapter-dot ${index === currentIndex ? 'active' : ''} ${visited.includes(item.id) ? 'visited' : ''}`} type="button" onClick={() => onNavigate(item.id)} aria-label={`第 ${String(index + 1).padStart(2, '0')} 站：${item.title}`} title={item.title}>
        <span>{String(index + 1).padStart(2, '0')}</span><i />
      </button>)}
    </div>
    <button className="rail-map" type="button" onClick={onOpenMap} aria-label="查看街区路线">⌖</button>
  </div>;
}

export function JournalPanel({ chapters, collected }: { chapters: StoryChapter[]; collected: Set<string> }) {
  return <div className="journal-list">{chapters.map((item, index) => {
    const found = collected.has(item.clue.id);
    return <article key={item.clue.id} className={found ? 'found' : 'hidden-clue'}>
      <span className="journal-number">{String(index + 1).padStart(2, '0')}</span>
      <div><h3>{found ? item.clue.title : '未发现的线索'}</h3><p>{found ? item.clue.text : '回到街上调查异常物件，线索会留在这里。'}</p></div>
      <i>{found ? '已记' : '—'}</i>
    </article>;
  })}</div>;
}

export function SourcePanel({ chapter }: { chapter?: StoryChapter }) {
  if (!chapter) return <div className="source-list"><p>选择一个剧情站点后，可在这里查看对应的原典、档案和创作说明。</p></div>;
  return <div className="source-list">
    <p className="source-context">{chapter.regionTime}</p>
    <div className="boundary-card"><span>史料内容</span><p>{chapter.evidence}</p><span>本作转译</span><p>{chapter.transposition}</p></div>
    {chapter.sources.map((source) => <article className="source-item" key={source.id}>
      <small>{source.id}</small><div><h3>{source.title}</h3>
        {source.edition && <p>{source.edition}</p>}{source.passage && <p>篇目 / 位置：{source.passage}</p>}
        {source.scope && <p>范围：{source.scope}</p>}{source.supports && <p>可支持：{source.supports}</p>}
        {source.limitations && <p>不支持：{source.limitations}</p>}{source.url && <a href={source.url} target="_blank" rel="noreferrer">核对原始资料 ↗</a>}
      </div>
    </article>)}
  </div>;
}

export function EndingChoices({ endings, onChoose }: { endings: StoryChapter[]; onChoose: (id: string) => void }) {
  return <div className="ending-choices"><p>天快亮了。送母亲离开，还是接过她守了二十年的灯？</p>{endings.map((item) => <button type="button" key={item.id} onClick={() => onChoose(item.id)}>{item.title.replace(/^结局[^｜|：:]*[｜|：:]?\s*/, '')}<span>→</span></button>)}</div>;
}
