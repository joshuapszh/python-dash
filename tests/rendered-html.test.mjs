import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the complete Python Dash experience", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);
  assert.match(page, /PythonBot/);
  assert.match(page, /ROUND_SECONDS = 40/);
  assert.match(page, /localStorage/);
  assert.match(page, /Heritage Academy/);
  assert.match(page, /print\(\)/);
  assert.match(page, /tag: "IF"/);
  assert.match(page, /tag: "LOOP"/);
  assert.equal((page.match(/^\s+tag: "/gm) ?? []).length, 30);
  assert.match(page, /CORRECT_TIME_BONUS = 3/);
  assert.match(page, /MAX_ROUND_SECONDS = 60/);
  assert.match(page, /shuffleQuestions/);
  assert.match(page, /Digit1/);
  assert.match(page, /reducedFlash/);
  assert.match(page, /playKick/);
  assert.match(page, /playNoise/);
  assert.match(page, /musicVolume/);
  assert.match(css, /Bright Cyber Carnival theme/);
  assert.match(css, /equalizer/);
  assert.match(layout, /Python Dash \| Heritage Academy/);
  assert.match(layout, /\/og\.png/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /SkeletonPreview/);
});
