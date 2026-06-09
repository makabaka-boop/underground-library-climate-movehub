import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StorageAreas from './pages/StorageAreas';
import Bookshelves from './pages/Bookshelves';
import SensorPoints from './pages/SensorPoints';
import Dehumidifiers from './pages/Dehumidifiers';
import MovePlans from './pages/MovePlans';
import MoveTasks from './pages/MoveTasks';
import InspectionRecords from './pages/InspectionRecords';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storage-areas"
            element={
              <ProtectedRoute>
                <StorageAreas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookshelves"
            element={
              <ProtectedRoute>
                <Bookshelves />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sensor-points"
            element={
              <ProtectedRoute>
                <SensorPoints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dehumidifiers"
            element={
              <ProtectedRoute>
                <Dehumidifiers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/move-plans"
            element={
              <ProtectedRoute>
                <MovePlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/move-tasks"
            element={
              <ProtectedRoute>
                <MoveTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inspection-records"
            element={
              <ProtectedRoute>
                <InspectionRecords />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
