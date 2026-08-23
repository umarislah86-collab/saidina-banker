import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SetupPage from './pages/Setup/SetupPage';
import BankerPage from './pages/Banker/BankerPage';
import DisplayPage from './pages/Display/DisplayPage';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<SetupPage />} />
          <Route path="/banker" element={<ErrorBoundary><BankerPage /></ErrorBoundary>} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
