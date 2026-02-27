import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile() {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const r = await fetch(`${apiUrl}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const data = await r.json();
        setUser(data);
      } else if (r.status === 401) {
        navigate("/login");
      }
    } catch { }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-b-primary"></div>
    </div>
  );

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111318] min-h-screen">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-[#dbdfe6] dark:border-slate-800 flex flex-col sticky top-0 h-screen">
          <div className="p-6 flex items-center gap-3">
            <div className="relative size-10 bg-primary/10 rounded-xl flex items-center justify-center border-2 border-primary/20">
              <span className="material-symbols-outlined text-primary text-2xl font-black">extension</span>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-primary pointer-events-none mt-0.5">A</span>
            </div>
            <div>
              <h1 className="text-[#111318] dark:text-white text-lg font-black tracking-tight uppercase">antiDark</h1>
              <p className="text-[#616f89] text-[9px] font-bold uppercase tracking-widest opacity-60">Enterprise</p>
            </div>
          </div>
          <nav className="flex-1 mt-4 px-3 space-y-1">
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" to="/busqueda">
              <span className="material-symbols-outlined">search</span>
              <span>Listas Negativas</span>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg active-nav" to="/perfil">
              <span className="material-symbols-outlined">account_circle</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
            </Link>
          </nav>
          <div className="p-4 border-t border-[#dbdfe6] dark:border-slate-800">
            <button className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-bold uppercase text-[10px] tracking-widest" onClick={() => { localStorage.removeItem("auth_token"); navigate("/login"); }}>
              <span className="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col p-8 max-w-6xl mx-auto w-full">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-[#111318] dark:text-white uppercase">Mi Perfil</h2>
              <p className="text-[#616f89] text-sm font-medium">Gestiona tu cuenta y datos de acceso.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#dbdfe6] dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-[#111318] dark:text-white hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors shadow-sm">Descartar</button>
              <button className="px-5 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0d3ea1] transition-all shadow-xl shadow-primary/20">Guardar Cambios</button>
            </div>
          </header>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 mb-8 border border-[#dbdfe6] dark:border-slate-800 accent-border flex flex-col md:flex-row gap-8 items-center">
            <div className="relative">
              <img className="size-32 rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl object-cover" src={user?.photo || "https://lh3.googleusercontent.com/a/ACg8ocL_G5I_J_H5_v_v_v=s96-c"} alt="avatar" />
              <div className="absolute -bottom-2 -right-2 size-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                <span className="material-symbols-outlined text-sm">edit</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.nombres} {user?.ape_pat}</h3>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[9px] font-black text-primary uppercase tracking-tighter shadow-sm border border-primary/10">ID: #{String(user?.id || 0).padStart(5, '0')}</span>
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] opacity-75">{user?.cargo || "Analista de Riesgos"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-[#dbdfe6] dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-[#dbdfe6] dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  <h4 className="font-black text-[11px] uppercase tracking-widest text-[#111318] dark:text-white">Datos personales</h4>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombres</label>
                      <input className="w-full rounded-xl border-[#dbdfe6] dark:bg-slate-800/50 dark:border-slate-700 h-11 text-sm font-bold uppercase" type="text" defaultValue={user?.nombres} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apellidos</label>
                      <input className="w-full rounded-xl border-[#dbdfe6] dark:bg-slate-800/50 dark:border-slate-700 h-11 text-sm font-bold uppercase" type="text" defaultValue={`${user?.ape_pat || ""} ${user?.ape_mat || ""}`} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
                    <input className="w-full rounded-xl border-[#dbdfe6] dark:bg-slate-800/50 dark:border-slate-700 h-11 text-sm font-bold" type="email" defaultValue={user?.correo} disabled />
                    <p className="text-[9px] text-slate-400 font-medium">El correo no puede ser modificado si usas Google Auth.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-[#dbdfe6] dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-[#dbdfe6] dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">business_center</span>
                  <h4 className="font-black text-[11px] uppercase tracking-widest text-[#111318] dark:text-white">Información Laboral</h4>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</label>
                    <input className="w-full rounded-xl border-[#dbdfe6] dark:bg-slate-800/50 dark:border-slate-700 h-11 text-sm font-bold uppercase" type="text" defaultValue={user?.empresa} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo / Función</label>
                    <input className="w-full rounded-xl border-[#dbdfe6] dark:bg-slate-800/50 dark:border-slate-700 h-11 text-sm font-bold uppercase" type="text" defaultValue={user?.cargo} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <style>{`
        .active-nav { background-color: rgba(15, 73, 189, 0.08); color: #0f49bd; border-right: 4px solid #0f49bd; }
        .accent-border { border-top: 4px solid #0f49bd; }
      `}</style>
    </div>
  );
}
