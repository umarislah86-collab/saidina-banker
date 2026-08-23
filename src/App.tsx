import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SetupPage from './pages/Setup/SetupPage';
import BankerPage from './pages/Banker/BankerPage';
import DisplayPage from './pages/Display/DisplayPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route path="/banker" element={<BankerPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
