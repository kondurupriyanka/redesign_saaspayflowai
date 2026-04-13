import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { isOwnerAccount } from '@/lib/access';

export type PlanId = 'free' | 'pro' | 'growth';

export interface PlanLimits {
  maxClients: number;
  maxInvoices: number;
  hasAIReminders: boolean;
  hasAIExtraction: boolean;
  hasAdvancedAnalytics: boolean;
  hasPortalAdvanced: boolean;
}

export const PLAN_CONFIGS: Record<PlanId, PlanLimits> = {
  free: {
    maxClients: 2,
    maxInvoices: 1,
    hasAIReminders: false,
    hasAIExtraction: false,
    hasAdvancedAnalytics: false,
    hasPortalAdvanced: false,
  },
  pro: {
    maxClients: 20,
    maxInvoices: Infinity,
    hasAIReminders: true,
    hasAIExtraction: true,
    hasAdvancedAnalytics: false,
    hasPortalAdvanced: true,
  },
  growth: {
    maxClients: 50,
    maxInvoices: Infinity,
    hasAIReminders: true,
    hasAIExtraction: true,
    hasAdvancedAnalytics: true,
    hasPortalAdvanced: true,
  },
};

export const usePlan = () => {
  const { profile, isOwner: authIsOwner } = useAuth();

  // Use the isOwner value from useAuth which checks user?.email directly from Supabase
  const isOwner = authIsOwner || profile?.is_owner === true || isOwnerAccount(profile?.email || '');
  const planId = (isOwner ? 'growth' : (profile?.plan as PlanId)) || 'free';
  const limits = useMemo(() => PLAN_CONFIGS[planId], [planId]);

  const isPro = isOwner || planId === 'pro' || planId === 'growth';
  const isGrowth = isOwner || planId === 'growth';

  return {
    plan: planId,
    isOwner,
    limits,
    isPro,
    isGrowth,
    maxClients: limits.maxClients,
    maxInvoices: limits.maxInvoices,
    hasAIReminders: limits.hasAIReminders,
    hasAIExtraction: limits.hasAIExtraction,
    hasAdvancedAnalytics: limits.hasAdvancedAnalytics,
  };
};
