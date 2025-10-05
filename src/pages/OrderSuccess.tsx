import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const testMode = searchParams.get("testMode") === "true";
  const [orderNumber, setOrderNumber] = useState<string>("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      const { data } = await supabase
        .from("orders")
        .select("id")
        .eq("id", orderId)
        .maybeSingle();
      
      if (data) {
        setOrderNumber(data.id.substring(0, 8).toUpperCase());
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">
            {testMode ? "Pedido Criado (Modo Teste)" : "Pagamento Confirmado!"}
          </CardTitle>
          <CardDescription>
            {testMode 
              ? "Seu pedido foi criado em modo de teste"
              : "Seu pedido foi confirmado e está sendo preparado"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testMode && (
            <Alert variant="default" className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Modo Teste:</strong> Este pedido não foi validado pelo Mercado Pago. 
                Configure o modo produção nas configurações para processar pagamentos reais.
              </AlertDescription>
            </Alert>
          )}
          
          {orderNumber && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Número do Pedido</p>
              <p className="text-xl font-bold">#{orderNumber}</p>
            </div>
          )}
          
          <p className="text-sm text-center text-muted-foreground">
            {testMode 
              ? "Este é um pedido de teste e não será processado."
              : "Você receberá atualizações sobre seu pedido em breve."
            }
          </p>
          
          <Button 
            onClick={() => navigate("/")} 
            className="w-full"
          >
            Voltar para o Início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccess;