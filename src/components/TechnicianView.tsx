import React, { useState } from 'react';
import { ServiceRequest, UserProfile } from '../types';
import {
  buildDirectMessageNotification,
  dispatchWhatsAppNotification
} from '../lib/whatsappNotifications';
import { WhatsAppNotificationModal } from './WhatsAppNotificationModal';
import {
  HardHat,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Calendar,
  FileText,
  Camera,
  Star,
  Zap,
  ArrowLeft,
  MessageSquare,
  Image as ImageIcon,
  Plus,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface TechnicianViewProps {
  user: UserProfile;
  requests: ServiceRequest[];
  onUpdateRequestStatus: (requestId: string, newStatus: ServiceRequest['status']) => void;
  onLogout: () => void;
  onOpenContact: () => void;
  onOpenCompletionPhotos: (request: ServiceRequest, canUpload: boolean) => void;
  onUpdateGpsLocation?: (requestId: string, newGps: NonNullable<ServiceRequest['gpsTracking']>) => void;
}

export const TechnicianView: React.FC<TechnicianViewProps> = ({
  user,
  requests,
  onUpdateRequestStatus,
  onLogout,
  onOpenContact,
  onOpenCompletionPhotos
}) => {
  const [selectedReqId, setSelectedReqId] = useState<string>(requests[0]?.id || '');
  const [activeDocView, setActiveDocView] = useState<'crea' | 'cpf'>(user.documentType || 'cpf');
  const [techNote, setTechNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // WhatsApp Modal State
  const [whatsappModalData, setWhatsappModalData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    recipientName: string;
    recipientPhone: string;
    recipientRole: 'admin' | 'cliente' | 'tecnico';
    messageText: string;
    whatsappUrl: string;
  }>({
    isOpen: false,
    title: '',
    recipientName: '',
    recipientPhone: '',
    recipientRole: 'admin',
    messageText: '',
    whatsappUrl: ''
  });

  const creaNumber = user.crea || 'CREA-BA 506.892/D';
  const cpfNumber = user.cpf || '789.456.123-45';
  const currentDocLabel = activeDocView === 'crea' ? creaNumber : `CPF ${cpfNumber}`;

  const selectedRequest = requests.find(r => r.id === selectedReqId) || requests[0];

  const handleAdvanceStatus = (req: ServiceRequest) => {
    if (req.status === 'tecnico_agendado') {
      onUpdateRequestStatus(req.id, 'em_andamento');
    } else if (req.status === 'em_andamento') {
      onUpdateRequestStatus(req.id, 'concluido');
      // Prompt to open completion photos
      if (!req.completionPhotos || req.completionPhotos.length === 0) {
        onOpenCompletionPhotos(req, true);
      }
    }
  };

  const hasCompletionPhotos = selectedRequest?.completionPhotos && selectedRequest.completionPhotos.length > 0;

  return (
    <div className="space-y-6">
      {/* Technician Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/50 shadow-lg shadow-amber-500/20"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">{user.name}</h2>
              
              {/* Document switcher button */}
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-amber-500/40 text-xs">
                <button
                  onClick={() => setActiveDocView('crea')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    activeDocView === 'crea'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Exibir CREA-BA"
                >
                  CREA-BA
                </button>
                <button
                  onClick={() => setActiveDocView('cpf')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    activeDocView === 'cpf'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Exibir CPF"
                >
                  CPF
                </button>
                <span className="px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                  {currentDocLabel}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{user.specialty}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.9 (148 avaliações)
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">Em serviço / Disponível</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={onOpenContact}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-rose-400" />
            <span>Falar com Central</span>
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
          >
            Trocar Acesso
          </button>
        </div>
      </div>

      {/* Orders Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of assigned orders */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-400" />
              Minhas Ordens de Serviço ({requests.length})
            </h3>
            <span className="text-xs text-slate-400">Tempo Real</span>
          </div>

          <div className="space-y-2.5">
            {requests.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <HardHat className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-sm">Nenhum chamado pendente no momento</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Você está com status <span className="text-emerald-400 font-bold">Disponível em Salvador & RMS</span>. Assim que um novo cliente solicitar serviços ou a central despachar um chamado, ele aparecerá aqui com endereço, rota GPS e laudo.
                </p>
                <button
                  type="button"
                  onClick={onOpenContact}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-rose-400" />
                  <span>Falar com o Plantão Central</span>
                </button>
              </div>
            ) : (
              requests.map((req) => {
                const isSelected = selectedReqId === req.id;
                const reqHasPhotos = req.completionPhotos && req.completionPhotos.length > 0;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReqId(req.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-850 bg-slate-800/90 border-amber-500 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {req.protocolNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {reqHasPhotos && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                            <Camera className="w-2.5 h-2.5" />
                            {req.completionPhotos?.length}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          req.status === 'concluido' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                          req.status === 'em_andamento' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse' :
                          'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}>
                          {req.status === 'concluido' ? 'Concluído' : req.status === 'em_andamento' ? 'Em Execução' : 'Escalado'}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white">{req.serviceName}</h4>
                    
                    <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {req.address.neighborhood} - {req.address.city}
                      </span>
                      <span className="font-semibold text-slate-200">{req.clientName}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail Panel for the selected order */}
        {selectedRequest ? (
          <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-amber-400">
                  Protocolo: {selectedRequest.protocolNumber}
                </span>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold text-white">
                  {selectedRequest.serviceName}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Dedicated Completion Photos Button */}
                <button
                  id="btn-completion-photos-tech"
                  onClick={() => onOpenCompletionPhotos(selectedRequest, true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <span>Fotos de Conclusão</span>
                  {hasCompletionPhotos && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-extrabold">
                      {selectedRequest.completionPhotos?.length}
                    </span>
                  )}
                </button>

                {selectedRequest.status !== 'concluido' && (
                  <button
                    onClick={() => handleAdvanceStatus(selectedRequest)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                  >
                    {selectedRequest.status === 'tecnico_agendado' ? (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Iniciar Atendimento</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Concluir O.S.</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Security PIN for verification & Address */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs">
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">PIN de Segurança do Atendimento:</span>
                    <span className="text-[11px] text-slate-400">Informe este código ao cliente na chegada para autorizar seu acesso com segurança.</span>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-sm tracking-widest border border-emerald-500/40 self-start sm:self-auto">
                  {selectedRequest.securityCode || 'RM-5924'}
                </span>
              </div>
            </div>

            {/* Client and Location info - Privacy Shield: Name and Photo only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cliente Autorizado:</span>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 p-0.5 shrink-0 shadow-md">
                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img
                        src={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`}
                        alt={selectedRequest.clientName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="font-bold text-xs text-white uppercase">
                        {selectedRequest.clientName.slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{selectedRequest.clientName}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Cliente Verificado RM Manutec
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Atendimento Conectado
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const notif = buildDirectMessageNotification({
                          protocolNumber: selectedRequest.protocolNumber,
                          recipientName: 'Supervisão RM Manutec',
                          recipientPhone: '71996492354',
                          senderName: `Técnico ${user.name}`,
                          senderRole: 'tecnico',
                          messageText: `Olá! Estou em rota/execução da O.S. ${selectedRequest.protocolNumber} (${selectedRequest.serviceName}) para o cliente ${selectedRequest.clientName}.`,
                          serviceName: selectedRequest.serviceName
                        });
                        setWhatsappModalData({
                          isOpen: true,
                          title: `Comunicação WhatsApp: O.S. ${selectedRequest.protocolNumber}`,
                          subtitle: `Central Supervisão Manutec & Gestão Operacional`,
                          recipientName: 'Supervisão RM Manutec',
                          recipientPhone: notif.targetPhone,
                          recipientRole: 'admin',
                          messageText: notif.message,
                          whatsappUrl: notif.url
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>Notificar Central WhatsApp</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">Contato direto intermediado pela Supervisão RM Manutec.</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Endereço de Execução:</span>
                <p className="text-slate-200 font-medium leading-relaxed">
                  {selectedRequest.address.street}, {selectedRequest.address.number}
                  {selectedRequest.address.complement ? ` - ${selectedRequest.address.complement}` : ''}
                </p>
                <p className="text-slate-400">
                  {selectedRequest.address.neighborhood} - {selectedRequest.address.city}
                </p>

                <div className="pt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    selectedRequest.requiresInvoice
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    📄 Nota Fiscal (NF-e): {selectedRequest.requiresInvoice ? 'SIM (Emitir NF)' : 'NÃO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Problem & Options */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Diagnóstico / Descrição do Cliente:</span>
              <p className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
                {selectedRequest.description}
              </p>
              
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedRequest.selectedOptions.map((opt, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                    🔧 {opt}
                  </span>
                ))}
              </div>
            </div>

            {/* Completion Photos Highlight Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-800 to-slate-800 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Fotos de Conclusão do Serviço
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({selectedRequest.completionPhotos?.length || 0} fotos anexadas)
                  </span>
                </div>

                <button
                  id="btn-upload-completion-photos"
                  onClick={() => onOpenCompletionPhotos(selectedRequest, true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>{hasCompletionPhotos ? 'Adicionar / Ver Fotos' : 'Anexar Fotos'}</span>
                </button>
              </div>

              {hasCompletionPhotos ? (
                <div className="flex items-center gap-3 overflow-x-auto py-1">
                  {selectedRequest.completionPhotos?.map((photo, index) => (
                    <div
                      key={index}
                      onClick={() => onOpenCompletionPhotos(selectedRequest, true)}
                      className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer border border-slate-700 hover:border-emerald-400 transition-all group"
                    >
                      <img
                        src={photo}
                        alt={`Foto de conclusão ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Nenhuma foto de conclusão registrada para esta O.S. Tire fotos antes de finalizar o atendimento para comprovação e laudo de garantia.
                </p>
              )}
            </div>

            {/* Technician Field Notes */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                Laudo Técnico & Peças Utilizadas:
              </span>
              <textarea
                rows={2}
                value={techNote}
                onChange={(e) => setTechNote(e.target.value)}
                placeholder="Informe materiais utilizados, peças substituídas ou observações para o laudo..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-amber-500"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setNoteSaved(true);
                    setTimeout(() => setNoteSaved(false), 2000);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  {noteSaved ? '✓ Laudo Salvo' : 'Salvar Laudo Técnico'}
                </button>
                <span className="text-[11px] text-slate-500">Registrado no histórico RM Manutec</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* WhatsApp Modal for Technician */}
      <WhatsAppNotificationModal
        isOpen={whatsappModalData.isOpen}
        onClose={() => setWhatsappModalData(prev => ({ ...prev, isOpen: false }))}
        title={whatsappModalData.title}
        subtitle={whatsappModalData.subtitle}
        recipientName={whatsappModalData.recipientName}
        recipientPhone={whatsappModalData.recipientPhone}
        recipientRole={whatsappModalData.recipientRole}
        messageText={whatsappModalData.messageText}
        whatsappUrl={whatsappModalData.whatsappUrl}
      />
    </div>
  );
};
