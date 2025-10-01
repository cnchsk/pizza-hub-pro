import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateItem, removeItem, getTotal } = useCart();

  const getVariationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      size: "Tamanho",
      border: "Borda",
      dough: "Tipo de Massa",
      extra: "Adicional",
      topping: "Cobertura Extra"
    };
    return labels[type] || type;
  };

  const updateQuantity = (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      updateItem(id, { quantity: Math.max(1, item.quantity + delta) });
    }
  };

  const handleEdit = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      navigate(`/menu/product/${item.productId}?editCartItem=${id}`);
    }
  };

  const calculateItemPrice = (item: typeof items[0]) => {
    const variationsTotal = item.variations.reduce((sum, v) => sum + v.price_modifier, 0);
    return (item.basePrice + variationsTotal) * item.quantity;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  };

  const deliveryFee = 5.00;
  const total = calculateSubtotal() + deliveryFee;

  return (
    <div className="min-h-screen gradient-warm">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="transition-smooth"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold">Carrinho</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h2>
            <p className="text-muted-foreground mb-6">
              Adicione produtos ao carrinho para continuar
            </p>
            <Button onClick={() => navigate("/menu")} className="gradient-primary">
              Ver Cardápio
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {/* Cart Items */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Itens do Pedido</h2>
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    {item.imageUrl && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                      
                      {item.variations.length > 0 && (
                        <div className="text-sm text-muted-foreground mb-2 space-y-1">
                          {item.variations.map((v, index) => (
                            <div key={index}>
                              <span className="font-semibold">{getVariationTypeLabel(v.type)}:</span> {v.name}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {item.observations && (
                        <div className="text-sm text-muted-foreground mb-2">
                          <span className="font-semibold">Obs:</span> {item.observations}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-semibold w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <span className="text-lg font-bold text-primary">
                          R$ {calculateItemPrice(item).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item.id)}
                        className="hover:bg-primary/10"
                      >
                        <Edit className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Resumo do Pedido</h3>
              
                <div className="space-y-3 mb-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R$ {calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxa de entrega</span>
                  <span>R$ {deliveryFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between items-center mb-6">
                <span className="text-xl font-bold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {total.toFixed(2)}
                </span>
              </div>

              <Button 
                onClick={() => navigate("/auth?redirect=checkout")}
                className="w-full gradient-primary text-primary-foreground shadow-medium hover:shadow-glow transition-smooth h-12 text-lg"
              >
                Finalizar Pedido
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
