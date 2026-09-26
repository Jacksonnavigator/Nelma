export type DriverPeriodStats = {
  deliveries: number;
  bottles: number;
  value: number;
};

export type DriverDay = { date: string; deliveries: number };

export type DriverSummary = {
  /** Missing on older backends; treat as on duty. */
  onDuty?: boolean;
  activeDeliveries: number;
  today: DriverPeriodStats;
  week: DriverPeriodStats;
  month: DriverPeriodStats;
  allTime: DriverPeriodStats;
  daily: DriverDay[];
};
