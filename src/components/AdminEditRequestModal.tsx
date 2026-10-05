import React, { useState } from 'react';
import { ServiceRequest, UserProfile, ServiceUrgency, ServiceStatus, PaymentMethod, PaymentStatus, BudgetProposal, InspectionFeeDetails } from '../types';
import {
  X,
  Edit3,
  Trash2,
  Save,
  User,
  HardHat,
  DollarSign,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  Camera,
  Plus,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface AdminEditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest;
  availableTechnicians: UserProfile[];
  onSave: (updatedRequest: ServiceRequest) => void;
  onDelete: (requestId: string) => void;
}

export const AdminEditRequestModal: React.FC<AdminEditRequestModalProps> = ({
  isOpen,
  onClose,
  request,
  availableTechnicians,
  onSave,
  onDelete
}) => {
  if (!isOpen) return null;

  const [serviceName, setServiceName] = useState(request.serviceName);
  const [estimatedPrice, setEstimatedPrice] = useState(request.estimatedPrice || '');
  const [clientName, setClientName] = useState(request.clientName);
  const [clientPhone, setClientPhone] = useState(request.clientPhone);
  const [clientEmail, setClientEmail] = useState(request.clientEmail);
  const [street, setStreet] = useState(request.address.street);
  const [number, setNumber] = useState(request.address.number);
  const [neighborhood, setNeighborhood] = useState(request.address.neighborhood);
  const [city, setCity] = useState(request.address.city);
  const [complement, setComplement] = useState(request.address.complement || '');
  const [urgency, setUrgency] = useState<ServiceUrgency>(request.urgency);
  const [status, setStatus] = useState<ServiceStatus>(request.status);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(request.paymentMethod || 'pix');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(request.paymentStatus || 'pendente');
  const [description, setDescription] = useState(request.description);
  const [completionNote, setCompletionNote] = useState(request.completionNote || '');
  const [securityCode, setSecurityCode] = useState(request.securityCode || 'RM-5924');

  // Request Type & Inspection Fee (R$ 50,00)
  const [requestType, setRequestType] = useState<'vistoria_presencial' | 'orcamento_remoto'>(
    request.requestType || 'vistoria_presencial'
  );
  const [inspectionFeeAmount, setInspectionFeeAmount] = useState<number>(
    request.inspectionFee?.amount ?? 50.00
  );
  const [inspectionFeePaid, setInspectionFeePaid] = useState<boolean>(
    request.inspectionFee?.isPaid ?? false
  );

  // Budget Proposal fields
  const [hasBudgetProposal, setHasBudgetProposal] = useState<boolean>(
    !!request.budgetProposal || request.status === 'orcamento_enviado'
  );
  const [laborAmount, setLaborAmount] = useState<number>(
    request.budgetProposal?.laborAmount ?? 250.00
  );
  const [materialsAmount, setMaterialsAmount] = useState<number>(
    request.budgetProposal?.materialsAmount ?? 130.00
  );
  const [executionDays, setExecutionDays] = useState<string>(
    request.budgetProposal?.executionDays ?? '1 a 2 dias úteis'
  );
  const [budgetProposalDescription, setBudgetProposalDescription] = useState<string>(
    request.budgetProposal?.description ?? request.description
  );
  const [budgetProposalStatus, setBudgetProposalStatus] = useState<BudgetProposal['status']>(
    request.budgetProposal?.status ?? (status === 'orcamento_enviado' ? 'enviado_cliente' : 'pendente_envio')
  );
  
  // Technician Assignment
  const [assignedTechId, setAssignedTechId] = useState<string>(
    request.assignedTechnician ? (availableTechnicians.find(t => t.name === request.assignedTechnician?.name)?.id || 'custom') : 'none'
  );
  const [customTechName, setCustomTechName] = useState(request.assignedTechnician?.name || '');
  const [customTechPhone, setCustomTechPhone] = useState(request.assignedTechnician?.phone || '');
  const [customTechRole, setCustomTechRole] = useState(request.assignedTechnician?.role || 'Técnico Especialista');

  // Confirmation for delete
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let techObj = undefined;
    if (assignedTechId !== 'none') {
      const selected = availableTechnicians.find(t => t.id === assignedTechId);
      if (selected) {
        techObj = {
          name: selected.name,
          role: selected.specialty || 'Técnico Credenciado',
          phone: selected.phone,
          avatar: selected.avatar,
          rating: selected.rating || 5.0,
          creaOrCrt: selected.crea || selected.crt || selected.document || 'Profissional Liberal'
        };
      } else if (customTechName.trim()) {
        techObj = {
          name: customTechName.trim(),
          role: customTechRole.trim() || 'Técnico RM Manutec',
          phone: customTechPhone.trim() || '(71) 99649-2354',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          rating: 5.0,
          creaOrCrt: 'Credenciado'
        };
      }
    }

    const totalBudget = (laborAmount || 0) + (materialsAmount || 0);

    const budgetProposalObj: BudgetProposal | undefined = hasBudgetProposal ? {
      id: request.budgetProposal?.id || `prop-${Date.now()}`,
      laborAmount,
      materialsAmount,
      totalAmount: totalBudget,
      executionDays,
      description: budgetProposalDescription,
      sentAt: request.budgetProposal?.sentAt || new Date().toISOString(),
      status: budgetProposalStatus,
      paymentRequired: true,
      paymentStatus: paymentStatus === 'pago' ? 'pago' : (request.budgetProposal?.paymentStatus || 'pendente')
    } : undefined;

    const inspectionFeeObj: InspectionFeeDetails | undefined = requestType === 'vistoria_presencial' ? {
      amount: inspectionFeeAmount,
      currency: 'BRL',
      isPaid: inspectionFeePaid,
      paidAt: inspectionFeePaid ? (request.inspectionFee?.paidAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString()) : undefined,
      paymentMethod: request.inspectionFee?.paymentMethod || paymentMethod
    } : undefined;

    const updated: ServiceRequest = {
      ...request,
      serviceName,
      estimatedPrice: hasBudgetProposal ? `R$ ${totalBudget.toFixed(2)}` : estimatedPrice,
      clientName,
      clientPhone,
      clientEmail,
      urgency,
      status,
      paymentMethod,
      paymentStatus,
      requestType,
      inspectionFee: inspectionFeeObj,
      budgetProposal: budgetProposalObj,
      description,
      completionNote,
      securityCode,
      address: {
        street,
        number,
        neighborhood,
        city,
        complement
      },
      assignedTechnician: techObj
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#0f131a] border border-sky-700 shadow-2xl text-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-sky-950 border-b border-sky-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                Acesso Mestre de Administração
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Editar O.S. • Protocolo {request.protocolNumber}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Status & Urgency Master Bar */}
          <div className="p-3.5 rounded-xl bg-sky-900 border border-sky-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Status do Atendimento (O.S.)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white font-bold outline-none focus:border-rose-500"
              >
                <option value="pendente">Pendente / Triagem</option>
                <option value="em_analise">Em Análise Técnica</option>
                <option value="tecnico_agendado">Técnico Agendado / A Caminho</option>
                <option value="em_andamento">Em Andamento no Local</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Status de Pagamento</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className={`w-full px-3 py-2 rounded-xl border font-bold outline-none ${
                  paymentStatus === 'pago'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : paymentStatus === 'processando'
                    ? 'bg-blue-950/60 border-blue-500/50 text-blue-300'
                    : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                }`}
              >
                <option value="pendente">Pendente</option>
                <option value="processando">Processando / Aguardando</option>
                <option value="pago">Pago / Confirmado</option>
                <option value="nao_aplicavel">Não Aplicável / Cortesia</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Prioridade / Urgência</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as ServiceUrgency)}
                className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white font-bold outline-none focus:border-rose-500"
              >
                <option value="normal">Normal (Agendamento)</option>
                <option value="alta">Alta Prioridade</option>
                <option value="urgente_24h">Emergencial 24h (Plantão)</option>
              </select>
            </div>
          </div>

          {/* Section 1: Dados do Serviço & Orçamento */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-sky-800 pb-1">
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              1. Detalhes do Serviço, Taxa e Orçamento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Título / Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tipo de Chamado</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as 'vistoria_presencial' | 'orcamento_remoto')}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white font-bold outline-none focus:border-rose-500"
                >
                  <option value="vistoria_presencial">Vistoria Presencial (R$ 50)</option>
                  <option value="orcamento_remoto">Orçamento Remoto (Fotos)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] text-slate-400 mb-1">Descrição do Problema / Escopo</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-slate-200 outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Método de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                >
                  <option value="pix">PIX Instantâneo</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="faturamento_pj">Faturamento PJ (15/30 dias)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">PIN / Código de Segurança</label>
                <input
                  type="text"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-amber-400 font-mono font-bold outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Taxa de Deslocamento R$ 50,00 */}
            {requestType === 'vistoria_presencial' && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Taxa de Deslocamento & Vistoria Presencial (Antecipada)
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    inspectionFeePaid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {inspectionFeePaid ? 'PAGA' : 'AGUARDANDO PAGAMENTO'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Valor da Taxa (R$)</label>
                    <input
                      type="number"
                      step="5"
                      value={inspectionFeeAmount}
                      onChange={(e) => setInspectionFeeAmount(parseFloat(e.target.value) || 50)}
                      className="w-full px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-700 text-white font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Status da Taxa</label>
                    <select
                      value={inspectionFeePaid ? 'true' : 'false'}
                      onChange={(e) => setInspectionFeePaid(e.target.value === 'true')}
                      className="w-full px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-700 text-white font-bold outline-none"
                    >
                      <option value="false">Pendente (Cliente deve pagar)</option>
                      <option value="true">Pago (Confirmado para Visita)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Gerador de Orçamento para o Cliente */}
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBudgetProposal}
                    onChange={(e) => {
                      setHasBudgetProposal(e.target.checked);
                      if (e.target.checked && status !== 'concluido') {
                        setStatus('orcamento_enviado');
                      }
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-300">
                    Emitir / Atualizar Proposta de Orçamento para o Cliente
                  </span>
                </label>
                {hasBudgetProposal && (
                  <span className="text-xs font-black text-emerald-400">
                    Total: R$ {((laborAmount || 0) + (materialsAmount || 0)).toFixed(2)}
                  </span>
                )}
              </div>

              {hasBudgetProposal && (
                <div className="space-y-2.5 pt-1 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Mão de Obra (R$)</label>
                      <input
                        type="number"
                        step="10"
                        value={laborAmount}
                        onChange={(e) => setLaborAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-700 text-white font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Materiais / Insumos (R$)</label>
                      <input
                        type="number"
                        step="10"
                        value={materialsAmount}
                        onChange={(e) => setMaterialsAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-700 text-white font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Prazo de Execução</label>
                      <input
                        type="text"
                        value={executionDays}
                        onChange={(e) => setExecutionDays(e.target.value)}
                        placeholder="Ex: 1 a 2 dias úteis"
                        className="w-full px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-700 text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Escopo Técnico da Proposta</label>
                    <textarea
                      rows={2}
                      value={budgetProposalDescription}
                      onChange={(e) => setBudgetProposalDescription(e.target.value)}
                      placeholder="Detalhes dos serviços e procedimentos que serão executados..."
                      className="w-full px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-700 text-slate-200 outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Status da Proposta:
                    </span>
                    <select
                      value={budgetProposalStatus}
                      onChange={(e) => setBudgetProposalStatus(e.target.value as BudgetProposal['status'])}
                      className="px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-700 text-xs font-bold text-emerald-300 outline-none"
                    >
                      <option value="pendente_envio">Rascunho (Pendente Envio)</option>
                      <option value="enviado_cliente">Enviado ao Cliente (Aguardando Aprovação e Pagamento)</option>
                      <option value="aprovado">Aprovado pelo Cliente</option>
                      <option value="rejeitado">Recusado / Ajustes Solicitados</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Dados do Cliente & Endereço */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-sky-800 pb-1">
              <User className="w-3.5 h-3.5 text-rose-400" />
              2. Dados do Cliente & Localização
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Logradouro / Rua</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Número</label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Bairro</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Cidade</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Complemento / Ref.</label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Despacho & Atribuição de Profissional */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-sky-800 pb-1">
              <HardHat className="w-3.5 h-3.5 text-amber-400" />
              3. Despacho & Profissional / Técnico Escalado
            </h3>

            <div className="p-3.5 rounded-xl bg-sky-900 border border-amber-500/30 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-1">
                  Selecionar Profissional da Base Cadastrada:
                </label>
                <select
                  value={assignedTechId}
                  onChange={(e) => setAssignedTechId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-amber-500/40 text-white outline-none focus:border-amber-400 font-bold"
                >
                  <option value="none">-- Nenhum Técnico Alocado (Aguardando Despacho) --</option>
                  {availableTechnicians.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} • {t.specialty || 'Profissional Liberal'} ({t.phone})
                    </option>
                  ))}
                  <option value="custom">-- Digitar Outro Profissional Manualmente --</option>
                </select>
              </div>

              {assignedTechId === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nome do Profissional</label>
                    <input
                      type="text"
                      value={customTechName}
                      onChange={(e) => setCustomTechName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo"
                      className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={customTechPhone}
                      onChange={(e) => setCustomTechPhone(e.target.value)}
                      placeholder="(71) 98888-7777"
                      className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Cargo / Especialidade</label>
                    <input
                      type="text"
                      value={customTechRole}
                      onChange={(e) => setCustomTechRole(e.target.value)}
                      placeholder="Ex: Eletricista Predial"
                      className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Laudo & Observações de Conclusão */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-300">
              Parecer Técnico & Notas Administrativas:
            </label>
            <textarea
              rows={2}
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="Ex: Troca de disjuntor bipolar 32A realizada com sucesso, medições de carga aprovadas."
              className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-slate-200 outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* Actions & Delete Confirmation */}
          <div className="pt-4 border-t border-sky-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/40 p-2 rounded-xl">
                <span className="text-rose-300 font-bold text-[11px]">Tem certeza que deseja excluir esta O.S.?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(request.id);
                    onClose();
                  }}
                  className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-500"
                >
                  Sim, Excluir
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Excluir Ordem de Serviço</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Todas as Modificações</span>
              </button>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
};
