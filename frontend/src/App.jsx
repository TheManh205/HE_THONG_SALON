import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

import { PublicBookingPage } from './pages/PublicBookingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { CustomersPage } from './pages/CustomersPage';
import { StylistsPage } from './pages/StylistsPage';
import { ServicesPage } from './pages/ServicesPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role) && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main Layout with Fixed Sidebar & Topbar
const AppLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <Navbar onMenuClick={() => setMobileOpen(true)} />
      <div className="lg:pl-64 pt-16 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Booking Portal */}
            <Route path="/booking" element={<PublicBookingPage />} />

            {/* Staff Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Portal Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AppointmentsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-hub"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AIAssistantPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist', 'hairdresser']}>
                  <AppLayout>
                    <CustomersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stylists"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <StylistsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ServicesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <AppLayout>
                    <InvoicesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <AnalyticsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
