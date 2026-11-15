# 贡献指南

所有改动通过 Pull Request 合入主分支。提交前先阅读 [`AGENTS.md`](AGENTS.md)；玩家体验审计按 [`docs/player-experience-audit.md`](docs/player-experience-audit.md) 执行，发布和目录规则见 [`docs/repository-management.md`](docs/repository-management.md)。参与讨论时遵守 [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)。安全问题按 [`SECURITY.md`](SECURITY.md) 私下报告，不要开公开 issue。

## 本地环境

需要 Node.js 22 和 npm。依赖由 `package-lock.json` 锁定，请使用 npm，不要换用其他包管理器提交另一份锁文件。

```powershell
npm ci
npm run dev
```

`npm run dev` 启动 Vite。浏览器打开终端里给出的本地地址即可。生产构建写入 `dist/`，预览用 `npm run preview`。

提交前的检查命令见下方「本地检查与合并门槛」。

## 分支与提交

- 从最新主分支创建短期分支，格式为 `codex/<type>-<short-name>`。`type` 使用 `feat`、`fix`、`docs`、`research`、`design` 或 `chore`。
- 每个提交只包含一个清楚的目的。提交说明遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/)：

  ```text
  <type>(<scope>): <简短说明>
  ```

  例如 `feat(story): 增加石巷追逐章节`、`docs(sources): 补充紫姑原典版本`。
- `type` 与分支类型相同。只改测试、持续集成或内部结构、且不改变玩家可见行为时，可以使用 `test`、`ci`、`refactor`。
- `scope` 用英文，优先对应改动区域：`story`、`ui`、`audio`、`three`、`novel`、`assets`、`sources`、`a11y`、`ci`。
- 说明使用简体中文，写结果。
- 不把无关格式化、生成物或个人配置混入功能提交；不要改写已共享主分支历史。

## 代码风格

风格以仓库里现有的 TypeScript 为准。仓库没有另加自动格式化工具。

- 玩家可见的文案用简体中文；标识符、文件名和类型名用英文。
- 源码是 ES module：使用 `import` / `export`，语句以分号结尾，字符串优先用单引号，缩进 2 个空格。
- TypeScript 保持 `tsconfig` 里的严格检查：`strict`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`。能写清类型时不要用 `any`。
- 回调签名里暂时用不到的参数，以 `_` 开头，例如 `_text`。
- React 使用函数组件。新界面放在 `src/components/`，故事数据放在 `src/data/` 或 `story/`。不要把一整章的逻辑继续堆进 `src/App.tsx`。
- 剧情只改 `story/` 里的 Ink 源，再运行导出。不要手改 `novel/` 或 `dist/`。
- `npm run lint` 检查 `src/`、`tests/` 以及 Vite、Playwright 配置里的 TypeScript。它启用 ESLint 推荐规则、typescript-eslint 推荐规则，以及 React Hooks 的调用规则和依赖数组检查。故事脚本仍由 `npm run story:validate` 覆盖。
- 新增运行时依赖要在 PR 里说明用途、体积或维护成本和许可证。

## Pull Request 内容

PR 说明必须包含：

1. 玩家可见的变化及涉及章节/组件。
2. 新增或更新内容的来源记录；图像、模型、音频等素材的提示词/来源/许可元数据位置。
3. 已执行的检查及结果。界面变更附 1440×900 与 390×844 截图；交互/声音变更附简短录屏或可复现步骤。
4. Cloudflare Pages 预览链接（若预览构建已启用）；未启用或失败时写明原因。
5. Ink 剧情变更说明小说导出是否同步；PR 不得留下导出差异。

仓库提供 [Pull Request 模板](.github/pull_request_template.md)。PR 应保持范围集中，明确兼容性或已知问题。不得在描述、截图或提交中暴露凭据、个人数据或未授权的第三方素材。

## 本地检查与合并门槛

React/Vite 架构落地后，仓库的 `package.json` 与 CI 必须提供对应的 `lint`、`typecheck`、`test`、故事来源/导出一致性校验和 `build` 脚本。PR 至少执行：

```powershell
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

若 PR 修改 Ink 源或小说导出，再运行仓库定义的故事校验与小说导出检查。若 PR 修改界面、3D、声音或输入，再完成体验审计中适用的桌面、手机、键盘、减少动态效果、静音和替代线索检查。PR 必须通过 CI、至少一名维护者审查，并解决所有阻断性意见后才能合并；主分支不得绕过这些门槛。

> 迁移完成前，仓库仍可能保留旧静态实现；此期间按 README 中可运行的流程检查。新增的 React/Vite 脚本应随应用迁移一并落地，不以缺少脚本为由伪称检查通过。
