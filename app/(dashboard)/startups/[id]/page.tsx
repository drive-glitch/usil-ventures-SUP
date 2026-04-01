import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { EstadoSelector } from "./_components/estado-selector";
import { EditStartupButton } from "./_components/edit-startup-button";
import { HitosModule, type HitoWithActivities } from "./_components/hitos-module";
import { PendientesSection } from "./_components/pendientes-section";
import { computeProgress } from "@/lib/compute-progress";
import { ReunionesModule, type ReunionRow } from "./_components/reuniones-module";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Contact = {
  id: string;
  rol: string | null;
  responsable: string | null;
  correo: string | null;
  celular: string | null;
};

type Pendiente = {
  id: string;
  titulo: string | null;
  estado: string | null;
  fecha_limite: string | null;
};


// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function fmtDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(fechaFin: string | null | undefined, estado: string | null) {
  if (!fechaFin || estado === "completado") return false;
  return new Date(fechaFin) < new Date();
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─────────────────────────────────────────────
// UI primitives
// ─────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </p>
  );
}

function RiesgoBadge({ value }: { value: string | null }) {
  if (!value) return null;
  const cls: Record<string, string> = {
    bajo: "bg-[#D1FAE5] text-[#065F46]",
    medio: "bg-[#FEF3C7] text-[#92400E]",
    alto: "bg-[#FEE2E2] text-[#991B1B]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize",
        cls[value] ?? "bg-gray-100 text-gray-700"
      )}
    >
      ⚠️ Riesgo {value}
    </span>
  );
}

function TipoBadge({ value }: { value: string | null }) {
  if (!value) return null;
  const cls: Record<string, string> = {
    Innovadores: "bg-[#DBEAFE] text-[#1D4ED8]",
    Dinámicos: "bg-[#EDE9FE] text-[#6D28D9]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
        cls[value] ?? "bg-gray-100 text-gray-700"
      )}
    >
      {value}
    </span>
  );
}

// ─────────────────────────────────────────────
// Section components
// ─────────────────────────────────────────────

function LinkCard({
  label,
  emoji,
  url,
}: {
  label: string;
  emoji: string;
  url: string | null | undefined;
}) {
  if (!url) {
    return (
      <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3 opacity-50">
        <span className="text-xl">{emoji}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Sin link</p>
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3 hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <span className="text-xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xs font-medium text-primary mt-0.5 group-hover:underline truncate">
          Abrir enlace
        </p>
      </div>
      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
    </a>
  );
}

function ContactCard({
  title,
  contact,
}: {
  title: string;
  contact: Contact | null | undefined;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </p>
      {!contact ? (
        <p className="text-sm text-muted-foreground">Sin contacto registrado.</p>
      ) : (
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#1D4ED8]">
              {getInitials(contact.responsable)}
            </span>
          </div>
          <div className="space-y-1.5 min-w-0">
            {contact.responsable && (
              <p className="text-sm font-semibold text-foreground leading-tight">
                {contact.responsable}
              </p>
            )}
            {contact.correo && (
              <a
                href={`mailto:${contact.correo}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{contact.correo}</span>
              </a>
            )}
            {contact.celular && (
              <a
                href={`tel:${contact.celular}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-3 w-3 shrink-0" />
                {contact.celular}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertasSection({ alertas }: { alertas: string[] }) {
  if (alertas.length === 0) {
    return (
      <div>
        <SectionTitle>🚨 Alertas</SectionTitle>
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-sm text-green-700">Sin alertas activas.</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>🚨 Alertas</SectionTitle>
      <div className="space-y-2">
        {alertas.map((a, i) => (
          <div
            key={i}
            className="bg-[#FFF7ED] border border-[#FED7AA] rounded-lg px-4 py-3 flex items-start gap-2.5"
          >
            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <span className="text-sm text-orange-800">{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StartupDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: startup },
    { data: contacts },
    { data: hitosRaw },
    { data: pendientes },
    { data: reuniones },
  ] = await Promise.all([
    supabase.from("startups").select("*").eq("id", id).single(),
    supabase.from("startup_contacts").select("*").eq("startup_id", id),
    supabase
      .from("startup_hitos")
      .select("*, hito_activities(*), hito_indicadores(*)")
      .eq("startup_id", id)
      .order("orden"),
    supabase
      .from("pendientes")
      .select("*")
      .eq("startup_id", id)
      .order("created_at"),
    supabase
      .from("reuniones")
      .select("*")
      .eq("startup_id", id)
      .order("fecha", { ascending: false }),
  ]);

  const hitosWithActivities: HitoWithActivities[] = (hitosRaw ?? []).map(
    (h) => ({
      ...h,
      activities: h.hito_activities ?? [],
      indicadores_list: h.hito_indicadores ?? [],
    })
  );

  // Avance general = promedio ponderado de hitos
  const avanceGeneral =
    hitosWithActivities.length > 0
      ? Math.round(
          hitosWithActivities.reduce((sum, h) => sum + computeProgress(h), 0) /
            hitosWithActivities.length
        )
      : null;

  if (!startup) notFound();

  const responsable =
    (contacts ?? []).find((c) => c.rol === "responsable") ??
    (contacts ?? [])[0] ??
    null;
  const ejecutivo =
    (contacts ?? []).find((c) => c.rol === "ejecutivo_proinnóvate") ?? null;

  // Compute alerts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alertas: string[] = [];

  if (startup.riesgo === "alto") {
    alertas.push("Startup clasificada con riesgo alto.");
  }
  hitosWithActivities.forEach((h) => {
    if (h.fecha_fin && new Date(h.fecha_fin) < today && h.estado !== "completado") {
      alertas.push(
        `${h.nombre ?? `Hito ${h.orden}`} vencido desde ${fmtDate(h.fecha_fin)}.`
      );
    }
  });
  (pendientes ?? []).forEach((p) => {
    if (
      p.fecha_limite &&
      new Date(p.fecha_limite) < today &&
      p.estado !== "completado"
    ) {
      alertas.push(
        `Pendiente "${p.titulo ?? "sin título"}" vencido desde ${fmtDate(p.fecha_limite)}.`
      );
    }
  });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al dashboard
      </Link>

      {/* ── 1. Header ── */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2.5 min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-foreground leading-tight tracking-tight">
              {startup.nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5">
              {startup.generacion && (
                <span className="text-[11px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {startup.generacion}
                </span>
              )}
              <TipoBadge value={startup.tipo} />
              <RiesgoBadge value={startup.riesgo} />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <EstadoSelector startupId={id} initial={startup.estado} />
            <EditStartupButton
              startup={startup}
              responsable={responsable}
              ejecutivo={ejecutivo}
            />
          </div>
        </div>

        {startup.objetivo_general && (
          <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4 leading-relaxed">
            {startup.objetivo_general}
          </p>
        )}

        {avanceGeneral !== null && (
          <div className={cn("space-y-1.5", startup.objetivo_general ? "mt-3" : "mt-4 border-t border-border pt-4")}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Avance general del programa
              </p>
              <span className={cn(
                "text-sm font-bold",
                avanceGeneral >= 80 ? "text-green-600" :
                avanceGeneral >= 50 ? "text-blue-600" :
                avanceGeneral >= 30 ? "text-orange-600" : "text-red-600"
              )}>
                {avanceGeneral}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  avanceGeneral === 100 ? "bg-green-500" :
                  avanceGeneral >= 50 ? "bg-primary" : "bg-orange-500"
                )}
                style={{ width: `${avanceGeneral}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Links ── */}
      <div>
        <SectionTitle>🔗 Links</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <LinkCard
            label="Carpeta Drive"
            emoji="📁"
            url={startup.drive_url}
          />
          <LinkCard
            label="CDCH"
            emoji="📄"
            url={startup.cdch_url}
          />
        </div>
      </div>

      {/* ── 3 & 4. Contactos ── */}
      <div>
        <SectionTitle>👥 Contactos</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ContactCard title="Contacto startup" contact={responsable} />
          <ContactCard title="Ejecutivo ProInnóvate" contact={ejecutivo} />
        </div>
      </div>

      {/* ── 5. Pendientes ── */}
      <div>
        <SectionTitle>📋 Pendientes</SectionTitle>
        <PendientesSection items={(pendientes ?? []) as Pendiente[]} startupId={id} />
      </div>

      {/* ── 5b. Reuniones ── */}
      <ReunionesModule
        items={(reuniones ?? []) as ReunionRow[]}
        startupId={id}
      />

      {/* ── 6. Hitos ── */}
      <HitosModule hitosWithActivities={hitosWithActivities} startupId={id} />

      {/* ── 7. Alertas ── */}
      <AlertasSection alertas={alertas} />
    </div>
  );
}
