export type DriverPeriodStats = {
  deliveries: number;
  bottles: number;
  value: number;
};

export type DriverDay = { date: string; deliveries: number };

export type DriverSummary = {
  activeDeliveries: number;
  today: DriverPeriodStats;
  week: DriverPeriodStats;
  month: DriverPeriodStats;
  allTime: DriverPeriodStats;
  daily: DriverDay[];
};
