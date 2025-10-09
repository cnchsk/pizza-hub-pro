import { useSubscription } from '@/contexts/SubscriptionContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export const SubscriptionAlert = () => {
  const { subscription, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading || !subscription) return null;

  // Don't show alert if subscription is active and not ending soon
  if (subscription.subscribed && subscription.status === 'active') {
    const daysUntilEnd = subscription.subscription_end 
      ? differenceInDays(new Date(subscription.subscription_end), new Date())
      : 0;
    
    // Only show alert if less than 7 days until renewal
    if (daysUntilEnd > 7) {
      return null;
    }
  }

  // Not subscribed
  if (!subscription.subscribed || subscription.status === 'no_subscription') {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Assinatura Inativa</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Você precisa de uma assinatura ativa para usar a plataforma.</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/subscription')}
            className="ml-4"
          >
            Assinar Agora
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // In trial period
  if (subscription.status === 'trialing' && subscription.trial_ends_at) {
    const daysLeft = differenceInDays(new Date(subscription.trial_ends_at), new Date());
    
    return (
      <Alert className="mb-6 border-primary/50 bg-primary/5">
        <Clock className="h-4 w-4 text-primary" />
        <AlertTitle>Período de Teste</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Seu período de teste termina em <strong>{daysLeft} dias</strong>. Aproveite todos os recursos!
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/subscription')}
            className="ml-4"
          >
            Ver Detalhes
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Active but ending soon
  if (subscription.status === 'active' && subscription.subscription_end) {
    const daysLeft = differenceInDays(new Date(subscription.subscription_end), new Date());
    
    if (daysLeft <= 7) {
      return (
        <Alert className="mb-6 border-primary/50 bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertTitle>Renovação Próxima</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Sua assinatura será renovada em <strong>{daysLeft} dias</strong>.
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/subscription')}
              className="ml-4"
            >
              Gerenciar
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
  }

  // Cancelled or past due
  if (['canceled', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid'].includes(subscription.status)) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Problema com Assinatura</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            {subscription.status === 'past_due' 
              ? 'Há um problema com seu pagamento.' 
              : 'Sua assinatura foi cancelada.'}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/subscription')}
            className="ml-4"
          >
            Resolver Agora
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
