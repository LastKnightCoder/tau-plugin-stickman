# 白板插件

本文使用 SDK 0.45.0 的白板契约；具体依赖与宿主边界见 [COMPATIBILITY.md](COMPATIBILITY.md)。

插件定义中声明 `whiteboardExtensions`，manifest 只声明支持平台与最低客户端版本。使用 `@tau/plugins/whiteboard` 导入定义函数和类型，并将该模块保留为构建 external，由宿主提供实现。一个 main.js 同时包含声明、渲染与交互，不生成另一个渲染入口。

```tsx
import { definePlugin } from "@tau/plugins";
import { defineElement, defineWhiteboardExtension } from "@tau/plugins/whiteboard";

declare const __PLUGIN_META__: { id: string; name: string; version: string };
const type = `${__PLUGIN_META__.id}.box`;
const extension = defineWhiteboardExtension({
  id: __PLUGIN_META__.id,
  elements: [
    defineElement({
      type,
      dataVersion: 1,
      render: ({ element }) => (
        <rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          fill="var(--tau-accent)"
        />
      ),
      create: {
        gesture: "click",
        defaultSize: [160, 90],
        after: "select",
        build: ({ rect }) => ({ id: crypto.randomUUID(), type, ...rect, data: {} }),
      },
    }),
  ],
  create: () => ({
    tools: [
      {
        id: `${__PLUGIN_META__.id}.create`,
        element: type,
        label: "插入方块",
        order: 90,
        group: "drawing",
        icon: () => (
          <svg viewBox="0 0 24 24">
            <rect x={3} y={5} width={18} height={14} fill="currentColor" />
          </svg>
        ),
      },
    ],
  }),
});
export default definePlugin({ ...__PLUGIN_META__, whiteboardExtensions: [extension] });
```

## 契约

- `elements` 在扩展顶层静态声明，禁止放到 `create` 返回值中。元素类型必须以完整插件 ID 加点开头，扩展 ID 为插件 ID 或其子命名空间。
- `create(api)` 每个画布单独执行，返回 `tools`、`inspectors`、`commands` 等交互贡献。状态放在实例闭包，不能放在模块顶层跨画布共享。
- 元素私有字段放在 `data`，通过 `defineElement<TData>` 和同步 Standard Schema 校验约束。render/create 回调仍使用平铺几何；api.getElement/getSnapshot 的只读投影使用 geometry，不能混用。
- 普通字段走 `api.updateElementData(id, patch)`，外壳走 `api.updateElement(id, { geometry, style })`，结构及组合修改走 `api.submit` 的身份命令；不使用路径操作或 apply，不回写整份旧元素。所有入口共用宿主只读、历史及生命周期。
- 新声明使用 dataVersion，历史版本只能显式登记精确契约；不混用 schemaVersion/migrate，不在加载时迁移。
- 元素组件可用 `useWhiteboardAPI()` 获取所属扩展的受控 API，不接触内部 Board。声明求值阶段不得读取 DOM。
- `activate` 随画布显示运行，停驻会清理；`dispose` 在真正销毁时运行。插件整体启用/停用/更新在重启后改变静态装配，不热替换打开中的画布。
- 找不到插件时保留节点并显示占位，重新装配匹配的精确契约后恢复。旧 schemaVersion 快照另走显式转换，不能保证仅安装插件即可编辑；保存、复制不能丢弃未知节点。

## 通用展示与交互

### 创建前选择参数

第三方工具集中在「扩展工具」菜单；可选的 `panel` 让用户先选择参数，再调用 `run(payload)`。面板可以通过 `useWhiteboardAPI()` 获取所属扩展的 API。

```tsx
panel: ({ run }) => (
  <button onClick={() => run({ label: "新方块" })}>创建新方块</button>
),
```

创建工具在 `element.create.build` 的 `options` 中读取这些参数，命令工具在命令的 `payload` 中读取。宿主管理返回、关闭与面板卸载，执行后自动关闭；返回或关闭不会执行工具。关闭后的迟到 `run` 调用被忽略。面板抛错时显示错误并保留返回入口。没有 `panel` 的工具仍点击即执行；不要用只供内置工具栏使用的 `component` 代替它，也不要在面板内创建第二套画布指针监听。

### 元素声明

以下声明放在 `defineElement` 内，仍使用同一个插件入口：

```ts
interaction: {
  resize: { handles: "corners", preserveAspectRatio: true },
  connect: "rect",
},
presentation: {
  label: "我的图形",
  getName: element => element.data.label,
},
sketch: true,
schematic: element => [{
  kind: "rect", x: element.x, y: element.y,
  w: element.width, h: element.height, r: 3, fill: "var(--tau-accent)",
}],
```

- `resize.handles` 可选 corners 或 all，默认 all；`preserveAspectRatio` 默认为 false，Shift 仍可启用等比。内核生成手柄，负责吸附、单步撤销、取消和生命周期，不要再给元素额外画一套缩放手柄。
- `connect: "rect"` 使用矩形连接点，包括相对位置绑定；不声明则不生成连接控件。
- `presentation.icon` 为可选图标组件，接收 className、size、strokeWidth。`getName` 接收只读快照，手动 name 优先；无法生成时回退 label。
- 声明 `sketch:true` 后，在元素组件调用 `useSketch(element)` 获取 enabled/level/seed；页面切换会更新组件，元素覆盖仍由宿主解析。不要自行维护全局画风状态。
- `SketchPaths` 渲染已有手绘路径；`sketch` 命名空间提供 createRandom、distance、polylineToD、resample、wobble、inkOutline、inkSize、loopStroke、handTextClass。复用宿主纯算法，不从白板内部目录复制实现。
- `usePageSketch()` 读取所属页面的画风；`sketch.hashSeed(text)` 为预览图生成稳定种子。`AttrPopover`、`AttrToggle`、`OptionGrid`、`Seg` 供属性面板使用，`SketchPopover` 提供与宿主相同的元素笔触设置。
- `schematic(element, { dark })` 返回纯图元数组，用于列表与导出弹窗的简略预览；字段类型见 SchematicShape。不能调用 hook、修改元素或依赖某个画布已打开。实际图像导出仍使用完整画布渲染，不使用简略投影替代。

火柴人的 `SketchPopover` 保持原控件，只将用户实际修改的笔触项提交到 style 对应字段；渲染从这些字段还原 ElementSketch 后交给 useSketch。不要把整个属性栏的旧元素传回宿主，以免覆盖远端更新。

构建 Tailwind 工具类时可导入 `@tau/plugins/tailwind.css`，其中仅包含语义类名映射，主题变量由客户端提供。不要引入未公开的宿主主题包。

## 私有偏好

需要记住用户选择时，通过 `api.getService(IPluginStorage)` 获取存储。`IPluginStorage` 从 `@tau/plugins/whiteboard` 导入，接口与 `PluginContext.storage` 相同：异步 `get(key)`、`set(key, JSON值)`、`delete(key)`。

宿主按插件真实归属与当前工作区绑定存储，插件不能传入其他插件 ID。画布隐藏、关闭或只读时拒绝交互存储操作；插件失活、工作区切换后，旧实例也不能继续写入。异步读写应捕获错误，并在面板卸载后忽略迟到结果。重新打开白板后绑定当前激活实例。

只在 `create(api)`、工具面板、属性交互和 `element.create.build` 中使用这项服务。静态渲染与 `schematic` 必须只依据元素数据及明确输入，不依赖存储、DOM 或插件 activate 时序。读取不存在的偏好时使用默认值；读取失败不能伪装成空数据后覆盖原值。
