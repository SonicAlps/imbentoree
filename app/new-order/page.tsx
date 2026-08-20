// app/orders/new/page.tsx
import OrderForm from "@/components/order/order-form";
import OrderPageLayout from "@/components/order/order-page-layout";

export default function NewOrderPage() {
  return (
    <OrderPageLayout
      title="New Order"
      subtitle="Create a new bag order. Fill in the details and generate a preview."
    >
      <OrderForm mode="create" />
    </OrderPageLayout>
  );
}