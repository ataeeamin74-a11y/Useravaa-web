export type CheckoutIntent = {
  conversationId: string;
  amountToman: number;
};

export type CheckoutResult = {
  status: "adapter_not_configured";
};

export interface PaymentAdapter {
  createCheckout(input: CheckoutIntent): Promise<CheckoutResult>;
}

export const paymentAdapter: PaymentAdapter = {
  async createCheckout() {
    return { status: "adapter_not_configured" };
  }
};
