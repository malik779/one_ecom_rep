import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';

const getStripeClient = async () => {
  const { data: settings } = await supabaseAdmin
    .from('app_settings')
    .select('payment_secret_key')
    .limit(1)
    .maybeSingle();

  const stripeSecret = settings?.payment_secret_key ?? Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecret) {
    throw new Error('Stripe secret key missing.');
  }
  return new Stripe(stripeSecret, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient()
  });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing sessionId.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripe = await getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    const orderId = session.client_reference_id ?? session.metadata?.order_id;
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order not found for session.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const transactionId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const paid = session.payment_status === 'paid';
    const paymentStatus = paid ? 'paid' : 'processing';
    const orderStatus = paid ? 'paid' : 'pending';

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id,email,total_amount,currency')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order record missing.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    await supabaseAdmin
      .from('payments')
      .update({
        status: paymentStatus,
        transaction_id: transactionId
      })
      .eq('session_id', sessionId);

    await supabaseAdmin
      .from('orders')
      .update({
        status: orderStatus,
        transaction_id: transactionId
      })
      .eq('id', orderId);

    if (paid) {
      const { data: settings } = await supabaseAdmin
        .from('app_settings')
        .select('admin_email')
        .limit(1)
        .maybeSingle();
      const adminEmail = settings?.admin_email ?? Deno.env.get('ADMIN_NOTIFICATION_EMAIL');

      await supabaseAdmin.functions.invoke('send-email', {
        body: {
          template: 'customer_receipt',
          to: order.email,
          data: {
            orderId: order.id,
            amount: order.total_amount,
            currency: order.currency
          }
        }
      });

      await supabaseAdmin.functions.invoke('send-email', {
        body: {
          template: 'admin_notification',
          to: adminEmail,
          data: {
            orderId: order.id,
            amount: order.total_amount,
            currency: order.currency
          }
        }
      });
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        status: paymentStatus,
        transactionId,
        amount: order.total_amount,
        currency: order.currency,
        customerEmail: order.email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message ?? 'Unexpected error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
