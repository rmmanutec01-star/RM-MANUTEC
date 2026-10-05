import React, { useState } from 'react';
import { ServiceItem, ServiceRequest, ServiceUrgency, UserProfile, PaymentMethod } from '../types';
import { ServiceIcon } from './ServiceIcon';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Upload,
  Zap,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  FileText,
  Trash2,
  Sparkles,
  Camera,
  Image as ImageIcon,
  QrCode,
  CreditCard,
  DollarSign,
  Building2,
  Truck,
  Building,
  Wallet
} from 'lucide-react';

interface ServiceRequestModalProps {
  service: ServiceItem | null;
  initialUrgency?: ServiceUrgency;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  onSubmitRequest: (request: Omit<ServiceRequest, 'id' | 'protocolNumber' | 'createdAt' | 'status' | 'timeline'>) => void;
}

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  service,
  initialUrgency = 'normal',
  isOpen,
  onClose,
  currentUser,
  onSubmitRequest
}) => {
  if (!isOpen || !service) return null;

  const [urgency, setUrgency] = useState<ServiceUrgency>(initialUrgency);
  const [requestType, setRequestType] = useState<'vistoria_presencial' | 'orcamento_remoto'>('vistoria_presencial');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  
  // Client info
  const [clientName, setClientName] = useState(currentUser?.name || '');
  const [clientPhone, setClientPhone] = useState(currentUser?.phone || '');
  const [clientEmail, setClientEmail] = useState(currentUser?.email || '');
  const [clientCpf, setClientCpf] = useState(currentUser?.cpf || '');
  
  // Address info
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Salvador - BA');
  const [complement, setComplement] = useState('');

  // Schedule
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [preferredPeriod, setPreferredPeriod] = useState<'manha' | 'tarde' | 'noite' | 'imediato'>('manha');

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  // Photo uploads
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Invoice / Nota Fiscal state
  const [requiresInvoice, setRequiresInvoice] = useState<boolean>(true);
  const [invoiceCnpjOrCpf, setInvoiceCnpjOrCpf] = useState(currentUser?.cpf || '');
  const [invoiceCompanyName, setInvoiceCompanyName] = useState('');

  const toggleOption = (label: string) => {
    if (selectedOptions.includes(label)) {
      setSelectedOptions(selectedOptions.filter(o => o !== label));
    } else {
      setSelectedOptions([...selectedOptions, label]);
    }
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setTimeout(() => {
      // Create object URL
      const newUrls = Array.from(files).map((file: File) => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newUrls]);
      setIsUploading(false);
    }, 600);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !street.trim() || !number.trim()) {
      setErrorMsg('Por favor, preencha nome, telefone e endereço completo.');
      return;
    }
    setErrorMsg('');

    const isInspection = requestType === 'vistoria_presencial';

    // Auto-copia a chave PIX CNPJ oficial da RM Manutec para o cliente ao agendar e pagar
    if (isInspection) {
      try {
        navigator.clipboard?.writeText('64.177.147/0001-34');
      } catch (err) {
        console.warn('Clipboard auto-copy', err);
      }
    }

    onSubmitRequest({
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      clientName,
      clientPhone,
      clientEmail,
      clientCpf: clientCpf || currentUser?.cpf,
      address: {
        street,
        number,
        neighborhood,
        city,
        complement
      },
      urgency,
      requestType,
      inspectionFee: isInspection ? {
        amount: 50.00,
        isPaid: false,
        scheduledDate: preferredDate,
        scheduledPeriod: urgency === 'urgente_24h' ? 'imediato' : preferredPeriod,
        paymentMethod: isInspection ? 'pix' : paymentMethod
      } : undefined,
      paymentTypeRequested: isInspection ? 'taxa_deslocamento' : 'orcamento_servico',
      description: description || `${isInspection ? 'Vistoria, Análise e Orçamento Presencial' : 'Orçamento Remoto'} para ${service.name} (${selectedOptions.join(', ') || 'avaliação padrão'})`,
      selectedOptions: selectedOptions.length > 0 ? selectedOptions : [service.options[0]?.label || 'Vistoria & Avaliação Técnica'],
      photos,
      preferredDate,
      preferredPeriod: urgency === 'urgente_24h' ? 'imediato' : preferredPeriod,
      estimatedPrice: isInspection 
        ? 'R$ 0,00 (Taxa Vistoria: R$ 50,00 | Orçamento pelo Admin)' 
        : 'R$ 0,00 (Aguardando Orçamento pelo Admin)',
      requiresInvoice,
      invoiceCnpjOrCpf: requiresInvoice ? (invoiceCnpjOrCpf || clientCpf || undefined) : undefined,
      invoiceCompanyName: requiresInvoice ? (invoiceCompanyName || undefined) : undefined,
      paymentMethod: isInspection ? 'pix' : paymentMethod,
      paymentStatus: 'pendente'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div 
        id="modal-service-request"
        className="relative w-full max-w-3xl rounded-2xl bg-sky-950 border border-sky-700/80 shadow-2xl overflow-hidden my-6 text-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 bg-sky-950/90 border-b border-sky-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${service.accentGradient} bg-sky-900`}>
              <ServiceIcon name={service.iconName} className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-rose-400">
                Nova Solicitação de Serviço
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

        {/* Modal Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Request Type: Vistoria Presencial (R$ 50,00 Deslocamento) vs Avaliação Remota */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-950 to-sky-950 border border-sky-700/80 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm">
                  Modalidade do Atendimento / Vistoria:
                </h3>
              </div>
              <span className="text-[11px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                Regulamento Técnico
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Vistoria Presencial com R$ 50,00 de Deslocamento */}
              <button
                type="button"
                id="btn-opt-vistoria-presencial"
                onClick={() => setRequestType('vistoria_presencial')}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden ${
                  requestType === 'vistoria_presencial'
                    ? 'bg-rose-950/40 border-rose-500 text-white ring-1 ring-rose-500 shadow-xl shadow-rose-950/30'
                    : 'bg-sky-950/60 border-sky-800 text-slate-400 hover:text-slate-200 hover:border-sky-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                      requestType === 'vistoria_presencial' ? 'bg-rose-600 border-rose-400 text-white' : 'border-sky-600 bg-sky-900'
                    }`}>
                      {requestType === 'vistoria_presencial' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Vistoria & Análise Presencial no Local
                    </span>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-rose-500 text-white shadow-sm shrink-0">
                    R$ 50,00
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Técnico especializado vai até o seu imóvel para medições exatas, análise técnica estrutural e emissão do orçamento final detalhado.
                </p>

                <div className="pt-2 border-t border-sky-800/80 flex items-center justify-between text-[10px] text-rose-300 font-semibold">
                  <span>Taxa de Deslocamento: R$ 50,00</span>
                  <span className="text-amber-300">Pagamento antecipado p/ reserva</span>
                </div>
              </button>

              {/* Option 2: Avaliação Remota */}
              <button
                type="button"
                id="btn-opt-orcamento-remoto"
                onClick={() => setRequestType('orcamento_remoto')}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden ${
                  requestType === 'orcamento_remoto'
                    ? 'bg-blue-950/40 border-blue-500 text-white ring-1 ring-blue-500 shadow-xl shadow-blue-950/30'
                    : 'bg-sky-950/60 border-sky-800 text-slate-400 hover:text-slate-200 hover:border-sky-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                      requestType === 'orcamento_remoto' ? 'bg-blue-600 border-blue-400 text-white' : 'border-sky-600 bg-sky-900'
                    }`}>
                      {requestType === 'orcamento_remoto' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Orçamento Remoto por Fotos & Medidas
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-900 text-slate-300 border border-sky-700 shrink-0">
                    Sem taxa prévia
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Envie fotos e descrição detalhada do problema para triagem online pela nossa equipe de engenharia e emissão de estimativa prévia.
                </p>

                <div className="pt-2 border-t border-sky-800/80 flex items-center justify-between text-[10px] text-blue-300 font-semibold">
                  <span>Avaliação Online Preliminar</span>
                  <span className="text-slate-400">Sujeito a conferência</span>
                </div>
              </button>
            </div>

            {requestType === 'vistoria_presencial' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-300">
                    Aviso de Vistoria Presencial com Pagamento Antecipado de R$ 50,00:
                  </p>
                  <p className="text-[11px] text-slate-300">
                    A taxa de deslocamento de <strong>R$ 50,00</strong> é cobrada antecipadamente para confirmar a reserva exclusiva do dia e horário escolhidos na agenda do técnico. O pagamento é realizado com segurança via PIX Mercado Pago (5% OFF) ou Cartão.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Urgency Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Nível de Urgência do Atendimento:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setUrgency('normal')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  urgency === 'normal'
                    ? 'bg-sky-900 border-rose-500 text-white shadow-md'
                    : 'bg-sky-950/60 border-sky-800 text-slate-400 hover:border-sky-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">Padrão / Agendado</span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-400">Para datas programadas com comodidade</p>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('alta')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  urgency === 'alta'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-md'
                    : 'bg-sky-950/60 border-sky-800 text-slate-400 hover:border-sky-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-300">Prioritária (Hoje/24h)</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-[11px] text-slate-400">Atendimento nas próximas 24 horas</p>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('urgente_24h')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  urgency === 'urgente_24h'
                    ? 'bg-rose-950/50 border-rose-500 text-rose-200 ring-1 ring-rose-500 shadow-lg shadow-rose-900/30'
                    : 'bg-sky-950/60 border-sky-800 text-slate-400 hover:border-sky-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Emergência Imediata
                  </span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                </div>
                <p className="text-[11px] text-slate-300">Deslocamento imediato (Plantão 24h)</p>
              </button>
            </div>
          </div>

          {/* Specific Service Options Selection */}
          {service.options.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Selecione os itens desejados para {service.name}:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {service.options.map((opt) => {
                  const isChecked = selectedOptions.includes(opt.label);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => toggleOption(opt.label)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-start justify-between gap-2.5 transition-all ${
                        isChecked
                          ? 'bg-rose-500/10 border-rose-500/50 text-white'
                          : 'bg-sky-950/50 border-sky-800 text-slate-300 hover:bg-sky-900 hover:border-sky-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 bg-sky-900 border-sky-700 pointer-events-none"
                        />
                        <div>
                          <p className="text-xs font-medium leading-tight">{opt.label}</p>
                          {opt.priceEstimate && (
                            <span className="text-[11px] text-slate-400">{opt.priceEstimate}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Problem Details & Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Detalhes ou Especificações do Serviço:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Descreva o que precisa ser feito em ${service.name} (ex: medidas, cômodo, sintomas do defeito, tipo de material)...`}
              className="w-full rounded-xl bg-sky-950 border border-sky-800 p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            />
          </div>

          {/* Photos / Attachments */}
          <div className="p-4 rounded-xl bg-sky-950/90 border border-sky-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-rose-400" />
                  Envio de Fotos do Local / Equipamento
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Anexe fotos do defeito, ambiente ou medidas para acelerar a emissão do seu orçamento sob medida.
                </p>
              </div>

              {photos.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {photos.length} {photos.length === 1 ? 'foto anexada' : 'fotos anexadas'}
                </span>
              )}
            </div>

            {/* Photo List & Upload Button */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {photos.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-sky-700 group shadow-md">
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute inset-0 bg-sky-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-rose-400 transition-opacity gap-1"
                    title="Excluir esta foto"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-[10px] text-white font-medium">Remover</span>
                  </button>
                </div>
              ))}

              <label 
                id="btn-upload-photos"
                className="min-h-[80px] sm:min-h-[96px] px-4 py-3 rounded-xl border-2 border-dashed border-rose-500/40 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 flex flex-col sm:flex-row items-center justify-center gap-2.5 cursor-pointer transition-all text-slate-300 hover:text-white group"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-xs font-bold block text-rose-400 group-hover:text-rose-300">
                    Clique aqui para Enviar Fotos
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Galeria ou Câmera do celular (PNG, JPG)
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleSimulateUpload}
                  className="hidden"
                />
              </label>

              {isUploading && (
                <div className="flex items-center gap-2 text-xs text-rose-400 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Processando foto...</span>
                </div>
              )}
            </div>
          </div>

          {/* Date & Period Scheduling (if not immediate emergency) */}
          {urgency !== 'urgente_24h' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-sky-950/60 border border-sky-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" /> Data de Preferência:
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full rounded-lg bg-sky-900 border border-sky-700 p-2 text-xs text-white focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" /> Período do Dia:
                </label>
                <select
                  value={preferredPeriod}
                  onChange={(e) => setPreferredPeriod(e.target.value as any)}
                  className="w-full rounded-lg bg-sky-900 border border-sky-700 p-2 text-xs text-white focus:ring-1 focus:ring-rose-500 outline-none"
                >
                  <option value="manha">Manhã (08h às 12h)</option>
                  <option value="tarde">Tarde (13h às 18h)</option>
                  <option value="noite">Noite (18h às 21h)</option>
                </select>
              </div>
            </div>
          )}

          {/* Client Contact & Address */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-rose-400" /> Dados de Contato e Localização:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Mariana Silva Costa"
                  className="w-full rounded-lg bg-sky-950 border border-sky-800 p-2 text-xs text-white focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">WhatsApp / Telefone *</label>
                <input
                  type="text"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ex: (71) 98765-4321"
                  className="w-full rounded-lg bg-sky-950 border border-sky-800 p-2 text-xs text-white focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="Ex: mariana.silva@email.com"
                  className="w-full rounded-lg bg-sky-950 border border-sky-800 p-2 text-xs text-white focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Rua / Logradouro *</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Ex: Rua das Acácias"
                  className="w-full rounded-lg bg-sky-950 border border-sky-800 p-2 text-xs text-white focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Número *</label>
                <input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Ex: 250"
                  className="w-full rounded-lg bg-sky-950 border border-sky-800 p-2 text-xs text-white focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Complemento</label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto, bloco..."
                  className="w-full rounded-lg bg-sky-950 border border-sky-800 p-2 text-xs text-white focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Bairro *</label>
                <input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Pituba"
                  className="w-full rounded-lg bg-sky-950 border border-sky-800 p-2 text-xs text-white focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Cidade / UF *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Salvador - BA"
                  className="w-full rounded-lg bg-sky-950 border border-sky-800 p-2 text-xs text-white focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Nota Fiscal (NF-e) Option */}
          <div className="space-y-3.5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-950/90 to-sky-950/90 border border-slate-750 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-sky-800 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Opção de Nota Fiscal (NF-e)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                CNPJ Emissor: 64.177.147/0001-34
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Deseja que seja emitida Nota Fiscal Eletrônica de Prestação de Serviços (NF-e) para este atendimento?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option Sim */}
              <button
                type="button"
                id="btn-option-nf-sim"
                onClick={() => setRequiresInvoice(true)}
                className={`p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 ${
                  requiresInvoice
                    ? 'bg-blue-950/40 border-blue-500/80 text-white ring-1 ring-blue-500/40 shadow-lg shadow-blue-900/20'
                    : 'bg-sky-950/80 border-sky-800 text-slate-400 hover:text-slate-200 hover:border-sky-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                  requiresInvoice ? 'bg-blue-600 border-blue-400 text-white' : 'border-sky-600 bg-sky-900'
                }`}>
                  {requiresInvoice && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">
                    SIM • Emitir Nota Fiscal (NF-e)
                  </span>
                  <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                    Faturamento oficial com CNPJ 64.177.147/0001-34 para dedução, garantia formal e prestação de contas.
                  </span>
                </div>
              </button>

              {/* Option Nao */}
              <button
                type="button"
                id="btn-option-nf-nao"
                onClick={() => setRequiresInvoice(false)}
                className={`p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 ${
                  !requiresInvoice
                    ? 'bg-sky-900 border-slate-500/80 text-white ring-1 ring-slate-500/40 shadow-md'
                    : 'bg-sky-950/80 border-sky-800 text-slate-400 hover:text-slate-200 hover:border-sky-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                  !requiresInvoice ? 'bg-slate-600 border-slate-400 text-white' : 'border-sky-600 bg-sky-900'
                }`}>
                  {!requiresInvoice && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">
                    NÃO • Apenas Recibo / O.S.
                  </span>
                  <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                    Comprovante digital de execução e ordem de serviço com garantia RM Manutec.
                  </span>
                </div>
              </button>
            </div>

            {requiresInvoice && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200 border-t border-sky-800/80">
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                    CPF ou CNPJ para emissão na Nota Fiscal:
                  </label>
                  <input
                    type="text"
                    value={invoiceCnpjOrCpf}
                    onChange={(e) => setInvoiceCnpjOrCpf(e.target.value)}
                    placeholder="Ex: 000.000.000-00 ou CNPJ da empresa"
                    className="w-full rounded-lg bg-sky-900 border border-sky-800 p-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                    Razão Social / Nome Fantasia (Opcional):
                  </label>
                  <input
                    type="text"
                    value={invoiceCompanyName}
                    onChange={(e) => setInvoiceCompanyName(e.target.value)}
                    placeholder="Ex: Condomínio Residencial / Empresa LTDA"
                    className="w-full rounded-lg bg-sky-900 border border-sky-800 p-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Forma de Pagamento */}
          <div className="p-4 rounded-xl bg-sky-900/70 border border-sky-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  6
                </div>
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  Forma de Pagamento Preferida
                </h4>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Pagamento 100% Seguro
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Selecione como prefere pagar o serviço:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* PIX */}
              <button
                type="button"
                id="payment-opt-pix"
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between gap-1.5 ${
                  paymentMethod === 'pix'
                    ? 'bg-emerald-950/50 border-emerald-500 text-white ring-1 ring-emerald-500/50 shadow-md shadow-emerald-950/40'
                    : 'bg-sky-950 border-sky-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-300">
                    <DollarSign className="w-4 h-4" /> PIX (Chave CNPJ)
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    5% OFF
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Transferência bancária direta pela Chave CNPJ com 5% de desconto</span>
              </button>

              {/* Cartão de Crédito */}
              <button
                type="button"
                id="payment-opt-credit"
                onClick={() => setPaymentMethod('cartao_credito')}
                className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between gap-1.5 ${
                  paymentMethod === 'cartao_credito'
                    ? 'bg-blue-950/50 border-blue-500 text-white ring-1 ring-blue-500/50 shadow-md shadow-blue-950/40'
                    : 'bg-sky-950 border-sky-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-blue-300">
                    <CreditCard className="w-4 h-4" /> Cartão de Crédito
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
                    Até 12x
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Parcelamento em até 12x sem juros (todas as bandeiras)</span>
              </button>

              {/* Cartão de Débito */}
              <button
                type="button"
                id="payment-opt-debit"
                onClick={() => setPaymentMethod('cartao_debito')}
                className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between gap-1.5 ${
                  paymentMethod === 'cartao_debito'
                    ? 'bg-indigo-950/50 border-indigo-500 text-white ring-1 ring-indigo-500/50 shadow-md shadow-indigo-950/40'
                    : 'bg-sky-950 border-sky-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-300">
                    <Wallet className="w-4 h-4" /> Cartão de Débito
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    À Vista
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">À vista com cartão de débito e aprovação em tempo real</span>
              </button>

              {/* Faturamento PJ */}
              <button
                type="button"
                id="payment-opt-faturamento-pj"
                onClick={() => setPaymentMethod('faturamento_pj')}
                className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between gap-1.5 ${
                  paymentMethod === 'faturamento_pj'
                    ? 'bg-purple-950/50 border-purple-500 text-white ring-1 ring-purple-500/50 shadow-md shadow-purple-950/40'
                    : 'bg-sky-950 border-sky-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-purple-300">
                    <Building2 className="w-4 h-4" /> Faturamento PJ
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                    15/30 Dias
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Exclusivo para Empresas e Condomínios com emissão de NF-e</span>
              </button>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-sky-950/95 border-t border-sky-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-left w-full sm:w-auto">
            <span className="text-[11px] text-slate-400 block">
              {requestType === 'vistoria_presencial' ? 'Taxa de Deslocamento Técnico:' : 'Orçamento:'}
            </span>
            {requestType === 'vistoria_presencial' ? (
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-rose-400">R$ 50,00</span>
                <span className="text-[10px] text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  Pagamento Antecipado Obrigatório
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-emerald-400">Avaliação Remota Prévia Online</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 text-xs sm:text-sm font-medium transition-colors"
            >
              Cancelar
            </button>

            <button
              id="btn-submit-service-order"
              type="button"
              onClick={handleSubmit}
              className={`px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-black shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                requestType === 'vistoria_presencial'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40 ring-1 ring-emerald-400/40'
                  : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 shadow-rose-600/30'
              }`}
            >
              {requestType === 'vistoria_presencial' ? (
                <>
                  <QrCode className="w-4 h-4 text-emerald-200 animate-pulse" />
                  <span>Agendar Vistoria e Pagar (PIX CNPJ)</span>
                </>
              ) : (
                <>
                  <span>Enviar para Orçamento</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
