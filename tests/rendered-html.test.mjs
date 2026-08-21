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
  assert.match(page, /tag: "LOOP"/);
  assert.equal((page.match(/^\s+tag: "/gm) ?? []).length, 31);
  assert.match(page, /CORRECT_TIME_BONUS = 3/);
  assert.match(page, /MAX_ACTIVE_SECONDS = 60/);
  assert.match(page, /MAX_SESSION_SECONDS = 75/);
  assert.match(page, /MISSION_GATES = 5/);
  assert.match(page, /activeTimeLeftMsRef/);
  assert.match(page, /PYTHON ENERGY/);
  assert.match(page, /ENERGY SAFE/);
  assert.match(page, /shuffleQuestions/);
  assert.match(page, /Digit1/);
  assert.match(page, /reducedFlash/);
  assert.match(page, /playKick/);
  assert.match(page, /playNoise/);
  assert.match(page, /musicVolume/);
  assert.match(page, /audioUnlocked/);
  assert.match(page, /PLAY WITH SOUND/);
  assert.match(page, /PLAY SILENTLY/);
  assert.match(page, /Music will continue during the briefing, practice and game/);
  assert.match(page, /if \(!audioUnlocked \|\| !musicOn\) return/);
  assert.match(page, /BOSS_QUESTION/);
  assert.match(page, /adaptiveLevelRef/);
  assert.match(page, /PYTHON POWER/);
  assert.match(page, /ATTRACT_DELAY_MS = 20000/);
  assert.match(page, /RESULTS_RESET_SECONDS = 25/);
  assert.match(page, /PYTHON SKILLS PRACTISED/);
  assert.match(page, /CODE ACCURACY/);
  assert.match(page, /PYTHON DASH v1\.5/);
  assert.match(page, /master\.gain\.value = 1\.65/);
  assert.match(page, /createDynamicsCompressor/);
  assert.match(page, /UNTIMED PRACTICE/);
  assert.match(page, /STUDENT HELPER MODE/);
  assert.match(page, /CODE_BRIEFING/);
  assert.match(page, /HELPER PROMPT/);
  assert.match(page, /SKIP TO PLAYER SETUP/);
  assert.equal((page.match(/^ {4}label: "/gm) ?? []).length, 4);
  assert.match(page, /ArrowRight/);
  assert.match(page, /DECISION_TIME_MS = 4500/);
  assert.match(page, /regularGatesRef\.current >= MISSION_GATES/);
  assert.match(page, /practiceMoveComplete/);
  assert.match(page, /touch-lanes/);
  assert.match(page, /PLAYER NAME OR CODENAME/);
  assert.match(page, /onChange=\{\(event\) => setPlayerName\(cleanName\(event\.target\.value\)\)\}/);
  assert.match(page, /Type your first name/);
  assert.doesNotMatch(page, /readOnly/);
  assert.match(css, /Bright Cyber Carnival theme/);
  assert.match(css, /equalizer/);
  assert.match(css, /sound-gate/);
  assert.match(css, /boss-active/);
  assert.match(css, /attract-callout/);
  assert.match(css, /result-recap/);
  assert.match(css, /clamp\(30px,2\.45vw,36px\)/);
  assert.match(css, /clamp\(23px,1\.75vw,28px\)/);
  assert.match(layout, /Python Dash \| Heritage Academy/);
  assert.match(layout, /\/og\.png/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /SkeletonPreview/);
});
