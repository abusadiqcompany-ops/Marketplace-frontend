import { AlertTriangle, CheckCircle2, Clock3, CreditCard, Eye, Info, MessageCircle, Sparkles, Trash2, XCircle } from 'lucide-react';
import type { AppNotification } from '../types';

export type NotificationActionType = 'view' | 'payment' | 'message';

interface NotificationCardProps {
  notification: AppNotification;
  onToggleRead: (id: string) => void;
  onDelete: (id: string) => void;
  onAction?: (type: NotificationActionType) => void;
  compact?: boolean;
}

const toneStyles = {
  info: {
    icon: Info,
    accent: 'bg-sky-500',
    chip: 'bg-sky-100 text-sky-700',
    iconWrap: 'bg-sky-100 text-sky-700',
  },
  success: {
    icon: CheckCircle2,
    accent: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-700',
    iconWrap: 'bg-emerald-100 text-emerald-700',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-700',
    iconWrap: 'bg-amber-100 text-amber-700',
  },
  error: {
    icon: XCircle,
    accent: 'bg-rose-500',
    chip: 'bg-rose-100 text-rose-700',
    iconWrap: 'bg-rose-100 text-rose-700',
  },
} as const;

const actionLabels: Record<NotificationActionType, string> = {
  view: 'View',
  payment: 'Complete Payment',
  message: 'Message Seller',
};

const actionIcons: Record<NotificationActionType, typeof Eye> = {
  view: Eye,
  payment: CreditCard,
  message: MessageCircle,
};

const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const createdAt = new Date(timestamp);
  const diffInMinutes = Math.max(1, Math.round((now.getTime() - createdAt.getTime()) / 60000));

  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const diffInHours = Math.round(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.round(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return createdAt.toLocaleDateString();
};

export function NotificationCard({
  notification,
  onToggleRead,
  onDelete,
  onAction,
  compact = false,
}: NotificationCardProps) {
  const tone = toneStyles[notification.type] ?? toneStyles.info;
  const Icon = tone.icon;
  const actionType = notification.actionType as NotificationActionType | undefined;
  const actionButtonLabel = actionType ? actionLabels[actionType] : undefined;
  const ActionIcon = actionType ? actionIcons[actionType] : undefined;

  return (
    <div
      className={`group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99] ${
        notification.read ? 'border-slate-200 bg-white/90' : 'border-slate-300 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.35)]'
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${tone.accent}`} />
      <div className={compact ? 'p-3 md:p-3.5' : 'p-4 md:p-4.5'}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone.iconWrap}`}>
            {notification.type === 'success' && notification.title.includes('trending') ? (
              <Sparkles className="h-5 w-5" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{notification.title}</h3>
                  {!notification.read && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-600">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{notification.description || notification.message}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatRelativeTime(notification.timestamp)}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(notification.id)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${tone.chip}`}>
                {notification.type}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${notification.read ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white'}`}>
                {notification.read ? 'Read' : 'Unread'}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleRead(notification.id)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {notification.read ? 'Mark as unread' : 'Mark as read'}
              </button>

              {actionType && ActionIcon && actionButtonLabel && onAction && (
                <button
                  type="button"
                  onClick={() => onAction(actionType)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  <ActionIcon className="h-4 w-4" />
                  {actionButtonLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
