// Supabase Edge Function: expire stale sale confirmations
// Deploy with: supabase functions deploy expire-confirmations
// Schedule with: pg_cron or external cron to call every hour

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase.rpc("expire_stale_confirmations");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ expired_count: data, timestamp: new Date().toISOString() }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
