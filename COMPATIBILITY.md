# 兼容性与开发验证

使用正式 SDK 0.45.0、UI 0.5.0，最低桌面版本为 0.59.5，使用格式 3 且仅声明 desktop。依赖按真实 npm 锁文件安装；SDK 与插件发布不会升级用户客户端，旧客户端由最低版本门禁阻止加载。

## 数据与历史

- 插件 ID `taunote.stickman`、元素 type `taunote.stickman.figure` 和 pose/body/tint/flip 字段保持不变。新契约 `dataVersion: 1`；pose 是姿态枚举，不是可协作编辑文本，故 textFields 与 resources 均为空。
- 属性提交只改所选字段；换姿态读取当前几何，数据和尺寸一次提交、一次撤销。笔触 mode/level/seed 分别保存在 style.sketchMode/sketchLevel/sketchSeed，null 表示删除该覆盖、跟随页面；不同字段并发修改互不覆盖，单字段依宿主冲突规则。
- 新模型已有未知字段与未安装插件载荷保留；重新装配只按精确契约摘要恢复编辑。数据版本相同不意味着任何旧格式可直接使用。
- 旧 schemaVersion 快照不属于新 dataVersion 历史契约。现有显式转换会把无法识别的旧人物原载荷保留为占位；本插件不添加自动转换或恢复包，也不承诺旧快照人物安装后自动变为可编辑。
- 样式偏好仍为工作区私有存储，不同步进文档、不进入文档撤销；偏好读取失败不创建人物，失活后的迟到创建不提交。

## 平台边界

依赖白板静态元素、创建工具、属性栏、几何交互与偏好协议；白板作者扩展不属于移动格式 3 支持范围。

跨端能力以[官方 API 支持矩阵](https://github.com/LastKnightCoder/tau-plugin-template/blob/main/docs/api-support.md)为准。未来适配仍使用同一插件 ID 与更高版本，节点 type 和历史数据保持兼容；不生成另一个 Android 专用插件。

## 验证与发布

1. 执行 `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm build`，验证正式 SDK 依赖、命令与偏好，并生成完整 ZIP。
2. 使用实际 ZIP 在 Tau 宿主和本地协作服务验证并发修改、撤销、只读、未知字段与重连。主仓库的组合测试位于 scripts/plugins/stickman，验证网络仅使用回环测试服务。
3. 发布需用户明确授权；同步 package.json 与 manifest.json 版本，推送同名版本标签后由 GitHub Actions 发布并提交插件中心。已发布标签不移动、旧包不覆盖。
4. 自动化测试与构建不替代目标设备的启用、保存重开和实际交互验收；旧快照仍按上述保真边界处理。
