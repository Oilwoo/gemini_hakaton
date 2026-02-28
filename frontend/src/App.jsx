import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Converter from './pages/Converter';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/converter" element={<Converter />} />
      </Routes>
    </BrowserRouter>
  );
}
