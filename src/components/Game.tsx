import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  newProblem as generateNewProblem, 
  formatExpression, 
  getStreakColor,
  type Level, 
  type Choice,
  type Feedback,
  type Operator 
} from '../../android-app/gameLogic';

export default function Game() {
  const [operands, setOperands] = useState<number[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [locked, setLocked] = useState(false);
  const [level, setLevel] = useState<Level>(() => {
    try {
      const stored = localStorage.getItem('mc_level');
      const n = Number(stored);
      if (!Number.isNaN(n) && n >= 1 && n <= 10) return n as Level;
    } catch {}
    return 1;
  });
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('mc_streak');
      const n = Number(stored);
      if (!Number.isNaN(n) && n >= 0) return n;
    } catch {}
    return 0;
  });

  const correct = useMemo(() => {
    if (level === 4) {
      const [a, b] = operands;
      return (a ?? 0) - (b ?? 0);
    } else if (level === 5 || level === 6 || level === 7 || level === 8) {
      let total = operands[0] ?? 0;
      for (let i = 1; i < operands.length; i++) {
        const op = operators[i - 1];
        const val = operands[i] ?? 0;
        total = op === '+' ? total + val : total - val;
      }
      return total;
    } else if (level === 9) {
      const [a, b] = operands;
      return (a ?? 0) * (b ?? 0);
    } else if (level === 10) {
      // Evaluate with precedence: * before + and -
      if (operands.length === 0) return 0;
      // First, collapse multiplications
      const nums: number[] = [operands[0] ?? 0];
      const ops: ('+' | '-')[] = [];
      for (let i = 1; i < operands.length; i++) {
        const op = operators[i - 1]!;
        const val = operands[i] ?? 0;
        if (op === '*') {
          nums[nums.length - 1] = (nums[nums.length - 1] ?? 0) * val;
        } else if (op === '+' || op === '-') {
          nums.push(val);
          ops.push(op);
        }
      }
      // Then apply + and - left-to-right
      let total = nums[0] ?? 0;
      for (let i = 1; i < nums.length; i++) {
        total = ops[i - 1] === '+' ? total + (nums[i] ?? 0) : total - (nums[i] ?? 0);
      }
      return total;
    }
    return operands.reduce((sum, n) => sum + n, 0);
  }, [operands, operators, level]);

  const clearTimers = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimerIfNeeded = () => {
    // Levels 7, 8 (20s) and 10 (13s) use a countdown timer
    if (level !== 7 && level !== 8 && level !== 10) {
      setTimeLeft(null);
      return;
    }
    const initial = level === 10 ? 13 : 20;
    setTimeLeft(initial);
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = (prev ?? 0) - 1;
        if (next <= 0) {
          // Time's up: lock, show feedback, and move on
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setLocked(true);
          setFeedback({ kind: 'negative', text: "Time's up!" });
          setStreak(0);
          timeoutRef.current = window.setTimeout(() => {
            newProblem();
          }, 800);
          return 0;
        }
        return next;
      });
    }, 1000);
  };

  const newProblem = useCallback(() => {
    setLocked(false);
    setFeedback(null);
    clearTimers();

    const problem = generateNewProblem(level);
    setOperands(problem.terms);
    setOperators(problem.operators);
    setChoices(problem.choices);
    
    if (problem.hasTimer) {
      startTimerIfNeeded();
    }
  }, [level]);

  useEffect(() => {
    newProblem();
    return () => {
      clearTimers();
    };
  }, [newProblem]);

  // Persist level and streak across refreshes
  useEffect(() => {
    try {
      localStorage.setItem('mc_level', String(level));
    } catch {}
  }, [level]);
  useEffect(() => {
    try {
      localStorage.setItem('mc_streak', String(streak));
    } catch {}
  }, [streak]);

  const onChoiceClick = (c: Choice) => {
    if (locked || c.disabled) return;
    if (c.value === correct) {
      setLocked(true);
      clearTimers();
      const nextStreak = streak + 1;
      const willLevelUp = nextStreak >= 20 && level < 10;
      if (willLevelUp) {
        // Special feedback and shorter delay before level up
        setFeedback({ kind: 'positive', text: 'you made it to the next level!' });
        setStreak(0);
        timeoutRef.current = window.setTimeout(() => {
          setLevel((l) => (l < 10 ? ((l + 1) as Level) : l));
        }, 500);
      } else {
        setFeedback({ kind: 'positive', text: 'Correct! 🎉' });
        setStreak(nextStreak);
        timeoutRef.current = window.setTimeout(() => {
          newProblem();
        }, 800);
      }
    } else {
      setFeedback({ kind: 'negative', text: 'Try again…' });
      setStreak(0);
      setChoices((prev) => prev.map((ch) => (ch.id === c.id ? { ...ch, disabled: true } : ch)));
    }
  };

  return (
    <div className="container">
      <header className="top">
        <div className="toolbar">
          <label className="level-label" htmlFor="level-select">Level</label>
          <select
            id="level-select"
            className="level-select"
            value={level}
            onChange={(e) => {
              setLevel(Number(e.target.value) as Level);
              setStreak(0);
            }}
            aria-label="Select difficulty level"
          >
            <option value={1}>1: Single-digit sums</option>
            <option value={2}>2: 0–50 sums</option>
            <option value={3}>3: 2–3 nums 0–99</option>
            <option value={4}>4: Differences 0–20 (a&gt;b)</option>
            <option value={5}>5: 2–3 nums 0–20 with +/-</option>
            <option value={6}>6: 2–3 nums 0–20 with +/- (negatives allowed)</option>
            <option value={7}>7: Level 6 + 20s timer</option>
            <option value={8}>8: Level 7 with 1–99</option>
            <option value={9}>9: Multiply 0–9</option>
            <option value={10}>10: 2–3 nums 1–30 with +/−/× (× before +/−)</option>
          </select>
        </div>
        <div className="operation" aria-live="polite" aria-atomic="true">
          <div className="prompt">What is</div>
          <div className="expr">
            {formatExpression(operands, operators)} = ?
          </div>
        </div>
        {(level === 7 || level === 8 || level === 10) && timeLeft !== null && (
          <div
            className={`timer ${timeLeft <= 5 ? 'low' : ''}`}
            role="status"
            aria-live="polite"
            aria-label={`Time left: ${timeLeft} seconds`}
          >
            {timeLeft}s
          </div>
        )}
        {feedback && (
          <div
            className={`feedback floating ${feedback.kind === 'positive' ? 'ok' : 'bad'}`}
            role="status"
            aria-live="assertive"
          >
            {feedback.text}
          </div>
        )}
      </header>

      <main className="bottom">
        <div className="choices" role="list">
          {choices.map((c) => (
            <button
              key={c.id}
              className={`choice ${c.value < 0 ? 'neg' : ''} ${c.disabled ? 'disabled' : ''}`}
              onClick={() => onChoiceClick(c)}
              disabled={locked || c.disabled}
            >
              {c.value}
            </button>
          ))}
        </div>
        <div
          className={`streak ${streak > 0 ? 'on' : ''}`}
          style={{ color: getStreakColor(streak) }}
          role="status"
          aria-live="polite"
          aria-label={
            level < 10
              ? `Current streak: ${streak} out of 20`
              : `Current streak: ${streak}${streak > 20 ? ' with celebration' : ''}`
          }
        >
          Streak: {level < 10 ? `${streak}/20` : `${streak}`}
          {level === 10 && streak > 20 ? ' 🎉' : ''}
        </div>
      </main>
    </div>
  );
}
