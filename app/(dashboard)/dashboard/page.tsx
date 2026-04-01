import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./_components/dashboard-client";
import type { StartupRow, PendienteDashboard } from "./_components/dashboard-client";
import { computeProgress } from "@/lib/compute-progress";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: startups },
    { data: hitosRaw },
    { data: reuniones },
    { data: pendientesRaw },
  ] = await Promise.all([
    supabase.from("startups").select("*").order("created_at"),
    supabase
      .from("startup_hitos")
      .select("*, hito_activities(*), hito_indicadores(*)")
      .order("orden", { ascending: true }),
    supabase.from("reuniones").select("*").order("fecha", { ascending: false }),
    supabase
      .from("pendientes")
      .select("id, startup_id, estado, fecha_limite, titulo")
      .neq("estado", "completado")
      .order("fecha_limite", { ascending: true }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startupMap = new Map((startups ?? []).map((s) => [s.id, s.nombre as string]));

  const rows: StartupRow[] = (startups ?? []).map((s) => {
    const sHitos = (hitosRaw ?? [])
      .filter((h) => h.startup_id === s.id)
      .map((h) => ({
        ...h,
        activities: h.hito_activities ?? [],
        indicadores_list: h.hito_indicadores ?? [],
      }));

    const hitoActual =
      sHitos.find((h) => h.estado !== "completado") ?? sHitos[0] ?? null;

    const sReuniones = (reuniones ?? []).filter((r) => r.startup_id === s.id);
    const ultimaReunion = sReuniones[0] ?? null;

    const sPendientes = (pendientesRaw ?? []).filter((p) => p.startup_id === s.id);
    const pendientesVencidos = sPendientes.filter(
      (p) => p.fecha_limite && new Date(p.fecha_limite) < today
    ).length;

    const avance =
      sHitos.length > 0
        ? Math.round(
            sHitos.reduce((sum, h) => sum + computeProgress(h), 0) / sHitos.length
          )
        : null;

    return {
      ...s,
      hito_actual: hitoActual,
      ultima_reunion: ultimaReunion,
      avance,
      pendientesVencidos,
    };
  });

  const pendientesList: PendienteDashboard[] = (pendientesRaw ?? []).map((p) => ({
    id: p.id,
    titulo: p.titulo,
    estado: p.estado,
    fecha_limite: p.fecha_limite,
    startup_id: p.startup_id,
    startup_nombre: startupMap.get(p.startup_id) ?? "—",
  }));

  return <DashboardClient rows={rows} pendientes={pendientesList} />;
}
