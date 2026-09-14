# 归灯小说导出

`story/main.ink` 是剧情、选择与 prose 的唯一内容源。运行 `node story/compile.mjs` 会用 InkJS 编译并生成 `public/story/story.json`、`public/story/chapters.json` 和本目录的 `归灯.md`；`node story/export-novel.mjs` 只更新小说 Markdown。`node story/validate.mjs` 会检查 knot、来源 ID、Ink 编译以及生成文件是否同步。

前端按 `chapters.json` 的 `chapters` 与 `endings` 显示标签、线索、场景与来源；`startKnot` 固定为 `chapter_01`，来信和入巷剧情已并入第01站，不存在额外序章站点。每个章节对象含 `id`、`knot`、`title`、`subtitle`、`summary`、`prose`、`scene`、`weather`、`lantern`、`npc`、`interaction`、`clue`、`sourceIds`、`sources`、`regionTime`、`evidence`、`transposition` 和解析自 Ink choices 的 `choices`。Ink runtime 负责实际互动：最终站 `chapter_12` 中，改正客簿将 `record_corrected` 设为 `true` 并进入 `ending_release`，应声将 `answered_call` 设为 `true` 并进入 `ending_called`。Ink JSON 是执行剧情分支的依据。
