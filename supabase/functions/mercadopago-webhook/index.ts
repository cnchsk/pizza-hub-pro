import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Mercado Pago envia notificações com o tipo "payment"
    if (body.type === 'payment') {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        console.error('Payment ID not found in webhook');
        return new Response(JSON.stringify({ error: 'Payment ID not found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar detalhes do pagamento na API do Mercado Pago
      const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
      if (!accessToken) {
        throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
      }

      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!paymentResponse.ok) {
        throw new Error(`Failed to fetch payment details: ${paymentResponse.status}`);
      }

      const payment = await paymentResponse.json();
      console.log('Payment details:', JSON.stringify(payment, null, 2));

      const orderId = payment.external_reference;
      const status = payment.status;

      // Inicializar cliente Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Mapear status do Mercado Pago para status do pedido
      let orderStatus = 'new';
      let paymentStatus = status;

      switch (status) {
        case 'approved':
          orderStatus = 'new'; // Pedido aprovado, entra como novo
          break;
        case 'pending':
        case 'in_process':
          orderStatus = 'pending'; // Aguardando pagamento
          break;
        case 'rejected':
        case 'cancelled':
          orderStatus = 'cancelled';
          break;
      }

      // Atualizar pedido no banco
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_id: paymentId.toString(),
          payment_status: paymentStatus,
          status: orderStatus,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw updateError;
      }

      console.log(`Order ${orderId} updated - Status: ${orderStatus}, Payment: ${paymentStatus}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in mercadopago-webhook:', error);
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