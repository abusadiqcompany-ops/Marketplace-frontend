import axios, { AxiosInstance } from 'axios';
import type { Listing } from '../types';

const normalizeApiUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  const noTrailingSlash = trimmed.replace(/\/$/, '');
  if (/^https?:\/\//i.test(noTrailingSlash)) {
    return noTrailingSlash;
  }

  // If the URL was provided without protocol, assume https.
  const withoutLeadingSlash = noTrailingSlash.replace(/^\/+/, '');
  return `https://${withoutLeadingSlash}`;
};

const resolveApiBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL?.toString().trim();
  if (!rawUrl) {
    return '/api';
  }

  const normalized = normalizeApiUrl(rawUrl);
  const resolved = normalized.endsWith('/api') ? normalized : `${normalized}/api`;

  if (!(resolveApiBaseUrl as any)._loggedApiBaseUrl) {
    console.info('[api/client] Resolved API_BASE_URL:', resolved);
    (resolveApiBaseUrl as any)._loggedApiBaseUrl = true;
  }

  return resolved;
};

const API_BASE_URL = resolveApiBaseUrl();

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store tokens in localStorage
const TOKEN_KEY = 'marketplace_access_token';
const REFRESH_TOKEN_KEY = 'marketplace_refresh_token';

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  // Debug: show resolved API base and outgoing request URL + headers
  try {
    const method = (config.method || '').toString().toUpperCase();
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.debug('[api] Request:', method, fullUrl, { headers: config.headers });
    // Store request start time for monitoring
    (config as any).__requestStartTime = Date.now();
  } catch (e) {
    console.debug('[api] Request debug failed', e);
  }
  return config;
});

// Response interceptor to log response timing
api.interceptors.response.use(
  (response) => {
    // Log response timing
    const startTime = (response.config as any).__requestStartTime;
    if (startTime) {
      const duration = Date.now() - startTime;
      const method = (response.config.method || '').toUpperCase();
      const url = response.config.url || '';
      console.log(`[api] ${method} ${url} - ${response.status} (${duration}ms)`);
    }
    return response;
  },
  async (error) => {
    // Log error timing
    const startTime = (error.config as any)?.__requestStartTime;
    if (startTime) {
      const duration = Date.now() - startTime;
      const method = (error.config?.method || '').toUpperCase();
      const url = error.config?.url || '';
      console.error(`[api] ${method} ${url} - ${error.response?.status || 'ERROR'} (${duration}ms)`, error.message);
    }

    // Handle token refresh
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (status === 401 && originalRequest && !(originalRequest as any)._retry) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        if (onAuthFailure) onAuthFailure();
        return Promise.reject(error);
      }

      // Mark request as retried to avoid loops
      (originalRequest as any)._retry = true;

      if (isRefreshing) {
        // Queue the request until token is refreshed
        return new Promise((resolve, _reject) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const resp = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = resp.data;
        if (accessToken) {
          localStorage.setItem(TOKEN_KEY, accessToken);
        }
        if (newRefresh) {
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
        }

        // update original request header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        onRefreshed(accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        if (onAuthFailure) onAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401) {
      if (onAuthFailure) onAuthFailure();
    }

    return Promise.reject(error);
  }
);

// Global auth-failure callback (set by app)
let onAuthFailure: (() => void) | null = null;
export function setOnAuthFailure(cb: (() => void) | null) {
  onAuthFailure = cb;
}

// Token refresh handling
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
const subscribeTokenRefresh = (cb: (token: string) => void) => refreshSubscribers.push(cb);
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// ============== AUTHENTICATION APIs ==============

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'buyer' | 'seller' | 'admin';
    location?: any;
    walletBalance: number;
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };
  accessToken: string;
  refreshToken: string;
  emailOtp?: string;
  phoneOtp?: string;
  message?: string;
}

export async function signup(
  name: string,
  email: string,
  password: string,
  role: 'buyer' | 'seller',
  location?: any,
  businessName?: string,
  phone?: string,
  sellerLocation?: any
): Promise<AuthResponse> {
  const response = await api.post('/auth/signup', {
    name,
    email,
    password,
    role,
    location,
    businessName,
    phone,
    sellerLocation,
  });

  // Store tokens
  localStorage.setItem(TOKEN_KEY, response.data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);

  return response.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post('/auth/login', {
    email,
    password,
  });

  // Store tokens
  localStorage.setItem(TOKEN_KEY, response.data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);

  return response.data;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function sendVerificationOtp(type: 'email' | 'phone') {
  const response = await api.post('/auth/send-verification', { type });
  return response.data;
}

export async function verifyVerificationCode(type: 'email' | 'phone', code: string) {
  const response = await api.post('/auth/verify-code', { type, code });
  return response.data;
}

export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const response = await api.post('/auth/change-password', {
    oldPassword,
    newPassword,
  });
  return response.data;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// ============== WALLET APIs ==============

export async function getWallet(userId: string) {
  const response = await api.get(`/wallet/${userId}`);
  return response.data;
}

export async function getWalletBalance() {
  try {
    const response = await api.get('/wallet/balance');
    return response.data.balance;
  } catch (err: any) {
    // If unauthorized or a network error (no response), return a safe fallback of 0
    // so UI won't crash when offline or behind network issues.
    if (err?.response?.status === 401 || !err?.response) {
      console.warn('[api/client] getWalletBalance failed, returning fallback 0.', err);
      return 0;
    }

    throw err;
  }
}

export async function postWalletDeposit(amount: number, provider: 'paystack' | 'flutterwave', callbackUrl: string) {
  const response = await api.post('/wallet/deposit/initialize', {
    amount,
    provider,
    callbackUrl,
  });
  return response.data;
}

export async function postWalletWithdraw(
  amount: number,
  bankName: string,
  accountHolderName: string,
  accountNumber: string
) {
  const response = await api.post('/wallet/withdraw', {
    amount,
    bankName,
    accountHolderName,
    accountNumber,
  });
  return response.data;
}

export async function getTransactionHistory(userId: string) {
  const response = await api.get(`/wallet/${userId}/transactions`);
  return response.data;
}

export async function getAdminUsers() {
  const response = await api.get('/admin/users', { headers: authHeaders() });
  return response.data;
}

export async function getAdminListings() {
  const response = await api.get('/admin/listings', { headers: authHeaders() });
  return response.data;
}

export async function getAdminOrders() {
  const response = await api.get('/admin/orders', { headers: authHeaders() });
  return response.data;
}

export async function getAdminReports() {
  const response = await api.get('/admin/reports', { headers: authHeaders() });
  return response.data;
}

export async function getAdminAccountDeletionRequests() {
  const response = await api.get('/admin/account-deletion-requests', { headers: authHeaders() });
  return response.data;
}

export async function getAdminRevenue() {
  const response = await api.get('/admin/revenue', { headers: authHeaders() });
  return response.data;
}

export async function createAccountDeletionRequest(reason: string) {
  const response = await api.post('/account-deletion-requests', { reason }, { headers: authHeaders() });
  return response.data;
}

export async function reviewAccountDeletionRequest(requestId: string, action: 'approve' | 'reject') {
  const response = await api.post(`/admin/account-deletion-requests/${requestId}`, { action }, { headers: authHeaders() });
  return response.data;
}

export async function createReport(report: {
  reportedUserId: string;
  reportedUserName?: string;
  reportedRole?: string;
  type?: 'report' | 'complaint';
  subject: string;
  details: string;
}) {
  const response = await api.post('/reports', report, { headers: authHeaders() });
  return response.data;
}

export async function resolveAdminReport(reportId: string, status: 'resolved' | 'dismissed' = 'resolved') {
  const response = await api.post(`/admin/reports/${reportId}/resolve`, { status }, { headers: authHeaders() });
  return response.data;
}

export async function initializeMembershipVerificationPayment(userId: string, amount: number, provider: 'paystack' | 'flutterwave') {
  const response = await api.post(`/users/${userId}/verify-membership`, { amount, provider }, { headers: authHeaders() });
  return response.data;
}

export async function verifyMembershipVerificationPayment(userId: string, provider: 'paystack' | 'flutterwave', reference: string) {
  const response = await api.post(`/users/${userId}/verify-membership/verify`, { provider, reference }, { headers: authHeaders() });
  return response.data;
}

export async function payMembershipVerificationWithWallet(userId: string) {
  const response = await api.post(`/users/${userId}/verify-membership/pay-wallet`, {}, { headers: authHeaders() });
  return response.data;
}

export async function approveUserVerification(userId: string, badgeType: 'active_member' | 'verified_seller', verificationFee?: number) {
  const response = await api.post(`/admin/users/${userId}/approve-verification`, { badgeType, verificationFee }, { headers: authHeaders() });
  return response.data;
}

export async function requestUserVerification(userId: string, badgeType: 'active_member' | 'verified_seller', verificationFee: number) {
  const response = await api.post(`/admin/users/${userId}/request-verification`, { badgeType, verificationFee }, { headers: authHeaders() });
  return response.data;
}

export async function deleteAdminUser(userId: string) {
  const response = await api.delete(`/admin/users/${userId}`, { headers: authHeaders() });
  return response.data;
}

export async function deleteAdminListing(listingId: string) {
  const response = await api.delete(`/admin/listings/${listingId}`, { headers: authHeaders() });
  return response.data;
}

export async function resolveAdminDispute(orderId: string, decision: 'approve' | 'reject') {
  const response = await api.post(`/admin/orders/${orderId}/resolve`, { decision }, { headers: authHeaders() });
  return response.data;
}

// ============== PAYMENT APIs ==============

export async function initializePaystackPayment(
  email: string,
  amount: number,
  userId: string,
  orderId?: string
) {
  const response = await api.post('/payments/paystack/initialize', {
    email,
    amount,
    userId,
    orderId,
  });
  return response.data;
}

export async function verifyPaystackPayment(reference: string) {
  const response = await api.get(`/payments/paystack/verify/${reference}`);
  return response.data;
}

export async function initializeFlutterwavePayment(
  email: string,
  amount: number,
  userId: string,
  orderId?: string
) {
  const response = await api.post('/payments/flutterwave/initialize', {
    email,
    amount,
    userId,
    orderId,
  });
  return response.data;
}

export async function verifyFlutterwavePayment(txRef: string) {
  const response = await api.get(`/payments/flutterwave/verify/${txRef}`);
  return response.data;
}

export async function initializeWalletPaystackDeposit(
  email: string,
  amount: number,
  userId: string,
  currency: string = 'NGN'
) {
  const response = await api.post('/deposit/paystack', {
    email,
    amount,
    userId,
    currency,
  });
  return response.data;
}

export async function initializeWalletFlutterwaveDeposit(
  email: string,
  amount: number,
  userId: string,
  currency: string = 'NGN'
) {
  const response = await api.post('/deposit/flutterwave', {
    email,
    amount,
    userId,
    currency,
  });
  return response.data;
}

export async function verifyWalletDeposit(
  provider: 'paystack' | 'flutterwave',
  reference: string
) {
  const response = await api.post('/deposit/verify', {
    provider,
    reference,
  });
  return response.data;
}

// ============== WALLET TRANSACTION APIs ==============

export async function depositToWallet(
  userId: string,
  amount: number,
  paymentGateway: 'manual' | 'paystack' | 'flutterwave' = 'manual',
  reference?: string
) {
  const response = await api.post(`/wallet/${userId}/deposit`, {
    amount,
    paymentGateway,
    reference,
  });
  return response.data;
}

export async function withdrawFromWallet(
  userId: string,
  amount: number,
  bankDetails: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  }
) {
  const response = await api.post(`/wallet/${userId}/withdraw`, {
    amount,
    bankDetails,
  });
  return response.data;
}

export async function payOrderWithWallet(orderId: string, userId: string) {
  const response = await api.post(
    `/orders/${orderId}/pay-wallet`,
    { userId },
    { headers: authHeaders() }
  );
  return response.data;
}

export async function selectOrderFulfillment(orderId: string, userId: string, method: 'meetup' | 'shipping') {
  const response = await api.post(`/orders/${orderId}/fulfillment`, { userId, method }, { headers: authHeaders() });
  return response.data;
}

// ============== ORDER APIs ==============

export async function createOrder(
  listingId: string,
  buyerId: string,
  buyerName: string,
  sellerId: string,
  sellerName: string,
  price: number,
  listingTitle: string,
  quantity?: number,
  color?: string,
  discountMeta?: {
    originalPrice?: number;
    discountEnabled?: boolean;
    discountPercentage?: number;
    discountAmount?: number;
    finalPrice?: number;
  }
) {
  const response = await api.post('/orders', {
    listingId,
    buyerId,
    buyerName,
    sellerId,
    sellerName,
    price,
    listingTitle,
    quantity,
    color,
    ...discountMeta,
  });
  return response.data;
}

export async function getOrder(orderId: string) {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
}

export async function getUsers() {
  const response = await api.get('/users', { headers: authHeaders() });
  return response.data;
}

export async function getUserById(userId: string) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

export async function getListingById(listingId: string) {
  const response = await api.get(`/listings/${listingId}`);
  return response.data;
}

export async function getListingsBySeller(sellerId: string) {
  const response = await api.get(`/listings/seller/${sellerId}`);
  return response.data;
}

const authHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getUserOrders(userId: string, role: 'buyer' | 'seller') {
  const response = await api.get(`/orders/user/${userId}?role=${role}`, {
    headers: authHeaders(),
  });
  return response.data;
}

export async function acceptOrder(orderId: string, userId: string) {
  const response = await api.post(
    `/orders/${orderId}/accept`,
    { userId },
    { headers: authHeaders() }
  );
  return response.data;
}

export async function shipOrder(orderId: string, userId: string, trackingNumber?: string) {
  const response = await api.post(
    `/orders/${orderId}/ship`,
    {
      userId,
      trackingNumber,
    },
    { headers: authHeaders() }
  );
  return response.data;
}

export async function markOrderDelivered(orderId: string, userId: string) {
  const response = await api.post(`/orders/${orderId}/mark-delivered`, { userId }, { headers: authHeaders() });
  return response.data;
}

export async function confirmDelivery(orderId: string, userId: string) {
  const response = await api.post(
    `/orders/${orderId}/confirm-delivery`,
    {
      userId,
    },
    { headers: authHeaders() }
  );
  return response.data;
}

export async function cancelOrder(orderId: string, userId: string, reason?: string) {
  const response = await api.post(
    `/orders/${orderId}/cancel`,
    {
      userId,
      reason,
    },
    { headers: authHeaders() }
  );
  return response.data;
}

export async function raiseDispute(orderId: string, userId: string, reason?: string) {
  const response = await api.post(
    `/orders/${orderId}/dispute`,
    {
      userId,
      reason,
    },
    { headers: authHeaders() }
  );
  return response.data;
}

// ============== LISTING APIs ==============

export async function getListings() {
  const response = await api.get('/listings');
  return response.data;
}

export async function getListing(listingId: string) {
  const response = await api.get(`/listings/${listingId}`);
  return response.data;
}

export async function getSellerListings(sellerId: string) {
  const response = await api.get(`/listings/seller/${sellerId}`);
  return response.data;
}

export async function deleteListing(listingId: string) {
  const response = await api.delete(`/listings/${listingId}`, { headers: authHeaders() });
  return response.data;
}

export async function updateListing(listingId: string, listingData: Partial<Listing>) {
  const response = await api.put(`/listings/${listingId}`, listingData, { headers: authHeaders() });
  return response.data;
}

// ============== PROFILE APIs ==============

export async function getProfile() {
  const response = await api.get('/profile');
  return response.data;
}

export async function updateProfile(profileData: any) {
  const response = await api.put('/profile/update', profileData, { headers: authHeaders() });
  return response.data;
}

export async function getProfileStats() {
  const response = await api.get('/profile/stats', { headers: authHeaders() });
  return response.data;
}

export async function getSellerStats(sellerId: string) {
  const response = await api.get(`/sellers/${sellerId}/stats`);
  return response.data;
}

export async function uploadProfileAvatar(file: File) {
  // convert file to base64 data URL and send as JSON for simple backend handling
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await api.post('/profile/avatar', { image: dataUrl }, { headers: authHeaders() });
  return response.data;
}

export async function createListing(
  sellerId: string,
  sellerName: string,
  title: string,
  description: string,
  price: number,
  category: string,
  location: any,
  images: string[],
  discountMeta?: {
    originalPrice?: number;
    discountEnabled?: boolean;
    discountPercentage?: number;
    discountAmount?: number;
    finalPrice?: number;
  }
) {
  const response = await api.post('/listings', {
    sellerId,
    sellerName,
    title,
    description,
    price,
    category,
    location,
    images,
    ...discountMeta,
  });
  return response.data;
}

// ============== USER APIs ==============

export async function getUser(userId: string) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

export async function createUser(
  name: string,
  email: string,
  role: 'buyer' | 'seller',
  location?: any
) {
  const response = await api.post('/users', {
    name,
    email,
    role,
    location,
  });
  return response.data;
}

export async function updateUser(userId: string, updates: any) {
  const response = await api.put(`/users/${userId}`, updates);
  return response.data;
}
