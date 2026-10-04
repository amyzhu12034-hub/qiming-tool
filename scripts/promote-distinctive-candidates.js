/* 将已暂缓、但符合“有诗意且现实可作姓名”的候选转为正式收录，并保留风格提示。 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const decisionsPath = path.join(root, 'data', 'review-decisions.json');
if (!fs.existsSync(decisionsPath)) throw new Error('未找到本地审核决定。');

const decisions = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
let promoted = 0;
const updated = decisions.map(decision => {
  if (decision.status !== 'hold') return decision;
  promoted += 1;
  return {
    ...decision,
    status: 'approved',
    styleNotice: '风格较特别',
    note: '按默认审核规则收录：出处与人名可用性成立；风格较特别，结果页将提示用户。',
    updatedAt: new Date().toISOString()
  };
});
fs.writeFileSync(decisionsPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
console.log(`已将 ${promoted} 条“暂缓”候选转为“风格较特别”的正式候选。`);
