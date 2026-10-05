import React, { useState, useRef, useEffect } from 'react';
import { SupportMessage, ServiceItem, UserProfile } from '../types';
import { SERVICES_DATA, RM_CONTACT_INFO } from '../data/servicesData';
import techAvatar from '../assets/images/suporte_tecnico_avatar_1787963309220.jpg';
import { getBrasiliaTimeString } from '../lib/brasiliaTime';
import {
  buildWriterToAdminChatNotification,
  dispatchWhatsAppNotification
} from '../lib/whatsappNotifications';
import {
  X,
  Send,
  Headset,
  Paperclip,
  Mic,
  Bot,
  User,
  Zap,
  PhoneCall,
  CheckCircle,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';

interface OnlineSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenServiceRequest: (service: ServiceItem, urgency?: 'normal' | 'alta' | 'urgente_24h') => void;
  currentUser?: UserProfile;
}

export const OnlineSupportModal: React.FC<OnlineSupportModalProps> = ({
  isOpen,
  onClose,
  onOpenServiceRequest,
  currentUser
}) => {
  if (!isOpen) return null;

  const clientName = currentUser?.name ? currentUser.name : 'Cliente';

  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 'msg-greeting-initial',
      sender: 'agent',
      agentName: 'Supervisão RM Manutec',
      agentRole: 'Central de Atendimento Direto',
      agentAvatar: techAvatar,
      text: `Olá, ${clientName}! Seja bem-vindo(a) ao Canal de Atendimento Direto da RM Manutec. Como podemos lhe apoiar com sua solicitação ou esclarecer dúvidas sobre os serviços?`,
      timestamp: getBrasiliaTimeString(),
      quickActions: [
        { label: '⚡ Curto-Circuito / Elétrica Urgente', actionPayload: 'eletrica_urgente' },
        { label: '🚨 Vazamento ou Infiltração Urgente', actionPayload: 'hidraulica_urgente' },
        { label: '❄️ Ar Condicionado não gela / pingando', actionPayload: 'ar_condicionado_ajuda' },
        { label: '🔑 Fechadura emperrada / Chaveiro', actionPayload: 'fechadura_ajuda' },
        { label: '🪟 Manutenção de Box Blindex', actionPayload: 'blindex_ajuda' },
        { label: '🗑️ Caçamba e Descarte de Entulho', actionPayload: 'descarte_ajuda' },
        { label: '🎨 Orçamento de Pintura ou Reforma Civil', actionPayload: 'pintura_ajuda' }
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: SupportMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: getBrasiliaTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Dispara a abertura da conversa no WhatsApp do Administrador (71 99649-2354)
    try {
      const notif = buildWriterToAdminChatNotification({
        senderName: clientName,
        senderPhone: currentUser?.phone,
        senderRole: currentUser?.role || 'cliente',
        serviceName: 'Suporte Técnico Online',
        messageText: text
      });

      dispatchWhatsAppNotification({
        type: 'mensagem_chat',
        targetRole: 'admin',
        recipientName: 'Administrador RM Manutec',
        recipientPhone: notif.targetPhone,
        recipientPhoneFormatted: '(71) 99649-2354',
        messageText: notif.message,
        whatsappUrl: notif.url,
        status: 'disparado'
      }, true);
    } catch (err) {
      console.warn('Erro ao abrir WhatsApp no suporte:', err);
    }

    // Dynamic technical intelligence triage response
    setTimeout(() => {
      generateAgentResponse(text);
      setIsTyping(false);
    }, 700);
  };

  const generateAgentResponse = (userQuery: string) => {
    const query = userQuery.toLowerCase();
    let replyText = '';
    let targetServiceId: string | undefined = undefined;
    let quickActions: SupportMessage['quickActions'] = undefined;

    if (query.includes('vaz') || query.includes('cano') || query.includes('água') || query.includes('descarga') || query.includes('hidraulica')) {
      targetServiceId = 'hidraulica';
      replyText = `Compreendo, ${clientName}! Vazamentos exigem ação rápida para evitar danos estruturais. Recomendo fechar o registro geral provisoriamente. Nossos encanadores contam com equipamento eletrônico para detecção e reparo imediato.`;
      quickActions = [
        { label: '🚨 Abrir Chamado Emergencial de Hidráulica', actionPayload: 'open_hidraulica' },
        { label: '📞 Ligar para Plantonista 24h', actionPayload: 'call_operator' }
      ];
    } else if (query.includes('ar') || query.includes('split') || query.includes('gás') || query.includes('gel') || query.includes('clima')) {
      targetServiceId = 'ar_condicionado';
      replyText = `Para problemas de ar condicionado (falta de gás, barulho ou água no dreno), ${clientName}, nossos técnicos realizam higienização completa padrão ANVISA e recarga imediata de fluido com garantia.`;
      quickActions = [
        { label: '❄️ Solicitar Técnico de Ar Condicionado', actionPayload: 'open_ar' },
        { label: 'Ver Preços de Higienização e Carga', actionPayload: 'pricing_ar' }
      ];
    } else if (query.includes('chave') || query.includes('fechadura') || query.includes('porta') || query.includes('tranc')) {
      targetServiceId = 'fechaduras';
      replyText = `Situações de fechadura travada ou abertura de portas possuem atendimento prioritário (deslocamento em até 30-45 minutos). O chaveiro leva cilindros novos e fechaduras de reposição.`;
      quickActions = [
        { label: '🔑 Solicitar Chaveiro Imediato', actionPayload: 'open_fechaduras' }
      ];
    } else if (query.includes('blindex') || query.includes('box') || query.includes('vidro') || query.includes('roldana')) {
      targetServiceId = 'blindex';
      replyText = `Atenção com vidros temperados pesados ou portas emperradas! Roldanas gastas podem estressar o vidro. Enviamos vidraceiro técnico com kit de reposição e regulagem segura.`;
      quickActions = [
        { label: '🪟 Agendar Manutenção de Blindex', actionPayload: 'open_blindex' }
      ];
    } else if (query.includes('entulho') || query.includes('caçamba') || query.includes('descarte') || query.includes('lixo') || query.includes('resíduo')) {
      targetServiceId = 'descarte_entulho';
      replyText = `Trabalhamos com locação de caçambas estacionárias (5m³) e coleta rápida de entulho ensacado em locais de difícil acesso, com certificado de destinação ambiental legalizada.`;
      quickActions = [
        { label: '🗑️ Solicitar Caçamba / Coleta de Entulho', actionPayload: 'open_descarte' }
      ];
    } else if (query.includes('telha') || query.includes('goteira') || query.includes('chuva') || query.includes('rufo') || query.includes('calha')) {
      targetServiceId = 'telhados';
      replyText = `Manutenção preventiva e corretiva de telhados: troca de telhas, impermeabilização com manta asfáltica e limpeza de calhas com equipamentos de segurança NR-35.`;
      quickActions = [
        { label: '🏠 Solicitar Vistoria de Telhado', actionPayload: 'open_telhados' }
      ];
    } else if (query.includes('pint') || query.includes('tinta') || query.includes('massa') || query.includes('parede')) {
      targetServiceId = 'pintura';
      replyText = `Excelente, ${clientName}! Temos pintores profissionais para ambientes internos, fachadas externas e texturas. O orçamento pode ser feito por m² ou pacote fechado com todo o material incluso.`;
      quickActions = [
        { label: '🎨 Solicitar Orçamento de Pintura', actionPayload: 'open_pintura' }
      ];
    } else if (query.includes('piso') || query.includes('porcelanato') || query.includes('vinil')) {
      targetServiceId = 'pisos';
      replyText = `Assentamento com niveladores de precisão para porcelanatos e vinílicos. Podemos enviar um orçamentista para medição ou agendar o início do serviço.`;
      quickActions = [
        { label: '📐 Solicitar Assentamento de Pisos', actionPayload: 'open_pisos' }
      ];
    } else {
      replyText = `Recebi sua mensagem, ${clientName}! Nosso time técnico está à disposição para apoiar você em qualquer demanda de manutenção, reforma e emergências residenciais e prediais.`;
      quickActions = [
        { label: '📋 Ver Catálogo Completo de Serviços', actionPayload: 'view_catalog' },
        { label: '⚡ Falar no WhatsApp com Atendente Humano', actionPayload: 'open_whatsapp' }
      ];
    }

    const agentMsg: SupportMessage = {
      id: `agent-${Date.now()}`,
      sender: 'agent',
      agentName: 'Supervisão RM Manutec',
      agentRole: 'Central de Atendimento Direto',
      agentAvatar: techAvatar,
      text: replyText,
      timestamp: getBrasiliaTimeString(),
      suggestedServiceId: targetServiceId,
      quickActions
    };

    setMessages(prev => [...prev, agentMsg]);
  };

  const handleQuickAction = (actionPayload: string, label: string) => {
    if (actionPayload.startsWith('open_')) {
      const serviceId = actionPayload.replace('open_', '');
      const service = SERVICES_DATA.find(s => s.id === serviceId);
      if (service) {
        onClose();
        onOpenServiceRequest(service, service.isEmergency24h ? 'alta' : 'normal');
        return;
      }
    }

    if (actionPayload === 'open_whatsapp') {
      window.open(`https://wa.me/${RM_CONTACT_INFO.whatsapp}?text=${encodeURIComponent('Olá, gostaria de suporte técnico da RM Manutec.')}`, '_blank');
      return;
    }

    if (actionPayload === 'call_operator') {
      window.open(`tel:${RM_CONTACT_INFO.phone.replace(/\D/g, '')}`);
      return;
    }

    // Default: send the chip text
    handleSendMessage(label);
  };

  const simulateAudio = () => {
    setIsAudioRecording(true);
    setTimeout(() => {
      setIsAudioRecording(false);
      handleSendMessage('🎤 [Mensagem de áudio gravada pelo cliente: "Preciso de um técnico urgente para verificar a fiação e vazamento..."]');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div 
        id="modal-online-support"
        className="relative w-full max-w-2xl h-[90vh] max-h-[720px] rounded-2xl bg-sky-950 border border-sky-700/80 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Support Header */}
        <div className="p-4 sm:p-5 bg-sky-950 border-b border-sky-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-orange-600 to-amber-500 shadow-md shadow-orange-600/30 ring-2 ring-orange-500/40 flex items-center justify-center">
                <img 
                  src={techAvatar} 
                  alt="Supervisão Manutec" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Space_Grotesk'] text-base sm:text-lg font-bold text-white leading-tight">
                  Suporte Técnico Online em Tempo Real
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Supervisão Manutec Online
                </span>
                <span>•</span>
                <span>Resposta imediata</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${RM_CONTACT_INFO.whatsapp}?text=${encodeURIComponent('Olá RM Manutec! Preciso de suporte técnico predial agora.')}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors hidden xs:flex"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Oficial</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-sky-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Support Banner */}
        <div className="px-4 py-2 bg-sky-900/80 border-b border-sky-800/80 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Supervisão Manutec</span>
          </span>
          <span className="text-[11px] text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Tempo Médio: 35s
          </span>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#0d1017]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-sky-950 via-orange-950 to-sky-950 border border-orange-500/40 shrink-0 mt-1 flex items-center justify-center shadow-md shadow-orange-500/10 ring-1 ring-orange-400/20">
                    {msg.agentAvatar ? (
                      <img 
                        src={msg.agentAvatar} 
                        alt={msg.agentName} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#1a130e] via-[#24170e] to-[#0f172a] text-orange-400">
                        <Headset className="w-4 h-4 text-orange-400 drop-shadow" />
                      </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5`}>
                  {!isUser && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{msg.agentName}</span>
                      <span className="text-[10px] text-orange-400/90 font-semibold px-1.5 py-0.2 rounded bg-orange-500/10 border border-orange-500/20">
                        {msg.agentRole}
                      </span>
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-none shadow-md shadow-orange-600/20'
                        : 'bg-sky-900 bg-sky-950 border border-sky-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Direct Service Conversion Button if suggested */}
                    {msg.suggestedServiceId && (
                      <div className="mt-3 pt-3 border-t border-sky-800 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">Serviço Recomendado</span>
                        <button
                          onClick={() => {
                            const target = SERVICES_DATA.find(s => s.id === msg.suggestedServiceId);
                            if (target) {
                              onClose();
                              onOpenServiceRequest(target, target.isEmergency24h ? 'alta' : 'normal');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <span>Abrir Chamado Agora</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Chips if available */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.quickActions.map((qa, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickAction(qa.actionPayload, qa.label)}
                          className="text-[11px] px-2.5 py-1.5 rounded-xl bg-sky-900/90 hover:bg-sky-800 text-slate-300 hover:text-white border border-sky-700/60 transition-all text-left flex items-center gap-1 active:scale-95"
                        >
                          <span>{qa.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 block px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce delay-100"></span>
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce delay-200"></span>
              <span className="text-slate-400">Supervisão Manutec digitando análise técnica...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-sky-950 border-t border-sky-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <label
              className="p-2.5 rounded-xl border bg-sky-900 text-slate-400 hover:text-white hover:bg-sky-800 border-sky-700 cursor-pointer transition-colors flex items-center justify-center shrink-0"
              title="Enviar fotos do problema técnico"
            >
              <ImageIcon className="w-4 h-4 text-orange-400" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    handleSendMessage(`📷 [${files.length} foto(s) anexada(s) pelo cliente para avaliação do suporte técnico]`);
                  }
                }}
              />
            </label>

            <button
              type="button"
              onClick={simulateAudio}
              className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                isAudioRecording
                  ? 'bg-orange-600 text-white border-orange-500 animate-pulse'
                  : 'bg-sky-900 text-slate-400 hover:text-white hover:bg-sky-800 border-sky-700'
              }`}
              title="Gravar mensagem de voz para o suporte"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite sua dúvida, solicitação ou apoio técnico..."
              className="flex-1 rounded-xl bg-sky-900 border border-sky-700 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white transition-all shadow-md shadow-orange-600/20 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
