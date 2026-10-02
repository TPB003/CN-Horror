import { useEffect, useMemo, useRef, useState } from 'react';
import { PageFlip } from 'page-flip';
import type { StoryChapter } from '../types';

// SPIKE ONLY — not wired into the app. Verifies whether StPageFlip can turn
// the clue journal into a physical "old notebook". Real clue data is fetched
// from the same /story/chapters.json the app uses; the first five clues are
// mocked as collected so both found/unfound states appear.
const PAGE_SIZE = 4;
const MOCK_COLLECTED = 5;

export default function PageFlipJournal() {
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [loadError, setLoadError] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const bookRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);

  useEffect(() => {
    fetch('/story/chapters.json')
      .then((response) => response.json())
      .then((data: { chapters: StoryChapter[] }) => setChapters(data.chapters))
      .catch(() => setLoadError('故事数据加载失败，spike 无法初始化。'));
  }, []);

  const pages = useMemo(() => {
    const chunks: StoryChapter[][] = [];
    for (let i = 0; i < chapters.length; i += PAGE_SIZE) chunks.push(chapters.slice(i, i + PAGE_SIZE));
    return chunks;
  }, [chapters]);

  useEffect(() => {
    if (!chapters.length || !bookRef.current || flipRef.current) return;
    const flip = new PageFlip(bookRef.current, {
      width: 420,
      height: 580,
      size: 'stretch',
      minWidth: 300,
      maxWidth: 460,
      minHeight: 440,
      maxHeight: 620,
      showCover: true,
      drawShadow: true,
      flippingTime: 900,
      usePortrait: window.innerWidth < 640,
      mobileScrollSupport: true,
      maxShadowOpacity: 0.5,
      useMouseEvents: true,
    });
    flip.loadFromHTML(bookRef.current.querySelectorAll('.flip-page'));
    flip.on('flip', (event) => setPageIndex(event.data));
    flipRef.current = flip;
    setPageCount(flip.getPageCount());
    return () => {
      flip.destroy();
      flipRef.current = null;
    };
  }, [chapters]);

  const flipBy = (delta: number) => {
    const flip = flipRef.current;
    if (!flip) return;
    if (delta > 0) flip.flipNext();
    else flip.flipPrev();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); flipBy(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); flipBy(-1); }
  };

  return (
    <main className="spike-shell">
      <header className="spike-head">
        <h1>手记翻页 spike</h1>
        <p>仅本地验证用（StPageFlip）· 不接入正式手记 · 数据取自 /story/chapters.json，前 {MOCK_COLLECTED} 条模拟「已发现」</p>
      </header>

      {loadError && <p className="spike-error">{loadError}</p>}
      {!chapters.length && !loadError && <p className="spike-loading">正在摊开手记……</p>}

      {chapters.length > 0 && (
        <div className="spike-book-wrap" tabIndex={0} role="group" aria-label="可翻页手记原型，使用左右方向键或按钮翻页" onKeyDown={onKeyDown}>
          <div className="flip-book" ref={bookRef}>
            <div className="flip-page flip-cover" data-density="hard">
              <div className="cover-inner">
                <span className="cover-seal">记</span>
                <h2>夜行手记</h2>
                <p>连云老街 · 客簿之外</p>
                <small>沈归 私记</small>
              </div>
            </div>
            {pages.map((chunk, pageNo) => (
              <div className="flip-page" key={pageNo}>
                <div className="page-inner">
                  <header className="page-head"><span>线索手记</span><i>{String(pageNo + 1).padStart(2, '0')}</i></header>
                  {chunk.map((chapter, offset) => {
                    const index = pageNo * PAGE_SIZE + offset;
                    const found = index < MOCK_COLLECTED;
                    return (
                      <article key={chapter.clue.id} className={found ? 'entry found' : 'entry'}>
                        <span className="entry-no">{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <h3>{found ? chapter.clue.title : '未发现的线索'}</h3>
                          <p>{found ? chapter.clue.text : '回到街上调查异常物件，线索会留在这里。'}</p>
                        </div>
                        <i>{found ? '已记' : '—'}</i>
                      </article>
                    );
                  })}
                  <footer className="page-foot">归灯 · 连云老街</footer>
                </div>
              </div>
            ))}
            <div className="flip-page flip-back" data-density="hard">
              <div className="back-inner">
                <p>天亮以前，</p>
                <p>把写错的名字一个一个划掉。</p>
                <span className="back-seal">归</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="spike-controls">
        <button type="button" onClick={() => flipBy(-1)} disabled={pageIndex <= 0}>← 上一页</button>
        <span aria-live="polite">{pageCount ? `第 ${pageIndex + 1} 页 / 共 ${pageCount} 页` : '—'}</span>
        <button type="button" onClick={() => flipBy(1)} disabled={pageCount > 0 && pageIndex >= pageCount - 1}>下一页 →</button>
      </div>

      <details className="spike-fallback">
        <summary>纯文本版手记（屏幕阅读器 / 无动画兜底示意）</summary>
        <ol>
          {chapters.map((chapter, index) => (
            <li key={chapter.clue.id}>
              <b>{index < MOCK_COLLECTED ? chapter.clue.title : '未发现的线索'}</b>
              <p>{index < MOCK_COLLECTED ? chapter.clue.text : '回到街上调查异常物件，线索会留在这里。'}</p>
            </li>
          ))}
        </ol>
      </details>
    </main>
  );
}
