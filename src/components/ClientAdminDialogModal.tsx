import React, { useState, useRef, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  ServiceRequest,
  AdminClientInteractionThread,
  InteractionDocument,
  DirectInteractionMessage
} from '../types';
import { getBrasiliaFullDateTimeString, getBrasiliaTimeString } from '../lib/brasiliaTime';
import { saveTransmittedDocumentToVault } from '../lib/supabase';
import {
  buildWriterToAdminChatNotification,
  buildWriterToAdminFileNotification,
  buildDirectMessageNotification,
  dispatchWhatsAppNotification,
  openWhatsAppConversation
} from '../lib/whatsappNotifications';
import {
  MessageSquare,
  Send,
  Camera,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Lock,
  Download,
  CheckCircle2,
  Clock,
  ExternalLink,
  User,
  Building2,
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface ClientAdminDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  userRole: UserRole;
  request?: ServiceRequest | null;
  requests?: ServiceRequest[];
  availableRequests?: ServiceRequest[];
  thread?: AdminClientInteractionThread | null;
  onSendMessage?: (threadId: string, msg: DirectInteractionMessage) => void;
  onTransmitDocument?: (threadId: string, doc: InteractionDocument) => void;
}

export const ClientAdminDialogModal: React.FC<ClientAdminDialogModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userRole,
  request,
  requests = [],
  availableRequests = [],
  thread,
  onSendMessage = (_threadId: string, _msg: DirectInteractionMessage) => {},
  onTransmitDocument = (_threadId: string, _doc: InteractionDocument) => {}
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    dataUrl: string;
    fileName: string;
    fileType: 'foto' | 'documento';
    description?: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [whatsappStatusMessage, setWhatsappStatusMessage] = useState<string | null>(null);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userRole === 'admin';
  const threadId = thread?.id || `th-dialog-${currentUser.id}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 150);
    }
  }, [isOpen, thread?.messages?.length, thread?.documents?.length]);

  if (!isOpen) return null;

  // Documents and messages sorted chronologically
  const messages = thread?.messages || [];
  const documents = thread?.documents || [];

  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const textSent = inputText.trim();
    const newMsg: DirectInteractionMessage = {
      id: `msg-${Date.now()}`,
      threadId,
      senderRole: isAdmin ? 'admin' : 'cliente',
      senderName: currentUser.name || (isAdmin ? 'Central RM Manutec' : 'Solicitante'),
      text: textSent,
      timestamp: getBrasiliaFullDateTimeString()
    };

    onSendMessage(threadId, newMsg);

    // Dispara a abertura da conversa no WhatsApp
    let openedUrl = '';
    if (isAdmin) {
      const recipientPhone = thread?.clientPhone || currentUser.phone || '71996492354';
      const notif = buildDirectMessageNotification({
        protocolNumber: thread?.protocolNumber || 'RM-CANAL',
        recipientName: thread?.clientName || 'Solicitante',
        recipientPhone,
        senderName: currentUser.name || 'Central de Gestão RM Manutec',
        senderRole: 'admin',
        messageText: textSent,
        serviceName: thread?.serviceName
      });
      openedUrl = notif.url;
      dispatchWhatsAppNotification({
        type: 'mensagem_chat',
        targetRole: 'cliente',
        recipientName: thread?.clientName || 'Solicitante',
        recipientPhone: notif.targetPhone,
        recipientPhoneFormatted: recipientPhone,
        messageText: notif.message,
        whatsappUrl: notif.url,
        status: 'disparado'
      }, true);
      setWhatsappStatusMessage('Mensagem transmitida e conversa aberta no WhatsApp do cliente!');
    } else {
      // Cliente/escrevente escrevendo no app -> abre conversa no WhatsApp do administrador (71) 99649-2354
      const notif = buildWriterToAdminChatNotification({
        senderName: currentUser.name || 'Solicitante',
        senderPhone: currentUser.phone,
        senderRole: userRole,
        protocolNumber: thread?.protocolNumber,
        serviceName: thread?.serviceName,
        messageText: textSent
      });
      openedUrl = notif.url;
      dispatchWhatsAppNotification({
        type: 'mensagem_chat',
        targetRole: 'admin',
        recipientName: 'Administrador RM Manutec',
        recipientPhone: notif.targetPhone,
        recipientPhoneFormatted: '(71) 99649-2354',
        messageText: notif.message,
        whatsappUrl: notif.url,
        status: 'disparado'
      }, true);
      setWhatsappStatusMessage('Conversa aberta no WhatsApp do Administrador (71 99649-2354)!');
    }

    setLastWhatsAppUrl(openedUrl);
    setTimeout(() => {
      setWhatsappStatusMessage(null);
    }, 7000);

    setInputText('');
    setTimeout(scrollToBottom, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'foto' | 'documento') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedFile({
          dataUrl: event.target.result as string,
          fileName: file.name,
          fileType: type,
          description: type === 'foto' ? 'Foto de vistoria / evidência do local' : 'Documento / Arquivo técnico'
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendFile = () => {
    if (!selectedFile) return;
    setIsUploading(true);

    const nowStr = getBrasiliaFullDateTimeString();
    const docType = selectedFile.fileType === 'foto' ? 'laudo_vistoria' : 'outro';

    const newDoc: InteractionDocument = {
      id: `doc-${Date.now()}`,
      requestId: thread?.requestId,
      protocolNumber: thread?.protocolNumber,
      title: selectedFile.description || selectedFile.fileName,
      description: `Arquivo enviado com segurança por ${currentUser.name} (${isAdmin ? 'Administração' : 'Solicitante'}).`,
      type: docType,
      fileUrl: selectedFile.dataUrl,
      fileName: selectedFile.fileName,
      senderRole: isAdmin ? 'admin' : 'cliente',
      senderName: currentUser.name || (isAdmin ? 'Central RM Manutec' : 'Solicitante'),
      senderPhone: currentUser.phone || '',
      status: 'enviado',
      isLockedForClient: false,
      createdAt: nowStr
    };

    // 1. Transmit document to interaction thread
    onTransmitDocument(threadId, newDoc);

    // 2. Also send an in-chat message informing that an attachment was sent
    const chatMsg: DirectInteractionMessage = {
      id: `msg-doc-${Date.now()}`,
      threadId,
      senderRole: isAdmin ? 'admin' : 'cliente',
      senderName: currentUser.name,
      text: selectedFile.fileType === 'foto'
        ? `📸 Enviou uma foto: "${selectedFile.fileName}"`
        : `📎 Enviou um arquivo: "${selectedFile.fileName}"`,
      timestamp: nowStr,
      document: newDoc
    };
    onSendMessage(threadId, chatMsg);

    // 3. Vault persistence with strict private tag
    try {
      saveTransmittedDocumentToVault({
        id: `vault-dialog-${newDoc.id}`,
        threadId,
        requestId: thread?.requestId,
        protocolNumber: thread?.protocolNumber || 'RM-CANAL',
        clientName: currentUser.name,
        clientPhone: currentUser.phone,
        serviceName: 'Canal de Diálogo & Documentos Seguros',
        title: newDoc.title,
        description: newDoc.description,
        type: newDoc.type,
        category: selectedFile.fileType === 'foto' ? 'laudo_tecnico' : 'documento_oficial',
        fileUrl: newDoc.fileUrl || '',
        fileName: newDoc.fileName || 'arquivo.pdf',
        senderRole: newDoc.senderRole,
        senderName: newDoc.senderName,
        senderPhone: newDoc.senderPhone,
        submittedAt: nowStr,
        status: 'enviado',
        adminNotes: 'Documento transmitido com segurança via canal direto. Acesso restrito a solicitante e administradores.',
        fullDoc: newDoc
      });
    } catch (e) {
      console.warn('Cofre de auditoria:', e);
    }

    // 4. Dispara abertura de conversa no WhatsApp
    let openedUrl = '';
    if (isAdmin) {
      const recipientPhone = thread?.clientPhone || currentUser.phone || '71996492354';
      const notif = buildDirectMessageNotification({
        protocolNumber: thread?.protocolNumber || 'RM-CANAL',
        recipientName: thread?.clientName || 'Solicitante',
        recipientPhone,
        senderName: currentUser.name || 'Central de Gestão RM Manutec',
        senderRole: 'admin',
        messageText: `Transmitiu um arquivo técnico: "${selectedFile.fileName}".`,
        serviceName: thread?.serviceName
      });
      openedUrl = notif.url;
      dispatchWhatsAppNotification({
        type: 'arquivo_transmitido',
        targetRole: 'cliente',
        recipientName: thread?.clientName || 'Solicitante',
        recipientPhone: notif.targetPhone,
        recipientPhoneFormatted: recipientPhone,
        messageText: notif.message,
        whatsappUrl: notif.url,
        status: 'disparado'
      }, true);
      setWhatsappStatusMessage('Arquivo arquivado e conversa aberta no WhatsApp do cliente!');
    } else {
      // Cliente/escrevente transmitindo arquivo -> abre conversa no WhatsApp do administrador (71) 99649-2354
      const notif = buildWriterToAdminFileNotification({
        senderName: currentUser.name || 'Solicitante',
        senderPhone: currentUser.phone,
        senderRole: userRole,
        protocolNumber: thread?.protocolNumber,
        serviceName: thread?.serviceName,
        fileName: selectedFile.fileName,
        fileType: selectedFile.fileType,
        description: selectedFile.description,
        fileUrl: selectedFile.dataUrl
      });
      openedUrl = notif.url;
      dispatchWhatsAppNotification({
        type: 'arquivo_transmitido',
        targetRole: 'admin',
        recipientName: 'Administrador RM Manutec',
        recipientPhone: notif.targetPhone,
        recipientPhoneFormatted: '(71) 99649-2354',
        messageText: notif.message,
        whatsappUrl: notif.url,
        status: 'disparado'
      }, true);
      setWhatsappStatusMessage('Arquivo salvo no cofre e conversa aberta no WhatsApp do Administrador (71 99649-2354)!');
    }

    setLastWhatsAppUrl(openedUrl);
    setTimeout(() => {
      setWhatsappStatusMessage(null);
    }, 7000);

    setIsUploading(false);
    setSelectedFile(null);
    setTimeout(scrollToBottom, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sky-950/80 backdrop-blur-sm">
      <div 
        id="modal-dialogo-solicitante-admin"
        className="relative w-full max-w-2xl h-[88vh] rounded-3xl bg-sky-950 border border-sky-700 shadow-2xl text-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-800 via-sky-800 to-sky-800 border-b border-sky-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {isAdmin ? `Diálogo com ${thread?.clientName || 'Solicitante'}` : 'Canal com a Administração RM Manutec'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                  Canal Seguro
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Eng. Resp.: Roselito Alves de Souza • Salvador & RMS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-sky-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Warning Notice */}
        <div className="bg-gradient-to-r from-blue-900/70 via-indigo-900/50 to-sky-800 px-4 py-2 border-b border-sky-700 text-[11px] text-blue-200 flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Armazenamento Seguro:</strong> Fotos e arquivos enviados são mantidos em cofre criptografado. Apenas o solicitante e a administração têm acesso.
          </span>
        </div>

        {/* WhatsApp Real-Time Direct Integration Notice */}
        <div className="bg-gradient-to-r from-emerald-950/90 via-sky-900 to-emerald-950/80 px-4 py-2 border-b border-emerald-800/40 text-xs text-emerald-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[11px] leading-tight">
              <strong>Integração com WhatsApp do Administrador:</strong> Todas as mensagens e arquivos abrem conversa direta no WhatsApp da Administração <strong>(71) 99649-2354</strong>.
            </span>
          </div>
          <a
            href={`https://wa.me/5571996492354?text=${encodeURIComponent(`Olá! Sou ${currentUser.name || 'solicitante'} e estou usando o canal direto de mensagens no aplicativo RM Manutec.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Admin</span>
          </a>
        </div>

        {/* Action Toast / Feedback Bar */}
        {whatsappStatusMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs flex items-center justify-between gap-2 shrink-0 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="font-semibold">{whatsappStatusMessage}</span>
            </div>
            {lastWhatsAppUrl && (
              <a
                href={lastWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-0.5 rounded bg-white text-emerald-800 font-bold text-[10px] hover:bg-emerald-50 flex items-center gap-1 shrink-0"
              >
                <span>Reabrir Conversa</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Conversation Message Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-sky-950/90">
          {/* Welcome Message Stamp */}
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950 border border-sky-800 text-slate-400 text-[10px] font-semibold">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Início da comunicação segura criptografada</span>
            </div>
          </div>

          {/* Initial Greeting if empty */}
          {messages.length === 0 && documents.length === 0 && (
            <div className="p-5 rounded-2xl bg-sky-950/90 border border-sky-800 text-center space-y-2 max-w-md mx-auto my-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-sm">
                Canal Aberto para Mensagens & Arquivos
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Envie suas dúvidas, laudos, fotos de vistoria ou comprovantes. Nossa equipe de engenharia e a administração central responderão prontamente.
              </p>
            </div>
          )}

          {/* List of Documents Attached */}
          {documents.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-blue-400" />
                <span>Arquivos e Fotos no Cofre Seguro ({documents.length}):</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {documents.map((doc) => {
                  const isImage = doc.fileUrl && (doc.fileUrl.startsWith('data:image') || doc.fileUrl.includes('unsplash') || doc.fileUrl.endsWith('.jpg') || doc.fileUrl.endsWith('.png'));

                  return (
                    <div
                      key={doc.id}
                      className="p-3 rounded-2xl bg-sky-950 border border-sky-800 hover:border-sky-700 flex flex-col justify-between space-y-2 text-xs transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        {isImage ? (
                          <img
                            src={doc.fileUrl}
                            alt={doc.title}
                            onClick={() => setPreviewImage(doc.fileUrl || null)}
                            className="w-12 h-12 rounded-xl object-cover border border-sky-700 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <strong className="text-white block truncate text-[11px]">{doc.title}</strong>
                          <span className="text-[10px] text-slate-400 block truncate">{doc.fileName}</span>
                          <span className="text-[9px] text-emerald-400 font-medium block mt-0.5">
                            Por: {doc.senderName} ({doc.senderRole === 'admin' ? 'Admin' : 'Solicitante'})
                          </span>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-sky-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">{doc.createdAt?.slice(0, 16)}</span>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            download={doc.fileName || 'arquivo'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-md bg-sky-900 hover:bg-sky-800 text-blue-300 font-bold flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>Visualizar</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List of Messages */}
          {messages.map((msg) => {
            const isMe = (isAdmin && msg.senderRole === 'admin') || (!isAdmin && msg.senderRole !== 'admin');

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <span className="text-[10px] text-slate-400 px-1 font-medium">
                  {msg.senderName} • {msg.senderRole === 'admin' ? 'Administração' : 'Solicitante'}
                </span>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                      : 'bg-sky-900 text-slate-100 rounded-tl-none border border-sky-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className={`block text-[9px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                    {msg.timestamp?.slice(11, 16) || 'Agora'}
                  </span>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Selected File Upload Preview Drawer */}
        {selectedFile && (
          <div className="p-3 bg-sky-900 border-t border-sky-700 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {selectedFile.fileType === 'foto' ? (
                <img
                  src={selectedFile.dataUrl}
                  alt="Pré-visualização"
                  className="w-12 h-12 rounded-xl object-cover border border-blue-500 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="truncate">
                <span className="text-[10px] text-blue-400 font-bold uppercase block">
                  Pronto para envio seguro:
                </span>
                <p className="font-bold text-white truncate text-xs">{selectedFile.fileName}</p>
                <input
                  type="text"
                  value={selectedFile.description || ''}
                  onChange={(e) => setSelectedFile({ ...selectedFile, description: e.target.value })}
                  placeholder="Adicione uma legenda para este arquivo (opcional)..."
                  className="mt-1 w-full bg-sky-950 px-2 py-1 rounded text-[11px] text-slate-200 outline-none border border-sky-700 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={isUploading}
                onClick={handleSendFile}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Enviando...' : 'Enviar'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Message & File Attachment Bar */}
        <form onSubmit={handleSendTextMessage} className="p-3 sm:p-4 bg-sky-900 border-t border-sky-700 flex items-center gap-2 shrink-0">
          {/* File Picker Inputs (Hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e, 'documento')}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={photoInputRef}
            onChange={(e) => handleFileChange(e, 'foto')}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* Photo Button */}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-blue-400 hover:text-blue-300 border border-sky-700 transition-colors cursor-pointer"
            title="Tirar foto ou enviar da galeria"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-sky-900 hover:bg-sky-800 text-slate-300 hover:text-white border border-sky-700 transition-colors cursor-pointer"
            title="Enviar arquivo ou PDF"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite sua mensagem para a Administração..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-sky-950 border border-sky-700 text-white placeholder-slate-500 text-xs outline-none focus:border-blue-500 font-sans"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>

        {/* Full Image Preview Lightbox */}
        {previewImage && (
          <div 
            className="fixed inset-0 z-60 bg-sky-950/90 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-3xl max-h-[85vh]">
              <img
                src={previewImage}
                alt="Foto Ampliada"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-sky-700"
              />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-sky-950/80 text-white hover:bg-sky-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
