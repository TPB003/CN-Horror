import { useEffect, useMemo, useRef, useState} from 'react';
import ExploreScene from './ExploreScene';
import InventoryPanel from './InventoryPanel';
import { DialPanel, DivinationPanel, LampsPanel} from './Puzzles';
import { hotspotsFor, itemDef, type HotspotDef} from '../data/exploration';

interface ExploreOverlayProps {
stationId: string;
stationIndex: number;
title: string;
inventory: string[];
consumedHotspots: Set<string>;
solvedPuzzles: Set<string>;
divined: boolean;
onPickup: (itemId: string, hotspotId: string) => void;
onConsumeHotspot: (hotspotId: string) => void;
onCombine: (consumed: string[], gained: string, text: string) => void;
onUseItemOnHotspot: (itemId: string, hotspot: HotspotDef) => string | null;
onPuzzleSolved: (puzzleId: string, text: string) => void;
onDivined: () => void;
onOpenCodex: () => void;
onClose: () => void;
}

const PUZZLE_TITLES: Record<string, string> = {
'divination-kun': '问卦「困」',
'manuscript-dial': '残缺命书',
'seven-lamps': '七魄灯',
};

export default function ExploreOverlay(props: ExploreOverlayProps) {
const { stationId, stationIndex, title, inventory, consumedHotspots, solvedPuzzles} = props;
const [activeHotspot, setActiveHotspot] = useState<HotspotDef | null>(null);
const [activePuzzle, setActivePuzzle] = useState<string | null>(null);
const [showInventory, setShowInventory] = useState(false);
const [message, setMessage] = useState('');
const panelRef = useRef<HTMLDivElement>(null);
const closeRef = useRef(props.onClose);
closeRef.current = props.onClose;

const hotspots = useMemo(() => hotspotsFor(stationId), [stationId]);

useEffect(() => {
setActiveHotspot(null);
setActivePuzzle(null);
setShowInventory(false);
setMessage('');
}, [stationId]);

useEffect(() => {
const onKey = (event: KeyboardEvent) => {
if (event.key === 'Escape' && !activePuzzle && !showInventory) closeRef.current();
};
document.addEventListener('keydown', onKey);
return () => document.removeEventListener('keydown', onKey);
}, [activePuzzle, showInventory]);

useEffect(() => {
if (!message) return;
const timer = window.setTimeout(() => setMessage(''), 6000);
return () => window.clearTimeout(timer);
}, [message]);

const usableItems = useMemo(() => {
if (!activeHotspot) return [];
return inventory.filter((id) => {
const def = itemDef(id);
return def?.usableOn?.includes(activeHotspot.id) || activeHotspot.acceptsItem === id;
});
}, [activeHotspot, inventory]);

const handleHotspot = (hotspot: HotspotDef) => {
if (hotspot.kind === 'pickup' &&!consumedHotspots.has(hotspot.id) && hotspot.itemId) {
props.onPickup(hotspot.itemId, hotspot.id);
const def = itemDef(hotspot.itemId);
setMessage(`拾取了【${def?.name ?? hotspot.label}】。`);
return;
}
if (hotspot.kind === 'puzzle' && hotspot.puzzleId) {
if (solvedPuzzles.has(hotspot.puzzleId)) {
setMessage(`「${PUZZLE_TITLES[hotspot.puzzleId]?? '谜题'}」已经解开了，痕迹还留在这里。`);
return;
}
setActivePuzzle(hotspot.puzzleId);
setActiveHotspot(null);
return;
}
setActiveHotspot(hotspot);
setActivePuzzle(null);
};

const handleUseItem = (itemId: string) => {
if (!activeHotspot) return;
const result = props.onUseItemOnHotspot(itemId, activeHotspot);
if (result) {
setMessage(result);
setActiveHotspot(null);
}
};

const handlePuzzleSolved = (puzzleId: string, text: string) => {
props.onPuzzleSolved(puzzleId, text);
setActivePuzzle(null);
setMessage(text);
};

return (
<div className="explore-overlay" role="dialog" aria-modal="true" aria-label={`${title}：现场探索`}>
<div className="explore-topbar">
<div className="explore-title">
<span className="panel-kicker">现场探索</span>
<h2>{title}</h2>
</div>
<div className="explore-actions">
<button
type="button"
className="icon-button"
onClick={() => setShowInventory((v) =>!v)}
aria-label={`打开行囊，${inventory.length} 件物品`}
aria-expanded={showInventory}
>
<span aria-hidden="true">🎒</span> 行囊 <b>{inventory.length}</b>
</button>
<button type="button" className="close-button" onClick={props.onClose} aria-label="离开现场，返回叙事">×</button>
</div>
</div>

<div className="explore-body">
<ExploreScene
stationId={stationId}
stationIndex={stationIndex}
title={title}
hotspots={hotspots}
consumed={consumedHotspots}
solvedPuzzles={solvedPuzzles}
onHotspot={handleHotspot}
onClose={props.onClose}
/>

{activeHotspot &&!activePuzzle && (
<div className="hotspot-card" ref={panelRef} role="group" aria-label={activeHotspot.label}>
<div className="hotspot-card-head">
<span className={`hotspot-kind kind-${activeHotspot.kind}`}>
{activeHotspot.kind === 'pickup'? '可拾取': activeHotspot.kind === 'puzzle'? '谜题': '调查'}
</span>
<h3>{activeHotspot.label}</h3>
<button type="button" className="close-button small" onClick={() => setActiveHotspot(null)} aria-label="收起">×</button>
</div>
<p className="hotspot-desc">{activeHotspot.description}</p>
{usableItems.length > 0 && activeHotspot.acceptsItem && (
<div className="hotspot-use">
{usableItems.map((id) => (
<button key={id} type="button" className="primary-button small" onClick={() => handleUseItem(id)}>
使用【{itemDef(id)?.name ?? id}】
</button>
))}
</div>
)}
{activeHotspot.kind === 'puzzle' && activeHotspot.puzzleId &&!solvedPuzzles.has(activeHotspot.puzzleId) && (
<button type="button" className="primary-button small" onClick={() => handleHotspot(activeHotspot)}>
开始解谜
</button>
)}
</div>
)}

{activePuzzle === 'divination-kun' && (
<div className="puzzle-sheet" role="dialog" aria-label="问卦">
<DivinationPanel
onDone={() => { props.onDivined(); setActivePuzzle(null); setMessage('卦已成，签纸上圈着四个字：利用祭祀。去祭案前看看吧。');}}
onClose={() => setActivePuzzle(null)}
/>
</div>
)}
{activePuzzle === 'manuscript-dial' && (
<div className="puzzle-sheet" role="dialog" aria-label="转盘锁">
<DialPanel
onSolved={() => handlePuzzleSolved('manuscript-dial', '咔哒一声，锁开了。木盒底层，母亲的字迹躺在去向记录上——她不是失踪，是登记。')}
onClose={() => setActivePuzzle(null)}
/>
</div>
)}
{activePuzzle === 'seven-lamps' && (
<div className="puzzle-sheet" role="dialog" aria-label="七魄灯">
<LampsPanel
onSolved={() => handlePuzzleSolved('seven-lamps', '七盏灯次第亮起。门槛两侧的影子，一一有了去向。')}
onClose={() => setActivePuzzle(null)}
/>
</div>
)}

{showInventory && (
<div className="inventory-sheet" role="dialog" aria-label="行囊">
<InventoryPanel
items={inventory}
onCombine={(consumedIds, gained, text) => {
props.onCombine(consumedIds, gained, text);
setMessage(text);
}}
onOpenCodex={props.onOpenCodex}
/>
</div>
)}
</div>

{message && <div className="toast-message explore-toast" role="status">{message}</div>}
</div>
);
}
