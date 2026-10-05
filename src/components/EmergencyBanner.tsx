import React from 'react';
import { ShieldAlert, Zap, Phone, Clock, ArrowRight, Sparkles } from 'lucide-react';

interface EmergencyBannerProps {
  onQuickEmergency: (serviceId: string) => void;
  onOpenSupport: () => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  onQuickEmergency,
  onOpenSupport
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-950/40 via-sky-900/90 to-sky-950 border border-rose-500/30 p-5 sm:p-6 shadow-2xl">
      {/* Background ambient glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Left message */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              Atendimento Emergencial 24 Horas
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Chegada em até 45 minutos em sua região
            </span>
          </div>

          <h2 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
            Precisa de socorro imediato para vazamento, chaveiro ou destelhamento?
          </h2>
          <p className="text-sm text-slate-300">
            Nossos técnicos credenciados estão em prontidão com equipamentos de diagnóstico e peças para reparo imediato no local.
          </p>
        </div>

        {/* Quick Buttons for immediate emergencies */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            id="btn-emergency-eletrica"
            onClick={() => onQuickEmergency('eletrica')}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Elétrica / Curto-Circuito
          </button>

          <button
            id="btn-emergency-hidraulica"
            onClick={() => onQuickEmergency('hidraulica')}
            className="px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Vazamento / Hidráulica
          </button>

          <button
            id="btn-emergency-fechadura"
            onClick={() => onQuickEmergency('fechaduras')}
            className="px-3.5 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Porta Trancada / Chaveiro
          </button>

          <button
            id="btn-emergency-telhado"
            onClick={() => onQuickEmergency('telhados')}
            className="px-3.5 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            Goteiras & Telhados
          </button>

          <button
            id="btn-emergency-support-chat"
            onClick={onOpenSupport}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <span>Falar com Técnico Online</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
