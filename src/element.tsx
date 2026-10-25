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
import { readStickmanSketch } from "./commands";
import StickFigure from "./components/StickFigure";

export { elementType, toolId } from "./constants";
export type StickmanData = {
  pose: string;
  body: StickBody;
  tint: StickTint;
  flip: boolean;
};
export type StickmanElement = TypedBoardElement<StickmanData>;

export function Stickman({ element }: { element: StickmanElement }) {
  const appearance = useSketch({ ...element, sketch: readStickmanSketch(element) });
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
