import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import PrivateRoute from './components/PrivateRoute';
import Reports from './pages/admin/Reports';

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/fiches" element={
            <PrivateRoute><FicheList /></PrivateRoute>
          } />
          <Route path="/fiches/create" element={
            <PrivateRoute><CreateFiche /></PrivateRoute>
          } />
          <Route path="/fiches/:id" element={
            <PrivateRoute><FicheDetail /></PrivateRoute>
          } />
          <Route path="/conteneurs" element={
            <PrivateRoute><ConteneurList /></PrivateRoute>
          } />
          <Route path="/conteneurs/:id" element={
            <PrivateRoute><ConteneurDetail /></PrivateRoute>
          } />
          <Route path="/inspections" element={
            <PrivateRoute><InspectionList /></PrivateRoute>
          } />
          <Route path="/inspections/:id" element={
            <PrivateRoute><InspectionDetail /></PrivateRoute>
          } />
          <Route path="/documents" element={
            <PrivateRoute><DocumentList /></PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute><NotificationList /></PrivateRoute>
          } />
          <Route path="/admin/users" element={
            <PrivateRoute roles={['ADMIN']}><UserManagement /></PrivateRoute>
          } />
          <Route path="/admin/reports" element={
            <PrivateRoute roles={['ADMIN']}><Reports /></PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
  );
}

export default App;