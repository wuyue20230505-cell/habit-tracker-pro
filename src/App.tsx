import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ProProvider } from './context/ProContext';
import Layout from './components/Layout';
import PaywallModal from './components/PaywallModal';
import { useProCtx } from './context/ProContext';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import TodayPage from './pages/TodayPage';
import HabitsPage from './pages/HabitsPage';
import HistoryPage from './pages/HistoryPage';
import StatsPage from './pages/StatsPage';
import PomodoroPage from './pages/PomodoroPage';
import PomodoroTimerPage from './pages/PomodoroTimerPage';
import LeaderboardPage from './pages/LeaderboardPage';

function GlobalPaywall() {
  const { showPaywall, setShowPaywall, paywallReason } = useProCtx();
  return (
    <PaywallModal
      open={showPaywall}
      reason={paywallReason}
      onClose={() => setShowPaywall(false)}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ProProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route element={<Layout />}>
                <Route path="checkin" element={<TodayPage />} />
                <Route path="pomodoro" element={<PomodoroPage />} />
                <Route path="habits" element={<HabitsPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
              </Route>
              <Route path="pomodoro-timer" element={<PomodoroTimerPage />} />
            </Routes>
          </BrowserRouter>
          <GlobalPaywall />
        </ProProvider>
      </AppProvider>
    </AuthProvider>
  );
}
