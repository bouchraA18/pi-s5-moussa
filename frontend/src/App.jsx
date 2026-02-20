import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './views/LoginPage';
import RegisterPage from './views/RegisterPage';
import TeacherDashboard from './views/TeacherDashboard';
import AgentDashboard from './views/AgentDashboard';
import ProfilePage from './views/ProfilePage';
import AdminUsers from './views/AdminUsers';
import AdminMatieres from './views/AdminMatieres';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/agent-dashboard" element={<AgentDashboard />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Admin Routes */}
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/matieres" element={<AdminMatieres />} />
    </Routes>
  );
}

export default App;
