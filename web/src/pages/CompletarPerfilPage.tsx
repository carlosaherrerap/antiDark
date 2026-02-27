import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function CompletarPerfilPage() {
    const [usuario, setUsuario] = useState("");
    const [clave, setClave] = useState("");
    const [nombres, setNombres] = useState("");
    const [apePat, setApePat] = useState("");
    const [apeMat, setApeMat] = useState("");
    const [cargo, setCargo] = useState("");
    const [empresa, setEmpresa] = useState("");

    // New fields
    const [departamento, setDepartamento] = useState("");
    const [provincia, setProvincia] = useState("");
    const [distrito, setDistrito] = useState("");
    const [direccion, setDireccion] = useState("");
    const [telefono, setTelefono] = useState("");
    const [documento, setDocumento] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSocial, setIsSocial] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (!token) {
            navigate("/login");
            return;
        }

        // Decode token to see if it's from Google (email present but maybe no usuario set)
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decoded = JSON.parse(jsonPayload);
            if (decoded.email) {
                setIsSocial(true);
            }
        } catch (e) { }
    }, [navigate]);

    async function handleSubmit(e: React.FormEvent) {
        if (e) e.preventDefault();
        setError(null);
        setLoading(true);

        const token = localStorage.getItem("auth_token");
        try {
            const r = await fetch(`${apiUrl}/auth/complete-profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    usuario: isSocial ? undefined : usuario,
                    clave: isSocial ? undefined : clave,
                    nombres,
                    ape_pat: apePat,
                    ape_mat: apeMat,
                    cargo,
                    empresa,
                    departamento,
                    provincia,
                    distrito,
                    direccion,
                    telefono,
                    documento
                })
            });

            const data = await r.json();
            if (!r.ok) {
                setError(data.error || "Error al completar el perfil");
                return;
            }

            navigate("/home");
        } catch {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-display">
            <div className="max-w-2xl w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <span className="material-symbols-outlined text-8xl text-primary font-black">extension</span>
                </div>

                <div className="text-center mb-10">
                    <div className="bg-primary text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
                        <span className="material-symbols-outlined text-3xl font-black">badge</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Personalizar Perfil</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 opacity-75">Completa la información necesaria para activar tu cuenta</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-l-4 border-primary pl-3">Datos de Identidad</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombres</label>
                                <input className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold uppercase focus:border-primary/30 outline-none transition-all" value={nombres} onChange={e => setNombres(e.target.value)} required />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ap. Paterno</label>
                                <input className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold uppercase focus:border-primary/30 outline-none transition-all" value={apePat} onChange={e => setApePat(e.target.value)} required />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento (DNI/RUC)</label>
                                <input className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold uppercase focus:border-primary/30 outline-none transition-all" value={documento} onChange={e => setDocumento(e.target.value)} placeholder="Ej: 70221932" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-slate-200 pl-3">Ubicación y Contacto</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departamento</label>
                                <input className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold uppercase focus:border-primary/30 outline-none transition-all" value={departamento} onChange={e => setDepartamento(e.target.value)} placeholder="LIMA" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provincia</label>
                                <input className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold uppercase focus:border-primary/30 outline-none transition-all" value={provincia} onChange={e => setProvincia(e.target.value)} placeholder="LIMA" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distrito</label>
                                <input className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold uppercase focus:border-primary/30 outline-none transition-all" value={distrito} onChange={e => setDistrito(e.target.value)} placeholder="SAN ISIDRO" />
                            </div>
                        </div>
                    </div>

                    {!isSocial && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario de Acceso</label>
                                <input className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-primary/30 outline-none transition-all" value={usuario} onChange={e => setUsuario(e.target.value)} required />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
                                <input type="password" className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-primary/30 outline-none transition-all" value={clave} onChange={e => setClave(e.target.value)} required />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6 pt-2">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo / Puesto</label>
                            <input className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold uppercase focus:border-primary/30 outline-none transition-all" value={cargo} onChange={e => setCargo(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</label>
                            <input className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold uppercase focus:border-primary/30 outline-none transition-all" value={empresa} onChange={e => setEmpresa(e.target.value)} />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-[10px] font-black uppercase text-center mt-2 bg-red-50 p-3 rounded-xl">{error}</p>}

                    <div className="flex flex-col gap-4 pt-6">
                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-primary text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:bg-[#0d3ea1] transition-all shadow-xl shadow-primary/30 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Actualizando Registro..." : "Habilitar Acceso"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/home")}
                            className="w-full bg-slate-100 text-slate-500 font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                            SALTAR
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
