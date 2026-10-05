export type ServiceUrgency = 'normal' | 'alta' | 'urgente_24h';

export type UserRole = 'guest' | 'cliente' | 'tecnico' | 'admin';

export type PaymentMethod = 
  | 'pix' 
  | 'cartao_credito' 
  | 'cartao_debito' 
  | 'faturamento_pj';

export type PaymentStatus = 'pendente' | 'pago' | 'processando' | 'nao_aplicavel';

export interface BoletoPaymentDetails {
  barcode: string;
  digitableLine: string;
  dueDate: string;
  pdfUrl?: string;
}

export interface FaturamentoPjDetails {
  cnpj: string;
  companyName: string;
  paymentTermDays: number; // 15 or 30 days
  contactFinancial: string;
  requiresNfe: boolean;
}

export interface LocalPaymentDetails {
  preferredType: 'maquininha_cartao' | 'dinheiro' | 'pix_presencial';
  changeForAmount?: string;
}

export interface BankTransferDetails {
  bankName: string;
  agency: string;
  account: string;
  accountType: string;
  cnpj: string;
  beneficiary: string;
  receiptUploaded?: boolean;
}

export interface MercadoPagoPaymentDetails {
  paymentId?: string;
  preferenceId?: string;
  status?: string;
  statusDetail?: string;
  paymentTypeId?: string;
  paymentMethodId?: string;
  payerEmail?: string;
  transactionAmount?: number;
  qrCodeBase64?: string;
  qrCode?: string;
  ticketUrl?: string;
  dateApproved?: string;
}

export type ClientType = 'pessoa_fisica' | 'empresa_cnpj';

export interface SelfieVaultRecord {
  id: string;
  userId?: string;
  userName: string;
  userRole: UserRole | 'empresa_cnpj';
  companyName?: string;
  userDocument?: string; // CPF or CNPJ
  userPhone?: string;
  selfieUrl: string;
  source: 'cadastro_cliente_pf' | 'cadastro_empresa_cnpj' | 'cadastro_tecnico' | 'login_biometrico' | 'solicitacao_servico' | 'auditoria_seguranca' | 'perfil_usuario';
  capturedAt: string;
  biometricHash?: string;
  livenessConfidence?: number;
  deviceInfo?: string;
  accessRestriction: 'solicitante_e_administrador_apenas';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  clientType?: ClientType;
  // Specific Corporate (PJ / CNPJ) fields
  companyName?: string; // Razão Social
  tradeName?: string; // Nome Fantasia
  cnpj?: string; // CNPJ formatado
  stateRegistration?: string; // Inscrição Estadual
  municipalRegistration?: string; // Inscrição Municipal
  companySegment?: string; // Segmento / Ramo de Atuação (ex: Condomínio, Indústria, Comércio)
  legalRepresentativeName?: string; // Nome do Responsável Legal / Gestor
  legalRepresentativeCpf?: string; // CPF do Responsável Legal
  legalRepresentativeRole?: string; // Cargo do Responsável (ex: Síndico, Gerente Predial, Diretor)
  companyPhone?: string;
  companyEmail?: string;
  contractSocialOrCnpjDocUrl?: string; // Cartão CNPJ ou Contrato Social
  securityAccessLevel?: 'private_solicitante_e_admin' | 'public_restricted';
  // Authentication & Security
  password?: string; // Senha cadastrada
  passwordResetCode?: string; // Código de recuperação enviado via WhatsApp
  passwordResetExpiresAt?: string; // Expiração do código
  rememberMe?: boolean;
  lastLoginAt?: string;
  document?: string;
  documentType?: 'crea' | 'crt' | 'cpf' | 'rg' | 'cnpj';
  crea?: string;
  crt?: string;
  cpf?: string;
  rg?: string;
  rgEmitter?: string;
  address?: string;
  specialty?: string;
  activeOrdersCount?: number;
  rating?: number;
  // Document and Photo Verification
  documentPhotoUrl?: string;
  selfiePhotoUrl?: string;
  isVerified?: boolean;
  verificationStatus?: 'pendente' | 'aprovado' | 'em_analise' | 'bloqueado' | 'suspenso';
  verifiedAt?: string;
  // Biometric Facial Authentication
  facialAuthEnabled?: boolean;
  facialBiometricHash?: string;
  facialEnrollmentDate?: string;
  lastFacialAuthAt?: string;
  // Device Persistence
  savedOnThisDevice?: boolean;
  // Admin Management & Blocking
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
  registrationDate?: string;
  adminNotes?: string;
  totalServicesCompleted?: number;
}

export type ServiceStatus = 
  | 'pendente' 
  | 'em_analise' 
  | 'orcamento_enviado'
  | 'tecnico_agendado' 
  | 'em_andamento' 
  | 'concluido';

export interface InspectionFeeDetails {
  amount: number; // default R$ 50,00
  isPaid: boolean;
  currency?: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  pixTransactionId?: string;
  scheduledDate?: string;
  scheduledPeriod?: string;
}

export interface BudgetProposalItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
}

export interface BudgetProposal {
  id: string;
  laborAmount: number;
  materialsAmount: number;
  totalAmount: number;
  description: string;
  executionDays?: string;
  validUntil?: string;
  sentAt: string;
  status: 'pendente_envio' | 'enviado_cliente' | 'pendente_aprovacao' | 'aprovado' | 'rejeitado';
  approvedAt?: string;
  paymentRequired: boolean;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  pixTransactionId?: string;
  items?: BudgetProposalItem[];
}

export interface ServiceCategoryOption {
  id: string;
  label: string;
  priceEstimate?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  category: 'estrutural' | 'acabamento' | 'instalacoes' | 'manutencao' | 'descarte' | 'emergencial' | 'eletrica' | 'climatizacao';
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  accentGradient: string;
  badge: string;
  estimatedTime: string;
  basePrice: string;
  isEmergency24h: boolean;
  commonServices: string[];
  options: ServiceCategoryOption[];
  tags: string[];
}

export interface CardPaymentDetails {
  cardHolder: string;
  cardLast4: string;
  installments: number;
  brand: string;
}

export interface ServiceRequest {
  id: string;
  protocolNumber: string;
  serviceId: string;
  serviceName: string;
  category: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientCpf?: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state?: string;
    cep?: string;
    complement?: string;
  };
  urgency: ServiceUrgency;
  description: string;
  selectedOptions: string[];
  photos: string[];
  completionPhotos?: string[];
  completionNote?: string;
  completedAt?: string;
  preferredDate: string;
  preferredPeriod: 'manha' | 'tarde' | 'noite' | 'imediato';
  requiresInvoice?: boolean;
  invoiceCnpjOrCpf?: string;
  invoiceCompanyName?: string;
  createdAt: string;
  status: ServiceStatus;
  estimatedPrice?: string;
  requestType?: 'vistoria_presencial' | 'orcamento_remoto' | 'execucao_direta';
  inspectionFee?: InspectionFeeDetails;
  budgetProposal?: BudgetProposal;
  paymentTypeRequested?: 'taxa_deslocamento' | 'orcamento_servico' | 'pagamento_geral';
  // Payment info
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentAmount?: string;
  pixTransactionId?: string;
  cardDetails?: CardPaymentDetails;
  boletoDetails?: BoletoPaymentDetails;
  faturamentoPjDetails?: FaturamentoPjDetails;
  localPaymentDetails?: LocalPaymentDetails;
  transferDetails?: BankTransferDetails;
  mercadoPagoDetails?: MercadoPagoPaymentDetails;
  paidAt?: string;
  securityCode?: string; // 4-digit security code between client & tech for safety
  gpsTracking?: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    lastUpdated: string;
    isTrackingActive: boolean;
    destinationLat: number;
    destinationLng: number;
    etaMinutes: number;
    distanceKm: number;
    statusDescription: string;
    vehicleType?: 'moto' | 'carro' | 'van';
    routePolyline?: { lat: number; lng: number }[];
  };
  assignedTechnician?: {
    name: string;
    role: string;
    phone: string;
    avatar: string;
    rating: number;
    eta?: string;
    creaOrCrt?: string;
  };
  timeline: {
    status: ServiceStatus;
    title: string;
    timestamp: string;
    description: string;
  }[];
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'agent' | 'system' | 'bot';
  text: string;
  timestamp: string;
  agentName?: string;
  agentRole?: string;
  agentAvatar?: string;
  suggestedServiceId?: string;
  attachmentUrl?: string;
  quickActions?: {
    label: string;
    actionPayload: string;
  }[];
}

export type InteractionDocType = 
  | 'orcamento' 
  | 'comprovante_pagamento' 
  | 'laudo_vistoria' 
  | 'recibo_fiscal' 
  | 'termo_garantia'
  | 'outro';

export type InteractionDocStatus = 
  | 'enviado' 
  | 'em_analise_admin' 
  | 'aprovado_admin' 
  | 'rejeitado_admin' 
  | 'retificado_admin';

export interface InteractionDocument {
  id: string;
  requestId?: string;
  protocolNumber?: string;
  type: InteractionDocType;
  title: string;
  description?: string;
  senderRole: 'admin' | 'cliente';
  senderName: string;
  senderPhone?: string;
  createdAt: string;
  updatedAt?: string;
  amount?: number; // Valor do Orçamento ou Valor Pago no Comprovante
  laborAmount?: number;
  materialsAmount?: number;
  validityDays?: number;
  officialNumber?: string;
  expirationDate?: string;
  paymentMethodUsed?: PaymentMethod;
  txId?: string; // Transação PIX / Cartão
  fileUrl?: string; // Foto do comprovante / Anexo PDF
  fileName?: string;
  status: InteractionDocStatus;
  adminNotes?: string;
  adminFeedback?: string;
  isLockedForClient: boolean; // Confirma que apenas o admin pode editar após envio
  items?: {
    description: string;
    quantity?: number;
    unitPrice?: number;
    total: number;
  }[];
}

export interface DirectInteractionMessage {
  id: string;
  threadId: string;
  requestId?: string;
  senderRole: 'admin' | 'cliente';
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  attachmentDocId?: string;
  document?: InteractionDocument;
}

export interface AdminClientInteractionThread {
  id: string;
  requestId: string;
  protocolNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceName: string;
  createdAt: string;
  lastActivityAt: string;
  documents: InteractionDocument[];
  messages: DirectInteractionMessage[];
  adminModerationNote?: string;
}

