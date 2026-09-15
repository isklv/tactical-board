import { Routes, Route, Navigate } from 'react-router-dom';
import { TacticalBoardView } from './components/TacticalBoardView';
import './index.css';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<TacticalBoardView />} />
      <Route path="/board/:token" element={<TacticalBoardView />} />
      <Route path="/play" element={<TacticalBoardView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
