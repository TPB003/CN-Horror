import { useMemo, useState } from 'react';
import { ITEMS, RECIPES, itemDef } from '../data/exploration';

interface InventoryPanelProps {
  items: string[];
  /** (consumedIds, gainedId, narrativeText) */
  onCombine: (consumed: string[], gained: string, text: string) => void;
  onOpenCodex: () => void;
}

export default function InventoryPanel({ items, onCombine, onOpenCodex }: InventoryPanelProps) {
  const [examined, setExamined] = useState<string | null>(null);
  const [combineMode, setCombineMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [combineNote, setCombineNote] = useState('');

  const defs = useMemo(() => items.map((id) => ({ id, def: itemDef(id) })).filter((x) => x.def), [items]);

  const toggleSelect = (id: string) => {
    setCombineNote('');
    setSelected((old) => {
      if (old.includes(id)) return old.filter((x) => x !== id);
      if (old.length >= 2) return [old[1], id];
      return [...old, id];
    });
  };

  const tryCombine = () => {
    const [a, b] = selected;
    if (!a || !b) return;
    const recipe = RECIPES.find((r) =>
      (r.inputs[0] === a && r.inputs[1] === b) || (r.inputs[0] === b && r.inputs[1] === a));
    if (recipe) {
      onCombine([a, b], recipe.result, recipe.text);
      setSelected([]);
      setCombineMode(false);
      setCombineNote('');
    } else {
      const nameA = ITEMS[a]?.name ?? a;
      const nameB = ITEMS[b]?.name ?? b;
      setCombineNote(`「${nameA}」和「${nameB}」放在一起，什么也没发生。它们不属于同一次因果。`);
    }
  };

  return (
    <div className="inventory-panel">
      <div className="inventory-head">
        <span className="panel-kicker">随身行囊</span>
        <button
          type="button"
          className={`quiet-button small ${combineMode ? 'is-active' : ''}`}
          onClick={() => { setCombineMode((v) => !v); setSelected([]); setCombineNote(''); }}
          aria-pressed={combineMode}
        >
          {combineMode ? '取消组合' : '组合物品'}
        </button>
      </div>
      {combineMode && <p className="inventory-hint">选两样东西试试——有些旧物，本就是一对。</p>}
      {defs.length === 0 && <p className="inventory-empty">行囊是空的。去发光的地方看看，手伸出去，总会摸到点什么。</p>}
      <ul className="inventory-list">
        {defs.map(({ id, def }) => def && (
          <li key={id} className={`inventory-item${selected.includes(id) ? ' is-selected' : ''}`}>
            <button
              type="button"
              className="inventory-item-main"
              onClick={() => (combineMode ? toggleSelect(id) : setExamined(examined === id ? null : id))}
              aria-pressed={combineMode ? selected.includes(id) : undefined}
              aria-label={combineMode ? `选择组合：${def.name}` : `查看：${def.name}`}
            >
              <span className="item-glyph" aria-hidden="true">◈</span>
              <span className="item-name">{def.name}</span>
              {def.usableOn?.length ? <span className="item-tag">可使用</span> : null}
            </button>
            {examined === id && (
              <div className="item-detail">
                <p>{def.description}</p>
                {def.folkloreRef && (
                  <button type="button" className="quiet-button small" onClick={onOpenCodex}>
                    查民俗志相关条目 <span aria-hidden="true">↗</span>
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {combineMode && (
        <div className="combine-bar">
          <span className="combine-selection">
            {selected.length === 0 ? '还没选' : selected.map((id) => ITEMS[id]?.name ?? id).join(' ＋ ')}
          </span>
          <button type="button" className="primary-button small" disabled={selected.length !== 2} onClick={tryCombine}>
            合成
          </button>
        </div>
      )}
      {combineNote && <p className="toast-message" role="status">{combineNote}</p>}
    </div>
  );
}
