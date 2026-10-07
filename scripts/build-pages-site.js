/* 生成 GitHub Pages 所需的纯静态目录。 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const output = path.join(root, 'site');
const copy = relative => {
  const source = path.join(root, relative);
  const destination = path.join(output, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
};

execFileSync(process.execPath, [path.join(root, 'scripts', 'build-static-corpus.js')], { stdio: 'inherit' });
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.join(output, 'data'), { recursive: true });
[
  'index.html', 'styles.css', 'source-cards.css', 'preference-flow.css', 'app.js', 'static-generator.js',
  'data/client-corpus.json'
].forEach(copy);
fs.writeFileSync(path.join(output, '.nojekyll'), '', 'utf8');
console.log(`GitHub Pages 静态站点已生成：${output}`);
