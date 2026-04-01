"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateStartup } from "@/app/actions/update-startup";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ContactData = {
  responsable: string | null;
  correo: string | null;
  celular: string | null;
} | null;

type StartupData = {
  id: string;
  nombre: string;
  generacion: string | null;
  tipo: string | null;
  estado: string | null;
  riesgo: string | null;
  drive_url: string | null;
  cdch_url: string | null;
  objetivo_general: string | null;
};

// ─────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {children}
    </select>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
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
// Edit modal
// ─────────────────────────────────────────────

function EditStartupModal({
  startup,
  responsable,
  ejecutivo,
  onClose,
}: {
  startup: StartupData;
  responsable: ContactData;
  ejecutivo: ContactData;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    nombre: startup.nombre ?? "",
    generacion: startup.generacion ?? "",
    tipo: startup.tipo ?? "",
    estado: startup.estado ?? "activa",
    riesgo: startup.riesgo ?? "bajo",
    drive_url: startup.drive_url ?? "",
    cdch_url: startup.cdch_url ?? "",
    objetivo_general: startup.objetivo_general ?? "",
    responsable_nombre: responsable?.responsable ?? "",
    responsable_correo: responsable?.correo ?? "",
    responsable_celular: responsable?.celular ?? "",
    ejecutivo_nombre: ejecutivo?.responsable ?? "",
    ejecutivo_correo: ejecutivo?.correo ?? "",
    ejecutivo_celular: ejecutivo?.celular ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateStartup({ id: startup.id, ...form });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
        <div
          className="relative w-full max-w-2xl bg-card border border-border rounded-lg shadow-xl my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Editar startup
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
                      onChange={(e) => set("nombre", e.target.value)}
                      required
                    />
                  </Field>

                  <Field label="Generación">
                    <Input
                      value={form.generacion}
                      onChange={(e) => set("generacion", e.target.value)}
                      placeholder="Ej. 12G"
                    />
                  </Field>

                  <Field label="Tipo">
                    <Select value={form.tipo} onChange={(v) => set("tipo", v)}>
                      <option value="">Seleccionar…</option>
                      <option value="Innovadores">Innovadores</option>
                      <option value="Dinámicos">Dinámicos</option>
                    </Select>
                  </Field>

                  <Field label="Estado" required>
                    <Select value={form.estado} onChange={(v) => set("estado", v)}>
                      <option value="postulacion">Postulación</option>
                      <option value="activa">Activa</option>
                      <option value="seguimiento">Seguimiento</option>
                      <option value="en_riesgo">En riesgo</option>
                      <option value="cerrada">Cerrada</option>
                    </Select>
                  </Field>

                  <Field label="Riesgo" required>
                    <Select value={form.riesgo} onChange={(v) => set("riesgo", v)}>
                      <option value="bajo">Bajo</option>
                      <option value="medio">Medio</option>
                      <option value="alto">Alto</option>
                    </Select>
                  </Field>

                  <Field label="Drive URL" required className="sm:col-span-2">
                    <Input
                      value={form.drive_url}
                      onChange={(e) => set("drive_url", e.target.value)}
                      placeholder="https://drive.google.com/…"
                      required
                    />
                  </Field>

                  <Field label="CDCH URL" className="sm:col-span-2">
                    <Input
                      value={form.cdch_url}
                      onChange={(e) => set("cdch_url", e.target.value)}
                      placeholder="https://…"
                    />
                  </Field>

                  <Field label="Objetivo general" className="sm:col-span-2">
                    <Textarea
                      value={form.objetivo_general}
                      onChange={(v) => set("objetivo_general", v)}
                      placeholder="Descripción del modelo de negocio y propuesta de valor…"
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
                      onChange={(e) => set("responsable_nombre", e.target.value)}
                      placeholder="Nombre completo"
                      required
                    />
                  </Field>
                  <Field label="Correo" required>
                    <Input
                      type="email"
                      value={form.responsable_correo}
                      onChange={(e) => set("responsable_correo", e.target.value)}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </Field>
                  <Field label="Celular">
                    <Input
                      value={form.responsable_celular}
                      onChange={(e) => set("responsable_celular", e.target.value)}
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
                      onChange={(e) => set("ejecutivo_nombre", e.target.value)}
                      placeholder="Nombre completo"
                      required
                    />
                  </Field>
                  <Field label="Correo" required>
                    <Input
                      type="email"
                      value={form.ejecutivo_correo}
                      onChange={(e) => set("ejecutivo_correo", e.target.value)}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </Field>
                  <Field label="Celular">
                    <Input
                      value={form.ejecutivo_celular}
                      onChange={(e) => set("ejecutivo_celular", e.target.value)}
                      placeholder="9XXXXXXXX"
                    />
                  </Field>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
              {error ? (
                <p className="text-sm text-destructive flex-1">{error}</p>
              ) : (
                <div className="flex-1" />
              )}
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
                  {loading ? "Guardando…" : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Button (exported)
// ─────────────────────────────────────────────

export function EditStartupButton({
  startup,
  responsable,
  ejecutivo,
}: {
  startup: StartupData;
  responsable: ContactData;
  ejecutivo: ContactData;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>

      {open && (
        <EditStartupModal
          startup={startup}
          responsable={responsable}
          ejecutivo={ejecutivo}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
