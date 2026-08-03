import { Transaction, TransactionType, PaymentStatus } from '../types';

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: 'NGN' | 'USD' = 'NGN'): string {
  const symbols = {
    NGN: '₦',
    USD: '$',
  };

  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };

  const formatted = new Intl.NumberFormat('en-NG', formatOptions).format(amount);
  return `${symbols[currency]}${formatted}`;
}

/**
 * Get payment status display text
 */
export function getPaymentStatusText(status: PaymentStatus): string {
  const statusMap: Record<PaymentStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  };
  return statusMap[status];
}

/**
 * Get payment status badge color
 */
export function getPaymentStatusColor(
  status: PaymentStatus
): 'green' | 'yellow' | 'red' | 'gray' {
  const colorMap: Record<PaymentStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
    pending: 'gray',
    processing: 'yellow',
    completed: 'green',
    failed: 'red',
  };
  return colorMap[status];
}

/**
 * Get transaction type display text
 */
export function getTransactionTypeText(type: TransactionType): string {
  const typeMap: Record<TransactionType, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    payment_locked: 'Payment Locked (Escrow)',
    payment_released: 'Payment Released',
    refund: 'Refund',
  };
  return typeMap[type];
}

/**
 * Calculate total fees (platform fee + payment gateway fee)
 */
export function calculateFees(
  amount: number,
  paymentGateway?: 'paystack' | 'flutterwave'
): { platformFee: number; gatewayFee: number; total: number } {
  const platformFee = amount * 0.03; // 3% platform fee

  let gatewayFee = 0;
  if (paymentGateway === 'paystack') {
    // Paystack: 1.5% + ₦100
    gatewayFee = amount * 0.015 + 100;
  } else if (paymentGateway === 'flutterwave') {
    // Flutterwave: 1.4% + ₦50
    gatewayFee = amount * 0.014 + 50;
  }

  return {
    platformFee,
    gatewayFee,
    total: platformFee + gatewayFee,
  };
}

/**
 * Generate unique transaction reference
 */
export function generateTransactionRef(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(
  type: string,
  provider?: string,
  lastFour?: string
): string {
  if (type === 'bank_transfer') {
    return `Bank Transfer${lastFour ? ` (${lastFour})` : ''}`;
  }
  if (type === 'card') {
    return `Card${lastFour ? ` (****${lastFour})` : ''}`;
  }
  if (type === 'mobile_money') {
    return 'Mobile Money';
  }
  if (type === 'paystack') {
    return 'Paystack';
  }
  if (type === 'flutterwave') {
    return 'Flutterwave';
  }
  return type;
}

/**
 * Validate amount for transaction
 */
export function isValidAmount(amount: number, minAmount: number = 100): boolean {
  return amount >= minAmount && amount === Math.round(amount);
}

/**
 * Get order escrow status explanation
 */
export function getEscrowStatusExplanation(orderStatus: string): string {
  const explanations: Record<string, string> = {
    pending: 'Order pending seller acceptance. Payment is on hold.',
    accepted: 'Seller accepted. Payment still locked until delivery.',
    shipped: 'Seller shipped the item. Payment awaiting buyer confirmation.',
    delivered: 'Item delivered. Buyer has 48 hours to confirm or raise a dispute.',
    confirmed: 'Buyer confirmed item. Payment released to seller.',
    completed: 'Order completed successfully.',
    cancelled: 'Order cancelled. Payment refunded to buyer.',
    disputed: 'Order disputed. Under review by admin.',
  };
  return explanations[orderStatus] || 'Unknown status';
}
