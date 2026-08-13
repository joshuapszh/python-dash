"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Screen = "briefing" | "playing" | "results";

type Question = {
  tag: string;
  prompt: string;
  answers: string[];
  correct: number;
  explanation: string;
};

type Gate = {
  id: number;
  x: number;
  question: Question;
  resolved: boolean;
};

type LeaderboardEntry = {
  name: string;
  score: number;
  playedAt: number;
};

const ROUND_SECONDS = 40;
const LEADERBOARD_KEY = "heritage-python-dash-leaderboard-v1";
const LANE_TOPS = [24, 50, 76];
const GATE_START_X = 100;
const GATE_SPEED_PER_TICK = 0.48;
const GATE_SPAWN_INTERVAL_MS = 6000;

const QUESTIONS: Question[] = [
  {
    tag: "PRINT",
    prompt: 'What does print("Hello") show?',
    answers: ["Hello", "Goodbye", "print"],
    correct: 0,
    explanation: "print() shows the message inside the brackets. The answer is Hello.",
  },
  {
    tag: "PRINT",
    prompt: "What does print(5) show?",
    answers: ["0", "5", "print"],
    correct: 1,
    explanation: "print(5) shows the number 5 on the screen.",
  },
  {
    tag: "VARIABLE",
    prompt: 'name = "Mia" — what is stored in name?',
    answers: ["name", "5", "Mia"],
    correct: 2,
    explanation: "The variable called name stores the word Mia.",
  },
  {
    tag: "VARIABLE",
    prompt: "score = 10 — what number is stored in score?",
    answers: ["10", "0", "1"],
    correct: 0,
    explanation: "The variable called score stores the number 10.",
  },
  {
    tag: "MATH",
    prompt: "What is 2 + 3?",
    answers: ["23", "6", "5"],
    correct: 2,
    explanation: "Python uses + for addition. Two plus three equals five.",
  },
  {
    tag: "MATH",
    prompt: "What is 6 - 1?",
    answers: ["5", "6", "7"],
    correct: 0,
    explanation: "Python uses - for subtraction. Six minus one equals five.",
  },
  {
    tag: "VARIABLE",
    prompt: "apples is 4. What is apples + 1?",
    answers: ["4", "5", "41"],
    correct: 1,
    explanation: "apples stores 4, so apples + 1 is the same as 4 + 1.",
  },
  {
    tag: "COMPARE",
    prompt: "Is 5 > 2 True or False?",
    answers: ["False", "True", "5"],
    correct: 1,
    explanation: "True! Five is greater than two. The > sign means greater than.",
  },
  {
    tag: "COMPARE",
    prompt: "Is 1 > 4 True or False?",
    answers: ["True", "False", "4"],
    correct: 1,
    explanation: "False. One is not greater than four.",
  },
  {
    tag: "LOOP",
    prompt: "range(2) tells a loop to repeat how many times?",
    answers: ["1 time", "2 times", "3 times"],
    correct: 1,
    explanation: "range(2) makes a loop repeat two times.",
  },
  {
    tag: "LOOP",
    prompt: "range(3) tells a loop to repeat how many times?",
    answers: ["2 times", "4 times", "3 times"],
    correct: 2,
    explanation: "range(3) makes a loop repeat three times.",
  },
  {
    tag: "PRINT",
    prompt: 'What does print("Python") show?',
    answers: ["Python", "print", "Nothing"],
    correct: 0,
    explanation: "print() shows the word Python on the screen.",
  },
];

const BRIEFING = [
  { code: 'print("Hello")', label: "DISPLAY", text: "print() makes words or numbers appear on screen." },
  { code: "score = 10", label: "STORE", text: "A variable is a named box that stores a value." },
  { code: "2 + 3", label: "CALCULATE", text: "Python uses + and - to work with numbers." },
  { code: "5 > 2", label: "COMPARE", text: "The > sign asks if one number is greater." },
  { code: "range(3)", label: "REPEAT", text: "range(3) means repeat three times." },
];

function cleanName(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").slice(0, 24);
}

function PythonBot({ running = false }: { running?: boolean }) {
  return (
    <div className={`python-bot ${running ? "is-running" : ""}`} aria-hidden="true">
      <div className="bot-antenna"><span /></div>
      <div className="bot-head"><i /><i /><b /></div>
      <div className="bot-body"><span>Py</span></div>
      <div className="bot-arm bot-arm-left" />
      <div className="bot-arm bot-arm-right" />
      <div className="bot-leg bot-leg-left" />
      <div className="bot-leg bot-leg-right" />
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("briefing");
  const [playerName, setPlayerName] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lane, setLane] = useState(1);
  const [gates, setGates] = useState<Gate[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [feedback, setFeedback] = useState<{ good: boolean; text: string } | null>(null);
  const [lastLesson, setLastLesson] = useState("Choose the lane with the correct answer.");
  const [musicOn, setMusicOn] = useState(true);
  const [finalScore, setFinalScore] = useState(0);

  const laneRef = useRef(1);
  const gatesRef = useRef<Gate[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const startTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const questionIndexRef = useRef(0);
  const gateIdRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) ?? "[]") as LeaderboardEntry[];
      if (Array.isArray(saved)) setLeaderboard(saved.slice(0, 10));
    } catch {
      localStorage.removeItem(LEADERBOARD_KEY);
    }
  }, []);

  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new AudioContext();
    return audioRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType, volume = 0.06, delay = 0) => {
    if (!musicOn) return;
    const context = getAudio();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }, [getAudio, musicOn]);

  const playSfx = useCallback((kind: "move" | "correct" | "wrong" | "finish") => {
    if (kind === "move") playTone(260, 0.08, "sine", 0.025);
    if (kind === "correct") {
      playTone(520, 0.12, "square", 0.05);
      playTone(780, 0.18, "square", 0.04, 0.1);
    }
    if (kind === "wrong") {
      playTone(150, 0.24, "sawtooth", 0.06);
      playTone(110, 0.28, "sawtooth", 0.04, 0.08);
    }
    if (kind === "finish") {
      [392, 523, 659].forEach((note, index) => playTone(note, 0.45, "triangle", 0.045, index * 0.11));
    }
  }, [playTone]);

  useEffect(() => {
    if (screen !== "playing" || !musicOn) return;
    const context = getAudio();
    void context.resume();
    const notes = [262, 330, 392, 523, 392, 330, 294, 370, 440, 587, 440, 370];
    const bass = [131, 147, 165, 147];
    let beat = 0;
    musicTimerRef.current = window.setInterval(() => {
      const note = notes[beat % notes.length];
      playTone(note, 0.18, "triangle", 0.035);
      if (beat % 2 === 0) playTone(bass[Math.floor(beat / 2) % bass.length], 0.3, "sine", 0.025);
      if (beat % 4 === 2) playTone(note * 2, 0.05, "square", 0.012);
      beat += 1;
    }, 225);
    return () => {
      if (musicTimerRef.current) window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    };
  }, [getAudio, musicOn, playTone, screen]);

  const saveScore = useCallback((newScore: number) => {
    const entry: LeaderboardEntry = { name: playerName.trim(), score: newScore, playedAt: Date.now() };
    setLeaderboard((current) => {
      const next = [...current, entry].sort((a, b) => b.score - a.score || a.playedAt - b.playedAt).slice(0, 10);
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
      return next;
    });
  }, [playerName]);

  const finishGame = useCallback(() => {
    const total = scoreRef.current;
    setFinalScore(total);
    setScreen("results");
    saveScore(total);
    playSfx("finish");
  }, [playSfx, saveScore]);

  const spawnGate = useCallback((x: number) => {
    const question = QUESTIONS[questionIndexRef.current % QUESTIONS.length];
    questionIndexRef.current += 1;
    const gate: Gate = { id: ++gateIdRef.current, x, question, resolved: false };
    gatesRef.current = [...gatesRef.current, gate];
    setGates([...gatesRef.current]);
  }, []);

  const startGame = useCallback(() => {
    const name = cleanName(playerName).trim();
    if (!name) return;
    setPlayerName(name);
    void getAudio().resume();
    laneRef.current = 1;
    gatesRef.current = [];
    scoreRef.current = 0;
    comboRef.current = 0;
    questionIndexRef.current = Math.floor(Math.random() * QUESTIONS.length);
    gateIdRef.current = 0;
    startTimeRef.current = Date.now();
    lastSpawnRef.current = Date.now();
    setLane(1);
    setGates([]);
    setScore(0);
    setCombo(0);
    setTimeLeft(ROUND_SECONDS);
    setFeedback(null);
    setLastLesson("Choose the lane with the correct answer.");
    setScreen("playing");
    playTone(262, 0.12, "square", 0.04);
    playTone(392, 0.16, "square", 0.035, 0.1);
    window.setTimeout(() => spawnGate(GATE_START_X), 80);
  }, [getAudio, playTone, playerName, spawnGate]);

  const moveLane = useCallback((direction: -1 | 1) => {
    const next = Math.max(0, Math.min(2, laneRef.current + direction));
    if (next !== laneRef.current) {
      laneRef.current = next;
      setLane(next);
      playSfx("move");
    }
  }, [playSfx]);

  useEffect(() => {
    if (screen !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "KeyW", "KeyS"].includes(event.code)) event.preventDefault();
      if ((event.code === "ArrowUp" || event.code === "KeyW") && !event.repeat) moveLane(-1);
      if ((event.code === "ArrowDown" || event.code === "KeyS") && !event.repeat) moveLane(1);
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moveLane, screen]);

  useEffect(() => {
    if (screen !== "playing") return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      const remaining = Math.max(0, ROUND_SECONDS - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        window.clearInterval(timer);
        finishGame();
        return;
      }

      const speed = GATE_SPEED_PER_TICK;
      const nextGates = gatesRef.current
        .map((gate) => ({ ...gate, x: gate.x - speed }))
        .filter((gate) => gate.x > -25);

      for (const gate of nextGates) {
        if (!gate.resolved && gate.x <= 22) {
          gate.resolved = true;
          const isCorrect = laneRef.current === gate.question.correct;
          if (isCorrect) {
            const points = 100 + Math.min(comboRef.current, 5) * 15;
            scoreRef.current += points;
            comboRef.current += 1;
            setFeedback({ good: true, text: `Correct! +${points}` });
            playSfx("correct");
          } else {
            scoreRef.current = Math.max(0, scoreRef.current - 40);
            comboRef.current = 0;
            setFeedback({ good: false, text: "Glitch! −40" });
            playSfx("wrong");
          }
          setScore(scoreRef.current);
          setCombo(comboRef.current);
          setLastLesson(gate.question.explanation);
          window.setTimeout(() => setFeedback(null), 1150);
        }
      }

      gatesRef.current = nextGates;
      setGates([...nextGates]);

      if (now - lastSpawnRef.current >= GATE_SPAWN_INTERVAL_MS) {
        lastSpawnRef.current = now;
        spawnGate(GATE_START_X);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [finishGame, playSfx, screen, spawnGate]);

  const activeGate = useMemo(
    () => gates.filter((gate) => !gate.resolved && gate.x > 18).sort((a, b) => a.x - b.x)[0],
    [gates],
  );

  const clearLeaderboard = () => {
    if (window.confirm("Clear all saved scores on this computer?")) {
      localStorage.removeItem(LEADERBOARD_KEY);
      setLeaderboard([]);
    }
  };

  return (
    <main className="app-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <header className="site-header">
        <img src="/heritage-academy.png" alt="Heritage Academy" className="school-logo" />
        <div className="game-wordmark"><span>PYTHON</span><b>DASH</b></div>
        <button
          className="sound-button"
          type="button"
          aria-label={musicOn ? "Turn music and sound off" : "Turn music and sound on"}
          aria-pressed={musicOn}
          onClick={() => setMusicOn((value) => !value)}
        >
          {musicOn ? "♫ MUSIC + SFX" : "⊘ MUTED"}
        </button>
      </header>

      {screen === "briefing" && (
        <section className="briefing-screen">
          <div className="hero-copy">
            <div className="eyebrow"><span /> 40-SECOND CODE RUN</div>
            <h1>Read the code.<br /><em>Choose the answer.</em></h1>
            <p className="hero-intro">Guide Byte through the neon network. Every gate is a tiny Python puzzle—and every correct lane powers your score.</p>
            <div className="player-entry">
              <label htmlFor="player-name">PLAYER NAME</label>
              <div className="input-row">
                <input
                  id="player-name"
                  value={playerName}
                  onChange={(event) => setPlayerName(cleanName(event.target.value))}
                  onKeyDown={(event) => { if (event.key === "Enter") startGame(); }}
                  placeholder="Type your name"
                  autoComplete="off"
                  maxLength={24}
                />
                <button type="button" onClick={startGame} disabled={!playerName.trim()}>
                  START RUN <span>→</span>
                </button>
              </div>
              <p className="control-hint"><kbd>↑</kbd><kbd>↓</kbd> Move between lanes &nbsp;•&nbsp; Music begins when you press Start Run</p>
            </div>
          </div>

          <div className="hero-bot"><div className="bot-glow" /><PythonBot running /></div>

          <div className="lesson-panel">
            <div className="panel-heading"><span>CODE BRIEFING</span><b>READ BEFORE YOU RUN</b></div>
            <div className="lesson-grid">
              {BRIEFING.map((item, index) => (
                <article className="lesson-card" key={item.code}>
                  <span className="lesson-number">0{index + 1}</span>
                  <small>{item.label}</small>
                  <code>{item.code}</code>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="leaderboard-card briefing-leaderboard">
            <div className="leaderboard-title"><span>LOCAL</span><h2>TOP RUNNERS</h2></div>
            <ScoreTable entries={leaderboard} />
            {leaderboard.length > 0 && <button className="clear-scores" type="button" onClick={clearLeaderboard}>Clear scores</button>}
          </aside>
        </section>
      )}

      {screen === "playing" && (
        <section className="play-screen">
          <div className="hud">
            <div><small>RUNNER</small><strong>{playerName}</strong></div>
            <div><small>SCORE</small><strong>{score.toString().padStart(4, "0")}</strong></div>
            <div><small>COMBO</small><strong className="combo">×{combo}</strong></div>
            <div className="timer-block"><small>TIME</small><strong>{timeLeft.toFixed(1)}<i>s</i></strong></div>
          </div>

          <div className={`game-stage ${feedback && !feedback.good ? "stage-hit" : ""}`}>
            <div className="city city-back" aria-hidden="true" />
            <div className="city city-front" aria-hidden="true" />
            <div className="question-banner">
              <span>{activeGate?.question.tag ?? "READY"}</span>
              <p>{activeGate?.question.prompt ?? "New code incoming…"}</p>
            </div>
            <div className="lane-lines" aria-hidden="true"><i /><i /><i /></div>
            <div className="runner-marker" style={{ top: `${LANE_TOPS[lane]}%` }}>
              <PythonBot running />
              <span className="runner-name">{playerName}</span>
            </div>
            {gates.map((gate) => gate.question.answers.map((answer, answerLane) => (
              <div
                key={`${gate.id}-${answerLane}`}
                className={`answer-card lane-${answerLane} ${gate.resolved ? (answerLane === gate.question.correct ? "answer-correct" : "answer-passed") : ""}`}
                style={{ left: `${gate.x}%`, top: `${LANE_TOPS[answerLane]}%` }}
              >
                <span>{answerLane + 1}</span><b>{answer}</b>
              </div>
            )))}
            {feedback && <div className={`feedback ${feedback.good ? "good" : "bad"}`} role="status">{feedback.text}</div>}
            <div className="speed-lines" aria-hidden="true" />
          </div>

          <div className="play-footer">
            <div className="keys"><kbd>↑</kbd><kbd>↓</kbd><span>CHANGE LANE</span></div>
            <p><b>BYTE SAYS:</b> {lastLesson}</p>
            <div className="round-progress"><span style={{ width: `${(timeLeft / ROUND_SECONDS) * 100}%` }} /></div>
          </div>
        </section>
      )}

      {screen === "results" && (
        <section className="results-screen">
          <div className="result-burst" aria-hidden="true" />
          <div className="result-main">
            <span className="result-kicker">RUN COMPLETE</span>
            <PythonBot />
            <h1>{finalScore >= 700 ? "CODE CHAMPION!" : finalScore >= 400 ? "NICE RUN!" : "SYSTEM READY!"}</h1>
            <p>{playerName}, your Python power score is</p>
            <div className="final-score">{finalScore.toString().padStart(4, "0")}</div>
            <div className="result-actions">
              <button type="button" onClick={startGame}>RUN AGAIN <span>↻</span></button>
              <button className="secondary" type="button" onClick={() => { setPlayerName(""); setScreen("briefing"); }}>NEW PLAYER</button>
            </div>
          </div>
          <aside className="leaderboard-card results-leaderboard">
            <div className="leaderboard-title"><span>SAVED ON THIS COMPUTER</span><h2>TOP RUNNERS</h2></div>
            <ScoreTable entries={leaderboard} highlightName={playerName} highlightScore={finalScore} />
            <button className="clear-scores" type="button" onClick={clearLeaderboard}>Clear scores</button>
          </aside>
        </section>
      )}

      <footer className="site-footer"><span>HERITAGE ACADEMY • DIGITAL LITERACY</span><span>PYTHON DASH v1.0</span></footer>
    </main>
  );
}

function ScoreTable({ entries, highlightName, highlightScore }: { entries: LeaderboardEntry[]; highlightName?: string; highlightScore?: number }) {
  if (entries.length === 0) return <p className="empty-scores">No scores yet.<br />Be the first runner!</p>;
  return (
    <ol className="score-list">
      {entries.slice(0, 8).map((entry, index) => {
        const highlighted = entry.name === highlightName && entry.score === highlightScore;
        return (
          <li key={`${entry.playedAt}-${index}`} className={highlighted ? "current-score" : ""}>
            <span className={`rank rank-${index + 1}`}>{String(index + 1).padStart(2, "0")}</span>
            <b>{entry.name}</b>
            <strong>{entry.score.toString().padStart(4, "0")}</strong>
          </li>
        );
      })}
    </ol>
  );
}
