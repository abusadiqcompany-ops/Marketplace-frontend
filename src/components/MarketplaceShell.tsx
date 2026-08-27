import React, { useState } from 'react';
import { Home, MessageCircle, User, ShoppingBag, Shield, Plus, Bell, BellRing, Inbox, Wallet, CreditCard, LogOut, Sparkles, Menu, X } from 'lucide-react';
import { NotificationCard } from './NotificationCard';
import type { AppNotification, NotificationCategory, Role, User as UserType, Listing, Message, Order, Review, Report, AccountDeletionRequest, Transaction, PortalNotification } from '../types';

interface MarketplaceShellProps {
  currentUser: UserType;
  unreadMessages: number;
  unreadNotificationCount: number;
  showNotificationMenu: boolean;
  showNotificationsPage: boolean;
  appNotifications: AppNotification[];
  portalNotifications: PortalNotification[];
  notificationFilter: NotificationCategory;
  filteredNotifications: AppNotification[];
  groupedNotifications: Record<string, AppNotification[]>;
  activeTab: string;
  isPublicSellerView?: boolean;
  onNavigate: (tab: string) => void;
  onOpenNotifications: () => void;
  onToggleNotificationsMenu: () => void;
  onMarkAllNotificationsRead: () => void;
  onSetNotificationFilter: (category: NotificationCategory) => void;
  onShowNotificationsPage: (value: boolean) => void;
  onToggleNotificationRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onNotificationAction: (type: 'view' | 'payment' | 'message') => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  children: React.ReactNode;
}

export function MarketplaceShell({
  currentUser,
  unreadMessages,
  unreadNotificationCount,
  showNotificationMenu,
  showNotificationsPage,
  appNotifications,
  portalNotifications,
  notificationFilter,
  filteredNotifications,
  groupedNotifications,
  activeTab,
  isPublicSellerView = false,
  onNavigate,
  onOpenNotifications,
  onToggleNotificationsMenu,
  onMarkAllNotificationsRead,
  onSetNotificationFilter,
  onShowNotificationsPage,
  onToggleNotificationRead,
  onDeleteNotification,
  onNotificationAction,
  onLogout,
  onOpenProfile,
  children,
}: MarketplaceShellProps) {
  const currentUserSafe = currentUser ?? { id: 'guest', name: 'Guest', email: '', role: 'buyer' as Role, avatar: 'https://i.pravatar.cc/150?img=11', walletBalance: 0 };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigationItems = [
    { id: 'discover', label: 'Discover', icon: Home },
    { id: 'messages', label: 'Messages', icon: MessageCircle, badge: unreadMessages > 0 ? unreadMessages : undefined },
    { id: 'activity', label: 'Activity', icon: ShoppingBag },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
    ...(currentUserSafe.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: Shield, badge: undefined }] : []),
  ];

  const handleMobileNavigate = (tab: string) => {
    setMobileMenuOpen(false);
    onNavigate(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="truncate text-xl font-semibold tracking-tight sm:text-2xl">MarketConnect</div>
              <div className="text-[10px] text-slate-400 -mt-1">Local Marketplace</div>
            </div>
          </div>

          {!isPublicSellerView && (
            <div className="hidden items-center gap-2 rounded-3xl bg-slate-100 p-1 text-sm md:flex">
              {navigationItems.map((tab) => {
                const Icon = tab.icon;
                const badgeNum = 'badge' in tab ? tab.badge : undefined;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onNavigate(tab.id as any)}
                    className={`rounded-3xl px-3 py-2.5 lg:px-5 ${activeTab === tab.id ? 'bg-white shadow font-medium' : 'hover:bg-white/70'} flex items-center gap-2 transition`}
                  >
                    <Icon className="w-4 h-4" /> {tab.label}
                    {badgeNum && badgeNum > 0 && <span className="px-1.5 py-px bg-red-500 text-white text-[9px] rounded-full">{badgeNum}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {!isPublicSellerView && (
            <div className="flex shrink-0 items-center gap-1 sm:gap-4">
              <div className="flex items-center gap-1 border-l pl-1 sm:gap-3 sm:pl-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={onToggleNotificationsMenu}
                    className="relative rounded-2xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  {showNotificationMenu && (
                    <div className="fixed left-4 right-4 top-20 z-[60] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-3 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:mt-3 sm:w-[360px] sm:max-h-[75vh]">
                      <div className="mb-3 flex items-center justify-between px-1">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Latest updates</div>
                          <div className="text-xs text-slate-500">Live activity for your marketplace</div>
                        </div>
                        <button type="button" onClick={onMarkAllNotificationsRead} className="text-sm font-medium text-slate-500 hover:text-slate-900">Mark all read</button>
                      </div>
                      <div className="space-y-2">
                        {filteredNotifications.slice(0, 4).length > 0 ? filteredNotifications.slice(0, 4).map((notification) => (
                          <div key={notification.id} className="rounded-[20px] border border-slate-100 p-2">
                            <NotificationCard
                              notification={notification}
                              compact
                              onToggleRead={onToggleNotificationRead}
                              onDelete={onDeleteNotification}
                              onAction={onNotificationAction}
                            />
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                            <Inbox className="mb-3 h-8 w-8 text-slate-400" />
                            <div className="text-sm font-medium text-slate-700">No notifications yet</div>
                            <p className="mt-1 text-xs text-slate-500">New updates will appear here in real time.</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between px-1">
                        <button type="button" onClick={() => { onShowNotificationsPage(true); }} className="text-sm font-medium text-slate-700 hover:text-slate-900">View all notifications</button>
                        <button type="button" onClick={() => onToggleNotificationsMenu()} className="text-sm text-slate-500 hover:text-slate-900">Close</button>
                      </div>
                    </div>
                  )}
                </div>
                <div onClick={onOpenProfile} className="flex cursor-pointer items-center gap-2">
                  <img src={currentUserSafe.avatar} alt="" className="w-9 h-9 rounded-2xl object-cover ring-2 ring-white" />
                  <div className="hidden md:block text-sm">
                    <div className="font-medium leading-none">{currentUserSafe.name}</div>
                    <div className="text-[10px] text-emerald-600 capitalize">{currentUserSafe.role}</div>
                  </div>
                </div>
                <button onClick={onLogout} className="p-2 text-slate-500 transition hover:text-red-500" aria-label="Log out"><LogOut className="h-4 w-4" /></button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(prev => !prev)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 p-2 text-slate-600 md:hidden"
                  aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
        {!isPublicSellerView && mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg md:hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {navigationItems.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleMobileNavigate(tab.id)}
                    className={`flex min-h-11 items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                    {tab.badge ? <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-px text-[10px] text-white">{tab.badge}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="mx-auto max-w-7xl overflow-x-hidden px-4 pb-12 pt-20 sm:px-6">
        {showNotificationsPage ? (
          <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  <BellRing className="h-4 w-4" /> Notifications
                </div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Stay updated across orders, messages and payments</h2>
                <p className="mt-2 text-sm text-slate-600">Modern, real-time updates built for a faster marketplace experience.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={onMarkAllNotificationsRead} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Mark all as read</button>
                <button type="button" onClick={() => onShowNotificationsPage(false)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">Back to home</button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {([
                { id: 'all', label: 'All' },
                { id: 'orders', label: 'Orders' },
                { id: 'messages', label: 'Messages' },
                { id: 'payments', label: 'Payments' },
              ] as { id: NotificationCategory; label: string }[]).map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => onSetNotificationFilter(filter.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${notificationFilter === filter.id ? 'bg-slate-900 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {filteredNotifications.length > 0 ? (
              <div className="mt-6 space-y-6">
                {(['Today', 'Yesterday', 'Earlier'] as const).map((groupKey) => {
                  const list = groupedNotifications[groupKey];
                  if (!list.length) return null;
                  return (
                    <div key={groupKey}>
                      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{groupKey}</div>
                      <div className="space-y-3">
                        {list.map((notification) => (
                          <NotificationCard
                            key={notification.id}
                            notification={notification}
                            onToggleRead={onToggleNotificationRead}
                            onDelete={onDeleteNotification}
                            onAction={onNotificationAction}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-8 py-16 text-center">
                <Inbox className="mb-4 h-10 w-10 text-slate-400" />
                <h3 className="text-xl font-semibold text-slate-900">No notifications yet</h3>
                <p className="mt-2 max-w-md text-sm text-slate-500">Your notification feed will show updates about orders, messages, payments, and smart alerts as they arrive.</p>
              </div>
            )}
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
