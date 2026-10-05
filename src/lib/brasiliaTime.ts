/**
 * Utilitários para padronização de Data e Horário Oficial de Brasília (America/Sao_Paulo - UTC-3)
 * RM Manutec - Sistema de Gestão Operacional e Atendimento
 */

export const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna a data formatada no padrão brasileiro (DD/MM/AAAA) no fuso de Brasília
 */
export function getBrasiliaDateString(date: Date | number | string = new Date()): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Retorna o horário formatado (HH:mm) no fuso de Brasília
 */
export function getBrasiliaTimeString(date: Date | number | string = new Date()): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleTimeString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Retorna data e hora completa (DD/MM/AAAA HH:mm) no fuso de Brasília
 */
export function getBrasiliaFullDateTimeString(date: Date | number | string = new Date()): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return `${getBrasiliaDateString(d)} ${getBrasiliaTimeString(d)}`;
}

/**
 * Retorna string para inputs HTML do tipo date (YYYY-MM-DD) no fuso de Brasília
 */
export function getBrasiliaISODateString(date: Date | number | string = new Date()): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('fr-CA', {
    timeZone: BRASILIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
}

/**
 * Retorna a data de amanhã no formato YYYY-MM-DD no fuso de Brasília
 */
export function getTomorrowBrasiliaISODateString(): string {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return getBrasiliaISODateString(tomorrow);
}

/**
 * Retorna timestamp ISO atual
 */
export function getBrasiliaISOString(): string {
  return new Date().toISOString();
}

/**
 * Formata um carimbo de data/hora amigável com indicador de fuso Brasília
 */
export function formatFriendlyBrasiliaStamp(date: Date | number | string = new Date()): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return `${getBrasiliaDateString(d)} às ${getBrasiliaTimeString(d)} (Horário de Brasília)`;
}
