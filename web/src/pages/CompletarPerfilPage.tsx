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
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we have a token (should have been set by main.tsx from URL hash)
        const token = localStorage.getItem("auth_token");
        if (!token) {
            navigate("/login");
        }
    }, [navigate]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
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
                    usuario,
                    clave,
                    nombres,
                    ape_pat: apePat,
                    ape_mat: apeMat,
                    cargo,
                    empresa
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">badge</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Casi listo...</h1>
                    <p className="text-slate-500 text-sm mt-2">Por favor, completa tus datos para finalizar el registro con Google.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Nombres</label>
                            <input
                                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={nombres} onChange={e => setNombres(e.target.value)} required
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Ap. Paterno</label>
                            <input
                                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={apePat} onChange={e => setApePat(e.target.value)} required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Usuario de Acceso</label>
                        <input
                            className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Ej: jsmith"
                            value={usuario} onChange={e => setUsuario(e.target.value)} required
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Contraseña</label>
                        <input
                            type="password"
                            className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Mínimo 8 caracteres"
                            value={clave} onChange={e => setClave(e.target.value)} required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Cargo</label>
                            <input
                                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={cargo} onChange={e => setCargo(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Empresa</label>
                            <input
                                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={empresa} onChange={e => setEmpresa(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl mt-4 hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Guardando..." : "Finalizar y Entrar"}
                    </button>
                </form>
            </div>
        </div>
    );
}
