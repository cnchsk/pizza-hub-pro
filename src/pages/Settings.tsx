import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import DeliveryMap from "@/components/DeliveryMap";

interface TenantData {
  id: string;
  name: string;
  cnpj: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  mobile_phone: string | null;
  subdomain: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  delivery_fee: number;
  delivery_radius_km: number;
  free_delivery_min_order: number | null;
  payment_provider: string | null;
  payment_api_key: string | null;
  payment_api_secret: string | null;
  payment_merchant_id: string | null;
  mercadopago_access_token: string | null;
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
        neighborhood: tenantData.neighborhood,
        city: tenantData.city,
        state: tenantData.state,
        postal_code: tenantData.postal_code,
        phone: tenantData.phone,
        mobile_phone: tenantData.mobile_phone,
        subdomain: tenantData.subdomain,
        logo_url: tenantData.logo_url,
        primary_color: tenantData.primary_color,
        secondary_color: tenantData.secondary_color,
        delivery_fee: tenantData.delivery_fee,
        delivery_radius_km: tenantData.delivery_radius_km,
        free_delivery_min_order: tenantData.free_delivery_min_order,
        payment_provider: tenantData.payment_provider,
        payment_api_key: tenantData.payment_api_key,
        payment_api_secret: tenantData.payment_api_secret,
        payment_merchant_id: tenantData.payment_merchant_id,
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

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Informações Gerais</TabsTrigger>
            <TabsTrigger value="delivery">Entrega</TabsTrigger>
            <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
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
              <Label htmlFor="address">Endereço (Rua, número, complemento)</Label>
              <Input
                id="address"
                value={tenantData.address || ""}
                onChange={(e) => setTenantData({ ...tenantData, address: e.target.value })}
                placeholder="Rua Exemplo, 123, Apto 45"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={tenantData.neighborhood || ""}
                  onChange={(e) => setTenantData({ ...tenantData, neighborhood: e.target.value })}
                  placeholder="Centro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">CEP</Label>
                <Input
                  id="postal_code"
                  value={tenantData.postal_code || ""}
                  onChange={(e) => setTenantData({ ...tenantData, postal_code: e.target.value })}
                  placeholder="12345-678"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={tenantData.city || ""}
                  onChange={(e) => setTenantData({ ...tenantData, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado (UF)</Label>
                <Input
                  id="state"
                  value={tenantData.state || ""}
                  onChange={(e) => setTenantData({ ...tenantData, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
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
          </TabsContent>

          <TabsContent value="delivery">
            <div className="grid lg:grid-cols-2 gap-6">
          <Card>
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

              <DeliveryMap
                postalCode={tenantData.postal_code || ""}
                deliveryRadiusKm={tenantData.delivery_radius_km}
              />
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Pagamento</CardTitle>
                <CardDescription>Configure o provedor de pagamento da sua pizzaria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_provider">Provedor de Pagamento</Label>
                  <Select
                    value={tenantData.payment_provider || ""}
                    onValueChange={(value) => setTenantData({ ...tenantData, payment_provider: value })}
                  >
                    <SelectTrigger id="payment_provider">
                      <SelectValue placeholder="Selecione um provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash_on_delivery">Pago na Entrega com Cartão</SelectItem>
                      <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                      <SelectItem value="pagseguro">PagSeguro</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="gerencianet">Gerencianet</SelectItem>
                      <SelectItem value="ebanx">EBANX</SelectItem>
                      <SelectItem value="webpay">Webpay</SelectItem>
                      <SelectItem value="khipu">Khipu</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Escolha o provedor que será usado para processar pagamentos
                  </p>
                </div>

                {tenantData.payment_provider && tenantData.payment_provider !== "cash_on_delivery" && (
                  <>
                    {tenantData.payment_provider === "mercadopago" && (
                      <div className="space-y-2">
                        <Label htmlFor="mercadopago_access_token">Access Token do Mercado Pago</Label>
                        <Input
                          id="mercadopago_access_token"
                          type="password"
                          value={tenantData.mercadopago_access_token || ""}
                          onChange={(e) => setTenantData({ ...tenantData, mercadopago_access_token: e.target.value })}
                          placeholder="APP_USR-XXXX-XXXX-XXXX"
                        />
                        <p className="text-sm text-muted-foreground">
                          Access Token obtido no painel do Mercado Pago (Seu Negócio → Credenciais)
                        </p>
                      </div>
                    )}

                    {tenantData.payment_provider !== "mercadopago" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="payment_api_key">API Key / Access Token</Label>
                          <Input
                            id="payment_api_key"
                            type="password"
                            value={tenantData.payment_api_key || ""}
                            onChange={(e) => setTenantData({ ...tenantData, payment_api_key: e.target.value })}
                            placeholder="Chave de API do provedor"
                          />
                          <p className="text-sm text-muted-foreground">
                            Chave pública ou access token fornecido pelo provedor
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment_api_secret">API Secret / Secret Key</Label>
                          <Input
                            id="payment_api_secret"
                            type="password"
                            value={tenantData.payment_api_secret || ""}
                            onChange={(e) => setTenantData({ ...tenantData, payment_api_secret: e.target.value })}
                            placeholder="Chave secreta do provedor"
                          />
                          <p className="text-sm text-muted-foreground">
                            Chave secreta fornecida pelo provedor
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment_merchant_id">Merchant ID / Vendor ID (Opcional)</Label>
                          <Input
                            id="payment_merchant_id"
                            value={tenantData.payment_merchant_id || ""}
                            onChange={(e) => setTenantData({ ...tenantData, payment_merchant_id: e.target.value })}
                            placeholder="ID do comerciante"
                          />
                          <p className="text-sm text-muted-foreground">
                            Identificador do comerciante (se aplicável ao provedor)
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="pt-4">
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
