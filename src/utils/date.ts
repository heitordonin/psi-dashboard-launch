import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte string ISO UTC para horário local brasileiro no formato "HH:mm"
 * @param isoString - String ISO 8601 UTC
 * @returns String no formato "HH:mm" em horário brasileiro
 */
export function isoToLocalHHMM(isoString: string): string {
  try {
    return formatInTimeZone(new Date(isoString), BRAZIL_TIMEZONE, 'HH:mm');
  } catch (error) {
    console.error('Erro ao converter ISO para local:', error);
    return '00:00';
  }
}

/**
 * Arredonda horário para baixo conforme o step
 * @param hhmm - Horário no formato "HH:mm"
 * @param step - Intervalo em minutos (ex: 10)
 * @returns Horário arredondado no formato "HH:mm"
 */
export function floorToStep(hhmm: string, step: number = 10): string {
  try {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const flooredMinutes = Math.floor(minutes / step) * step;
    return `${hours.toString().padStart(2, '0')}:${flooredMinutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Erro ao arredondar horário:', error);
    return hhmm;
  }
}

/**
 * Calcula posição e altura de um agendamento dentro da célula-hora
 * @param hhmm - Horário início no formato "HH:mm"
 * @param durationMinutes - Duração em minutos
 * @returns Objeto com top e height em porcentagem
 */
export function calculatePositionInHour(hhmm: string, durationMinutes: number): {
  top: string;
  height: string;
} {
  try {
    const [, minutes] = hhmm.split(':').map(Number);
    const startMinutes = minutes; // Minutos dentro da hora (0-59)
    
    // Calcular posição como porcentagem da hora
    const top = (startMinutes / 60) * 100;
    const height = Math.min((durationMinutes / 60) * 100, 100); // Máximo 100% da célula
    
    return {
      top: `${top}%`,
      height: `${height}%`
    };
  } catch (error) {
    console.error('Erro ao calcular posição na hora:', error);
    return { top: '0%', height: '100%' };
  }
}

/**
 * Encontra o slot de hora mais próximo para um horário
 * @param hhmm - Horário no formato "HH:mm"
 * @param hourSlots - Array de slots de hora disponíveis
 * @returns Slot de hora correspondente
 */
export function findHourSlot(hhmm: string, hourSlots: string[]): string {
  try {
    const [hours] = hhmm.split(':').map(Number);
    const hourKey = `${hours.toString().padStart(2, '0')}:00`;
    
    // Retorna o slot de hora correspondente ou o primeiro disponível
    return hourSlots.includes(hourKey) ? hourKey : hourSlots[0] || '08:00';
  } catch (error) {
    console.error('Erro ao encontrar slot de hora:', error);
    return hourSlots[0] || '08:00';
  }
}