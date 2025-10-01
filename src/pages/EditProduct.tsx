import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Variation {
  id: string;
  type: string;
  name: string;
  priceModifier: number;
  isNew?: boolean;
}

const EditProduct = () => {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [id]);

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

      // Load categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", profileData.tenant_id)
        .eq("is_active", true)
        .order("display_order");

      setCategories(categoriesData || []);

      // Load product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", profileData.tenant_id)
        .single();

      if (productError) throw productError;

      if (productData) {
        setName(productData.name);
        const descParts = productData.description?.split("\n\nIngredientes: ") || ["", ""];
        setDescription(descParts[0] || "");
        setIngredients(descParts[1] || "");
        setBasePrice(productData.base_price.toString());
        setCategoryId(productData.category_id);
        
        // Load existing images
        const images = Array.isArray(productData.images) ? productData.images as string[] : [];
        setExistingImages(images);
        setImagePreviews(images);
      }

      // Load variations
      const { data: variationsData } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", id);

      if (variationsData) {
        setVariations(
          variationsData.map((v) => ({
            id: v.id,
            type: v.variation_type,
            name: v.name,
            priceModifier: Number(v.price_modifier),
            isNew: false,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading product:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o produto",
        variant: "destructive",
      });
      navigate("/menu");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + imageFiles.length + files.length;
    
    if (totalImages > 6) {
      toast({
        title: "Limite excedido",
        description: "Você pode ter no máximo 6 fotos",
        variant: "destructive",
      });
      return;
    }

    setImageFiles([...imageFiles, ...files]);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    const existingCount = existingImages.length;
    const newImageIndex = index - existingCount;
    setImageFiles(imageFiles.filter((_, i) => i !== newImageIndex));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const addVariation = () => {
    setVariations([
      ...variations,
      {
        id: crypto.randomUUID(),
        type: "size",
        name: "",
        priceModifier: 0,
        isNew: true,
      },
    ]);
  };

  const removeVariation = async (variation: Variation) => {
    if (!variation.isNew) {
      // Delete from database
      const { error } = await supabase
        .from("product_variations")
        .delete()
        .eq("id", variation.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível remover a variação",
          variant: "destructive",
        });
        return;
      }
    }
    setVariations(variations.filter((v) => v.id !== variation.id));
  };

  const updateVariation = (id: string, field: keyof Variation, value: any) => {
    setVariations(
      variations.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !basePrice || !categoryId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
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

      const imageUrls: string[] = [...existingImages];

      // Upload new images
      for (const imageFile of imageFiles) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${profileData.tenant_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      }

      // Update product
      const { error: productError } = await supabase
        .from("products")
        .update({
          name,
          description: `${description}\n\nIngredientes: ${ingredients}`,
          base_price: parseFloat(basePrice),
          category_id: categoryId,
          image_url: imageUrls[0] || null,
          images: imageUrls,
        })
        .eq("id", id);

      if (productError) throw productError;

      // Update variations
      for (const variation of variations) {
        if (variation.isNew) {
          // Insert new variation
          const { error } = await supabase
            .from("product_variations")
            .insert({
              product_id: id,
              variation_type: variation.type,
              name: variation.name,
              price_modifier: variation.priceModifier,
            });

          if (error) throw error;
        } else {
          // Update existing variation
          const { error } = await supabase
            .from("product_variations")
            .update({
              variation_type: variation.type,
              name: variation.name,
              price_modifier: variation.priceModifier,
            })
            .eq("id", variation.id);

          if (error) throw error;
        }
      }

      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
      });

      navigate("/menu");
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/menu")}
            className="transition-smooth"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold">Editar Produto</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Fotos do Produto (até 6)</Label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => {
                        if (index < existingImages.length) {
                          removeExistingImage(index);
                        } else {
                          removeNewImage(index);
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {imagePreviews.length < 6 && (
                  <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-smooth">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground text-center px-2">
                      Adicionar foto
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {imagePreviews.length} de 6 fotos adicionadas
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pizza Margherita"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o produto"
                rows={3}
              />
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredientes</Label>
              <Textarea
                id="ingredients"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Liste os ingredientes (Ex: Molho de tomate, mussarela, manjericão)"
                rows={3}
              />
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <Label htmlFor="basePrice">Preço Base (R$) *</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            {/* Variations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Variações</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariation}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Variação
                </Button>
              </div>

              {variations.map((variation) => (
                <Card key={variation.id} className="p-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={variation.type}
                        onValueChange={(value) =>
                          updateVariation(variation.id, "type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="size">Tamanho</SelectItem>
                          <SelectItem value="border">Borda</SelectItem>
                          <SelectItem value="dough">Tipo Massa</SelectItem>
                          <SelectItem value="extra">Adicionais</SelectItem>
                          <SelectItem value="topping">Cobertura Extra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={variation.name}
                        onChange={(e) =>
                          updateVariation(variation.id, "name", e.target.value)
                        }
                        placeholder="Ex: Grande, Catupiry"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Modificador (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variation.priceModifier}
                        onChange={(e) =>
                          updateVariation(
                            variation.id,
                            "priceModifier",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeVariation(variation)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/menu")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 gradient-primary text-primary-foreground"
              >
                {saving ? "Salvando..." : "Atualizar Produto"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default EditProduct;
