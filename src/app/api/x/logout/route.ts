import { clearXUser } from "@/lib/session";

export async function POST() {
  await clearXUser();
  return Response.json({ ok: true });
}
