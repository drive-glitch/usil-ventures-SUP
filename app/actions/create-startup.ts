"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type HitoInput = {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  indicadores: string;
};

export type CreateStartupInput = {
  nombre: string;
  generacion: string;
  tipo: string;
  estado: string;
  riesgo: string;
  drive_url: string;
  cdch_url: string;
  cantidad_hitos: number;
  objetivo_general: string;
  responsable_nombre: string;
  responsable_correo: string;
  responsable_celular: string;
  ejecutivo_nombre: string;
  ejecutivo_correo: string;
  ejecutivo_celular: string;
  hitos: HitoInput[];
};

export async function createStartup(input: CreateStartupInput) {
  const supabase = await createClient();

  const { data: startup, error: startupError } = await supabase
    .from("startups")
    .insert({
      nombre: input.nombre,
      generacion: input.generacion || null,
      tipo: input.tipo || null,
      estado: input.estado || null,
      riesgo: input.riesgo || null,
      cantidad_hitos: input.cantidad_hitos,
      drive_url: input.drive_url,
      cdch_url: input.cdch_url || null,
      objetivo_general: input.objetivo_general || null,
    })
    .select()
    .single();

  if (startupError) throw new Error(startupError.message);

  const { error: contactsError } = await supabase
    .from("startup_contacts")
    .insert([
      {
        startup_id: startup.id,
        rol: "responsable",
        responsable: input.responsable_nombre,
        correo: input.responsable_correo,
        celular: input.responsable_celular || null,
      },
      {
        startup_id: startup.id,
        rol: "ejecutivo_proinnóvate",
        responsable: input.ejecutivo_nombre,
        correo: input.ejecutivo_correo,
        celular: input.ejecutivo_celular || null,
      },
    ]);

  if (contactsError) throw new Error(contactsError.message);

  const hitosPayload = input.hitos.slice(0, input.cantidad_hitos).map((h, i) => ({
    startup_id: startup.id,
    nombre: h.nombre || null,
    orden: i + 1,
    estado: "pendiente",
    fecha_inicio: h.fecha_inicio || null,
    fecha_fin: h.fecha_fin || null,
    indicadores: h.indicadores || null,
  }));

  const { error: hitosError } = await supabase
    .from("startup_hitos")
    .insert(hitosPayload);

  if (hitosError) throw new Error(hitosError.message);

  revalidatePath("/dashboard");
}
