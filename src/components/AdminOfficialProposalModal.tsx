import React, { useState, useEffect } from 'react';
import { ServiceRequest, InteractionDocument } from '../types';
import { getBrasiliaFullDateTimeString, getBrasiliaDateString } from '../lib/brasiliaTime';
import { dispatchWhatsAppNotification } from '../lib/whatsappNotifications';
import {
  FileText,
  DollarSign,
  Send,
  X,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Building2,
  Clock,
  CreditCard,
  QrCode,
  Upload,
  AlertCircle,
  Copy,
  ExternalLink,
  Receipt,
  FileCheck,
  Sparkles
} from 'lucide-react';

interface AdminOfficialProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ServiceRequest[];
  initialRequest?: ServiceRequest | null;
  onTransmitDocument?: (threadId: string, doc: InteractionDocument) => void;
  onSaveRequest: (updatedReq: ServiceRequest) => void;
}

export const AdminOfficialProposalModal: React.FC<AdminOfficialProposalModalProps> = ({
  isOpen,
  onClose,
  requests,
  initialRequest,
  onTransmitDocument,
  onSaveRequest
}) => {
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  
  // Proposal Fields
  const [proposalNumber, setProposalNumber] = useState('');
  const [title, setTitle] = useState('Proposta Comercial & Orçamento Oficial de Engenharia');
  const [laborAmount, setLaborAmount] = useState<number>(350);
  const [materialsAmount, setMaterialsAmount] = useState<number>(150);
  const [displacementAmount, setDisplacementAmount] = useState<number>(0);
  const [executionDeadline, setExecutionDeadline] = useState('1 a 2 dias úteis');
  const [warrantyTerms, setWarrantyTerms] = useState('Garantia de 90 dias com suporte técnico e emissão de ART/CREA-BA');
  const [validityDays, setValidityDays] = useState(15);
  const [paymentTerms, setPaymentTerms] = useState('PIX à vista com 5% de desconto, Cartão de Crédito em até 12x ou Faturamento PJ / Boleto 28 dias');
  const [scopeDescription, setScopeDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentFileName, setAttachmentFileName] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    whatsappUrl: string;
    messageText: string;
    totalAmount: number;
    clientPhone: string;
    clientName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync initial request
  useEffect(() => {
    if (initialRequest) {
      setSelectedReqId(initialRequest.id);
      initProposalData(initialRequest);
    } else if (requests.length > 0 && !selectedReqId) {
      setSelectedReqId(requests[0].id);
      initProposalData(requests[0]);
    }
  }, [initialRequest, requests, isOpen]);

  const initProposalData = (req: ServiceRequest) => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setProposalNumber(`PROP-RM-${new Date().getFullYear()}-${randomDigits}`);
    
    // Suggest amounts based on existing budgetProposal if present
    const existingVal = req.budgetProposal?.totalAmount || (req.estimatedPrice ? parseFloat(req.estimatedPrice.replace(/[^\d.,]/g, '').replace(',', '.')) : 0);
    if (existingVal && existingVal > 0) {
      setLaborAmount(Math.round(existingVal * 0.7));
      setMaterialsAmount(Math.round(existingVal * 0.3));
    } else {
      setLaborAmount(380);
      setMaterialsAmount(120);
    }

    setScopeDescription(
      req.description ||
      `Execução especializada dos serviços de ${req.serviceName}, incluindo mão de obra qualificada com EPIs, materiais normatizados, testes de funcionamento e laudo técnico com emissão de ART.`
    );
    setSuccessData(null);
  };

  if (!isOpen) return null;

  const currentReq = requests.find(r => r.id === selectedReqId) || initialRequest;
  const totalAmount = Math.max(0, (Number(laborAmount) || 0) + (Number(materialsAmount) || 0) + (Number(displacementAmount) || 0));

  const handleRequestChange = (reqId: string) => {
    setSelectedReqId(reqId);
    const found = requests.find(r => r.id === reqId);
    if (found) {
      initProposalData(found);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachmentUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReq) return;

    setIsSubmitting(true);

    const nowStr = getBrasiliaFullDateTimeString();
    const expiryDateStr = getBrasiliaDateString();

    // 1. Create Interaction Document
    const interactionDoc: InteractionDocument = {
      id: `doc-orc-${Date.now()}`,
      title: `${title} (${proposalNumber})`,
      description: `${scopeDescription}\n\n• Mão de Obra: R$ ${laborAmount.toFixed(2)}\n• Materiais: R$ ${materialsAmount.toFixed(2)}${displacementAmount > 0 ? `\n• Deslocamento/ART: R$ ${displacementAmount.toFixed(2)}` : ''}\n• Prazo: ${executionDeadline}\n• Garantia: ${warrantyTerms}\n• Condições: ${paymentTerms}`,
      type: 'orcamento',
      fileUrl: attachmentUrl || undefined,
      fileName: attachmentFileName || `proposta_oficial_${currentReq.protocolNumber}.pdf`,
      senderRole: 'admin',
      senderName: 'Central Operacional RM Manutec',
      senderPhone: '(71) 99649-2354',
      status: 'aprovado_admin',
      isLockedForClient: true,
      createdAt: nowStr,
      amount: totalAmount,
      officialNumber: proposalNumber,
      expirationDate: expiryDateStr
    };

    // 2. Transmit to thread
    if (onTransmitDocument) {
      onTransmitDocument(currentReq.id, interactionDoc);
    }

    // 3. Update Service Request
    const updatedReq: ServiceRequest = {
      ...currentReq,
      paymentAmount: totalAmount.toFixed(2),
      budgetProposal: {
        totalAmount,
        laborAmount,
        materialsAmount,
        details: scopeDescription,
        status: 'definido',
        generatedAt: nowStr
      },
      status: currentReq.status === 'pendente' || currentReq.status === 'em_analise' ? 'orcamento_gerado' : currentReq.status,
      history: [
        ...(currentReq.history || []),
        {
          id: `hist-prop-${Date.now()}`,
          date: nowStr,
          description: `Proposta/Orçamento Oficial (${proposalNumber}) de R$ ${totalAmount.toFixed(2)} emitido pela Administração Central e enviado ao cliente.`,
          actor: 'Central Operacional RM Manutec'
        }
      ]
    };

    onSaveRequest(updatedReq);

    // 4. Build WhatsApp notification to the client
    const cleanPhone = (currentReq.clientPhone || '').replace(/\D/g, '');
    const validPhone = cleanPhone.length >= 10 ? cleanPhone : '71996492354';
    const targetPhoneWithCountry = validPhone.startsWith('55') ? validPhone : `55${validPhone}`;

    const portalLink = typeof window !== 'undefined' ? window.location.origin : 'https://rmmanutec.com.br';

    const messageText = `📋 *RM MANUTEC • PROPOSTA COMERCIAL & ORÇAMENTO OFICIAL*

Olá, *${currentReq.clientName}*!
A Central de Gestão da RM Manutec emitiu a Proposta Oficial para o seu atendimento:

🔹 *Protocolo:* ${currentReq.protocolNumber}
🔹 *Serviço:* ${currentReq.serviceName}
🔹 *Nº do Orçamento:* ${proposalNumber}

💵 *Detalhamento dos Valores:*
• Mão de Obra Especializada: R$ ${laborAmount.toFixed(2)}
• Peças / Materiais Normatizados: R$ ${materialsAmount.toFixed(2)}${displacementAmount > 0 ? `\n• Deslocamento / ART: R$ ${displacementAmount.toFixed(2)}` : ''}
⭐ *VALOR TOTAL:* *R$ ${totalAmount.toFixed(2)}*

⏱️ *Prazo de Execução:* ${executionDeadline}
🛡️ *Garantia:* ${warrantyTerms}
💳 *Condições de Pagamento:* ${paymentTerms}
📅 *Validade:* ${validityDays} dias corridos

Acesse agora o Portal Oficial para aprovação ou solicitação de ajustes:
👉 ${portalLink}

Equipe de Engenharia RM Manutec
Eng. Resp.: Roselito Alves de Souza - CREA-BA 506.892/D
WhatsApp Central: (71) 99649-2354`;

    const encodedMsg = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${targetPhoneWithCountry}?text=${encodedMsg}`;

    // Disparar notificação de WhatsApp
    dispatchWhatsAppNotification({
      type: 'solicitacao_servico',
      targetRole: 'cliente',
      recipientName: currentReq.clientName,
      recipientPhone: targetPhoneWithCountry,
      recipientPhoneFormatted: currentReq.clientPhone,
      messageText,
      whatsappUrl,
      status: 'disparado'
    }, true);

    setIsSubmitting(false);
    setSuccessData({
      whatsappUrl,
      messageText,
      totalAmount,
      clientPhone: currentReq.clientPhone,
      clientName: currentReq.clientName
    });
  };

  const handleCopyMessage = () => {
    if (successData?.messageText) {
      navigator.clipboard.writeText(successData.messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sky-950/75 backdrop-blur-sm overflow-y-auto">
      <div 
        id="modal-emitir-proposta-oficial"
        className="relative w-full max-w-3xl rounded-3xl bg-sky-950 border border-sky-700 shadow-2xl text-slate-100 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-900 border-b border-blue-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase tracking-wider">
                  Módulo Administrativo Master
                </span>
                <span className="text-xs font-mono text-blue-300/80">{proposalNumber}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Emitir Proposta / Orçamento Oficial
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-sky-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {successData ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-black text-white">
                Proposta Oficial Emitida com Sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                A proposta no valor total de <strong className="text-emerald-400 font-mono">R$ {successData.totalAmount.toFixed(2)}</strong> foi vinculada à ordem de serviço e disponibilizada no portal do cliente <strong>{successData.clientName}</strong>.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="p-4 rounded-2xl bg-sky-900 border border-sky-800 text-left space-y-3 max-w-lg mx-auto">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Destinatário:</span>
                <span className="text-white font-bold">{successData.clientName} ({successData.clientPhone})</span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <a
                  href={successData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Abrir no WhatsApp do Cliente</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 font-bold text-xs border border-sky-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-blue-400" />
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar Janela
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
            
            {/* 1. Request Selection */}
            <div className="p-4 rounded-2xl bg-sky-900/80 border border-sky-800 space-y-3">
              <label className="block text-slate-300 font-bold">
                Selecione o Chamado / Ordem de Serviço *
              </label>
              <select
                value={selectedReqId}
                onChange={(e) => handleRequestChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-sky-950 border border-sky-700 text-white font-semibold outline-none focus:border-blue-500"
              >
                {requests.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.protocolNumber} - {r.serviceName} ({r.clientName} • {r.clientPhone})
                  </option>
                ))}
              </select>

              {currentReq && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Cliente:</span>
                    <strong className="text-white">{currentReq.clientName}</strong>
                    <span className="text-slate-400 font-mono block">{currentReq.clientPhone}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Endereço do Local:</span>
                    <span className="text-slate-200">
                      {currentReq.address.street}, {currentReq.address.number} - {currentReq.address.neighborhood}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipo & Urgência:</span>
                    <span className="text-amber-400 font-bold">
                      {currentReq.serviceName} • {currentReq.urgency?.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Proposal Number and Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Número do Orçamento Oficial
                </label>
                <input
                  type="text"
                  required
                  value={proposalNumber}
                  onChange={(e) => setProposalNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-sky-900 border border-sky-700 text-amber-300 font-mono font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-bold mb-1">
                  Título da Proposta
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-sky-900 border border-sky-700 text-white font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 3. Detailed Financial Breakdown */}
            <div className="p-4 rounded-2xl bg-sky-900 border border-sky-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Composição de Custos da Proposta</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-black text-sm">
                  TOTAL: R$ {totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Mão de Obra Especializada (R$) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={laborAmount}
                    onChange={(e) => setLaborAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl bg-sky-950 border border-sky-700 text-white font-mono font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Materiais & Peças (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={materialsAmount}
                    onChange={(e) => setMaterialsAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl bg-sky-950 border border-sky-700 text-white font-mono font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Taxa Deslocamento / ART (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={displacementAmount}
                    onChange={(e) => setDisplacementAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl bg-sky-950 border border-sky-700 text-white font-mono font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Scope and Technical Details */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Escopo dos Serviços & Laudo Técnico *
              </label>
              <textarea
                rows={3}
                required
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                placeholder="Descreva detalhadamente o escopo dos serviços, materiais que serão utilizados e procedimentos técnicos..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-sky-900 border border-sky-700 text-slate-200 outline-none focus:border-blue-500 leading-relaxed font-sans"
              />
            </div>

            {/* 5. Execution Terms & Warranty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Prazo de Execução</span>
                </label>
                <input
                  type="text"
                  value={executionDeadline}
                  onChange={(e) => setExecutionDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Termo de Garantia</span>
                </label>
                <input
                  type="text"
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Validade da Proposta (Dias)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white font-mono outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 6. Payment Terms */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Condições de Pagamento
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-sky-900 border border-sky-700 text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* 7. Optional File Attachment */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Anexar Documento / PDF ou Foto do Orçamento Timbrado (Opcional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 px-3 py-2 rounded-xl bg-sky-900 border border-dashed border-sky-700 hover:border-blue-500 text-slate-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>{attachmentFileName || 'Clique para anexar arquivo PDF ou foto do orçamento'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {attachmentFileName && (
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentFileName('');
                      setAttachmentUrl('');
                    }}
                    className="p-2 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-sky-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 font-semibold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Orçamento Oficial ao Cliente</span>
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
