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
  assert.match(page, /if statement/);
  assert.match(page, /for loop/);
  assert.match(layout, /Python Dash \| Heritage Academy/);
  assert.match(layout, /\/og\.png/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /SkeletonPreview/);
});
