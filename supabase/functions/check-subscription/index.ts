import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key for database writes
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Use anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STIRPE_KEY");
    if (!stripeKey) throw new Error("STIRPE_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's tenant
    const { data: profile } = await supabaseService
      .from('user_profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.tenant_id) {
      logStep("No tenant found for user");
      return new Response(JSON.stringify({ subscribed: false, message: "No tenant found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, updating unsubscribed state");
      
      // Update subscription status
      await supabaseService.from("subscriptions").upsert({
        tenant_id: profile.tenant_id,
        plan_type: 'trial',
        status: 'cancelled',
        billing_cycle: 'monthly',
        price: 0,
        currency: 'CHF',
        starts_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days trial
        max_users: 1,
        max_invoices_per_month: 10,
        features: ['basic_invoicing']
      }, { onConflict: 'tenant_id' });

      return new Response(JSON.stringify({ subscribed: false, plan_type: 'trial' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = 'trial';
    let subscriptionEnd = null;
    let price = 0;
    let features = ['basic_invoicing'];

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const stripePrice = await stripe.prices.retrieve(priceId);
      price = (stripePrice.unit_amount || 0) / 100; // Convert from cents to CHF
      
      if (price <= 29) {
        subscriptionTier = "basic";
        features = ['basic_invoicing', 'expense_tracking'];
      } else if (price <= 49) {
        subscriptionTier = "professional";
        features = ['basic_invoicing', 'expense_tracking', 'advanced_reports', 'api_access'];
      } else {
        subscriptionTier = "enterprise";
        features = ['basic_invoicing', 'expense_tracking', 'advanced_reports', 'api_access', 'priority_support', 'custom_integrations'];
      }
      logStep("Determined subscription tier", { priceId, price, subscriptionTier });
    } else {
      logStep("No active subscription found");
      subscriptionEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days trial
    }

    // Update subscription in database
    await supabaseService.from("subscriptions").upsert({
      tenant_id: profile.tenant_id,
      plan_type: subscriptionTier,
      status: hasActiveSub ? 'active' : 'trial',
      billing_cycle: 'monthly',
      price: price,
      currency: 'CHF',
      starts_at: hasActiveSub ? new Date(subscriptions.data[0].current_period_start * 1000).toISOString() : new Date().toISOString(),
      expires_at: subscriptionEnd,
      max_users: subscriptionTier === 'basic' ? 5 : subscriptionTier === 'professional' ? 15 : 50,
      max_invoices_per_month: subscriptionTier === 'basic' ? 50 : subscriptionTier === 'professional' ? 200 : 1000,
      features: features
    }, { onConflict: 'tenant_id' });

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_type: subscriptionTier,
      expires_at: subscriptionEnd,
      price: price,
      features: features
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});