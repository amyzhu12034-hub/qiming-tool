/*
 * 第二轮编辑审核：处理新增八个公开语料来源的 79 条候选。
 *
 * 审核原则：
 * 1. 原文与作品必须可以定位；
 * 2. 语境不得明显消极、贬义或仅为器物/地名；
 * 3. 优先保留能够作为现代姓名使用的词；
 * 4. 有诗意但读感偏古典的词保留，并标记“风格较特别”。
 *
 * 该脚本只写本地、被 .gitignore 忽略的审核决定；不会部署或改动公网版本。
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const queueNames = ['chuci', 'classics', 'confucian', 'nalan', 'philosophy', 'prose', 'wudai', 'yuanqu'];
const candidates = queueNames.flatMap(collection => {
  const file = path.join(root, 'data', `review-queue-${collection}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
});
const decisionFile = path.join(root, 'data', 'review-decisions.json');
const existing = fs.existsSync(decisionFile) ? JSON.parse(fs.readFileSync(decisionFile, 'utf8')) : [];

// 同名只保留语境最完整、出处最适合展示的一条，避免推荐卡出现重复来源。
const approved = new Set([
  // 楚辞
  'd2d63da9b62c661266bb', '5b837b02ed9e8cd62b83', '8a40e0e476c374252584',
  'f62353e2210d9093d83d', '3013e2ce1acc599a3aa9', '4f06c50deaee49be1f46',
  '284436539d02c8c78202', 'c52965b6128c0e015cf6', 'b46b125fb99ae0bd8b87',
  // 经史子集（去除“格物、博学、审问、明辨”等更像学习术语的词）
  '87bb8bcbc6e37d74caf8', 'df17e226815153aa6e4a', '7b9efd3d8a4eb95b6938',
  'c7e89a08b968fff4aa61', '9516a7bb1eea69766a58', 'f7c27dd3b3b52b369ee1',
  '56188a902b579f83baae', 'fe3299ced2386eac72e2', '0cd9e655f3025dee9836',
  '3c47a5cb841193f786e8', '170cfe6ddd2b506d2ae9', '503d634242f292f885b2',
  '9402885c920308744c7d', 'c5c289b140ba42aa5e20', 'e726ae9ee8ca84b533bc',
  // 纳兰与哲学典籍
  '72b654a7bae02f2a179d',
  '94acbc4f6fc839c7b1cb', '98a9074ccc6451efc1e4', '767a01ab538bd400429c',
  '11e364d88e29518158a7', '8cb88b67001d40d8be1a', '50f5cbc13008ea23e7bf',
  '670bdd4095c124988f74', '097e2ccd1e117e57bab0', '2b246e5cac24acff0785',
  // 散文、五代、元曲
  '4c49d6f0933fed0926cd', '9551db57c64ce129351b', '32cc3487ef8dfb3ed882',
  '2d08094944c44b32b15b', '89e41c4b6e694500517c', '44f426c5fca8ecaf96ea',
  '53bb4764f2c591fcaeec', '7b2b2fb546615f9898fc', '37e6049e90ce8cc76301',
  'b9b17d8c5bdca0756c36', 'b3d200c7fe2c62296bf1'
]);

const distinctive = new Set([
  '3013e2ce1acc599a3aa9', '4f06c50deaee49be1f46', 'b46b125fb99ae0bd8b87',
  'df17e226815153aa6e4a', '7b9efd3d8a4eb95b6938', 'c7e89a08b968fff4aa61',
  'f7c27dd3b3b52b369ee1', '56188a902b579f83baae', '0cd9e655f3025dee9836',
  '3c47a5cb841193f786e8', '170cfe6ddd2b506d2ae9', '503d634242f292f885b2', 'c5c289b140ba42aa5e20',
  '72b654a7bae02f2a179d', '94acbc4f6fc839c7b1cb', '767a01ab538bd400429c',
  '11e364d88e29518158a7', '8cb88b67001d40d8be1a', '50f5cbc13008ea23e7bf',
  '670bdd4095c124988f74', '097e2ccd1e117e57bab0', '2b246e5cac24acff0785',
  '9551db57c64ce129351b', '89e41c4b6e694500517c', '44f426c5fca8ecaf96ea',
  '7b2b2fb546615f9898fc', 'b3d200c7fe2c62296bf1'
]);

const rejectionReasons = new Map([
  ['7fe50188e6225dcc43b6', '“格物”是求学工夫的固定术语，姓名感不足。'],
  ['b844f256732af6d28a54', '“中和”多作哲学与制度概念，现代姓名辨识度不佳。'],
  ['625069a7488bf38aed22', '“博学”更像能力描述或校训，姓名感不足。'],
  ['00bcf848147c7fa189ce', '“审问”是求学步骤，现代语义容易被理解为动词。'],
  ['d5eaf9bbf853740f386f', '“明辨”是能力描述，姓名感不足。'],
  ['5342eb91eecd719fffaa', '“协和”常关联机构、校名和政治语汇，不作为人名推荐。'],
  ['a4b9a9fdd617ab5c3fc7', '与《大学》“明德”重复，保留出处更完整的一条。'],
  ['9190dc16cb1e4d101090', '“嘉善”既是地名，也缺少明确的人名使用依据。'],
  ['edd194335df663e0f1a7', '与经史子集候选同名，且该词本身不适合作为正式人名。'],
  ['33bd3f93dd4c922a4903', '与《大学》“致知”重复，保留出处更完整的一条。'],
  ['076e0222828c6c91b44f', '与元曲“飞琼”重复，保留更具神话人名指向的一条。'],
  ['ebe0d0a11223e377823e', '与元曲中明确作为人物名的“玉兰”重复。'],
  ['51c51c04a7ee87c27cb0', '与五代词“明月”重复，保留语境更完整的一条。'],
  ['0a423af5c126d9ee32c0', '“赤水”是地名意象，不作为人名推荐。'],
  ['1aca2d05b8d17ba6e30a', '“大象”在原文是哲学概念，现代用作姓名容易产生歧义。'],
  ['c6f037008f2924064a34', '“积善”是劝诫短语，姓名感不足。'],
  ['1009e3526c3866380ef9', '“青鸟”主要是神话鸟名与文化符号，缺少稳定的人名使用依据。'],
  ['190bc8219c88e4750cd3', '“青丘”是山名/地域意象，姓名感不足。'],
  ['5788bb881cd4b1597f7c', '“神人”是称谓，不能作为正式姓名推荐。'],
  ['fcc7b304c2d1d6250730', '“虚静”是哲学术语，姓名感不足。'],
  ['1e0529043f5eb6642091', '“玄同”是哲学概念，缺少稳定的现代人名使用依据。'],
  ['b3330d9ecfde99507974', '“真人”是称谓/宗教哲学概念，不能作为正式姓名推荐。'],
  ['c5c59873f984172c9338', '与《大学》“知止”重复，保留出处更适合展示的一条。'],
  ['bc0a094d8bb6dcdec64d', '“至人”是哲学称谓，不能作为正式姓名推荐。'],
  ['19a07ff585b2ed74208d', '与元曲中明确作为人物名的“玉兰”重复。'],
  ['02264f3eadbea466e9d2', '与《大学》“明德”重复，保留出处更完整的一条。'],
  ['262088d61fefc911f809', '与五代词“明月”重复，保留语境更完整的一条。'],
  ['ba3185314f9fd61b7a26', '“灵和殿”为宫殿名，不能直接作为人名。'],
  ['10e331f42db723b527a6', '与既有正式语料“明月”重复。'],
  ['ba64013bd9f7f8740cd1', '语境为“寂寞……锁清秋”，情绪偏冷，与纳兰词版本相比不宜作为展示出处。'],
  ['9e6d5ed0e0fe57a3db43', '与《岳阳楼记》“春和”重复，保留出处更完整的一条。'],
  ['8c3785b7dc188c0208be', '与既有正式语料“明月”重复。'],
  ['f2ab8c5e5aa34b1b6450', '与《岳阳楼记》“景明”重复，保留出处更完整的一条。'],
  ['d62047d26691fbf4d4ac', '语境含“昏惨惨”等明显低沉描写，不作为名字出处。']
]);

if (candidates.length !== 79) throw new Error(`候选数异常：预期 79，实际 ${candidates.length}`);
const candidateIds = new Set(candidates.map(item => item.id));
for (const id of approved) if (!candidateIds.has(id)) throw new Error(`通过清单中存在未知 id：${id}`);
for (const id of rejectionReasons.keys()) if (!candidateIds.has(id)) throw new Error(`拒绝清单中存在未知 id：${id}`);
if (approved.size + rejectionReasons.size !== candidates.length) {
  throw new Error(`审核决定不完整：通过 ${approved.size} + 拒绝 ${rejectionReasons.size} ≠ ${candidates.length}`);
}

const now = new Date().toISOString();
const newDecisions = candidates.map(item => {
  const isApproved = approved.has(item.id);
  const special = distinctive.has(item.id);
  return {
    id: item.id,
    status: isApproved ? 'approved' : 'rejected',
    meaning: isApproved
      ? `取自${item.work}：“${item.quote}”。出处可定位，语境正向，适合作为姓名候选。`
      : item.meaning,
    styleNotice: isApproved && special ? '风格较特别' : '',
    note: isApproved
      ? (special
        ? '编辑审核通过：出处可追溯、语境正向且有姓名可用性；古典气息较强，页面将提示“风格较特别”。'
        : '编辑审核通过：出处可追溯、语境正向，读音与现代人名感符合正式推荐标准。')
      : `编辑审核不通过：${rejectionReasons.get(item.id)}`,
    updatedAt: now
  };
});

const untouched = existing.filter(item => !candidateIds.has(item.id));
fs.writeFileSync(decisionFile, JSON.stringify([...untouched, ...newDecisions], null, 2) + '\n', 'utf8');
console.log(`新增审核完成：通过 ${approved.size}（其中风格较特别 ${[...approved].filter(id => distinctive.has(id)).length}），拒绝 ${rejectionReasons.size}。`);
