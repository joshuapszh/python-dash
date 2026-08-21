import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships a GitHub Pages build", async () => {
  const [config, entry, page, workflow] = await Promise.all([
    readFile(new URL("vite.github.config.ts", root), "utf8"),
    readFile(new URL("github-pages/index.html", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL(".github/workflows/pages.yml", root), "utf8"),
  ]);

  assert.match(config, /base: "\/python-dash\/"/);
  assert.match(config, /\.\/docs/);
  assert.match(entry, /Python Dash \| Heritage Academy/);
  assert.match(entry, /Defeat the Python Boss/);
  assert.match(entry, /joshuapszh\.github\.io\/python-dash\/og\.png/);
  assert.match(page, /src="\.\/heritage-academy\.png"/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});

