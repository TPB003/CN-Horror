export interface SourceNote {
  id: string;
  title: string;
  edition?: string;
  passage?: string;
  url?: string | null;
  scope?: string;
  adaptation?: string;
  supports?: string;
  limitations?: string;
}

export interface StoryChoice {
  id: string;
  label: string;
  consequence?: string;
}

export interface StoryChapter {
  id: string;
  knot?: string;
  title: string;
  subtitle?: string;
  summary: string;
  introQuote?: string;
  prose: string[];
  scene: string;
  weather?: string;
  lantern?: string;
  npc?: string;
  interaction: { label: string; detail: string };
  clue: { id: string; title: string; text: string };
  sourceIds: string[];
  sources: SourceNote[];
  choices?: StoryChoice[];
  ending?: boolean;
  regionTime?: string;
  evidence?: string;
  transposition?: string;
  kind?: string;
  puzzle?: { prompt: string; answer: string; hint?: string; tokens?: string[] };
}

export interface StoryData {
  chapters: StoryChapter[];
  endings?: StoryChapter[];
  sourceRegistry?: SourceNote[];
}

export type SavedState = {
  currentId: string;
  collected: string[];
  visited: string[];
  choices: Record<string, string>;
  explored?: string[];
  puzzles?: string[];
  endingId?: string;
};
