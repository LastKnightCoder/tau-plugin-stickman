import { definePlugin } from "@tau/plugins";
import "./styles.css";
import { defineElement, defineWhiteboardExtension, IPluginStorage } from "@tau/plugins/whiteboard";
import { PersonStanding } from "lucide-react";
import {
  CATEGORY_KEYS,
  DEFAULT_STICK_POSE,
  POSE_NAME_KEYS,
} from "./constants";
import { getStickPose, stickNaturalSize, type StickPose } from "./model";
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
import { captureTranslator, messages, t } from "./i18n";
import { readStyle, createStyleWriter } from "./preferences";
import { createStickmanCommands } from "./commands";

declare const __PLUGIN_META__: { id: string; name: string; version: string };
const poseOf = (options: Readonly<Record<string, unknown>> | null) =>
  getStickPose(typeof options?.pose === "string" ? options.pose : DEFAULT_STICK_POSE);

const poseName = (pose: StickPose | undefined) =>
  t((pose && POSE_NAME_KEYS[pose.key]) || "tool.person");

export const extension = defineWhiteboardExtension({
  id: "taunote.stickman",
  // 展示名在读取时解析（宿主保留 name getter 的实时性）
  get name() {
    return t("extension.name");
  },
  elements: [
    defineElement<StickmanData>({
      type: elementType,
      dataVersion: 1,
      collaboration: { textFields: [] },
      resources: [],
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
              (value.body === "classic" || value.body === "bean" || value.body === "glyph") &&
              "tint" in value &&
              (value.tint === "color" || value.tint === "mono") &&
              "flip" in value &&
              typeof value.flip === "boolean"
            )
              return {
                value: {
                  ...value,
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
        get label() {
          return t("tool.person");
        },
        icon: PersonStanding,
        getName: element => poseName(getStickPose(element.data.pose)),
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
        hint: options => [t("hint.place", { name: poseName(poseOf(options)) })],
        async build({ rect, options, api }) {
          const pose = poseOf(options);
          if (!pose) return null;
          const style = await readStyle(api.getService(IPluginStorage));
          const [width, height] = stickNaturalSize(pose);
          return {
            id: crypto.randomUUID(),
            type: elementType,
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
  create: api => {
    const remember = createStyleWriter(api.getService(IPluginStorage));
    const commands = createStickmanCommands(api);
    return {
      tools: [
        {
          id: toolId,
          element: elementType,
          get label() {
            return t("tool.person");
          },
          icon: PersonStanding,
          order: 15,
          group: "drawing",
          panel: ToolPanel,
        },
      ],
      inspectors: {
        [elementType]: ({ element }: { element: StickmanElement }) => (
          <Inspector element={element} commands={commands} remember={remember} />
        ),
      },
    };
  },
});

export default definePlugin({
  ...__PLUGIN_META__,
  i18n: messages,
  create: () => ({
    activate(context) {
      captureTranslator(context.i18n.t);
    },
  }),
  whiteboardExtensions: [extension],
});
