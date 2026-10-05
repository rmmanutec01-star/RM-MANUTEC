import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, ClientType } from '../types';
import { LogoRM } from './LogoRM';
import { RM_CONTACT_INFO } from '../data/servicesData';
import { RegistrationModal } from './RegistrationModal';
import { AdminAuthModal } from './AdminAuthModal';
import {
  authenticateUserByCpfAndPassword,
  getRememberedAuth,
  saveRememberedAuth,
  clearRememberedAuth,
  requestPasswordRecovery,
  resetUserPasswordWithCode,
  saveActiveUserSession
} from '../lib/supabase';
import {
  buildPasswordRecoveryNotification,
  buildPasswordChangedConfirmationNotification,
  dispatchWhatsAppNotification
} from '../lib/whatsappNotifications';
import {
  User,
  HardHat,
  Building2,
  ShieldCheck,
  Phone,
  MessageCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  LogIn,
  Camera,
  FileText,
  UserPlus,
  AlertCircle,
  KeyRound,
  Download,
  Share2,
  Smartphone,
  Eye,
  EyeOff,
  RefreshCw,
  HelpCircle,
  Check,
  ExternalLink,
  Send,
  UserCheck,
  Briefcase,
  Layers,
  Shield
} from 'lucide-react';

interface AccessSelectionViewProps {
  onSelectRole: (role: UserRole, user?: UserProfile) => void;
  onOpenContact: (channel?: 'whatsapp' | 'call' | 'email') => void;
  onOpenInstallModal?: () => void;
  onShareApp?: () => void;
}

export const AccessSelectionView: React.FC<AccessSelectionViewProps> = ({
  onSelectRole,
  onOpenContact,
  onOpenInstallModal,
  onShareApp
}) => {
  // Registration modal state
  const [registrationRole, setRegistrationRole] = useState<'cliente' | 'tecnico' | null>(null);
  const [registrationClientType, setRegistrationClientType] = useState<ClientType>('pessoa_fisica');
  
  // Admin 2FA & Password Auth modal state
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);

  // Login Modal / Drawer State
  const [loginRole, setLoginRole] = useState<UserRole | null>(null);
  const [loginClientType, setLoginClientType] = useState<ClientType>('pessoa_fisica');
  const [cpfInput, setCpfInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Remembered user quick login info
  const [rememberedUser, setRememberedUser] = useState<{
    cpf: string;
    name: string;
    role: UserRole;
    avatar?: string;
  } | null>(null);

  // Password Recovery State
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [recoveryCpf, setRecoveryCpf] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryShowPass, setRecoveryShowPass] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryWppData, setRecoveryWppData] = useState<{
    code: string;
    url: string;
    message: string;
    targetPhone: string;
  } | null>(null);

  // Load remembered authentication on mount (Invisibiliza Josimeire e garante privacidade por aparelho)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('rm_manutec_remembered_auth');
      if (raw && raw.toLowerCase().includes('josimeire')) {
        const confirmed = localStorage.getItem('rm_device_confirmed_cpf');
        const parsed = JSON.parse(raw);
        const cleanDoc = parsed.cpf ? parsed.cpf.replace(/\D/g, '') : '';
        if (!confirmed || confirmed !== cleanDoc) {
          localStorage.removeItem('rm_manutec_remembered_auth');
        }
      }
    } catch (e) {}

    const remembered = getRememberedAuth();
    if (remembered && remembered.remember && remembered.cpf) {
      const confirmed = localStorage.getItem('rm_device_confirmed_cpf');
      const cleanDoc = remembered.cpf.replace(/\D/g, '');
      const isJosimeire = Boolean(remembered.name && remembered.name.toLowerCase().includes('josimeire'));

      // Botão invisível a menos que seja o aparelho do candidato dono do CPF que efetuou cadastro neste dispositivo
      if (isJosimeire && (!confirmed || confirmed !== cleanDoc)) {
        setRememberedUser(null);
      } else if (confirmed && confirmed === cleanDoc) {
        setRememberedUser(remembered);
        setCpfInput(remembered.cpf);
      } else {
        setRememberedUser(null);
      }
    } else {
      setRememberedUser(null);
    }
  }, []);

  // Empresa CNPJ Private 2FA State (CNPJ + Senha + Confirmação WhatsApp)
  const [companyWhatsapp, setCompanyWhatsapp] = useState('');
  const [companyAuthStep, setCompanyAuthStep] = useState<1 | 2>(1);
  const [company2faCode, setCompany2faCode] = useState('');
  const [companyEnteredCode, setCompanyEnteredCode] = useState('');
  const [companyPendingUser, setCompanyPendingUser] = useState<UserProfile | null>(null);
  const [companyWppUrl, setCompanyWppUrl] = useState('');

  // Format CPF or CNPJ based on length
  const formatDocument = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length <= 11) {
      // CPF format
      if (raw.length <= 3) return raw;
      if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
      if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
      return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
    } else {
      // CNPJ format
      const cnpjRaw = raw.slice(0, 14);
      if (cnpjRaw.length <= 2) return cnpjRaw;
      if (cnpjRaw.length <= 5) return `${cnpjRaw.slice(0, 2)}.${cnpjRaw.slice(2)}`;
      if (cnpjRaw.length <= 8) return `${cnpjRaw.slice(0, 2)}.${cnpjRaw.slice(2, 5)}.${cnpjRaw.slice(5)}`;
      if (cnpjRaw.length <= 12) return `${cnpjRaw.slice(0, 2)}.${cnpjRaw.slice(2, 5)}.${cnpjRaw.slice(5, 8)}/${cnpjRaw.slice(8)}`;
      return `${cnpjRaw.slice(0, 2)}.${cnpjRaw.slice(2, 5)}.${cnpjRaw.slice(5, 8)}/${cnpjRaw.slice(8, 12)}-${cnpjRaw.slice(12, 14)}`;
    }
  };

  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

  const handleOpenRegistration = (role: 'cliente' | 'tecnico', clientType: ClientType = 'pessoa_fisica') => {
    setRegistrationRole(role);
    setRegistrationClientType(clientType);
  };

  const handleRegistrationSuccess = (user: UserProfile) => {
    setRegistrationRole(null);
    onSelectRole(user.role, user);
  };

  const handleAdminAuthSuccess = (adminUser: UserProfile) => {
    setIsAdminAuthOpen(false);
    onSelectRole('admin', adminUser);
  };

  const handleOpenLoginModal = (role: UserRole, clientType: ClientType = 'pessoa_fisica') => {
    setLoginRole(role);
    setLoginClientType(clientType);
    setLoginError('');
    setCompanyAuthStep(1);
    setCompanyEnteredCode('');
    setCompany2faCode('');
    setCompanyPendingUser(null);
    if (rememberedUser && rememberedUser.role === role) {
      setCpfInput(rememberedUser.cpf);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!cpfInput.trim()) {
      setLoginError(loginClientType === 'empresa_cnpj' ? 'Informe o CNPJ cadastrado.' : 'Informe seu CPF ou CNPJ cadastrado.');
      return;
    }

    if (!passwordInput.trim()) {
      setLoginError('Por favor, digite a sua senha de acesso.');
      return;
    }

    // Validação especial para Empresas & Condomínios (CNPJ + Senha + WhatsApp de Confirmação)
    if (loginClientType === 'empresa_cnpj') {
      const cleanWpp = companyWhatsapp.replace(/\D/g, '');
      if (cleanWpp.length < 10) {
        setLoginError('Informe o número de WhatsApp da empresa ou gestor para envio do código de confirmação.');
        return;
      }
    }

    setIsLoggingIn(true);

    try {
      const authResult = authenticateUserByCpfAndPassword(
        cpfInput.trim(),
        passwordInput.trim(),
        loginRole || undefined
      );

      if (!authResult.success || !authResult.user) {
        setLoginError(authResult.message || 'CNPJ/CPF ou senha incorretos.');
        setIsLoggingIn(false);
        return;
      }

      const authenticatedUser = authResult.user;

      // Se for Empresa/Condomínio, dispara código 2FA no WhatsApp para confirmação
      if (loginClientType === 'empresa_cnpj') {
        const cleanWpp = companyWhatsapp.replace(/\D/g, '');
        const targetPhone = cleanWpp.startsWith('55') ? cleanWpp : `55${cleanWpp}`;
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

        setCompany2faCode(generatedCode);
        setCompanyPendingUser(authenticatedUser);

        const messageText = `🏢 *RM MANUTEC • CONFIRMAÇÃO DE ACESSO PJ*

Olá, *${authenticatedUser.name}*!
Identificamos uma tentativa de acesso ao portal corporativo de Condomínios & Empresas.

🔑 Seu código de confirmação de segurança é:
*${generatedCode}*

Informe este código de 6 dígitos na tela de acesso para liberar o painel confidencial da sua empresa.

Central de Segurança RM Manutec
Engenharia e Manutenção Predial`;

        const encoded = encodeURIComponent(messageText);
        const wppUrl = `https://wa.me/${targetPhone}?text=${encoded}`;
        setCompanyWppUrl(wppUrl);

        dispatchWhatsAppNotification({
          type: 'confirmacao_acesso',
          targetRole: 'cliente',
          recipientName: authenticatedUser.name,
          recipientPhone: targetPhone,
          recipientPhoneFormatted: companyWhatsapp,
          messageText,
          whatsappUrl: wppUrl,
          status: 'disparado'
        }, true);

        setIsLoggingIn(false);
        setCompanyAuthStep(2);
        return;
      }

      // Fluxo padrão PF ou Técnico
      if (rememberMe) {
        saveRememberedAuth({
          cpf: authenticatedUser.cnpj || authenticatedUser.cpf || cpfInput.trim(),
          name: authenticatedUser.name,
          role: authenticatedUser.role,
          avatar: authenticatedUser.avatar,
          remember: true
        });
      } else {
        clearRememberedAuth();
      }

      saveActiveUserSession(authenticatedUser);

      setIsLoggingIn(false);
      setLoginRole(null);
      onSelectRole(authenticatedUser.role, authenticatedUser);
    } catch (err: any) {
      setIsLoggingIn(false);
      setLoginError('Erro ao validar acesso. Tente novamente.');
    }
  };

  const handleCompanyConfirmCode = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!companyEnteredCode.trim()) {
      setLoginError('Digite o código de 6 dígitos recebido no WhatsApp.');
      return;
    }

    if (companyEnteredCode.trim() !== company2faCode.trim()) {
      setLoginError('Código incorreto. Verifique a mensagem enviada no WhatsApp ou solicite um novo código.');
      return;
    }

    if (!companyPendingUser) {
      setLoginError('Sessão expirada. Refaça o login.');
      setCompanyAuthStep(1);
      return;
    }

    const authenticatedUser = companyPendingUser;

    if (rememberMe) {
      saveRememberedAuth({
        cpf: authenticatedUser.cnpj || authenticatedUser.cpf || cpfInput.trim(),
        name: authenticatedUser.name,
        role: authenticatedUser.role,
        avatar: authenticatedUser.avatar,
        remember: true
      });
    } else {
      clearRememberedAuth();
    }

    saveActiveUserSession(authenticatedUser);
    setLoginRole(null);
    setCompanyAuthStep(1);
    setCompanyPendingUser(null);
    onSelectRole(authenticatedUser.role, authenticatedUser);
  };

  // Password Recovery Handlers
  const handleOpenRecoveryModal = () => {
    setRecoveryStep(1);
    setRecoveryError('');
    setRecoverySuccessMsg('');
    setRecoveryCode('');
    setRecoveryNewPassword('');
    setRecoveryConfirmPassword('');
    setRecoveryWppData(null);
    setRecoveryCpf(cpfInput || '');
    setRecoveryPhone('');
    setIsRecoveryOpen(true);
  };

  const handleRequestRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccessMsg('');

    if (!recoveryCpf.trim()) {
      setRecoveryError('Por favor, informe o CPF ou CNPJ cadastrado.');
      return;
    }

    setRecoveryLoading(true);

    const result = requestPasswordRecovery(recoveryCpf.trim());

    if (!result.success || !result.user || !result.code) {
      setRecoveryLoading(false);
      setRecoveryError(result.message || 'Cadastro não localizado para os dados informados.');
      return;
    }

    const resetUser = result.user;
    const code = result.code;

    const notif = buildPasswordRecoveryNotification(resetUser, code);
    setRecoveryWppData({
      code,
      url: notif.url,
      message: notif.message,
      targetPhone: notif.targetPhone
    });

    dispatchWhatsAppNotification({
      type: 'recuperacao_senha',
      targetRole: (resetUser.role === 'admin' || resetUser.role === 'tecnico') ? resetUser.role : 'cliente',
      recipientName: resetUser.name,
      recipientPhone: notif.targetPhone,
      recipientPhoneFormatted: resetUser.phone,
      messageText: notif.message,
      whatsappUrl: notif.url,
      status: 'disparado'
    }, false);

    setRecoveryLoading(false);
    setRecoveryStep(2);
    setRecoverySuccessMsg(`Código de verificação enviado para o WhatsApp ${resetUser.phone}.`);
  };

  const handleVerifyRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!recoveryCode.trim() || recoveryCode.trim().length !== 6) {
      setRecoveryError('Por favor, insira o código de 6 dígitos recebido no WhatsApp.');
      return;
    }

    setRecoveryStep(3);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!recoveryNewPassword.trim() || recoveryNewPassword.trim().length < 6) {
      setRecoveryError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryError('A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    setRecoveryLoading(true);

    const result = resetUserPasswordWithCode(recoveryCpf.trim(), recoveryCode.trim(), recoveryNewPassword.trim());

    if (!result.success || !result.user) {
      setRecoveryLoading(false);
      setRecoveryError(result.message || 'Erro ao redefinir a senha.');
      return;
    }

    // Confirmation notification
    const confNotif = buildPasswordChangedConfirmationNotification(result.user);
    dispatchWhatsAppNotification({
      type: 'recuperacao_senha',
      targetRole: (result.user.role === 'admin' || result.user.role === 'tecnico') ? result.user.role : 'cliente',
      recipientName: result.user.name,
      recipientPhone: confNotif.targetPhone,
      recipientPhoneFormatted: result.user.phone,
      messageText: confNotif.message,
      whatsappUrl: confNotif.url,
      status: 'disparado'
    }, false);

    setRecoveryLoading(false);
    setRecoverySuccessMsg('Senha alterada com sucesso! Você já pode entrar com a nova senha.');
    setTimeout(() => {
      setIsRecoveryOpen(false);
      setCpfInput(result.user?.cnpj || result.user?.cpf || recoveryCpf);
      setPasswordInput(recoveryNewPassword);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-600 via-sky-700 to-sky-800 text-slate-100 flex flex-col justify-between selection:bg-slate-500/30 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-sky-900/95 backdrop-blur-md border-b border-sky-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoRM size="sm" showSubtitle={true} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-800/70 hover:bg-sky-800 border border-sky-600 text-slate-200 text-xs font-bold transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span>Instalar App</span>
              </button>
            )}

            <button
              onClick={() => onOpenContact('whatsapp')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Plantão WhatsApp</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center">
        
        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl space-y-3 mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-900/85 border border-sky-600/80 text-slate-200 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Engenharia Civil, Elétrica & Ar-Condicionado • Salvador e RMS</span>
          </div>

          <h1 className="font-['Space_Grotesk'] text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Portal de Atendimento e Ordens de Serviço
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Selecione o seu perfil de acesso para solicitar serviços, acompanhar chamados técnicos, laudos com ART ou gerenciar atendimentos.
          </p>

          {/* Quick Remembered User Login - Invisibilizado para Josimeire, visível somente no aparelho do candidato dono do CPF após cadastrar */}
          {rememberedUser && !rememberedUser.name.toLowerCase().includes('josimeire') && (
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenLoginModal(rememberedUser.role)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-900/90 border border-sky-600 text-slate-100 text-xs font-bold shadow-md hover:bg-sky-800 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Continuar como <strong>{rememberedUser.name}</strong> ({rememberUserRoleLabel(rememberedUser.role)})</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => {
                  clearRememberedAuth();
                  setRememberedUser(null);
                }}
                className="p-1.5 rounded-full bg-sky-900 border border-sky-700 hover:border-rose-500 text-slate-400 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                title="Esquecer este acesso neste aparelho"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 4 Dedicated Entrance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full max-w-6xl">
          
          {/* Card 1: CLIENTE PESSOA FÍSICA */}
          <div
            id="card-acesso-cliente-pf"
            className="group relative rounded-2xl bg-white border-2 border-rose-200 hover:border-rose-400 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 text-[10px] font-black tracking-wider uppercase text-white shadow-xs">
              Pessoa Física
            </div>

            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <User className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  Cliente Residencial
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Serviços residenciais, apartamentos, casas, reformas particulares e emergências.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1 text-xs text-slate-700">
                <span className="text-[10px] font-bold uppercase text-rose-700 block">Identificação:</span>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <KeyRound className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>CPF e Senha Cadastrada</span>
                </div>
              </div>
            </div>

            <div className="pt-5 space-y-2">
              <button
                type="button"
                id="btn-login-cliente-pf"
                onClick={() => handleOpenLoginModal('cliente', 'pessoa_fisica')}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar com CPF</span>
              </button>

              <button
                id="btn-cadastrar-cliente-pf"
                type="button"
                onClick={() => handleOpenRegistration('cliente', 'pessoa_fisica')}
                className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Criar Cadastro PF</span>
              </button>
            </div>
          </div>

          {/* Card 2: CLIENTE EMPRESA CNPJ */}
          <div
            id="card-acesso-cliente-cnpj"
            className="group relative rounded-2xl bg-white border-2 border-sky-400 hover:border-sky-500 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 ring-2 ring-sky-400/20"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-sky-700 to-blue-800 text-[10px] font-black tracking-wider uppercase text-white shadow-xs flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-300" />
              <span>Acesso Privado e Sigiloso PJ</span>
            </div>

            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Building2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                  Empresas & Condomínios (PJ)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Condomínios, indústrias, construtoras e faturamento corporativo com emissão de laudos técnicos e ART.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200 space-y-1.5 text-xs text-slate-700">
                <span className="text-[10px] font-bold uppercase text-sky-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Autenticação Privada e Segura:</span>
                </span>
                <div className="text-[11px] text-slate-800 font-semibold leading-snug">
                  Entrar somente com <strong>CNPJ</strong>, <strong>Senha</strong> e <strong>WhatsApp</strong> para envio de confirmação.
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  🔒 Oculto ao público. Apenas o gestor cadastrado e o administrador têm acesso a todos os chamados.
                </div>
              </div>
            </div>

            <div className="pt-5 space-y-2">
              <button
                type="button"
                id="btn-login-cliente-cnpj"
                onClick={() => handleOpenLoginModal('cliente', 'empresa_cnpj')}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Entrar com CNPJ (Acesso Privado)</span>
              </button>

              <button
                id="btn-cadastrar-cliente-cnpj"
                type="button"
                onClick={() => handleOpenRegistration('cliente', 'empresa_cnpj')}
                className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Área de Cadastro CNPJ</span>
              </button>
            </div>
          </div>

          {/* Card 3: PROFISSIONAL / TÉCNICO AUTÔNOMO */}
          <div
            id="card-acesso-tecnico"
            className="group relative rounded-2xl bg-white border-2 border-amber-200 hover:border-amber-400 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-orange-500 text-[10px] font-black tracking-wider uppercase text-white shadow-xs">
              Profissional Liberal
            </div>

            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <HardHat className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Técnico / Parceiro
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Eletricistas, técnicos em refrigeração, encanadores, pintores e engenheiros credenciados.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1 text-xs text-slate-700">
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Credenciamento:</span>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>CPF / CREA / CRT e Senha</span>
                </div>
              </div>
            </div>

            <div className="pt-5 space-y-2">
              <button
                type="button"
                id="btn-login-tecnico"
                onClick={() => handleOpenLoginModal('tecnico')}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar Técnico</span>
              </button>

              <button
                id="btn-cadastrar-tecnico"
                type="button"
                onClick={() => handleOpenRegistration('tecnico')}
                className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Cadastrar Profissional</span>
              </button>
            </div>
          </div>

          {/* Card 4: ADMINISTRAÇÃO CENTRAL */}
          <div
            id="card-acesso-admin"
            className="group relative rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-500 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-sky-800 to-sky-700 text-[10px] font-black tracking-wider uppercase text-white shadow-xs flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-amber-400" />
              <span>Painel Central</span>
            </div>

            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Shield className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                  Administração
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Gestão global de ordens de serviço, despacho operacional, cofre de documentos e auditoria.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-700 block">Segurança Máxima:</span>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Autenticação 2FA WhatsApp Ativa</span>
                </div>
              </div>
            </div>

            <div className="pt-5 space-y-2">
              <button
                type="button"
                id="btn-open-admin-auth"
                onClick={() => setIsAdminAuthOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-sky-900 hover:bg-sky-950 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Acessar Gestão (2FA)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Security & Access Restriction Assurance */}
        <div className="mt-8 p-4 rounded-2xl bg-white border border-sky-200 max-w-4xl w-full shadow-sm flex items-center gap-3 text-xs text-slate-700">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-slate-900 block font-bold text-xs">Proteção de Dados & Sigilo Rigoroso:</strong>
            <span>Todos os dados cadastrais, documentos de empresas (CNPJ) e fotos de selfie biométrica são armazenados com segurança criptografada. <strong>Somente o solicitante e o administrador</strong> possuem permissão de acesso.</span>
          </div>
        </div>

        {/* Emergency Assistance Banner */}
        <div className="mt-6 w-full max-w-4xl rounded-2xl bg-gradient-to-r from-sky-700 via-blue-700 to-sky-800 text-white p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-sky-900/10">
          <div className="flex items-center gap-3 text-left">
            <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Precisa de atendimento emergencial imediato?</h4>
              <p className="text-xs text-sky-100">
                Plantão 24 horas para pane elétrica, vazamentos e climatização em Salvador e RMS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onOpenContact('whatsapp')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Direto</span>
            </button>

            <button
              onClick={() => onOpenContact('call')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-sky-50 text-sky-800 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Phone className="w-4 h-4 text-sky-700" />
              <span>(71) 99649-2354</span>
            </button>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-sky-200/80 bg-white/90 py-5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">RM MANUTEC</span>
            <span>• Civil • Elétrica • Climatização</span>
          </div>
          <div>
            <span>CNPJ: 64.177.147/0001-34 • Salvador - BA</span>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      {registrationRole && (
        <RegistrationModal
          isOpen={true}
          role={registrationRole}
          initialClientType={registrationClientType}
          onClose={() => setRegistrationRole(null)}
          onRegisterSuccess={handleRegistrationSuccess}
        />
      )}

      {/* Admin 2FA Auth Modal */}
      {isAdminAuthOpen && (
        <AdminAuthModal
          isOpen={isAdminAuthOpen}
          onClose={() => setIsAdminAuthOpen(false)}
          onSuccess={handleAdminAuthSuccess}
        />
      )}

      {/* Modal: Login with CPF / CNPJ & Password */}
      {loginRole && (
        <div className="fixed inset-0 z-50 bg-sky-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-sky-300 p-6 space-y-4 text-slate-800 animate-in fade-in zoom-in-95 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                  loginClientType === 'empresa_cnpj'
                    ? 'bg-sky-600'
                    : loginRole === 'cliente'
                      ? 'bg-rose-600'
                      : 'bg-amber-600'
                }`}>
                  {loginClientType === 'empresa_cnpj' ? (
                    <Building2 className="w-5 h-5" />
                  ) : loginRole === 'cliente' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <HardHat className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {loginClientType === 'empresa_cnpj'
                      ? 'Entrar como Empresa (CNPJ)'
                      : loginRole === 'cliente'
                        ? 'Entrar como Cliente PF'
                        : 'Entrar como Técnico / Parceiro'}
                  </h3>
                  <span className="text-[11px] text-slate-500">Informe suas credenciais cadastradas</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setLoginRole(null);
                  setLoginError('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            {loginClientType === 'empresa_cnpj' && companyAuthStep === 2 ? (
              /* Step 2: Confirmação do Código WhatsApp para Empresa / Condomínio */
              <form onSubmit={handleCompanyConfirmCode} className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 space-y-2">
                  <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Confirmação de Acesso Privado PJ</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Enviamos um código de segurança de 6 dígitos para o WhatsApp <strong>{companyWhatsapp}</strong> da empresa <strong>{companyPendingUser?.name}</strong>.
                  </p>
                  {companyWppUrl && (
                    <a
                      href={companyWppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Abrir mensagem no WhatsApp</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1 text-center">
                    Digite o Código de 6 Dígitos do WhatsApp:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={companyEnteredCode}
                    onChange={(e) => setCompanyEnteredCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-sky-400 text-slate-900 text-center font-mono text-xl font-bold tracking-widest outline-none focus:border-sky-600 focus:bg-white"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyAuthStep(1);
                      setLoginError('');
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
                  >
                    Voltar e alterar dados
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Código & Acessar</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {loginClientType === 'empresa_cnpj' ? 'CNPJ da Empresa ou Condomínio:' : 'CPF de Acesso:'}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={cpfInput}
                    onChange={(e) => setCpfInput(formatDocument(e.target.value))}
                    placeholder={loginClientType === 'empresa_cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-sky-500 focus:bg-white font-mono text-sm font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold">
                      Senha de Acesso Cadastrada:
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenRecoveryModal}
                      className="text-xs text-sky-600 hover:text-sky-800 font-semibold hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Digite sua senha cadastrada"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-sky-500 focus:bg-white font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Campo exclusivo para Empresas e Condomínios: WhatsApp para Confirmação de Cadastro e Acesso */}
                {loginClientType === 'empresa_cnpj' && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                      <span>WhatsApp da Empresa / Gestor:</span>
                      <span className="text-[10px] text-sky-700 font-bold">Envio de Confirmação</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={companyWhatsapp}
                      onChange={(e) => setCompanyWhatsapp(formatPhone(e.target.value))}
                      placeholder="(71) 99999-9999"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-sky-500 focus:bg-white font-mono text-sm"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Enviaremos um código de 6 dígitos no WhatsApp informado para confirmar o acesso privado.
                    </p>
                  </div>
                )}

                {/* Remember on device */}
                <div className="pt-1 space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                    />
                    <span className="font-medium">Fixar minhas informações neste aparelho</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      const r = loginRole as 'cliente' | 'tecnico';
                      const cType = loginClientType;
                      setLoginRole(null);
                      handleOpenRegistration(r, cType);
                    }}
                    className="text-xs text-sky-700 hover:text-sky-900 font-bold underline"
                  >
                    Criar novo cadastro
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginRole(null);
                        setLoginError('');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className={`px-5 py-2 rounded-xl text-white font-bold shadow-md flex items-center gap-1.5 transition-all ${
                        loginClientType === 'empresa_cnpj'
                          ? 'bg-sky-600 hover:bg-sky-700'
                          : loginRole === 'cliente'
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      {isLoggingIn ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogIn className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {loginClientType === 'empresa_cnpj' ? 'Enviar Confirmação WhatsApp' : 'Entrar'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Recuperação de Senha com Notificação WhatsApp */}
      {isRecoveryOpen && (
        <div className="fixed inset-0 z-50 bg-sky-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-sky-300 p-6 space-y-4 text-slate-800 animate-in fade-in zoom-in-95 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Recuperação de Senha</h3>
                  <span className="text-[11px] text-sky-600">Via Código no WhatsApp</span>
                </div>
              </div>
              <button
                onClick={() => setIsRecoveryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {recoveryError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{recoverySuccessMsg}</span>
              </div>
            )}

            {/* Step 1: Input CPF/CNPJ and request code */}
            {recoveryStep === 1 && (
              <form onSubmit={handleRequestRecoveryCode} className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Informe o CPF ou CNPJ cadastrado para enviarmos um código de segurança diretamente para o seu WhatsApp.
                </p>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Seu CPF ou CNPJ Cadastrado *
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryCpf}
                    onChange={(e) => setRecoveryCpf(formatDocument(e.target.value))}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-sky-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Telefone / WhatsApp (Opcional para confirmação)
                  </label>
                  <input
                    type="text"
                    value={recoveryPhone}
                    onChange={(e) => setRecoveryPhone(formatPhone(e.target.value))}
                    placeholder="(71) 98765-4321"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-sky-500 font-mono text-sm"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecoveryOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md flex items-center gap-1.5"
                  >
                    {recoveryLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Enviar Código no WhatsApp</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Code Verification */}
            {recoveryStep === 2 && (
              <form onSubmit={handleVerifyRecoveryCode} className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Digite o código de 6 dígitos enviado para seu WhatsApp.
                </p>

                {recoveryWppData && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-800 font-bold">Mensagem WhatsApp Pronta</span>
                      <span className="text-slate-600 font-mono">{recoveryWppData.targetPhone}</span>
                    </div>
                    <a
                      href={recoveryWppData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Abrir WhatsApp para Ver Código</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Código de 6 Dígitos *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 849201"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-sky-500 font-mono text-center text-lg tracking-widest font-bold"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Validar Código</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {recoveryStep === 3 && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Código validado! Crie sua nova senha de acesso.
                </p>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Nova Senha * (mínimo 6 dígitos)
                  </label>
                  <div className="relative">
                    <input
                      type={recoveryShowPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-sky-500 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setRecoveryShowPass(!recoveryShowPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {recoveryShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Confirme a Nova Senha *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={recoveryConfirmPassword}
                    onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-sky-500 font-mono text-sm"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecoveryOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center gap-1.5"
                  >
                    {recoveryLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Salvar Nova Senha</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

function rememberUserRoleLabel(role: UserRole): string {
  switch (role) {
    case 'cliente':
      return 'Cliente';
    case 'tecnico':
      return 'Técnico';
    case 'admin':
      return 'Administrador';
    default:
      return 'Usuário';
  }
}
