import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { RM_CONTACT_INFO } from '../data/servicesData';

interface WhatsAppNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  recipientName: string;
  recipientPhone: string;
  recipientRole: 'admin' | 'cliente' | 'tecnico';
  messageText: string;
  whatsappUrl: string;
  onDispatchConfirmed?: () => void;
}

export const WhatsAppNotificationModal: React.FC<WhatsAppNotificationModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  recipientName,
  recipientPhone,
  recipientRole,
  messageText,
  whatsappUrl,
  onDispatchConfirmed
}) => {
  const [hasCopied, setHasCopied] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    setHasOpened(true);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (onDispatchConfirmed) {
      onDispatchConfirmed();
    }
  };

  const roleLabel = recipientRole === 'admin' 
    ? 'Central de Gestão (Admin)' 
    : recipientRole === 'tecnico' 
      ? 'Profissional Técnico' 
      : 'Cliente';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0f141d] border border-emerald-500/40 shadow-2xl text-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Notificação Oficial WhatsApp
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.2 rounded-full border border-emerald-500/20">
                  24h Ativo
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {subtitle && (
            <p className="text-slate-300 leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Recipient Card */}
          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                  Destinatário: {roleLabel}
                </span>
                <span className="font-bold text-white text-xs sm:text-sm">
                  {recipientName}
                </span>
              </div>
            </div>
            <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {recipientPhone}
            </span>
          </div>

          {/* Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Mensagem Formatada para WhatsApp:
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/20 transition-colors"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-300" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed selection:bg-emerald-500/30">
              {messageText}
            </div>
          </div>

          {/* System Security Notice */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Ao clicar no botão abaixo, a notificação será aberta diretamente no WhatsApp Web ou no aplicativo WhatsApp do seu celular com a mensagem preenchida.
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{hasOpened ? 'Reabrir no WhatsApp' : 'Abrir e Enviar no WhatsApp'}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>

      </div>
    </div>
  );
};
