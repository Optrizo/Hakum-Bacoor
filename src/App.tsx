import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueueProvider } from './context/QueueContext';
import Layout from './components/Layout';
import QueueManager from './components/QueueManager';
import CustomerView from './components/CustomerView';
import CrewManager from './components/CrewManager';
import ServicesPage from './components/ServicesPage';

function App() {
  return (
    <BrowserRouter>
      <QueueProvider>
        <Routes>
          <Route path="/" element={<Layout><QueueManager /></Layout>} />
          <Route path="/customer" element={<CustomerView />} />
          <Route path="/crew" element={<Layout><CrewManager /></Layout>} />
          <Route path="/services" element={<Layout><ServicesPage /></Layout>} />
        </Routes>
      </QueueProvider>
    </BrowserRouter>
  );
}

export default App;