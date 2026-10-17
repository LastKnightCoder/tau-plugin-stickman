# 火柴人插件开发指南

使用 Node.js 24、pnpm 11.9.0。依赖公开 npm SDK 0.8.0，无需本地声明包或主项目源码。

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

产物为 `dist/taunote.stickman-0.1.1.zip`。构建仅依赖公开 npm 包，不引用宿主源码。构建成功不代表客户端验收完成。

## 实现位置

| 文件 | 职责 |
| --- | --- |
| src/index.tsx | 静态元素、创建工具、属性栏、存储依赖声明 |
| src/model/ | 姿态、人物笔画、普通与手绘图形 |
| src/element.tsx | 元素渲染、换姿态的几何调整、缩略图投影 |
| src/components/ | 创建前选姿态、人物属性和图形组件 |
| src/preferences.ts | 工作区形体/配色偏好读取与顺序写入 |
| src/styles.css | 随包发布的界面样式 |
| WHITEBOARD.md | 公共白板 SDK 契约 |

交互内核和通用属性控件由宿主提供。不要复制缩放、箭头连接、历史或笔触控件，不从宿主目录深引。人物未发布，新格式只使用 `taunote.stickman.figure` 与 `data`，不添加旧格式转换。

## 本地验收

在包含白板 SDK 实现的开发客户端中安装 ZIP、启用并完整重启。打开白板，从「扩展工具 → 人物」选择姿态后放置，检查换姿态、三种形体、配色、翻转、手绘、缩放与箭头连接，再检查撤销/重做、复制、保存重开、缩略图与图片导出。

切换工作区确认偏好各自保存；停用并重启后检查未知元素占位，重新启用后检查恢复。视觉效果由使用者验收。

`pnpm install:local` 只用于首次安装，目标已存在时拒绝覆盖；更新使用客户端的 ZIP 安装流程。不要将 dist 中历史计数器或方块验证包误当作当前插件。

## 仓库与发布

源码仓库：https://github.com/LastKnightCoder/tau-plugin-stickman 。`template` 远端仅用于读取模板，更新时按需挑选构建配置和文档，不自动合并覆盖人物代码。发布时提升版本、提交并构建，将 ZIP 上传到对应版本的 GitHub Release。
