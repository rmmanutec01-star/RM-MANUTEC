import React, { useState, useRef } from 'react';
import { ServiceRequest } from '../types';
import { getTrackingShareUrl } from '../lib/shareUtils';
import {
  buildWriterToAdminFileNotification,
  dispatchWhatsAppNotification
} from '../lib/whatsappNotifications';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Trash2,
  Plus,
  ShieldCheck,
  User,
  Share2,
  FileCheck,
  Sparkles
} from 'lucide-react';

interface CompletionPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  canUpload?: boolean;
  onSavePhotos?: (requestId: string, photos: string[], note?: string) => void;
}

export const CompletionPhotosModal: React.FC<CompletionPhotosModalProps> = ({
  isOpen,
  onClose,
  request,
  canUpload = false,
  onSavePhotos
}) => {
  if (!isOpen || !request) return null;

  const [photosList, setPhotosList] = useState<string[]>(request.completionPhotos || []);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [note, setNote] = useState<string>(request.completionNote || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const samplePresets = [
    {
      title: 'Quadro & Elétrica Concluída',
      url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: 'Climatização & Teste de Pressão',
      url: 'https://images.unsplash.com/photo-1631545806652-32b0f44f6f7d?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: 'Tubulação & Hidráulica Nova',
      url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: 'Acabamento & Pintura Finalizada',
      url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&auto=format&fit=crop&q=80'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const resultStr = event.target.result as string;
          setPhotosList((prev) => [...prev, resultStr]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) {
      e.target.value = '';
    }
  };

  const handleAddPreset = (url: string) => {
    if (!photosList.includes(url)) {
      setPhotosList((prev) => [...prev, url]);
      setSelectedPhotoIndex(photosList.length);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotosList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (selectedPhotoIndex >= indexToRemove && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex((prev) => prev - 1);
    }
  };

  const handleSave = () => {
    if (!request || !onSavePhotos) return;
    setIsSaving(true);
    onSavePhotos(request.id, photosList, note);

    // Dispara a conversa no WhatsApp do Administrador com as fotos anexadas
    try {
      const notif = buildWriterToAdminFileNotification({
        senderName: request.clientName || 'Solicitante / Técnico RM Manutec',
        senderPhone: request.clientPhone,
        senderRole: 'tecnico',
        protocolNumber: request.protocolNumber,
        serviceName: request.serviceName,
        fileName: `Evidencias_OS_${request.protocolNumber}.jpg`,
        fileType: 'foto',
        description: note || `Anexadas ${photosList.length} foto(s) de vistoria / conclusão técnica.`
      });

      dispatchWhatsAppNotification({
        type: 'arquivo_transmitido',
        targetRole: 'admin',
        recipientName: 'Administrador RM Manutec',
        recipientPhone: notif.targetPhone,
        recipientPhoneFormatted: '(71) 99649-2354',
        messageText: notif.message,
        whatsappUrl: notif.url,
        status: 'disparado'
      }, true);
    } catch (err) {
      console.warn('Erro ao abrir WhatsApp das fotos:', err);
    }

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2500);
    }, 400);
  };

  const activePhoto = photosList[selectedPhotoIndex] || photosList[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div
        id="modal-completion-photos"
        className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl bg-[#0f131a] border border-sky-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-200"
      >
        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-950 via-[#161c26] to-sky-900 border-b border-sky-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold text-white leading-tight">
                  Fotos de Conclusão de Serviço
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Laudo Técnico
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Protocolo: <span className="font-mono text-amber-400 font-bold">{request.protocolNumber}</span> • {request.serviceName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-sky-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Info Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-sky-900/70 border border-sky-800/80 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-900 flex items-center justify-center text-rose-400 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente</span>
                <p className="font-bold text-white">{request.clientName}</p>
                <p className="text-[11px] text-slate-400">{request.address.neighborhood} - {request.address.city}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-900 flex items-center justify-center text-amber-400 shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Responsável Técnico</span>
                <p className="font-bold text-white">{request.assignedTechnician?.name || 'Equipe RM Manutec'}</p>
                <p className="text-[11px] text-slate-400">{request.assignedTechnician?.role || 'Vistoria Oficial'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Garantia RM</span>
                <p className="font-bold text-white">90 Dias de Garantia</p>
                <p className="text-[11px] text-slate-400">{request.completedAt || 'Serviço Concluído'}</p>
              </div>
            </div>
          </div>

          {/* Main Photo Viewer or Empty State */}
          {photosList.length > 0 ? (
            <div className="space-y-4">
              {/* Primary Large Photo Frame */}
              <div className="relative rounded-2xl overflow-hidden bg-sky-900 border border-sky-800 shadow-2xl flex items-center justify-center min-h-[280px] sm:min-h-[380px] max-h-[460px]">
                <img
                  src={activePhoto}
                  alt={`Evidência de conclusão ${selectedPhotoIndex + 1}`}
                  className="w-full h-full object-contain max-h-[440px] rounded-xl"
                />

                {/* Overlay Badge */}
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-sky-950/75 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Foto {selectedPhotoIndex + 1} de {photosList.length}</span>
                </div>

                {/* Delete button (if canUpload) */}
                {canUpload && (
                  <button
                    onClick={() => handleRemovePhoto(selectedPhotoIndex)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-rose-600/85 hover:bg-rose-600 text-white backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5 text-xs font-bold"
                    title="Excluir esta foto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Remover</span>
                  </button>
                )}
              </div>

              {/* Thumbnails Strip */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
                {photosList.map((photo, idx) => {
                  const isSelected = selectedPhotoIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                        isSelected
                          ? 'border-emerald-400 ring-2 ring-emerald-400/30 scale-105 shadow-lg shadow-emerald-500/20'
                          : 'border-sky-800 opacity-70 hover:opacity-100 hover:border-sky-600'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-sky-950/80 text-[10px] font-bold text-white">
                        #{idx + 1}
                      </span>
                    </div>
                  );
                })}

                {/* Add more button in strip */}
                {canUpload && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-sky-700 hover:border-emerald-500/70 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-300 text-xs font-semibold"
                  >
                    <Plus className="w-5 h-5 text-emerald-400" />
                    <span>+ Foto</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-sky-900/60 border border-dashed border-sky-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-950 border border-sky-800 flex items-center justify-center mx-auto text-slate-500">
                <ImageIcon className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Nenhuma foto de conclusão anexada</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Registre fotos do serviço finalizado para comprovação técnica, garantia de qualidade e envio ao cliente.
                </p>
              </div>

              {canUpload && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tirar Foto com a Câmera</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 text-xs font-bold border border-sky-700 flex items-center gap-2 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Selecionar do Aparelho</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upload Controls & Presets (when canUpload is true) */}
          {canUpload && (
            <div className="space-y-3 pt-4 border-t border-sky-800">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  Capturar & Adicionar Evidências Técnicas:
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Câmera</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 border border-sky-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Galeria</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Samples for Testing/Demo */}
              <div className="p-3 rounded-xl bg-sky-900/70 border border-sky-800/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Modelos rápidos de fotos para demonstração:
                </span>
                <div className="flex flex-wrap gap-2">
                  {samplePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddPreset(preset.url)}
                      className="px-2.5 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-700 text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Technician Note input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Laudo Técnico & Observações Finais de Conclusão:
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Descreva os serviços concluídos, testes realizados (pressão, voltagem, estanqueidade) e peças instaladas..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sky-900 border border-sky-700 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Technician Note Read-Only (when cannot upload and note exists) */}
          {!canUpload && request.completionNote && (
            <div className="p-4 rounded-2xl bg-sky-900/80 border border-sky-800 space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Laudo do Técnico Concludente:
              </span>
              <p className="text-slate-200 leading-relaxed">
                {request.completionNote}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-sky-950 border-t border-sky-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Documento oficial RM Manutec • Salvador - BA</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                const trackingUrl = getTrackingShareUrl(request.protocolNumber);
                const text = `*Laudo Fotográfico de Conclusão - RM Manutec*\nProtocolo: ${request.protocolNumber}\nServiço: ${request.serviceName}\nCliente: ${request.clientName}\nStatus: Concluído com Sucesso\nFotos Anexadas: ${photosList.length}\n\nAcesse o laudo oficial pelo link:\n${trackingUrl}`;
                if (typeof navigator !== 'undefined' && navigator.share) {
                  navigator.share({
                    title: `Laudo Conclusão RM Manutec • ${request.protocolNumber}`,
                    text,
                    url: trackingUrl
                  }).catch(() => {});
                } else {
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 text-xs font-semibold border border-sky-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compartilhar Laudo</span>
            </button>

            {canUpload ? (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>✓ Fotos Salvas com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSaving ? 'Salvando...' : 'Salvar Fotos & Laudo'}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-white text-xs font-bold border border-sky-700"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
