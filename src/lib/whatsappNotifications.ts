import { UserProfile, ServiceRequest, DirectInteractionMessage } from '../types';
import { RM_CONTACT_INFO, ADMIN_AUTH_CONFIG } from '../data/servicesData';
import { getAppShareUrl, getTrackingShareUrl } from './shareUtils';

export interface WhatsAppNotificationLog {
  id: string;
  type: 'cadastro_cliente' | 'cadastro_tecnico' | 'solicitacao_servico' | 'mensagem_chat' | 'orcamento' | 'status_atualizado' | 'recuperacao_senha' | 'senha_alterada' | 'confirmacao_acesso' | 'arquivo_transmitido';
  targetRole: 'admin' | 'cliente' | 'tecnico';
  recipientName: string;
  recipientPhone: string;
  recipientPhoneFormatted: string;
  messageText: string;
  whatsappUrl: string;
  timestamp: string;
  status: 'disparado' | 'aberto' | 'pronto';
}

const STORAGE_KEY = 'rm_manutec_whatsapp_logs_v1';

/**
 * Normaliza qualquer número de telefone brasileiro para o formato internacional aceito pela API do WhatsApp (ex: 5571996492354)
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '5571996492354';
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('55') && clean.length >= 12) {
    return clean;
  }
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  if (clean.length === 8 || clean.length === 9) {
    return `5571${clean}`;
  }
  return clean ? `55${clean}` : '5571996492354';
}

/**
 * Retorna o número oficial de WhatsApp da Administração Central
 */
export function getAdminWhatsAppNumber(): string {
  return formatWhatsAppNumber(ADMIN_AUTH_CONFIG.authorizedWhatsApp || RM_CONTACT_INFO.whatsapp);
}

/**
 * Monta o link direto do WhatsApp Web/Mobile com mensagem codificada
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalizedPhone = formatWhatsAppNumber(phone);
  return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * 1. Template: Notificação para o Administrador sobre NOVO CADASTRO de Cliente ou Técnico
 * Disparada automaticamente para o WhatsApp da Administração: (71) 99649-2354
 */
export function buildNewUserAdminNotification(user: UserProfile): { message: string; url: string; targetPhone: string } {
  const isTechnician = user.role === 'tecnico';
  const targetPhone = '5571996492354'; // Número oficial do Administrador

  const message = [
    `🔔 *RM MANUTEC - ALERTA DA CENTRAL OPERACIONAL* 🔔`,
    ``,
    `📋 *NOVO CADASTRO REALIZADO NA PLATAFORMA*`,
    `----------------------------------------`,
    `👤 *Tipo de Perfil:* ${isTechnician ? '👷‍♂️ Profissional Técnico Credenciado' : '🏢 Cliente / Solicitante'}`,
    `👤 *Nome Completo:* ${user.name}`,
    `📞 *Telefone / WhatsApp:* ${user.phone}`,
    `✉️ *E-mail:* ${user.email || 'Não informado'}`,
    `📄 *CPF:* ${user.cpf || user.document || 'Validado'}`,
    user.rg ? `🪪 *RG:* ${user.rg}` : null,
    isTechnician && user.specialty ? `⚡ *Especialidade:* ${user.specialty}` : null,
    isTechnician && user.crea ? `🏛️ *CREA-BA:* ${user.crea}` : null,
    isTechnician && user.crt ? `🏛️ *CRT:* ${user.crt}` : null,
    user.address ? `📍 *Endereço/Região:* ${user.address}` : null,
    ``,
    `🔐 *Autenticação:* Senha Cadastrada e Protegida`,
    `🛡️ *Status da Conta:* *${user.verificationStatus ? user.verificationStatus.toUpperCase() : 'APROVADO'}*`,
    ``,
    `⏰ *Data/Horário:* ${new Date().toLocaleString('pt-BR')}`,
    `----------------------------------------`,
    `_Central de Supervisão RM Manutec - Gestão Salvador e RMS_`
  ].filter(Boolean).join('\n');

  return {
    message,
    url: buildWhatsAppUrl(targetPhone, message),
    targetPhone
  };
}

/**
 * 2. Template: Notificação de Boas-Vindas enviada pelo Administrador para o Cliente ou Técnico recém-cadastrado
 */
export function buildNewUserWelcomeNotification(user: UserProfile): { message: string; url: string; targetPhone: string } {
  const targetPhone = formatWhatsAppNumber(user.phone);
  const isTechnician = user.role === 'tecnico';
  const appUrl = getAppShareUrl();

  const message = [
    `🏢 *RM MANUTEC SERVIÇOS & MANUTENÇÃO* 🏢`,
    `_Engenharia, Climatização, Elétrica e Construção Civil_`,
    ``,
    `Olá, *${user.name.split(' ')[0]}*! Seja bem-vindo(a) à RM Manutec.`,
    ``,
    `✅ Seu cadastro como *${isTechnician ? 'Profissional Técnico' : 'Cliente'}* foi registrado com sucesso em nosso sistema oficial.`,
    ``,
    `🛡️ *Dados de Acesso:*`,
    `• CPF de Acesso: ${user.cpf}`,
    `• Senha: Criada no seu cadastramento`,
    `• Telefone Cadastrado: ${user.phone}`,
    isTechnician && user.crea ? `• Registro Profissional: ${user.crea}` : null,
    ``,
    isTechnician 
      ? `👨‍🔧 A nossa Central Operacional já está sincronizada com seu perfil. Você poderá acessar os chamados e ordens de serviço disponíveis na sua região.`
      : `🛠️ Você já pode solicitar orçamentos, vistorias presenciais e atendimentos emergenciais 24 horas diretamente pelo nosso sistema ou respondendo a esta mensagem.`,
    ``,
    `📲 *Acesse o Aplicativo:*`,
    appUrl,
    ``,
    `📞 *Central 24h & Plantão Técnico:* ${RM_CONTACT_INFO.phone}`,
    `🌐 *Atendimento e Supervisão Manutec Salvador - BA*`
  ].filter(Boolean).join('\n');

  return {
    message,
    url: buildWhatsAppUrl(targetPhone, message),
    targetPhone
  };
}

/**
 * 2.1 Template: Notificação com Código de Recuperação de Senha enviada via WhatsApp
 */
export function buildPasswordRecoveryNotification(user: UserProfile, code: string): { message: string; url: string; targetPhone: string } {
  const targetPhone = formatWhatsAppNumber(user.phone);

  const message = [
    `🔐 *RM MANUTEC - RECUPERAÇÃO DE SENHA* 🔐`,
    ``,
    `Olá, *${user.name.split(' ')[0]}*!`,
    `Recebemos uma solicitação para redefinir a sua senha de acesso à RM Manutec.`,
    ``,
    `🔑 *SEU CÓDIGO DE RECUPERAÇÃO:*`,
    `👉 *${code}*`,
    ``,
    `⏱️ Este código expira em *15 minutos*.`,
    `🛡️ Por segurança, nunca compartilhe este código com terceiros.`,
    ``,
    `Se você não solicitou a alteração de senha, ignore esta mensagem com segurança.`,
    `----------------------------------------`,
    `_Central de Atendimento e Segurança RM Manutec_`
  ].join('\n');

  return {
    message,
    url: buildWhatsAppUrl(targetPhone, message),
    targetPhone
  };
}

/**
 * 2.2 Template: Notificação de Confirmação de Senha Alterada com Sucesso
 */
export function buildPasswordChangedConfirmationNotification(user: UserProfile): { message: string; url: string; targetPhone: string } {
  const targetPhone = formatWhatsAppNumber(user.phone);

  const message = [
    `✅ *RM MANUTEC - SENHA ALTERADA COM SUCESSO*`,
    ``,
    `Olá, *${user.name.split(' ')[0]}*!`,
    `A sua senha de acesso ao portal RM Manutec foi atualizada com sucesso.`,
    ``,
    `👤 *CPF de Acesso:* ${user.cpf}`,
    `⏰ *Data/Horário:* ${new Date().toLocaleString('pt-BR')}`,
    ``,
    `Se você não realizou essa alteração, entre em contato imediatamente com nossa central 24h: ${RM_CONTACT_INFO.phone}.`,
    `----------------------------------------`,
    `_Segurança da Informação RM Manutec_`
  ].join('\n');

  return {
    message,
    url: buildWhatsAppUrl(targetPhone, message),
    targetPhone
  };
}

/**
 * 3. Template: Notificação para o Administrador sobre NOVA SOLICITAÇÃO DE SERVIÇO
 */
export function buildNewRequestAdminNotification(request: ServiceRequest): { message: string; url: string; targetPhone: string } {
  const targetPhone = getAdminWhatsAppNumber();
  const addressFormatted = `${request.address.street}, ${request.address.number}${request.address.neighborhood ? ' - ' + request.address.neighborhood : ''}, ${request.address.city || 'Salvador - BA'}${request.address.complement ? ' (' + request.address.complement + ')' : ''}`;
  const trackingUrl = getTrackingShareUrl(request.protocolNumber);

  const urgencyLabel = request.urgency === 'urgente_24h' 
    ? '🚨 EMERGÊNCIA 24H (IMEDIATO)' 
    : request.urgency === 'alta' 
      ? '⚡ ALTA PRIORIDADE' 
      : '🟢 NORMAL / PROGRAMADO';

  const message = [
    `⚡ *RM MANUTEC - NOVO CHAMADO REGISTRADO* ⚡`,
    ``,
    `📋 *Protocolo:* ${request.protocolNumber}`,
    `🛠️ *Serviço:* ${request.serviceName}`,
    `🏷️ *Categoria:* ${request.category.toUpperCase()}`,
    `⚠️ *Prioridade:* ${urgencyLabel}`,
    `📅 *Data Agendada:* ${request.preferredDate || 'Hoje'} (${request.preferredPeriod?.toUpperCase() || 'MANHÃ'})`,
    ``,
    `👤 *DADOS DO CLIENTE:*`,
    `• Nome: *${request.clientName}*`,
    `• Telefone/WhatsApp: *${request.clientPhone}*`,
    request.clientCpf ? `• CPF: ${request.clientCpf}` : null,
    `📍 *Endereço:* ${addressFormatted}`,
    ``,
    `📝 *Descrição / Escopo:*`,
    `"${request.description}"`,
    ``,
    request.selectedOptions && request.selectedOptions.length > 0 
      ? `🔧 *Itens Solicitados:* ${request.selectedOptions.join(', ')}` 
      : null,
    request.inspectionFee 
      ? `💰 *Taxa de Vistoria:* R$ ${request.inspectionFee.amount.toFixed(2).replace('.', ',')} (${request.inspectionFee.isPaid ? '✅ PAGA' : '⏳ PENDENTE'})` 
      : null,
    ``,
    `🔗 *Acompanhar / Gerenciar no Painel:*`,
    trackingUrl,
    ``,
    `⏰ *Data/Hora:* ${new Date().toLocaleString('pt-BR')}`,
    `----------------------------------------`,
    `_Ação Recomendada: Abrir painel para alocação de técnico ou entrar em contato com o cliente via WhatsApp._`
  ].filter(Boolean).join('\n');

  return {
    message,
    url: buildWhatsAppUrl(targetPhone, message),
    targetPhone
  };
}

/**
 * 4. Template: Notificação para o Cliente confirmando a abertura da SOLICITAÇÃO
 */
export function buildNewRequestClientNotification(request: ServiceRequest): { message: string; url: string; targetPhone: string } {
  const targetPhone = formatWhatsAppNumber(request.clientPhone);
  const trackingUrl = getTrackingShareUrl(request.protocolNumber);

  const message = [
    `🔧 *RM MANUTEC - CONFIRMAÇÃO DE SOLICITAÇÃO* 🔧`,
    ``,
    `Olá, *${request.clientName.split(' ')[0]}*! Recebemos a sua solicitação com sucesso.`,
    ``,
    `📌 *Número do Protocolo:* *${request.protocolNumber}*`,
    `🛠️ *Serviço:* ${request.serviceName}`,
    `📅 *Data Preferencial:* ${request.preferredDate || 'A combinar'} (${request.preferredPeriod?.toUpperCase() || 'MANHÃ'})`,
    `📍 *Local do Atendimento:* ${request.address.street}, ${request.address.number} - ${request.address.neighborhood || ''}`,
    ``,
    `👷‍♂️ *Próximos Passos:*`,
    `1. Nossa equipe técnica da *Supervisão Manutec* já está analisando seu chamado.`,
    `2. Um técnico credenciado será designado para o seu endereço no horário programado.`,
    `3. Você pode acompanhar o status em tempo real com seu protocolo pelo link abaixo:`,
    ``,
    `🔗 *Acompanhe seu Chamado em Tempo Real:*`,
    trackingUrl,
    ``,
    `📞 *Dúvidas ou Emergências?* Fale conosco respondendo a esta mensagem ou ligue para ${RM_CONTACT_INFO.phone}.`,
    ``,
    `_RM Manutec - Qualidade, Segurança e Atendimento Especializado!_`
  ].filter(Boolean).join('\n');

  return {
    message,
    url: buildWhatsAppUrl(targetPhone, message),
    targetPhone
  };
}

/**
 * 5. Template: Notificação de Mensagem enviada pelo Administrador ou Cliente no Atendimento
 */
export function buildDirectMessageNotification(params: {
  protocolNumber: string;
  recipientName: string;
  recipientPhone: string;
  senderName: string;
  senderRole: 'admin' | 'cliente' | 'tecnico';
  messageText: string;
  serviceName?: string;
}): { message: string; url: string; targetPhone: string } {
  const targetPhone = formatWhatsAppNumber(params.recipientPhone);
  const isAdmin = params.senderRole === 'admin';
  const trackingUrl = getTrackingShareUrl(params.protocolNumber);

  const message = [
    `💬 *RM MANUTEC - NOTIFICAÇÃO DE MENSAGEM* 💬`,
    ``,
    `📋 *Protocolo:* ${params.protocolNumber}`,
    params.serviceName ? `🛠️ *Serviço:* ${params.serviceName}` : null,
    `👤 *De:* ${isAdmin ? 'Central de Supervisão RM Manutec' : params.senderName}`,
    `👤 *Para:* ${params.recipientName}`,
    ``,
    `📝 *Mensagem:*`,
    `"${params.messageText}"`,
    ``,
    `🔗 *Acessar Chat no Aplicativo:*`,
    trackingUrl,
    ``,
    `⏰ *Horário:* ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date().toLocaleDateString('pt-BR')}`,
    `----------------------------------------`,
    `_Responda a esta mensagem para dar continuidade ao atendimento._`
  ].filter(Boolean).join('\n');

  return {
    message,
    url: buildWhatsAppUrl(targetPhone, message),
    targetPhone
  };
}

/**
 * 6. Template: Notificação de Orçamento Emitido pelo Admin
 */
export function buildBudgetNotification(params: {
  protocolNumber: string;
  clientName: string;
  clientPhone: string;
  budgetTitle: string;
  totalAmount: number;
  laborAmount?: number;
  materialsAmount?: number;
  validityDays?: number;
  notes?: string;
}): { message: string; url: string; targetPhone: string } {
  const targetPhone = formatWhatsAppNumber(params.clientPhone);
  const trackingUrl = getTrackingShareUrl(params.protocolNumber);

  const message = [
    `📄 *RM MANUTEC - PROPOSTA / ORÇAMENTO TÉCNICO* 📄`,
    ``,
    `Olá, *${params.clientName.split(' ')[0]}*!`,
    `Elaboramos o orçamento oficial para o seu atendimento técnico sob o protocolo *${params.protocolNumber}*.`,
    ``,
    `📌 *Título:* ${params.budgetTitle}`,
    `💰 *Valor Total da Proposta:* *R$ ${params.totalAmount.toFixed(2).replace('.', ',')}*`,
    params.laborAmount ? `• Mão de obra técnica: R$ ${params.laborAmount.toFixed(2).replace('.', ',')}` : null,
    params.materialsAmount ? `• Materiais certificados: R$ ${params.materialsAmount.toFixed(2).replace('.', ',')}` : null,
    params.validityDays ? `⏱️ *Validade da Proposta:* ${params.validityDays} dias corridos` : null,
    ``,
    params.notes ? `📝 *Observações Técnicas:* "${params.notes}"\n` : null,
    `💳 *Formas de Pagamento:* PIX com 5% de desconto, Cartão de Crédito em até 12x, Débito ou Faturamento PJ.`,
    ``,
    `🔗 *Visualizar e Aprovar Orçamento no App:*`,
    trackingUrl,
    ``,
    `Para aprovar o orçamento ou tirar dúvidas com o engenheiro responsável, basta responder a esta mensagem.`,
    `----------------------------------------`,
    `_Supervisão Manutec - ${RM_CONTACT_INFO.phone}_`
  ].filter(Boolean).join('\n');

  return {
    message,
    url: buildWhatsAppUrl(targetPhone, message),
    targetPhone
  };
}

/**
 * 7. Template: Notificação de Mensagem Direta do Usuário/Solicitante para o WhatsApp do Administrador
 * Dispara automaticamente a conversa no WhatsApp oficial da administração (71) 99649-2354
 */
export function buildWriterToAdminChatNotification(params: {
  senderName: string;
  senderPhone?: string;
  senderRole?: 'cliente' | 'tecnico' | 'admin' | string;
  protocolNumber?: string;
  serviceName?: string;
  messageText: string;
}): { message: string; url: string; targetPhone: string } {
  const targetPhone = '5571996492354'; // WhatsApp oficial do Administrador
  const trackingUrl = params.protocolNumber ? getTrackingShareUrl(params.protocolNumber) : getAppShareUrl();
  const roleLabel = params.senderRole === 'tecnico' ? '👷‍♂️ Profissional Técnico Credenciado' : '🏢 Cliente / Solicitante';

  const message = [
    `💬 *RM MANUTEC - CANAL DE DIÁLOGO DIRETO* 💬`,
    ``,
    params.protocolNumber ? `📋 *Protocolo do Chamado:* ${params.protocolNumber}` : null,
    params.serviceName ? `🛠️ *Serviço / Assunto:* ${params.serviceName}` : null,
    `👤 *Pessoa Escrevente:* *${params.senderName}* (${roleLabel})`,
    params.senderPhone ? `📞 *Telefone do Solicitante:* ${params.senderPhone}` : null,
    ``,
    `📝 *Mensagem digitada no aplicativo:*`,
    `"${params.messageText}"`,
    ``,
    `🔗 *Acessar Painel / Chamado no App:*`,
    trackingUrl,
    ``,
    `⏰ *Horário:* ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • ${new Date().toLocaleDateString('pt-BR')}`,
    `----------------------------------------`,
    `_Conversa direta aberta entre o usuário no aplicativo e a Administração RM Manutec._`
  ].filter(Boolean).join('\n');

  return {
    message,
    url: buildWhatsAppUrl(targetPhone, message),
    targetPhone
  };
}

/**
 * 8. Template: Notificação de Envio de Arquivo / Foto para o WhatsApp do Administrador
 * Dispara automaticamente a conversa no WhatsApp oficial da administração (71) 99649-2354
 */
export function buildWriterToAdminFileNotification(params: {
  senderName: string;
  senderPhone?: string;
  senderRole?: 'cliente' | 'tecnico' | 'admin' | string;
  protocolNumber?: string;
  serviceName?: string;
  fileName: string;
  fileType: 'foto' | 'documento' | 'projeto' | 'comprovante' | string;
  description?: string;
  fileUrl?: string;
}): { message: string; url: string; targetPhone: string } {
  const targetPhone = '5571996492354'; // WhatsApp oficial do Administrador
  const trackingUrl = params.protocolNumber ? getTrackingShareUrl(params.protocolNumber) : getAppShareUrl();
  const roleLabel = params.senderRole === 'tecnico' ? '👷‍♂️ Profissional Técnico Credenciado' : '🏢 Cliente / Solicitante';
  const typeLabel = 
    params.fileType === 'foto' ? '📸 Foto / Evidência Visual do Local' :
    params.fileType === 'comprovante' ? '💳 Comprovante de Pagamento' :
    params.fileType === 'projeto' ? '📐 Projeto / Planta Técnica' : '📎 Documento Técnico';

  const message = [
    `📎 *RM MANUTEC - NOVO ARQUIVO / FOTO TRANSMITIDO* 📎`,
    ``,
    params.protocolNumber ? `📋 *Protocolo do Chamado:* ${params.protocolNumber}` : null,
    params.serviceName ? `🛠️ *Serviço / Assunto:* ${params.serviceName}` : null,
    `👤 *Enviado no App por:* *${params.senderName}* (${roleLabel})`,
    params.senderPhone ? `📞 *Telefone do Solicitante:* ${params.senderPhone}` : null,
    `📂 *Classificação:* ${typeLabel}`,
    `📄 *Nome do Arquivo:* ${params.fileName}`,
    params.description ? `📝 *Descrição do Anexo:* "${params.description}"` : null,
    ``,
    `🔒 *Segurança:* Arquivado no Cofre de Auditoria RM Manutec com acesso restrito.`,
    `🔗 *Visualizar Arquivo no App:*`,
    trackingUrl,
    ``,
    `⏰ *Horário:* ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • ${new Date().toLocaleDateString('pt-BR')}`,
    `----------------------------------------`,
    `_Conversa direta aberta entre o usuário no aplicativo e a Administração RM Manutec._`
  ].filter(Boolean).join('\n');

  return {
    message,
    url: buildWhatsAppUrl(targetPhone, message),
    targetPhone
  };
}

/**
 * Abre diretamente uma conversa de WhatsApp no navegador/dispositivo
 */
export function openWhatsAppConversation(phone: string, message: string): string {
  const url = buildWhatsAppUrl(phone, message);
  if (typeof window !== 'undefined') {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Bloqueador de popup do navegador interceptou a abertura:', e);
    }
  }
  return url;
}

/**
 * Executa o disparo / registro da notificação WhatsApp
 */
export function dispatchWhatsAppNotification(
  logData: Omit<WhatsAppNotificationLog, 'id' | 'timestamp'>,
  autoOpen: boolean = true
): WhatsAppNotificationLog {
  const newLog: WhatsAppNotificationLog = {
    ...logData,
    id: `wpp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };

  saveNotificationLog(newLog);

  if (autoOpen && typeof window !== 'undefined') {
    try {
      window.open(newLog.whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Pop-up do WhatsApp bloqueado pelo navegador:', e);
    }
  }

  return newLog;
}

/**
 * Salva log no localStorage
 */
export function saveNotificationLog(log: WhatsAppNotificationLog): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getNotificationHistory();
    const updated = [log, ...existing].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao salvar log de WhatsApp:', e);
  }
}

/**
 * Obtém histórico de notificações disparadas
 */
export function getNotificationHistory(): WhatsAppNotificationLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}
