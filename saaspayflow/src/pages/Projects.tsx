import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  Briefcase, 
  LayoutGrid, 
  List, 
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectSlideOver } from '@/components/ProjectSlideOver';
import { projectsApi } from '@/lib/api/projects';
import type { Project } from '@/lib/api/projects';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export const Projects: React.FC = () => {
  const { user } = useAuth();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.fetchProjects,
    enabled: !!user
  });

  const projects = data || [];

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                           p.client?.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && p.status === 'active') ||
                           (statusFilter === 'completed' && p.status === 'completed');
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  return (
    <DashboardLayout pageTitle="Projects">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Projects</h1>
          <p className="text-[#9CA3AF] mt-1 text-sm">Track milestones, monitor progress, and ensure timely delivery.</p>
        </div>
        
        <Button 
          onClick={() => setIsSlideOverOpen(true)}
          className="inline-flex items-center px-6 py-3 bg-[#A3FF3F] text-[#0A0F0A] font-bold rounded-xl hover:bg-[#8CE62E] transition-all shadow-[0_0_20px_rgba(163,255,63,0.3)] active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters/Actions Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-6 bg-[#0F1A12] p-2 rounded-2xl border border-white/5 mb-8">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]/40" />
          <Input 
            placeholder="Search projects or clients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0A0F0A] border-white/5 text-white pl-11 h-11 rounded-xl w-full placeholder-[#9CA3AF]/30 focus:border-[#A3FF3F]/40 transition-all font-medium"
          />
        </div>

        <Tabs 
          value={statusFilter} 
          onValueChange={(v: any) => setStatusFilter(v)}
          className="w-full lg:w-auto"
        >
          <TabsList className="bg-[#0A0F0A] border border-white/5 h-11 rounded-xl p-1 gap-1">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-[#A3FF3F] data-[state=active]:text-[#0A0F0A] text-[#9CA3AF] px-5 font-medium text-xs transition-all">All</TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-[#A3FF3F] data-[state=active]:text-[#0A0F0A] text-[#9CA3AF] px-5 font-medium text-xs transition-all">Active</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-[#A3FF3F] data-[state=active]:text-[#0A0F0A] text-[#9CA3AF] px-5 font-medium text-xs transition-all">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="h-8 w-px bg-white/5 hidden lg:block" />

        <div className="flex items-center bg-[#0A0F0A] border border-white/5 rounded-xl p-1 h-11">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('grid')}
            className={cn("h-9 w-11 p-0 rounded-lg transition-all", viewMode === 'grid' ? "bg-[#A3FF3F]/10 text-[#A3FF3F]" : "text-[#9CA3AF] hover:text-white")}
          >
            <LayoutGrid className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('list')}
            className={cn("h-9 w-11 p-0 rounded-lg transition-all", viewMode === 'list' ? "bg-[#A3FF3F]/10 text-[#A3FF3F]" : "text-[#9CA3AF] hover:text-white")}
          >
            <List className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 animate-pulse space-y-4 bg-[#0F1A12] border border-white/5 rounded-2xl">
          <Loader2 className="w-10 h-10 text-[#A3FF3F] animate-spin" />
          <p className="text-[#9CA3AF] font-medium tracking-tight">Loading projects...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <p className="text-red-300 font-medium">{(error as any).message || 'Failed to load projects.'}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-[#0F1A12] border border-white/5 rounded-2xl shadow-xl">
          <div className="w-24 h-24 bg-[#0A0F0A] border border-white/5 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
            <Briefcase className="w-10 h-10 text-[#A3FF3F]/20" />
          </div>
          <h3 className="text-xl font-semibold text-white tracking-tight">No projects yet</h3>
          <p className="text-[#9CA3AF] max-w-sm mt-3 text-sm leading-relaxed">
            {search ? `No projects matching "${search}".` : "Create your first project to start tracking scope, milestones, and client work."}
          </p>
          {!search && (
            <Button 
              variant="link" 
              onClick={() => setIsSlideOverOpen(true)}
              className="text-[#A3FF3F] hover:text-[#8CE62E] mt-6 font-bold flex items-center gap-2 group transition-all"
            >
              Create Project 
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          "grid gap-8",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <ProjectSlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        onSuccess={() => refetch()} 
      />
    </DashboardLayout>
  );
};

export default Projects;
