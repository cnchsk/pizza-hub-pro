import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, items, total, customerData } = await req.json();

    console.log('Creating Mercado Pago payment for order:', orderId);

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    // Preparar itens para o Mercado Pago
    const mpItems = items.map((item: any) => ({
      title: item.name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      currency_id: 'BRL',
    }));

    // Criar preferência de pagamento
    const preferenceData = {
      items: mpItems,
      payer: {
        name: customerData.full_name,
        email: customerData.email || 'noemail@provided.com',
        phone: {
          number: customerData.phone,
        },
        address: {
          street_name: customerData.address || 'N/A',
        },
      },
      back_urls: {
        success: `${req.headers.get('origin')}/order-success?orderId=${orderId}`,
        failure: `${req.headers.get('origin')}/order-failed?orderId=${orderId}`,
        pending: `${req.headers.get('origin')}/order-pending?orderId=${orderId}`,
      },
      auto_return: 'approved',
      external_reference: orderId,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    };

    console.log('Creating preference with data:', JSON.stringify(preferenceData, null, 2));

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mercado Pago API error:', errorText);
      throw new Error(`Mercado Pago API error: ${response.status} - ${errorText}`);
    }

    const preference = await response.json();
    console.log('Preference created:', preference.id);

    return new Response(
      JSON.stringify({
        checkoutUrl: preference.init_point,
        preferenceId: preference.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-mercadopago-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});