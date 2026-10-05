import React from 'react';
import { ServiceItem } from '../types';
import { ServiceIcon } from './ServiceIcon';
import {
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Tag,
  ArrowRight,
  Sparkles,
  Layers,
  Wrench
} from 'lucide-react';

interface ServiceDetailsModalProps {
  service: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRequest: (service: ServiceItem, isDirectUrgency?: boolean) => void;
}

export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  service,
  isOpen,
  onClose,
  onRequest
}) => {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div 
        id="modal-service-details"
        className="relative w-full max-w-2xl rounded-2xl bg-sky-950 border border-sky-700/80 shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 bg-sky-950 border-b border-sky-800 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${service.accentGradient} bg-sky-900`}>
              <ServiceIcon name={service.iconName} className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                {service.badge}
              </span>
              <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white leading-tight">
                {service.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-sky-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Full description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Sobre o Serviço:
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {service.fullDescription}
            </p>
          </div>

          {/* Key Checklist of Included Services */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> O que está incluído em nossos atendimentos:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {service.commonServices.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-sky-950/80 border border-sky-800 flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Estimation Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-400" /> Modalidades & Orçamento Sob Medida:
            </h3>
            <div className="rounded-xl border border-sky-800 overflow-hidden">
              {service.options.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={`p-3 text-xs flex items-center justify-between gap-3 ${
                    idx % 2 === 0 ? 'bg-sky-950/60' : 'bg-sky-950/30'
                  }`}
                >
                  <span className="text-slate-300 font-medium">{opt.label}</span>
                  <span className="font-semibold text-emerald-400 shrink-0 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">{opt.priceEstimate}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 italic flex items-center gap-1">
              * Valores detalhados mediante orçamento prévio e vistoria técnica sem compromisso.
            </p>
          </div>

          {/* Warranty & Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-sky-950/50 border border-sky-800 text-center">
            <div>
              <Clock className="w-5 h-5 text-rose-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 block">Tempo Estimado</span>
              <span className="text-xs font-bold text-slate-200">{service.estimatedTime}</span>
            </div>
            <div>
              <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 block">Garantia</span>
              <span className="text-xs font-bold text-slate-200">90 Dias com NF</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 block">Disponibilidade</span>
              <span className="text-xs font-bold text-slate-200">
                {service.isEmergency24h ? '24 Horas Ativo' : 'Seg a Sáb'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-sky-950 border-t border-sky-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs sm:text-sm font-medium transition-colors"
          >
            Fechar
          </button>

          <button
            onClick={() => {
              onClose();
              onRequest(service, false);
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95"
          >
            <span>Solicitar este Serviço</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
