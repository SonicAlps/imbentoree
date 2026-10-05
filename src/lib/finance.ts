import {
  getProductCost,
  products,
  type ProductName,
} from "@/src/lib/products";

export type FinanceOrder = {
  id?: string;

  product_name?: string | null;
  product?: string | null;
  bag_type?: string | null;
  bag_name?: string | null;

  total_price?: number | string | null;
  selling_price?: number | string | null;
  price?: number | string | null;
  amount?: number | string | null;

  created_at?: string | null;
  completed_at?: string | null;

  status?: string | null;
};

export type Expense = {
  id: string;
  description: string;
  amount: number | string;
  category: string;
  expense_date: string;
  notes?: string | null;
  created_at?: string;
};


/*
 * PHP currency formatter
 */
export function peso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}


/*
 * Safely converts Supabase numeric/string values
 * into JavaScript numbers.
 */
export function numberValue(
  value: string | number | null | undefined
): number {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const parsed = Number(
    String(value).replace(
      /[^0-9.-]+/g,
      ""
    )
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}


/*
 * Temporary compatibility helper.
 *
 * Once we confirm the final Orders schema,
 * this can eventually become just:
 *
 * return order.product
 */
export function getOrderProductName(
  order: FinanceOrder
): string {
  return (
    order.product_name ||
    order.product ||
    order.bag_type ||
    order.bag_name ||
    "Unknown Product"
  );
}


/*
 * Gets the actual selling price saved
 * on the order.
 */
export function getOrderRevenue(
  order: FinanceOrder
): number {
  return numberValue(
    order.total_price ??
      order.selling_price ??
      order.price ??
      order.amount
  );
}


/*
 * For historical costing:
 *
 * Prefer completion date if available.
 * Otherwise use order creation date.
 */
export function getOrderDate(
  order: FinanceOrder
): string {
  return (
    order.completed_at ||
    order.created_at ||
    new Date().toISOString()
  );
}


export function isKnownProduct(
  productName: string
): productName is ProductName {
  return productName in products;
}


/*
 * ESTIMATED COGS
 *
 * Finance does NOT calculate individual
 * material consumption per order.
 *
 * Instead:
 *
 * Order product
 *      ↓
 * Order date
 *      ↓
 * historical Product Cost
 *      ↓
 * estimated COGS
 *
 * Example:
 *
 * Handbag cost:
 *
 * Jan–Sep = ₱800
 * Oct onward = ₱900
 *
 * September sale → ₱800 COGS
 * October sale   → ₱900 COGS
 */
export function getOrderCOGS(
  order: FinanceOrder
): number {
  const productName =
    getOrderProductName(order);

  if (!isKnownProduct(productName)) {
    return 0;
  }

  return getProductCost(
    productName,
    getOrderDate(order)
  );
}


/*
 * Main finance calculation
 */
export function calculateFinanceSummary(
  orders: FinanceOrder[],
  expenses: Expense[]
) {
  const revenue =
    orders.reduce(
      (total, order) =>
        total +
        getOrderRevenue(order),
      0
    );

  const cogs =
    orders.reduce(
      (total, order) =>
        total +
        getOrderCOGS(order),
      0
    );

  const grossProfit =
    revenue - cogs;

  const operatingExpenses =
    expenses.reduce(
      (total, expense) =>
        total +
        numberValue(
          expense.amount
        ),
      0
    );

  const netProfit =
    grossProfit -
    operatingExpenses;

  const grossMargin =
    revenue > 0
      ? (grossProfit / revenue) * 100
      : 0;

  const averageOrderValue =
    orders.length > 0
      ? revenue / orders.length
      : 0;

  return {
    revenue,
    cogs,
    grossProfit,
    grossMargin,
    operatingExpenses,
    netProfit,
    averageOrderValue,
  };
}