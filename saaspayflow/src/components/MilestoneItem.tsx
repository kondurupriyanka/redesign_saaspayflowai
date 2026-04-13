import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle2, Circle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Milestone } from '@/lib/api/projects';
import { cn } from '@/lib/utils';

interface MilestoneItemProps {
  milestone: Milestone;
  onStatusCycle: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
}

export const MilestoneItem: React.FC<MilestoneItemProps> = ({ 
  milestone, 
  onStatusCycle, 
  onDelete 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0
  };

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-400" />;
      case 'review': return <AlertCircle className="w-5 h-5 text-orange-400" />;
      default: return <Circle className="w-5 h-5 text-zinc-600" />;
    }
  };

  const getStatusBadge = (status: Milestone['status']) => {
    switch (status) {
      case 'done': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Done</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">In Progress</Badge>;
      case 'review': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Review</Badge>;
      default: return <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">Pending</Badge>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-4 p-4 mb-2 bg-[#141B14] border border-zinc-800 rounded-xl group transition-all",
        isDragging && "opacity-50 ring-2 ring-emerald-500/50 scale-[1.02] shadow-2xl",
        milestone.status === 'done' && "bg-[#0A0F0A] border-emerald-900/20 opacity-90"
      )}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div 
        className="cursor-pointer transition-transform hover:scale-110"
        onClick={() => onStatusCycle(milestone.id, milestone.status)}
      >
        {getStatusIcon(milestone.status)}
      </div>

      <div className="flex-1">
        <h4 className={cn(
          "font-medium text-zinc-100",
          milestone.status === 'done' && "line-through text-zinc-500"
        )}>
          {milestone.title}
        </h4>
        {milestone.description && (
          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{milestone.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div 
          className="cursor-pointer"
          onClick={() => onStatusCycle(milestone.id, milestone.status)}
        >
          {getStatusBadge(milestone.status)}
        </div>
        <button
          onClick={() => onDelete(milestone.id)}
          className="p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete Milestone"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
