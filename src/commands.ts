import type { ElementSketch, WhiteboardAPI, WhiteboardData } from "@tau/plugins/whiteboard";
import { elementType } from "./constants";
import { getStickPose, stickNaturalSize } from "./model/poses";
import type { StickBody, StickTint } from "./model/types";

const sketchFields = { mode: "sketchMode", level: "sketchLevel", seed: "sketchSeed" } as const;

export function readStickmanSketch(element: {
  id: string;
  style?: Readonly<Record<string, unknown>>;
}): ElementSketch {
  const style = element.style ?? {};
  return {
    ...(style.sketchMode === "normal" || style.sketchMode === "sketch"
      ? { mode: style.sketchMode }
      : {}),
    ...(["neat", "natural", "loose"].includes(String(style.sketchLevel))
      ? { level: style.sketchLevel as ElementSketch["level"] }
      : {}),
    ...(typeof style.sketchSeed === "number" && Number.isSafeInteger(style.sketchSeed)
      ? { seed: style.sketchSeed }
      : {}),
  };
}

export function createStickmanCommands(api: WhiteboardAPI) {
  return {
    data(id: string, patch: Partial<{ body: StickBody; tint: StickTint; flip: boolean }>) {
      return api.updateElementData(id, patch);
    },
    pose(id: string, key: string) {
      const element = api.getElement(id);
      if (!element || element.type !== elementType || element.data.pose === key) return false;
      const previous = getStickPose(String(element.data.pose));
      const next = getStickPose(key);
      if (!previous || !next) return false;
      const geometry = element.geometry;
      const scale = geometry.width / stickNaturalSize(previous)[0];
      const [naturalWidth, naturalHeight] = stickNaturalSize(next);
      const width = naturalWidth * scale;
      const height = naturalHeight * scale;
      // 按当前投影计算几何，姿态与尺寸合成同一条宿主历史。
      api.submit([
        {
          type: "set_node",
          id,
          patch: {
            geometry: {
              ...geometry,
              x: geometry.x + (geometry.width - width) / 2,
              y: geometry.y + geometry.height - height,
              width,
              height,
            },
          },
        },
        { type: "set_data", id, patch: { pose: key } },
      ]);
      return true;
    },
    sketch(id: string, before: ElementSketch, after: ElementSketch = {}) {
      const patch: Record<string, WhiteboardData[string]> = {};
      for (const key of Object.keys(sketchFields) as (keyof ElementSketch)[]) {
        if (before[key] !== after[key]) patch[sketchFields[key]] = after[key] ?? null;
      }
      return Object.keys(patch).length > 0 && api.updateElement(id, { style: patch });
    },
  };
}

export type StickmanCommands = ReturnType<typeof createStickmanCommands>;
