import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Menu = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profileData?.tenant_id) return;

      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", profileData.tenant_id)
        .order("display_order");

      const { data: productsData } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("tenant_id", profileData.tenant_id)
        .order("created_at", { ascending: false });

      setCategories(categoriesData || []);
      setProducts(productsData || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando cardápio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="transition-smooth"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold">Gerenciar Cardápio</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Categories Section */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Categorias</h2>
            <Button className="gradient-primary text-primary-foreground shadow-medium hover:shadow-glow transition-smooth">
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Você ainda não possui categorias cadastradas
              </p>
              <Button className="gradient-primary text-primary-foreground">
                Criar Primeira Categoria
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category.id} className="p-4 hover:shadow-medium transition-smooth">
                  <h3 className="font-bold mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Products Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Produtos</h2>
            <Button className="gradient-primary text-primary-foreground shadow-medium hover:shadow-glow transition-smooth">
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Você ainda não possui produtos cadastrados
              </p>
              <Button className="gradient-primary text-primary-foreground">
                Criar Primeiro Produto
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-medium transition-smooth">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                    <p className="text-lg font-bold text-primary">
                      R$ {Number(product.base_price).toFixed(2)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Menu;
