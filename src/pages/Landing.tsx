import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pizza, Store, CreditCard, Star, MessageSquare, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-pizza.jpg";

const Landing = () => {
  const features = [
    {
      icon: Store,
      title: "Gestão de Cardápio",
      description: "Crie e gerencie seu cardápio digital com categorias, produtos e variações."
    },
    {
      icon: CreditCard,
      title: "Pagamentos Integrados",
      description: "Aceite Pix e cartão de crédito com integração simplificada."
    },
    {
      icon: Star,
      title: "Programa de Fidelidade",
      description: "Sistema de pontos automático que premia seus clientes fiéis."
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Business",
      description: "Notificações automáticas de pedidos via WhatsApp."
    },
    {
      icon: TrendingUp,
      title: "Dashboard Completo",
      description: "Métricas em tempo real e relatórios de vendas."
    }
  ];

  return (
    <div className="min-h-screen gradient-warm">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Transforme sua pizzaria em um
                <span className="gradient-primary bg-clip-text text-transparent"> negócio digital</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Sistema completo para gestão, vendas online e fidelização de clientes. 
                Configure em minutos e comece a vender agora!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/onboarding">
                  <Button size="lg" className="gradient-primary text-primary-foreground shadow-glow hover:scale-105 transition-smooth text-lg px-8">
                    Começar Agora
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="border-2 hover:border-primary transition-smooth text-lg px-8">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-full"></div>
              <img 
                src={heroImage} 
                alt="Pizza deliciosa" 
                className="relative rounded-2xl shadow-medium hover:shadow-glow transition-smooth w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tudo que você precisa</h2>
            <p className="text-xl text-muted-foreground">
              Uma plataforma completa para gerenciar sua pizzaria
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 hover:shadow-medium transition-smooth hover:scale-105 bg-card"
              >
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center gradient-primary text-primary-foreground shadow-glow">
            <h2 className="text-4xl font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Configure sua pizzaria em menos de 5 minutos
            </p>
            <Link to="/onboarding">
              <Button size="lg" variant="secondary" className="text-lg px-8 shadow-medium hover:scale-105 transition-smooth">
                Cadastrar Minha Pizzaria
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 PizzaSaaS. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
