import React from 'react';
import { ServiceRequest } from '../types';
import {
  buildNewRequestAdminNotification,
  buildNewRequestClientNotification
} from '../lib/whatsappNotifications';
import {
  CheckCircle,
  Clock,
  ClipboardList,
  Headset,
  ArrowRight,
  X,
  Zap,
  MessageSquare,
  ExternalLink,
  Send,
  ShieldCheck
} from 'lucide-react';

interface SuccessFeedbackProps {
  request: ServiceRequest | null;
  onClose: () => void;
  onTrack: () => void;
  onSupport: () => void;
}

export const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({
  request,
  onClose,
  onTrack,
  onSupport
}) => {
  if (!request) return null;

  const adminNotif = buildNewRequestAdminNotification(request);
  const clientNotif = buildNewRequestClientNotification(request);

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] rounded-2xl bg-gradient-to-br from-[#0f141d] to-[#151a24] border border-emerald-500/50 p-5 shadow-2xl text-slate-200 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-md shadow-emerald-500/10">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Solicitação Confirmada!
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                WhatsApp Sincronizado
              </span>
            </div>
            <h4 className="font-['Space_Grotesk'] text-sm font-bold text-white">
              {request.serviceName}
            </h4>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-sky-900/90 rounded-xl p-3 border border-sky-800 space-y-1.5 text-xs mb-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Protocolo de Atendimento:</span>
          <span className="font-mono font-bold text-orange-400">{request.protocolNumber}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Urgência:</span>
          <span className="font-medium text-slate-200 capitalize">
            {request.urgency === 'urgente_24h' ? '⚡ Emergência Imediata (24h)' : request.urgency}
          </span>
        </div>
      </div>

      {/* WhatsApp Dispatch Direct Action Bar */}
      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 mb-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            Notificação WhatsApp Enviada
          </span>
          <span className="text-emerald-400 font-mono text-[10px]">24h Online</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => window.open(adminNotif.url, '_blank', 'noopener,noreferrer')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Abrir no WhatsApp da Administração RM Manutec"
          >
            <Send className="w-3 h-3" />
            <span>WPP Admin</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </button>

          <button
            type="button"
            onClick={() => window.open(clientNotif.url, '_blank', 'noopener,noreferrer')}
            className="px-2.5 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Abrir no WhatsApp do Cliente"
          >
            <Send className="w-3 h-3" />
            <span>Meu WPP</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            onClose();
            onTrack();
          }}
          className="flex-1 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-orange-600/20 cursor-pointer"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Acompanhar Chamado</span>
        </button>

        <button
          onClick={() => {
            onClose();
            onSupport();
          }}
          className="px-3 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Headset className="w-3.5 h-3.5" />
          <span>Suporte</span>
        </button>
      </div>
    </div>
  );
};
