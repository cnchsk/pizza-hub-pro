import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface Variation {
  id: string;
  variation_type: string;
  name: string;
  price_modifier: number;
}

const ProductView = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id)
        .single();

      if (productError) throw productError;

      setProduct(productData);

      const { data: variationsData } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", id);

      setVariations(variationsData || []);
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

  const getVariationsByType = (type: string) => {
    return variations.filter((v) => v.variation_type === type);
  };

  const calculateTotal = () => {
    let total = Number(product?.base_price || 0);

    // Add selected variations
    Object.values(selectedVariations).forEach((variationId) => {
      const variation = variations.find((v) => v.id === variationId);
      if (variation) {
        total += Number(variation.price_modifier);
      }
    });

    // Add selected extras
    selectedExtras.forEach((extraId) => {
      const extra = variations.find((v) => v.id === extraId);
      if (extra) {
        total += Number(extra.price_modifier);
      }
    });

    return total * quantity;
  };

  const handleVariationSelect = (type: string, variationId: string) => {
    setSelectedVariations({
      ...selectedVariations,
      [type]: variationId,
    });
  };

  const handleExtraToggle = (extraId: string) => {
    if (selectedExtras.includes(extraId)) {
      setSelectedExtras(selectedExtras.filter((id) => id !== extraId));
    } else {
      setSelectedExtras([...selectedExtras, extraId]);
    }
  };

  const handleAddToCart = () => {
    toast({
      title: "Produto adicionado!",
      description: `${quantity}x ${product?.name} - R$ ${calculateTotal().toFixed(2)}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Produto não encontrado</p>
      </div>
    );
  }

  const descParts = product.description?.split("\n\nIngredientes: ") || ["", ""];
  const description = descParts[0];
  const ingredients = descParts[1];

  const sizeVariations = getVariationsByType("size");
  const borderVariations = getVariationsByType("border");
  const extraVariations = getVariationsByType("extra");

  const images = Array.isArray(product.images) && product.images.length > 0 
    ? product.images as string[] 
    : product.image_url 
      ? [product.image_url] 
      : [];

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
          <h1 className="text-xl font-bold">Visualização do Produto</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            {images.length > 0 ? (
              <>
                <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-medium group">
                  <img
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover animate-fade-in"
                  />
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
                      >
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentImageIndex ? "bg-white w-6" : "bg-white/50"
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-6 gap-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover-scale ${
                          index === currentImageIndex ? "border-primary shadow-medium" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Sem imagem</p>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              {product.categories && (
                <p className="text-sm text-muted-foreground mb-4">
                  {product.categories.name}
                </p>
              )}
              {description && (
                <p className="text-muted-foreground mb-4">{description}</p>
              )}
              {ingredients && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Ingredientes:</p>
                  <p className="text-sm text-muted-foreground">{ingredients}</p>
                </div>
              )}
            </div>

            {/* Size Variations */}
            {sizeVariations.length > 0 && (
              <Card className="p-4">
                <Label className="text-base font-semibold mb-3 block">
                  Tamanho *
                </Label>
                <RadioGroup
                  value={selectedVariations.size}
                  onValueChange={(value) => handleVariationSelect("size", value)}
                >
                  {sizeVariations.map((variation) => (
                    <div
                      key={variation.id}
                      className="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-smooth"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={variation.id} id={variation.id} />
                        <Label htmlFor={variation.id} className="cursor-pointer">
                          {variation.name}
                        </Label>
                      </div>
                      <span className="text-sm font-semibold">
                        {Number(variation.price_modifier) > 0
                          ? `+ R$ ${Number(variation.price_modifier).toFixed(2)}`
                          : "Incluso"}
                      </span>
                    </div>
                  ))}
                </RadioGroup>
              </Card>
            )}

            {/* Border Variations */}
            {borderVariations.length > 0 && (
              <Card className="p-4">
                <Label className="text-base font-semibold mb-3 block">
                  Borda
                </Label>
                <RadioGroup
                  value={selectedVariations.border}
                  onValueChange={(value) => handleVariationSelect("border", value)}
                >
                  {borderVariations.map((variation) => (
                    <div
                      key={variation.id}
                      className="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-smooth"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={variation.id} id={variation.id} />
                        <Label htmlFor={variation.id} className="cursor-pointer">
                          {variation.name}
                        </Label>
                      </div>
                      <span className="text-sm font-semibold">
                        {Number(variation.price_modifier) > 0
                          ? `+ R$ ${Number(variation.price_modifier).toFixed(2)}`
                          : "Incluso"}
                      </span>
                    </div>
                  ))}
                </RadioGroup>
              </Card>
            )}

            {/* Extra Variations */}
            {extraVariations.length > 0 && (
              <Card className="p-4">
                <Label className="text-base font-semibold mb-3 block">
                  Extras
                </Label>
                <div className="space-y-2">
                  {extraVariations.map((variation) => (
                    <div
                      key={variation.id}
                      className="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-smooth"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={variation.id}
                          checked={selectedExtras.includes(variation.id)}
                          onCheckedChange={() => handleExtraToggle(variation.id)}
                        />
                        <Label htmlFor={variation.id} className="cursor-pointer">
                          {variation.name}
                        </Label>
                      </div>
                      <span className="text-sm font-semibold">
                        + R$ {Number(variation.price_modifier).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quantity and Total */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Quantidade</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold w-8 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xl font-bold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {calculateTotal().toFixed(2)}
                </span>
              </div>
            </Card>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full gradient-primary text-primary-foreground shadow-medium hover:shadow-glow transition-smooth h-12 text-lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Adicionar ao Carrinho
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductView;
