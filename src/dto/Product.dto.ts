export interface IProduct {
  ProductId?: string;
  ProductName?: string;
  Category?: string;
  Brand?: string;
  sku?: string;
  Description?: string;
  Price?: number;
  Image?: string;
  DiscountPercent?: number;
  isPerishable?: boolean;
  StoreID?: string;
  SupplierID?: string;
  Quantity?: number;
  MOQ?: number;
  IsActive?: boolean;
  Deleted?: boolean;
}

export class ProductDto implements IProduct {
  constructor(
    public ProductId?: string,
    public ProductName?: string,
    public Category?: string,
    public Brand?: string,
    public sku?: string,
    public Description?: string,
    public Price?: number,
    public Image?: string,
    public DiscountPercent?: number,

    public isPerishable?: boolean,
    public StoreID?: string,
    public SupplierID?: string,
    public Quantity?: number,
    public MOQ?: number,
    public IsActive?: boolean,
    public Deleted?: boolean
  ) {}
}
