import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  const modules = [
    { name: "Listas Negativas", icon: "search", enabled: true, href: "/busqueda" },
    { name: "Matriz de Riesgos", icon: "grid_on", enabled: false },
    { name: "Scoring de Riesgo", icon: "trending_up", enabled: false },
    { name: "Canal de Denuncias", icon: "campaign", enabled: false },
    { name: "Registro de Operaciones", icon: "assignment", enabled: false },
    { name: "Reporte de Operaciones", icon: "receipt_long", enabled: false },
    { name: "Administrador", icon: "admin_panel_settings", enabled: false },
    { name: "Mis Cursos", icon: "school", enabled: false }
  ];
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#111318] font-display">
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-[#dbdfe6] flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">shield_person</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">antiDark</h1>
            <p className="text-xs text-[#616f89] font-medium">Compliance Portal</p>
          </div>
        </div>
        <button className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-3 py-2" onClick={() => navigate("/perfil")}>
          <div className="w-8 h-8 rounded-full bg-slate-300 overflow-hidden">
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2bfsjb0Bxscts3Po_3RkowlFbkon2tIl1sNMkI6qh8vf6IRcEZdwZdO4Pt9QCT8VJ-aWzIvgIbbYpHMPx61jtVaOoVGqbvXUFyebBm5OIXeLQN624ZTbMrs-plxctvukKt2rnMijp_HTrkfIipWsGeQQ-FuJyXIKwfknDWiIk-v7FJ699Pj5qP59h7YLFg2-aGXwYObatc-4MTcvsyj98Td-C6yYFyMAevJ7JJzBJDzv7CbpvKAg8-0MRm_OKcD6TE2wwX8ukhxE" alt="avatar" />
          </div>
          <span className="text-sm font-semibold">Mi Perfil</span>
        </button>
      </header>
      <main className="max-w-6xl mx-auto p-8">
        <h2 className="text-2xl font-black mb-6">Módulos del sistema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {modules.map((m) => (
            <button key={m.name} className={`p-6 rounded-xl border ${m.enabled ? "border-primary/30 bg-white hover:bg-primary/5" : "border-[#dbdfe6] bg-white/60 cursor-not-allowed"} shadow-sm flex items-center gap-3 text-left transition-colors`} onClick={() => m.enabled ? navigate(m.href!) : null}>
              <div className={`size-10 rounded-lg flex items-center justify-center ${m.enabled ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-500"}`}>
                <span className="material-symbols-outlined">{m.icon}</span>
              </div>
              <div>
                <div className="text-lg font-bold">{m.name}</div>
                <div className={`text-xs ${m.enabled ? "text-primary" : "text-slate-400"}`}>{m.enabled ? "Habilitado" : "Próximamente"}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
