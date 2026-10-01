export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  color?: string;
  size?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerEmail: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'RETURN_REQUESTED' | 'REFUNDED' | 'CANCELLED';
  orderDate: string;
  deliveredDate?: string;
  totalAmount: number;
  currency: string;
  shippingAddress: string;
  trackingNumber?: string;
  carrier?: string;
  items: OrderItem[];
  isEligibleForRefund: boolean;
  refundStatus?: 'NONE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  refundAmount?: number;
}

export interface OrderService {
  getOrder(orderId: string): Promise<Order | null>;
  createReturn(orderId: string, reason: string): Promise<{ success: boolean; returnId: string; message: string }>;
  processRefund(orderId: string, amount: number, approvedBy?: string): Promise<{ success: boolean; transactionId: string; refundAmount: number }>;
}
