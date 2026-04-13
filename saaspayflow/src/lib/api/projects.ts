import { supabase } from '../supabase';

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'review' | 'done';
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  client_id: string;
  invoice_id: string | null;
  name: string;
  description: string | null;
  progress_percent: number;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  created_at: string;
  updated_at: string;
  client?: {
    name: string;
    company_name: string | null;
  };
  invoice?: {
    invoice_number: string;
    status: string;
    due_date: string;
  };
  milestones?: Milestone[];
}

export const projectsApi = {
  async fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(name),
        invoice:invoices(invoice_number, status, due_date)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as Project[];
  },

  async fetchProjectDetail(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        invoice:invoices(*),
        milestones(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Sort milestones by order
    if (data.milestones) {
      data.milestones.sort((a, b) => a.order - b.order);
    }
    
    return data as Project;
  },

  async createProject(project: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, user_id: (await supabase.auth.getUser()).data.user?.id }])
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  async updateProject(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  async upsertMilestone(milestone: Partial<Milestone>) {
    const { data, error } = await supabase
      .from('milestones')
      .upsert([milestone])
      .select()
      .single();

    if (error) throw error;
    return data as Milestone;
  },

  async deleteMilestone(id: string) {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateMilestoneOrder(milestones: { id: string; order: number }[]) {
    const { error } = await supabase
      .from('milestones')
      .upsert(milestones);

    if (error) throw error;
  },

  async cycleMilestoneStatus(id: string, currentStatus: string) {
    const statuses: Milestone['status'][] = ['pending', 'in_progress', 'review', 'done'];
    const currentIndex = statuses.indexOf(currentStatus as Milestone['status']);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    const { data, error } = await supabase
      .from('milestones')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Milestone;
  }
};
