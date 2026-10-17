import {
  useSketch,
  type TypedBoardElement,
  type SchematicShape,
} from "@tau/plugins/whiteboard";
import {
  buildStickStrokes,
  getStickPose,
  stickNaturalSize,
  stickViewBox,
  type StickBody,
  type StickTint,
} from "./model";
import { STICK_PADDING } from "./constants";
import StickFigure from "./components/StickFigure";

export const elementType = "taunote.stickman.figure";
export const toolId = "taunote.stickman.create";
export type StickmanData = {
  pose: string;
  body: StickBody;
  tint: StickTint;
  flip: boolean;
};
export type StickmanElement = TypedBoardElement<StickmanData>;

export function Stickman({ element }: { element: StickmanElement }) {
  const appearance = useSketch(element);
  const pose = getStickPose(element.data.pose);
  if (!pose) return null;
  return (
    <svg
      data-stickman={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      viewBox={stickViewBox(pose)}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: "visible" }}
    >
      <StickFigure
        pose={pose}
        body={element.data.body}
        tint={element.data.tint}
        flip={element.data.flip}
        sketch={appearance}
      />
    </svg>
  );
}

export function repose(element: StickmanElement, key: string): StickmanElement {
  const next = getStickPose(key);
  const previous = getStickPose(element.data.pose);
  if (!next || !previous) return element;
  const scale = element.width / stickNaturalSize(previous)[0];
  const [w, h] = stickNaturalSize(next);
  const width = w * scale,
    height = h * scale;
  return {
    ...element,
    x: element.x + (element.width - width) / 2,
    y: element.y + element.height - height,
    width,
    height,
    data: { ...element.data, pose: key },
  };
}

export function schematic(element: StickmanElement): SchematicShape[] {
  const pose = getStickPose(element.data.pose);
  if (!pose) return [];
  const [w, h] = stickNaturalSize(pose);
  const shapes: SchematicShape[] = [];
  for (const stroke of buildStickStrokes(pose, {
    ...element.data,
    tint: "mono",
  })) {
    if (stroke.kind === "text") continue;
    const solid = stroke.kind === "shape" && stroke.fill === "ink";
    shapes.push({
      kind: "path",
      d:
        "M" +
        stroke.points
          .map(
            ([x, y]) =>
              `${((x + STICK_PADDING) / w).toFixed(4)} ${((y + STICK_PADDING) / h).toFixed(4)}`,
          )
          .join(" L") +
        (stroke.kind === "shape" ? " Z" : ""),
      fill: solid ? "var(--tau-ink-1)" : undefined,
      stroke: solid ? undefined : "var(--tau-ink-1)",
      strokeWidth: 1,
      box: { x: element.x, y: element.y, w: element.width, h: element.height },
    });
  }
  return shapes;
}
