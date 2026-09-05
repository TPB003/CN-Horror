# CN-Horror · 归灯

一款中式民俗悬疑互动短篇。提灯走进槐安客栈，阅读旧家书，寻找线索，解开门环，在最后的选择中迎来不同结局。

## 内容与交互

- 三段剧情：入巷、叩门、归灯。
- 两张原创场景图片：古巷外景与客栈内堂。
- 物品探索、线索手记与解谜提示。
- 三次叩门、三字门环与两个结局。
- 可手动开关的环境音与叩门音效。
- 手机与桌面响应式布局，支持键盘操作与减少动态效果设置。

## 本地运行

项目使用原生 HTML、CSS 和 JavaScript，无需安装 npm 依赖或执行构建。

安装 Python 3 后，在仓库根目录执行：

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Windows 可以使用：

```powershell
py -m http.server 8000 --bind 127.0.0.1 --directory dist
```

然后打开 <http://127.0.0.1:8000>。请通过 HTTP 服务访问，页面使用以 `/` 开头的资源路径，直接双击 HTML 文件无法完整加载。

## 文件说明

| 文件 | 用途 |
| --- | --- |
| `dist/index.html` | 页面结构、主界面、探索界面、结局与对话框 |
| `dist/style.css` | 字体、配色、布局、动效与响应式样式 |
| `dist/game.js` | 剧情状态、物品线索、谜题、结局和 Web Audio 音效 |
| `dist/assets/inn-exterior.webp` | 古巷与客栈外景 |
| `dist/assets/inn-interior.webp` | 客栈内堂场景 |
| `dist/assets/favicon.svg` | 网站图标 |
| `dist/assets/grain.svg` | 画面颗粒纹理 |

`dist` 目录中的文件就是可直接编辑的源文件，需要纳入版本管理。

## 修改内容

- 修改文案、线索与谜题：编辑 `dist/game.js` 中的 `clueData`、`phases` 和相关交互函数。
- 修改主界面文字与结构：编辑 `dist/index.html`。
- 修改视觉风格与手机布局：编辑 `dist/style.css`。
- 替换场景：更换 `dist/assets` 中对应的 WebP 图片，并根据物体位置调整探索标记。

## 部署

将 `dist` 作为静态网站的发布目录，入口为 `index.html`，无需服务端或数据库。

资源路径目前以域名根目录为基准。部署到 `https://example.com/` 可以直接使用；部署到 GitHub Pages 的项目子目录等路径时，需要先统一调整 HTML、CSS 和 JavaScript 的资源路径，或使用指向根目录的自定义域名。

## 当前行为

- 所有剧情状态只保存在当前页面内存中。返回序章可以继续，刷新页面会重新开始。
- 环境音默认关闭，点击右上角按钮后开启；声音不影响解谜。
- 音效由浏览器 Web Audio API 生成，不需要外部音频文件。
- 支持 Web Audio 的现代浏览器可以播放音效；无法播放时仍可阅读和解谜。
- 目前没有接入账号系统、云端存档或访问统计。

## 已执行的检查

- JavaScript 语法检查。
- 本地静态资源完整性检查。
- HTML 元素 ID 唯一性与 JavaScript 引用检查。
- 部署包入口和图片完整性检查。

以上不包含浏览器端到端测试。

## 内容说明

剧情、人物与民俗规则均为虚构。两张场景图为本项目生成的原创视觉素材。
