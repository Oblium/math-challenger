import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Choice = {
  id: string;
  value: number;
  disabled: boolean;
};

type Feedback = { kind: 'positive' | 'negative'; text: string } | null;
type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type Operator = '+' | '-' | '*';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap safely with non-null assertions to satisfy noUncheckedIndexedAccess
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

function generateWrongChoices(correct: number, minVal: number, maxVal: number): number[] {
  const set = new Set<number>();
  // Use offsets near the correct answer to feel plausible
  const tryOffsets = shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
  for (const off of tryOffsets) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    const candidate = correct + off * sign;
    if (candidate >= minVal && candidate <= maxVal && candidate !== correct) set.add(candidate);
    if (set.size >= 2) break;
  }
  while (set.size < 2) {
    const c = randInt(minVal, maxVal);
    if (c !== correct) set.add(c);
  }
  return Array.from(set).slice(0, 2);
}

function absLastDigit(n: number) {
  return Math.abs(n) % 10;
}

function pickWithSameLastDigit(
  targetLast: number,
  correct: number,
  minVal: number,
  maxVal: number,
  maxDistance: number,
  avoid: Set<number>
): number | null {
  const minK = Math.ceil((minVal - targetLast) / 10);
  const maxK = Math.floor((maxVal - targetLast) / 10);
  if (minK > maxK) return null;
  for (let tries = 0; tries < 100; tries++) {
    const k = randInt(minK, maxK);
    const val = k * 10 + targetLast;
    if (!avoid.has(val) && Math.abs(val - correct) <= maxDistance) return val;
  }
  // Fallback linear scan
  for (let k = minK; k <= maxK; k++) {
    const val = k * 10 + targetLast;
    if (!avoid.has(val) && Math.abs(val - correct) <= maxDistance) return val;
  }
  return null;
}

function pickWithDifferentLastDigit(
  targetLast: number,
  correct: number,
  minVal: number,
  maxVal: number,
  maxDistance: number,
  avoid: Set<number>
): number | null {
  for (let tries = 0; tries < 120; tries++) {
    const candidate = randInt(minVal, maxVal);
    if (
      !avoid.has(candidate) &&
      absLastDigit(candidate) !== targetLast &&
      Math.abs(candidate - correct) <= maxDistance
    )
      return candidate;
  }
  // Fallback scan
  for (let v = Math.max(minVal, correct - maxDistance); v <= Math.min(maxVal, correct + maxDistance); v++) {
    if (!avoid.has(v) && absLastDigit(v) !== targetLast) return v;
  }
  return null;
}

function computeMaxDistance(minVal: number, maxVal: number) {
  const range = Math.max(0, maxVal - minVal);
  if (range <= 20) return 10;
  if (range <= 60) return 20;
  if (range <= 120) return 30;
  return 40; // hard cap
}

function pickNear(
  correct: number,
  minVal: number,
  maxVal: number,
  maxDistance: number,
  avoid: Set<number>
) {
  const low = Math.max(minVal, correct - maxDistance);
  const high = Math.min(maxVal, correct + maxDistance);
  if (low > high) return null;
  for (let tries = 0; tries < 100; tries++) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    const offset = randInt(1, Math.min(maxDistance, high - low));
    const cand = correct + sign * offset;
    if (cand >= low && cand <= high && !avoid.has(cand)) return cand;
  }
  // Fallback linear
  for (let v = low; v <= high; v++) if (!avoid.has(v) && v !== correct) return v;
  return null;
}

function enforceWrongDistance(
  correct: number,
  wrongs: number[],
  minVal: number,
  maxVal: number,
  maxDistance: number
) {
  const res = wrongs.slice();
  const avoid = new Set<number>([correct, ...res]);
  for (let i = 0; i < res.length; i++) {
    if (Math.abs(res[i]! - correct) > maxDistance) {
      const pick = pickNear(correct, minVal, maxVal, maxDistance, avoid);
      if (pick !== null) {
        avoid.delete(res[i]!);
        res[i] = pick;
        avoid.add(pick);
      }
    }
  }
  return res;
}

function adjustWrongChoicesForLastDigit(
  correct: number,
  wrongs: number[],
  minVal: number,
  maxVal: number,
  enabled: boolean
): number[] {
  if (!enabled) return wrongs;
  const targetLast = absLastDigit(correct);
  const desiredMatchesRand = Math.random();
  // Bias towards 1 or 2 matches: 0:10%, 1:45%, 2:45%
  const desiredMatches = desiredMatchesRand < 0.1 ? 0 : desiredMatchesRand < 0.55 ? 1 : 2;

  const maxDistance = computeMaxDistance(minVal, maxVal);
  // First bring all wrongs within the distance cap
  const result = enforceWrongDistance(correct, wrongs.slice(), minVal, maxVal, maxDistance);
  const avoid = new Set<number>([correct, ...result]);
  let currentMatches = result.filter((w) => absLastDigit(w) === targetLast).length;

  // Increase matches if needed
  for (let i = 0; i < result.length && currentMatches < desiredMatches; i++) {
    if (absLastDigit(result[i]!) !== targetLast) {
      const pick = pickWithSameLastDigit(targetLast, correct, minVal, maxVal, maxDistance, avoid);
      if (pick !== null) {
        avoid.delete(result[i]!);
        result[i] = pick;
        avoid.add(pick);
        currentMatches++;
      }
    }
  }

  // Decrease matches if too many
  for (let i = 0; i < result.length && currentMatches > desiredMatches; i++) {
    if (absLastDigit(result[i]!) === targetLast) {
      const pick = pickWithDifferentLastDigit(targetLast, correct, minVal, maxVal, maxDistance, avoid);
      if (pick !== null) {
        avoid.delete(result[i]!);
        result[i] = pick;
        avoid.add(pick);
        currentMatches--;
      }
    }
  }

  // Return as-is; pickers already respected the cap so we don't undo digit bias
  return result;
}

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

    if (level === 4) {
      // Differences: a in [4,20], b in [2, a-1] so that a > b
      const a = randInt(4, 20);
      const b = randInt(2, Math.max(2, a - 1));
      const nums: number[] = [a, b];
      setOperands(nums);
      setOperators([]);
      const correctVal = a - b;
      let wrongs = generateWrongChoices(correctVal, 0, 20);
      wrongs = adjustWrongChoicesForLastDigit(correctVal, wrongs, 0, 20, level >= 3);
      const values = shuffle([correctVal, ...wrongs]);
      const nextChoices: Choice[] = values.map((v, idx) => ({ id: `${Date.now()}-${idx}-${v}` , value: v, disabled: false }));
      setChoices(nextChoices);
      return;
    }

    if (level === 5) {
      // Mixed +/- with 2 or 3 numbers in 0..20, keep result non-negative
      const count: 2 | 3 = Math.random() < 0.5 ? 2 : 3;
      const nums: number[] = [];
      const ops: Operator[] = [];
      nums.push(randInt(0, 20));
      let current = nums[0] ?? 0;
      for (let i = 1; i < count; i++) {
        let op: Operator = Math.random() < 0.5 ? '+' : '-';
        if (current === 0) op = '+'; // avoid going negative from zero
        let next: number;
        if (op === '+') {
          next = randInt(0, 20);
          current += next;
        } else {
          // ensure we don't go negative overall
          next = randInt(0, current);
          current -= next;
        }
        nums.push(next);
        ops.push(op);
      }
      setOperands(nums);
      setOperators(ops);
      const correctVal = current;
      let wrongs = generateWrongChoices(correctVal, 0, 60);
      wrongs = adjustWrongChoicesForLastDigit(correctVal, wrongs, 0, 60, level >= 3);
      const values = shuffle([correctVal, ...wrongs]);
      const nextChoices: Choice[] = values.map((v, idx) => ({ id: `${Date.now()}-${idx}-${v}` , value: v, disabled: false }));
      setChoices(nextChoices);
      return;
    }

    if (level === 6 || level === 7 || level === 8) {
      // Mixed +/- with 2 or 3 numbers in 0..20; result can be negative
      const count: 2 | 3 = Math.random() < 0.5 ? 2 : 3;
      const nums: number[] = [];
      const ops: Operator[] = [];
      const minN = level === 8 ? 1 : 0;
      const maxN = level === 8 ? 99 : 20;
      nums.push(randInt(minN, maxN));
      let current = nums[0] ?? 0;
      for (let i = 1; i < count; i++) {
        const op: Operator = Math.random() < 0.5 ? '+' : '-';
        const next = randInt(minN, maxN);
        current = op === '+' ? current + next : current - next;
        nums.push(next);
        ops.push(op);
      }
      setOperands(nums);
      setOperators(ops);
      const correctVal = current;
      const minVal = -maxN * (count - 1);
      const maxVal = maxN * count;
      let wrongs = generateWrongChoices(correctVal, minVal, maxVal);
      wrongs = adjustWrongChoicesForLastDigit(correctVal, wrongs, minVal, maxVal, level >= 3);
      const values = shuffle([correctVal, ...wrongs]);
      const nextChoices: Choice[] = values.map((v, idx) => ({ id: `${Date.now()}-${idx}-${v}` , value: v, disabled: false }));
      setChoices(nextChoices);
      startTimerIfNeeded();
      return;
    }

    if (level === 9) {
      // Multiplication of two numbers between 0 and 9
      const a = randInt(0, 9);
      const b = randInt(0, 9);
      const nums: number[] = [a, b];
      setOperands(nums);
      setOperators([]);
      const correctVal = a * b;
      let wrongs = generateWrongChoices(correctVal, 0, 81);
      wrongs = adjustWrongChoicesForLastDigit(correctVal, wrongs, 0, 81, level >= 3);
      const values = shuffle([correctVal, ...wrongs]);
      const nextChoices: Choice[] = values.map((v, idx) => ({ id: `${Date.now()}-${idx}-${v}` , value: v, disabled: false }));
      setChoices(nextChoices);
      return;
    }

    if (level === 10) {
      // 2 or 3 numbers between 1 and 30, using +, -, * with precedence
      const count: 2 | 3 = Math.random() < 0.5 ? 2 : 3;
      const nums: number[] = [];
      const ops: Operator[] = [];
      for (let i = 0; i < count; i++) nums.push(randInt(1, 30));
      for (let i = 1; i < count; i++) {
        const r = Math.random();
        const op: Operator = r < 1 / 3 ? '+' : r < 2 / 3 ? '-' : '*';
        ops.push(op);
      }
      setOperands(nums);
      setOperators(ops);
      // Compute correct answer with precedence (same logic as above)
      const numsPrec: number[] = [nums[0] ?? 0];
      const opsPrec: ('+' | '-')[] = [];
      for (let i = 1; i < nums.length; i++) {
        const op = ops[i - 1]!;
        const val = nums[i] ?? 0;
        if (op === '*') {
          numsPrec[numsPrec.length - 1] = (numsPrec[numsPrec.length - 1] ?? 0) * val;
        } else {
          numsPrec.push(val);
          opsPrec.push(op as '+' | '-');
        }
      }
      let correctVal = numsPrec[0] ?? 0;
      for (let i = 1; i < numsPrec.length; i++) {
        correctVal = opsPrec[i - 1] === '+' ? correctVal + (numsPrec[i] ?? 0) : correctVal - (numsPrec[i] ?? 0);
      }
      const minVal = -900;
      const maxVal = 930;
      let wrongs = generateWrongChoices(correctVal, minVal, maxVal);
      wrongs = adjustWrongChoicesForLastDigit(correctVal, wrongs, minVal, maxVal, level >= 3);
      const values = shuffle([correctVal, ...wrongs]);
      const nextChoices: Choice[] = values.map((v, idx) => ({ id: `${Date.now()}-${idx}-${v}` , value: v, disabled: false }));
      setChoices(nextChoices);
      startTimerIfNeeded();
      return;
    }

    const maxOperand = level === 1 ? 9 : level === 2 ? 50 : 99;
    const count = level === 3 ? (Math.random() < 0.5 ? 2 : 3) : 2;
    const nums: number[] = Array.from({ length: count }, () => randInt(0, maxOperand));
    setOperands(nums);
    setOperators([]);
    const correctVal = nums.reduce((s, n) => s + n, 0);
    const maxSum = count * maxOperand;
    let wrongs = generateWrongChoices(correctVal, 0, maxSum);
    wrongs = adjustWrongChoicesForLastDigit(correctVal, wrongs, 0, maxSum, level >= 3);
    const values = shuffle([correctVal, ...wrongs]);
    const nextChoices: Choice[] = values.map((v, idx) => ({ id: `${Date.now()}-${idx}-${v}` , value: v, disabled: false }));
    setChoices(nextChoices);
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
            onChange={(e) => setLevel(Number(e.target.value) as Level)}
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
            {level === 4 && operands.length >= 2
              ? `${operands[0]} − ${operands[1]} = ?`
              : (level === 5 || level === 6 || level === 7 || level === 8) && operands.length >= 2
              ? `${operands[0]} ${operators[0] === '-' ? '−' : '+'} ${operands[1]}${operands[2] !== undefined ? ` ${operators[1] === '-' ? '−' : '+'} ${operands[2]}` : ''} = ?`
              : level === 9 && operands.length >= 2
              ? `${operands[0]} × ${operands[1]} = ?`
              : level === 10 && operands.length >= 2
              ? `${operands[0]} ${operators[0] === '*' ? '×' : operators[0] === '-' ? '−' : '+'} ${operands[1]}${operands[2] !== undefined ? ` ${operators[1] === '*' ? '×' : operators[1] === '-' ? '−' : '+'} ${operands[2]}` : ''} = ?`
              : `${operands.join(' + ')} = ?`}
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
