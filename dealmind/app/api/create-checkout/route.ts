import { NextResponse } from 'next/server';
import { stripe, PRICE_ID } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${appUrl}/dashboard?payment=success`,
    cancel_url:  `${appUrl}/checkout?cancelled=true`,
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } }
  });

  return NextResponse.json({ url: session.url });
}
