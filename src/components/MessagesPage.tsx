import React, { useState, useEffect, useRef } from 'react';
import type { User as UserType, Message } from '../types';

export const MessagesPage = ({
  conversations,
  users,
  messages,
  onOpenConversation,
}: {
  conversations: { chatId?: string; otherUserId: string; otherUserName: string; listingId?: string; listingTitle?: string }[];
  users: UserType[];
  messages: Message[];
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
            return (
              <button
                key={conv.chatId || idx}
                onClick={() => onOpenConversation(conv)}
                onMouseEnter={() => setSelected(idx)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'} border-b border-slate-100`}
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
                    {conv.listingTitle && <div className="text-[11px] text-emerald-600 ml-2 truncate">{conv.listingTitle}</div>}
                  </div>
                  <div className="text-[12px] text-slate-500 truncate">{last ? String(last) : 'Tap to chat'}</div>
                </div>
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
