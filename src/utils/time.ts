/**
 * Gera array de slots de tempo com intervalos configuráveis
 * @param startHour - Hora inicial (ex: 7 para 07:00)
 * @param endHour - Hora final (ex: 19 para 19:00)
 * @param stepMinutes - Intervalo em minutos (10, 30, 60, etc.)
 * @returns Array de strings no formato "HH:mm"
 */
export function generateTimeSlots(
  startHour: number, 
  endHour: number, 
  stepMinutes: number
): string[] {
  const slots: string[] = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += stepMinutes) {
      // Para slots de 60 minutos, só adiciona :00
      if (stepMinutes >= 60 && minute > 0) break;
      
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
      
      // Se chegou na hora final, para
      if (hour === endHour && minute === 0) break;
    }
  }
  
  return slots;
}

/**
 * Converte string de tempo para minutos desde meia-noite
 * @param timeString - Formato "HH:mm"
 * @returns Número de minutos
 */
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos para string de tempo
 * @param minutes - Minutos desde meia-noite
 * @returns String no formato "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}