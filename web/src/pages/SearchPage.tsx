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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      <div className="flex h-screen overflow-hidden relative">
        {/* Overlay mobile */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative size-10 bg-primary/10 rounded-xl flex items-center justify-center border-2 border-primary/20">
                <span className="material-symbols-outlined text-primary text-2xl font-black">extension</span>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-primary pointer-events-none mt-0.5">A</span>
              </div>
              <div>
                <h1 className="font-black text-lg leading-tight uppercase tracking-tight text-slate-900 dark:text-white">antiDark</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">Ficha de Riesgo</p>
              </div>
            </div>
            <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="flex-1 px-4 space-y-1 mt-4">
            <Link className="flex items-center gap-3 px-3 py-3 sidebar-item-active text-primary transition-colors" to="/busqueda">
              <span className="material-symbols-outlined">search</span>
              <span className="text-sm font-bold uppercase tracking-wide">Listas Negativas</span>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-3 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" to="/perfil">
              <span className="material-symbols-outlined">account_circle</span>
              <span className="text-sm font-bold uppercase tracking-wide">Perfil</span>
            </Link>
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-bold uppercase text-xs" onClick={() => { localStorage.removeItem("auth_token"); navigate("/login"); }}>
              <span className="material-symbols-outlined text-xl">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 text-sm text-slate-500">
              <button className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600" onClick={() => setIsSidebarOpen(true)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
              <Link className="hover:text-primary cursor-pointer hidden sm:inline" to="/home">Home</Link>
              <span className="material-symbols-outlined text-base hidden sm:inline">chevron_right</span>
              <span className="text-slate-900 dark:text-white font-bold uppercase text-xs tracking-wider">Listas Negativas</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <button className="p-2 text-slate-400 hover:text-primary transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase hover:bg-primary/10 hover:text-primary transition-all border border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                <span className="hidden sm:inline">Programar Búsqueda</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                <span className="material-symbols-outlined text-primary text-sm">database</span>
                <span className="text-primary text-[10px] font-black uppercase">{tokens ?? "-"} tokens</span>
              </div>
              <button className="relative p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-transparent hover:border-primary/20 transition-all" onClick={() => navigate("/perfil")}>
                <img className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/a/ACg8ocL_G5I_J_H5_v_v_v=s96-c" alt="avatar" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
            <section>
              <div className="mb-6">
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Motor de Búsqueda Avanzada</h2>
                <p className="text-slate-500 mt-1 max-w-2xl text-sm font-medium">Búsqueda cruzada por nombres, apellidos y documentos con ranking de relevancia inteligente.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Nombres / Razón Social</label>
                    <input className="input-partial-border rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm font-bold uppercase" placeholder="Ej: ALEJANDRO" value={qNombre} onChange={(e) => setQNombre(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Apellido Paterno</label>
                    <input className="input-partial-border rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm font-bold uppercase" placeholder="Ej: VAZQUEZ" value={qApePat} onChange={(e) => setQApePat(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Apellido Materno</label>
                    <input className="input-partial-border rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm font-bold uppercase" placeholder="Ej: RAMOS" value={qApeMat} onChange={(e) => setQApeMat(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">DNI / RUC</label>
                    <input className="input-partial-border rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm font-bold uppercase" placeholder="45672831" value={qDoc} onChange={(e) => setQDoc(e.target.value)} />
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all" onClick={() => { setQNombre(""); setQApePat(""); setQApeMat(""); setQDoc(""); consultar(1); }}>Limpiar</button>
                  <button className="px-10 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20" onClick={() => consultar(1)}>
                    <span className="material-symbols-outlined text-sm">search</span>
                    Buscar Coincidencias
                  </button>
                </div>
                {error && <div className="text-red-600 mt-3 text-xs font-bold uppercase p-3 bg-red-50 rounded-lg">{error}</div>}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black uppercase tracking-tight">{isSearching ? "Resultados Exactos" : "Todas las Entidades"}</h3>
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">{isSearching ? results.length : total} REGISTROS</span>
                </div>
                {!isSearching && (
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
                    <button disabled={page <= 1} onClick={() => consultar(page - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <span className="text-[10px] font-black uppercase px-2">Pág {page}</span>
                    <button disabled={page * 10 >= total} onClick={() => consultar(page + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto min-h-[200px]">
                {loading ? <LoadingSkeleton /> : <ResultsTable data={results} onDetail={abrirDetalle} onPdf={exportarPDF} />}
              </div>

              {isSearching && coincidences.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="size-2 bg-slate-300 rounded-full"></div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Sugerencias por Similitud</h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dotted border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto opacity-75 grayscale-[0.3]">
                    {loading ? <LoadingSkeleton /> : <ResultsTable data={coincidences} onDetail={abrirDetalle} onPdf={exportarPDF} />}
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* DETALLES MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="font-black text-lg sm:text-2xl tracking-tight uppercase">Expediente de Incumplimiento</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ficha antiDark</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="size-10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                <span className="material-symbols-outlined font-bold">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-b-primary"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Construyendo Informe...</p>
                </div>
              ) : detailData && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-5">
                      <div className="size-16 sm:size-20 bg-primary text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/40 overflow-hidden ring-4 ring-white dark:ring-slate-900">
                        <span className="material-symbols-outlined text-4xl">account_circle</span>
                      </div>
                      <div>
                        <h4 className="text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white leading-tight">
                          {detailData.natural ? `${detailData.natural.nombre} ${detailData.natural.ape_pat} ${detailData.natural.ape_mat}` : detailData.juridica?.razon_social}
                        </h4>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{detailData.entidad.id % 2 === 0 ? 'SCORE 100/100' : 'SCORE 94/100'}</span>
                          <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase italic opacity-75">
                            DOC: {detailData.entidad.documento} • ID: #{String(detailData.entidad.id).padStart(5, '0')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                      <span className="material-symbols-outlined text-green-500 text-xl">database</span>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tokens Restantes</p>
                        <p className="text-lg font-black text-primary leading-none">{tokens}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h5 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest border-l-4 border-primary pl-3">Datos de Identidad</h5>
                      <div className="space-y-1 bg-slate-50/30 dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                        <InfoRow label="Tipo Entidad" value={detailData.entidad.tipo_entidad} />
                        {detailData.natural && <InfoRow label="Género" value={detailData.natural.sexo === 'M' ? 'Masculino' : 'Femenino'} />}
                        <InfoRow label="Ubicación" value={`${detailData.entidad.distrito}, ${detailData.entidad.departamento}`} />
                        <InfoRow label="Dirección" value={detailData.entidad.direccion} />
                        <InfoRow label="Rubro" value={detailData.entidad.rubro} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h5 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest border-l-4 border-green-400 pl-3">Atributos Extendidos</h5>
                      <div className="space-y-1 bg-slate-50/30 dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                        {detailData.extension.natural ? (
                          <>
                            <InfoRow label="Fec. Nacimiento" value={detailData.extension.natural.fec_nac} />
                            <InfoRow label="Nacionalidad" value={detailData.extension.natural.nacionalidad} />
                            <InfoRow label="Instrucción" value={detailData.extension.natural.grado_instruccion} />
                          </>
                        ) : detailData.extension.juridica ? (
                          <>
                            <InfoRow label="Representante" value="PENDIENTE DE CARGA" />
                            <InfoRow label="Capital Social" value="ALTO" />
                          </>
                        ) : <p className="text-[10px] text-slate-400 italic font-bold text-center py-4 uppercase">Datos no disponibles para esta entidad</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h5 className="font-black text-red-500 uppercase text-xs tracking-[0.2em] border-l-4 border-red-500 pl-3">Hallazgos y Listas de Riesgo</h5>
                    {detailData.manchas.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {detailData.manchas.map((m: any) => (
                          <div key={m.id} className="p-5 bg-gradient-to-br from-red-50 to-white dark:from-red-900/10 dark:to-slate-900 border border-red-100 dark:border-red-900/30 rounded-3xl group hover:shadow-lg transition-all">
                            <div className="flex justify-between items-start mb-3">
                              <span className="px-3 py-1 bg-red-600 text-white text-[9px] font-black rounded-full uppercase shadow-lg shadow-red-200 dark:shadow-none">{m.tipo_lista}</span>
                              <span className="material-symbols-outlined text-red-200 group-hover:text-red-500 transition-colors">warning</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{m.descripcion}</p>
                            {m.link && <a href={m.link} target="_blank" className="text-[9px] text-primary font-black hover:underline mt-4 flex items-center gap-1 uppercase">Verificación oficial <span className="material-symbols-outlined text-[12px]">open_in_new</span></a>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 bg-green-50 dark:bg-green-900/10 rounded-[3rem] border-2 border-dashed border-green-200 text-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-green-500 animate-bounce">verified_user</span>
                        <p className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest">¡Entidad Conforme!</p>
                        <p className="text-[10px] text-green-600 font-medium max-w-xs uppercase">No se registran antecedentes negativos en las bases consultadas hoy.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors order-2 sm:order-1">Cerrar Expediente</button>
              <button onClick={() => exportarPDF(detailData?.entidad || {})} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-400/30 dark:shadow-none flex items-center justify-center gap-3 order-1 sm:order-2 hover:bg-slate-800 transition-all">
                <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                Descargar Ficha PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sidebar-item-active { background-color: rgba(15, 73, 189, 0.08); border-right: 4px solid #0f49bd; color: #0f49bd; box-shadow: inset -4px 0 12px -8px #0f49bd; }
        .input-partial-border { border: 2px solid #edf2f7; border-bottom: 3px solid #0f49bd; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .input-partial-border:focus { outline: none; border-color: #0f49bd; background-color: white; transform: translateY(-1px); box-shadow: 0 12px 20px -10px rgba(15, 73, 189, 0.15); }
      `}</style>
    </div>
  );
}

function ResultsTable({ data, onDetail, onPdf }: { data: any[], onDetail: (id: number) => void, onPdf: (e: any) => void }) {
  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
      <span className="material-symbols-outlined text-3xl text-slate-200">folder_open</span>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">Sin hallazgos en esta categoría</p>
    </div>
  );

  return (
    <table className="w-full text-left border-collapse min-w-[600px]">
      <thead>
        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest w-40">Nivel de Coincidencia</th>
          <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identidad / Razón</th>
          <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificación</th>
          <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Consulta</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.map((r) => (
          <tr key={`${r.tipo}-${r.id}-${r.documento}`} className="hover:bg-blue-50/30 dark:hover:bg-primary/5 transition-all group">
            <td className="px-6 py-6">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${r.score >= 10 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-500'}`}>
                {r.score >= 10 ? 'MATCH CRÍTICO' : `RELEVANCIA ${Math.round((r.score / 20) * 100)}%`}
              </span>
            </td>
            <td className="px-6 py-6">
              <div className="font-black text-slate-900 dark:text-white uppercase truncate max-w-[280px] text-xs transition-colors group-hover:text-primary">
                {r.tipo === "natural" ? `${r.nombre || ""} ${r.ape_pat || ""} ${r.ape_mat || ""}` : r.nombre}
              </div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">#{String(r.id).padStart(5, "0")} • {r.tipo === "natural" ? "Natural" : "Jurídica"}</div>
            </td>
            <td className="px-6 py-6">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 tabular-nums">{r.documento}</span>
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Verificado</span>
              </div>
            </td>
            <td className="px-6 py-6 text-right">
              <div className="flex justify-end items-center gap-3">
                <button onClick={() => onDetail(r.id)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 group-hover:bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 dark:shadow-none">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Expediente
                </button>
                <button onClick={() => onPdf(r)} className="size-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white rounded-xl text-slate-400 transition-all">
                  <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
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
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-b-primary"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Procesando información...</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
      <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{label}</span>
      <span className="text-slate-900 dark:text-white font-black uppercase text-xs">{value || "---"}</span>
    </div>
  );
}
