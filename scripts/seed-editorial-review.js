/*
 * 首轮编辑核验：仅将出处、语境和人名感均清晰的候选标为 approved。
 * 其余候选宁可 rejected；用户确认后才将边界候选纳入正式库。
 * 不会覆盖已经由人工在审核台填写的决定。
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const queues = ['shijing', 'tang', 'song', 'wikisource'].flatMap(collection => {
  const file = path.join(root, 'data', `review-queue-${collection}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
});
const decisionFile = path.join(root, 'data', 'review-decisions.json');
const existing = fs.existsSync(decisionFile) ? JSON.parse(fs.readFileSync(decisionFile, 'utf8')) : [];
const existingIds = new Set(existing.map(item => item.id));

const approved = new Set([
  'shijing:佩玉','shijing:婉如','shijing:如玉','shijing:玉佩','shijing:如松','shijing:高山','shijing:明德','shijing:昭明','shijing:静嘉','shijing:维宁','shijing:清风','shijing:文德','shijing:维清','shijing:光明','shijing:思乐','shijing:音昭','shijing:思成',
  'tang:月明','tang:晴川','tang:青云','tang:明月','tang:春山','tang:清月','tang:清秋','tang:秋光','tang:远山','tang:山晴','tang:白玉','tang:青玉','tang:雪霁','tang:明霁','tang:知春','tang:白云','tang:春风','tang:新春','tang:高风',
  'song:新晴','song:兰芷','song:凌云','song:清露','song:清光','song:初晴','song:思远','song:云飞','song:天明','song:素云','song:秋霁','song:月华','song:思悠','song:兰心','song:瑞锦','song:新月','song:素月',
  'wikisource:志学','wikisource:知新','wikisource:安仁','wikisource:忠恕','wikisource:敏行','wikisource:德邻','wikisource:志道','wikisource:弘毅','wikisource:笃信','wikisource:博学','wikisource:近思',
  'song:瑶佩'
]);
const themeWords = { 平安:'安定从容',喜乐:'和悦开朗',清澈:'澄明纯净',温柔:'温润柔和',明朗:'光明开阔',智慧:'明辨好学',品性:'端正自持',志向:'高远进取',自在:'舒展从容',自然:'自然生机',坚定:'笃定有力' };
const decisions = queues.filter(item => !existingIds.has(item.id)).map(item => {
  const key = `${item.collection}:${item.name}`;
  const status = approved.has(key) ? 'approved' : 'rejected';
  const imagery = item.themes.map(theme => themeWords[theme]).filter(Boolean).join('、') || '典籍意象';
  return {
    id: item.id,
    status,
    meaning: status === 'approved' ? `取自${item.work}，原句意象偏向${imagery}；经首轮编辑核验，读音与人名感自然，可作为正式候选。` : item.meaning,
    note: status === 'approved'
      ? '首轮编辑核验通过：出处可追溯，语境与人名可用性符合上线标准。'
      : '首轮编辑拒绝：属于相邻截词、普通名词，或完整语境与人名可用性未达到正式推荐标准。',
    updatedAt: new Date().toISOString()
  };
});
fs.writeFileSync(decisionFile, JSON.stringify([...existing, ...decisions], null, 2) + '\n', 'utf8');
const count = status => decisions.filter(item => item.status === status).length;
console.log(`新增决定：通过 ${count('approved')}，暂缓 ${count('hold')}，拒绝 ${count('rejected')}。`);
