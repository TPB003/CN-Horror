import { useMemo, useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import type { StoryChapter } from '../types';
import { FOLKLORE_CODEX, CODEX_CATEGORY_LABEL, type CodexCategory, type FolkloreCodexEntry } from '../data/folkloreCodex';
import { InkFade } from './InkReveal';

export function StoryReader({ lines, page, onPageChange, ariaLive = false }: {
  lines: string[];
  page: number;
  onPageChange: (next: number) => void;
  ariaLive?: boolean;
}) {
  // One paragraph per page: paragraphs render in full (no line-clamp), and a
  // single paragraph always fits the fixed-height story panel on desktop and
  // mobile, so no text is silently clipped.
  const pageCount = Math.max(1, lines.length);
  const visible = lines.slice(page, page + 1);
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
    <InkFade className="rail-caption" delay={0.6} duration={1.6}>路线 / 夜行</InkFade>
    <div className="chapter-dots" role="navigation" aria-label="剧情章节">
      {chapters.map((item, index) => <button key={item.id} className={`chapter-dot ${index === currentIndex ? 'active' : ''} ${visited.includes(item.id) ? 'visited' : ''}`} type="button" onClick={() => onNavigate(item.id)} aria-label={`第 ${String(index + 1).padStart(2, '0')} 站：${item.title}`} title={item.title}>
        <span>{String(index + 1).padStart(2, '0')}</span><i />
      </button>)}
    </div>
    <button className="rail-map" type="button" onClick={onOpenMap} aria-label="查看街区路线">⌖</button>
  </div>;
}

export function JournalPanel({ chapters, collected }: { chapters: StoryChapter[]; collected: Set<string> }) {
  const [listRef] = useAutoAnimate();
  return <div className="journal-list" ref={listRef}>{chapters.map((item, index) => {
    const found = collected.has(item.clue.id);
    return <article key={item.clue.id} className={found ? 'found' : 'hidden-clue'}>
      <span className="journal-number">{String(index + 1).padStart(2, '0')}</span>
      <div><h3>{found ? item.clue.title : '未发现的线索'}</h3><p>{found ? item.clue.text : '回到街上调查异常物件，线索会留在这里。'}</p></div>
      <i>{found ? '已记' : '—'}</i>
    </article>;
  })}</div>;
}

export function SourcePanel({ chapter }: { chapter?: StoryChapter }) {
  const [listRef] = useAutoAnimate();
  if (!chapter) return <div className="source-list" ref={listRef}><p>选择一个剧情站点后，可在这里查看对应的原典、档案和创作说明。</p></div>;
  return <div className="source-list" ref={listRef}>
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

type CodexFilter = 'all' | CodexCategory;

const CODEX_FILTERS: Array<{ value: CodexFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'doc', label: '文献' },
  { value: 'oral', label: '口头传统' },
  { value: 'fiction', label: '游戏虚构' },
];

function codexCategoryLabel(entry: FolkloreCodexEntry): string {
  if (entry.category === 'oral' && entry.region) return `口头 · ${entry.region}`;
  return CODEX_CATEGORY_LABEL[entry.category];
}

/** 站内民俗志：研究台账的玩家版。只收正文条目；已否决的 5 条不进站内（见外部研究台账），避免误学。 */
export function FolkloreCodexPanel() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CodexFilter>('all');
  const [listRef] = useAutoAnimate();
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FOLKLORE_CODEX.filter((entry) => {
      if (filter !== 'all' && entry.category !== filter) return false;
      if (!q) return true;
      return [entry.name, entry.source, entry.boundary, entry.usage, entry.sref]
        .join(' ').toLowerCase().includes(q);
    });
  }, [query, filter]);
  return <div className="codex-panel">
    <p className="codex-intro">本作参考的民俗素材，逐条标注<span>文献 / 口头 / 虚构</span>与核对状态。研究阶段否决的 5 条素材未收入此处（见外部研究台账），以免误学。</p>
    <div className="codex-controls">
      <label className="codex-search"><span>搜索民俗志</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="素材名、出处、站点…" aria-label="搜索民俗志" /></label>
      <div className="codex-filters" role="group" aria-label="按类别筛选">
        {CODEX_FILTERS.map((item) => <button key={item.value} type="button" className={filter === item.value ? 'active' : ''} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}
      </div>
    </div>
    <p className="codex-count" role="status">共 {results.length} 条{query.trim() || filter !== 'all' ? '（已筛选）' : ''}</p>
    <div className="codex-list" ref={listRef}>
      {results.map((entry) => <article className="codex-item" key={entry.id}>
        <div className="codex-head"><h3>{entry.name}</h3>
          <div className="codex-tags">
            <span className={`codex-tag codex-cat-${entry.category}`}>{codexCategoryLabel(entry)}</span>
            <span className={`codex-tag codex-status-${entry.status}`}>{entry.status === 'verified' ? '已核对' : '原文待核对'}</span>
            <span className={`codex-tag codex-cite-${entry.citable ? 'yes' : 'no'}`}>{entry.citable ? '可正式引用' : '不可正式引用'}</span>
          </div>
        </div>
        <p className="codex-source"><b>出处</b>{entry.source}</p>
        <p className="codex-boundary"><b>虚实边界</b>{entry.boundary}</p>
        {entry.usage && <p className="codex-use"><b>用在</b>{entry.usage}</p>}
        {entry.url && <a href={entry.url} target="_blank" rel="noreferrer">核对原始资料 ↗</a>}
      </article>)}
      {results.length === 0 && <p className="codex-empty">没有匹配的条目，换个关键词或类别试试。</p>}
    </div>
  </div>;
}

/** 来源弹层：本站来源（按章节）＋ 民俗志（全站知识库）两个页签。 */
export function SourcesDialog({ chapter }: { chapter?: StoryChapter }) {
  const [tab, setTab] = useState<'chapter' | 'codex'>('chapter');
  return <div className="sources-dialog">
    <div className="sources-tabs" role="tablist" aria-label="资料类型">
      <button type="button" role="tab" aria-selected={tab === 'chapter'} className={tab === 'chapter' ? 'active' : ''} onClick={() => setTab('chapter')}>本站来源</button>
      <button type="button" role="tab" aria-selected={tab === 'codex'} className={tab === 'codex' ? 'active' : ''} onClick={() => setTab('codex')}>民俗志</button>
    </div>
    <div role="tabpanel">
      {tab === 'chapter' ? <SourcePanel chapter={chapter} /> : <FolkloreCodexPanel />}
    </div>
  </div>;
}
