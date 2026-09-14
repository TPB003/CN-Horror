import { Story as InkStory } from 'inkjs';

export class StoryRuntime {
  private readonly runtime: InstanceType<typeof InkStory>;

  constructor(compiledStory: string) {
    this.runtime = new InkStory(compiledStory);
  }

  readKnot(knot: string): string[] {
    this.runtime.ChoosePathString(knot);
    const passages: string[] = [];
    let guard = 0;
    while (this.runtime.canContinue && guard < 80) {
      const text = (this.runtime.Continue() ?? '').trim();
      if (text) passages.push(text);
      guard += 1;
    }
    return passages;
  }

  choices() {
    return this.runtime.currentChoices.map((choice, index) => ({
      index,
      text: choice.text,
      tags: choice.tags ?? [],
    }));
  }

  choose(index: number): string[] {
    this.runtime.ChooseChoiceIndex(index);
    const passages: string[] = [];
    let guard = 0;
    while (this.runtime.canContinue && guard < 80) {
      const text = (this.runtime.Continue() ?? '').trim();
      if (text) passages.push(text);
      guard += 1;
    }
    return passages;
  }
}
