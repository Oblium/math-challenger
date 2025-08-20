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
      if (!Number.isNaN(n) && n >= 1 && n <= 20) return n as Level;
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
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const correct = useMemo(() => {
    if (level === 4 || level === 14) {
      const [a, b] = operands;
      return (a ?? 0) - (b ?? 0);
    } else if (level === 5 || level === 6 || level === 7 || level === 8 || level === 15 || level === 16 || level === 17 || level === 18) {
      let total = operands[0] ?? 0;
      for (let i = 1; i < operands.length; i++) {
        const op = operators[i - 1];
        const val = operands[i] ?? 0;
        total = op === '+' ? total + val : total - val;
      }
      return total;
    } else if (level === 9 || level === 19) {
      const [a, b] = operands;
      return (a ?? 0) * (b ?? 0);
    } else if (level === 10 || level === 20) {
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
    // Levels 7, 8 (20s), 10 (13s), 17, 18 (25s), and 20 (18s) use a countdown timer
    const timedLevels = [7, 8, 10, 17, 18, 20];
    if (!timedLevels.includes(level)) {
      setTimeLeft(null);
      return;
    }
    let initial: number;
    if (level === 10) initial = 13;
    else if (level === 20) initial = 18; // 13 + 5
    else if (level === 7 || level === 8) initial = 20;
    else if (level === 17 || level === 18) initial = 25; // 20 + 5
    else initial = 20;
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
    setInputValue(''); // Reset input for levels 11-20
    clearTimers();

    const problem = generateNewProblem(level);
    setOperands(problem.terms);
    setOperators(problem.operators);
    setChoices(problem.choices);
    
    if (problem.hasTimer) {
      startTimerIfNeeded();
    }

    // Focus input for levels 11-20 after a short delay
    if (level >= 11 && level <= 20) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
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

  // Focus input when switching to input levels
  useEffect(() => {
    if (level >= 11 && level <= 20) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [level]);

  const onChoiceClick = (c: Choice) => {
    if (locked || c.disabled) return;
    if (c.value === correct) {
      setLocked(true);
      clearTimers();
      const nextStreak = streak + 1;
      const willLevelUp = nextStreak >= 20 && level < 20;
      if (willLevelUp) {
        // Special feedback and shorter delay before level up
        setFeedback({ kind: 'positive', text: 'you made it to the next level!' });
        setStreak(0);
        timeoutRef.current = window.setTimeout(() => {
          setLevel((l) => (l < 20 ? ((l + 1) as Level) : l));
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

  const processInputAnswer = (value: string) => {
    if (locked) return;
    
    const userAnswer = parseInt(value);
    if (isNaN(userAnswer)) return;
    
    if (userAnswer === correct) {
      setLocked(true);
      clearTimers();
      const nextStreak = streak + 1;
      const willLevelUp = nextStreak >= 20 && level < 20;
      if (willLevelUp) {
        // Special feedback and shorter delay before level up
        setFeedback({ kind: 'positive', text: 'you made it to the next level!' });
        setStreak(0);
        timeoutRef.current = window.setTimeout(() => {
          setLevel((l) => (l < 20 ? ((l + 1) as Level) : l));
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
      setInputValue(''); // Clear input on wrong answer
      // Refocus input after clearing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const onInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processInputAnswer(inputValue);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Auto-submit when input length matches result length
    const correctLength = Math.abs(correct).toString().length;
    if (value.length === correctLength && value.length > 0) {
      // Small delay to allow user to see what they typed
      setTimeout(() => {
        processInputAnswer(value);
      }, 100);
    }
  };

  const isInputLevel = level >= 11 && level <= 20;

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
            <option value={11}>11: Single-digit sums (input)</option>
            <option value={12}>12: 0–50 sums (input)</option>
            <option value={13}>13: 2–3 nums 0–99 (input)</option>
            <option value={14}>14: Differences 0–20 (a&gt;b) (input)</option>
            <option value={15}>15: 2–3 nums 0–20 with +/- (input)</option>
            <option value={16}>16: 2–3 nums 0–20 with +/- (negatives allowed) (input)</option>
            <option value={17}>17: Level 16 + 25s timer (input)</option>
            <option value={18}>18: Level 17 with 1–99 (input)</option>
            <option value={19}>19: Multiply 0–9 (input)</option>
            <option value={20}>20: 2–3 nums 1–30 with +/−/× (× before +/−) (input)</option>
          </select>
        </div>
        <div className="operation" aria-live="polite" aria-atomic="true">
          <div className="prompt">What is</div>
          <div className="expr">
            {formatExpression(operands, operators)} = ?
          </div>
        </div>
        {(level === 7 || level === 8 || level === 10 || level === 17 || level === 18 || level === 20) && timeLeft !== null && (
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
        {isInputLevel ? (
          <form onSubmit={onInputSubmit} className="input-form">
            <input
              ref={inputRef}
              type="tel"
              value={inputValue}
              onChange={onInputChange}
              placeholder="Enter answer"
              disabled={locked}
              className="answer-input"
              autoComplete="off"
              autoFocus
            />
            <button type="submit" disabled={locked || inputValue.trim() === ''} className="submit-button">
              Submit
            </button>
          </form>
        ) : (
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
        )}
        <div
          className={`streak ${streak > 0 ? 'on' : ''}`}
          style={{ color: getStreakColor(streak) }}
          role="status"
          aria-live="polite"
          aria-label={
            level < 20
              ? `Current streak: ${streak} out of 20`
              : `Current streak: ${streak}${streak > 20 ? ' with celebration' : ''}`
          }
        >
          Streak: {level < 20 ? `${streak}/20` : `${streak}`}
          {level === 20 && streak > 20 ? ' 🎉' : ''}
        </div>
      </main>
    </div>
  );
}
