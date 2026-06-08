/**
 * Utility functions for time calculations
 */

/**
 * Add minutes to a time string (HH:mm format)
 * @param timeStr - Time string in HH:mm format
 * @param minutes - Minutes to add
 * @returns New time string in HH:mm format
 */
export const addMinutesToTime = (timeStr: string, minutes: number): string => {
  const [hours, mins] = timeStr.split(':').map(Number);
  let totalMinutes = hours * 60 + mins + minutes;
  
  // Handle day overflow (max 24 hours = 1440 minutes)
  totalMinutes = totalMinutes % 1440;
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

/**
 * Calculate minutes between two time strings
 * @param hora1 - First time in HH:mm format
 * @param hora2 - Second time in HH:mm format
 * @returns Absolute difference in minutes
 */
export const calcularMinutosEntre = (hora1: string, hora2: string): number => {
  const [h1, m1] = hora1.split(':').map(Number);
  const [h2, m2] = hora2.split(':').map(Number);
  return Math.abs((h2 * 60 + m2) - (h1 * 60 + m1));
};
