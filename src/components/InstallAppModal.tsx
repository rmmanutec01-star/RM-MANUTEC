import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Share2,
  Copy,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Zap,
  HardHat,
  Laptop,
  Apple,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  getAppShareUrl,
  getAppShareMessage,
  shareAppNative,
  PLAY_STORE_PACKAGE_INFO
} from '../lib/shareUtils';
import { RM_CONTACT_INFO } from '../data/servicesData';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc' | 'dev'>('android');
  const [hasCopied, setHasCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const appUrl = getAppShareUrl();

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstallSuccess(true);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If no native prompt is available (e.g. already installed or iOS), trigger Web Share or show guide
      shareAppNative();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = getAppShareMessage();
    const wppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(wppUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0b0f17] border border-emerald-500/40 shadow-2xl text-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-sky-900 to-sky-900 border-b border-emerald-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Google Play • PWA • Android
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Pronto p/ Instalação
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Instalar Aplicativo Oficial
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-sky-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">

          {/* App Card Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950 to-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-sky-950 border-2 border-emerald-500/50 p-1 flex items-center justify-center shadow-xl shrink-0 overflow-hidden">
                <img
                  src="/icon-192.svg"
                  alt="RM Manutec Icon"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-white">
                  RM Manutec Oficial
                </h4>
                <p className="text-xs text-slate-400">
                  Engenharia, Elétrica & Ar-Condicionado 24h
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Salvador e RMS
                  </span>
                  <span className="text-[10px] text-slate-500">•</span>
                  <span className="text-[10px] text-slate-400">v1.2.0</span>
                </div>
              </div>
            </div>

            {deferredPrompt && !installSuccess && (
              <button
                id="btn-pwa-install-now"
                onClick={handleNativeInstall}
                disabled={isInstalling}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Agora</span>
              </button>
            )}
          </div>

          {/* Installation Tab Selector */}
          <div className="flex rounded-xl bg-sky-950/90 border border-sky-800 p-1">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android / Play</span>
            </button>

            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iPhone / iOS</span>
            </button>

            <button
              onClick={() => setActiveTab('pc')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'pc'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Computador</span>
            </button>

            <button
              onClick={() => setActiveTab('dev')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'dev'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Play Store Info</span>
            </button>
          </div>

          {/* Tab 1: Android & Play Store */}
          {activeTab === 'android' && (
            <div className="p-4 rounded-2xl bg-sky-950/60 border border-sky-800 space-y-3.5">
              <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Como Instalar no seu Android:
              </h5>

              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/40">
                    1
                  </span>
                  <span>
                    Toque no botão <strong className="text-white">"Instalar no Celular"</strong> abaixo ou no banner de instalação que aparece na parte inferior da tela.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/40">
                    2
                  </span>
                  <span>
                    Caso o banner não apareça automaticamente, toque nos <strong className="text-white">3 pontinhos (⋮)</strong> no canto superior do navegador Chrome/Samsung.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/40">
                    3
                  </span>
                  <span>
                    Selecione <strong className="text-white">"Instalar aplicativo"</strong> ou <strong className="text-white">"Adicionar à tela inicial"</strong>. O app abrirá em tela cheia com ícone exclusivo!
                  </span>
                </li>
              </ol>

              <div className="pt-2">
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar no Celular Agora</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: iPhone / iOS */}
          {activeTab === 'ios' && (
            <div className="p-4 rounded-2xl bg-sky-950/60 border border-sky-800 space-y-3.5">
              <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Apple className="w-4 h-4 text-emerald-400" />
                Como Instalar no iPhone / iPad (Safari):
              </h5>

              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/40">
                    1
                  </span>
                  <span>
                    Abra este link no navegador <strong className="text-white">Safari</strong> do seu iPhone.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/40">
                    2
                  </span>
                  <span>
                    Toque no botão <strong className="text-white">Compartilhar</strong> (ícone de um quadrado com uma seta apontando para cima) na barra inferior do Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/40">
                    3
                  </span>
                  <span>
                    Role as opções e toque em <strong className="text-white">"Adicionar à Tela de Início"</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/40">
                    4
                  </span>
                  <span>
                    Confirme tocando em <strong className="text-white">"Adicionar"</strong> no canto superior direito.
                  </span>
                </li>
              </ol>
            </div>
          )}

          {/* Tab 3: Computador */}
          {activeTab === 'pc' && (
            <div className="p-4 rounded-2xl bg-sky-950/60 border border-sky-800 space-y-3.5">
              <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-emerald-400" />
                Como Instalar no Computador / Desktop (Chrome / Edge):
              </h5>

              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/40">
                    1
                  </span>
                  <span>
                    No Google Chrome ou Microsoft Edge, localize o ícone de <strong className="text-white">computador com seta para baixo (Instalar)</strong> no final da barra de endereços URL.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/40">
                    2
                  </span>
                  <span>
                    Clique em <strong className="text-white">"Instalar RM Manutec"</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/40">
                    3
                  </span>
                  <span>
                    O aplicativo será fixado na sua barra de tarefas e área de trabalho, funcionando como um software nativo ultrarrápido.
                  </span>
                </li>
              </ol>
            </div>
          )}

          {/* Tab 4: Play Store / TWA Info */}
          {activeTab === 'dev' && (
            <div className="p-4 rounded-2xl bg-sky-950/60 border border-sky-800 space-y-3 text-xs">
              <h5 className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Configuração para Google Play Store & TWA
              </h5>

              <div className="space-y-2 text-slate-300 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-sky-900 border border-sky-800 flex justify-between">
                  <span className="text-slate-400">Package ID:</span>
                  <span className="text-emerald-400 font-bold">{PLAY_STORE_PACKAGE_INFO.packageName}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-900 border border-sky-800 flex justify-between">
                  <span className="text-slate-400">Manifest PWA:</span>
                  <span className="text-emerald-400">/manifest.json (Standalone)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-900 border border-sky-800 flex justify-between">
                  <span className="text-slate-400">Service Worker:</span>
                  <span className="text-emerald-400">/sw.js (Offline & Cache)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-900 border border-sky-800 flex justify-between">
                  <span className="text-slate-400">Asset Links TWA:</span>
                  <span className="text-emerald-400">/.well-known/assetlinks.json</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                O aplicativo está 100% em conformidade com as diretrizes do Google Play Store (TWA / Bubblewrap / PWA Builder), permitindo empacotamento em APK/AAB imediato para a Play Console.
              </p>
            </div>
          )}

          {/* Shared Link Card */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Link Canônico do Aplicativo</span>
              {hasCopied && (
                <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Link copiado!
                </span>
              )}
            </label>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-950 border border-sky-800 font-mono text-xs">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="w-full bg-transparent text-emerald-400 focus:outline-none select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-200 text-xs font-bold border border-sky-700 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                title="Copiar Link"
              >
                {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-sky-950 border-t border-sky-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-4 py-2.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
