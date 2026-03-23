import { supabase } from '@/lib/supabase';
import { InDemandRole } from '@/types/job';

export const inDemandRolesService = {
  getRoles: async (): Promise<InDemandRole[]> => {
    const { data, error } = await supabase
      .from('in_demand_roles')
      .select('*')
      .eq('is_active', true)
      .order('rank', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
