import { createClient } from "npm:@supabase/supabase-js@2";

// Strip any non-printable / non-ASCII chars that break HTTP headers
const NOTION_API_KEY = (Deno.env.get("NOTION_API_KEY") || "")
  .replace(/[^\x20-\x7E]/g, "")
  .trim();
const NOTION_DATABASE_ID = "a90664fc-4999-415c-aad6-0f6760110646";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://rezervace.lavrsmarket.cz",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_CATEGORIES = ["Designers", "Beauty ZONE", "GASTRO", "Secondhands"];
const VALID_STATUSES = [
  "PENDING",
  "APPROVED",
  "APPROVED_FREE",
  "PAID",
  "REJECTED",
  "WAITLIST",
  "EXPIRED",
];

async function notionRequest(
  endpoint: string,
  method: string,
  body?: unknown,
) {
  const res = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion API error (${res.status}): ${err}`);
  }
  return res.json();
}

async function findNotionPageByApplicationId(
  applicationId: string,
): Promise<string | null> {
  const data = await notionRequest(
    `/databases/${NOTION_DATABASE_ID}/query`,
    "POST",
    {
      filter: {
        property: "ID přihlášky",
        rich_text: { equals: applicationId },
      },
      page_size: 1,
    },
  );
  return data.results?.[0]?.id || null;
}

function buildNotionProperties(
  app: Record<string, unknown>,
  event: Record<string, unknown> | null,
) {
  const props: Record<string, unknown> = {
    "Značka": {
      title: [{ text: { content: (app.brand_name as string) || "" } }],
    },
    "ID přihlášky": {
      rich_text: [{ text: { content: (app.id as string) || "" } }],
    },
    Email: { email: (app.email as string) || null },
    Telefon: { phone_number: (app.phone as string) || null },
    Web: { url: (app.website as string) || null },
    Instagram: {
      rich_text: [{ text: { content: (app.instagram as string) || "" } }],
    },
    "Popis značky": {
      rich_text: [
        { text: { content: (app.brand_description as string) || "" } },
      ],
    },
    "Kontaktní osoba": {
      rich_text: [
        { text: { content: (app.contact_person as string) || "" } },
      ],
    },
    "Fakturační jméno": {
      rich_text: [
        { text: { content: (app.billing_name as string) || "" } },
      ],
    },
    "Fakturační email": {
      email: (app.billing_email as string) || null,
    },
    "Fakturační adresa": {
      rich_text: [
        { text: { content: (app.billing_address as string) || "" } },
      ],
    },
    "IČ": {
      rich_text: [{ text: { content: (app.ic as string) || "" } }],
    },
    "DIČ": {
      rich_text: [{ text: { content: (app.dic as string) || "" } }],
    },
    "Poznámka kurátora": {
      rich_text: [
        { text: { content: (app.curator_note as string) || "" } },
      ],
    },
  };

  // Select properties — only set if value is valid
  const status = ((app.status as string) || "").toUpperCase();
  if (VALID_STATUSES.includes(status)) {
    props["Stav"] = { select: { name: status } };
  }

  const category = (app.zone_category as string) || "";
  if (VALID_CATEGORIES.includes(category)) {
    props["Kategorie"] = { select: { name: category } };
  }

  // Date: Datum přihlášení
  if (app.submitted_at) {
    const dateStr = new Date(app.submitted_at as string)
      .toISOString()
      .split("T")[0];
    props["Datum přihlášení"] = { date: { start: dateStr } };
  }

  // Event data
  if (event) {
    props["Akce"] = {
      rich_text: [{ text: { content: (event.title as string) || "" } }],
    };
    props["Místo konání"] = {
      rich_text: [{ text: { content: (event.location as string) || "" } }],
    };
    if (event.date) {
      const eventDateStr = new Date(event.date as string)
        .toISOString()
        .split("T")[0];
      props["Datum akce"] = { date: { start: eventDateStr } };
    }
  }

  return props;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!NOTION_API_KEY) {
      console.error("NOTION_API_KEY is not set!");
      return new Response(
        JSON.stringify({ error: "NOTION_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = await req.json();
    const type = (payload.type || "").toUpperCase();
    const table = payload.table;
    const record = payload.record;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`--- Notion Sync: ${type} ---`);

    // ── FULL_SYNC: reconcile Supabase ↔ Notion ──
    if (type === "FULL_SYNC") {
      // 1. Get all applications from Supabase
      const { data: apps, error: appsErr } = await supabase
        .from("applications")
        .select("*");
      if (appsErr) throw new Error(`Supabase error: ${appsErr.message}`);
      const appIds = new Set((apps || []).map((a: Record<string, unknown>) => a.id as string));

      // 2. Get all pages from Notion database
      let notionPages: { id: string; appId: string }[] = [];
      let hasMore = true;
      let startCursor: string | undefined;
      while (hasMore) {
        const query: Record<string, unknown> = { page_size: 100 };
        if (startCursor) query.start_cursor = startCursor;
        const res = await notionRequest(
          `/databases/${NOTION_DATABASE_ID}/query`,
          "POST",
          query,
        );
        for (const page of res.results || []) {
          const appIdProp = page.properties?.["ID přihlášky"]?.rich_text?.[0]?.plain_text || "";
          notionPages.push({ id: page.id, appId: appIdProp });
        }
        hasMore = res.has_more;
        startCursor = res.next_cursor;
      }

      // 3. Archive orphaned Notion pages (not in Supabase)
      let archived = 0;
      for (const page of notionPages) {
        if (!page.appId || !appIds.has(page.appId)) {
          await notionRequest(`/pages/${page.id}`, "PATCH", { archived: true });
          console.log(`Archived orphaned page: ${page.appId || page.id}`);
          archived++;
        }
      }

      // 4. Create/update Notion pages for all Supabase applications
      const existingAppIds = new Set(notionPages.map((p) => p.appId));
      let created = 0;
      let updated = 0;
      for (const app of apps || []) {
        let event = null;
        if (app.event_id) {
          const { data } = await supabase
            .from("events")
            .select("*")
            .eq("id", app.event_id)
            .single();
          event = data;
        }
        const properties = buildNotionProperties(app, event);

        if (existingAppIds.has(app.id)) {
          const pageId = notionPages.find((p) => p.appId === app.id)?.id;
          if (pageId) {
            await notionRequest(`/pages/${pageId}`, "PATCH", { properties });
            updated++;
          }
        } else {
          await notionRequest("/pages", "POST", {
            parent: { database_id: NOTION_DATABASE_ID },
            properties,
          });
          created++;
        }
      }

      console.log(`FULL_SYNC done: ${created} created, ${updated} updated, ${archived} archived`);
      return new Response(
        JSON.stringify({ message: "Full sync complete", created, updated, archived }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Webhook events (INSERT / UPDATE / DELETE) ──
    if (table !== "applications") {
      return new Response(
        JSON.stringify({ message: "Ignored (not applications table)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (type === "DELETE") {
      const old = payload.old_record;
      if (old?.id) {
        const pageId = await findNotionPageByApplicationId(old.id);
        if (pageId) {
          await notionRequest(`/pages/${pageId}`, "PATCH", { archived: true });
          console.log(`Archived Notion page for deleted app: ${old.id}`);
        }
      }
      return new Response(
        JSON.stringify({ message: "Deleted from Notion" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!record) {
      return new Response(
        JSON.stringify({ message: "No record in payload" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch event details
    let event = null;
    if (record.event_id) {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("id", record.event_id)
        .single();
      event = data;
    }

    const properties = buildNotionProperties(record, event);

    if (type === "INSERT") {
      await notionRequest("/pages", "POST", {
        parent: { database_id: NOTION_DATABASE_ID },
        properties,
      });
      console.log(`Created Notion page for: ${record.brand_name}`);
    } else if (type === "UPDATE") {
      const pageId = await findNotionPageByApplicationId(record.id);
      if (pageId) {
        await notionRequest(`/pages/${pageId}`, "PATCH", { properties });
        console.log(`Updated Notion page for: ${record.brand_name}`);
      } else {
        await notionRequest("/pages", "POST", {
          parent: { database_id: NOTION_DATABASE_ID },
          properties,
        });
        console.log(`Page not found, created new for: ${record.brand_name}`);
      }
    }

    return new Response(JSON.stringify({ message: "Synced to Notion" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Notion sync error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
