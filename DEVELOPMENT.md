# 火柴人插件开发指南

当前依赖、平台边界与验证步骤见 [兼容性说明](COMPATIBILITY.md)。

## 自动发布

本仓库的.github/workflows/release.yml与公开模板一致。同步更新package.json和manifest.json版本并提交后，推送对应版本tag即可自动安装依赖、运行测试（若定义）、构建并将ZIP上传到GitHub Release，无需手动上传或配置额外Token。

```sh
version=$(node -p "require('./manifest.json').version")
git tag "v$version"
git push origin HEAD
git push origin "v$version"
```

tag也可不带v前缀，版本必须与两个文件一致；预发布版本自动标记为Pre-release。Actions失败可重跑，已有Release会更新同名ZIP。已发布版本不要移动tag，代码修复应提高版本再发布。仓库需启用Actions并允许contents:write。Git远程统一使用SSH；该流程通过 OIDC 提交插件中心，沿用作者身份与仓库绑定规则；不发布客户端。

使用 Node.js 24、pnpm 11.9.0。使用 SDK 0.45.0 的正式依赖，按 [兼容性说明](COMPATIBILITY.md) 完成验证后，在获得发布授权时执行上述发布流程。

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

在仓库外使用正式锁文件执行冻结安装、类型检查、测试与构建，生成 `taunote.stickman-0.1.11.zip`；再用该实际产物运行主仓库 scripts/plugins/stickman 中的组合测试。插件功能代码不引用宿主源码；组合测试由主仓库提供宿主。构建成功不代表客户端验收完成。

## 实现位置

| 文件 | 职责 |
| --- | --- |
| src/index.tsx | 静态元素、创建工具、属性栏、存储依赖声明 |
| src/model/ | 姿态、人物笔画、普通与手绘图形 |
| src/element.tsx | 元素渲染、笔触投影、缩略图投影 |
| src/commands.ts | 按稳定身份提交属性、姿态与笔触，复用宿主历史 |
| src/components/ | 创建前选姿态、人物属性和图形组件 |
| src/preferences.ts | 工作区形体/配色偏好读取与顺序写入 |
| src/styles.css | 随包发布的界面样式 |
| WHITEBOARD.md | 公共白板 SDK 契约 |

交互内核和通用属性控件由宿主提供。不要复制缩放、箭头连接、历史或笔触控件，不从宿主目录深引。人物节点继续使用 `taunote.stickman.figure` 与 `data`；旧快照边界见 COMPATIBILITY.md，不添加插件加载时自动转换。

## 本地验收

在包含白板 SDK 实现的开发客户端中安装 ZIP、启用并完整重启。打开白板，从「扩展工具 → 人物」选择姿态后放置，检查换姿态、三种形体、配色、翻转、手绘、缩放与箭头连接，再检查撤销/重做、复制、保存重开、缩略图与图片导出。

切换工作区确认偏好各自保存；停用并重启后检查未知元素占位，重新启用后检查恢复。视觉效果由使用者验收。

`pnpm install:local` 只用于首次安装，目标已存在时拒绝覆盖；更新使用客户端的 ZIP 安装流程。不要将 dist 中历史计数器或方块验证包误当作当前插件。

## 仓库与发布

源码仓库：https://github.com/LastKnightCoder/tau-plugin-stickman 。`template` 远端仅用于读取模板，更新时按需挑选构建配置和文档，不自动合并覆盖人物代码。发布时提升版本、提交并推送版本标签，由上述工作流生成 Release 和 ZIP。
