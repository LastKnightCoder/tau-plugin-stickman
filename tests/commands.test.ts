import { test } from "node:test";
import assert from "node:assert/strict";
import type { WhiteboardAPI } from "@tau/plugins/whiteboard";
import { createStickmanCommands, readStickmanSketch } from "../src/commands";
import { createStyleWriter } from "../src/preferences";
import { elementType } from "../src/constants";
import { getStickPose, stickNaturalSize } from "../src/model/poses";

function fixture() {
  const element = {
    id: "figure", type: elementType,
    geometry: { x: 10, y: 20, width: 132, height: 172, rotation: 0.5 },
    data: { pose: "stand", body: "classic", tint: "mono", flip: false, unknown: { keep: true } },
    style: { unrelated: "keep" } as Record<string, unknown>,
  };
  const batches: unknown[][] = [];
  let writable = true, alive = true;
  const api = {
    getElement: () => alive ? structuredClone(element) : undefined,
    updateElementData(_id: string, patch: object) {
      if (!writable) throw new Error("只读");
      if (!alive) return false;
      Object.assign(element.data, patch);
      return true;
    },
    updateElement(_id: string, patch: { style: object }) {
      if (!writable) throw new Error("只读");
      Object.assign(element.style, patch.style);
      return true;
    },
    submit(commands: any[]) {
      if (!writable) throw new Error("只读");
      batches.push(commands);
      for (const command of commands) {
        if (command.type === "set_node") Object.assign(element, command.patch);
        else Object.assign(element.data, command.patch);
      }
      return { createdIds: [] };
    },
  } as unknown as WhiteboardAPI;
  return { element, batches, commands: createStickmanCommands(api),
    disable: () => { writable = false; }, remove: () => { alive = false; } };
}

test("属性修改只写所选字段，保留远端姿态和未知载荷", () => {
  const f = fixture();
  f.element.data.pose = "wave";
  f.commands.data("figure", { body: "bean" });
  assert.deepEqual(f.element.data, { pose: "wave", body: "bean", tint: "mono", flip: false, unknown: { keep: true } });
});

test("换姿态读取最新位置和尺度，一批更新几何与姿态并保留旋转及未知数据", () => {
  const f = fixture();
  f.element.geometry = { x: 200, y: 300, width: 264, height: 344, rotation: 0.5 };
  f.commands.pose("figure", "sit");
  assert.ok(getStickPose("sit"));
  const [width, height] = stickNaturalSize(getStickPose("sit")!).map(value => value * 2);
  assert.equal(f.batches.length, 1);
  assert.equal(f.batches[0].length, 2);
  assert.deepEqual(f.element.geometry, { x: 200 + (264 - width) / 2, y: 644 - height, width, height, rotation: 0.5 });
  assert.deepEqual(f.element.data.unknown, { keep: true });
});

test("未知姿态、相同姿态和已删除元素不生成历史", () => {
  const f = fixture();
  assert.equal(f.commands.pose("figure", "invalid"), false);
  assert.equal(f.commands.pose("figure", "stand"), false);
  f.remove();
  assert.equal(f.commands.pose("figure", "wave"), false);
  assert.equal(f.commands.data("figure", { flip: true }), false);
  assert.deepEqual(f.batches, []);
});

test("笔触按变更字段提交，旧面板不覆盖新种子，清除覆盖仍跟随页面", () => {
  const f = fixture();
  f.element.style.sketchSeed = 99;
  f.commands.sketch("figure", {}, { mode: "sketch" });
  assert.deepEqual(readStickmanSketch(f.element), { mode: "sketch", seed: 99 });
  f.commands.sketch("figure", { mode: "sketch" }, {});
  assert.deepEqual(readStickmanSketch(f.element), { seed: 99 });
  assert.equal(f.element.style.unrelated, "keep");
  assert.equal(f.element.style.sketchMode, null);
});

test("宿主拒绝写入时不绕过权限，不产生额外历史", () => {
  const f = fixture(), before = structuredClone(f.element);
  f.disable();
  assert.throws(() => f.commands.data("figure", { flip: true }), /只读/);
  assert.throws(() => f.commands.pose("figure", "wave"), /只读/);
  assert.throws(() => f.commands.sketch("figure", {}, { mode: "sketch" }), /只读/);
  assert.deepEqual(f.element, before);
  assert.deepEqual(f.batches, []);
});

test("偏好写入串行合并，失败不清空旧值，后续操作可以重试", async () => {
  let saved = { body: "classic", tint: "mono" }, fail = true;
  const remember = createStyleWriter({
    get: async () => saved,
    set: async (_key, value) => {
      if (fail) { fail = false; throw new Error("保存失败"); }
      saved = value as typeof saved;
    },
    delete: async () => {},
  });
  await assert.rejects(remember({ body: "bean" }), /保存失败/);
  assert.equal(saved.body, "classic");
  await Promise.all([remember({ body: "glyph" }), remember({ tint: "color" })]);
  assert.deepEqual(saved, { body: "glyph", tint: "color" });
});
