"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteReunion(id: string, startupId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("reuniones").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/startups/${startupId}`);
}
