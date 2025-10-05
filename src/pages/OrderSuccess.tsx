import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
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
          <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
          <CardDescription>
            Seu pedido foi confirmado e está sendo preparado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderNumber && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Número do Pedido</p>
              <p className="text-xl font-bold">#{orderNumber}</p>
            </div>
          )}
          <p className="text-sm text-center text-muted-foreground">
            Você receberá atualizações sobre seu pedido em breve.
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