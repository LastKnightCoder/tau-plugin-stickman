import { definePlugin } from "@tau/plugins";
import "./styles.css";
import {
  defineElement,
  defineWhiteboardExtension,
  IPluginStorage,
} from "@tau/plugins/whiteboard";
import { PersonStanding } from "lucide-react";
import { DEFAULT_STICK_POSE } from "./constants";
import { getStickPose, stickNaturalSize } from "./model";
import {
  Stickman,
  elementType,
  toolId,
  schematic,
  type StickmanData,
  type StickmanElement,
} from "./element";
import { ToolPanel } from "./components/ToolPanel";
import { Inspector } from "./components/Inspector";
import { readStyle, createStyleWriter } from "./preferences";

declare const __PLUGIN_META__: { id: string; name: string; version: string };
const poseOf = (options: Readonly<Record<string, unknown>> | null) =>
  getStickPose(
    typeof options?.pose === "string" ? options.pose : DEFAULT_STICK_POSE,
  );

export const extension = defineWhiteboardExtension({
  id: "taunote.stickman",
  name: "火柴人",
  requires: [IPluginStorage],
  elements: [
    defineElement<StickmanData>({
      type: elementType,
      schemaVersion: 1,
      render: Stickman,
      schema: {
        "~standard": {
          version: 1,
          vendor: "taunote.stickman",
          validate(value: unknown) {
            if (
              value &&
              typeof value === "object" &&
              "pose" in value &&
              typeof value.pose === "string" &&
              getStickPose(value.pose) &&
              "body" in value &&
              (value.body === "classic" ||
                value.body === "bean" ||
                value.body === "glyph") &&
              "tint" in value &&
              (value.tint === "color" || value.tint === "mono") &&
              "flip" in value &&
              typeof value.flip === "boolean"
            )
              return {
                value: {
                  pose: value.pose,
                  body: value.body,
                  tint: value.tint,
                  flip: value.flip,
                },
              };
            return {
              issues: [{ message: "人物姿态、形体、着色或翻转字段无效" }],
            };
          },
        },
      },
      presentation: {
        label: "人物",
        icon: PersonStanding,
        getName: (element) => getStickPose(element.data.pose)?.name ?? "人物",
      },
      interaction: {
        resize: { handles: "corners", preserveAspectRatio: true },
        connect: "rect",
      },
      sketch: true,
      schematic,
      create: {
        gesture: "click",
        defaultSize: [132, 172],
        after: "select",
        hint: (options) => [`点击放置「${poseOf(options)?.name ?? "人物"}」`],
        async build({ rect, options, api }) {
          const pose = poseOf(options);
          if (!pose) return null;
          const style = await readStyle(api.getService(IPluginStorage));
          const [width, height] = stickNaturalSize(pose);
          return {
            id: crypto.randomUUID(),
            type: elementType,
            schemaVersion: 1,
            x: rect.x + (rect.width - width) / 2,
            y: rect.y + (rect.height - height) / 2,
            width,
            height,
            data: { pose: pose.key, ...style, flip: false },
          };
        },
      },
    }),
  ],
  create: (api) => {
    const remember = createStyleWriter(api.getService(IPluginStorage));
    return {
      tools: [
        {
          id: toolId,
          element: elementType,
          label: "人物",
          icon: PersonStanding,
          order: 15,
          group: "drawing",
          panel: ToolPanel,
        },
      ],
      inspectors: {
        [elementType]: ({
          element,
          onChange,
        }: {
          element: StickmanElement;
          onChange: (element: StickmanElement) => void;
        }) => (
          <Inspector
            element={element}
            onChange={onChange}
            remember={remember}
          />
        ),
      },
    };
  },
});

export default definePlugin({
  ...__PLUGIN_META__,
  whiteboardExtensions: [extension],
});
