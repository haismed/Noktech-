import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Terminal from './pages/Terminal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/terminal" element={<Terminal />} />
      </Routes>
    </BrowserRouter>
  );
}
