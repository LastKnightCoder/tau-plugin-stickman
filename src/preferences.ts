import type { PluginStorage } from "@tau/plugins";
import { DEFAULT_STICK_BODY, DEFAULT_STICK_TINT } from "./constants";
import type { StickBody, StickTint } from "./model";

export type Style = { body: StickBody; tint: StickTint };
export async function readStyle(storage: PluginStorage): Promise<Style> {
  const value = await storage.get("style");
  const saved =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    body:
      saved.body === "classic" ||
      saved.body === "bean" ||
      saved.body === "glyph"
        ? saved.body
        : DEFAULT_STICK_BODY,
    tint:
      saved.tint === "mono" || saved.tint === "color"
        ? saved.tint
        : DEFAULT_STICK_TINT,
  };
}

/** 同一画布快速连续修改时按顺序合并，只写本次选择的字段。 */
export function createStyleWriter(storage: PluginStorage) {
  let pending: Promise<void> = Promise.resolve();
  return (patch: Partial<Style>) => {
    const task = pending
      .catch(() => undefined)
      .then(async () => {
        await storage.set("style", { ...(await readStyle(storage)), ...patch });
      });
    pending = task;
    return task;
  };
}
