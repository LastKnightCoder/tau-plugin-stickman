import { definePlugin } from "@tau/plugins";
import { defineElement, defineWhiteboardExtension, useSketch, sketch, SketchPaths, type TypedBoardElement } from "@tau/plugins/whiteboard";
import { Button } from "@tau/ui";

declare const __PLUGIN_META__: { id: string; name: string; version: string };
type Data = { label: string };
const type = "example.whiteboard-probe.box";

function ToolIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor"><rect x={3} y={5} width={18} height={14} rx={2} /></svg>;
}

function Box({ element }: { element: TypedBoardElement<Data> }) {
  const appearance = useSketch(element);
  const random = sketch.createRandom(appearance.seed);
  const points: [number, number][] = [[element.x, element.y], [element.x + element.width, element.y], [element.x + element.width, element.y + element.height], [element.x, element.y + element.height], [element.x, element.y]];
  return <g data-whiteboard-probe={element.id} data-probe-sketch={String(appearance.enabled)}>
    {appearance.enabled ? <SketchPaths paths={[{ role: "ink", d: sketch.inkOutline(sketch.wobble(sketch.resample(points, 4), 1, random), 2, random), color: "var(--tau-ink-1)" }]} /> : <rect x={element.x} y={element.y} width={element.width} height={element.height}
      fill="var(--tau-surface)" stroke="var(--tau-ink-1)" />}
    <text x={element.x + 12} y={element.y + 30} fill="var(--tau-ink-1)">{element.data.label}</text>
  </g>;
}

const extension = defineWhiteboardExtension({
  id: "example.whiteboard-probe",
  name: "白板接入验证",
  elements: [defineElement<Data>({
    type, render: Box, schemaVersion: 1,
    interaction: { resize: { handles: "corners", preserveAspectRatio: true }, connect: "rect" },
    sketch: true,
    presentation: { label: "验证方块", icon: ToolIcon, getName: element => element.data.label },
    schematic: element => [{ kind: "rect", x: element.x, y: element.y, w: element.width, h: element.height, r: 3, fill: "var(--tau-accent)" }],
    schema: { "~standard": { version: 1, vendor: "whiteboard-probe", validate(value: unknown) {
      if (value && typeof value === "object" && "label" in value && typeof value.label === "string")
        return { value: { label: value.label } };
      return { issues: [{ message: "label 必须是文本" }] };
    } } },
    create: { gesture: "click", defaultSize: [180, 90], after: "select", build: ({ rect }) => ({
      id: crypto.randomUUID(), type, schemaVersion: 1, ...rect, data: { label: "白板插件" },
    }) },
  })],
  create: api => ({
    tools: [{ id: "example.whiteboard-probe.create", element: type, label: "验证方块", icon: ToolIcon, order: 90, group: "drawing" }],
    inspectors: { [type]: ({ element }: { element: TypedBoardElement<Data> }) =>
      <Button onClick={() => api.updateElement(element.id, { data: { label: "已编辑" } })}>修改验证文字</Button> },
  }),
});

export default definePlugin({ ...__PLUGIN_META__, whiteboardExtensions: [extension] });
