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

// Main Layout with Navbar & Sidebar
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f5f5f3] text-[#111111]">
      <div className="mx-auto w-full max-w-[1700px]">
        <Navbar />
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-3 py-4 sm:px-4 lg:flex-row lg:gap-6 lg:px-6 lg:py-7 xl:px-8">
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
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
                <ProtectedRoute allowedRoles={['admin', 'manager', 'receptionist', 'hairdresser']}>
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
                <ProtectedRoute allowedRoles={['admin', 'manager', 'receptionist']}>
                  <AppLayout>
                    <InvoicesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
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
