# 知名：本地后端 MVP

首次运行先执行 `npm install`，再运行 `node server.js`，然后访问 `http://localhost:3000`。

已接入：起名 API、后端古典语料库、原文/篇章/取字校验、单字/双字名、复姓姓名展示、辈分字约束、康熙笔画及五格数值参考。

语料当前覆盖《诗经》《楚辞》、唐诗、宋词。五格结果仅返回笔画、数值与数理五行映射，不输出吉凶判断；未收录姓氏或字会明确提示字库待补充。

已接入：八字四柱与显性五行统计（按出生地当地标准时间，不作真太阳时修正）、按康熙笔画尾数五行的基础取名匹配、普通话高风险连读初筛、公安同名查询与百度公众人物查询跳转。

当前已收录 125 条可回溯原文的候选语料：诗经 41 条、楚辞 22 条、唐诗 31 条、宋词 31 条。每条候选都保存篇章、原文和主题标签；生僻字、读音与笔画仍以页面中的提示为准。

## 语料扩展与审核

语料不直接从网页随机截字。`scripts/import-shijing.js` 会把带 MIT 许可的 `chinese-poetry/chinese-poetry`《诗经》JSON 生成带原句、篇章、来源哈希、初步主题标签的**待核验队列**。自动抽取结果不进入当前线上推荐库，也不标记为“已核验”；审核通过后才合并到 `data/expanded-corpus.json`。

下载源文件后执行：`npm run corpus:import:shijing -- <shijing.json 的绝对路径>`。唐诗、宋词的同类初筛可用：`npm run corpus:import:classics -- tang|song <json 的绝对路径>`。来源及许可登记在 `data/corpus-sources.json`。

扩充来源时，原文先缓存到被 Git 忽略的 `data-sources/`，绝不作为网页静态资源上传。现有两条本机导入管线：

- `npm run corpus:import:open-classics -- all <chinese-poetry 数据目录>`：儒家经典、楚辞、元曲、五代词、纳兰词、古文与小品。
- `npm run corpus:import:classical-corpus -- <corpus.jsonl>`：CC0 的十三经与史书/字书公开底座；仅生成待核验候选。
- `npm run corpus:import:early-chinese -- <ect-krp 目录>`：CC BY-SA 的先秦两汉古籍底座；当前覆盖老子、庄子、荀子、山海经等，正式发布需保留归属信息。

候选一律进入 `data/review-queue-*.json`（本机、Git 忽略），经审核通过并执行 `npm run corpus:publish` 后，才会写入正式库。

### 本地审核台

在本机运行 `npm start` 后，访问 `http://localhost:3000/review.html`。审核台会展示原句、出处、主题初标、现实使用搜索链接和公安同名查询入口；可将每条候选标记为通过、暂缓或拒绝，并可修改寓意说明、记录审核备注。审核台接口只允许回环地址访问，且审核页面不会部署到 Cloudflare。

首次编辑初审可使用 `npm run review:seed`。该命令遵循“通过从严、存疑暂缓”的原则：不覆盖人工决定，且将相邻截词、普通名词和语境不合适的记录拒绝；暂缓项应在审核台通过现实使用搜索和人工判断后再处理。

中国哲学书电子化计划仅作为篇章与出处的人工交叉核验来源，并遵守其 API 使用限制；维基文库只导入明确标明许可的原文，保留页面链接、署名与许可信息。具体登记见 `data/corpus-sources.json`。

选择“生成正式语料文件”后，会把通过记录写入 `data/approved-corpus.json`。检查该文件无误后提交、推送并运行 `npm run cf:deploy`，才会把新语料发布到公网。

未接入：全国同名人数的正式数据接口、当代公众人物结构化资料库、AI 偏好理解、真太阳时修正、粤语/吴语/闽南语/四川话完整读音词库。API 会明确返回相应状态，不展示虚假数字或未经字库验证的传统命名结论。

## Cloudflare 免费部署

项目同时保留本地 Node 服务和 Cloudflare Worker 版本。Worker 会提供同一组 `/api/*` 接口，静态页面与接口在同一个公网地址下运行，不需要 Render 或银行卡。

首次部署前执行 `npm install`，然后执行 `npm run cf:deploy` 并按终端提示登录 Cloudflare。部署完成后，终端会给出 `workers.dev` 公网地址。
