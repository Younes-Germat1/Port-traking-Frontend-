import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FicheList from './pages/fiches/FicheList';
import FicheDetail from './pages/fiches/FicheDetail';
import CreateFiche from './pages/fiches/CreateFiche';
import ConteneurList from './pages/conteneurs/ConteneurList';
import ConteneurDetail from './pages/conteneurs/ConteneurDetail';
import InspectionList from './pages/inspections/InspectionList';
import InspectionDetail from './pages/inspections/InspectionDetail';
import DocumentList from './pages/documents/DocumentList';
import NotificationList from './pages/notifications/NotificationList';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/admin/Reports';
import PrivateRoute from './components/PrivateRoute';
import { AuthContext } from './context/AuthContext';

function App() {
  const { user } = useContext(AuthContext);

  return (
      <BrowserRouter>
        <Routes>

          {/* ── Public ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" />} />

          {/* ── Dashboard ── */}
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />

          {/* ── Fiches Suiveuses ── */}
          <Route path="/fiches" element={
            <PrivateRoute><FicheList user={user} /></PrivateRoute>
          } />
          <Route path="/fiches/create" element={
            <PrivateRoute roles={['IMPORTATEUR', 'ADMIN']}>
              <CreateFiche user={user} />
            </PrivateRoute>
          } />
          <Route path="/fiches/:id" element={
            <PrivateRoute><FicheDetail /></PrivateRoute>
          } />

          {/* ── Conteneurs ── */}
          <Route path="/conteneurs" element={
            <PrivateRoute><ConteneurList /></PrivateRoute>
          } />
          <Route path="/conteneurs/:id" element={
            <PrivateRoute><ConteneurDetail /></PrivateRoute>
          } />

          {/* ── Inspections ── */}
          <Route path="/inspections" element={
            <PrivateRoute><InspectionList /></PrivateRoute>
          } />
          <Route path="/inspections/:id" element={
            <PrivateRoute><InspectionDetail /></PrivateRoute>
          } />

          {/* ── Documents ── */}
          <Route path="/documents" element={
            <PrivateRoute><DocumentList /></PrivateRoute>
          } />
          <Route path="/documents/fiche/:ficheId" element={
            <PrivateRoute><DocumentList /></PrivateRoute>
          } />

          {/* ── Notifications ── */}
          <Route path="/notifications" element={
            <PrivateRoute><NotificationList /></PrivateRoute>
          } />

          {/* ── Admin ── */}
          <Route path="/admin/users" element={
            <PrivateRoute roles={['ADMIN']}><UserManagement /></PrivateRoute>
          } />
          <Route path="/admin/reports" element={
            <PrivateRoute roles={['ADMIN']}><Reports /></PrivateRoute>
          } />

          {/* ── 404 → redirect dashboard ── */}
          <Route path="*" element={<Navigate to="/dashboard" />} />

        </Routes>
      </BrowserRouter>
  );
}

export default App;