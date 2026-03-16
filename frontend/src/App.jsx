import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import CitizenReportPage from './pages/CitizenReportPage';
import RiskMapPage from './pages/RiskMapPage';
import CompletedProjectsMapPage from './pages/CompletedProjectsMapPage';
import MyReportsPage from './pages/MyReportsPage';
import DashboardPage from './pages/DashboardPage';
import WardManagementPage from './pages/WardManagementPage';
import IssueDetailsPage from './pages/IssueDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MunicipalRoute from './components/layout/MunicipalRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected for ANY logged in user */}
            <Route path="/report" element={
              <ProtectedRoute>
                <CitizenReportPage />
              </ProtectedRoute>
            } />
            <Route path="/my-reports" element={
              <ProtectedRoute>
                <MyReportsPage />
              </ProtectedRoute>
            } />
            <Route path="/map" element={<RiskMapPage />} />
            <Route path="/completed-projects" element={<CompletedProjectsMapPage />} />
            
            {/* Protected by simple password for demo */}
            <Route path="/dashboard" element={
              <MunicipalRoute>
                <DashboardPage />
              </MunicipalRoute>
            } />
            <Route path="/ward-management" element={
              <MunicipalRoute>
                <WardManagementPage />
              </MunicipalRoute>
            } />
            <Route path="/issue/:id" element={
              <MunicipalRoute>
                <IssueDetailsPage />
              </MunicipalRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
