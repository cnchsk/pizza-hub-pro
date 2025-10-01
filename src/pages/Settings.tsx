import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

interface TenantData {
  id: string;
  name: string;
  cnpj: string;
  address: string | null;
  phone: string | null;
  mobile_phone: string | null;
  subdomain: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  delivery_fee: number;
  delivery_radius_km: number;
  free_delivery_min_order: number | null;
}

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      toast({
        title: "Erro",
        description: "Perfil não encontrado",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    if (profile.role !== "admin") {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem editar as configurações",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", profile.tenant_id)
      .single();

    if (error || !tenant) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da pizzaria",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setTenantData(tenant);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!tenantData) return;

    setSaving(true);
    const { error } = await supabase
      .from("tenants")
      .update({
        name: tenantData.name,
        cnpj: tenantData.cnpj,
        address: tenantData.address,
        phone: tenantData.phone,
        mobile_phone: tenantData.mobile_phone,
        subdomain: tenantData.subdomain,
        logo_url: tenantData.logo_url,
        primary_color: tenantData.primary_color,
        secondary_color: tenantData.secondary_color,
        delivery_fee: tenantData.delivery_fee,
        delivery_radius_km: tenantData.delivery_radius_km,
        free_delivery_min_order: tenantData.free_delivery_min_order,
      })
      .eq("id", tenantData.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso!",
      description: "Dados da pizzaria atualizados com sucesso",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!tenantData) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Configurações da Pizzaria</h1>
          <p className="text-muted-foreground">Edite as informações da sua pizzaria</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
            <CardDescription>Atualize os dados da sua pizzaria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Pizzaria</Label>
              <Input
                id="name"
                value={tenantData.name}
                onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                placeholder="Nome da pizzaria"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={tenantData.cnpj}
                onChange={(e) => setTenantData({ ...tenantData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Input
                id="address"
                value={tenantData.address || ""}
                onChange={(e) => setTenantData({ ...tenantData, address: e.target.value })}
                placeholder="Rua, número, bairro, cidade - UF, CEP"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone Fixo</Label>
                <Input
                  id="phone"
                  value={tenantData.phone || ""}
                  onChange={(e) => setTenantData({ ...tenantData, phone: e.target.value })}
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_phone">Celular/WhatsApp</Label>
                <Input
                  id="mobile_phone"
                  value={tenantData.mobile_phone || ""}
                  onChange={(e) => setTenantData({ ...tenantData, mobile_phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomínio</Label>
              <Input
                id="subdomain"
                value={tenantData.subdomain}
                onChange={(e) => setTenantData({ ...tenantData, subdomain: e.target.value })}
                placeholder="minhapizzaria"
              />
              <p className="text-sm text-muted-foreground">
                URL: {tenantData.subdomain}.seudominio.com
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                value={tenantData.logo_url || ""}
                onChange={(e) => setTenantData({ ...tenantData, logo_url: e.target.value })}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={tenantData.primary_color}
                    onChange={(e) => setTenantData({ ...tenantData, primary_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={tenantData.primary_color}
                    onChange={(e) => setTenantData({ ...tenantData, primary_color: e.target.value })}
                    placeholder="#D32F2F"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_color">Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={tenantData.secondary_color}
                    onChange={(e) => setTenantData({ ...tenantData, secondary_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={tenantData.secondary_color}
                    onChange={(e) => setTenantData({ ...tenantData, secondary_color: e.target.value })}
                    placeholder="#FF9800"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Configurações de Entrega</CardTitle>
            <CardDescription>Defina as regras de entrega da sua pizzaria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_fee">Taxa de Entrega (R$)</Label>
              <Input
                id="delivery_fee"
                type="number"
                step="0.01"
                min="0"
                value={tenantData.delivery_fee}
                onChange={(e) => setTenantData({ ...tenantData, delivery_fee: parseFloat(e.target.value) || 0 })}
                placeholder="5.00"
              />
              <p className="text-sm text-muted-foreground">
                Valor padrão cobrado pela entrega
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_radius_km">Raio de Entrega (km)</Label>
              <Input
                id="delivery_radius_km"
                type="number"
                step="0.1"
                min="0"
                value={tenantData.delivery_radius_km}
                onChange={(e) => setTenantData({ ...tenantData, delivery_radius_km: parseFloat(e.target.value) || 0 })}
                placeholder="5.0"
              />
              <p className="text-sm text-muted-foreground">
                Distância máxima para entrega em quilômetros
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="free_delivery_min_order">Valor Mínimo para Entrega Grátis (R$)</Label>
              <Input
                id="free_delivery_min_order"
                type="number"
                step="0.01"
                min="0"
                value={tenantData.free_delivery_min_order || ""}
                onChange={(e) => setTenantData({ 
                  ...tenantData, 
                  free_delivery_min_order: e.target.value ? parseFloat(e.target.value) : null 
                })}
                placeholder="50.00 (opcional)"
              />
              <p className="text-sm text-muted-foreground">
                Deixe em branco se não houver entrega grátis
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
