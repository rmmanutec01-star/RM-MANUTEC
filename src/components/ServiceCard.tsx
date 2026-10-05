import React from 'react';
import { ServiceItem } from '../types';
import { ServiceIcon } from './ServiceIcon';
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  Zap,
  Info,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface ServiceCardProps {
  service: ServiceItem;
  onRequest: (service: ServiceItem, isDirectUrgency?: boolean) => void;
  onQuickInfo: (service: ServiceItem) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onRequest,
  onQuickInfo
}) => {
  return (
    <div
      id={`card-service-${service.id}`}
      className="group relative flex flex-col justify-between rounded-2xl bg-sky-950/70 hover:bg-sky-950 border border-sky-800/80 hover:border-sky-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-rose-500/5 overflow-hidden"
    >
      {/* Top Accent bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${service.accentGradient.split(' ')[0]} ${service.accentGradient.split(' ')[1]}`} />

      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Header with Icon & Category Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${service.accentGradient} bg-sky-900/80 shadow-inner`}>
            <ServiceIcon name={service.iconName} className="w-6 h-6" />
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-sky-900/80 text-slate-300 border border-sky-700/50">
              {service.badge}
            </span>
            {service.isEmergency24h && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                <Zap className="w-3 h-3 text-rose-400" />
                24h Disponível
              </span>
            )}
          </div>
        </div>

        {/* Title & Short Description */}
        <div className="mb-4">
          <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
            {service.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {service.shortDescription}
          </p>
        </div>

        {/* Common Services Bullets */}
        <div className="mb-5 space-y-1.5 flex-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Principais Atendimentos:
          </span>
          {service.commonServices.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{item}</span>
            </div>
          ))}
          {service.commonServices.length > 3 && (
            <p className="text-[11px] text-slate-400 pl-5">
              +{service.commonServices.length - 3} outros serviços inclusos
            </p>
          )}
        </div>

        {/* Details snippet */}
        <div className="pt-3.5 pb-3 border-t border-sky-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{service.estimatedTime}</span>
          </div>
          <div className="font-semibold text-emerald-400 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>{service.basePrice}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="p-4 sm:px-6 bg-sky-900/60 border-t border-sky-800/80 flex items-center gap-2">
        <button
          id={`btn-info-${service.id}`}
          onClick={() => onQuickInfo(service)}
          className="p-2.5 rounded-xl bg-sky-900/80 hover:bg-sky-800 text-slate-300 hover:text-white transition-colors"
          title="Ver detalhes deste serviço"
        >
          <Info className="w-4 h-4" />
        </button>

        <button
          id={`btn-solicitar-${service.id}`}
          onClick={() => onRequest(service, false)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-rose-600/20 hover:shadow-rose-600/30 transition-all duration-200 active:scale-95"
        >
          <span>Solicitar Serviço</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
