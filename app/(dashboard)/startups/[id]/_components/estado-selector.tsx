"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { updateStartupEstado } from "@/app/actions/update-startup-estado";

const ESTADOS = [
  { value: "postulacion",  label: "Postulación",  cls: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "activa",       label: "Activa",        cls: "bg-green-100 text-green-700 border-green-200" },
  { value: "seguimiento",  label: "Seguimiento",   cls: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "en_riesgo",    label: "En riesgo",     cls: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "cerrada",      label: "Cerrada",       cls: "bg-gray-100 text-gray-500 border-gray-200" },
];

export function EstadoSelector({
  startupId,
  initial,
}: {
  startupId: string;
  initial: string | null;
}) {
  const [value, setValue] = useState(initial ?? "activa");
  const [isPending, startTransition] = useTransition();

  const current = ESTADOS.find((e) => e.value === value) ?? ESTADOS[0];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setValue(next);
    startTransition(async () => {
      await updateStartupEstado(startupId, next);
    });
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={isPending}
      className={cn(
        "h-8 rounded-full border px-3 text-xs font-medium cursor-pointer transition-opacity appearance-none pr-6 bg-no-repeat",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        isPending && "opacity-60 cursor-wait",
        current.cls
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundPosition: "right 8px center",
      }}
    >
      {ESTADOS.map((e) => (
        <option key={e.value} value={e.value}>
          {e.label}
        </option>
      ))}
    </select>
  );
}
