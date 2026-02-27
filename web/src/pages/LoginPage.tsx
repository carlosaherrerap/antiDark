import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave })
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Login falló");
        return;
      }
      localStorage.setItem("auth_token", data.token);
      navigate("/home");
    } catch (err) {
      setError("Error de conexión con el servidor");
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-mesh font-display bg-background-light dark:bg-background-dark text-[#111318]">
      <div className="w-full max-w-[440px] flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 text-primary">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl">shield_person</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111318]">antiDark</h1>
          </div>
          <p className="text-[#616f89] text-sm font-medium">Software de Prevención de Riesgos</p>
        </div>
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#f0f2f4] overflow-hidden">
          <div className="p-8 sm:p-10 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-[#111318] text-2xl font-bold leading-tight">Ingresa a tu panel</h2>
              <p className="text-[#616f89] text-sm">Introduce tus credenciales para acceder</p>
            </div>
            <form className="flex flex-col gap-5" onSubmit={submit}>
              <div className="flex flex-col gap-2">
                <label className="text-[#111318] text-sm font-semibold">Usuario</label>
                <div className="input-side-accent flex items-center bg-white border border-[#dbdfe6] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/10">
                  <span className="material-symbols-outlined text-[#616f89] ml-3 text-xl">person</span>
                  <input className="w-full border-none focus:ring-0 text-sm py-3 px-3 placeholder:text-[#aab3c1]" placeholder="admin o usuario1" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[#111318] text-sm font-semibold">Contraseña</label>
                </div>
                <div className="input-side-accent flex items-center bg-white border border-[#dbdfe6] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/10">
                  <span className="material-symbols-outlined text-[#616f89] ml-3 text-xl">lock</span>
                  <input className="w-full border-none focus:ring-0 text-sm py-3 px-3 placeholder:text-[#aab3c1]" type="password" placeholder="••••••••" value={clave} onChange={(e) => setClave(e.target.value)} />
                </div>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button className="w-full h-12 bg-primary text-white font-bold rounded-lg hover:bg-[#0d3ea1] transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2" type="submit">
                <span>Iniciar Sesión</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </form>
            <div className="flex justify-center">
              <button className="text-sm text-primary font-bold hover:underline" onClick={() => window.location.href = `${apiUrl}/auth/google/login?redirect=${encodeURIComponent(window.location.origin + "/")}`}>Ingresar con Google</button>
            </div>
            <div className="flex justify-center">
              <button className="text-sm text-[#616f89] hover:underline" onClick={() => navigate("/registro")}>Crear cuenta</button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .input-side-accent { border-left: 3px solid transparent; transition: border-color 0.2s ease; }
        .input-side-accent:focus-within { border-left-color: #0f49bd; }
        .bg-mesh { background-color: #f6f6f8; background-image: radial-gradient(at 0% 0%, rgba(15, 73, 189, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(15, 73, 189, 0.05) 0px, transparent 50%); }
      `}</style>
    </div>
  );
}
