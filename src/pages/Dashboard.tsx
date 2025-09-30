import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pizza, ShoppingCart, Star, Users, LogOut, Package, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, tenants(*)")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setTenant(profileData.tenants);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado com sucesso!",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const stats = [
    { icon: ShoppingCart, label: "Pedidos Hoje", value: "0", color: "text-primary" },
    { icon: Package, label: "Produtos", value: "0", color: "text-secondary" },
    { icon: Star, label: "NPS Médio", value: "-", color: "text-accent" },
    { icon: Users, label: "Clientes", value: "0", color: "text-success" },
  ];

  return (
    <div className="min-h-screen gradient-warm">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow">
              <Pizza className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{tenant?.name}</h1>
              <p className="text-sm text-muted-foreground">{tenant?.subdomain}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/settings")}
              className="transition-smooth"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="transition-smooth"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de controle da sua pizzaria
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 hover:shadow-medium transition-smooth">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Ações Rápidas</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              onClick={() => navigate("/menu")}
              className="h-24 gradient-primary text-primary-foreground shadow-medium hover:shadow-glow transition-smooth"
            >
              <Pizza className="w-6 h-6 mr-2" />
              Gerenciar Cardápio
            </Button>
            <Button 
              onClick={() => navigate("/orders")}
              variant="outline" 
              className="h-24 border-2 hover:border-primary transition-smooth"
            >
              <ShoppingCart className="w-6 h-6 mr-2" />
              Ver Pedidos
            </Button>
            <Button 
              variant="outline" 
              className="h-24 border-2 hover:border-primary transition-smooth"
              disabled
            >
              <Star className="w-6 h-6 mr-2" />
              Programa de Fidelidade
            </Button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Atividade Recente</h3>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma atividade registrada ainda
          </p>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
