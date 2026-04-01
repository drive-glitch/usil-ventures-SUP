"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, ChevronRight, CalendarDays, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CreateStartupModal } from "@/components/create-startup-modal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type HitoRow = {
  id: string;
  startup_id: string;
  nombre: string | null;
  orden: number | null;
  estado: string | null;
  fecha_fin: string | null;
};

type ReunionRow = {
  id: string;
  startup_id: string | null;
  titulo: string | null;
  fecha: string | null;
};

export type PendienteDashboard = {
  id: string;
  titulo: string | null;
  estado: string | null;
  fecha_limite: string | null;
  startup_id: string | null;
  startup_nombre: string;
};

export type StartupRow = {
  id: string;
  nombre: string;
  generacion: string | null;
  tipo: string | null;
  estado: string | null;
  riesgo: string | null;
  hito_actual: HitoRow | null;
  ultima_reunion: ReunionRow | null;
  avance: number | null;
  pendientesVencidos: number;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function fmtDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(fechaLimite: string | null | undefined) {
  if (!fechaLimite) return false;
  return new Date(fechaLimite) < new Date();
}

function isOverdueHito(hito: HitoRow | null) {
  if (!hito?.fecha_fin || hito.estado === "completado") return false;
  return new Date(hito.fecha_fin) < new Date();
}

// riesgo → semáforo display
const SALUD_MAP: Record<string, { emoji: string; label: string; cls: string }> = {
  bajo:  { emoji: "🟢", label: "Saludable",  cls: "bg-[#D1FAE5] text-[#065F46]" },
  medio: { emoji: "🟡", label: "Atención",   cls: "bg-[#FEF3C7] text-[#92400E]" },
  alto:  { emoji: "🔴", label: "En riesgo",  cls: "bg-[#FEE2E2] text-[#991B1B]" },
};

// ─────────────────────────────────────────────
// UI primitives
// ─────────────────────────────────────────────

function KpiCard({ label, value, warn, sub }: { label: string; value: number; warn?: boolean; sub?: string }) {
  return (
    <div className={cn("bg-white border rounded-xl p-5 transition-all hover:shadow-md hover:-translate-y-px cursor-default", warn && value > 0 ? "border-red-200" : "border-[#E8E7E2]")}>
      <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-3 leading-tight">{label}</p>
      <p className={cn("text-4xl font-bold leading-none", warn && value > 0 ? "text-red-600" : "text-[#1a1a18]")}>{value}</p>
      {sub && <p className="text-[10px] text-[#bbb] mt-2">{sub}</p>}
    </div>
  );
}

function SaludBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-[#bbb]">—</span>;
  const s = SALUD_MAP[value];
  if (!s) return <span className="text-[#bbb]">—</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold", s.cls)}>
      {s.emoji} {s.label}
    </span>
  );
}

function TipoBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-[#bbb]">—</span>;
  const cls: Record<string, string> = {
    Innovadores: "bg-[#DBEAFE] text-[#1E40AF]",
    Dinámicos:   "bg-[#EDE9FE] text-[#5B21B6]",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold", cls[value] ?? "bg-gray-100 text-gray-700")}>
      {value}
    </span>
  );
}

function AvanceBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[#bbb] text-xs">—</span>;
  const color = value >= 80 ? "bg-green-500" : value >= 50 ? "bg-blue-500" : "bg-orange-400";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-bold text-[#555] tabular-nums w-8 text-right">{value}%</span>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors border-[1.5px] whitespace-nowrap",
        active
          ? "bg-[#EFF6FF] border-[#3B82F6] text-[#1D4ED8]"
          : "bg-white border-[#D1D5DB] text-[#555] hover:border-[#3B82F6] hover:text-[#1D4ED8]"
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
// Alerts sidebar
// ─────────────────────────────────────────────

function AlertsSidebar({ alerts }: { alerts: StartupRow[] }) {
  return (
    <div className="bg-white border border-[#E8E7E2] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E8E7E2] bg-[#F9FAFB]">
        <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider">🚨 Alertas</p>
      </div>
      {alerts.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-[#888]">Sin alertas activas</p>
          <p className="text-xs text-[#bbb] mt-1">Todo en orden ✓</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F3F4F6]">
          {alerts.map((r) => {
            const s = SALUD_MAP[r.riesgo ?? ""];
            return (
              <Link key={r.id} href={`/startups/${r.id}`}>
                <div className="px-4 py-3 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                  <p className="text-sm font-semibold text-[#1a1a18] leading-tight">{r.nombre}</p>
                  <div className="space-y-0.5 mt-0.5">
                    {s && (
                      <p className={`text-[11px] font-medium ${r.riesgo === "alto" ? "text-red-600" : "text-orange-600"}`}>
                        {s.emoji} {s.label}
                      </p>
                    )}
                    {r.pendientesVencidos > 0 && (
                      <p className="text-[11px] font-medium text-red-600">
                        ⏰ {r.pendientesVencidos} pendiente{r.pendientesVencidos > 1 ? "s" : ""} vencido{r.pendientesVencidos > 1 ? "s" : ""}
                      </p>
                    )}
                    {isOverdueHito(r.hito_actual) && (
                      <p className="text-[11px] font-medium text-red-600">⏳ Hito vencido</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Pendientes summary
// ─────────────────────────────────────────────

function PendientesSummary({ pendientes }: { pendientes: PendienteDashboard[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = pendientes.filter(
    (p) => p.fecha_limite && new Date(p.fecha_limite) < today
  );
  const upcoming = pendientes.filter(
    (p) => !p.fecha_limite || new Date(p.fecha_limite) >= today
  );

  return (
    <div className="bg-white border border-[#E8E7E2] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E8E7E2] bg-[#F9FAFB] flex items-center justify-between">
        <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider">📋 Pendientes</p>
        <span className="text-[10px] font-bold text-[#888]">{pendientes.length} activos</span>
      </div>

      {pendientes.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-[#888]">Sin pendientes activos</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F3F4F6] max-h-72 overflow-y-auto">
          {overdue.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <AlertCircle className="h-3 w-3" /> Vencidos · {overdue.length}
              </p>
              <div className="space-y-2">
                {overdue.map((p) => (
                  <Link key={p.id} href={`/startups/${p.startup_id}`}>
                    <div className="group hover:bg-red-50/40 -mx-1 px-1 py-1 rounded transition-colors">
                      <p className="text-xs font-semibold text-[#1a1a18] group-hover:text-red-700 leading-snug truncate">
                        {p.titulo ?? "Sin título"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#888] truncate">{p.startup_nombre}</span>
                        {p.fecha_limite && (
                          <>
                            <span className="text-[#ccc]">·</span>
                            <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5">
                              <CalendarDays className="h-2.5 w-2.5" />
                              {fmtDate(p.fecha_limite)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="px-4 pt-3 pb-2">
              <p className="text-[9px] font-bold text-[#888] uppercase tracking-wider mb-1.5">
                Próximos · {upcoming.length}
              </p>
              <div className="space-y-2">
                {upcoming.slice(0, 8).map((p) => (
                  <Link key={p.id} href={`/startups/${p.startup_id}`}>
                    <div className="group hover:bg-[#FAFAFA] -mx-1 px-1 py-1 rounded transition-colors">
                      <p className="text-xs font-medium text-[#1a1a18] leading-snug truncate">
                        {p.titulo ?? "Sin título"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#888] truncate">{p.startup_nombre}</span>
                        {p.fecha_limite && (
                          <>
                            <span className="text-[#ccc]">·</span>
                            <span className="text-[10px] text-[#888] flex items-center gap-0.5">
                              <CalendarDays className="h-2.5 w-2.5" />
                              {fmtDate(p.fecha_limite)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                {upcoming.length > 8 && (
                  <p className="text-[10px] text-[#bbb] text-center pt-1">
                    +{upcoming.length - 8} más
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Desktop table
// ─────────────────────────────────────────────

function StartupTable({ rows }: { rows: StartupRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-[#E8E7E2] rounded-xl px-6 py-16 text-center">
        <p className="text-sm text-[#888]">No hay startups que coincidan.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E7E2] rounded-xl overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#F9FAFB] border-b border-[#E8E7E2]">
            {["Startup", "Gen.", "Tipo", "📊 Avance", "🚦 Salud", "🗓️ Última reunión", ""].map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#FAFAFA] transition-colors">
              <td className="px-4 py-3 font-semibold text-[#1a1a18] whitespace-nowrap">
                {row.nombre}
                {row.pendientesVencidos > 0 && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600">
                    {row.pendientesVencidos}p venc.
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">{row.generacion ?? "—"}</td>
              <td className="px-4 py-3 whitespace-nowrap"><TipoBadge value={row.tipo} /></td>
              <td className="px-4 py-3 whitespace-nowrap min-w-[110px]"><AvanceBar value={row.avance} /></td>
              <td className="px-4 py-3 whitespace-nowrap"><SaludBadge value={row.riesgo} /></td>
              <td className="px-4 py-3 text-[#6B7280] text-xs whitespace-nowrap">{fmtDate(row.ultima_reunion?.fecha)}</td>
              <td className="px-4 py-3">
                <Link href={`/startups/${row.id}`}>
                  <button className="flex items-center gap-1 text-[#3B82F6] text-xs font-semibold hover:underline whitespace-nowrap">
                    Ver <ChevronRight className="h-3 w-3" />
                  </button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mobile cards
// ─────────────────────────────────────────────

function StartupCards({ rows }: { rows: StartupRow[] }) {
  if (rows.length === 0) {
    return <p className="py-12 text-center text-sm text-[#888]">No hay startups que coincidan.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Link key={row.id} href={`/startups/${row.id}`}>
          <div className="bg-white border border-[#E8E7E2] rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-semibold text-[#1a1a18]">{row.nombre}</p>
                {row.generacion && (
                  <span className="text-[10px] text-[#888] font-bold uppercase tracking-wide">{row.generacion}</span>
                )}
              </div>
              <SaludBadge value={row.riesgo} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] text-[#888] font-bold uppercase tracking-wide mb-1">Tipo</p>
                <TipoBadge value={row.tipo} />
              </div>
              <div>
                <p className="text-[10px] text-[#888] font-bold uppercase tracking-wide mb-1">📊 Avance</p>
                <AvanceBar value={row.avance} />
              </div>
              <div>
                <p className="text-[10px] text-[#888] font-bold uppercase tracking-wide mb-1">🗓️ Última reunión</p>
                <p className="text-[#6B7280]">{fmtDate(row.ultima_reunion?.fecha)}</p>
              </div>
              {row.pendientesVencidos > 0 && (
                <div>
                  <p className="text-[10px] text-[#888] font-bold uppercase tracking-wide mb-1">Pendientes</p>
                  <p className="text-red-600 font-medium">{row.pendientesVencidos} vencido{row.pendientesVencidos > 1 ? "s" : ""}</p>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main client component
// ─────────────────────────────────────────────

export function DashboardClient({
  rows,
  pendientes,
}: {
  rows: StartupRow[];
  pendientes: PendienteDashboard[];
}) {
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterGen, setFilterGen] = useState("all");
  const [filterSalud, setFilterSalud] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const kpis = useMemo(() => {
    const activas = rows.filter((r) => r.estado === "activa").length;
    const enRiesgo = rows.filter((r) => r.riesgo === "alto").length;
    const totalPendientesVencidos = rows.reduce((sum, r) => sum + r.pendientesVencidos, 0);
    const generaciones = new Set(rows.map((r) => r.generacion).filter(Boolean)).size;
    return { activas, enRiesgo, totalPendientesVencidos, generaciones };
  }, [rows]);

  const alerts = useMemo(
    () => rows.filter((r) => r.riesgo === "alto" || r.riesgo === "medio" || r.pendientesVencidos > 0 || isOverdueHito(r.hito_actual)),
    [rows]
  );

  const tipos = useMemo(() => [...new Set(rows.map((r) => r.tipo).filter(Boolean))] as string[], [rows]);
  const generaciones = useMemo(
    () => [...new Set(rows.map((r) => r.generacion).filter(Boolean))].sort() as string[],
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !r.nombre.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterTipo !== "all" && r.tipo !== filterTipo) return false;
      if (filterGen !== "all" && r.generacion !== filterGen) return false;
      if (filterSalud !== "all" && r.riesgo !== filterSalud) return false;
      return true;
    });
  }, [rows, search, filterTipo, filterGen, filterSalud]);

  return (
    <>
      <CreateStartupModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a18]">📊 Dashboard</h1>
            <p className="text-sm text-[#888] mt-0.5">Portafolio USIL Ventures</p>
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold">
            <Plus className="h-4 w-4" />
            Crear startup
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Startups activas" value={kpis.activas} sub="en portafolio" />
          <KpiCard label="Generaciones" value={kpis.generaciones} />
          <KpiCard label="🔴 En riesgo" value={kpis.enRiesgo} warn />
          <KpiCard label="⏰ Pendientes vencidos" value={kpis.totalPendientesVencidos} warn />
        </div>

        {/* Main area */}
        <div className="flex gap-5 items-start">
          {/* Left */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Filters */}
            <div className="space-y-3">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#bbb]" />
                <Input
                  placeholder="Buscar startup..."
                  className="pl-9 bg-white border-[#D1D5DB] text-sm h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Tipo */}
              <div className="flex flex-wrap gap-2">
                <FilterPill active={filterTipo === "all"} onClick={() => setFilterTipo("all")}>Todos</FilterPill>
                {tipos.map((t) => (
                  <FilterPill key={t} active={filterTipo === t} onClick={() => setFilterTipo(t)}>{t}</FilterPill>
                ))}
              </div>

              {/* Generación */}
              {generaciones.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <FilterPill active={filterGen === "all"} onClick={() => setFilterGen("all")}>Todas las gen.</FilterPill>
                  {generaciones.map((g) => (
                    <FilterPill key={g} active={filterGen === g} onClick={() => setFilterGen(g)}>{g}</FilterPill>
                  ))}
                </div>
              )}

              {/* Salud (riesgo) */}
              <div className="flex flex-wrap gap-2">
                <FilterPill active={filterSalud === "all"} onClick={() => setFilterSalud("all")}>Salud</FilterPill>
                <FilterPill active={filterSalud === "bajo"} onClick={() => setFilterSalud("bajo")}>🟢 Saludable</FilterPill>
                <FilterPill active={filterSalud === "medio"} onClick={() => setFilterSalud("medio")}>🟡 Atención</FilterPill>
                <FilterPill active={filterSalud === "alto"} onClick={() => setFilterSalud("alto")}>🔴 En riesgo</FilterPill>
              </div>
            </div>

            <p className="text-xs text-[#888] font-medium">
              {filtered.length} startup{filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="hidden md:block"><StartupTable rows={filtered} /></div>
            <div className="md:hidden"><StartupCards rows={filtered} /></div>

            {/* Mobile sidebars */}
            <div className="lg:hidden mt-2 space-y-4">
              <AlertsSidebar alerts={alerts} />
              <PendientesSummary pendientes={pendientes} />
            </div>
          </div>

          {/* Right sidebar (desktop) */}
          <div className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
            <AlertsSidebar alerts={alerts} />
            <PendientesSummary pendientes={pendientes} />
          </div>
        </div>
      </div>
    </>
  );
}
