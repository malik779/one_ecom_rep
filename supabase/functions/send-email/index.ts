import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';

const renderTemplate = (template: string, data: Record<string, unknown>) => {
  return Object.entries(data).reduce((content, [key, value]) => {
    return content.replaceAll(`{{${key}}}`, String(value));
  }, template);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { template, to, data } = await req.json();
    if (!template) {
      return new Response(JSON.stringify({ error: 'Missing template.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: settings } = await supabaseAdmin
      .from('app_settings')
      .select('sender_email,admin_email')
      .limit(1)
      .maybeSingle();

    const { data: templateRow, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('subject,html')
      .eq('name', template)
      .maybeSingle();

    if (templateError || !templateRow) {
      return new Response(JSON.stringify({ error: 'Template not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const smtpHost = Deno.env.get('SMTP_HOST') ?? '';
    const smtpUser = Deno.env.get('SMTP_USER') ?? '';
    const smtpPass = Deno.env.get('SMTP_PASS') ?? '';
    const smtpPort = Number(Deno.env.get('SMTP_PORT') ?? 465);
    const sender = settings?.sender_email ?? Deno.env.get('SMTP_FROM') ?? smtpUser;
    const recipient = to ?? settings?.admin_email;

    if (!smtpHost || !smtpUser || !smtpPass || !recipient) {
      return new Response(JSON.stringify({ error: 'SMTP configuration missing.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const subject = renderTemplate(templateRow.subject, data ?? {});
    const html = renderTemplate(templateRow.html, data ?? {});

    const client = new SmtpClient();
    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUser,
      password: smtpPass
    });

    await client.send({
      from: sender,
      to: recipient,
      subject,
      content: html,
      html
    });

    await client.close();

    return new Response(JSON.stringify({ status: 'sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message ?? 'Unexpected error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
