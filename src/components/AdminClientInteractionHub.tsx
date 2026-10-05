import React, { useState, useRef } from 'react';
import {
  AdminClientInteractionThread,
  InteractionDocument,
  DirectInteractionMessage,
  UserRole,
  UserProfile,
  ServiceRequest,
  PaymentMethod
} from '../types';
import { RM_BANKING_DETAILS, RM_CONTACT_INFO } from '../data/servicesData';
import {
  buildDirectMessageNotification,
  buildBudgetNotification,
  buildWriterToAdminChatNotification,
  buildWriterToAdminFileNotification,
  dispatchWhatsAppNotification
} from '../lib/whatsappNotifications';
import { getBrasiliaFullDateTimeString, getBrasiliaTimeString } from '../lib/brasiliaTime';
import { WhatsAppNotificationModal } from './WhatsAppNotificationModal';
import {
  FileText,
  DollarSign,
  Receipt,
  MessageSquare,
  ShieldCheck,
  Send,
  Upload,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Lock,
  Unlock,
  CreditCard,
  Building2,
  Calendar,
  X,
  FileCheck,
  Search,
  Filter,
  Check,
  Copy,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  CornerDownRight,
  Smartphone,
  Paperclip,
  Image as ImageIcon,
  UploadCloud,
  FolderLock,
  HardDrive
} from 'lucide-react';

interface AdminClientInteractionHubProps {
  userRole: UserRole; // 'admin' | 'cliente' | 'tecnico'
  currentUser?: UserProfile;
  threads: AdminClientInteractionThread[];
  requests?: ServiceRequest[];
  selectedThreadId?: string;
  onTransmitDocument: (threadId: string, doc: InteractionDocument) => void;
  onAdminUpdateDocument?: (threadId: string, docId: string, updates: Partial<InteractionDocument>) => void;
  onAdminDeleteDocument?: (threadId: string, docId: string) => void;
  onSendMessage: (threadId: string, msg: DirectInteractionMessage) => void;
  onOpenPayment?: (request: ServiceRequest) => void;
}

export const AdminClientInteractionHub: React.FC<AdminClientInteractionHubProps> = ({
  userRole,
  currentUser,
  threads,
  requests = [],
  selectedThreadId,
  onTransmitDocument,
  onAdminUpdateDocument,
  onAdminDeleteDocument,
  onSendMessage,
  onOpenPayment
}) => {
  const isAdmin = userRole === 'admin';

  // Active Thread selection
  const [activeThreadId, setActiveThreadId] = useState<string>(
    selectedThreadId || threads[0]?.id || ''
  );

  // Active sub-tab inside the hub: 'todos' | 'orcamentos' | 'comprovantes' | 'mensagens' | 'moderacao'
  const [activeTab, setActiveTab] = useState<'todos' | 'orcamentos' | 'comprovantes' | 'mensagens' | 'moderacao'>('todos');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Drawers
  const [isNewBudgetModalOpen, setIsNewBudgetModalOpen] = useState(false);
  const [isNewReceiptModalOpen, setIsNewReceiptModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<InteractionDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<InteractionDocument | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Quick Message Input State
  const [newMessageText, setNewMessageText] = useState('');

  // Form State: New Budget (Admin Only) - Clean & Ready for input
  const [budgetTitle, setBudgetTitle] = useState('Orçamento & Proposta Comercial');
  const [budgetDescription, setBudgetDescription] = useState('');
  const [budgetLabor, setBudgetLabor] = useState<number>(0);
  const [budgetMaterials, setBudgetMaterials] = useState<number>(0);
  const [budgetValidity, setBudgetValidity] = useState<number>(10);
  const [budgetAdminNotes, setBudgetAdminNotes] = useState('');
  const [budgetItems, setBudgetItems] = useState<{ description: string; quantity: number; unitPrice: number; total: number }[]>([]);

  // Form State: New Receipt / Document Transmission (Client or Admin)
  const [docCategory, setDocCategory] = useState<'comprovante_pagamento' | 'orcamento' | 'laudo_vistoria' | 'recibo_fiscal' | 'termo_garantia' | 'outro'>('comprovante_pagamento');
  const [receiptTitle, setReceiptTitle] = useState('Comprovante de Pagamento PIX');
  const [docDescription, setDocDescription] = useState('');
  const [receiptAmount, setReceiptAmount] = useState<number>(0);
  const [receiptMethod, setReceiptMethod] = useState<PaymentMethod>('pix');
  const [receiptFileUrl, setReceiptFileUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptFileSize, setReceiptFileSize] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessReceiptFile = (file: File) => {
    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setReceiptFileUrl(reader.result);
        setReceiptFileName(file.name);
        setReceiptFileSize(formatBytes(file.size));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessReceiptFile(file);
    }
  };

  const handleRemoveReceiptAttachment = () => {
    setReceiptFileUrl('');
    setReceiptFileName('');
    setReceiptFileSize('');
    if (receiptFileInputRef.current) {
      receiptFileInputRef.current.value = '';
    }
  };

  // WhatsApp Notification Modal State
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

  // Current active thread
  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const associatedRequest = requests.find(r => r.id === activeThread?.requestId || r.protocolNumber === activeThread?.protocolNumber);

  // Filtered documents inside the active thread
  const filteredDocuments = (activeThread?.documents || []).filter(doc => {
    if (activeTab === 'orcamentos') return doc.type === 'orcamento';
    if (activeTab === 'comprovantes') return doc.type === 'comprovante_pagamento' || doc.type === 'recibo_fiscal';
    if (searchTerm) {
      return (
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        doc.senderName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  const handleCopyCnpj = () => {
    navigator.clipboard.writeText(RM_BANKING_DETAILS.pixKeyCnpj);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Send interactive chat message with WhatsApp notification dispatch
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeThread) return;

    const senderRole = isAdmin ? 'admin' : 'cliente';
    const senderName = isAdmin ? 'Administração RM Manutec' : (currentUser?.name || activeThread.clientName);
    const recipientName = isAdmin ? activeThread.clientName : 'Central de Gestão RM Manutec';
    const recipientPhone = isAdmin ? (associatedRequest?.clientPhone || activeThread.clientPhone || '71996492354') : '71996492354';
    const recipientRole = isAdmin ? 'cliente' : 'admin';

    const newMsg: DirectInteractionMessage = {
      id: `msg-${Date.now()}`,
      threadId: activeThread.id,
      requestId: activeThread.requestId,
      senderRole,
      senderName,
      text: newMessageText.trim(),
      timestamp: getBrasiliaTimeString()
    };

    onSendMessage(activeThread.id, newMsg);

    // Build & dispatch WhatsApp notification - Auto-opens conversation with the administrator (or client if admin)
    if (isAdmin) {
      const notif = buildDirectMessageNotification({
        protocolNumber: activeThread.protocolNumber,
        recipientName,
        recipientPhone,
        senderName,
        senderRole,
        messageText: newMessageText.trim(),
        serviceName: associatedRequest?.serviceName
      });

      dispatchWhatsAppNotification({
        type: 'mensagem_chat',
        targetRole: recipientRole,
        recipientName,
        recipientPhone: notif.targetPhone,
        recipientPhoneFormatted: recipientPhone,
        messageText: notif.message,
        whatsappUrl: notif.url,
        status: 'disparado'
      }, true);
    } else {
      // Solicitante/Usuário escrevendo no app -> abre conversa direta no WhatsApp do Administrador (71 99649-2354)
      const notif = buildWriterToAdminChatNotification({
        senderName,
        senderPhone: currentUser?.phone || activeThread.clientPhone,
        senderRole,
        protocolNumber: activeThread.protocolNumber,
        serviceName: associatedRequest?.serviceName,
        messageText: newMessageText.trim()
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
    }

    setNewMessageText('');
  };

  // Admin: Submit New Budget with WhatsApp Notification
  const handleCreateBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread) return;

    const totalAmount = (Number(budgetLabor) || 0) + (Number(budgetMaterials) || 0);

    const newDoc: InteractionDocument = {
      id: `doc-orc-${Date.now()}`,
      requestId: activeThread.requestId,
      protocolNumber: activeThread.protocolNumber,
      type: 'orcamento',
      title: budgetTitle,
      description: budgetDescription || 'Orçamento oficial emitido pela Engenharia e Administração RM Manutec.',
      senderRole: 'admin',
      senderName: 'Engenharia RM Manutec (Admin)',
      createdAt: getBrasiliaFullDateTimeString(),
      amount: totalAmount,
      laborAmount: Number(budgetLabor) || 0,
      materialsAmount: Number(budgetMaterials) || 0,
      validityDays: budgetValidity,
      status: 'aprovado_admin',
      adminNotes: budgetAdminNotes || 'Orçamento validado pela coordenação técnica.',
      adminFeedback: 'Proposta disponível para análise e aprovação do cliente.',
      isLockedForClient: true,
      items: budgetItems
    };

    onTransmitDocument(activeThread.id, newDoc);

    // Build & dispatch WhatsApp notification to the client
    const clientPhone = associatedRequest?.clientPhone || activeThread.clientPhone || '71996492354';
    const notif = buildBudgetNotification({
      protocolNumber: activeThread.protocolNumber,
      clientName: activeThread.clientName,
      clientPhone,
      budgetTitle,
      totalAmount,
      laborAmount: Number(budgetLabor) || 0,
      materialsAmount: Number(budgetMaterials) || 0,
      validityDays: budgetValidity,
      notes: budgetDescription
    });

    dispatchWhatsAppNotification({
      type: 'orcamento',
      targetRole: 'cliente',
      recipientName: activeThread.clientName,
      recipientPhone: notif.targetPhone,
      recipientPhoneFormatted: clientPhone,
      messageText: notif.message,
      whatsappUrl: notif.url,
      status: 'disparado'
    }, false);

    setIsNewBudgetModalOpen(false);
    setActiveTab('orcamentos');
  };

  // Client/Admin: Submit Document & Store in Vault
  const handleCreateReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread) return;

    setIsSubmittingDoc(true);

    const methodName = 
      receiptMethod === 'pix' ? 'PIX' :
      receiptMethod === 'cartao_credito' ? 'Cartão de Crédito' :
      receiptMethod === 'cartao_debito' ? 'Cartão de Débito' : 'Faturamento PJ';

    const categoryDescriptions: Record<string, string> = {
      comprovante_pagamento: `Comprovante de pagamento transmitido via ${methodName}`,
      orcamento: 'Orçamento detalhado e precificação oficial',
      laudo_vistoria: 'Laudo técnico pericial de vistoria preventiva/corretiva',
      recibo_fiscal: 'Recibo comprobatório / Nota Fiscal de serviços',
      termo_garantia: 'Termo formal de garantia e conformidade técnica',
      outro: 'Documentação complementar de atendimento'
    };

    const finalDescription = docDescription.trim() || 
      `${categoryDescriptions[docCategory] || 'Documento anexado'}${receiptFileName ? ` • Arquivo: ${receiptFileName}` : ''}.`;

    const newDoc: InteractionDocument = {
      id: `doc-${docCategory.slice(0, 4)}-${Date.now()}`,
      requestId: activeThread.requestId,
      protocolNumber: activeThread.protocolNumber,
      type: docCategory,
      title: receiptTitle.trim() || (docCategory === 'comprovante_pagamento' ? 'Comprovante de Pagamento' : 'Documento Anexado'),
      description: finalDescription,
      senderRole: isAdmin ? 'admin' : 'cliente',
      senderName: isAdmin ? 'Administração RM Manutec' : (currentUser?.name || activeThread.clientName),
      senderPhone: isAdmin ? '71996492354' : (currentUser?.phone || activeThread.clientPhone),
      createdAt: getBrasiliaFullDateTimeString(),
      amount: Number(receiptAmount) || 0,
      paymentMethodUsed: docCategory === 'comprovante_pagamento' ? receiptMethod : undefined,
      fileUrl: receiptFileUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      fileName: receiptFileName || `doc_${activeThread.protocolNumber}_${Date.now()}.png`,
      status: isAdmin ? 'aprovado_admin' : 'em_analise_admin',
      adminNotes: isAdmin ? 'Documento homologado diretamente pela administração.' : 'Aguardando validação da equipe gestora RM Manutec.',
      isLockedForClient: true
    };

    onTransmitDocument(activeThread.id, newDoc);

    // Build & dispatch WhatsApp notification for file/document transmission
    if (isAdmin) {
      const clientPhone = associatedRequest?.clientPhone || activeThread.clientPhone || '71996492354';
      const notif = buildDirectMessageNotification({
        protocolNumber: activeThread.protocolNumber,
        recipientName: activeThread.clientName,
        recipientPhone: clientPhone,
        senderName: 'Central de Gestão RM Manutec',
        senderRole: 'admin',
        messageText: `Documento oficial arquivado: "${newDoc.title}".`,
        serviceName: associatedRequest?.serviceName
      });

      dispatchWhatsAppNotification({
        type: 'arquivo_transmitido',
        targetRole: 'cliente',
        recipientName: activeThread.clientName,
        recipientPhone: notif.targetPhone,
        recipientPhoneFormatted: clientPhone,
        messageText: notif.message,
        whatsappUrl: notif.url,
        status: 'disparado'
      }, true);
    } else {
      // Solicitante/escrevente transmitindo arquivo -> abre conversa no WhatsApp do Administrador (71 99649-2354)
      const notif = buildWriterToAdminFileNotification({
        senderName: currentUser?.name || activeThread.clientName,
        senderPhone: currentUser?.phone || activeThread.clientPhone,
        senderRole: userRole,
        protocolNumber: activeThread.protocolNumber,
        serviceName: associatedRequest?.serviceName,
        fileName: newDoc.fileName || 'arquivo.pdf',
        fileType: docCategory,
        description: newDoc.description,
        fileUrl: newDoc.fileUrl
      });

      dispatchWhatsAppNotification({
        type: 'arquivo_transmitido',
        targetRole: 'admin',
        recipientName: 'Administrador RM Manutec',
        recipientPhone: notif.targetPhone,
        recipientPhoneFormatted: '(71) 99649-2354',
        messageText: notif.message,
        whatsappUrl: notif.url,
        status: 'disparado'
      }, true);
    }

    // Feedback visual
    setSubmissionFeedback(`Documento "${newDoc.title}" transmitido e arquivado com sucesso no Cofre de Segurança! Conversa aberta no WhatsApp.`);
    setTimeout(() => {
      setSubmissionFeedback(null);
    }, 4500);

    setIsSubmittingDoc(false);
    setIsNewReceiptModalOpen(false);
    setReceiptFileUrl('');
    setReceiptFileName('');
    setReceiptFileSize('');
    setDocDescription('');
    
    if (docCategory === 'orcamento') {
      setActiveTab('orcamentos');
    } else {
      setActiveTab('comprovantes');
    }
  };


  // Admin: Save edit on existing document
  const handleSaveDocEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !editingDoc || !onAdminUpdateDocument) return;

    onAdminUpdateDocument(activeThread.id, editingDoc.id, {
      title: editingDoc.title,
      description: editingDoc.description,
      amount: editingDoc.amount,
      laborAmount: editingDoc.laborAmount,
      materialsAmount: editingDoc.materialsAmount,
      status: editingDoc.status,
      adminNotes: editingDoc.adminNotes,
      adminFeedback: editingDoc.adminFeedback,
      txId: editingDoc.txId
    });

    setEditingDoc(null);
  };

  const getDocStatusBadge = (status: InteractionDocument['status']) => {
    switch (status) {
      case 'aprovado_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Validado / Aprovado pela Gestão
          </span>
        );
      case 'em_analise_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
            <Clock className="w-3 h-3 text-amber-400" /> Sob Análise da Administração
          </span>
        );
      case 'rejeitado_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-400" /> Recusado / Requer Ajuste
          </span>
        );
      case 'retificado_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Edit3 className="w-3 h-3 text-purple-400" /> Retificado pelo Administrador
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Send className="w-3 h-3 text-blue-400" /> Transmitido
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dynamic Feedback Banner */}
      {submissionFeedback && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-sky-900 border border-emerald-500/50 shadow-xl flex items-center justify-between gap-3 text-emerald-200 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Envio Confirmado & Gravado com Sucesso!</span>
              <span className="text-[11px] text-emerald-300/90">{submissionFeedback}</span>
            </div>
          </div>
          <button
            onClick={() => setSubmissionFeedback(null)}
            className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* 1. Header Banner & Security Shield */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-950 via-sky-900 to-sky-900 border border-sky-700/80 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/20 shrink-0 font-black">
            <Receipt className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">
                Central de Documentos & Interação Admin ↔ Cliente
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border ${
                isAdmin 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {isAdmin ? '👑 Modo Administrador (Edição Total)' : '👤 Modo Cliente (Envio & Visualização)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Transmissão oficial de <strong>Orçamentos Detalhados</strong>, <strong>Comprovantes de Pagamento</strong> e <strong>Documentos Técnicos</strong>. 
              {isAdmin 
                ? ' Somente o administrador possui permissão para editar, retificar e moderar as abas e documentos após o envio.' 
                : ' Seus envios são gravados com integridade e arquivados no cofre permanente de auditoria.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto flex-wrap sm:flex-nowrap">
          {isAdmin ? (
            <button
              id="btn-admin-emitir-orcamento"
              onClick={() => setIsNewBudgetModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Novo Orçamento</span>
            </button>
          ) : null}

          <button
            id="btn-transmitir-comprovante"
            onClick={() => setIsNewReceiptModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer transform active:scale-95"
          >
            <UploadCloud className="w-4 h-4 text-slate-950" />
            <span>Enviar Documento / Comprovante</span>
          </button>
        </div>
      </div>

      {/* 2. Admin-Only Security Warning Banner */}
      <div className="p-3.5 rounded-xl bg-sky-900/80 border border-sky-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block text-xs sm:text-sm">
              Regra de Integridade & Controle de Edição Restrita:
            </span>
            <span className="text-[11px] text-slate-400">
              {isAdmin
                ? '✅ Administrador Autorizado: Você pode editar orçamentos, aprovar/recusar comprovantes, ajustar valores e reabrir abas.'
                : '🔒 O cliente pode enviar comprovantes e mensagens. A edição de registros e abas consolidadas é de exclusividade da Administração.'}
            </span>
          </div>
        </div>

        <button
          onClick={handleCopyCnpj}
          className="px-3 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          title="Copiar CNPJ oficial da empresa"
        >
          {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedKey ? 'Copiado!' : 'PIX CNPJ: 64.177.147/0001-34'}</span>
        </button>
      </div>

      {/* 3. Main Interactive Layout: Sidebar of Threads + Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: List of Orders / Interaction Threads */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-sky-950 border border-sky-800 p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-400" /> Chamados & Protocolos ({threads.length})
              </h3>
            </div>

            <div className="space-y-2">
              {threads.map(th => {
                const isSelected = th.id === activeThreadId;
                const totalDocs = th.documents?.length || 0;
                const orcCount = th.documents?.filter(d => d.type === 'orcamento').length || 0;
                const compCount = th.documents?.filter(d => d.type === 'comprovante_pagamento').length || 0;

                return (
                  <button
                    key={th.id}
                    onClick={() => setActiveThreadId(th.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-sky-800 to-sky-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-sky-900/60 hover:bg-sky-900/80 border-sky-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-amber-400">{th.protocolNumber}</span>
                      <span className="text-[10px] text-slate-400">{th.lastActivityAt}</span>
                    </div>

                    <p className="font-bold text-white text-xs line-clamp-1">{th.serviceName}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>👤 {th.clientName}</span>
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-sky-800/60 text-[10px]">
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-semibold">
                        {orcCount} orçamentos
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-semibold">
                        {compCount} comprovantes
                      </span>
                      <span className="text-slate-400 ml-auto flex items-center gap-0.5">
                        <MessageSquare className="w-2.5 h-2.5" /> {th.messages?.length || 0}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Workspace: Selected Thread Content */}
        <div className="lg:col-span-8 space-y-4">
          
          {activeThread ? (
            <div className="rounded-2xl bg-sky-950 border border-sky-800 overflow-hidden shadow-xl">
              
              {/* Thread Top Bar */}
              <div className="p-4 sm:p-5 bg-sky-900/90 border-b border-sky-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {activeThread.protocolNumber}
                    </span>
                    <span className="text-xs text-slate-400">• Criado em {activeThread.createdAt}</span>
                  </div>
                  <h3 className="font-bold text-base text-white mt-1">{activeThread.serviceName}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Cliente: <strong>{activeThread.clientName}</strong>
                  </p>
                </div>

                {/* Sub-Tabs Selector */}
                <div className="flex items-center gap-1.5 bg-sky-950 p-1 rounded-xl border border-sky-800 text-xs overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('todos')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeTab === 'todos'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos ({activeThread.documents?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('orcamentos')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeTab === 'orcamentos'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📋 Orçamentos ({activeThread.documents?.filter(d => d.type === 'orcamento').length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('comprovantes')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeTab === 'comprovantes'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💳 Comprovantes ({activeThread.documents?.filter(d => d.type === 'comprovante_pagamento').length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('mensagens')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeTab === 'mensagens'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💬 Chat ({activeThread.messages?.length || 0})
                  </button>
                </div>
              </div>

              {/* Thread Content Area */}
              <div className="p-4 sm:p-6 space-y-6">
                
                {/* 1. DOCUMENTS LIST (when activeTab != 'mensagens') */}
                {activeTab !== 'mensagens' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        Documentos Transmitidos no Protocolo
                      </h4>

                      {isAdmin && (
                        <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Modo de Edição Liberado para Gestor
                        </span>
                      )}
                    </div>

                    {filteredDocuments.length === 0 ? (
                      <div className="p-8 rounded-xl bg-sky-900/50 border border-sky-800 text-center space-y-2">
                        <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">Nenhum documento encontrado nesta categoria.</p>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          {isAdmin && (
                            <button
                              onClick={() => setIsNewBudgetModalOpen(true)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 cursor-pointer"
                            >
                              Emitir Orçamento
                            </button>
                          )}
                          <button
                            onClick={() => setIsNewReceiptModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                          >
                            Transmitir Comprovante
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredDocuments.map(doc => {
                          const isBudget = doc.type === 'orcamento';
                          const isReceipt = doc.type === 'comprovante_pagamento';

                          return (
                            <div
                              key={doc.id}
                              className="p-4 rounded-xl bg-sky-900 border border-sky-800 hover:border-sky-700 transition-all space-y-3 shadow-md"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    isBudget ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  }`}>
                                    {isBudget ? <FileText className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-white text-sm leading-tight">{doc.title}</h5>
                                    <span className="text-[11px] text-slate-400 block">
                                      Enviado por: <strong className="text-slate-300">{doc.senderName}</strong> • {doc.createdAt}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                                  {getDocStatusBadge(doc.status)}

                                  {/* Value Pill */}
                                  {doc.amount !== undefined && doc.amount > 0 && (
                                    <span className="font-mono font-bold text-xs text-white px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-700">
                                      R$ {doc.amount.toFixed(2).replace('.', ',')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {doc.description && (
                                <p className="text-xs text-slate-300 leading-relaxed bg-sky-950/60 p-2.5 rounded-lg border border-sky-800/80">
                                  {doc.description}
                                </p>
                              )}

                              {/* Items Breakdown if Budget */}
                              {doc.items && doc.items.length > 0 && (
                                <div className="p-3 rounded-lg bg-sky-950/90 border border-sky-800 space-y-1.5 text-xs">
                                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                    Detalhamento de Itens & Serviços:
                                  </span>
                                  <div className="space-y-1">
                                    {doc.items.map((item, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-sky-800/40 last:border-0">
                                        <span>• {item.description} (Qtd: {item.quantity || 1})</span>
                                        <span className="font-mono font-semibold text-slate-200">
                                          R$ {(item.total || (item.unitPrice || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex justify-between pt-1 border-t border-sky-700 text-xs font-bold text-white">
                                    <span>Mão de Obra: R$ {(doc.laborAmount || 0).toFixed(2).replace('.', ',')} • Peças: R$ {(doc.materialsAmount || 0).toFixed(2).replace('.', ',')}</span>
                                    <span className="text-amber-400 font-mono">Total: R$ {(doc.amount || 0).toFixed(2).replace('.', ',')}</span>
                                  </div>
                                </div>
                              )}

                              {/* Receipt / Comprovante Details */}
                              {isReceipt && (
                                <div className="space-y-1.5">
                                  {doc.paymentMethodUsed && (
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-sky-950/90 border border-sky-800 text-xs">
                                      <span className="text-slate-400 text-[11px]">Forma de Pagamento:</span>
                                      <span className="text-emerald-400 font-bold uppercase">{doc.paymentMethodUsed === 'pix' ? 'PIX (CNPJ 64.177.147/0001-34)' : doc.paymentMethodUsed}</span>
                                    </div>
                                  )}
                                  {doc.fileName && (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-sky-950/70 border border-sky-800 text-xs text-slate-300">
                                      <Paperclip className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span className="truncate">Documento Anexado: <strong className="text-white">{doc.fileName}</strong></span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Admin Feedback / Validation Notes */}
                              {doc.adminNotes && (
                                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-0.5">
                                  <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Parecer Oficial da Administração:
                                  </span>
                                  <p className="text-slate-300 text-[11px]">{doc.adminNotes}</p>
                                </div>
                              )}

                              {/* Actions Bar */}
                              <div className="flex items-center justify-between pt-2 border-t border-sky-800/80 text-xs">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setViewingDoc(doc)}
                                    className="px-2.5 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 text-slate-300 hover:text-white border border-sky-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Visualizar Documento</span>
                                  </button>

                                  {isBudget && associatedRequest && onOpenPayment && (
                                    <button
                                      onClick={() => onOpenPayment(associatedRequest)}
                                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                      <span>Aprovar & Pagar</span>
                                    </button>
                                  )}
                                </div>

                                {/* ADMIN-ONLY MODERATION & EDIT BUTTONS */}
                                {isAdmin ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => setEditingDoc(doc)}
                                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                      title="Editar documento (exclusivo para administração)"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Editar Documento</span>
                                    </button>

                                    {onAdminDeleteDocument && (
                                      <button
                                        onClick={() => {
                                          if (confirm('Tem certeza que deseja excluir este documento?')) {
                                            onAdminDeleteDocument(activeThread.id, doc.id);
                                          }
                                        }}
                                        className="p-1 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 transition-colors cursor-pointer"
                                        title="Excluir documento (Admin)"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Registro Protegido
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. INTERACTIVE CHAT & DIRECT MESSAGING */}
                <div className={`space-y-3 ${activeTab !== 'mensagens' ? 'pt-4 border-t border-sky-800' : ''}`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-rose-400" />
                      Canal Direto de Atendimento e Mensagens
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Canal oficial registrado
                    </span>
                  </div>

                  {/* Messages Feed */}
                  <div className="p-4 rounded-xl bg-sky-900/80 border border-sky-800 max-h-72 overflow-y-auto space-y-3">
                    {activeThread.messages?.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">
                        Nenhuma mensagem enviada ainda. Digite abaixo para iniciar o diálogo com a equipe.
                      </p>
                    ) : (
                      activeThread.messages.map(msg => {
                        const isFromAdmin = msg.senderRole === 'admin';

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isFromAdmin ? 'items-start' : 'items-end'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                              <span className="font-bold text-slate-300">{msg.senderName}</span>
                              <span>• {msg.timestamp}</span>
                            </div>
                            <div className="flex items-end gap-1.5 group">
                              <div
                                className={`p-3 rounded-2xl max-w-sm sm:max-w-md text-xs leading-relaxed ${
                                  isFromAdmin
                                    ? 'bg-sky-950 border border-sky-700 text-slate-200 rounded-tl-none'
                                    : 'bg-gradient-to-r from-rose-600 to-orange-600 text-white rounded-tr-none shadow-md'
                                }`}
                              >
                                {msg.text}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const targetPhone = isFromAdmin
                                    ? (associatedRequest?.clientPhone || activeThread.clientPhone || '71996492354')
                                    : '71996492354';
                                  const notif = buildDirectMessageNotification({
                                    protocolNumber: activeThread.protocolNumber,
                                    recipientName: isFromAdmin ? activeThread.clientName : 'Central de Gestão RM Manutec',
                                    recipientPhone: targetPhone,
                                    senderName: msg.senderName,
                                    senderRole: msg.senderRole,
                                    messageText: msg.text,
                                    serviceName: associatedRequest?.serviceName
                                  });
                                  setWhatsappModalData({
                                    isOpen: true,
                                    title: `Notificação WhatsApp: Chamado ${activeThread.protocolNumber}`,
                                    subtitle: `Mensagem enviada por ${msg.senderName}`,
                                    recipientName: isFromAdmin ? activeThread.clientName : 'Administração RM Manutec',
                                    recipientPhone: notif.targetPhone,
                                    recipientRole: isFromAdmin ? 'cliente' : 'admin',
                                    messageText: notif.message,
                                    whatsappUrl: notif.url
                                  });
                                }}
                                className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 opacity-70 hover:opacity-100 transition-opacity cursor-pointer text-[10px] flex items-center gap-1"
                                title="Abrir notificação no WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message Input Box */}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessageText}
                      onChange={e => setNewMessageText(e.target.value)}
                      placeholder={isAdmin ? "Escreva uma mensagem oficial para o cliente..." : "Envie uma dúvida ou mensagem para a administração..."}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-sky-900 border border-sky-700 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={!newMessageText.trim()}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  </form>
                </div>

              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-sky-950 border border-sky-800 text-slate-400">
              Selecione um chamado na lateral para visualizar e interagir com os documentos.
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL: EMITIR NOVO ORÇAMENTO (ADMIN ONLY) */}
      {isNewBudgetModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-sky-950 border border-sky-700 shadow-2xl p-6 text-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-sky-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Emitir Proposta / Orçamento Oficial (Admin)</h3>
                  <p className="text-xs text-slate-400">Protocolo: {activeThread?.protocolNumber} • Cliente: {activeThread?.clientName}</p>
                </div>
              </div>
              <button onClick={() => setIsNewBudgetModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBudgetSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Título do Orçamento</label>
                <input
                  type="text"
                  value={budgetTitle}
                  onChange={e => setBudgetTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Descrição Técnica & Escopo</label>
                <textarea
                  rows={3}
                  value={budgetDescription}
                  onChange={e => setBudgetDescription(e.target.value)}
                  placeholder="Detalhamento do serviço, normas técnicas aplicadas e escopo..."
                  className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mão de Obra (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={budgetLabor}
                    onChange={e => setBudgetLabor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Materiais / Peças (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={budgetMaterials}
                    onChange={e => setBudgetMaterials(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Validade da Proposta</label>
                  <select
                    value={budgetValidity}
                    onChange={e => setBudgetValidity(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white"
                  >
                    <option value={7}>7 dias corridos</option>
                    <option value={10}>10 dias corridos</option>
                    <option value={15}>15 dias corridos</option>
                    <option value={30}>30 dias corridos</option>
                  </select>
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <span className="font-bold text-amber-300">Valor Total do Orçamento:</span>
                <span className="font-mono text-base font-black text-amber-400">
                  R$ {((Number(budgetLabor) || 0) + (Number(budgetMaterials) || 0)).toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Instruções de Pagamento / Condições Comerciais</label>
                <input
                  type="text"
                  value={budgetAdminNotes}
                  onChange={e => setBudgetAdminNotes(e.target.value)}
                  placeholder="Ex: 5% de desconto no PIX (CNPJ 64.177.147/0001-34) ou até 12x no cartão."
                  className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-800">
                <button
                  type="button"
                  onClick={() => setIsNewBudgetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-md"
                >
                  Transmitir Orçamento Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: TRANSMITIR DOCUMENTO / COMPROVANTE */}
      {isNewReceiptModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-sky-950 border border-sky-700 shadow-2xl p-6 text-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-sky-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Transmissão & Envio de Documentação</h3>
                  <p className="text-xs text-slate-400">Protocolo: <strong className="text-emerald-400">{activeThread?.protocolNumber}</strong> • Cliente: {activeThread?.clientName}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewReceiptModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-sky-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceiptSubmit} className="space-y-4 text-xs">
              
              {/* Tipo de Documento */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tipo do Documento</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'comprovante_pagamento', label: '💳 Comprovante PIX/Cartão', defaultTitle: 'Comprovante de Pagamento PIX' },
                    { id: 'orcamento', label: '💼 Orçamento / Proposta', defaultTitle: 'Orçamento & Precificação' },
                    { id: 'laudo_vistoria', label: '📋 Laudo / Vistoria', defaultTitle: 'Laudo Técnico de Inspeção' },
                    { id: 'recibo_fiscal', label: '🧾 Recibo / Nota Fiscal', defaultTitle: 'Recibo de Quitação de Serviços' },
                    { id: 'termo_garantia', label: '📑 Termo de Garantia', defaultTitle: 'Termo de Garantia & Conformidade' },
                    { id: 'outro', label: '📄 Outro Documento', defaultTitle: 'Documentação Complementar' }
                  ].map(cat => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        setDocCategory(cat.id as any);
                        if (!receiptTitle || receiptTitle.startsWith('Comprovante') || receiptTitle.startsWith('Orçamento') || receiptTitle.startsWith('Laudo') || receiptTitle.startsWith('Recibo') || receiptTitle.startsWith('Termo') || receiptTitle.startsWith('Documentação')) {
                          setReceiptTitle(cat.defaultTitle);
                        }
                      }}
                      className={`p-2 rounded-xl text-left font-bold text-[11px] border transition-all cursor-pointer ${
                        docCategory === cat.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-sky-900 border-sky-800 text-slate-400 hover:text-slate-200 hover:border-sky-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Título / Identificação do Arquivo</label>
                <input
                  type="text"
                  value={receiptTitle}
                  onChange={e => setReceiptTitle(e.target.value)}
                  placeholder="Ex: Comprovante PIX Sinal 50% / Laudo de Vistoria"
                  className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white focus:outline-none focus:border-emerald-400 font-semibold"
                  required
                />
              </div>

              {/* Detalhes / Observações adicionais */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Descrição / Observações (Opcional)</label>
                <textarea
                  value={docDescription}
                  onChange={e => setDocDescription(e.target.value)}
                  placeholder="Informações adicionais sobre o documento ou pagamento..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white focus:outline-none focus:border-emerald-400 resize-none text-xs"
                />
              </div>

              {/* Campos Financeiros quando for Comprovante ou Recibo */}
              {(docCategory === 'comprovante_pagamento' || docCategory === 'recibo_fiscal' || docCategory === 'orcamento') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-sky-900/80 border border-sky-800">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      {docCategory === 'orcamento' ? 'Valor Total Previsto (R$)' : 'Valor Pago / Transmitido (R$)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={receiptAmount}
                      onChange={e => setReceiptAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-emerald-300 font-mono font-bold"
                    />
                  </div>

                  {docCategory === 'comprovante_pagamento' && (
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Forma de Pagamento</label>
                      <select
                        value={receiptMethod}
                        onChange={e => setReceiptMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white"
                      >
                        <option value="pix">PIX (Chave CNPJ: 64.177.147/0001-34)</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                        <option value="faturamento_pj">Faturamento PJ</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Botão & Área de Anexo para Envio de Documentação */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold flex items-center justify-between">
                  <span>Anexo do Documento <span className="text-emerald-400 font-normal">(Foto, PDF, PNG, JPG)</span></span>
                  {receiptFileUrl && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Arquivo Carregado
                    </span>
                  )}
                </label>

                <input
                  ref={receiptFileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleReceiptFileChange}
                />

                {receiptFileUrl ? (
                  <div className="p-3 rounded-xl bg-sky-900 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {receiptFileUrl.startsWith('data:image/') || receiptFileUrl.includes('.png') || receiptFileUrl.includes('.jpg') || receiptFileUrl.includes('.jpeg') ? (
                        <img
                          src={receiptFileUrl}
                          alt="Prévia do Documento"
                          className="w-12 h-12 rounded-lg object-cover border border-sky-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">
                          {receiptFileName || 'documento_anexo.png'}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          Pronto para armazenamento ({receiptFileSize || 'Arquivo Válido'})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        id="btn-trocar-anexo-comprovante"
                        onClick={() => receiptFileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs font-semibold border border-sky-700 transition-colors cursor-pointer"
                      >
                        Trocar
                      </button>
                      <button
                        type="button"
                        id="btn-remover-anexo-comprovante"
                        onClick={handleRemoveReceiptAttachment}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Remover anexo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    id="area-drop-anexo-comprovante"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleProcessReceiptFile(file);
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                      isDraggingFile
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-sky-700 hover:border-emerald-500/60 bg-sky-900/60 hover:bg-sky-950/80'
                    }`}
                    onClick={() => receiptFileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Clique para selecionar ou arraste o comprovante / documento
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Formatos aceitos: Imagens (PNG, JPG), Foto da Câmera ou Arquivos PDF
                        </span>
                      </div>
                      <button
                        type="button"
                        id="btn-anexar-documento-comprovante"
                        className="mt-1 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Selecionar Arquivo / Foto</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dados Bancários Oficiais */}
              <div className="p-3 rounded-xl bg-sky-900 border border-sky-800 text-[11px] text-slate-400 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Destino Oficial RM MANUTEC:
                  </span>
                  <span>CNPJ: <strong>64.177.147/0001-34</strong></span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <FolderLock className="w-3 h-3 text-emerald-400" />
                  <span>Gravação no Cofre Ativa</span>
                </div>
              </div>

              {/* Botões de Ação do Modal */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-3 border-t border-sky-800">
                <button
                  type="button"
                  onClick={() => setIsNewReceiptModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 font-semibold cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-confirmar-envio-documento"
                  disabled={isSubmittingDoc}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingDoc ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Gravando no Cofre...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 text-slate-950" />
                      <span>Transmitir & Armazenar Documento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: ADMIN EDIT DOCUMENT (ADMIN ONLY) */}
      {editingDoc && isAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-sky-950 border-2 border-amber-500/50 shadow-2xl p-6 text-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-sky-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Editar / Moderar Documento (Gestor)</h3>
                  <p className="text-xs text-amber-300">Alteração com privilégio exclusivo da Administração</p>
                </div>
              </div>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Título do Documento</label>
                <input
                  type="text"
                  value={editingDoc.title}
                  onChange={e => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Valor Oficial (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingDoc.amount || 0}
                    onChange={e => setEditingDoc({ ...editingDoc, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Status de Moderação</label>
                  <select
                    value={editingDoc.status}
                    onChange={e => setEditingDoc({ ...editingDoc, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white font-bold"
                  >
                    <option value="aprovado_admin">✅ Aprovado / Validado</option>
                    <option value="em_analise_admin">⏳ Em Análise da Gestão</option>
                    <option value="retificado_admin">✏️ Retificado pelo Administrador</option>
                    <option value="rejeitado_admin">❌ Rejeitado / Recusado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Descrição / Escopo Atualizado</label>
                <textarea
                  rows={2}
                  value={editingDoc.description || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white"
                />
              </div>

              <div>
                <label className="block text-amber-300 font-bold mb-1">Parecer / Nota de Moderação do Administrador</label>
                <textarea
                  rows={2}
                  value={editingDoc.adminNotes || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, adminNotes: e.target.value })}
                  placeholder="Justificativa ou nota interna para o cliente e financeiro..."
                  className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-800">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-md"
                >
                  Salvar Edição do Gestor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: VIEW DOCUMENT PREVIEW */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-sky-950 border border-sky-700 shadow-2xl p-6 text-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-sky-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-900 text-amber-400 flex items-center justify-center border border-sky-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{viewingDoc.title}</h3>
                  <span className="text-xs text-slate-400">Emitido em {viewingDoc.createdAt}</span>
                </div>
              </div>
              <button onClick={() => setViewingDoc(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-sky-900 border border-sky-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Emissor:</span>
                <span className="font-bold text-white">{viewingDoc.senderName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <div>{getDocStatusBadge(viewingDoc.status)}</div>
              </div>
              {viewingDoc.amount !== undefined && (
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">Valor Registrado:</span>
                  <span className="font-bold text-amber-400 text-sm">R$ {viewingDoc.amount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {viewingDoc.description && (
                <div className="pt-2 border-t border-sky-800 text-slate-300">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Descrição:</span>
                  <p>{viewingDoc.description}</p>
                </div>
              )}
            </div>

            {viewingDoc.fileUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Documento / Comprovante Anexado:</span>
                  </span>
                  {viewingDoc.fileName && (
                    <span className="font-mono text-[11px] text-slate-300 truncate max-w-[200px]">
                      {viewingDoc.fileName}
                    </span>
                  )}
                </div>

                <div className="rounded-xl overflow-hidden border border-sky-800 bg-sky-900 flex flex-col items-center justify-center p-2">
                  {viewingDoc.fileUrl.startsWith('data:image/') || viewingDoc.fileUrl.includes('.png') || viewingDoc.fileUrl.includes('.jpg') || viewingDoc.fileUrl.includes('.jpeg') || viewingDoc.fileUrl.includes('images.unsplash') ? (
                    <img
                      src={viewingDoc.fileUrl}
                      alt={viewingDoc.title}
                      className="w-full max-h-72 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="p-6 flex flex-col items-center gap-2 text-center">
                      <FileText className="w-12 h-12 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-200">{viewingDoc.fileName || 'Documento Comprobatório'}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <a
                    href={viewingDoc.fileUrl}
                    download={viewingDoc.fileName || 'comprovante.png'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-emerald-300 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar / Abrir Arquivo</span>
                  </a>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-white text-xs font-bold"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Notification Direct Modal */}
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
