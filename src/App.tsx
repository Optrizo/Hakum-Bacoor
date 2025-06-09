import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CarsPage from './pages/CarsPage';
import ServicesPage from './pages/ServicesPage';
import CrewPage from './pages/CrewPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cars" element={<CarsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/crew" element={<CrewPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;