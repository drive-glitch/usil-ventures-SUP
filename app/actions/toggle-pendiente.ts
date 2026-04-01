"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function togglePendiente(
  id: string,
  startupId: string,
  done: boolean
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pendientes")
    .update({ estado: done ? "completado" : "pendiente" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/startups/${startupId}`);
}
