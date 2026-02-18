import { corsHeaders } from '../_shared/cors.ts';
import { createUserClient, supabaseAdmin } from '../_shared/supabase-client.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  console.log(
    '[EDGE]',
    'Auth header:',
    authHeader
  );
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
 
  try {
    const supabaseUser = createUserClient(authHeader);
    const {
      data: { user }
    } = await supabaseUser.auth.getUser();
    console.log(
      '[EDGE  ]',
        'User:',
        user
    );
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: adminRow } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload = await req.json();
    const updatePayload: Record<string, unknown> = {
      payment_gateway: payload.payment_gateway,
      payment_public_key: payload.payment_public_key,
      currency: payload.currency,
      success_url: payload.success_url,
      cancel_url: payload.cancel_url,
      sender_email: payload.sender_email,
      admin_email: payload.admin_email,
      smtp_host: payload.smtp_host,
      smtp_user: payload.smtp_user,
      smtp_port: payload.smtp_port,
      website_name: payload.website_name,
      logo_url: payload.logo_url,
      favicon_url: payload.favicon_url
    };

    if (payload.payment_secret_key) {
      updatePayload.payment_secret_key = payload.payment_secret_key;
    }

    if (payload.smtp_pass) {
      updatePayload.smtp_pass = payload.smtp_pass;
    }

    const { data: existingSettings } = await supabaseAdmin
      .from('app_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    let result;
    if (existingSettings?.id) {
      result = await supabaseAdmin
        .from('app_settings')
        .update(updatePayload)
        .eq('id', existingSettings.id)
        .select()
        .maybeSingle();
    } else {
      result = await supabaseAdmin.from('app_settings').insert(updatePayload).select().maybeSingle();
    }

    if (result.error) {
      throw result.error;
    }

    return new Response(JSON.stringify(result.data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message ?? 'Unexpected error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
