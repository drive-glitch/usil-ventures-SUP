import { NextResponse } from "next/server";

// Pings both Supabase projects to prevent free-tier auto-pause (1 week inactivity).
// Called by Vercel Cron every 3 days — see vercel.json.
export async function GET() {
  const projects = [
    {
      name: "startup-journey",
      url: "https://vtftpanqceyliagdhdua.supabase.co",
      key: process.env.SUPABASE_KEEPALIVE_KEY_MAIN!,
    },
    {
      name: "usil-ventures",
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  ];

  const results: Record<string, number> = {};

  await Promise.all(
    projects.map(async ({ name, url, key }) => {
      try {
        const res = await fetch(`${url}/rest/v1/`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          // Don't cache — we need a real network hit
          cache: "no-store",
        });
        results[name] = res.status;
      } catch {
        results[name] = 0;
      }
    })
  );

  return NextResponse.json({ ok: true, pinged: results, ts: new Date().toISOString() });
}
