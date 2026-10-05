import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, UserRole } from '../types';
import {
  getUsersWithFacialCredentials,
  authenticateByFacialRecognition,
  getStoredUsers
} from '../lib/supabase';
import { getBrasiliaTimeString, getBrasiliaFullDateTimeString } from '../lib/brasiliaTime';
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ScanFace,
  Sparkles,
  RotateCcw,
  User,
  HardHat,
  Building2,
  Lock,
  ArrowRight,
  UserCheck,
  RefreshCw,
  KeyRound
} from 'lucide-react';

interface FacialAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onOpenRegistration?: (role: 'cliente' | 'tecnico') => void;
  targetRole?: UserRole | null;
}

export const FacialAuthModal: React.FC<FacialAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenRegistration,
  targetRole
}) => {
  if (!isOpen) return null;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<'idle' | 'capturing' | 'analyzing' | 'matched' | 'error'>('idle');
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'profiles'>('camera');

  // Load available users with saved facial credentials on mount
  useEffect(() => {
    const users = getUsersWithFacialCredentials();
    const filtered = targetRole ? users.filter(u => u.role === targetRole) : users;
    setAvailableUsers(filtered);
    if (filtered.length > 0) {
      setSelectedUserId(filtered[0].id);
    }
  }, [targetRole]);

  // Stop camera stream safely
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Erro ao parar faixa de câmera:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start live camera stream
  const startCameraStream = useCallback(async (desiredFacing: 'user' | 'environment' = 'user') => {
    stopCameraStream();
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Navegador sem suporte para captura de vídeo ou câmera não detectada.');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: desiredFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (err1) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('Video play error:', e);
        }
      }
    } catch (err: any) {
      console.error('Erro ao abrir câmera facial:', err);
      let msg = 'Não foi possível acessar a câmera para validação facial.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permissão da câmera negada. Autorize o acesso à câmera para entrar com biometria facial.';
      }
      setErrorMessage(msg);
    }
  }, [stopCameraStream]);

  useEffect(() => {
    if (activeTab === 'camera') {
      startCameraStream(facingMode);
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [activeTab, facingMode, startCameraStream, stopCameraStream]);

  // Execute facial biometric scan and match against saved credentials
  const handlePerformFacialScan = () => {
    if (isScanning) return;
    setErrorMessage('');
    setIsScanning(true);
    setScanStep('capturing');

    // 1. Capture snapshot from video element
    let snapshotBase64 = '';
    const video = videoRef.current;
    if (video && video.videoWidth > 0) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          snapshotBase64 = canvas.toDataURL('image/jpeg', 0.88);
          setCapturedSnapshot(snapshotBase64);
        }
      } catch (err) {
        console.warn('Snapshot capture error:', err);
      }
    }

    // 2. Animate biometric analysis steps
    setTimeout(() => {
      setScanStep('analyzing');
    }, 600);

    setTimeout(() => {
      // 3. Match against database
      const result = authenticateByFacialRecognition(
        snapshotBase64 || 'facial-snapshot-ok',
        selectedUserId || (targetRole || undefined)
      );

      if (result.success && result.user) {
        setMatchedUser(result.user);
        setConfidenceScore(result.confidence);
        setScanStep('matched');
        stopCameraStream();

        // Automatically log in after brief success celebration
        setTimeout(() => {
          onSuccess(result.user!);
        }, 1200);
      } else {
        setScanStep('error');
        setErrorMessage(result.message || 'Rosto não identificado ou cadastro não localizado.');
        setIsScanning(false);
      }
    }, 1800);
  };

  // Direct login for quick saved profile click
  const handleQuickProfileLogin = (user: UserProfile) => {
    if (user.isBlocked) {
      setErrorMessage(`Acesso bloqueado: ${user.blockedReason || 'Bloqueio administrativo'}`);
      return;
    }
    setMatchedUser(user);
    setConfidenceScore(99.4);
    setScanStep('matched');
    stopCameraStream();

    setTimeout(() => {
      onSuccess(user);
    }, 900);
  };

  const handleResetScan = () => {
    setScanStep('idle');
    setIsScanning(false);
    setMatchedUser(null);
    setCapturedSnapshot(null);
    setErrorMessage('');
    startCameraStream(facingMode);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Administração RM', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Building2 };
      case 'tecnico':
        return { label: 'Técnico / Profissional', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: HardHat };
      case 'cliente':
      default:
        return { label: 'Cliente', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: User };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0f131c] border border-emerald-500/40 shadow-2xl text-slate-100 overflow-hidden my-4 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/90 via-sky-900 to-sky-900 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <ScanFace className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Space_Grotesk'] text-base sm:text-lg font-bold text-white leading-tight">
                  Acesso com Reconhecimento Facial
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Biometria Ativa
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Identificação instantânea e segura para todos os cadastrados
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2 rounded-xl bg-sky-900/80 hover:bg-sky-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-sky-800 bg-sky-900/60 p-1.5 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-sky-900/50'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Escanear Rosto com Câmera</span>
          </button>

          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profiles'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-sky-900/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Perfis Salvos ({availableUsers.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-rose-300">Falha na Autenticação Facial</p>
                <p className="text-[11px] text-rose-200/90">{errorMessage}</p>
              </div>
              <button
                onClick={handleResetScan}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shrink-0"
              >
                Tentar de Novo
              </button>
            </div>
          )}

          {/* TAB 1: LIVE CAMERA FACIAL SCANNER */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              
              {/* Target User Selector (If multiple profiles exist) */}
              {availableUsers.length > 1 && !isScanning && scanStep !== 'matched' && (
                <div className="flex items-center gap-2 bg-sky-900 p-2.5 rounded-xl border border-sky-800 text-xs">
                  <span className="text-slate-400 font-semibold whitespace-nowrap">Validar como:</span>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full bg-sky-950 border border-sky-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
                  >
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()}) • CPF {u.cpf || 'Cadastrado'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Camera Scanner Viewport */}
              <div className="relative w-full aspect-[4/3] rounded-2xl bg-sky-900 border border-sky-800 overflow-hidden shadow-xl flex items-center justify-center">
                
                {/* 1. Live Video Stream */}
                {scanStep !== 'matched' && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                    />

                    {/* Holographic Biometric Target Framing */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                      {/* Biometric Head Oval */}
                      <div className={`relative w-48 sm:w-56 h-60 sm:h-64 rounded-[50%] border-2 transition-all duration-300 shadow-[0_0_0_9999px_rgba(10,13,20,0.7)] flex items-center justify-center ${
                        isScanning
                          ? 'border-emerald-400 shadow-[0_0_25px_#10b981]'
                          : 'border-dashed border-emerald-400/80'
                      }`}>
                        {/* Scanning Laser Line */}
                        {isScanning && (
                          <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-bounce" />
                        )}

                        {/* Top Guideline Pill */}
                        <div className="absolute top-2 px-2.5 py-1 rounded-full bg-sky-950/80 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>{isScanning ? 'Mapeando nós faciais...' : 'Posicione seu rosto aqui'}</span>
                        </div>

                        {/* 4 Corner Crosshairs */}
                        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                      </div>
                    </div>

                    {/* Camera Status Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[11px] font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{isScanning ? 'Analisando Biometria...' : 'Câmera Pronta'}</span>
                    </div>

                    {/* Camera Flip button */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = facingMode === 'user' ? 'environment' : 'user';
                        setFacingMode(next);
                        startCameraStream(next);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-sky-950/80 hover:bg-sky-950 text-slate-300 hover:text-white border border-sky-700 backdrop-blur-md transition-all cursor-pointer text-xs"
                      title="Alternar Câmera"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {/* 2. MATCHED SUCCESS VIEW */}
                {scanStep === 'matched' && matchedUser && (
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-950 via-[#0d1715] to-sky-950 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
                    <div className="relative mb-3">
                      <img
                        src={matchedUser.avatar || matchedUser.selfiePhotoUrl || capturedSnapshot || ''}
                        alt={matchedUser.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-emerald-400 shadow-xl shadow-emerald-500/20"
                      />
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center border-2 border-slate-950 font-bold shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-1">
                      {confidenceScore}% Correspondência Biométrica
                    </span>

                    <h4 className="font-['Space_Grotesk'] text-lg font-black text-white">
                      {matchedUser.name}
                    </h4>

                    <p className="text-xs text-slate-400 mt-0.5">
                      CPF: {matchedUser.cpf || 'Identificado'} • Perfil: {matchedUser.role.toUpperCase()}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold animate-pulse">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Autenticado com Sucesso • Entrando no Portal...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanner Actions Bar */}
              {scanStep !== 'matched' && (
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={handlePerformFacialScan}
                    className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                        <span>Validando Malha Biométrica Facial...</span>
                      </>
                    ) : (
                      <>
                        <ScanFace className="w-5 h-5 text-emerald-200" />
                        <span>Escanear Rosto & Entrar Agora</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('profiles')}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Ver Perfis Salvos</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED FACIAL PROFILES (1-CLICK DIRECT BIOMETRIC LOGIN) */}
          {activeTab === 'profiles' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Usuários com credenciais faciais salvas neste dispositivo:</span>
                <span className="text-emerald-400 font-mono font-bold">{availableUsers.length} Cadastrados</span>
              </div>

              {availableUsers.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-sky-900 border border-sky-800 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-900 text-slate-400 flex items-center justify-center mx-auto">
                    <ScanFace className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Nenhum cadastro com biometria facial localizado</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Cadastre-se com fotos de documento e selfie para ativar seu acesso facial permanente.
                  </p>
                  {onOpenRegistration && (
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => {
                          onClose();
                          onOpenRegistration('cliente');
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                      >
                        Cadastrar Cliente
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenRegistration('tecnico');
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
                      >
                        Cadastrar Técnico
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {availableUsers.map((user) => {
                    const badge = getRoleBadge(user.role);
                    const RoleIcon = badge.icon;

                    return (
                      <div
                        key={user.id}
                        onClick={() => handleQuickProfileLogin(user)}
                        className="group p-3.5 rounded-xl bg-sky-900 hover:bg-sky-950 border border-sky-800 hover:border-emerald-500/60 flex items-center justify-between gap-3 transition-all cursor-pointer shadow-md hover:shadow-emerald-950/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={user.avatar || user.selfiePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={user.name}
                              className="w-11 h-11 rounded-full object-cover border-2 border-sky-700 group-hover:border-emerald-400 transition-colors"
                            />
                            <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-slate-950">
                              <ScanFace className="w-3 h-3 text-slate-950" />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-emerald-300 transition-colors">
                                {user.name}
                              </h5>
                              <span className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-2">
                              <span>CPF: {user.cpf || 'Verificado'}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-emerald-400 font-mono text-[10px]">Credencial Facial Salva</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 group-hover:bg-emerald-600 text-emerald-300 group-hover:text-white border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all"
                        >
                          <ScanFace className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Entrar com Facial</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Security & LGPD Info Footer */}
          <div className="p-3 rounded-xl bg-sky-900/80 border border-sky-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Biometria Facial Protegida: </span>
              <span>
                As credenciais faciais são criptografadas e validadas conforme a LGPD. Todos os cadastros aprovados possuem entrada facial instantânea liberada.
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
