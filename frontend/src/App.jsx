import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import ProtectedRoute from './components/ProtectedRoute';

const Home = lazy(() => import('./pages/Home'));
const Analyzer = lazy(() => import('./pages/Analyzer'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Skills = lazy(() => import('./pages/Skills'));
const Builder = lazy(() => import('./pages/Builder'));
const CoverLetter = lazy(() => import('./pages/CoverLetter'));
const Templates = lazy(() => import('./pages/Templates'));
const Assessment = lazy(() => import('./pages/Assessment'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Feedback = lazy(() => import('./pages/Feedback'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const MockInterview = lazy(() => import('./pages/MockInterview'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-body">Loading...</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-heading font-black gradient-text mb-4">404</h1>
        <p className="text-xl text-slate-400 mb-8">Page not found</p>
        <a href="/" className="btn-primary">Go Home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="mesh-bg min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/analyzer" element={<Analyzer />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/skills" element={<Skills />} />
                <Route path="/builder" element={<Builder />} />
                <Route path="/cover-letter" element={<CoverLetter />} />
                <Route path="/assessment" element={<Assessment />} />
                <Route path="/mock-interview" element={<MockInterview />} />
              </Route>

              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}
