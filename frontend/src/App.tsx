import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Analyze } from './pages/Analyze';
import { Results } from './pages/Results';
import { CompareDrafts } from './pages/CompareDrafts';
import { VoiceAssistant } from './pages/VoiceAssistant';
import { IndianLawHub } from './pages/IndianLawHub';
import { PushbackGenerator } from './pages/PushbackGenerator';
import { Settings } from './pages/Settings';
import { AskQuery } from './pages/AskQuery';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analyze" element={<Analyze />} />
          <Route path="results" element={<Results />} />
          <Route path="ask" element={<AskQuery />} />
          <Route path="compare" element={<CompareDrafts />} />
          <Route path="voice" element={<VoiceAssistant />} />
          <Route path="laws" element={<IndianLawHub />} />
          <Route path="pushback" element={<PushbackGenerator />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
