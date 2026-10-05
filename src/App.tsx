import React, { useState, useMemo } from 'react';
import { ServiceItem, ServiceRequest, ServiceUrgency, UserRole, UserProfile, PaymentMethod, PaymentStatus, BudgetProposal, AdminClientInteractionThread, InteractionDocument, DirectInteractionMessage } from './types';
import { SERVICES_DATA, INITIAL_MOCK_REQUESTS, PRELOADED_USERS, RM_CONTACT_INFO, RM_BANKING_DETAILS, generateSecurityCode, createDefaultGpsTracking } from './data/servicesData';
import { Header } from './components/Header';
import { LogoRM } from './components/LogoRM';
import { AccessSelectionView } from './components/AccessSelectionView';
import { TechnicianView } from './components/TechnicianView';
import { AdminView } from './components/AdminView';
import { ContactModal } from './components/ContactModal';
import { EmergencyBanner } from './components/EmergencyBanner';
import { ServiceRequestModal } from './components/ServiceRequestModal';
import { ServiceDetailsModal } from './components/ServiceDetailsModal';
import { OnlineSupportModal } from './components/OnlineSupportModal';
import { TrackingModal } from './components/TrackingModal';
import { CompletionPhotosModal } from './components/CompletionPhotosModal';
import { SuccessFeedback } from './components/SuccessFeedback';
import { PaymentModal } from './components/PaymentModal';
import { InstallAppModal } from './components/InstallAppModal';
import { ClientAdminDialogModal } from './components/ClientAdminDialogModal';
import { shareAppNative, getAppShareUrl } from './lib/shareUtils';
import { getBrasiliaISOString, getBrasiliaTimeString, getBrasiliaDateString } from './lib/brasiliaTime';
import {
  buildNewRequestAdminNotification,
  dispatchWhatsAppNotification
} from './lib/whatsappNotifications';
import {
  saveServiceRequest,
  getStoredRequests,
  getStoredUsers,
  saveRegisteredUser,
  updateUserByAdmin,
  toggleUserBlock,
  deleteUserByAdmin,
  deleteServiceRequestByAdmin,
  getStoredInteractionThreads,
  saveInteractionThread,
  transmitInteractionDocument,
  updateDocumentByAdmin,
  deleteDocumentByAdmin,
  sendInteractionMessage
} from './lib/supabase';
import { realtimeSync, RealtimeConnectionStatus } from './services/realtimeSync';
import {
  Search,
  Headset,
  Phone,
  ShieldCheck,
  Award,
  Clock,
  CheckCircle,
  Zap,
  Sparkles,
  Layers,
  ArrowUpRight,
  MessageSquare,
  HelpCircle,
  HardHat,
  ChevronRight,
  MessageCircle,
  Mail,
  ClipboardList,
  PlusCircle,
  Building2,
  Wrench,
  Flame,
  Home,
  Wind,
  Droplets,
  Trash2,
  Target,
  User,
  Compass,
  FileText,
  Hammer,
  CreditCard,
  Radio,
  RefreshCw,
  Receipt,
  Download,
  Share2,
  Smartphone,
  Users,
  QrCode,
  ArrowRight,
  Check
} from 'lucide-react';

export default function App() {
  // PWA / Play Store Install State
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Listen for native beforeinstallprompt event
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Access / Role Management: starts at 'guest' for the biometric & document verification access portal
  const [currentRole, setCurrentRole] = useState<UserRole>('guest');
  const [currentUser, setCurrentUser] = useState<UserProfile>(PRELOADED_USERS.cliente);
  const [isAdminMasterSession, setIsAdminMasterSession] = useState(false);

  // Users dataset (Clients, Technicians, Admins)
  const [users, setUsers] = useState<UserProfile[]>(() => getStoredUsers());

  // Services dataset
  const [services] = useState<ServiceItem[]>(SERVICES_DATA);
  
  // User requests state (loaded from local storage / live system)
  const [requests, setRequests] = useState<ServiceRequest[]>(() => getStoredRequests());

  // Interaction Threads state (Orçamentos, Comprovantes & Mensagens Admin <-> Cliente)
  const [interactionThreads, setInteractionThreads] = useState<AdminClientInteractionThread[]>(() => getStoredInteractionThreads());

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  // Modals state
  const [selectedServiceForRequest, setSelectedServiceForRequest] = useState<ServiceItem | null>(null);
  const [selectedServiceForDetails, setSelectedServiceForDetails] = useState<ServiceItem | null>(null);
  const [initialUrgency, setInitialUrgency] = useState<ServiceUrgency>('normal');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [initialContactChannel, setInitialContactChannel] = useState<'whatsapp' | 'call' | 'email'>('whatsapp');
  const [isClientDialogModalOpen, setIsClientDialogModalOpen] = useState(false);
  
  // Payment Modal state
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<ServiceRequest | null>(null);

  // Completion Photos Modal state
  const [completionModalData, setCompletionModalData] = useState<{
    isOpen: boolean;
    request: ServiceRequest | null;
    canUpload: boolean;
  }>({
    isOpen: false,
    request: null,
    canUpload: false
  });
  
  // Last created request feedback
  const [lastCreatedRequest, setLastCreatedRequest] = useState<ServiceRequest | null>(null);

  // Toast notification para cópia automática do PIX CNPJ da RM Manutec
  const [pixBannerToast, setPixBannerToast] = useState<{ show: boolean; message: string } | null>(null);

  // Sincronização em Tempo Real entre Aparelhos (WebSockets + BroadcastChannel)
  const [connectedDevicesCount, setConnectedDevicesCount] = useState<number>(1);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeConnectionStatus>('connecting');
  const [realtimeToast, setRealtimeToast] = useState<{ message: string; timestamp: number } | null>(null);

  // Inicializa a escuta e sincronização em tempo real de todos os aparelhos
  React.useEffect(() => {
    realtimeSync.init({
      onInitState: (data) => {
        if (data.requests && data.requests.length > 0) {
          setRequests(data.requests);
          try { localStorage.setItem('rm_manutec_requests_v6', JSON.stringify(data.requests)); } catch {}
        } else {
          // Se servidor estiver limpo, popula com nossos dados
          const localRequests = getStoredRequests();
          const localUsers = getStoredUsers();
          const localThreads = getStoredInteractionThreads();
          realtimeSync.seedServerIfEmpty({
            requests: localRequests,
            users: localUsers,
            interactionThreads: localThreads
          });
        }

        if (data.users && data.users.length > 0) {
          setUsers(data.users);
          try { localStorage.setItem('rm_manutec_registered_users_v6', JSON.stringify(data.users)); } catch {}
        }

        if (data.interactionThreads && data.interactionThreads.length > 0) {
          setInteractionThreads(data.interactionThreads);
          try { localStorage.setItem('rm_manutec_interaction_threads_v6', JSON.stringify(data.interactionThreads)); } catch {}
        }

        if (data.connectedClients) {
          setConnectedDevicesCount(data.connectedClients);
        }
      },
      onDeviceCountChange: (count) => {
        setConnectedDevicesCount(count);
      },
      onStatusChange: (status) => {
        setRealtimeStatus(status);
      },
      onMutation: (event) => {
        const { action, payload } = event;
        if (action === 'SAVE_REQUEST') {
          const updatedReq = payload as ServiceRequest;
          setRequests(prev => {
            const idx = prev.findIndex(r => r.id === updatedReq.id);
            const next = idx >= 0 ? prev.map(r => r.id === updatedReq.id ? updatedReq : r) : [updatedReq, ...prev];
            try { localStorage.setItem('rm_manutec_requests_v6', JSON.stringify(next)); } catch {}
            return next;
          });
          setRealtimeToast({
            message: `Chamado ${updatedReq.protocolNumber || updatedReq.serviceName} sincronizado de outro aparelho!`,
            timestamp: Date.now()
          });
        } else if (action === 'UPDATE_STATUS') {
          const { requestId, status, statusHistory, assignedTechnician, assignedTechnicianName, budgetProposal, paymentStatus, paymentMethod } = payload;
          setRequests(prev => {
            const next = prev.map(r => {
              if (r.id === requestId) {
                return {
                  ...r,
                  status,
                  ...(statusHistory && { statusHistory }),
                  ...(assignedTechnician && { assignedTechnician }),
                  ...(assignedTechnicianName && { assignedTechnicianName }),
                  ...(budgetProposal && { budgetProposal }),
                  ...(paymentStatus && { paymentStatus }),
                  ...(paymentMethod && { paymentMethod })
                };
              }
              return r;
            });
            try { localStorage.setItem('rm_manutec_requests_v6', JSON.stringify(next)); } catch {}
            return next;
          });
          setRealtimeToast({
            message: `Status atualizado em tempo real para "${status}" em todos os aparelhos!`,
            timestamp: Date.now()
          });
        } else if (action === 'DELETE_REQUEST') {
          const { requestId } = payload;
          setRequests(prev => {
            const next = prev.filter(r => r.id !== requestId);
            try { localStorage.setItem('rm_manutec_requests_v6', JSON.stringify(next)); } catch {}
            return next;
          });
          setRealtimeToast({
            message: `Chamado removido em tempo real pela administração.`,
            timestamp: Date.now()
          });
        } else if (action === 'SAVE_USER') {
          const updatedUser = payload as UserProfile;
          setUsers(prev => {
            const idx = prev.findIndex(u => u.id === updatedUser.id);
            const next = idx >= 0 ? prev.map(u => u.id === updatedUser.id ? updatedUser : u) : [updatedUser, ...prev];
            try { localStorage.setItem('rm_manutec_registered_users_v6', JSON.stringify(next)); } catch {}
            return next;
          });
          setCurrentUser(prev => prev.id === updatedUser.id ? updatedUser : prev);
          setRealtimeToast({
            message: `Cadastro de ${updatedUser.name} atualizado em tempo real!`,
            timestamp: Date.now()
          });
        } else if (action === 'DELETE_USER') {
          const { userId } = payload;
          setUsers(prev => {
            const next = prev.filter(u => u.id !== userId);
            try { localStorage.setItem('rm_manutec_registered_users_v6', JSON.stringify(next)); } catch {}
            return next;
          });
          setRealtimeToast({
            message: `Usuário atualizado na base geral em tempo real.`,
            timestamp: Date.now()
          });
        } else if (action === 'SAVE_THREAD') {
          const updatedThread = payload as AdminClientInteractionThread;
          setInteractionThreads(prev => {
            const idx = prev.findIndex(t => t.id === updatedThread.id || t.requestId === updatedThread.requestId);
            const next = idx >= 0 ? prev.map(t => (t.id === updatedThread.id || t.requestId === updatedThread.requestId) ? updatedThread : t) : [updatedThread, ...prev];
            try { localStorage.setItem('rm_manutec_interaction_threads_v6', JSON.stringify(next)); } catch {}
            return next;
          });
          setRealtimeToast({
            message: `Novo documento / orçamento recebido em tempo real!`,
            timestamp: Date.now()
          });
        }
      },
      onForceRefresh: (reason) => {
        setRealtimeToast({
          message: `Atualização geral recebida: ${reason}`,
          timestamp: Date.now()
        });
        fetch('/api/sync/state')
          .then(res => res.json())
          .then(data => {
            if (data.requests && Array.isArray(data.requests)) {
              setRequests(data.requests);
              try { localStorage.setItem('rm_manutec_requests_v6', JSON.stringify(data.requests)); } catch {}
            }
            if (data.users && Array.isArray(data.users)) {
              setUsers(data.users);
              try { localStorage.setItem('rm_manutec_registered_users_v6', JSON.stringify(data.users)); } catch {}
            }
            if (data.interactionThreads && Array.isArray(data.interactionThreads)) {
              setInteractionThreads(data.interactionThreads);
              try { localStorage.setItem('rm_manutec_interaction_threads_v6', JSON.stringify(data.interactionThreads)); } catch {}
            }
          })
          .catch(() => {});
      }
    });
  }, []);

  // Fechamento automático do Toast de Sincronização
  React.useEffect(() => {
    if (!realtimeToast) return;
    const timer = setTimeout(() => {
      setRealtimeToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [realtimeToast]);

  // Helper icon mapping matching screenshot categories
  const getCategoryIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'alvenarias':
      case 'pintura':
        return <Home className="w-6 h-6 text-[#ea580c]" />;
      case 'eletrica':
        return <Zap className="w-6 h-6 text-[#ea580c]" />;
      case 'ar_condicionado':
        return <Wind className="w-6 h-6 text-[#ea580c]" />;
      case 'serralheria':
        return <Wrench className="w-6 h-6 text-[#ea580c]" />;
      case 'telhados':
        return <Hammer className="w-6 h-6 text-[#ea580c]" />;
      case 'pisos':
        return <Layers className="w-6 h-6 text-[#ea580c]" />;
      case 'hidraulica':
        return <Droplets className="w-6 h-6 text-[#ea580c]" />;
      case 'vidracaria':
        return <Sparkles className="w-6 h-6 text-[#ea580c]" />;
      case 'descarte_entulho':
        return <Trash2 className="w-6 h-6 text-[#ea580c]" />;
      case 'pequenos_reparos':
      case 'fechaduras':
        return <Wrench className="w-6 h-6 text-[#ea580c]" />;
      default:
        return <Home className="w-6 h-6 text-[#ea580c]" />;
    }
  };

  // Filter logic
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        service.commonServices.some(cs => cs.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeCategory === 'todos') return true;
      if (activeCategory === 'eletrica') return service.category === 'eletrica';
      if (activeCategory === 'climatizacao') return service.id === 'ar_condicionado';
      if (activeCategory === 'civil') return service.category === 'estrutural' || service.category === 'acabamento' || service.category === 'manutencao';
      if (activeCategory === 'emergencia') return service.isEmergency24h;
      if (activeCategory === 'acabamento') return service.category === 'acabamento';
      if (activeCategory === 'estrutural') return service.category === 'estrutural';
      if (activeCategory === 'descarte') return service.category === 'descarte';

      return true;
    });
  }, [services, searchTerm, activeCategory]);

  const handleOpenRequest = (service: ServiceItem, isDirectUrgency = false) => {
    setSelectedServiceForRequest(service);
    setInitialUrgency(isDirectUrgency || service.isEmergency24h ? 'alta' : 'normal');
  };

  const handleOpenContact = (channel: 'whatsapp' | 'call' | 'email' = 'whatsapp') => {
    setInitialContactChannel(channel);
    setIsContactOpen(true);
  };

  const handleRoleSelect = (role: UserRole, user?: UserProfile) => {
    setCurrentRole(role);
    if (role === 'admin') {
      setIsAdminMasterSession(true);
    }
    // Sincroniza lista geral de usuários cadastrados
    setUsers(getStoredUsers());
    if (user) {
      setCurrentUser(user);
    } else if (role === 'cliente') {
      setCurrentUser(PRELOADED_USERS.cliente);
    } else if (role === 'tecnico') {
      setCurrentUser(PRELOADED_USERS.tecnico);
    } else if (role === 'admin') {
      setCurrentUser(PRELOADED_USERS.admin);
    }
  };

  // Administrative Master Handlers
  const handleSaveRequestByAdmin = (updatedReq: ServiceRequest) => {
    saveServiceRequest(updatedReq);
    setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
  };

  const handleDeleteRequestByAdmin = (requestId: string) => {
    const updated = deleteServiceRequestByAdmin(requestId);
    setRequests(updated);
  };

  const handleSaveUser = (updatedUser: UserProfile) => {
    const updatedList = updateUserByAdmin(updatedUser);
    setUsers(updatedList);
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleToggleUserBlock = (userId: string, isBlocked: boolean, reason?: string) => {
    const updatedList = toggleUserBlock(userId, isBlocked, reason);
    setUsers(updatedList);
    if (currentUser.id === userId) {
      const found = updatedList.find(u => u.id === userId);
      if (found) setCurrentUser(found);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updatedList = deleteUserByAdmin(userId);
    setUsers(updatedList);
  };

  // Interaction Threads & Document Transmission Handlers
  const handleTransmitDocument = (threadIdOrReqId: string, doc: InteractionDocument) => {
    const req = requests.find(r => r.id === threadIdOrReqId || r.protocolNumber === threadIdOrReqId);
    const updatedThreads = transmitInteractionDocument(
      threadIdOrReqId,
      doc,
      req?.protocolNumber,
      req?.clientName || currentUser.name,
      req?.serviceName
    );
    setInteractionThreads([...updatedThreads]);
  };

  const handleAdminUpdateDocument = (threadId: string, docId: string, updates: Partial<InteractionDocument>) => {
    const updatedThreads = updateDocumentByAdmin(threadId, docId, updates);
    setInteractionThreads([...updatedThreads]);
  };

  const handleAdminDeleteDocument = (threadId: string, docId: string) => {
    const updatedThreads = deleteDocumentByAdmin(threadId, docId);
    setInteractionThreads([...updatedThreads]);
  };

  const handleSendMessage = (threadId: string, msg: DirectInteractionMessage) => {
    const updatedThreads = sendInteractionMessage(threadId, msg);
    setInteractionThreads([...updatedThreads]);
  };

  const handleSwitchRoleView = (
    role: UserRole,
    targetUser?: UserProfile,
    clientSubtype?: 'pessoa_fisica' | 'empresa_cnpj'
  ) => {
    setIsAdminMasterSession(true);
    setCurrentRole(role);
    if (targetUser) {
      setCurrentUser(targetUser);
    } else if (role === 'cliente') {
      if (clientSubtype === 'empresa_cnpj') {
        const companyUser = users.find(u => u.clientType === 'empresa_cnpj') || PRELOADED_USERS.empresa;
        setCurrentUser(companyUser);
      } else {
        const pfUser = users.find(u => u.clientType === 'pessoa_fisica' || !u.clientType) || PRELOADED_USERS.cliente;
        setCurrentUser(pfUser);
      }
    } else if (role === 'tecnico') {
      const techUser = users.find(u => u.role === 'tecnico') || PRELOADED_USERS.tecnico;
      setCurrentUser(techUser);
    } else if (role === 'admin') {
      setCurrentUser(PRELOADED_USERS.admin);
    }
  };

  const [adminInitialTab, setAdminInitialTab] = useState<'requests' | 'users' | 'companies' | 'storage_vault' | 'financial' | 'interaction'>('requests');

  const handleOpenAdminTab = (tab: 'requests' | 'users' | 'companies' | 'storage_vault' | 'financial' | 'interaction') => {
    setIsAdminMasterSession(true);
    setCurrentRole('admin');
    setCurrentUser(PRELOADED_USERS.admin);
    setAdminInitialTab(tab);
  };

  const handleUpdateRequestStatus = (requestId: string, newStatus: ServiceRequest['status']) => {
    setRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      
      const statusTitleMap: Record<ServiceRequest['status'], string> = {
        pendente: 'Chamado Criado',
        em_analise: 'Em Triagem Técnica',
        orcamento_enviado: 'Orçamento Enviado ao Cliente',
        tecnico_agendado: 'Técnico Escalado',
        em_andamento: 'Atendimento em Execução',
        concluido: 'Serviço Concluído'
      };

      const newTimelineEntry = {
        status: newStatus,
        title: statusTitleMap[newStatus],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString(),
        description: `Status atualizado para ${statusTitleMap[newStatus]} pela equipe RM Manutec.`
      };

      return {
        ...req,
        status: newStatus,
        completedAt: newStatus === 'concluido' ? (req.completedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - Hoje') : req.completedAt,
        timeline: [...req.timeline, newTimelineEntry]
      };
    }));
  };

  const handleOpenCompletionPhotos = (request: ServiceRequest, canUpload = false) => {
    setCompletionModalData({
      isOpen: true,
      request,
      canUpload
    });
  };

  const handleSaveCompletionPhotos = (requestId: string, photos: string[], note?: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      return {
        ...req,
        completionPhotos: photos,
        completionNote: note !== undefined ? note : req.completionNote,
        completedAt: req.completedAt || (new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString())
      };
    }));

    setCompletionModalData(prev => ({
      ...prev,
      request: prev.request && prev.request.id === requestId ? {
        ...prev.request,
        completionPhotos: photos,
        completionNote: note !== undefined ? note : prev.request.completionNote,
        completedAt: prev.request.completedAt || (new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString())
      } : prev.request
    }));
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'pix': return 'PIX Instantâneo';
      case 'cartao_credito': return 'Cartão de Crédito (Parcelado)';
      case 'cartao_debito': return 'Cartão de Débito';
      case 'faturamento_pj': return 'Faturamento PJ (15/30 Dias com NF-e)';
      default: return 'Pagamento Confirmado';
    }
  };

  const handleProcessPayment = (
    requestId: string,
    method: PaymentMethod,
    details?: {
      pixKey?: string;
      transactionId?: string;
      cardDetails?: any;
      boletoDetails?: any;
      faturamentoPjDetails?: any;
      localPaymentDetails?: any;
      transferDetails?: any;
      mercadoPagoDetails?: any;
    }
  ) => {
    const paidTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString();
    const methodLabel = getPaymentMethodLabel(method);
    const isPaidImmediately = method === 'pix' || method === 'cartao_credito' || method === 'cartao_debito';
    
    setRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;

      const isInspectionPayment = 
        req.paymentTypeRequested === 'taxa_deslocamento' || 
        (req.requestType === 'vistoria_presencial' && req.inspectionFee && !req.inspectionFee.isPaid);

      const isBudgetPayment = 
        req.paymentTypeRequested === 'orcamento_servico' ||
        (req.budgetProposal && (req.budgetProposal.status === 'aprovado' || req.status === 'orcamento_enviado'));

      let updatedInspectionFee = req.inspectionFee;
      if (isInspectionPayment && isPaidImmediately) {
        updatedInspectionFee = {
          amount: req.inspectionFee?.amount || 50.00,
          currency: 'BRL',
          isPaid: true,
          paidAt: paidTimestamp,
          paymentMethod: method
        };
      }

      let updatedBudgetProposal = req.budgetProposal;
      if (isBudgetPayment && req.budgetProposal) {
        updatedBudgetProposal = {
          ...req.budgetProposal,
          status: 'aprovado',
          paymentStatus: isPaidImmediately ? 'pago' : 'pendente',
          paidAt: isPaidImmediately ? paidTimestamp : undefined,
          paymentMethod: method
        };
      }

      const nextStatus: ServiceRequest['status'] = isInspectionPayment && isPaidImmediately
        ? 'tecnico_agendado'
        : isBudgetPayment && isPaidImmediately
        ? 'tecnico_agendado'
        : req.status;

      let paymentDescription = isPaidImmediately
        ? `Transação processada e confirmada via gateway Mercado Pago.`
        : `Opção de pagamento registrada (${methodLabel}). Aguardando processamento bancário ou execução.`;

      if (isInspectionPayment && isPaidImmediately) {
        paymentDescription = `Taxa de Deslocamento R$ 50,00 Paga com Sucesso (${methodLabel}). Vistoria presencial confirmada na agenda do técnico para ${req.preferredDate} (${req.preferredPeriod}).`;
      } else if (isBudgetPayment && isPaidImmediately) {
        paymentDescription = `Orçamento de R$ ${(req.budgetProposal?.totalAmount || 0).toFixed(2)} Aprovado e Pago com Sucesso (${methodLabel}). Execução autorizada.`;
      }

      const updated: ServiceRequest = {
        ...req,
        status: nextStatus,
        paymentStatus: isPaidImmediately ? 'pago' : 'processando',
        paymentMethod: method,
        paidAt: isPaidImmediately ? paidTimestamp : undefined,
        inspectionFee: updatedInspectionFee,
        budgetProposal: updatedBudgetProposal,
        pixTransactionId: details?.transactionId || req.pixTransactionId,
        cardDetails: details?.cardDetails || req.cardDetails,
        boletoDetails: details?.boletoDetails || req.boletoDetails,
        faturamentoPjDetails: details?.faturamentoPjDetails || req.faturamentoPjDetails,
        localPaymentDetails: details?.localPaymentDetails || req.localPaymentDetails,
        transferDetails: details?.transferDetails || req.transferDetails,
        mercadoPagoDetails: details?.mercadoPagoDetails || req.mercadoPagoDetails,
        timeline: [
          ...req.timeline,
          {
            status: nextStatus,
            title: isPaidImmediately 
              ? (isInspectionPayment ? `Taxa de Deslocamento Paga (R$ 50,00)` : isBudgetPayment ? `Orçamento Aprovado & Pago` : `Pagamento Confirmado (${methodLabel})`)
              : `Método Selecionado: ${methodLabel}`,
            timestamp: paidTimestamp,
            description: paymentDescription
          }
        ]
      };
      saveServiceRequest(updated);
      return updated;
    }));

    setSelectedPaymentRequest(null);
  };

  const handleApproveBudgetAndPay = (request: ServiceRequest) => {
    const updatedProposal: BudgetProposal = {
      ...(request.budgetProposal || {
        id: `prop-${Date.now()}`,
        laborAmount: 250,
        materialsAmount: 130,
        totalAmount: 380,
        description: request.description,
        sentAt: new Date().toISOString(),
        status: 'aprovado',
        paymentRequired: true,
        paymentStatus: 'pendente'
      }),
      status: 'aprovado'
    };

    const updatedRequest: ServiceRequest = {
      ...request,
      budgetProposal: updatedProposal,
      paymentTypeRequested: 'orcamento_servico'
    };

    saveServiceRequest(updatedRequest);
    setRequests(prev => prev.map(r => r.id === request.id ? updatedRequest : r));
    setSelectedPaymentRequest(updatedRequest);
  };

  const handleAdminUpdatePaymentStatus = (
    requestId: string,
    newStatus: PaymentStatus,
    paymentMethod?: PaymentMethod,
    note?: string
  ) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString();
    
    setRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      
      const methodToUse = paymentMethod || req.paymentMethod || 'pix';
      const methodLabel = getPaymentMethodLabel(methodToUse);
      const isPaid = newStatus === 'pago';

      const updated: ServiceRequest = {
        ...req,
        paymentStatus: newStatus,
        paymentMethod: methodToUse,
        paidAt: isPaid ? (req.paidAt || timestamp) : req.paidAt,
        timeline: [
          ...req.timeline,
          {
            status: req.status,
            title: isPaid ? `Pagamento Validado pelo Gestor (${methodLabel})` : `Status de Pagamento: ${newStatus.toUpperCase()} (${methodLabel})`,
            timestamp,
            description: note 
              ? `Verificação financeira: ${note}` 
              : isPaid
              ? `Pagamento verificado e conciliado no painel administrativo RM Manutec.`
              : `Alteração cadastrada pela supervisão geral.`
          }
        ]
      };
      saveServiceRequest(updated);
      return updated;
    }));
  };

  const handleUpdateGpsLocation = (requestId: string, newGps: NonNullable<ServiceRequest['gpsTracking']>) => {
    setRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      return {
        ...req,
        gpsTracking: newGps
      };
    }));
  };

  const handleCreateRequest = (
    newReqData: Omit<ServiceRequest, 'id' | 'protocolNumber' | 'createdAt' | 'status' | 'timeline'>
  ) => {
    const randomProtocol = `RM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const securityCode = generateSecurityCode();
    const gpsTracking = createDefaultGpsTracking(newReqData.address.neighborhood);

    const newRequest: ServiceRequest = {
      ...newReqData,
      id: `req-${Date.now()}`,
      protocolNumber: randomProtocol,
      createdAt: getBrasiliaISOString(),
      status: 'pendente',
      paymentStatus: newReqData.paymentStatus || 'pendente',
      securityCode,
      gpsTracking,
      assignedTechnician: newReqData.urgency === 'urgente_24h' ? {
        name: 'Lucas Gabriel Almeida',
        role: 'Técnico Plantonista RM Manutec',
        phone: '(71) 99123-4567',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        rating: 5.0,
        eta: 'Em até 40 minutos',
        creaOrCrt: 'CREA-BA 506.892/D'
      } : undefined,
      timeline: [
        {
          status: 'pendente',
          title: 'Chamado Criado na RM Manutec',
          timestamp: `${getBrasiliaTimeString()} - ${getBrasiliaDateString()}`,
          description: 'Sua solicitação foi registrada no sistema com prioridade ' + newReqData.urgency.toUpperCase() + '.'
        }
      ]
    };

    saveServiceRequest(newRequest);
    setRequests(prev => [newRequest, ...prev]);
    setSelectedServiceForRequest(null);
    setLastCreatedRequest(newRequest);

    // Dispara automaticamente notificação WhatsApp para a Administração Central (71) 99649-2354
    try {
      const adminNotif = buildNewRequestAdminNotification(newRequest);
      dispatchWhatsAppNotification({
        type: 'solicitacao_servico',
        targetRole: 'admin',
        recipientName: 'Central de Gestão RM Manutec',
        recipientPhone: adminNotif.targetPhone,
        recipientPhoneFormatted: '(71) 99649-2354',
        messageText: adminNotif.message,
        whatsappUrl: adminNotif.url,
        status: 'disparado'
      }, true);
    } catch (err) {
      console.warn('Erro ao disparar notificação automática para o Administrador:', err);
    }

    // If on-site visit requested with R$ 50 fee, prompt payment modal immediately to confirm booking
    if (newRequest.requestType === 'vistoria_presencial' && newRequest.inspectionFee && !newRequest.inspectionFee.isPaid) {
      setSelectedPaymentRequest({
        ...newRequest,
        paymentTypeRequested: 'taxa_deslocamento'
      });
    }
  };

  const handleAgendarVistoriaPixDireto = (targetService?: ServiceItem) => {
    // 1. Auto-copia a chave PIX CNPJ oficial da RM Manutec
    try {
      navigator.clipboard?.writeText(RM_BANKING_DETAILS.pixKeyCnpj || '64.177.147/0001-34');
      setPixBannerToast({
        show: true,
        message: 'Chave PIX CNPJ (64.177.147/0001-34) da RM Manutec copiada! Preencha a data e local para confirmar sua vistoria presencial (R$ 50,00).'
      });
      setTimeout(() => setPixBannerToast(null), 5000);
    } catch (e) {
      console.warn('Clipboard write error', e);
    }

    // 2. Abre a modal de solicitação de serviço já no fluxo de vistoria presencial
    const svc = targetService || services[0];
    if (svc) {
      setSelectedServiceForRequest(svc);
    }
  };

  // If in Initial Access Selection Screen ('guest'), render AccessSelectionView
  if (currentRole === 'guest') {
    return (
      <>
        <AccessSelectionView
          onSelectRole={handleRoleSelect}
          onOpenContact={handleOpenContact}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          onShareApp={() => shareAppNative()}
        />
        <ContactModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
          initialChannel={initialContactChannel}
        />
        <InstallAppModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
        />
      </>
    );
  }

  // Current display user first name or fallback
  const displayName = currentUser.name ? currentUser.name.split(' ')[0] : 'Cliente';
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-orange-500/20 selection:text-orange-900 font-sans antialiased">
      
      {/* Top Professional RM Manutec Branding Bar with Original Logo */}
      <div className="bg-sky-900 text-white border-b border-sky-700 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentRole('guest')}>
            <LogoRM size="sm" />
            <div className="hidden sm:block border-l border-sky-800 pl-3">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Soluções em Manutenção
              </span>
              <span className="text-[11px] text-slate-400">
                Civil • Elétrica • Refrigeração • Salvador - BA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Realtime Sync Status Indicator */}
            <div
              id="badge-top-realtime-sync"
              onClick={() => {
                realtimeSync.broadcastForceRefreshAll('Sincronização manual acionada');
                setRealtimeToast({
                  message: 'Comando de sincronização disparado para todos os aparelhos!',
                  timestamp: Date.now()
                });
              }}
              title="Sincronização ativa em tempo real: qualquer alteração atualiza todos os sites em cada aparelho conectado. Clique para sincronizar agora."
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>{connectedDevicesCount > 1 ? `${connectedDevicesCount} aparelhos ao vivo` : 'Tempo Real'}</span>
              <RefreshCw className="w-3 h-3 text-emerald-400/80 hover:rotate-180 transition-transform" />
            </div>

            {/* Install App Button in Top Bar */}
            <button
              id="btn-top-install-app"
              onClick={() => setIsInstallModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Instalar Aplicativo Oficial (Play Store / PWA)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">Instalar App</span>
            </button>

            {/* Share App Button */}
            <button
              id="btn-top-share-app"
              onClick={() => shareAppNative()}
              className="p-1.5 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-300 border border-sky-700 text-xs transition-colors cursor-pointer"
              title="Compartilhar Link do Aplicativo"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            <button
              onClick={() => setIsTrackingOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-sky-700 transition-colors"
              title="Histórico de chamados"
            >
              <ClipboardList className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xs:inline">Histórico</span>
              {requests.length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                  {requests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentRole('guest')}
              className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
              title="Trocar perfil ou sair"
            >
              Acesso
            </button>
          </div>
        </div>
      </div>

      {/* Top Admin Master Navigation Bar (Permite à administração navegar e operar diretamente na visão de Cliente PF, Empresa/Condomínio ou Técnico a qualquer momento) */}
      {(isAdminMasterSession || currentRole === 'admin') && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-3 sm:px-4 py-2 shadow-lg border-b border-amber-400/50 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs font-bold">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-sky-950 text-amber-300 px-2 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider border border-amber-500/30">
                👑 Navegação Mestre Gestão
              </span>
              <span className="text-slate-950 font-bold">
                Operando como: <strong className="underline decoration-slate-900">{currentUser.clientType === 'empresa_cnpj' ? 'Empresa & Condomínio (PJ)' : currentRole === 'tecnico' ? 'Técnico / Profissional' : currentRole === 'admin' ? 'Administração Central' : 'Cliente (Pessoa Física)'}</strong> ({currentUser.name})
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {/* Botão Operar como Cliente (PF) */}
              <button
                type="button"
                id="btn-master-switch-cliente-pf"
                onClick={() => handleSwitchRoleView('cliente', undefined, 'pessoa_fisica')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  currentRole === 'cliente' && currentUser.clientType !== 'empresa_cnpj'
                    ? 'bg-sky-950 text-rose-300 ring-2 ring-rose-400'
                    : 'bg-white/90 hover:bg-white text-slate-900'
                }`}
                title="Operar diretamente na visão do Cliente Pessoa Física"
              >
                <Users className="w-3.5 h-3.5 text-rose-600" />
                <span>Cliente PF</span>
              </button>

              {/* Botão Operar como Empresa e Condomínio (PJ) */}
              <button
                type="button"
                id="btn-master-switch-empresa"
                onClick={() => handleSwitchRoleView('cliente', undefined, 'empresa_cnpj')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  currentRole === 'cliente' && currentUser.clientType === 'empresa_cnpj'
                    ? 'bg-sky-950 text-purple-300 ring-2 ring-purple-400'
                    : 'bg-white/90 hover:bg-white text-slate-900'
                }`}
                title="Operar diretamente na visão de Empresa e Condomínio"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Empresa & Condomínio</span>
              </button>

              {/* Botão Operar como Técnico */}
              <button
                type="button"
                id="btn-master-switch-tecnico"
                onClick={() => handleSwitchRoleView('tecnico')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  currentRole === 'tecnico'
                    ? 'bg-sky-950 text-amber-300 ring-2 ring-amber-400'
                    : 'bg-white/90 hover:bg-white text-slate-900'
                }`}
                title="Operar diretamente na visão do Técnico"
              >
                <HardHat className="w-3.5 h-3.5 text-amber-700" />
                <span>Técnico</span>
              </button>

              {/* Botão Acesso ao Controle da Aba Empresas & Condomínio no Admin */}
              <button
                type="button"
                id="btn-master-switch-admin-companies"
                onClick={() => handleOpenAdminTab('companies')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  currentRole === 'admin' && adminInitialTab === 'companies'
                    ? 'bg-sky-950 text-purple-300 ring-2 ring-purple-400'
                    : 'bg-white/90 hover:bg-white text-slate-900'
                }`}
                title="Acessar o Controle da Aba Empresas e Condomínio no Painel da Administração"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Controle Empresas & Condomínio</span>
              </button>

              {/* Botão Retornar ao Painel da Administração */}
              {currentRole !== 'admin' ? (
                <button
                  type="button"
                  id="btn-master-return-admin"
                  onClick={() => {
                    handleOpenAdminTab('requests');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-amber-300 font-black text-xs shadow-sm flex items-center gap-1 transition-all cursor-pointer ml-1"
                  title="Voltar ao Painel Geral da Administração"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Painel Admin</span>
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-sky-950/80 text-amber-300 font-bold text-[11px] ml-1">
                  ✓ No Painel Admin
                </span>
              )}

              {/* Botão Sincronizar e Atualizar Todos os Aparelhos Abertos */}
              <button
                type="button"
                id="btn-master-sync-all-devices"
                onClick={() => {
                  realtimeSync.broadcastForceRefreshAll('Atualização em tempo real acionada pela Administração');
                  setRealtimeToast({
                    message: 'Comando enviado: Todos os sites e aparelhos abertos foram sincronizados agora!',
                    timestamp: Date.now()
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ml-1 border border-emerald-400/40"
                title="Sincronizar e atualizar imediatamente todos os aparelhos e abas abertas"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar Todos os Aparelhos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area styled exactly after user's image reference */}
      <main className="flex-1 max-w-lg sm:max-w-xl md:max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* VIEW 1: SOU TÉCNICO MODE */}
        {currentRole === 'tecnico' && (
          <TechnicianView
            user={currentUser}
            requests={requests}
            onUpdateRequestStatus={handleUpdateRequestStatus}
            onLogout={() => {
              setIsAdminMasterSession(false);
              setCurrentRole('guest');
            }}
            onOpenContact={() => handleOpenContact('call')}
            onOpenCompletionPhotos={handleOpenCompletionPhotos}
            onUpdateGpsLocation={handleUpdateGpsLocation}
          />
        )}

        {/* VIEW 2: ADMINISTRAÇÃO MODE */}
        {currentRole === 'admin' && (
          <AdminView
            user={currentUser}
            requests={requests}
            users={users}
            initialTab={adminInitialTab}
            onUpdateRequestStatus={handleUpdateRequestStatus}
            onUpdatePaymentStatus={handleAdminUpdatePaymentStatus}
            onSaveRequest={handleSaveRequestByAdmin}
            onDeleteRequest={handleDeleteRequestByAdmin}
            onSaveUser={handleSaveUser}
            onToggleUserBlock={handleToggleUserBlock}
            onDeleteUser={handleDeleteUser}
            onSwitchRoleView={handleSwitchRoleView}
            onLogout={() => {
              setIsAdminMasterSession(false);
              setCurrentRole('guest');
            }}
            onOpenNewService={() => {
              const defaultService = services[0];
              if (defaultService) handleOpenRequest(defaultService);
            }}
            onOpenContact={() => handleOpenContact('whatsapp')}
            onOpenCompletionPhotos={handleOpenCompletionPhotos}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
            onShareApp={() => shareAppNative()}
            onOpenTrackingModal={() => setIsTrackingOpen(true)}
            interactionThreads={interactionThreads}
            onTransmitDocument={handleTransmitDocument}
            onAdminUpdateDocument={handleAdminUpdateDocument}
            onAdminDeleteDocument={handleAdminDeleteDocument}
            onSendMessage={handleSendMessage}
          />
        )}

        {/* VIEW 3: SOU CLIENTE MODE (Modern Layout Model matching user's reference image) */}
        {currentRole === 'cliente' && (
          <>
            {/* Active Service Notification Alert Banner for Client Safety */}
            {requests.some(r => r.status === 'tecnico_agendado' || r.status === 'em_andamento') && (
              <div 
                id="banner-active-service-alert"
                onClick={() => setIsTrackingOpen(true)}
                className="rounded-2xl p-4 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-800 border border-emerald-500/40 shadow-xl shadow-slate-900/20 text-white cursor-pointer hover:border-emerald-400 transition-all group animate-in fade-in slide-in-from-top-4 duration-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 font-bold">
                          ORDEM EM ATENDIMENTO
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {requests.find(r => r.status === 'tecnico_agendado' || r.status === 'em_andamento')?.protocolNumber}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                        Técnico {requests.find(r => r.status === 'tecnico_agendado' || r.status === 'em_andamento')?.assignedTechnician?.name || 'RM Manutec'} Alocado
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        PIN de Segurança: <strong className="text-emerald-400 font-mono">{requests.find(r => r.status === 'tecnico_agendado' || r.status === 'em_andamento')?.securityCode || 'RM-5924'}</strong> • Serviço Garantido
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-1 shrink-0 transition-colors"
                  >
                    <span>Ver Chamado</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* 1. Header Greeting Section: Clean Welcome Greeting and Avatar/Verification Badge */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Cadastro & Biometria Validados
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Seja bem-vindo(a)! <span className="inline-block animate-wiggle">👋</span>
                </h1>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">
                  No que podemos ajudar hoje?
                </p>
              </div>

              {/* Avatar circle / Profile selector */}
              <button
                id="btn-user-avatar"
                onClick={() => setCurrentRole('guest')}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#161e2e] text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md hover:ring-4 hover:ring-slate-300 transition-all cursor-pointer shrink-0"
                title="Clique para gerenciar perfil ou trocar acesso"
              >
                {initialLetter}
              </button>
            </div>

            {/* 2. Hero Banner Card: Textured Copper/Bronze Metallic Design */}
            <div 
              id="card-hero-banner"
              className="relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-xl shadow-orange-950/15 border border-orange-950/20 text-white"
              style={{
                background: 'linear-gradient(135deg, #a4481b 0%, #632a10 50%, #1e110b 100%)',
              }}
            >
              {/* Subtle industrial diamond plate mesh overlay */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)`,
                  backgroundSize: '16px 16px'
                }}
              />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-3.5 max-w-sm">
                  {/* 24h Tag */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-white text-[11px] font-bold tracking-wider uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    SERVIÇOS 24H • SALVADOR E RMS
                  </div>

                  {/* Headline */}
                  <div className="space-y-1.5">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      Precisa de manutenção?
                    </h2>
                    <p className="text-xs sm:text-sm text-amber-100/90 font-normal leading-relaxed">
                      Atendimento predial e residencial com equipe especializada da RM Manutec.
                    </p>
                  </div>

                  {/* Button Actions */}
                  <div className="pt-1 flex flex-wrap items-center gap-2.5">
                    <button
                      id="btn-solicitar-atendimento-hero"
                      onClick={() => {
                        const defaultService = services[0];
                        if (defaultService) handleOpenRequest(defaultService);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-amber-50 text-[#8c3713] font-bold text-xs sm:text-sm shadow-lg shadow-black/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Target className="w-4 h-4 text-[#8c3713]" />
                      <span>Solicitar atendimento</span>
                    </button>

                    <button
                      id="btn-agendar-vistoria-pix-hero"
                      onClick={() => handleAgendarVistoriaPixDireto()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-emerald-300"
                    >
                      <QrCode className="w-4 h-4 text-slate-950 animate-pulse" />
                      <span>Agendar Vistoria e Pagar (PIX CNPJ)</span>
                    </button>
                  </div>
                </div>

                {/* Original RM Manutec 3D Logo Badge inside Hero */}
                <div className="hidden sm:flex flex-col items-center justify-center p-2 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm shadow-inner shrink-0">
                  <LogoRM size="md" />
                </div>
              </div>
            </div>

            {/* 3. Three Quick Action Cards (WhatsApp / Ligar / E-mail) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              
              {/* Card 1: WhatsApp (VERDE) */}
              <button
                id="btn-quick-whatsapp"
                onClick={() => handleOpenContact('whatsapp')}
                className="bg-white hover:bg-emerald-50/60 border border-slate-100 hover:border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2.5 shadow-sm hover:shadow-md transition-all active:scale-95 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  WhatsApp
                </span>
              </button>

              {/* Card 2: Ligar (AZUL) */}
              <button
                id="btn-quick-ligar"
                onClick={() => handleOpenContact('call')}
                className="bg-white hover:bg-blue-50/60 border border-slate-100 hover:border-blue-300 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2.5 shadow-sm hover:shadow-md transition-all active:scale-95 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform flex items-center justify-center shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                  Ligar
                </span>
              </button>

              {/* Card 3: E-mail */}
              <button
                id="btn-quick-email"
                onClick={() => handleOpenContact('email')}
                className="bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2.5 shadow-sm hover:shadow-md transition-all active:scale-95 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 group-hover:scale-110 transition-transform flex items-center justify-center shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  E-mail
                </span>
              </button>

            </div>

            {/* Banner Oficial: Agendar Vistoria e Pagar (Direcionamento Automático para PIX CNPJ RM Manutec) */}
            <div 
              id="card-agendar-vistoria-pix-banner"
              className="rounded-2xl bg-gradient-to-r from-sky-950 via-sky-900 to-sky-950 border-2 border-emerald-500/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-emerald-950/20"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                  <QrCode className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                      PIX CNPJ DIRETO
                    </span>
                    <span className="text-[11px] font-bold text-emerald-300 font-mono">
                      64.177.147/0001-34
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-white mt-1">
                    Agendar Vistoria Presencial e Pagar Taxa (R$ 50,00)
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Visita técnica com análise presencial em Salvador e RMS. Ao clicar, o agendamento é aberto e você é automaticamente direcionado ao PIX CNPJ da RM Manutec.
                  </p>
                </div>
              </div>

              <button
                id="btn-agendar-vistoria-pix-banner"
                type="button"
                onClick={() => handleAgendarVistoriaPixDireto()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <QrCode className="w-4 h-4" />
                <span>Agendar Vistoria e Pagar (PIX)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Nota Fiscal (NF-e) Banner for Client */}
            <div 
              id="card-client-nota-fiscal"
              className="rounded-2xl bg-gradient-to-r from-blue-900/10 via-slate-50 to-blue-50 border border-blue-200/80 p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Opção de Nota Fiscal (NF-e): Sim ou Não
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      Disponível
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Você pode optar por emissão de Nota Fiscal Eletrônica com CNPJ 64.177.147/0001-34 ou recibo simples ao solicitar qualquer atendimento.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const defaultService = services[0];
                  if (defaultService) handleOpenRequest(defaultService);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 self-end sm:self-auto"
              >
                Solicitar com/sem NF-e
              </button>
            </div>

            {/* Central de Interação & Documentos (Orçamentos & Comprovantes) */}
            <div 
              id="card-client-interacao-docs"
              className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-50 border border-amber-200/80 p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20 font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Orçamentos & Comprovantes de Pagamento
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Central de Documentos
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Acesse orçamentos emitidos pela diretoria, transmita comprovantes de PIX (CNPJ 64.177.147/0001-34) / Cartão e tire dúvidas com a administração.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTrackingOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition-all shadow-sm shrink-0 self-end sm:self-auto cursor-pointer"
              >
                Abrir Documentos
              </button>
            </div>

            {/* Canal de Diálogo Seguro entre Solicitante e Administradores com Envio de Arquivos e Fotos */}
            <div 
              id="card-client-dialogo-admin"
              className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-50 border border-emerald-300 p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Canal de Diálogo com Administradores
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Privado & Criptografado
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Envie mensagens, fotos do local e arquivos/plantas protegidos. Apenas os administradores terão acesso a tudo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-open-client-dialog-modal"
                onClick={() => setIsClientDialogModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 shrink-0 self-end sm:self-auto cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Diálogo & Enviar Arquivos</span>
              </button>
            </div>

            {/* 4. Section: Solicitar serviço */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Solicitar serviço
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Toque para abrir uma solicitação
                  </p>
                </div>

                <button
                  onClick={() => setIsSupportOpen(true)}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-200"
                >
                  <Headset className="w-3.5 h-3.5" />
                  Suporte Online
                </button>
              </div>

              {/* Search filter optional for user convenience */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-search-services"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar serviços: elétrica, pintura, telhado, refrigeração..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-semibold"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Sleek Service Cards list formatted strictly after reference image */}
              <div className="space-y-3 pt-1">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    id={`service-row-${service.id}`}
                    onClick={() => handleOpenRequest(service)}
                    className="group bg-white hover:bg-orange-50/30 border border-slate-200/90 hover:border-orange-300 rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                  >
                    {/* Left Icon in Soft Peach Rounded Box */}
                    <div className="w-12 h-12 rounded-xl bg-[#ffedd5] border border-orange-200/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getCategoryIcon(service.id)}
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-orange-950 transition-colors truncate">
                          {service.name}
                        </h4>
                        {service.isEmergency24h && (
                          <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            24h
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {service.shortDescription}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          Preço Mediante Orçamento
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedServiceForDetails(service);
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-700 underline"
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>

                    {/* Right Chevron */}
                    <div className="text-slate-300 group-hover:text-orange-600 transition-colors shrink-0 pr-1">
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Commitment Notice */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-sm text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <span>Garantia & Certificação RM Manutec</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Toda solicitação passa por triagem técnica com engenheiros e profissionais habilitados em Salvador e RMS. Orçamento sob medida e sem compromisso.
              </p>
            </div>
          </>
        )}

      </main>

      {/* Persistent Floating Live Support Button in bottom-right */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="btn-floating-support"
          onClick={() => setIsSupportOpen(true)}
          className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#ea580c] to-[#c2410c] hover:from-[#f97316] hover:to-[#ea580c] text-white font-bold text-xs sm:text-sm shadow-2xl shadow-orange-600/40 border border-orange-400/40 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <Headset className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-orange-600"></span>
          </div>
          <span className="tracking-wide hidden sm:inline">Suporte Online</span>
        </button>
      </div>

      {/* Footer with RM Manutec Branding */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-xs text-slate-500 mt-12">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-bold text-slate-800">RM Manutec • Rua da Paz, Bairro Itapuã, Salvador - BA</div>
            <div className="text-slate-500 mt-0.5">CNPJ: 64.177.147/0001-34 • Atendimento 24h: {RM_CONTACT_INFO.phone}</div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => handleOpenContact('whatsapp')} className="text-emerald-600 font-semibold hover:underline">
              WhatsApp
            </button>
            <span>•</span>
            <button onClick={() => setIsTrackingOpen(true)} className="text-slate-700 font-semibold hover:underline">
              Minhas Solicitações
            </button>
            <span>•</span>
            <button onClick={() => setCurrentRole('guest')} className="text-orange-600 font-semibold hover:underline">
              Trocar Acesso
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <ServiceRequestModal
        service={selectedServiceForRequest}
        initialUrgency={initialUrgency}
        isOpen={Boolean(selectedServiceForRequest)}
        currentUser={currentUser}
        onClose={() => setSelectedServiceForRequest(null)}
        onSubmitRequest={handleCreateRequest}
      />

      <ServiceDetailsModal
        service={selectedServiceForDetails}
        isOpen={Boolean(selectedServiceForDetails)}
        onClose={() => setSelectedServiceForDetails(null)}
        onRequest={(service, isEmergency) => {
          setSelectedServiceForDetails(null);
          handleOpenRequest(service, isEmergency);
        }}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        initialChannel={initialContactChannel}
      />

      <OnlineSupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        onOpenServiceRequest={(service, urgency) => {
          setSelectedServiceForRequest(service);
          setInitialUrgency(urgency || 'normal');
        }}
        currentUser={currentUser}
      />

      <TrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        requests={requests}
        onOpenNewService={() => {
          const defaultService = services[0];
          if (defaultService) handleOpenRequest(defaultService);
        }}
        onOpenCompletionPhotos={handleOpenCompletionPhotos}
        onOpenPayment={(req) => setSelectedPaymentRequest(req)}
        onApproveBudgetAndPay={handleApproveBudgetAndPay}
        onUpdateGpsLocation={handleUpdateGpsLocation}
        onDeleteRequest={handleDeleteRequestByAdmin}
        interactionThreads={interactionThreads}
        onTransmitDocument={handleTransmitDocument}
        onSendMessage={handleSendMessage}
        currentUser={currentUser}
      />

      <CompletionPhotosModal
        isOpen={completionModalData.isOpen}
        onClose={() => setCompletionModalData(prev => ({ ...prev, isOpen: false }))}
        request={completionModalData.request}
        canUpload={completionModalData.canUpload}
        onSavePhotos={handleSaveCompletionPhotos}
      />

      {/* Payment Processing Modal */}
      <PaymentModal
        isOpen={Boolean(selectedPaymentRequest)}
        onClose={() => setSelectedPaymentRequest(null)}
        request={selectedPaymentRequest}
        onConfirmPayment={(method, details) => {
          if (selectedPaymentRequest) {
            handleProcessPayment(selectedPaymentRequest.id, method, details);
          }
        }}
      />

      {/* Official App Installation Modal (Play Store & PWA) */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />

      {/* Client Admin Dialog Modal (Fotos, Mensagens e Arquivos com Armazenamento Seguro) */}
      <ClientAdminDialogModal
        isOpen={isClientDialogModalOpen}
        onClose={() => setIsClientDialogModalOpen(false)}
        userRole="cliente"
        currentUser={currentUser}
        requests={requests}
        availableRequests={requests}
        thread={interactionThreads.find(t => t.clientPhone === currentUser.phone || t.clientName === currentUser.name) || interactionThreads[0] || null}
        onSendMessage={handleSendMessage}
        onTransmitDocument={handleTransmitDocument}
      />

      {/* Success Notification Toast */}
      <SuccessFeedback
        request={lastCreatedRequest}
        onClose={() => setLastCreatedRequest(null)}
        onTrack={() => setIsTrackingOpen(true)}
        onSupport={() => setIsSupportOpen(true)}
      />

      {/* Toast Notificação de Cópia Automática PIX CNPJ RM Manutec */}
      {pixBannerToast?.show && (
        <div 
          id="toast-pix-cnpj-notification"
          className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-md bg-sky-950 text-white border-2 border-emerald-400 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 flex items-start gap-3.5 backdrop-blur-lg"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
            <Check className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <h5 className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span>PIX CNPJ RM Manutec</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-mono">
                64.177.147/0001-34
              </span>
            </h5>
            <p className="mt-1 text-slate-200 leading-relaxed">{pixBannerToast.message}</p>
          </div>
          <button 
            type="button"
            onClick={() => setPixBannerToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-sky-900 transition-colors text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast Notificação de Sincronização em Tempo Real entre Todos os Aparelhos */}
      {realtimeToast && (
        <div 
          id="toast-realtime-sync-notification"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto bg-slate-950/95 text-white border-2 border-emerald-400/80 p-3 sm:p-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3 backdrop-blur-xl"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-emerald-400 text-[11px] uppercase tracking-wider">
                ⚡ Sincronizado em Tempo Real
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <p className="text-slate-200 mt-0.5 font-medium">{realtimeToast.message}</p>
          </div>
          <button 
            type="button"
            onClick={() => setRealtimeToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}


