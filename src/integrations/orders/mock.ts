import { Order, OrderService } from './interface.js';

export const MOCK_ORDERS: Map<string, Order> = new Map([
  [
    'ORD-1001',
    {
      id: 'ORD-1001',
      customerId: 'user_external_cust_ext_1001',
      customerEmail: 'alex.shopper@gmail.com',
      status: 'DELIVERED',
      orderDate: '2026-09-20T10:30:00Z',
      deliveredDate: '2026-09-24T14:15:00Z',
      totalAmount: 6299,
      currency: 'INR',
      shippingAddress: '42 Silicon Avenue, Indiranagar, Bengaluru, 560038',
      trackingNumber: 'BLUEDART-8829104',
      carrier: 'BlueDart Express',
      items: [
        {
          productId: 'prod-001',
          name: 'Carrara Bianco High Pressure Laminate',
          quantity: 1,
          unitPrice: 3319,
          color: 'white',
          size: '8ft x 4ft',
        },
        {
          productId: 'prod-005',
          name: 'Black Alicante Laminate',
          quantity: 1,
          unitPrice: 2980,
          color: 'black',
          size: '8ft x 4ft',
        },
      ],
      isEligibleForRefund: true,
      refundStatus: 'NONE',
    },
  ],
  [
    'ORD-1002',
    {
      id: 'ORD-1002',
      customerId: 'user_external_cust_ext_1001',
      customerEmail: 'alex.shopper@gmail.com',
      status: 'SHIPPED',
      orderDate: '2026-09-28T09:12:00Z',
      totalAmount: 3499,
      currency: 'INR',
      shippingAddress: '42 Silicon Avenue, Indiranagar, Bengaluru, 560038',
      trackingNumber: 'DELHIVERY-9938102',
      carrier: 'Delhivery Surface',
      items: [
        {
          productId: 'prod-003',
          name: 'Nordic Oak Woodgrain Laminate',
          quantity: 1,
          unitPrice: 2519,
          color: 'oak',
          size: '8ft x 4ft',
        },
        {
          productId: 'prod-015',
          name: 'Nordic Oak ABS Edgebanding 22mm',
          quantity: 1,
          unitPrice: 980,
          color: 'oak',
          size: '22mm x 50m',
        },
      ],
      isEligibleForRefund: false, // Cannot refund while in transit
      refundStatus: 'NONE',
    },
  ],
  [
    'ORD-1003',
    {
      id: 'ORD-1003',
      customerId: 'user_external_cust_ext_1001',
      customerEmail: 'alex.shopper@gmail.com',
      status: 'DELIVERED',
      orderDate: '2026-07-10T11:00:00Z',
      deliveredDate: '2026-07-14T16:00:00Z',
      totalAmount: 8499,
      currency: 'INR',
      shippingAddress: '42 Silicon Avenue, Indiranagar, Bengaluru, 560038',
      trackingNumber: 'FEDEX-1029384',
      carrier: 'FedEx Priority',
      items: [
        {
          productId: 'prod-013',
          name: 'Charcoal Core Compact Laminate Panel',
          quantity: 1,
          unitPrice: 7650,
          color: 'charcoal',
          size: '8ft x 4ft',
        },
        {
          productId: 'prod-014',
          name: 'Designer White PVC Edgebanding 22mm',
          quantity: 1,
          unitPrice: 849,
          color: 'white',
          size: '22mm x 50m',
        },
      ],
      isEligibleForRefund: false, // Exceeded 30-day return policy
      refundStatus: 'NONE',
    },
  ],
]);

export class MockOrderService implements OrderService {
  async getOrder(orderId: string): Promise<Order | null> {
    const normalized = (orderId || '').trim().toUpperCase();
    const order = MOCK_ORDERS.get(normalized);
    return order ? { ...order } : null;
  }

  async createReturn(orderId: string, reason: string): Promise<{ success: boolean; returnId: string; message: string }> {
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (!order.isEligibleForRefund) {
      throw new Error(`Order ${orderId} is not eligible for return (delivered > 30 days ago or in transit)`);
    }

    const returnId = `RET-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    order.status = 'RETURN_REQUESTED';
    MOCK_ORDERS.set(order.id, order);

    return {
      success: true,
      returnId,
      message: `Return request ${returnId} initiated successfully. Return pickup courier will be assigned within 24 hours. Reason recorded: ${reason}`,
    };
  }

  async processRefund(orderId: string, amount: number, approvedBy?: string): Promise<{ success: boolean; transactionId: string; refundAmount: number }> {
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const txId = `TX-REFUND-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    order.status = 'REFUNDED';
    order.refundStatus = 'PROCESSED';
    order.refundAmount = amount;
    MOCK_ORDERS.set(order.id, order);

    return {
      success: true,
      transactionId: txId,
      refundAmount: amount,
    };
  }
}

export const orderService = new MockOrderService();
