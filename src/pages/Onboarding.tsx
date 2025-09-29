import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Onboarding = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const cnpj = formData.get("cnpj") as string;
    const subdomain = formData.get("subdomain") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (authError) throw authError;

      // Create tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name,
          cnpj,
          subdomain,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Create profile as admin
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user!.id,
          tenant_id: tenantData.id,
          role: "admin",
        });

      if (profileError) throw profileError;

      // Create default loyalty tiers
      await supabase.from("loyalty_tiers").insert([
        { tenant_id: tenantData.id, name: "Bronze", min_points: 0, discount_percentage: 5 },
        { tenant_id: tenantData.id, name: "Prata", min_points: 100, discount_percentage: 10 },
        { tenant_id: tenantData.id, name: "Ouro", min_points: 500, discount_percentage: 15 },
      ]);

      toast({
        title: "Pizzaria cadastrada com sucesso!",
        description: "Você já pode começar a configurar seu cardápio.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar pizzaria",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-warm">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 shadow-medium">
            <h1 className="text-3xl font-bold mb-2">Cadastrar Nova Pizzaria</h1>
            <p className="text-muted-foreground mb-8">
              Preencha os dados abaixo para criar sua conta
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Pizzaria*</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Pizza da Nonna"
                  required
                  className="transition-smooth focus:shadow-soft"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ*</Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  placeholder="00.000.000/0000-00"
                  required
                  className="transition-smooth focus:shadow-soft"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomínio*</Label>
                <Input
                  id="subdomain"
                  name="subdomain"
                  placeholder="pizzadanonna"
                  required
                  pattern="[a-z0-9-]+"
                  className="transition-smooth focus:shadow-soft"
                />
                <p className="text-sm text-muted-foreground">
                  Será usado como: pizzadanonna.seudominio.com
                </p>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h2 className="text-xl font-bold">Dados de Acesso</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail do Administrador*</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@pizzaria.com"
                    required
                    className="transition-smooth focus:shadow-soft"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha*</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    minLength={6}
                    required
                    className="transition-smooth focus:shadow-soft"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary text-primary-foreground shadow-medium hover:shadow-glow transition-smooth"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar Pizzaria"
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
