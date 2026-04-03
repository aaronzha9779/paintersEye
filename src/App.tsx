import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Phase = "idle" | "countdown" | "preview" | "guess" | "result";
type Difficulty = "easy" | "hard";

const EASY_PREVIEW_MS = 5000;
const HARD_PREVIEW_MS = 2000;
const TOTAL_ROUNDS = 5;
const BEST_SCORE_50_KEY = "painters-eye-best-score-50";


function randomGray(): number {
  return Math.floor(Math.random() * 256);
}

function toGray(value: number): string {
  return `rgb(${value}, ${value}, ${value})`;
}

function useRollingNumber(target: number, shouldAnimate: boolean, duration = 750) {
  const [value, setValue] = useState<number>(target);

  useEffect(() => {
    if (!shouldAnimate) {
      setValue(target);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(target * progress);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    setValue(0);
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target, shouldAnimate, duration]);

  return value;
}

function randomCountdownValues(): [number, number, number] {
  return [randomGray(), randomGray(), randomGray()];
}

function calculateRoundScore(diff: number): number {
  const normalized = diff / 255;
  const harshScore = Math.max(0, 10 * Math.pow(1 - normalized, 2.2));
  return Number(harshScore.toFixed(2));
}

function getAccuracyLabel(diff: number): string {
  if (diff <= 2) return "Perfect";
  if (diff <= 5) return "Excellent";
  if (diff <= 10) return "Great";
  if (diff <= 18) return "Good";
  if (diff <= 30) return "Ok";
  return "Miss";
}

function App() {
  const [targetValue, setTargetValue] = useState<number>(randomGray());
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [isFadingIn, setIsFadingIn] = useState<boolean>(false);
  const [backgroundMode, setBackgroundMode] = useState<"black" | "white">("black");
  const [difference, setDifference] = useState<number | null>(null);
  const [previewMsLeft, setPreviewMsLeft] = useState<number>(EASY_PREVIEW_MS);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const previewCounterTextColor = targetValue >= 128 ? "#1a1a1a" : "#f5f5f5";

const COUNTDOWN_STEPS = ["READY", "SET", "GO"] as const;
const [countdownIndex, setCountdownIndex] = useState<number>(0);
const [countdownValues, setCountdownValues] = useState<[number, number, number]>(
  randomCountdownValues()
);

  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [bestScoreOutOf50, setBestScoreOutOf50] = useState<number>(() => {
    const saved = window.localStorage.getItem(BEST_SCORE_50_KEY);
    const parsed = Number(saved);
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const countdownValue = countdownValues[countdownIndex] ?? 0;
const countdownTextColor = countdownValue >= 140 ? "#111111" : "#f5f5f5";
  const [scorePulse, setScorePulse] = useState<boolean>(false);

  const previewDurationMs = difficulty === "hard" ? HARD_PREVIEW_MS : EASY_PREVIEW_MS;


useEffect(() => {
  if (phase !== "countdown") return;

  setCountdownIndex(0);

  const timeouts: number[] = [];

  COUNTDOWN_STEPS.forEach((_, index) => {
    const timeout = window.setTimeout(() => {
      setCountdownIndex(index);
    }, index * 700);
    timeouts.push(timeout);
  });

  const finishTimeout = window.setTimeout(() => {
    setPhase("preview");
  }, COUNTDOWN_STEPS.length * 700);

  timeouts.push(finishTimeout);

  return () => timeouts.forEach((id) => window.clearTimeout(id));
}, [phase, currentRound]);



  useEffect(() => {
    if (phase !== "preview") return;

    setPreviewMsLeft(previewDurationMs);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(previewDurationMs - elapsed, 0);
      setPreviewMsLeft(remaining);

      if (remaining === 0) {
        window.clearInterval(interval);
        setPhase("guess");
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [phase, targetValue, currentRound, previewDurationMs]);

  const roundScoreOutOf10 = useMemo(() => {
    if (difference === null) return null;
    return calculateRoundScore(difference ?? 0);
  }, [difference]);

  const averageScoreOutOf10 = useMemo(() => {
    if (roundScores.length === 0) return 0;
    const total = roundScores.reduce((sum, value) => sum + value, 0);
    return total / roundScores.length;
  }, [roundScores]);

  const finalScoreOutOf50 = useMemo(() => {
    if (roundScores.length === 0) return 0;
    return roundScores.reduce((total, roundScore) => total + roundScore, 0);
  }, [roundScores]);

  const previewCountdownDisplay = Math.max(
    0,
    Math.ceil(((previewMsLeft / previewDurationMs) * 500) / 10) * 10
  );
  const timerText = String(previewCountdownDisplay).padStart(3, "0");

  const isFinalRound = currentRound === TOTAL_ROUNDS;
  const isSessionComplete = roundScores.length === TOTAL_ROUNDS;
  const hasStarted = phase !== "idle" || roundScores.length > 0;
  const rollingRoundScore = useRollingNumber(roundScoreOutOf10 ?? 0, phase === "result");
  const rollingAverage = useRollingNumber(
    averageScoreOutOf10,
    phase === "result" && isSessionComplete
  );
  const rollingAccuracy = useRollingNumber(
    finalScoreOutOf50,
    phase === "result" && isSessionComplete
  );
  const guessScoreTextColor = sliderValue >= 140 ? "#111111" : "#f5f5f5";

  useEffect(() => {
    if (phase !== "result") return;
    setScorePulse(true);
    const timeout = window.setTimeout(() => setScorePulse(false), 520);
    return () => window.clearTimeout(timeout);
  }, [phase, currentRound]);

  function handleSubmit() {
    if (phase !== "guess") return;

    const diff = Math.abs(targetValue - sliderValue);
    const roundScore = calculateRoundScore(diff);

    setDifference(diff);
    setRoundScores((previous) => [...previous, roundScore]);
    setPhase("result");
  }

  function startNextRound() {
    setTargetValue(randomGray());
    setSliderValue(0);
    setDifference(null);
    setPreviewMsLeft(previewDurationMs);
    setCountdownValues(randomCountdownValues());
    setPhase("countdown");
  }

  function handleStartGame() {
    setIsFadingIn(true);
    window.setTimeout(() => setIsFadingIn(false), 320);
    setCurrentRound(1);
    setRoundScores([]);
    startNextRound();
  }

  function handleNextRound() {
    if (isFinalRound) return;
    setCurrentRound((value) => value + 1);
    startNextRound();
  }

  function handlePlayAgain() {
    setIsFadingIn(true);
    window.setTimeout(() => setIsFadingIn(false), 320);
    setCurrentRound(1);
    setRoundScores([]);
    startNextRound();
  }

  function handleToggleDifficulty() {
    setDifficulty((mode) => (mode === "easy" ? "hard" : "easy"));
  }

  function handleBackToMenu() {
    setPhase("idle");
    setCurrentRound(1);
    setRoundScores([]);
    setDifference(null);
    setSliderValue(0);
  }

  useEffect(() => {
    if (!isSessionComplete) return;
    if (finalScoreOutOf50 <= bestScoreOutOf50) return;
    setBestScoreOutOf50(finalScoreOutOf50);
    window.localStorage.setItem(BEST_SCORE_50_KEY, String(finalScoreOutOf50));
  }, [isSessionComplete, finalScoreOutOf50, bestScoreOutOf50]);


  const [timerTicking, setTimerTicking] = useState(false);

  useEffect(() => {
    if (phase !== "preview") return;
    setTimerTicking(true);
    const timeout = window.setTimeout(() => setTimerTicking(false), 90);
    return () => window.clearTimeout(timeout);
  }, [previewCountdownDisplay, phase]);


  return (
    <main className={`app ${backgroundMode === "black" ? "bg-black" : "bg-white"}`}>
      <section className={`card ${isFadingIn ? "card-fade-in" : ""} ${phase === "idle" ? "phase-idle" : ""}`}>
        {phase === "idle" && (
          <div className="home-header">
            <h1>Painter&apos;s Eye: Value Match</h1>
            <p className="subtitle">
              5-round mode: memorize each value, recreate it, and chase your best
              score.
            </p>
          </div>
        )}
        <div className="top-row">
          {hasStarted ? (
            <p className="meta">
              Round {currentRound}/{TOTAL_ROUNDS} | Mode:{" "}
              <strong>{difficulty === "hard" ? "Hard" : "Easy"}</strong> | Best:{" "}
              <strong>{bestScoreOutOf50.toFixed(1)}</strong>/50
            </p>
          ) : (
            <p className="meta">
              Best score: <strong>{bestScoreOutOf50.toFixed(1)}</strong>/50
            </p>
          )}
          <button
            className="toggle-bg-button"
            onClick={() =>
              setBackgroundMode((mode) => (mode === "black" ? "white" : "black"))
            }
            aria-label="Toggle background mode"
            title="Toggle background mode"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.5v3.2M12 18.3v3.2M21.5 12h-3.2M5.7 12H2.5M18.8 5.2l-2.2 2.2M7.4 16.6l-2.2 2.2M18.8 18.8l-2.2-2.2M7.4 7.4 5.2 5.2" />
            </svg>
          </button>
        </div>
        {phase === "countdown" && (
        <div
          className="countdown-screen"
          style={{ backgroundColor: toGray(countdownValue) }}
        >
          <div
            key={countdownIndex}
            className="countdown-word"
            style={{ color: countdownTextColor }}
          >
            {COUNTDOWN_STEPS[countdownIndex]}
          </div>
        </div>
      )}
        {phase === "idle" && (
          <div className="controls home-controls">
            <p className="status">Click play to begin a 5-round session.</p>
            <div className="mode-switch-wrap">
              <span className="mode-text">Easy</span>
              <label className="mode-switch" aria-label="Toggle hard mode">
                <input
                  type="checkbox"
                  checked={difficulty === "hard"}
                  onChange={handleToggleDifficulty}
                />
                <span className="mode-slider" />
              </label>
              <span className="mode-text">Hard</span>
            </div>
            <button
              className="play-circle-button"
              onClick={handleStartGame}
              aria-label="Start game"
              title="Start game"
            >
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <path d="M20 14l30 18-30 18z" />
              </svg>
            </button>
          </div>
        )}


        {phase === "preview" && (
          <>
            <p className="status">Memorize this value</p>
            <div className="single-square">
              <div
                className="square square-xl"
                style={{ backgroundColor: toGray(targetValue) }}
                aria-label="Reference value"
              >
               <div
                  className="square-counter"
                  aria-label={`Timer ${timerText}`}
                  style={{ color: previewCounterTextColor }}
                >
                  <span className={`timer-full ${timerTicking ? "timer-tick" : ""}`}>
                    {timerText}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {phase === "guess" && (
          <div className="controls">
            <label htmlFor="value-slider">Your value: {sliderValue}</label>
            <div className="guess-layout">
              <div className="vertical-scale">
                <span>255</span>
                <input
                  className="value-slider"
                  id="value-slider"
                  type="range"
                  min={0}
                  max={255}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                />
                <span>0</span>
              </div>
              <div className="labeled-square">
                <span>Current guess</span>
                <div
                  className="square square-guess"
                  style={{ backgroundColor: toGray(sliderValue) }}
                  aria-label="Current guess preview"
                />
                <button
                  className="bullseye-button"
                  onClick={handleSubmit}
                  aria-label="Submit guess"
                  title="Submit guess"
                >
                  <svg viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="44" />
                    <circle cx="50" cy="50" r="30" />
                    <circle cx="50" cy="50" r="16" />
                    <circle cx="50" cy="50" r="5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "result" && (
          <>
            <p className="status">Result</p>
            <div className="comparison">
              <div className="labeled-square">
                <span>Original</span>
                <div
                  className="square result-rect"
                  style={{ backgroundColor: toGray(targetValue) }}
                  aria-label="Original value"
                />
              </div>
              <div className="labeled-square">
                <span>Your guess</span>
                <div
                  className="square result-rect"
                  style={{ backgroundColor: toGray(sliderValue) }}
                  aria-label="Guessed value"
                >
                  <span className="guess-score-overlay" style={{ color: guessScoreTextColor }}>
                    {rollingRoundScore.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            {isSessionComplete ? (
              <>
                <div className={`scoreboard ${scorePulse ? "score-pop" : ""}`}>
                  <p className="score">
                    Final average: <strong>{rollingAverage.toFixed(2)}</strong>
                  </p>
                  <p className="score score-primary">
                    Final: <strong>{rollingAccuracy.toFixed(2)}</strong> / 50
                  </p>
                </div>
                <div className="result-actions end-actions">
                  <button onClick={handlePlayAgain}>Play Again</button>
                  <button onClick={handleBackToMenu}>Back to Menu</button>
                </div>
              </>
            ) : (
              <div className="result-actions">
                <button className="arrow-button" onClick={handleNextRound} aria-label="Next round">
                  <svg viewBox="0 0 64 64" aria-hidden="true">
                    <path d="M12 32h34" />
                    <path d="M36 18l14 14-14 14" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default App;
