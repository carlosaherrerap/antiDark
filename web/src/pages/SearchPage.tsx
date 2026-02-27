import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function SearchPage() {
  const [qNombre, setQNombre] = useState("");
  const [qApePat, setQApePat] = useState("");
  const [qApeMat, setQApeMat] = useState("");
  const [qDoc, setQDoc] = useState("");

  const [results, setResults] = useState<any[]>([]);
  const [coincidences, setCoincidences] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [tokens, setTokens] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const navigate = useNavigate();

  async function fetchTokens() {
    const token = localStorage.getItem("auth_token") || "";
    if (!token) return;
    try {
      const r = await fetch(`${apiUrl}/tokens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const data = await r.json();
        setTokens(data.current);
      }
    } catch { }
  }

  async function consultar(newPage: number = 1) {
    setError(null);
    setLoading(true);
    const token = localStorage.getItem("auth_token") || "";
    try {
      const params = new URLSearchParams({
        nombre: qNombre,
        ape_pat: qApePat,
        ape_mat: qApeMat,
        documento: qDoc,
        page: newPage.toString()
      });

      const r = await fetch(`${apiUrl}/search?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (r.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        return;
      }

      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Error");
        return;
      }
      setResults(data.results || []);
      setCoincidences(data.coincidences || []);
      setIsSearching(data.isSearching || false);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTokens();
    consultar(1); // Load all on mount
  }, []);

  async function abrirDetalle(id: number) {
    setLoadingDetail(true);
    setIsModalOpen(true);
    setError(null);
    const token = localStorage.getItem("auth_token") || "";
    try {
      const r = await fetch(`${apiUrl}/entity/${id}/detail-access`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.status === 401) {
        navigate("/login");
        return;
      }
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "No se pudo acceder al detalle");
        setIsModalOpen(false);
        return;
      }
      setDetailData(data);
      setTokens(data.tokens_left);
    } catch {
      setError("Error al cargar detalles");
      setIsModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  const exportarPDF = (entity: any) => {
    const doc = new jsPDF();
    const title = entity.tipo === 'natural' ? `${entity.nombre} ${entity.ape_pat} ${entity.ape_mat}` : entity.nombre;

    doc.setFontSize(18);
    doc.text("Ficha de Verificación - antiDark", 14, 20);
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Campo', 'Valor']],
      body: [
        ['Nombre/Razón Social', title],
        ['Documento', entity.documento],
        ['Tipo', entity.tipo === 'natural' ? 'Persona Natural' : 'Persona Jurídica'],
        ['ID Sistema', `#${String(entity.id).padStart(5, "0")}`]
      ],
    });

    doc.save(`Ficha_${entity.documento}.pdf`);
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <span className="material-symbols-outlined text-white">shield_person</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">antiDark</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Admin Portal</p>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-1 mt-4">
            <Link className="flex items-center gap-3 px-3 py-3 sidebar-item-active text-primary transition-colors" to="/busqueda">
              <span className="material-symbols-outlined">search</span>
              <span className="text-sm font-semibold">Listas Negativas</span>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-3 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" to="/perfil">
              <span className="material-symbols-outlined">account_circle</span>
              <span className="text-sm font-semibold">Perfil</span>
            </Link>
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600" onClick={() => { localStorage.removeItem("auth_token"); navigate("/login"); }}>
              <span className="material-symbols-outlined text-xl">logout</span>
              <span>Salir</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <Link className="hover:text-primary cursor-pointer" to="/home">Home</Link>
              <span className="material-symbols-outlined text-base">chevron_right</span>
              <span className="text-slate-900 dark:text-white font-semibold">Listas Negativas</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full">
                <span className="material-symbols-outlined text-primary text-sm">database</span>
                <span className="text-primary text-xs font-bold">{tokens ?? "-"} tokens</span>
              </div>
              <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigate("/perfil")}>
                <img className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" src="https://lh3.googleusercontent.com/a/ACg8ocL_G5I_J_H5_v_v_v=s96-c" alt="avatar" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <section>
              <div className="mb-6">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Motor de Búsqueda Avanzada</h2>
                <p className="text-slate-500 mt-1 max-w-2xl">Búsqueda cruzada por nombres, apellidos y documentos con ranking de relevancia.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombres / Razón Social</label>
                    <input className="input-partial-border rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-sm" placeholder="Nombre..." value={qNombre} onChange={(e) => setQNombre(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Apellido Paterno</label>
                    <input className="input-partial-border rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-sm" placeholder="Paterno..." value={qApePat} onChange={(e) => setQApePat(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Apellido Materno</label>
                    <input className="input-partial-border rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-sm" placeholder="Materno..." value={qApeMat} onChange={(e) => setQApeMat(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">DNI / RUC</label>
                    <input className="input-partial-border rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-sm" placeholder="Documento..." value={qDoc} onChange={(e) => setQDoc(e.target.value)} />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <button className="px-6 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50" onClick={() => { setQNombre(""); setQApePat(""); setQApeMat(""); setQDoc(""); consultar(1); }}>Limpiar</button>
                  <button className="px-8 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md shadow-primary/20" onClick={() => consultar(1)}>
                    <span className="material-symbols-outlined text-lg">search</span>
                    Buscar Coincidencias
                  </button>
                </div>
                {error && <div className="text-red-600 mt-3 text-sm font-medium">{error}</div>}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold">{isSearching ? "Resultados Exactos" : "Todas las Entidades"}</h3>
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">{isSearching ? results.length : total} REGISTROS</span>
                </div>
                {!isSearching && (
                  <div className="flex items-center gap-2">
                    <button disabled={page <= 1} onClick={() => consultar(page - 1)} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span className="text-xs font-bold">Página {page}</span>
                    <button disabled={page * 10 >= total} onClick={() => consultar(page + 1)} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[200px]">
                {loading ? <LoadingSkeleton /> : <ResultsTable data={results} onDetail={abrirDetalle} onPdf={exportarPDF} />}
              </div>

              {isSearching && coincidences.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-400">Posibles Coincidencias (Sugerencias)</h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden opacity-75 grayscale-[0.5]">
                    {loading ? <LoadingSkeleton /> : <ResultsTable data={coincidences} onDetail={abrirDetalle} onPdf={exportarPDF} />}
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* DETALLES MODAL code remains the same... */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-black text-xl tracking-tight">Expediente de Cumplimiento</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Generando Reporte...</p>
                </div>
              ) : detailData && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="size-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-primary">person</span>
                        </div>
                        <div>
                          <h4 className="text-2xl font-black uppercase text-slate-900 dark:text-white leading-none">
                            {detailData.natural ? `${detailData.natural.nombre} ${detailData.natural.ape_pat} ${detailData.natural.ape_mat}` : detailData.juridica?.razon_social}
                          </h4>
                          <p className="text-slate-500 font-bold mt-2 tracking-widest text-xs uppercase italic opacity-75">
                            Documento: {detailData.entidad.documento} • ID: #{String(detailData.entidad.id).padStart(5, '0')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                      <p className="text-[10px] font-black underline uppercase text-green-600 dark:text-green-400 mb-1">Estatus del Token</p>
                      <p className="text-xs font-bold text-green-700 dark:text-green-300">Consulta realizada con éxito. Tokens restantes: <span className="text-lg underline">{tokens}</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h5 className="font-bold text-slate-400 uppercase text-[10px] border-b border-slate-100 pb-2">Datos de Identidad</h5>
                      <div className="space-y-3">
                        <InfoRow label="Tipo Entidad" value={detailData.entidad.tipo_entidad} />
                        {detailData.natural && <InfoRow label="Sexo" value={detailData.natural.sexo === 'M' ? 'Masculino' : 'Femenino'} />}
                        <InfoRow label="Ubicación" value={`${detailData.entidad.distrito}, ${detailData.entidad.departamento}`} />
                        <InfoRow label="Dirección" value={detailData.entidad.direccion} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h5 className="font-bold text-slate-400 uppercase text-[10px] border-b border-slate-100 pb-2">Información Extendida</h5>
                      <div className="space-y-3">
                        {detailData.extension.natural ? (
                          <>
                            <InfoRow label="Fec. Nacimiento" value={detailData.extension.natural.fec_nac} />
                            <InfoRow label="Nacionalidad" value={detailData.extension.natural.nacionalidad} />
                            <InfoRow label="Grado Instrucción" value={detailData.extension.natural.grado_instruccion} />
                          </>
                        ) : <p className="text-xs text-slate-400 italic">No hay datos extendidos disponibles.</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-bold text-red-500 uppercase text-[10px] border-b border-red-100 pb-2">Hallazgos en Listas y Antecedentes</h5>
                    {detailData.manchas.length > 0 ? (
                      <div className="space-y-3">
                        {detailData.manchas.map((m: any) => (
                          <div key={m.id} className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
                            <p className="text-xs font-black text-red-700 dark:text-red-400 underline mb-1 uppercase">{m.tipo_lista}</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{m.descripcion}</p>
                            {m.link && <a href={m.link} target="_blank" className="text-[10px] text-blue-600 font-bold hover:underline mt-2 block">VER FUENTE EXTERNA</a>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-green-600 font-bold italic p-4 bg-green-50 rounded-lg">¡Limpio! No se encontraron hallazgos adversos para esta entidad.</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-sm text-slate-600">Cerrar</button>
              <button onClick={() => exportarPDF(detailData?.entidad || {})} className="px-8 py-2 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">download</span>
                Descargar Reporte Completo
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sidebar-item-active { background-color: rgba(15, 73, 189, 0.1); border-right: 3px solid #0f49bd; color: #0f49bd; }
        .input-partial-border { border: 1px solid #e2e8f0; border-bottom: 2px solid #0f49bd; transition: all 0.2s; }
        .input-partial-border:focus { outline: none; border-color: #0f49bd; box-shadow: 0 4px 6px -1px rgba(15, 73, 189, 0.1); background-color: white; }
      `}</style>
    </div>
  );
}

function ResultsTable({ data, onDetail, onPdf }: { data: any[], onDetail: (id: number) => void, onPdf: (e: any) => void }) {
  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <p className="text-slate-400 text-sm italic font-medium">No se encontraron registros en esta sección.</p>
    </div>
  );

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ranking</th>
          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Entidad Detalle</th>
          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Documento</th>
          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.map((r) => (
          <tr key={`${r.tipo}-${r.id}-${r.documento}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${r.score >= 10 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                {r.score >= 10 ? 'MATCH DIRECTO' : `PUNTAJE: ${r.score}`}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="font-bold text-slate-900 dark:text-white uppercase truncate max-w-[300px]">
                {r.tipo === "natural" ? `${r.nombre || ""} ${r.ape_pat || ""} ${r.ape_mat || ""}` : r.nombre}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">#{String(r.id).padStart(5, "0")} • {r.tipo === "natural" ? "PERSONA NATURAL" : "EMPRESA"}</div>
            </td>
            <td className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">{r.documento}</td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button onClick={() => onDetail(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Ver Detalles
                </button>
                <button onClick={() => onPdf(r)} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors">
                  <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      <p className="text-sm font-medium text-slate-400">Procesando información...</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="text-slate-900 dark:text-white font-bold uppercase">{value || "---"}</span>
    </div>
  );
}
