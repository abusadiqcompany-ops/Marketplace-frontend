import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Home, MessageCircle, User, ShoppingBag, Shield, Plus, Search, Filter, Heart, 
  Star, MapPin, Check, X, Send, LogOut, CreditCard, Download, Wallet, Upload,
  Eye, EyeOff, Bell, BellRing, Inbox, Sparkles
} from 'lucide-react';
import { User as UserType, Listing, Message, Order, Review, Role, Transaction, Report, PortalNotification, AccountDeletionRequest, AppNotification, NotificationCategory } from './types';
import {
  signup,
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  createListing,
  changePassword,
  getListings,
  getUsers,
  createOrder,
  getUserOrders,
  acceptOrder,
  shipOrder,
  confirmDelivery,
  cancelOrder,
  raiseDispute,
  payOrderWithWallet,
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
  createAccountDeletionRequest,
  reviewAccountDeletionRequest,
  createReport,
  resolveAdminReport,
  initializeMembershipVerificationPayment,
  deleteAdminUser,
  deleteAdminListing,
  resolveAdminDispute,
  updateProfile as updateProfileApi,
} from './api/client';
import { setOnAuthFailure } from './api/client';
import { getAllStates } from './data/nigerian-locations';
import { NotificationCard } from './components/NotificationCard';
import { MarketplaceShell } from './components/MarketplaceShell';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { NewListingForm, type ListingFormValues } from './components/NewListingForm';

interface ChatConversation {
  chatId?: string;
  otherUserId: string;
  otherUserName: string;
  listingId?: string;
  listingTitle?: string;
}

const CATEGORIES = [
  'Electronics',
  'Fashion',
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

const buildInitialAppNotifications = (): AppNotification[] => {
  const base = new Date();
  return [
    {
      id: 'app-1',
      title: 'Payment ready to confirm',
      description: 'Your order from Emeka Electronics is waiting for final confirmation.',
      message: 'Your order from Emeka Electronics is waiting for final confirmation.',
      type: 'info',
      category: 'payments',
      timestamp: new Date(base.getTime() - 1000 * 60 * 4).toISOString(),
      read: false,
      actionType: 'payment',
    },
    {
      id: 'app-2',
      title: 'New message from Sarah',
      description: 'Sarah shared a quick update about the item you requested.',
      message: 'Sarah shared a quick update about the item you requested.',
      type: 'success',
      category: 'messages',
      timestamp: new Date(base.getTime() - 1000 * 60 * 32).toISOString(),
      read: false,
      actionType: 'message',
    },
    {
      id: 'app-3',
      title: 'Price drop alert',
      description: 'The wireless headset you saved is now 12% cheaper.',
      message: 'The wireless headset you saved is now 12% cheaper.',
      type: 'warning',
      category: 'orders',
      timestamp: new Date(base.getTime() - 1000 * 60 * 90).toISOString(),
      read: true,
      actionType: 'view',
    },
    {
      id: 'app-4',
      title: 'Trending near you',
      description: 'A premium table lamp is moving fast in your area.',
      message: 'A premium table lamp is moving fast in your area.',
      type: 'success',
      category: 'all',
      timestamp: new Date(base.getTime() - 1000 * 60 * 60 * 26).toISOString(),
      read: true,
      actionType: 'view',
    },
  ];
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
    verificationRequestStatus: 'pending',
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<AccountDeletionRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Router state
  const navigate = useNavigate();
  const location = useLocation();
  const LOGIN_PATH = '/login';

  useEffect(() => {
    const hasStoredSession = Boolean(localStorage.getItem('mc_currentUser') && localStorage.getItem('marketplace_access_token'));
    if (!currentUser && !hasStoredSession && location.pathname !== LOGIN_PATH && location.pathname !== '/') {
      navigate('/', { replace: true });
      return;
    }

    if (currentUser && location.pathname === LOGIN_PATH) {
      navigate('/', { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

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
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showChat, setShowChat] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatConversation | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showOrderModal, setShowOrderModal] = useState<Listing | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Order | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<Order | null>(null);
  const [isTyping, setIsTyping] = useState(false);

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
  const prevProfileUserId = useRef<string | null>(null);

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

    if (prevProfileUserId.current === currentUser.id) {
      return;
    }

    prevProfileUserId.current = currentUser.id;
    setProfileForm({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      location: currentUser.location,
      sellerLocation: currentUser.sellerLocation,
      businessName: currentUser.businessName,
      description: currentUser.description,
      avatar: currentUser.avatar,
    });
    setProfilePhoto(currentUser.avatar || '');
  }, [currentUser]);

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
        return JSON.parse(stored) as AppNotification[];
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
      return true;
    });

    setAppNotifications(relevant);
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
    const token = localStorage.getItem('marketplace_access_token');

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

    if (token) {
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

  // Save to localStorage
  useEffect(() => {
    if (currentUser) localStorage.setItem('mc_currentUser', JSON.stringify(currentUser));
    localStorage.setItem('mc_listings', JSON.stringify(listings));
    localStorage.setItem('mc_messages', JSON.stringify(messages));
    localStorage.setItem('mc_orders', JSON.stringify(orders));
    localStorage.setItem('mc_reviews', JSON.stringify(reviews));
    localStorage.setItem('mc_favorites', JSON.stringify(favorites));
    localStorage.setItem('mc_users', JSON.stringify(users));
    localStorage.setItem('mc_transactions', JSON.stringify(transactions));
  }, [currentUser, listings, messages, orders, reviews, favorites, users, transactions]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const liveTemplates = [
        {
          title: '🔥 Trending near you',
          description: 'A popular listing in your area just got fresh interest.',
          type: 'success' as const,
          category: 'all' as const,
          actionType: 'view' as const,
        },
        {
          title: '💰 Pending earnings available',
          description: 'A recent payout is ready for your review.',
          type: 'info' as const,
          category: 'payments' as const,
          actionType: 'payment' as const,
        },
        {
          title: '⚡ Price dropped',
          description: 'The item you saved is now discounted for a limited time.',
          type: 'warning' as const,
          category: 'orders' as const,
          actionType: 'view' as const,
        },
      ];

      const nextTemplate = liveTemplates[Math.floor(Math.random() * liveTemplates.length)];
      const nextNotification: AppNotification = {
        id: `live-${Date.now()}`,
        title: nextTemplate.title,
        description: nextTemplate.description,
        message: nextTemplate.description,
        type: nextTemplate.type,
        category: nextTemplate.category,
        timestamp: new Date().toISOString(),
        read: false,
        actionType: nextTemplate.actionType,
      };

      setAppNotifications(prev => [nextNotification, ...prev].slice(0, 12));
      addNotification(nextTemplate.description, nextTemplate.type);
    }, 18000);

    return () => window.clearInterval(interval);
  }, []);

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
      if (!authInitialized || !currentUser) {
        setUsers([]);
        return;
      }

      try {
        const remoteUsers = await getUsers();
        if (Array.isArray(remoteUsers)) {
          setUsers(remoteUsers as UserType[]);
        }
      } catch (error) {
        console.warn('Unable to load users for reporting.', error);
      }
    };

    loadUsers();
  }, [authInitialized, currentUser?.id]);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!authInitialized || !currentUser || currentUser.role !== 'admin') return;

      try {
        const [remoteUsers, remoteListings, remoteOrders, remoteReports, remoteDeletionRequests] = await Promise.all([
          getAdminUsers(),
          getAdminListings(),
          getAdminOrders(),
          getAdminReports(),
          getAdminAccountDeletionRequests(),
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
      } catch (error) {
        console.warn('Unable to load admin dashboard data.', error);
      }
    };

    loadAdminData();
  }, [authInitialized, currentUser?.id, currentUser?.role]);

  useEffect(() => {
    const loadOrders = async (user: UserType | null) => {
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
        // only request orders for buyer/seller roles
        if (user.role === 'buyer' || user.role === 'seller') {
          const remoteOrders = await getUserOrders(user.id, user.role);
          setOrders(remoteOrders);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.warn('Unable to load orders from backend.', error);
      }

      try {
        const walletTransactions = await getTransactionHistory(user.id);
        setTransactions(walletTransactions);
      } catch (error) {
        console.warn('Unable to load transaction history from backend.', error);
      }
    };

    loadOrders(currentUser);
  }, [authInitialized, currentUser]);

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
  }, [authInitialized, currentUser]);

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
      const convMap = new Map<string, { ids: Set<string>; names: Map<string, string>; listingId?: string; listingTitle?: string; primaryId: string }>();

      messages.forEach(msg => {
        const chatId = msg.chatId;
        const existing = convMap.get(chatId);
        const listing = listings.find(l => chatId.endsWith(l.id));

        if (!existing) {
          const ids = new Set<string>([msg.senderId]);
          const names = new Map<string, string>([[msg.senderId, msg.senderName]]);
          convMap.set(chatId, {
            ids,
            names,
            listingId: listing?.id,
            listingTitle: listing?.title,
            primaryId: msg.senderId,
          });
          return;
        }

        existing.ids.add(msg.senderId);
        existing.names.set(msg.senderId, msg.senderName);
        if (!existing.listingId && listing) {
          existing.listingId = listing.id;
          existing.listingTitle = listing.title;
        }
      });

      return Array.from(convMap.entries()).map(([chatId, data]) => {
        const participantNames = Array.from(data.ids).map(id => data.names.get(id) || users.find(u => u.id === id)?.name || id);
        return {
          chatId,
          otherUserId: data.primaryId,
          otherUserName: participantNames.join(' ↔ '),
          listingId: data.listingId,
          listingTitle: data.listingTitle,
        };
      });
    }

    const convMap = new Map<string, ChatConversation>();
    
    messages.forEach(msg => {
      const otherId = msg.senderId === currentUser.id ? 
        messages.find(m => m.chatId === msg.chatId && m.senderId !== currentUser.id)?.senderId || '' : msg.senderId;
      
      if (!otherId) return;

      const otherUser = users.find(u => u.id === otherId);
      if (!otherUser) return;

      const chatId = msg.chatId;
      const listing = listings.find(l => l.id === chatId.split('-')[1]);
      
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          otherUserId: otherId,
          otherUserName: otherUser.name,
          listingId: listing?.id,
          listingTitle: listing?.title
        });
      }
    });

    // Also add from orders
    myOrders.forEach(order => {
      const otherId = order.buyerId === currentUser.id ? order.sellerId : order.buyerId;
      if (!convMap.has(otherId)) {
        const other = users.find(u => u.id === otherId);
        if (other) {
          convMap.set(otherId, {
            otherUserId: otherId,
            otherUserName: other.name,
            listingId: order.listingId,
            listingTitle: order.listingTitle
          });
        }
      }
    });

    return Array.from(convMap.values());
  };

  const conversations = getConversations();

  // Load chat messages
  const loadChat = (conv: ChatConversation) => {
    if (!currentUser) return;

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
    setIsTyping(false);
    navigateTo('messages');
  };

  useEffect(() => {
    if (!activeChat || !currentUser) return;

    const chatId = activeChat.chatId || [currentUser.id, activeChat.otherUserId].sort().join('-') + (activeChat.listingId ? `-${activeChat.listingId}` : '');
    const nextMessages = messages
      .filter(message => message.chatId === chatId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    setChatMessages(nextMessages);
  }, [messages, activeChat, currentUser]);

  useEffect(() => {
    const container = document.getElementById('chat-scroll');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // Send message - simulates real-time
  const sendMessage = () => {
    if (!newMessage.trim() || !activeChat || !currentUser || currentUser.role === 'admin') return;

    const chatId = [currentUser.id, activeChat.otherUserId].sort().join('-') + 
                   (activeChat.listingId ? `-${activeChat.listingId}` : '');

    const message: Message = {
      id: 'm' + Date.now(),
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setIsTyping(true);

    if (activeChat.otherUserId !== currentUser.id) {
      window.setTimeout(() => {
        const replies = [
          "Thanks for reaching out! When would you like to meet?",
          "The item is still available. Happy to answer questions.",
          "I can deliver it tomorrow if that works for you.",
          "Great choice! Let me know how I can help.",
          "Sure thing. Can you confirm your location?"
        ];
        const reply: Message = {
          id: 'm' + Date.now() + 1,
          chatId,
          senderId: activeChat.otherUserId,
          senderName: activeChat.otherUserName,
          content: replies[Math.floor(Math.random() * replies.length)],
          timestamp: new Date(Date.now() + 800).toISOString()
        };
        setMessages(prev => [...prev, reply]);
        setIsTyping(false);
        addNotification(`${activeChat.otherUserName} replied to your message`, 'message');
      }, 1200);
    } else {
      window.setTimeout(() => setIsTyping(false), 600);
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

    const persistStored = (storageKey: string, next: PortalNotification[]) => {
      localStorage.setItem(storageKey, JSON.stringify(next));
    };

    setPortalNotifications(prev => {
      const next = [notification, ...prev].slice(0, 25);
      persistStored(sharedStorageKey, next);
      if (targetUserId && targetUserId !== 'all') {
        persistStored(`mc_portal_notifications_${targetUserId}`, next);
      } else {
        persistStored(userStorageKey, next);
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
      const next = [appNotification, ...prev].slice(0, 20);
      localStorage.setItem('mc_app_notifications_all', JSON.stringify(next));
      if (targetUserId && targetUserId !== 'all') {
        localStorage.setItem(`mc_app_notifications_${targetUserId}`, JSON.stringify(next));
      } else {
        localStorage.setItem(userStorageKey.replace('mc_portal_notifications_', 'mc_app_notifications_'), JSON.stringify(next));
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

    addPortalNotification({
      title: 'New verified listing',
      message: `${seller.businessName || seller.name} just published “${listing.title}”. Check it out in the marketplace.`,
      type: 'listing',
      targetUserId: 'all',
      targetRole: 'all',
      relatedUserId: seller.id,
      relatedListingId: listing.id,
    });
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
      const successMessage = response.message || 'Verification codes have been sent to your email and phone number. Please check both to complete verification.';
      setAuthSuccess(successMessage);
      setRegisterForm({ name: '', email: '', password: '', confirmPassword: '', role: 'buyer' });
      setTimeout(() => {
        setCurrentUser(response.user);
        syncNotificationsForCurrentUser(response.user);
        localStorage.setItem('mc_currentUser', JSON.stringify(response.user));
        setAuthSuccess(null);
        navigateTo('discover');
        addNotification('Account created successfully!', 'success');
      }, 1400);
    } catch (error: any) {
      setAuthError(error?.response?.data?.error || error?.message || 'Registration failed.');
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
    setListingForm({ title: '', description: '', price: '', category: CATEGORIES[0], location: LOCATIONS[0], images: [], condition: 'New' });
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

    if (!trimmedTitle) {
      addNotification('Please add a title for your listing.', 'warning');
      return false;
    }

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      addNotification('Please enter a valid price greater than zero.', 'warning');
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
      price: priceNum,
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
        const createdListing = await createListing(
          currentUser.id,
          currentUser.name,
          trimmedTitle,
          trimmedDescription,
          priceNum,
          values.category,
          values.location,
          finalListing.images
        );
        const created = createdListing && createdListing.id ? createdListing : finalListing;
        setListings(prev => [created, ...prev]);
        notifyVerifiedSellerListing(created, currentUser);
        addNotification(editingListing ? 'Listing updated successfully!' : 'Listing published successfully!', 'success');
        setEditingListing(null);
        navigate(`/listing/${created.id}`);
        return true;
      }

      setListings(prev => [finalListing, ...prev]);
      notifyVerifiedSellerListing(finalListing, currentUser);
      addNotification(editingListing ? 'Listing updated locally.' : 'Listing saved locally because backend auth was unavailable.', 'warning');
      setEditingListing(null);
      navigate(`/listing/${finalListing.id}`);
      return true;
    } catch (error: any) {
      console.error('Listing publish failed:', error?.response?.data || error?.message || error);
      setListings(prev => [finalListing, ...prev]);
      notifyVerifiedSellerListing(finalListing, currentUser);
      addNotification(error?.response?.data?.error || error?.message || 'Listing saved locally after a publish error.', 'warning');
      setEditingListing(null);
      navigate(`/listing/${finalListing.id}`);
      return true;
    }
  };

  const openEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setListingForm({
      title: listing.title,
      description: listing.description,
      price: listing.price.toString(),
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

  const deleteListing = (id: string) => {
    if (!confirm('Delete this listing permanently?')) return;
    setListings(prev => prev.filter(l => l.id !== id));
    addNotification('Listing removed', 'success');
  };

  // Contact Seller -> Open Chat
  const contactSeller = (listing: Listing) => {
    if (!currentUser) {
      navigate(LOGIN_PATH);
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
      navigate(LOGIN_PATH);
      return;
    }
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

      const totalAmount = showOrderModal.price * Math.max(1, orderQuantity);
      const createdOrder = await createOrder(
        showOrderModal.id,
        profile.id,
        profile.name,
        showOrderModal.sellerId,
        showOrderModal.sellerName,
        totalAmount,
        showOrderModal.title,
        Math.max(1, orderQuantity),
        orderColor
      );

      setOrders(prev => [{ ...createdOrder, price: totalAmount, quantity: Math.max(1, orderQuantity), color: orderColor }, ...prev]);
      setShowOrderModal(null);
      addNotification('Order request sent! Seller will respond shortly.', 'success');

      const conv: ChatConversation = {
        otherUserId: showOrderModal.sellerId,
        otherUserName: showOrderModal.sellerName,
        listingId: showOrderModal.id,
        listingTitle: showOrderModal.title
      };
      setTimeout(() => loadChat(conv), 600);
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
      <div className="pt-24 max-w-6xl mx-auto px-6 pb-12">
        <button onClick={() => navigate(-1)} className="mb-8 text-sm text-slate-500 hover:text-slate-900">← Back</button>
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200">
          <div className="relative h-72 bg-slate-100 overflow-hidden">
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
          </div>
          <div className="p-8 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
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
                    <img src={seller.avatar} alt={seller.name} className="w-16 h-16 rounded-2xl object-cover" />
                    <div>
                      <div className="text-lg font-semibold">{seller.businessName || seller.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getVerificationStatus(seller).pillClass}`}>
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
                <div className="text-sm uppercase tracking-[0.24em] text-slate-400 mb-4">Price</div>
                <div className="text-5xl font-semibold text-slate-900">₦{listing.price.toLocaleString()}</div>
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

  const SellerProfileRoute = () => {
    const { id } = useParams();
    const seller = users.find(user => user.id === id && user.role === 'seller');

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

    return (
      <div className="pt-24 max-w-7xl mx-auto px-6 pb-12">
        <button onClick={() => navigate(-1)} className="mb-8 text-sm text-slate-500 hover:text-slate-900">← Back</button>
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-8 mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <img src={seller.avatar} alt={seller.name} className="w-24 h-24 rounded-3xl object-cover" />
              <div>
                <div className="text-4xl font-semibold">{seller.businessName || seller.name}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getVerificationStatus(seller).pillClass}`}>
                    {getVerificationStatus(seller).label}
                  </div>
                </div>
                <div className="text-slate-500 mt-2">{seller.description || 'Trusted seller on MarketConnect'}</div>
                <div className="mt-3 text-sm text-slate-500">Location: {normalizeListingLocation(seller.sellerLocation || seller.location)}</div>
                {seller.phone && <div className="text-sm text-slate-500">Contact: {seller.phone}</div>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Listings</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{sellerListings.length}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Rating</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{getSellerRating(seller.id).avg || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Reviews</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{getSellerRating(seller.id).count}</div>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button onClick={() => {
                if (!currentUser) {
                  navigate(LOGIN_PATH);
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
                  navigate(LOGIN_PATH);
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

        <div className="grid gap-6 lg:grid-cols-3">
          {sellerListings.map(listing => (
            <div key={listing.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
              <div className="h-40 overflow-hidden rounded-3xl mb-5">
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
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
    setDepositAmount('');
    setDepositSuccess({ provider, reference, amount });
    setDepositStatusMessage(`Deposit completed locally for ₦${amount.toFixed(2)}.`);
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
      const data = await postWalletDeposit(amount, depositMethod);
      const redirectUrl = data.authorization_url || data.link || data.paymentUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
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
          setStatus('error');
          setMessage('You must be signed in to complete the payment.');
          return;
        }

        const params = new URLSearchParams(location.search);
        const provider = (params.get('provider') || '') as 'paystack' | 'flutterwave';
        const reference = provider === 'paystack' ? params.get('reference') : params.get('tx_ref');
        const verificationType = params.get('type') || params.get('purpose') || '';
        setDepositReference(reference);

        if (!provider || !reference) {
          setStatus('error');
          setMessage('Invalid payment callback parameters.');
          return;
        }

        try {
          if (verificationType === 'membership_verification') {
            if (currentUser) {
              const badgeType = currentUser.verificationBadgeType;
              const level: 'basic' | 'full' = badgeType === 'verified_seller' ? 'full' : 'basic';
              const updatedUser: UserType = {
                ...currentUser,
                verified: true,
                verificationLevel: level,
                verificationRequestStatus: 'approved',
              };
              setCurrentUser(updatedUser);
              setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            }
            setStatus('success');
            setMessage('Verification payment completed. Your account has been updated.');
            return;
          }

          const response = await verifyWalletDeposit(provider, reference);
          if (response.verified) {
            const updatedUser = await getCurrentUser();
            setCurrentUser(updatedUser);
            setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
            const walletTransactions = await getTransactionHistory(currentUser.id);
            setTransactions(walletTransactions);
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
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
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
      await payOrderWithWallet(order.id, currentUser.id);
      const refreshedUser = await getCurrentUser();
      setCurrentUser(refreshedUser);
      setUsers(prev => prev.map(u => (u.id === refreshedUser.id ? refreshedUser : u)));

      const walletTransactions = await getTransactionHistory(currentUser.id);
      setTransactions(walletTransactions);

      const orderRole = currentUser.role === 'seller' ? 'seller' : 'buyer';
      const refreshedOrders = await getUserOrders(currentUser.id, orderRole);
      setOrders(refreshedOrders);

      setShowPaymentModal(null);
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

    if (!reportForm.reportedUserId || !reportForm.subject.trim() || !reportForm.details.trim()) {
      addNotification('Please select a user and fill in the subject and details.', 'error');
      return;
    }

    try {
      const createdReport = await createReport({
        reportedUserId: reportForm.reportedUserId,
        reportedUserName: reportForm.reportedUserName || undefined,
        reportedRole: reportForm.reportedRole,
        type: reportForm.type,
        subject: reportForm.subject.trim(),
        details: reportForm.details.trim(),
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

    if (user.verified) {
      return { label: 'Verified Member', pillClass: 'bg-blue-100 text-blue-700' };
    }

    if (user.verificationRequestStatus === 'pending' || user.verificationRequestStatus === 'approved' || user.verificationBadgeType) {
      const label = user.verificationBadgeType === 'verified_seller' ? 'Verified Seller' : 'Active Member';
      return { label, pillClass: 'bg-amber-100 text-amber-700' };
    }

    return { label: 'Pending Verification', pillClass: 'bg-amber-100 text-amber-700' };
  };

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
        setUsers(prev => prev.filter(user => user.id !== request.userId));
        setListings(prev => prev.filter(listing => listing.sellerId !== request.userId));
        setOrders(prev => prev.filter(order => order.buyerId !== request.userId && order.sellerId !== request.userId));
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
    setVerificationMessage('Preparing payment…');

    try {
      const amount = currentUser.verificationRequestStatus === 'pending' && currentUser.verificationFee
        ? Number(currentUser.verificationFee)
        : Number(verificationAmount || 5000);

      const result = await initializeMembershipVerificationPayment(currentUser.id, amount, verificationProvider);

      if (result?.authorization_url) {
        setVerificationMessage(`Redirecting to Paystack…`);
        window.location.href = result.authorization_url;
        return;
      }

      if (result?.link) {
        setVerificationMessage(`Redirecting to Flutterwave…`);
        window.location.href = result.link;
        return;
      }

      setVerificationMessage('The payment could not be started. Please try again.');
    } catch (error: any) {
      console.error(error);
      setVerificationMessage('Unable to start verification payment.');
      addNotification(error?.response?.data?.error || error?.message || 'Unable to start verification payment.', 'error');
    } finally {
      setVerifyingUserId(null);
    }
  };

  const adminVerifyMembership = async (user: UserType) => {
    if (!user) return;

    setVerifyingUserId(user.id);
    setVerificationMessage('Approving verification…');

    try {
      setUsers(prev => prev.map(item => item.id === user.id ? { ...item, verified: true, verificationLevel: 'basic', verificationRequestStatus: 'approved' } : item));
      setVerificationMessage(`${user.name} has been approved as a verified member.`);
      addPortalNotification({
        title: 'Verification approved',
        message: `Your account has been approved as ${user.verificationBadgeType === 'verified_seller' ? 'Verified Seller' : 'Active Member'}. You can now publish listings and gain more visibility.`,
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
  const ListingCard = ({ listing, showSeller = true }: { listing: Listing; showSeller?: boolean }) => {
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
              <div className="font-semibold text-2xl text-slate-900 tabular-nums">₦{listing.price}</div>
            </div>
          </div>
          
          <h3 className="font-semibold text-lg text-slate-900 leading-tight mb-1.5 line-clamp-2">{listing.title}</h3>
          
          {showSeller && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-3">
              <button type="button" onClick={openSellerProfile} className="font-medium text-slate-700 hover:text-slate-900 underline decoration-slate-200 underline-offset-4">
                {listing.sellerName}
              </button>
              {seller && (
                <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getVerificationStatus(seller).pillClass}`}>
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

  // Main Render
  const navigateTo = (tab: string) => {
    const path = tab === 'discover' ? '/' : `/${tab}`;
    navigate(path);
  };

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
        onTogglePasswordVisibility={() => setShowRegisterPassword((prev) => !prev)}
        onSwitchMode={(mode) => setAuthMode(mode)}
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
      <Routes>
            <Route path="/payment/callback" element={<PaymentCallback />} />
            <Route path="/seller/:id" element={<SellerProfileRoute />} />
                    <Route path="/profile" element={
              <React.Suspense fallback={<div className="pt-24 px-6">Loading profile...</div>}>
                <ProfilePage currentUser={currentUser} onReport={() => {
                  if (!currentUser) {
                    navigate(LOGIN_PATH);
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
            <Route path="/new-listing" element={<NewListingForm editingListing={editingListing} onCancel={() => { setEditingListing(null); navigate('/'); }} onPublish={handleNewListingPublish} />} />
            <Route path="*" element={
              <>
                {/* DISCOVER TAB */}
                {activeTab === 'discover' && (
          <>
            <div className="flex flex-col md:flex-row md:items-end gap-6 pt-8 pb-6">
              <div>
                <div className="text-6xl font-semibold tracking-[-1.5px]">Discover amazing<br />local finds.</div>
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
              <button onClick={() => { setSearchTerm(''); setSelectedCategory(''); setSelectedLocation(''); setPriceRange([0, 50000]); }} className="text-sm text-slate-500">Clear filters</button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.length > 0 ? (
                filteredListings.map(listing => <ListingCard key={listing.id} listing={listing} />)
              ) : (
                <div className="col-span-full py-20 text-center text-slate-400">No listings found matching your filters.</div>
              )}
            </div>
          </>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="pt-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-5xl font-semibold tracking-tight">Messages</div>
                <p className="text-slate-600 mt-1">Connect directly with buyers and sellers</p>
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-6">
              {/* Conversations Sidebar */}
              <div className="md:col-span-4 bg-white border rounded-3xl overflow-hidden h-[620px]">
                <div className="p-5 border-b text-sm font-medium">Conversations ({conversations.length})</div>
                {conversations.length > 0 ? conversations.map((conv, idx) => (
                  <button key={idx} onClick={() => loadChat(conv)} className="w-full px-5 py-4 text-left flex gap-4 hover:bg-slate-50 border-b last:border-none transition group">
                    <div className="w-10 h-10 bg-slate-200 rounded-2xl overflow-hidden flex-shrink-0"><img src={users.find(u => u.id === conv.otherUserId)?.avatar} className="object-cover w-full h-full" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex justify-between items-baseline">
                        {conv.otherUserName}
                        {conv.listingTitle && <span className="font-normal text-xs text-emerald-600 truncate max-w-[120px]"> • {conv.listingTitle}</span>}
                      </div>
                      <div className="text-sm text-slate-500 truncate">Tap to chat</div>
                    </div>
                  </button>
                )) : <div className="p-8 text-sm text-center text-slate-400">Start messaging by contacting sellers from listings.</div>}
              </div>

              {/* Chat Window */}
              <div className="md:col-span-8 bg-white border rounded-3xl overflow-hidden flex flex-col h-[620px]">
                {showChat && activeChat ? (
                  <>
                    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            <img src={users.find(u => u.id === activeChat.otherUserId)?.avatar} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{activeChat.otherUserName}</div>
                            <div className="flex items-center gap-1 text-xs text-emerald-600">
                              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600"></div>
                              Online
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {activeChat.listingTitle && <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{activeChat.listingTitle}</div>}
                          <button onClick={() => { setShowChat(false); setActiveChat(null); }} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#f1f5f9_100%)] p-4 sm:p-6" id="chat-scroll">
                      <div className="mx-auto flex max-w-3xl flex-col gap-3">
                        {chatMessages.length > 0 ? chatMessages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.senderId === currentUserSafe.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${msg.senderId === currentUserSafe.id ? 'rounded-br-md bg-slate-900 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}>
                              <div className={`mb-1 text-[11px] font-medium uppercase tracking-[0.2em] ${msg.senderId === currentUserSafe.id ? 'text-slate-300' : 'text-slate-400'}`}>{msg.senderName}</div>
                              {msg.content}
                            </div>
                          </div>
                        )) : <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-400">Start the conversation...</div>}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-3xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                              {activeChat?.otherUserName || 'The other person'} is typing...
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {currentUserSafe.role !== 'admin' ? (
                      <div className="border-t border-slate-200 bg-white p-4">
                        <div className="mx-auto flex max-w-3xl gap-3">
                          <label htmlFor="chat-message" className="sr-only">Send a message</label>
                          <input id="chat-message" name="message" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type your message..." className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white" />
                          <button onClick={sendMessage} className="flex items-center rounded-3xl bg-emerald-600 px-6 py-3 text-white shadow-sm hover:bg-emerald-700"><Send className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-t bg-slate-50 text-slate-500 text-sm text-center">Admin read-only view: you can inspect buyer-seller conversations here.</div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <MessageCircle className="w-14 h-14 text-slate-300 mb-4" />
                    <div className="font-medium text-xl">Select a conversation</div>
                    <p className="text-slate-500 mt-1">Chat directly with other users on MarketConnect</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="pt-8 max-w-5xl">
            <div className="text-5xl font-semibold tracking-tight mb-8">My Activity</div>

            {/* Favorites */}
            <div className="mb-12">
              <div className="font-semibold mb-4 text-xl flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> Saved Items ({favorites.length})</div>
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {listings.filter(l => favorites.includes(l.id)).map(l => <ListingCard key={l.id} listing={l} />)}
                </div>
              ) : <div className="text-slate-400">No saved items yet. Heart listings you like.</div>}
            </div>

            {/* My Listings for Sellers */}
            {currentUserSafe.role === 'seller' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-semibold text-xl">My Listings ({myListings.length})</div>
                  <button
                    type="button"
                    onClick={() => navigate('/new-listing')}
                    className="flex items-center gap-2 rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                    New listing
                  </button>
                </div>
                {myListings.length > 0 ? (
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
                ) : <div className="text-center py-8 text-sm text-slate-400 border rounded-3xl">You have no active listings yet.</div>}
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
                        <div className="flex items-center gap-4">
                          <div className="text-xl tabular-nums font-semibold">₦{order.price}</div>
                          <div className={`px-4 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'confirmed' ? 'bg-purple-100 text-purple-700' :
                            order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>{order.status}</div>
                          
                          {isSeller && order.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="px-4 py-1.5 text-xs bg-emerald-600 text-white rounded-full flex items-center gap-1"><Check className="w-3 h-3"/> Accept</button>
                              <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-4 py-1.5 text-xs border text-red-600 rounded-full flex items-center gap-1"><X className="w-3 h-3"/> Reject</button>
                            </div>
                          )}
                          
                          {!isSeller && order.status === 'accepted' && (
                            <button onClick={() => setShowPaymentModal(order)} className="px-6 py-2 bg-slate-900 hover:bg-black text-white rounded-3xl text-xs">Complete Payment</button>
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
          <div className="pt-8 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="text-5xl font-semibold tracking-tight">Transactions</div>
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
                    <div className="text-lg font-semibold">₦{currentUserSafe.walletBalance || 0}</div>
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
              <div className="text-5xl font-semibold tracking-tight mb-3">Wallet</div>
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

              <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#020617] p-8 mb-8 shadow-[0_24px_60px_rgba(15,23,42,0.16)] text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm uppercase tracking-[0.3em] text-slate-300">Available Balance</div>
                    <div className="mt-4 text-6xl font-semibold tracking-tight">{showBalance ? `₦${walletBalance.toFixed(2)}` : '••••••'}</div>
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

                <div className="rounded-[28px] bg-white border border-slate-200 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                  <div className="text-lg font-semibold mb-3">Transaction History</div>
                  <div className="text-sm text-slate-500 mb-5">Track deposits, withdrawals, and payouts.</div>
                  <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-2">
                    {transactions.filter(t => t.userId === currentUserSafe.id).length === 0 ? (
                      <div className="text-sm text-slate-400 py-14 text-center">No transactions yet.</div>
                    ) : (
                      transactions.filter(t => t.userId === currentUserSafe.id).slice(0, 50).map(tx => (
                        <div key={tx.id} className="flex items-start justify-between gap-3 p-4 border border-slate-200 rounded-[22px] bg-slate-50">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900">{tx.type.toUpperCase()}</div>
                            <div className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString()}</div>
                            {tx.details && <div className="text-xs text-slate-500 truncate mt-2">{tx.details}</div>}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${tx.type === 'payout' || tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {tx.type === 'deposit' ? 'Credit' : tx.type === 'payout' ? 'Payout' : 'Debit'}
                            </div>
                            <div className={`font-semibold ${tx.type === 'payout' || tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>₦{tx.amount}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl pt-8">
            <div className="text-5xl font-semibold tracking-tight mb-9">Profile</div>

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
              <div className="bg-white border rounded-3xl p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center mb-9">
                  <div className="relative">
                    <img src={profilePhoto || currentUserSafe.avatar} alt="" className="w-24 h-24 rounded-3xl ring-4 ring-slate-100 object-cover" />
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
                      {verifyingUserId === currentUserSafe.id ? 'Processing…' : `Pay ₦${currentUserSafe.verificationFee || verificationAmount} for ${currentUserSafe.verificationBadgeType === 'verified_seller' ? 'Verified Seller' : 'Active Member'}`}
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
                    <div className="mt-3 text-xs text-slate-500">After payment, the admin will review and approve your account.</div>
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
              <div className="text-5xl font-semibold tracking-tight">Admin Dashboard</div>
              <div className="text-right text-xs text-slate-500">Platform Overview</div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-white border p-6 rounded-3xl"><div className="text-emerald-600 text-sm">USERS</div><div className="font-semibold text-6xl">{users.length}</div></div>
              <div className="bg-white border p-6 rounded-3xl"><div className="text-emerald-600 text-sm">LISTINGS</div><div className="font-semibold text-6xl">{listings.length}</div></div>
              <div className="bg-white border p-6 rounded-3xl"><div className="text-emerald-600 text-sm">ORDERS</div><div className="font-semibold text-6xl">{orders.length}</div></div>
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
                        const fee = Number(adminVerificationFee) || 5000;
                        setUsers(prev => prev.map(u => u.id === selectedUser.id ? {
                          ...u,
                          verificationRequestStatus: 'pending',
                          verificationBadgeType: adminVerificationBadgeType,
                          verificationFee: fee,
                        } : u));
                        addPortalNotification({
                          title: 'Verification request sent',
                          message: `Admin has started your ${adminVerificationBadgeType === 'verified_seller' ? 'Verified Seller' : 'Active Member'} verification request. Complete the payment to proceed.`,
                          type: 'verification',
                          targetUserId: selectedUser.id,
                          targetRole: 'all',
                          relatedUserId: selectedUser.id,
                        });
                        if (currentUser?.id === selectedUser.id) {
                          setCurrentUser(prev => prev ? {
                            ...prev,
                            verificationRequestStatus: 'pending',
                            verificationBadgeType: adminVerificationBadgeType,
                            verificationFee: fee,
                          } : prev);
                        }
                        addNotification(`Verification request sent for ${selectedUser.name}.`, 'success');
                        setAdminVerificationTargetId('');
                      }} className="rounded-3xl bg-emerald-600 text-white px-4 py-3 text-sm">Apply</button>
                      <button onClick={() => setAdminVerificationTargetId('')} className="rounded-3xl bg-slate-200 text-slate-700 px-4 py-3 text-sm">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border rounded-3xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-slate-500"><th className="p-5">User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.filter(user => {
                      const query = adminUserSearch.trim().toLowerCase();
                      if (!query) return true;
                      return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.role.toLowerCase().includes(query);
                    }).map(user => (
                      <tr key={user.id} className="border-b last:border-none">
                        <td className="p-5 flex items-center gap-3"><img src={user.avatar} className="w-8 h-8 rounded-xl" />{user.name}</td>
                        <td className="text-slate-500">{user.email}</td>
                        <td><span className="px-3 py-px text-xs rounded-full bg-slate-100 font-medium capitalize">{user.role}</span></td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className={`px-3 py-px text-xs rounded-full font-medium w-fit ${user.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {user.verified ? 'Verified' : user.verificationRequestStatus === 'pending' ? 'Pending Payment' : 'Unverified'}
                            </span>
                            <span className="text-[11px] text-slate-500">{user.verificationRequestStatus === 'pending' ? `${user.verificationBadgeType === 'verified_seller' ? 'Verified Seller' : 'Active Member'} • ₦${user.verificationFee}` : user.verificationLevel || 'unverified'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2 items-center">
                            <button onClick={() => setAdminVerificationTargetId(user.id)} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200" title="Set verification fee and badge">
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => adminVerifyMembership(user)} disabled={verifyingUserId === user.id || user.verified || user.verificationRequestStatus === 'pending'} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs disabled:opacity-60">{verifyingUserId === user.id ? 'Processing…' : user.verified ? 'Verified' : 'Approve'}</button>
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
                <div className="text-sm text-center">Your wallet balance: <span className="font-semibold">₦{currentUserSafe.walletBalance || 0}</span></div>
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

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-[85] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8">
            <div className="text-3xl font-semibold mb-4">{confirmTitle}</div>
            <div className="text-slate-600 mb-8">{confirmMessage}</div>
            <div className="flex gap-4">
              <button onClick={closeConfirmModal} className="flex-1 py-3 border rounded-3xl">Cancel</button>
              <button onClick={() => { confirmAction(); }} className="flex-1 py-3 bg-emerald-600 text-white rounded-3xl">Confirm</button>
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
            <div className="text-sm text-slate-600 mt-1 mb-5">Submit a report or complaint to the admin about a buyer or seller.</div>

            <div className="space-y-4">
              <div>
                <label htmlFor="report-user" className="text-sm font-medium text-slate-500">User</label>
                <select id="report-user" name="reportedUserId" value={reportForm.reportedUserId} onChange={(e) => {
                  const selectedUser = users.find(user => user.id === e.target.value);
                  setReportForm(prev => ({
                    ...prev,
                    reportedUserId: selectedUser?.id || '',
                    reportedUserName: selectedUser?.name || '',
                    reportedRole: selectedUser?.role || 'buyer',
                  }));
                }} className="w-full mt-1.5 border px-5 py-3 rounded-2xl">
                  <option value="">Select a user</option>
                  {users.filter(user => user.id !== currentUserSafe.id).map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                  ))}
                </select>
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
              <button onClick={() => { setShowReportModal(false); setReportForm({ reportedUserId: '', reportedUserName: '', reportedRole: 'buyer', type: 'report', subject: '', details: '' }); }} className="flex-1 py-4 border rounded-3xl">Cancel</button>
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
    </MarketplaceShell>
  );
}

export default MarketConnectApp;
