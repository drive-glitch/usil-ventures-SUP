// Shared progress computation — used by both server (dashboard) and client (hitos-module)

export type HitoForProgress = {
  estado: string | null;
  doc_tecnica?: boolean | null;
  doc_financiera?: boolean | null;
  doc_reporte?: boolean | null;
  indicadores_list: { meta: number | null; actual: number | null }[];
  activities: { estado: string | null }[];
};

export function computeProgress(hito: HitoForProgress): number {
  const inds = hito.indicadores_list ?? [];

  if (inds.length > 0) {
    const indAvg =
      inds.reduce((sum, ind) => {
        if (!ind.meta || ind.meta === 0) return sum;
        return sum + Math.min(100, ((ind.actual ?? 0) / ind.meta) * 100);
      }, 0) / inds.length;

    const checklistDone = [
      hito.doc_tecnica,
      hito.doc_financiera,
      hito.doc_reporte,
    ].filter(Boolean).length;

    return Math.round(indAvg * 0.8 + (checklistDone / 3) * 100 * 0.2);
  }

  if (hito.activities.length === 0) {
    if (hito.estado === "completado") return 100;
    if (hito.estado === "en_progreso") return 50;
    return 0;
  }

  const done = hito.activities.filter((a) => a.estado === "completado").length;
  return Math.round((done / hito.activities.length) * 100);
}
