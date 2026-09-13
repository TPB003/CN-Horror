import { buildStory } from './compile.mjs';

buildStory({ check: true })
  .then(({ chapters, endings }) => {
    process.stdout.write(`Story source and generated exports are valid (${chapters.length} chapters, ${endings.length} endings).\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
