import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Docs } from './pages/Docs';
import { About } from './pages/About';
import { ServerDetails } from './pages/ServerDetails';
import { Submit } from './pages/Submit';
import { Listing } from './pages/Listing';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/about" element={<About />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/server/:hubId" element={<ServerDetails />} />
            <Route path="/listing" element={<Listing />} />
            <Route path="/listing/:categoryKey" element={<Listing />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;