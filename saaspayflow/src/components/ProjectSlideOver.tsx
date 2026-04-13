import React, { useEffect, useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { projectsApi } from '@/lib/api/projects';
import type { Project } from '@/lib/api/projects';
import { fetchClients } from '@/lib/api/clients';
import type { Client } from '@/lib/api/clients';
import { fetchInvoices } from '@/lib/api/invoices';
import type { Invoice } from '@/lib/api/invoices';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProjectSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: Project | null;
}

export const ProjectSlideOver: React.FC<ProjectSlideOverProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  project 
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    client_id: '',
    invoice_id: '',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    if (isOpen) {
      let active = true;
      setLoadingData(true);
      (async () => {
        await loadInitialData();
        if (!active) return;
        if (project) {
          setFormData({
            name: project.name,
            client_id: project.client_id,
            invoice_id: project.invoice_id || '',
            description: project.description || '',
            status: project.status
          });
        } else {
          setFormData({
            name: '',
            client_id: '',
            invoice_id: '',
            description: '',
            status: 'active'
          });
        }
      })().finally(() => {
        if (active) setLoadingData(false);
      });
      return () => {
        active = false;
      };
    }
  }, [isOpen, project]);

  const loadInitialData = async () => {
    try {
      const [clientsData, invoicesData] = await Promise.all([
        fetchClients(),
        fetchInvoices()
      ]);
      setClients(clientsData);
      // Only show unpaid/pending invoices for selection
      setInvoices(invoicesData.filter(inv => inv.status !== 'paid'));
    } catch (error) {
      console.error('Error loading form data:', error);
      toast.error('Unable to load project form data');
    } finally {
      // handled by the open-state effect
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.client_id) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      if (project) {
        await projectsApi.updateProject(project.id, formData);
        toast.success('Project updated successfully');
      } else {
        await projectsApi.createProject(formData);
        toast.success('Project created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="bg-[#0A0F0A] border-zinc-800 text-zinc-100 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-zinc-100 italic">
            {project ? 'Edit Project' : 'New Project'}
          </SheetTitle>
          <SheetDescription className="text-zinc-400">
            {project ? 'Update project details and link resources.' : 'Create a new project to track milestones and progress.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Website Redesign"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-[#141B14] border-zinc-800 text-zinc-100 focus:border-emerald-500/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select 
              value={formData.client_id} 
              onValueChange={(val) => setFormData({ ...formData, client_id: val })}
              disabled={loadingData || clients.length === 0}
            >
              <SelectTrigger id="client" className="bg-[#141B14] border-zinc-800 text-zinc-100">
                <SelectValue placeholder={loadingData ? 'Loading...' : clients.length === 0 ? 'Add a client first' : 'Select a client'} />
              </SelectTrigger>
              <SelectContent className="bg-[#141B14] border-zinc-800 text-zinc-100">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.company_name ? `(${client.company_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingData ? (
              <p className="text-xs text-zinc-500">Loading clients...</p>
            ) : clients.length === 0 ? (
              <p className="text-xs text-zinc-500">
                No clients found. <Link to="/clients" className="text-emerald-400 hover:underline">Add a client first</Link>.
              </p>
            ) : null}
          </div>

          {loadingData && (
            <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="h-3 w-28 rounded bg-white/10 animate-pulse" />
              <div className="h-10 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-36 rounded bg-white/10 animate-pulse" />
            </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="invoice">Link to Invoice (Optional)</Label>
            <Select 
              value={formData.invoice_id || 'none'} 
              onValueChange={(val) => setFormData({ ...formData, invoice_id: val === 'none' ? undefined : val })}
            >
              <SelectTrigger id="invoice" className="bg-[#141B14] border-zinc-800 text-zinc-100">
                <SelectValue placeholder="Select an invoice" />
              </SelectTrigger>
              <SelectContent className="bg-[#141B14] border-zinc-800 text-zinc-100">
                <SelectItem value="none">No invoice</SelectItem>
                {invoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoice_number} - {inv.client?.name} (${Number(inv.amount).toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Project Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(val: any) => setFormData({ ...formData, status: val })}
            >
              <SelectTrigger id="status" className="bg-[#141B14] border-zinc-800 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#141B14] border-zinc-800 text-zinc-100">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Project overview and notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-[#141B14] border-zinc-800 text-zinc-100 min-h-[100px]"
            />
          </div>

          <SheetFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-zinc-800 text-zinc-400 hover:text-zinc-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                project ? 'Update Project' : 'Create Project'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
