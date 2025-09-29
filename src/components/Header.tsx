import { Button } from "@/components/ui/button";
import { Pizza } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-smooth hover:scale-105">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Pizza className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">PizzaSaaS</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="transition-smooth">
              Entrar
            </Button>
          </Link>
          <Link to="/onboarding">
            <Button className="gradient-primary text-primary-foreground shadow-medium hover:shadow-glow transition-smooth">
              Cadastrar Pizzaria
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};
