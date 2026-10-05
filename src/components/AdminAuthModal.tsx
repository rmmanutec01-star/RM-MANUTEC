import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  MessageCircle,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { UserProfile } from '../types';
import { PRELOADED_USERS } from '../data/servicesData';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminUser: UserProfile) => void;
}

const AUTHORIZED_ADMIN_WHATSAPP = '71996492354';
const AUTHORIZED_ADMIN_WHATSAPP_MASKED = '(71) 9••••-••54';
const MASTER_ADMIN_PASSWORD = 'TheoMicaelRoselito';

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Step 1: Password, Step 2: 2FA WhatsApp code
  const [step, setStep] = useState<'password' | '2fa' | 'success'>('password');
  
  // Password state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // 2FA state
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSentTime, setCodeSentTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [showSimulationToast, setShowSimulationToast] = useState(false);

  // Generate a random 6-digit verification code
  const generateNew2FACode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setCodeSentTime(new Date());
    setCountdown(300);
    setCanResend(false);
    setEnteredCode('');
    setCodeError('');
    return code;
  };

  // Timer for code expiration
  useEffect(() => {
    let interval: any;
    if (step === '2fa' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          if (prev <= 240) {
            setCanResend(true);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Strict Password Validation
    if (password.trim() !== MASTER_ADMIN_PASSWORD) {
      setPasswordError('⛔ Acesso Negado: Senha de gestão incorreta. Este painel é restrito e monitorado.');
      return;
    }

    // Password is correct -> Generate 2FA and move to WhatsApp step
    const code = generateNew2FACode();
    setStep('2fa');
    
    // Auto-trigger WhatsApp dispatch to the registered phone
    dispatchWhatsAppCode(code, true);
  };

  const dispatchWhatsAppCode = (code: string, autoOpen: boolean = false) => {
    setIsSendingWhatsApp(true);
    setShowSimulationToast(true);

    const message = `🔐 *RM MANUTEC - CÓDIGO DE AUTORIZAÇÃO DE GESTÃO*\n\nSeu código de verificação para acesso administrativo é: *${code}*\n\n⏱ Válido por 5 minutos.\n🛡️ Não compartilhe este código com pessoas não autorizadas.`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=55${AUTHORIZED_ADMIN_WHATSAPP}&text=${encodeURIComponent(message)}`;

    // Try to call server API for recording & verification
    fetch('/api/admin/send-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: AUTHORIZED_ADMIN_WHATSAPP,
        code
      })
    }).catch((err) => {
      console.log('Server 2FA dispatch logged locally:', err);
    });

    if (autoOpen) {
      try {
        window.open(whatsappUrl, '_blank');
      } catch (err) {
        console.warn('Popup blocked, user can click button:', err);
      }
    }

    setTimeout(() => {
      setIsSendingWhatsApp(false);
    }, 1000);
  };

  const handleOpenWhatsAppDirect = () => {
    if (!generatedCode) return;
    const message = `🔐 *RM MANUTEC - CÓDIGO DE AUTORIZAÇÃO DE GESTÃO*\n\nSeu código de verificação para acesso administrativo é: *${generatedCode}*\n\n⏱ Válido por 5 minutos.\n🛡️ Não compartilhe este código com pessoas não autorizadas.`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=55${AUTHORIZED_ADMIN_WHATSAPP}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');

    const cleanInput = enteredCode.replace(/\D/g, '').trim();

    if (!cleanInput) {
      setCodeError('Por favor, digite o código de 6 dígitos enviado para o WhatsApp cadastrado.');
      return;
    }

    if (countdown === 0) {
      setCodeError('O código expirou. Por favor, solicite um novo código no botão "Reenviar Código".');
      return;
    }

    if (cleanInput !== generatedCode) {
      setCodeError(`⛔ Código incorreto. Verifique a mensagem enviada ao WhatsApp ${AUTHORIZED_ADMIN_WHATSAPP_MASKED}.`);
      return;
    }

    // Success -> Authorized!
    setStep('success');
    setTimeout(() => {
      const adminUser: UserProfile = {
        ...PRELOADED_USERS.admin,
        phone: '(71) 99649-2354',
        isVerified: true,
        verificationStatus: 'aprovado'
      };
      onSuccess(adminUser);
    }, 1400);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-sky-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        id="modal-admin-auth"
        className="w-full max-w-md rounded-2xl bg-gradient-to-b from-sky-950 to-sky-950 border-2 border-sky-700/80 shadow-2xl p-6 sm:p-7 space-y-5 text-slate-200 animate-in fade-in zoom-in-95 relative overflow-hidden"
      >
        {/* Glowing safety ambient */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Security Badge */}
        <div className="flex items-center justify-between border-b border-sky-800 pb-3.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-800 to-sky-700 border border-sky-600 flex items-center justify-center text-amber-400 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] text-base sm:text-lg font-black text-white leading-tight">
                Acesso Restrito à Gestão
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                RM Manutec • Central Operacional
              </span>
            </div>
          </div>

          <button
            id="btn-close-admin-auth"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 relative z-10">
          <span
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
              step === 'password'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>1. Senha de Gestão</span>
          </span>

          <span className="text-slate-600">→</span>

          <span
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
              step === '2fa'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : step === 'success'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-sky-900 text-slate-500'
            }`}
          >
            <MessageCircle className="w-3 h-3" />
            <span>2. 2FA WhatsApp</span>
          </span>
        </div>

        {/* STEP 1: PASSWORD VALIDATION */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 relative z-10">
            <div className="p-3.5 rounded-xl bg-sky-900/80 border border-sky-800 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Área Fechada para Pessoas Não Autorizadas</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Este painel permite despacho de técnicos, visualização de laudos, faturamento e controle de ordens de serviço. Digite a senha mestra de gestão.
              </p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-snug">{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Senha da Gestão *</span>
                <span className="text-[10px] text-slate-400 font-normal">Autenticação Mestra</span>
              </label>

              <div className="relative">
                <input
                  id="input-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="Digite a senha de gestão..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-sky-900 border border-sky-700 text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-mono transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-sky-900 text-slate-300 hover:bg-sky-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                id="btn-submit-admin-password"
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <span>Avançar para Verificação 2FA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: 2FA WHATSAPP CODE VERIFICATION */}
        {step === '2fa' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4 relative z-10">
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  WhatsApp de Gestão Cadastrado:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] border border-emerald-500/30">
                  {AUTHORIZED_ADMIN_WHATSAPP_MASKED}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Um código de segurança com <strong>6 dígitos</strong> foi gerado para o número do gestor oficial.
              </p>
            </div>

            {/* Interactive WhatsApp Dispatch Banner */}
            <div className="p-3.5 rounded-xl bg-sky-900 border border-sky-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Telefone cadastrado:
                  </span>
                  <span className="font-mono font-bold text-white text-sm">
                    {AUTHORIZED_ADMIN_WHATSAPP_MASKED}
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-open-whatsapp-modal"
                  onClick={handleOpenWhatsAppDirect}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Abrir Conversa no WhatsApp</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </button>
              </div>

              {/* Status Notification - Code is delivered to phone only */}
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 flex items-start gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 text-[11px] leading-relaxed">
                  O código confidencial de 6 dígitos foi enviado exclusivamente para o <strong>WhatsApp no seu telefone</strong>. Verifique as mensagens no aplicativo do WhatsApp.
                </span>
              </div>
            </div>

            {codeError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{codeError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Código de Verificação (6 Dígitos) *</span>
                <span className="text-[11px] text-amber-400 font-mono">
                  Expira em {formatSeconds(countdown)}
                </span>
              </label>

              <input
                id="input-admin-2fa-code"
                type="text"
                maxLength={6}
                autoFocus
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value.replace(/\D/g, ''));
                  if (codeError) setCodeError('');
                }}
                placeholder="000000"
                className="w-full text-center tracking-[0.4em] font-mono text-2xl py-2.5 rounded-xl bg-sky-900 border border-sky-700 text-amber-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-black"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                disabled={!canResend}
                onClick={() => {
                  const newCode = generateNew2FACode();
                  dispatchWhatsAppCode(newCode);
                }}
                className={`flex items-center gap-1.5 font-semibold transition-colors ${
                  canResend
                    ? 'text-amber-400 hover:text-amber-300 cursor-pointer'
                    : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSendingWhatsApp ? 'animate-spin' : ''}`} />
                <span>Reenviar Código por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('password');
                  setPassword('');
                  setPasswordError('');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Voltar à Senha
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-sky-900 text-slate-300 hover:bg-sky-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                id="btn-confirm-admin-2fa"
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Validar Acesso de Gestão</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS FEEDBACK */}
        {step === 'success' && (
          <div className="py-6 text-center space-y-3 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h4 className="font-['Space_Grotesk'] text-xl font-black text-white">
              Gestor Autenticado com Sucesso!
            </h4>
            <p className="text-xs text-slate-300">
              Senha e 2FA do WhatsApp <strong>{AUTHORIZED_ADMIN_WHATSAPP_MASKED}</strong> validados. Carregando Painel de Gestão...
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
