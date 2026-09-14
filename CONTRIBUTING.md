# 贡献指南

所有改动通过 Pull Request 合入主分支。提交前先阅读 [`AGENTS.md`](AGENTS.md)；玩家体验审计按 [`docs/player-experience-audit.md`](docs/player-experience-audit.md) 执行，发布和目录规则见 [`docs/repository-management.md`](docs/repository-management.md)。

## 分支与提交

- 从最新主分支创建短期分支，格式为 `codex/<type>-<short-name>`。`type` 使用 `feat`、`fix`、`docs`、`research`、`design` 或 `chore`。
- 每个提交只包含一个清楚的目的，格式为 `<type>(<scope>): <简短说明>`，例如 `feat(story): 增加石巷追逐章节`、`docs(sources): 补充紫姑原典版本`。
- 不把无关格式化、生成物或个人配置混入功能提交；不要改写已共享主分支历史。

## Pull Request 内容

PR 说明必须包含：

1. 玩家可见的变化及涉及章节/组件。
2. 新增或更新内容的来源记录；图像、模型、音频等素材的提示词/来源/许可元数据位置。
3. 已执行的检查及结果。界面变更附 1440×900 与 390×844 截图；交互/声音变更附简短录屏或可复现步骤。
4. Cloudflare Pages 预览链接（若预览构建已启用）；未启用或失败时写明原因。
5. Ink 剧情变更说明小说导出是否同步；PR 不得留下导出差异。

PR 应保持范围集中，明确兼容性或已知问题。不得在描述、截图或提交中暴露凭据、个人数据或未授权的第三方素材。

## 本地检查与合并门槛

React/Vite 架构落地后，仓库的 `package.json` 与 CI 必须提供对应的 `typecheck`、`test`、故事来源/导出一致性校验和 `build` 脚本。PR 至少执行：

```powershell
npm ci
npm run typecheck
npm run test
npm run build
```

若 PR 修改 Ink 源或小说导出，再运行仓库定义的故事校验与小说导出检查。若 PR 修改界面、3D、声音或输入，再完成体验审计中适用的桌面、手机、键盘、减少动态效果、静音和替代线索检查。PR 必须通过 CI、至少一名维护者审查，并解决所有阻断性意见后才能合并；主分支不得绕过这些门槛。

> 迁移完成前，仓库仍可能保留旧静态实现；此期间按 README 中可运行的流程检查。新增的 React/Vite 脚本应随应用迁移一并落地，不以缺少脚本为由伪称检查通过。
