import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TenantContextType {
  tenantId: string | null;
  setTenantId: (id: string | null) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeTenant = async () => {
      // Tenta obter tenant_id do localStorage
      const storedTenantId = localStorage.getItem('current_tenant_id');
      
      if (storedTenantId) {
        setTenantIdState(storedTenantId);
        setLoading(false);
        return;
      }

      // Se não houver no localStorage, busca o primeiro tenant disponível
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (tenantData) {
        setTenantIdState(tenantData.id);
        localStorage.setItem('current_tenant_id', tenantData.id);
      }

      setLoading(false);
    };

    initializeTenant();
  }, []);

  const setTenantId = (id: string | null) => {
    setTenantIdState(id);
    if (id) {
      localStorage.setItem('current_tenant_id', id);
    } else {
      localStorage.removeItem('current_tenant_id');
    }
  };

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
