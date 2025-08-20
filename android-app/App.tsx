import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert,
  Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  newProblem, 
  formatExpression, 
  getStreakColor,
  type Level, 
  type Choice, 
  type Feedback 
} from '../common/src/gameLogic';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [level, setLevel] = useState<Level>(1);
  const [streak, setStreak] = useState(0);
  const [problem, setProblem] = useState(() => newProblem(1));
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved state
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedLevel = await AsyncStorage.getItem('level');
        const savedStreak = await AsyncStorage.getItem('streak');
        
        if (savedLevel) {
          const parsedLevel = parseInt(savedLevel) as Level;
          setLevel(parsedLevel);
          setProblem(newProblem(parsedLevel));
        }
        if (savedStreak) {
          setStreak(parseInt(savedStreak));
        }
      } catch (error) {
        console.log('Error loading state:', error);
      }
    };
    
    loadState();
  }, []);

  // Save state
  const saveState = useCallback(async (newLevel: Level, newStreak: number) => {
    try {
      await AsyncStorage.setItem('level', newLevel.toString());
      await AsyncStorage.setItem('streak', newStreak.toString());
    } catch (error) {
      console.log('Error saving state:', error);
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (problem.hasTimer && !locked) {
      setTimeLeft(problem.timerSeconds);
      
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            handleTimeout();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      timerRef.current = interval;
      
      return () => {
        clearInterval(interval);
        timerRef.current = null;
      };
    }
  }, [problem, locked]);

  const handleTimeout = () => {
    setFeedback({ kind: 'negative', text: 'Time\'s up!' });
    setLocked(true);
    
    const newStreak = 0;
    setStreak(newStreak);
    saveState(level, newStreak);
    
    feedbackTimeoutRef.current = setTimeout(() => {
      generateNewProblem();
    }, 1500);
  };

  const generateNewProblem = () => {
    setFeedback(null);
    setLocked(false);
    setTimeLeft(null);
    setProblem(newProblem(level));
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  };

  const handleChoice = (choice: Choice) => {
    if (locked || choice.disabled) return;

    if (choice.value === problem.result) {
      // Correct answer
      setFeedback({ kind: 'positive', text: 'Correct! 🎉' });
      setLocked(true);
      
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      if (newStreak >= 20 && level < 10) {
        // Level up
        const newLevel = (level + 1) as Level;
        setLevel(newLevel);
        saveState(newLevel, 0);
        setStreak(0);
        
        Alert.alert(
          'Level Up!',
          `You made it to level ${newLevel}!`,
          [{ text: 'Continue', onPress: generateNewProblem }]
        );
      } else {
        saveState(level, newStreak);
        feedbackTimeoutRef.current = setTimeout(generateNewProblem, 800);
      }
    } else {
      // Wrong answer
      setFeedback({ kind: 'negative', text: 'Try again…' });
      
      // Disable this choice
      setProblem(prev => ({
        ...prev,
        choices: prev.choices.map(c => 
          c.id === choice.id ? { ...c, disabled: true } : c
        )
      }));
    }
  };

  const levelOptions = Array.from({ length: 10 }, (_, i) => i + 1) as Level[];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Math Challenger</Text>
        
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.levelButton}
            onPress={() => {
              Alert.alert(
                'Select Level',
                'Choose a level',
                levelOptions.map(lvl => ({
                  text: `Level ${lvl}`,
                  onPress: () => {
                    setLevel(lvl);
                    setStreak(0);
                    setProblem(newProblem(lvl));
                    saveState(lvl, 0);
                    setFeedback(null);
                    setLocked(false);
                    setTimeLeft(null);
                  }
                }))
              );
            }}
          >
            <Text style={styles.levelText}>Level {level}</Text>
          </TouchableOpacity>
          
          <Text style={[styles.streak, { color: getStreakColor(streak) }]}>
            {level === 10 ? (
              streak > 20 ? `${streak} 🎉` : streak.toString()
            ) : (
              `${streak}/20`
            )}
          </Text>
        </View>
      </View>

      {/* Problem Area */}
      <View style={styles.problemArea}>
        <Text style={styles.expression}>
          {formatExpression(problem.terms, problem.operators)} = ?
        </Text>
        
        {problem.hasTimer && timeLeft !== null && (
          <Text style={styles.timer}>⏱️ {timeLeft}s</Text>
        )}
        
        {feedback && (
          <Text style={[
            styles.feedback,
            { color: feedback.kind === 'positive' ? '#22c55e' : '#ef4444' }
          ]}>
            {feedback.text}
          </Text>
        )}
      </View>

      {/* Choices */}
      <View style={styles.choicesArea}>
        {problem.choices.map(choice => (
          <TouchableOpacity
            key={choice.id}
            style={[
              styles.choiceButton,
              choice.disabled && styles.choiceDisabled
            ]}
            onPress={() => handleChoice(choice)}
            disabled={locked || choice.disabled}
          >
            <Text style={[
              styles.choiceText,
              choice.disabled && styles.choiceTextDisabled
            ]}>
              {choice.value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  levelButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  levelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  streak: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  problemArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  expression: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  timer: {
    fontSize: 18,
    color: '#f59e0b',
    marginBottom: 10,
  },
  feedback: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  choicesArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 50,
    gap: 10,
  },
  choiceButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  choiceDisabled: {
    backgroundColor: '#1f2937',
    opacity: 0.5,
  },
  choiceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  choiceTextDisabled: {
    color: '#6b7280',
  },
});
