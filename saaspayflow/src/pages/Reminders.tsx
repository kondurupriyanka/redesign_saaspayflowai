import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteReminder, fetchReminders } from '@/lib/api/reminders';
import { DashboardLayout } from '@/components/DashboardLayout';
import { 
  Bell, History, Search, Filter, MoreHorizontal,
  Mail, MessageSquare, Smartphone, CheckCircle2,
  Clock, AlertCircle, Eye, AlertOctagon, ChevronRight,
  Zap, Send, Share2, Download, FilterX, Activity, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Reminder } from '@/lib/api/reminders';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_ICONS: Record<
  Reminder['status'],
  { icon: React.ElementType; color: string; bg: string; border: string }
> & {
  default: { icon: React.ElementType; color: string; bg: string; border: string };
} = {
  sent:      { icon: Send,          color: 'text-white/50',   bg: 'bg-white/5', border: 'border-white/10' },
  delivered: { icon: CheckCircle2,  color: 'text-[#A3FF3F]',  bg: 'bg-[#A3FF3F]/10', border: 'border-[#A3FF3F]/20' },
  failed:    { icon: AlertOctagon,  color: 'text-red-400',    bg: 'bg-red-400/10', border: 'border-red-500/20' },
  default:   { icon: Clock,         color: 'text-white/40',   bg: 'bg-white/5', border: 'border-white/10' }
};

const CHANNEL_ICONS: Record<NonNullable<Reminder['channel']>, React.ElementType> = {
  email:    Mail,
  whatsapp: MessageSquare,
  sms:      Smartphone
};

export default function Reminders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: realReminders, isLoading: isQueryLoading, error, refetch } = useQuery({
    queryKey: ['reminders'],
    queryFn: fetchReminders,
    enabled: !!user,
    retry: 1,
  });

  const reminders = realReminders;
  const isLoading = isQueryLoading;
  const reminderList = reminders ?? [];

  const deleteMutation = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast.success('Reminder deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DashboardLayout pageTitle="Reminders">
      <div className="max-w-7xl mx-auto py-6 px-6 space-y-6 text-[#FFFFFF]">
        
        {/* Intelligence Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 w-full max-w-xl">
             <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-700" />
             </div>
             <input 
               type="text" 
               placeholder="Search by client or invoice..." 
               className="w-full bg-[#0F1A12] border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium text-white placeholder:text-white/30 focus:outline-none focus:border-[#A3FF3F]/30 transition-all"
             />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" className="h-12 border-white/5 bg-[#0F1A12] px-6 text-xs font-medium hover:bg-white/5 text-[#9CA3AF] hover:text-white">
              <FilterX className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
            <Button className="h-12 bg-[#A3FF3F] hover:bg-[#86E025] text-[#0A0F0A] px-6 font-semibold text-xs shadow-[0_0_20px_rgba(163,255,63,0.2)]">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Transmission Timeline */}
        <Card className="bg-[#0F1A12] border-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/[0.03] bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#A3FF3F]/10 flex items-center justify-center">
                   <Activity className="w-5 h-5 text-[#A3FF3F]" />
                </div>
                <div>
                   <h3 className="text-sm font-semibold text-white">Reminder History</h3>
                   <p className="text-xs text-[#9CA3AF] mt-0.5">{reminderList.length} reminders sent</p>
                </div>
             </div>
          </div>

          <div className="divide-y divide-white/[0.03]">
            {isLoading ? (
              <div className="p-24 text-center">
               <div className="w-12 h-12 border-2 border-[#A3FF3F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                 <p className="text-sm text-[#9CA3AF] font-medium">Loading reminders...</p>
              </div>
            ) : error ? (
              <div className="p-24 text-center max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <div className="space-y-2">
                   <p className="text-xl font-semibold text-white">Timeline unavailable</p>
                   <p className="text-sm text-[#9CA3AF] leading-relaxed">
                     {(error as Error).message || 'We could not load reminder history right now.'}
                  </p>
                </div>
                <Button onClick={() => refetch()} className="bg-[#A3FF3F] text-[#0A0F0A] font-semibold text-xs px-8">
                  Retry Sync
                </Button>
              </div>
            ) : reminderList.length === 0 ? (
              <div className="p-24 text-center max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-20">
                  <Bell className="w-10 h-10 text-white" />
                </div>
                 <div>
                   <p className="text-xl font-semibold text-white">No reminders yet</p>
                   <p className="text-sm text-[#9CA3AF] leading-relaxed">Reminders will appear here once you send them from your invoices.</p>
                 </div>
                 <Link to="/invoices">
                   <Button className="bg-[#A3FF3F] text-[#0A0F0A] font-semibold text-xs px-8">View Invoices</Button>
                 </Link>
              </div>
            ) : (
              reminderList.map((rem: Reminder, idx) => {
                const s = STATUS_ICONS[rem.status] || STATUS_ICONS.default;
                const StatusIcon = s.icon;
                const ChannelIcon = CHANNEL_ICONS[rem.channel] || Mail;

                return (
                  <div key={rem.id} className="p-8 hover:bg-white/[0.01] transition-all group relative">
                    {/* Activity Indicator Line */}
                    {idx < reminderList.length - 1 && (
                      <div className="absolute left-[59px] top-[72px] bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent group-hover:from-[#A3FF3F]/30" />
                    )}

                    <div className="flex gap-8 relative z-10">
                      
                      {/* Node Node */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg border",
                          s.bg, s.border
                        )}>
                          <ChannelIcon className={cn("w-6 h-6", s.color)} />
                        </div>
                      </div>

                      {/* Packet Content */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-base font-semibold text-white">{rem.client_name}</h4>
                              <span className="w-1 h-1 rounded-full bg-gray-800" />
                              <span className="text-sm font-semibold text-[#A3FF3F] tabular-nums">
                                ₹{rem.amount?.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                               <Link
                                 to={`/invoices/${rem.invoice_id}`}
                                 className="text-xs font-semibold text-[#A3FF3F] hover:text-[#b8ff5c]"
                               >
                                 View Invoice
                               </Link>
                               <Badge variant="outline" className="border-white/10 bg-white/5 text-xs font-medium text-[#9CA3AF] py-0 px-2 h-5">
                                 CHANNEL: {rem.channel}
                               </Badge>
                               <Badge variant="outline" className="border-white/10 bg-white/5 text-xs font-medium text-[#9CA3AF] py-0 px-2 h-5">
                                 REF: {rem.invoice_number || rem.invoice_id.slice(0, 8)}
                               </Badge>
                               {rem.invoice_status && (
                                 <Badge variant="outline" className="border-white/10 bg-white/5 text-xs font-medium text-[#9CA3AF] py-0 px-2 h-5">
                                   INV: {rem.invoice_status}
                                 </Badge>
                               )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border",
                              s.bg, s.color, s.border
                            )}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {rem.status}
                            </div>
                            <div className="text-right hidden sm:block">
                               <p className="text-xs font-medium text-[#9CA3AF]">{format(new Date(rem.created_at), 'HH:mm')}</p>
                               <p className="text-xs text-[#9CA3AF]/60 mt-0.5">{format(new Date(rem.created_at), 'MMM d, yyyy')}</p>
                            </div>
                            <div className="relative flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setOpenMenuId(openMenuId === rem.id ? null : rem.id)}
                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-700 hover:text-white hover:bg-white/10 transition-all"
                              >
                                 <MoreHorizontal className="w-5 h-5" />
                              </button>
                              {openMenuId === rem.id && (
                                <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-white/10 bg-[#0F1A12] shadow-2xl shadow-black/60 overflow-hidden z-20">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      deleteMutation.mutate(rem.id);
                                    }}
                                    className="block w-full px-3 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-500/10"
                                  >
                                    Delete reminder
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Cipher Content */}
                        <div className="bg-[#0A0F0A] border border-white/5 border-l-[#A3FF3F]/30 border-l-2 rounded-2xl p-6 relative group/msg shadow-inner">
                          <p className="text-[13px] text-gray-400 font-medium leading-relaxed italic pr-12">
                            "{rem.message}"
                          </p>
                          <div className="absolute top-4 right-6">
                            <span className={cn(
                              "text-[9px] font-medium px-2.5 py-1 rounded-lg border",
                              rem.tone === 'serious' ? 'text-red-500 border-red-500/20 bg-red-500/5' :
                              rem.tone === 'firm' ? 'text-white/60 border-white/15 bg-white/5' :
                              'text-white/40 border-white/10 bg-white/5'
                            )}>
                              {rem.tone}
                            </span>
                            {rem.metadata?.escalation_level && (
                              <div className="mt-2 text-[9px] font-medium text-white/30 text-right">
                                Level {String(rem.metadata.escalation_level)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Intelligence Actions */}
                        <div className="flex items-center gap-8 pt-1">
                          <button className="flex items-center gap-2 text-xs font-medium text-[#9CA3AF] hover:text-[#A3FF3F] transition-all">
                            <Eye className="w-3.5 h-3.5" />
                            View Invoice
                          </button>
                          <button className="flex items-center gap-2 text-xs font-medium text-[#9CA3AF] hover:text-[#A3FF3F] transition-all">
                            <Share2 className="w-3.5 h-3.5" />
                            Resend
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>



      </div>
    </DashboardLayout>
  );
}
