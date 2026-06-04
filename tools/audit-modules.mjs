import fs from 'fs';
import path from 'path';

const root = process.cwd();
const indexPath = path.join(root, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('FAIL index.html not found');
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexPath, 'utf8');

const activeModules = [...indexHtml.matchAll(/<script\s+src=["'](oot_[^"']+\.js)["']/g)]
  .map(m => m[1]);

const ootFiles = fs.readdirSync(root)
  .filter(name => /^oot_.*\.js$/i.test(name))
  .sort();

const activeSet = new Set(activeModules);
const unwired = ootFiles.filter(name => !activeSet.has(name));

const startsWithHtml = [];
const activeHtmlContamination = [];

for (const file of ootFiles) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const head = text.slice(0, 300).trimStart();

  if (/^<!DOCTYPE\s+html/i.test(head) || /^<html[\s>]/i.test(head)) {
    startsWithHtml.push(file);
  }

  if (activeSet.has(file) && /<!DOCTYPE\s+html|<html[\s>]|<\/html>/i.test(text)) {
    activeHtmlContamination.push(file);
  }
}

console.log('Module audit');
console.log('============');
console.log('');
console.log('Active modules wired by index.html:');
for (const file of activeModules) console.log(`  OK   ${file}`);

console.log('');
console.log('Unwired oot_*.js files present in repo root:');
for (const file of unwired) console.log(`  WARN ${file}`);

console.log('');
console.log('Files starting with HTML, must not be wired:');
for (const file of startsWithHtml) console.log(`  BAD  ${file}`);

console.log('');
console.log('Active module HTML contamination check:');
if (activeHtmlContamination.length) {
  for (const file of activeHtmlContamination) console.log(`  FAIL ${file}`);
  process.exitCode = 1;
} else {
  console.log('  OK   no active module contains saved HTML document markup');
}

console.log('');
console.log(`Summary: ${activeModules.length} active, ${unwired.length} unwired oot files, ${startsWithHtml.length} HTML-start candidate files.`);
