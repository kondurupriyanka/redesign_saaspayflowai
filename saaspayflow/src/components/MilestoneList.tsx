import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Badge } from '@/components/ui/badge';
import { MilestoneItem } from './MilestoneItem';
import { projectsApi } from '@/lib/api/projects';
import type { Milestone } from '@/lib/api/projects';
import { Plus, CheckCircle2, Circle, Clock, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MilestoneListProps {
  projectId: string;
  milestones: Milestone[];
  onUpdate: () => void;
}

export const MilestoneList: React.FC<MilestoneListProps> = ({ 
  projectId, 
  milestones, 
  onUpdate 
}) => {
  const [newMilestone, setNewMilestone] = useState('');
  const [adding, setAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = milestones.findIndex((m) => m.id === active.id);
      const newIndex = milestones.findIndex((m) => m.id === over.id);

      const newOrderedList = arrayMove(milestones, oldIndex, newIndex);
      
      // Update locally first for smooth UI
      // We don't have local state here since it comes from props, 
      // but in a real app we'd use optimistic updates.
      
      try {
        const updatePayload = newOrderedList.map((m, index) => ({
          id: m.id,
          order: index
        }));
        await projectsApi.updateMilestoneOrder(updatePayload);
        onUpdate();
      } catch (error) {
        toast.error('Failed to reorder milestones');
      }
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.trim()) return;

    setAdding(true);
    try {
      await projectsApi.upsertMilestone({
        project_id: projectId,
        title: newMilestone.trim(),
        order: milestones.length,
        status: 'pending'
      });
      setNewMilestone('');
      toast.success('Milestone added');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add milestone');
    } finally {
      setAdding(false);
    }
  };

  const handleStatusCycle = async (id: string, currentStatus: string) => {
    try {
      await projectsApi.cycleMilestoneStatus(id, currentStatus);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await projectsApi.deleteMilestone(id);
      toast.success('Milestone deleted');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete milestone');
    }
  };

  const completedCount = milestones.filter(m => m.status === 'done').length;
  const progressPercent = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          Milestones
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
            {completedCount}/{milestones.length}
          </Badge>
        </h3>
        {milestones.length > 0 && (
          <div className="text-xs text-zinc-500 font-medium italic">
            Tip: Drag items to reorder · Click status to cycle
          </div>
        )}
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={milestones.map(m => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {milestones.map((milestone) => (
              <MilestoneItem 
                key={milestone.id} 
                milestone={milestone}
                onStatusCycle={handleStatusCycle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {milestones.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-[#0D120D] border border-dashed border-zinc-800 rounded-2xl text-center space-y-4">
          <div className="p-4 bg-zinc-900/50 rounded-full">
            <Info className="w-8 h-8 text-zinc-700" />
          </div>
          <div>
            <h4 className="text-zinc-300 font-medium">No milestones yet</h4>
            <p className="text-sm text-zinc-500 mt-1 max-w-xs">
              Break down this project into manageable steps to track real-time progress.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleAddMilestone} className="flex gap-2 p-2 bg-[#0A0F0A] border border-zinc-800 rounded-xl">
        <Input
          placeholder="New milestone title..."
          value={newMilestone}
          onChange={(e) => setNewMilestone(e.target.value)}
          disabled={adding}
          className="bg-transparent border-none text-zinc-100 focus-visible:ring-0 placeholder:text-zinc-600"
        />
        <Button 
          type="submit" 
          disabled={adding || !newMilestone.trim()}
          size="sm"
          className="bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 px-4"
        >
          {adding ? '...' : <Plus className="w-4 h-4 mr-1" />}
          Add Milestone
        </Button>
      </form>
    </div>
  );
};
