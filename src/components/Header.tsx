import React from 'react';
import { LogoRM } from './LogoRM';
import { UserProfile } from '../types';
import {
  Wrench,
  Headset,
  ClipboardList,
  Phone,
  MessageCircle,
  Mail,
  PlusCircle,
  LogOut,
  User,
  Zap,
  HardHat,
  Building2,
  ChevronDown,
  Download,
  Share2,
  Radio,
  RefreshCw
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  onOpenServiceRequest: () => void;
  onOpenContact: (channel?: 'whatsapp' | 'call' | 'email') => void;
  onOpenTracking: () => void;
  onOpenSupport: () => void;
  onSwitchRole: () => void;
  onOpenInstallModal?: () => void;
  onShareApp?: () => void;
  requestsCount: number;
  connectedDevicesCount?: number;
  realtimeStatus?: 'connected' | 'connecting' | 'disconnected';
  onForceSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenServiceRequest,
  onOpenContact,
  onOpenTracking,
  onOpenSupport,
  onSwitchRole,
  onOpenInstallModal,
  onShareApp,
  requestsCount,
  connectedDevicesCount = 1,
  realtimeStatus = 'connected',
  onForceSync
}) => {
  const getRoleBadge = () => {
    switch (user.role) {
      case 'cliente':
        return { label: 'Cliente', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: User };
      case 'tecnico':
        return { label: 'Técnico Credenciado', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: HardHat };
      case 'admin':
        return { label: 'Administração', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Building2 };
      default:
        return { label: 'Visitante', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: User };
    }
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

  return (
    <header className="sticky top-0 z-40 bg-sky-950/95 backdrop-blur-xl border-b border-sky-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24 gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onSwitchRole}>
            <LogoRM size="md" />
            <div className="hidden lg:block border-l border-sky-800 pl-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Plantão 24 Horas
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Engenharia, Reparos & Climatização
              </p>
            </div>
          </div>

          {/* Action Hub - Solicitar Serviço, Falar no WhatsApp/Ligar/E-mail, Ver Histórico */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* 1. Solicitar Serviço (Only shown in client/default mode) */}
            {user.role === 'cliente' && (
              <button
                id="btn-header-solicitar"
                onClick={onOpenServiceRequest}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/25 transition-all duration-200 active:scale-95 shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden xs:inline">Solicitar Serviço</span>
                <span className="xs:hidden">Solicitar</span>
              </button>
            )}

            {/* 2. Falar no WhatsApp / Ligar / E-mail */}
            <button
              id="btn-header-contatos"
              onClick={() => onOpenContact()}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-sky-900/90 hover:bg-sky-800/90 text-slate-200 hover:text-white text-xs sm:text-sm font-medium border border-sky-700/70 transition-all active:scale-95 shrink-0"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">WhatsApp / Ligar / E-mail</span>
              <span className="md:hidden">Contatos</span>
            </button>

            {/* 3. Ver Histórico de Solicitações */}
            <button
              id="btn-header-historico"
              onClick={onOpenTracking}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-sky-900/90 hover:bg-sky-800/90 text-slate-200 hover:text-white text-xs sm:text-sm font-medium border border-sky-700/70 transition-all active:scale-95 relative shrink-0"
            >
              <ClipboardList className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Histórico</span>
              {requestsCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {requestsCount}
                </span>
              )}
            </button>

            {/* 4. Instalar App (Google Play / PWA) */}
            {onOpenInstallModal && (
              <button
                id="btn-header-install-app"
                onClick={onOpenInstallModal}
                title="Instalar Aplicativo Oficial (Play Store / PWA)"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs sm:text-sm font-bold transition-all active:scale-95 shrink-0 cursor-pointer shadow-sm shadow-emerald-500/10"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="hidden xl:inline">Instalar App</span>
                <span className="xl:hidden">App</span>
              </button>
            )}

            {/* 5. Compartilhar App */}
            {onShareApp && (
              <button
                id="btn-header-share-app"
                onClick={onShareApp}
                title="Compartilhar Link do Aplicativo"
                className="p-2 sm:p-2.5 rounded-xl bg-sky-900/90 hover:bg-sky-800 text-slate-300 hover:text-white border border-sky-700/70 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
              </button>
            )}

            {/* Suporte em tempo real chat icon */}
            <button
              id="btn-header-suporte"
              onClick={onOpenSupport}
              title="Suporte Online - Supervisão Manutec"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <Headset className="w-4 h-4 text-orange-400 animate-pulse" />
              <span>Suporte Online</span>
            </button>

            {/* Sincronização em Tempo Real de Todos os Aparelhos */}
            <div
              id="badge-header-sync-status"
              onClick={onForceSync}
              title="Sincronização em tempo real ativa: qualquer atualização feita neste ou em outro aparelho atualiza todos os sites abertos instantaneamente. Clique para sincronizar agora."
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold cursor-pointer transition-all active:scale-95"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>
                {connectedDevicesCount > 1 
                  ? `${connectedDevicesCount} aparelhos conectados` 
                  : 'Tempo Real Ativo'}
              </span>
              {onForceSync && (
                <RefreshCw className="w-3 h-3 text-emerald-400/80 hover:rotate-180 transition-transform duration-500" />
              )}
            </div>

            {/* User Profile & Role Switcher */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-sky-800">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-sky-700"
                />
                <div className="hidden xl:block text-left">
                  <span className="text-xs font-bold text-white block leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium border ${roleBadge.color}`}>
                    <RoleIcon className="w-2.5 h-2.5" />
                    {roleBadge.label}
                  </span>
                </div>
              </div>

              <button
                id="btn-header-switch-access"
                onClick={onSwitchRole}
                title="Trocar tipo de acesso (Cliente / Técnico / Admin)"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-sky-900 transition-colors text-xs flex items-center gap-1"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span className="hidden 2xl:inline text-[11px]">Sair</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

