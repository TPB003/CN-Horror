import { buildStory } from './compile.mjs';

buildStory({ onlyNovel: true })
  .then(({ chapters, endings }) => {
    process.stdout.write(`Generated novel/归灯.md from story/main.ink (${chapters.length} chapters, ${endings.length} ending appendices).\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
