import React, { useState } from 'react';
import { ServiceRequest, UserProfile, PaymentStatus, PaymentMethod, UserRole, AdminClientInteractionThread, InteractionDocument, DirectInteractionMessage } from '../types';
import { PaymentVerificationModal } from './PaymentVerificationModal';
import { AdminEditRequestModal } from './AdminEditRequestModal';
import { AdminEditUserModal } from './AdminEditUserModal';
import { AdminStorageVault } from './AdminStorageVault';
import { AdminClientInteractionHub } from './AdminClientInteractionHub';
import { AdminOfficialProposalModal } from './AdminOfficialProposalModal';
import { ClientAdminDialogModal } from './ClientAdminDialogModal';
import {
  buildNewUserAdminNotification,
  buildNewUserWelcomeNotification,
  buildNewRequestAdminNotification,
  buildNewRequestClientNotification,
  buildDirectMessageNotification,
  dispatchWhatsAppNotification
} from '../lib/whatsappNotifications';
import { WhatsAppNotificationModal } from './WhatsAppNotificationModal';
import {
  Building2,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  Plus,
  Search,
  Zap,
  Phone,
  HardHat,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  DollarSign,
  Receipt,
  QrCode,
  CreditCard,
  Building,
  Truck,
  FileText,
  Ban,
  Unlock,
  Edit3,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  ExternalLink,
  ShieldAlert,
  ArrowRightLeft,
  UserPlus,
  Sparkles,
  MapPin,
  FolderLock,
  MessageSquare,
  Send,
  Smartphone,
  Share2,
  Activity,
  ClipboardList,
  Radio,
  Navigation,
  FileSpreadsheet,
  Layers,
  ListOrdered,
  CheckCheck,
  RefreshCw,
  Briefcase,
  FileCheck,
  Wrench
} from 'lucide-react';

interface AdminViewProps {
  user: UserProfile;
  requests: ServiceRequest[];
  users: UserProfile[];
  initialTab?: 'requests' | 'users' | 'companies' | 'storage_vault' | 'financial' | 'interaction';
  onUpdateRequestStatus: (requestId: string, newStatus: ServiceRequest['status']) => void;
  onUpdatePaymentStatus?: (
    requestId: string,
    newStatus: PaymentStatus,
    paymentMethod?: PaymentMethod,
    note?: string
  ) => void;
  onSaveRequest: (updatedRequest: ServiceRequest) => void;
  onDeleteRequest: (requestId: string) => void;
  onSaveUser: (updatedUser: UserProfile) => void;
  onToggleUserBlock: (userId: string, isBlocked: boolean, reason?: string) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchRoleView: (role: UserRole, targetUser?: UserProfile, clientSubtype?: 'pessoa_fisica' | 'empresa_cnpj') => void;
  onLogout: () => void;
  onOpenNewService: () => void;
  onOpenContact: () => void;
  onOpenCompletionPhotos?: (request: ServiceRequest, canUpload: boolean) => void;
  onOpenInstallModal?: () => void;
  onShareApp?: () => void;
  onOpenTrackingModal?: (request?: ServiceRequest) => void;
  interactionThreads?: AdminClientInteractionThread[];
  onTransmitDocument?: (threadId: string, doc: InteractionDocument) => void;
  onAdminUpdateDocument?: (threadId: string, docId: string, updates: Partial<InteractionDocument>) => void;
  onAdminDeleteDocument?: (threadId: string, docId: string) => void;
  onSendMessage?: (threadId: string, msg: DirectInteractionMessage) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  user,
  requests,
  users,
  onUpdateRequestStatus,
  onUpdatePaymentStatus,
  onSaveRequest,
  onDeleteRequest,
  onSaveUser,
  onToggleUserBlock,
  onDeleteUser,
  onSwitchRoleView,
  onLogout,
  onOpenNewService,
  onOpenContact,
  onOpenCompletionPhotos,
  onOpenInstallModal,
  onShareApp,
  onOpenTrackingModal,
  interactionThreads = [],
  onTransmitDocument = () => {},
  onAdminUpdateDocument,
  onAdminDeleteDocument,
  onSendMessage = () => {},
  initialTab
}) => {
  // Main admin active tab: 'requests' | 'users' | 'companies' | 'storage_vault' | 'financial' | 'interaction' | 'panels'
  const [activeAdminTab, setActiveAdminTab] = useState<'requests' | 'users' | 'companies' | 'storage_vault' | 'financial' | 'interaction' | 'panels'>(initialTab || 'requests');

  // Sincroniza initialTab caso venha da barra superior mestre de navegação
  React.useEffect(() => {
    if (initialTab) {
      setActiveAdminTab(initialTab);
    }
  }, [initialTab]);

  const [selectedInteractionThreadId, setSelectedInteractionThreadId] = useState<string | undefined>(undefined);
  const [requestsViewMode, setRequestsViewMode] = useState<'cards' | 'timeline' | 'kanban'>('cards');

  // Requests search & filters
  const [filterCategory, setFilterCategory] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Users search & filters
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFilterRole, setUserFilterRole] = useState<'todos' | 'cliente' | 'tecnico' | 'bloqueados'>('todos');

  // Empresas & Condomínios search, filters & creation state
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [companyFilterSegment, setCompanyFilterSegment] = useState<string>('todos');
  const [companyFilterStatus, setCompanyFilterStatus] = useState<'todos' | 'ativos' | 'bloqueados'>('todos');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // Form states for new Empresa/Condomínio
  const [newCompTradeName, setNewCompTradeName] = useState('');
  const [newCompCompanyName, setNewCompCompanyName] = useState('');
  const [newCompCnpj, setNewCompCnpj] = useState('');
  const [newCompSegment, setNewCompSegment] = useState('Condomínio Residencial');
  const [newCompRepresentative, setNewCompRepresentative] = useState('');
  const [newCompRepresentativeCpf, setNewCompRepresentativeCpf] = useState('');
  const [newCompRepresentativeRole, setNewCompRepresentativeRole] = useState('Síndico Profissional');
  const [newCompPhone, setNewCompPhone] = useState('');
  const [newCompEmail, setNewCompEmail] = useState('');
  const [newCompAddress, setNewCompAddress] = useState('');

  // Modals
  const [verifyingPaymentRequest, setVerifyingPaymentRequest] = useState<ServiceRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedProposalRequest, setSelectedProposalRequest] = useState<ServiceRequest | null>(null);
  const [isDialogModalOpen, setIsDialogModalOpen] = useState(false);
  const [selectedDialogRequest, setSelectedDialogRequest] = useState<ServiceRequest | null>(null);

  // Quick user creation state
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('cliente');
  const [newUserCpf, setNewUserCpf] = useState('');
  const [newUserSpecialty, setNewUserSpecialty] = useState('');

  // WhatsApp Dispatch Modal State
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

  // Statistics calculation
  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => r.status === 'pendente' || r.status === 'em_analise').length;
  const inProgressCount = requests.filter(r => r.status === 'tecnico_agendado' || r.status === 'em_andamento').length;
  const completedCount = requests.filter(r => r.status === 'concluido').length;
  const withPhotosCount = requests.filter(r => r.completionPhotos && r.completionPhotos.length > 0).length;

  // User statistics
  const totalUsersCount = users.length;
  const totalClientsCount = users.filter(u => u.role === 'cliente').length;
  const totalTechsCount = users.filter(u => u.role === 'tecnico').length;
  const totalBlockedCount = users.filter(u => u.isBlocked).length;

  // Payment KPIs
  const paidPaymentsCount = requests.filter(r => r.paymentStatus === 'pago').length;
  const pendingPaymentsCount = requests.filter(r => r.paymentStatus === 'pendente' || !r.paymentStatus).length;
  const processingPaymentsCount = requests.filter(r => r.paymentStatus === 'processando').length;

  // Technicians available for assignment
  const technicianUsers = users.filter(u => u.role === 'tecnico');

  // Filtered Requests
  const filteredRequests = requests.filter(r => {
    const matchesSearch =
      r.protocolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.paymentMethod && r.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (filterCategory === 'todos') return true;
    if (filterCategory === 'urgentes') return r.urgency === 'urgente_24h' || r.urgency === 'alta';
    if (filterCategory === 'pagamentos_pendentes') return r.paymentStatus === 'pendente' || !r.paymentStatus;
    if (filterCategory === 'pagamentos_confirmados') return r.paymentStatus === 'pago';
    if (filterCategory === 'concluidos') return r.status === 'concluido';
    if (filterCategory === 'com_fotos') return r.completionPhotos && r.completionPhotos.length > 0;
    return true;
  });

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.phone.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.cpf && u.cpf.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (u.specialty && u.specialty.toLowerCase().includes(userSearchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (userFilterRole === 'todos') return true;
    if (userFilterRole === 'cliente') return u.role === 'cliente';
    if (userFilterRole === 'tecnico') return u.role === 'tecnico';
    if (userFilterRole === 'bloqueados') return u.isBlocked === true;
    return true;
  });

  // Empresas & Condomínios Filtered & Cached
  const companyUsers = React.useMemo(() => {
    return users.filter(u =>
      u.clientType === 'empresa_cnpj' ||
      (u.companyName && u.companyName.trim().length > 0) ||
      (u.cnpj && u.cnpj.trim().length > 0)
    );
  }, [users]);

  // Chamados de Empresas e Condomínios
  const corporateRequests = React.useMemo(() => {
    return requests.filter(r =>
      r.clientType === 'empresa_cnpj' ||
      r.invoiceCompanyName ||
      r.paymentMethod === 'faturamento_pj' ||
      companyUsers.some(c => c.name === r.clientName || c.companyName === r.clientName || c.phone === r.clientPhone)
    );
  }, [requests, companyUsers]);

  // Filtro de Empresas e Condomínios da Aba
  const filteredCompanyUsers = React.useMemo(() => {
    return companyUsers.filter(u => {
      const q = companySearchTerm.toLowerCase();
      const matchesSearch =
        u.name.toLowerCase().includes(q) ||
        (u.companyName && u.companyName.toLowerCase().includes(q)) ||
        (u.tradeName && u.tradeName.toLowerCase().includes(q)) ||
        (u.cnpj && u.cnpj.toLowerCase().includes(q)) ||
        (u.legalRepresentativeName && u.legalRepresentativeName.toLowerCase().includes(q)) ||
        (u.address && u.address.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (companyFilterSegment !== 'todos' && u.companySegment !== companyFilterSegment) return false;
      if (companyFilterStatus === 'ativos' && u.isBlocked) return false;
      if (companyFilterStatus === 'bloqueados' && !u.isBlocked) return false;
      return true;
    });
  }, [companyUsers, companySearchTerm, companyFilterSegment, companyFilterStatus]);

  // Criar Nova Empresa / Condomínio pelo Painel da Administração
  const handleCreateCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompTradeName.trim() || !newCompPhone.trim()) return;

    const companyUser: UserProfile = {
      id: `usr-empresa-${Date.now()}`,
      name: newCompTradeName.trim(),
      tradeName: newCompTradeName.trim(),
      companyName: newCompCompanyName.trim() || newCompTradeName.trim(),
      email: newCompEmail.trim() || `gestao@${newCompTradeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
      phone: newCompPhone.trim(),
      companyPhone: newCompPhone.trim(),
      companyEmail: newCompEmail.trim(),
      role: 'cliente',
      clientType: 'empresa_cnpj',
      cnpj: newCompCnpj.trim() || '00.000.000/0001-00',
      document: newCompCnpj.trim() || '00.000.000/0001-00',
      documentType: 'cnpj',
      companySegment: newCompSegment,
      legalRepresentativeName: newCompRepresentative.trim() || 'Síndico Responsável',
      legalRepresentativeCpf: newCompRepresentativeCpf.trim() || undefined,
      legalRepresentativeRole: newCompRepresentativeRole.trim() || 'Síndico',
      address: newCompAddress.trim() || 'Salvador - BA',
      password: 'senha@empresa123',
      isVerified: true,
      verificationStatus: 'aprovado',
      activeOrdersCount: 0,
      avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80'
    };

    onSaveUser(companyUser);
    setIsCreatingCompany(false);
    // Reset fields
    setNewCompTradeName('');
    setNewCompCompanyName('');
    setNewCompCnpj('');
    setNewCompRepresentative('');
    setNewCompRepresentativeCpf('');
    setNewCompPhone('');
    setNewCompEmail('');
    setNewCompAddress('');
  };

  const getPaymentMethodShortBadge = (method?: PaymentMethod) => {
    switch (method) {
      case 'pix':
        return { label: 'PIX', icon: QrCode, style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'cartao_credito':
        return { label: 'Crédito', icon: CreditCard, style: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'cartao_debito':
        return { label: 'Débito', icon: CreditCard, style: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      case 'faturamento_pj':
        return { label: 'Fat. PJ', icon: Building2, style: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      default:
        return { label: 'Não informado', icon: DollarSign, style: 'text-slate-400 bg-sky-900 border-sky-700' };
    }
  };

  const handleExportTrackingReport = () => {
    const dateStr = new Date().toLocaleString('pt-BR');
    let content = `=======================================================\n`;
    content += `RELATÓRIO DE ACOMPANHAMENTO DE SOLICITAÇÕES - RM MANUTEC\n`;
    content += `Data de Emissão: ${dateStr}\n`;
    content += `Administração - Acesso Livre e Irrestrito\n`;
    content += `Total de Solicitações: ${requests.length}\n`;
    content += `=======================================================\n\n`;

    requests.forEach((req, idx) => {
      content += `[${idx + 1}] PROTOCOLO: ${req.protocolNumber} | STATUS: ${req.status.toUpperCase()}\n`;
      content += `Serviço: ${req.serviceName} (${req.urgency === 'urgente_24h' ? 'PLANTÃO 24H' : 'Normal'})\n`;
      content += `Cliente: ${req.clientName} | Telefone: ${req.clientPhone}\n`;
      content += `Endereço: ${req.address.street}, ${req.address.number || 'S/N'} - ${req.address.neighborhood}, ${req.address.city}\n`;
      content += `Técnico Designado: ${req.assignedTechnician ? `${req.assignedTechnician.name} (${req.assignedTechnician.phone})` : 'Nenhum'}\n`;
      content += `PIN de Segurança: ${req.securityCode || 'RM-5924'}\n`;
      content += `Orçamento: R$ ${req.budgetProposal?.totalAmount ? req.budgetProposal.totalAmount.toFixed(2) : '0.00'} (${req.budgetProposal?.status || 'pendente'})\n`;
      content += `Pagamento: ${req.paymentStatus?.toUpperCase() || 'PENDENTE'} (${req.paymentMethod || 'Não informado'})\n`;
      content += `Fotos de Laudo/Conclusão: ${req.completionPhotos?.length || 0} foto(s)\n`;
      content += `-------------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-acompanhamento-rm-manutec-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateNewUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPhone.trim()) return;

    const newUserObj: UserProfile = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim() || `usuario.${Date.now()}@rmmanutec.com.br`,
      phone: newUserPhone.trim(),
      role: newUserRole,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      cpf: newUserCpf.trim() || undefined,
      document: newUserCpf.trim() || '000.000.000-00',
      specialty: newUserRole === 'tecnico' ? (newUserSpecialty.trim() || 'Técnico Especialista') : undefined,
      isVerified: true,
      verificationStatus: 'aprovado',
      verifiedAt: new Date().toISOString(),
      isBlocked: false,
      registrationDate: new Date().toLocaleDateString('pt-BR')
    };

    onSaveUser(newUserObj);
    setIsCreatingNewUser(false);
    setNewUserName('');
    setNewUserPhone('');
    setNewUserEmail('');
    setNewUserCpf('');
    setNewUserSpecialty('');
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Top Master Header */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-950 via-sky-900 to-sky-900 border border-sky-700/80 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">Central de Controle Mestre • RM Manutec</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>2FA Ativo • Dispositivo Autorizado</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Acesso irrestrito a todos os painéis, modificação de ordens, gestão de técnicos, clientes e controle de bloqueio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto flex-wrap sm:flex-nowrap">
          {onOpenInstallModal && (
            <button
              id="btn-admin-install-app"
              onClick={onOpenInstallModal}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              title="Status e Instalação Google Play Store / PWA"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Instalar App (Play Store)</span>
              <span className="lg:hidden">Play Store</span>
            </button>
          )}

          {onShareApp && (
            <button
              id="btn-admin-share-link"
              onClick={onShareApp}
              className="p-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 border border-sky-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
              title="Compartilhar Link do Aplicativo"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          <button
            id="btn-admin-nova-os"
            onClick={onOpenNewService}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova O.S.</span>
          </button>
          
          <button
            id="btn-admin-logout"
            onClick={onLogout}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-sky-900 hover:bg-rose-900/40 hover:border-rose-500/50 text-slate-200 hover:text-rose-200 border border-sky-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            title="Encerrar sessão protegida por 2FA"
          >
            <span>Bloquear / Sair</span>
          </button>
        </div>
      </div>

      {/* Direct Panel Switcher Bar (Acesso aos Painéis da Plataforma e Controle de Abas) */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-950 via-[#0d1f33] to-sky-900 border-2 border-amber-500/50 p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10">
            <ArrowRightLeft className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                Acesso aos Painéis da Plataforma & Controle de Abas
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                Acesso Mestre
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              A administração pode alternar e operar com total autonomia na visão do <strong>Cliente (PF)</strong>, <strong>Empresa e Condomínio (PJ)</strong>, <strong>Técnico</strong> ou acessar o <strong>Controle da Aba Empresas & Condomínio</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Botão de Controle da Aba Empresas & Condomínio */}
          <button
            id="btn-admin-access-control-empresas-condominio"
            type="button"
            onClick={() => setActiveAdminTab('companies')}
            className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 group ${
              activeAdminTab === 'companies'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-300 ring-2 ring-purple-400 shadow-purple-900/60'
                : 'bg-gradient-to-r from-purple-950/90 via-indigo-950 to-sky-950 hover:from-purple-900 hover:to-indigo-900 text-purple-200 border-purple-500/60 shadow-purple-950/40'
            }`}
            title="Acessar o Controle da Aba Empresas e Condomínio da mesma forma do controle das demais abas"
          >
            <Building2 className="w-4 h-4 text-purple-300 group-hover:text-white transition-colors" />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="block leading-tight font-black">Controle Empresas & Condomínio</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500 text-white font-mono">
                  {companyUsers.length}
                </span>
              </div>
              <span className="text-[10px] text-purple-300/80 block font-normal group-hover:text-purple-100">
                Aba de Gestão Corporativa PJ
              </span>
            </div>
          </button>

          {/* Botão 1: Visão do Cliente (Pessoa Física) */}
          <button
            id="btn-admin-switch-cliente-pf"
            type="button"
            onClick={() => onSwitchRoleView('cliente', undefined, 'pessoa_fisica')}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600/30 to-rose-700/40 hover:from-rose-600 hover:to-rose-500 text-rose-200 hover:text-white border border-rose-500/50 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-950/30 group active:scale-95"
            title="Abrir e operar diretamente no Painel do Cliente (Pessoa Física)"
          >
            <Users className="w-4 h-4 text-rose-400 group-hover:text-white transition-colors" />
            <div className="text-left">
              <span className="block leading-tight">Visão Cliente (PF)</span>
              <span className="text-[10px] text-rose-300/80 block font-normal group-hover:text-rose-100">Mariana Costa</span>
            </div>
          </button>

          {/* Botão 2: Visão Empresa e Condomínio (PJ / CNPJ) */}
          <button
            id="btn-admin-switch-empresa-condominio"
            type="button"
            onClick={() => onSwitchRoleView('cliente', undefined, 'empresa_cnpj')}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-700/40 hover:from-purple-600 hover:to-indigo-600 text-purple-200 hover:text-white border border-purple-500/50 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-950/30 group active:scale-95"
            title="Abrir e operar diretamente no Painel da Empresa e Condomínio (Pessoa Jurídica / CNPJ)"
          >
            <Building2 className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" />
            <div className="text-left">
              <span className="block leading-tight">Visão Condomínio (PJ)</span>
              <span className="text-[10px] text-purple-300/80 block font-normal group-hover:text-purple-100">Cond. Res. Pássaros</span>
            </div>
          </button>

          {/* Botão 3: Visão do Técnico */}
          <button
            id="btn-admin-switch-tecnico"
            type="button"
            onClick={() => onSwitchRoleView('tecnico')}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/30 to-amber-600/40 hover:from-amber-500 hover:to-amber-400 text-amber-200 hover:text-slate-950 border border-amber-500/50 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-950/30 group active:scale-95"
            title="Abrir e operar diretamente no Painel do Técnico Credenciado (Lucas Gabriel)"
          >
            <HardHat className="w-4 h-4 text-amber-400 group-hover:text-slate-950 transition-colors" />
            <div className="text-left">
              <span className="block leading-tight">Visão do Técnico</span>
              <span className="text-[10px] text-amber-300/80 block font-normal group-hover:text-slate-800">Lucas Gabriel</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Admin Tabs */}
      <div className="flex items-center border-b border-sky-800 gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveAdminTab('requests')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeAdminTab === 'requests'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-sky-950 text-slate-400 hover:text-white hover:bg-sky-900'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-rose-300" />
          <span>Acompanhamento de Solicitações (Acesso Livre) ({totalRequests})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeAdminTab === 'users'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
              : 'bg-sky-950 text-slate-400 hover:text-white hover:bg-sky-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestão de Usuários ({totalUsersCount})</span>
          {totalBlockedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
              {totalBlockedCount} bloq.
            </span>
          )}
        </button>

        {/* TAB CONTROLE DE EMPRESAS & CONDOMÍNIO */}
        <button
          id="tab-admin-companies"
          onClick={() => setActiveAdminTab('companies')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeAdminTab === 'companies'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/40 font-black'
              : 'bg-sky-950 text-purple-300 hover:text-white hover:bg-sky-900 border border-purple-500/30'
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-400" />
          <span>Controle de Empresas & Condomínio ({companyUsers.length})</span>
          {corporateRequests.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-900 text-purple-200 text-[10px] font-mono border border-purple-400/40">
              {corporateRequests.length} chamados
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('storage_vault')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeAdminTab === 'storage_vault'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
              : 'bg-sky-950 text-slate-400 hover:text-white hover:bg-sky-900'
          }`}
        >
          <FolderLock className="w-4 h-4 text-indigo-300" />
          <span>Pasta de Armazenamento de Dados (Admin)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-mono">
            {users.length} docs
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('financial')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeAdminTab === 'financial'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-sky-950 text-slate-400 hover:text-white hover:bg-sky-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financeiro & Pagamentos ({paidPaymentsCount} pagos)</span>
        </button>

        <button
          id="tab-admin-interacao-docs"
          onClick={() => setActiveAdminTab('interaction')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeAdminTab === 'interaction'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-orange-500/30 font-black'
              : 'bg-sky-950 text-slate-400 hover:text-white hover:bg-sky-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Interação Admin ↔ Cliente (Orçamentos & Comprovantes)</span>
          {interactionThreads.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-sky-900 text-amber-300 text-[10px] font-mono border border-amber-500/40">
              {interactionThreads.reduce((acc, t) => acc + (t.documents?.length || 0), 0)} docs
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ACOMPANHAMENTO DE SOLICITAÇÕES (ACESSO LIVRE PARA ADMINISTRAÇÃO) */}
      {activeAdminTab === 'requests' && (
        <div className="space-y-6">
          
          {/* Admin Tracking Banner & Global Actions */}
          <div className="rounded-2xl bg-gradient-to-r from-sky-950 via-rose-950/40 to-sky-900 border border-rose-500/30 p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-['Space_Grotesk'] text-base sm:text-lg font-black text-white">
                    Acompanhamento de Solicitações • Acesso Livre e Irrestrito
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
                    <span>Monitoramento em Tempo Real</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Acompanhe todas as etapas: abertura, triagem de vistoria, técnicos escalados com GPS, laudos fotográficos, orçamentos e pagamentos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
              <button
                id="btn-admin-emitir-proposta-geral"
                type="button"
                onClick={() => {
                  setSelectedProposalRequest(requests[0] || null);
                  setIsProposalModalOpen(true);
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white text-xs font-black shadow-lg shadow-sky-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Emitir proposta / orçamento oficial e enviar via WhatsApp para o cliente"
              >
                <FileText className="w-4 h-4" />
                <span>Emitir Proposta Oficial</span>
              </button>

              <button
                id="btn-admin-dialogo-solicitantes"
                type="button"
                onClick={() => {
                  setSelectedDialogRequest(requests[0] || null);
                  setIsDialogModalOpen(true);
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Canal seguro de diálogo com solicitantes: mensagens, fotos e arquivos confidenciais"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Diálogo com Solicitantes</span>
              </button>

              {onOpenTrackingModal && (
                <button
                  id="btn-admin-open-tracking-modal"
                  type="button"
                  onClick={() => onOpenTrackingModal()}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Rastrear O.S. (GPS & Mapa)</span>
                </button>
              )}

              <button
                id="btn-admin-export-tracking-report"
                type="button"
                onClick={handleExportTrackingReport}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 border border-sky-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Exportar relatório de acompanhamento de todas as solicitações"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Exportar Relatório</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl bg-sky-950 border border-sky-800 p-4 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <ClipboardList className="w-3.5 h-3.5 text-rose-400" />
                <span>Total de Chamados</span>
              </span>
              <p className="text-2xl font-black text-white">{totalRequests}</p>
            </div>
            <div className="rounded-xl bg-sky-950 border border-sky-800 p-4 space-y-1">
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Triagem / Vistoria</span>
              </span>
              <p className="text-2xl font-black text-amber-400">{pendingCount}</p>
            </div>
            <div className="rounded-xl bg-sky-950 border border-sky-800 p-4 space-y-1">
              <span className="text-[11px] text-blue-400 font-semibold flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5 text-blue-400" />
                <span>Em Execução / Local</span>
              </span>
              <p className="text-2xl font-black text-blue-400">{inProgressCount}</p>
            </div>
            <div className="rounded-xl bg-sky-950 border border-sky-800 p-4 space-y-1">
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Concluídos & Garantia</span>
              </span>
              <p className="text-2xl font-black text-emerald-400">{completedCount}</p>
            </div>
          </div>

          {/* View Modes & Search Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-sky-950/60 p-3 rounded-2xl border border-sky-800">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-sky-900 p-1 rounded-xl border border-sky-700 shrink-0">
              <button
                type="button"
                onClick={() => setRequestsViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  requestsViewMode === 'cards'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cartões com Linha do Tempo</span>
              </button>

              <button
                type="button"
                onClick={() => setRequestsViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  requestsViewMode === 'kanban'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Pipeline de Etapas (Kanban)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por protocolo, cliente, técnico ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-sky-900 border border-sky-700 text-xs text-white placeholder-slate-400 outline-none focus:border-rose-500"
              />
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setFilterCategory('todos')}
                className={`px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterCategory === 'todos' ? 'bg-rose-600 text-white' : 'bg-sky-900 text-slate-300 hover:text-white'
                }`}
              >
                Todos ({requests.length})
              </button>
              <button
                onClick={() => setFilterCategory('urgentes')}
                className={`px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterCategory === 'urgentes' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-sky-900 text-slate-300 hover:text-white'
                }`}
              >
                Plantão 24h
              </button>
              <button
                onClick={() => setFilterCategory('pagamentos_pendentes')}
                className={`px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterCategory === 'pagamentos_pendentes' ? 'bg-amber-600 text-white' : 'bg-sky-900 text-slate-300 hover:text-white'
                }`}
              >
                Aguard. Pagto
              </button>
              <button
                onClick={() => setFilterCategory('com_fotos')}
                className={`px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterCategory === 'com_fotos' ? 'bg-blue-600 text-white' : 'bg-sky-900 text-slate-300 hover:text-white'
                }`}
              >
                Com Fotos ({withPhotosCount})
              </button>
            </div>
          </div>

          {/* VIEW 1: CARDS WITH INTEGRATED TIMELINE STEPPER */}
          {requestsViewMode === 'cards' && (
            <div className="space-y-5">
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-sky-950/50 border border-sky-800 space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-slate-300 font-semibold text-sm">Nenhuma solicitação localizada com os filtros atuais.</p>
                </div>
              ) : (
                filteredRequests.map((req) => {
                  const isPaid = req.paymentStatus === 'pago';
                  const isProcessing = req.paymentStatus === 'processando';
                  const hasPhotos = req.completionPhotos && req.completionPhotos.length > 0;
                  const payBadge = getPaymentMethodShortBadge(req.paymentMethod);
                  const PayIcon = payBadge.icon;

                  // Determine active step (1 to 5)
                  let currentStepNumber = 1;
                  if (req.status === 'em_analise') currentStepNumber = 2;
                  if (req.status === 'tecnico_agendado') currentStepNumber = 3;
                  if (req.status === 'em_andamento') currentStepNumber = 4;
                  if (req.status === 'concluido') currentStepNumber = 5;

                  return (
                    <div
                      key={req.id}
                      className="rounded-2xl bg-sky-950 border border-sky-800 hover:border-sky-700 p-5 space-y-4 transition-all shadow-md"
                    >
                      {/* Top Row: Protocol, Badges and Direct Tracking Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-800/80 pb-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                            {req.protocolNumber}
                          </span>

                          {req.urgency === 'urgente_24h' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                              Plantão 24h
                            </span>
                          )}

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                            req.status === 'concluido'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : req.status === 'em_andamento'
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : req.status === 'tecnico_agendado'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {req.status === 'concluido' ? 'Concluído' : req.status === 'em_andamento' ? 'Em Execução' : req.status === 'tecnico_agendado' ? 'Técnico Escalado' : 'Triagem'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          {/* Botão Oficial: Emitir Proposta / Orçamento Oficial */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProposalRequest(req);
                              setIsProposalModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            title="Emitir Proposta / Orçamento Oficial com envio direto para o WhatsApp do cliente"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Emitir Orçamento</span>
                          </button>

                          {/* Botão de Diálogo Seguro entre Solicitante e Administrador */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDialogRequest(req);
                              setIsDialogModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            title="Abrir canal privado de diálogo com envio seguro de fotos e arquivos"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Diálogo & Fotos</span>
                          </button>

                          {onOpenTrackingModal && (
                            <button
                              type="button"
                              onClick={() => onOpenTrackingModal(req)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                              title="Acompanhar esta solicitação em tempo real na tela de rastreamento com mapa e histórico"
                            >
                              <Activity className="w-3.5 h-3.5 animate-pulse" />
                              <span>Rastrear O.S.</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingRequest(req)}
                            className="px-3 py-1.5 rounded-xl bg-sky-900 hover:bg-rose-600 text-slate-200 hover:text-white border border-sky-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Editar todos os dados da Ordem de Serviço"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar O.S.</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const notif = buildNewRequestClientNotification(req);
                              setWhatsappModalData({
                                isOpen: true,
                                title: `Notificação WhatsApp: Chamado ${req.protocolNumber}`,
                                subtitle: `Disparar confirmação e status para ${req.clientName}`,
                                recipientName: req.clientName,
                                recipientPhone: notif.targetPhone,
                                recipientRole: 'cliente',
                                messageText: notif.message,
                                whatsappUrl: notif.url
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Enviar notificação no WhatsApp do Cliente"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>WPP Cliente</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const th = interactionThreads.find(t => t.requestId === req.id || t.protocolNumber === req.protocolNumber);
                              if (th) {
                                setSelectedInteractionThreadId(th.id);
                              }
                              setActiveAdminTab('interaction');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Abrir aba de interação com o cliente, orçamentos e comprovantes"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Docs & Chat</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setVerifyingPaymentRequest(req)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                              isPaid
                                ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/40'
                                : isProcessing
                                ? 'bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border-blue-500/40'
                                : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            <PayIcon className="w-3.5 h-3.5" />
                            <span>{isPaid ? 'Ver Pago' : 'Validar Pagto'}</span>
                          </button>

                          {onOpenCompletionPhotos && (
                            <button
                              type="button"
                              onClick={() => onOpenCompletionPhotos(req, true)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                                hasPhotos
                                  ? 'bg-blue-950/50 text-blue-300 border-blue-500/40 hover:bg-blue-900/60'
                                  : 'bg-sky-900/80 text-slate-400 border-sky-700 hover:text-slate-200'
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Fotos ({req.completionPhotos?.length || 0})</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Deseja excluir a solicitação ${req.protocolNumber} (${req.serviceName})?`)) {
                                onDeleteRequest(req.id);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-700 text-rose-300 hover:text-white border border-rose-800/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Excluir / Remover Chamado"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>

                      {/* Visual Progress Stepper Bar */}
                      <div className="bg-sky-900 rounded-xl p-3 border border-sky-700">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
                          <span className="text-white flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-rose-400" />
                            <span>Linha do Tempo de Acompanhamento:</span>
                          </span>
                          <span className="text-rose-400">Etapa {currentStepNumber} de 5</span>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                          {[
                            { num: 1, label: '1. Abertura', active: currentStepNumber >= 1 },
                            { num: 2, label: '2. Triagem / Vistoria', active: currentStepNumber >= 2 },
                            { num: 3, label: '3. Técnico Escalado', active: currentStepNumber >= 3 },
                            { num: 4, label: '4. Em Execução', active: currentStepNumber >= 4 },
                            { num: 5, label: '5. Concluído & Garantia', active: currentStepNumber >= 5 }
                          ].map((st) => (
                            <div
                              key={st.num}
                              className={`p-1.5 sm:p-2 rounded-lg text-center transition-all ${
                                st.num === currentStepNumber
                                  ? 'bg-rose-600 text-white font-black ring-1 ring-rose-400'
                                  : st.active
                                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                                  : 'bg-sky-950 text-slate-500 font-semibold border border-sky-800'
                              }`}
                            >
                              <div className="text-[10px] sm:text-[11px] leading-tight truncate">{st.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Middle Row: Details (Service, Client, Tech) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Serviço Solicitado</span>
                          <h4 className="font-bold text-white text-sm mt-0.5">{req.serviceName}</h4>
                          <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-2">{req.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {req.requestType === 'vistoria_presencial' && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                req.inspectionFee?.isPaid 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                                Vistoria Presencial (Taxa R$ 50: {req.inspectionFee?.isPaid ? 'PAGA' : 'PENDENTE'})
                              </span>
                            )}

                            {req.budgetProposal && req.budgetProposal.totalAmount > 0 ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                req.budgetProposal.status === 'aprovado'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              }`}>
                                Orçamento: R$ {req.budgetProposal.totalAmount.toFixed(2)} ({req.budgetProposal.status === 'aprovado' ? 'Aprovado' : 'Definido pelo Admin'})
                              </span>
                            ) : (
                              <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px] flex items-center gap-1">
                                <span>Serviço: R$ 0,00 (Aguardando Orçamento)</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente & Localização</span>
                          <p className="font-bold text-slate-200 mt-0.5">{req.clientName}</p>
                          <p className="text-slate-400 font-mono text-[11px]">{req.clientPhone}</p>
                          <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{req.address.street}, {req.address.number || 'S/N'} - {req.address.neighborhood}, {req.address.city}</span>
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Profissional / Técnico Escalado</span>
                          {req.assignedTechnician ? (
                            <div className="mt-0.5 flex items-center gap-2">
                              <img
                                src={req.assignedTechnician.avatar}
                                alt={req.assignedTechnician.name}
                                className="w-8 h-8 rounded-full object-cover border border-amber-500/40"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <p className="font-bold text-amber-300 text-[11px]">{req.assignedTechnician.name}</p>
                                <p className="text-slate-400 text-[10px]">{req.assignedTechnician.phone}</p>
                                {req.assignedTechnician.specialty && (
                                  <span className="text-[9px] text-amber-400/80 block">{req.assignedTechnician.specialty}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-500 italic text-[11px] mt-0.5">Nenhum técnico escalado</p>
                          )}
                        </div>
                      </div>

                      {/* Bottom Status Quick Switch Bar */}
                      <div className="pt-2.5 border-t border-sky-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-400">
                          PIN de Segurança da Visita: <strong className="text-amber-400 font-mono text-xs">{req.securityCode || 'RM-5924'}</strong>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-semibold">Status Rápido:</span>
                          {(['pendente', 'em_analise', 'tecnico_agendado', 'em_andamento', 'concluido'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => onUpdateRequestStatus(req.id, st)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                req.status === st
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-sky-900 text-slate-400 hover:text-white'
                              }`}
                            >
                              {st === 'concluido' ? 'Concluir' : st === 'em_andamento' ? 'Executando' : st === 'tecnico_agendado' ? 'Escalar' : st === 'em_analise' ? 'Triagem' : 'Pendente'}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW 2: PIPELINE KANBAN DE ETAPAS */}
          {requestsViewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { key: 'triagem', title: '1. Triagem & Análise', color: 'border-amber-500/40 text-amber-300', filter: (r: ServiceRequest) => r.status === 'pendente' || r.status === 'em_analise' },
                { key: 'escalado', title: '2. Técnico Escalado', color: 'border-purple-500/40 text-purple-300', filter: (r: ServiceRequest) => r.status === 'tecnico_agendado' },
                { key: 'execucao', title: '3. Em Execução no Local', color: 'border-blue-500/40 text-blue-300', filter: (r: ServiceRequest) => r.status === 'em_andamento' },
                { key: 'concluido', title: '4. Concluído & Garantia', color: 'border-emerald-500/40 text-emerald-300', filter: (r: ServiceRequest) => r.status === 'concluido' }
              ].map((col) => {
                const colRequests = filteredRequests.filter(col.filter);

                return (
                  <div key={col.key} className="rounded-2xl bg-sky-950 border border-sky-800 p-4 space-y-3 flex flex-col min-h-[350px]">
                    <div className="flex items-center justify-between border-b border-sky-800 pb-2">
                      <h4 className={`text-xs font-black uppercase tracking-wider ${col.color}`}>
                        {col.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-sky-900 text-slate-300 text-[10px] font-bold border border-sky-700">
                        {colRequests.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                      {colRequests.length === 0 ? (
                        <p className="text-center text-[11px] text-slate-500 italic py-8">Nenhum chamado nesta etapa</p>
                      ) : (
                        colRequests.map((req) => (
                          <div
                            key={req.id}
                            className="p-3 rounded-xl bg-sky-900 border border-sky-700 space-y-2 text-xs transition-all shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                                {req.protocolNumber}
                              </span>
                              {req.urgency === 'urgente_24h' && (
                                <span className="text-[9px] font-black text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">
                                  24H
                                </span>
                              )}
                            </div>

                            <h5 className="font-bold text-white text-xs">{req.serviceName}</h5>
                            <p className="text-[11px] text-slate-400 truncate">{req.clientName}</p>

                            {req.assignedTechnician && (
                              <div className="flex items-center gap-1.5 text-[10px] text-amber-300">
                                <HardHat className="w-3 h-3 text-amber-400" />
                                <span className="truncate">{req.assignedTechnician.name}</span>
                              </div>
                            )}

                            <div className="pt-1.5 border-t border-slate-850 flex items-center justify-between gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingRequest(req)}
                                className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                              >
                                Detalhes
                              </button>

                              <div className="flex items-center gap-1.5">
                                {onOpenTrackingModal && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenTrackingModal(req)}
                                    className="px-2 py-0.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Rastrear
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Excluir chamado ${req.protocolNumber}?`)) {
                                      onDeleteRequest(req.id);
                                    }
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Excluir Chamado"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: GESTÃO DE CLIENTES E PROFISSIONAIS / TÉCNICOS */}
      {activeAdminTab === 'users' && (
        <div className="space-y-6">
          
          {/* Header & New User Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base">Controle de Clientes & Profissionais Credenciados</h3>
              <p className="text-xs text-slate-400">
                Visualize dados cadastrais, verificação por selfie/documento, edite informações ou aplique bloqueio administrativo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingNewUser(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-600/30 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Perfil</span>
            </button>
          </div>

          {/* User Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl bg-sky-950 border border-sky-800 p-4 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold">Total de Cadastros</span>
              <p className="text-2xl font-black text-white">{totalUsersCount}</p>
            </div>
            <div className="rounded-xl bg-sky-950 border border-sky-800 p-4 space-y-1">
              <span className="text-[11px] text-rose-400 font-semibold">Clientes Solicitantes</span>
              <p className="text-2xl font-black text-rose-400">{totalClientsCount}</p>
            </div>
            <div className="rounded-xl bg-sky-950 border border-sky-800 p-4 space-y-1">
              <span className="text-[11px] text-amber-400 font-semibold">Profissionais Técnicos</span>
              <p className="text-2xl font-black text-amber-400">{totalTechsCount}</p>
            </div>
            <div className="rounded-xl bg-sky-950 border border-rose-500/30 p-4 space-y-1 bg-rose-950/20">
              <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                <Ban className="w-3.5 h-3.5" />
                <span>Bloqueados / Suspensos</span>
              </span>
              <p className="text-2xl font-black text-rose-400">{totalBlockedCount}</p>
            </div>
          </div>

          {/* Search & Role Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail, telefone, CPF ou especialidade..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-sky-950 border border-sky-800 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setUserFilterRole('todos')}
                className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  userFilterRole === 'todos' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-sky-950 text-slate-400 hover:text-white'
                }`}
              >
                Todos ({users.length})
              </button>
              <button
                onClick={() => setUserFilterRole('cliente')}
                className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  userFilterRole === 'cliente' ? 'bg-rose-600 text-white' : 'bg-sky-950 text-slate-400 hover:text-white'
                }`}
              >
                Clientes ({totalClientsCount})
              </button>
              <button
                onClick={() => setUserFilterRole('tecnico')}
                className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  userFilterRole === 'tecnico' ? 'bg-amber-600 text-white' : 'bg-sky-950 text-slate-400 hover:text-white'
                }`}
              >
                Técnicos & Profissionais ({totalTechsCount})
              </button>
              <button
                onClick={() => setUserFilterRole('bloqueados')}
                className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  userFilterRole === 'bloqueados' ? 'bg-rose-700 text-white' : 'bg-sky-950 text-rose-400 hover:text-white'
                }`}
              >
                Bloqueados ({totalBlockedCount})
              </button>
            </div>
          </div>

          {/* Quick User Creation Drawer / Inline Form */}
          {isCreatingNewUser && (
            <form onSubmit={handleCreateNewUserSubmit} className="p-5 rounded-2xl bg-sky-950 border border-amber-500/40 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-sky-800 pb-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Cadastrar Novo Usuário / Profissional</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewUser(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕ Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Nome ou Razão Social"
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="(71) 99999-9999"
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Papel / Perfil *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white font-bold outline-none focus:border-amber-500"
                  >
                    <option value="cliente">Cliente (Solicitante)</option>
                    <option value="tecnico">Profissional Liberal / Técnico</option>
                    <option value="admin">Administrador (Gestão)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">E-mail Cadastrado</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="email@dominio.com"
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={newUserCpf}
                    onChange={(e) => setNewUserCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-sky-700 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {newUserRole === 'tecnico' && (
                  <div>
                    <label className="block text-amber-300 font-bold mb-1">Especialidade / Ramo</label>
                    <input
                      type="text"
                      value={newUserSpecialty}
                      onChange={(e) => setNewUserSpecialty(e.target.value)}
                      placeholder="Ex: Eletricista, Ar-Condicionado, Pintura..."
                      className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-amber-500/40 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewUser(false)}
                  className="px-4 py-2 rounded-xl bg-sky-900 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          )}

          {/* Users Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full p-8 text-center rounded-2xl bg-sky-950/50 border border-sky-800 space-y-2">
                <Users className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-slate-300 font-semibold text-sm">Nenhum usuário localizado com os critérios informados.</p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isBlocked = u.isBlocked === true;
                const isTech = u.role === 'tecnico';
                const isAdmin = u.role === 'admin';

                return (
                  <div
                    key={u.id}
                    className={`rounded-2xl border p-5 space-y-4 transition-all shadow-lg ${
                      isBlocked
                        ? 'bg-rose-950/30 border-rose-500/50'
                        : isTech
                        ? 'bg-sky-950 border-amber-500/30 hover:border-amber-500/60'
                        : isAdmin
                        ? 'bg-sky-950 border-purple-500/30 hover:border-purple-500/60'
                        : 'bg-sky-950 border-sky-800 hover:border-sky-700'
                    }`}
                  >
                    {/* Header with Avatar & Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-sky-700 shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              isTech
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : isAdmin
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                              {isTech ? 'Profissional / Técnico' : isAdmin ? 'Gestão Admin' : 'Cliente'}
                            </span>

                            {isBlocked ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center gap-1">
                                <Ban className="w-3 h-3" />
                                BLOQUEADO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                ATIVO
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-white text-sm sm:text-base mt-1 leading-tight">
                            {u.name}
                          </h4>
                          <p className="text-slate-400 text-xs font-mono">{u.phone}</p>
                        </div>
                      </div>

                      {/* Top Action Menu */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const notif = buildNewUserWelcomeNotification(u);
                            setWhatsappModalData({
                              isOpen: true,
                              title: `Notificação de Boas-Vindas / Cadastro: ${u.name}`,
                              subtitle: `Disparar mensagem WhatsApp para ${u.role === 'tecnico' ? 'Técnico Credenciado' : 'Cliente'}`,
                              recipientName: u.name,
                              recipientPhone: notif.targetPhone,
                              recipientRole: u.role === 'tecnico' ? 'tecnico' : 'cliente',
                              messageText: notif.message,
                              whatsappUrl: notif.url
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Enviar notificação oficial WhatsApp para este usuário"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Notificar WPP</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingUser(u)}
                          className="px-3 py-1.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 text-xs font-bold border border-sky-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Editar</span>
                        </button>
                      </div>
                    </div>

                    {/* User Details Grid */}
                    <div className="p-3 rounded-xl bg-sky-900 border border-sky-700 space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">E-mail:</span>
                        <span className="font-medium text-slate-200">{u.email}</span>
                      </div>
                      
                      {u.cpf && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">CPF:</span>
                          <span className="font-mono text-slate-200">{u.cpf}</span>
                        </div>
                      )}

                      {u.specialty && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Especialidade:</span>
                          <span className="font-semibold text-amber-300">{u.specialty}</span>
                        </div>
                      )}

                      {u.address && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Endereço:</span>
                          <span className="text-slate-300 truncate max-w-[200px]">{u.address}</span>
                        </div>
                      )}

                      {isBlocked && u.blockedReason && (
                        <div className="pt-1.5 border-t border-rose-500/30 text-rose-300 text-[11px]">
                          <strong>Motivo do Bloqueio:</strong> {u.blockedReason}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions: Toggle Block & Impersonate/Open Panel */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-sky-800/80">
                      
                      {/* Impersonate / Open this User's view */}
                      <button
                        type="button"
                        onClick={() => onSwitchRoleView(u.role, u, u.clientType)}
                        className="px-3 py-1.5 rounded-xl bg-sky-900/80 hover:bg-sky-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Acessar painel operacional como este usuário"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span>{u.clientType === 'empresa_cnpj' ? 'Abrir Visão Empresa/Condomínio' : u.role === 'tecnico' ? 'Abrir Visão Técnico' : 'Abrir Visão Cliente (PF)'}</span>
                      </button>

                      {/* Block / Unblock direct button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isBlocked) {
                            onToggleUserBlock(u.id, false);
                          } else {
                            const reason = prompt(`Informe o motivo do bloqueio para ${u.name}:`, 'Suspensão administrativa por pendência cadastral ou conduta');
                            if (reason !== null) {
                              onToggleUserBlock(u.id, true, reason || undefined);
                            }
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isBlocked
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30'
                        }`}
                      >
                        {isBlocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Desbloquear</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            <span>Bloquear Acesso</span>
                          </>
                        )}
                      </button>

                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* TAB 2.5: CONTROLE DE EMPRESAS & CONDOMÍNIO (ACESSO MESTRE ADMINISTRATIVO) */}
      {activeAdminTab === 'companies' && (
        <div className="space-y-6">
          
          {/* Header Banner Corporativo */}
          <div className="rounded-2xl bg-gradient-to-r from-purple-950 via-[#180f2b] to-sky-950 border-2 border-purple-500/40 p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/50 flex items-center justify-center shrink-0 shadow-lg shadow-purple-900/30">
                <Building2 className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-['Space_Grotesk'] text-lg sm:text-xl font-black text-white">
                    Controle de Empresas & Condomínio • Gestão Corporativa & Síndicos
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/40 font-mono">
                    Módulo PJ Salvador & RMS
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-3xl">
                  Gestão centralizada de Condomínios Residenciais, Edifícios Comerciais, Administradoras Prediais e Empresas. Controle de vistorias técnicas, chamados preventivos/corretivos, contratos mensais, faturamento PJ (15/30 dias) e notas fiscais.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
              <button
                id="btn-admin-add-company"
                type="button"
                onClick={() => setIsCreatingCompany(!isCreatingCompany)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingCompany ? 'Fechar Cadastro' : 'Novo Condomínio / PJ'}</span>
              </button>

              <button
                id="btn-admin-vistoria-predial-action"
                type="button"
                onClick={onOpenNewService}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-sky-900/90 hover:bg-sky-800 text-sky-200 hover:text-white border border-sky-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Agendar Vistoria Predial Presencial com Taxa de R$ 50,00"
              >
                <FileCheck className="w-4 h-4 text-sky-400" />
                <span>Agendar Vistoria Predial</span>
              </button>

              {companyUsers.length > 0 && (
                <button
                  id="btn-admin-operate-first-company"
                  type="button"
                  onClick={() => onSwitchRoleView('cliente', companyUsers[0], 'empresa_cnpj')}
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-950/30"
                  title="Operar diretamente com a visão do condomínio cadastrado"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Operar no Painel PJ</span>
                </button>
              )}
            </div>
          </div>

          {/* Indicadores Corporativos (KPIs) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-sky-950/80 border border-purple-500/30 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Condomínios & Empresas</span>
                <Building2 className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-white">{companyUsers.length}</p>
              <div className="text-[11px] text-purple-300 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>CNPJs e Síndicos verificados</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-950/80 border border-sky-800 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Chamados PJ Registrados</span>
                <ClipboardList className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-white">{corporateRequests.length}</p>
              <div className="text-[11px] text-sky-300 mt-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>{corporateRequests.filter(r => r.status !== 'concluido' && r.status !== 'cancelado').length} em andamento</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-950/80 border border-amber-500/30 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Vistorias Prediais Técnicas</span>
                <HardHat className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-300">
                {requests.filter(r => r.category === 'vistoria' || r.requestType === 'vistoria_presencial' || r.serviceTitle.toLowerCase().includes('vistoria')).length}
              </p>
              <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Taxa de deslocamento R$ 50</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-950/80 border border-emerald-500/30 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Faturamento PJ & Contratos</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-400">
                R$ {corporateRequests.reduce((acc, r) => acc + (r.finalPrice || r.estimatedPrice || 0), 0).toFixed(2)}
              </p>
              <div className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>Faturamento 15/30d ou Boleto</span>
              </div>
            </div>
          </div>

          {/* Formulário de Cadastro Rápido de Empresa / Condomínio */}
          {isCreatingCompany && (
            <div className="rounded-2xl bg-gradient-to-b from-sky-950 to-purple-950/50 border-2 border-purple-500/50 p-5 sm:p-6 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Cadastrar Novo Condomínio ou Empresa (PJ)</h4>
                    <p className="text-xs text-purple-200/80">Adicione um novo cliente corporativo com dados do Síndico e CNPJ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingCompany(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-900 border border-sky-700 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleCreateCompanySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome do Condomínio / Nome Fantasia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Condomínio Residencial Solar das Águas"
                      value={newCompTradeName}
                      onChange={(e) => setNewCompTradeName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sky-900/90 border border-purple-500/40 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Razão Social Completa
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: CONDOMÍNIO EDIFÍCIO SOLAR DAS ÁGUAS"
                      value={newCompCompanyName}
                      onChange={(e) => setNewCompCompanyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sky-900/90 border border-sky-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      CNPJ do Condomínio / Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="00.000.000/0001-00"
                      value={newCompCnpj}
                      onChange={(e) => setNewCompCnpj(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sky-900/90 border border-purple-500/40 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Segmento Predial
                    </label>
                    <select
                      value={newCompSegment}
                      onChange={(e) => setNewCompSegment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sky-900/90 border border-sky-700 text-white text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none cursor-pointer"
                    >
                      <option value="Condomínio Residencial">Condomínio Residencial</option>
                      <option value="Condomínio Comercial">Condomínio Comercial / Edifício Corporativo</option>
                      <option value="Galpão Logístico">Galpão Logístico / Industrial</option>
                      <option value="Empresa / Escritório">Empresa Privada / Coworking</option>
                      <option value="Shopping / Galeria">Shopping / Centro Comercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Síndico / Representante Legal *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo Sampaio"
                      value={newCompRepresentative}
                      onChange={(e) => setNewCompRepresentative(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sky-900/90 border border-purple-500/40 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Cargo / Função
                    </label>
                    <select
                      value={newCompRepresentativeRole}
                      onChange={(e) => setNewCompRepresentativeRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sky-900/90 border border-sky-700 text-white text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none cursor-pointer"
                    >
                      <option value="Síndico Profissional">Síndico Profissional</option>
                      <option value="Síndico Morador">Síndico Morador</option>
                      <option value="Gerente Predial">Gerente Predial</option>
                      <option value="Administrador do Condomínio">Administrador do Condomínio</option>
                      <option value="Diretor / Sócio PJ">Diretor / Sócio PJ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Telefone / WhatsApp Corporativo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="(71) 98888-7766"
                      value={newCompPhone}
                      onChange={(e) => setNewCompPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sky-900/90 border border-purple-500/40 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      E-mail do Condomínio / Síndico *
                    </label>
                    <input
                      type="email"
                      placeholder="sindico@condominio.com.br"
                      value={newCompEmail}
                      onChange={(e) => setNewCompEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sky-900/90 border border-sky-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Endereço Completo em Salvador / RMS
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Av. Tancredo Neves, 1500 - Caminho das Árvores, Salvador - BA"
                      value={newCompAddress}
                      onChange={(e) => setNewCompAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sky-900/90 border border-sky-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCompany(false)}
                    className="px-4 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg shadow-purple-900/50 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar e Ativar Condomínio / PJ</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Barra de Busca e Filtros de Empresas */}
          <div className="p-4 rounded-2xl bg-sky-950/80 border border-purple-500/20 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por Condomínio, Razão Social, CNPJ, Síndico ou Bairro..."
                value={companySearchTerm}
                onChange={(e) => setCompanySearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-sky-900/90 border border-purple-500/30 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={companyFilterSegment}
                onChange={(e) => setCompanyFilterSegment(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-sky-900/90 border border-sky-700 text-slate-200 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos os Segmentos</option>
                <option value="Condomínio Residencial">Condomínio Residencial</option>
                <option value="Condomínio Comercial">Condomínio Comercial</option>
                <option value="Galpão Logístico">Galpão Logístico</option>
                <option value="Empresa / Escritório">Empresa / Escritório</option>
              </select>

              <select
                value={companyFilterStatus}
                onChange={(e) => setCompanyFilterStatus(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl bg-sky-900/90 border border-sky-700 text-slate-200 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none cursor-pointer"
              >
                <option value="todos">Status: Todos</option>
                <option value="ativos">Apenas Ativos</option>
                <option value="bloqueados">Apenas Bloqueados</option>
              </select>
            </div>
          </div>

          {/* Grid de Condomínios e Empresas Cadastradas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Condomínios & Empresas Registradas ({filteredCompanyUsers.length})</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Clique em "Operar neste Condomínio" para assumir a visão PJ instantaneamente
              </span>
            </div>

            {filteredCompanyUsers.length === 0 ? (
              <div className="text-center py-12 bg-sky-950/40 rounded-2xl border border-dashed border-purple-500/30 p-8">
                <Building2 className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">Nenhum condomínio ou empresa encontrado</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Não encontramos cadastros com os filtros aplicados. Clique no botão abaixo para cadastrar um novo cliente corporativo.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreatingCompany(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Primeiro Condomínio</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredCompanyUsers.map((comp) => {
                  const compOrders = requests.filter(
                    r => r.clientType === 'empresa_cnpj' && (r.clientName === comp.name || r.clientPhone === comp.phone || r.invoiceCompanyName === comp.companyName)
                  );
                  const isBlocked = comp.isBlocked === true;

                  return (
                    <div
                      key={comp.id}
                      className={`p-5 rounded-2xl border transition-all shadow-lg flex flex-col justify-between gap-4 ${
                        isBlocked
                          ? 'bg-rose-950/20 border-rose-500/40'
                          : 'bg-gradient-to-br from-sky-950/90 via-[#10192e] to-purple-950/40 border-purple-500/40 hover:border-purple-400/70'
                      }`}
                    >
                      {/* Topo do Card da Empresa */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <img
                            src={comp.avatar || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80'}
                            alt={comp.tradeName || comp.name}
                            className="w-12 h-12 rounded-xl object-cover border border-purple-500/50 shrink-0 mt-0.5 shadow"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-white text-sm sm:text-base leading-snug">
                                {comp.tradeName || comp.name}
                              </h5>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/40">
                                {comp.companySegment || 'Condomínio Residencial'}
                              </span>
                              {comp.isVerified && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  <span>Verificado</span>
                                </span>
                              )}
                              {isBlocked && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                                  Bloqueado
                                </span>
                              )}
                            </div>

                            {comp.companyName && comp.companyName !== comp.tradeName && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {comp.companyName}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-xs text-purple-300 mt-1.5 font-mono">
                              <span>CNPJ: {comp.cnpj || '00.000.000/0001-00'}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-300 font-sans">{compOrders.length} ordens de serviço</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(comp);
                            }}
                            className="p-1.5 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Editar dados cadastrais deste condomínio"
                          >
                            <Edit3 className="w-4 h-4 text-purple-300" />
                          </button>
                        </div>
                      </div>

                      {/* Informações do Síndico & Endereço */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-sky-950/60 border border-sky-800/80 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Síndico / Representante:</span>
                          <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>{comp.legalRepresentativeName || 'Síndico Responsável'}</span>
                          </span>
                          <span className="text-[10px] text-purple-300 block">{comp.legalRepresentativeRole || 'Síndico'}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contato Corporativo:</span>
                          <span className="text-slate-200 block font-mono mt-0.5">{comp.phone || comp.companyPhone || 'Sem telefone'}</span>
                          <span className="text-[11px] text-slate-400 truncate block">{comp.email || comp.companyEmail}</span>
                        </div>

                        {comp.address && (
                          <div className="sm:col-span-2 pt-2 border-t border-sky-800/60 flex items-start gap-1.5 text-slate-300 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <span className="truncate">{comp.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação Imediata para este Condomínio */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-500/20">
                        <button
                          type="button"
                          id={`btn-admin-switch-to-comp-${comp.id}`}
                          onClick={() => onSwitchRoleView('cliente', comp, 'empresa_cnpj')}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-purple-950/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          title="Alternar imediatamente para a visão e painel deste Condomínio"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-purple-200" />
                          <span>Operar neste Condomínio</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={onOpenNewService}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Abrir novo chamado para este condomínio"
                          >
                            <Plus className="w-3.5 h-3.5 text-sky-400" />
                            <span>Novo Chamado</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleUserBlock(comp.id, !isBlocked, isBlocked ? undefined : 'Bloqueado pela administração')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                              isBlocked
                                ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40'
                                : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {isBlocked ? (
                              <>
                                <Unlock className="w-3 h-3 text-emerald-300" />
                                <span>Desbloquear</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3 text-rose-400" />
                                <span>Bloquear</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chamados Corporativos & Vistorias Prediais em Salvador e RMS */}
          <div className="p-5 rounded-2xl bg-sky-950/90 border border-purple-500/30 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-sky-800/80 pb-3">
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-purple-400" />
                  <span>Chamados Corporativos & Vistorias em Andamento ({corporateRequests.length})</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ordens de serviço solicitadas por Condomínios e Empresas com condição de faturamento PJ
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenNewService}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Abrir O.S. Corporativa</span>
              </button>
            </div>

            {corporateRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Nenhum chamado corporativo em aberto no momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-sky-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Protocolo</th>
                      <th className="py-2.5 px-3">Condomínio / Empresa</th>
                      <th className="py-2.5 px-3">Serviço / Vistoria</th>
                      <th className="py-2.5 px-3">Urgência</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Técnico Escalado</th>
                      <th className="py-2.5 px-3">Faturamento PJ</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-800/60">
                    {corporateRequests.map((req) => {
                      const getStatusInfo = (status: string) => {
                        switch (status) {
                          case 'concluido':
                            return { label: 'Concluído', style: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' };
                          case 'em_andamento':
                            return { label: 'Em Execução', style: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' };
                          case 'tecnico_agendado':
                            return { label: 'Técnico Escalado', style: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' };
                          case 'orcamento_enviado':
                            return { label: 'Orçamento Enviado', style: 'bg-sky-500/20 text-sky-300 border border-sky-500/30' };
                          default:
                            return { label: 'Em Triagem', style: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' };
                        }
                      };
                      const badge = getStatusInfo(req.status);
                      const paymentMethodLabel = req.paymentMethod === 'faturamento_pj' 
                        ? 'Faturamento PJ' 
                        : req.paymentMethod === 'boleto' 
                        ? 'Boleto' 
                        : req.paymentMethod === 'pix' 
                        ? 'PIX' 
                        : req.paymentMethod === 'cartao_credito' 
                        ? 'Cartão' 
                        : 'A Combinar';

                      return (
                        <tr key={req.id} className="hover:bg-sky-900/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            {req.protocolNumber}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-white block">
                              {req.invoiceCompanyName || req.clientName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {req.invoiceCnpj || req.clientPhone}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-200 font-medium block">{req.serviceTitle || req.serviceName}</span>
                            <span className="text-[10px] text-purple-300">{req.category}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.urgency === 'urgente_24h' ? 'bg-rose-600 text-white' : 'bg-sky-900 text-slate-300'
                            }`}>
                              {req.urgency === 'urgente_24h' ? 'Urgente 24h' : req.urgency === 'alta' ? 'Alta' : 'Normal'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.style}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {req.assignedTechnicianName ? (
                              <span className="font-semibold text-amber-300 flex items-center gap-1">
                                <HardHat className="w-3.5 h-3.5 text-amber-400" />
                                {req.assignedTechnicianName}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">Aguardando escala</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-emerald-400 block">
                              R$ {(req.finalPrice || req.estimatedPrice || 50).toFixed(2)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded border bg-purple-500/10 text-purple-300 border-purple-500/30">
                              <Receipt className="w-2.5 h-2.5" />
                              <span>{paymentMethodLabel}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRequest(req);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-200 text-xs font-semibold cursor-pointer"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Matriz de Manutenções Periódicas & Contratos para Condomínios */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-sky-950 to-sky-950 border border-purple-500/30 shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base">
                  Programas de Manutenção Preventiva Obrigatória para Condomínios (Salvador / RMS)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Serviços com emissão de ART/RRT, laudos técnicos assinados por engenheiros e plano de inspeção periódica
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-sky-900/60 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">Limpeza de Caixas d'Água & Cisternas</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Semestral</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Desinfecção e higienização com laudo bacteriológico e atestado de potabilidade exigido pela Vigilância Sanitária.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-900/60 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">Laudo de Pára-raios SPDA (NBR 5419)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Anual</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Medição ôhmica de aterramento, inspeção das hastes Franklin/gaiola e emissão de laudo para o Corpo de Bombeiros (AVCB).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-900/60 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">Termografia em Quadros Elétricos (NR-10)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Semestral</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Inspeção com câmera térmica para identificar sobrecargas, pontos quentes e evitar princípios de incêndio em barramentos.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-900/60 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">PMOC Climatização (Lei 13.589)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Mensal</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Plano de Manutenção, Operação e Controle de sistemas de ar condicionado central e splits de áreas comuns e salas.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-900/60 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">Bombas de Recalque & Esgoto</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Mensal</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Inspeção preventiva dos quadros de comando, boias automáticas, isolamento de motores e válvulas de retenção.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-900/60 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">Vistoria e Laudo Predial Geral</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Sob Demanda</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Inspeção detalhada de fachadas, pastilhas, impermeabilização, caixas de passagem e barramentos com taxa inicial de R$ 50,00.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: FINANCEIRO & CONCILIAÇÃO */}
      {activeAdminTab === 'financial' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-sky-900 to-sky-900 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Módulo Financeiro & Mercado Pago</h3>
                <p className="text-xs text-slate-400">
                  Conciliação automática de PIX, Cartão de Crédito, Boleto, Faturamento PJ e TED Bancária.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                Gateway Ativo (BRL)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-sky-950 border border-sky-800 p-4 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold">Total de Transações</span>
              <p className="text-2xl font-black text-white">{requests.length}</p>
            </div>
            <div className="rounded-xl bg-sky-950 border border-emerald-500/30 p-4 space-y-1 bg-emerald-950/20">
              <span className="text-[11px] text-emerald-400 font-semibold">Pagamentos Confirmados</span>
              <p className="text-2xl font-black text-emerald-400">{paidPaymentsCount}</p>
            </div>
            <div className="rounded-xl bg-sky-950 border border-amber-500/30 p-4 space-y-1 bg-amber-950/20">
              <span className="text-[11px] text-amber-400 font-semibold">Aguardando Liquidação / Pendentes</span>
              <p className="text-2xl font-black text-amber-400">{pendingPaymentsCount + processingPaymentsCount}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-sky-950 border border-sky-800 p-5 space-y-4">
            <h4 className="font-bold text-white text-sm">Histórico de Cobranças por Ordem de Serviço</h4>
            
            <div className="divide-y divide-slate-800 text-xs">
              {requests.map((r) => {
                const isPaid = r.paymentStatus === 'pago';
                const badge = getPaymentMethodShortBadge(r.paymentMethod);
                const Icon = badge.icon;

                return (
                  <div key={r.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${badge.style}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white">{r.serviceName}</span>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <span className="font-mono text-rose-400">{r.protocolNumber}</span>
                          <span>•</span>
                          <span>{r.clientName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-400 text-xs">
                        {r.budgetProposal?.totalAmount && r.budgetProposal.totalAmount > 0
                          ? `R$ ${r.budgetProposal.totalAmount.toFixed(2)}`
                          : (r.inspectionFee?.amount ? `Taxa Vistoria: R$ ${r.inspectionFee.amount.toFixed(2)}` : (r.estimatedPrice || 'R$ 0,00 (Sob Orçamento)'))}
                      </span>

                      <button
                        type="button"
                        onClick={() => setVerifyingPaymentRequest(r)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-slate-950'
                        }`}
                      >
                        {isPaid ? 'Conciliado' : 'Validar Pagamento'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: PASTA DE ARMAZENAMENTO SEGURO DE DADOS (ADMIN EXCLUSIVE) */}
      {activeAdminTab === 'storage_vault' && (
        <AdminStorageVault
          users={users}
          requests={requests}
          interactionThreads={interactionThreads}
          onOpenUserModal={(targetUser) => setEditingUser(targetUser)}
          onSaveUser={onSaveUser}
        />
      )}

      {/* TAB 4: INTERAÇÃO ADMIN <-> CLIENTE (ORÇAMENTOS & COMPROVANTES) */}
      {activeAdminTab === 'interaction' && (
        <AdminClientInteractionHub
          userRole="admin"
          currentUser={user}
          threads={interactionThreads}
          requests={requests}
          selectedThreadId={selectedInteractionThreadId}
          onTransmitDocument={onTransmitDocument}
          onAdminUpdateDocument={onAdminUpdateDocument}
          onAdminDeleteDocument={onAdminDeleteDocument}
          onSendMessage={onSendMessage}
        />
      )}

      {/* Edit Request Modal */}
      {editingRequest && (
        <AdminEditRequestModal
          isOpen={true}
          onClose={() => setEditingRequest(null)}
          request={editingRequest}
          availableTechnicians={technicianUsers}
          onSave={(updated) => {
            onSaveRequest(updated);
            setEditingRequest(null);
          }}
          onDelete={(id) => {
            onDeleteRequest(id);
            setEditingRequest(null);
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <AdminEditUserModal
          isOpen={true}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          onSave={(updated) => {
            onSaveUser(updated);
            setEditingUser(null);
          }}
          onDelete={(userId) => {
            onDeleteUser(userId);
            setEditingUser(null);
          }}
          onToggleBlock={(userId, isBlocked, reason) => {
            onToggleUserBlock(userId, isBlocked, reason);
          }}
        />
      )}

      {/* Payment Verification Modal */}
      {verifyingPaymentRequest && (
        <PaymentVerificationModal
          isOpen={true}
          onClose={() => setVerifyingPaymentRequest(null)}
          request={verifyingPaymentRequest}
          onConfirmPayment={(requestId, status, method, note) => {
            if (onUpdatePaymentStatus) {
              onUpdatePaymentStatus(requestId, status, method, note);
            }
            setVerifyingPaymentRequest(null);
          }}
        />
      )}

      {/* WhatsApp Dispatch Direct Modal */}
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

      {/* Modal: Emitir Proposta / Orçamento Oficial (Admin) */}
      <AdminOfficialProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => {
          setIsProposalModalOpen(false);
          setSelectedProposalRequest(null);
        }}
        request={selectedProposalRequest}
        requests={requests}
        currentUser={user}
        onProposalSent={(proposal, updatedReq) => {
          onSaveRequest(updatedReq);
        }}
      />

      {/* Modal: Diálogo Seguro entre Solicitante e Administradores (Arquivos e Fotos Protegidos) */}
      <ClientAdminDialogModal
        isOpen={isDialogModalOpen}
        onClose={() => {
          setIsDialogModalOpen(false);
          setSelectedDialogRequest(null);
        }}
        userRole="admin"
        currentUser={user}
        request={selectedDialogRequest}
        requests={requests}
        availableRequests={requests}
        thread={selectedDialogRequest ? interactionThreads?.find(t => t.requestId === selectedDialogRequest.id || t.protocolNumber === selectedDialogRequest.protocolNumber) : null}
        onSendMessage={onSendMessage}
        onTransmitDocument={onTransmitDocument}
      />

    </div>
  );
};
