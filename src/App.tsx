import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Phase = "idle" | "countdown" | "preview" | "guess" | "result";
type Difficulty = "easy" | "hard" | "brutal";

const EASY_PREVIEW_MS = 5000;
const HARD_PREVIEW_MS = 2000;
const BRUTAL_PREVIEW_MS = 1000;
const TOTAL_ROUNDS = 5;
const BEST_SCORE_50_KEY = "painters-eye-best-score-50";


function playSound(src: string, volume = 0.35) {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}


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


function App() {
  const hoverSound = useMemo(() => {
    const audio = new Audio("/sounds/hover.MP3");
    audio.volume = 0.12;
    return audio;
  }, []);
  
  const clickSound = useMemo(() => {
    const audio = new Audio("/sounds/bounce.MP3");
    audio.volume = 0.25;
    return audio;
  }, []);
  
  const stopwatchSound = useMemo(() => {
    const audio = new Audio("/sounds/timer.MP3");
    audio.volume = 0.22;
    return audio;
  }, []);

  const stopwatchHardSound = useMemo(() => {
    const audio = new Audio("/sounds/hardM.MP3");
    audio.volume = 0.22;
    return audio;
  }, []);

  const stopwatchBrutalSound = useMemo(() => {
    const audio = new Audio("/sounds/Danger.MP3");
    audio.volume = 0.22;
    return audio;
  }, []);

  
  const scoreSound = useMemo(() => {
    const audio = new Audio("/sounds/scoreNew.MP3");
    audio.volume = 0.3;
    return audio;
  }, []);

  
  function playAudio(audio: HTMLAudioElement) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
  
  function playHover() {
    playAudio(hoverSound);
  }
  
  function playClick() {
    playAudio(clickSound);
  }
  
  function playStopwatch() {
    playAudio(stopwatchSound);
  }
  
  function playScore() {
    playAudio(scoreSound);
  }
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

  const previewDurationMs =
  difficulty === "easy"
    ? EASY_PREVIEW_MS
    : difficulty === "hard"
    ? HARD_PREVIEW_MS
    : BRUTAL_PREVIEW_MS;


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
    if (difficulty === "brutal") {
      playAudio(stopwatchBrutalSound);
    } else if (difficulty === "hard") {
      playAudio(stopwatchHardSound);
    } else {
      playStopwatch();
    }


    setPhase("preview");
  }, COUNTDOWN_STEPS.length * 700);

  timeouts.push(finishTimeout);

  return () => timeouts.forEach((id) => window.clearTimeout(id));
}, [phase, currentRound, difficulty]);


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
    }, 16);

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
    Math.ceil((previewMsLeft / previewDurationMs) * 500));
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
  
    const scoreSoundTimeout = window.setTimeout(() => {
      playScore();
    }, 120);
  
    setScorePulse(true);
  
    const timeout = window.setTimeout(() => {
      setScorePulse(false);
    }, 600);
  
    return () => {
      window.clearTimeout(scoreSoundTimeout);
      window.clearTimeout(timeout);
    };
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
    playClick();
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
            <h1>Painter&apos;s Eye</h1>
            <p className="subtitle">
              Memorize each value, recreate it, and chase mastery.
              </p>
          </div>
        )}
        {phase === "idle" &&(
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
        </div>
        )}
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
            <p className="status">5 Rounds. 5 Values. Are you ready?</p>
              <div className="difficulty-slider" aria-label="Select difficulty">
                  <button
                    className={difficulty === "easy" ? "active" : ""}
                    onClick={() => {
                      playClick();
                      setDifficulty("easy")}}
                  >
                    Easy
                  </button>

                  <button
                    className={difficulty === "hard" ? "active" : ""}
                    onClick={() => {
                      playClick();
                      setDifficulty("hard")}}
                  >
                    Hard
                  </button>

                  <button
                    className={difficulty === "brutal" ? "active" : ""}
                    onClick={() => {
                      
                      playClick();
                      setDifficulty("brutal")}}
                  >
                    Brutal
                  </button>

                  <span className={`difficulty-pill difficulty-${difficulty}`} />
                </div>
            <button
              className="play-circle-button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                handleStartGame();
              }}
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
            <div className="single-square">
              <div
                className="square square-xl"
                style={{ backgroundColor: toGray(targetValue) }}
                aria-label="Reference value"
              >
                 <span className="result-round-indicator">
                  {currentRound}/{TOTAL_ROUNDS}
                </span>
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
      <div className="guess-screen">
        <div className="vertical-scale">
          <input
            className="value-slider"
            id="value-slider"
            type="range"
            min={0}
            max={255}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
          />
        </div>

        <div
          className="guess-square-full"
          style={{ backgroundColor: toGray(sliderValue) }}
          aria-label="Current guess preview"
        >

            <span className="result-round-indicator">
              {currentRound}/{TOTAL_ROUNDS}
            </span>
          <button
            className="bullseye-button bullseye-inside"
            onMouseEnter={playHover}
            onClick={() => {
              playClick();
              handleSubmit();
            }}
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
    )}

{phase === "result" && (
  <div className="result-stack">
    <span className="result-round-indicator">
  {currentRound}/{TOTAL_ROUNDS}
</span>
    <div
      className="result-panel guessed-panel"
      style={{ backgroundColor: toGray(sliderValue) }}
      aria-label="Guessed value"
    >
        <span className="result-label">Your guess:</span>
      <span
        className="guess-score-overlay"
        style={{ color: guessScoreTextColor }}
      >
        {rollingRoundScore.toFixed(2)}
      </span>
    </div>

    <div
      className="result-panel original-panel"
      style={{ backgroundColor: toGray(targetValue) }}
      aria-label="Original value"
    >
      <span className="result-label">Original:</span>
      {isSessionComplete ? (
        <div className="result-end-actions">
            <button
                className="icon-action-button"
                onClick={handlePlayAgain}
                aria-label="Play again"
                title="Play again"
              >
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path d="M48 24a18 18 0 1 0 2 16" />
                  <path d="M48 24V12" />
                  <path d="M48 24H36" />
                </svg>
              </button>
          <button onClick={handleBackToMenu}>Back to Menu</button>
        </div>
      ) : (
        <button
          className="arrow-button arrow-inside"
          onMouseEnter={playHover}
          onClick={() => {
            playClick();
            handleNextRound();
          }}

          aria-label="Next round"
        >
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M12 32h34" />
            <path d="M36 18l14 14-14 14" />
          </svg>
        </button>
        
      )}
    </div>
  </div>
)}
</section>
<button
            className="floating-bg-toggle"
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
</main>
);
}

export default App;
