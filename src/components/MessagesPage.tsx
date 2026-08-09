import React, { useState, useEffect, useRef } from 'react';
import type { User as UserType, Message } from '../types';

export const MessagesPage = ({
  conversations,
  users,
  messages,
  currentUser,
  chatLastRead,
  markChatAsRead,
  timestampLocale,
  timestampTimeZone,
  onOpenConversation,
}: {
  conversations: { chatId?: string; otherUserId: string; otherUserName: string; listingId?: string; listingTitle?: string }[];
  users: UserType[];
  messages: Message[];
  currentUser: UserType | null;
  chatLastRead?: Record<string, string>;
  markChatAsRead?: (chatId?: string) => void;
  timestampLocale?: string;
  timestampTimeZone?: string;
  onOpenConversation: (conv: any) => void;
}) => {
  const [selected, setSelected] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!conversations.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(prev => Math.min(prev + 1, conversations.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onOpenConversation(conversations[selected]);
    }
  };

  const formatTimestamp = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';

    const now = new Date();
    const locale = timestampLocale || navigator.language;
    const timeZone = timestampTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) {
      return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone }).format(d);
    }

    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone }).format(d);
    }

    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone }).format(d);
  };

  const getLastMessage = (chatId?: string) => {
    if (!chatId) return null;
    const msgs = messages.filter(m => m.chatId === chatId);
    if (!msgs.length) return null;
    const sorted = msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return sorted[sorted.length - 1]?.content || null;
  };

  return (
    <div className="pt-4 w-full" tabIndex={0} ref={containerRef} onKeyDown={handleKeyDown}>
      <div className="px-4 pb-3">
        <div className="text-3xl font-semibold">Messages</div>
        <p className="text-slate-600 mt-1 text-sm">Connect with buyers and sellers</p>
      </div>

      <div className="w-full">
        {conversations.length > 0 ? (
          conversations.map((conv, idx) => {
            const user = users.find(u => u.id === conv.otherUserId);
            const last = getLastMessage(conv.chatId);
            const isSelected = idx === selected;
            const lastReadIso = conv.chatId ? (chatLastRead ? chatLastRead[conv.chatId] : undefined) : undefined;
            const unreadCount = conv.chatId ? messages.filter(m => m.chatId === conv.chatId && m.senderId !== currentUser?.id && new Date(m.timestamp).getTime() > new Date(lastReadIso || 0).getTime()).length : 0;

            return (
                <button
                key={conv.chatId || idx}
                onClick={() => {
                  if (markChatAsRead) markChatAsRead(conv.chatId);
                  onOpenConversation(conv);
                }}
                onMouseEnter={() => setSelected(idx)}
                aria-selected={isSelected}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left border-b border-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${isSelected ? 'bg-emerald-50 border-l-4 border-emerald-500 pl-3' : 'hover:bg-slate-50'}`}
              >
                <div className="flex-shrink-0 h-9 w-9 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={conv.otherUserName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-9 w-9 bg-slate-300 rounded-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold truncate">{conv.otherUserName}</div>
                    <div className="flex items-center gap-3">
                      {conv.listingTitle && <div className="text-[11px] text-emerald-600 ml-2 truncate">{conv.listingTitle}</div>}
                      <div className="text-[11px] text-slate-400 whitespace-nowrap">{formatTimestamp(messages.find(m => m.chatId === conv.chatId)?.timestamp || undefined) || ''}</div>
                    </div>
                  </div>
                  <div className="text-[12px] text-slate-500 truncate">{last ? String(last) : 'Tap to chat'}</div>
                </div>
                {unreadCount > 0 && (
                  <div className="ml-3 flex-shrink-0">
                    <div className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-emerald-600 text-white text-xs font-semibold">{unreadCount > 99 ? '99+' : unreadCount}</div>
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="px-4 py-8 text-center text-slate-400">Start messaging by contacting sellers from listings.</div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
