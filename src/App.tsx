import { useEffect } from 'react';
import Game from './components/Game';

export default function App() {
  useEffect(() => {
    document.title = 'Math Challenger';
  }, []);

  return <Game />;
}

