// Files are passed in batches: Windows rejects command lines over about 8000 characters,
// which a large commit (100+ files) exceeds.
const BATCH = 40;

const quote = (file) => `"${file}"`;

function batched(command) {
  return (files) => {
    const commands = [];
    for (let i = 0; i < files.length; i += BATCH)
      commands.push(
        `${command} ${files
          .slice(i, i + BATCH)
          .map(quote)
          .join(" ")}`,
      );
    return commands;
  };
}

export default {
  "*.{ts,tsx,js,mjs,cjs,mts,json,md,css,yml,yaml}": batched("prettier --write"),
  "*.{ts,tsx,js,mjs,cjs,mts}": batched("eslint --fix"),
};
