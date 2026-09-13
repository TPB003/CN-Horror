# 《归灯》：连云老街异闻

《归灯》是一款 React + TypeScript + Vite 互动恐怖故事应用。玩家在一夜之间沿着连云港老街的十二个剧情站点查明一桩“错名与归魂”的旧案。每个站点占据一个完整画面；章节通过按钮、键盘或街区路线模型切换，不靠页面滚轮浏览。

故事、声音、线索和三维路线共同构成体验。沈归收到母亲沈映禾留下的信后回到老街，追查2006年暴雨夜的错名旧案：红衣新娘顾秋禾与港口捞起的无名尸体陆守成随两支队伍在石巷相遇，雨水冲淡客簿上的姓名；八岁的沈归落水，沈映禾救他上岸后被潮水带走。她以自己的姓名登记，并写下“带沈归归家”的去向，梁叔却把水痕里残存的“沈｜归家”误抄成“沈归”。笔仙、僵尸、红白队影和黑白无常将这场家庭悲剧转成逐站调查与恐怖体验。结尾沈归可以写回三人的姓名与去向、点灯送母亲离开，也可以在母亲离开后接过黄灯守巷。真实街区资料只用于地理与文化背景；人物、客簿和灵异因果均为虚构。

## 体验功能

- 十二个全屏站点，含剧情推进、场景探索、线索手记、章节路线、史料来源卡和双结局。
- Three.js 交互式街区模型支持拖动旋转、滚轮缩放与十二个可点热点；另有路线清单和 WebGL 不可用时的文字入口。
- 街区沙盘当前由 Three.js 程序化生成：坡地、沿路转向的石屋、分段石阶、临港水面和十二个故事节点。它用于表达连云老街的山海石街气质与剧情路线，不是实测地图或数字孪生。
- InkJS 保存分支剧情；`story/main.ink` 是网站与小说共用的剧情源。
- 原创 Web Audio 程序声景在玩家点击“举灯入巷”后才启动，提供环境底噪、动作提示、静音和音量控制；关键听声信息也有文字提示。
- 本地保存章节、选择、谜题和线索。支持键盘章节导航、地图/手记快捷键、移动屏幕和减少动态效果偏好。
- 故事资料卡区分典籍、地方实践、作品分析和本作转译，并为每站登记来源与适用边界。

## 本地开发与构建

需要 Node.js 22 和 npm。首次运行及启动开发服务器：

```powershell
npm ci
npm run dev
```

执行质量检查和生产构建：

```powershell
npm run typecheck
npm test
npm run story:validate
npm run story:export
npm run test:e2e
npm run build
npm run preview
```

Vite 会把可部署文件写入 `dist/`。剧情有更新时，先运行 `npm run story:validate` 与 `npm run story:export`，再检查小说是否同步，并运行构建。

## 目录结构

| 目录 / 文件 | 内容 |
| --- | --- |
| `src/` | React 应用、故事运行时、音频、Three.js 场景和可复用 UI 组件 |
| `story/` | Ink 原始故事、来源登记、构建/验证/小说导出脚本 |
| `novel/` | 从 Ink 主线和结局生成的小说版 |
| `public/story/` | 供浏览器读取的 Ink 编译文件与章节资料 |
| `public/assets/` | 应用实际使用的场景图和线索物件 WebP |
| `design/references-v2/` | 十二张单独生成的横向页面参考图；不是连成长图 |
| `design/material-breakdown.md` | 逐站视觉结构及代码组件/独立素材拆解 |
| `design/component-reference-breakdown.md` | 十二个交互组件参考图与代码实现边界 |
| `design/components/` | 十二张单独的交互组件参考图 |
| `design/generated-source/` | 应用视觉素材的生成母版 |
| `design/scene-asset-prompts.md` | 第 05、07 站新场景素材、复现提示词与生成边界 |
| `docs/research/` | 老街地理与恐怖母题考据 |
| `docs/player-experience-audit.md` | 玩家体验与无障碍发版验收表 |
| `docs/architecture.md` | 故事编译、React/Three.js/InkJS 模块边界与部署数据流 |
| `docs/deployment.md` | Cloudflare Pages 构建与发布配置 |
| `AGENTS.md`, `CONTRIBUTING.md` | 项目规则、来源要求、分支与审查流程 |
| `dist/` | Vite 构建输出；不要直接手工编辑 |

## Cloudflare Pages

将仓库连接至 Cloudflare Pages，设置 Node.js 22、构建命令 `npm run build`、输出目录 `dist`。连接后，生产分支部署正式站点，Pull Request 获得预览部署。具体步骤、版本和验证流程见 [`docs/deployment.md`](docs/deployment.md)。项目无需数据库、账号、服务端密钥或 Pages Functions。

## 史实与创作边界

连云老街的石屋、石街、坡地与民国中西合璧街屋来自官方地点资料；页面中的路线模型是叙事模型，不是实测地图。故事以《聊斋志异·尸变》《西游记》第三回、当代请仙游戏研究及黑白无常的地域性研究说明创作来源，但不会把现代笔仙、红白双煞或影视僵尸规则伪装成古代统一民俗。所有图像是生成式概念素材，不作为现实街景、人物、器物或仪式的证据。
