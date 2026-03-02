import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Variable para editar el porcentaje de la transparencia del fondo azul
  // (0.0 es totalmente transparente, 1.0 es color sólido)
  const transparenciaAzul = 0.85;

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-white font-display text-[#111318] relative">

      {/* Imagen base para el efecto cristal */}
      <div className="absolute inset-0 w-full lg:w-[55%] bg-cover bg-center z-0" style={{ backgroundImage: "url('/bg-login.png')" }} />

      {/* LEFT PANE - GLASS BLUE */}
      <div
        className="relative z-10 w-full lg:w-[55%] overflow-hidden flex flex-col justify-between p-10 lg:p-20 order-2 lg:order-1 min-h-[500px] lg:min-h-screen backdrop-blur-xl"
        style={{ backgroundColor: `rgba(45, 77, 245, ${transparenciaAzul})` }}
      >

        {/* Decorative Overlay Lines (CSS Background) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-overlapping-arcs" />

        {/* Top Logo / Icon */}
        <div className="relative z-10">
          <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L12 22M2 12h20M4.9 4.9l14.2 14.2M4.9 19.1L19.1 4.9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Main Text & Slogan */}
        <div className="relative z-10 flex flex-col gap-6 mt-16 max-w-[80%]">
          <h1 className="text-white font-bold leading-[1.1] tracking-tight flex flex-col gap-1">
            <span className="text-base lg:text-lg font-medium opacity-80 uppercase tracking-widest">Bienvenido a ...</span>
            <span className="text-[3rem] lg:text-[4.5rem]">AntiDark!</span>
          </h1>
          <p className="text-white/90 text-lg lg:text-xl font-medium leading-relaxed mt-2 max-w-md">
            Software de prevencion de Riesgos, Automatizacion y programacion de busquedas. Para ti, para tu empresa, Somos la mejor opcion 👋!
          </p>
        </div>

        {/* Blank Footer (moved to right form) */}
        <div className="relative z-10 mt-auto pt-16">
        </div>
      </div>

      {/* RIGHT PANE - LOGIN FORM */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 sm:p-12 lg:p-20 order-1 lg:order-2">
        <div className="w-full max-w-[400px] flex flex-col gap-8">

          {/* Header Texts */}
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-[#111318] text-[2rem] font-bold leading-tight tracking-tight uppercase">PANEL DE ADMINISTRACION</h2>
          </div>

          <form className="flex flex-col gap-6" onSubmit={submit}>
            {/* Input Wrapper overriding side-accent to match reference simple bottom-border */}
            <div className="flex flex-col gap-2">
              <label className="text-[#111318] text-xs font-bold uppercase tracking-wide">USUARIO</label>
              <div className="flex items-center bg-transparent border-b border-gray-300 focus-within:border-[#111318] transition-colors pb-2">
                <input className="w-full border-none px-0 py-2 focus:ring-0 text-base font-medium placeholder-[#616f89]/50 bg-transparent" placeholder="admin o usuario1" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#111318] text-xs font-bold uppercase tracking-wide">CONTRASEÑA</label>
              <div className="flex items-center bg-transparent border-b border-gray-300 focus-within:border-[#111318] transition-colors pb-2">
                <input className="w-full border-none px-0 py-2 focus:ring-0 text-base font-medium placeholder-[#616f89]/50 bg-transparent" type="password" placeholder="••••••••" value={clave} onChange={(e) => setClave(e.target.value)} />
              </div>
            </div>

            {error && <div className="text-red-500 text-xs font-bold uppercase mt-1">{error}</div>}

            <button className="w-full h-12 bg-[#1a1a1a] text-white font-semibold rounded-lg hover:bg-black transition-colors flex items-center justify-center text-sm shadow-sm border border-[#1a1a1a] mt-4" type="submit">
              INICIAR SESION
            </button>
            <button
              type="button"
              className="w-full h-12 bg-white text-[#111318] font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-sm shadow-sm border border-gray-300 uppercase tracking-wider"
              onClick={() => navigate("/registro")}
            >
              REGISTRARME
            </button>
          </form>

          {/* Optional Social/Extra Links styled like the reference */}
          <div className="flex flex-col gap-6">
            <button
              type="button"
              className="flex items-center justify-center gap-3 w-full h-12 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-semibold text-gray-700 text-sm"
              onClick={() => window.location.href = `${apiUrl}/auth/google/login?redirect=${encodeURIComponent(window.location.origin + "/")}`}
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                alt="Google"
                className="w-6 h-6"
              />
              <span>Login with Google</span>
            </button>
          </div>

          {/* Form Footer */}
          <div className="flex justify-center mt-auto pt-12">
            <p className="text-[#616f89]/70 text-xs font-semibold">© 2026 AntiDark. Todos los derechos reservados.</p>
          </div>

        </div>
      </div>

      <style>{`
        /* Minimal arc lines to simulate the reference left background */
        .bg-overlapping-arcs {
          background-image: radial-gradient(circle at -20% 50%, transparent 60%, rgba(255,255,255,0.4) 61%, transparent 62%),
                            radial-gradient(circle at 120% -20%, transparent 60%, rgba(255,255,255,0.4) 61%, transparent 62%);
        }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 50px white inset; -webkit-text-fill-color: #111318; }
      `}</style>
    </div>
  );
}
