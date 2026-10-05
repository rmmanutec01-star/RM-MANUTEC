import React, { useState, useRef } from 'react';
import { UserProfile, ServiceRequest, AdminClientInteractionThread, InteractionDocument, SelfieVaultRecord } from '../types';
import { 
  enableFacialLoginForAllRegisteredUsers, 
  saveFacialCredentialToVault, 
  saveRegisteredUser,
  getTransmittedDocumentsVault,
  getRegistrationVaultRecords,
  getSelfiesVault
} from '../lib/supabase';
import {
  FolderLock,
  Folder,
  FileText,
  Camera,
  ShieldCheck,
  Search,
  Download,
  Eye,
  Lock,
  Users,
  HardHat,
  UserCheck,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Ban,
  Building2,
  ScanFace,
  RefreshCw,
  Image as ImageIcon,
  Printer,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Upload,
  Plus,
  Filter,
  Grid,
  List,
  Receipt,
  FileSpreadsheet,
  Check,
  Share2,
  Maximize2,
  Briefcase,
  Layers,
  Shield
} from 'lucide-react';

export interface AdminStorageVaultProps {
  users: UserProfile[];
  requests: ServiceRequest[];
  interactionThreads?: AdminClientInteractionThread[];
  onOpenUserModal?: (user: UserProfile) => void;
  onSaveUser?: (user: UserProfile) => void;
}

export interface UnifiedDocumentItem {
  id: string;
  title: string;
  category: 'documento_oficial' | 'crea_crt' | 'selfie_biometrica' | 'foto_obra' | 'orcamento_laudo' | 'comprovante_pagamento' | 'empresa_cnpj';
  fileUrl: string;
  ownerName: string;
  ownerPhone?: string;
  ownerRole?: string;
  ownerId?: string;
  dateStr: string;
  details?: string;
  relatedServiceId?: string;
  protocolNumber?: string;
  cnpj?: string;
  companyName?: string;
  legalRepresentative?: string;
}

export const AdminStorageVault: React.FC<AdminStorageVaultProps> = ({
  users,
  requests,
  interactionThreads = [],
  onOpenUserModal,
  onSaveUser
}) => {
  // Active subfolder inside Admin Secure Storage
  const [activeFolder, setActiveFolder] = useState<
    'all' | 'corporate_pj' | 'biometrics' | 'documents' | 'technicians' | 'work_photos' | 'budgets' | 'receipts'
  >('all');

  // Display mode: 'gallery' (grade livre) or 'users' (dossiês) or 'companies' (empresas CNPJ)
  const [viewMode, setViewMode] = useState<'gallery' | 'users' | 'companies'>('gallery');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserProfile | null>(null);
  
  // Advanced Document Viewer State
  const [viewerDoc, setViewerDoc] = useState<{
    title: string;
    url: string;
    owner?: string;
    category?: string;
    date?: string;
    details?: string;
  } | null>(null);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [viewerRotation, setViewerRotation] = useState(0);

  // Upload new document by admin modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetUserId, setUploadTargetUserId] = useState(users[0]?.id || '');
  const [uploadDocType, setUploadDocType] = useState<'document' | 'selfie' | 'crea' | 'outros'>('document');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploadDocFileUrl, setUploadDocFileUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facialSyncMsg, setFacialSyncMsg] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Build Unified Index of All Documents Across the Entire Platform
  // -------------------------------------------------------------
  const unifiedDocuments: UnifiedDocumentItem[] = [];

  // 1. Official ID documents from users (RG / CPF / CNH / CNPJ)
  users.forEach((u) => {
    if (u.clientType === 'empresa_cnpj' || u.cnpj) {
      unifiedDocuments.push({
        id: `cnpj-user-${u.id}`,
        title: `Cadastro Corporativo • ${u.companyName || u.name}`,
        category: 'empresa_cnpj',
        fileUrl: u.documentPhotoUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=80',
        ownerName: u.companyName || u.name,
        ownerPhone: u.phone,
        ownerRole: u.role,
        ownerId: u.id,
        dateStr: u.registrationDate || 'Cadastrado',
        details: `CNPJ: ${u.cnpj || 'N/A'} • Resp. Legal: ${u.legalRepresentative || u.name} • Email: ${u.email}`,
        cnpj: u.cnpj,
        companyName: u.companyName,
        legalRepresentative: u.legalRepresentative
      });
    }

    if (u.documentPhotoUrl) {
      unifiedDocuments.push({
        id: `doc-user-${u.id}`,
        title: `Doc. Oficial (RG/CPF) - ${u.name}`,
        category: 'documento_oficial',
        fileUrl: u.documentPhotoUrl,
        ownerName: u.name,
        ownerPhone: u.phone,
        ownerRole: u.role,
        ownerId: u.id,
        dateStr: u.registrationDate || 'Cadastrado',
        details: `CPF: ${u.cpf || u.document || 'N/A'} • ${u.role === 'tecnico' ? 'Técnico' : 'Cliente'}`
      });
    }

    // 2. Biometric selfies from User Profiles
    if (u.selfiePhotoUrl) {
      unifiedDocuments.push({
        id: `bio-user-${u.id}`,
        title: `Selfie Biométrica - ${u.name}`,
        category: 'selfie_biometrica',
        fileUrl: u.selfiePhotoUrl,
        ownerName: u.name,
        ownerPhone: u.phone,
        ownerRole: u.role,
        ownerId: u.id,
        dateStr: u.facialEnrollmentDate || u.registrationDate || 'Captura em tempo real',
        details: `Biometria Facial Autenticada • Hash: ${u.facialBiometricHash || 'Ativo'}`
      });
    }

    // 3. Tech Credentials (CREA / CRT)
    if (u.role === 'tecnico' && (u.crea || u.crt || u.documentPhotoUrl)) {
      if (u.crea || u.crt) {
        unifiedDocuments.push({
          id: `crea-user-${u.id}`,
          title: `Credencial Profissional (${u.crea ? 'CREA' : 'CRT'}) - ${u.name}`,
          category: 'crea_crt',
          fileUrl: u.documentPhotoUrl || u.avatar || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
          ownerName: u.name,
          ownerPhone: u.phone,
          ownerRole: u.role,
          ownerId: u.id,
          dateStr: u.registrationDate || 'Credenciado',
          details: `Registro: ${u.crea || u.crt} • Especialidade: ${u.specialty || 'Técnico'}`
        });
      }
    }
  });

  // 4. Ingest All Captured Selfies from the dedicated Vault (Camera captures & Audits)
  const vaultSelfies = getSelfiesVault();
  vaultSelfies.forEach((s) => {
    const exists = unifiedDocuments.some((d) => d.id === `vault-selfie-${s.id}` || (s.selfieUrl && d.fileUrl === s.selfieUrl));
    if (!exists && s.selfieUrl) {
      unifiedDocuments.push({
        id: `vault-selfie-${s.id}`,
        title: `Selfie Registrada [${s.source.toUpperCase()}] - ${s.userName || 'Usuário'}`,
        category: 'selfie_biometrica',
        fileUrl: s.selfieUrl,
        ownerName: s.userName || 'Captura de Selfie',
        ownerRole: s.userRole,
        dateStr: new Date(s.capturedAt).toLocaleString('pt-BR'),
        details: `Origem: ${s.source} • Documento: ${s.userDocument || 'N/A'} • Hash: ${s.biometricHash}`
      });
    }
  });

  // 5. Work photos from Service Requests (Before/After, Completion photos)
  requests.forEach((req) => {
    if (req.completionPhotos && req.completionPhotos.length > 0) {
      req.completionPhotos.forEach((cp, idx) => {
        unifiedDocuments.push({
          id: `cp-${req.id}-${cp.id || idx}`,
          title: `Foto de Obra (${cp.stage === 'depois' ? 'Conclusão' : 'Diagnóstico'}) - OS #${req.protocolNumber}`,
          category: 'foto_obra',
          fileUrl: cp.url,
          ownerName: req.clientName,
          ownerPhone: req.clientPhone,
          relatedServiceId: req.id,
          protocolNumber: req.protocolNumber,
          dateStr: cp.timestamp || req.createdAt || 'Registrado',
          details: `${req.serviceName} • ${cp.caption || 'Registro de Execução Técnica'}`
        });
      });
    }

    if (req.photos && req.photos.length > 0) {
      req.photos.forEach((phUrl, idx) => {
        unifiedDocuments.push({
          id: `req-photo-${req.id}-${idx}`,
          title: `Foto de Abertura - OS #${req.protocolNumber}`,
          category: 'foto_obra',
          fileUrl: phUrl,
          ownerName: req.clientName,
          ownerPhone: req.clientPhone,
          relatedServiceId: req.id,
          protocolNumber: req.protocolNumber,
          dateStr: req.createdAt || 'Abertura',
          details: `${req.serviceName} • Foto enviada pelo cliente`
        });
      });
    }
  });

  // 6. Documents from interaction threads (Budgets, Receipts, Reports)
  interactionThreads.forEach((thread) => {
    if (thread.documents && thread.documents.length > 0) {
      thread.documents.forEach((doc) => {
        const isReceipt = doc.type === 'recibo' || doc.type === 'comprovante_pagamento';
        unifiedDocuments.push({
          id: `thread-doc-${doc.id}`,
          title: `${doc.title} (${doc.type.toUpperCase()})`,
          category: isReceipt ? 'comprovante_pagamento' : 'orcamento_laudo',
          fileUrl: doc.fileUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80',
          ownerName: thread.clientName,
          ownerPhone: thread.clientPhone,
          protocolNumber: thread.protocolNumber,
          dateStr: doc.createdAt || 'Transmitido',
          details: `${doc.description || ''} • Valor: R$ ${(doc.amount || 0).toFixed(2)}`
        });
      });
    }
  });

  // 7. Documents from permanent Transmitted Documents Vault (audited history)
  const transmittedVaultDocs = getTransmittedDocumentsVault();
  transmittedVaultDocs.forEach((vDoc) => {
    const existingIndex = unifiedDocuments.findIndex(
      d => d.id === `vault-doc-${vDoc.id}` || d.id === `thread-doc-${vDoc.fullDoc?.id}` || d.id === vDoc.id
    );
    if (existingIndex === -1 && vDoc.fileUrl) {
      unifiedDocuments.push({
        id: `vault-doc-${vDoc.id}`,
        title: `${vDoc.title} • [Cofre de Envios]`,
        category: vDoc.category === 'comprovante_pagamento' ? 'comprovante_pagamento' :
                  vDoc.category === 'orcamento_laudo' ? 'orcamento_laudo' : 'documento_oficial',
        fileUrl: vDoc.fileUrl,
        ownerName: vDoc.clientName || vDoc.senderName || 'Registro de Envio',
        ownerPhone: vDoc.clientPhone || vDoc.senderPhone,
        protocolNumber: vDoc.protocolNumber,
        dateStr: vDoc.submittedAt || 'Gravado no Cofre',
        details: `${vDoc.description || ''} • Remetente: ${vDoc.senderName} (${vDoc.senderRole}) • Status: ${vDoc.status}`
      });
    }
  });

  // Filtered Documents in Gallery Mode
  const filteredDocuments = unifiedDocuments.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.ownerPhone && doc.ownerPhone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.protocolNumber && doc.protocolNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.details && doc.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.cnpj && doc.cnpj.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFolder === 'corporate_pj') return doc.category === 'empresa_cnpj';
    if (activeFolder === 'documents') return doc.category === 'documento_oficial';
    if (activeFolder === 'technicians') return doc.category === 'crea_crt';
    if (activeFolder === 'biometrics') return doc.category === 'selfie_biometrica';
    if (activeFolder === 'work_photos') return doc.category === 'foto_obra';
    if (activeFolder === 'budgets') return doc.category === 'orcamento_laudo';
    if (activeFolder === 'receipts') return doc.category === 'comprovante_pagamento';
    return true;
  });

  // Filtered Users in Dossier Mode
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.cpf && u.cpf.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.cnpj && u.cnpj.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.companyName && u.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.document && u.document.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.crea && u.crea.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.crt && u.crt.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFolder === 'corporate_pj') return u.clientType === 'empresa_cnpj' || Boolean(u.cnpj);
    if (activeFolder === 'documents') return Boolean(u.documentPhotoUrl || u.document || u.cpf);
    if (activeFolder === 'technicians') return u.role === 'tecnico';
    if (activeFolder === 'biometrics') return Boolean(u.selfiePhotoUrl || u.avatar);
    return true;
  });

  // Filtered Corporate Clients
  const corporateUsers = users.filter((u) => u.clientType === 'empresa_cnpj' || Boolean(u.cnpj));

  const handleSyncAllFacial = () => {
    const updated = enableFacialLoginForAllRegisteredUsers();
    setFacialSyncMsg(`Biometrias faciais e credenciais auditadas para ${updated.length} usuários.`);
    setTimeout(() => {
      setFacialSyncMsg(null);
    }, 5000);
  };

  // Open Document Viewer
  const handleOpenViewer = (doc: {
    title: string;
    url: string;
    owner?: string;
    category?: string;
    date?: string;
    details?: string;
  }) => {
    setViewerDoc(doc);
    setViewerZoom(1);
    setViewerRotation(0);
  };

  // Handle direct file download
  const handleDownloadFile = (url: string, filename: string) => {
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    downloadAnchor.target = '_blank';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print document window
  const handlePrintDocument = (url: string, title: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>RM Manutec - Documento: ${title}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: sans-serif; text-align: center; background: #fff; color: #000; }
              img { max-width: 90%; max-height: 85vh; object-fit: contain; margin-top: 15px; }
              .header { font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 8px; }
            </style>
          </head>
          <body>
            <div class="header">RM MANUTEC - REPOSITÓRIO OFICIAL DE DOCUMENTAÇÃO • ${title}</div>
            <img src="${url}" onload="window.print();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Handle local file selection for admin document upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      if (loadEvt.target?.result) {
        setUploadDocFileUrl(loadEvt.target.result as string);
        if (!uploadDocTitle) {
          setUploadDocTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit new document upload by admin
  const handleSaveUploadedDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocFileUrl || !uploadTargetUserId) return;

    const targetUser = users.find((u) => u.id === uploadTargetUserId);
    if (!targetUser) return;

    const updatedUser: UserProfile = { ...targetUser };

    if (uploadDocType === 'document') {
      updatedUser.documentPhotoUrl = uploadDocFileUrl;
      updatedUser.isVerified = true;
      updatedUser.verificationStatus = 'aprovado';
    } else if (uploadDocType === 'selfie') {
      updatedUser.selfiePhotoUrl = uploadDocFileUrl;
      updatedUser.avatar = uploadDocFileUrl;
      updatedUser.facialAuthEnabled = true;
    } else if (uploadDocType === 'crea') {
      updatedUser.documentPhotoUrl = uploadDocFileUrl;
      if (uploadDocTitle) {
        updatedUser.crea = uploadDocTitle;
      }
    }

    if (onSaveUser) {
      onSaveUser(updatedUser);
    } else {
      saveRegisteredUser(updatedUser);
    }

    setIsUploadModalOpen(false);
    setUploadDocFileUrl('');
    setUploadDocTitle('');
    alert(`Documento anexado com sucesso ao perfil de ${targetUser.name}!`);
  };

  // Export JSON Archive of users for admin backup
  const handleExportDataArchive = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      authorizedBy: 'RM Manutec Administrator (Mestre)',
      vaultFolder: activeFolder,
      totalUnifiedDocuments: unifiedDocuments.length,
      totalSelfiesStored: vaultSelfies.length,
      documentsSummary: unifiedDocuments.map((d) => ({
        id: d.id,
        titulo: d.title,
        categoria: d.category,
        proprietario: d.ownerName,
        telefone: d.ownerPhone,
        data: d.dateStr,
        detalhes: d.details
      })),
      corporateClients: corporateUsers.map((c) => ({
        id: c.id,
        razaoSocial: c.companyName || c.name,
        cnpj: c.cnpj,
        responsavelLegal: c.legalRepresentative || c.name,
        email: c.email,
        telefone: c.phone,
        dataCadastro: c.registrationDate
      }))
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `rm-manutec-auditoria-completa-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Storage Vault Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-sky-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shadow-sm shrink-0">
              <FolderLock className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Acesso Restrito: Solicitante e Administrador
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-mono font-bold">
                  {unifiedDocuments.length} Arquivos Armazenados
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-['Space_Grotesk'] mt-1">
                Cofre de Documentos, Empresas & Selfies Biométricas
              </h2>
              <p className="text-xs text-slate-600 max-w-3xl mt-1 leading-relaxed">
                Repositório seguro de cadastros de empresas (CNPJ), fotos de selfies biométricas em tempo real, credenciais profissionais (CREA/CRT), fotos de obras e comprovantes de ordens de serviço.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Anexar novo documento ou foto"
            >
              <Upload className="w-4 h-4" />
              <span>Anexar Documento</span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllFacial}
              className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Auditar e validar biometrias de todos os usuários"
            >
              <ScanFace className="w-4 h-4 text-sky-600" />
              <span className="hidden lg:inline">Validar Biometrias</span>
            </button>

            <button
              type="button"
              onClick={handleExportDataArchive}
              className="px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exportar dossiê completo de arquivos em JSON"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Dossiê</span>
            </button>
          </div>
        </div>

        {facialSyncMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{facialSyncMsg}</span>
          </div>
        )}
      </div>

      {/* Directory / Subfolders Category Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs font-semibold">
        {/* Pasta 1: Todos os Arquivos */}
        <button
          type="button"
          onClick={() => setActiveFolder('all')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeFolder === 'all'
              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
              : 'bg-white border-sky-200 text-slate-600 hover:bg-sky-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Folder className={`w-4 h-4 ${activeFolder === 'all' ? 'text-white' : 'text-sky-600'}`} />
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${activeFolder === 'all' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-800'}`}>
              {unifiedDocuments.length}
            </span>
          </div>
          <div>
            <span className={`font-bold block text-[11px] ${activeFolder === 'all' ? 'text-white' : 'text-slate-900'}`}>Geral</span>
            <span className={`text-[10px] ${activeFolder === 'all' ? 'text-sky-100' : 'text-slate-500'}`}>Todos os Arquivos</span>
          </div>
        </button>

        {/* Pasta 2: Empresas CNPJ */}
        <button
          type="button"
          onClick={() => setActiveFolder('corporate_pj')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeFolder === 'corporate_pj'
              ? 'bg-sky-700 text-white border-sky-700 shadow-sm'
              : 'bg-white border-sky-200 text-slate-600 hover:bg-sky-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Building2 className={`w-4 h-4 ${activeFolder === 'corporate_pj' ? 'text-white' : 'text-sky-600'}`} />
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${activeFolder === 'corporate_pj' ? 'bg-sky-800 text-white' : 'bg-sky-100 text-sky-800'}`}>
              {corporateUsers.length}
            </span>
          </div>
          <div>
            <span className={`font-bold block text-[11px] ${activeFolder === 'corporate_pj' ? 'text-white' : 'text-slate-900'}`}>Empresas CNPJ</span>
            <span className={`text-[10px] ${activeFolder === 'corporate_pj' ? 'text-sky-100' : 'text-slate-500'}`}>Cadastros PJ</span>
          </div>
        </button>

        {/* Pasta 3: Todas as Selfies Biométricas */}
        <button
          type="button"
          onClick={() => setActiveFolder('biometrics')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeFolder === 'biometrics'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white border-sky-200 text-slate-600 hover:bg-emerald-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Camera className={`w-4 h-4 ${activeFolder === 'biometrics' ? 'text-white' : 'text-emerald-600'}`} />
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${activeFolder === 'biometrics' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {unifiedDocuments.filter((d) => d.category === 'selfie_biometrica').length}
            </span>
          </div>
          <div>
            <span className={`font-bold block text-[11px] ${activeFolder === 'biometrics' ? 'text-white' : 'text-slate-900'}`}>Selfies</span>
            <span className={`text-[10px] ${activeFolder === 'biometrics' ? 'text-emerald-100' : 'text-slate-500'}`}>Biometria Facial</span>
          </div>
        </button>

        {/* Pasta 4: Documentos Oficiais (RG/CPF) */}
        <button
          type="button"
          onClick={() => setActiveFolder('documents')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeFolder === 'documents'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white border-sky-200 text-slate-600 hover:bg-indigo-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <FileText className={`w-4 h-4 ${activeFolder === 'documents' ? 'text-white' : 'text-indigo-600'}`} />
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${activeFolder === 'documents' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
              {unifiedDocuments.filter((d) => d.category === 'documento_oficial').length}
            </span>
          </div>
          <div>
            <span className={`font-bold block text-[11px] ${activeFolder === 'documents' ? 'text-white' : 'text-slate-900'}`}>Docs Oficiais</span>
            <span className={`text-[10px] ${activeFolder === 'documents' ? 'text-indigo-100' : 'text-slate-500'}`}>RG / CPF / CNH</span>
          </div>
        </button>

        {/* Pasta 5: Credenciais Técnicas CREA/CRT */}
        <button
          type="button"
          onClick={() => setActiveFolder('technicians')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeFolder === 'technicians'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white border-sky-200 text-slate-600 hover:bg-amber-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <HardHat className={`w-4 h-4 ${activeFolder === 'technicians' ? 'text-white' : 'text-amber-600'}`} />
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${activeFolder === 'technicians' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {unifiedDocuments.filter((d) => d.category === 'crea_crt').length}
            </span>
          </div>
          <div>
            <span className={`font-bold block text-[11px] ${activeFolder === 'technicians' ? 'text-white' : 'text-slate-900'}`}>CREA / CRT</span>
            <span className={`text-[10px] ${activeFolder === 'technicians' ? 'text-amber-100' : 'text-slate-500'}`}>Técnicos</span>
          </div>
        </button>

        {/* Pasta 6: Fotos de Obras */}
        <button
          type="button"
          onClick={() => setActiveFolder('work_photos')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeFolder === 'work_photos'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white border-sky-200 text-slate-600 hover:bg-blue-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <ImageIcon className={`w-4 h-4 ${activeFolder === 'work_photos' ? 'text-white' : 'text-blue-600'}`} />
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${activeFolder === 'work_photos' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {unifiedDocuments.filter((d) => d.category === 'foto_obra').length}
            </span>
          </div>
          <div>
            <span className={`font-bold block text-[11px] ${activeFolder === 'work_photos' ? 'text-white' : 'text-slate-900'}`}>Fotos de Obra</span>
            <span className={`text-[10px] ${activeFolder === 'work_photos' ? 'text-blue-100' : 'text-slate-500'}`}>Antes / Depois</span>
          </div>
        </button>

        {/* Pasta 7: Orçamentos e Laudos */}
        <button
          type="button"
          onClick={() => setActiveFolder('budgets')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeFolder === 'budgets'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white border-sky-200 text-slate-600 hover:bg-rose-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <FileSpreadsheet className={`w-4 h-4 ${activeFolder === 'budgets' ? 'text-white' : 'text-rose-600'}`} />
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${activeFolder === 'budgets' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'}`}>
              {unifiedDocuments.filter((d) => d.category === 'orcamento_laudo').length}
            </span>
          </div>
          <div>
            <span className={`font-bold block text-[11px] ${activeFolder === 'budgets' ? 'text-white' : 'text-slate-900'}`}>Orçamentos</span>
            <span className={`text-[10px] ${activeFolder === 'budgets' ? 'text-rose-100' : 'text-slate-500'}`}>Laudos ART</span>
          </div>
        </button>

        {/* Pasta 8: Comprovantes Financeiros */}
        <button
          type="button"
          onClick={() => setActiveFolder('receipts')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
            activeFolder === 'receipts'
              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
              : 'bg-white border-sky-200 text-slate-600 hover:bg-teal-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Receipt className={`w-4 h-4 ${activeFolder === 'receipts' ? 'text-white' : 'text-teal-600'}`} />
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${activeFolder === 'receipts' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-800'}`}>
              {unifiedDocuments.filter((d) => d.category === 'comprovante_pagamento').length}
            </span>
          </div>
          <div>
            <span className={`font-bold block text-[11px] ${activeFolder === 'receipts' ? 'text-white' : 'text-slate-900'}`}>Recibos PIX</span>
            <span className={`text-[10px] ${activeFolder === 'receipts' ? 'text-teal-100' : 'text-slate-500'}`}>Comprovantes</span>
          </div>
        </button>
      </div>

      {/* Search Filter Toolbar & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-white border border-sky-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar documento, CPF/CNPJ, CREA, titular, O.S...."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <span>Exibindo:</span>
            <strong className="text-slate-900 font-mono">
              {viewMode === 'gallery' ? filteredDocuments.length : filteredUsers.length}
            </strong>
            <span className="text-slate-500">
              {viewMode === 'gallery' ? 'arquivos' : 'cadastros'}
            </span>
          </div>

          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'gallery'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Galeria de Arquivos</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'users'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Dossiês de Usuários</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODE 1: GALLERY VIEW (Direct Unrestricted Document Gallery)  */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDocuments.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-2xl bg-white border border-sky-200 space-y-3 shadow-xs">
              <FolderLock className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-slate-800 font-bold text-sm">Nenhum arquivo ou documento localizado nesta categoria.</p>
              <p className="text-slate-500 text-xs">Tente limpar a pesquisa ou selecionar "Geral".</p>
            </div>
          ) : (
            filteredDocuments.map((doc) => {
              const getCategoryBadge = (cat: UnifiedDocumentItem['category']) => {
                switch (cat) {
                  case 'empresa_cnpj':
                    return { label: 'Empresa CNPJ', color: 'bg-sky-100 text-sky-800 border-sky-300' };
                  case 'documento_oficial':
                    return { label: 'RG / CPF', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
                  case 'crea_crt':
                    return { label: 'CREA / CRT', color: 'bg-amber-100 text-amber-800 border-amber-300' };
                  case 'selfie_biometrica':
                    return { label: 'Selfie Biométrica', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                  case 'foto_obra':
                    return { label: 'Foto de Obra', color: 'bg-blue-100 text-blue-800 border-blue-300' };
                  case 'orcamento_laudo':
                    return { label: 'Orçamento/Laudo', color: 'bg-rose-100 text-rose-800 border-rose-300' };
                  case 'comprovante_pagamento':
                    return { label: 'Comprovante PIX', color: 'bg-teal-100 text-teal-800 border-teal-300' };
                  default:
                    return { label: 'Arquivo', color: 'bg-slate-100 text-slate-800 border-slate-300' };
                }
              };

              const badge = getCategoryBadge(doc.category);

              return (
                <div
                  key={doc.id}
                  className="rounded-2xl bg-white border border-sky-200 hover:border-sky-400 p-4 flex flex-col justify-between gap-3 shadow-xs group transition-all hover:shadow-md relative overflow-hidden"
                >
                  {/* Category & Date Header */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">{doc.dateStr}</span>
                  </div>

                  {/* Document Image Thumbnail Preview */}
                  <div
                    onClick={() =>
                      handleOpenViewer({
                        title: doc.title,
                        url: doc.fileUrl,
                        owner: doc.ownerName,
                        category: badge.label,
                        date: doc.dateStr,
                        details: doc.details
                      })
                    }
                    className="h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer relative group/thumb flex items-center justify-center"
                  >
                    <img
                      src={doc.fileUrl}
                      alt={doc.title}
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-sky-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Ver em Tela Cheia</span>
                      </span>
                    </div>
                  </div>

                  {/* Document Details */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-sky-700 transition-colors">
                      {doc.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Titular: <strong className="text-slate-800">{doc.ownerName}</strong>
                    </p>
                    {doc.details && (
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                        {doc.details}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons: View, Download, Print */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenViewer({
                          title: doc.title,
                          url: doc.fileUrl,
                          owner: doc.ownerName,
                          category: badge.label,
                          date: doc.dateStr,
                          details: doc.details
                        })
                      }
                      className="flex-1 py-1.5 px-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                      <span>Visualizar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadFile(doc.fileUrl, doc.title)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Baixar arquivo original"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintDocument(doc.fileUrl, doc.title)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Imprimir documento"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 2: USER DOSSIER VIEW (Structured Per-User Document Binder) */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* User List Column */}
          <div className="space-y-2.5 max-h-[800px] overflow-y-auto pr-1">
            {filteredUsers.map((u) => {
              const isSelected = selectedUserDetail?.id === u.id;
              const hasDocs = Boolean(u.documentPhotoUrl);
              const hasSelfie = Boolean(u.selfiePhotoUrl || u.avatar);
              const isPJ = u.clientType === 'empresa_cnpj' || Boolean(u.cnpj);

              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserDetail(u)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 shadow-sm'
                      : 'bg-white border-sky-200 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {u.avatar || u.selfiePhotoUrl ? (
                        <img
                          src={u.avatar || u.selfiePhotoUrl}
                          alt={u.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          {isPJ ? <Building2 className="w-5 h-5 text-sky-600" /> : <UserCheck className="w-5 h-5" />}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          isPJ
                            ? 'bg-sky-100 text-sky-800'
                            : u.role === 'tecnico'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isPJ ? 'Empresa CNPJ' : u.role === 'tecnico' ? 'Técnico' : 'Cliente PF'}
                        </span>
                        {u.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                        {u.companyName || u.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {u.cnpj ? `CNPJ: ${u.cnpj}` : u.cpf ? `CPF: ${u.cpf}` : u.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      {hasDocs && <FileCheck className="w-3.5 h-3.5 text-indigo-600" title="Possui Documento Oficial" />}
                      {hasSelfie && <Camera className="w-3.5 h-3.5 text-emerald-600" title="Possui Selfie Cadastrada" />}
                      {u.crea && <HardHat className="w-3.5 h-3.5 text-amber-600" title="Possui CREA/CRT" />}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dossier Expanded Detail Column */}
          <div className="lg:col-span-2">
            {selectedUserDetail ? (
              <div className="p-6 rounded-2xl bg-white border border-sky-200 shadow-sm space-y-6">
                
                {/* Dossier Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {selectedUserDetail.avatar || selectedUserDetail.selfiePhotoUrl ? (
                        <img
                          src={selectedUserDetail.avatar || selectedUserDetail.selfiePhotoUrl}
                          alt={selectedUserDetail.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <UserCheck className="w-7 h-7" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                          {selectedUserDetail.clientType === 'empresa_cnpj' ? 'Empresa CNPJ' : selectedUserDetail.role.toUpperCase()}
                        </span>
                        {selectedUserDetail.isVerified && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Verificado
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                        {selectedUserDetail.companyName || selectedUserDetail.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        ID: {selectedUserDetail.id} • Cadastrado em: {selectedUserDetail.registrationDate || 'Ativo'}
                      </p>
                    </div>
                  </div>

                  {onOpenUserModal && (
                    <button
                      type="button"
                      onClick={() => onOpenUserModal(selectedUserDetail)}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Editar Perfil</span>
                    </button>
                  )}
                </div>

                {/* Grid of Data & Security Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {selectedUserDetail.cnpj && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-bold uppercase block">CNPJ da Empresa:</span>
                      <strong className="text-slate-900 font-mono text-sm">{selectedUserDetail.cnpj}</strong>
                    </div>
                  )}

                  {selectedUserDetail.legalRepresentative && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-bold uppercase block">Responsável Legal:</span>
                      <strong className="text-slate-900">{selectedUserDetail.legalRepresentative}</strong>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">CPF / Documento:</span>
                    <strong className="text-slate-900 font-mono">{selectedUserDetail.cpf || selectedUserDetail.document || 'Não informado'}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Telefone / WhatsApp:</span>
                    <strong className="text-slate-900">{selectedUserDetail.phone}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">E-mail:</span>
                    <strong className="text-slate-900">{selectedUserDetail.email}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Endereço Cadastrado:</span>
                    <strong className="text-slate-900">{selectedUserDetail.address || 'Salvador / RMS'}</strong>
                  </div>
                </div>

                {/* Attached Official Documents in this Dossier */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <FolderLock className="w-4 h-4 text-sky-600" />
                    <span>Documentos Anexados ao Perfil</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Doc 1: Documento Oficial */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Doc. Oficial (RG/CPF)</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {selectedUserDetail.documentPhotoUrl ? 'Presente' : 'Não anexado'}
                        </span>
                      </div>
                      {selectedUserDetail.documentPhotoUrl ? (
                        <div
                          onClick={() =>
                            handleOpenViewer({
                              title: `Doc. Oficial - ${selectedUserDetail.name}`,
                              url: selectedUserDetail.documentPhotoUrl!,
                              owner: selectedUserDetail.name,
                              category: 'RG / CPF'
                            })
                          }
                          className="h-36 rounded-lg overflow-hidden bg-slate-200 cursor-pointer relative group"
                        >
                          <img
                            src={selectedUserDetail.documentPhotoUrl}
                            alt="Documento Oficial"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-sky-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-36 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                          Nenhum RG/CPF anexado
                        </div>
                      )}
                    </div>

                    {/* Doc 2: Selfie Biométrica */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Selfie Biométrica Facial</span>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          {selectedUserDetail.selfiePhotoUrl ? 'Biometria Ativa' : 'Pendente'}
                        </span>
                      </div>
                      {selectedUserDetail.selfiePhotoUrl || selectedUserDetail.avatar ? (
                        <div
                          onClick={() =>
                            handleOpenViewer({
                              title: `Selfie Biométrica - ${selectedUserDetail.name}`,
                              url: selectedUserDetail.selfiePhotoUrl || selectedUserDetail.avatar!,
                              owner: selectedUserDetail.name,
                              category: 'Biometria Facial'
                            })
                          }
                          className="h-36 rounded-lg overflow-hidden bg-slate-200 cursor-pointer relative group"
                        >
                          <img
                            src={selectedUserDetail.selfiePhotoUrl || selectedUserDetail.avatar}
                            alt="Selfie Biométrica"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-sky-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-36 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                          Nenhuma selfie registrada
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white border border-sky-200 text-slate-500 space-y-2">
                <Folder className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-800">Selecione um usuário na lista à esquerda</p>
                <p className="text-xs">Visualize todos os documentos anexados, credenciais e histórico.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADVANCED FULLSCREEN DOCUMENT VIEWER MODAL                     */}
      {/* ------------------------------------------------------------- */}
      {viewerDoc && (
        <div className="fixed inset-0 z-50 bg-sky-950/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in">
          {/* Viewer Top Bar */}
          <div className="flex items-center justify-between text-white border-b border-sky-700/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">{viewerDoc.title}</h3>
                <p className="text-xs text-slate-400">
                  {viewerDoc.owner && `Titular: ${viewerDoc.owner} • `}
                  {viewerDoc.category && `Categoria: ${viewerDoc.category} • `}
                  {viewerDoc.date}
                </p>
              </div>
            </div>

            {/* Viewer Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewerZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 transition-colors"
                title="Reduzir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono px-2 text-slate-300">
                {Math.round(viewerZoom * 100)}%
              </span>

              <button
                type="button"
                onClick={() => setViewerZoom((z) => Math.min(3, z + 0.25))}
                className="p-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 transition-colors"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setViewerRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 transition-colors"
                title="Girar 90 Graus"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handlePrintDocument(viewerDoc.url, viewerDoc.title)}
                className="p-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-200 transition-colors"
                title="Imprimir"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleDownloadFile(viewerDoc.url, viewerDoc.title)}
                className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                title="Baixar Arquivo"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Baixar</span>
              </button>

              <button
                type="button"
                onClick={() => setViewerDoc(null)}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors ml-2"
                title="Fechar"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Viewer Stage Canvas */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4 my-2">
            <div
              style={{
                transform: `scale(${viewerZoom}) rotate(${viewerRotation}deg)`,
                transition: 'transform 0.2s ease-out'
              }}
              className="max-w-4xl max-h-[75vh] flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden bg-black/40 border border-sky-700"
            >
              <img
                src={viewerDoc.url}
                alt={viewerDoc.title}
                className="max-w-full max-h-[70vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Viewer Bottom Details */}
          {viewerDoc.details && (
            <div className="p-3 rounded-xl bg-sky-900/80 border border-sky-700 text-center text-xs text-slate-300 max-w-2xl mx-auto">
              {viewerDoc.details}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADMIN DIRECT DOCUMENT UPLOAD                           */}
      {/* ------------------------------------------------------------- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-sky-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-sky-300 p-6 space-y-4 text-slate-800 animate-in fade-in zoom-in-95 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Anexar Documento ao Repositório</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUploadedDoc} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Usuário de Destino *
                </label>
                <select
                  value={uploadTargetUserId}
                  onChange={(e) => setUploadTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-sky-500 font-semibold"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.companyName ? `[EMPRESA] ${u.companyName}` : `[${u.role.toUpperCase()}] ${u.name}`} ({u.cnpj || u.cpf || u.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tipo de Documento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadDocType('document')}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer ${
                      uploadDocType === 'document'
                        ? 'bg-sky-50 border-sky-500 text-sky-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    RG / CPF / CNPJ
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadDocType('selfie')}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer ${
                      uploadDocType === 'selfie'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Selfie Biométrica
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Título ou Descrição do Documento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Contrato Social / CNH Digital / Foto de Reconhecimento"
                  value={uploadDocTitle}
                  onChange={(e) => setUploadDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Arquivo de Imagem (PNG, JPG, PDF) *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"
                />
              </div>

              {uploadDocFileUrl && (
                <div className="h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex items-center justify-center">
                  <img
                    src={uploadDocFileUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!uploadDocFileUrl}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm disabled:opacity-50"
                >
                  Salvar Documento no Cofre
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
