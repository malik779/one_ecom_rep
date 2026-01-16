import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, successUrl, cancelUrl } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing orderId.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(
        'id,full_name,email,total_amount,currency,order_items(quantity,unit_price,products(name,description))'
      )
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select(
        'payment_secret_key,payment_public_key,currency,success_url,cancel_url,payment_gateway'
      )
      .limit(1)
      .maybeSingle();

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ error: 'Payment settings missing.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripeSecret = settings.payment_secret_key ?? Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: 'Stripe secret key missing.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient()
    });

    const lineItems = (order.order_items ?? []).map((item: any) => ({
      quantity: item.quantity,
      price_data: {
        currency: order.currency.toLowerCase(),
        unit_amount: Math.round(Number(item.unit_price) * 100),
        product_data: {
          name: item.products?.name ?? 'Product',
          description: item.products?.description ?? undefined
        }
      }
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: order.email,
      line_items: lineItems,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id
      },
      success_url: `${successUrl ?? settings.success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? settings.cancel_url
    });

    await supabaseAdmin.from('payments').insert({
      order_id: order.id,
      provider: settings.payment_gateway,
      status: 'created',
      session_id: session.id,
      amount: order.total_amount,
      currency: order.currency
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        checkoutUrl: session.url
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
