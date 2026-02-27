import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import CompletarPerfilPage from "./pages/CompletarPerfilPage";

function isTokenValid(): boolean {
  const t = localStorage.getItem("auth_token");
  if (!t) return false;
  const parts = t.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    const exp = Number(payload.exp || 0) * 1000;
    return Date.now() < exp;
  } catch {
    return false;
  }
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const logged = isTokenValid();

  return (
    <Routes>
      <Route path="/login" element={logged ? <Navigate to="/home" replace /> : <LoginPage />} />
      <Route path="/registro" element={logged ? <Navigate to="/home" replace /> : <RegisterPage />} />
      <Route path="/completar-perfil" element={<CompletarPerfilPage />} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/perfil" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/busqueda" element={<RequireAuth><SearchPage /></RequireAuth>} />
      <Route path="/" element={<Navigate to={logged ? "/home" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
