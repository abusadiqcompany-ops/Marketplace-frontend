export type Role = 'buyer' | 'seller' | 'admin';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';
// include 'rejected' as a possible order status used in the UI
export type OrderStatus = 'pending' | 'accepted' | 'shipped' | 'delivered' | 'confirmed' | 'completed' | 'cancelled' | 'disputed' | 'rejected';
// include 'payment' and 'payout' transaction types used by the frontend
export type TransactionType = 'deposit' | 'withdrawal' | 'payment_locked' | 'payment_released' | 'refund' | 'payment' | 'payout';

export interface Location {
  city: string;
  state: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  // Wallet balance in NGN (Nigerian Naira) or USD
  walletBalance?: number;
  // Virtual bank account number for deposits
  accountNumber?: string;
  // Location data (support either a structured Location or a simple string label)
  location?: Location | string;
  // Buyer specific
  buyerPreferences?: {
    preferredLocations?: Location[];
    searchRadius?: number; // in km
  };
  // Seller specific
  businessName?: string;
  description?: string;
  phone?: string;
  sellerLocation?: Location | string;
  // Payment methods
  paymentMethods?: PaymentMethod[];
  // KYC/Verification
  verified?: boolean;
  verificationLevel?: 'unverified' | 'basic' | 'full';
  verificationFee?: number;
  verificationBadgeType?: 'active_member' | 'verified_seller';
  verificationRequestStatus?: 'pending' | 'paid' | 'approved';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  emailOtp?: string;
  phoneOtp?: string;
  otpExpiresAt?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'bank_transfer' | 'card' | 'mobile_money' | 'paystack' | 'flutterwave';
  isDefault?: boolean;
  lastFour?: string;
  details?: string; // for bank account info
  provider?: 'paystack' | 'flutterwave';
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: Location | string;
  images: string[];
  createdAt: string;
  rating?: number;
  reviewCount?: number;
  distance?: number; // calculated distance from user in km
  condition?: 'New' | 'Like New' | 'Used' | 'Refurbished';
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface Order {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  quantity?: number;
  color?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentLockedAt?: string; // when payment was held in escrow
  deliveryDetails?: {
    method: 'meetup' | 'shipping';
    pickupLocation?: Location;
    shippingAddress?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
  };
  confirmationDeadline?: string; // buyer must confirm by this time
  createdAt: string;
  notes?: string;
  transactions?: string[]; // transaction IDs related to this order
}

export interface Review {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[]; // user ids
  participantNames: string[];
  lastMessage?: string;
  lastTimestamp?: string;
  unread: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  userId: string; // primary user affected
  counterpartyId?: string; // other user (for payments)
  orderId?: string;
  amount: number;
  status: PaymentStatus;
  currency?: 'NGN' | 'USD'; // Nigerian Naira or USD
  paymentMethod?: PaymentMethod;
  paymentGateway?: 'paystack' | 'flutterwave' | 'manual';
  reference?: string; // payment gateway reference
  createdAt: string;
  completedAt?: string;
  details?: string; // bank info or notes
}

export interface PortalNotification {
  id: string;
  title: string;
  message: string;
  type: 'verification' | 'listing' | 'system' | 'success';
  targetUserId?: string | 'all';
  targetRole?: 'buyer' | 'seller' | 'admin' | 'all';
  relatedUserId?: string;
  relatedListingId?: string;
  createdAt: string;
  read: boolean;
}

export type NotificationTone = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'all' | 'orders' | 'messages' | 'payments';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  message: string;
  type: NotificationTone;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  actionType?: 'view' | 'payment' | 'message';
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  reportedRole: Role | string;
  type: 'report' | 'complaint';
  subject: string;
  details: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDeletionRequest {
  id: string;
  userId: string;
  userName: string;
  email: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: 'NGN' | 'USD';
  transactions: Transaction[];
  lastUpdated: string;
}