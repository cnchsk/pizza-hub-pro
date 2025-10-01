import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Textarea } from "@/components/ui/textarea";

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
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (variations.length > 0) {
      const initialSelections: Record<string, string> = {};
      const variationTypes = ['size', 'border', 'dough', 'extra', 'topping'];
      
      variationTypes.forEach(type => {
        const typeVariations = variations.filter(v => v.variation_type === type);
        if (typeVariations.length > 0 && !selectedVariations[type]) {
          initialSelections[type] = typeVariations[0].id;
        }
      });

      if (Object.keys(initialSelections).length > 0) {
        setSelectedVariations(prev => ({ ...prev, ...initialSelections }));
      }
    }
  }, [variations]);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

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

    return total * quantity;
  };

  const handleVariationSelect = (type: string, variationId: string) => {
    setSelectedVariations({
      ...selectedVariations,
      [type]: variationId,
    });
  };

  const handleAddToCart = () => {
    const observationsText = observations.trim() ? `\nObservações: ${observations}` : "";
    toast({
      title: "Produto adicionado!",
      description: `${quantity}x ${product?.name} - R$ ${calculateTotal().toFixed(2)}${observationsText}`,
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
  const doughVariations = getVariationsByType("dough");
  const extraVariations = getVariationsByType("extra");
  const toppingVariations = getVariationsByType("topping");

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
                <Carousel 
                  className="w-full"
                  setApi={setApi}
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                >
                  <CarouselContent>
                    {images.map((img, index) => (
                      <CarouselItem key={index}>
                        <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-medium">
                          <img
                            src={img}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover select-none"
                            draggable="false"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {images.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </>
                  )}
                </Carousel>
                {images.length > 1 && (
                  <div className="grid grid-cols-6 gap-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => api?.scrollTo(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover-scale ${
                          current === index 
                            ? "border-primary" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover select-none"
                          draggable="false"
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
                <Select
                  value={selectedVariations.size}
                  onValueChange={(value) => handleVariationSelect("size", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeVariations.map((variation) => (
                      <SelectItem key={variation.id} value={variation.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{variation.name}</span>
                          <span className="ml-4 text-sm font-semibold">
                            {Number(variation.price_modifier) > 0
                              ? `+ R$ ${Number(variation.price_modifier).toFixed(2)}`
                              : "Incluso"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>
            )}

            {/* Border Variations */}
            {borderVariations.length > 0 && (
              <Card className="p-4">
                <Label className="text-base font-semibold mb-3 block">
                  Borda
                </Label>
                <Select
                  value={selectedVariations.border}
                  onValueChange={(value) => handleVariationSelect("border", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a borda" />
                  </SelectTrigger>
                  <SelectContent>
                    {borderVariations.map((variation) => (
                      <SelectItem key={variation.id} value={variation.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{variation.name}</span>
                          <span className="ml-4 text-sm font-semibold">
                            {Number(variation.price_modifier) > 0
                              ? `+ R$ ${Number(variation.price_modifier).toFixed(2)}`
                              : "Incluso"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>
            )}

            {/* Dough Type Variations */}
            {doughVariations.length > 0 && (
              <Card className="p-4">
                <Label className="text-base font-semibold mb-3 block">
                  Tipo Massa
                </Label>
                <Select
                  value={selectedVariations.dough}
                  onValueChange={(value) => handleVariationSelect("dough", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de massa" />
                  </SelectTrigger>
                  <SelectContent>
                    {doughVariations.map((variation) => (
                      <SelectItem key={variation.id} value={variation.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{variation.name}</span>
                          <span className="ml-4 text-sm font-semibold">
                            {Number(variation.price_modifier) > 0
                              ? `+ R$ ${Number(variation.price_modifier).toFixed(2)}`
                              : "Incluso"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>
            )}

            {/* Extra Variations */}
            {extraVariations.length > 0 && (
              <Card className="p-4">
                <Label className="text-base font-semibold mb-3 block">
                  Adicionais
                </Label>
                <Select
                  value={selectedVariations.extra}
                  onValueChange={(value) => handleVariationSelect("extra", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um adicional" />
                  </SelectTrigger>
                  <SelectContent>
                    {extraVariations.map((variation) => (
                      <SelectItem key={variation.id} value={variation.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{variation.name}</span>
                          <span className="ml-4 text-sm font-semibold">
                            {Number(variation.price_modifier) > 0
                              ? `+ R$ ${Number(variation.price_modifier).toFixed(2)}`
                              : "Incluso"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>
            )}

            {/* Topping Extra Variations */}
            {toppingVariations.length > 0 && (
              <Card className="p-4">
                <Label className="text-base font-semibold mb-3 block">
                  Cobertura Extra
                </Label>
                <Select
                  value={selectedVariations.topping}
                  onValueChange={(value) => handleVariationSelect("topping", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cobertura extra" />
                  </SelectTrigger>
                  <SelectContent>
                    {toppingVariations.map((variation) => (
                      <SelectItem key={variation.id} value={variation.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{variation.name}</span>
                          <span className="ml-4 text-sm font-semibold">
                            {Number(variation.price_modifier) > 0
                              ? `+ R$ ${Number(variation.price_modifier).toFixed(2)}`
                              : "Incluso"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>
            )}

            {/* Observations */}
            <Card className="p-4">
              <Label htmlFor="observations" className="text-base font-semibold mb-3 block">
                Observações
              </Label>
              <Textarea
                id="observations"
                placeholder="Adicione observações sobre seu pedido (ex: sem cebola, bem passado, etc.)"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </Card>

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
