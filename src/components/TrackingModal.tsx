import React, { useState, useMemo } from 'react';
import { ServiceRequest, AdminClientInteractionThread, InteractionDocument, DirectInteractionMessage, UserProfile } from '../types';
import { AdminClientInteractionHub } from './AdminClientInteractionHub';
import { getTrackingShareUrl } from '../lib/shareUtils';
import { getBrasiliaDateString, getBrasiliaTimeString, getBrasiliaFullDateTimeString } from '../lib/brasiliaTime';
import {
  X,
  ClipboardList,
  CheckCircle2,
  Check,
  Clock,
  MapPin,
  Phone,
  User,
  Star,
  Zap,
  Calendar,
  AlertCircle,
  Download,
  Share2,
  Camera,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  DollarSign,
  CreditCard,
  QrCode,
  Receipt,
  MessageSquare,
  Lock,
  Search,
  KeyRound,
  Trash2
} from 'lucide-react';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ServiceRequest[];
  onOpenNewService: () => void;
  onOpenCompletionPhotos?: (request: ServiceRequest, canUpload: boolean) => void;
  onOpenPayment?: (request: ServiceRequest) => void;
  onApproveBudgetAndPay?: (request: ServiceRequest) => void;
  onUpdateGpsLocation?: (requestId: string, newGps: NonNullable<ServiceRequest['gpsTracking']>) => void;
  onDeleteRequest?: (requestId: string) => void;
  interactionThreads?: AdminClientInteractionThread[];
  onTransmitDocument?: (threadId: string, doc: InteractionDocument) => void;
  onSendMessage?: (threadId: string, msg: DirectInteractionMessage) => void;
  currentUser?: UserProfile;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  requests,
  onOpenNewService,
  onOpenCompletionPhotos,
  onOpenPayment,
  onApproveBudgetAndPay,
  onUpdateGpsLocation,
  onDeleteRequest,
  interactionThreads = [],
  onTransmitDocument = () => {},
  onSendMessage = () => {},
  currentUser
}) => {
  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';

  // State for requester (solicitante) credential lookup if accessing as guest or specific protocol
  const [lookupProtocol, setLookupProtocol] = useState('');
  const [lookupSecret, setLookupSecret] = useState(''); // phone, cpf or securityCode
  const [unlockedProtocols, setUnlockedProtocols] = useState<string[]>([]);
  const [lookupError, setLookupError] = useState('');

  // Access Control: Solicitante (matching client or unlocked protocols) or Administrador
  const accessibleRequests = useMemo(() => {
    if (isAdmin) {
      return requests;
    }

    return requests.filter(req => {
      // 1. If explicitly unlocked via Solicitante lookup
      if (unlockedProtocols.includes(req.protocolNumber.toUpperCase()) || unlockedProtocols.includes(req.id)) {
        return true;
      }

      // 2. If logged in as client matching the request's credentials
      if (currentUser?.role === 'cliente') {
        const userPhoneClean = currentUser.phone ? currentUser.phone.replace(/\D/g, '') : '';
        const reqPhoneClean = req.clientPhone ? req.clientPhone.replace(/\D/g, '') : '';
        const userCpfClean = currentUser.cpf ? currentUser.cpf.replace(/\D/g, '') : '';
        const reqCpfClean = req.clientCpf ? req.clientCpf.replace(/\D/g, '') : '';

        const matchPhone = userPhoneClean && reqPhoneClean && userPhoneClean === reqPhoneClean;
        const matchCpf = userCpfClean && reqCpfClean && userCpfClean === reqCpfClean;
        const matchEmail = currentUser.email && req.clientEmail && currentUser.email.toLowerCase() === req.clientEmail.toLowerCase();
        const matchName = currentUser.name && req.clientName && currentUser.name.trim().toLowerCase() === req.clientName.trim().toLowerCase();

        return Boolean(matchPhone || matchCpf || matchEmail || matchName);
      }

      return false;
    });
  }, [requests, isAdmin, currentUser, unlockedProtocols]);

  const [selectedReqId, setSelectedReqId] = useState<string>(
    accessibleRequests[0]?.id || ''
  );
  const [activeTrackingTab, setActiveTrackingTab] = useState<'geral' | 'documentos'>('geral');

  // Keep selected request in sync with accessible list
  const selectedRequest = accessibleRequests.find(r => r.id === selectedReqId) || accessibleRequests[0];

  const handleVerifySolicitanteAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');

    const cleanProto = lookupProtocol.trim().toUpperCase();
    const cleanSec = lookupSecret.trim().replace(/\D/g, '').toLowerCase();

    if (!cleanProto) {
      setLookupError('Informe o número de protocolo (ex: RM-2026-8910)');
      return;
    }

    const matchedReq = requests.find(r => {
      const matchProto = r.protocolNumber.toUpperCase() === cleanProto || r.id === cleanProto;
      if (!matchProto) return false;

      // Verify requester credentials (phone, CPF or security code)
      if (!cleanSec) return true; // If protocol matched

      const phoneClean = (r.clientPhone || '').replace(/\D/g, '');
      const cpfClean = (r.clientCpf || '').replace(/\D/g, '');
      const secCodeClean = (r.securityCode || '').replace(/\D/g, '').toLowerCase();

      return phoneClean.includes(cleanSec) || cpfClean.includes(cleanSec) || secCodeClean.includes(cleanSec);
    });

    if (matchedReq) {
      setUnlockedProtocols(prev => [...prev, matchedReq.protocolNumber.toUpperCase()]);
      setSelectedReqId(matchedReq.id);
      setLookupProtocol('');
      setLookupSecret('');
      setLookupError('');
    } else {
      setLookupError('Chamado não encontrado ou dados do solicitante não conferem. Por segurança, o acesso é restrito ao solicitante e à administração.');
    }
  };

  const getStatusBadge = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'pendente':
        return { label: 'Aguardando Análise', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      case 'em_analise':
        return { label: 'Em Triagem Técnica', color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' };
      case 'orcamento_enviado':
        return { label: 'Orçamento Enviado', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 animate-pulse' };
      case 'tecnico_agendado':
        return { label: 'Técnico Escalado', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' };
      case 'em_andamento':
        return { label: 'Em Execução no Local', color: 'bg-rose-500/10 text-rose-300 border-rose-500/30' };
      case 'concluido':
        return { label: 'Concluído com Sucesso', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
    }
  };

  const hasCompletionPhotos = selectedRequest?.completionPhotos && selectedRequest.completionPhotos.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div 
        id="modal-tracking"
        className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-[#1e232b] border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400 border border-slate-700">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold text-white leading-tight">
                  Acompanhamento de Solicitações (O.S.)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {isAdmin ? 'Modo Administrador' : 'Acesso Restrito: Solicitante'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Horário oficial de Brasília (UTC-3) • Visualização restrita ao Solicitante e Administrador
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {accessibleRequests.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500 border border-slate-700">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                Acesso Restrito ao Solicitante e Administrador
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Para consultar o andamento em tempo real, propostas comerciais e enviar comprovantes, informe os dados do seu chamado emitido.
              </p>
            </div>

            {/* Requester verification form */}
            <form onSubmit={handleVerifySolicitanteAccess} className="max-w-md mx-auto p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                <KeyRound className="w-4 h-4 text-rose-400" />
                <span>Localizar Chamado do Solicitante</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Número do Protocolo (O.S.):</label>
                <input
                  type="text"
                  value={lookupProtocol}
                  onChange={(e) => setLookupProtocol(e.target.value)}
                  placeholder="Ex: RM-2026-8910"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Telefone ou CPF do Solicitante:</label>
                <input
                  type="text"
                  value={lookupSecret}
                  onChange={(e) => setLookupSecret(e.target.value)}
                  placeholder="Ex: (71) 98765-4321 ou CPF"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                />
              </div>

              {lookupError && (
                <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Acessar Acompanhamento da O.S.</span>
              </button>
            </form>

            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenNewService();
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
              >
                Abrir Novo Chamado de Manutenção
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar list of requests */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-[#0e1118] overflow-y-auto p-3.5 space-y-2">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {isAdmin ? `Todos os Chamados (${accessibleRequests.length})` : `Seus Chamados (${accessibleRequests.length})`}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Brasília UTC-3</span>
              </div>

              {accessibleRequests.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                const badge = getStatusBadge(req.status);
                const reqPhotos = req.completionPhotos && req.completionPhotos.length > 0;
                return (
                  <button
                    key={req.id}
                    onClick={() => setSelectedReqId(req.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-850 bg-slate-800/90 border-rose-500/60 shadow-md'
                        : 'bg-slate-900/50 border-slate-800/70 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-rose-400">
                        {req.protocolNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        {reqPhotos && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-0.5">
                            <Camera className="w-2.5 h-2.5" />
                            {req.completionPhotos?.length}
                          </span>
                        )}
                        {req.urgency === 'urgente_24h' && (
                          <span className="text-[10px] font-bold text-rose-400 flex items-center gap-0.5">
                            <Zap className="w-3 h-3" /> 24h
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                      {req.serviceName}
                    </h4>

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {getBrasiliaDateString(req.createdAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>


            {/* Request Detail Content */}
            {selectedRequest && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#12161f]">
                {/* Header Detail */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-rose-400">
                        Protocolo: {selectedRequest.protocolNumber}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(selectedRequest.status).color}`}>
                        {getStatusBadge(selectedRequest.status).label}
                      </span>
                    </div>
                    <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                      {selectedRequest.serviceName}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Share Protocol Direct Link Button */}
                    <button
                      id="btn-share-protocol-tracking"
                      onClick={() => {
                        const trackingUrl = getTrackingShareUrl(selectedRequest.protocolNumber);
                        const text = `*RM Manutec - Acompanhamento de Chamado*\nProtocolo: ${selectedRequest.protocolNumber}\nServiço: ${selectedRequest.serviceName}\nCliente: ${selectedRequest.clientName}\nStatus: ${getStatusBadge(selectedRequest.status).label}\n\nAcesse o chamado pelo link:\n${trackingUrl}`;
                        if (typeof navigator !== 'undefined' && navigator.share) {
                          navigator.share({
                            title: `RM Manutec • Chamado ${selectedRequest.protocolNumber}`,
                            text,
                            url: trackingUrl
                          }).catch(() => {});
                        } else {
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                        }
                      }}
                      title="Compartilhar Link do Chamado"
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Compartilhar</span>
                    </button>

                    {/* Completion Photos Button in Tracking View */}
                    {(hasCompletionPhotos || selectedRequest.status === 'concluido') && onOpenCompletionPhotos && (
                      <button
                        id="btn-view-completion-photos-tracking"
                        onClick={() => onOpenCompletionPhotos(selectedRequest, false)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Fotos de Conclusão</span>
                        {hasCompletionPhotos && (
                          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-extrabold">
                            {selectedRequest.completionPhotos?.length}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Delete / Remove Request Button */}
                    {onDeleteRequest && (
                      <button
                        id="btn-delete-request-tracking"
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja realmente remover a solicitação ${selectedRequest.protocolNumber} (${selectedRequest.serviceName})?`)) {
                            onDeleteRequest(selectedRequest.id);
                            setSelectedReqId('');
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-700 text-rose-300 hover:text-white text-xs font-bold border border-rose-800/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Remover / Cancelar esta solicitação"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Remover Solicitação</span>
                      </button>
                    )}

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block">Previsão / Custo:</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {selectedRequest.budgetProposal?.totalAmount && selectedRequest.budgetProposal.totalAmount > 0
                          ? `R$ ${selectedRequest.budgetProposal.totalAmount.toFixed(2)}` 
                          : (selectedRequest.estimatedPrice || 'R$ 0,00 (Aguardando Orçamento)')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <button
                    id="tab-tracking-visao-geral"
                    onClick={() => setActiveTrackingTab('geral')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeTrackingTab === 'geral'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Status & Andamento</span>
                  </button>

                  <button
                    id="tab-tracking-documentos"
                    onClick={() => setActiveTrackingTab('documentos')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeTrackingTab === 'documentos'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Documentos & Interação com a Administração</span>
                    {interactionThreads.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-800/80 text-amber-300 text-[10px] font-mono border border-amber-500/40">
                        {interactionThreads.find(t => t.requestId === selectedRequest.id || t.protocolNumber === selectedRequest.protocolNumber)?.documents.length || 0} docs
                      </span>
                    )}
                  </button>
                </div>

                {activeTrackingTab === 'documentos' ? (
                  <div className="space-y-4">
                    <AdminClientInteractionHub
                      userRole="cliente"
                      currentUser={currentUser}
                      threads={interactionThreads}
                      requests={requests}
                      selectedThreadId={interactionThreads.find(t => t.requestId === selectedRequest.id || t.protocolNumber === selectedRequest.protocolNumber)?.id}
                      onTransmitDocument={onTransmitDocument}
                      onSendMessage={onSendMessage}
                    />
                  </div>
                ) : (
                  <>
                {/* 1. INSPECTION FEE (TAXA DE DESLOCAMENTO R$ 50,00) BLOCK */}
                {selectedRequest.requestType === 'vistoria_presencial' && selectedRequest.inspectionFee && (
                  <div className={`p-4 rounded-2xl border transition-all ${
                    selectedRequest.inspectionFee.isPaid
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/50 text-amber-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          selectedRequest.inspectionFee.isPaid
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                        }`}>
                          {selectedRequest.inspectionFee.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white">
                              Taxa de Deslocamento & Vistoria Presencial
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              selectedRequest.inspectionFee.isPaid
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              {selectedRequest.inspectionFee.isPaid ? 'TAXA PAGA (CONFIRMADO)' : 'PAGAMENTO ANTECIPADO PENDENTE'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            {selectedRequest.inspectionFee.isPaid
                              ? `A taxa de R$ 50,00 foi quitada com sucesso. Técnico confirmado para visita em ${selectedRequest.preferredDate} (${selectedRequest.preferredPeriod}).`
                              : `A taxa de R$ 50,00 de deslocamento deve ser paga antecipadamente para que o técnico reserve e compareça no dia ${selectedRequest.preferredDate}.`}
                          </p>
                        </div>
                      </div>

                      {!selectedRequest.inspectionFee.isPaid && onOpenPayment && (
                        <button
                          type="button"
                          id="btn-pay-inspection-fee-tracking"
                          onClick={() => {
                            try {
                              navigator.clipboard?.writeText('64.177.147/0001-34');
                            } catch (e) {
                              console.warn('Clipboard write error', e);
                            }
                            const feeReq: ServiceRequest = {
                              ...selectedRequest,
                              paymentTypeRequested: 'taxa_deslocamento'
                            };
                            onOpenPayment(feeReq);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95 cursor-pointer ring-1 ring-emerald-400/40"
                        >
                          <QrCode className="w-4 h-4 animate-pulse text-emerald-200" />
                          <span>Pagar Taxa de R$ 50,00 (PIX CNPJ)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. BUDGET PROPOSAL BLOCK (ORÇAMENTO ENVIADO PARA O CLIENTE) */}
                {selectedRequest.budgetProposal && selectedRequest.budgetProposal.totalAmount > 0 ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#101726] to-slate-950 border-2 border-emerald-500/50 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                              Proposta Comercial Oficial RM Manutec
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              selectedRequest.budgetProposal?.status === 'aprovado' || selectedRequest.paymentStatus === 'pago'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse'
                            }`}>
                              {selectedRequest.budgetProposal?.status === 'aprovado' || selectedRequest.paymentStatus === 'pago'
                                ? 'ORÇAMENTO APROVADO & PAGO'
                                : 'ORÇAMENTO DEFINIDO PELO ADMIN • AGUARDANDO APROVAÇÃO'}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-white">
                            Orçamento Detalhado para Execução
                          </h4>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 block">Valor Total da Proposta:</span>
                        <span className="text-lg sm:text-xl font-black text-emerald-400">
                          R$ {selectedRequest.budgetProposal.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Labor & Materials */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                        <span className="text-slate-400 text-[10px] block">Mão de Obra Especializada:</span>
                        <span className="text-sm font-bold text-white">
                          R$ {(selectedRequest.budgetProposal.laborAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                        <span className="text-slate-400 text-[10px] block">Materiais & Insumos Inclusos:</span>
                        <span className="text-sm font-bold text-white">
                          R$ {(selectedRequest.budgetProposal.materialsAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                        <span className="text-slate-400 text-[10px] block">Prazo de Execução Estimado:</span>
                        <span className="text-sm font-bold text-emerald-300">
                          {selectedRequest.budgetProposal.executionDays || '1 a 2 dias úteis'}
                        </span>
                      </div>
                    </div>

                    {/* Description of Scope */}
                    {selectedRequest.budgetProposal.description && (
                      <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                        <span className="font-bold text-slate-300 block mb-1">Escopo Detalhado do Serviço:</span>
                        <p className="text-slate-300 leading-relaxed">
                          {selectedRequest.budgetProposal.description}
                        </p>
                      </div>
                    )}

                    {/* Items List if available */}
                    {selectedRequest.budgetProposal.items && selectedRequest.budgetProposal.items.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 block uppercase">Itens da Proposta:</span>
                        <div className="space-y-1 text-xs">
                          {selectedRequest.budgetProposal.items.map((item, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between">
                              <span className="text-slate-300">• {item.description}</span>
                              <span className="font-bold text-white">R$ {item.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions: Approve & Pay vs Talk on WhatsApp */}
                    {selectedRequest.budgetProposal.status !== 'aprovado' && selectedRequest.paymentStatus !== 'pago' && (
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Garantia de 90 dias com Nota Fiscal e ART/RRT se aplicável.</span>
                        </div>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                          <a
                            href={`https://wa.me/5571996492354?text=${encodeURIComponent(`Olá! Gostaria de tirar dúvidas sobre o orçamento do chamado ${selectedRequest.protocolNumber} (${selectedRequest.serviceName}).`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Dúvidas WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            id="btn-approve-budget-pay"
                            onClick={() => {
                              if (onApproveBudgetAndPay) {
                                onApproveBudgetAndPay(selectedRequest);
                              } else if (onOpenPayment) {
                                const budgetReq: ServiceRequest = {
                                  ...selectedRequest,
                                  paymentTypeRequested: 'orcamento_servico',
                                  budgetProposal: {
                                    ...selectedRequest.budgetProposal!,
                                    status: 'aprovado'
                                  }
                                };
                                onOpenPayment(budgetReq);
                              }
                            }}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/40 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Aprovar Orçamento e Realizar Pagamento</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            Valor do Serviço: <span className="text-amber-400">R$ 0,00</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Aguardando Orçamento pelo Administrador
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Conforme a política operacional da RM Manutec, o valor do serviço principal permanece <strong>R$ 0,00</strong> até que a vistoria ou triagem técnica seja realizada e o <strong>Administrador edite e libere o orçamento formal</strong> com a discriminação de mão de obra e insumos.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <span>Acompanhe ou envie comprovantes e arquivos pela aba de interação.</span>
                      <button
                        type="button"
                        onClick={() => setActiveTrackingTab('documentos')}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Acessar Documentos & Chat</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Completion Photos Card if available */}
                {hasCompletionPhotos && onOpenCompletionPhotos && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">
                          Laudo & Fotos de Conclusão do Serviço
                        </span>
                        <span className="text-[11px] text-emerald-400 font-medium">
                          ({selectedRequest.completionPhotos?.length} evidências anexadas)
                        </span>
                      </div>

                      <button
                        onClick={() => onOpenCompletionPhotos(selectedRequest, false)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Ver Laudo Completo</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto py-1">
                      {selectedRequest.completionPhotos?.map((photo, index) => (
                        <div
                          key={index}
                          onClick={() => onOpenCompletionPhotos(selectedRequest, false)}
                          className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer border border-slate-700 hover:border-emerald-400 transition-all group"
                        >
                          <img
                            src={photo}
                            alt={`Foto de conclusão ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedRequest.completionNote && (
                      <p className="text-xs text-slate-300 bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                        <span className="font-bold text-emerald-400">Laudo Técnico: </span>
                        {selectedRequest.completionNote}
                      </p>
                    )}
                  </div>
                )}

                {/* Assigned Technician if available - Privacy: Name and Profile Photo Only */}
                {selectedRequest.assignedTechnician && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={selectedRequest.assignedTechnician.avatar}
                          alt={selectedRequest.assignedTechnician.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-white">
                            {selectedRequest.assignedTechnician.name}
                          </span>
                          <span className="inline-flex items-center text-xs text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30">
                            <Star className="w-3 h-3 fill-amber-400 mr-1" />
                            {selectedRequest.assignedTechnician.rating}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 font-medium">
                          {selectedRequest.assignedTechnician.role}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" /> Profissional Credenciado RM
                          </span>
                          {selectedRequest.assignedTechnician.eta && (
                            <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" /> Chegada: {selectedRequest.assignedTechnician.eta}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-slate-400 flex items-center gap-2 self-start sm:self-auto">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-slate-200 font-semibold block">Atendimento Monitorado</span>
                        <span>Suporte intermediado pela Central RM</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline Progress */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-400" /> Linha do Tempo do Atendimento:
                  </h4>

                  <div className="space-y-3 pl-2">
                    {selectedRequest.timeline.map((step, idx) => (
                      <div key={idx} className="relative pl-6 pb-2 border-l border-slate-700 last:border-l-0">
                        <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-900 flex items-center justify-center text-white"></span>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">{step.title}</span>
                          <span className="text-[11px] text-slate-400">{step.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address & Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" /> Endereço do Chamado:
                    </span>
                    <p className="text-slate-200 font-medium">
                      {selectedRequest.address.street}, {selectedRequest.address.number} {selectedRequest.address.complement && `(${selectedRequest.address.complement})`}
                    </p>
                    <p className="text-slate-400">
                      {selectedRequest.address.neighborhood} - {selectedRequest.address.city}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-rose-400" /> Agendamento:
                    </span>
                    <p className="text-slate-200 font-medium">
                      Data: {new Date(selectedRequest.preferredDate).toLocaleDateString()}
                    </p>
                    <p className="text-slate-400 capitalize">
                      Período: {selectedRequest.preferredPeriod}
                    </p>
                  </div>
                </div>

                {/* Nota Fiscal Status Info */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedRequest.requiresInvoice ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-white font-bold block">
                        Nota Fiscal (NF-e): {selectedRequest.requiresInvoice ? 'Solicitada (SIM)' : 'Não solicitada (Apenas Recibo)'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {selectedRequest.requiresInvoice
                          ? `CNPJ Emissor: 64.177.147/0001-34 ${selectedRequest.invoiceCnpjOrCpf ? `• Destinatário: ${selectedRequest.invoiceCnpjOrCpf}` : ''}`
                          : 'Comprovante e termo de garantia digital emitidos diretamente.'}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border self-start sm:self-auto ${
                    selectedRequest.requiresInvoice
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {selectedRequest.requiresInvoice ? 'NF-e: Sim' : 'NF-e: Não'}
                  </span>
                </div>

                {/* Payment Status & Action */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedRequest.paymentStatus === 'pago'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold block">
                          Forma de Pagamento: {
                            selectedRequest.paymentMethod === 'pix' ? 'PIX Instantâneo' :
                            selectedRequest.paymentMethod === 'cartao_credito' ? 'Cartão de Crédito' :
                            selectedRequest.paymentMethod === 'cartao_debito' ? 'Cartão de Débito' :
                            selectedRequest.paymentMethod === 'boleto' ? 'Boleto Bancário' :
                            selectedRequest.paymentMethod === 'faturamento_pj' ? 'Faturamento PJ (NF-e)' :
                            selectedRequest.paymentMethod === 'local_conclusao' ? 'Pagar no Local com Técnico' :
                            selectedRequest.paymentMethod === 'transferencia' ? 'Transferência Bancária / TED' :
                            'À Definir'
                          }
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedRequest.paymentStatus === 'pago'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {selectedRequest.paymentStatus === 'pago' ? 'PAGO' : 'PENDENTE / AGUARDANDO'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {selectedRequest.paymentStatus === 'pago'
                          ? `Pagamento confirmado • ${selectedRequest.paidAt || 'Recibo gerado'}`
                          : selectedRequest.paymentMethod === 'faturamento_pj'
                          ? 'Faturamento corporativo registrado com prazo para 15/30 dias após emissão da NF-e.'
                          : selectedRequest.paymentMethod === 'local_conclusao'
                          ? 'Pagamento será efetuado diretamente ao técnico na maquininha sem fio ou dinheiro após o serviço.'
                          : 'Pague via PIX com 5% de desconto, Cartão em até 12x, Boleto ou Transferência.'}
                      </span>
                    </div>
                  </div>

                  {selectedRequest.paymentStatus !== 'pago' && onOpenPayment && (
                    <button
                      type="button"
                      onClick={() => onOpenPayment(selectedRequest)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all shrink-0 self-start sm:self-auto cursor-pointer active:scale-95"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Formas de Pagamento</span>
                    </button>
                  )}
                </div>

                {/* Description details */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                    Descrição do Pedido & Opções:
                  </span>
                  <p className="text-slate-200 mb-2">{selectedRequest.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRequest.selectedOptions.map((opt, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                        ✓ {opt}
                      </span>
                    ))}
                  </div>
                </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

