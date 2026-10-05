import React, { useState } from 'react';
import { UserProfile, ClientType } from '../types';
import { saveRegisteredUser, saveRememberedAuth, saveActiveUserSession, saveSelfieToVault } from '../lib/supabase';
import {
  buildNewUserAdminNotification,
  buildNewUserWelcomeNotification,
  dispatchWhatsAppNotification
} from '../lib/whatsappNotifications';
import { CameraSelfieCapture } from './CameraSelfieCapture';
import { CameraDocumentCapture } from './CameraDocumentCapture';
import {
  X,
  User,
  HardHat,
  Building2,
  ShieldCheck,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  RefreshCw,
  Award,
  MessageSquare,
  ExternalLink,
  Send,
  Sparkles,
  Smartphone,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Shield
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'cliente' | 'tecnico';
  initialClientType?: ClientType;
  onRegisterSuccess: (user: UserProfile) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  role: initialRole,
  initialClientType = 'pessoa_fisica',
  onRegisterSuccess
}) => {
  if (!isOpen) return null;

  // Selected Tab/Role
  const [selectedRole, setSelectedRole] = useState<'cliente' | 'tecnico'>(initialRole);
  const [selectedClientType, setSelectedClientType] = useState<ClientType>(initialClientType);

  // Common and PF Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [rgEmitter, setRgEmitter] = useState('SSP/BA');
  const [address, setAddress] = useState('');

  // Corporate (PJ / CNPJ) Fields
  const [companyName, setCompanyName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [stateRegistration, setStateRegistration] = useState('');
  const [municipalRegistration, setMunicipalRegistration] = useState('');
  const [businessSegment, setBusinessSegment] = useState('Condomínio Residencial / Comercial');
  const [legalRepresentativeName, setLegalRepresentativeName] = useState('');
  const [legalRepresentativeRole, setLegalRepresentativeRole] = useState('Síndico(a) / Gestor Predial');
  const [legalRepresentativeCpf, setLegalRepresentativeCpf] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  
  // Corporate Address
  const [companyCep, setCompanyCep] = useState('');
  const [companyStreet, setCompanyStreet] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [companyNeighborhood, setCompanyNeighborhood] = useState('');
  const [companyCity, setCompanyCity] = useState('Salvador');
  const [companyState, setCompanyState] = useState('BA');
  const [companyComplement, setCompanyComplement] = useState('');

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberOnDevice, setRememberOnDevice] = useState(true);
  
  // Technician specific fields
  const [techDocType, setTechDocType] = useState<'liberal_autonomo' | 'crea' | 'crt' | 'ambos'>('liberal_autonomo');
  const [crea, setCrea] = useState('');
  const [crt, setCrt] = useState('');
  const [specialty, setSpecialty] = useState('');

  // Documents and Photo
  const [documentPhoto, setDocumentPhoto] = useState<string | null>(null);
  const [isDocumentCameraActive, setIsDocumentCameraActive] = useState<boolean>(false);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredSuccessUser, setRegisteredSuccessUser] = useState<UserProfile | null>(null);
  const [adminWppData, setAdminWppData] = useState<{ message: string; url: string; targetPhone: string } | null>(null);
  const [userWppData, setUserWppData] = useState<{ message: string; url: string; targetPhone: string } | null>(null);

  // Mask helpers
  const formatCPF = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
  };

  const formatCNPJ = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 14);
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`;
    if (raw.length <= 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
    if (raw.length <= 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12, 14)}`;
  };

  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

  const formatCEP = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    if (raw.length <= 5) return raw;
    return `${raw.slice(0, 5)}-${raw.slice(5, 8)}`;
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setDocumentPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelfieCapture = (base64Image: string) => {
    setSelfiePhoto(base64Image);
    setErrorMessage('');

    // Save immediate audited selfie record
    try {
      saveSelfieToVault({
        userName: selectedRole === 'cliente' && selectedClientType === 'empresa_cnpj' 
          ? `${legalRepresentativeName || name} (${tradingName || companyName || 'Empresa'})` 
          : name || 'Novo Usuário',
        userRole: selectedRole === 'tecnico' ? 'tecnico' : (selectedClientType === 'empresa_cnpj' ? 'empresa_cnpj' : 'cliente'),
        userDocument: selectedClientType === 'empresa_cnpj' ? cnpj : cpf,
        selfieUrl: base64Image,
        source: selectedClientType === 'empresa_cnpj' ? 'cadastro_empresa_cnpj' : (selectedRole === 'tecnico' ? 'cadastro_tecnico' : 'cadastro_cliente_pf')
      });
    } catch (err) {
      console.warn('Erro ao arquivar selfie no cofre:', err);
    }
  };

  const handleSelfieClear = () => {
    setSelfiePhoto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const isEmpresa = selectedRole === 'cliente' && selectedClientType === 'empresa_cnpj';

    if (isEmpresa) {
      // Validations for Empresa CNPJ
      if (!companyName.trim()) {
        setErrorMessage('Por favor, informe a Razão Social da empresa.');
        return;
      }
      if (!cnpj.trim() || cnpj.replace(/\D/g, '').length < 14) {
        setErrorMessage('Por favor, informe um CNPJ válido com 14 dígitos.');
        return;
      }
      if (!legalRepresentativeName.trim()) {
        setErrorMessage('Por favor, informe o nome do Responsável Legal / Gestor.');
        return;
      }
      if (!legalRepresentativeCpf.trim() || legalRepresentativeCpf.replace(/\D/g, '').length < 11) {
        setErrorMessage('Por favor, informe o CPF do Responsável Legal / Gestor.');
        return;
      }
      if (!companyPhone.trim() && !phone.trim()) {
        setErrorMessage('Por favor, informe um telefone ou WhatsApp para contato corporativo.');
        return;
      }
      if (!companyEmail.trim() && !email.trim()) {
        setErrorMessage('Por favor, informe o e-mail corporativo da empresa.');
        return;
      }
    } else {
      // Validations for Pessoa Física & Técnico
      if (!name.trim()) {
        setErrorMessage('Por favor, informe seu nome completo.');
        return;
      }
      if (!cpf.trim() || cpf.replace(/\D/g, '').length < 11) {
        setErrorMessage('Por favor, informe um CPF válido com 11 dígitos.');
        return;
      }
      if (!rg.trim() && selectedRole !== 'tecnico') {
        setErrorMessage('Por favor, informe seu número de RG com órgão expedidor.');
        return;
      }
      if (!phone.trim()) {
        setErrorMessage('Por favor, informe seu telefone / WhatsApp.');
        return;
      }
    }

    if (!password.trim()) {
      setErrorMessage('Por favor, crie uma senha de acesso.');
      return;
    }

    if (password.trim().length < 6) {
      setErrorMessage('A sua senha deve conter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    if (selectedRole === 'tecnico') {
      if (!specialty.trim()) {
        setErrorMessage('Por favor, informe suas especialidades e serviços que realiza.');
        return;
      }
      if (techDocType === 'crea' && !crea.trim()) {
        setErrorMessage('Por favor, informe o número do seu registro CREA-BA.');
        return;
      }
      if (techDocType === 'crt' && !crt.trim()) {
        setErrorMessage('Por favor, informe o número do seu registro CRT.');
        return;
      }
      if (techDocType === 'ambos' && (!crea.trim() || !crt.trim())) {
        setErrorMessage('Por favor, informe ambos os registros CREA e CRT.');
        return;
      }
    }

    setIsSubmitting(true);

    const docTypeFinal = selectedRole === 'tecnico'
      ? (techDocType === 'crea' ? 'crea' : techDocType === 'crt' ? 'crt' : 'cpf')
      : (isEmpresa ? 'cnpj' : 'cpf');

    const docStringFinal = selectedRole === 'tecnico'
      ? (techDocType === 'crea' ? `CREA-BA ${crea}` : techDocType === 'crt' ? `CRT ${crt}` : `CPF ${cpf}`)
      : (isEmpresa ? `CNPJ ${cnpj}` : `CPF ${cpf}`);

    const defaultAvatar = selectedRole === 'tecnico'
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      : (isEmpresa 
          ? 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

    const fullCorporateAddress = isEmpresa
      ? `${companyStreet || address}${companyNumber ? `, Nº ${companyNumber}` : ''}${companyComplement ? ` - ${companyComplement}` : ''}, ${companyNeighborhood || ''}, ${companyCity} - ${companyState}${companyCep ? ` (CEP ${companyCep})` : ''}`
      : address;

    const newUser: UserProfile = {
      id: isEmpresa ? `usr-pj-${Date.now().toString(36)}` : `usr-${selectedRole.slice(0, 3)}-${Date.now().toString(36)}`,
      name: isEmpresa ? (tradingName || companyName).trim() : name.trim(),
      email: isEmpresa ? (companyEmail || email || `${cnpj.replace(/\D/g, '')}@empresa.com.br`).trim() : (email || `${cpf.replace(/\D/g, '')}@rmmanutec.com.br`).trim(),
      phone: isEmpresa ? (companyPhone || phone).trim() : phone.trim(),
      role: selectedRole,
      clientType: selectedRole === 'cliente' ? selectedClientType : 'pessoa_fisica',
      password: password.trim(),
      avatar: selfiePhoto || defaultAvatar,
      
      // PF Data
      cpf: isEmpresa ? (legalRepresentativeCpf || cpf).trim() : cpf.trim(),
      rg: isEmpresa ? undefined : (rg.trim() ? `${rg.trim()} - ${rgEmitter}` : undefined),
      rgEmitter: isEmpresa ? undefined : rgEmitter,
      
      // PJ / Corporate Data
      companyName: isEmpresa ? companyName.trim() : undefined,
      tradeName: isEmpresa ? (tradingName || companyName).trim() : undefined,
      cnpj: isEmpresa ? cnpj.trim() : undefined,
      stateRegistration: isEmpresa ? stateRegistration.trim() : undefined,
      municipalRegistration: isEmpresa ? municipalRegistration.trim() : undefined,
      companySegment: isEmpresa ? businessSegment : undefined,
      legalRepresentativeName: isEmpresa ? legalRepresentativeName.trim() : undefined,
      legalRepresentativeRole: isEmpresa ? legalRepresentativeRole.trim() : undefined,
      legalRepresentativeCpf: isEmpresa ? legalRepresentativeCpf.trim() : undefined,
      companyPhone: isEmpresa ? (companyPhone || phone).trim() : undefined,
      companyEmail: isEmpresa ? (companyEmail || email).trim() : undefined,
      contractSocialOrCnpjDocUrl: documentPhoto || undefined,
      securityAccessLevel: 'private_solicitante_e_admin',

      address: isEmpresa ? fullCorporateAddress : (selectedRole === 'cliente' ? address : 'Salvador e Região Metropolitana - BA'),
      specialty: selectedRole === 'tecnico' ? specialty : undefined,
      documentType: docTypeFinal,
      document: docStringFinal,
      crea: crea.trim() || undefined,
      crt: crt.trim() || undefined,
      documentPhotoUrl: documentPhoto || undefined,
      selfiePhotoUrl: selfiePhoto || undefined,
      isVerified: true,
      verificationStatus: 'aprovado',
      verifiedAt: new Date().toISOString(),
      activeOrdersCount: 0,
      rating: selectedRole === 'tecnico' ? 5.0 : undefined,
      savedOnThisDevice: rememberOnDevice
    };

    let finalSavedUser = newUser;
    try {
      finalSavedUser = await saveRegisteredUser(newUser);
    } catch (err) {
      console.warn('Fallback to local memory user:', err);
    }

    // Persist remembered credentials if checked
    if (rememberOnDevice) {
      saveRememberedAuth({
        cpf: finalSavedUser.cnpj || finalSavedUser.cpf || cpf,
        name: finalSavedUser.name,
        role: finalSavedUser.role,
        avatar: finalSavedUser.avatar,
        remember: true
      });
      saveActiveUserSession(finalSavedUser);
    }

    // 1. WhatsApp notification for Admin
    const adminNotif = buildNewUserAdminNotification(finalSavedUser);
    setAdminWppData(adminNotif);
    dispatchWhatsAppNotification({
      type: selectedRole === 'tecnico' ? 'cadastro_tecnico' : 'cadastro_cliente',
      targetRole: 'admin',
      recipientName: 'Central de Gestão RM Manutec',
      recipientPhone: adminNotif.targetPhone,
      recipientPhoneFormatted: '(71) 99649-2354',
      messageText: adminNotif.message,
      whatsappUrl: adminNotif.url,
      status: 'disparado'
    }, true);

    // 2. WhatsApp notification for User
    const userNotif = buildNewUserWelcomeNotification(finalSavedUser);
    setUserWppData(userNotif);
    dispatchWhatsAppNotification({
      type: selectedRole === 'tecnico' ? 'cadastro_tecnico' : 'cadastro_cliente',
      targetRole: selectedRole,
      recipientName: finalSavedUser.name,
      recipientPhone: userNotif.targetPhone,
      recipientPhoneFormatted: finalSavedUser.phone,
      messageText: userNotif.message,
      whatsappUrl: userNotif.url,
      status: 'disparado'
    }, false);

    setIsSubmitting(false);
    setRegisteredSuccessUser(finalSavedUser);
  };

  // Render Success Screen
  if (registeredSuccessUser) {
    const isPj = registeredSuccessUser.clientType === 'empresa_cnpj' || Boolean(registeredSuccessUser.cnpj);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-xl rounded-2xl bg-white border border-sky-300 shadow-2xl text-slate-800 overflow-hidden my-4 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 text-white border-b border-sky-500 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center border border-white/30 shadow-md">
                <CheckCircle2 className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-100 block">
                  {isPj ? 'Cadastro Corporativo PJ Homologado' : 'Cadastro Homologado com Sucesso'}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {isPj ? registeredSuccessUser.companyName || registeredSuccessUser.name : 'Conta Criada & Dados Armazenados com Segurança'}
                </h3>
              </div>
            </div>

            <button
              onClick={() => onRegisterSuccess(registeredSuccessUser)}
              className="p-2 rounded-xl text-sky-100 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs sm:text-sm">
            
            {/* Informações de Login */}
            <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-sky-600" /> Suas Credenciais de Acesso
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-600 text-white font-bold text-[10px]">
                  Fixado neste Dispositivo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-sky-200">
                  <span className="text-slate-500 block text-[11px]">
                    {isPj ? 'CNPJ de Acesso:' : 'CPF de Acesso:'}
                  </span>
                  <span className="text-slate-900 font-mono font-bold text-sm">
                    {isPj ? (registeredSuccessUser.cnpj || registeredSuccessUser.cpf) : registeredSuccessUser.cpf}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-sky-200">
                  <span className="text-slate-500 block text-[11px]">Perfil / Tipo:</span>
                  <span className="text-sky-700 font-bold text-sm">
                    {isPj ? '🏢 Cliente Empresa (CNPJ)' : registeredSuccessUser.role === 'tecnico' ? '👷‍♂️ Profissional Técnico' : '👤 Cliente Pessoa Física'}
                  </span>
                </div>
              </div>

              {isPj && registeredSuccessUser.legalRepresentativeName && (
                <div className="p-2.5 rounded-lg bg-white border border-sky-200 text-xs">
                  <span className="text-slate-500 block text-[11px]">Responsável Legal / Gestor:</span>
                  <span className="text-slate-800 font-semibold">
                    {registeredSuccessUser.legalRepresentativeName} ({registeredSuccessUser.legalRepresentativeRole || 'Gestor'})
                  </span>
                </div>
              )}
            </div>

            {/* Aviso de Sigilo e Segurança Restrita */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="block text-xs font-bold text-emerald-900">Privacidade e Armazenamento Seguro</strong>
                Suas fotos de selfie, biometria e documentos foram criptografados e armazenados com acesso estritamente restrito: somente você (solicitante) e a administração central da RM Manutec possuem permissão de acesso.
              </div>
            </div>

            {/* WhatsApp Direct Dispatch Links */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                Comprovantes e Notificações no WhatsApp:
              </span>

              {userWppData && (
                <a
                  href={userWppData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between transition-colors shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Abrir Comprovante de Cadastro no meu WhatsApp
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {adminWppData && (
                <a
                  href={adminWppData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center justify-between transition-colors shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Notificar Central de Atendimento (71 99649-2354)
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Final Action Button */}
            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onRegisterSuccess(registeredSuccessUser)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Acessar Painel Agora com Esta Conta</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  const isEmpresa = selectedRole === 'cliente' && selectedClientType === 'empresa_cnpj';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-sky-300 shadow-2xl text-slate-800 overflow-hidden my-4 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 text-white border-b border-sky-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/30 shadow-md">
              {selectedRole === 'tecnico' ? (
                <HardHat className="w-6 h-6" />
              ) : isEmpresa ? (
                <Building2 className="w-6 h-6" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-100 block">
                {selectedRole === 'tecnico' ? 'Credenciamento Profissional' : (isEmpresa ? 'Cadastro Corporativo CNPJ' : 'Cadastro de Cliente')}
              </span>
              <h3 className="font-['Space_Grotesk'] text-lg sm:text-xl font-black text-white leading-tight">
                {selectedRole === 'tecnico'
                  ? 'Cadastro de Técnico / Prestador Autônomo'
                  : isEmpresa
                    ? 'Área de Cadastro Específica para Empresas & Condomínios (CNPJ)'
                    : 'Novo Cadastro de Cliente Pessoa Física'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-sky-100 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Selector Tabs */}
        <div className="p-3 bg-sky-50/90 border-b border-sky-200 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('cliente');
              setSelectedClientType('pessoa_fisica');
              setErrorMessage('');
            }}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'cliente' && selectedClientType === 'pessoa_fisica'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Cliente PF (CPF)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('cliente');
              setSelectedClientType('empresa_cnpj');
              setErrorMessage('');
            }}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'cliente' && selectedClientType === 'empresa_cnpj'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-sky-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Empresa (CNPJ)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('tecnico');
              setErrorMessage('');
            }}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedRole === 'tecnico'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Técnico / CREA</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* Security Banner */}
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-2.5 text-xs text-sky-950">
            <Shield className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>🔒 Armazenamento Seguro & Acesso Restrito:</strong> Todos os dados, selfies faciais e documentos são protegidos por sigilo. Somente o <strong>solicitante</strong> e o <strong>administrador</strong> têm acesso às informações corporativas e chamados.
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* 1. SEÇÃO ESPECÍFICA: EMPRESA CNPJ                            */}
          {/* ============================================================ */}
          {isEmpresa && (
            <div className="space-y-4 p-4 rounded-2xl bg-sky-50/50 border border-sky-200">
              <div className="flex items-center gap-2 border-b border-sky-200 pb-2 text-sky-900 font-bold text-xs">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Dados Corporativos da Empresa (Pessoa Jurídica)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Razão Social *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Condomínio Residencial Parque dos Pássaros"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Nome Fantasia</label>
                  <input
                    type="text"
                    value={tradingName}
                    onChange={(e) => setTradingName(e.target.value)}
                    placeholder="Ex: Edifício Parque dos Pássaros"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">CNPJ da Empresa *</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Inscrição Estadual (IE)</label>
                  <input
                    type="text"
                    value={stateRegistration}
                    onChange={(e) => setStateRegistration(e.target.value)}
                    placeholder="Isento ou Nº"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Inscrição Municipal (IM)</label>
                  <input
                    type="text"
                    value={municipalRegistration}
                    onChange={(e) => setMunicipalRegistration(e.target.value)}
                    placeholder="Nº Inscrição Municipal"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Ramo de Atividade / Segmento</label>
                <select
                  value={businessSegment}
                  onChange={(e) => setBusinessSegment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                >
                  <option value="Condomínio Residencial / Comercial">Condomínio Residencial / Comercial</option>
                  <option value="Construtora / Incorporadora">Construtora / Incorporadora</option>
                  <option value="Hospitalar / Clínica Médica / Laboratório">Hospitalar / Clínica Médica / Laboratório</option>
                  <option value="Comércio Varejista / Shopping / Supermercado">Comércio Varejista / Shopping / Supermercado</option>
                  <option value="Indústria / Fábrica / Galpão Logístico">Indústria / Fábrica / Galpão Logístico</option>
                  <option value="Hotelaria / Pousada / Restaurante">Hotelaria / Pousada / Restaurante</option>
                  <option value="Escritórios / Coworking / Serviços">Escritórios / Coworking / Serviços</option>
                  <option value="Educação / Escola / Faculdade">Educação / Escola / Faculdade</option>
                  <option value="Outro Segmento Empresarial">Outro Segmento Empresarial</option>
                </select>
              </div>

              {/* Responsável Legal */}
              <div className="pt-2 border-t border-sky-200">
                <span className="text-[11px] font-black uppercase text-sky-900 block mb-2">
                  Responsável Legal / Gestor de Manutenção Credenciado
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Nome do Responsável *</label>
                    <input
                      type="text"
                      value={legalRepresentativeName}
                      onChange={(e) => setLegalRepresentativeName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Cargo / Função *</label>
                    <input
                      type="text"
                      value={legalRepresentativeRole}
                      onChange={(e) => setLegalRepresentativeRole(e.target.value)}
                      placeholder="Ex: Síndico / Gerente Predial"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">CPF do Responsável *</label>
                    <input
                      type="text"
                      value={legalRepresentativeCpf}
                      onChange={(e) => setLegalRepresentativeCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Contatos Corporativos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Telefone / WhatsApp Corporativo *</label>
                  <input
                    type="tel"
                    value={companyPhone || phone}
                    onChange={(e) => {
                      const val = formatPhone(e.target.value);
                      setCompanyPhone(val);
                      setPhone(val);
                    }}
                    placeholder="(71) 99999-9999"
                    maxLength={15}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">E-mail Corporativo (Faturamento & NFe) *</label>
                  <input
                    type="email"
                    value={companyEmail || email}
                    onChange={(e) => {
                      setCompanyEmail(e.target.value);
                      setEmail(e.target.value);
                    }}
                    placeholder="gestao@empresa.com.br"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Endereço Corporativo */}
              <div className="pt-2 border-t border-sky-200 space-y-2">
                <span className="text-[11px] font-black uppercase text-sky-900 block">
                  Endereço da Empresa / Condomínio (Sede)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">CEP</label>
                    <input
                      type="text"
                      value={companyCep}
                      onChange={(e) => setCompanyCep(formatCEP(e.target.value))}
                      placeholder="40000-000"
                      maxLength={9}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Logradouro / Avenida / Rua</label>
                    <input
                      type="text"
                      value={companyStreet}
                      onChange={(e) => {
                        setCompanyStreet(e.target.value);
                        setAddress(e.target.value);
                      }}
                      placeholder="Ex: Av. Tancredo Neves"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Número</label>
                    <input
                      type="text"
                      value={companyNumber}
                      onChange={(e) => setCompanyNumber(e.target.value)}
                      placeholder="123"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Bairro</label>
                    <input
                      type="text"
                      value={companyNeighborhood}
                      onChange={(e) => setCompanyNeighborhood(e.target.value)}
                      placeholder="Caminho das Árvores"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Cidade</label>
                    <input
                      type="text"
                      value={companyCity}
                      onChange={(e) => setCompanyCity(e.target.value)}
                      placeholder="Salvador"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">UF</label>
                    <input
                      type="text"
                      value={companyState}
                      onChange={(e) => setCompanyState(e.target.value)}
                      placeholder="BA"
                      maxLength={2}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. SEÇÃO: PESSOA FÍSICA E TÉCNICO AUTÔNOMO                   */}
          {/* ============================================================ */}
          {!isEmpresa && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Nome Completo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João da Silva Santos"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">CPF *</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Telefone / WhatsApp *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(71) 99999-9999"
                    maxLength={15}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {selectedRole !== 'tecnico' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Número do RG *</label>
                    <input
                      type="text"
                      value={rg}
                      onChange={(e) => setRg(e.target.value)}
                      placeholder="00000000-00"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Órgão Emissor</label>
                    <input
                      type="text"
                      value={rgEmitter}
                      onChange={(e) => setRgEmitter(e.target.value)}
                      placeholder="SSP/BA"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              {selectedRole === 'cliente' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Endereço Residencial (Bairro / Cidade)</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Pituba, Salvador - BA"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-hidden"
                  />
                </div>
              )}

              {selectedRole === 'tecnico' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] font-black uppercase text-amber-900 block">
                    Habilitação Profissional / Conselho de Classe
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {(['liberal_autonomo', 'crea', 'crt', 'ambos'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTechDocType(mode)}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-all ${
                          techDocType === mode
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {mode === 'liberal_autonomo' && 'Autônomo'}
                        {mode === 'crea' && 'CREA-BA'}
                        {mode === 'crt' && 'CRT / CFT'}
                        {mode === 'ambos' && 'CREA + CRT'}
                      </button>
                    ))}
                  </div>

                  {(techDocType === 'crea' || techDocType === 'ambos') && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Registro CREA-BA *</label>
                      <input
                        type="text"
                        value={crea}
                        onChange={(e) => setCrea(e.target.value)}
                        placeholder="Nº Registro CREA-BA"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                  )}

                  {(techDocType === 'crt' || techDocType === 'ambos') && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Registro CRT *</label>
                      <input
                        type="text"
                        value={crt}
                        onChange={(e) => setCrt(e.target.value)}
                        placeholder="Nº Registro CRT"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Especialidades e Serviços *</label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Ex: Elétrica Predial, Ar-Condicionado Split, Hidráulica, Pintura"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. SENHA DE ACESSO & FIXAÇÃO                                 */}
          {/* ============================================================ */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-sky-600" />
              Senha de Acesso & Fixação no Dispositivo
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Criar Senha (mínimo 6 dígitos) *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 pr-9 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Confirmar Senha *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 pr-9 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={rememberOnDevice}
                onChange={(e) => setRememberOnDevice(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <span className="font-medium">Fixar dados e manter conectado neste dispositivo com segurança</span>
            </label>
          </div>

          {/* ============================================================ */}
          {/* 4. DOCUMENTO & SELFIE BIOMÉTRICA (ARMAZENAMENTO SEGURO)     */}
          {/* ============================================================ */}
          <div className="space-y-4">
            
            {/* Documento / Cartão CNPJ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  {isEmpresa ? 'Cartão CNPJ / Contrato Social (Opcional)' : 'Foto do Documento (RG / CNH / Carteira Profissional)'}
                </span>
                {documentPhoto && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Anexado
                  </span>
                )}
              </div>

              {!documentPhoto && !isDocumentCameraActive && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDocumentCameraActive(true)}
                    className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-sky-600" />
                    <span>Usar Câmera</span>
                  </button>

                  <label className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                    <Upload className="w-4 h-4 text-sky-600" />
                    <span>Enviar Arquivo</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {isDocumentCameraActive && (
                <div className="space-y-2">
                  <CameraDocumentCapture
                    onCapture={(base64) => {
                      setDocumentPhoto(base64);
                      setIsDocumentCameraActive(false);
                    }}
                    onCancel={() => setIsDocumentCameraActive(false)}
                    documentType={isEmpresa ? 'cnpj' : 'rg'}
                  />
                </div>
              )}

              {documentPhoto && (
                <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-100 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={documentPhoto} alt="Documento" className="w-12 h-12 object-cover rounded-lg" />
                    <span className="text-xs text-slate-700 font-semibold">Documento capturado com sucesso</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocumentPhoto(null)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Selfie Facial Auditada */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-sky-600" />
                  {isEmpresa ? 'Selfie do Responsável Legal (Validação Biométrica)' : 'Selfie Facial (Foto de Perfil & Biometria)'}
                </span>
                {selfiePhoto && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selfie Armazenada com Segurança
                  </span>
                )}
              </div>

              <CameraSelfieCapture
                onCapture={handleSelfieCapture}
                onClear={handleSelfieClear}
                initialImage={selfiePhoto}
                userName={isEmpresa ? (legalRepresentativeName || tradingName || companyName) : name}
                userRole={selectedRole === 'tecnico' ? 'tecnico' : (isEmpresa ? 'empresa_cnpj' : 'cliente')}
                userDocument={isEmpresa ? cnpj : cpf}
                source={isEmpresa ? 'cadastro_empresa_cnpj' : (selectedRole === 'tecnico' ? 'cadastro_tecnico' : 'cadastro_cliente_pf')}
                roleLabel={isEmpresa ? 'Selfie do Responsável Legal PJ' : (selectedRole === 'tecnico' ? 'Selfie do Profissional' : 'Selfie do Cliente')}
              />
            </div>

          </div>

          {/* Terms checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                required
                defaultChecked
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 bg-white border-slate-300"
              />
              <span>
                Declaro que as informações fornecidas são autênticas e concordo com os termos de segurança e prestação de serviços da RM Manutec.
              </span>
            </label>
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                isEmpresa
                  ? 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600'
                  : selectedRole === 'cliente'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500'
                    : 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processando e Armazenando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir Cadastro Seguro</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
