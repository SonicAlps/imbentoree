"use client";

import {

  useEffect,

  useMemo,

  useState,

} from "react";

import {

  BarChart3,

  CalendarDays,

  CircleDollarSign,

  Pencil,

  Plus,

  ReceiptText,

  Trash2,

  TrendingDown,

  TrendingUp,

  WalletCards,

} from "lucide-react";

import {

  supabase,

} from "@/src/lib/supabase";

import {

  calculateFinanceSummary,

  getOrderCOGS,

  getOrderDate,

  getOrderProductName,

  getOrderRevenue,

  numberValue,

  peso,

  type Expense,

  type FinanceOrder,

} from "@/src/lib/finance";

type DateFilter =

  | "month"

  | "year"

  | "all";

type ProductSummary = {

  product: string;

  orders: number;

  revenue: number;

  cogs: number;

  grossProfit: number;

};

type MonthlySummary = {

  key: string;

  label: string;

  revenue: number;

  cogs: number;

  grossProfit: number;

  expenses: number;

  netProfit: number;

};

const EXPENSE_CATEGORIES = [

  "Rent",

  "Utilities",

  "Transportation",

  "Packaging",

  "Marketing",

  "Equipment",

  "Maintenance",

  "Software",

  "Fees",

  "Other",

];

function todayDate() {

  return new Date()

    .toISOString()

    .split("T")[0];

}

export default function FinancesPage() {

  const [

    orders,

    setOrders,

  ] = useState<FinanceOrder[]>([]);

  const [

    expenses,

    setExpenses,

  ] = useState<Expense[]>([]);

  const [

    loading,

    setLoading,

  ] = useState(true);

  const [

    dateFilter,

    setDateFilter,

  ] =

    useState<DateFilter>("month");

  /*

   * Expense form

   */

  const [

    editingExpenseId,

    setEditingExpenseId,

  ] =

    useState<string | null>(null);

  const [

    description,

    setDescription,

  ] = useState("");

  const [

    amount,

    setAmount,

  ] = useState("");

  const [

    category,

    setCategory,

  ] = useState("Other");

  const [

    expenseDate,

    setExpenseDate,

  ] = useState(todayDate());

  const [

    notes,

    setNotes,

  ] = useState("");

  const [

    savingExpense,

    setSavingExpense,

  ] = useState(false);

  useEffect(() => {

    void loadFinanceData();

  }, []);

  async function loadFinanceData() {

    try {

      setLoading(true);

      const [

        ordersResponse,

        expensesResponse,

      ] = await Promise.all([

        supabase

          .from("orders")

          .select("*")

          .eq(

            "status",

            "completed"

          )

          .order(

            "created_at",

            {

              ascending: false,

            }

          ),

        supabase

          .from("expenses")

          .select("*")

          .order(

            "expense_date",

            {

              ascending: false,

            }

          ),

      ]);

      if (ordersResponse.error) {

        console.error(

          "Orders error:",

          ordersResponse.error

        );

      }

      if (expensesResponse.error) {

        console.error(

          "Expenses error:",

          expensesResponse.error

        );

      }

      setOrders(

        (

          ordersResponse.data ?? []

        ) as FinanceOrder[]

      );

      setExpenses(

        (

          expensesResponse.data ?? []

        ) as Expense[]

      );

    } catch (error) {

      console.error(

        "Finance loading error:",

        error

      );

    } finally {

      setLoading(false);

    }

  }

  /*

   * Date filtering

   */

  function matchesDateFilter(

    dateValue: string

  ) {

    if (dateFilter === "all") {

      return true;

    }

    const date =

      new Date(dateValue);

    if (

      Number.isNaN(

        date.getTime()

      )

    ) {

      return false;

    }

    const now =

      new Date();

    if (

      dateFilter === "year"

    ) {

      return (

        date.getFullYear() ===

        now.getFullYear()

      );

    }

    return (

      date.getFullYear() ===

        now.getFullYear() &&

      date.getMonth() ===

        now.getMonth()

    );

  }

  const filteredOrders =

    useMemo(() => {

      return orders.filter(

        (order) =>

          matchesDateFilter(

            getOrderDate(

              order

            )

          )

      );

    }, [

      orders,

      dateFilter,

    ]);

  const filteredExpenses =

    useMemo(() => {

      return expenses.filter(

        (expense) =>

          matchesDateFilter(

            expense.expense_date

          )

      );

    }, [

      expenses,

      dateFilter,

    ]);

  /*

   * Overall summary

   */

  const summary =

    useMemo(() => {

      return calculateFinanceSummary(

        filteredOrders,

        filteredExpenses

      );

    }, [

      filteredOrders,

      filteredExpenses,

    ]);

  /*

   * Product Performance

   */

  const productSummaries =

    useMemo<ProductSummary[]>(

      () => {

        const map =

          new Map<

            string,

            ProductSummary

          >();

        for (

          const order

          of filteredOrders

        ) {

          const product =

            getOrderProductName(

              order

            );

          const revenue =

            getOrderRevenue(

              order

            );

          const cogs =

            getOrderCOGS(

              order

            );

          const existing =

            map.get(product);

          if (existing) {

            existing.orders +=

              1;

            existing.revenue +=

              revenue;

            existing.cogs +=

              cogs;

            existing.grossProfit +=

              revenue - cogs;

          } else {

            map.set(

              product,

              {

                product,

                orders: 1,

                revenue,

                cogs,

                grossProfit:

                  revenue -

                  cogs,

              }

            );

          }

        }

        return Array.from(

          map.values()

        ).sort(

          (a, b) =>

            b.revenue -

            a.revenue

        );

      },

      [filteredOrders]

    );

  /*

   * Monthly Performance

   *

   * Uses all finance data,

   * regardless of current filter.

   */

  const monthlySummaries =

    useMemo<

      MonthlySummary[]

    >(() => {

      const map =

        new Map<

          string,

          MonthlySummary

        >();

      for (

        const order

        of orders

      ) {

        const date =

          new Date(

            getOrderDate(

              order

            )

          );

        if (

          Number.isNaN(

            date.getTime()

          )

        ) {

          continue;

        }

        const key =

          `${date.getFullYear()}-${String(

            date.getMonth() +

              1

          ).padStart(

            2,

            "0"

          )}`;

        const label =

          date.toLocaleDateString(

            "en-PH",

            {

              month:

                "short",

              year:

                "numeric",

            }

          );

        const existing =

          map.get(key) ?? {

            key,

            label,

            revenue: 0,

            cogs: 0,

            grossProfit: 0,

            expenses: 0,

            netProfit: 0,

          };

        existing.revenue +=

          getOrderRevenue(

            order

          );

        existing.cogs +=

          getOrderCOGS(

            order

          );

        map.set(

          key,

          existing

        );

      }

      for (

        const expense

        of expenses

      ) {

        const date =

          new Date(

            `${expense.expense_date}T00:00:00`

          );

        if (

          Number.isNaN(

            date.getTime()

          )

        ) {

          continue;

        }

        const key =

          `${date.getFullYear()}-${String(

            date.getMonth() +

              1

          ).padStart(

            2,

            "0"

          )}`;

        const label =

          date.toLocaleDateString(

            "en-PH",

            {

              month:

                "short",

              year:

                "numeric",

            }

          );

        const existing =

          map.get(key) ?? {

            key,

            label,

            revenue: 0,

            cogs: 0,

            grossProfit: 0,

            expenses: 0,

            netProfit: 0,

          };

        existing.expenses +=

          numberValue(

            expense.amount

          );

        map.set(

          key,

          existing

        );

      }

      return Array.from(

        map.values()

      )

        .map((item) => {

          const grossProfit =

            item.revenue -

            item.cogs;

          return {

            ...item,

            grossProfit,

            netProfit:

              grossProfit -

              item.expenses,

          };

        })

        .sort(

          (a, b) =>

            b.key.localeCompare(

              a.key

            )

        );

    }, [

      orders,

      expenses,

    ]);

  /*

   * Expense actions

   */

  function clearExpenseForm() {

    setEditingExpenseId(

      null

    );

    setDescription("");

    setAmount("");

    setCategory("Other");

    setExpenseDate(

      todayDate()

    );

    setNotes("");

  }

  function startEditExpense(

    expense: Expense

  ) {

    setEditingExpenseId(

      expense.id

    );

    setDescription(

      expense.description

    );

    setAmount(

      String(

        numberValue(

          expense.amount

        )

      )

    );

    setCategory(

      expense.category

    );

    setExpenseDate(

      expense.expense_date

    );

    setNotes(

      expense.notes ?? ""

    );

    window.scrollTo({

      top: 0,

      behavior: "smooth",

    });

  }

  async function saveExpense(

    event:

      React.FormEvent

  ) {

    event.preventDefault();

    const parsedAmount =

      Number(amount);

    if (

      !description.trim() ||

      !parsedAmount ||

      parsedAmount <= 0

    ) {

      return;

    }

    try {

      setSavingExpense(

        true

      );

      const payload = {

        description:

          description.trim(),

        amount:

          parsedAmount,

        category,

        expense_date:

          expenseDate,

        notes:

          notes.trim() ||

          null,

      };

      if (

        editingExpenseId

      ) {

        const {

          data,

          error,

        } =

          await supabase

            .from(

              "expenses"

            )

            .update(

              payload

            )

            .eq(

              "id",

              editingExpenseId

            )

            .select()

            .single();

        if (error) {

          console.error(

            error

          );

          return;

        }

        if (data) {

          setExpenses(

            (

              current

            ) =>

              current.map(

                (

                  expense

                ) =>

                  expense.id ===

                  editingExpenseId

                    ? (

                        data as Expense

                      )

                    : expense

              )

          );

        }

      } else {

        const {

          data,

          error,

        } =

          await supabase

            .from(

              "expenses"

            )

            .insert(

              payload

            )

            .select()

            .single();

        if (error) {

          console.error(

            error

          );

          return;

        }

        if (data) {

          setExpenses(

            (

              current

            ) => [

              data as Expense,

              ...current,

            ]

          );

        }

      }

      clearExpenseForm();

    } finally {

      setSavingExpense(

        false

      );

    }

  }

  async function deleteExpense(

    id: string

  ) {

    const confirmed =

      window.confirm(

        "Delete this expense?"

      );

    if (!confirmed) {

      return;

    }

    const { error } =

      await supabase

        .from("expenses")

        .delete()

        .eq("id", id);

    if (error) {

      console.error(

        error

      );

      return;

    }

    setExpenses(

      (current) =>

        current.filter(

          (expense) =>

            expense.id !==

            id

        )

    );

    if (

      editingExpenseId ===

      id

    ) {

      clearExpenseForm();

    }

  }

  if (loading) {

    return (

      <main className="min-h-screen bg-white text-black">

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">

        <div className="border-t border-black py-8 text-sm text-zinc-500">

          Loading finances...

        </div>

      </div>

      </main>

    );

  }

  return (

    <main className="min-h-screen bg-white text-black">

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">

      {/* HEADER */}

      <header className="mb-8 flex flex-col gap-6 border-b border-black pb-7 md:flex-row md:items-end md:justify-between">

        <div>

          <p className="mb-1 text-sm font-medium text-zinc-500">

            Imbentoree

          </p>

          <h1 className="text-4xl font-bold tracking-tight text-black">

            Finance

          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">

            Revenue,

            production cost,

            operating expenses

            and estimated

            profitability.

          </p>

        </div>

        <div className="inline-flex gap-6 border-b border-black bg-white">

          <FilterButton

            active={

              dateFilter ===

              "month"

            }

            onClick={() =>

              setDateFilter(

                "month"

              )

            }

          >

            This Month

          </FilterButton>

          <FilterButton

            active={

              dateFilter ===

              "year"

            }

            onClick={() =>

              setDateFilter(

                "year"

              )

            }

          >

            This Year

          </FilterButton>

          <FilterButton

            active={

              dateFilter ===

              "all"

            }

            onClick={() =>

              setDateFilter(

                "all"

              )

            }

          >

            All Time

          </FilterButton>

        </div>

      </header>

      {/* SUMMARY */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        <SummaryCard

          title="Revenue"

          value={peso(

            summary.revenue

          )}

          subtitle={`${filteredOrders.length} completed orders`}

          icon={

            <CircleDollarSign

              size={18}

            />

          }

        />

        <SummaryCard

          title="COGS"

          value={peso(

            summary.cogs

          )}

          subtitle="Estimated production cost"

          icon={

            <TrendingDown

              size={18}

            />

          }

        />

        <SummaryCard

          title="Gross Profit"

          value={peso(

            summary.grossProfit

          )}

          subtitle="Revenue minus COGS"

          icon={

            <TrendingUp

              size={18}

            />

          }

        />

        <SummaryCard

          title="Gross Margin"

          value={`${summary.grossMargin.toFixed(

            1

          )}%`}

          subtitle="Gross profit percentage"

          icon={

            <BarChart3

              size={18}

            />

          }

        />

        <SummaryCard

          title="Expenses"

          value={peso(

            summary.operatingExpenses

          )}

          subtitle={`${filteredExpenses.length} expense entries`}

          icon={

            <ReceiptText

              size={18}

            />

          }

        />

        <SummaryCard

          title="Estimated Net"

          value={peso(

            summary.netProfit

          )}

          subtitle="Gross profit minus expenses"

          icon={

            <WalletCards

              size={18}

            />

          }

        />

        <SummaryCard

          title="Average Order"

          value={peso(

            summary.averageOrderValue

          )}

          subtitle="Revenue per completed order"

          icon={

            <CircleDollarSign

              size={18}

            />

          }

        />

      </section>

      {/* PRODUCT PERFORMANCE + EXPENSE */}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">

        <section className="overflow-hidden border border-black bg-white">

          <div className="border-b border-black px-5 py-4">

            <div className="flex items-center gap-2">

              <BarChart3

                size={18}

                className="text-zinc-500"

              />

              <h2 className="font-bold text-black">

                Product Performance

              </h2>

            </div>

            <p className="mt-1 text-sm text-zinc-500">

              Revenue and estimated

              production cost by

              product.

            </p>

          </div>

          {productSummaries.length ===

          0 ? (

            <EmptyState>

              No completed orders

              for this period.

            </EmptyState>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px] text-left text-sm">

                <thead className="border-b border-black bg-white text-xs uppercase tracking-wide text-zinc-500">

                  <tr>

                    <th className="px-5 py-3 font-medium">

                      Product

                    </th>

                    <th className="px-5 py-3 text-right font-medium">

                      Orders

                    </th>

                    <th className="px-5 py-3 text-right font-medium">

                      Revenue

                    </th>

                    <th className="px-5 py-3 text-right font-medium">

                      COGS

                    </th>

                    <th className="px-5 py-3 text-right font-medium">

                      Gross Profit

                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-zinc-200">

                  {productSummaries.map(

                    (item) => (

                      <tr

                        key={

                          item.product

                        }

                        className="hover:bg-zinc-50"

                      >

                        <td className="px-5 py-4 font-medium text-zinc-900">

                          {

                            item.product

                          }

                        </td>

                        <td className="px-5 py-4 text-right text-zinc-600">

                          {

                            item.orders

                          }

                        </td>

                        <td className="px-5 py-4 text-right text-zinc-900">

                          {peso(

                            item.revenue

                          )}

                        </td>

                        <td className="px-5 py-4 text-right text-zinc-600">

                          {peso(

                            item.cogs

                          )}

                        </td>

                        <td className="px-5 py-4 text-right font-medium text-zinc-900">

                          {peso(

                            item.grossProfit

                          )}

                        </td>

                      </tr>

                    )

                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ADD / EDIT EXPENSE */}

        <section className="border border-black bg-white">

          <div className="border-b border-black px-5 py-4">

            <div className="flex items-center gap-2">

              {editingExpenseId ? (

                <Pencil

                  size={18}

                  className="text-zinc-500"

                />

              ) : (

                <Plus

                  size={18}

                  className="text-zinc-500"

                />

              )}

              <h2 className="font-bold text-black">

                {editingExpenseId

                  ? "Edit Expense"

                  : "Add Expense"}

              </h2>

            </div>

            <p className="mt-1 text-sm text-zinc-500">

              Record operating

              business expenses.

            </p>

          </div>

          <form

            onSubmit={

              saveExpense

            }

            className="space-y-4 p-5"

          >

            <Field label="Description">

              <input

                value={

                  description

                }

                onChange={(

                  event

                ) =>

                  setDescription(

                    event.target

                      .value

                  )

                }

                placeholder="Example: October rent"

                className="finance-input"

              />

            </Field>

            <div className="grid grid-cols-2 gap-3">

              <Field label="Amount">

                <input

                  type="number"

                  min="0"

                  step="0.01"

                  value={amount}

                  onChange={(

                    event

                  ) =>

                    setAmount(

                      event.target

                        .value

                    )

                  }

                  placeholder="0.00"

                  className="finance-input"

                />

              </Field>

              <Field label="Category">

                <select

                  value={

                    category

                  }

                  onChange={(

                    event

                  ) =>

                    setCategory(

                      event.target

                        .value

                    )

                  }

                  className="finance-input"

                >

                  {EXPENSE_CATEGORIES.map(

                    (item) => (

                      <option

                        key={item}

                        value={item}

                      >

                        {item}

                      </option>

                    )

                  )}

                </select>

              </Field>

            </div>

            <Field label="Expense Date">

              <input

                type="date"

                value={

                  expenseDate

                }

                onChange={(

                  event

                ) =>

                  setExpenseDate(

                    event.target

                      .value

                  )

                }

                className="finance-input"

              />

            </Field>

            <Field label="Notes">

              <textarea

                value={notes}

                onChange={(

                  event

                ) =>

                  setNotes(

                    event.target

                      .value

                  )

                }

                placeholder="Optional notes"

                rows={3}

                className="finance-input resize-none"

              />

            </Field>

            <button

              type="submit"

              disabled={

                savingExpense

              }

              className="flex w-full items-center justify-center gap-2 border border-black bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"

            >

              {editingExpenseId ? (

                <Pencil

                  size={16}

                />

              ) : (

                <Plus

                  size={16}

                />

              )}

              {savingExpense

                ? "Saving..."

                : editingExpenseId

                  ? "Update Expense"

                  : "Add Expense"}

            </button>

            {editingExpenseId && (

              <button

                type="button"

                onClick={

                  clearExpenseForm

                }

                className="w-full border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:border-black hover:text-black"

              >

                Cancel Edit

              </button>

            )}

          </form>

        </section>

      </div>

      {/* MONTHLY PERFORMANCE */}

      <section className="mt-6 overflow-hidden border border-zinc-200 bg-white">

        <div className="border-b border-black px-5 py-4">

          <h2 className="font-bold text-black">

            Monthly Performance

          </h2>

          <p className="mt-1 text-sm text-zinc-500">

            Historical revenue,

            production cost,

            expenses and

            estimated net.

          </p>

        </div>

        {monthlySummaries.length ===

        0 ? (

          <EmptyState>

            No finance history

            yet.

          </EmptyState>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-sm">

              <thead className="border-b border-black bg-white text-xs uppercase tracking-wide text-zinc-500">

                <tr>

                  <th className="px-5 py-3 font-medium">

                    Month

                  </th>

                  <th className="px-5 py-3 text-right font-medium">

                    Revenue

                  </th>

                  <th className="px-5 py-3 text-right font-medium">

                    COGS

                  </th>

                  <th className="px-5 py-3 text-right font-medium">

                    Gross Profit

                  </th>

                  <th className="px-5 py-3 text-right font-medium">

                    Expenses

                  </th>

                  <th className="px-5 py-3 text-right font-medium">

                    Net

                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-zinc-200">

                {monthlySummaries.map(

                  (item) => (

                    <tr

                      key={

                        item.key

                      }

                    >

                      <td className="px-5 py-4 font-medium text-zinc-900">

                        {

                          item.label

                        }

                      </td>

                      <td className="px-5 py-4 text-right">

                        {peso(

                          item.revenue

                        )}

                      </td>

                      <td className="px-5 py-4 text-right text-zinc-600">

                        {peso(

                          item.cogs

                        )}

                      </td>

                      <td className="px-5 py-4 text-right">

                        {peso(

                          item.grossProfit

                        )}

                      </td>

                      <td className="px-5 py-4 text-right text-zinc-600">

                        {peso(

                          item.expenses

                        )}

                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-zinc-950">

                        {peso(

                          item.netProfit

                        )}

                      </td>

                    </tr>

                  )

                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* EXPENSE HISTORY */}

      <section className="mt-6 overflow-hidden border border-zinc-200 bg-white">

        <div className="border-b border-black px-5 py-4">

          <div className="flex items-center gap-2">

            <ReceiptText

              size={18}

              className="text-zinc-500"

            />

            <h2 className="font-bold text-black">

              Expense History

            </h2>

          </div>

          <p className="mt-1 text-sm text-zinc-500">

            Expenses included in

            the selected period.

          </p>

        </div>

        {filteredExpenses.length ===

        0 ? (

          <EmptyState>

            No expenses recorded

            for this period.

          </EmptyState>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[750px] text-left text-sm">

              <thead className="border-b border-black bg-white text-xs uppercase tracking-wide text-zinc-500">

                <tr>

                  <th className="px-5 py-3 font-medium">

                    Date

                  </th>

                  <th className="px-5 py-3 font-medium">

                    Description

                  </th>

                  <th className="px-5 py-3 font-medium">

                    Category

                  </th>

                  <th className="px-5 py-3 text-right font-medium">

                    Amount

                  </th>

                  <th className="px-5 py-3 text-right font-medium">

                    Actions

                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-zinc-200">

                {filteredExpenses.map(

                  (expense) => (

                    <tr

                      key={

                        expense.id

                      }

                      className="hover:bg-zinc-50"

                    >

                      <td className="whitespace-nowrap px-5 py-4 text-zinc-600">

                        <div className="flex items-center gap-2">

                          <CalendarDays

                            size={

                              14

                            }

                          />

                          {new Date(

                            `${expense.expense_date}T00:00:00`

                          ).toLocaleDateString(

                            "en-PH",

                            {

                              year:

                                "numeric",

                              month:

                                "short",

                              day:

                                "numeric",

                            }

                          )}

                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <p className="font-semibold text-black">

                          {

                            expense.description

                          }

                        </p>

                        {expense.notes && (

                          <p className="mt-1 text-xs text-zinc-500">

                            {

                              expense.notes

                            }

                          </p>

                        )}

                      </td>

                      <td className="px-5 py-4 text-zinc-600">

                        {

                          expense.category

                        }

                      </td>

                      <td className="px-5 py-4 text-right font-medium text-zinc-900">

                        {peso(

                          numberValue(

                            expense.amount

                          )

                        )}

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-1">

                          <button

                            type="button"

                            onClick={() =>

                              startEditExpense(

                                expense

                              )

                            }

                            className="border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-600 hover:border-black hover:text-black"

                          >

                            Edit

                          </button>

                          <button

                            type="button"

                            onClick={() =>

                              deleteExpense(

                                expense.id

                              )

                            }

                            className="border border-zinc-300 bg-white p-2 text-zinc-500 hover:border-black hover:text-black"

                            aria-label="Delete expense"

                          >

                            <Trash2

                              size={

                                16

                              }

                            />

                          </button>

                        </div>

                      </td>

                    </tr>

                  )

                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* NOTICE */}

      <div className="mt-8 border border-black bg-white px-5 py-4">

        <p className="text-sm font-bold text-black">

          Estimated finances

        </p>

        <p className="mt-1 text-sm leading-6 text-zinc-600">

          Production cost

          currently uses the

          historical cost values

          defined for each

          product. We will connect

          this more deeply to the

          Cost History system

          during the costing

          review.

        </p>

      </div>

      <style jsx global>{`

        .finance-input {

          width: 100%;

          border-radius: 0;

          border: 1px solid rgb(0 0 0);

          background: white;

          padding: 0.7rem 0.8rem;

          font-size: 0.875rem;

          color: rgb(24 24 27);

          outline: none;

          transition:

            border-color 150ms ease,

            box-shadow 150ms ease;

        }

        .finance-input:focus {

          border-color: rgb(0 0 0);

          box-shadow: none;

        }

      `}</style>

      </div>

    </main>

  );

}

function SummaryCard({

  title,

  value,

  subtitle,

  icon,

}: {

  title: string;

  value: string;

  subtitle: string;

  icon: React.ReactNode;

}) {

  return (

    <div className="border border-black bg-white p-5">

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-zinc-500">

          {title}

        </p>

        <div className="text-black">

          {icon}

        </div>

      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight text-black">

        {value}

      </p>

      <p className="mt-1 text-xs text-zinc-500">

        {subtitle}

      </p>

    </div>

  );

}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-1 py-3 text-xs font-semibold ${
        active
          ? "border-black text-black"
          : "border-transparent text-zinc-500 hover:text-black"
      }`}
    >
      {children}
    </button>
  );
}

function Field({

  label,

  children,

}: {

  label: string;

  children: React.ReactNode;

}) {

  return (

    <label className="block">

      <span className="mb-1.5 block text-xs font-semibold text-black">

        {label}

      </span>

      {children}

    </label>

  );

}

function EmptyState({

  children,

}: {

  children: React.ReactNode;

}) {

  return (

    <div className="px-5 py-12 text-center text-sm text-zinc-500">

      {children}

    </div>

  );

}