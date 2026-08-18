import OrderForm from "../../components/order/order-form";

export default function NewOrderPage() {
  return (
    <main className="min-h-screen bg-zinc-100">

      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">

          

          <h1 className="mt-1 text-4xl font-bold text-zinc-800">
            New Order
          </h1>

        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">

        <OrderForm />

      </section>

    </main>
  );
}