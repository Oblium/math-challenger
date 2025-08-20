export type Choice = {
  id: string;
  value: number;
  disabled: boolean;
};

export type Feedback = { kind: 'positive' | 'negative'; text: string } | null;
export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;
export type Operator = '+' | '-' | '*';

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

function generateWrongChoices(correct: number, minVal: number, maxVal: number): number[] {
  const set = new Set<number>();
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
  return 40;
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
  const desiredMatches = desiredMatchesRand < 0.1 ? 0 : desiredMatchesRand < 0.55 ? 1 : 2;

  const maxDistance = computeMaxDistance(minVal, maxVal);
  const result = enforceWrongDistance(correct, wrongs.slice(), minVal, maxVal, maxDistance);
  const avoid = new Set<number>([correct, ...result]);
  let currentMatches = result.filter((w) => absLastDigit(w) === targetLast).length;

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

  return result;
}

export function evaluateExpression(terms: number[], operators: Operator[]): number {
  if (terms.length === 0) return 0;
  
  // Handle multiplication precedence first
  const nums: number[] = [terms[0]!];
  const ops: ('+' | '-')[] = [];
  
  for (let i = 1; i < terms.length; i++) {
    const op = operators[i - 1]!;
    const val = terms[i] ?? 0;
    
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

export function newProblem(level: Level): {
  terms: number[];
  operators: Operator[];
  result: number;
  choices: Choice[];
  hasTimer: boolean;
  timerSeconds: number;
} {
  let terms: number[] = [];
  let operators: Operator[] = [];
  let result: number;
  let minChoice: number;
  let maxChoice: number;
  let hasTimer = false;
  let timerSeconds = 0;

  switch (level) {
    case 1:
      terms = [randInt(0, 9), randInt(0, 9)];
      operators = ['+'];
      result = terms[0]! + terms[1]!;
      minChoice = 0;
      maxChoice = 18;
      break;

    case 2:
      terms = [randInt(0, 50), randInt(0, 50)];
      operators = ['+'];
      result = terms[0]! + terms[1]!;
      minChoice = 0;
      maxChoice = 100;
      break;

    case 3: {
      const numTerms = randInt(2, 3);
      terms = Array.from({ length: numTerms }, () => randInt(0, 99));
      operators = Array.from({ length: numTerms - 1 }, () => '+' as Operator);
      result = terms.reduce((sum, term) => sum + term, 0);
      minChoice = 0;
      maxChoice = 297;
      break;
    }

    case 4: {
      const a = randInt(4, 20);
      const b = randInt(2, a - 1);
      terms = [a, b];
      operators = ['-'];
      result = a - b;
      minChoice = 1;
      maxChoice = 18;
      break;
    }

    case 5: {
      const numTerms = randInt(2, 3);
      let runningTotal = randInt(5, 15);
      terms = [runningTotal];
      
      for (let i = 1; i < numTerms; i++) {
        const op: Operator = Math.random() < 0.5 ? '+' : '-';
        let operand: number;
        
        if (op === '-') {
          operand = randInt(1, Math.min(20, runningTotal));
        } else {
          operand = randInt(1, 20);
        }
        
        terms.push(operand);
        operators.push(op);
        runningTotal = op === '+' ? runningTotal + operand : runningTotal - operand;
      }
      
      result = runningTotal; // Use the carefully calculated runningTotal, not evaluateExpression
      minChoice = 0;
      maxChoice = 75;
      break;
    }

    case 6: {
      const numTerms = randInt(2, 3);
      terms = [randInt(0, 20)];
      
      for (let i = 1; i < numTerms; i++) {
        const op: Operator = Math.random() < 0.5 ? '+' : '-';
        const operand = randInt(0, 20);
        terms.push(operand);
        operators.push(op);
      }
      
      result = evaluateExpression(terms, operators);
      minChoice = -60;
      maxChoice = 60;
      break;
    }

    case 7: {
      const numTerms = randInt(2, 3);
      terms = [randInt(0, 20)];
      
      for (let i = 1; i < numTerms; i++) {
        const op: Operator = Math.random() < 0.5 ? '+' : '-';
        const operand = randInt(0, 20);
        terms.push(operand);
        operators.push(op);
      }
      
      result = evaluateExpression(terms, operators);
      minChoice = -60;
      maxChoice = 60;
      hasTimer = true;
      timerSeconds = 20;
      break;
    }

    case 8: {
      const numTerms = randInt(2, 3);
      terms = [randInt(1, 99)];
      
      for (let i = 1; i < numTerms; i++) {
        const op: Operator = Math.random() < 0.5 ? '+' : '-';
        const operand = randInt(1, 99);
        terms.push(operand);
        operators.push(op);
      }
      
      result = evaluateExpression(terms, operators);
      minChoice = -198;
      maxChoice = 297;
      hasTimer = true;
      timerSeconds = 20;
      break;
    }

    case 9:
      terms = [randInt(0, 9), randInt(0, 9)];
      operators = ['*'];
      result = terms[0]! * terms[1]!;
      minChoice = 0;
      maxChoice = 81;
      break;

    case 10: {
      const numTerms = randInt(2, 3);
      terms = [randInt(1, 30)];
      
      for (let i = 1; i < numTerms; i++) {
        const ops: Operator[] = ['+', '-', '*'];
        const op = ops[randInt(0, 2)]!;
        const operand = randInt(1, 30);
        terms.push(operand);
        operators.push(op);
      }
      
      result = evaluateExpression(terms, operators);
      minChoice = -59;
      maxChoice = 930;
      hasTimer = true;
      timerSeconds = 13;
      break;
    }

    // Levels 11-20 replicate levels 1-10 but use input instead of choices
    case 11: {
      terms = [randInt(0, 9), randInt(0, 9)];
      operators = ['+'];
      result = terms[0]! + terms[1]!;
      minChoice = 0;
      maxChoice = 18;
      hasTimer = false;
      timerSeconds = 0;
      break;
    }

    case 12: {
      terms = [randInt(0, 50), randInt(0, 50)];
      operators = ['+'];
      result = terms[0]! + terms[1]!;
      minChoice = 0;
      maxChoice = 100;
      hasTimer = false;
      timerSeconds = 0;
      break;
    }

    case 13: {
      const numTerms = randInt(2, 3);
      terms = Array.from({ length: numTerms }, () => randInt(0, 99));
      operators = Array.from({ length: numTerms - 1 }, () => '+' as Operator);
      result = terms.reduce((sum, term) => sum + term, 0);
      minChoice = 0;
      maxChoice = 297;
      hasTimer = false;
      timerSeconds = 0;
      break;
    }

    case 14: {
      const a = randInt(4, 20);
      const b = randInt(2, a - 1);
      terms = [a, b];
      operators = ['-'];
      result = a - b;
      minChoice = 1;
      maxChoice = 18;
      hasTimer = false;
      timerSeconds = 0;
      break;
    }

    case 15: {
      const numTerms = randInt(2, 3);
      let runningTotal = randInt(5, 15);
      terms = [runningTotal];
      
      for (let i = 1; i < numTerms; i++) {
        const op: Operator = Math.random() < 0.5 ? '+' : '-';
        let operand: number;
        
        if (op === '-') {
          operand = randInt(1, Math.min(20, runningTotal));
        } else {
          operand = randInt(1, 20);
        }
        
        terms.push(operand);
        operators.push(op);
        runningTotal = op === '+' ? runningTotal + operand : runningTotal - operand;
      }
      
      result = runningTotal;
      minChoice = 0;
      maxChoice = 75;
      hasTimer = false;
      timerSeconds = 0;
      break;
    }

    case 16: {
      const numTerms = randInt(2, 3);
      terms = [randInt(0, 20)];
      
      for (let i = 1; i < numTerms; i++) {
        const op: Operator = Math.random() < 0.5 ? '+' : '-';
        const operand = randInt(0, 20);
        terms.push(operand);
        operators.push(op);
      }
      
      result = evaluateExpression(terms, operators);
      minChoice = -60;
      maxChoice = 60;
      hasTimer = false;
      timerSeconds = 0;
      break;
    }

    case 17: {
      const numTerms = randInt(2, 3);
      terms = [randInt(0, 20)];
      
      for (let i = 1; i < numTerms; i++) {
        const op: Operator = Math.random() < 0.5 ? '+' : '-';
        const operand = randInt(0, 20);
        terms.push(operand);
        operators.push(op);
      }
      
      result = evaluateExpression(terms, operators);
      minChoice = -60;
      maxChoice = 60;
      hasTimer = true;
      timerSeconds = 25; // 20 + 5
      break;
    }

    case 18: {
      const numTerms = randInt(2, 3);
      terms = [randInt(1, 99)];
      
      for (let i = 1; i < numTerms; i++) {
        const op: Operator = Math.random() < 0.5 ? '+' : '-';
        const operand = randInt(1, 99);
        terms.push(operand);
        operators.push(op);
      }
      
      result = evaluateExpression(terms, operators);
      minChoice = -198;
      maxChoice = 297;
      hasTimer = true;
      timerSeconds = 25; // 20 + 5
      break;
    }

    case 19: {
      terms = [randInt(0, 9), randInt(0, 9)];
      operators = ['*'];
      result = terms[0]! * terms[1]!;
      minChoice = 0;
      maxChoice = 81;
      hasTimer = false;
      timerSeconds = 0;
      break;
    }

    case 20: {
      const numTerms = randInt(2, 3);
      terms = [randInt(1, 30)];
      
      for (let i = 1; i < numTerms; i++) {
        const ops: Operator[] = ['+', '-', '*'];
        const op = ops[randInt(0, 2)]!;
        const operand = randInt(1, 30);
        terms.push(operand);
        operators.push(op);
      }
      
      result = evaluateExpression(terms, operators);
      minChoice = -59;
      maxChoice = 930;
      hasTimer = true;
      timerSeconds = 18; // 13 + 5
      break;
    }
  }

  // Levels 11-20 use input instead of choices
  if (level >= 11 && level <= 20) {
    return {
      terms,
      operators,
      result,
      choices: [],
      hasTimer,
      timerSeconds,
    };
  }

  const wrongChoices = level >= 3 
    ? adjustWrongChoicesForLastDigit(result, generateWrongChoices(result, minChoice, maxChoice), minChoice, maxChoice, true)
    : generateWrongChoices(result, minChoice, maxChoice);

  const allChoices = shuffle([
    { id: `${Date.now()}-correct`, value: result, disabled: false },
    { id: `${Date.now()}-wrong1`, value: wrongChoices[0]!, disabled: false },
    { id: `${Date.now()}-wrong2`, value: wrongChoices[1]!, disabled: false },
  ]);

  return {
    terms,
    operators,
    result,
    choices: allChoices,
    hasTimer,
    timerSeconds,
  };
}

export function formatExpression(terms: number[], operators: Operator[]): string {
  if (terms.length === 0) return '';
  
  let expression = terms[0]!.toString();
  for (let i = 0; i < operators.length; i++) {
    expression += ` ${operators[i]} ${terms[i + 1]}`;
  }
  return expression;
}

export function getStreakColor(streak: number): string {
  if (streak >= 18) return '#22c55e'; // green
  if (streak >= 15) return '#84cc16'; // light green  
  if (streak >= 10) return '#eab308'; // yellow
  if (streak >= 5) return '#f97316';  // orange
  return '#ffffff'; // white
}