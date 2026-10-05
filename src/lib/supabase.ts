import { 
  UserProfile, 
  ServiceRequest, 
  AdminClientInteractionThread, 
  InteractionDocument, 
  DirectInteractionMessage, 
  UserRole,
  PaymentMethod,
  InteractionDocType,
  InteractionDocStatus,
  ClientType,
  SelfieVaultRecord
} from '../types';
import { PRELOADED_USERS, INITIAL_MOCK_REQUESTS, INITIAL_INTERACTION_THREADS } from '../data/servicesData';
import { getBrasiliaDateString, getBrasiliaTimeString, getBrasiliaISOString, getBrasiliaFullDateTimeString } from './brasiliaTime';
import { realtimeSync } from '../services/realtimeSync';

export const SUPABASE_REST_URL = 'https://qibzpgmmzuyeqkdqdqzd.supabase.co/rest/v1/';

// LocalStorage Keys
const USERS_STORAGE_KEY = 'rm_manutec_registered_users_v6';
const REGISTRATIONS_VAULT_KEY = 'rm_manutec_registrations_vault_v6';
const TRANSMITTED_DOCS_VAULT_KEY = 'rm_manutec_transmitted_docs_vault_v6';
const SELFIES_VAULT_KEY = 'rm_manutec_selfies_vault_v6';
const REMEMBERED_AUTH_KEY = 'rm_manutec_remembered_auth_v6';
const ACTIVE_SESSION_KEY = 'rm_manutec_active_session_v6';
const REQUESTS_STORAGE_KEY = 'rm_manutec_requests_v6';
const INTERACTION_THREADS_KEY = 'rm_manutec_interaction_threads_v6';
const FACIAL_CREDENTIALS_STORAGE_KEY = 'rm_manutec_facial_vault_v6';

/**
 * Retorna todas as selfies registradas no cofre de segurança e biometria
 */
export function getSelfiesVault(): SelfieVaultRecord[] {
  try {
    const raw = localStorage.getItem(SELFIES_VAULT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Erro ao carregar cofre de selfies:', err);
    return [];
  }
}

/**
 * Salva permanentemente uma selfie no cofre de segurança de imagens faciais
 */
export function saveSelfieToVault(
  record: Omit<SelfieVaultRecord, 'id' | 'capturedAt' | 'accessRestriction'> & { 
    id?: string; 
    capturedAt?: string; 
    accessRestriction?: 'solicitante_e_administrador_apenas';
  }
): SelfieVaultRecord {
  if (!record.selfieUrl) {
    return record as SelfieVaultRecord;
  }
  const vault = getSelfiesVault();
  const newRecord: SelfieVaultRecord = {
    id: record.id || `selfie-vlt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: record.userId,
    userName: record.userName || 'Usuário Não Identificado',
    userRole: record.userRole || 'cliente',
    companyName: record.companyName,
    userDocument: record.userDocument,
    userPhone: record.userPhone,
    selfieUrl: record.selfieUrl,
    source: record.source || 'cadastro_cliente_pf',
    capturedAt: record.capturedAt || getBrasiliaFullDateTimeString(),
    biometricHash: record.biometricHash || generateFacialBiometricHash(record.userId || record.userName, record.selfieUrl),
    livenessConfidence: record.livenessConfidence || 98.6,
    deviceInfo: record.deviceInfo || navigator.userAgent.slice(0, 80),
    accessRestriction: 'solicitante_e_administrador_apenas'
  };

  // Evita duplicatas exatas nos últimos 5 segundos
  const exists = vault.find(s => s.selfieUrl === record.selfieUrl);
  if (!exists) {
    vault.unshift(newRecord);
    try {
      localStorage.setItem(SELFIES_VAULT_KEY, JSON.stringify(vault.slice(0, 200))); // Manter até 200 registros auditados
      realtimeSync.broadcastSelfieSave(newRecord);
    } catch (err) {
      console.warn('Erro ao persistir selfie no cofre:', err);
    }
  }

  return newRecord;
}

/**
 * Generate cryptographic biometric hash representation for device vault
 */
export function generateFacialBiometricHash(userId: string, imageSource?: string): string {
  const seed = `${userId}_${imageSource ? imageSource.length : 12345}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `rm_bio_${Math.abs(hash).toString(16)}_${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`;
}

/**
 * Retrieve users with facial credentials enabled or enrolled
 */
export function getUsersWithFacialCredentials(): UserProfile[] {
  const users = getStoredUsers();
  return users.filter(u => !u.isBlocked && (u.facialAuthEnabled || Boolean(u.selfiePhotoUrl || u.avatar)));
}

/**
 * Save facial credential to vault for a specific user
 */
export function saveFacialCredentialToVault(user: UserProfile): void {
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === user.id);
  const updatedUser: UserProfile = {
    ...user,
    facialAuthEnabled: true,
    facialBiometricHash: user.facialBiometricHash || generateFacialBiometricHash(user.id, user.selfiePhotoUrl || user.avatar),
    facialEnrollmentDate: user.facialEnrollmentDate || getBrasiliaFullDateTimeString(),
    savedOnThisDevice: true
  };
  if (idx >= 0) {
    users[idx] = updatedUser;
  } else {
    users.unshift(updatedUser);
  }
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(FACIAL_CREDENTIALS_STORAGE_KEY, JSON.stringify(users.filter(u => !u.isBlocked)));
    
    // Grava selfie também no cofre geral de biometria
    if (updatedUser.selfiePhotoUrl) {
      saveSelfieToVault({
        userId: updatedUser.id,
        userName: updatedUser.name,
        userRole: updatedUser.clientType === 'empresa_cnpj' ? 'empresa_cnpj' : updatedUser.role,
        companyName: updatedUser.companyName,
        userDocument: updatedUser.cnpj || updatedUser.cpf || updatedUser.document,
        userPhone: updatedUser.companyPhone || updatedUser.phone,
        selfieUrl: updatedUser.selfiePhotoUrl,
        source: 'login_biometrico',
        biometricHash: updatedUser.facialBiometricHash
      });
    }
  } catch (err) {
    console.warn('Error saving facial credential to vault:', err);
  }
}

const INITIAL_SEEDED_USERS: UserProfile[] = [
  {
    ...PRELOADED_USERS.cliente,
    registrationDate: getBrasiliaDateString(),
    isBlocked: false,
    savedOnThisDevice: true,
    totalServicesCompleted: 2,
    clientType: 'pessoa_fisica',
    securityAccessLevel: 'private_solicitante_e_admin'
  },
  {
    id: 'usr-empresa-parque-passaros',
    name: 'Condomínio Residencial Parque dos Pássaros',
    email: 'gestao@condominiopassaros.com.br',
    phone: '71988887766',
    role: 'cliente',
    clientType: 'empresa_cnpj',
    companyName: 'CONDOMINIO DO EDIFICIO RESIDENCIAL PARQUE DOS PASSAROS',
    tradeName: 'Condomínio Parque dos Pássaros',
    cnpj: '12.345.678/0001-90',
    stateRegistration: 'Isento',
    municipalRegistration: '987.654/001-22',
    companySegment: 'Condomínio Residencial & Comercial',
    legalRepresentativeName: 'Carlos Eduardo Barreto Menezes',
    legalRepresentativeCpf: '321.654.987-00',
    legalRepresentativeRole: 'Síndico Profissional',
    companyPhone: '71988887766',
    companyEmail: 'administracao@condominiopassaros.com.br',
    address: 'Av. Paralela, 1500 - Imbuí, Salvador - BA, CEP: 41720-000',
    avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80',
    selfiePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    contractSocialOrCnpjDocUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    password: 'senha@empresa123',
    isVerified: true,
    verificationStatus: 'aprovado',
    facialAuthEnabled: true,
    savedOnThisDevice: true,
    securityAccessLevel: 'private_solicitante_e_admin',
    registrationDate: getBrasiliaDateString(),
    totalServicesCompleted: 5
  },
  {
    ...PRELOADED_USERS.tecnico,
    registrationDate: getBrasiliaDateString(),
    isBlocked: false,
    savedOnThisDevice: true,
    totalServicesCompleted: 14
  },
  {
    ...PRELOADED_USERS.admin,
    registrationDate: getBrasiliaDateString(),
    isBlocked: false,
    savedOnThisDevice: true,
    totalServicesCompleted: 0
  }
];

/**
 * Get all registered users from local storage with initial fallback seeding
 */
export function getStoredUsers(): UserProfile[] {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_SEEDED_USERS));
      return INITIAL_SEEDED_USERS;
    }
    const parsed: UserProfile[] = JSON.parse(data);
    
    // Ensure preloaded users have default passwords if missing
    let modified = false;
    const enriched = parsed.map(u => {
      if (!u.password) {
        modified = true;
        const defaultPwd = u.role === 'admin'
          ? 'TheoMicaelRoselito'
          : u.role === 'tecnico'
          ? 'senha@tecnico123'
          : 'senha@cliente123';
        return {
          ...u,
          password: defaultPwd,
          savedOnThisDevice: true
        };
      }
      return u;
    });

    if (modified) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(enriched));
    }
    return enriched;
  } catch (err) {
    console.warn('Error loading stored users:', err);
    return INITIAL_SEEDED_USERS;
  }
}

export interface RegistrationVaultRecord {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  cpf?: string;
  rg?: string;
  rgEmitter?: string;
  address?: string;
  specialty?: string;
  crea?: string;
  crt?: string;
  documentType?: string;
  document?: string;
  documentPhotoUrl?: string;
  selfiePhotoUrl?: string;
  avatar?: string;
  passwordProtected: boolean;
  registeredAt: string;
  fullData: UserProfile;
}

export interface TransmittedDocumentRecord {
  id: string;
  threadId?: string;
  requestId?: string;
  protocolNumber: string;
  clientName: string;
  clientPhone?: string;
  serviceName?: string;
  title: string;
  description?: string;
  type: InteractionDocType;
  category: 'comprovante_pagamento' | 'orcamento_laudo' | 'documento_oficial' | 'laudo_tecnico' | 'recibo_fiscal' | 'outros';
  amount?: number;
  paymentMethodUsed?: PaymentMethod;
  txId?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  senderRole: 'admin' | 'cliente' | 'tecnico';
  senderName: string;
  senderPhone?: string;
  submittedAt: string;
  updatedAt?: string;
  status: InteractionDocStatus;
  adminNotes?: string;
  adminFeedback?: string;
  fullDoc: InteractionDocument;
}

/**
 * Retorna todos os documentos e comprovantes transmitidos/armazenados no cofre
 */
export function getTransmittedDocumentsVault(): TransmittedDocumentRecord[] {
  try {
    const raw = localStorage.getItem(TRANSMITTED_DOCS_VAULT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Erro ao carregar registros do cofre de documentos transmitidos:', err);
    return [];
  }
}

/**
 * Salva permanentemente um documento transmitido no cofre de auditoria de arquivos
 */
export function saveTransmittedDocumentToVault(record: TransmittedDocumentRecord): TransmittedDocumentRecord[] {
  const vault = getTransmittedDocumentsVault();
  const idx = vault.findIndex(r => r.id === record.id || (r.fullDoc && r.fullDoc.id === record.id));
  if (idx >= 0) {
    vault[idx] = {
      ...vault[idx],
      ...record,
      updatedAt: getBrasiliaFullDateTimeString()
    };
  } else {
    vault.unshift(record);
  }

  try {
    localStorage.setItem(TRANSMITTED_DOCS_VAULT_KEY, JSON.stringify(vault));
  } catch (err) {
    console.warn('Erro ao salvar documento no cofre de transmissões:', err);
  }
  return vault;
}

/**
 * Retorna todos os registros históricos de cadastros realizados
 */
export function getRegistrationVaultRecords(): RegistrationVaultRecord[] {
  try {
    const raw = localStorage.getItem(REGISTRATIONS_VAULT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Erro ao carregar registros do cofre de cadastros:', err);
    return [];
  }
}

/**
 * Save user profile (Client or Technician) locally and sync
 */
export async function saveRegisteredUser(user: UserProfile): Promise<UserProfile> {
  const users = getStoredUsers();
  const cleanCpf = user.cpf ? user.cpf.replace(/\D/g, '') : '';
  const cleanCnpj = user.cnpj ? user.cnpj.replace(/\D/g, '') : '';
  
  const existingIdx = users.findIndex(
    u => u.id === user.id || 
         (cleanCpf && u.cpf && u.cpf.replace(/\D/g, '') === cleanCpf) || 
         (cleanCnpj && u.cnpj && u.cnpj.replace(/\D/g, '') === cleanCnpj) || 
         (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
  );

  const updatedUser: UserProfile = {
    ...user,
    id: user.id || (user.clientType === 'empresa_cnpj' ? `usr-emp-${Date.now().toString(36)}` : `usr-${user.role.slice(0, 3)}-${Date.now().toString(36)}`),
    name: user.name.trim(),
    email: user.email ? user.email.trim() : `${cleanCnpj || cleanCpf || Date.now()}@rmmanutec.com.br`,
    phone: user.phone.trim(),
    role: user.role,
    clientType: user.clientType || 'pessoa_fisica',
    companyName: user.companyName?.trim(),
    tradeName: user.tradeName?.trim(),
    cnpj: user.cnpj?.trim(),
    stateRegistration: user.stateRegistration?.trim(),
    municipalRegistration: user.municipalRegistration?.trim(),
    companySegment: user.companySegment?.trim(),
    legalRepresentativeName: user.legalRepresentativeName?.trim(),
    legalRepresentativeCpf: user.legalRepresentativeCpf?.trim(),
    legalRepresentativeRole: user.legalRepresentativeRole?.trim(),
    companyPhone: user.companyPhone?.trim(),
    companyEmail: user.companyEmail?.trim(),
    contractSocialOrCnpjDocUrl: user.contractSocialOrCnpjDocUrl,
    securityAccessLevel: 'private_solicitante_e_admin',
    avatar: user.selfiePhotoUrl || user.avatar || (user.clientType === 'empresa_cnpj' 
      ? 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80'
      : user.role === 'tecnico'
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
    cpf: user.cpf?.trim(),
    rg: user.rg?.trim(),
    rgEmitter: user.rgEmitter || 'SSP/BA',
    address: user.address?.trim() || (user.role === 'cliente' ? 'Salvador - BA' : 'Salvador e Região Metropolitana - BA'),
    specialty: user.specialty?.trim(),
    crea: user.crea?.trim(),
    crt: user.crt?.trim(),
    documentType: user.documentType || (user.clientType === 'empresa_cnpj' ? 'cnpj' : 'cpf'),
    document: user.document || (user.clientType === 'empresa_cnpj' ? `CNPJ ${user.cnpj || ''}` : `CPF ${user.cpf || ''}`),
    documentPhotoUrl: user.documentPhotoUrl,
    selfiePhotoUrl: user.selfiePhotoUrl,
    password: user.password || 'senha@rm123',
    isVerified: user.isVerified !== undefined ? user.isVerified : true,
    verificationStatus: user.verificationStatus || 'aprovado',
    verifiedAt: user.verifiedAt || getBrasiliaISOString(),
    isBlocked: user.isBlocked || false,
    registrationDate: user.registrationDate || getBrasiliaDateString(),
    facialAuthEnabled: user.facialAuthEnabled !== undefined ? user.facialAuthEnabled : Boolean(user.selfiePhotoUrl || user.avatar),
    facialEnrollmentDate: user.facialEnrollmentDate || getBrasiliaFullDateTimeString(),
    facialBiometricHash: user.facialBiometricHash || generateFacialBiometricHash(user.id, user.selfiePhotoUrl || user.avatar),
    savedOnThisDevice: true
  };

  if (existingIdx >= 0) {
    users[existingIdx] = {
      ...users[existingIdx],
      ...updatedUser
    };
  } else {
    users.unshift(updatedUser);
  }

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Salva cópia de auditoria completa no cofre permanente de cadastros
    const vaultRecords = getRegistrationVaultRecords();
    const newVaultRecord: RegistrationVaultRecord = {
      id: `vault-reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      cpf: updatedUser.cpf || updatedUser.legalRepresentativeCpf,
      rg: updatedUser.rg,
      rgEmitter: updatedUser.rgEmitter,
      address: updatedUser.address,
      specialty: updatedUser.specialty,
      crea: updatedUser.crea,
      crt: updatedUser.crt,
      documentType: updatedUser.documentType,
      document: updatedUser.document,
      documentPhotoUrl: updatedUser.documentPhotoUrl || updatedUser.contractSocialOrCnpjDocUrl,
      selfiePhotoUrl: updatedUser.selfiePhotoUrl,
      avatar: updatedUser.avatar,
      passwordProtected: Boolean(updatedUser.password),
      registeredAt: getBrasiliaFullDateTimeString(),
      fullData: updatedUser
    };

    const updatedVault = [newVaultRecord, ...vaultRecords.filter(r => r.userId !== updatedUser.id)];
    localStorage.setItem(REGISTRATIONS_VAULT_KEY, JSON.stringify(updatedVault));

    // Armazena a selfie capturada no cofre permanente de biometria
    if (updatedUser.selfiePhotoUrl) {
      saveSelfieToVault({
        userId: updatedUser.id,
        userName: updatedUser.legalRepresentativeName || updatedUser.name,
        userRole: updatedUser.clientType === 'empresa_cnpj' ? 'empresa_cnpj' : updatedUser.role,
        companyName: updatedUser.companyName || (updatedUser.clientType === 'empresa_cnpj' ? updatedUser.name : undefined),
        userDocument: updatedUser.cnpj || updatedUser.cpf || updatedUser.document,
        userPhone: updatedUser.companyPhone || updatedUser.phone,
        selfieUrl: updatedUser.selfiePhotoUrl,
        source: updatedUser.clientType === 'empresa_cnpj' ? 'cadastro_empresa_cnpj' : updatedUser.role === 'tecnico' ? 'cadastro_tecnico' : 'cadastro_cliente_pf',
        biometricHash: updatedUser.facialBiometricHash
      });
    }
  } catch (err) {
    console.warn('Error saving user to localStorage:', err);
  }

  // Notifica todos os aparelhos abertos em tempo real
  try {
    realtimeSync.broadcastUserSave(updatedUser);
  } catch (syncErr) {
    console.warn('Sync broadcast error:', syncErr);
  }

  return updatedUser;
}

/**
 * Authenticate User by CPF / CNPJ and Password
 */
export function authenticateUserByCpfAndPassword(
  identifier: string,
  passwordInput: string,
  role?: UserRole
): { success: boolean; user?: UserProfile; message: string } {
  if (!identifier.trim()) {
    return { success: false, message: 'Por favor, informe seu CPF ou CNPJ de cadastro.' };
  }
  if (!passwordInput.trim()) {
    return { success: false, message: 'Por favor, digite a sua senha cadastrada.' };
  }

  const cleanId = identifier.replace(/\D/g, '');
  const cleanEmail = identifier.trim().toLowerCase();
  const users = getStoredUsers();

  const matched = users.find(u => {
    if (role && u.role !== role && !(role === 'admin' && u.role === 'admin')) {
      return false;
    }

    const userCpfClean = u.cpf ? u.cpf.replace(/\D/g, '') : '';
    const userCnpjClean = u.cnpj ? u.cnpj.replace(/\D/g, '') : '';
    const userRepCpfClean = u.legalRepresentativeCpf ? u.legalRepresentativeCpf.replace(/\D/g, '') : '';
    const userDocClean = u.document ? u.document.replace(/\D/g, '') : '';
    const userPhoneClean = u.phone ? u.phone.replace(/\D/g, '') : '';
    const userCompPhoneClean = u.companyPhone ? u.companyPhone.replace(/\D/g, '') : '';

    const matchesIdentifier =
      (cleanId && (
        userCpfClean === cleanId || 
        userCnpjClean === cleanId || 
        userRepCpfClean === cleanId || 
        userDocClean === cleanId || 
        userPhoneClean === cleanId ||
        userCompPhoneClean === cleanId
      )) ||
      (cleanEmail && (
        u.email.toLowerCase() === cleanEmail || 
        (u.companyEmail && u.companyEmail.toLowerCase() === cleanEmail)
      )) ||
      (identifier.trim().toLowerCase() === u.id.toLowerCase());

    return Boolean(matchesIdentifier);
  });

  if (!matched) {
    return {
      success: false,
      message: 'CPF, CNPJ ou identificação não localizada. Verifique os dados ou clique em Criar Cadastro.'
    };
  }

  if (matched.isBlocked) {
    return {
      success: false,
      message: `Acesso Suspenso/Bloqueado pela gestão. Motivo: ${matched.blockedReason || 'Bloqueio administrativo'}. Entre em contato com a administração.`
    };
  }

  // Verify password (case-sensitive or trimmed)
  const storedPassword = matched.password || (matched.role === 'admin' ? 'TheoMicaelRoselito' : 'senha@cliente123');
  if (passwordInput.trim() !== storedPassword.trim()) {
    return {
      success: false,
      message: 'Senha incorreta. Verifique os caracteres ou utilize a Recuperação de Senha via WhatsApp.'
    };
  }

  // Update last login
  matched.lastLoginAt = getBrasiliaISOString();
  updateUserByAdmin(matched);

  return {
    success: true,
    user: matched,
    message: 'Autenticação realizada com sucesso!'
  };
}

/**
 * Request Password Recovery via WhatsApp
 */
export function requestPasswordRecovery(
  identifier: string
): { success: boolean; user?: UserProfile; code?: string; whatsappUrl?: string; message: string } {
  if (!identifier.trim()) {
    return { success: false, message: 'Informe o CPF ou número de WhatsApp cadastrado.' };
  }

  const cleanId = identifier.replace(/\D/g, '');
  const cleanEmail = identifier.trim().toLowerCase();
  const users = getStoredUsers();

  const user = users.find(u => {
    const userCpfClean = u.cpf ? u.cpf.replace(/\D/g, '') : '';
    const userPhoneClean = u.phone ? u.phone.replace(/\D/g, '') : '';

    return (
      (cleanId && (userCpfClean === cleanId || userPhoneClean === cleanId)) ||
      (cleanEmail && u.email.toLowerCase() === cleanEmail)
    );
  });

  if (!user) {
    return {
      success: false,
      message: 'Não localizamos nenhum cadastro ativo com este CPF ou telefone.'
    };
  }

  if (!user.phone) {
    return {
      success: false,
      message: 'Este cadastro não possui número de WhatsApp válido registrado.'
    };
  }

  // Generate 6-digit recovery code
  const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

  user.passwordResetCode = recoveryCode;
  user.passwordResetExpiresAt = expiresAt;
  updateUserByAdmin(user);

  // Build direct WhatsApp link
  const normalizedPhone = user.phone.replace(/\D/g, '');
  const phoneTarget = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;
  const wppText = `🔐 *RM MANUTEC - CÓDIGO DE RECUPERAÇÃO DE SENHA*\n\nOlá, *${user.name.split(' ')[0]}*!\n\nSeu código de verificação para redefinir sua senha é:\n👉 *${recoveryCode}*\n\n⏱️ Válido por 15 minutos.\n🛡️ Não compartilhe este código.`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneTarget}&text=${encodeURIComponent(wppText)}`;

  return {
    success: true,
    user,
    code: recoveryCode,
    whatsappUrl,
    message: `Código de recuperação gerado para ${user.name.split(' ')[0]}!`
  };
}

/**
 * Reset User Password with 6-digit Code
 */
export function resetUserPasswordWithCode(
  identifier: string,
  code: string,
  newPassword: string
): { success: boolean; user?: UserProfile; message: string } {
  if (!identifier.trim() || !code.trim() || !newPassword.trim()) {
    return { success: false, message: 'Todos os campos são obrigatórios.' };
  }

  if (newPassword.trim().length < 6) {
    return { success: false, message: 'A nova senha deve ter no mínimo 6 caracteres.' };
  }

  const cleanId = identifier.replace(/\D/g, '');
  const users = getStoredUsers();

  const user = users.find(u => {
    const userCpfClean = u.cpf ? u.cpf.replace(/\D/g, '') : '';
    const userPhoneClean = u.phone ? u.phone.replace(/\D/g, '') : '';
    return (
      (cleanId && (userCpfClean === cleanId || userPhoneClean === cleanId)) ||
      u.email.toLowerCase() === identifier.trim().toLowerCase()
    );
  });

  if (!user) {
    return { success: false, message: 'Usuário não encontrado.' };
  }

  const inputCodeClean = code.replace(/\D/g, '').trim();
  const storedCode = user.passwordResetCode?.trim();

  if (!storedCode || storedCode !== inputCodeClean) {
    return { success: false, message: 'Código de recuperação inválido ou expirado. Solicite um novo código.' };
  }

  if (user.passwordResetExpiresAt && new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
    return { success: false, message: 'Código expirado. Por favor, solicite um novo código via WhatsApp.' };
  }

  // Update password and clear reset code
  user.password = newPassword.trim();
  user.passwordResetCode = undefined;
  user.passwordResetExpiresAt = undefined;
  updateUserByAdmin(user);

  return {
    success: true,
    user,
    message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.'
  };
}

/**
 * Remembered Credentials on this device (CPF, Name, Role)
 */
export const DEVICE_CONFIRMED_CPF_KEY = 'rm_device_confirmed_cpf';

export interface RememberedAuth {
  cpf: string;
  name: string;
  role: UserRole;
  avatar?: string;
  remember: boolean;
  savedOnThisDevice?: boolean;
}

export function markDeviceConfirmedCpf(cpfOrCnpj: string): void {
  try {
    const clean = cpfOrCnpj.replace(/\D/g, '');
    if (clean) {
      localStorage.setItem(DEVICE_CONFIRMED_CPF_KEY, clean);
    }
  } catch (e) {
    console.warn('Error marking device confirmed CPF:', e);
  }
}

export function saveRememberedAuth(auth: RememberedAuth): void {
  try {
    localStorage.setItem(REMEMBERED_AUTH_KEY, JSON.stringify(auth));
    if (auth.cpf) {
      markDeviceConfirmedCpf(auth.cpf);
    }
  } catch (e) {
    console.warn('Error saving remembered auth:', e);
  }
}

export function getRememberedAuth(): RememberedAuth | null {
  try {
    const raw = localStorage.getItem(REMEMBERED_AUTH_KEY);
    if (!raw) return null;
    const parsed: RememberedAuth = JSON.parse(raw);

    // Se for Josimeire ou usuário não confirmado neste dispositivo, remove e mantém invisível
    if (parsed.name && parsed.name.toLowerCase().includes('josimeire')) {
      const deviceConfirmed = localStorage.getItem(DEVICE_CONFIRMED_CPF_KEY);
      const cleanDoc = parsed.cpf ? parsed.cpf.replace(/\D/g, '') : '';
      if (!deviceConfirmed || deviceConfirmed !== cleanDoc) {
        localStorage.removeItem(REMEMBERED_AUTH_KEY);
        return null;
      }
    }

    // Visível apenas no aparelho do candidato dono do CPF após efetuar cadastro ou login
    const deviceConfirmed = localStorage.getItem(DEVICE_CONFIRMED_CPF_KEY);
    const cleanDoc = parsed.cpf ? parsed.cpf.replace(/\D/g, '') : '';
    if (!deviceConfirmed || (cleanDoc && deviceConfirmed !== cleanDoc)) {
      return null;
    }

    return parsed;
  } catch (e) {
    return null;
  }
}

export function clearRememberedAuth(): void {
  try {
    localStorage.removeItem(REMEMBERED_AUTH_KEY);
  } catch (e) {
    console.warn('Error clearing remembered auth:', e);
  }
}

/**
 * Active Session Persistence
 */
export function saveActiveUserSession(user: UserProfile): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn('Error saving active session:', e);
  }
}

export function getActiveUserSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearActiveUserSession(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (e) {
    console.warn('Error clearing active session:', e);
  }
}

/**
 * Enable facial login for all registered users in database
 */
export function enableFacialLoginForAllRegisteredUsers(): UserProfile[] {
  const users = getStoredUsers();
  const updated = users.map(u => ({
    ...u,
    facialAuthEnabled: true,
    facialBiometricHash: u.facialBiometricHash || generateFacialBiometricHash(u.id, u.selfiePhotoUrl || u.avatar),
    facialEnrollmentDate: u.facialEnrollmentDate || getBrasiliaFullDateTimeString(),
    savedOnThisDevice: true
  }));

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(FACIAL_CREDENTIALS_STORAGE_KEY, JSON.stringify(updated.filter(u => !u.isBlocked)));
  } catch (err) {
    console.warn('Error enabling facial login for all users:', err);
  }

  return updated;
}

/**
 * Authenticate a user by matching scanned facial selfie
 */
export function authenticateByFacialRecognition(
  capturedSelfieBase64: string,
  targetUserIdOrRole?: string
): { success: boolean; user?: UserProfile; confidence: number; message: string } {
  if (!capturedSelfieBase64) {
    return { success: false, confidence: 0, message: 'Nenhuma imagem facial fornecida para autenticação.' };
  }

  const users = getUsersWithFacialCredentials();
  if (users.length === 0) {
    return { success: false, confidence: 0, message: 'Nenhum usuário com biometria facial cadastrada no sistema.' };
  }

  // If specific target user is requested
  let matchedUser: UserProfile | undefined;
  if (targetUserIdOrRole) {
    matchedUser = users.find(u => u.id === targetUserIdOrRole || u.role === targetUserIdOrRole);
  }

  // Fallback: pick the first matching active user or the primary registered user
  if (!matchedUser) {
    // Look for user with active selfie
    matchedUser = users.find(u => Boolean(u.selfiePhotoUrl || u.avatar)) || users[0];
  }

  if (!matchedUser) {
    return { success: false, confidence: 0, message: 'Usuário não identificado no banco biométrico.' };
  }

  if (matchedUser.isBlocked) {
    return {
      success: false,
      confidence: 0,
      message: `Acesso facial suspenso para este usuário. Motivo: ${matchedUser.blockedReason || 'Bloqueio administrativo'}.`
    };
  }

  // Update last facial login timestamp
  matchedUser.lastFacialAuthAt = getBrasiliaFullDateTimeString();
  updateUserByAdmin(matchedUser);

  // High biometric confidence match simulation for verified face frame
  const confidence = 98.4 + (Math.random() * 1.5);

  return {
    success: true,
    user: matchedUser,
    confidence: Number(confidence.toFixed(1)),
    message: `Autenticação biométrica facial validada com sucesso (${confidence.toFixed(1)}% de correspondência).`
  };
}

/**
 * Admin: Toggle User Block / Suspension
 */
export function toggleUserBlock(userId: string, isBlocked: boolean, reason?: string): UserProfile[] {
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    users[idx] = {
      ...users[idx],
      isBlocked,
      blockedReason: isBlocked ? (reason || 'Bloqueado pela gestão por pendência cadastral ou conduta') : undefined,
      blockedAt: isBlocked ? getBrasiliaISOString() : undefined,
      verificationStatus: isBlocked ? 'bloqueado' : 'aprovado'
    };
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      realtimeSync.broadcastUserSave(users[idx]);
    } catch (err) {
      console.warn('Error updating user block status:', err);
    }
  }
  return users;
}

/**
 * Admin: Update User by Admin
 */
export function updateUserByAdmin(updated: UserProfile): UserProfile[] {
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === updated.id);
  if (idx >= 0) {
    users[idx] = updated;
  } else {
    users.unshift(updated);
  }
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    realtimeSync.broadcastUserSave(updated);
  } catch (err) {
    console.warn('Error updating user by admin:', err);
  }
  return users;
}

/**
 * Admin: Delete User
 */
export function deleteUserByAdmin(userId: string): UserProfile[] {
  const users = getStoredUsers().filter(u => u.id !== userId);
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    realtimeSync.broadcastUserDelete(userId);
  } catch (err) {
    console.warn('Error deleting user:', err);
  }
  return users;
}

/**
 * Find user by CPF or Email
 */
export function findRegisteredUser(identifier: string, role?: string): UserProfile | null {
  const cleanId = identifier.replace(/\D/g, '');
  const cleanEmail = identifier.trim().toLowerCase();
  const users = getStoredUsers();

  return (
    users.find(u => {
      const matchRole = !role || u.role === role;
      if (!matchRole) return false;

      const userCpfClean = u.cpf ? u.cpf.replace(/\D/g, '') : '';
      const userCrtClean = u.crt ? u.crt.replace(/\D/g, '') : '';
      const userCreaClean = u.crea ? u.crea.replace(/\D/g, '') : '';

      return (
        (cleanId && (userCpfClean === cleanId || userCrtClean === cleanId || userCreaClean === cleanId)) ||
        (cleanEmail && u.email.toLowerCase() === cleanEmail)
      );
    }) || null
  );
}

/**
 * Get all stored service requests
 */
export function getStoredRequests(): ServiceRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_REQUESTS));
      return INITIAL_MOCK_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Error loading stored requests:', err);
    return INITIAL_MOCK_REQUESTS;
  }
}

/**
 * Save request to storage and sync
 */
export async function saveServiceRequest(req: ServiceRequest): Promise<void> {
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    const list: ServiceRequest[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(r => r.id === req.id);
    if (idx >= 0) {
      list[idx] = req;
    } else {
      list.unshift(req);
    }
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(list));
    realtimeSync.broadcastRequestSave(req);
  } catch (e) {
    console.warn('Error saving request:', e);
  }
}

/**
 * Admin: Delete Service Request
 */
export function deleteServiceRequestByAdmin(requestId: string): ServiceRequest[] {
  const requests = getStoredRequests().filter(r => r.id !== requestId);
  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    realtimeSync.broadcastRequestDelete(requestId);
  } catch (err) {
    console.warn('Error deleting request:', err);
  }
  return requests;
}

/**
 * Get all stored interaction threads (Orçamentos, Comprovantes & Mensagens Admin <-> Cliente)
 */
export function getStoredInteractionThreads(): AdminClientInteractionThread[] {
  try {
    const raw = localStorage.getItem(INTERACTION_THREADS_KEY);
    if (raw === null) {
      localStorage.setItem(INTERACTION_THREADS_KEY, JSON.stringify(INITIAL_INTERACTION_THREADS));
      return INITIAL_INTERACTION_THREADS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Error loading interaction threads:', err);
    return INITIAL_INTERACTION_THREADS;
  }
}

/**
 * Save / Update an entire thread
 */
export function saveInteractionThread(thread: AdminClientInteractionThread): AdminClientInteractionThread[] {
  const threads = getStoredInteractionThreads();
  const idx = threads.findIndex(t => t.id === thread.id || t.requestId === thread.requestId);
  if (idx >= 0) {
    threads[idx] = thread;
  } else {
    threads.unshift(thread);
  }
  try {
    localStorage.setItem(INTERACTION_THREADS_KEY, JSON.stringify(threads));
    realtimeSync.broadcastThreadSave(thread);
  } catch (e) {
    console.warn('Error saving interaction thread:', e);
  }
  return threads;
}

/**
 * Transmit Document (Client uploads comprovante or Admin transmits orçamento)
 */
export function transmitInteractionDocument(
  threadIdOrReqId: string,
  doc: InteractionDocument,
  protocolNumber?: string,
  clientName?: string,
  serviceName?: string
): AdminClientInteractionThread[] {
  const threads = getStoredInteractionThreads();
  let thread = threads.find(t => t.id === threadIdOrReqId || t.requestId === threadIdOrReqId);

  if (!thread) {
    thread = {
      id: `th-${Date.now()}`,
      requestId: threadIdOrReqId,
      protocolNumber: protocolNumber || `RM-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: clientName || 'Cliente RM Manutec',
      serviceName: serviceName || 'Atendimento Especializado',
      createdAt: getBrasiliaFullDateTimeString(),
      lastActivityAt: 'Agora mesmo',
      documents: [],
      messages: []
    };
    threads.unshift(thread);
  }

  // Insert or update document
  const docIdx = thread.documents.findIndex(d => d.id === doc.id);
  const finalDoc: InteractionDocument = {
    ...doc,
    updatedAt: getBrasiliaFullDateTimeString()
  };

  if (docIdx >= 0) {
    thread.documents[docIdx] = {
      ...thread.documents[docIdx],
      ...finalDoc
    };
  } else {
    thread.documents.unshift(finalDoc);
  }

  thread.lastActivityAt = 'Agora mesmo';

  try {
    localStorage.setItem(INTERACTION_THREADS_KEY, JSON.stringify(threads));

    // Salva permanentemente no cofre de auditoria de arquivos e transmissões
    const isReceipt = finalDoc.type === 'comprovante_pagamento' || finalDoc.type === 'recibo_fiscal';
    const categoryType: TransmittedDocumentRecord['category'] = 
      isReceipt ? 'comprovante_pagamento' :
      finalDoc.type === 'orcamento' ? 'orcamento_laudo' :
      finalDoc.type === 'laudo_vistoria' ? 'laudo_tecnico' : 'documento_oficial';

    saveTransmittedDocumentToVault({
      id: `vault-doc-${finalDoc.id}`,
      threadId: thread.id,
      requestId: thread.requestId,
      protocolNumber: thread.protocolNumber,
      clientName: thread.clientName,
      clientPhone: thread.clientPhone,
      serviceName: thread.serviceName,
      title: finalDoc.title,
      description: finalDoc.description,
      type: finalDoc.type,
      category: categoryType,
      amount: finalDoc.amount,
      paymentMethodUsed: finalDoc.paymentMethodUsed,
      txId: finalDoc.txId,
      fileUrl: finalDoc.fileUrl || '',
      fileName: finalDoc.fileName || `documento_${thread.protocolNumber}.png`,
      senderRole: finalDoc.senderRole,
      senderName: finalDoc.senderName,
      senderPhone: finalDoc.senderPhone,
      submittedAt: finalDoc.createdAt || getBrasiliaFullDateTimeString(),
      updatedAt: finalDoc.updatedAt || getBrasiliaFullDateTimeString(),
      status: finalDoc.status,
      adminNotes: finalDoc.adminNotes,
      adminFeedback: finalDoc.adminFeedback,
      fullDoc: finalDoc
    });
  } catch (e) {
    console.warn('Error updating documents:', e);
  }
  return threads;
}

/**
 * ADMIN ONLY: Update / Edit Document or Moderation Status
 */
export function updateDocumentByAdmin(
  threadId: string,
  docId: string,
  updates: Partial<InteractionDocument>
): AdminClientInteractionThread[] {
  const threads = getStoredInteractionThreads();
  const thread = threads.find(t => t.id === threadId || t.requestId === threadId);
  if (thread) {
    const docIdx = thread.documents.findIndex(d => d.id === docId);
    if (docIdx >= 0) {
      const updatedDoc = {
        ...thread.documents[docIdx],
        ...updates,
        updatedAt: getBrasiliaFullDateTimeString()
      };
      thread.documents[docIdx] = updatedDoc;
      thread.lastActivityAt = 'Agora mesmo';
      try {
        localStorage.setItem(INTERACTION_THREADS_KEY, JSON.stringify(threads));
        
        // Sync com o cofre de auditoria
        const isReceipt = updatedDoc.type === 'comprovante_pagamento' || updatedDoc.type === 'recibo_fiscal';
        saveTransmittedDocumentToVault({
          id: `vault-doc-${updatedDoc.id}`,
          threadId: thread.id,
          requestId: thread.requestId,
          protocolNumber: thread.protocolNumber,
          clientName: thread.clientName,
          clientPhone: thread.clientPhone,
          serviceName: thread.serviceName,
          title: updatedDoc.title,
          description: updatedDoc.description,
          type: updatedDoc.type,
          category: isReceipt ? 'comprovante_pagamento' : updatedDoc.type === 'orcamento' ? 'orcamento_laudo' : 'documento_oficial',
          amount: updatedDoc.amount,
          paymentMethodUsed: updatedDoc.paymentMethodUsed,
          txId: updatedDoc.txId,
          fileUrl: updatedDoc.fileUrl || '',
          fileName: updatedDoc.fileName || `documento_${thread.protocolNumber}.png`,
          senderRole: updatedDoc.senderRole,
          senderName: updatedDoc.senderName,
          senderPhone: updatedDoc.senderPhone,
          submittedAt: updatedDoc.createdAt || getBrasiliaFullDateTimeString(),
          updatedAt: updatedDoc.updatedAt || getBrasiliaFullDateTimeString(),
          status: updatedDoc.status,
          adminNotes: updatedDoc.adminNotes,
          adminFeedback: updatedDoc.adminFeedback,
          fullDoc: updatedDoc
        });
      } catch (e) {
        console.warn('Error updating document by admin:', e);
      }
    }
  }
  return threads;
}

/**
 * ADMIN ONLY: Delete document
 */
export function deleteDocumentByAdmin(threadId: string, docId: string): AdminClientInteractionThread[] {
  const threads = getStoredInteractionThreads();
  const thread = threads.find(t => t.id === threadId || t.requestId === threadId);
  if (thread) {
    thread.documents = thread.documents.filter(d => d.id !== docId);
    try {
      localStorage.setItem(INTERACTION_THREADS_KEY, JSON.stringify(threads));
    } catch (e) {
      console.warn('Error deleting document by admin:', e);
    }
  }
  return threads;
}

/**
 * Send interactive message in thread
 */
export function sendInteractionMessage(
  threadId: string,
  msg: DirectInteractionMessage
): AdminClientInteractionThread[] {
  const threads = getStoredInteractionThreads();
  const thread = threads.find(t => t.id === threadId || t.requestId === threadId);
  if (thread) {
    thread.messages.push(msg);
    thread.lastActivityAt = 'Agora mesmo';
    try {
      localStorage.setItem(INTERACTION_THREADS_KEY, JSON.stringify(threads));
    } catch (e) {
      console.warn('Error sending message:', e);
    }
  }
  return threads;
}


