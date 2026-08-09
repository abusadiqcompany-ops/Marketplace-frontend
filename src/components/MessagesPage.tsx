import React from 'react';
import type { User as UserType } from '../types';

export const MessagesPage = ({
  conversations,
  users,
  onOpenConversation,
}: {
  conversations: { chatId?: string; otherUserId: string; otherUserName: string; listingId?: string; listingTitle?: string }[];
  users: UserType[];
  onOpenConversation: (conv: any) => void;
}) => {
  return (
    <div className="pt-4 w-full">
      <div className="px-4 pb-3">
        <div className="text-3xl font-semibold">Messages</div>
        <p className="text-slate-600 mt-1 text-sm">Connect with buyers and sellers</p>
      </div>

      <div className="w-full">
        <div className="w-full">
          {conversations.length > 0 ? (
            conversations.map((conv, idx) => {
              const user = users.find(u => u.id === conv.otherUserId);
              return (
                <button
                  key={conv.chatId || idx}
                  onClick={() => onOpenConversation(conv)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 border-b border-slate-100"
                >
                  <div className="flex-shrink-0 h-9 w-9 rounded-full overflow-hidden bg-slate-200">
                    <img src={user?.avatar} alt={conv.otherUserName} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold truncate">{conv.otherUserName}</div>
                      {conv.listingTitle && <div className="text-[11px] text-emerald-600 ml-2 truncate">{conv.listingTitle}</div>}
                    </div>
                    <div className="text-[12px] text-slate-500 truncate">Tap to chat</div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-slate-400">Start messaging by contacting sellers from listings.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
