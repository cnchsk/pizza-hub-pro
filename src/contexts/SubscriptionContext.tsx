import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  subscribed: boolean;
  status: string;
  trial_ends_at: string | null;
  subscription_end: string | null;
}

interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  createCheckout: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        toast({
          title: 'Erro ao verificar assinatura',
          description: 'Não foi possível verificar o status da assinatura.',
          variant: 'destructive',
        });
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado para criar uma assinatura.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating checkout:', error);
        toast({
          title: 'Erro ao criar checkout',
          description: 'Não foi possível iniciar o processo de assinatura.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error opening customer portal:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível abrir o portal do cliente.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    checkSubscription();

    // Auto-refresh every minute
    const interval = setInterval(checkSubscription, 60000);

    // Check on auth state changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      authSubscription.unsubscribe();
    };
  }, []);

  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      loading, 
      checkSubscription,
      createCheckout,
      openCustomerPortal,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
