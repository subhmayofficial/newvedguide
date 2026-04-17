import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getDeliveryIntegrationsConfig } from "@/lib/services/integration-config";
import {
  normalizeRemoteInteraktTemplates,
  upsertSavedInteraktTemplate,
} from "@/lib/services/interakt-template-catalog";

function buildError(status: number, message: string) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST() {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return buildError(401, "Unauthorized");
    }

    const config = getDeliveryIntegrationsConfig().interakt;
    if (!config.apiKey) {
      return buildError(400, "Interakt API key is not configured");
    }

    if (!config.templateListApiUrl) {
      return buildError(
        400,
        "Template fetch endpoint is not configured. Set INTERAKT_TEMPLATE_LIST_API_URL first."
      );
    }

    const response = await fetch(config.templateListApiUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${config.apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await response.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      return buildError(
        response.status,
        text || `Template fetch failed with status ${response.status}`
      );
    }

    const templates = normalizeRemoteInteraktTemplates(parsed);
    if (!templates.length) {
      return buildError(
        422,
        "Response received, but no templates could be normalized from it."
      );
    }

    const supabase = createServiceClient();
    for (const template of templates) {
      await upsertSavedInteraktTemplate(supabase, template);
    }

    return NextResponse.json({
      ok: true,
      importedCount: templates.length,
      message: `Imported ${templates.length} templates`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return buildError(500, message);
  }
}
