import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "https://rezervace.lavrsmarket.cz",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const contentType = req.headers.get("content-type") || "";
        let eventId: string | null = null;
        let fileName = "upload.jpg";
        let fileType = "image/jpeg";
        let fileBytes: Uint8Array | null = null;

        if (contentType.includes("application/json")) {
            const body = await req.json();
            eventId = body.eventId || null;
            fileName = body.fileName || fileName;
            fileType = body.fileType || fileType;
            const base64 = body.fileBase64;
            if (base64) {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                fileBytes = bytes;
            }
        } else {
            const form = await req.formData();
            const file = form.get("file");
            eventId = form.get("eventId")?.toString() || null;
            if (file instanceof File) {
                fileName = file.name || fileName;
                fileType = file.type || fileType;
                fileBytes = new Uint8Array(await file.arrayBuffer());
            }
        }

        if (!eventId || !fileBytes) {
            return new Response(JSON.stringify({ error: "Missing file or eventId" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Ensure bucket exists and is public
        const { data: buckets } = await supabase.storage.listBuckets();
        const hasBucket = buckets?.some((b) => b.name === "event-images");
        if (!hasBucket) {
            await supabase.storage.createBucket("event-images", { public: true });
        } else {
            await supabase.storage.updateBucket("event-images", { public: true });
        }

        const filePath = `event-images/${eventId}/${Date.now()}-${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("event-images")
            .upload(filePath, fileBytes, {
                contentType: fileType || "image/jpeg",
                cacheControl: "3600",
                upsert: true,
            });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(filePath);
        const publicUrl = urlData.publicUrl;

        const { error: updateError } = await supabase
            .from("events")
            .update({ image: publicUrl })
            .eq("id", eventId);
        if (updateError) throw updateError;

        return new Response(JSON.stringify({ url: publicUrl, path: filePath }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
