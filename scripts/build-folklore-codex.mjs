// 民俗志数据生成器：把研究台账 entries.json 转为站内 TypeScript 数据。
// 用法：node scripts/build-folklore-codex.mjs [entries.json 路径]
// 默认读取 idea 台账的 entries.json；只取正文条目（entries），已否决（rejected）不进站内。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = resolve(process.argv[2] ?? process.env.HOME + '/workspace/.jarvis/idea-executions/0603f04e-d03f-4146-8791-4e1e429a5fb9/scratch/entries.json');
const outPath = resolve(root, 'src/data/folkloreCodex.ts');

const data = JSON.parse(readFileSync(inputPath, 'utf8'));
const entries = data.entries.filter((e) => !String(e.id).startsWith('X'));

const validCats = new Set(['doc', 'oral', 'fiction']);
const validStatus = new Set(['verified', 'pending']);
const FALLBACK_BOUNDARY = '出处见上；本作中的具体情节与运用为虚构创作。';
for (const e of entries) {
  if (!validCats.has(e.cat)) throw new Error(`未知类别: ${e.id} ${e.cat}`);
  if (!validStatus.has(e.status)) throw new Error(`未知状态: ${e.id} ${e.status}`);
  for (const k of ['id', 'name', 'source']) {
    if (typeof e[k] !== 'string' || !e[k].trim()) throw new Error(`字段缺失: ${e.id}.${k}`);
  }
  if (typeof e.note !== 'string') throw new Error(`note 非字符串: ${e.id}`);
  if (!e.note.trim()) e.note = FALLBACK_BOUNDARY;
  if (typeof e.citable !== 'boolean') throw new Error(`citable 非布尔: ${e.id}`);
  if (e.citable && (e.status !== 'verified' || e.cat === 'fiction')) {
    throw new Error(`可引用条目必须已核对且非虚构: ${e.id}`);
  }
}

const str = (v) => JSON.stringify(String(v ?? ''));
const lines = entries.map((e) => `  {
    id: ${str(e.id)},
    name: ${str(e.name)},
    category: ${str(e.cat)},
    region: ${str(e.region)},
    source: ${str(e.source)},
    url: ${str(e.url)},
    status: ${str(e.status)},
    citable: ${e.citable ? 'true' : 'false'},
    boundary: ${str(e.note)},
    usage: ${str(e.use)},
    sref: ${str(e.sref)},
  },`);

const ts = `// 由 scripts/build-folklore-codex.mjs 自动生成，请勿手改。
// 数据源：民俗研究台账 entries.json（正文条目；已否决条目不进站内，见外部台账）。
// 重新生成：node scripts/build-folklore-codex.mjs [entries.json 路径]

export type CodexCategory = 'doc' | 'oral' | 'fiction';
export type CodexStatus = 'verified' | 'pending';

export interface FolkloreCodexEntry {
  /** 条目编号，如 L06 */
  id: string;
  /** 素材名 */
  name: string;
  /** 类别：doc 文献 / oral 口头传统 / fiction 游戏虚构 */
  category: CodexCategory;
  /** 口头类流传地（文献/虚构为空） */
  region: string;
  /** 出处 */
  source: string;
  /** 出处链接（可空） */
  url: string;
  /** 核对状态：verified 已核对 / pending 原文待核对 */
  status: CodexStatus;
  /** 是否可正式引用（仅已核对的非虚构条目为 true） */
  citable: boolean;
  /** 虚实边界一句话 */
  boundary: string;
  /** 在游戏中的用途/关联站点 */
  usage: string;
  /** 研究台账来源编号，如 S05 */
  sref: string;
}

export const FOLKLORE_CODEX: FolkloreCodexEntry[] = [
${lines.join('\n')}
];

export const CODEX_CATEGORY_LABEL: Record<CodexCategory, string> = {
  doc: '文献',
  oral: '口头传统',
  fiction: '游戏虚构',
};
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, ts);
console.log(`wrote ${outPath} (${entries.length} entries)`);
