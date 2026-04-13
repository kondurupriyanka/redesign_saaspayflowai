import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Settings, Calendar, Briefcase, AlertCircle,
  MessageSquare, CheckCircle2, Clock, ExternalLink,
  ChevronRight, TrendingUp, Loader2, Zap, Rocket, ShieldCheck,
  Target, Activity, Layers
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MilestoneList } from '@/components/MilestoneList';
import { ProjectSlideOver } from '@/components/ProjectSlideOver';
import { projectsApi } from '@/lib/api/projects';
import type { Project } from '@/lib/api/projects';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
 

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.fetchProjectDetail(id!),
    enabled: !!id && !!user
  });
  const displayProject = project;

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Analyzing Mission Parameters...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-2 border-[#A3FF3F] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(163,255,63,0.2)]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !displayProject) {
    return (
      <DashboardLayout pageTitle="Access Denied">
        <div className="p-12 text-center max-w-lg mx-auto space-y-6">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(239,68,68,0.1)]">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Project not found</h2>
            <p className="text-gray-500 font-medium">This project could not be retrieved.</p>
          </div>
          <Button onClick={() => navigate('/projects')} className="bg-white hover:bg-gray-200 text-[#0A0F0A] font-semibold px-8">
            Back to projects
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isInvoiceOverdue = displayProject.invoice?.status === 'overdue';

  return (
    <DashboardLayout pageTitle={displayProject.name}>
      <div className="max-w-7xl mx-auto py-6 px-6 space-y-6">
        
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button 
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-white transition-all group w-fit"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to projects
          </button>
          <div className="flex items-center gap-3">
             <Badge className="bg-[#A3FF3F]/10 text-[#A3FF3F] border-[#A3FF3F]/20 text-[10px] font-semibold px-3 py-1">
               ID: {displayProject.id.substring(0, 8)}
             </Badge>
             <button 
              onClick={() => setIsSlideOverOpen(true)}
              className="w-10 h-10 rounded-xl bg-[#0F1A12] border border-white/5 flex items-center justify-center text-gray-500 hover:text-[#A3FF3F] hover:border-[#A3FF3F]/30 hover:bg-[#A3FF3F]/5 transition-all"
             >
                <Settings className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <Card className="lg:col-span-3 bg-[#0F1A12] border-white/5 p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <Target className="w-48 h-48" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
                 <div className="space-y-4 flex-1">
                    <div className="space-y-2">
                       <Badge className={cn(
                        "text-[9px] font-semibold px-2.5 py-0.5 border",
                        displayProject.status === 'active' ? "bg-[#A3FF3F]/10 text-[#A3FF3F] border-[#A3FF3F]/20" : "bg-white/5 text-gray-500 border-white/10"
                       )}>
                        {displayProject.status}
                       </Badge>
                       <h1 className="text-4xl font-black text-white tracking-tighter leading-[0.9]">
                        {displayProject.name}
                       </h1>
                    </div>
                    
                    <p className="text-gray-400 font-medium leading-relaxed max-w-2xl">
                      {displayProject.description || 'No description provided.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-8 pt-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                             <Briefcase className="w-4 h-4 text-[#A3FF3F]" />
                          </div>
                          <div>
                             <p className="caption-md text-gray-500">Client</p>
                             <p className="text-sm font-bold text-white">{displayProject.client?.name}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                             <Calendar className="w-4 h-4 text-[#A3FF3F]" />
                          </div>
                          <div>
                             <p className="caption-md text-gray-500">Start date</p>
                             <p className="text-sm font-bold text-white">{displayProject.created_at ? format(new Date(displayProject.created_at), 'MMM d, yyyy') : 'Recently'}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="w-full md:w-64 space-y-5 bg-[#0A0F0A]/50 border border-white/5 p-6 rounded-2xl">
                    <div className="flex justify-between items-end">
                       <p className="caption-md text-gray-500">Progress</p>
                       <span className="text-2xl font-black text-[#A3FF3F] italic tracking-tighter tabular-nums">{Math.round(displayProject.progress_percent)}%</span>
                    </div>
                    <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                       <div 
                        className="absolute inset-y-0 left-0 bg-[#A3FF3F] rounded-full shadow-[0_0_15px_#A3FF3F]"
                        style={{ width: `${displayProject.progress_percent}%` }}
                       />
                    </div>
                    <Button 
                      onClick={() => setIsSlideOverOpen(true)}
                      className="w-full h-11 bg-white hover:bg-gray-200 text-[#0A0F0A] font-semibold text-sm"
                    >
                      Edit project
                    </Button>
                 </div>
              </div>
           </Card>

           <div className="space-y-6">
              <Card className={cn(
                "bg-[#0F1A12] border-white/5 p-6 space-y-4 relative overflow-hidden group",
                isInvoiceOverdue && "border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.05)]"
              )}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Zap className={cn("w-3.5 h-3.5", isInvoiceOverdue ? "text-red-500" : "text-[#A3FF3F]")} />
                       <span className="caption-md text-white">Linked invoice</span>
                    </div>
                 </div>

                 {displayProject.invoice ? (
                   <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                           <p className="caption-md text-gray-500">Invoice</p>
                           <h4 className="font-black text-white tracking-tight">{displayProject.invoice.invoice_number}</h4>
                        </div>
                        <Badge className={cn(
                          "text-[9px] font-semibold px-2 py-0.5",
                          displayProject.invoice.status === 'paid' ? "bg-[#A3FF3F]/10 text-[#A3FF3F]" :
                          displayProject.invoice.status === 'overdue' ? "bg-red-500/10 text-red-500 animate-pulse" :
                          "bg-white/5 text-gray-500"
                        )}>
                          {displayProject.invoice.status}
                        </Badge>
                      </div>

                      {isInvoiceOverdue && (
                        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-3">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-red-400 font-medium leading-4">
                            Payment deadline missed. Capital at risk.
                          </p>
                        </div>
                      )}

                      <Button 
                        variant="link" 
                        onClick={() => navigate(`/invoices`)}
                        className="w-full text-[9px] font-medium text-gray-500 hover:text-[#A3FF3F] justify-between h-auto p-0"
                      >
                        View invoice <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                   </div>
                 ) : (
                   <div className="py-6 text-center space-y-3 border border-dashed border-white/5 rounded-xl">
                      <p className="text-[10px] font-medium text-gray-600">No invoice linked</p>
                      <Button variant="link" className="text-[#A3FF3F] h-auto p-0 text-[10px] font-medium">Link invoice →</Button>
                   </div>
                 )}
              </Card>

              <Card className="bg-[#0F1A12] border-white/5 p-6 space-y-4 relative overflow-hidden group">
                <div className="flex items-center gap-2">
                   <MessageSquare className="w-3.5 h-3.5 text-[#A3FF3F]" />
                   <span className="caption-md text-white">Client feedback</span>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-[#0A0F0A] rounded-xl border border-white/5 italic text-[11px] text-gray-400 font-medium leading-relaxed">
                    "Excited to see the UX wireframes. Looking forward to the interactive prototype!"
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-gray-600 font-medium">
                    <span>Received</span>
                    <span>2 days ago</span>
                  </div>
                </div>
              </Card>
           </div>
        </div>

        {/* Milestone Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-3 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Activity className="w-4 h-4 text-[#A3FF3F]" />
                   <h2 className="text-sm font-semibold text-white">Milestones</h2>
                </div>
                <Badge className="bg-white/5 text-gray-500 border-white/10 text-[9px] font-medium">
                  {displayProject.milestones?.length || 0} phases
                </Badge>
             </div>

             <Card className="bg-[#0F1A12] border-white/5 overflow-hidden">
                <div className="p-8">
                  <MilestoneList 
                    projectId={displayProject.id} 
                    milestones={displayProject.milestones || []} 
                    onUpdate={() => refetch()}
                  />
                </div>
             </Card>
           </div>
        </div>
      </div>

      <ProjectSlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        onSuccess={() => refetch()} 
        project={displayProject}
      />
    </DashboardLayout>
  );
};

export default ProjectDetail;
