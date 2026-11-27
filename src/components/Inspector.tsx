import { useEffect, useRef, useState } from "react";
import { useI18n } from "@tau/plugins";
import {
  FlipHorizontal2,
  Palette,
  PersonStanding,
  UserRound,
} from "lucide-react";
import {
  AttrPopover,
  AttrToggle,
  OptionGrid,
  SketchPopover,
} from "@tau/plugins/whiteboard";
import { DEFAULT_STICK_POSE, STICK_BODY_OPTIONS } from "../constants";
import { getStickPose, type StickBody } from "../model";
import type { StickmanElement } from "../element";
import { readStickmanSketch, type StickmanCommands } from "../commands";
import type { Style } from "../preferences";
import { messages } from "../i18n";
import PosePicker, { StickGlyph } from "./PosePicker";

export function Inspector({
  element,
  commands,
  remember,
}: {
  element: StickmanElement;
  commands: StickmanCommands;
  remember: (style: Partial<Style>) => Promise<void>;
}) {
  const { t } = useI18n(messages);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const { pose, body, tint, flip } = element.data;
  const save = (style: Partial<Style>) => {
    if (!commands.data(element.id, style)) return;
    void remember(style).then(
      () => {
        if (mounted.current) setError("");
      },
      (reason) => {
        if (mounted.current)
          setError(
            t("inspector.rememberFailed", {
              message: reason instanceof Error ? reason.message : String(reason),
            }),
          );
      },
    );
  };
  const standing = getStickPose(DEFAULT_STICK_POSE)!;
  return (
    <>
      <AttrPopover
        label={t("inspector.pose")}
        icon={<PersonStanding strokeWidth={1.75} />}
        width={348}
      >
        <PosePicker
          value={pose}
          body={body}
          tint={tint}
          onPick={(key) => commands.pose(element.id, key)}
        />
      </AttrPopover>
      <AttrPopover
        label={t("inspector.body")}
        icon={<UserRound strokeWidth={1.75} />}
        width={240}
      >
        <OptionGrid<StickBody>
          cols={3}
          tall
          options={STICK_BODY_OPTIONS.map((o) => ({
            ...o,
            label: t(o.label),
            glyph: (
              <StickGlyph
                pose={standing}
                body={o.value}
                tint={tint}
                size={30}
              />
            ),
          }))}
          value={body}
          onChange={(value) => save({ body: value })}
        />
      </AttrPopover>
      <AttrToggle
        label={t("inspector.tint")}
        icon={<Palette strokeWidth={1.75} />}
        checked={tint === "color"}
        onChange={(value) => save({ tint: value ? "color" : "mono" })}
      />
      <AttrToggle
        label={t("inspector.flip")}
        icon={<FlipHorizontal2 strokeWidth={1.75} />}
        checked={flip}
        onChange={(value) => commands.data(element.id, { flip: value })}
      />
      <SketchPopover
        target={{ ...element, sketch: readStickmanSketch(element) }}
        onChange={(next) =>
          commands.sketch(element.id, readStickmanSketch(element), next.sketch)
        }
      />
      {error && <span role="alert">{error}</span>}
    </>
  );
}
