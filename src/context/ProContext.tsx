import { createContext, useContext, type ReactNode } from 'react';
import { usePro } from '../hooks/usePro';

type ProContextType = ReturnType<typeof usePro>;

const ProContext = createContext<ProContextType | null>(null);

export function ProProvider({ children }: { children: ReactNode }) {
  const pro = usePro();
  return <ProContext.Provider value={pro}>{children}</ProContext.Provider>;
}

export function useProCtx() {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('useProCtx must be inside ProProvider');
  return ctx;
}
