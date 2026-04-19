import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { processPaidKundliReportUpload } from "@/lib/admin/paid-kundli-report-upload";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false as const, error }, { status });
}

/**
 * Multipart upload for paid-kundli reports. Uses the Route Handler instead of a Server
 * Action so large PDFs are not cut off by the Server Actions body parser ("Unexpected end of form").
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return jsonError(401, "Unauthorized");
    }

    const { orderId } = await context.params;
    if (!orderId?.trim()) {
      return jsonError(400, "Missing order id");
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return jsonError(400, msg.slice(0, 400) || "Invalid multipart body");
    }

    const rawFile = formData.get("file");
    if (!rawFile || typeof rawFile === "string") {
      return jsonError(400, "Choose a file to upload");
    }
    const file = rawFile as File;

    const supabase = createServiceClient();
    const result = await processPaidKundliReportUpload(supabase, orderId, file);

    if (!result.ok) {
      const status =
        result.error === "Order not found"
          ? 404
          : result.error === "Invalid order"
            ? 400
            : 422;
      return jsonError(status, result.error);
    }

    return NextResponse.json({ ok: true as const, url: result.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonError(500, message.slice(0, 500));
  }
}
