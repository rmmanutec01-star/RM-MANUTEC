import React, { useState } from 'react';
import { RM_CONTACT_INFO } from '../data/servicesData';
import {
  X,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Send,
  Sparkles,
  Zap
} from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChannel?: 'whatsapp' | 'call' | 'email';
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  initialChannel = 'whatsapp'
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'call' | 'email'>(initialChannel);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // WhatsApp custom message state
  const [waSubject, setWaSubject] = useState('Orçamento de Serviços');
  const [waCustomText, setWaCustomText] = useState(
    'Olá, equipe RM Manutec! Gostaria de um orçamento para serviços de manutenção/reforma.'
  );

  // Email form state
  const [emailSenderName, setEmailSenderName] = useState('');
  const [emailSenderContact, setEmailSenderContact] = useState('');
  const [emailSubject, setEmailSubject] = useState('Solicitação de Proposta Comercial - RM Manutec');
  const [emailBody, setEmailBody] = useState(
    'Olá equipe RM Manutec,\n\nGostaria de solicitar uma visita técnica / proposta para serviços em meu imóvel.'
  );
  const [emailSentFeedback, setEmailSentFeedback] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleOpenWhatsApp = () => {
    const fullText = encodeURIComponent(`${waCustomText} (Assunto: ${waSubject})`);
    const url = `https://wa.me/${RM_CONTACT_INFO.whatsapp}?text=${fullText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenMailto = () => {
    const subjectEncoded = encodeURIComponent(emailSubject);
    const bodyEncoded = encodeURIComponent(
      `${emailBody}\n\nNome: ${emailSenderName || 'Cliente'}\nContato: ${emailSenderContact || 'Não informado'}`
    );
    window.open(`mailto:${RM_CONTACT_INFO.email}?subject=${subjectEncoded}&body=${bodyEncoded}`);
  };

  const handleSendEmailDirect = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSentFeedback(true);
    setTimeout(() => {
      setEmailSentFeedback(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div 
        id="modal-contact-channels"
        className="relative w-full max-w-2xl rounded-2xl bg-[#11151f] border border-sky-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-sky-950 border-b border-sky-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-600/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold text-white leading-tight">
                Canais Oficiais de Atendimento • RM Manutec
              </h2>
              <p className="text-xs text-slate-400">
                Fale agora por WhatsApp, Central Telefônica 24h ou E-mail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-sky-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-sky-800 bg-sky-900/60 p-2 gap-2">
          <button
            id="tab-contact-whatsapp"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-sky-950'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Falar no WhatsApp</span>
          </button>

          <button
            id="tab-contact-call"
            onClick={() => setActiveTab('call')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'call'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-sky-950'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Ligar Agora (24h)</span>
          </button>

          <button
            id="tab-contact-email"
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'email'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-sky-950'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Enviar E-mail</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh]">
          
          {/* 1. WHATSAPP TAB */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Atendimento Rápido no WhatsApp</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Plantão técnico online para orçamentos rápidos, envio de fotos de defeitos e agendamento direto.
                  </p>
                  <div className="mt-2 text-xs font-mono font-bold text-emerald-400">
                    Número Oficial: {RM_CONTACT_INFO.whatsappDisplay}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Qual o motivo do contato?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      'Orçamento de Serviços',
                      'Emergência 24h',
                      'Elétrica Predial',
                      'Ar-Condicionado / Climatização',
                      'Reforma Civil & Pintura',
                      'Dúvida Técnica Geral'
                    ].map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => {
                          setWaSubject(subject);
                          setWaCustomText(`Olá RM Manutec! Preciso de atendimento para: ${subject}.`);
                        }}
                        className={`p-2 rounded-lg border text-left font-medium transition-all ${
                          waSubject === subject
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                            : 'bg-sky-950 border-sky-800 text-slate-400 hover:border-sky-700'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mensagem prévia (pode editar à vontade):</label>
                  <textarea
                    rows={3}
                    value={waCustomText}
                    onChange={(e) => setWaCustomText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  id="btn-confirm-open-whatsapp"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Abrir Conversa no WhatsApp</span>
                  <ExternalLink className="w-4 h-4 opacity-75" />
                </button>

                <button
                  onClick={() => copyToClipboard(RM_CONTACT_INFO.whatsappDisplay, 'wa')}
                  className="px-4 py-3 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {copiedKey === 'wa' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'wa' ? 'Copiado!' : 'Copiar Número'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. CALL TAB */}
          {activeTab === 'call' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Central Telefônica & Plantão 24 Horas</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Linha direta para urgências civis, curto-circuitos, vazamentos, fechaduras e reformas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Central 1 */}
                <div className="p-4 rounded-xl bg-sky-950 border border-sky-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-rose-400">Linha Direta 24h</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Plantão</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-white">{RM_CONTACT_INFO.phone}</div>
                  <div className="flex gap-2 pt-1">
                    <a
                      href={`tel:${RM_CONTACT_INFO.phone.replace(/\D/g, '')}`}
                      className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" /> Ligar
                    </a>
                    <button
                      onClick={() => copyToClipboard(RM_CONTACT_INFO.phone, 'p1')}
                      className="px-3 py-2 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs"
                    >
                      {copiedKey === 'p1' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {/* Central Salvador */}
                <div className="p-4 rounded-xl bg-sky-950 border border-sky-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-blue-400">Salvador - BA</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">WhatsApp / Fone</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-white">{RM_CONTACT_INFO.phoneSecondary}</div>
                  <div className="flex gap-2 pt-1">
                    <a
                      href={`tel:${RM_CONTACT_INFO.phoneSecondary.replace(/\D/g, '')}`}
                      className="flex-1 py-2 rounded-lg bg-sky-900 hover:bg-sky-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" /> Ligar
                    </a>
                    <button
                      onClick={() => copyToClipboard(RM_CONTACT_INFO.phoneSecondary, 'ba')}
                      className="px-3 py-2 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs"
                    >
                      {copiedKey === 'ba' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Plantão info */}
              <div className="p-3.5 rounded-xl bg-sky-950/50 border border-sky-800 flex items-center gap-3 text-xs text-slate-400">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{RM_CONTACT_INFO.businessHours}</span>
              </div>
            </div>
          )}

          {/* 3. EMAIL TAB */}
          {activeTab === 'email' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">E-mail Oficial • Diretoria & Gestão Operacional</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Canal oficial para envio de memoriais descritivos, solicitações corporativas de compras, notas fiscais e propostas.
                  </p>
                </div>
              </div>

              {/* Official Email Card */}
              <div className="p-4 rounded-xl bg-sky-950 border border-sky-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-rose-400">Diretoria, Gestão & Comercial</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">Oficial</span>
                </div>
                <div className="text-sm font-mono font-bold text-white break-all">
                  rm.manutec.01@gmail.com
                </div>
                <div className="flex gap-2 pt-1">
                  <a
                    href="mailto:rm.manutec.01@gmail.com"
                    className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Escrever E-mail Agora
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('rm.manutec.01@gmail.com', 'em1')}
                    className="px-3 py-2 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    {copiedKey === 'em1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'em1' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {emailSentFeedback ? (
                <div className="p-6 text-center space-y-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                  <Check className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-base">E-mail registrado com sucesso!</h4>
                  <p className="text-xs text-slate-300">
                    Nossa equipe técnica e diretoria retornará em até 2 horas úteis no e-mail informado.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendEmailDirect} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Seu Nome</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Seu Nome Completo"
                        value={emailSenderName}
                        onChange={(e) => setEmailSenderName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Seu Telefone / E-mail de retorno</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: (11) 98765-4321"
                        value={emailSenderContact}
                        onChange={(e) => setEmailSenderContact(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Assunto da Mensagem</label>
                    <input
                      type="text"
                      required
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Mensagem detalhada</label>
                    <textarea
                      rows={3}
                      required
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar Mensagem Direta</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenMailto}
                      className="px-4 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir no Outlook / Gmail</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer address info */}
        <div className="p-4 bg-sky-900 border-t border-sky-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>{RM_CONTACT_INFO.address}</span>
            <span>•</span>
            <span className="text-slate-400 font-medium">CNPJ: {RM_CONTACT_INFO.cnpj}</span>
          </div>
          <span className="font-semibold text-slate-400">RM Manutec • Engenharia & Reparos</span>
        </div>
      </div>
    </div>
  );
};
