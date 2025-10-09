import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get tenant_id from profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error("Tenant not found for user");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: 'no_subscription',
        trial_ends_at: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    let subscriptionData = {
      subscribed: false,
      status: 'no_subscription' as string,
      trial_ends_at: null as string | null,
      subscription_end: null as string | null,
    };

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const isActive = ['active', 'trialing'].includes(subscription.status);
      
      subscriptionData = {
        subscribed: isActive,
        status: subscription.status,
        trial_ends_at: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000).toISOString() 
          : null,
        subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
      };

      logStep("Subscription found", subscriptionData);

      // Update local database
      const { error: upsertError } = await supabaseClient
        .from('subscriptions')
        .upsert({
          tenant_id: profile.tenant_id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0].price.id,
          status: subscription.status,
          trial_ends_at: subscription.trial_end 
            ? new Date(subscription.trial_end * 1000).toISOString() 
            : null,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, {
          onConflict: 'tenant_id'
        });

      if (upsertError) {
        logStep("Error updating subscription in database", { error: upsertError.message });
      } else {
        logStep("Subscription updated in database");
      }
    } else {
      logStep("No subscriptions found");
    }

    return new Response(JSON.stringify(subscriptionData), {
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
