"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { updateHito } from "@/app/actions/update-hito";
import { computeProgress } from "@/lib/compute-progress";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ActivityRow = {
  id: string;
  descripcion: string | null;
  estado: string | null;
  notas: string | null;
};

export type IndicadorRow = {
  id: string;
  nombre: string | null;
  unidad: string | null;
  meta: number | null;
  actual: number | null;
  orden: number | null;
};

export type HitoWithActivities = {
  id: string;
  nombre: string | null;
  descripcion: string | null;
  orden: number | null;
  estado: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  doc_tecnica: boolean | null;
  doc_financiera: boolean | null;
  doc_reporte: boolean | null;
  indicadores_list: IndicadorRow[];
  activities: ActivityRow[];
};

// re-export so page.tsx can still import from one place
export { computeProgress };

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getDaysInfo(hito: HitoWithActivities): { text: string; chip: string } {
  if (hito.estado === "completado")
    return { text: "✓ Completado", chip: "bg-[#D1FAE5] text-[#065F46]" };
  if (!hito.fecha_fin)
    return {
      text: hito.estado === "en_progreso" ? "En progreso" : "Pendiente",
      chip: "bg-muted text-muted-foreground",
    };
  const days = Math.ceil(
    (new Date(hito.fecha_fin).getTime() - Date.now()) / 86400000
  );
  if (days < 0)
    return {
      text: `Vencido hace ${Math.abs(days)}d`,
      chip: "bg-[#FEE2E2] text-[#991B1B]",
    };
  if (days === 0)
    return { text: "Vence hoy", chip: "bg-[#FEF3C7] text-[#92400E]" };
  if (days <= 7)
    return { text: `${days}d restantes`, chip: "bg-[#FEF3C7] text-[#92400E]" };
  return { text: `${days}d restantes`, chip: "bg-[#DBEAFE] text-[#1D4ED8]" };
}

function computeDuration(start: string, end: string): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "—";
  const days = Math.round(ms / 86400000);
  if (days < 7) return `${days} días`;
  const weeks = Math.floor(days / 7);
  const rem = days % 7;
  return rem > 0 ? `${weeks}sem ${rem}d` : `${weeks} semanas`;
}

// ─────────────────────────────────────────────
// Hito summary card
// ─────────────────────────────────────────────

function HitoCard({
  hito,
  isSelected,
  onClick,
}: {
  hito: HitoWithActivities;
  isSelected: boolean;
  onClick: () => void;
}) {
  const progress = computeProgress(hito);
  const daysInfo = getDaysInfo(hito);
  const hasIndicadores = hito.indicadores_list.length > 0;
  const checklistDone = [
    hito.doc_tecnica,
    hito.doc_financiera,
    hito.doc_reporte,
  ].filter(Boolean).length;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all",
        isSelected
          ? "border-primary/40 bg-[#EFF6FF] shadow-sm"
          : "border-border bg-card hover:border-primary/20 hover:shadow-sm"
      )}
    >
      {/* Label row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Hito {hito.orden}
        </span>
        {isSelected ? (
          <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </div>

      {/* Nombre */}
      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-1">
        {hito.nombre ?? `Hito ${hito.orden}`}
      </p>

      {/* Objetivo corto */}
      {hito.descripcion && (
        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mb-2.5">
          {hito.descripcion}
        </p>
      )}

      {/* Progress bar */}
      <div className="space-y-1 mt-auto">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Avance
          </span>
          <span className="text-[11px] font-bold text-foreground">
            {progress}%
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progress === 100 ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bottom row: status + mini indicators info */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
            daysInfo.chip
          )}
        >
          {daysInfo.text}
        </span>
        {hasIndicadores && (
          <span className="text-[10px] text-muted-foreground">
            {hito.indicadores_list.length} ind · docs {checklistDone}/3
          </span>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// Indicator row (editable)
// ─────────────────────────────────────────────

type IndicadorForm = {
  key: string;
  nombre: string;
  unidad: string;
  meta: string;
  actual: string;
};

function IndicadorRow({
  ind,
  onChange,
  onDelete,
}: {
  ind: IndicadorForm;
  onChange: (key: keyof IndicadorForm, val: string) => void;
  onDelete: () => void;
}) {
  const meta = parseFloat(ind.meta) || 0;
  const actual = parseFloat(ind.actual) || 0;
  const pct = meta > 0 ? Math.min(100, Math.round((actual / meta) * 100)) : 0;

  return (
    <div className="border border-border rounded-lg p-3 space-y-2 bg-background">
      {/* Fields row */}
      <div className="grid grid-cols-[1fr_60px_80px_80px_28px] gap-2 items-center">
        <Input
          value={ind.nombre}
          onChange={(e) => onChange("nombre", e.target.value)}
          placeholder="Nombre del indicador"
          className="text-sm h-8"
        />
        <Input
          value={ind.unidad}
          onChange={(e) => onChange("unidad", e.target.value)}
          placeholder="S/ / %"
          className="text-sm h-8 text-center"
        />
        <Input
          type="number"
          value={ind.meta}
          onChange={(e) => onChange("meta", e.target.value)}
          placeholder="Meta"
          className="text-sm h-8 text-right"
        />
        <Input
          type="number"
          value={ind.actual}
          onChange={(e) => onChange("actual", e.target.value)}
          placeholder="Real"
          className="text-sm h-8 text-right font-semibold"
        />
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center h-8 w-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-0.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground">
            {ind.actual || "0"} / {ind.meta || "0"} {ind.unidad}
          </span>
          <span
            className={cn(
              "text-[10px] font-bold",
              pct >= 100
                ? "text-green-600"
                : pct >= 60
                ? "text-blue-600"
                : pct >= 30
                ? "text-orange-600"
                : "text-red-600"
            )}
          >
            {pct}%
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-primary" : pct >= 30 ? "bg-orange-500" : "bg-red-400"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Hito detail (editable)
// ─────────────────────────────────────────────

function HitoDetail({
  hito,
  startupId,
}: {
  hito: HitoWithActivities;
  startupId: string;
}) {
  const [form, setForm] = useState({
    nombre: hito.nombre ?? "",
    descripcion: hito.descripcion ?? "",
    fecha_inicio: hito.fecha_inicio ?? "",
    fecha_fin: hito.fecha_fin ?? "",
    doc_tecnica: hito.doc_tecnica ?? false,
    doc_financiera: hito.doc_financiera ?? false,
    doc_reporte: hito.doc_reporte ?? false,
    indicadores_list: hito.indicadores_list.map((ind) => ({
      key: ind.id,
      nombre: ind.nombre ?? "",
      unidad: ind.unidad ?? "",
      meta: String(ind.meta ?? ""),
      actual: String(ind.actual ?? ""),
    })) as IndicadorForm[],
    activities: hito.activities.map((a) => ({
      id: a.id,
      descripcion: a.descripcion ?? "",
      estado: a.estado ?? "pendiente",
      notas: a.notas ?? "",
    })),
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duration = computeDuration(form.fecha_inicio, form.fecha_fin);

  // Progress preview
  const indAvg =
    form.indicadores_list.length > 0
      ? form.indicadores_list.reduce((sum, ind) => {
          const meta = parseFloat(ind.meta) || 0;
          const actual = parseFloat(ind.actual) || 0;
          if (!meta) return sum;
          return sum + Math.min(100, (actual / meta) * 100);
        }, 0) / form.indicadores_list.length
      : null;

  const checklistDone = [
    form.doc_tecnica,
    form.doc_financiera,
    form.doc_reporte,
  ].filter(Boolean).length;

  const previewProgress =
    indAvg !== null
      ? Math.round(indAvg * 0.8 + (checklistDone / 3) * 100 * 0.2)
      : null;

  function addIndicador() {
    setForm((prev) => ({
      ...prev,
      indicadores_list: [
        ...prev.indicadores_list,
        { key: String(Date.now()), nombre: "", unidad: "", meta: "", actual: "" },
      ],
    }));
  }

  function updateIndicador(key: string, field: keyof IndicadorForm, val: string) {
    setForm((prev) => ({
      ...prev,
      indicadores_list: prev.indicadores_list.map((ind) =>
        ind.key === key ? { ...ind, [field]: val } : ind
      ),
    }));
  }

  function removeIndicador(key: string) {
    setForm((prev) => ({
      ...prev,
      indicadores_list: prev.indicadores_list.filter((ind) => ind.key !== key),
    }));
  }

  function setActivity(index: number, key: "estado" | "notas", value: string) {
    setForm((prev) => {
      const activities = [...prev.activities];
      activities[index] = { ...activities[index], [key]: value };
      return { ...prev, activities };
    });
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      await updateHito({
        hitoId: hito.id,
        startupId,
        nombre: form.nombre,
        descripcion: form.descripcion,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        doc_tecnica: form.doc_tecnica,
        doc_financiera: form.doc_financiera,
        doc_reporte: form.doc_reporte,
        indicadores_list: form.indicadores_list.map((ind) => ({
          nombre: ind.nombre,
          unidad: ind.unidad,
          meta: parseFloat(ind.meta) || 0,
          actual: parseFloat(ind.actual) || 0,
        })),
        activities: form.activities.map((a) => ({
          id: a.id,
          estado: a.estado,
          notas: a.notas,
        })),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-6">
      {/* Header */}
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pb-2.5 border-b border-border">
        Detalle — Hito {hito.orden}
      </p>

      {/* ── Campos básicos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Nombre del hito
          </label>
          <Input
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Nombre del hito"
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Objetivo corto
          </label>
          <Input
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Descripción breve del objetivo"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Fecha inicio
          </label>
          <Input
            type="date"
            value={form.fecha_inicio}
            onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Fecha fin
          </label>
          <Input
            type="date"
            value={form.fecha_fin}
            onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Duración
          </label>
          <div className="flex h-9 items-center px-3 rounded-md border border-input bg-muted/40 text-sm text-muted-foreground">
            {duration}
          </div>
        </div>
      </div>

      {/* ── Indicadores (80%) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Indicadores de éxito
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Valen el 80% del avance del hito
            </p>
          </div>
          <button
            type="button"
            onClick={addIndicador}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </button>
        </div>

        {/* Column headers */}
        {form.indicadores_list.length > 0 && (
          <div className="grid grid-cols-[1fr_60px_80px_80px_28px] gap-2 px-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Indicador
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
              Unidad
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">
              Meta
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">
              Real
            </span>
            <span />
          </div>
        )}

        {form.indicadores_list.length === 0 ? (
          <div
            onClick={addIndicador}
            className="border border-dashed border-border rounded-lg px-4 py-4 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-colors"
          >
            <p className="text-sm text-muted-foreground">Sin indicadores.</p>
            <p className="text-xs text-primary font-medium mt-1">
              + Agregar primer indicador
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {form.indicadores_list.map((ind) => (
              <IndicadorRow
                key={ind.key}
                ind={ind}
                onChange={(field, val) => updateIndicador(ind.key, field, val)}
                onDelete={() => removeIndicador(ind.key)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Checklist documental (20%) ── */}
      <div className="space-y-2.5">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Documentación CDCH
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Valen el 20% del avance · cada ítem vale ~6.7%
          </p>
        </div>
        <div className="space-y-2">
          {[
            { key: "doc_tecnica" as const, label: "Informes técnicos" },
            { key: "doc_financiera" as const, label: "Reporte financiero" },
            { key: "doc_reporte" as const, label: "Reporte de avance general" },
          ].map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/20 transition-colors"
            >
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 accent-primary"
              />
              <div className="flex-1">
                <span className="text-sm text-foreground">{label}</span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  form[key]
                    ? "bg-[#D1FAE5] text-[#065F46]"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {form[key] ? "✓ Listo" : "Pendiente"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Avance calculado ── */}
      {previewProgress !== null && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Avance calculado
            </p>
            <span className="text-sm font-bold text-foreground">
              {previewProgress}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                previewProgress === 100 ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${previewProgress}%` }}
            />
          </div>
          <div className="flex gap-4 text-[10px] text-muted-foreground">
            <span>
              📊 Indicadores 80%:{" "}
              <strong>{Math.round((indAvg ?? 0) * 0.8)}%</strong>
            </span>
            <span>
              📄 Docs 20%:{" "}
              <strong>{Math.round((checklistDone / 3) * 20)}%</strong>
            </span>
          </div>
        </div>
      )}

      {/* ── Actividades ── */}
      {form.activities.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Actividades
          </p>
          <div className="hidden sm:grid sm:grid-cols-[1fr_148px_1fr] gap-2 px-1 pb-0.5">
            {["Actividad", "Estado", "Logro real"].map((h) => (
              <span
                key={h}
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
              >
                {h}
              </span>
            ))}
          </div>
          {form.activities.map((a, i) => (
            <div
              key={a.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_148px_1fr] gap-2 items-center p-3 rounded-md bg-background border border-border"
            >
              <p className="text-sm text-foreground leading-snug">
                {a.descripcion || "—"}
              </p>
              <select
                value={a.estado}
                onChange={(e) => setActivity(i, "estado", e.target.value)}
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  a.estado === "completado"
                    ? "text-green-700"
                    : a.estado === "en_progreso"
                    ? "text-blue-700"
                    : "text-muted-foreground"
                )}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En progreso</option>
                <option value="completado">Completado</option>
              </select>
              <Input
                value={a.notas}
                onChange={(e) => setActivity(i, "notas", e.target.value)}
                placeholder="Logro real…"
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Guardar ── */}
      <div className="flex items-center gap-3 pt-1 border-t border-border">
        <Button size="sm" onClick={handleSave} disabled={loading}>
          <Save className="h-3.5 w-3.5" />
          {loading ? "Guardando…" : "Guardar cambios"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">✓ Guardado</span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export function HitosModule({
  hitosWithActivities,
  startupId,
}: {
  hitosWithActivities: HitoWithActivities[];
  startupId: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedHito =
    hitosWithActivities.find((h) => h.id === selectedId) ?? null;

  function handleCardClick(hitoId: string) {
    setSelectedId((prev) => (prev === hitoId ? null : hitoId));
  }

  if (hitosWithActivities.length === 0) {
    return (
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          🎯 Hitos
        </p>
        <div className="bg-card border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground">
          Sin hitos configurados.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        🎯 Hitos · {hitosWithActivities.length}
      </p>

      <div
        className={cn(
          "grid gap-3",
          hitosWithActivities.length <= 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-3"
        )}
      >
        {hitosWithActivities.map((h) => (
          <HitoCard
            key={h.id}
            hito={h}
            isSelected={selectedId === h.id}
            onClick={() => handleCardClick(h.id)}
          />
        ))}
      </div>

      {selectedHito && (
        <HitoDetail
          key={selectedHito.id}
          hito={selectedHito}
          startupId={startupId}
        />
      )}
    </div>
  );
}
