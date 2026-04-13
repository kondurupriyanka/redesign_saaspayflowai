import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Briefcase, CheckCircle2, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '@/lib/api/projects';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'on_hold': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <Card 
      className="bg-[#0F1A12] border-white/5 hover:border-[#A3FF3F]/30 transition-all duration-300 cursor-pointer group hover:scale-[1.02] shadow-xl overflow-hidden"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <CardHeader className="pb-3 pt-6 px-6">
        <div className="flex justify-between items-start mb-4">
          <Badge className={cn(
            "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border",
            getStatusColor(project.status)
          )}>
            {project.status.replace('_', ' ')}
          </Badge>
          {project.invoice && (
            <div className="text-[10px] text-[#9CA3AF]/60 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#A3FF3F]/40" />
              {project.invoice.invoice_number}
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-white group-hover:text-[#A3FF3F] transition-colors line-clamp-1 mb-1 tracking-tight">
          {project.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
          <div className="w-5 h-5 rounded-full bg-[#A3FF3F]/10 flex items-center justify-center">
            <Users className="w-3 h-3 text-[#A3FF3F]" />
          </div>
          <span className="font-medium">{project.client?.name || 'Client not assigned'}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-[#9CA3AF]/60">
            <span>Execution Progress</span>
            <span className="text-[#A3FF3F]">{Math.round(project.progress_percent)}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#0A0F0A] rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-[#A3FF3F] rounded-full shadow-[0_0_10px_rgba(163,255,63,0.3)] transition-all duration-500"
              style={{ width: `${project.progress_percent}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#A3FF3F]/60" />
            <span>Steps: {project.milestones?.length || 0}</span>
          </div>
          {project.invoice && (
            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]/80">
              <Briefcase className="w-3.5 h-3.5 text-[#A3FF3F]/60" />
              <span className={cn(
                "transition-colors",
                project.invoice.status === 'overdue' ? 'text-red-400' : ''
              )}>
                {project.invoice.status === 'overdue' ? 'Status: Risk' : `Status: ${project.invoice.status}`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
