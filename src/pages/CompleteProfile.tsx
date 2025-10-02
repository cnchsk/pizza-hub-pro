import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin } from "lucide-react";
import { z } from "zod";

const addressSchema = z.object({
  address: z.string().trim().min(5, "Endereço deve ter pelo menos 5 caracteres").max(200, "Endereço muito longo"),
  neighborhood: z.string().trim().min(3, "Bairro deve ter pelo menos 3 caracteres").max(100, "Bairro muito longo"),
  city: z.string().trim().min(3, "Cidade deve ter pelo menos 3 caracteres").max(100, "Cidade muito longa"),
  state: z.string().trim().length(2, "Estado deve ter 2 caracteres (ex: SP)").toUpperCase(),
  postal_code: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido (formato: 00000-000)"),
  address_complement: z.string().trim().max(100, "Complemento muito longo").optional(),
});

const CompleteProfile = () => {
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/customer-auth");
        return;
      }

      // Verifica se o perfil já está completo
      const { data: profile } = await supabase
        .from("profiles")
        .select("address, city")
        .eq("id", user.id)
        .single();

      if (profile?.address && profile?.city) {
        // Perfil já completo, redireciona para o carrinho
        navigate("/cart");
        return;
      }

      setCheckingProfile(false);
    };

    checkUserProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const addressData = {
      address: formData.get("address") as string,
      neighborhood: formData.get("neighborhood") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      postal_code: formData.get("postal_code") as string,
      address_complement: formData.get("address_complement") as string,
    };

    try {
      // Valida os dados
      const validatedData = addressSchema.parse(addressData);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Busca o perfil atual para obter tenant_id, nome e telefone
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("tenant_id, full_name, phone")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const fullAddress = `${validatedData.address}, ${validatedData.neighborhood}, ${validatedData.city} - ${validatedData.state}, ${validatedData.postal_code}${validatedData.address_complement ? ` - ${validatedData.address_complement}` : ''}`;

      // Atualiza o perfil com o endereço
      const { error } = await supabase
        .from("profiles")
        .update({
          address: validatedData.address,
          neighborhood: validatedData.neighborhood,
          city: validatedData.city,
          state: validatedData.state,
          postal_code: validatedData.postal_code,
          address_complement: validatedData.address_complement || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Cadastra ou atualiza na tabela customers
      if (profile?.tenant_id) {
        const { error: customerError } = await supabase
          .from("customers")
          .upsert({
            id: user.id,
            tenant_id: profile.tenant_id,
            full_name: profile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente',
            phone: profile.phone || user.user_metadata?.phone || '',
            email: user.email || '',
            address: fullAddress,
          }, {
            onConflict: 'id'
          });

        if (customerError) {
          console.error("Erro ao cadastrar cliente:", customerError);
          // Não bloqueia o fluxo se houver erro no customers
        }
      }

      toast({
        title: "Endereço cadastrado!",
        description: "Suas informações foram salvas com sucesso.",
      });

      // Redireciona para o carrinho
      navigate("/cart");
    } catch (error: any) {
      toast({
        title: "Erro ao salvar endereço",
        description: error.message || "Verifique os dados e tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-center">Complete seu Cadastro</h1>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="p-6 shadow-medium">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Endereço de Entrega</h2>
              <p className="text-sm text-muted-foreground">
                Precisamos do seu endereço para entregar seu pedido
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">CEP</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  type="text"
                  placeholder="00000-000"
                  required
                  maxLength={9}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Rua, Avenida, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  type="text"
                  placeholder="Nome do bairro"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Cidade"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    type="text"
                    placeholder="SP"
                    required
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_complement">Complemento (opcional)</Label>
                <Input
                  id="address_complement"
                  name="address_complement"
                  type="text"
                  placeholder="Apto, Bloco, etc."
                />
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Continuar para o Carrinho"
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
