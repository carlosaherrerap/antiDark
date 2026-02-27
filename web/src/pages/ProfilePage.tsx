import React from "react";
import { useNavigate, Link } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111318] min-h-screen">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-[#dbdfe6] flex flex-col sticky top-0 h-screen">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">shield_person</span>
            </div>
            <div>
              <h1 className="text-[#111318] dark:text-white text-lg font-bold leading-tight">antiDark</h1>
              <p className="text-[#616f89] text-xs font-medium uppercase tracking-wider">Enterprise</p>
            </div>
          </div>
          <nav className="flex-1 mt-4 px-3 space-y-1">
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#616f89] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" to="/home">
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg active-nav" to="/perfil">
              <span className="material-symbols-outlined">account_circle</span>
              <span className="text-sm font-semibold">Perfil</span>
            </Link>
          </nav>
          <div className="p-4 border-t border-[#dbdfe6]">
            <button className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors" onClick={() => { localStorage.removeItem("auth_token"); navigate("/login"); }}>
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">Salir</span>
            </button>
          </div>
        </aside>
        <main className="flex-1 flex flex-col p-8 max-w-6xl mx-auto w-full">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#111318]">Perfil</h2>
              <p className="text-[#616f89]">Gestiona tu cuenta y preferencias.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 rounded-lg bg-white border border-[#dbdfe6] text-sm font-bold text-[#111318] hover:bg-gray-50 transition-colors shadow-sm">Descartar</button>
              <button className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-[#0d3ea1] transition-colors shadow-sm">Guardar</button>
            </div>
          </header>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 mb-8 border border-[#dbdfe6] accent-border flex flex-col md:flex-row gap-6 items-center">
            <div className="relative">
              <img className="size-32 rounded-full border-4 border-white shadow-md object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLdV5xG4P4AfMN_8h7lYyp78h7ABPhy2wjXwWgkwhtPs26DP474ilgT9MwBfhVh6cjsXI_RGL6swLJnjkMAnfMr2fnYpD5SHo8U_jjJjB9LPz--gYRNhyZ2ecq7h_s_GK9kTFppaXoneVv3TUfd8Ct8n2KcaegLvjwrjZWuGN6npK3yDuJbN-ySzHWUibBxqzjyfY6Mxxwd4fr4bmXZdbDNubEfPK0R9oiPZqF7-u1D8IU6Zhbs7tG9_ji72Q4zMOkO_DTrUIssVk" alt="avatar" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                <h3 className="text-2xl font-bold text-[#111318] dark:text-white">Usuario</h3>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">ID: AD-0001</span>
              </div>
              <p className="text-[#111318] font-medium text-lg">Analista</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[#dbdfe6] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#dbdfe6] bg-gray-50/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  <h4 className="font-bold text-[#111318] dark:text-white">Datos personales</h4>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#111318] mb-1.5">Nombre</label>
                    <input className="w-full rounded-lg border-[#dbdfe6] h-11" type="text" defaultValue="Usuario antiDark" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#111318] mb-1.5">Correo</label>
                    <input className="w-full rounded-lg border-[#dbdfe6] h-11" type="email" defaultValue="usuario@antidark.local" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <style>{`
        .active-nav { background-color: #f0f4ff; color: #0f49bd; border-right: 3px solid #0f49bd; }
        .accent-border { border-top: 3px solid #0f49bd; }
      `}</style>
    </div>
  );
}
