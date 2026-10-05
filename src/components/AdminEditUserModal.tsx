import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { CameraDocumentCapture } from './CameraDocumentCapture';
import {
  X,
  User,
  ShieldCheck,
  HardHat,
  Ban,
  Unlock,
  Save,
  Trash2,
  Camera,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Award,
  Upload,
  RotateCcw,
  ScanFace
} from 'lucide-react';

interface AdminEditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSave: (updatedUser: UserProfile) => void;
  onDelete: (userId: string) => void;
  onToggleBlock: (userId: string, isBlocked: boolean, reason?: string) => void;
}

export const AdminEditUserModal: React.FC<AdminEditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  onDelete,
  onToggleBlock
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [role, setRole] = useState<UserRole>(user.role);
  const [cpf, setCpf] = useState(user.cpf || user.document || '');
  const [rg, setRg] = useState(user.rg || '');
  const [crea, setCrea] = useState(user.crea || '');
  const [crt, setCrt] = useState(user.crt || '');
  const [specialty, setSpecialty] = useState(user.specialty || '');
  const [address, setAddress] = useState(user.address || '');
  const [verificationStatus, setVerificationStatus] = useState(user.verificationStatus || 'aprovado');
  const [isVerified, setIsVerified] = useState(user.isVerified !== undefined ? user.isVerified : true);
  const [adminNotes, setAdminNotes] = useState(user.adminNotes || '');
  const [rating, setRating] = useState<number>(user.rating || 5.0);
  const [documentPhotoUrl, setDocumentPhotoUrl] = useState(user.documentPhotoUrl || '');
  const [isCameraCapturingDoc, setIsCameraCapturingDoc] = useState(false);

  // Block modal sub-state
  const [isBlocked, setIsBlocked] = useState(user.isBlocked || false);
  const [blockedReason, setBlockedReason] = useState(user.blockedReason || '');
  const [password, setPassword] = useState(user.password || '123456');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [facialAuthEnabled, setFacialAuthEnabled] = useState(user.facialAuthEnabled !== false);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'security'>('info');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedUser: UserProfile = {
      ...user,
      name,
      email,
      phone,
      role,
      cpf,
      rg,
      password,
      crea: crea || undefined,
      crt: crt || undefined,
      specialty: specialty || undefined,
      address: address || undefined,
      documentPhotoUrl: documentPhotoUrl || user.documentPhotoUrl,
      isVerified,
      verificationStatus: isBlocked ? 'bloqueado' : verificationStatus,
      adminNotes: adminNotes || undefined,
      rating: role === 'tecnico' ? rating : undefined,
      isBlocked,
      blockedReason: isBlocked ? (blockedReason || 'Bloqueado pela gestão') : undefined,
      blockedAt: isBlocked ? (user.blockedAt || new Date().toISOString()) : undefined,
      facialAuthEnabled,
      facialBiometricHash: user.facialBiometricHash || `bio_rm_${user.id}_authed`,
      savedOnThisDevice: true
    };

    onSave(updatedUser);
    onClose();
  };

  const handleBlockToggle = () => {
    const nextBlockedState = !isBlocked;
    setIsBlocked(nextBlockedState);
    if (!nextBlockedState) {
      setBlockedReason('');
      setVerificationStatus('aprovado');
    } else {
      setVerificationStatus('bloqueado');
      if (!blockedReason) {
        setBlockedReason('Suspensão administrativa por pendência cadastral ou conduta');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0f131a] border border-sky-700 shadow-2xl text-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-sky-950 border-b border-sky-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg ${
              user.role === 'tecnico'
                ? 'bg-gradient-to-tr from-amber-600 to-orange-500 shadow-amber-600/30'
                : user.role === 'admin'
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-600/30'
                : 'bg-gradient-to-tr from-rose-600 to-pink-500 shadow-rose-600/30'
            }`}>
              {user.role === 'tecnico' ? (
                <HardHat className="w-6 h-6" />
              ) : user.role === 'admin' ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  user.role === 'tecnico'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : user.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {user.role === 'tecnico' ? 'Profissional / Técnico' : user.role === 'admin' ? 'Gestão Admin' : 'Cliente'}
                </span>

                {isBlocked ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black flex items-center gap-1">
                    <Ban className="w-3 h-3 text-rose-400" />
                    CONTA BLOQUEADA
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    CONTA ATIVA
                  </span>
                )}
              </div>
              
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight mt-0.5">
                {user.name}
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

        {/* Tab Navigation */}
        <div className="flex border-b border-sky-800 bg-sky-900/60 px-4 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Dados Cadastrais & Perfil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Documentos & Selfie Facial</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            <span>Bloqueio & Segurança</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {activeTab === 'info' && (
            <div className="space-y-4">
              
              {/* Role & Verification Bar */}
              <div className="p-3.5 rounded-xl bg-sky-900 border border-sky-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Tipo de Acesso / Papel</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white font-bold outline-none focus:border-rose-500"
                  >
                    <option value="cliente">Cliente (Solicitante)</option>
                    <option value="tecnico">Profissional / Técnico</option>
                    <option value="admin">Administrador (Gestão)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Status de Verificação</label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-white font-bold outline-none focus:border-rose-500"
                  >
                    <option value="aprovado">Aprovado & Verificado</option>
                    <option value="em_analise">Em Análise Técnica</option>
                    <option value="pendente">Pendente de Fotos</option>
                    <option value="bloqueado">Bloqueado / Suspenso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Validação Biométrica</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="chk-verified"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-sky-700 bg-sky-950"
                    />
                    <label htmlFor="chk-verified" className="text-[11px] text-slate-300 font-semibold cursor-pointer">
                      Biometria & CPF Validados
                    </label>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Nome Completo / Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">E-mail Cadastrado *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">RG com Órgão Emissor</label>
                  <input
                    type="text"
                    value={rg}
                    onChange={(e) => setRg(e.target.value)}
                    placeholder="Ex: 09.114.832-60 - SSP/BA"
                    className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, Número, Bairro, Salvador - BA"
                    className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                  />
                </div>

                {role === 'tecnico' && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-amber-300 font-bold mb-1">
                        Especialidades / Habilitações Técnicas
                      </label>
                      <input
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Ex: Elétrica Predial, Ar-Condicionado Split & VRF, Hidráulica"
                        className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-amber-500/40 text-white outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">CREA-BA (Opcional)</label>
                      <input
                        type="text"
                        value={crea}
                        onChange={(e) => setCrea(e.target.value)}
                        placeholder="CREA-BA 506.892/D"
                        className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">CRT (Técnico Industrial)</label>
                      <input
                        type="text"
                        value={crt}
                        onChange={(e) => setCrt(e.target.value)}
                        placeholder="CRT-02 0184920/BA"
                        className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-white outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Avaliação / Nota (0 a 5.0)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={rating}
                        onChange={(e) => setRating(parseFloat(e.target.value) || 5.0)}
                        className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-amber-400 font-bold outline-none focus:border-rose-500"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Anotações Internas da Administração (Privado)</label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Histórico de atendimento, observações contratuais ou restrições..."
                    className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-slate-200 outline-none focus:border-rose-500 resize-none"
                  />
                </div>
              </div>

            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Fotos enviadas pelo usuário durante o cadastro obrigatório com biometria facial e documento com foto.
                </span>
              </div>

              {/* Se a câmera de documentos estiver ativa */}
              {isCameraCapturingDoc && (
                <CameraDocumentCapture
                  onCapture={(base64Img) => {
                    setDocumentPhotoUrl(base64Img);
                    setIsCameraCapturingDoc(false);
                  }}
                  onClose={() => setIsCameraCapturingDoc(false)}
                  initialImage={documentPhotoUrl || user.documentPhotoUrl}
                  documentTypeLabel={`Documento Oficial de ${name || user.name}`}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Document Photo */}
                <div className="p-3.5 rounded-xl bg-sky-900 border border-sky-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                      Documento (CPF / RG / CREA)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Frente & Verso</span>
                  </div>

                  <div className="h-44 rounded-xl overflow-hidden bg-sky-950 border border-sky-800 flex items-center justify-center">
                    {(documentPhotoUrl || user.documentPhotoUrl) ? (
                      <img
                        src={documentPhotoUrl || user.documentPhotoUrl}
                        alt="Foto do Documento"
                        className="w-full h-full object-contain bg-sky-950"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span>Foto do documento em arquivo digitalizado</span>
                      </div>
                    )}
                  </div>

                  {/* Actions for Document Photo */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCameraCapturingDoc(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Fotografar com Câmera</span>
                    </button>

                    <label className="px-2.5 py-1.5 rounded-lg bg-sky-900 hover:bg-sky-800 text-slate-300 text-[11px] font-semibold border border-sky-700 flex items-center gap-1.5 cursor-pointer transition-colors">
                      <Upload className="w-3 h-3 text-blue-400" />
                      <span>Arquivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const r = new FileReader();
                            r.onloadend = () => {
                              if (typeof r.result === 'string') setDocumentPhotoUrl(r.result);
                            };
                            r.readAsDataURL(f);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Selfie Photo */}
                <div className="p-3.5 rounded-xl bg-sky-900 border border-sky-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      Selfie Facial (Biometria)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Validação Facial</span>
                  </div>

                  <div className="h-44 rounded-xl overflow-hidden bg-sky-950 border border-sky-800 flex items-center justify-center">
                    {user.selfiePhotoUrl || user.avatar ? (
                      <img
                        src={user.selfiePhotoUrl || user.avatar}
                        alt="Selfie Facial"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-500">
                        <Camera className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span>Selfie facial registrada</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              
              {/* Account Block Control */}
              <div className={`p-4 rounded-xl border ${
                isBlocked
                  ? 'bg-rose-950/50 border-rose-500/60 text-rose-200'
                  : 'bg-sky-900 border-sky-800 text-slate-300'
              } space-y-3`}>
                
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isBlocked ? 'bg-rose-600 text-white' : 'bg-sky-900 text-slate-400'
                    }`}>
                      <Ban className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {isBlocked ? 'Conta Atualmente Bloqueada' : 'Bloquear / Suspender Acesso do Usuário'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ao bloquear, o usuário será impedido de acessar seus painéis, solicitar ou executar serviços na plataforma RM Manutec.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBlockToggle}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      isBlocked
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                    }`}
                  >
                    {isBlocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Desbloquear Conta</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" />
                        <span>Bloquear Usuário</span>
                      </>
                    )}
                  </button>
                </div>

                {isBlocked && (
                  <div className="pt-2 border-t border-rose-500/30 space-y-2">
                    <label className="block text-[11px] font-bold text-rose-300">
                      Motivo / Justificativa do Bloqueio:
                    </label>
                    <textarea
                      rows={2}
                      value={blockedReason}
                      onChange={(e) => setBlockedReason(e.target.value)}
                      placeholder="Informe o motivo da suspensão (ex: Documentação ilegível, conduta irregular, pendência financeira...)"
                      className="w-full px-3 py-2 rounded-xl bg-sky-900 border border-rose-500/40 text-rose-100 outline-none focus:border-rose-400 resize-none text-xs"
                    />
                    <span className="text-[10px] text-rose-400/80 block">
                      Este motivo será exibido de forma transparente ao usuário caso ele tente realizar login.
                    </span>
                  </div>
                )}
              </div>

              {/* Password Management by Administrator */}
              <div className="p-3.5 rounded-xl bg-sky-900 border border-sky-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">Senha de Acesso do Usuário</h4>
                    <p className="text-[10px] text-slate-400">Redefinir ou visualizar a senha cadastrada para este perfil</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline"
                  >
                    {showPasswordInput ? 'Ocultar Senha' : 'Ver / Alterar Senha'}
                  </button>
                </div>

                {showPasswordInput && (
                  <div className="pt-2 border-t border-sky-800 space-y-2">
                    <label className="block text-[11px] text-slate-400">Nova Senha Cadastrada:</label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2 rounded-xl bg-sky-950 border border-sky-700 text-amber-300 font-mono text-xs outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Ao salvar, o usuário poderá realizar login com este CPF e a nova senha informada.
                    </span>
                  </div>
                )}
              </div>

              {/* Security Audit Information */}
              <div className="p-3.5 rounded-xl bg-sky-900 border border-sky-800 space-y-2 text-slate-400 text-[11px]">
                <div className="flex items-center justify-between">
                  <span>ID do Usuário no Sistema:</span>
                  <span className="font-mono text-slate-200">{user.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data de Cadastro Inicial:</span>
                  <span className="text-slate-200">{user.registrationDate || '10/01/2026'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total de Serviços Realizados:</span>
                  <span className="text-emerald-400 font-bold">{user.totalServicesCompleted || 0} ordens</span>
                </div>
              </div>

            </div>
          )}

          {/* Footer Actions & Delete Confirmation */}
          <div className="pt-4 border-t border-sky-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/40 p-2 rounded-xl">
                <span className="text-rose-300 font-bold text-[11px]">Excluir este perfil permanentemente?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(user.id);
                    onClose();
                  }}
                  className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-500 cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Cadastro</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
};
