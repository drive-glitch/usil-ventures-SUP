"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateReunion(input: {
  id: string;
  startupId: string;
  titulo: string;
  fecha: string;
  descripcion: string;
  acuerdos: string;
  proximos_pasos: string;
  link: string;
  screenshot_url?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reuniones")
    .update({
      titulo: input.titulo || null,
      fecha: input.fecha || null,
      descripcion: input.descripcion || null,
      acuerdos: input.acuerdos || null,
      proximos_pasos: input.proximos_pasos || null,
      link: input.link || null,
      ...(input.screenshot_url !== undefined && { screenshot_url: input.screenshot_url || null }),
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/startups/${input.startupId}`);
}
