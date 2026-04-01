"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createStartup, type HitoInput } from "@/app/actions/create-startup";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function computeDuration(start: string, end: string): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "—";
  const days = Math.round(ms / 86400000);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  const rem = days % 7;
  return rem > 0 ? `${weeks}sem ${rem}d` : `${weeks} semana${weeks !== 1 ? "s" : ""}`;
}

// ─────────────────────────────────────────────
// Shared styled primitives
// ─────────────────────────────────────────────

function Select({
  id,
  value,
  onChange,
  children,
  required,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {children}
    </select>
  );
}

function Textarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1 border-b border-border">
      {children}
    </p>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────

const EMPTY_HITO: HitoInput = {
  nombre: "",
  fecha_inicio: "",
  fecha_fin: "",
  indicadores: "",
};

const INITIAL_FORM = {
  nombre: "",
  generacion: "",
  tipo: "",
  estado: "postulacion",
  riesgo: "bajo",
  responsable_nombre: "",
  responsable_correo: "",
  responsable_celular: "",
  ejecutivo_nombre: "",
  ejecutivo_correo: "",
  ejecutivo_celular: "",
  drive_url: "",
  cdch_url: "",
  cantidad_hitos: 3 as 2 | 3,
  objetivo_general: "",
  hitos: [
    { ...EMPTY_HITO },
    { ...EMPTY_HITO },
    { ...EMPTY_HITO },
  ],
};

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────

export function CreateStartupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function setField<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setHitoField(
    index: number,
    key: keyof HitoInput,
    value: string
  ) {
    setForm((prev) => {
      const hitos = [...prev.hitos];
      hitos[index] = { ...hitos[index], [key]: value };
      return { ...prev, hitos };
    });
  }

  function handleCantidadHitos(value: 2 | 3) {
    setForm((prev) => {
      const hitos = [...prev.hitos];
      while (hitos.length < 3) hitos.push({ ...EMPTY_HITO });
      return { ...prev, cantidad_hitos: value, hitos };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createStartup({
        ...form,
        hitos: form.hitos.slice(0, form.cantidad_hitos),
      });
      setForm(INITIAL_FORM);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
        <div
          className="relative w-full max-w-2xl bg-card border border-border rounded-lg shadow-xl my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Crear nueva startup
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-6">

              {/* ── Información general ── */}
              <div className="space-y-4">
                <SectionTitle>Información general</SectionTitle>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre startup" required className="sm:col-span-2">
                    <Input
                      value={form.nombre}
                      onChange={(e) => setField("nombre", e.target.value)}
                      placeholder="Ej. Jardín.pe"
                      required
                    />
                  </Field>

                  <Field label="Generación">
                    <Input
                      value={form.generacion}
                      onChange={(e) => setField("generacion", e.target.value)}
                      placeholder="Ej. 12G"
                    />
                  </Field>

                  <Field label="Tipo">
                    <Select
                      value={form.tipo}
                      onChange={(v) => setField("tipo", v)}
                    >
                      <option value="">Seleccionar…</option>
                      <option value="Innovadores">Innovadores</option>
                      <option value="Dinámicos">Dinámicos</option>
                    </Select>
                  </Field>

                  <Field label="Estado inicial" required>
                    <Select
                      value={form.estado}
                      onChange={(v) => setField("estado", v)}
                      required
                    >
                      <option value="postulacion">Postulación</option>
                      <option value="activa">Activa</option>
                      <option value="seguimiento">Seguimiento</option>
                      <option value="en_riesgo">En riesgo</option>
                      <option value="cerrada">Cerrada</option>
                    </Select>
                  </Field>

                  <Field label="Riesgo" required>
                    <Select
                      value={form.riesgo}
                      onChange={(v) => setField("riesgo", v)}
                      required
                    >
                      <option value="bajo">Bajo</option>
                      <option value="medio">Medio</option>
                      <option value="alto">Alto</option>
                    </Select>
                  </Field>

                  <Field label="Drive URL" required className="sm:col-span-2">
                    <Input
                      value={form.drive_url}
                      onChange={(e) => setField("drive_url", e.target.value)}
                      placeholder="https://drive.google.com/…"
                      required
                    />
                  </Field>

                  <Field label="CDCH URL" className="sm:col-span-2">
                    <Input
                      value={form.cdch_url}
                      onChange={(e) => setField("cdch_url", e.target.value)}
                      placeholder="https://…"
                    />
                  </Field>

                  <Field label="Objetivo general" className="sm:col-span-2">
                    <Textarea
                      value={form.objetivo_general}
                      onChange={(v) => setField("objetivo_general", v)}
                      placeholder="Descripción breve del modelo de negocio y propuesta de valor…"
                      rows={3}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Responsable startup ── */}
              <div className="space-y-4">
                <SectionTitle>Responsable startup</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre" required>
                    <Input
                      value={form.responsable_nombre}
                      onChange={(e) => setField("responsable_nombre", e.target.value)}
                      placeholder="Nombre completo"
                      required
                    />
                  </Field>

                  <Field label="Correo" required>
                    <Input
                      type="email"
                      value={form.responsable_correo}
                      onChange={(e) => setField("responsable_correo", e.target.value)}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </Field>

                  <Field label="Celular">
                    <Input
                      value={form.responsable_celular}
                      onChange={(e) => setField("responsable_celular", e.target.value)}
                      placeholder="9XXXXXXXX"
                    />
                  </Field>
                </div>
              </div>

              {/* ── Ejecutivo ProInnóvate ── */}
              <div className="space-y-4">
                <SectionTitle>Ejecutivo ProInnóvate</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre" required>
                    <Input
                      value={form.ejecutivo_nombre}
                      onChange={(e) => setField("ejecutivo_nombre", e.target.value)}
                      placeholder="Nombre completo"
                      required
                    />
                  </Field>

                  <Field label="Correo" required>
                    <Input
                      type="email"
                      value={form.ejecutivo_correo}
                      onChange={(e) => setField("ejecutivo_correo", e.target.value)}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </Field>

                  <Field label="Celular">
                    <Input
                      value={form.ejecutivo_celular}
                      onChange={(e) => setField("ejecutivo_celular", e.target.value)}
                      placeholder="9XXXXXXXX"
                    />
                  </Field>
                </div>
              </div>

              {/* ── Configuración de hitos ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SectionTitle>Configuración de hitos</SectionTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Cantidad:</span>
                    {([2, 3] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleCantidadHitos(n)}
                        className={cn(
                          "h-7 w-7 rounded text-sm font-medium border transition-colors",
                          form.cantidad_hitos === n
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-accent"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  {Array.from({ length: form.cantidad_hitos }).map((_, i) => {
                    const h = form.hitos[i];
                    const dur = computeDuration(h.fecha_inicio, h.fecha_fin);
                    return (
                      <div
                        key={i}
                        className="border border-border rounded-lg p-4 space-y-3"
                      >
                        <p className="text-sm font-medium text-foreground">
                          Hito {i + 1}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label="Nombre / objetivo" className="sm:col-span-2">
                            <Input
                              value={h.nombre}
                              onChange={(e) =>
                                setHitoField(i, "nombre", e.target.value)
                              }
                              placeholder={`Objetivo del hito ${i + 1}`}
                            />
                          </Field>

                          <Field label="Fecha inicio">
                            <Input
                              type="date"
                              value={h.fecha_inicio}
                              onChange={(e) =>
                                setHitoField(i, "fecha_inicio", e.target.value)
                              }
                            />
                          </Field>

                          <Field label="Fecha fin">
                            <Input
                              type="date"
                              value={h.fecha_fin}
                              onChange={(e) =>
                                setHitoField(i, "fecha_fin", e.target.value)
                              }
                            />
                          </Field>

                          <Field label="Duración">
                            <div className="flex h-9 items-center px-3 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground">
                              {dur}
                            </div>
                          </Field>

                          <Field label="Indicadores" className="sm:col-span-2">
                            <Textarea
                              value={h.indicadores}
                              onChange={(v) => setHitoField(i, "indicadores", v)}
                              placeholder="Ej. Ventas ≥ S/10,000 / mes, NPS ≥ 40…"
                              rows={2}
                            />
                          </Field>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
              {error && (
                <p className="text-sm text-destructive flex-1">{error}</p>
              )}
              {!error && <div className="flex-1" />}
              <div className="flex gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando…" : "Crear startup"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
