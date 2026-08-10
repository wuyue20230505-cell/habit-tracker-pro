import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivacyGate from './components/PrivacyGate';
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
import FeedbackPage from './pages/FeedbackPage';
import PrivacyPage from './pages/PrivacyPage';

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

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

function AppContent() {
  const [userId, setUserId] = useState<string>('');
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id || ''));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id || ''));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AppProvider key={userId} uid={userId}>
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
              <Route path="feedback" element={<FeedbackPage />} />
            </Route>
            <Route path="pomodoro-timer" element={<PomodoroTimerPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
          </Routes>
        </BrowserRouter>
        <GlobalPaywall />
      </ProProvider>
    </AppProvider>
  );
}

export default function App() {
  return (
    <PrivacyGate>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PrivacyGate>
  );
}
