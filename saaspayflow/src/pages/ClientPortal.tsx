import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  CreditCard,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Wallet,
  Zap,
  Lock,
  Download
} from 'lucide-react';
import { fetchPortalData, submitDelayReason, PortalData, PortalInvoice, PortalProject } from '@/lib/api/portal';
import { completePortalPayment } from '@/lib/api/payments';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ClientPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [showDelayForm, setShowDelayForm] = useState<string | null>(null);
  const [delayReason, setDelayReason] = useState('revision');
  const [customReason, setCustomReason] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const loadPortalData = useCallback(async () => {
    setLoading(true);

    try {
      const result = await fetchPortalData(token!);
      if (result) {
        setData(result);
      } else {
        toast.error('This link has expired or is invalid.');
      }
    } catch (error) {
      console.error('Portal load error:', error);
      toast.error('Failed to load portal. Contact your freelancer.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      void loadPortalData();
    }
  }, [token, loadPortalData]);

  const handleSubmitDelay = async (invoiceId: string) => {
    if (!data) return;
    setSubmitting(true);
    try {
      await submitDelayReason({
        invoice_id: invoiceId,
        client_id: data.client_id,
        reason_type: delayReason,
        custom_reason: delayReason === 'other' ? customReason : undefined,
        scheduled_date: delayReason === 'scheduled' ? scheduledDate : undefined,
        freelancer_id: data.freelancer_id
      });
      toast.success('Thanks, your freelancer has been notified.');
      setShowDelayForm(null);
    } catch (error) {
      console.error('Submit delay error:', error);
      toast.error('Failed to submit message.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayNow = async (invoice: PortalInvoice) => {
    if (!token) return;
    setPayingInvoiceId(invoice.id);
    try {
      await completePortalPayment({
        token,
        invoice_id: invoice.id,
        amount: Number(invoice.amount),
        method: 'card',
        reference: `Portal payment for ${invoice.invoice_number}`,
        notes: 'Paid from client portal',
      });
      toast.success('Payment completed successfully.');
      await loadPortalData();
    } catch (error) {
      console.error('Portal payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed.');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F0A] p-8 max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-12 w-48 bg-white/5" />
        <Skeleton className="h-24 w-full bg-white/5" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full bg-white/5" />
          <Skeleton className="h-32 w-full bg-white/5" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0F0A] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0F1A12] rounded-3xl p-10 shadow-2xl border border-white/5 text-center space-y-6">
          <div className="bg-red-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Access Expired</h1>
          <p className="text-gray-400 leading-relaxed text-sm">
            This secure interface session has expired for security reasons. 
            Please contact <span className="text-white font-medium">{data?.freelancer_name || 'your freelancer'}</span> to request a new access link.
          </p>
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium">Secured by PayFlow AI</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F0A] font-sans text-gray-100 selection:bg-[#A3FF3F]/30 selection:text-white">
      {/* Premium Header */}
      <header className="bg-[#0A0F0A]/80 backdrop-blur-md border-b border-white/5 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#A3FF3F] to-[#86E025] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(163,255,63,0.3)] transition-transform group-hover:scale-105">
              <Zap className="w-5 h-5 text-[#0A0F0A] fill-current" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-bold text-lg tracking-tight text-white">PayFlow</span>
              <span className="text-[10px] uppercase tracking-widest text-[#A3FF3F] font-bold">Secure Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#A3FF3F] animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Security</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A3FF3F]/20 to-transparent border border-[#A3FF3F]/30 flex items-center justify-center text-[#A3FF3F] text-xs font-bold">
              {data.client_name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-6 space-y-12">
        {/* Welcome Block */}
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0F1A12] p-8 sm:p-12 mb-12 group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-32 h-32 text-[#A3FF3F]" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-4">
            <Badge className="bg-[#A3FF3F]/10 text-[#A3FF3F] border-[#A3FF3F]/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
              Verified Client Portal
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter leading-tight">
              Welcome back, {data.client_name.split(' ')[0]}
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Review your project milestones and securely manage outstanding payments for work with <span className="text-white font-bold">{data.freelancer_name}</span>.
            </p>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-[#0F1A12] border-white/5 p-6 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Total Balance</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">${data.invoices.reduce((acc, i) => i.status !== 'paid' ? acc + i.amount : acc, 0).toLocaleString()}</p>
              <Badge className="bg-white/5 text-white/50 border-none text-[10px] font-bold">Pending</Badge>
            </div>
          </Card>
          <Card className="bg-[#0F1A12] border-white/5 p-6 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Active Projects</p>
            <p className="text-3xl font-bold text-white tracking-tight">{data.projects.length}</p>
          </Card>
          <Card className="bg-[#0F1A12] border-white/5 p-6 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Current Milestone</p>
            <p className="text-lg font-bold text-white truncate">{data.projects[0]?.milestones?.find(m => m.status === 'in_progress')?.title || 'Finalizing'}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Outstanding Invoices - Left Col (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#A3FF3F]" />
                Invoices
              </h2>
              <span className="text-xs text-gray-500 font-medium">Auto-renewing every 30 days</span>
            </div>

            <div className="space-y-4">
              {data.invoices.map((invoice) => (
                <Card 
                  key={invoice.id} 
                  className={cn(
                    "overflow-hidden transition-all duration-300 border bg-[#0F1A12] group/card",
                    invoice.status === 'overdue' ? "border-red-500/30 hover:border-red-500/50" : "border-white/5 hover:border-[#A3FF3F]/30"
                  )}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded border",
                            invoice.status === 'overdue' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/10 text-gray-400"
                          )}>
                            {invoice.invoice_number}
                          </span>
                          {invoice.status === 'overdue' && (
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                              <span className="text-[10px] uppercase font-black text-red-500 tracking-tighter">Immediate Attention</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover/card:text-[#A3FF3F] transition-colors line-clamp-1">{invoice.description || 'Professional Services'}</h3>
                        <div className="flex items-center gap-6 text-xs font-bold text-gray-500">
                          <span className="flex items-center gap-2 text-white">
                            <Wallet className="w-3.5 h-3.5 text-[#A3FF3F]" />
                            ${Number(invoice.amount).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            Due {new Date(invoice.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-400 hover:text-white hover:bg-white/5 font-bold h-11 px-6 rounded-xl border border-white/5"
                          onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                        >
                          {expandedInvoice === invoice.id ? 'Hide Details' : 'View Breakdown'}
                        </Button>
                        
                        {invoice.status !== 'paid' ? (
                          <Button 
                            className="bg-[#A3FF3F] hover:bg-[#86E025] text-[#0A0F0A] px-8 h-11 rounded-xl font-bold shadow-[0_0_20px_rgba(163,255,63,0.15)] group-hover/card:shadow-[0_0_25px_rgba(163,255,63,0.3)] transition-all active:scale-95"
                            onClick={() => handlePayNow(invoice)}
                            disabled={payingInvoiceId === invoice.id}
                          >
                            {payingInvoiceId === invoice.id ? 'Processing...' : 'Pay Now'}
                          </Button>
                        ) : (
                          <Badge className="bg-[#A3FF3F]/10 text-[#A3FF3F] flex items-center gap-1.5 font-bold border-[#A3FF3F]/20 py-2 px-4 rounded-xl">
                            <CheckCircle2 className="w-4 h-4" /> Paid
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Expandable Details Area */}
                    {expandedInvoice === invoice.id && (
                      <div className="mt-8 pt-8 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Service Context</h4>
                            <p className="text-gray-400 leading-relaxed text-sm font-medium italic">
                              "Professional design and engineering services as outlined in the master service agreement. This covers the current sprint deliverables and milestone sign-off."
                            </p>
                            <div className="flex gap-4">
                              <Button variant="outline" className="h-9 border-white/5 bg-white/5 text-gray-300 gap-2 font-bold text-xs">
                                <Download className="w-3.5 h-3.5" /> PDF
                              </Button>
                              <Button variant="outline" className="h-9 border-white/5 bg-white/5 text-gray-300 gap-2 font-bold text-xs">
                                <ExternalLink className="w-3.5 h-3.5" /> Receipt
                              </Button>
                            </div>
                          </div>
                          <div className="bg-[#0A0F0A]/50 p-6 rounded-2xl border border-white/5">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Financial Summary</h4>
                            <div className="space-y-3 font-bold text-sm">
                              <div className="flex justify-between text-gray-400">
                                <span>Platform Processing</span>
                                <span className="text-white">$0.00</span>
                              </div>
                              <div className="flex justify-between text-gray-400">
                                <span>Service Subtotal</span>
                                <span className="text-white">${Number(invoice.amount).toLocaleString()}</span>
                              </div>
                              <div className="pt-3 mt-3 border-t border-white/5 flex justify-between text-lg text-[#A3FF3F]">
                                <span>Total Payable</span>
                                <span>${Number(invoice.amount).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Payment Support / Communication */}
                        {invoice.status === 'overdue' && (
                          <div className="space-y-4">
                            <Button 
                              variant="ghost" 
                              className={cn(
                                "w-full justify-between h-14 rounded-2xl border border-dashed text-gray-400 hover:text-white transition-all font-bold px-6",
                                showDelayForm === invoice.id ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 hover:bg-white/[0.07]"
                              )}
                              onClick={() => setShowDelayForm(showDelayForm === invoice.id ? null : invoice.id)}
                            >
                              <span className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-red-500" />
                                Can't pay this invoice right now?
                              </span>
                              {showDelayForm === invoice.id ? <ChevronUp className="w-5 h-5" /> : <ArrowRight className="w-5 h-5 text-gray-600" />}
                            </Button>

                            {showDelayForm === invoice.id && (
                              <Card className="border-white/5 bg-[#0A0F0A] shadow-2xl rounded-3xl animate-in zoom-in-95 duration-300 overflow-hidden">
                                <CardContent className="p-8 space-y-8">
                                  <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                      { value: 'completion', label: 'Waiting for project completion' },
                                      { value: 'revision', label: 'Need a revision first' },
                                      { value: 'scheduled', label: 'Payment scheduled' },
                                      { value: 'cash_flow', label: 'Cash flow issue this month' },
                                      { value: 'error', label: 'Invoice has an error' },
                                      { value: 'other', label: 'Other' },
                                    ].map((option) => (
                                      <label 
                                        key={option.value}
                                        className={cn(
                                          "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer font-bold relative group/label",
                                          delayReason === option.value 
                                            ? "bg-[#A3FF3F]/5 border-[#A3FF3F]/30 text-white" 
                                            : "bg-[#0F1A12] border-white/5 text-gray-500 hover:border-white/10"
                                        )}
                                      >
                                        <div className={cn(
                                          "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                                          delayReason === option.value ? "border-[#A3FF3F] bg-[#A3FF3F]" : "border-gray-700 bg-transparent"
                                        )}>
                                          {delayReason === option.value && <div className="w-1.5 h-1.5 rounded-full bg-[#0A0F0A]" />}
                                        </div>
                                        <input 
                                          type="radio" 
                                          name="delayReason" 
                                          value={option.value}
                                          checked={delayReason === option.value}
                                          onChange={(e) => setDelayReason(e.target.value)}
                                          className="sr-only"
                                        />
                                        <span className="text-xs uppercase tracking-tight">{option.label}</span>
                                      </label>
                                    ))}
                                  </div>

                                  {delayReason === 'scheduled' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-left-4">
                                      <label className="text-[10px] font-black text-gray-500 flex items-center gap-2 uppercase tracking-[0.2em]"><Calendar className="w-3.5 h-3.5" /> Rescheduled Payment Date</label>
                                      <input 
                                        type="date" 
                                        className="w-full h-14 bg-[#0F1A12] border border-white/10 rounded-2xl px-6 font-bold text-white focus:outline-none focus:border-[#A3FF3F]/50 transition-colors"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                      />
                                    </div>
                                  )}

                                  {delayReason === 'other' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-left-4">
                                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Detailed Reasoning</label>
                                      <textarea 
                                        placeholder="Explain the situation briefly..."
                                        className="w-full h-32 bg-[#0F1A12] border border-white/10 rounded-2xl p-6 font-bold text-white placeholder:text-gray-700 focus:outline-none focus:border-[#A3FF3F]/50 transition-colors resize-none"
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                      />
                                    </div>
                                  )}

                                  <div className="flex gap-4 pt-4">
                                    <Button 
                                      className="flex-1 bg-white hover:bg-gray-200 text-[#0A0F0A] h-14 rounded-2xl font-black transition-all active:scale-95"
                                      onClick={() => handleSubmitDelay(invoice.id)}
                                      disabled={submitting}
                                    >
                                      {submitting ? 'Transmitting...' : 'Update Status'}
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      className="h-14 px-8 rounded-2xl font-bold text-gray-500 hover:text-white"
                                      onClick={() => setShowDelayForm(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Project Hub - Right Col (1/3) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-[#A3FF3F]" />
              Project Hub
            </h2>
            
            {data.projects.map((project) => (
              <Card key={project.id} className="bg-[#0F1A12] border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 p-4">
                  <Badge className="bg-[#A3FF3F]/5 text-[#A3FF3F] border border-[#A3FF3F]/20 text-[10px] font-black uppercase tracking-widest">Live</Badge>
                </div>
                <div className="p-8 space-y-8">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-white tracking-tight leading-none group-hover:text-[#A3FF3F] transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                      {project.description || 'Deep integration and ecosystem engineering for scalable growth.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A3FF3F]">Overall Health</span>
                        <p className="text-xl font-bold text-white">{Math.round(project.progress_percent)}%</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-1 bg-white/5 rounded border border-white/5">
                        {project.milestones?.filter(m => m.status === 'done').length || 0} / {project.milestones?.length || 0} Done
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#0A0F0A] rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-[#A3FF3F]/10 to-[#A3FF3F] rounded-full relative transition-all duration-1000 ease-out" 
                        style={{ width: `${project.progress_percent}%` }}
                      >
                        <div className="absolute right-0 top-0 h-full w-4 bg-white/20 blur-sm animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Master Timeline</h4>
                    <div className="space-y-4">
                      {project.milestones?.map((milestone, idx) => (
                        <div key={milestone.id} className="flex items-center gap-4 group/milestone">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center border font-bold text-xs transition-all duration-300",
                            milestone.status === 'done' 
                              ? "bg-[#A3FF3F] border-[#A3FF3F] text-[#0A0F0A] shadow-[0_0_15px_rgba(163,255,63,0.3)]" 
                              : milestone.status === 'in_progress' 
                                ? "bg-[#0F1A12] border-[#A3FF3F]/50 text-[#A3FF3F]" 
                                : "bg-[#0A0F0A] border-white/5 text-gray-600"
                          )}>
                            {milestone.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div className="flex-1 flex flex-col -space-y-1">
                            <span className={cn(
                              "font-bold text-sm transition-all",
                              milestone.status === 'done' ? "text-gray-500 line-through decoration-[#A3FF3F]/30" : "text-white"
                            )}>
                              {milestone.title}
                            </span>
                            {milestone.status === 'in_progress' && (
                              <span className="text-[9px] font-black text-[#A3FF3F] uppercase tracking-widest animate-pulse">Running</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="bg-gradient-to-br from-[#0F1A12] to-[#0A0F0A] border-white/10 p-8 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#A3FF3F]/10 border border-[#A3FF3F]/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#A3FF3F]" />
              </div>
              <h4 className="text-lg font-bold text-white tracking-tight">Enterprise Security</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Your data is protected by 256-bit AES encryption. This portal is a secure, single-use interface for sensitive financial communication.
              </p>
            </Card>
          </div>
        </div>
      </main>

      <footer className="footer-info py-16 px-8 text-center bg-[#0A0F0A] border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/5 opacity-50">
            <ShieldCheck className="w-4 h-4 text-[#A3FF3F]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">PayFlow AI Secure Portal • v1.0.4</p>
          </div>
          <p className="text-xs text-gray-600 font-medium max-w-sm">
            © 2026 PayFlow AI Systems. All rights reserved. Access to this terminal is restricted to authorized entities only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ClientPortal;
