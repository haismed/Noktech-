import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Terminal from './pages/Terminal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/terminal" replace />} />
        <Route path="/terminal" element={<Terminal />} />
      </Routes>
    </BrowserRouter>
  );
}
