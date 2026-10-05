import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Check,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  CameraOff
} from 'lucide-react';
import { saveSelfieToVault } from '../lib/supabase';

export interface CameraSelfieCaptureProps {
  onCapture: (base64Image: string) => void;
  onClear?: () => void;
  initialImage?: string | null;
  className?: string;
  roleLabel?: string;
  userName?: string;
  userRole?: 'cliente' | 'tecnico' | 'admin' | 'empresa_cnpj';
  userDocument?: string;
  source?: 'cadastro_cliente_pf' | 'cadastro_empresa_cnpj' | 'cadastro_tecnico' | 'login_biometrico' | 'solicitacao_servico' | 'auditoria_seguranca' | 'perfil_usuario';
}

export const CameraSelfieCapture: React.FC<CameraSelfieCaptureProps> = ({
  onCapture,
  onClear,
  initialImage = null,
  className = '',
  roleLabel = 'Selfie Facial',
  userName,
  userRole = 'cliente',
  userDocument,
  source = 'solicitacao_servico'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Parar todas as faixas do stream para desligar o LED e liberar o dispositivo
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Erro ao interromper track de vídeo:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Iniciar transmissão de vídeo via navigator.mediaDevices.getUserMedia
  const startCameraStream = useCallback(async (desiredFacingMode: 'user' | 'environment' = 'user') => {
    stopCameraStream();
    setIsLoadingCamera(true);
    setCameraError(null);

    // Verificar suporte da API no navegador
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsLoadingCamera(false);
      setCameraError('Seu navegador não possui suporte para acesso direto à câmera. Use um navegador moderno com conexão segura (HTTPS).');
      return;
    }

    try {
      // 1. Tentar primeiro com facingMode: 'user' (câmera frontal de selfie)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: desiredFacingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (errFirst) {
        // Fallback genérico caso a restrição de facingMode falhe em desktops/webcams simples
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Garantir reprodução no iOS e Android
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Vídeo autoplay iniciado:', playErr);
        }
      }

      setIsCameraActive(true);
      setCapturedImage(null);
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      let msg = 'Não foi possível acessar a câmera do dispositivo.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permissão de acesso à câmera negada. Por favor, autorize o uso da câmera nas configurações do seu navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Nenhuma câmera encontrada neste dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'A câmera já está sendo usada por outro aplicativo ou aba.';
      }
      setCameraError(msg);
    } finally {
      setIsLoadingCamera(false);
    }
  }, [stopCameraStream]);

  // Inicialização automática do fluxo ao carregar
  useEffect(() => {
    if (!capturedImage) {
      startCameraStream('user');
    }

    // Cleanup: Desligar fisicamente a câmera ao desmontar o componente
    return () => {
      stopCameraStream();
    };
  }, [capturedImage, startCameraStream, stopCameraStream]);

  // Captura instantânea do frame atual no elemento <canvas>
  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Se for câmera frontal (selfie), espelhar para corresponder à visualização natural do usuário
      if (facingMode === 'user') {
        ctx.translate(videoWidth, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

      // Converter para Base64 JPEG com qualidade otimizada (0.88)
      const base64Data = canvas.toDataURL('image/jpeg', 0.88);

      // Desligar imediatamente as tracks da câmera
      stopCameraStream();

      // Salvar imediatamente cópia auditada no cofre de selfies
      try {
        saveSelfieToVault({
          userName: userName || 'Usuário RM Manutec',
          userRole: (userRole || 'cliente') as any,
          userDocument: userDocument,
          selfieUrl: base64Data,
          source: (source || 'solicitacao_servico') as any
        });
      } catch (vaultErr) {
        console.warn('Erro ao arquivar selfie no cofre:', vaultErr);
      }

      // Atualizar estado e disparar callback
      setCapturedImage(base64Data);
      onCapture(base64Data);
    } catch (err) {
      console.error('Erro ao processar captura do frame:', err);
      setCameraError('Ocorreu um erro ao capturar a foto. Tente novamente.');
    }
  };

  // Tirar nova foto (reinicia o stream ao vivo)
  const handleRetakePhoto = () => {
    setCapturedImage(null);
    if (onClear) onClear();
    startCameraStream(facingMode);
  };

  // Alternar entre câmera frontal e traseira
  const handleToggleFacingMode = () => {
    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacingMode);
    startCameraStream(nextFacingMode);
  };

  return (
    <div className={`w-full rounded-2xl bg-sky-900 border border-sky-800 overflow-hidden shadow-xl ${className}`}>
      
      {/* Visualizador de Câmera / Imagem Capturada */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-sky-900 flex items-center justify-center overflow-hidden">
        
        {/* 1. MODO: CÂMERA AO VIVO */}
        {!capturedImage && !cameraError && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />

            {/* Máscara Guia Oval Biométrica */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="relative w-48 sm:w-56 h-60 sm:h-64 rounded-[50%] border-2 border-dashed border-emerald-400/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] flex items-center justify-center">
                {/* Linha de escaneamento animada */}
                <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse" />
                <div className="absolute top-2 px-2 py-0.5 rounded-full bg-sky-950/70 backdrop-blur-xs text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                  Enquadre seu rosto aqui
                </div>
              </div>
            </div>

            {/* Tag informativa de status da câmera */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/75 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Câmera Frontal Ativa</span>
            </div>

            {/* Botão para alternar câmera (se disponível no celular) */}
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="absolute top-3 right-3 p-2 rounded-full bg-sky-950/75 hover:bg-sky-950/90 text-slate-300 hover:text-white border border-sky-700 backdrop-blur-md transition-all cursor-pointer text-xs flex items-center gap-1"
              title="Alternar Câmera"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">Virar</span>
            </button>
          </>
        )}

        {/* 2. MODO: FOTO CAPTURADA (RESULTADO) */}
        {capturedImage && (
          <div className="relative w-full h-full flex items-center justify-center bg-sky-900">
            <img
              src={capturedImage}
              alt="Selfie Facial Capturada"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sky-950/90 via-transparent to-black/40 pointer-events-none" />

            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-[11px] font-bold">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Selfie Capturada com Sucesso</span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 text-center pointer-events-none">
              <span className="text-[11px] text-slate-300 bg-sky-950/70 px-3 py-1 rounded-full border border-sky-700">
                LED da câmera desligado • Imagem pronta para o cadastro
              </span>
            </div>
          </div>
        )}

        {/* 3. MODO: CARREGANDO CÂMERA */}
        {isLoadingCamera && (
          <div className="absolute inset-0 bg-sky-900/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-slate-300 z-10">
            <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
            <span className="text-xs font-semibold">Ativando câmera frontal de selfie...</span>
            <span className="text-[10px] text-slate-500">Por favor, autorize o acesso à câmera se solicitado.</span>
          </div>
        )}

        {/* 4. MODO: ERRO OU PERMISSÃO NEGADA */}
        {cameraError && !isLoadingCamera && (
          <div className="p-6 text-center space-y-3 z-10 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <CameraOff className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-1">Acesso à Câmera Necessário</h4>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">{cameraError}</p>
            </div>
            <button
              type="button"
              onClick={() => startCameraStream(facingMode)}
              className="px-4 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 border border-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 mx-auto transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        )}

      </div>

      {/* Barra de Ações & Controles */}
      <div className="p-3.5 sm:p-4 bg-sky-950 border-t border-sky-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300 w-full sm:w-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-[11px]">
            <span className="font-bold text-white block">{roleLabel}</span>
            <span className="text-slate-400">Autenticação biométrica de segurança</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Se ainda não capturou: Botão de Disparo */}
          {!capturedImage ? (
            <button
              type="button"
              id="btn-capture-selfie"
              onClick={handleCaptureFrame}
              disabled={!isCameraActive || isLoadingCamera}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" />
              <span>Capturar Imagem</span>
            </button>
          ) : (
            /* Se já capturou: Opção de Tirar Nova Foto */
            <button
              type="button"
              id="btn-retake-selfie"
              onClick={handleRetakePhoto}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-sky-900 hover:bg-sky-800 border border-sky-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Tirar Nova Foto</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
