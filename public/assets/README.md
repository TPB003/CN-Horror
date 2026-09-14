# 运行时视觉素材

`scenes/` 与 `props/` 下的 WebP 图片由项目团队使用 OpenAI ImageGen 按本项目提示词原创生成，再由 `ffmpeg` 缩放、压缩；对应未压缩源图保存在 `design/generated-source/`。它们是剧情概念素材，不是连云老街的实景照片、文物复原或史料图证，不可用来证明现实建筑、人物或仪式。

所有标识、正文、客簿字迹、地图标题、谜题控件和交互状态由 React 代码绘制。图中若出现不可读的生成性字形，一律以网页文案、来源登记和交互数据为准。

本地运行素材仅使用 `/assets/scenes/*.webp` 与 `/assets/props/*.webp`。生成母版和独立设计参考图以高质量 WebP 保存在 `design/`，避免线上下载重复的大型源图。

## 重点场景素材

| 站点 | 运行时场景 | 用途与来源记录 |
| --- | --- | --- |
| 05 石街红白队伍 | `scenes/05-red-white-procession-v2.webp` | AI 生成的虚构气氛背景；对应 WebP 母版位于 `design/generated-source/scenes/`，复现提示词和视觉限制见 [`design/scene-asset-prompts.md`](../../design/scene-asset-prompts.md)。 |
| 07 湿石阶追逐 | `scenes/07-pursuit-stone-alley-v2.webp` | AI 生成的虚构气氛背景；对应 WebP 母版位于 `design/generated-source/scenes/`，复现提示词和视觉限制见 [`design/scene-asset-prompts.md`](../../design/scene-asset-prompts.md)。 |

其余运行时场景与道具由 `App.tsx` 按章节映射至 `scenes/` 和 `props/`。新增、替换或改名时，请同步更新素材登记与页面映射；原始图像不直接从 `public/` 提供。
