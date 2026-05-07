import { corsHeaders } from '@supabase/supabase-js/cors'
import Stripe from 'npm:stripe@17.7.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-04-30.basil' })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { price_id, user_id } = await req.json()

    if (!price_id || typeof price_id !== 'string') {
      return new Response(JSON.stringify({ error: 'price_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const origin = req.headers.get('origin') || 'https://claimmyface.com'

    const session = await stripe.checkout.sessions.create({
      mode: price_id.includes('MONTHLY') || price_id.includes('month') ? 'subscription' : 'payment',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${origin}/dashboard?upgraded=true`,
      cancel_url: `${origin}/`,
      metadata: user_id ? { user_id } : undefined,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
