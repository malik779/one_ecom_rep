import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

const updateFromSession = async (session: Stripe.Checkout.Session) => {
  const orderId = session.client_reference_id ?? session.metadata?.order_id;
  if (!orderId) {
    return;
  }

  const transactionId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const paid = session.payment_status === 'paid';
  const paymentStatus = paid ? 'paid' : 'processing';
  const orderStatus = paid ? 'paid' : 'pending';

  await supabaseAdmin
    .from('payments')
    .update({
      status: paymentStatus,
      transaction_id: transactionId
    })
    .eq('session_id', session.id);

  await supabaseAdmin
    .from('orders')
    .update({
      status: orderStatus,
      transaction_id: transactionId
    })
    .eq('id', orderId);

  if (paid) {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id,email,total_amount,currency')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) {
      return;
    }

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
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!stripeSecret) {
      throw new Error('Missing Stripe secret key.');
    }
    if (!webhookSecret) {
      throw new Error('Missing Stripe webhook secret.');
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient()
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    if (!signature) {
      return new Response('Missing signature', { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await updateFromSession(session);
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    return new Response(`Webhook error: ${error.message}`, { status: 400 });
  }
});
