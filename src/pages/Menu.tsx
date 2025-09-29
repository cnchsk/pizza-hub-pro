import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Package, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Menu = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "category" | "product"; id: string; name: string } | null>(null);
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

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profileData?.tenant_id) return;

      const { error } = await supabase
        .from("categories")
        .insert({
          name: newCategory.name,
          description: newCategory.description,
          tenant_id: profileData.tenant_id,
          display_order: categories.length,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });

      setNewCategory({ name: "", description: "" });
      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profileData?.tenant_id) return;

      // Get first category
      const firstCategory = categories.find(c => c.id !== categoryId);
      
      if (!firstCategory) {
        toast({
          title: "Erro",
          description: "Você precisa ter pelo menos uma categoria",
          variant: "destructive",
        });
        return;
      }

      // Move products to first category
      const { error: updateError } = await supabase
        .from("products")
        .update({ category_id: firstCategory.id })
        .eq("category_id", categoryId)
        .eq("tenant_id", profileData.tenant_id);

      if (updateError) throw updateError;

      // Delete category
      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (deleteError) throw deleteError;

      toast({
        title: "Sucesso",
        description: "Categoria removida e produtos movidos com sucesso!",
      });

      loadData();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast({
        title: "Erro ao remover categoria",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Delete product variations first
      const { error: variationsError } = await supabase
        .from("product_variations")
        .delete()
        .eq("product_id", productId);

      if (variationsError) throw variationsError;

      // Delete product
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (productError) throw productError;

      toast({
        title: "Sucesso",
        description: "Produto removido com sucesso!",
      });

      loadData();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast({
        title: "Erro ao remover produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === "category") {
      handleDeleteCategory(itemToDelete.id);
    } else {
      handleDeleteProduct(itemToDelete.id);
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground shadow-medium hover:shadow-glow transition-smooth">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Categoria</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova categoria ao seu cardápio
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Ex: Pizzas Tradicionais"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Descreva esta categoria (opcional)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateCategory}
                    disabled={saving}
                    className="gradient-primary text-primary-foreground"
                  >
                    {saving ? "Salvando..." : "Criar Categoria"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Você ainda não possui categorias cadastradas
              </p>
              <Button 
                className="gradient-primary text-primary-foreground"
                onClick={() => setDialogOpen(true)}
              >
                Criar Primeira Categoria
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category.id} className="p-4 hover:shadow-medium transition-smooth">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold">{category.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setItemToDelete({ type: "category", id: category.id, name: category.name });
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
            <Button 
              onClick={() => navigate("/menu/add-product")}
              className="gradient-primary text-primary-foreground shadow-medium hover:shadow-glow transition-smooth"
            >
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
              <Button 
                onClick={() => navigate("/menu/add-product")}
                className="gradient-primary text-primary-foreground"
              >
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
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold">{product.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/menu/edit-product/${product.id}`)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setItemToDelete({ type: "product", id: product.id, name: product.name });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                {itemToDelete?.type === "category" ? (
                  <>
                    Tem certeza que deseja remover a categoria <strong>{itemToDelete?.name}</strong>?
                    <br /><br />
                    Os produtos desta categoria serão movidos para a primeira categoria disponível.
                  </>
                ) : (
                  <>
                    Tem certeza que deseja remover o produto <strong>{itemToDelete?.name}</strong>?
                    <br /><br />
                    Esta ação não pode ser desfeita.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Menu;
