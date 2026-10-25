import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const directory = await mkdtemp(join(tmpdir(), "tau-stickman-tests-"));
try {
  const outfile = join(directory, "commands.test.mjs");
  await build({
    entryPoints: ["tests/commands.test.ts"], outfile, bundle: true,
    platform: "node", format: "esm", target: "node22",
  });
  execFileSync(process.execPath, ["--test", outfile], { stdio: "inherit" });
} finally {
  await rm(directory, { recursive: true, force: true });
}
