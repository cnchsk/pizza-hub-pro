import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Subscription = () => {
  const navigate = useNavigate();
  const { subscription, loading, checkSubscription, createCheckout, openCustomerPortal } = useSubscription();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        navigate('/dashboard');
      }
    };

    checkAuth();
  }, [navigate]);

  const getStatusBadge = () => {
    if (!subscription) return null;

    const statusConfig = {
      active: { label: 'Ativa', variant: 'default' as const, icon: CheckCircle },
      trialing: { label: 'Período de Teste', variant: 'secondary' as const, icon: Clock },
      canceled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle },
      past_due: { label: 'Pagamento Pendente', variant: 'destructive' as const, icon: XCircle },
      no_subscription: { label: 'Sem Assinatura', variant: 'outline' as const, icon: XCircle },
    };

    const config = statusConfig[subscription.status as keyof typeof statusConfig] || statusConfig.no_subscription;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura e acesso à plataforma
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status da Assinatura</CardTitle>
                <CardDescription>
                  Informações sobre seu plano atual
                </CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {subscription?.subscribed ? (
              <>
                {subscription.trial_ends_at && subscription.status === 'trialing' && (
                  <div className="p-4 bg-secondary/20 rounded-lg">
                    <p className="text-sm font-medium mb-1">Período de Teste Grátis</p>
                    <p className="text-sm text-muted-foreground">
                      Seu período de teste termina em{' '}
                      <span className="font-semibold text-foreground">
                        {format(new Date(subscription.trial_ends_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </p>
                  </div>
                )}

                {subscription.subscription_end && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Próxima Renovação</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(subscription.subscription_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="p-6 border rounded-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <CreditCard className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="text-lg font-semibold">Plano Mensal Pizzaria</h3>
                        <p className="text-sm text-muted-foreground">R$ 99,00 / mês</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Gestão completa de pedidos
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Controle de estoque e produtos
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Relatórios e análises
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Integrações de pagamento
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={openCustomerPortal} variant="outline" className="flex-1">
                      Gerenciar Assinatura
                    </Button>
                    <Button onClick={checkSubscription} variant="ghost">
                      Atualizar Status
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="p-6 border-2 border-primary rounded-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <CreditCard className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="text-xl font-bold">Plano Mensal Pizzaria</h3>
                      <p className="text-2xl font-bold text-primary mt-1">R$ 99,00 / mês</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <Badge variant="secondary" className="mb-4">
                      <Clock className="w-4 h-4 mr-2" />
                      30 dias grátis para testar
                    </Badge>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Gestão completa de pedidos
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Controle de estoque e produtos
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Relatórios e análises
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Integrações de pagamento
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Suporte prioritário
                      </li>
                    </ul>
                  </div>

                  <Button onClick={createCheckout} className="w-full" size="lg">
                    Começar Período de Teste Grátis
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Cancele a qualquer momento durante o período de teste
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
