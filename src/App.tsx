import type { ReactElement } from 'react';
import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { Gate } from './components/Gate';
import Home from './pages/Home';
import ProjectDetail from './pages/ProjectDetail';
import Company from './pages/Company';
import AuthPage from './pages/AuthPage';
import Pricing from './pages/Pricing';
import Developers from './pages/Developers';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import EditProject from './pages/EditProject';
import Billing from './pages/Billing';

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="max-w-md text-center">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-4">Error 404</p>
        <h1 className="text-6xl font-serif italic leading-none mb-6">Page not found</h1>
        <Link to="/" className="inline-block px-6 py-3 bg-brand text-white text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all">Return home</Link>
      </div>
    </div>
  );
}

const dev = (el: ReactElement, message: string) => <Gate allow="developer" message={message}>{el}</Gate>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projects/new" element={<Navigate to="/projects/new/edit" replace />} />
      <Route path="/projects/:id/edit" element={dev(<EditProject />, 'Only invited developers can edit listings.')} />
      <Route path="/projects/:slug" element={<ProjectDetail />} />
      <Route path="/companies/:slug" element={<Company />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/developers" element={<Developers />} />
      <Route path="/dashboard" element={dev(<Dashboard />, 'The developer studio is invite-only.')} />
      <Route path="/profile" element={dev(<ProfilePage />, 'Only invited developers can edit company profiles.')} />
      <Route path="/billing" element={<Gate allow="company" redirectTo="/dashboard" message="Developer accounts don't have paid plans."><Billing /></Gate>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
