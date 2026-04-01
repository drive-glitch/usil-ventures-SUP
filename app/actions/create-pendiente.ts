"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPendiente(input: {
  startupId: string;
  titulo: string;
  fecha_limite: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("pendientes").insert({
    startup_id: input.startupId,
    titulo: input.titulo || null,
    fecha_limite: input.fecha_limite || null,
    estado: "pendiente",
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/startups/${input.startupId}`);
}
