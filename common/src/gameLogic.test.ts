import { describe, it, expect, vi } from 'vitest'
import {
  randInt,
  shuffle,
  evaluateExpression,
  newProblem,
  formatExpression,
  getStreakColor,
  type Level,
  type Operator,
} from './gameLogic'

describe('Core Utility Functions', () => {
  describe('randInt', () => {
    it('should return integers within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randInt(1, 10)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(10)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    it('should handle single value range', () => {
      expect(randInt(5, 5)).toBe(5)
    })

    it('should handle negative ranges', () => {
      for (let i = 0; i < 50; i++) {
        const result = randInt(-10, -5)
        expect(result).toBeGreaterThanOrEqual(-10)
        expect(result).toBeLessThanOrEqual(-5)
      }
    })
  })

  describe('shuffle', () => {
    it('should return array with same length', () => {
      const arr = [1, 2, 3, 4, 5]
      const shuffled = shuffle(arr)
      expect(shuffled).toHaveLength(arr.length)
    })

    it('should contain all original elements', () => {
      const arr = [1, 2, 3, 4, 5]
      const shuffled = shuffle(arr)
      expect(shuffled.sort()).toEqual(arr.sort())
    })

    it('should not modify original array', () => {
      const arr = [1, 2, 3, 4, 5]
      const original = [...arr]
      shuffle(arr)
      expect(arr).toEqual(original)
    })

    it('should handle empty array', () => {
      expect(shuffle([])).toEqual([])
    })

    it('should handle single element', () => {
      expect(shuffle([42])).toEqual([42])
    })
  })
})

describe('Expression Evaluation', () => {
  describe('evaluateExpression', () => {
    it('should handle empty terms', () => {
      expect(evaluateExpression([], [])).toBe(0)
    })

    it('should handle single term', () => {
      expect(evaluateExpression([42], [])).toBe(42)
    })

    it('should handle addition', () => {
      expect(evaluateExpression([5, 3], ['+'])).toBe(8)
      expect(evaluateExpression([1, 2, 3], ['+', '+'])).toBe(6)
    })

    it('should handle subtraction', () => {
      expect(evaluateExpression([10, 3], ['-'])).toBe(7)
      expect(evaluateExpression([20, 5, 2], ['-', '-'])).toBe(13)
    })

    it('should handle multiplication', () => {
      expect(evaluateExpression([4, 5], ['*'])).toBe(20)
      expect(evaluateExpression([2, 3, 4], ['*', '*'])).toBe(24)
    })

    it('should handle operator precedence (multiplication before addition)', () => {
      expect(evaluateExpression([2, 3, 4], ['+', '*'])).toBe(14) // 2 + (3 * 4) = 14
      expect(evaluateExpression([5, 2, 3], ['*', '+'])).toBe(13) // (5 * 2) + 3 = 13
    })

    it('should handle operator precedence (multiplication before subtraction)', () => {
      expect(evaluateExpression([10, 2, 3], ['-', '*'])).toBe(4) // 10 - (2 * 3) = 4
      expect(evaluateExpression([3, 4, 2], ['*', '-'])).toBe(10) // (3 * 4) - 2 = 10
    })

    it('should handle complex mixed operations', () => {
      expect(evaluateExpression([1, 2, 3, 4], ['+', '*', '-'])).toBe(3) // 1 + (2 * 3) - 4 = 3
      expect(evaluateExpression([10, 2, 5, 3], ['-', '+', '*'])).toBe(23) // 10 - 2 + (5 * 3) = 10 - 2 + 15 = 23
    })
  })
})

describe('formatExpression', () => {
  it('should handle empty terms', () => {
    expect(formatExpression([], [])).toBe('')
  })

  it('should handle single term', () => {
    expect(formatExpression([42], [])).toBe('42')
  })

  it('should format simple expressions', () => {
    expect(formatExpression([5, 3], ['+'])).toBe('5 + 3')
    expect(formatExpression([10, 4], ['-'])).toBe('10 - 4')
    expect(formatExpression([6, 7], ['*'])).toBe('6 * 7')
  })

  it('should format complex expressions', () => {
    expect(formatExpression([1, 2, 3], ['+', '*'])).toBe('1 + 2 * 3')
    expect(formatExpression([10, 5, 2, 3], ['-', '+', '*'])).toBe('10 - 5 + 2 * 3')
  })
})

describe('getStreakColor', () => {
  it('should return white for streak < 5', () => {
    expect(getStreakColor(0)).toBe('#ffffff')
    expect(getStreakColor(4)).toBe('#ffffff')
  })

  it('should return orange for streak 5-9', () => {
    expect(getStreakColor(5)).toBe('#f97316')
    expect(getStreakColor(9)).toBe('#f97316')
  })

  it('should return yellow for streak 10-14', () => {
    expect(getStreakColor(10)).toBe('#eab308')
    expect(getStreakColor(14)).toBe('#eab308')
  })

  it('should return light green for streak 15-17', () => {
    expect(getStreakColor(15)).toBe('#84cc16')
    expect(getStreakColor(17)).toBe('#84cc16')
  })

  it('should return green for streak >= 18', () => {
    expect(getStreakColor(18)).toBe('#22c55e')
    expect(getStreakColor(25)).toBe('#22c55e')
    expect(getStreakColor(100)).toBe('#22c55e')
  })
})

describe('Problem Generation', () => {
  describe('newProblem', () => {
    // Test each level's constraints
    describe('Level 1 - Simple Addition (0-9)', () => {
      it('should generate addition problems with operands 0-9', () => {
        for (let i = 0; i < 50; i++) {
          const problem = newProblem(1)
          expect(problem.terms).toHaveLength(2)
          expect(problem.operators).toEqual(['+'])
          expect(problem.terms[0]).toBeGreaterThanOrEqual(0)
          expect(problem.terms[0]).toBeLessThanOrEqual(9)
          expect(problem.terms[1]).toBeGreaterThanOrEqual(0)
          expect(problem.terms[1]).toBeLessThanOrEqual(9)
          expect(problem.result).toBe(problem.terms[0]! + problem.terms[1]!)
          expect(problem.hasTimer).toBe(false)
          expect(problem.choices).toHaveLength(3)
        }
      })
    })

    describe('Level 2 - Addition (0-50)', () => {
      it('should generate addition problems with operands 0-50', () => {
        for (let i = 0; i < 30; i++) {
          const problem = newProblem(2)
          expect(problem.terms).toHaveLength(2)
          expect(problem.operators).toEqual(['+'])
          expect(problem.terms[0]).toBeGreaterThanOrEqual(0)
          expect(problem.terms[0]).toBeLessThanOrEqual(50)
          expect(problem.terms[1]).toBeGreaterThanOrEqual(0)
          expect(problem.terms[1]).toBeLessThanOrEqual(50)
          expect(problem.result).toBe(problem.terms[0]! + problem.terms[1]!)
          expect(problem.hasTimer).toBe(false)
        }
      })
    })

    describe('Level 3 - Addition (0-99, 2-3 terms)', () => {
      it('should generate addition problems with 2-3 operands 0-99', () => {
        for (let i = 0; i < 30; i++) {
          const problem = newProblem(3)
          expect(problem.terms.length).toBeGreaterThanOrEqual(2)
          expect(problem.terms.length).toBeLessThanOrEqual(3)
          expect(problem.operators).toHaveLength(problem.terms.length - 1)
          expect(problem.operators.every(op => op === '+')).toBe(true)
          
          problem.terms.forEach(term => {
            expect(term).toBeGreaterThanOrEqual(0)
            expect(term).toBeLessThanOrEqual(99)
          })
          
          const expectedSum = problem.terms.reduce((sum, term) => sum + term, 0)
          expect(problem.result).toBe(expectedSum)
          expect(problem.hasTimer).toBe(false)
        }
      })
    })

    describe('Level 4 - Subtraction (non-negative result)', () => {
      it('should generate subtraction problems with non-negative results', () => {
        for (let i = 0; i < 50; i++) {
          const problem = newProblem(4)
          expect(problem.terms).toHaveLength(2)
          expect(problem.operators).toEqual(['-'])
          
          const [a, b] = problem.terms
          expect(a).toBeGreaterThanOrEqual(4)
          expect(a).toBeLessThanOrEqual(20)
          expect(b).toBeGreaterThanOrEqual(2)
          expect(b).toBeLessThanOrEqual(a! - 1)
          expect(problem.result).toBe(a! - b!)
          expect(problem.result).toBeGreaterThanOrEqual(0)
          expect(problem.hasTimer).toBe(false)
        }
      })
    })

    describe('Level 5 - Mixed +/- (non-negative result)', () => {
      it('should generate mixed problems with non-negative running total', () => {
        for (let i = 0; i < 30; i++) {
          const problem = newProblem(5)
          expect(problem.terms.length).toBeGreaterThanOrEqual(2)
          expect(problem.terms.length).toBeLessThanOrEqual(3)
          expect(problem.operators).toHaveLength(problem.terms.length - 1)
          expect(problem.hasTimer).toBe(false)
          
          // Verify the result is non-negative (as per documentation)
          expect(problem.result).toBeGreaterThanOrEqual(0)
          
          // Note: Documentation says "numbers in [0..20]" but implementation uses 
          // first term in [5..15] and subsequent in [1..20] to ensure non-negative results
          expect(problem.terms[0]).toBeGreaterThanOrEqual(5)
          expect(problem.terms[0]).toBeLessThanOrEqual(15)
          
          for (let j = 1; j < problem.terms.length; j++) {
            expect(problem.terms[j]).toBeGreaterThanOrEqual(1)
            expect(problem.terms[j]).toBeLessThanOrEqual(20)
          }
          
          // Verify operators are + or -
          problem.operators.forEach(op => {
            expect(['+', '-']).toContain(op)
          })
        }
      })
    })

    describe('Level 6 - Mixed +/- (negatives allowed)', () => {
      it('should generate mixed problems allowing negative results', () => {
        for (let i = 0; i < 30; i++) {
          const problem = newProblem(6)
          expect(problem.terms.length).toBeGreaterThanOrEqual(2)
          expect(problem.terms.length).toBeLessThanOrEqual(3)
          expect(problem.operators).toHaveLength(problem.terms.length - 1)
          expect(problem.hasTimer).toBe(false)
          
          problem.terms.forEach(term => {
            expect(term).toBeGreaterThanOrEqual(0)
            expect(term).toBeLessThanOrEqual(20)
          })
          
          // Verify the result matches manual calculation
          const calculatedResult = evaluateExpression(problem.terms, problem.operators)
          expect(problem.result).toBe(calculatedResult)
        }
      })
    })

    describe('Level 7 - Mixed +/- with timer', () => {
      it('should be like level 6 but with 20s timer', () => {
        for (let i = 0; i < 20; i++) {
          const problem = newProblem(7)
          expect(problem.terms.length).toBeGreaterThanOrEqual(2)
          expect(problem.terms.length).toBeLessThanOrEqual(3)
          expect(problem.hasTimer).toBe(true)
          expect(problem.timerSeconds).toBe(20)
          
          problem.terms.forEach(term => {
            expect(term).toBeGreaterThanOrEqual(0)
            expect(term).toBeLessThanOrEqual(20)
          })
        }
      })
    })

    describe('Level 8 - Mixed +/- with larger range and timer', () => {
      it('should generate problems with 1-99 range and 20s timer', () => {
        for (let i = 0; i < 20; i++) {
          const problem = newProblem(8)
          expect(problem.terms.length).toBeGreaterThanOrEqual(2)
          expect(problem.terms.length).toBeLessThanOrEqual(3)
          expect(problem.hasTimer).toBe(true)
          expect(problem.timerSeconds).toBe(20)
          
          problem.terms.forEach(term => {
            expect(term).toBeGreaterThanOrEqual(1)
            expect(term).toBeLessThanOrEqual(99)
          })
        }
      })
    })

    describe('Level 9 - Multiplication (0-9)', () => {
      it('should generate multiplication problems with operands 0-9', () => {
        for (let i = 0; i < 30; i++) {
          const problem = newProblem(9)
          expect(problem.terms).toHaveLength(2)
          expect(problem.operators).toEqual(['*'])
          expect(problem.terms[0]).toBeGreaterThanOrEqual(0)
          expect(problem.terms[0]).toBeLessThanOrEqual(9)
          expect(problem.terms[1]).toBeGreaterThanOrEqual(0)
          expect(problem.terms[1]).toBeLessThanOrEqual(9)
          expect(problem.result).toBe(problem.terms[0]! * problem.terms[1]!)
          expect(problem.hasTimer).toBe(false)
        }
      })
    })

    describe('Level 10 - Mixed operations with precedence and timer', () => {
      it('should generate problems with +/-/* and 13s timer', () => {
        for (let i = 0; i < 30; i++) {
          const problem = newProblem(10)
          expect(problem.terms.length).toBeGreaterThanOrEqual(2)
          expect(problem.terms.length).toBeLessThanOrEqual(3)
          expect(problem.hasTimer).toBe(true)
          expect(problem.timerSeconds).toBe(13)
          
          problem.terms.forEach(term => {
            expect(term).toBeGreaterThanOrEqual(1)
            expect(term).toBeLessThanOrEqual(30)
          })
          
          // Verify operators are from allowed set
          problem.operators.forEach(op => {
            expect(['+', '-', '*']).toContain(op)
          })
          
          // Verify result matches evaluation with precedence
          const calculatedResult = evaluateExpression(problem.terms, problem.operators)
          expect(problem.result).toBe(calculatedResult)
        }
      })
    })

    // Test general properties
    it('should always generate exactly 3 choices', () => {
      const levels: Level[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      levels.forEach(level => {
        const problem = newProblem(level)
        expect(problem.choices).toHaveLength(3)
        
        // Verify one choice is correct
        const correctChoices = problem.choices.filter(choice => choice.value === problem.result)
        expect(correctChoices).toHaveLength(1)
        
        // Verify all choices have unique values
        const values = problem.choices.map(choice => choice.value)
        const uniqueValues = new Set(values)
        expect(uniqueValues.size).toBe(3)
      })
    })

    it('should generate unique choice IDs', () => {
      const problem = newProblem(1)
      const ids = problem.choices.map(choice => choice.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(3)
    })
  })
})

describe('Wrong Choice Generation and Last-Digit Bias', () => {
  describe('Choice generation for levels 1-2 (no last-digit bias)', () => {
    it('should generate wrong choices within reasonable distance', () => {
      for (let i = 0; i < 20; i++) {
        const problem = newProblem(1) // Level 1: result 0-18
        const wrongChoices = problem.choices.filter(choice => choice.value !== problem.result)
        
        wrongChoices.forEach(choice => {
          expect(choice.value).toBeGreaterThanOrEqual(0)
          expect(choice.value).toBeLessThanOrEqual(18)
          expect(choice.value).not.toBe(problem.result)
        })
      }
    })
  })

  describe('Choice generation for levels 3+ (with last-digit bias)', () => {
    it('should respect distance caps', () => {
      // Test level 3 which has last-digit bias enabled
      for (let i = 0; i < 30; i++) {
        const problem = newProblem(3)
        const wrongChoices = problem.choices.filter(choice => choice.value !== problem.result)
        
        wrongChoices.forEach(choice => {
          expect(choice.value).toBeGreaterThanOrEqual(0)
          expect(choice.value).toBeLessThanOrEqual(297) // Max for level 3
          expect(choice.value).not.toBe(problem.result)
          
          // Distance should be reasonable (not testing exact cap here due to randomness)
          const distance = Math.abs(choice.value - problem.result)
          expect(distance).toBeLessThanOrEqual(100) // Generous upper bound
        })
      }
    })

    it('should generate choices with various last-digit patterns', () => {
      const lastDigitStats = new Map<number, number>() // tracks how many times each count of matching last digits occurs
      
      // Run many iterations to collect statistics
      for (let i = 0; i < 100; i++) {
        const problem = newProblem(3)
        const correctLastDigit = Math.abs(problem.result) % 10
        const wrongChoices = problem.choices.filter(choice => choice.value !== problem.result)
        
        const matchingLastDigits = wrongChoices.filter(choice => 
          Math.abs(choice.value) % 10 === correctLastDigit
        ).length
        
        lastDigitStats.set(matchingLastDigits, (lastDigitStats.get(matchingLastDigits) || 0) + 1)
      }
      
      // Should see variety in last-digit matching (0, 1, or 2 matches)
      // Due to randomness, we just verify we see multiple patterns
      expect(lastDigitStats.size).toBeGreaterThan(1)
    })
  })

  describe('Choice boundaries for different levels', () => {
    it('should respect level-specific choice ranges', () => {
      const testCases = [
        { level: 1 as Level, minChoice: 0, maxChoice: 18 },
        { level: 2 as Level, minChoice: 0, maxChoice: 100 },
        { level: 4 as Level, minChoice: 1, maxChoice: 18 },
        { level: 9 as Level, minChoice: 0, maxChoice: 81 },
      ]
      
      testCases.forEach(({ level, minChoice, maxChoice }) => {
        for (let i = 0; i < 20; i++) {
          const problem = newProblem(level)
          problem.choices.forEach(choice => {
            expect(choice.value).toBeGreaterThanOrEqual(minChoice)
            expect(choice.value).toBeLessThanOrEqual(maxChoice)
          })
        }
      })
    })
  })
})

describe('Edge Cases and Error Conditions', () => {
  describe('evaluateExpression edge cases', () => {
    it('should handle expressions with zeros', () => {
      expect(evaluateExpression([0, 5], ['+'])).toBe(5)
      expect(evaluateExpression([10, 0], ['-'])).toBe(10)
      expect(evaluateExpression([0, 7], ['*'])).toBe(0)
      expect(evaluateExpression([8, 0], ['*'])).toBe(0)
    })

    it('should handle complex precedence with zeros', () => {
      expect(evaluateExpression([0, 0, 5], ['*', '+'])).toBe(5) // (0 * 0) + 5 = 5
      expect(evaluateExpression([10, 0, 3], ['+', '*'])).toBe(10) // 10 + (0 * 3) = 10
    })

    it('should handle negative operands in mixed expressions', () => {
      // This tests the evaluation function directly, even though newProblem doesn't generate negative operands
      expect(evaluateExpression([5, -2], ['+'])).toBe(3)
      expect(evaluateExpression([10, -3], ['-'])).toBe(13)
      expect(evaluateExpression([-4, 6], ['*'])).toBe(-24)
    })
  })

  describe('Problem generation consistency', () => {
    it('should always match calculated result across all levels', () => {
      const levels: Level[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      
      levels.forEach(level => {
        for (let i = 0; i < 10; i++) {
          const problem = newProblem(level)
          const calculatedResult = evaluateExpression(problem.terms, problem.operators)
          expect(problem.result).toBe(calculatedResult)
        }
      })
    })

    it('should generate valid choice structures', () => {
      const levels: Level[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      
      levels.forEach(level => {
        const problem = newProblem(level)
        
        // All choices should have required properties
        problem.choices.forEach(choice => {
          expect(choice).toHaveProperty('id')
          expect(choice).toHaveProperty('value')
          expect(choice).toHaveProperty('disabled')
          expect(typeof choice.id).toBe('string')
          expect(typeof choice.value).toBe('number')
          expect(typeof choice.disabled).toBe('boolean')
          expect(choice.disabled).toBe(false) // Initially all should be enabled
        })
      })
    })
  })

  describe('Timer configuration', () => {
    it('should set correct timer values for timed levels', () => {
      const timerLevels = [
        { level: 7 as Level, expectedSeconds: 20 },
        { level: 8 as Level, expectedSeconds: 20 },
        { level: 10 as Level, expectedSeconds: 13 },
      ]
      
      timerLevels.forEach(({ level, expectedSeconds }) => {
        const problem = newProblem(level)
        expect(problem.hasTimer).toBe(true)
        expect(problem.timerSeconds).toBe(expectedSeconds)
      })
    })

    it('should not set timer for non-timed levels', () => {
      const nonTimerLevels: Level[] = [1, 2, 3, 4, 5, 6, 9]
      
      nonTimerLevels.forEach(level => {
        const problem = newProblem(level)
        expect(problem.hasTimer).toBe(false)
        expect(problem.timerSeconds).toBe(0)
      })
    })
  })
})