"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Screen = "briefing" | "practice" | "playing" | "results";

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
  decisionEndsAt?: number;
};

type LeaderboardEntry = {
  name: string;
  score: number;
  playedAt: number;
};

type Coin = {
  id: number;
  x: number;
  lane: number;
  collected: boolean;
};

const ROUND_SECONDS = 40;
const MAX_ACTIVE_SECONDS = 70;
const MAX_SESSION_SECONDS = 90;
const CORRECT_TIME_BONUS = 3;
const COMBO_TIME_BONUS = 5;
const LEADERBOARD_KEY = "heritage-python-dash-leaderboard-v1";
const LANE_TOPS = [24, 50, 76];
const GATE_START_X = 100;
const GATE_DECISION_X = 56;
const DECISION_TIME_MS = 3000;
const GATE_SPEED_PER_TICK = 3.15;
const COIN_SPEED_PER_TICK = 1.2;
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
    tag: "PRINT",
    prompt: 'What does print("Go!") show?',
    answers: ["Stop!", "Go!", "Nothing"],
    correct: 1,
    explanation: "print() shows Go! because that message is inside the brackets.",
  },
  {
    tag: "PRINT",
    prompt: "What does print(12) show?",
    answers: ["12", "2", "print"],
    correct: 0,
    explanation: "print(12) shows the number 12.",
  },
  {
    tag: "PRINT",
    prompt: 'What does print("Python") show?',
    answers: ["Code", "print", "Python"],
    correct: 2,
    explanation: "print() shows the word Python.",
  },
  {
    tag: "PRINT",
    prompt: 'Which code shows the word Hi?',
    answers: ['print("Hi")', "Hi = print", "show Hi"],
    correct: 0,
    explanation: "Use print() with the message inside brackets to show it.",
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
    tag: "VARIABLE",
    prompt: "lives = 3 — what number is stored in lives?",
    answers: ["1", "3", "5"],
    correct: 1,
    explanation: "The variable lives stores the number 3.",
  },
  {
    tag: "VARIABLE",
    prompt: 'pet = "cat" — what is stored in pet?',
    answers: ["dog", "cat", "pet"],
    correct: 1,
    explanation: "The variable pet stores the word cat.",
  },
  {
    tag: "VARIABLE",
    prompt: "coins = 7 — what number is stored in coins?",
    answers: ["7", "0", "coins"],
    correct: 0,
    explanation: "The variable coins stores the number 7.",
  },
  {
    tag: "VARIABLE",
    prompt: 'colour = "blue" — what is stored in colour?',
    answers: ["red", "colour", "blue"],
    correct: 2,
    explanation: "The variable colour stores the word blue.",
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
    tag: "MATH",
    prompt: "What is 4 + 2?",
    answers: ["6", "42", "2"],
    correct: 0,
    explanation: "Four plus two equals six.",
  },
  {
    tag: "MATH",
    prompt: "What is 9 - 3?",
    answers: ["12", "6", "3"],
    correct: 1,
    explanation: "Nine minus three equals six.",
  },
  {
    tag: "MATH",
    prompt: "apples is 4. What is apples + 1?",
    answers: ["4", "5", "41"],
    correct: 1,
    explanation: "apples stores 4, so apples + 1 is the same as 4 + 1.",
  },
  {
    tag: "MATH",
    prompt: "stars is 8. What is stars - 2?",
    answers: ["10", "82", "6"],
    correct: 2,
    explanation: "stars stores 8, so stars - 2 equals 6.",
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
    tag: "COMPARE",
    prompt: "Is 7 > 6 True or False?",
    answers: ["True", "False", "7"],
    correct: 0,
    explanation: "True. Seven is greater than six.",
  },
  {
    tag: "COMPARE",
    prompt: "Is 3 > 8 True or False?",
    answers: ["True", "3", "False"],
    correct: 2,
    explanation: "False. Three is not greater than eight.",
  },
  {
    tag: "LOOP",
    prompt: "range(2) tells a loop to repeat how many times?",
    answers: ["1 time", "2 times", "3 times"],
    correct: 1,
    explanation: "range(2) means repeat two times.",
  },
  {
    tag: "LOOP",
    prompt: "range(3) tells a loop to repeat how many times?",
    answers: ["2 times", "4 times", "3 times"],
    correct: 2,
    explanation: "range(3) means repeat three times.",
  },
  {
    tag: "LOOP",
    prompt: "range(1) tells a loop to repeat how many times?",
    answers: ["1 time", "2 times", "0 times"],
    correct: 0,
    explanation: "range(1) means repeat one time.",
  },
  {
    tag: "LOOP",
    prompt: "range(4) tells a loop to repeat how many times?",
    answers: ["3 times", "4 times", "5 times"],
    correct: 1,
    explanation: "range(4) means repeat four times.",
  },
  {
    tag: "PRINT",
    prompt: 'What does print("Play") show?',
    answers: ["Play", "Stop", "Nothing"],
    correct: 0,
    explanation: "print() shows the word Play.",
  },
  {
    tag: "CODE",
    prompt: 'Which code shows the word Go?',
    answers: ['print("Go")', "Go = print", "show Go"],
    correct: 0,
    explanation: "print(\"Go\") shows the word Go.",
  },
  {
    tag: "CODE",
    prompt: "Which code shows the number 5?",
    answers: ["5 = show", "print(5)", "number 5"],
    correct: 1,
    explanation: "print(5) shows the number 5.",
  },
  {
    tag: "PRINT",
    prompt: 'What does print("Fun") show?',
    answers: ["Fun", "Run", "print"],
    correct: 0,
    explanation: "print() shows the word Fun.",
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

function shuffleQuestions() {
  const deck = [...QUESTIONS];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
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
  const [coins, setCoins] = useState<Coin[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [clockRunning, setClockRunning] = useState(false);
  const [feedback, setFeedback] = useState<{ good: boolean; text: string } | null>(null);
  const [lastLesson, setLastLesson] = useState("Choose the lane with the correct answer.");
  const [musicOn, setMusicOn] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.85);
  const [reducedFlash, setReducedFlash] = useState(false);
  const [practiceChoice, setPracticeChoice] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState(0);

  const laneRef = useRef(1);
  const gatesRef = useRef<Gate[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const timeLeftRef = useRef(ROUND_SECONDS);
  const activeTimeLeftMsRef = useRef(ROUND_SECONDS * 1000);
  const sessionEndsAtRef = useRef(0);
  const lastTickAtRef = useRef(0);
  const pauseUntilRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const questionDeckRef = useRef<Question[]>([]);
  const gateIdRef = useRef(0);
  const coinIdRef = useRef(0);
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
    gain.gain.exponentialRampToValueAtTime(volume * musicVolume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }, [getAudio, musicOn, musicVolume]);

  const playKick = useCallback((delay = 0, strength = 1) => {
    if (!musicOn) return;
    const context = getAudio();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(155, start);
    oscillator.frequency.exponentialRampToValueAtTime(46, start + 0.13);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.11 * strength * musicVolume, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.2);
  }, [getAudio, musicOn, musicVolume]);

  const playNoise = useCallback((duration: number, volume: number, highpass: number, delay = 0) => {
    if (!musicOn) return;
    const context = getAudio();
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = highpass;
    gain.gain.setValueAtTime(volume * musicVolume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(start);
    source.stop(start + duration);
  }, [getAudio, musicOn, musicVolume]);

  const playSfx = useCallback((kind: "move" | "coin" | "correct" | "wrong" | "finish") => {
    if (kind === "move") playTone(260, 0.08, "sine", 0.025);
    if (kind === "coin") {
      playTone(880, 0.08, "square", 0.035);
      playTone(1175, 0.11, "square", 0.025, 0.06);
    }
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
    const chords = [
      [262, 330, 392],
      [294, 370, 440],
      [220, 277, 330],
      [247, 311, 370],
    ];
    const lead = [659, 784, 880, 784, 988, 880, 784, 659, 587, 659, 784, 988, 880, 784, 659, 587];
    let beat = 0;
    musicTimerRef.current = window.setInterval(() => {
      const finalRush = timeLeftRef.current <= 10;
      const step = beat % 16;
      const chord = chords[Math.floor(beat / 16) % chords.length];
      const root = chord[0];

      if (step === 0 || step === 8 || (finalRush && (step === 4 || step === 12))) playKick(0, finalRush ? 1.2 : 1);
      if (step === 4 || step === 12) {
        playNoise(0.13, finalRush ? 0.075 : 0.055, 1200);
        playTone(185, 0.1, "triangle", 0.025);
      }
      if (finalRush || step % 2 === 0) playNoise(0.035, finalRush ? 0.022 : 0.014, 6500);
      if (step % 4 === 0) playTone(root / 2, 0.38, "sawtooth", finalRush ? 0.045 : 0.032);
      if (step % 2 === 0) playTone(chord[(step / 2) % chord.length] * 2, 0.1, "square", finalRush ? 0.025 : 0.018);
      if ([0, 3, 6, 10, 12, 15].includes(step)) playTone(lead[step] * (finalRush ? 1.12 : 1), 0.16, "triangle", finalRush ? 0.05 : 0.035);
      beat += 1;
    }, 128);
    return () => {
      if (musicTimerRef.current) window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    };
  }, [getAudio, musicOn, playKick, playNoise, playTone, screen]);

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
    if (questionDeckRef.current.length === 0) questionDeckRef.current = shuffleQuestions();
    const question = questionDeckRef.current.shift()!;
    const gate: Gate = { id: ++gateIdRef.current, x, question, resolved: false };
    gatesRef.current = [...gatesRef.current, gate];
    setGates([...gatesRef.current]);
  }, []);

  const openPractice = useCallback(() => {
    const name = cleanName(playerName).trim();
    if (!name) return;
    setPlayerName(name);
    setPracticeChoice(null);
    void getAudio().resume();
    playTone(523, 0.12, "square", 0.04);
    setScreen("practice");
  }, [getAudio, playTone, playerName]);

  const startGame = useCallback(() => {
    const name = cleanName(playerName).trim();
    if (!name) return;
    setPlayerName(name);
    void getAudio().resume();
    laneRef.current = 1;
    gatesRef.current = [];
    coinsRef.current = [];
    scoreRef.current = 0;
    comboRef.current = 0;
    timeLeftRef.current = ROUND_SECONDS;
    activeTimeLeftMsRef.current = ROUND_SECONDS * 1000;
    questionDeckRef.current = shuffleQuestions();
    gateIdRef.current = 0;
    coinIdRef.current = 0;
    pauseUntilRef.current = 0;
    const now = Date.now();
    sessionEndsAtRef.current = now + MAX_SESSION_SECONDS * 1000;
    lastTickAtRef.current = now;
    lastSpawnRef.current = now;
    setLane(1);
    setGates([]);
    setCoins([]);
    setScore(0);
    setCombo(0);
    setQuestionsAnswered(0);
    setTimeLeft(ROUND_SECONDS);
    setClockRunning(false);
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

  const chooseLane = useCallback((next: number) => {
    if (next === laneRef.current) return;
    laneRef.current = next;
    setLane(next);
    playSfx("move");
  }, [playSfx]);

  useEffect(() => {
    if (screen !== "playing" && screen !== "practice") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "KeyW", "KeyS", "Digit1", "Digit2", "Digit3", "Numpad1", "Numpad2", "Numpad3"].includes(event.code)) event.preventDefault();
      if (screen === "practice") {
        const practiceLane = event.code === "Digit1" || event.code === "Numpad1" ? 0 : event.code === "Digit2" || event.code === "Numpad2" ? 1 : event.code === "Digit3" || event.code === "Numpad3" ? 2 : null;
        if (practiceLane !== null && !event.repeat) {
          setPracticeChoice(practiceLane);
          playSfx(practiceLane === 0 ? "correct" : "wrong");
        }
        return;
      }
      if ((event.code === "ArrowUp" || event.code === "KeyW") && !event.repeat) moveLane(-1);
      if ((event.code === "ArrowDown" || event.code === "KeyS") && !event.repeat) moveLane(1);
      if ((event.code === "Digit1" || event.code === "Numpad1") && !event.repeat) chooseLane(0);
      if ((event.code === "Digit2" || event.code === "Numpad2") && !event.repeat) chooseLane(1);
      if ((event.code === "Digit3" || event.code === "Numpad3") && !event.repeat) chooseLane(2);
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chooseLane, moveLane, playSfx, screen]);

  useEffect(() => {
    if (screen !== "playing") return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      const tickDuration = Math.min(250, Math.max(0, now - lastTickAtRef.current));
      lastTickAtRef.current = now;
      const paused = now < pauseUntilRef.current;
      const choosingAnswer = gatesRef.current.some(
        (gate) => !gate.resolved && Boolean(gate.decisionEndsAt) && now < (gate.decisionEndsAt ?? 0),
      );
      const collectingCoin = coinsRef.current.some((coin) => !coin.collected && coin.x > 22);
      const isActivePlay = !paused && (choosingAnswer || collectingCoin);
      if (isActivePlay) activeTimeLeftMsRef.current = Math.max(0, activeTimeLeftMsRef.current - tickDuration);
      const remaining = activeTimeLeftMsRef.current / 1000;
      timeLeftRef.current = remaining;
      setTimeLeft(remaining);
      setClockRunning(isActivePlay);

      if (remaining <= 0 || now >= sessionEndsAtRef.current) {
        window.clearInterval(timer);
        finishGame();
        return;
      }

      const speed = paused ? 0 : GATE_SPEED_PER_TICK;
      const nextGates = gatesRef.current
        .map((gate) => {
          if (gate.resolved) return { ...gate, x: gate.x - speed };
          if (gate.decisionEndsAt) {
            return now >= gate.decisionEndsAt ? { ...gate, x: 22 } : gate;
          }
          const nextX = gate.x - speed;
          return nextX <= GATE_DECISION_X
            ? { ...gate, x: GATE_DECISION_X, decisionEndsAt: now + DECISION_TIME_MS }
            : { ...gate, x: nextX };
        })
        .filter((gate) => gate.x > -25);

      for (const gate of nextGates) {
        if (!gate.resolved && gate.x <= 22) {
          gate.resolved = true;
          const isCorrect = laneRef.current === gate.question.correct;
          if (isCorrect) {
            const nextCombo = comboRef.current + 1;
            const comboBonus = nextCombo % 3 === 0 ? COMBO_TIME_BONUS : 0;
            const timeBonus = CORRECT_TIME_BONUS + comboBonus;
            const points = nextCombo >= 2 ? 200 : 100;
            scoreRef.current += points;
            comboRef.current = nextCombo;
            activeTimeLeftMsRef.current = Math.min(
              activeTimeLeftMsRef.current + timeBonus * 1000,
              MAX_ACTIVE_SECONDS * 1000,
            );
            timeLeftRef.current = activeTimeLeftMsRef.current / 1000;
            setTimeLeft(timeLeftRef.current);
            setFeedback({ good: true, text: comboBonus ? `POWER COMBO! +${timeBonus} SECONDS` : `CORRECT! +${timeBonus} SECONDS` });
            playSfx("correct");
            if (comboBonus) [784, 988, 1175, 1568].forEach((note, index) => playTone(note, 0.28, "square", 0.055, index * 0.08));
          } else {
            comboRef.current = 0;
            setFeedback({ good: false, text: "GOOD TRY — STREAK RESET" });
            playSfx("wrong");
          }
          const coin: Coin = { id: ++coinIdRef.current, x: 58, lane: Math.floor(Math.random() * 3), collected: false };
          coinsRef.current = [...coinsRef.current, coin];
          pauseUntilRef.current = now + 1200;
          setScore(scoreRef.current);
          setCombo(comboRef.current);
          setQuestionsAnswered((count) => count + 1);
          setLastLesson(gate.question.explanation);
          window.setTimeout(() => setFeedback(null), 1150);
        }
      }

      gatesRef.current = nextGates;
      setGates([...nextGates]);

      const nextCoins = coinsRef.current
        .map((coin) => ({ ...coin, x: coin.x - (paused ? 0 : COIN_SPEED_PER_TICK) }))
        .filter((coin) => coin.x > -8);
      for (const coin of nextCoins) {
        if (!coin.collected && coin.x <= 22) {
          coin.collected = true;
          if (laneRef.current === coin.lane) {
            scoreRef.current += 10;
            setScore(scoreRef.current);
            playSfx("coin");
          }
        }
      }
      coinsRef.current = nextCoins;
      setCoins([...nextCoins]);

      const hasIncomingGate = nextGates.some((gate) => !gate.resolved);
      if (!hasIncomingGate && now - lastSpawnRef.current >= GATE_SPAWN_INTERVAL_MS && !paused) {
        lastSpawnRef.current = now;
        spawnGate(GATE_START_X);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [finishGame, playSfx, playTone, screen, spawnGate]);

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
    <main className={`app-shell ${reducedFlash ? "reduced-flash" : ""}`}>
      <div className="ambient-grid" aria-hidden="true" />
      <header className="site-header">
        <img src="/heritage-academy.png" alt="Heritage Academy" className="school-logo" />
        <div className="game-wordmark"><span>PYTHON</span><b>DASH</b></div>
        <label className="volume-control">
          <span>VOLUME</span>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={musicVolume}
            onChange={(event) => setMusicVolume(Number(event.target.value))}
            aria-label="Music and sound volume"
          />
        </label>
        <button
          className="flash-button"
          type="button"
          aria-pressed={reducedFlash}
          onClick={() => setReducedFlash((value) => !value)}
        >
          {reducedFlash ? "LOW FLASH ON" : "REDUCE FLASH"}
        </button>
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
            <div className="eyebrow"><span /> 40 ACTIVE SECONDS • EARN UP TO 70</div>
            <h1>Read the code.<br /><em>Choose the answer.</em></h1>
            <p className="hero-intro">Guide Byte through the neon network. Every correct answer adds 3 seconds. Build a three-answer streak for an extra 5-second power bonus!</p>
            <div className="player-entry">
              <label htmlFor="player-name">PLAYER NAME</label>
              <div className="input-row">
                <input
                  id="player-name"
                  value={playerName}
                  onChange={(event) => setPlayerName(cleanName(event.target.value))}
                  onKeyDown={(event) => { if (event.key === "Enter") openPractice(); }}
                  placeholder="Type your name"
                  autoComplete="off"
                  maxLength={24}
                />
                <button type="button" onClick={openPractice} disabled={!playerName.trim()}>
                  START RUN <span>→</span>
                </button>
              </div>
              <p className="control-hint"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> Pick an answer lane instantly &nbsp;•&nbsp; Arrow keys collect coins</p>
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

      {screen === "practice" && (
        <section className="practice-screen">
          <div className="practice-card">
            <span className="practice-label">UNTIMED PRACTICE</span>
            <h1>Try one together!</h1>
            <p className="practice-question">What does <code>print(&quot;Hi&quot;)</code> show?</p>
            <div className="practice-answers">
              {["Hi", "Bye", "print"].map((answer, index) => (
                <button
                  type="button"
                  key={answer}
                  className={practiceChoice === index ? (index === 0 ? "practice-correct" : "practice-wrong") : ""}
                  onClick={() => {
                    setPracticeChoice(index);
                    playSfx(index === 0 ? "correct" : "wrong");
                  }}
                >
                  <span>{index + 1}</span>{answer}
                </button>
              ))}
            </div>
            <div className="practice-message" role="status">
              {practiceChoice === null && <p>Press <kbd>1</kbd>, <kbd>2</kbd> or <kbd>3</kbd> to choose.</p>}
              {practiceChoice === 0 && <p><b>Great!</b> print() shows the word Hi.</p>}
              {practiceChoice !== null && practiceChoice !== 0 && <p><b>Nice try!</b> Choose answer 1: Hi.</p>}
            </div>
            {practiceChoice === 0 && <button className="practice-start" type="button" onClick={startGame}>START THE 40-SECOND RUN <span>→</span></button>}
          </div>
          <div className="practice-bot"><PythonBot /></div>
        </section>
      )}

      {screen === "playing" && (
        <section className="play-screen">
          <div className="hud">
            <div><small>RUNNER</small><strong>{playerName}</strong></div>
            <div><small>SCORE</small><strong>{score.toString().padStart(4, "0")}</strong></div>
            <div><small>COMBO</small><strong className="combo">×{combo}</strong></div>
            <div className="code-progress"><small>CODE GATES</small><span>{[0, 1, 2, 3, 4].map((chip) => <i key={chip} className={chip < questionsAnswered ? "lit" : ""} />)}</span></div>
            <div className={`timer-block ${clockRunning ? "timer-running" : "timer-paused"}`}>
              <small>ACTIVE TIME</small>
              <strong>{timeLeft.toFixed(1)}<i>s</i></strong>
              <em>{clockRunning ? "RUNNING" : "PAUSED"}</em>
              <span className="equalizer" aria-hidden="true"><i /><i /><i /><i /><i /></span>
            </div>
          </div>

          <div className={`game-stage arcade-live ${feedback && !feedback.good ? "stage-hit" : ""} ${feedback?.good ? "stage-correct" : ""} ${combo >= 3 ? "combo-active" : ""}`}>
            <div className="city city-back" aria-hidden="true" />
            <div className="city city-front" aria-hidden="true" />
            <div className="question-banner">
              <span>{activeGate?.question.tag ?? "READY"}</span>
              <div>
                <small>{clockRunning ? "CHOOSE NOW — TIMER RUNNING" : feedback ? "READ THE TIP — TIMER PAUSED" : "LOOK AT THE QUESTION — TIMER PAUSED"}</small>
                <p>{activeGate?.question.prompt ?? "New code incoming…"}</p>
                <i className="decision-track"><b style={{ width: activeGate?.decisionEndsAt ? `${Math.max(0, ((activeGate.decisionEndsAt - Date.now()) / DECISION_TIME_MS) * 100)}%` : "100%" }} /></i>
              </div>
            </div>
            <div className="lane-lines" aria-hidden="true"><i /><i /><i /></div>
            <div className="runner-marker" style={{ top: `${LANE_TOPS[lane]}%` }}>
              <PythonBot running />
              <span className="runner-name">{playerName}</span>
            </div>
            {gates.map((gate) => gate.question.answers.map((answer, answerLane) => (
              <div
                key={`${gate.id}-${answerLane}`}
                className={`answer-card lane-${answerLane} ${!gate.resolved && answerLane === lane ? "answer-selected" : ""} ${gate.decisionEndsAt && !gate.resolved ? "answer-ready" : ""} ${gate.resolved ? (answerLane === gate.question.correct ? "answer-correct" : "answer-passed") : ""}`}
                style={{ left: `${gate.x}%`, top: `${LANE_TOPS[answerLane]}%` }}
              >
                <span>{answerLane + 1}</span><b>{answer}</b>
              </div>
            )))}
            {coins.map((coin) => (
              <div
                key={coin.id}
                className={`python-coin ${coin.collected ? "coin-used" : ""}`}
                style={{ left: `${coin.x}%`, top: `${LANE_TOPS[coin.lane]}%` }}
                aria-hidden="true"
              >Py</div>
            ))}
            {feedback && <div className={`feedback ${feedback.good ? "good" : "bad"}`} role="status">{feedback.text}</div>}
            <div className="speed-lines" aria-hidden="true" />
          </div>

          <div className="play-footer">
            <div className="keys"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><span>CHOOSE LANE</span></div>
            <p><b>BYTE SAYS:</b> {lastLesson}</p>
            <div className="round-progress"><span style={{ width: `${(timeLeft / MAX_ACTIVE_SECONDS) * 100}%` }} /></div>
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
