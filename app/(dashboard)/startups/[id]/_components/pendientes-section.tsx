"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { togglePendiente } from "@/app/actions/toggle-pendiente";

type Pendiente = {
  id: string;
  titulo: string | null;
  estado: string | null;
  fecha_limite: string | null;
};

function fmtDate(date: string | null | undefined) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(fechaFin: string | null, estado: string | null) {
  if (!fechaFin || estado === "completado") return false;
  return new Date(fechaFin) < new Date();
}

function PendienteItem({
  item,
  startupId,
}: {
  item: Pendiente;
  startupId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const done = item.estado === "completado";
  const overdue = isOverdue(item.fecha_limite, item.estado);

  function handleToggle() {
    startTransition(() => togglePendiente(item.id, startupId, !done));
  }

  return (
    <div
      className={cn(
        "bg-card border rounded-lg px-4 py-3 flex items-start gap-3 transition-colors",
        overdue ? "border-red-200 bg-red-50/30" : "border-border",
        isPending && "opacity-60"
      )}
    >
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="mt-0.5 shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: done ? "#10B981" : overdue ? "#EF4444" : "#D1D5DB",
          backgroundColor: done ? "#10B981" : "transparent",
        }}
      >
        {done && (
          <svg
            className="h-2.5 w-2.5 text-white"
            fill="none"
            viewBox="0 0 12 12"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            done
              ? "line-through text-muted-foreground"
              : "font-medium text-foreground"
          )}
        >
          {item.titulo ?? "Sin título"}
        </p>
        {item.fecha_limite && (
          <p
            className={cn(
              "text-xs mt-0.5",
              overdue
                ? "text-red-600 font-medium"
                : done
                ? "text-muted-foreground"
                : "text-muted-foreground"
            )}
          >
            Límite: {fmtDate(item.fecha_limite)}
            {overdue && " · vencido"}
          </p>
        )}
      </div>
    </div>
  );
}

export function PendientesSection({
  items,
  startupId,
}: {
  items: Pendiente[];
  startupId: string;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground">
        Sin pendientes registrados.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <PendienteItem key={item.id} item={item} startupId={startupId} />
      ))}
    </div>
  );
}
