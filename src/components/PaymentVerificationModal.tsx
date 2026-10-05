import React, { useState } from 'react';
import { ServiceRequest, PaymentStatus, PaymentMethod } from '../types';
import { RM_BANKING_DETAILS } from '../data/servicesData';
import {
  X,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  CreditCard,
  Building2,
  FileText,
  Truck,
  Building,
  Wallet,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Lock,
  ExternalLink,
  Receipt
} from 'lucide-react';

interface PaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  onUpdatePaymentStatus: (
    requestId: string,
    newStatus: PaymentStatus,
    paymentMethod?: PaymentMethod,
    note?: string
  ) => void;
}

export const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({
  isOpen,
  onClose,
  request,
  onUpdatePaymentStatus
}) => {
  if (!isOpen || !request) return null;

  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>(
    request.paymentStatus || 'pendente'
  );
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    request.paymentMethod || 'pix'
  );
  const [adminNote, setAdminNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSave = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onUpdatePaymentStatus(request.id, selectedStatus, selectedMethod, adminNote);
      setIsSuccess(false);
      onClose();
    }, 600);
  };

  const getMethodBadge = (method?: PaymentMethod) => {
    switch (method) {
      case 'pix':
        return { label: 'PIX Instantâneo', icon: QrCode, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'cartao_credito':
        return { label: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'cartao_debito':
        return { label: 'Cartão de Débito', icon: Wallet, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      case 'faturamento_pj':
        return { label: 'Faturamento PJ', icon: Building2, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      default:
        return { label: 'A Definir', icon: DollarSign, color: 'text-slate-400 bg-sky-900 border-sky-700' };
    }
  };

  const currentBadge = getMethodBadge(selectedMethod);
  const BadgeIcon = currentBadge.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        id="modal-payment-verification"
        className="relative w-full max-w-xl rounded-2xl bg-[#0d1117] border border-sky-700 shadow-2xl text-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-sky-950 border-b border-sky-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Painel de Gestão Financeira
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-sky-900 text-slate-400 font-mono">
                  Auditoria
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Verificação de Pagamento
              </h2>
            </div>
          </div>

          <button
            id="btn-close-payment-verification"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-sky-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Order Header Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950 via-sky-900 to-sky-950 border border-sky-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-rose-400 text-xs sm:text-sm">
                  {request.protocolNumber}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-900 text-slate-300 font-medium">
                  {request.clientName}
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                request.paymentStatus === 'pago'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : request.paymentStatus === 'processando'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {request.paymentStatus === 'pago' ? (
                  <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> PAGO</>
                ) : request.paymentStatus === 'processando' ? (
                  <><Clock className="w-3 h-3 text-blue-400" /> PROCESSANDO</>
                ) : (
                  <><AlertCircle className="w-3 h-3 text-amber-400" /> PENDENTE</>
                )}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400 text-xs pt-1 border-t border-sky-800/80">
              <span><strong>Serviço:</strong> {request.serviceName}</span>
              <span><strong>Valor / Orçamento:</strong> <strong className="text-emerald-400">{request.estimatedPrice || 'Sob Orçamento'}</strong></span>
            </div>
            
            {request.paidAt && (
              <div className="text-[11px] text-emerald-300/90 font-medium">
                Última confirmação registrada em: {request.paidAt}
              </div>
            )}
          </div>

          {/* Detailed Transaction Info Box */}
          <div className="p-3.5 rounded-xl bg-sky-900 border border-sky-800/90 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Dados do Método Atual ({currentBadge.label}):
            </span>

            {/* PIX Transaction */}
            {selectedMethod === 'pix' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-sky-950 p-2 rounded-lg border border-sky-800">
                  <span className="text-slate-400 font-mono text-[11px]">Chave CNPJ Favorecido:</span>
                  <span className="font-mono text-white font-bold">{RM_BANKING_DETAILS.pixKeyCnpj}</span>
                </div>
                <div className="flex items-center justify-between bg-sky-950 p-2 rounded-lg border border-sky-800">
                  <span className="text-slate-400 font-mono text-[11px]">ID da Transação / Protocolo:</span>
                  <span className="font-mono text-emerald-400 font-bold">{request.pixTransactionId || `PIX-${request.protocolNumber.replace('RM-', '')}-OK`}</span>
                </div>
              </div>
            )}

            {/* Card Transaction */}
            {(selectedMethod === 'cartao_credito' || selectedMethod === 'cartao_debito') && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-sky-950 p-2 rounded-lg border border-sky-800">
                  <span className="text-slate-400 text-[11px]">Bandeira & Final:</span>
                  <span className="font-mono text-white font-bold">
                    {request.cardDetails?.brand || 'Mastercard / Visa'} •••• {request.cardDetails?.cardLast4 || '4092'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-sky-950 p-2 rounded-lg border border-sky-800">
                  <span className="text-slate-400 text-[11px]">Titular:</span>
                  <span className="text-white font-bold">{request.cardDetails?.cardHolder || request.clientName.toUpperCase()}</span>
                </div>
                {selectedMethod === 'cartao_credito' && (
                  <div className="flex items-center justify-between bg-sky-950 p-2 rounded-lg border border-sky-800">
                    <span className="text-slate-400 text-[11px]">Parcelamento:</span>
                    <span className="text-blue-300 font-bold">{request.cardDetails?.installments || 1}x sem juros</span>
                  </div>
                )}
              </div>
            )}

            {/* Faturamento PJ */}
            {selectedMethod === 'faturamento_pj' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-sky-950 p-2 rounded-lg border border-sky-800">
                  <span className="text-slate-400 text-[11px]">CNPJ / Razão Social:</span>
                  <span className="text-white font-bold">{request.faturamentoPjDetails?.cnpj || request.invoiceCnpjOrCpf || '64.177.147/0001-34'}</span>
                </div>
                <div className="flex items-center justify-between bg-sky-950 p-2 rounded-lg border border-sky-800">
                  <span className="text-slate-400 text-[11px]">Prazo de Pagamento:</span>
                  <span className="text-purple-300 font-bold">{request.faturamentoPjDetails?.paymentTermDays || 30} dias com NF-e</span>
                </div>
              </div>
            )}

            {/* Mercado Pago Security & Collector Status */}
            <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/20 text-xs flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold text-sky-300 block">Gateway Mercado Pago Integrado</span>
                  <span className="text-[10px] text-slate-400 font-mono">Conta Coletora: 5800466774667184 • Homologado</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Transação 100% Segura
              </span>
            </div>
          </div>

          {/* Form to change status and method */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Alterar Status de Pagamento:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="status-btn-pago"
                  onClick={() => setSelectedStatus('pago')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    selectedStatus === 'pago'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                      : 'bg-sky-950 border-sky-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aprovado / Pago</span>
                </button>

                <button
                  type="button"
                  id="status-btn-processando"
                  onClick={() => setSelectedStatus('processando')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    selectedStatus === 'processando'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                      : 'bg-sky-950 border-sky-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Processando</span>
                </button>

                <button
                  type="button"
                  id="status-btn-pendente"
                  onClick={() => setSelectedStatus('pendente')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    selectedStatus === 'pendente'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                      : 'bg-sky-950 border-sky-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Pendente</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Meio de Pagamento Utilizado:
              </label>
              <select
                id="select-payment-method-admin"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl bg-sky-950 border border-sky-800 text-white text-xs outline-none focus:border-emerald-500"
              >
                <option value="pix">PIX Instantâneo (Chave CNPJ / QR Code)</option>
                <option value="cartao_credito">Cartão de Crédito (Parcelado sem juros)</option>
                <option value="cartao_debito">Cartão de Débito à Vista</option>
                <option value="faturamento_pj">Faturamento PJ (15/30 Dias com NF-e)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Observação Financeira Interna / Comprovante (Opcional):
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ex: Comprovante verificado no extrato BB às 14:30 ou NF-e 4920 emitida"
                className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              id="btn-save-payment-verification"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Atualizado com Sucesso!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Salvar Verificação de Pagamento</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
