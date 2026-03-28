import { NextResponse } from "next/server";
import {
  deleteAllUserAlerts,
  deleteUserAlert,
  listUserAlertsForApi,
  markAllUserAlertsRead,
  markUserAlertRead,
} from "@/app/actions/alerts";

export async function GET() {
  const items = await listUserAlertsForApi(40);
  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; read?: boolean; readAll?: boolean };
    if (body.readAll === true) {
      await markAllUserAlertsRead();
      return NextResponse.json({ ok: true });
    }
    if (!body.id || body.read !== true) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    await markUserAlertRead(body.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; deleteAll?: boolean };
    if (body.deleteAll === true) {
      await deleteAllUserAlerts();
      return NextResponse.json({ ok: true });
    }
    if (!body.id) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    await deleteUserAlert(body.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
