
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import FineTuneData from './pages/FineTuneData';
import Topics from './pages/Topics';
import Scrapes from './pages/Scrapes';
import Posts from './pages/Posts';

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/scrape" element={<Scrapes />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/finetune" element={<FineTuneData />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;
