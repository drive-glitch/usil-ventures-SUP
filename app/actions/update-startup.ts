"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UpdateStartupInput = {
  id: string;
  nombre: string;
  generacion: string;
  tipo: string;
  estado: string;
  riesgo: string;
  drive_url: string;
  cdch_url: string;
  objetivo_general: string;
  responsable_nombre: string;
  responsable_correo: string;
  responsable_celular: string;
  ejecutivo_nombre: string;
  ejecutivo_correo: string;
  ejecutivo_celular: string;
};

export async function updateStartup(input: UpdateStartupInput) {
  const supabase = await createClient();

  const { error: startupError } = await supabase
    .from("startups")
    .update({
      nombre: input.nombre,
      generacion: input.generacion || null,
      tipo: input.tipo || null,
      estado: input.estado || null,
      riesgo: input.riesgo || null,
      drive_url: input.drive_url,
      cdch_url: input.cdch_url || null,
      objetivo_general: input.objetivo_general || null,
    })
    .eq("id", input.id);

  if (startupError) throw new Error(startupError.message);

  // Replace contacts: delete existing, re-insert
  await supabase.from("startup_contacts").delete().eq("startup_id", input.id);

  const { error: contactsError } = await supabase
    .from("startup_contacts")
    .insert([
      {
        startup_id: input.id,
        rol: "responsable",
        responsable: input.responsable_nombre,
        correo: input.responsable_correo,
        celular: input.responsable_celular || null,
      },
      {
        startup_id: input.id,
        rol: "ejecutivo_proinnóvate",
        responsable: input.ejecutivo_nombre,
        correo: input.ejecutivo_correo,
        celular: input.ejecutivo_celular || null,
      },
    ]);

  if (contactsError) throw new Error(contactsError.message);

  revalidatePath(`/startups/${input.id}`);
  revalidatePath("/dashboard");
}
