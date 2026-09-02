import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Home, MessageCircle, User, ShoppingBag, Shield, Plus, Search, Filter, Heart, 
  Star, MapPin, Check, X, CreditCard, Download, Wallet, Upload, Eye, EyeOff
} from 'lucide-react';
import { User as UserType, Listing, Message, Order, Review, Role, Transaction, Report, PortalNotification, AccountDeletionRequest, AppNotification, NotificationCategory } from './types';
import {
  signup,
  login as apiLogin,
  sendVerificationOtp,
  verifyVerificationCode,
  logout as apiLogout,
  getCurrentUser,
  createListing,
  changePassword,
  getListings,
  deleteListing as deleteListingApi,
  updateListing as updateListingApi,
  getUsers,
  getUserById,
  createOrder,
  getUserOrders,
  acceptOrder,
  shipOrder,
  markOrderDelivered,
  confirmDelivery,
  cancelOrder,
  raiseDispute,
  payOrderWithWallet,
  selectOrderFulfillment,
  verifyWalletDeposit,
  getWalletBalance,
  postWalletDeposit,
  postWalletWithdraw,
  getTransactionHistory,
  getAdminUsers,
  getAdminListings,
  getAdminOrders,
  getAdminReports,
  getAdminAccountDeletionRequests,
  getAdminRevenue,
  getSellerStats,
  createAccountDeletionRequest,
  reviewAccountDeletionRequest,
  createReport,
  resolveAdminReport,
  initializeMembershipVerificationPayment,
  verifyMembershipVerificationPayment,
  payMembershipVerificationWithWallet,
  approveUserVerification,
  requestUserVerification,
  deleteAdminUser,
  deleteAdminListing,
  resolveAdminDispute,
  updateProfile as updateProfileApi,
} from './api/client';
import { setOnAuthFailure } from './api/client';
import { getAllStates } from './data/nigerian-locations';
import { MarketplaceShell } from './components/MarketplaceShell';
import { AuthPromptModal } from './components/AuthPromptModal';
import { getAccessToken } from './api/client';
import type { ListingFormValues } from './components/NewListingForm';

interface ChatConversation {
  chatId?: string;
  otherUserId: string;
  otherUserName: string;
  listingId?: string;
  listingTitle?: string;
  listingImage?: string;
  orderId?: string;
  orderPrice?: number;
  orderStatus?: string;
}

const CATEGORIES = [
  'Electronics',
  'Phones & Accessories',
  'Fashion',
   'Clothes',
  'Shoes',
   'caps',
   'Jewellery',
   'perfume' ,
  'Furniture',
  'Vehicles',
  'Food & Drinks',
  'Real Estate',
  'Services',
  'Agriculture',
  'Sports',
  'Books',
  'Health & Beauty',
  'Pharmercy',
  'Home & Garden',
  'Others',
];
const LOCATIONS = getAllStates();
const NIGERIAN_BANKS = [
  'GTBank',
  'Zenith Bank',
  'Access Bank',
  'UBA',
  'Kuda',
  'OPay',
  'First Bank',
  'Fidelity Bank',
  'EcoBank',
  'Union Bank',
  'Stanbic IBTC',
  'Sterling Bank',
  'Polaris Bank',
  'Keystone Bank',
  'Wema Bank',
  'FCMB',
];

const ProfilePage = React.lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const MessagesPage = React.lazy(() => import('./components/MessagesPage').then(m => ({ default: m.MessagesPage })));
const AuthPage = React.lazy(() => import('./components/AuthPage').then(m => ({ default: m.AuthPage })));
const LandingPage = React.lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const NewListingForm = React.lazy(() => import('./components/NewListingForm').then(m => ({ default: m.NewListingForm })));

const normalizeApiUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  // remove trailing slash
  let normalized = trimmed.replace(/\/$/, '');
  // strip a trailing '/api' segment to avoid duplicate /api/api in requests
  normalized = normalized.replace(/\/api$/i, '');
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized.replace(/^\/+/, '')}`;
};

const DEMO_NOTIFICATION_IDS = new Set(['app-1', 'app-2', 'app-3', 'app-4']);

const isDemoNotification = (notification: Partial<AppNotification>) => {
  const id = notification.id ?? '';
  if (DEMO_NOTIFICATION_IDS.has(id) || id.startsWith('live-')) return true;

  const title = (notification.title || '').toLowerCase();
  const description = (notification.description || '').toLowerCase();
  return title === 'trending near you' && description.includes('premium table lamp');
};

const normalizeStoredAppNotifications = (notifications: AppNotification[]) =>
  notifications.filter((notification) => !isDemoNotification(notification));

const buildInitialAppNotifications = (): AppNotification[] => [];

const compactUserForStorage = (user: Partial<UserType>) => {
  const normalizeLocation = (location?: UserType['location'] | UserType['sellerLocation']) => {
    if (!location) return undefined;
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && 'city' in location && 'state' in location && 'country' in location) {
      return {
        city: location.city,
        state: location.state,
        country: location.country,
      };
    }
    return undefined;
  };

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: typeof user.avatar === 'string' && user.avatar.startsWith('data:') ? '' : user.avatar,
    walletBalance: user.walletBalance,
    verified: user.verified,
    verificationLevel: user.verificationLevel,
    verificationFee: user.verificationFee,
    verificationBadgeType: user.verificationBadgeType,
    verificationRequestStatus: user.verificationRequestStatus,
    location: normalizeLocation(user.location),
    sellerLocation: normalizeLocation(user.sellerLocation),
    businessName: user.businessName,
    description: user.description ? String(user.description).slice(0, 280) : undefined,
    phone: user.phone,
    buyerPreferences: user.buyerPreferences ? {
      preferredLocations: (user.buyerPreferences.preferredLocations || []).slice(0, 3),
      searchRadius: user.buyerPreferences.searchRadius,
    } : undefined,
  };
};

const safeSetStorageJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn(`Storage quota exceeded for ${key}; dropping cached data.`);
      window.localStorage.removeItem(key);
      return;
    }
    console.warn(`Unable to cache ${key}.`, error);
  }
};

const persistUsers = (users: UserType[]) => {
  if (typeof window === 'undefined') return;
  safeSetStorageJson('mc_users', users.map(compactUserForStorage));
};

const saveListingsToStorage = (listings: Listing[]) => {
  if (typeof window === 'undefined') return;

  const compactListings = listings.map((listing) => ({
    ...listing,
    // Uploaded data URLs can be several megabytes and are already persisted by the backend.
    images: (listing.images || []).filter((image) => !image.startsWith('data:')).slice(0, 3),
  }));

  try {
    window.localStorage.setItem('mc_listings', JSON.stringify(compactListings));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      window.localStorage.removeItem('mc_listings');
      return;
    }
    console.warn('Unable to cache listings locally.', error);
  }
};

const INITIAL_LISTINGS: Listing[] = [
  { id: 'l1', sellerId: 'u2', sellerName: 'Emeka Electronics', title: 'Sony WH-1000XM5 Wireless Headphones', description: 'Noise cancelling headphones with 30-hour battery life. Perfect condition and fast delivery across Lagos.', price: 185000, category: 'Electronics', location: 'Lagos', images: ['https://picsum.photos/id/20/600/400', 'https://picsum.photos/id/180/600/400'], createdAt: '2025-01-12T10:00:00Z' },
  { id: 'l2', sellerId: 'u3', sellerName: 'Fatima Fashion', title: 'Authentic Ankara Fabric - 5 Yards', description: 'High-quality African print fabric for traditional wear and custom styling.', price: 25000, category: 'Fashion', location: 'Abuja', images: ['https://picsum.photos/id/1005/600/400'], createdAt: '2025-01-13T09:30:00Z' },
  { id: 'l3', sellerId: 'u2', sellerName: 'Emeka Electronics', title: 'Professional Home Cleaning Service', description: 'Experienced cleaners for homes and offices in Lagos. Eco-friendly products included.', price: 8500, category: 'Services', location: 'Lagos', images: ['https://picsum.photos/id/201/600/400'], createdAt: '2025-01-11T14:00:00Z' },
  { id: 'l4', sellerId: 'u3', sellerName: 'Fatima Fashion', title: 'Premium Leather Jacket - Size L', description: 'Stylish genuine leather jacket ready for Abuja and Lagos pickup.', price: 75000, category: 'Fashion', location: 'Abuja', images: ['https://picsum.photos/id/160/600/400'], createdAt: '2025-01-14T08:00:00Z' },
  { id: 'l5', sellerId: 'u2', sellerName: 'Emeka Electronics', title: 'Apple iPhone 15 Pro Max - 256GB', description: 'Brand new iPhone 15 Pro Max with full warranty and local delivery.', price: 1450000, category: 'Electronics', location: 'Lagos', images: ['https://picsum.photos/id/133/600/400'], createdAt: '2025-01-10T16:20:00Z' },
];

type ListingValidationErrors = Partial<Record<'title' | 'description' | 'price' | 'category' | 'location' | 'condition' | 'images', string>>;

function MarketConnectApp() {
  // State Management
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const currentUserSafe: UserType = currentUser ?? {
    id: 'guest',
    name: 'Guest',
    email: '',
    role: 'buyer',
    avatar: 'https://i.pravatar.cc/150?img=11',
    walletBalance: 0,
    verified: false,
    verificationRequestStatus: 'unrequested',
    verificationBadgeType: 'active_member',
  };
  const [users, setUsers] = useState<UserType[]>([]);
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedMessages = localStorage.getItem('mc_messages');
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch {
      return [];
    }
  });
  const [chatSyncing, setChatSyncing] = useState(false);
  const chatEventSourceRef = useRef<EventSource | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const ordersLoadVersion = useRef(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<AccountDeletionRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Router state
  const navigate = useNavigate();
  const location = useLocation();
  const LOGIN_PATH = '/login';
  const isPublicSellerRoute = location.pathname.startsWith('/seller/');
  const isDiscoverRoute = location.pathname === '/' || location.pathname.startsWith('/discover');
  const isListingDetailRoute = location.pathname.startsWith('/listing/');

  useEffect(() => {
    const hasStoredSession = Boolean(localStorage.getItem('mc_currentUser') && localStorage.getItem('marketplace_access_token'));
    // Allow public access to: login, home, discover, listing details, and public seller profiles
    const isAllowedGuestPath = location.pathname === LOGIN_PATH || isDiscoverRoute || isListingDetailRoute || isPublicSellerRoute;

    if (!currentUser && !hasStoredSession && !isAllowedGuestPath) {
      navigate('/', { replace: true });
      return;
    }

    if (currentUser && location.pathname === LOGIN_PATH) {
      navigate('/', { replace: true });
    }
  }, [currentUser, location.pathname, navigate, isPublicSellerRoute, isDiscoverRoute, isListingDetailRoute]);

  const getActiveTab = () => {
    const path = location.pathname || '/';
    if (path.startsWith('/messages')) return 'messages';
    if (path.startsWith('/activity')) return 'activity';
    if (path.startsWith('/transactions')) return 'transactions';
    if (path.startsWith('/wallet')) return 'wallet';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/admin')) return 'admin';
    return 'discover';
  };
  const activeTab = getActiveTab();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000000000]); // 10 billion - users can enter any amount
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showChat, setShowChat] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatConversation | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [chatLastRead, setChatLastRead] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem('mc_chat_last_read');
      return raw ? JSON.parse(raw) as Record<string,string> : {};
    } catch {
      return {};
    }
  });
  const chatLoadVersionRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('mc_chat_last_read', JSON.stringify(chatLastRead));
    } catch {
      // ignore
    }
  }, [chatLastRead]);

  const markChatAsRead = (chatId?: string) => {
    if (!chatId) return;
    setChatLastRead(prev => ({ ...prev, [chatId]: new Date().toISOString() }));
  };
  const [showOrderModal, setShowOrderModal] = useState<Listing | null>(null);
  const [orderRequestSent, setOrderRequestSent] = useState<Listing | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Order | null>(null);
  const [fulfillmentOrder, setFulfillmentOrder] = useState<Order | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<Order | null>(null);
  const [showAuthPromptModal, setShowAuthPromptModal] = useState(false);
  const [authPromptTitle, setAuthPromptTitle] = useState('Create a Free Account');
  const [authPromptMessage, setAuthPromptMessage] = useState('Sign in or create a free MarketConnect account to continue.');
  const [sellerStatsCache, setSellerStatsCache] = useState<Record<string, { activeListings: number; averageRating: number; totalReviews: number; salesDone: number }>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('mc_seller_stats') || '{}');
    } catch {
      return {};
    }
  });
  const sellerRouteDataRef = useRef<any>(null);
  const sellerProfileRouteRef = useRef<React.FC | null>(null);

  const navigateTo = (tab: string) => {
    const path = tab === 'discover' ? '/' : `/${tab}`;
    navigate(path);
  };

  // Show auth prompt modal for non-authenticated users
  const showAuthPrompt = (title: string = 'Create a Free Account', message: string = 'Sign in or create a free MarketConnect account to continue.') => {
    setAuthPromptTitle(title);
    setAuthPromptMessage(message);
    setShowAuthPromptModal(true);
  };

  // Form States
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'buyer' as Role });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [listingForm, setListingForm] = useState({
    title: '', description: '', price: '', category: CATEGORIES[0], location: LOCATIONS[0], images: [] as string[], condition: 'New' as 'New' | 'Like New' | 'Used' | 'Refurbished'
  });
  const [listingError, setListingError] = useState<string | null>(null);
  const [listingSuccess, setListingSuccess] = useState<string | null>(null);
  const [listingSubmitting, setListingSubmitting] = useState(false);
  const [listingValidationErrors, setListingValidationErrors] = useState<ListingValidationErrors>({});
  const [orderNotes, setOrderNotes] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderColor, setOrderColor] = useState('Black');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<UserType>>({});
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileRefreshToken, setProfileRefreshToken] = useState(0);
  const [verificationRefreshToken, setVerificationRefreshToken] = useState(0);
  const [myListingsVisibility, setMyListingsVisibility] = useState(() => ({
    userId: currentUser?.id || 'guest',
    visible: false,
  }));
  const showMyListings = myListingsVisibility.visible;
  const prevProfileUserId = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userId = currentUser?.id || 'guest';
    const savedValue = localStorage.getItem(`mc_show_my_listings_${userId}`);
    setMyListingsVisibility({
      userId,
      visible: savedValue === 'true',
    });
  }, [currentUser?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userId = currentUser?.id || 'guest';
    if (myListingsVisibility.userId !== userId) return;
    localStorage.setItem(`mc_show_my_listings_${userId}`, String(myListingsVisibility.visible));
  }, [currentUser?.id, myListingsVisibility]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc_messages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (!currentUser) {
      setProfileForm({});
      setProfilePhoto('');
      prevProfileUserId.current = null;
      return;
    }

    const nextProfileForm = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      location: currentUser.location,
      sellerLocation: currentUser.sellerLocation,
      businessName: currentUser.businessName,
      description: currentUser.description,
      avatar: currentUser.avatar,
    };

    const hasUncommittedEdits = Object.keys(profileForm).length > 0 && prevProfileUserId.current === currentUser.id;
    if (hasUncommittedEdits) {
      return;
    }

    if (prevProfileUserId.current === currentUser.id) {
      return;
    }

    prevProfileUserId.current = currentUser.id;
    setProfileForm(nextProfileForm);
    setProfilePhoto(currentUser.avatar || '');
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.phone, currentUser?.location, currentUser?.sellerLocation, currentUser?.businessName, currentUser?.description, currentUser?.avatar]);

  // Wallet / Payment state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'paystack' | 'flutterwave'>('paystack');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState<{
    provider: 'paystack' | 'flutterwave';
    reference: string;
    amount: number;
  } | null>(null);
  const [depositStatusMessage, setDepositStatusMessage] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(currentUser?.walletBalance || 0);
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'payment' | 'payout'>('all');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionDetail, setTransactionDetail] = useState<Transaction | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {});
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeOrder, setDisputeOrder] = useState<Order | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordMessage, setChangePasswordMessage] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [verifyingUserId, setVerifyingUserId] = useState<string | null>(null);
  const [verificationProvider] = useState<'paystack' | 'flutterwave'>('paystack');
  const [verificationAmount] = useState('5000');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [selectedAdminUserIds, setSelectedAdminUserIds] = useState<string[]>([]);
  const [adminRevenue, setAdminRevenue] = useState({ deposits: 0, withdrawals: 0 });
  const [assistantTargetUserId, setAssistantTargetUserId] = useState<string>('');
  const [assistantTargetReportId, setAssistantTargetReportId] = useState<string>('');
  const [assistantPrompt, setAssistantPrompt] = useState('Help me evaluate the selected user or complaint.');
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [adminVerificationTargetId, setAdminVerificationTargetId] = useState<string>('');
  const [adminVerificationBadgeType, setAdminVerificationBadgeType] = useState<'active_member' | 'verified_seller'>('active_member');
  const [adminVerificationFee, setAdminVerificationFee] = useState('5000');
  const [reportForm, setReportForm] = useState({
    reportedUserId: '',
    reportedUserName: '',
    reportedRole: 'buyer' as Role,
    traceContact: '',
    type: 'report' as 'report' | 'complaint',
    subject: '',
    details: '',
  });

  // Notifications
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: string }[]>([]);
  const [portalNotifications, setPortalNotifications] = useState<PortalNotification[]>([]);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === 'undefined') return [];
    const sharedStore = window.localStorage.getItem('mc_app_notifications_all');
    const userStore = currentUser ? window.localStorage.getItem(`mc_app_notifications_${currentUser.id}`) : null;
    const stored = userStore || sharedStore || window.localStorage.getItem('mc_app_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AppNotification[];
        return normalizeStoredAppNotifications(parsed);
      } catch {
        return buildInitialAppNotifications();
      }
    }
    return buildInitialAppNotifications();
  });
  const [notificationFilter, setNotificationFilter] = useState<NotificationCategory>('all');
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showNotificationsPage, setShowNotificationsPage] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [pendingSignupUser, setPendingSignupUser] = useState<UserType | null>(null);
  const [emailOtp, setEmailOtp] = useState('');
  const [authInitialized, setAuthInitialized] = useState(false);

  const syncNotificationsForCurrentUser = useCallback((userOverride?: UserType | null) => {
    if (typeof window === 'undefined') return;

    const activeUser = userOverride ?? currentUser;
    const sharedKey = 'mc_app_notifications_all';
    const userKey = activeUser ? `mc_app_notifications_${activeUser.id}` : 'mc_app_notifications_guest';

    const readStored = (storageKey: string) => {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return [] as AppNotification[];
      try {
        return JSON.parse(stored) as AppNotification[];
      } catch {
        return [] as AppNotification[];
      }
    };

    const merged = [...readStored(sharedKey), ...readStored(userKey)];
    const seen = new Set<string>();
    const relevant = merged.filter(notification => {
      if (seen.has(notification.id)) return false;
      seen.add(notification.id);
      return notificationMatchesRecipient(notification, activeUser);
    });

    setAppNotifications(normalizeStoredAppNotifications(relevant));
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sharedKey = 'mc_app_notifications_all';
    const userKey = currentUser ? `mc_app_notifications_${currentUser.id}` : 'mc_app_notifications_guest';
    window.localStorage.setItem(sharedKey, JSON.stringify(appNotifications));
    window.localStorage.setItem(userKey, JSON.stringify(appNotifications));
  }, [appNotifications, currentUser?.id]);

  useEffect(() => {
    syncNotificationsForCurrentUser();
  }, [syncNotificationsForCurrentUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSync = () => syncNotificationsForCurrentUser();
    window.addEventListener('marketconnect:notifications-updated', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    return () => {
      window.removeEventListener('marketconnect:notifications-updated', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
    };
  }, [syncNotificationsForCurrentUser]);

  // Load from localStorage and restore authenticated session
  useEffect(() => {
    const savedUser = localStorage.getItem('mc_currentUser');
    const savedListings = localStorage.getItem('mc_listings');
    const savedMessages = localStorage.getItem('mc_messages');
    const savedOrders = localStorage.getItem('mc_orders');
    const savedReviews = localStorage.getItem('mc_reviews');
    const savedFavorites = localStorage.getItem('mc_favorites');
    const savedUsers = localStorage.getItem('mc_users');
    const savedTransactions = localStorage.getItem('mc_transactions');
    const savedDeletionRequests = localStorage.getItem('mc_deletion_requests');
    const savedPendingSignup = localStorage.getItem('mc_pending_signup');
    const token = localStorage.getItem('marketplace_access_token');

    if (savedPendingSignup) {
      try {
        setPendingSignupUser(JSON.parse(savedPendingSignup));
      } catch {
        localStorage.removeItem('mc_pending_signup');
      }
    }

    if (savedUser && token) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('mc_currentUser');
      }
    } else if (savedUser && !token) {
      localStorage.removeItem('mc_currentUser');
      localStorage.removeItem('mc_listings');
      localStorage.removeItem('mc_messages');
      localStorage.removeItem('mc_orders');
      localStorage.removeItem('mc_reviews');
      localStorage.removeItem('mc_favorites');
      localStorage.removeItem('mc_users');
      localStorage.removeItem('mc_transactions');
    }

    if (savedListings) setListings(JSON.parse(savedListings));
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedReviews) setReviews(JSON.parse(savedReviews));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedDeletionRequests) setDeletionRequests(JSON.parse(savedDeletionRequests));

    if (token && !savedPendingSignup) {
      getCurrentUser()
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          const fallbackUser = savedUser ? JSON.parse(savedUser) : null;
          if (fallbackUser) {
            setCurrentUser(fallbackUser);
          }
        })
        .finally(() => {
          setAuthInitialized(true);
        });
    } else {
      setAuthInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!authInitialized || !currentUser) return;

    const refreshVerificationRequest = () => {
      getCurrentUser()
        .then((freshUser) => setCurrentUser(freshUser))
        .catch(() => undefined);
    };

    window.addEventListener('focus', refreshVerificationRequest);
    return () => window.removeEventListener('focus', refreshVerificationRequest);
  }, [authInitialized, currentUser?.id]);

  // Save to localStorage
  useEffect(() => {
    if (currentUser) safeSetStorageJson('mc_currentUser', currentUser);
    saveListingsToStorage(listings);
    safeSetStorageJson('mc_messages', messages);
    safeSetStorageJson('mc_orders', orders);
    safeSetStorageJson('mc_reviews', reviews);
    safeSetStorageJson('mc_favorites', favorites);
    persistUsers(users);
    safeSetStorageJson('mc_transactions', transactions);
  }, [currentUser, listings, messages, orders, reviews, favorites, users, transactions]);

  // Calculate unread messages
  useEffect(() => {
    if (!currentUser) return;
    const unread = messages.filter(m => 
      m.senderId !== currentUser.id && 
      activeChat?.otherUserId !== m.senderId
    ).length;
    setUnreadMessages(Math.min(unread, 9));
  }, [messages, currentUser, activeChat]);

  const notificationMatchesRecipient = (notification: PortalNotification, user: UserType | null) => {
    if (!user) return false;
    if (notification.targetUserId && notification.targetUserId !== 'all' && notification.targetUserId !== user.id) {
      return false;
    }
    if (notification.targetRole && notification.targetRole !== 'all' && notification.targetRole !== user.role) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!currentUser) {
      setPortalNotifications([]);
      return;
    }

    const sharedStorageKey = 'mc_portal_notifications_all';
    const userStorageKey = `mc_portal_notifications_${currentUser.id}`;

    const readNotifications = (storageKey: string) => {
      const storedNotifications = localStorage.getItem(storageKey);
      if (!storedNotifications) return [] as PortalNotification[];

      try {
        return JSON.parse(storedNotifications) as PortalNotification[];
      } catch (error) {
        console.warn('Unable to load portal notifications.', error);
        return [] as PortalNotification[];
      }
    };

    const merged = [...readNotifications(sharedStorageKey), ...readNotifications(userStorageKey)];
    const seen = new Set<string>();
    const relevant = merged.filter(notification => {
      if (seen.has(notification.id)) return false;
      seen.add(notification.id);
      return notificationMatchesRecipient(notification, currentUser);
    });

    setPortalNotifications(relevant);
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const remoteListings = await getListings();
        if (remoteListings && Array.isArray(remoteListings)) {
          setListings(remoteListings);
        }
      } catch (error) {
        console.warn('Unable to load listings from backend.', error);
      }
    };

    loadListings();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      const publicSellerId = location.pathname.startsWith('/seller/')
        ? decodeURIComponent(location.pathname.split('/')[2] || '')
        : '';
      if (!authInitialized || (!currentUser && !publicSellerId)) {
        setUsers([]);
        return;
      }

      try {
        if (!currentUser && publicSellerId) {
          const publicSeller = await getUserById(publicSellerId);
          if (publicSeller) setUsers([publicSeller as UserType]);
          return;
        }
        const remoteUsers = await getUsers();
        if (Array.isArray(remoteUsers)) {
          setUsers(remoteUsers as UserType[]);
        }
      } catch (error) {
        console.warn('Unable to load users for reporting.', error);
      }
    };

    loadUsers();
  }, [authInitialized, currentUser?.id, location.pathname]);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!authInitialized || !currentUser || currentUser.role !== 'admin') return;

      try {
        const [remoteUsers, remoteListings, remoteOrders, remoteReports, remoteDeletionRequests, remoteRevenue] = await Promise.all([
          getAdminUsers(),
          getAdminListings(),
          getAdminOrders(),
          getAdminReports(),
          getAdminAccountDeletionRequests(),
          getAdminRevenue(),
        ]);

        if (Array.isArray(remoteUsers)) {
          setUsers(remoteUsers as UserType[]);
        }
        if (Array.isArray(remoteListings)) {
          setListings(remoteListings as Listing[]);
        }
        if (Array.isArray(remoteOrders)) {
          setOrders(remoteOrders as Order[]);
        }
        if (Array.isArray(remoteReports)) {
          setReports(remoteReports as Report[]);
        }
        if (Array.isArray(remoteDeletionRequests)) {
          setDeletionRequests(remoteDeletionRequests as AccountDeletionRequest[]);
        }
        if (remoteRevenue) setAdminRevenue(remoteRevenue);
      } catch (error) {
        console.warn('Unable to load admin dashboard data.', error);
      }
    };

    loadAdminData();
  }, [authInitialized, currentUser?.id, currentUser?.role]);

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async (user: UserType | null) => {
      const loadVersion = ++ordersLoadVersion.current;
      if (!authInitialized || !user) {
        setOrders([]);
        setTransactions([]);
        return;
      }

      if (user.role === 'admin') {
        setTransactions([]);
        return;
      }

      try {
        if (user.role === 'buyer' || user.role === 'seller') {
          const [buyerOrders, sellerOrders] = await Promise.all([
            getUserOrders(user.id, 'buyer'),
            getUserOrders(user.id, 'seller'),
          ]);
          const mergedOrders = [...buyerOrders, ...sellerOrders].filter((order, index, all) => (
            all.findIndex(candidate => candidate.id === order.id) === index
          ));
          if (!cancelled && loadVersion === ordersLoadVersion.current) setOrders(mergedOrders);
        } else {
          if (!cancelled && loadVersion === ordersLoadVersion.current) setOrders([]);
        }
      } catch (error) {
        console.warn('Unable to load orders from backend.', error);
      }

      try {
        const walletTransactions = await getTransactionHistory(user.id);
        if (!cancelled && loadVersion === ordersLoadVersion.current) setTransactions(walletTransactions);
      } catch (error) {
        console.warn('Unable to load transaction history from backend.', error);
      }
    };

    loadOrders(currentUser);

    if (currentUser && currentUser.role !== 'admin') {
      const refreshTimer = window.setInterval(() => loadOrders(currentUser), 30000);
      const refreshOnFocus = () => loadOrders(currentUser);
      window.addEventListener('focus', refreshOnFocus);

      return () => {
        cancelled = true;
        window.clearInterval(refreshTimer);
        window.removeEventListener('focus', refreshOnFocus);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [authInitialized, currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (!authInitialized || !currentUser || activeTab !== 'activity') return;

    let cancelled = false;
    getCurrentUser()
      .then((freshUser) => {
        if (cancelled || !freshUser) return;
        setCurrentUser(freshUser);
        localStorage.setItem('mc_currentUser', JSON.stringify(freshUser));
      })
      .catch((error) => {
        console.warn('Unable to refresh activity user status.', error);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, authInitialized, currentUser?.id]);

  useEffect(() => {
    // Register global auth-failure handler so any 401 from API triggers log out and auth modal
    setOnAuthFailure(() => {
      apiLogout();
      setCurrentUser(null);
      navigate(LOGIN_PATH, { replace: true });
      addNotification('Session expired. Please sign in again.', 'error');
    });

    const fetchBalance = async () => {
      if (!authInitialized || !currentUser) {
        setWalletBalance(0);
        return;
      }
      try {
        const balance = await getWalletBalance();
        setWalletBalance(balance);
        setCurrentUser(prev => prev ? { ...prev, walletBalance: balance } : prev);
      } catch (error) {
        console.warn('Unable to fetch wallet balance.', error);
      }
    };

    fetchBalance();
  }, [authInitialized, currentUser?.id]);

  const normalizeListingLocation = (location: any) => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      const record = location as Record<string, unknown>;
      if (typeof record.city === 'string' && typeof record.state === 'string') {
        return `${record.city}, ${record.state}`;
      }
      if (typeof record.state === 'string') {
        return record.state;
      }
      if (typeof record.country === 'string') {
        return record.country;
      }
    }
    return String(location);
  };

  const normalizeLocationText = (value?: string) => {
    if (!value) return '';
    return value
      .toLowerCase()
      .replace(/\s+(state|province|territory|fct|city)/gi, '')
      .replace(/[^a-z0-9\s,]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/,\s*/g, ', ')
      .trim();
  };

  const getExactLocationVariants = (location: unknown): { city?: string; state?: string; country?: string; combined: string[] } => {
    const combined = new Set<string>();

    const addVariant = (value?: string) => {
      const normalized = normalizeLocationText(value);
      if (normalized) combined.add(normalized);
    };

    const result: { city?: string; state?: string; country?: string; combined: string[] } = {
      combined: [],
    };

    if (typeof location === 'string') {
      addVariant(location);
      result.combined = Array.from(combined);
      return result;
    }

    if (location && typeof location === 'object') {
      const record = location as Record<string, unknown>;
      const city = typeof record.city === 'string' ? record.city : undefined;
      const state = typeof record.state === 'string' ? record.state : undefined;
      const country = typeof record.country === 'string' ? record.country : undefined;

      result.city = normalizeLocationText(city);
      result.state = normalizeLocationText(state);
      result.country = normalizeLocationText(country);

      addVariant(city);
      addVariant(state);
      addVariant(country);

      if (city && state) addVariant(`${city}, ${state}`);
      if (city && country) addVariant(`${city}, ${country}`);
      if (state && country) addVariant(`${state}, ${country}`);
    }

    result.combined = Array.from(combined);
    return result;
  };

  const isNearbyLocationMatch = (sourceLocation: unknown, targetLocation: unknown) => {
    const source = getExactLocationVariants(sourceLocation);
    const target = getExactLocationVariants(targetLocation);

    if (!source.combined.length || !target.combined.length) return false;

    const sourceCity = source.city;
    const targetCity = target.city;
    const sourceState = source.state;
    const targetState = target.state;

    const sameCity = Boolean(sourceCity && targetCity && sourceCity === targetCity);
    const sameState = Boolean(sourceState && targetState && sourceState === targetState);

    if (sameCity || (sameState && sourceCity && targetCity)) return true;
    if (sameState) return true;

    return source.combined.some((value) => target.combined.includes(value));
  };

  // Filter listings
  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || listing.category === selectedCategory;
    const matchesPrice = listing.price >= priceRange[0] && listing.price <= priceRange[1];
    const locationLabel = normalizeListingLocation(listing.location);
    const matchesLocation = !selectedLocation || locationLabel === selectedLocation;
    return matchesSearch && matchesCategory && matchesPrice && matchesLocation;
  });

  // Get seller listings
  const myListings = currentUser ? listings.filter(l => l.sellerId === currentUser.id) : [];

  // Get my orders
  const myOrders = currentUser ? orders.filter(o => o.buyerId === currentUser.id || o.sellerId === currentUser.id) : [];
  const heldBalance = currentUser
    ? myOrders
        .filter(order => order.buyerId === currentUser.id && order.paymentStatus === 'completed' && !['confirmed', 'completed', 'cancelled', 'rejected'].includes(order.status))
        .reduce((sum, order) => sum + order.price, 0)
    : 0;

  const canLeaveReview = (order: Order, isSeller: boolean) => {
    if (isSeller) return false;
    return order.status === 'confirmed' && !reviews.some(review => review.orderId === order.id);
  };

  const filteredTransactions = currentUser ? transactions.filter(tx => {
    const matchesType = transactionTypeFilter === 'all' || tx.type === transactionTypeFilter;
    const matchesSearch = transactionSearch.trim() === '' ||
      tx.details?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      tx.type.toLowerCase().includes(transactionSearch.toLowerCase());
    return matchesType && matchesSearch && tx.userId === currentUser.id;
  }) : [];

  // Get conversations for messages
  const getConversations = (): ChatConversation[] => {
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      const convMap = new Map<string, { ids: Set<string>; names: Map<string, string>; listingId?: string; listingTitle?: string; orderId?: string; orderPrice?: number; orderStatus?: string; primaryId: string }>();

      messages.forEach(msg => {
        const chatId = msg.chatId;
        const chatParts = chatId.split('-');
        const participantIds = chatParts.slice(0, 2);
        const listing = listings.find(l => chatParts.slice(2).join('-') === l.id);
        const relatedOrder = orders.find(order => {
          const orderChatId = [order.buyerId, order.sellerId].sort().join('-') + (order.listingId ? `-${order.listingId}` : '');
          return orderChatId === chatId;
        });
        const existing = convMap.get(chatId);

        if (!existing) {
          const ids = new Set<string>(participantIds.filter(Boolean));
          const names = new Map<string, string>([[msg.senderId, msg.senderName]]);
          convMap.set(chatId, {
            ids,
            names,
            listingId: listing?.id,
            listingTitle: listing?.title,
            orderId: relatedOrder?.id,
            orderPrice: relatedOrder?.price,
            orderStatus: relatedOrder?.status,
            primaryId: participantIds.find(id => id !== msg.senderId) || msg.senderId,
          });
          return;
        }

        participantIds.forEach(id => existing.ids.add(id));
        existing.names.set(msg.senderId, msg.senderName);
        if (!existing.listingId && listing) {
          existing.listingId = listing.id;
          existing.listingTitle = listing.title;
        }
      });

      orders.forEach(order => {
        const chatId = [order.buyerId, order.sellerId].sort().join('-') + (order.listingId ? `-${order.listingId}` : '');
        if (convMap.has(chatId)) return;

        convMap.set(chatId, {
          ids: new Set<string>([order.buyerId, order.sellerId]),
          names: new Map<string, string>([
            [order.buyerId, order.buyerName],
            [order.sellerId, order.sellerName],
          ]),
          listingId: order.listingId,
          listingTitle: order.listingTitle,
          primaryId: order.sellerId,
        });
      });

      return Array.from(convMap.entries()).map(([chatId, data]) => {
        const participantNames = Array.from(data.ids).map(id => data.names.get(id) || users.find(u => u.id === id)?.name || id);
        return {
          chatId,
          otherUserId: data.primaryId,
          otherUserName: participantNames.join(' ↔ '),
          listingId: data.listingId,
          listingTitle: data.listingTitle,
          listingImage: data.listingId ? listings.find(listing => listing.id === data.listingId)?.images?.[0] : undefined,
        };
      });
    }

    const convMap = new Map<string, ChatConversation>();

    messages.forEach(msg => {
      const chatId = msg.chatId;
      const chatParts = chatId.split('-');
      const participantIds = chatParts.slice(0, 2);

      if (!participantIds.includes(currentUser.id)) return;

      const otherId = participantIds.find(id => id !== currentUser.id) || '';
      if (!otherId) return;

      const otherUser = users.find(u => u.id === otherId);
      if (!otherUser) return;

      const listingId = chatParts.slice(2).join('-') || undefined;
      const listing = listingId ? listings.find(l => l.id === listingId) : undefined;
      const relatedOrder = myOrders.find(order => {
        const orderChatId = [order.buyerId, order.sellerId].sort().join('-') + (order.listingId ? `-${order.listingId}` : '');
        return orderChatId === chatId;
      });

      if (!convMap.has(chatId)) {
        convMap.set(chatId, {
          chatId,
          otherUserId: otherId,
          otherUserName: otherUser.name,
          listingId,
          listingTitle: listing?.title,
            listingImage: listing?.images?.[0],
            orderId: relatedOrder?.id,
            orderPrice: relatedOrder?.price,
            orderStatus: relatedOrder?.status,
        });
      }
    });

    // Also add from orders
    myOrders.forEach(order => {
      const otherId = order.buyerId === currentUser.id ? order.sellerId : order.buyerId;
      const chatId = [currentUser.id, otherId].sort().join('-') + (order.listingId ? `-${order.listingId}` : '');
      if (!convMap.has(chatId)) {
        const other = users.find(u => u.id === otherId);
        if (other) {
          convMap.set(chatId, {
            chatId,
            otherUserId: otherId,
            otherUserName: other.name,
            listingId: order.listingId,
            listingTitle: order.listingTitle,
            listingImage: listings.find(listing => listing.id === order.listingId)?.images?.[0],
            orderId: order.id,
            orderPrice: order.price,
            orderStatus: order.status,
          });
        }
      }
    });

    return Array.from(convMap.values());
  };

  const conversations = getConversations();

  const loadChat = useCallback((conv: ChatConversation) => {
    if (!currentUser) {
      navigate(LOGIN_PATH);
      return;
    }

    const loadVersion = ++chatLoadVersionRef.current;

    const chatId = currentUser.role === 'admin' && conv.chatId
      ? conv.chatId
      : [currentUser.id, conv.otherUserId].sort().join('-') + (conv.listingId ? `-${conv.listingId}` : '');

    const chatMsgs = messages.filter(m => m.chatId === chatId).sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    setActiveChat({ ...conv, listingId: conv.listingId, chatId });
    setChatMessages(chatMsgs);
    setShowChat(true);
    setNewMessage('');
    setChatImage(null);
    if (location.pathname !== '/messages') {
      navigateTo('messages');
    }

    // mark as read locally
    markChatAsRead(chatId);

    const token = getAccessToken();
    if (!token) return;

    setChatSyncing(true);
    fetch(`${import.meta.env.VITE_API_URL ? normalizeApiUrl(import.meta.env.VITE_API_URL) : ''}/api/chat/${encodeURIComponent(chatId)}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load remote messages');
        const remoteMessages = await response.json() as Message[];
        if (loadVersion !== chatLoadVersionRef.current) return;
        const sortedRemoteMessages = [...remoteMessages].sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setMessages(prev => [...prev.filter(m => m.chatId !== chatId), ...sortedRemoteMessages]);
        setChatMessages(sortedRemoteMessages);
      })
      .catch(() => {
        if (loadVersion !== chatLoadVersionRef.current) return;
        setChatMessages(chatMsgs);
      })
      .finally(() => {
        if (loadVersion === chatLoadVersionRef.current) setChatSyncing(false);
      });
  }, [currentUser, messages, navigateTo, location.pathname]);

  useEffect(() => {
    if (!activeChat || !currentUser) return;

    const chatId = activeChat.chatId || [currentUser.id, activeChat.otherUserId].sort().join('-') + (activeChat.listingId ? `-${activeChat.listingId}` : '');
    const nextMessages = messages
      .filter(message => message.chatId === chatId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    setChatMessages(prev => {
      const isSameThread = prev.length === nextMessages.length && prev.every((message, index) => {
        const nextMessage = nextMessages[index];
        return message.id === nextMessage?.id && message.timestamp === nextMessage?.timestamp;
      });
      return isSameThread ? prev : nextMessages;
    });
  }, [messages, activeChat, currentUser]);

  useEffect(() => {
    if (!activeChat || !currentUser) return;

    const chatId = activeChat.chatId || [currentUser.id, activeChat.otherUserId].sort().join('-') + (activeChat.listingId ? `-${activeChat.listingId}` : '');
    const baseUrl = import.meta.env.VITE_API_URL ? normalizeApiUrl(import.meta.env.VITE_API_URL) : '';
    const streamUrl = `${baseUrl}/api/chat/stream?chatId=${encodeURIComponent(chatId)}&userId=${encodeURIComponent(currentUser.id)}`;

    if (chatEventSourceRef.current) {
      chatEventSourceRef.current.close();
    }

    const eventSource = new EventSource(streamUrl);
    chatEventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const remoteMessage = JSON.parse(event.data) as Message;
        setMessages(prev => {
          const alreadyExists = prev.some(item => item.id === remoteMessage.id);
          return alreadyExists ? prev : [...prev, remoteMessage];
        });

        if (currentUser && remoteMessage.senderId !== currentUser.id) {
          addPortalNotification({
            title: 'New message',
            message: `${remoteMessage.senderName || 'Someone'} sent you a message${remoteMessage.content ? `: “${remoteMessage.content}”` : ''}.`,
            type: 'message',
            targetUserId: currentUser.id,
            targetRole: 'all',
            relatedUserId: remoteMessage.senderId,
          });
          addNotification(`${remoteMessage.senderName || 'Someone'} sent you a message.`, 'message');
        }
      } catch (error) {
        console.warn('[chat] Failed to parse streamed message', error);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
      if (chatEventSourceRef.current === eventSource) {
        chatEventSourceRef.current = null;
      }
    };
  }, [activeChat, currentUser]);

  useEffect(() => {
    const container = document.getElementById('chat-scroll');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatMessages]);

  // Send message - real conversation flow
  const sendMessage = async (contentOverride?: string, imageOverride?: string | null) => {
    const outgoingContent = (contentOverride ?? newMessage).trim();
    const outgoingImage = imageOverride !== undefined ? imageOverride : chatImage;
    if ((!outgoingContent && !outgoingImage) || !activeChat || !currentUser || currentUser.role === 'admin') return;

    const chatId = [currentUser.id, activeChat.otherUserId].sort().join('-') +
                   (activeChat.listingId ? `-${activeChat.listingId}` : '');

    const message: Message = {
      id: 'm' + Date.now(),
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: outgoingContent,
      image: outgoingImage ?? undefined,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setChatImage(null);
    addNotification(`Message sent to ${activeChat.otherUserName}`, 'message');

    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ? normalizeApiUrl(import.meta.env.VITE_API_URL) : ''}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          content: outgoingContent,
          image: outgoingImage,
          recipientId: activeChat.otherUserId,
          listingId: activeChat.listingId,
        }),
      });

      if (!response.ok) {
        console.warn('[chat] Remote sync failed, status', response.status);
      }
    } catch (error) {
      console.warn('[chat] Remote sync failed, staying local.', error);
    }
  };

  const sendVoiceMessage = async (audio: string) => {
    if (!activeChat || !currentUser || currentUser.role === 'admin') return;

    const chatId = [currentUser.id, activeChat.otherUserId].sort().join('-') +
                   (activeChat.listingId ? `-${activeChat.listingId}` : '');
    const message: Message = {
      id: 'm' + Date.now(),
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: '',
      audio,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, message]);
    addNotification(`Voice message sent to ${activeChat.otherUserName}`, 'message');

    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ? normalizeApiUrl(import.meta.env.VITE_API_URL) : ''}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          content: '',
          audio,
          recipientId: activeChat.otherUserId,
          listingId: activeChat.listingId,
        }),
      });

      if (!response.ok) console.warn('[chat] Remote voice sync failed, status', response.status);
    } catch (error) {
      console.warn('[chat] Remote voice sync failed, staying local.', error);
    }
  };

  // Add notification
  const addNotification = (message: string, type: string) => {
    const notif = { id: Date.now().toString(), message, type };
    setNotifications(prev => [notif, ...prev].slice(0, 4));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }, 4500);
  };

  const handleToggleNotificationRead = (id: string) => {
    setAppNotifications(prev => prev.map(notification => notification.id === id ? { ...notification, read: !notification.read } : notification));
  };

  const handleDeleteNotification = (id: string) => {
    setAppNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleNotificationAction = (type: 'view' | 'payment' | 'message') => {
    setShowNotificationMenu(false);
    setShowNotificationsPage(true);
    addNotification(type === 'message' ? 'Conversation opened from notification.' : type === 'payment' ? 'Payment flow opened from notification.' : 'Notification details opened.', 'info');
  };

  const markAllNotificationsRead = () => {
    setAppNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  const unreadNotificationCount = appNotifications.filter(notification => !notification.read).length + portalNotifications.filter(notification => !notification.read).length;

  const filteredNotifications = useMemo(() => {
    if (notificationFilter === 'all') return appNotifications;
    return appNotifications.filter(notification => notification.category === notificationFilter);
  }, [appNotifications, notificationFilter]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, AppNotification[]> = { Today: [], Yesterday: [], Earlier: [] };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    filteredNotifications.forEach(notification => {
      const createdAt = new Date(notification.timestamp);
      if (createdAt >= todayStart) {
        groups.Today.push(notification);
      } else if (createdAt >= yesterdayStart) {
        groups.Yesterday.push(notification);
      } else {
        groups.Earlier.push(notification);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const persistPortalNotifications = (next: PortalNotification[], targetUserId?: string | 'all') => {
    setPortalNotifications(next);
    localStorage.setItem('mc_portal_notifications_all', JSON.stringify(next));
    if (targetUserId && targetUserId !== 'all') {
      localStorage.setItem(`mc_portal_notifications_${targetUserId}`, JSON.stringify(next));
    } else {
      localStorage.setItem(currentUser ? `mc_portal_notifications_${currentUser.id}` : 'mc_portal_notifications_guest', JSON.stringify(next));
    }
  };

  const addPortalNotification = ({
    title,
    message,
    type = 'system',
    targetUserId = 'all',
    targetRole = 'all',
    relatedUserId,
    relatedListingId,
    actionType,
  }: {
    title: string;
    message: string;
    type?: PortalNotification['type'];
    targetUserId?: string | 'all';
    targetRole?: PortalNotification['targetRole'];
    relatedUserId?: string;
    relatedListingId?: string;
    actionType?: 'view' | 'payment' | 'message';
  }) => {
    const notification: PortalNotification = {
      id: `portal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      message,
      type,
      targetUserId,
      targetRole,
      relatedUserId,
      relatedListingId,
      createdAt: new Date().toISOString(),
      read: false,
    };

    const sharedStorageKey = 'mc_portal_notifications_all';
    const userStorageKey = currentUser ? `mc_portal_notifications_${currentUser.id}` : 'mc_portal_notifications_guest';
    const shouldShowToCurrentUser = notificationMatchesRecipient(notification, currentUser);

    const readStoredNotifications = (storageKey: string) => {
      const storedValue = localStorage.getItem(storageKey);
      if (!storedValue) return [] as PortalNotification[];
      try {
        return JSON.parse(storedValue) as PortalNotification[];
      } catch {
        return [] as PortalNotification[];
      }
    };

    const mergeNotifications = (existing: PortalNotification[], incoming: PortalNotification[]) => {
      const merged = [...incoming, ...existing];
      const seen = new Set<string>();
      return merged.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      }).slice(0, 25);
    };

    const persistStored = (storageKey: string, next: PortalNotification[]) => {
      localStorage.setItem(storageKey, JSON.stringify(next));
    };

    setPortalNotifications(prev => {
      const next = shouldShowToCurrentUser ? [notification, ...prev].slice(0, 25) : prev;
      const sharedNext = mergeNotifications(readStoredNotifications(sharedStorageKey), shouldShowToCurrentUser ? next : prev);
      persistStored(sharedStorageKey, sharedNext);

      if (targetUserId && targetUserId !== 'all') {
        const targetKey = `mc_portal_notifications_${targetUserId}`;
        const targetNext = mergeNotifications(readStoredNotifications(targetKey), [notification, ...readStoredNotifications(targetKey)]);
        persistStored(targetKey, targetNext);
      } else {
        const currentNext = mergeNotifications(readStoredNotifications(userStorageKey), shouldShowToCurrentUser ? next : prev);
        persistStored(userStorageKey, currentNext);
      }
      return next;
    });

    const appNotification: AppNotification = {
      id: `app-${notification.id}`,
      title: notification.title,
      description: notification.message,
      message: notification.message,
      type: notification.type === 'success' ? 'success' : notification.type === 'verification' ? 'info' : 'warning',
      category: notification.type === 'verification' ? 'payments' : 'all',
      timestamp: notification.createdAt,
      read: false,
      actionType: actionType || (notification.type === 'verification' ? 'payment' : 'view'),
    };

    setAppNotifications(prev => {
      const next = shouldShowToCurrentUser ? [appNotification, ...prev].slice(0, 20) : prev;
      const sharedNext = mergeNotifications(readStoredNotifications('mc_app_notifications_all'), shouldShowToCurrentUser ? next as any : prev as any);
      localStorage.setItem('mc_app_notifications_all', JSON.stringify(sharedNext));
      if (targetUserId && targetUserId !== 'all') {
        const targetKey = `mc_app_notifications_${targetUserId}`;
        const targetNext = mergeNotifications(readStoredNotifications(targetKey), [appNotification, ...readStoredNotifications(targetKey)]);
        localStorage.setItem(targetKey, JSON.stringify(targetNext));
      } else {
        const currentNext = mergeNotifications(readStoredNotifications(userStorageKey.replace('mc_portal_notifications_', 'mc_app_notifications_')), shouldShowToCurrentUser ? next as any : prev as any);
        localStorage.setItem(userStorageKey.replace('mc_portal_notifications_', 'mc_app_notifications_'), JSON.stringify(currentNext));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('marketconnect:notifications-updated'));
      }
      return next;
    });
  };

  // exported for use in other components via ref or import to avoid "declared but its value is never read" lint warning
  const markPortalNotificationRead = (id: string) => {
    setPortalNotifications(prev => {
      const next = prev.map(notification => notification.id === id ? { ...notification, read: true } : notification);
      localStorage.setItem('mc_portal_notifications_all', JSON.stringify(next));
      localStorage.setItem(currentUser ? `mc_portal_notifications_${currentUser.id}` : 'mc_portal_notifications_guest', JSON.stringify(next));
      return next;
    });
  };

  const markAllPortalNotificationsRead = () => {
    setPortalNotifications(prev => {
      const next = prev.map(notification => ({ ...notification, read: true }));
      localStorage.setItem('mc_portal_notifications_all', JSON.stringify(next));
      localStorage.setItem(currentUser ? `mc_portal_notifications_${currentUser.id}` : 'mc_portal_notifications_guest', JSON.stringify(next));
      return next;
    });
  };

  const notifyVerifiedSellerListing = (listing: Listing, seller: UserType) => {
    const isQualifiedSeller = Boolean(
      seller.verified ||
      seller.verificationBadgeType === 'active_member' ||
      seller.verificationBadgeType === 'verified_seller' ||
      seller.verificationRequestStatus === 'approved'
    );

    if (!isQualifiedSeller) return;

    const listingLocation = normalizeListingLocation(listing.location);
    const listingText = seller.businessName || seller.name;

    addPortalNotification({
      title: 'New verified listing',
      message: `${listingText} just published “${listing.title}” in ${listingLocation || 'your area'}. Check it out in the marketplace.`,
      type: 'listing',
      targetUserId: 'all',
      targetRole: 'all',
      relatedUserId: seller.id,
      relatedListingId: listing.id,
    });

    // Defer user notifications to avoid blocking with location filtering and loops
    setTimeout(() => {
      const nearbyUsers = users.filter((user) => {
        if (user.id === seller.id) return false;
        return isNearbyLocationMatch(user.location, listing.location) || isNearbyLocationMatch(user.sellerLocation, listing.location);
      });

      nearbyUsers.forEach((user) => {
        addPortalNotification({
          title: 'Verified seller nearby',
          message: `${seller.businessName || seller.name} just added a new listing nearby in ${listingLocation}.`,
          type: 'listing',
          targetUserId: user.id,
          targetRole: 'all',
          relatedUserId: seller.id,
          relatedListingId: listing.id,
        });
      });
    }, 50);

    // Defer notification processing to next tick to avoid blocking UI
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        // Notification queue is already processed in setTimeout(0)
      });
    }
  };

  // Auth Functions
  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setAuthError('Email and password are required.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await apiLogin(loginForm.email, loginForm.password);
      setCurrentUser(response.user);
      syncNotificationsForCurrentUser(response.user);
      localStorage.setItem('mc_currentUser', JSON.stringify(response.user));
      setLoginForm({ email: '', password: '' });
      navigateTo(response.user.role === 'admin' ? 'admin' : 'discover');
      addNotification(`Welcome back, ${response.user.name.split(' ')[0]}!`, 'success');
    } catch (error: any) {
      setAuthError(error?.response?.data?.error || error?.message || 'Login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    if (pendingSignupUser) {
      if (!emailOtp.trim()) {
        setAuthError('Enter the verification code sent to your email address.');
        return;
      }

      setAuthLoading(true);
      setAuthError(null);

      try {
        const response = await verifyVerificationCode('email', emailOtp);
        const verifiedUser = response.user as UserType;
        setCurrentUser(verifiedUser);
        syncNotificationsForCurrentUser(verifiedUser);
        localStorage.setItem('mc_currentUser', JSON.stringify(verifiedUser));
        setPendingSignupUser(null);
        setEmailOtp('');
        localStorage.removeItem('mc_pending_signup');
        setAuthSuccess(null);
        navigateTo(verifiedUser.role === 'admin' ? 'admin' : 'discover');
        addNotification('Account verified successfully!', 'success');
      } catch (error: any) {
        setAuthError(error?.response?.data?.error || error?.message || 'Verification failed.');
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setAuthError('Name, email, and password are required.');
      return;
    }

    if (registerForm.password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setPasswordError(null);
    setAuthSuccess(null);

    try {
      if (registerForm.password.length < 6) {
        setPasswordError('Password must be at least 6 characters.');
        return;
      }
      if (registerForm.password !== registerForm.confirmPassword) {
        setPasswordError('Passwords do not match.');
        return;
      }
      const response = await signup(
        registerForm.name,
        registerForm.email,
        registerForm.password,
        // signup expects buyer | seller
        registerForm.role as 'buyer' | 'seller'
      );
      const successMessage = response.message || 'Verification codes have been sent to your email . Please check to complete verification.';
      setPendingSignupUser(response.user as UserType);
      setEmailOtp('');
      localStorage.setItem('mc_pending_signup', JSON.stringify(response.user));
      setAuthSuccess(successMessage);
      setRegisterForm({ name: '', email: '', password: '', confirmPassword: '', role: 'buyer' });
    } catch (error: any) {
      setAuthError(error?.response?.data?.error || error?.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendSignupOtp = async () => {
    if (!pendingSignupUser) return;

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const response = await sendVerificationOtp('email');
      setEmailOtp('');
      setAuthSuccess(response.message || 'A new verification code was sent to your email address.');
    } catch (error: any) {
      setAuthError(error?.response?.data?.error || error?.message || 'Unable to resend the verification code.');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    apiLogout();
    setCurrentUser(null);
    syncNotificationsForCurrentUser(null);
    navigateTo('discover');
    setShowChat(false);
    setActiveChat(null);
    localStorage.removeItem('mc_currentUser');
  };

  // Listing CRUD
  const resetListingForm = () => {
    setListingForm({ title: '', description: '', price: '', discountEnabled: false, discountPercentage: '0', category: CATEGORIES[0], location: LOCATIONS[0], images: [], condition: 'New' });
    setListingError(null);
    setListingSuccess(null);
    setListingValidationErrors({});
  };

  const handleNewListingPublish = async (values: ListingFormValues): Promise<boolean> => {
    if (!currentUser) {
      navigate(LOGIN_PATH);
      return false;
    }

    const trimmedTitle = values.title.trim();
    const trimmedDescription = values.description.trim();
    const priceNum = Number(values.price);
    const discountPercentage = Number(values.discountPercentage || 0);
    const discountEnabled = Boolean(values.discountEnabled) && Number.isFinite(priceNum) && priceNum > 0 && discountPercentage > 0 && discountPercentage <= 90;
    const calculatedDiscountAmount = discountEnabled ? priceNum * discountPercentage / 100 : 0;
    const finalSellingPrice = discountEnabled ? Math.max(0, priceNum - calculatedDiscountAmount) : priceNum;

    if (!trimmedTitle) {
      addNotification('Please add a title for your listing.', 'warning');
      return false;
    }

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      addNotification('Please enter a valid price greater than zero.', 'warning');
      return false;
    }

    if (values.discountEnabled && (!Number.isFinite(discountPercentage) || discountPercentage <= 0 || discountPercentage > 90)) {
      addNotification('Discount percentage must be greater than 0% and no more than 90%.', 'warning');
      return false;
    }

    if (!trimmedDescription) {
      addNotification('Please add a short description for your listing.', 'warning');
      return false;
    }

    if (!values.category.trim()) {
      addNotification('Please choose a category for your listing.', 'warning');
      return false;
    }

    if (!values.location.trim()) {
      addNotification('Please choose a location for your listing.', 'warning');
      return false;
    }

    if (!values.images.length) {
      addNotification('Please add at least one image to publish your listing.', 'warning');
      return false;
    }

    const finalListing: Listing = {
      id: editingListing?.id || `local-${Date.now()}`,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      title: trimmedTitle,
      description: trimmedDescription,
      price: finalSellingPrice,
      originalPrice: priceNum,
      discountEnabled,
      discountPercentage: discountEnabled ? discountPercentage : 0,
      discountAmount: calculatedDiscountAmount,
      finalPrice: finalSellingPrice,
      category: values.category,
      location: values.location,
      images: values.images.length > 0 ? values.images : ['https://picsum.photos/id/160/600/400'],
      createdAt: editingListing?.createdAt || new Date().toISOString(),
      rating: editingListing?.rating || 0,
      reviewCount: editingListing?.reviewCount || 0,
      distance: editingListing?.distance || 0,
      condition: values.condition,
    };

    try {
      const token = localStorage.getItem('marketplace_access_token');
      if (token) {
        if (editingListing) {
          const updatedListing = await updateListingApi(editingListing.id, {
            sellerId: currentUser.id,
            sellerName: currentUser.name,
            title: trimmedTitle,
            description: trimmedDescription,
            price: finalSellingPrice,
            originalPrice: priceNum,
            discountEnabled,
            discountPercentage: discountEnabled ? discountPercentage : 0,
            category: values.category,
            location: values.location,
            images: finalListing.images,
          });
          setListings(prev => prev.map(listing => listing.id === editingListing.id ? updatedListing : listing));
          addNotification('Listing updated successfully!', 'success');
          setEditingListing(null);
          navigate(`/listing/${updatedListing.id}`);
          return true;
        }

        const createdListing = await createListing(
          currentUser.id,
          currentUser.name,
          trimmedTitle,
          trimmedDescription,
          finalSellingPrice,
          values.category,
          values.location,
          finalListing.images,
          { originalPrice: priceNum, discountEnabled, discountPercentage: discountEnabled ? discountPercentage : 0, discountAmount: calculatedDiscountAmount, finalPrice: finalSellingPrice }
        );
        const created = createdListing && createdListing.id ? createdListing : finalListing;
        setListings(prev => [created, ...prev]);
        addNotification(editingListing ? 'Listing updated successfully!' : 'Listing published successfully!', 'success');
        
        // Defer non-critical operations to avoid blocking navigation
        setTimeout(() => {
          notifyVerifiedSellerListing(created, currentUser);
        }, 100);
        
        setEditingListing(null);
        navigate(`/listing/${created.id}`);
        return true;
      }

      setListings(prev => editingListing
        ? prev.map(listing => listing.id === editingListing.id ? finalListing : listing)
        : [finalListing, ...prev]);
      addNotification(editingListing ? 'Listing updated locally.' : 'Listing saved locally because backend auth was unavailable.', 'warning');
      
      // Defer non-critical operations to avoid blocking navigation
      setTimeout(() => {
        notifyVerifiedSellerListing(finalListing, currentUser);
      }, 100);
      
      setEditingListing(null);
      navigate(`/listing/${finalListing.id}`);
      return true;
    } catch (error: any) {
      console.error('Listing publish failed:', error?.response?.data || error?.message || error);
      
      // Re-throw the error so the form component can handle it
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to publish listing. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const openEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setListingForm({
      title: listing.title,
      description: listing.description,
      price: listing.originalPrice ? String(listing.originalPrice) : listing.price.toString(),
      discountEnabled: Boolean(listing.discountEnabled),
      discountPercentage: listing.discountPercentage ? String(listing.discountPercentage) : '0',
      category: listing.category,
      location: typeof listing.location === 'string' ? listing.location : normalizeListingLocation(listing.location),
      images: [...listing.images],
      condition: listing.condition || 'New',
    });
    setListingError(null);
    setListingSuccess(null);
    setListingValidationErrors({});
    navigate('/new-listing');
  };

  const handleFilesUpload = (files: FileList | null) => {
    const fileArray = Array.from(files || []).slice(0, 5 - listingForm.images.length);
    if (!fileArray.length) return;

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setListingForm(prev => ({
          ...prev,
          images: [...prev.images, event.target?.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesUpload(e.target.files);
  };

  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFilesUpload(event.dataTransfer.files);
  };

  const handleImageRemove = (index: number) => {
    setListingForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleListingTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event?.currentTarget?.value ?? (event?.target as HTMLInputElement)?.value ?? '';
    setListingForm(prev => ({ ...prev, title: value }));
    setListingValidationErrors(prev => ({ ...prev, title: undefined }));
  };

  const handleListingDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event?.currentTarget?.value ?? (event?.target as HTMLTextAreaElement)?.value ?? '';
    setListingForm(prev => ({ ...prev, description: value }));
    setListingValidationErrors(prev => ({ ...prev, description: undefined }));
  };

  const handleListingSelectChange = (field: 'price' | 'category' | 'location', value: string) => {
    setListingForm(prev => ({ ...prev, [field]: value ?? '' }));
    setListingValidationErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleConditionChange = (condition: ListingFormValues['condition']) => {
    setListingForm(prev => ({ ...prev, condition }));
    setListingValidationErrors(prev => ({ ...prev, condition: undefined }));
  };

  const saveListing = async () => {
    if (!currentUser) {
      navigate(LOGIN_PATH);
      return;
    }

    setListingSubmitting(true);
    setListingError(null);
    setListingSuccess(null);

    const trimmedTitle = listingForm.title.trim();
    const trimmedDescription = listingForm.description.trim();
    const validationErrors: ListingValidationErrors = {};

    if (!trimmedTitle) {
      validationErrors.title = 'Please add a clear title for your listing.';
    }

    const priceNum = parseFloat(listingForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      validationErrors.price = 'Enter a valid price greater than zero.';
    }

    if (!listingForm.category.trim()) {
      validationErrors.category = 'Select a category for your listing.';
    }

    if (!listingForm.location.trim()) {
      validationErrors.location = 'Select a location for your listing.';
    }

    if (!listingForm.condition.trim()) {
      validationErrors.condition = 'Select the condition of your item.';
    }

    if (!trimmedDescription) {
      validationErrors.description = 'Write a brief description so buyers know what you are selling.';
    }

    if (!listingForm.images.length) {
      validationErrors.images = 'Add at least one image to highlight your listing.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setListingValidationErrors(validationErrors);
      setListingError('Please fix the highlighted fields below.');
      setListingSubmitting(false);
      return;
    }

    setListingValidationErrors({});

    const finalListing: Listing = {
      id: editingListing?.id || `local-${Date.now()}`,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      title: trimmedTitle,
      description: trimmedDescription,
      price: priceNum,
      category: listingForm.category,
      location: listingForm.location,
      images: listingForm.images.length > 0 ? listingForm.images : ['https://picsum.photos/id/160/600/400'],
      createdAt: editingListing?.createdAt || new Date().toISOString(),
      rating: editingListing?.rating || 0,
      reviewCount: editingListing?.reviewCount || 0,
      distance: editingListing?.distance || 0,
    };

    try {
      if (editingListing) {
        setListings(prev => prev.map(l => l.id === editingListing.id ? finalListing : l));
        addNotification('Listing updated!', 'success');
        setListingSuccess('Listing updated successfully.');
        setEditingListing(null);
        resetListingForm();
        navigate('/');
        return;
      }

      const token = localStorage.getItem('marketplace_access_token');
      if (token) {
        const createdListing = await createListing(
          currentUser.id,
          currentUser.name,
          trimmedTitle,
          trimmedDescription,
          priceNum,
          listingForm.category,
          listingForm.location,
          finalListing.images
        );
        const created = createdListing && createdListing.id ? createdListing : finalListing;
        setListings(prev => [created, ...prev]);
        notifyVerifiedSellerListing(created, currentUser);
        addNotification('Listing published successfully!', 'success');
        setListingSuccess('Listing published successfully.');
        setEditingListing(null);
        resetListingForm();
        navigate(`/listing/${created.id}`);
        return;
      }

      setListings(prev => [finalListing, ...prev]);
      notifyVerifiedSellerListing(finalListing, currentUser);
      addNotification('Listing saved locally because backend auth was unavailable.', 'warning');
      setListingSuccess('Listing saved locally.');
      setEditingListing(null);
      resetListingForm();
      navigate(`/listing/${finalListing.id}`);
    } catch (error: any) {
      console.error('Listing publish failed:', error?.response?.data || error?.message || error);
      setListings(prev => [finalListing, ...prev]);
      notifyVerifiedSellerListing(finalListing, currentUser);
      addNotification(error?.response?.data?.error || error?.message || 'Listing saved locally after a publish error.', 'warning');
      setListingError(error?.response?.data?.error || error?.message || 'We could not publish your listing. Please try again.');
      setEditingListing(null);
      resetListingForm();
      navigate(`/listing/${finalListing.id}`);
    } finally {
      setListingSubmitting(false);
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing permanently?')) return;

    try {
      await deleteListingApi(id);
      setListings(prev => prev.filter(l => l.id !== id));
      addNotification('Listing removed', 'success');
    } catch (error: any) {
      console.error('Listing delete failed:', error);
      addNotification(error?.response?.data?.error || 'Unable to delete listing right now.', 'error');
    }
  };

  // Contact Seller -> Open Chat
  const contactSeller = (listing: Listing) => {
    if (!currentUser) {
      showAuthPrompt('Message Seller', 'Create a free account to contact this seller and discuss about their products or services.');
      return;
    }
    if (listing.sellerId === currentUser.id) {
      addNotification('You cannot message yourself from your own listing.', 'warning');
      return;
    }

    const conv: ChatConversation = {
      otherUserId: listing.sellerId,
      otherUserName: listing.sellerName,
      listingId: listing.id,
      listingTitle: listing.title
    };
    
    loadChat(conv);
  };

  // Place Order
  const placeOrder = (listing: Listing) => {
    if (!currentUser) {
      showAuthPrompt('Place an Order', 'Create a free account to purchase this item or service.');
      return;
    }
    setOrderRequestSent(null);
    setShowOrderModal(listing);
    setOrderNotes('');
    setOrderQuantity(1);
    setOrderColor('Black');
  };

  const confirmOrder = async () => {
    if (!showOrderModal || !currentUser) return;

    const token = localStorage.getItem('marketplace_access_token');
    if (!token) {
      navigate(LOGIN_PATH);
      addNotification('Please sign in again to place an order.', 'error');
      return;
    }

    try {
      const profile = await getCurrentUser();
      setCurrentUser(profile);
      localStorage.setItem('mc_currentUser', JSON.stringify(profile));

      const quantity = Math.max(1, orderQuantity);
      const salePrice = showOrderModal.finalPrice ?? showOrderModal.price;
      const totalAmount = salePrice * quantity;
      const createdOrder = await createOrder(
        showOrderModal.id,
        profile.id,
        profile.name,
        showOrderModal.sellerId,
        showOrderModal.sellerName,
        totalAmount,
        showOrderModal.title,
        quantity,
        orderColor
      );

      setOrders(prev => [{ ...createdOrder, price: totalAmount, quantity, color: orderColor, originalPrice: showOrderModal.originalPrice, discountPercentage: showOrderModal.discountPercentage, discountAmount: showOrderModal.discountAmount, finalPrice: salePrice }, ...prev]);
      setShowOrderModal(null);
      setOrderRequestSent(showOrderModal);
      addNotification('Order request sent! Seller will respond shortly.', 'success');
    } catch (error: any) {
      console.error('Order placement failed:', error);
      const backendMessage = error?.response?.data?.error || error?.message || 'Unable to place order.';
      addNotification(backendMessage, 'error');
    }
  };

  const ListingDetailRoute = () => {
    const { id } = useParams();
    const listing = listings.find(item => item.id === id);

    if (!listing) {
      return (
        <div className="pt-28 max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold">Listing not found</h2>
          <p className="mt-4 text-slate-500">The item you are looking for may have been removed.</p>
          <button onClick={() => navigate('/')} className="mt-8 px-6 py-3 rounded-3xl bg-slate-900 text-white">Back to Marketplace</button>
        </div>
      );
    }

    const seller = users.find(user => user.id === listing.sellerId);

    return (
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:px-6">
        <button onClick={() => navigate(-1)} className="mb-8 text-sm text-slate-500 hover:text-slate-900">← Back</button>
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200">
          <div className="relative h-72 bg-slate-100 overflow-hidden">
            <img src={listing.images[0]} alt={listing.title} width="600" height="400" decoding="async" className="h-full w-full object-cover" />
          </div>
          <div className="grid gap-8 p-4 sm:p-8 lg:grid-cols-[1.3fr_0.7fr] lg:gap-10">
            <div>
              <div className="text-4xl font-semibold tracking-tight">{listing.title}</div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                <span>{listing.category}</span>
                <span>{normalizeListingLocation(listing.location)}</span>
              </div>
              <p className="mt-6 text-slate-600 leading-relaxed">{listing.description}</p>
              {seller && (
                <div className="mt-10 rounded-3xl bg-slate-50 p-6 border border-slate-200">
                  <div className="flex items-center gap-4">
                    <img src={seller.avatar} alt={seller.name} width="64" height="64" loading="lazy" decoding="async" className="h-16 w-16 rounded-2xl object-cover" />
                    <div>
                      <div className="text-lg font-semibold">{seller.businessName || seller.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getVerificationStatus(seller).pillClass}`}>
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/70 text-[10px] font-bold leading-none shadow-sm" aria-hidden="true">✓</span>
                          {getVerificationStatus(seller).label}
                        </div>
                        <div className="text-sm text-slate-500">{normalizeListingLocation(seller.sellerLocation || seller.location)}</div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/seller/${seller.id}`)} className="mt-5 px-5 py-3 rounded-3xl bg-slate-900 text-white text-sm font-medium">View seller profile</button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 p-6">
                {listing.discountEnabled && listing.discountPercentage && Number(listing.discountPercentage) > 0 && (
                  <div className="mb-3 inline-flex items-center justify-center px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded">
                    -{Math.round(Number(listing.discountPercentage))}% OFF
                  </div>
                )}
                <div className="text-sm uppercase tracking-[0.24em] text-slate-400 mb-4">Price</div>
                <div className="text-4xl font-semibold text-slate-900 sm:text-5xl">₦{(listing.finalPrice ?? listing.price).toLocaleString()}</div>
                {listing.discountEnabled && listing.originalPrice && (
                  <div>
                    <div className="text-sm text-slate-500 line-through mt-2">₦{listing.originalPrice.toLocaleString()}</div>
                    <div className="text-sm text-emerald-600 font-medium mt-2">Save ₦{(listing.discountAmount ?? 0).toLocaleString()}</div>
                  </div>
                )}
              </div>
              <div className="grid gap-3">
                <button onClick={() => placeOrder(listing)} className="w-full py-4 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Buy Now</button>
                <button onClick={() => contactSeller(listing)} className="w-full py-4 rounded-3xl border border-slate-300 text-slate-700 text-sm font-semibold">Message Seller</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!sellerProfileRouteRef.current) {
    sellerProfileRouteRef.current = () => {
    const routeData = sellerRouteDataRef.current as {
      users: UserType[];
      listings: Listing[];
      sellerStatsCache: Record<string, { activeListings: number; averageRating: number; totalReviews: number; salesDone: number }>;
      setSellerStatsCache: React.Dispatch<React.SetStateAction<Record<string, { activeListings: number; averageRating: number; totalReviews: number; salesDone: number }>>>;
      currentUser: UserType | null;
      contactSeller: (listing: Listing) => void;
      setReportForm: React.Dispatch<React.SetStateAction<any>>;
      setShowReportModal: React.Dispatch<React.SetStateAction<boolean>>;
      getVerificationStatus: (user?: Partial<UserType> | null) => { pillClass: string; label: string };
      normalizeListingLocation: (location: any) => string;
      LOGIN_PATH: string;
    };
    const { users, listings, sellerStatsCache, setSellerStatsCache, currentUser, contactSeller, setReportForm, setShowReportModal, getVerificationStatus, normalizeListingLocation, LOGIN_PATH } = routeData;
    const { id } = useParams();
    const seller = users.find(user => user.id === id && user.role === 'seller');
    const defaultSellerStats = { activeListings: 0, averageRating: 0, totalReviews: 0, salesDone: 0 };
    const [sellerStats, setSellerStats] = useState(() => (id && sellerStatsCache[id]) || defaultSellerStats);

    useEffect(() => {
      if (!seller) return;
      getSellerStats(seller.id)
        .then((nextStats) => {
          const normalizedStats = {
            activeListings: Number(nextStats.activeListings ?? 0),
            averageRating: Number(nextStats.averageRating ?? nextStats.avgRating ?? 0),
            totalReviews: Number(nextStats.totalReviews ?? 0),
            salesDone: Number(nextStats.salesDone ?? nextStats.sales ?? 0),
          };
          setSellerStats(normalizedStats);
          setSellerStatsCache(prev => {
            const next = { ...prev, [seller.id]: normalizedStats };
            localStorage.setItem('mc_seller_stats', JSON.stringify(next));
            return next;
          });
        })
        .catch(() => undefined);
    }, [seller?.id]);

    if (!seller) {
      return (
        <div className="pt-28 max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold">Seller not found</h2>
          <p className="mt-4 text-slate-500">This seller profile may no longer be available.</p>
          <button onClick={() => navigate('/')} className="mt-8 px-6 py-3 rounded-3xl bg-slate-900 text-white">Back to Marketplace</button>
        </div>
      );
    }

    const sellerListings = listings.filter(listing => listing.sellerId === seller.id);
    const sellerLocation = normalizeListingLocation(seller.sellerLocation || seller.location || '');
    const sellerContactEmail = seller.email || '';

    return (
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6">
        <button onClick={() => navigate(-1)} className="mb-8 text-sm text-slate-500 hover:text-slate-900">← Back</button>
        <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <img src={seller.avatar} alt={seller.name} width="96" height="96" decoding="async" className="h-24 w-24 rounded-3xl object-cover" />
              <div>
                <div className="text-4xl font-semibold">{seller.businessName || seller.name}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getVerificationStatus(seller).pillClass}`}>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/70 text-[10px] font-bold leading-none shadow-sm" aria-hidden="true">✓</span>
                    {getVerificationStatus(seller).label}
                  </div>
                </div>
                <div className="text-slate-500 mt-2">{seller.description || 'Trusted seller on MarketConnect'}</div>
                <div className="mt-3 text-sm text-slate-500">Location: {sellerLocation || 'Location not provided'}</div>
                {(seller.phone || sellerContactEmail) && (
                  <div className="mt-2 text-sm text-slate-600">
                    {seller.phone && <div>Phone: {seller.phone}</div>}
                    {sellerContactEmail && <div className="mt-1">Email: {sellerContactEmail}</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button onClick={() => {
                if (!currentUser) {
                  showAuthPrompt('Report Seller', 'Create a free account to report a seller if there is an issue.');
                  return;
                }
                setReportForm({
                  reportedUserId: seller.id,
                  reportedUserName: seller.name,
                  reportedRole: seller.role,
                  type: 'report',
                  subject: '',
                  details: '',
                });
                setShowReportModal(true);
              }} className="w-full sm:w-auto px-6 py-3 rounded-3xl bg-amber-600 text-white text-sm font-semibold">Report this seller</button>
              <button onClick={() => {
                if (!currentUser) {
                  showAuthPrompt('Message Seller', 'Create a free account to contact this seller and discuss about their products or services.');
                  return;
                }
                if (sellerListings[0]) {
                  contactSeller(sellerListings[0]);
                }
              }} className="w-full sm:w-auto px-6 py-3 rounded-3xl bg-emerald-600 text-white text-sm font-semibold">Message seller</button>
              <button onClick={() => navigate(`/listing/${sellerListings[0]?.id}`)} className="w-full sm:w-auto px-6 py-3 rounded-3xl border border-slate-300 text-slate-700 text-sm font-semibold">View first listing</button>
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Active listings</div>
            <div className="mt-3 text-4xl font-semibold text-slate-900">{sellerStats.activeListings}</div>
            <div className="mt-1 text-sm text-slate-500">Currently available</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Average rating</div>
            <div className="mt-3 text-4xl font-semibold text-slate-900">{sellerStats.averageRating ? sellerStats.averageRating.toFixed(1) : '—'}<span className="ml-1 text-lg text-slate-400">/5</span></div>
            <div className="mt-1 text-sm text-slate-500">Buyer satisfaction</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total reviews</div>
            <div className="mt-3 text-4xl font-semibold text-slate-900">{sellerStats.totalReviews}</div>
            <div className="mt-1 text-sm text-slate-500">Verified buyer feedback</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sales done</div>
            <div className="mt-3 text-4xl font-semibold text-slate-900">{sellerStats.salesDone}</div>
            <div className="mt-1 text-sm text-slate-500">Confirmed orders</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {sellerListings.map(listing => (
            <div key={listing.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
              <div className="h-40 overflow-hidden rounded-3xl mb-5">
                <img src={listing.images[0]} alt={listing.title} width="600" height="400" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>
              <div className="text-lg font-semibold mb-2">{listing.title}</div>
              <div className="text-sm text-slate-500 mb-4">{normalizeListingLocation(listing.location)}</div>
              <div className="text-2xl font-semibold mb-5">₦{listing.price.toLocaleString()}</div>
              <button onClick={() => navigate(`/listing/${listing.id}`)} className="w-full py-3 rounded-3xl bg-slate-900 text-white text-sm font-semibold">View listing</button>
            </div>
          ))}
        </div>
      </div>
    );
    };
  }
  const SellerProfileRoute = sellerProfileRouteRef.current;

  // Seller: Accept / Reject Order
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !currentUser) return;

    try {
      let updatedOrder: Order | null = null;

      if (status === 'accepted') {
        updatedOrder = await acceptOrder(orderId, currentUser.id);
      } else if (status === 'shipped') {
        updatedOrder = await shipOrder(orderId, currentUser.id, order.deliveryDetails?.trackingNumber);
      } else if (status === 'delivered') {
        updatedOrder = await markOrderDelivered(orderId, currentUser.id);
      } else if (status === 'confirmed') {
        const result = await confirmDelivery(orderId, currentUser.id);
        updatedOrder = result.order;
      }

      if (updatedOrder) {
        setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder! : o)));
        const msg = status === 'accepted'
          ? 'Order accepted! Buyer notified.'
          : status === 'shipped'
          ? 'Order marked as shipped.'
          : status === 'confirmed'
          ? 'Delivery confirmed. Payment released.'
          : 'Order updated.';

        if (status === 'confirmed') {
          addPortalNotification({
            title: 'Payment released',
            message: `The sale for “${order.listingTitle}” is complete. Funds were released to ${order.sellerName}'s wallet after your confirmation.`,
            type: 'success',
            targetUserId: order.buyerId,
            targetRole: 'buyer',
            relatedUserId: order.sellerId,
            relatedListingId: order.listingId,
          });
          addPortalNotification({
            title: 'Funds released to your wallet',
            message: `Your wallet has been credited for “${order.listingTitle}” after the buyer confirmed delivery.`,
            type: 'success',
            targetUserId: order.sellerId,
            targetRole: 'seller',
            relatedUserId: order.buyerId,
            relatedListingId: order.listingId,
          });
        }

        addNotification(msg, 'success');

        if (status === 'accepted') {
          const chatId = [order.sellerId, order.buyerId].sort().join('-') + `-${order.listingId}`;
          const autoMsg: Message = {
            id: 'm' + Date.now(),
            chatId,
            senderId: order.sellerId,
            senderName: order.sellerName,
            content: `Great! Your order for "${order.listingTitle}" has been accepted. Let's arrange a time to meet or ship.`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, autoMsg]);
        }
      }
    } catch (error: any) {
      console.error(error);
      addNotification('Unable to update order status. Please try again.', 'error');
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  const openConfirmModal = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const getDepositCurrency = () => 'NGN';

  const applyLocalDeposit = (amount: number, provider: 'paystack' | 'flutterwave') => {
    if (!currentUser) return;

    const nextBalance = (walletBalance || 0) + amount;
    const reference = `LOCAL_${Date.now()}`;
    const localTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'deposit',
      userId: currentUser.id,
      amount,
      status: 'completed',
      currency: 'NGN',
      paymentGateway: provider,
      reference,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      details: `Local ${provider === 'paystack' ? 'Paystack' : 'Flutterwave'} deposit`,
    };

    setWalletBalance(nextBalance);
    setCurrentUser(prev => prev ? { ...prev, walletBalance: nextBalance } : prev);
    setTransactions(prev => [localTransaction, ...prev]);
      addPortalNotification({
        title: 'Wallet deposit successful',
        message: `Your wallet was credited with ₦${amount.toFixed(2)} via ${provider === 'paystack' ? 'Paystack' : 'Flutterwave'}.`,
        type: 'success',
        targetUserId: currentUser.id,
        targetRole: 'all',
        relatedUserId: currentUser.id,
        actionType: 'payment',
      });
  };

  const handleDepositPayment = async () => {
    if (!currentUser) { navigate(LOGIN_PATH); return; }
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError('Enter a valid deposit amount.');
      setDepositStatusMessage(null);
      return;
    }

    setDepositError(null);
    setDepositStatusMessage(null);
    setDepositLoading(true);

    try {
      const callbackUrl = `${window.location.origin}/payment/callback?provider=${depositMethod}`;
      const data = await postWalletDeposit(amount, depositMethod, callbackUrl);
      const redirectUrl = data.authorization_url || data.link || data.paymentUrl;
      console.debug('[wallet deposit] init response', { data, redirectUrl });
      if (redirectUrl) {
        const normalizedRedirectUrl = (() => {
          const value = String(redirectUrl).trim();
          if (!value) return value;
          if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) || value.startsWith('//')) {
            return value;
          }
          const origin = window.location.origin && window.location.origin !== 'null'
            ? window.location.origin
            : `${window.location.protocol}//${window.location.host}`;
          return value.startsWith('/') ? `${origin}${value}` : `${origin}/${value.replace(/^\/+/, '')}`;
        })();
        console.debug('[wallet deposit] redirecting to', normalizedRedirectUrl);
        window.location.href = normalizedRedirectUrl;
        return;
      }

      const nextBalance = typeof data.balance === 'number' ? data.balance : (walletBalance || 0) + amount;
      const reference = data.reference || data.txRef || `LOCAL_${Date.now()}`;
      const transaction: Transaction = {
        id: data.id || `tx-${Date.now()}`,
        type: 'deposit',
        userId: currentUser.id,
        amount,
        status: 'completed',
        currency: 'NGN',
        paymentGateway: depositMethod,
        reference,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        details: data.message || 'Deposit completed successfully',
      };

      setWalletBalance(nextBalance);
      setCurrentUser(prev => prev ? { ...prev, walletBalance: nextBalance } : prev);
      setTransactions(prev => [transaction, ...prev]);
      addPortalNotification({
        title: 'Wallet deposit successful',
        message: `Your wallet was credited with ₦${amount.toFixed(2)} via ${depositMethod === 'paystack' ? 'Paystack' : 'Flutterwave'}.`,
        type: 'success',
        targetUserId: currentUser.id,
        targetRole: 'all',
        relatedUserId: currentUser.id,
        actionType: 'payment',
      });
      setDepositAmount('');
      setDepositSuccess({ provider: depositMethod, reference, amount });
      setDepositStatusMessage(data.message || 'Deposit completed successfully.');
    } catch (error: any) {
      console.error(error);
      const fallbackReason = error?.response?.data?.error || error?.message || 'Unable to start payment.';
      if (fallbackReason.includes('secret') || fallbackReason.includes('key') || fallbackReason.includes('Unsupported')) {
        setDepositError('Real gateway credentials are not configured yet. Set the backend payment keys to enable live deposits.');
      } else if (!localStorage.getItem('marketplace_access_token') || error?.response?.status === 401 || error?.response?.status === 403) {
        applyLocalDeposit(amount, depositMethod);
        return;
      } else {
        setDepositError(fallbackReason);
      }
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!currentUser) { navigate(LOGIN_PATH); return; }
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Enter a valid withdrawal amount.');
      setWithdrawSuccess(null);
      return;
    }
    if (!withdrawBank.trim() || !withdrawAccountName.trim() || !withdrawAccountNumber.trim()) {
      setWithdrawError('Please complete all withdrawal details.');
      setWithdrawSuccess(null);
      return;
    }
    if (!/^[0-9]{10}$/.test(withdrawAccountNumber)) {
      setWithdrawError('Account number must be a 10-digit NUBAN.');
      setWithdrawSuccess(null);
      return;
    }
    if ((currentUser.walletBalance || 0) < amount) {
      setWithdrawError('Insufficient wallet balance.');
      setWithdrawSuccess(null);
      return;
    }

    setWithdrawError(null);
    setWithdrawSuccess(null);

    try {
      const response = await postWalletWithdraw(amount, withdrawBank, withdrawAccountName, withdrawAccountNumber);
      const balance = typeof response?.balance === 'number' ? response.balance : walletBalance - amount;
      setWalletBalance(balance);
      setCurrentUser(prev => prev ? { ...prev, walletBalance: balance } : prev);
      const walletTransactions = await getTransactionHistory(currentUser.id);
      setTransactions(walletTransactions);
      addPortalNotification({
        title: 'Wallet withdrawal initiated',
        message: `₦${amount.toFixed(2)} is being sent to ${withdrawBank}. You will receive a confirmation once the transfer is processed.`,
        type: 'warning',
        targetUserId: currentUser.id,
        targetRole: 'all',
        relatedUserId: currentUser.id,
        actionType: 'payment',
      });

      setWithdrawAmount('');
      setWithdrawBank('');
      setWithdrawAccountName('');
      setWithdrawAccountNumber('');
      setWithdrawSuccess(`₦${amount.toFixed(2)} is being sent to ${withdrawBank}.`);
    } catch (error: any) {
      console.error(error);
      const fallbackReason = error?.response?.data?.error || error?.message || 'Unable to initiate withdrawal.';
      if (fallbackReason.includes('secret') || fallbackReason.includes('key') || fallbackReason.includes('Unsupported')) {
        setWithdrawError('Real transfer credentials are not configured yet. Set the backend payment keys to enable live withdrawals.');
      } else if (!localStorage.getItem('marketplace_access_token') || error?.response?.status === 401 || error?.response?.status === 403) {
        const nextBalance = (walletBalance || 0) - amount;
        const localTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'withdrawal',
          userId: currentUser.id,
          amount,
          status: 'completed',
          currency: 'NGN',
          reference: `WITHDRAW_${Date.now()}`,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          details: `Local withdrawal to ${withdrawBank}`,
        };

        setWalletBalance(nextBalance);
        setCurrentUser(prev => prev ? { ...prev, walletBalance: nextBalance } : prev);
        setTransactions(prev => [localTransaction, ...prev]);
        addPortalNotification({
          title: 'Wallet withdrawal completed',
          message: `₦${amount.toFixed(2)} was sent to ${withdrawBank}.`,
          type: 'success',
          targetUserId: currentUser.id,
          targetRole: 'all',
          relatedUserId: currentUser.id,
          actionType: 'payment',
        });
        setWithdrawAmount('');
        setWithdrawBank('');
        setWithdrawAccountName('');
        setWithdrawAccountNumber('');
        setWithdrawSuccess(`₦${amount.toFixed(2)} was sent to ${withdrawBank}.`);
        return;
      } else {
        setWithdrawError(fallbackReason);
      }
    }
  };

  const PaymentCallback = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying payment...');
    const [depositReference, setDepositReference] = useState<string | null>(null);

    useEffect(() => {
      const verify = async () => {
        if (!currentUser) {
          if (!localStorage.getItem('marketplace_access_token')) {
            setStatus('error');
            setMessage('You must be signed in to complete the payment.');
            return;
          }
          return;
        }

        const params = new URLSearchParams(location.search);
        const provider = (params.get('provider') || '') as 'paystack' | 'flutterwave';
        const reference = provider === 'paystack'
          ? params.get('reference') || params.get('trxref')
          : params.get('tx_ref');
        const verificationType = params.get('type') || params.get('purpose') || '';
        setDepositReference(reference);

        if (!provider || !reference) {
          setStatus('error');
          setMessage('Invalid payment callback parameters.');
          return;
        }

        try {
          if (verificationType === 'membership_verification') {
            const payment = await verifyMembershipVerificationPayment(currentUser.id, provider, reference);
            const updatedUser = payment.user as UserType;
            setCurrentUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            setStatus('success');
            setMessage('Verification payment completed. Your account was approved automatically.');
            return;
          }

          const response = await verifyWalletDeposit(provider, reference);
          if (response.verified) {
            const updatedUser = await getCurrentUser();
            const balance = await getWalletBalance();
            const nextBalance = typeof response.balance === 'number'
              ? response.balance
              : typeof balance === 'number'
                ? balance
                : typeof updatedUser?.walletBalance === 'number'
                  ? updatedUser.walletBalance
                  : (walletBalance || 0) + (response.transaction?.amount || 0);

            const nextUser = updatedUser ? { ...updatedUser, walletBalance: nextBalance } : updatedUser;
            setWalletBalance(nextBalance);
            setCurrentUser(nextUser);
            setUsers(prev => prev.map(u => (updatedUser && u.id === updatedUser.id ? nextUser : u)));
            const walletTransactions = await getTransactionHistory(currentUser.id);
            setTransactions(walletTransactions);
            addPortalNotification({
              title: 'Wallet deposit confirmed',
              message: `Your wallet was topped up with ₦${(response.transaction?.amount || 0).toFixed(2)} and is ready to use.`,
              type: 'success',
              targetUserId: currentUser.id,
              targetRole: 'all',
              relatedUserId: currentUser.id,
              actionType: 'payment',
            });
            setDepositSuccess({
              provider,
              reference,
              amount: response.transaction?.amount || 0,
            });
            setStatus('success');
            setMessage('Payment confirmed! Your wallet has been updated.');
          } else {
            setStatus('error');
            setMessage(response.error || 'Payment verification failed.');
          }
        } catch (error: any) {
          console.error(error);
          setStatus('error');
          setMessage(error?.response?.data?.error || error?.message || 'Payment verification failed.');
        }
      };

      verify();
    }, [currentUser, location.search]);

    useEffect(() => {
      if (status === 'success') {
        const redirectTimer = window.setTimeout(() => navigate('/wallet'), 2800);
        return () => window.clearTimeout(redirectTimer);
      }
    }, [status, navigate]);

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold">Payment Verification</h2>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
          </div>
          {status === 'loading' && (
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-2/3 animate-pulse bg-slate-300"></div>
            </div>
          )}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
                <p>Your wallet deposit was successful.</p>
                <p className="mt-2 text-sm">Reference: {depositReference || 'N/A'}</p>
              </div>
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                onClick={() => navigate('/wallet')}
              >
                Return to Wallet
              </button>
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-2xl bg-rose-50 p-4 text-rose-800">
              <p>{message}</p>
              <button
                className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                onClick={() => navigate('/wallet')}
              >
                Back to Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const exportTransactionsCsv = () => {
    if (!currentUser) return;
    const rows = [['Date', 'Type', 'Amount', 'Status', 'Details']];
    filteredTransactions.forEach(tx => {
      rows.push([
        new Date(tx.createdAt).toLocaleString(),
        tx.type,
        tx.amount.toFixed(2),
        tx.status,
        tx.details || ''
      ]);
    });
    const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const csvDataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    const link = document.createElement('a');
    link.href = csvDataUrl;
    link.setAttribute('download', `transactions-${currentUser.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPaymentConfirm = (order: Order | null) => {
    if (!order || !currentUser) return;
    const buyerBalance = currentUser.walletBalance || 0;
    if (buyerBalance < order.price) {
      alert('Insufficient wallet funds. Please deposit before paying.');
      navigateTo('profile');
      return;
    }
    openConfirmModal(
      'Confirm Wallet Payment',
      `Pay ₦${order.price.toFixed(2)} from your wallet for ${order.listingTitle}?`,
      () => handlePayment(order)
    );
  };

  // Handle payment - wallet-only flow: transfer buyer -> seller and record transactions
  const handlePayment = async (order: Order | null) => {
    if (!order || !currentUser) return;

    try {
      const paymentResult = await payOrderWithWallet(order.id, currentUser.id);
      const refreshedUser = await getCurrentUser();
      setCurrentUser(refreshedUser);
      setUsers(prev => prev.map(u => (u.id === refreshedUser.id ? refreshedUser : u)));

      const walletTransactions = await getTransactionHistory(currentUser.id);
      setTransactions(walletTransactions);

      const orderRole = currentUser.role === 'seller' ? 'seller' : 'buyer';
      const refreshedOrders = await getUserOrders(currentUser.id, orderRole);
      setOrders(refreshedOrders);

      setShowPaymentModal(null);
      setFulfillmentOrder(paymentResult.order || order);
      addNotification('Payment completed — funds secured in escrow. Seller notified to ship. Confirm delivery to release funds.', 'success');

      // Notify seller and buyer about next steps: seller to ship, buyer to confirm delivery
      addPortalNotification({
        title: 'Payment received',
        message: `Payment was completed for "${order.listingTitle}". Please ship the item to the buyer.`,
        type: 'success',
        targetUserId: order.sellerId,
        targetRole: 'seller',
        relatedUserId: order.buyerId,
        relatedListingId: order.listingId,
        actionType: 'view',
      });

      addPortalNotification({
        title: 'Payment secured in escrow',
        message: `Payment for "${order.listingTitle}" is held in escrow. Confirm delivery when you receive the item to release funds to the seller.`,
        type: 'success',
        targetUserId: order.buyerId,
        targetRole: 'buyer',
        relatedUserId: order.sellerId,
        relatedListingId: order.listingId,
        actionType: 'payment',
      });
    } catch (error: any) {
      console.error(error);
      addNotification(error?.response?.data?.error || error?.message || 'Unable to complete payment.', 'error');
    }
  };

  const selectFulfillment = async (order: Order, method: 'meetup' | 'shipping') => {
    if (!currentUser) return;

    try {
      const updatedOrder = await selectOrderFulfillment(order.id, currentUser.id, method);
      setOrders(prev => prev.map(item => item.id === updatedOrder.id ? updatedOrder : item));
      setFulfillmentOrder(null);

      if (method === 'meetup') {
        const chatId = [currentUser.id, updatedOrder.sellerId].sort().join('-') + `-${updatedOrder.listingId}`;
        const content = `Hi ${updatedOrder.sellerName}, I selected pickup for "${updatedOrder.listingTitle}". Please send me the pickup time and location.`;
        const message: Message = {
          id: `m${Date.now()}`,
          chatId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          content,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, message]);

        const token = getAccessToken();
        if (token) {
          await fetch(`${import.meta.env.VITE_API_URL ? normalizeApiUrl(import.meta.env.VITE_API_URL) : ''}/api/chat/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              senderId: currentUser.id,
              senderName: currentUser.name,
              content,
              recipientId: updatedOrder.sellerId,
              listingId: updatedOrder.listingId,
            }),
          });
        }
        addNotification('Pickup selected. The seller has been messaged.', 'success');
      } else {
        const deliveryUrl = import.meta.env.VITE_DELIVERY_URL || 'https://example.com/delivery';
        const params = new URLSearchParams({ orderId: updatedOrder.id, listing: updatedOrder.listingTitle, amount: String(updatedOrder.price) });
        window.open(`${deliveryUrl}${deliveryUrl.includes('?') ? '&' : '?'}${params.toString()}`, '_blank', 'noopener,noreferrer');
        addNotification('Delivery selected. Continue on the delivery provider website.', 'success');
      }
    } catch (error: any) {
      addNotification(error?.response?.data?.error || error?.message || 'Unable to save fulfillment method.', 'error');
    }
  };

  const handleCancelPayment = async (order: Order | null) => {
    if (!order || !currentUser) return;

    try {
      const result = await cancelOrder(order.id, currentUser.id, 'Buyer cancelled payment');
      const refreshedUser = await getCurrentUser();
      setCurrentUser(refreshedUser);
      setUsers(prev => prev.map(u => (u.id === refreshedUser.id ? refreshedUser : u)));

      const walletTransactions = await getTransactionHistory(currentUser.id);
      setTransactions(walletTransactions);

      setOrders(prev => prev.map(o => (o.id === result.order.id ? result.order : o)));
      setShowPaymentModal(null);
      addNotification('Payment cancelled and order closed. Your wallet balance is refreshed.', 'success');
    } catch (error: any) {
      console.error(error);
      addNotification(error?.response?.data?.error || error?.message || 'Unable to cancel payment.', 'error');
    }
  };

  // Submit Review
  const handleRaiseDispute = async () => {
    if (!disputeOrder || !currentUser) return;

    try {
      const updatedOrder = await raiseDispute(disputeOrder.id, currentUser.id, disputeReason.trim() || 'Buyer reported an issue with delivery.');
      setOrders(prev => prev.map(order => (order.id === updatedOrder.id ? updatedOrder : order)));
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputeOrder(null);
      addNotification('Dispute raised. The admin will review it shortly.', 'success');
    } catch (error: any) {
      console.error(error);
      addNotification(error?.response?.data?.error || error?.message || 'Unable to raise a dispute.', 'error');
    }
  };

  const handleSubmitReport = async () => {
    if (!currentUser) return;

    const traceContact = reportForm.traceContact.trim();
    if (!traceContact || !reportForm.subject.trim() || !reportForm.details.trim()) {
      addNotification('Please provide an email or phone number and fill in the subject and details.', 'error');
      return;
    }

    const traceContactId = `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const reportDetails = `${reportForm.details.trim()}\n\nTrace contact: ${traceContact}`;

    try {
      const createdReport = await createReport({
        reportedUserId: traceContactId,
        reportedUserName: traceContact,
        reportedRole: reportForm.reportedRole,
        type: reportForm.type,
        subject: reportForm.subject.trim(),
        details: reportDetails,
      });

      setReports(prev => [createdReport, ...prev]);
      addPortalNotification({
        title: 'New complaint received',
        message: `${currentUser.name} submitted a ${reportForm.type === 'complaint' ? 'complaint' : 'report'} for ${reportForm.reportedUserName || 'a user'}.`,
        type: 'system',
        targetRole: 'admin',
        relatedUserId: currentUser.id,
      });
      setShowReportModal(false);
      setReportForm({
        reportedUserId: '',
        reportedUserName: '',
        reportedRole: 'buyer',
        traceContact: '',
        type: 'report',
        subject: '',
        details: '',
      });
      addNotification('Your report was sent to the admin.', 'success');
    } catch (error: any) {
      console.error(error);
      addNotification(error?.response?.data?.error || error?.message || 'Unable to submit report.', 'error');
    }
  };

  const submitReview = () => {
    if (!showReviewModal || !currentUser || !reviewForm.comment.trim()) return;
    if (showReviewModal.status !== 'confirmed') {
      addNotification('Reviews can only be submitted after the buyer confirms the order.', 'error');
      return;
    }

    const newReview: Review = {
      id: 'rev' + Date.now(),
      orderId: showReviewModal.id,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      sellerId: showReviewModal.sellerId,
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
      createdAt: new Date().toISOString()
    };

    setReviews(prev => [...prev, newReview]);
    setShowReviewModal(null);
    setReviewForm({ rating: 5, comment: '' });
    addNotification('Thank you! Your review was submitted.', 'success');
  };

  // Toggle Favorite
  const toggleFavorite = (listingId: string) => {
    if (!currentUser) {
      navigate(LOGIN_PATH);
      return;
    }
    setFavorites(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId) 
        : [...prev, listingId]
    );
  };

  // Get seller rating
  const getSellerRating = (sellerId: string) => {
    const sellerReviews = reviews.filter(r => r.sellerId === sellerId);
    if (sellerReviews.length === 0) return { avg: 0, count: 0 };
    const avg = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
    return { avg: Math.round(avg * 10) / 10, count: sellerReviews.length };
  };

  // Profile update
  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const photoUrl = event.target?.result as string;
      setProfilePhoto(photoUrl);
      setProfileForm(prev => ({ ...prev, avatar: photoUrl }));
    };
    reader.readAsDataURL(file);
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    if (digits.length <= 10) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)} ${digits.slice(10)}`;
  };

  const getVerificationStatus = (user?: Partial<UserType> | null) => {
    if (!user) {
      return { label: 'Pending Verification', pillClass: 'bg-amber-100 text-amber-700' };
    }

    const isApprovedStatus = user.verificationRequestStatus === 'approved' || user.verified;
    if (isApprovedStatus) {
      const label = user.verificationBadgeType === 'verified_seller'
        ? 'Verified Seller'
        : user.verificationBadgeType === 'active_member'
          ? 'Active Member'
          : 'Verified Member';
      return { label, pillClass: 'bg-emerald-100 text-emerald-700' };
    }

    return { label: 'Pending Verification', pillClass: 'bg-amber-100 text-amber-700' };
  };

  const refreshCurrentUserVerificationState = useCallback((updatedUser?: Partial<UserType> | null) => {
    if (!updatedUser) return;
    setCurrentUser(prev => {
      const next = prev ? { ...prev, ...updatedUser } : null;
      if (next && typeof window !== 'undefined') {
        safeSetStorageJson('mc_currentUser', next);
      }
      return next;
    });
    setProfileForm(prev => ({ ...prev, ...updatedUser }));
    setUsers(prev => {
      const next = prev.map(item => item.id === updatedUser.id ? { ...item, ...updatedUser } as UserType : item);
      persistUsers(next);
      return next;
    });
  }, []);

  const refreshProfileView = useCallback(() => {
    setProfileRefreshToken(prev => prev + 1);
    setVerificationRefreshToken(prev => prev + 1);
  }, []);

  const updateProfile = async () => {
    if (!currentUser) return;

    const normalizedProfileForm = {
      ...profileForm,
      location: typeof profileForm.location === 'string' ? profileForm.location : normalizeListingLocation(profileForm.location),
      sellerLocation: typeof profileForm.sellerLocation === 'string' ? profileForm.sellerLocation : normalizeListingLocation(profileForm.sellerLocation),
    };

    setProfileSaving(true);
    try {
      const updatedUser = await updateProfileApi({
        ...normalizedProfileForm,
        avatar: profilePhoto || currentUser.avatar,
      });

      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      setProfileForm(updatedUser);
      addNotification('Profile updated successfully!', 'success');
    } catch (error: any) {
      addNotification(error?.response?.data?.error || error?.message || 'Unable to update profile.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const submitChangePassword = async () => {
    if (!currentUser) return;

    if (!changePasswordForm.oldPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword) {
      setChangePasswordMessage('Please complete all password fields.');
      return;
    }

    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setChangePasswordMessage('New passwords do not match.');
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordMessage(null);

    try {
      const response = await changePassword(changePasswordForm.oldPassword, changePasswordForm.newPassword);
      setChangePasswordMessage(response.message || 'Password changed successfully.');
      setChangePasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePasswordModal(false);
      addNotification('Password changed successfully.', 'success');
    } catch (error: any) {
      setChangePasswordMessage(error?.response?.data?.error || error?.message || 'Unable to change password.');
      addNotification('Unable to change password.', 'error');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const requestAccountDeletion = async () => {
    if (!currentUser) return;

    if (!deleteReason.trim()) {
      addNotification('Please describe why you want to delete your account.', 'error');
      return;
    }

    setDeleteAccountLoading(true);
    try {
      const request = await createAccountDeletionRequest(deleteReason.trim());
      setDeletionRequests(prev => [request, ...prev]);
      addPortalNotification({
        title: 'Account deletion requested',
        message: `${currentUser.name} requested account deletion. Reason: ${request.reason}`,
        type: 'system',
        targetRole: 'admin',
        relatedUserId: currentUser.id,
      });
      setDeleteReason('');
      setShowDeleteAccountModal(false);
      addNotification('Your deletion request was sent to the admin for review.', 'success');
    } catch (error: any) {
      addNotification(error?.response?.data?.error || error?.message || 'Unable to submit deletion request.', 'error');
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const reviewDeletionRequest = async (requestId: string, action: 'approve' | 'reject') => {
    const request = deletionRequests.find(item => item.id === requestId);
    if (!request) return;

    try {
      const updatedRequest = await reviewAccountDeletionRequest(requestId, action);
      setDeletionRequests(prev => prev.map(item => item.id === requestId ? { ...item, ...updatedRequest } : item));

      if (action === 'approve') {
        await deleteAdminUser(request.userId);
        setUsers(prev => prev.filter(user => user.id !== request.userId));
        setListings(prev => prev.filter(listing => listing.sellerId !== request.userId));
        setOrders(prev => prev.filter(order => order.buyerId !== request.userId && order.sellerId !== request.userId));
        setTransactions(prev => prev.filter(transaction => transaction.userId !== request.userId && transaction.counterpartyId !== request.userId));
        setDeletionRequests(prev => prev.filter(item => item.userId !== request.userId));
        addPortalNotification({
          title: 'Account deletion approved',
          message: 'Your account deletion request was approved. Your account has been removed from the platform.',
          type: 'system',
          targetUserId: request.userId,
          relatedUserId: request.userId,
        });
        if (currentUser?.id === request.userId) {
          apiLogout();
          setCurrentUser(null);
        }
        addNotification('Deletion request approved and user removed from the platform.', 'success');
      } else {
        addPortalNotification({
          title: 'Account deletion rejected',
          message: 'Your account deletion request was reviewed and kept active.',
          type: 'system',
          targetUserId: request.userId,
          relatedUserId: request.userId,
        });
        addNotification('Deletion request rejected.', 'success');
      }
    } catch (error: any) {
      addNotification(error?.response?.data?.error || error?.message || 'Unable to review deletion request.', 'error');
    }
  };

  // Admin actions
  const payVerificationFee = async () => {
    if (!currentUser) return;

    setVerifyingUserId(currentUser.id);
    setVerificationMessage('Processing verification payment…');

    try {
      const result = await payMembershipVerificationWithWallet(currentUser.id);
      const nextUser = result.user as UserType;
      const nextBalance = Number(result.balance ?? currentUser.walletBalance ?? 0);
      setCurrentUser(prev => prev ? { ...prev, ...nextUser, walletBalance: nextBalance } : nextUser);
      setWalletBalance(nextBalance);
      setVerificationRefreshToken(prev => prev + 1);
      setVerificationMessage(`Payment of ₦${Number(result.amount || currentUser.verificationFee || 0).toFixed(2)} completed. Your verification is approved.`);
      const walletTransactions = await getTransactionHistory(currentUser.id);
      setTransactions(walletTransactions);
      addNotification('Verification payment completed and account approved.', 'success');
    } catch (error: any) {
      console.error(error);
      setVerificationMessage(error?.response?.data?.error || error?.message || 'Unable to complete verification payment.');
    } finally {
      setVerifyingUserId(null);
    }
  };

  const handleAdminApprove = (user: UserType) => {
    if (!user || user.verified) return;

    const badgeLabel = user.verificationBadgeType === 'verified_seller' ? 'Verified Seller' : 'Active Member';
    const confirmed = window.confirm(`Approve ${user.name} as ${badgeLabel}?`);
    if (!confirmed) return;

    const approvedUser: UserType = {
      ...user,
      verified: true,
      verificationLevel: user.verificationBadgeType === 'verified_seller' ? 'full' : 'basic',
      verificationRequestStatus: 'approved',
      verificationBadgeType: user.verificationBadgeType || 'active_member',
    };

    setUsers(prev => {
      const next = prev.map(item => item.id === user.id ? approvedUser : item);
      persistUsers(next);
      return next;
    });

    if (currentUser?.id === user.id) {
      refreshCurrentUserVerificationState(approvedUser);
    }

    void adminVerifyMembership(approvedUser);
  };

  const adminVerifyMembership = async (user: UserType) => {
    if (!user) return;

    setVerifyingUserId(user.id);
    setVerificationMessage('Approving verification…');

    try {
      const badgeType = user.verificationBadgeType || 'active_member';
      const response = await approveUserVerification(user.id, badgeType, Number(user.verificationFee || 0));
      const approvedUser: UserType = {
        ...user,
        ...response.user,
        verified: true,
        verificationLevel: badgeType === 'verified_seller' ? 'full' : 'basic',
        verificationRequestStatus: 'approved',
        verificationBadgeType: badgeType,
      };

      setUsers(prev => {
        const next = prev.map(item => item.id === user.id ? approvedUser : item);
        persistUsers(next);
        if (currentUser?.id === user.id) {
          safeSetStorageJson('mc_currentUser', approvedUser);
        }
        return next;
      });
      setVerificationRefreshToken(prev => prev + 1);
      if (currentUser?.id === user.id) {
        refreshCurrentUserVerificationState(approvedUser);
      }
      refreshProfileView();
      setVerificationMessage(`${user.name} has been approved as a verified member.`);
      addPortalNotification({
        title: 'Verification approved',
        message: `Your account has been approved as ${badgeType === 'verified_seller' ? 'Verified Seller' : 'Active Member'}. You can now publish listings and gain more visibility.`,
        type: 'success',
        targetUserId: user.id,
        targetRole: 'all',
        relatedUserId: user.id,
      });
      addNotification(`${user.name} has been approved as a verified member.`, 'success');
    } catch (error: any) {
      console.error(error);
      setVerificationMessage('Unable to approve verification.');
      addNotification(error?.response?.data?.error || error?.message || 'Unable to approve verification.', 'error');
    } finally {
      setVerifyingUserId(null);
    }
  };

  const adminRequestVerification = async (user: UserType, badgeType = adminVerificationBadgeType) => {
    const fee = Number(adminVerificationFee) || 5000;
    const response = await requestUserVerification(user.id, badgeType, fee);
    const requestedUser = { ...user, ...response.user } as UserType;
    setUsers(prev => prev.map(item => item.id === user.id ? requestedUser : item));
    addNotification(`Verification request sent for ${user.name}.`, 'success');
  };

  const runBulkAdminAction = async (action: 'approve' | 'request' | 'remove') => {
    const selectedUsers = users.filter(user => selectedAdminUserIds.includes(user.id));
    if (!selectedUsers.length) return;
    if (!window.confirm(`${action === 'remove' ? 'Remove' : action === 'approve' ? 'Approve' : 'Send a verification request to'} ${selectedUsers.length} selected user(s)?`)) return;

    try {
      for (const user of selectedUsers) {
        if (action === 'remove') await deleteAdminUser(user.id);
        else if (action === 'request') await adminRequestVerification(user);
        else if (!user.verified) await adminVerifyMembership(user);
      }
      if (action === 'remove') setUsers(prev => prev.filter(user => !selectedAdminUserIds.includes(user.id)));
      setSelectedAdminUserIds([]);
      addNotification('Bulk user action completed.', 'success');
    } catch (error: any) {
      addNotification(error?.response?.data?.error || error?.message || 'Bulk action failed.', 'error');
    }
  };

  const adminDeleteUser = async (id: string) => {
    if (!confirm('Remove this user?')) return;

    try {
      await deleteAdminUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setListings(prev => prev.filter(l => l.sellerId !== id));
      addNotification('User removed successfully.', 'success');
    } catch (error: any) {
      addNotification(error?.response?.data?.error || 'Unable to remove user.', 'error');
    }
  };

  const adminDeleteListing = async (id: string) => {
    if (!confirm('Delete this listing?')) return;

    try {
      await deleteAdminListing(id);
      setListings(prev => prev.filter(l => l.id !== id));
      addNotification('Listing deleted successfully.', 'success');
    } catch (error: any) {
      addNotification(error?.response?.data?.error || 'Unable to delete listing.', 'error');
    }
  };

  const adminResolveDispute = async (orderId: string, decision: 'approve' | 'reject') => {
    try {
      const resolvedOrder = await resolveAdminDispute(orderId, decision);
      setOrders(prev => prev.map(order => (order.id === resolvedOrder.id ? resolvedOrder : order)));
      addNotification(`Dispute ${decision === 'approve' ? 'approved' : 'rejected'} successfully.`, 'success');
    } catch (error: any) {
      addNotification(error?.response?.data?.error || 'Unable to resolve dispute.', 'error');
    }
  };

  const adminResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const resolvedReport = await resolveAdminReport(reportId, status);
      setReports(prev => prev.map(report => (report.id === resolvedReport.id ? resolvedReport : report)));
      addNotification(`Report marked as ${status}.`, 'success');
    } catch (error: any) {
      addNotification(error?.response?.data?.error || 'Unable to update report.', 'error');
    }
  };

  const generateAssistantResponse = (user?: UserType, report?: Report, prompt?: string) => {
    if (!user && !report) {
      return 'Select a user or a report to receive guidance from the AI assistant.';
    }

    const lines: string[] = [];

    if (user) {
      lines.push(`User: ${user.name} (${user.role}). Verified: ${user.verified ? 'Yes' : 'No'}.`);
      if (!user.verified) {
        lines.push('Recommendation: verify this user only after reviewing their activity history, listed items, and any reported issues.');
      } else {
        lines.push('This user is already verified. Monitor future reports before changing their status.');
      }

      if (user.role === 'seller') {
        lines.push('Seller guidance: confirm their listings are legitimate and there are no hidden disputes before granting full privileges.');
      } else if (user.role === 'buyer') {
        lines.push('Buyer guidance: check payment history and any complaints before approving repeat purchases or trust badges.');
      }
    }

    if (report) {
      lines.push(`Report: ${report.subject} (${report.type}). Status: ${report.status}.`);
      lines.push(`Details: ${report.details}`);
      if (report.status === 'pending') {
        if (report.type === 'complaint') {
          lines.push('AI recommendation: prioritize this complaint, contact both parties if possible, and resolve only once the facts support one side.');
        } else {
          lines.push('AI recommendation: evaluate the reported user history and patterns before resolving or dismissing the report.');
        }
        lines.push('Suggested action: resolve it if there is evidence of policy violation or dismiss if the report is unsubstantiated.');
      } else {
        lines.push('This report has already been processed. Review the resolution notes if available.');
      }
    }

    if (prompt) {
      lines.push(`Prompt: ${prompt}`);
      if (prompt.toLowerCase().includes('verify')) {
        lines.push('The assistant is focusing on verification guidance for the selected user.');
      }
      if (prompt.toLowerCase().includes('complaint')) {
        lines.push('The assistant is focusing on complaint review and possible resolution.');
      }
    }

    return lines.join(' ');
  };

  const runAdminAssistant = () => {
    const selectedUser = assistantTargetUserId ? users.find(u => u.id === assistantTargetUserId) : undefined;
    const selectedReport = assistantTargetReportId ? reports.find(r => r.id === assistantTargetReportId) : undefined;
    setAssistantLoading(true);
    setAssistantResponse(null);

    window.setTimeout(() => {
      setAssistantResponse(generateAssistantResponse(selectedUser, selectedReport, assistantPrompt));
      setAssistantLoading(false);
    }, 200);
  };

  // Render Helpers
  const renderListingCard = ({ listing, showSeller = true }: { listing: Listing; showSeller?: boolean }) => {
    const isFavorite = favorites.includes(listing.id);
    const rating = getSellerRating(listing.sellerId);
    const seller = users.find(u => u.id === listing.sellerId);

    const openSellerProfile = (event?: React.MouseEvent<HTMLButtonElement>) => {
      if (event) event.stopPropagation();
      if (!seller) return;
      navigate(`/seller/${seller.id}`);
    };

    const openListing = (event?: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
      if (event) event.stopPropagation();
      navigate(`/listing/${listing.id}`);
    };

    const handleViewDetails = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      openListing(event);
    };

    const handleContact = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      contactSeller(listing);
    };

    const handleCardClick = (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest('button, a, input, select, textarea')) return;
      openListing(event);
    };

    const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openListing(event as unknown as React.MouseEvent<HTMLElement>);
      }
    };

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
      >
        <div className="relative h-52 bg-slate-100 overflow-hidden">
          <img 
            src={listing.images[0]} 
            alt={listing.title} 
            loading="lazy"
            decoding="async"
            width="600"
            height="400"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <button 
            type="button"
            onClick={(event) => { event.stopPropagation(); toggleFavorite(listing.id); }}
            className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 backdrop-blur rounded-2xl shadow hover:bg-white transition"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
          </button>
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-white/95 text-xs font-medium rounded-full text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> {normalizeListingLocation(listing.location).split(',')[0]}
          </div>
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <span className="px-3 py-1 text-[10px] font-semibold tracking-wider bg-slate-100 text-slate-600 rounded-full">{listing.category}</span>
            <div className="text-right">
              {listing.discountEnabled && listing.discountPercentage && Number(listing.discountPercentage) > 0 && (
                <div className="inline-flex items-center justify-center mb-1">
                  <span className="inline-block px-2 py-0.5 mr-2 text-xs font-bold text-white bg-red-500 rounded">-{Math.round(Number(listing.discountPercentage))}%</span>
                </div>
              )}
              <div className="font-semibold text-2xl text-slate-900 tabular-nums">₦{(listing.finalPrice ?? listing.price).toLocaleString()}</div>
              {listing.discountEnabled && listing.originalPrice && (
                <div className="text-xs text-slate-500 line-through">₦{listing.originalPrice.toLocaleString()}</div>
              )}
            </div>
          </div>
          
          <h3 className="font-semibold text-lg text-slate-900 leading-tight mb-1.5 line-clamp-2">{listing.title}</h3>
          
          {showSeller && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-3">
              <button type="button" onClick={openSellerProfile} className="font-medium text-slate-700 hover:text-slate-900 underline decoration-slate-200 underline-offset-4">
                {listing.sellerName}
              </button>
              {seller && (
                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getVerificationStatus(seller).pillClass}`}>
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/70 text-[10px] font-bold leading-none shadow-sm" aria-hidden="true">✓</span>
                  {getVerificationStatus(seller).label}
                </div>
              )}
              <span>•</span>
              <span>{normalizeListingLocation(listing.location)}</span>
              {rating.count > 0 && (
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" /> {rating.avg}
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">{listing.description}</p>

          <div className="flex gap-2 mt-auto">
            <button 
              type="button"
              onClick={handleViewDetails}
              className="flex-1 py-2.5 text-sm font-medium bg-slate-900 hover:bg-black text-white rounded-2xl transition"
            >
              View Details
            </button>
            <button 
              type="button"
              onClick={handleContact}
              className="flex-1 py-2.5 text-sm font-medium border border-slate-300 hover:bg-slate-50 rounded-2xl transition"
            >
              Message
            </button>
          </div>
        </div>
      </div>
    );
  };

  sellerRouteDataRef.current = {
    users,
    listings,
    sellerStatsCache,
    setSellerStatsCache,
    currentUser,
    contactSeller,
    setReportForm,
    setShowReportModal,
    getVerificationStatus,
    normalizeListingLocation,
    LOGIN_PATH,
  };

  // Main Render
  if (!currentUser && location.pathname === LOGIN_PATH) {
    return (
      <AuthPage
        authMode={authMode}
        loginForm={loginForm}
        registerForm={registerForm}
        showRegisterPassword={showRegisterPassword}
        authLoading={authLoading}
        authError={authError}
        authSuccess={authSuccess}
        passwordError={passwordError}
        pendingSignupEmail={pendingSignupUser?.email || ''}
        emailOtp={emailOtp}
        onResendEmailOtp={() => void handleResendSignupOtp()}
        onSubmit={(event) => {
          event.preventDefault();
          if (authMode === 'login') {
            void handleLogin();
          } else {
            void handleRegister();
          }
        }}
        onLoginFieldChange={(field, value) => setLoginForm(prev => ({ ...prev, [field]: value }))}
        onRegisterFieldChange={(field, value) => setRegisterForm(prev => ({ ...prev, [field]: value as never }))}
        onEmailOtpChange={setEmailOtp}
        onTogglePasswordVisibility={() => setShowRegisterPassword((prev) => !prev)}
        onSwitchMode={(mode) => setAuthMode(mode)}
        onCancel={() => {
          setAuthMode('login');
          navigate('/');
        }}
      />
    );
  }

  if (!currentUser && location.pathname === '/') {
    return (
      <LandingPage
        onSignIn={() => navigate(LOGIN_PATH)}
        onCreateAccount={() => {
          setAuthMode('register');
          navigate(LOGIN_PATH);
        }}
      />
    );
  }

  if (!currentUser && isPublicSellerRoute) {
    return <SellerProfileRoute />;
  }

  return (
    <MarketplaceShell
      currentUser={currentUser as UserType}
      unreadMessages={unreadMessages}
      unreadNotificationCount={unreadNotificationCount}
      showNotificationMenu={showNotificationMenu}
      showNotificationsPage={showNotificationsPage}
      appNotifications={appNotifications}
      portalNotifications={portalNotifications}
      notificationFilter={notificationFilter}
      filteredNotifications={filteredNotifications}
      groupedNotifications={groupedNotifications}
      activeTab={activeTab}
      isPublicSellerView={false}
      onNavigate={navigateTo}
      onOpenNotifications={() => { setShowNotificationsPage(true); }}
      onToggleNotificationsMenu={() => { setShowNotificationMenu(prev => !prev); setShowNotificationsPage(false); }}
      onMarkAllNotificationsRead={markAllNotificationsRead}
      onSetNotificationFilter={setNotificationFilter}
      onShowNotificationsPage={setShowNotificationsPage}
      onToggleNotificationRead={handleToggleNotificationRead}
      onDeleteNotification={handleDeleteNotification}
      onNotificationAction={handleNotificationAction}
      onLogout={logout}
      onOpenProfile={() => navigateTo('profile')}
    >
      <Routes key={verificationRefreshToken}>
            <Route path="/payment/callback" element={<PaymentCallback />} />
            <Route path="/seller/:id" element={<SellerProfileRoute />} />
            <Route path="/messages" element={
              <React.Suspense fallback={<div className="pt-24 px-6">Loading messages...</div>}>
                <MessagesPage
                  conversations={conversations}
                  users={users}
                  messages={messages}
                  currentUser={currentUser}
                  chatLastRead={chatLastRead}
                  markChatAsRead={markChatAsRead}
                  activeChat={activeChat}
                  chatMessages={chatMessages}
                  chatImage={chatImage}
                  onSelectChatImage={(value: string | null) => setChatImage(value)}
                  newMessage={newMessage}
                  onChangeMessage={setNewMessage}
                  onSendMessage={sendMessage}
                  onSendVoiceMessage={sendVoiceMessage}
                  onCloseConversation={() => {
                    chatLoadVersionRef.current += 1;
                    setShowChat(false);
                    setActiveChat(null);
                    setChatMessages([]);
                    setChatImage(null);
                  }}
                  onOpenChatUserProfile={() => {
                    if (!activeChat) return;
                    navigate(`/seller/${encodeURIComponent(activeChat.otherUserId)}`);
                  }}
                  timestampLocale={navigator.language}
                  timestampTimeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                  onOpenOrder={() => navigateTo('orders')}
                  onOpenConversation={(conv: any) => loadChat(conv)}
                />
              </React.Suspense>
            } />
                    <Route path="/profile" element={
              <React.Suspense fallback={<div className="pt-24 px-6">Loading profile...</div>}>
                <ProfilePage currentUser={currentUser} profileRefreshToken={profileRefreshToken} onProfileUpdated={(updatedUser) => {
                  setCurrentUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
                  setProfileForm(prev => ({ ...prev, ...updatedUser }));
                  setProfilePhoto(updatedUser.avatar || '');
                  setUsers(prev => prev.map(user => user.id === updatedUser.id ? { ...user, ...updatedUser } : user));
                }} onReport={() => {
                  if (!currentUser) {
                    showAuthPrompt('Report User', 'Create a free account to report a user if there is an issue.');
                    return;
                  }
                  const otherUser = users.find(u => u.id !== currentUser.id);
                  setReportForm(prev => ({
                    ...prev,
                    reportedUserId: otherUser?.id || '',
                    reportedUserName: otherUser?.name || '',
                    reportedRole: otherUser?.role || 'buyer',
                    type: 'report',
                    subject: '',
                    details: '',
                  }));
                  setShowReportModal(true);
                }} />
              </React.Suspense>
            } />
            <Route path="/listing/:id" element={<ListingDetailRoute />} />
            <Route path="/new-listing" element={
              <React.Suspense fallback={<div className="pt-24 px-6">Loading listing form...</div>}>
                <NewListingForm editingListing={editingListing} onCancel={() => { setEditingListing(null); navigate('/'); }} onPublish={handleNewListingPublish} />
              </React.Suspense>
            } />
            <Route path="*" element={
              <>
                {/* DISCOVER TAB */}
                {activeTab === 'discover' && (
          <>
            <div className="flex flex-col md:flex-row md:items-end gap-6 pt-8 pb-6">
              <div>
                <div className="text-4xl font-semibold tracking-[-1.5px] sm:text-6xl">Discover amazing<br />local finds.</div>
                <p className="text-xl text-slate-600 mt-3">Connect directly with sellers in your area.</p>
              </div>
              <div className="md:ml-auto flex-1 max-w-lg">
                <div className="relative">
                  <label htmlFor="discover-search" className="sr-only">Search listings</label>
                  <input 
                    id="discover-search"
                    name="discoverSearch"
                    type="text"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search products, services or sellers..." 
                    className="w-full pl-12 py-4 bg-white shadow-sm border border-slate-200 rounded-3xl text-lg placeholder:text-slate-400" 
                  />
                  <Search className="absolute left-5 top-5 text-slate-400 w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-7 items-center">
              <button onClick={() => setShowFilters(!showFilters)} className="px-5 py-2 rounded-3xl border flex items-center gap-2 text-sm bg-white">
                <Filter className="w-4 h-4" /> Filters
              </button>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)} 
                  className={`px-5 py-2 text-sm rounded-3xl transition ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-white border'}`}>
                  {cat}
                </button>
              ))}
              <button onClick={() => { setSearchTerm(''); setSelectedCategory(''); setSelectedLocation(''); setPriceRange([0, 10000000000]); }} className="text-sm text-slate-500">Clear filters</button>
            </div>

            {showFilters && (
              <div className="bg-white p-6 rounded-3xl mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 border">
                <div>
                  <label htmlFor="filter-location" className="sr-only">Filter by location</label>
                  <div className="text-xs font-semibold tracking-widest mb-2 text-slate-500">LOCATION</div>
                  <select id="filter-location" name="location" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="w-full px-4 py-3 border rounded-2xl">
                    <option value="">Any Location</option>
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-min-price" className="sr-only">Minimum price</label>
                  <label htmlFor="filter-max-price" className="sr-only">Maximum price</label>
                  <div className="text-xs font-semibold tracking-widest mb-2 text-slate-500">PRICE RANGE</div>
                  <div className="flex items-center gap-4 text-sm">
                    <input id="filter-min-price" name="minPrice" type="number" value={priceRange[0]} onChange={e => setPriceRange([+e.target.value, priceRange[1]])} className="w-full px-4 py-3 border rounded-2xl" placeholder="Min" />
                    <span className="text-slate-400">to</span>
                    <input id="filter-max-price" name="maxPrice" type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], +e.target.value])} className="w-full px-4 py-3 border rounded-2xl" placeholder="Max" />
                  </div>
                </div>
              </div>
            )}

            {!currentUser && (
              <div className="mb-8 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-transparent p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="font-semibold text-lg text-slate-900">Ready to get started?</div>
                    <p className="text-sm text-slate-600 mt-1">Create a free account to connect with sellers and place orders.</p>
                  </div>
                  <div className="flex gap-3 sm:flex-shrink-0">
                    <button onClick={() => { setAuthMode('register'); navigate(LOGIN_PATH); }} className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-3xl hover:bg-emerald-700 transition">Create Account</button>
                    <button onClick={() => { setAuthMode('login'); navigate(LOGIN_PATH); }} className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-3xl hover:bg-slate-50 transition">Login</button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.length > 0 ? (
                filteredListings.map(listing => <React.Fragment key={listing.id}>{renderListingCard({ listing })}</React.Fragment>)
              ) : (
                <div className="col-span-full py-20 text-center text-slate-400">No listings found matching your filters.</div>
              )}
            </div>
          </>
        )}

        {/* Messages tab removed */}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="max-w-5xl pt-8">
            <div className="mb-8 text-3xl font-semibold tracking-tight sm:text-5xl">My Activity</div>

            {authInitialized && currentUserSafe.verificationRequestStatus === 'pending' && !currentUserSafe.verified && Number(currentUserSafe.verificationFee) > 0 && (
              <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                <div className="font-semibold">Verification request from admin</div>
                <p className="mt-1 text-sm">Admin has requested your verification. Pay ₦{currentUserSafe.verificationFee || verificationAmount} from your wallet to activate your verification badge.</p>
                <button type="button" onClick={payVerificationFee} disabled={verifyingUserId === currentUserSafe.id} className="mt-4 rounded-2xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60">
                  {verifyingUserId === currentUserSafe.id ? 'Processing…' : 'Complete Payment'}
                </button>
              </div>
            )}

            {/* Favorites */}
            <div className="mb-12">
              <div className="font-semibold mb-4 text-xl flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> Saved Items ({favorites.length})</div>
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {listings.filter(l => favorites.includes(l.id)).map(l => <React.Fragment key={l.id}>{renderListingCard({ listing: l })}</React.Fragment>)}
                </div>
              ) : <div className="text-slate-400">No saved items yet. Heart listings you like.</div>}
            </div>

            {/* My Listings for Sellers */}
            {currentUserSafe.role === 'seller' && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="font-semibold text-xl">My Listings ({myListings.length})</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMyListingsVisibility(prev => ({ ...prev, visible: !prev.visible }))}
                      className="rounded-3xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      {showMyListings ? 'Hide listings' : 'My listings'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingListing(null);
                        navigate('/new-listing');
                      }}
                      className="flex items-center gap-2 rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      New listing
                    </button>
                  </div>
                </div>
                {showMyListings && myListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {myListings.map(listing => (
                      <div key={listing.id} className="bg-white border rounded-3xl overflow-hidden">
                        <div className="relative h-40"><img src={listing.images[0]} className="w-full h-full object-cover" /></div>
                        <div className="p-5">
                          <div className="font-semibold">{listing.title}</div>
                          <div className="text-xl font-semibold tabular-nums mt-1">₦{listing.price}</div>
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => openEditListing(listing)} className="flex-1 py-2 text-xs rounded-2xl border">Edit</button>
                            <button onClick={() => deleteListing(listing.id)} className="flex-1 py-2 text-xs rounded-2xl border text-red-500">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : showMyListings ? <div className="text-center py-8 text-sm text-slate-400 border rounded-3xl">You have no active listings yet.</div> : null}
              </div>
            )}

            {/* Orders */}
            <div>
              <div className="font-semibold mb-4 text-xl">Orders &amp; Bookings</div>
              {myOrders.length > 0 ? (
                <div className="bg-white border rounded-3xl overflow-hidden">
                  {myOrders.map(order => {
                    const isSeller = currentUserSafe.role === 'seller' && order.sellerId === currentUserSafe.id;
                    return (
                      <div key={order.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 border-b last:border-b-0">
                        <div>
                          <div className="font-medium">{order.listingTitle}</div>
                          <div className="text-sm text-slate-500">{isSeller ? `Buyer: ${order.buyerName}` : `Seller: ${order.sellerName}`}</div>
                          <div className="text-xs mt-1 text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-4 w-full md:w-auto">
                          <div className="text-xl tabular-nums font-semibold">₦{order.price}</div>
                          <div className={`px-4 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'confirmed' ? 'bg-purple-100 text-purple-700' :
                            order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>{order.status}</div>
                          
                          {isSeller && order.status === 'pending' && (
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="whitespace-nowrap px-4 py-1.5 text-xs bg-emerald-600 text-white rounded-full flex items-center gap-1"><Check className="w-3 h-3"/> Accept</button>
                              <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="whitespace-nowrap px-4 py-1.5 text-xs border text-red-600 rounded-full flex items-center gap-1"><X className="w-3 h-3"/> Reject</button>
                            </div>
                          )}

                          {isSeller && (order.status === 'accepted' || order.status === 'shipped') && (
                            <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="px-5 py-2 bg-blue-600 text-white rounded-3xl text-xs">
                              {order.deliveryDetails?.method === 'meetup' ? 'Mark pickup complete' : 'Mark delivered'}
                            </button>
                          )}
                          
                          {!isSeller && order.status === 'accepted' && (
                            <button onClick={() => setShowPaymentModal(order)} className="px-6 py-2 bg-slate-900 hover:bg-black text-white rounded-3xl text-xs">Complete Payment</button>
                          )}

                          {!isSeller && order.paymentStatus === 'completed' && !order.deliveryDetails?.method && (
                            <button onClick={() => setFulfillmentOrder(order)} className="px-5 py-2 bg-emerald-600 text-white rounded-3xl text-xs">Choose pickup or delivery</button>
                          )}

                          {!isSeller && order.status === 'delivered' && order.paymentStatus === 'completed' && (
                            <button onClick={() => openConfirmModal('Confirm order', 'Confirm that you received the order in good condition and release the held payment to the seller?', () => updateOrderStatus(order.id, 'confirmed'))} className="px-5 py-2 bg-emerald-600 text-white rounded-3xl text-xs">Confirm order &amp; release payment</button>
                          )}
                          
                          {(['delivered', 'shipped'].includes(order.status) || order.status === 'disputed') && !isSeller && (
                            <button onClick={() => { setDisputeOrder(order); setDisputeReason(''); setShowDisputeModal(true); }} className="px-5 py-2 border rounded-3xl text-xs flex items-center gap-1">Raise Dispute</button>
                          )}
                          
                          {canLeaveReview(order, isSeller) && (
                            <button onClick={() => setShowReviewModal(order)} className="px-5 py-2 border rounded-3xl text-xs flex items-center gap-1">Leave Review</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="bg-white p-10 rounded-3xl text-center text-slate-500 border">No orders yet.</div>}
            </div>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="max-w-7xl pt-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="text-3xl font-semibold tracking-tight sm:text-5xl">Transactions</div>
                <p className="text-slate-600 mt-1">Review your wallet history, filter records and export CSV.</p>
              </div>
              <button onClick={() => exportTransactionsCsv()} className="inline-flex items-center gap-2 py-3 px-5 bg-slate-900 text-white rounded-3xl text-sm">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <div className="bg-white border rounded-3xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <label htmlFor="transaction-search" className="sr-only">Search transaction history</label>
                <input id="transaction-search" name="transactionSearch" value={transactionSearch} onChange={e => setTransactionSearch(e.target.value)} placeholder="Search transactions" className="w-full px-4 py-3 border rounded-2xl" />
                <label htmlFor="transaction-type" className="sr-only">Filter transaction type</label>
                <select id="transaction-type" name="transactionType" value={transactionTypeFilter} onChange={e => setTransactionTypeFilter(e.target.value as any)} className="w-full px-4 py-3 border rounded-2xl">
                  <option value="all">All types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="payment">Payment</option>
                  <option value="payout">Payout</option>
                </select>
                <div className="flex items-center gap-4 justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Transactions</div>
                    <div className="text-lg font-semibold">{filteredTransactions.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Wallet balance</div>
                    <div className="text-lg font-semibold">₦{(currentUserSafe.walletBalance || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {filteredTransactions.length > 0 ? (
                <div className="space-y-4">
                  {filteredTransactions.map(tx => (
                    <button key={tx.id} onClick={() => setTransactionDetail(tx)} className="w-full text-left p-4 border rounded-3xl hover:bg-slate-50 transition">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold capitalize">{tx.type}</div>
                          <div className="text-xs text-slate-500 mt-1">{new Date(tx.createdAt).toLocaleString()}</div>
                        </div>
                        <div className={`font-semibold ${tx.type === 'deposit' || tx.type === 'payout' ? 'text-emerald-600' : 'text-red-600'}`}>₦{tx.amount.toFixed(2)}</div>
                      </div>
                      {tx.details && <div className="mt-3 text-sm text-slate-500">{tx.details}</div>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 text-slate-400">No transactions match this filter.</div>
              )}
            </div>
          </div>
          )}

          {/* WALLET TAB */}
          {activeTab === 'wallet' && (
            <div className="pt-8 max-w-3xl">
              <div className="mb-3 text-3xl font-semibold tracking-tight sm:text-5xl">Wallet</div>
              <div className="text-slate-500 mb-6">Manage your wallet balance, deposit and withdraw funds, and view history.</div>
              {depositSuccess && (
                <div className="mb-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold">Deposit confirmed</div>
                      <div className="text-sm">{getDepositCurrency()} {depositSuccess.amount.toFixed(2)} has been credited via {depositSuccess.provider}.</div>
                    </div>
                    <button
                      onClick={() => setDepositSuccess(null)}
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                    >Dismiss</button>
                  </div>
                </div>
              )}

              <div className="mb-8 rounded-[28px] bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#020617] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm uppercase tracking-[0.3em] text-slate-300">Available Balance</div>
                    <div className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">{showBalance ? `₦${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '••••••'}</div>
                    <div className="mt-2 text-sm text-slate-400">Spendable funds ready for deposits, withdrawals, and purchases.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBalance(prev => !prev)}
                    className="rounded-full border border-white/20 bg-white/10 p-3 transition hover:bg-white/20"
                    aria-label={showBalance ? 'Hide balances' : 'Show balances'}
                  >
                    {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 max-w-[260px]">
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-300">Held Balance</div>
                  <div className="mt-2 text-3xl font-semibold">{showBalance ? `₦${heldBalance.toFixed(2)}` : '••••••'}</div>
                  <div className="mt-1 text-sm text-slate-400">Funds currently locked in escrow for active orders.</div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] mb-8">
                <div className="rounded-[28px] bg-white border border-slate-200 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                  <div className="text-lg font-semibold mb-1">Deposit Funds</div>
                  <div className="text-sm text-slate-500 mb-6">Top up your wallet securely.</div>

                  <div className="grid gap-4">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold mb-3">Payment provider</div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDepositMethod('paystack')}
                          className={`rounded-3xl border px-4 py-3 text-left transition-all ${depositMethod === 'paystack' ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                          <div className="text-sm font-semibold">Paystack</div>
                          <div className="text-xs text-slate-500 mt-1">Trusted Nigerian gateway</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositMethod('flutterwave')}
                          className={`rounded-3xl border px-4 py-3 text-left transition-all ${depositMethod === 'flutterwave' ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                          <div className="text-sm font-semibold">Flutterwave</div>
                          <div className="text-xs text-slate-500 mt-1">Secure NGN checkout</div>
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div>
                        <label htmlFor="deposit-amount" className="text-sm font-medium text-slate-700">Amount</label>
                        <input
                          id="deposit-amount"
                          name="depositAmount"
                          value={depositAmount}
                          onChange={e => setDepositAmount(e.target.value)}
                          placeholder="Enter amount e.g. 5000"
                          className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-3xl bg-slate-50 text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-emerald-200 outline-none"
                        />
                      </div>
                      {depositError && <div className="text-sm text-rose-600">{depositError}</div>}
                      {depositStatusMessage && <div className="text-sm text-emerald-600">{depositStatusMessage}</div>}
                      <button
                        onClick={handleDepositPayment}
                        disabled={depositLoading}
                        className="w-full mt-2 rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {depositLoading ? 'Starting payment...' : `Pay Now via ${depositMethod === 'paystack' ? 'Paystack' : 'Flutterwave'}`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] mb-8">
                <div className="rounded-[28px] bg-white border border-slate-200 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                  <div className="text-lg font-semibold mb-1">Withdraw Funds</div>
                  <div className="text-sm text-slate-500 mb-6">Send money to your Nigerian bank.</div>

                  <div className="grid gap-4">
                    <div>
                      <label htmlFor="withdraw-amount" className="text-sm font-medium text-slate-700">Amount (NGN)</label>
                      <input
                        id="withdraw-amount"
                        name="withdrawAmount"
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        placeholder="₦0.00"
                        className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-3xl bg-slate-50 text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="withdraw-bank" className="text-sm font-medium text-slate-700">Bank Name</label>
                      <select
                        id="withdraw-bank"
                        name="withdrawBank"
                        value={withdrawBank}
                        onChange={e => setWithdrawBank(e.target.value)}
                        className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-3xl bg-white text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
                      >
                        <option value="">Select a bank</option>
                        {NIGERIAN_BANKS.map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="withdraw-account-name" className="text-sm font-medium text-slate-700">Account Holder Name</label>
                      <input
                        id="withdraw-account-name"
                        name="withdrawAccountName"
                        value={withdrawAccountName}
                        onChange={e => setWithdrawAccountName(e.target.value)}
                        placeholder="Full name"
                        className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-3xl bg-slate-50 text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="withdraw-account-number" className="text-sm font-medium text-slate-700">Account Number</label>
                      <input
                        id="withdraw-account-number"
                        name="withdrawAccountNumber"
                        value={withdrawAccountNumber}
                        onChange={e => setWithdrawAccountNumber(e.target.value)}
                        placeholder="10-digit NUBAN"
                        className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-3xl bg-slate-50 text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-200 outline-none"
                      />
                    </div>

                    {withdrawError && <div className="text-sm text-rose-600">{withdrawError}</div>}
                    {withdrawSuccess && <div className="text-sm text-emerald-600">{withdrawSuccess}</div>}

                    <button
                      onClick={handleWithdraw}
                      className="w-full mt-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Withdraw to Bank
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl pt-8">
            <div className="mb-9 text-3xl font-semibold tracking-tight sm:text-5xl">Profile</div>

            {!currentUser ? (
              <div className="bg-white border rounded-3xl p-8 text-center">
                <p className="text-lg text-slate-600 mb-6">Sign in to view and manage your profile.</p>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    navigate(LOGIN_PATH);
                  }}
                  className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-8 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Sign in / Register
                </button>
              </div>
            ) : (
              <div className="rounded-3xl border bg-white p-4 sm:p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center mb-9">
                  <div className="relative">
                    <img src={profilePhoto || currentUserSafe.avatar} alt="" width="96" height="96" decoding="async" className="w-24 h-24 rounded-3xl ring-4 ring-slate-100 object-cover" />
                    <label className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-2 rounded-full border border-white cursor-pointer hover:bg-slate-800 transition">
                      <Upload className="w-4 h-4" />
                      <input id="profile-photo-upload" name="profilePhoto" type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" />
                    </label>
                  </div>
                <div>
                  <div className="text-4xl tracking-tight font-semibold">{currentUserSafe.name}</div>
                  <div className="text-slate-500 mt-1">{currentUserSafe.email}</div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <div className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium uppercase tracking-[1px]">{currentUserSafe.role}</div>
                    <div className={`inline-block px-4 py-1 rounded-full text-xs font-medium uppercase tracking-[1px] ${getVerificationStatus(currentUserSafe).pillClass}`}>
                      {getVerificationStatus(currentUserSafe).label}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {currentUserSafe.role === 'seller' && (
                  <>
                    <div>
                      <label htmlFor="profile-business-name" className="text-sm font-medium text-slate-500">Business Name</label>
                      <input id="profile-business-name" name="businessName" type="text" autoComplete="organization" value={profileForm.businessName ?? currentUserSafe.businessName ?? ''} onChange={e => setProfileForm(prev => ({ ...prev, businessName: e.target.value }))} className="w-full mt-1.5 border px-5 py-3 rounded-2xl" placeholder="Your business name" />
                    </div>
                    <div>
                      <label htmlFor="profile-description" className="text-sm font-medium text-slate-500">Description</label>
                      <textarea id="profile-description" name="description" value={profileForm.description ?? currentUserSafe.description ?? ''} onChange={e => setProfileForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full mt-1.5 border px-5 py-3 rounded-3xl" placeholder="Tell buyers about your store..." />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="profile-phone" className="text-sm font-medium text-slate-500">Phone</label>
                        <input
                          id="profile-phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="Enter your phone number"
                          value={profileForm.phone ?? currentUserSafe.phone ?? ''}
                          onChange={e => setProfileForm(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                          className="mt-1.5 w-full border px-5 py-3 rounded-2xl"
                        />
                      </div>
                      <div><label htmlFor="profile-seller-location" className="text-sm font-medium text-slate-500">Location</label><input id="profile-seller-location" name="sellerLocation" autoComplete="address-level1" value={normalizeListingLocation(profileForm.sellerLocation) ?? normalizeListingLocation(currentUserSafe.sellerLocation) ?? ''} onChange={e => setProfileForm(prev => ({ ...prev, sellerLocation: e.target.value }))} className="mt-1.5 w-full border px-5 py-3 rounded-2xl" /></div>
                    </div>
                  </>
                )}

                {currentUserSafe.role === 'buyer' && (
                  <div><label htmlFor="profile-location" className="text-sm font-medium text-slate-500">Location</label><input id="profile-location" name="location" autoComplete="address-level1" value={normalizeListingLocation(profileForm.location) ?? normalizeListingLocation(currentUserSafe.location) ?? ''} onChange={e => setProfileForm(prev => ({ ...prev, location: e.target.value }))} className="mt-1.5 w-full border px-5 py-3 rounded-2xl" /></div>
                )}

                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={updateProfile}
                    disabled={profileSaving}
                    aria-busy={profileSaving}
                    aria-disabled={profileSaving}
                    className={`inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-3xl font-medium text-white ${profileSaving ? 'bg-slate-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}
                  >
                    {profileSaving && <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-r-transparent animate-spin" aria-hidden="true" />}
                    {profileSaving ? 'Saving…' : 'Save Profile Changes'}
                  </button>
                  <button onClick={() => setShowChangePasswordModal(true)} className="px-6 py-3.5 border border-slate-300 text-slate-700 rounded-3xl font-medium">Change Password</button>
                  <button onClick={() => setShowDeleteAccountModal(true)} className="px-6 py-3.5 border border-rose-300 text-rose-600 rounded-3xl font-medium">Delete Account</button>
                  {currentUserSafe.verificationRequestStatus === 'pending' && !currentUserSafe.verified && (
                    <button onClick={payVerificationFee} disabled={verifyingUserId === currentUserSafe.id} className="px-6 py-3.5 bg-emerald-600 text-white rounded-3xl font-medium disabled:opacity-60">
                      {verifyingUserId === currentUserSafe.id ? 'Processing…' : 'Complete Payment'}
                    </button>
                  )}
                  <button onClick={() => {
                    setReportForm(prev => ({
                      ...prev,
                      reportedUserId: users.find(u => u.id !== currentUserSafe.id)?.id || '',
                      reportedUserName: users.find(u => u.id !== currentUserSafe.id)?.name || '',
                      reportedRole: users.find(u => u.id !== currentUserSafe.id)?.role || 'buyer',
                    }));
                    setShowReportModal(true);
                  }} className="px-6 py-3.5 border border-amber-400 text-amber-700 rounded-3xl font-medium">Report a user</button>
                </div>
                {showChangePasswordModal && (
                  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-semibold">Change Password</div>
                        <button onClick={() => { setShowChangePasswordModal(false); setChangePasswordMessage(null); setChangePasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }} className="text-slate-500">✕</button>
                      </div>
                      <div className="space-y-3">
                        <input type="password" placeholder="Current password" value={changePasswordForm.oldPassword} onChange={e => setChangePasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))} className="w-full border px-4 py-3 rounded-2xl" />
                        <input type="password" placeholder="New password" value={changePasswordForm.newPassword} onChange={e => setChangePasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} className="w-full border px-4 py-3 rounded-2xl" />
                        <input type="password" placeholder="Confirm new password" value={changePasswordForm.confirmPassword} onChange={e => setChangePasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))} className="w-full border px-4 py-3 rounded-2xl" />
                        {changePasswordMessage && <div className="text-sm text-rose-600">{changePasswordMessage}</div>}
                        <button onClick={submitChangePassword} disabled={changePasswordLoading} className="w-full rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                          {changePasswordLoading ? 'Saving...' : 'Update Password'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showDeleteAccountModal && (
                  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-semibold">Delete Account</div>
                        <button onClick={() => { setShowDeleteAccountModal(false); setDeleteReason(''); }} className="text-slate-500">✕</button>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600">Tell the admin why you want to delete your account. This request will be reviewed before it is removed.</p>
                        <textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)} rows={5} placeholder="Write your reason here..." className="w-full border px-4 py-3 rounded-2xl" />
                        <button onClick={requestAccountDeletion} disabled={deleteAccountLoading} className="w-full rounded-3xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                          {deleteAccountLoading ? 'Sending...' : 'Send Request to Admin'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!currentUserSafe.verified && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="font-medium mb-2">Verification fee</div>
                    {currentUserSafe.verificationRequestStatus === 'pending' ? (
                      <div className="space-y-2">
                        <div>Admin has requested <span className="font-semibold">{currentUserSafe.verificationBadgeType === 'verified_seller' ? 'Verified Seller' : 'Active Member'}</span> verification. Pay <span className="font-semibold">₦{currentUserSafe.verificationFee || verificationAmount}</span> to complete it.</div>
                        <div className="text-xs text-slate-500">Once payment clears, your verification badge will be applied automatically.</div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">Await admin verification request to set your badge type and payment amount before you can pay.</div>
                    )}
                    <div className="mt-3 text-xs text-slate-500">Payment is deducted from your wallet and your verification is approved automatically.</div>
                    {verificationMessage && <div className="mt-3 text-emerald-600">{verificationMessage}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

            {/* Seller Stats */}
            {currentUserSafe.role === 'seller' && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-white border rounded-3xl"><div className="text-xs text-slate-400">ACTIVE LISTINGS</div><div className="text-5xl font-semibold mt-1">{myListings.length}</div></div>
                <div className="p-6 bg-white border rounded-3xl"><div className="text-xs text-slate-400">AVERAGE RATING</div><div className="text-5xl font-semibold mt-1">{getSellerRating(currentUserSafe.id).avg || '—'}<span className="text-xl align-super">/5</span></div></div>
                <div className="p-6 bg-white border rounded-3xl"><div className="text-xs text-slate-400">TOTAL REVIEWS</div><div className="text-5xl font-semibold mt-1">{getSellerRating(currentUserSafe.id).count}</div></div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN DASHBOARD */}
        {activeTab === 'admin' && currentUserSafe.role === 'admin' && (
          <div className="pt-8">
            <div className="flex justify-between mb-8">
              <div className="text-3xl font-semibold tracking-tight sm:text-5xl">Admin Dashboard</div>
              <div className="text-right text-xs text-slate-500">Platform Overview</div>
            </div>

            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border bg-white p-4 sm:p-6"><div className="text-sm text-emerald-600">USERS</div><div className="text-4xl font-semibold sm:text-6xl">{users.length}</div></div>
              <div className="rounded-3xl border bg-white p-4 sm:p-6"><div className="text-sm text-emerald-600">LISTINGS</div><div className="text-4xl font-semibold sm:text-6xl">{listings.length}</div></div>
              <div className="rounded-3xl border bg-white p-4 sm:p-6"><div className="text-sm text-emerald-600">ORDERS</div><div className="text-4xl font-semibold sm:text-6xl">{orders.length}</div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="bg-white border p-6 rounded-3xl"><div className="text-emerald-600 text-sm">TOTAL DEPOSITS</div><div className="font-semibold text-4xl mt-2">₦{adminRevenue.deposits.toLocaleString()}</div></div>
              <div className="bg-white border p-6 rounded-3xl"><div className="text-rose-600 text-sm">TOTAL WITHDRAWALS</div><div className="font-semibold text-4xl mt-2">₦{adminRevenue.withdrawals.toLocaleString()}</div></div>
            </div>

            {/* Users Table */}
            <div className="mb-9">
              {deletionRequests.length > 0 && (
                <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="font-semibold">Deletion Requests</div>
                      <div className="text-sm text-slate-500">Review account deletion requests from users.</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {deletionRequests.map(request => (
                      <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-medium text-slate-900">{request.userName}</div>
                          <div className="text-sm text-slate-500">{request.reason}</div>
                          <div className="text-xs text-slate-400">{new Date(request.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${request.status === 'pending' ? 'bg-amber-100 text-amber-700' : request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                            {request.status === 'pending' ? 'Pending' : request.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                          {request.status === 'pending' && (
                            <>
                              <button onClick={() => reviewDeletionRequest(request.id, 'approve')} className="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Approve</button>
                              <button onClick={() => reviewDeletionRequest(request.id, 'reject')} className="rounded-2xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Reject</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 px-1">
                <div className="font-semibold">Users</div>
                <div className="w-full sm:w-auto">
                  <label htmlFor="admin-user-search" className="sr-only">Search users</label>
                  <input
                    id="admin-user-search"
                    type="search"
                    placeholder="Search by name or email"
                    value={adminUserSearch}
                    onChange={e => setAdminUserSearch(e.target.value)}
                    className="w-full sm:w-80 border rounded-3xl px-4 py-3 text-sm"
                  />
                </div>
              </div>
              {selectedAdminUserIds.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  <span className="mr-2 text-sm font-medium">{selectedAdminUserIds.length} selected</span>
                  <button onClick={() => runBulkAdminAction('approve')} className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Approve</button>
                  <button onClick={() => runBulkAdminAction('request')} className="rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-white">Send request</button>
                  <button onClick={() => runBulkAdminAction('remove')} className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white">Remove</button>
                  <button onClick={() => setSelectedAdminUserIds([])} className="rounded-full bg-white px-3 py-2 text-xs text-slate-700">Clear</button>
                </div>
              )}
              {adminVerificationTargetId && (
                <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Configure verification request</div>
                      <div className="text-slate-500 text-xs">Select badge type and set the fee for the selected user.</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_0.7fr_0.7fr] gap-3 w-full sm:w-auto">
                      <select value={adminVerificationBadgeType} onChange={e => setAdminVerificationBadgeType(e.target.value as 'active_member' | 'verified_seller')} className="border rounded-2xl px-4 py-3 bg-white text-sm">
                        <option value="active_member">Active Member</option>
                        <option value="verified_seller">Verified Seller</option>
                      </select>
                      <input type="number" min={1000} value={adminVerificationFee} onChange={e => setAdminVerificationFee(e.target.value)} className="border rounded-2xl px-4 py-3 text-sm" placeholder="Fee" />
                      <button onClick={() => {
                        const selectedUser = users.find(u => u.id === adminVerificationTargetId);
                        if (!selectedUser) return;
                        void adminRequestVerification(selectedUser, adminVerificationBadgeType)
                          .then(() => setAdminVerificationTargetId(''))
                          .catch((error: any) => addNotification(error?.response?.data?.error || 'Unable to send verification request.', 'error'));
                      }} className="rounded-3xl bg-emerald-600 text-white px-4 py-3 text-sm">Apply</button>
                      <button onClick={() => setAdminVerificationTargetId('')} className="rounded-3xl bg-slate-200 text-slate-700 px-4 py-3 text-sm">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border rounded-3xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-slate-500"><th className="p-5"><input type="checkbox" aria-label="Select all users" checked={users.length > 0 && selectedAdminUserIds.length === users.length} onChange={e => setSelectedAdminUserIds(e.target.checked ? users.map(user => user.id) : [])} /></th><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.filter(user => {
                      const query = adminUserSearch.trim().toLowerCase();
                      if (!query) return true;
                      return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.role.toLowerCase().includes(query);
                    }).map(user => (
                      <tr key={user.id} className="border-b last:border-none">
                        <td className="p-5"><input type="checkbox" aria-label={`Select ${user.name}`} checked={selectedAdminUserIds.includes(user.id)} onChange={e => setSelectedAdminUserIds(prev => e.target.checked ? [...prev, user.id] : prev.filter(id => id !== user.id))} /></td>
                        <td className="flex items-center gap-3"><img src={user.avatar} className="w-8 h-8 rounded-xl" />{user.name}</td>
                        <td className="text-slate-500">{user.email}</td>
                        <td><span className="px-3 py-px text-xs rounded-full bg-slate-100 font-medium capitalize">{user.role}</span></td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className={`px-3 py-px text-xs rounded-full font-medium w-fit ${user.verified || user.verificationRequestStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {user.verified || user.verificationRequestStatus === 'approved' ? 'Approved' : user.verificationRequestStatus === 'pending' ? 'Pending Payment' : 'Unverified'}
                            </span>
                            <span className="text-[11px] text-slate-500">{user.verificationRequestStatus === 'pending' ? `${user.verificationBadgeType === 'verified_seller' ? 'Verified Seller' : 'Active Member'} • ₦${user.verificationFee}` : user.verificationLevel || (user.verificationRequestStatus === 'approved' ? 'approved' : 'unverified')}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2 items-center">
                            <button onClick={() => setAdminVerificationTargetId(user.id)} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200" title="Set verification fee and badge">
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleAdminApprove(user)} disabled={verifyingUserId === user.id || user.verified} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs disabled:opacity-60">{verifyingUserId === user.id ? 'Processing…' : user.verified ? 'Verified' : 'Approve'}</button>
                            <button onClick={() => adminDeleteUser(user.id)} className="text-red-500 text-xs">Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Listings Table */}
            <div className="mb-9">
              <div className="font-semibold mb-4 px-1">All Listings</div>
              <div className="bg-white border rounded-3xl overflow-hidden text-sm">
                {listings.map(listing => (
                  <div key={listing.id} className="flex justify-between items-center px-6 py-4 border-b last:border-none">
                    <div>{listing.title} <span className="text-slate-400">— {listing.sellerName}</span></div>
                    <div className="flex gap-4 items-center"><span className="font-medium">₦{listing.price}</span><button onClick={() => adminDeleteListing(listing.id)} className="text-red-500 text-xs">Delete</button></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reports Table */}
            <div className="mb-9">
              <div className="font-semibold mb-4 px-1">Reports & Complaints</div>
              <div className="bg-white border rounded-3xl overflow-hidden text-sm">
                {reports.length === 0 ? (
                  <div className="p-6 text-slate-500">No reports have been submitted yet.</div>
                ) : reports.map(report => (
                  <div key={report.id} className="flex flex-col md:flex-row justify-between gap-3 px-6 py-4 border-b last:border-none">
                    <div>
                      <div className="font-medium">{report.subject}</div>
                      <div className="text-slate-400 mt-1">{report.type === 'complaint' ? 'Complaint' : 'Report'} for {report.reportedUserName} • by {report.reporterName}</div>
                      <div className="text-slate-500 mt-2 text-xs">{report.details}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wide ${report.status === 'pending' ? 'bg-amber-100 text-amber-700' : report.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{report.status}</span>
                      {report.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => adminResolveReport(report.id, 'resolved')} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs">Resolve</button>
                          <button onClick={() => adminResolveReport(report.id, 'dismissed')} className="px-3 py-1.5 rounded-full bg-slate-700 text-white text-xs">Dismiss</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Assistant */}
            <div className="mb-9">
              <div className="font-semibold mb-4 px-1">Admin AI Assistant</div>
              <div className="bg-white border rounded-3xl p-6 grid gap-6 lg:grid-cols-[1.1fr_1.5fr]">
                <div className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-2">Select User</div>
                    <select value={assistantTargetUserId} onChange={e => setAssistantTargetUserId(e.target.value)} className="w-full border rounded-3xl px-4 py-3 text-sm">
                      <option value="">Choose a user</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name} — {user.role} — {user.verified ? 'verified' : 'unverified'}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-2">Select Report</div>
                    <select value={assistantTargetReportId} onChange={e => setAssistantTargetReportId(e.target.value)} className="w-full border rounded-3xl px-4 py-3 text-sm">
                      <option value="">Choose a report</option>
                      {reports.map(report => (
                        <option key={report.id} value={report.id}>{report.subject} — {report.type} — {report.status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="assistant-prompt" className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-2 block">Ask the assistant</label>
                    <textarea id="assistant-prompt" value={assistantPrompt} onChange={e => setAssistantPrompt(e.target.value)} className="w-full border rounded-3xl px-4 py-3 text-sm min-h-[112px]" />
                  </div>

                  <button onClick={runAdminAssistant} disabled={assistantLoading || (!assistantTargetUserId && !assistantTargetReportId)} className="w-full inline-flex items-center justify-center rounded-3xl bg-slate-900 text-white px-5 py-4 text-sm font-semibold disabled:opacity-60">
                    {assistantLoading ? 'Analyzing…' : 'Ask AI for recommendation'}
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 flex flex-col">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-4">Assistant output</div>
                  <div className="flex-1 text-sm text-slate-700 overflow-y-auto whitespace-pre-line">
                    {assistantLoading ? 'The assistant is reviewing the selected data. Please wait...' : assistantResponse ? assistantResponse : 'Select a user or report and ask the AI assistant for guidance on verification or complaint review.'}
                  </div>
                  <div className="mt-5 grid gap-3">
                    {assistantTargetUserId && users.find(u => u.id === assistantTargetUserId) && (
                      <button onClick={() => {
                        const selected = users.find(u => u.id === assistantTargetUserId);
                        if (selected) adminVerifyMembership(selected);
                      }} className="w-full py-3 rounded-3xl bg-emerald-600 text-white text-sm font-medium">Approve Selected User</button>
                    )}
                    {assistantTargetReportId && reports.find(r => r.id === assistantTargetReportId && r.status === 'pending') && (
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => adminResolveReport(assistantTargetReportId, 'resolved')} className="py-3 rounded-3xl bg-emerald-600 text-white text-sm font-medium">Resolve Report</button>
                        <button onClick={() => adminResolveReport(assistantTargetReportId, 'dismissed')} className="py-3 rounded-3xl bg-slate-700 text-white text-sm font-medium">Dismiss Report</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div>
              <div className="font-semibold mb-4 px-1">Recent Orders</div>
              <div className="bg-white border rounded-3xl overflow-hidden text-sm">
                {orders.map(order => (
                  <div key={order.id} className="flex flex-col md:flex-row justify-between gap-3 px-6 py-4 border-b last:border-none">
                    <div>
                      <div className="font-medium">{order.listingTitle}</div>
                      <div className="text-slate-400 mt-1">Buyer {order.buyerName} • Seller {order.sellerName}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-xs uppercase tracking-wide">{order.status}</span>
                      <span className="font-medium">₦{order.price}</span>
                      {order.status === 'disputed' && (
                        <div className="flex gap-2">
                          <button onClick={() => adminResolveDispute(order.id, 'approve')} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs">Approve</button>
                          <button onClick={() => adminResolveDispute(order.id, 'reject')} className="px-3 py-1.5 rounded-full bg-amber-600 text-white text-xs">Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
            </>
          } />
        </Routes>

        {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t py-1 z-50 flex justify-around">
        {[
          { id: 'discover', label: 'Home', icon: Home },
          { id: 'messages', label: 'Chat', icon: MessageCircle },
          { id: 'activity', label: 'Orders', icon: ShoppingBag },
          { id: 'transactions', label: 'History', icon: CreditCard },
          { id: 'wallet', label: 'Wallet', icon: Wallet },
          { id: 'profile', label: 'Me', icon: User },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => navigateTo(t.id as any)} className={`flex flex-col items-center py-2 text-xs ${activeTab === t.id ? 'text-slate-950' : 'text-slate-400'}`}>
              <Icon className="w-5 h-5 mb-px" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8">
            <div className="font-semibold text-3xl mb-3 tracking-tight">Confirm Order</div>
            <div className="text-sm text-slate-600 mb-7">You are requesting to purchase: <span className="font-semibold text-black">{showOrderModal.title}</span></div>
            
            <div className="mb-7"><div className="text-xs text-slate-500">TOTAL</div><div className="text-5xl font-semibold tabular-nums mt-px">₦{showOrderModal.price * Math.max(1, orderQuantity)}</div></div>

            <div className="grid gap-4 mb-4">
              <div>
                <label htmlFor="order-quantity" className="text-sm font-medium text-slate-700">Quantity</label>
                <input id="order-quantity" name="orderQuantity" type="number" min="1" value={orderQuantity} onChange={(e) => setOrderQuantity(Math.max(1, Number(e.target.value) || 1))} className="w-full mt-2 px-4 py-3 border rounded-2xl" />
              </div>
              <div>
                <label htmlFor="order-color" className="text-sm font-medium text-slate-700">Preferred color</label>
                <select id="order-color" name="orderColor" value={orderColor} onChange={(e) => setOrderColor(e.target.value)} className="w-full mt-2 px-4 py-3 border rounded-2xl">
                  {['Black','White','Red','Blue','Green','Silver','Gold','Multicolor'].map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <label htmlFor="order-notes" className="sr-only">Order notes</label>
            <textarea id="order-notes" name="orderNotes" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder="Notes for seller (optional)" className="w-full p-5 border rounded-3xl h-20 text-sm" />

            <div className="flex gap-4 mt-7">
              <button onClick={() => setShowOrderModal(null)} className="flex-1 py-3.5 border rounded-3xl">Cancel</button>
              <button onClick={confirmOrder} className="flex-1 py-3.5 bg-emerald-600 text-white rounded-3xl font-medium">Send Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Order request sent modal */}
      {orderRequestSent && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8">
            <div className="font-semibold text-3xl mb-3 tracking-tight">Request sent</div>
            <p className="text-sm leading-6 text-slate-600">
              Your request for <span className="font-semibold text-slate-900">{orderRequestSent.title}</span> has been sent to {orderRequestSent.sellerName}.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">Would you like to message the seller about your request?</p>

            <div className="flex gap-4 mt-7">
              <button
                type="button"
                onClick={() => {
                  setOrderRequestSent(null);
                  navigateTo('discover');
                }}
                className="flex-1 py-3.5 border border-slate-200 rounded-3xl text-slate-700"
              >
                Back to discover
              </button>
              <button
                type="button"
                onClick={() => {
                  const listing = orderRequestSent;
                  setOrderRequestSent(null);
                  loadChat({
                    otherUserId: listing.sellerId,
                    otherUserName: listing.sellerName,
                    listingId: listing.id,
                    listingTitle: listing.title,
                  });
                }}
                className="flex-1 py-3.5 bg-emerald-600 text-white rounded-3xl font-medium"
              >
                Message seller
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
          <div className="bg-white p-9 rounded-3xl w-full max-w-sm">
            <div className="font-semibold text-2xl tracking-tight">Checkout</div>
            <div className="my-6 text-center">
              <div className="font-medium">{showPaymentModal.listingTitle}</div>
              <div className="text-6xl font-semibold mt-4 tabular-nums">₦{showPaymentModal.price}</div>
            </div>
            <div className="text-sm text-center text-emerald-600 mb-6">Wallet Payment Only</div>

            <div className="space-y-3 mb-8">
                <div className="text-sm text-center">Your wallet balance: <span className="font-semibold">₦{(currentUserSafe.walletBalance || 0).toLocaleString()}</span></div>
                <div className="text-xs text-slate-500 text-center">This platform currently supports wallet payments only. Please deposit to your wallet to complete this purchase.</div>
            </div>

              <div className="space-y-4">
                <button onClick={() => openPaymentConfirm(showPaymentModal)} disabled={(currentUserSafe.walletBalance || 0) < showPaymentModal.price} className="w-full py-4 bg-emerald-600 text-white rounded-3xl font-medium disabled:cursor-not-allowed disabled:bg-slate-300">Pay with Wallet</button>
                <button onClick={() => openConfirmModal('Cancel Payment', 'Cancel this payment and close checkout?', () => handleCancelPayment(showPaymentModal))} className="w-full py-4 border border-slate-300 text-slate-700 rounded-3xl font-medium">Cancel Payment</button>
              </div>
              {(currentUserSafe.walletBalance || 0) < showPaymentModal.price && (
                <div className="text-xs text-rose-500 mt-3">Not enough wallet balance to complete this purchase.</div>
              )}
          </div>
        </div>
      )}

      {fulfillmentOrder && (
        <div className="fixed inset-0 bg-black/60 z-[82] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md">
            <div className="font-semibold text-2xl tracking-tight">Choose fulfillment</div>
            <p className="mt-2 text-sm text-slate-600">Your payment is held securely. Select how you want to receive this order.</p>
            <div className="grid gap-3 mt-7">
              <button onClick={() => void selectFulfillment(fulfillmentOrder, 'meetup')} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left hover:border-emerald-500">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <span><strong className="block">Pickup from seller</strong><small className="text-slate-500">Message the seller to arrange a time and location.</small></span>
              </button>
              <button onClick={() => void selectFulfillment(fulfillmentOrder, 'shipping')} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left hover:border-emerald-500">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
                <span><strong className="block">Delivery</strong><small className="text-slate-500">Continue with the external delivery provider.</small></span>
              </button>
            </div>
            <button onClick={() => setFulfillmentOrder(null)} className="mt-6 w-full rounded-3xl border border-slate-300 py-3 text-sm">Decide later</button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-[85] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8">
            <div className="text-3xl font-semibold mb-4">{confirmTitle}</div>
            <div className="text-slate-600 mb-8">{confirmMessage}</div>
            <div className="flex gap-4">
              <button onClick={closeConfirmModal} className="flex-1 py-3 border rounded-3xl">Cancel</button>
              <button onClick={() => { closeConfirmModal(); confirmAction(); }} className="flex-1 py-3 bg-emerald-600 text-white rounded-3xl">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {transactionDetail && (
        <div className="fixed inset-0 bg-black/60 z-[81] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xl font-semibold">Transaction Details</div>
                <div className="text-xs text-slate-500">{transactionDetail.id}</div>
              </div>
              <button onClick={() => setTransactionDetail(null)} className="text-slate-500 hover:text-slate-900">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-4 text-sm text-slate-600">
              <div><span className="font-medium">Type:</span> {transactionDetail.type}</div>
              <div><span className="font-medium">Amount:</span> ₦{transactionDetail.amount.toFixed(2)}</div>
              <div><span className="font-medium">Status:</span> {transactionDetail.status}</div>
              <div><span className="font-medium">Date:</span> {new Date(transactionDetail.createdAt).toLocaleString()}</div>
              {transactionDetail.details && <div><span className="font-medium">Details:</span> {transactionDetail.details}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[75] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg">
            <div className="font-semibold tracking-tight text-2xl">Report a user</div>
            <div className="text-sm text-slate-600 mt-1 mb-5">Submit a report or complaint to the admin and include the user’s email or phone number for easier follow-up.</div>

            <div className="space-y-4">
              <div>
                <label htmlFor="report-trace-contact" className="text-sm font-medium text-slate-500">Email or phone number</label>
                <input
                  id="report-trace-contact"
                  name="traceContact"
                  type="text"
                  value={reportForm.traceContact}
                  onChange={(e) => setReportForm(prev => ({ ...prev, traceContact: e.target.value }))}
                  placeholder="e.g. user@example.com or +2348012345678"
                  className="w-full mt-1.5 border px-5 py-3 rounded-2xl"
                />
              </div>

              <div>
                <label htmlFor="report-type" className="text-sm font-medium text-slate-500">Type</label>
                <select id="report-type" name="reportType" value={reportForm.type} onChange={(e) => setReportForm(prev => ({ ...prev, type: e.target.value as 'report' | 'complaint' }))} className="w-full mt-1.5 border px-5 py-3 rounded-2xl">
                  <option value="report">Report</option>
                  <option value="complaint">Complaint</option>
                </select>
              </div>

              <div>
                <label htmlFor="report-subject" className="text-sm font-medium text-slate-500">Subject</label>
                <input id="report-subject" name="subject" value={reportForm.subject} onChange={(e) => setReportForm(prev => ({ ...prev, subject: e.target.value }))} placeholder="Brief summary" className="w-full mt-1.5 border px-5 py-3 rounded-2xl" />
              </div>

              <div>
                <label htmlFor="report-details" className="text-sm font-medium text-slate-500">Details</label>
                <textarea id="report-details" name="details" value={reportForm.details} onChange={(e) => setReportForm(prev => ({ ...prev, details: e.target.value }))} placeholder="Explain what happened and why you are reporting this user..." rows={5} className="w-full mt-1.5 border px-5 py-4 rounded-3xl" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowReportModal(false); setReportForm({ reportedUserId: '', reportedUserName: '', reportedRole: 'buyer', traceContact: '', type: 'report', subject: '', details: '' }); }} className="flex-1 py-4 border rounded-3xl">Cancel</button>
              <button onClick={handleSubmitReport} className="flex-1 py-4 bg-amber-600 text-white font-medium rounded-3xl">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-[75] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md">
            <div className="font-semibold tracking-tight text-2xl">Report an issue</div>
            <div className="text-sm text-slate-600 mt-1 mb-5">Tell us what went wrong with this delivery.</div>
            <label htmlFor="dispute-reason" className="sr-only">Dispute reason</label>
            <textarea id="dispute-reason" name="disputeReason" value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Describe the delivery issue or missing item..." rows={4} className="w-full border px-5 py-4 rounded-3xl" />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowDisputeModal(false); setDisputeReason(''); setDisputeOrder(null); }} className="flex-1 py-4 border rounded-3xl">Cancel</button>
              <button onClick={handleRaiseDispute} className="flex-1 py-4 bg-amber-600 text-white font-medium rounded-3xl">Submit Dispute</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[75] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md">
            <div className="font-semibold tracking-tight text-2xl">Rate your experience</div>
            <div className="text-sm text-slate-600 mt-1 mb-7">with {showReviewModal.sellerName}</div>
            
            <div className="flex justify-center gap-1 mb-7">
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setReviewForm({...reviewForm, rating: i})}><Star className={`w-9 h-9 ${i <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} /></button>
              ))}
            </div>

            <label htmlFor="review-comment" className="sr-only">Review comment</label>
            <textarea id="review-comment" name="comment" value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} placeholder="Share your experience with this seller..." rows={4} className="w-full border px-5 py-4 rounded-3xl" />

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowReviewModal(null)} className="flex-1 py-4 border rounded-3xl">Skip</button>
              <button onClick={submitReview} className="flex-1 py-4 bg-slate-900 text-white font-medium rounded-3xl disabled:bg-slate-300" disabled={!reviewForm.comment.trim()}>Submit Review</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-20 right-5 z-[90] flex max-w-sm flex-col gap-2 md:bottom-5">
        {notifications.map(n => (
          <div key={n.id} className="rounded-[24px] border border-slate-200 bg-white px-4 py-3.5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${n.type === 'error' ? 'bg-rose-100 text-rose-600' : n.type === 'warning' ? 'bg-amber-100 text-amber-600' : n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>
                {n.type === 'success' ? '✓' : n.type === 'error' ? '!' : 'i'}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{n.type === 'success' ? 'Success' : n.type === 'error' ? 'Action needed' : 'Update'}</div>
                <div className="mt-0.5 text-sm text-slate-600">{n.message}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Auth Prompt Modal for non-authenticated users */}
      <AuthPromptModal
        isOpen={showAuthPromptModal}
        onClose={() => setShowAuthPromptModal(false)}
        onLogin={() => {
          setShowAuthPromptModal(false);
          navigate(LOGIN_PATH);
        }}
        onRegister={() => {
          setShowAuthPromptModal(false);
          setAuthMode('register');
          navigate(LOGIN_PATH);
        }}
        title={authPromptTitle}
        message={authPromptMessage}
      />
    </MarketplaceShell>
  );
}

export default MarketConnectApp;
