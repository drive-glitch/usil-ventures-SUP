"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateStartupEstado(id: string, estado: string) {
  const supabase = await createClient();
  await supabase.from("startups").update({ estado }).eq("id", id);
  revalidatePath(`/startups/${id}`);
  revalidatePath("/dashboard");
}
