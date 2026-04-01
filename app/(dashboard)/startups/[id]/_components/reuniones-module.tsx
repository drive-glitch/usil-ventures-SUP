"use client";

import { useState, useTransition, useRef } from "react";
import {
  Plus,
  X,
  CalendarDays,
  LinkIcon,
  Upload,
  ChevronDown,
  ChevronRight,
  Save,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { createReunion } from "@/app/actions/create-reunion";
import { updateReunion } from "@/app/actions/update-reunion";
import { deleteReunion } from "@/app/actions/delete-reunion";
import { createPendiente } from "@/app/actions/create-pendiente";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ReunionRow = {
  id: string;
  titulo: string | null;
  descripcion: string | null;
  acuerdos: string | null;
  proximos_pasos: string | null;
  fecha: string | null;
  link: string | null;
  screenshot_url: string | null;
  notas: string | null;
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

// ─────────────────────────────────────────────
// Shared form modal (create + edit)
// ─────────────────────────────────────────────

const EMPTY_FORM = {
  titulo: "",
  fecha: "",
  descripcion: "",
  acuerdos: "",
  proximos_pasos: "",
  link: "",
};

const EMPTY_TASK = { enabled: false, titulo: "", fecha_limite: "" };

function ReunionFormModal({
  open,
  onClose,
  startupId,
  editItem,
}: {
  open: boolean;
  onClose: () => void;
  startupId: string;
  editItem?: ReunionRow;
}) {
  const isEdit = !!editItem;
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(
    editItem
      ? {
          titulo: editItem.titulo ?? "",
          fecha: editItem.fecha ?? "",
          descripcion: editItem.descripcion ?? "",
          acuerdos: editItem.acuerdos ?? "",
          proximos_pasos: editItem.proximos_pasos ?? "",
          link: editItem.link ?? "",
        }
      : EMPTY_FORM
  );
  const [task, setTask] = useState(EMPTY_TASK);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    editItem?.screenshot_url ?? null
  );
  const [uploadProgress, setUploadProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set(key: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar 5MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave() {
    if (!form.titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setError(null);

    let screenshotUrl = editItem?.screenshot_url ?? "";

    if (imageFile) {
      setUploadProgress(true);
      try {
        const supabase = createClient();
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `${startupId}/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("reuniones-screenshots")
          .upload(path, imageFile, { upsert: false });

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabase.storage
          .from("reuniones-screenshots")
          .getPublicUrl(uploadData.path);

        screenshotUrl = urlData.publicUrl;
      } catch (err) {
        setError(
          "Error al subir imagen: " +
            (err instanceof Error ? err.message : "Inténtalo de nuevo.")
        );
        setUploadProgress(false);
        return;
      }
      setUploadProgress(false);
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateReunion({
            id: editItem!.id,
            startupId,
            titulo: form.titulo,
            fecha: form.fecha,
            descripcion: form.descripcion,
            acuerdos: form.acuerdos,
            proximos_pasos: form.proximos_pasos,
            link: form.link,
            screenshot_url: screenshotUrl,
          });
        } else {
          await createReunion({
            startupId,
            titulo: form.titulo,
            fecha: form.fecha,
            descripcion: form.descripcion,
            acuerdos: form.acuerdos,
            proximos_pasos: form.proximos_pasos,
            link: form.link,
            screenshot_url: screenshotUrl,
          });
          if (task.enabled && task.titulo.trim()) {
            await createPendiente({
              startupId,
              titulo: task.titulo,
              fecha_limite: task.fecha_limite,
            });
          }
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  const isLoading = isPending || uploadProgress;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[92dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <p className="font-semibold text-foreground">
            {isEdit ? "✏️ Editar reunión" : "📝 Nueva reunión"}
          </p>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Título *
            </label>
            <Input value={form.titulo} onChange={set("titulo")} placeholder="Ej. Seguimiento mensual Q1" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Fecha
            </label>
            <Input type="date" value={form.fecha} onChange={set("fecha")} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Resumen
            </label>
            <textarea
              value={form.descripcion}
              onChange={set("descripcion")}
              rows={3}
              placeholder="¿De qué se trató la reunión?"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Acuerdos
            </label>
            <textarea
              value={form.acuerdos}
              onChange={set("acuerdos")}
              rows={3}
              placeholder="Decisiones y compromisos tomados…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Próximos pasos
            </label>
            <textarea
              value={form.proximos_pasos}
              onChange={set("proximos_pasos")}
              rows={3}
              placeholder="¿Qué sigue? ¿Quién hace qué y cuándo?"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Link (opcional)
            </label>
            <Input value={form.link} onChange={set("link")} placeholder="https://meet.google.com/…" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Evidencia / Screenshot (opcional)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex items-center gap-3 border border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors",
                imageFile
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/20"
              )}
            >
              <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {imageFile ? imageFile.name : "Haz clic para subir imagen"}
                </p>
                <p className="text-[10px] text-muted-foreground/60">PNG, JPG • máx. 5MB</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-md border border-border max-h-44 object-contain w-full"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-black/70 rounded-full p-1 transition-colors"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Crear pendiente — solo en modo nuevo */}
          {!isEdit && (
            <div className="border border-border rounded-lg p-3 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.enabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setTask((p) => ({
                      ...p,
                      enabled,
                      titulo:
                        enabled && !p.titulo && form.proximos_pasos
                          ? form.proximos_pasos.split("\n")[0].substring(0, 120)
                          : p.titulo,
                    }));
                  }}
                  className="h-4 w-4 rounded border-gray-300 accent-primary"
                />
                <span className="text-sm font-medium text-foreground">
                  📋 Crear pendiente desde esta reunión
                </span>
              </label>
              {task.enabled && (
                <div className="space-y-2 pl-6">
                  <Input
                    value={task.titulo}
                    onChange={(e) => setTask((p) => ({ ...p, titulo: e.target.value }))}
                    placeholder="Título del pendiente…"
                    className="text-sm"
                  />
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Fecha límite
                    </label>
                    <Input
                      type="date"
                      value={task.fecha_limite}
                      onChange={(e) => setTask((p) => ({ ...p, fecha_limite: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded transition-colors"
          >
            Cancelar
          </button>
          <Button size="sm" onClick={handleSave} disabled={isLoading}>
            <Save className="h-3.5 w-3.5" />
            {uploadProgress ? "Subiendo imagen…" : isPending ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar reunión"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Reunion card (collapsible)
// ─────────────────────────────────────────────

function ReunionCard({ item, startupId }: { item: ReunionRow; startupId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isPendingDelete, startDeleteTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`¿Eliminar la reunión "${item.titulo ?? "sin título"}"?`)) return;
    startDeleteTransition(() => deleteReunion(item.id, startupId));
  }

  const hasBody =
    item.descripcion ||
    item.acuerdos ||
    item.proximos_pasos ||
    item.link ||
    item.screenshot_url ||
    item.notas;

  return (
    <>
      {editOpen && (
        <ReunionFormModal
          open
          onClose={() => setEditOpen(false)}
          startupId={startupId}
          editItem={item}
        />
      )}
      <div
        className={cn(
          "bg-card border border-border rounded-lg overflow-hidden",
          isPendingDelete && "opacity-50 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-left min-w-0 flex-1 flex items-center justify-between gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {item.titulo ?? "Sin título"}
              </p>
              {item.fecha && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CalendarDays className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground">{fmtDate(item.fecha)}</span>
                </div>
              )}
            </div>
            {hasBody ? (
              expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )
            ) : null}
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isPendingDelete}
              className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {expanded && hasBody && (
          <div className="px-4 pb-4 space-y-3.5 border-t border-border pt-3">
            {item.descripcion && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Resumen</p>
                <p className="text-xs text-foreground leading-relaxed">{item.descripcion}</p>
              </div>
            )}
            {item.acuerdos && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Acuerdos</p>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{item.acuerdos}</p>
              </div>
            )}
            {item.proximos_pasos && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Próximos pasos</p>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{item.proximos_pasos}</p>
              </div>
            )}
            {item.notas && (
              <div className="bg-muted/40 rounded-md px-3 py-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Notas adicionales</p>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{item.notas}</p>
              </div>
            )}
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-primary font-medium hover:underline"
              >
                <LinkIcon className="h-3 w-3" />
                Ver enlace de reunión
              </a>
            )}
            {item.screenshot_url && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Evidencia</p>
                <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={item.screenshot_url}
                    alt="Evidencia de reunión"
                    className="rounded-md border border-border max-h-56 object-contain w-full hover:opacity-90 transition-opacity cursor-zoom-in"
                  />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export function ReunionesModule({
  items,
  startupId,
}: {
  items: ReunionRow[];
  startupId: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <ReunionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        startupId={startupId}
      />
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            📝 Reuniones{items.length > 0 ? ` · ${items.length}` : ""}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva reunión
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-lg px-4 py-5 text-center">
            <p className="text-sm text-muted-foreground">Sin reuniones registradas.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-2 text-xs text-primary font-semibold hover:underline"
            >
              + Agregar primera reunión
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((r) => (
              <ReunionCard key={r.id} item={r} startupId={startupId} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
