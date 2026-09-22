export type NotificationType =
  | "order_received"
  | "payment_successful"
  | "order_confirmed"
  | "order_processing"
  | "order_dispatched"
  | "order_delivered"
  | "order_customer_received"
  | "order_message"
  | "payment_failed"
  | "payment_cancelled"
  | "order_cancelled"
  | "system_announcement"
  | "driver_delivery_assigned"
  | "driver_customer_received"
  | "driver_delivery_reassigned"
  | "driver_schedule_changed"
  | "driver_delivery_note"
  | "driver_system_message";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  orderId?: string;
};
