"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActivityUpdate = {
  id: string;
  estado: string;
  notas: string;
};

export type IndicadorUpdate = {
  nombre: string;
  unidad: string;
  meta: number;
  actual: number;
};

export async function updateHito(input: {
  hitoId: string;
  startupId: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  doc_tecnica: boolean;
  doc_financiera: boolean;
  doc_reporte: boolean;
  indicadores_list: IndicadorUpdate[];
  activities: ActivityUpdate[];
}) {
  const supabase = await createClient();

  // Compute estado from activities
  let estado = "pendiente";
  if (input.activities.length > 0) {
    const completadas = input.activities.filter(
      (a) => a.estado === "completado"
    ).length;
    if (completadas === input.activities.length) estado = "completado";
    else if (completadas > 0) estado = "en_progreso";
  }

  // Update hito
  const { error: hitoError } = await supabase
    .from("startup_hitos")
    .update({
      nombre: input.nombre || null,
      descripcion: input.descripcion || null,
      fecha_inicio: input.fecha_inicio || null,
      fecha_fin: input.fecha_fin || null,
      doc_tecnica: input.doc_tecnica,
      doc_financiera: input.doc_financiera,
      doc_reporte: input.doc_reporte,
      estado,
    })
    .eq("id", input.hitoId);

  if (hitoError) throw new Error(hitoError.message);

  // Indicators: delete all → reinsert
  await supabase.from("hito_indicadores").delete().eq("hito_id", input.hitoId);

  if (input.indicadores_list.length > 0) {
    const { error: indError } = await supabase.from("hito_indicadores").insert(
      input.indicadores_list.map((ind, i) => ({
        hito_id: input.hitoId,
        nombre: ind.nombre || null,
        unidad: ind.unidad || null,
        meta: ind.meta ?? 0,
        actual: ind.actual ?? 0,
        orden: i + 1,
      }))
    );
    if (indError) throw new Error(indError.message);
  }

  // Update activities
  for (const activity of input.activities) {
    const { error } = await supabase
      .from("hito_activities")
      .update({ estado: activity.estado, notas: activity.notas || null })
      .eq("id", activity.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/startups/${input.startupId}`);
}
