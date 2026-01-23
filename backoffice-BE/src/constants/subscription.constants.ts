export enum SubscriptionType {
  DojoSub = "dojo_subscription",
  ClassSub = "class_subscription",
  OneTimeClass = "one_time_class",
}

export enum StripeWebhookEvents {
  CheckoutSessionCompleted = "checkout.session.completed",
  CustomerSubscriptionCreated = "customer.subscription.created",
  CustomerSubscriptionUpdated = "customer.subscription.updated",
  InvoicePaid = "invoice.paid",
  InvoicePaymentFailed = "invoice.payment_failed",
  CustomerSubscriptionDeleted = "customer.subscription.deleted",
  PaymentIntentSucceeded = "payment_intent.succeeded",
  SetupIntentSucceeded = "setup_intent.succeeded",
}
