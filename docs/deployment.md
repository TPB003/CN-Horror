# Cloudflare Pages 部署

本项目是 React + TypeScript + Vite 静态应用。Cloudflare Pages 从仓库执行 `npm run build`，并发布 `dist/`。项目使用 Pages 的 Git 集成：推送到生产分支会更新正式站点，Pull Request 会得到独立预览部署。GitHub Actions 只负责检查，不上传或发布站点。

## 首次创建 Pages 项目

1. 在 Cloudflare 控制台打开 **Workers & Pages**，选择 **Create application → Pages → Connect to Git**。
2. 授权并选择 GitHub 仓库 `TPB003/CN-Horror`。若仓库不在授权列表中，在 GitHub 应用权限中允许 Cloudflare 访问该仓库。
3. 设置构建参数：

   | 设置 | 值 |
   | --- | --- |
   | Framework preset | `Vite`（若未识别，选 `None`） |
   | Production branch | `main` |
   | Root directory | `/`（仓库根目录） |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

4. 在 **Settings → Builds & deployments → Build system version** 选择 Build System V2；在 **Settings → Environment variables** 为 Production 和 Preview 均设 `NODE_VERSION=22.16.0`。这与 CI 的 Node.js 22 版本一致，并满足 Vite 7 的运行要求。
5. 保持非生产分支的 Preview deployments 开启，检查生产分支为 `main`，然后选择 **Save and Deploy**。

首个部署完成后，Pages 会提供 `<项目名>.pages.dev` 地址。若以后添加自有域名，在 Pages 项目的 **Custom domains** 中配置，无需改应用代码。

## Pull Request 预览

Cloudflare Pages 与 GitHub 连接后，会为仓库内部发起的 Pull Request 自动创建 Preview URL；后续提交会更新同一个预览。审查者先确认 GitHub Actions 的 `CI / Verify app, story, and production build` 通过，再从 PR 的 Cloudflare 部署状态打开预览，检查故事入口、主要资源和移动端布局。合并到 `main` 后，Pages 自动发布正式部署。

GitHub Actions 的 CI 依次安装锁定依赖、运行类型检查、验证故事来源、从 Ink 导出小说并确认 `novel/` 没有未提交差异，最后执行生产构建。若改动剧情，提交前运行：

```powershell
npm run story:validate
npm run story:export
npm run build
```

若导出导致 `novel/` 变化，应将同步后的小说与 Ink 源一起提交。

## 路由、环境变量与权限

当前应用通过单页入口运行，不依赖额外的服务器端路由；Cloudflare Pages 在没有顶层 `404.html` 时会将未匹配路径回退到 SPA 入口，因此目前不需要 `_redirects`、Wrangler 配置或 Pages Functions。未来若增加真实路径路由，再补充并验证对应的回退规则。

当前前端不要求运行时密钥或服务端环境变量。除 `NODE_VERSION` 外，不要为了部署添加 Cloudflare token、账户 ID 或 GitHub secret。Pages 项目创建、仓库授权、生产分支与域名属于 Cloudflare/GitHub 账户设置，由有权限的维护者完成；不要把凭据写进仓库。

## 官方说明

- [Cloudflare Pages：部署 Vite 项目](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/)
- [Cloudflare Pages：构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Pages：构建镜像与 Node.js 版本](https://developers.cloudflare.com/pages/configuration/build-image/)
- [Cloudflare Pages：预览部署](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [Cloudflare Pages：SPA 与静态资源路由](https://developers.cloudflare.com/pages/configuration/serving-pages/)
