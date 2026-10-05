import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Check,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  CameraOff,
  SwitchCamera,
  X,
  FileText,
  Upload
} from 'lucide-react';

export interface CameraDocumentCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose?: () => void;
  initialImage?: string | null;
  documentTypeLabel?: string;
}

export const CameraDocumentCapture: React.FC<CameraDocumentCaptureProps> = ({
  onCapture,
  onClose,
  initialImage = null,
  documentTypeLabel = 'Documento Oficial (RG, CNH, CREA ou CRT)'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Parar stream da câmera
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Erro ao parar track de vídeo:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Iniciar transmissão de vídeo com câmera traseira por padrão para documentos
  const startCameraStream = useCallback(async (desiredFacingMode: 'environment' | 'user' = 'environment') => {
    stopCameraStream();
    setIsLoadingCamera(true);
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsLoadingCamera(false);
      setCameraError('Seu navegador não possui suporte para acesso direto à câmera. Use o botão de captura nativa abaixo.');
      return;
    }

    try {
      // 1. Tentar com câmera traseira/ambiente para fotografia nítida de documentos
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: desiredFacingMode },
          width: { ideal: 1920, min: 1024 },
          height: { ideal: 1080, min: 720 }
        },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (errFirst) {
        // Fallback genérico caso a restrição de facingMode ideal falhe em desktops/laptops
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
        } catch (playErr) {
          console.warn('Vídeo autoplay iniciado:', playErr);
        }
      }

      setIsCameraActive(true);
      setCapturedImage(null);
    } catch (err: any) {
      console.error('Erro ao acessar câmera para documento:', err);
      let msg = 'Não foi possível acessar a câmera do dispositivo.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permissão de acesso à câmera negada. Autorize o uso da câmera nas configurações ou use a câmera nativa.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Nenhuma câmera detectada neste dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'A câmera já está em uso por outro aplicativo ou aba.';
      }
      setCameraError(msg);
    } finally {
      setIsLoadingCamera(false);
    }
  }, [stopCameraStream]);

  // Alternar entre câmera traseira e frontal
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCameraStream(nextMode);
  };

  // Inicializar câmera ao abrir
  useEffect(() => {
    if (!capturedImage) {
      startCameraStream(facingMode);
    }
    return () => {
      stopCameraStream();
    };
  }, [capturedImage, facingMode, startCameraStream, stopCameraStream]);

  // Capturar foto do documento
  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    try {
      // Efeito visual de flash do obturador
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);

      const canvas = document.createElement('canvas');
      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 720;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Se for câmera frontal, espelhar
      if (facingMode === 'user') {
        ctx.translate(videoWidth, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

      // Alta qualidade para leitura de textos de documentos (0.92)
      const base64Data = canvas.toDataURL('image/jpeg', 0.92);

      stopCameraStream();
      setCapturedImage(base64Data);
    } catch (error) {
      console.error('Erro ao capturar foto do documento:', error);
      setCameraError('Erro ao capturar a imagem. Tente novamente.');
    }
  };

  // Confirmar e enviar foto capturada
  const handleConfirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      if (onClose) onClose();
    }
  };

  // Repetir fotografia
  const handleRetakePhoto = () => {
    setCapturedImage(null);
    startCameraStream(facingMode);
  };

  // Captura nativa via input file
  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        stopCameraStream();
        setCapturedImage(reader.result);
        setCameraError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl bg-sky-900 border border-emerald-500/40 p-4 sm:p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header do Módulo de Câmera */}
      <div className="flex items-center justify-between border-b border-sky-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs sm:text-sm">
              Fotografar Documentação com Câmera
            </h4>
            <p className="text-[11px] text-slate-400">
              {documentTypeLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!capturedImage && isCameraActive && (
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="px-2.5 py-1.5 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-sky-700 transition-colors cursor-pointer"
              title="Alternar entre câmera traseira e frontal"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Alternar Câmera</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-sky-900 transition-colors"
              title="Fechar câmera"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Visor da Câmera ou Preview da Foto Capturada */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[360px] bg-sky-950 rounded-xl overflow-hidden border border-sky-800 flex items-center justify-center shadow-inner">
        
        {/* Flash visual do obturador */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200 pointer-events-none" />
        )}

        {/* 1. Preview da Foto Capturada */}
        {capturedImage ? (
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Foto do documento capturado"
              className="w-full h-full object-contain bg-sky-950"
            />
            <div className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-sm border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-lg">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Foto do Documento Capturada</span>
            </div>
          </div>
        ) : (
          /* 2. Visor em Tempo Real com Moldura de Documento */
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />

            {/* Moldura Guia de Enquadramento de Documento (RG / CNH / CREA) */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                {/* Retângulo Guia */}
                <div className="w-[88%] h-[78%] rounded-xl border-2 border-dashed border-emerald-400/80 bg-emerald-500/5 relative flex flex-col justify-between p-3">
                  {/* Cantoneiras Reforçadas */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  <div className="text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950/75 backdrop-blur-sm text-[10px] sm:text-xs font-bold text-emerald-300 border border-emerald-500/40">
                      <FileText className="w-3 h-3 text-emerald-400" />
                      Enquadre a frente ou verso do documento aqui
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="inline-block px-2 py-0.5 rounded bg-sky-950/70 backdrop-blur-sm text-[10px] text-slate-300">
                      Evite sombras, reflexos e mantenha os dados legíveis
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Spinner de Carregamento da Câmera */}
            {isLoadingCamera && (
              <div className="absolute inset-0 bg-sky-900/90 flex flex-col items-center justify-center gap-2 text-emerald-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-xs font-semibold text-slate-300">Iniciando câmera do dispositivo...</span>
              </div>
            )}

            {/* Mensagem de Erro de Câmera */}
            {cameraError && (
              <div className="absolute inset-0 bg-sky-900/95 flex flex-col items-center justify-center p-4 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <CameraOff className="w-6 h-6" />
                </div>
                <div className="max-w-xs space-y-1">
                  <h5 className="font-bold text-white text-xs">Acesso à Câmera Indisponível</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{cameraError}</p>
                </div>
                
                {/* Fallback para Câmera Nativa do Celular */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Abrir Câmera Nativa do Aparelho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startCameraStream(facingMode)}
                    className="px-3 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tentar Novamente</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Oculto para Câmera Nativa do Celular */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeFileChange}
        className="hidden"
      />

      {/* Barra de Ações & Botões de Controle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {capturedImage ? (
          /* Ações pós-captura */
          <div className="w-full flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRetakePhoto}
              className="px-4 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Tirar Outra Foto</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmPhoto}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Usar Esta Foto do Documento</span>
            </button>
          </div>
        ) : (
          /* Ações durante a câmera ativa */
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5">
            
            {/* Atalho para Câmera do Celular ou Arquivo */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-sky-950 hover:bg-sky-900 text-slate-300 text-xs font-medium border border-sky-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Abrir app de câmera do celular ou escolher foto"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Câmera Nativa / Galeria</span>
              </button>
            </div>

            {/* Botão de Disparo / Fotografar */}
            <button
              type="button"
              disabled={!isCameraActive || isLoadingCamera}
              onClick={handleCapturePhoto}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-200 animate-pulse" />
              <span>Fotografar Documento Agora</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
