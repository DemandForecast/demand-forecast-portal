export interface IDashboard {
  count?: number;
  totalStock?: number;
  AnnualSales?: number;
  AnnualProfit?: number;
  StockItems?: number;
  Wastage?: number;
  DailySales?: number;
  MonthlySales?: number[];
  WeeklySales?: number[];
  LastSevenDaysSales?: number[];
}

export class DashboardDto implements IDashboard {
  constructor(

    public count?: number,
    public totalStock?: number,
    public AnnualSales?: number,
    public AnnualProfit?: number,
    public StockItems?: number,
    public Wastage?: number,
    public DailySales?: number,
    public MonthlySales?: number[],
    public WeeklySales?: number[],
    public LastSevenDaysSales?: number[]
  ) {}
}
