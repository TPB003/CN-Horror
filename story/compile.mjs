import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Compiler, CompilerOptions } from 'inkjs/full';
import { PosixFileHandler } from 'inkjs/compiler/FileHandler/PosixFileHandler';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inkPath = path.join(projectRoot, 'story', 'main.ink');
const sourceRegistryPath = path.join(projectRoot, 'story', 'sources.json');

function readKnots(inkSource) {
  const starts = [...inkSource.matchAll(/^===\s*([A-Za-z0-9_-]+)\s*===\s*$/gm)];
  if (starts.length === 0) throw new Error('story/main.ink contains no knots.');

  return starts.map((match, index) => {
    const bodyStart = match.index + match[0].length;
    const bodyEnd = index + 1 < starts.length ? starts[index + 1].index : inkSource.length;
    const lines = inkSource.slice(bodyStart, bodyEnd).split(/\r?\n/);
    const tags = {};
    let firstContentLine = 0;

    for (; firstContentLine < lines.length; firstContentLine += 1) {
      const line = lines[firstContentLine];
      if (!line.trim()) continue;
      const tag = line.match(/^\s*#\s+([A-Za-z][A-Za-z0-9]*):\s*(.*?)\s*$/);
      if (!tag) break;
      tags[tag[1]] = tag[2];
    }

    const prose = [];
    const choices = [];
    for (let lineIndex = firstContentLine; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const paragraph = line.match(/^\s*(.*?)\s*#\s+prose\s*$/);
      if (paragraph?.[1]?.trim()) prose.push(paragraph[1].trim());

      const choice = line.match(/^\s*\*\s+\[(.+?)\]\s*$/);
      if (choice) {
        let target = null;
        for (let targetLine = lineIndex + 1; targetLine < lines.length; targetLine += 1) {
          if (/^\s*\*\s+\[/.test(lines[targetLine])) break;
          const divert = lines[targetLine].match(/^\s*->\s+([A-Za-z0-9_-]+)\s*$/);
          if (divert) target = divert[1];
        }
        choices.push({ label: choice[1].trim(), target });
      }
    }

    return { knot: match[1], tags, prose, choices };
  });
}

function requireTag(knot, key) {
  const value = knot.tags[key];
  if (!value) throw new Error(`Knot "${knot.knot}" is missing required tag "${key}".`);
  return value;
}

function displaySource(source, knot) {
  return {
    id: source.id,
    title: source.title,
    edition: source.edition,
    passage: source.passage,
    url: source.url,
    scope: source.scope,
    adaptation: knot.tags.transposition,
    supports: source.supports,
    limitations: source.limitations,
  };
}

function makePage(knot, knotsByName, sourceRegistry) {
  const sourceIds = (knot.tags.sourceIds ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  const sources = sourceIds.map((id) => {
    const source = sourceRegistry.sources[id];
    if (!source) throw new Error(`Knot "${knot.knot}" references unknown source ID "${id}".`);
    return displaySource(source, knot);
  });

  const page = {
    id: requireTag(knot, 'id'),
    knot: knot.knot,
    kind: requireTag(knot, 'kind'),
    title: requireTag(knot, 'title'),
    subtitle: requireTag(knot, 'subtitle'),
    summary: requireTag(knot, 'summary'),
    brief: knot.tags.summary,
    introQuote: knot.tags.introQuote,
    prose: knot.prose,
    scene: requireTag(knot, 'scene'),
    weather: requireTag(knot, 'weather'),
    lantern: requireTag(knot, 'lantern'),
    npc: requireTag(knot, 'npc'),
    interaction: {
      label: requireTag(knot, 'interactionLabel'),
      detail: requireTag(knot, 'interactionDetail'),
    },
    clue: {
      id: requireTag(knot, 'clueId'),
      title: requireTag(knot, 'clueTitle'),
      text: requireTag(knot, 'clueText'),
    },
    sourceIds,
    sources,
    regionTime: requireTag(knot, 'regionTime'),
    evidence: requireTag(knot, 'evidence'),
    transposition: requireTag(knot, 'transposition'),
    ending: knot.tags.kind === 'ending',
    choices: knot.choices.map((choice, index) => {
      const target = choice.target ? knotsByName.get(choice.target) : null;
      if (choice.target && !target) throw new Error(`Knot "${knot.knot}" diverts to unknown knot "${choice.target}".`);
      return {
        id: `${knot.knot}-choice-${index + 1}`,
        label: choice.label,
        target: choice.target,
        consequence: target?.tags.summary ?? '结束当前叙事。',
      };
    }),
  };

  if (knot.tags.puzzleAnswer) {
    page.puzzle = {
      prompt: requireTag(knot, 'puzzlePrompt'),
      answer: requireTag(knot, 'puzzleAnswer'),
      hint: requireTag(knot, 'puzzleHint'),
    };
  }

  if (knot.tags.kind === 'ending') {
    page.endingCondition = knot.knot === 'ending_release'
      ? { flag: 'record_corrected', value: true }
      : { flag: 'answered_call', value: true };
  }

  return page;
}

function validateStructure(knots, pages, sourceRegistry, inkSource) {
  const expected = [...Array.from({ length: 12 }, (_, i) => `chapter_${String(i + 1).padStart(2, '0')}`), 'ending_release', 'ending_called'];
  const actual = knots.map((knot) => knot.knot);
  const missing = expected.filter((id) => !actual.includes(id));
  const unexpected = actual.filter((id) => !expected.includes(id));
  if (missing.length || unexpected.length) {
    throw new Error(`Expected exactly 12 chapters and two endings, with no extra station knot. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`);
  }
  if (actual.join(',') !== expected.join(',')) {
    throw new Error(`Ink knots must follow the canonical order: ${expected.join(', ')}.`);
  }

  const pagesByKnot = new Map(pages.map((page) => [page.knot, page]));
  if (!/^\s*->\s+chapter_01\s*$/m.test(inkSource)) throw new Error('Ink must start directly at chapter_01; the opening must be part of station 01.');
  for (const endingName of ['ending_release', 'ending_called']) {
    if (pagesByKnot.get(endingName)?.kind !== 'ending') throw new Error(`"${endingName}" must be tagged as an ending.`);
  }
  for (const knot of knots) {
    if (knot.tags.knot !== knot.knot || !knot.tags.id) {
      throw new Error(`Knot "${knot.knot}" must have matching knot and id tags.`);
    }
    if (!knot.tags.sourceIds) throw new Error(`Knot "${knot.knot}" has no sourceIds tag.`);
  }
  for (const chapterNumber of Array.from({ length: 12 }, (_, i) => i + 1)) {
    const knot = `chapter_${String(chapterNumber).padStart(2, '0')}`;
    const page = pagesByKnot.get(knot);
    if (page.kind !== 'chapter' || page.id !== `station-${String(chapterNumber).padStart(2, '0')}` || page.choices.length === 0 || page.prose.length === 0) {
      throw new Error(`"${knot}" must be a chapter with prose and at least one Ink choice.`);
    }
    if (chapterNumber < 12) {
      const expectedTarget = `chapter_${String(chapterNumber + 1).padStart(2, '0')}`;
      const expectedChoices = [3, 7, 8, 10].includes(chapterNumber) ? 2 : 1;
      if (page.choices.length !== expectedChoices || page.choices.some((choice) => choice.target !== expectedTarget)) {
        throw new Error(`"${knot}" must offer ${expectedChoices} choice(s), all continuing to ${expectedTarget}.`);
      }
    }
  }
  const finalChapter = pagesByKnot.get('chapter_12');
  if (finalChapter.choices.length !== 2
    || !finalChapter.choices.some((choice) => choice.target === 'ending_release')
    || !finalChapter.choices.some((choice) => choice.target === 'ending_called')) {
    throw new Error('"chapter_12" must offer exactly the two ending routes.');
  }
  const namePuzzle = pagesByKnot.get('chapter_11')?.puzzle;
  if (!namePuzzle?.prompt || !namePuzzle?.answer || !namePuzzle?.hint) {
    throw new Error('"chapter_11" must define its prompt, answer and hint in Ink tags.');
  }
  if (!/\*\s+\[写回三人的姓名与去向，点亮黄灯送母亲离开\]\s+~\s*record_corrected\s*=\s*true\s+~\s*answered_call\s*=\s*false\s+->\s+ending_release/.test(inkSource)
    || !/\*\s+\[写回三人的姓名，接过黄灯留下替母亲守巷\]\s+~\s*record_corrected\s*=\s*true\s+~\s*answered_call\s*=\s*true\s+->\s+ending_called/.test(inkSource)) {
    throw new Error('The two final Ink choices must set their ending flags before their ending diverts.');
  }
  if (!/VAR\s+record_corrected\s*=\s*false/.test(inkSource)
    || !/VAR\s+answered_call\s*=\s*false/.test(inkSource)
    || !/record_corrected\s*=\s*true/.test(inkSource)
    || !/answered_call\s*=\s*true/.test(inkSource)) {
    throw new Error('Ink runtime ending flags are missing or are not assigned by the final choices.');
  }
  for (const page of pages) {
    for (const sourceId of page.sourceIds) {
      if (!sourceRegistry.sources[sourceId]) throw new Error(`Unknown source ID "${sourceId}" in ${page.knot}.`);
    }
  }
  for (const [key, source] of Object.entries(sourceRegistry.sources)) {
    if (source.id !== key || !source.title || !source.edition || !source.passage || !source.scope || !source.supports || !source.limitations) {
      throw new Error(`Source registry entry "${key}" is missing a required field or has a mismatched id.`);
    }
  }
}

function novelSection(page) {
  const sourceLines = page.sources.map((source) => {
    const url = source.url ? `，${source.url}` : '';
    return `- **${source.id}｜${source.title}**：${source.edition}；${source.passage}${url}`;
  });
  const choiceLines = page.choices.map((choice) => `- **${choice.label}**：${choice.consequence}`);
  return [
    `## ${page.title}`,
    `\n*${page.subtitle}*\n`,
    ...page.prose.map((paragraph) => `${paragraph}\n`),
    '### 场景与互动\n',
    `${page.scene}天气：${page.weather}灯笼：${page.lantern}\n`,
    `**路人/人物：**${page.npc}\n`,
    `**交互：**${page.interaction.label}。${page.interaction.detail}\n`,
    `**线索：**${page.clue.title}（${page.clue.id}）：${page.clue.text}\n`,
    ...(choiceLines.length ? ['### 选择\n', ...choiceLines, '\n'] : []),
    '### 本章考据\n',
    `**地域与年代：**${page.regionTime}\n`,
    `**真实依据：**${page.evidence}\n`,
    `**创作转译：**${page.transposition}\n`,
    ...(sourceLines.length ? ['**来源：**\n', ...sourceLines, '\n'] : []),
  ].join('\n');
}

function buildNovel(chapters, endings) {
  return [
    '# 归灯',
    '',
    '连云老街夜行故事｜互动恐怖叙事',
    '',
    '> 本作以连云老街为故事发生地，使用可查的石街巷、院落和沿海旧街空间作为现实场景锚点。槐安客栈、人物、客簿、灵异事件与两种结局均为虚构，不指认街区内任何真实建筑曾发生这些事件。',
    '',
    '> 故事从01雨夜街口直接开始，来信与入巷合并在首站；正文和互动选择都来自 `story/main.ink`。双结局作为附录另列。',
    '',
    ...chapters.map(novelSection),
    '# 双结局附录',
    '',
    '> 两条路线都从第十二站的 Ink choices 进入。',
    '',
    ...endings.map(novelSection),
  ].join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

async function updateFile(filePath, content, check) {
  let current = null;
  try {
    current = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (current === content) return;
  if (check) throw new Error(`Generated file is out of date: ${path.relative(projectRoot, filePath)}. Run node story/compile.mjs.`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

export async function buildStory({ check = false, onlyNovel = false } = {}) {
  const [inkSource, sourceRegistryText] = await Promise.all([
    fs.readFile(inkPath, 'utf8'),
    fs.readFile(sourceRegistryPath, 'utf8'),
  ]);
  const sourceRegistry = JSON.parse(sourceRegistryText);
  if (sourceRegistry.version !== 1 || !sourceRegistry.sources) throw new Error('story/sources.json must use source registry version 1.');

  const knots = readKnots(inkSource);
  const knotsByName = new Map(knots.map((knot) => [knot.knot, knot]));
  const pages = knots.map((knot) => makePage(knot, knotsByName, sourceRegistry));
  validateStructure(knots, pages, sourceRegistry, inkSource);

  const compiler = new Compiler(inkSource, new CompilerOptions(inkPath, [], false, null, new PosixFileHandler(projectRoot)));
  let runtimeStory;
  try {
    runtimeStory = compiler.Compile();
  } catch (error) {
    const details = [...(compiler.errors ?? []), ...(compiler.warnings ?? [])]
      .map((item) => typeof item === 'string' ? item : item?.message ?? JSON.stringify(item))
      .join('\n');
    throw new Error(`Ink compilation failed.${details ? `\n${details}` : `\n${error.message}`}`);
  }

  const chapters = pages.filter((page) => page.kind === 'chapter');
  const endings = pages.filter((page) => page.kind === 'ending');
  const chaptersIndex = {
    title: '归灯',
    startKnot: 'chapter_01',
    flags: {
      record_corrected: { initial: false, trueRoute: 'ending_release' },
      answered_call: { initial: false, trueRoute: 'ending_called' },
    },
    chapters,
    endings,
    sourceRegistry,
  };

  const outputs = [
    [path.join(projectRoot, 'public', 'story', 'story.json'), `${runtimeStory.ToJson()}\n`],
    [path.join(projectRoot, 'public', 'story', 'chapters.json'), `${JSON.stringify(chaptersIndex, null, 2)}\n`],
    [path.join(projectRoot, 'novel', '归灯.md'), buildNovel(chapters, endings)],
  ];
  for (const [filePath, content] of outputs) {
    if (onlyNovel && !filePath.endsWith(path.join('novel', '归灯.md'))) continue;
    await updateFile(filePath, content, check);
  }

  return { chapters, endings, chaptersIndex };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const onlyNovel = process.argv.includes('--novel-only');
  buildStory({ check, onlyNovel })
    .then(({ chapters, endings }) => {
      process.stdout.write(`${check ? 'Checked' : 'Generated'} story exports: 12 chapters, ${endings.length} endings${onlyNovel ? ', novel only' : ', Ink JSON, chapter index and novel'}.\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
