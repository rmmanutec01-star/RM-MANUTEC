import { RM_CONTACT_INFO } from '../data/servicesData';

/**
 * Retorna a URL canônica atual do aplicativo em produção / preview
 */
export function getAppShareUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    // Se estiver rodando dentro de um iframe ou em nova aba
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('file:')) {
      return origin;
    }
  }
  return 'https://ais-pre-3w2mhbzar2d3ul4ql5zdq7-86662951442.us-west2.run.app';
}

/**
 * Retorna a URL de acompanhamento direto de um protocolo
 */
export function getTrackingShareUrl(protocolNumber: string): string {
  const base = getAppShareUrl();
  return `${base}?action=tracking&protocol=${encodeURIComponent(protocolNumber)}`;
}

/**
 * Retorna a URL de abertura direta de um serviço
 */
export function getServiceShareUrl(serviceSlug?: string): string {
  const base = getAppShareUrl();
  return serviceSlug ? `${base}?action=solicitar&service=${encodeURIComponent(serviceSlug)}` : `${base}?action=solicitar`;
}

/**
 * Retorna a URL de credenciamento direto de técnicos
 */
export function getTechnicianRegisterShareUrl(): string {
  const base = getAppShareUrl();
  return `${base}?action=cadastro_tecnico`;
}

/**
 * Metadados e Informações Oficiais para Publicação no Google Play Store / PWA / TWA
 */
export const PLAY_STORE_PACKAGE_INFO = {
  packageName: 'br.com.rmmanutec.app',
  appName: 'RM Manutec - Serviços & Manutenção 24h',
  shortName: 'RM Manutec',
  developer: 'RM Manutec Engenharia & Tecnologia',
  version: '1.2.0',
  versionCode: 120,
  targetSdkVersion: 34,
  minSdkVersion: 24,
  category: 'Business & Utilities',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=br.com.rmmanutec.app',
  directInstallUrl: getAppShareUrl(),
  supportEmail: RM_CONTACT_INFO.emailCorporate || RM_CONTACT_INFO.email,
  supportPhone: RM_CONTACT_INFO.phone,
  privacyPolicyUrl: `${getAppShareUrl()}?action=privacidade`
};

/**
 * Texto padrão de compartilhamento institucional do App
 */
export function getAppShareMessage(): string {
  const appUrl = getAppShareUrl();
  return `⚡ *RM MANUTEC - APLICATIVO OFICIAL 24 HORAS* ⚡
_Civil • Elétrica • Ar-Condicionado • Hidráulica • Laudos Técnicos_

Instale agora o aplicativo oficial da RM Manutec no seu celular ou acesse diretamente para solicitar orçamentos, vistorias técnicas e atendimentos emergenciais em Salvador e RMS:

📲 *Acesse ou Instale pelo Link:*
${appUrl}

📞 *Plantão 24h & WhatsApp:* ${RM_CONTACT_INFO.phone}
🏛️ *Atendimento com Emissão de ART/RRT e Garantia de 90 dias.*`;
}

/**
 * Dispara o compartilhamento nativo do navegador (Web Share API) ou copia o link
 */
export async function shareAppNative(customTitle?: string, customText?: string): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'whatsapp' }> {
  const url = getAppShareUrl();
  const title = customTitle || 'RM Manutec - Aplicativo Oficial';
  const text = customText || getAppShareMessage();

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url
      });
      return { success: true, method: 'native' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'native' };
      }
    }
  }

  // Fallback 1: Copiar para área de transferência
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      return { success: true, method: 'clipboard' };
    }
  } catch (e) {
    console.warn('Clipboard write error:', e);
  }

  // Fallback 2: WhatsApp
  const wppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
  window.open(wppUrl, '_blank', 'noopener,noreferrer');
  return { success: true, method: 'whatsapp' };
}
