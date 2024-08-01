export type DateIsoString = `${number}-${number}-${number}`;

export interface StressLevel {
  stressLevel: number;
  date?: DateIsoString;
}
