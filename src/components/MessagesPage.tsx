import React, { useState, useEffect, useRef } from 'react';
import { User, ArrowRight, ImagePlus, Mic, MicOff, Pause, Play, Send, Trash2, CheckCheck } from 'lucide-react';
import type { User as UserType, Message } from '../types';

export const MessagesPage = ({
  conversations,
  users,
  messages,
  currentUser,
  chatLastRead,
  markChatAsRead,
  activeChat,
  chatMessages,
  chatImage,
  onSelectChatImage,
  newMessage,
  onChangeMessage,
  onSendMessage,
  onSendVoiceMessage,
  onCloseConversation,
  onOpenChatUserProfile,
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
  activeChat?: { chatId?: string; otherUserId: string; otherUserName: string; listingId?: string; listingTitle?: string } | null;
  chatMessages: Message[];
  chatImage?: string | null;
  onSelectChatImage: (value: string | null) => void;
  newMessage: string;
  onChangeMessage: (value: string) => void;
  onSendMessage: () => void;
  onSendVoiceMessage: (audio: string) => void;
  onCloseConversation: () => void;
  onOpenChatUserProfile: () => void;
  timestampLocale?: string;
  timestampTimeZone?: string;
  onOpenConversation: (conv: any) => void;
}) => {
  const [selected, setSelected] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingAudio, setRecordingAudio] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.focus();
  }, []);

  useEffect(() => {
    if (!conversations.length) {
      setSelected(0);
      return;
    }

    const nextIndex = activeChat
      ? conversations.findIndex(conv => {
          if (conv.chatId && activeChat.chatId) return conv.chatId === activeChat.chatId;
          return conv.otherUserId === activeChat.otherUserId && conv.listingId === activeChat.listingId;
        })
      : -1;

    if (nextIndex >= 0) {
      setSelected(nextIndex);
      return;
    }

    setSelected(prev => Math.min(prev, conversations.length - 1));
  }, [activeChat, conversations]);

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
    const lastMessage = sorted[sorted.length - 1];
    if (!lastMessage) return null;
    if (lastMessage.content) return lastMessage.content;
    if (lastMessage.image) return 'Photo';
    if (lastMessage.audio) return 'Voice message';
    return null;
  };

  const activeChatUser = activeChat ? users.find(u => u.id === activeChat.otherUserId) : undefined;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pickImage = () => {
    fileInputRef.current?.click();
  };

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const previewUrl = typeof reader.result === 'string' ? reader.result : null;
      onSelectChatImage(previewUrl);
    };
    reader.onerror = () => {
      onSelectChatImage(null);
    };
    reader.readAsDataURL(file);

    event.target.value = '';
  };

  const toggleRecording = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }

    if (recordingAudio) {
      setRecordingAudio(null);
      setRecordingSeconds(0);
      setPlaybackSeconds(0);
      setIsPlayingRecording(false);
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('Voice messages are not supported in this browser.');
      return;
    }

    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') setRecordingAudio(reader.result);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        recorderRef.current = null;
        setIsRecording(false);
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(seconds => seconds + 1);
      }, 1000);
    } catch {
      setRecordingError('Microphone access was denied. Check your browser permissions and try again.');
      setIsRecording(false);
    }
  };

  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const waveformBarCount = 32;

  const toggleRecordingPlayback = () => {
    const audio = playbackRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
      setIsPlayingRecording(true);
    } else {
      audio.pause();
      setIsPlayingRecording(false);
    }
  };

  const discardRecording = () => {
    playbackRef.current?.pause();
    setRecordingAudio(null);
    setRecordingSeconds(0);
    setPlaybackSeconds(0);
    setIsPlayingRecording(false);
  };

  const sendRecording = () => {
    if (!recordingAudio) return;
    onSendVoiceMessage(recordingAudio);
    discardRecording();
  };

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    playbackRef.current?.pause();
  }, []);

  return (
    <div className={`messages-page pt-4 w-full ${activeChat ? 'messages-page--active' : ''}`} tabIndex={0} ref={containerRef} onKeyDown={handleKeyDown}>
      {!activeChat && <div className="px-4 pb-3">
        <div className="text-3xl font-semibold">Messages</div>
      </div>}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className={`bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm ${activeChat ? 'hidden lg:block' : 'block'}`}>
          <div className="px-4 py-4 border-b border-slate-100 text-sm font-semibold">Conversations</div>
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
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
                    type="button"
                    onClick={() => {
                      if (markChatAsRead) markChatAsRead(conv.chatId);
                      onOpenConversation(conv);
                    }}
                    onMouseEnter={() => setSelected(idx)}
                    aria-selected={isSelected}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${isSelected ? 'bg-emerald-50 border-l-4 border-emerald-500 pl-3' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex-shrink-0 h-9 w-9 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={conv.otherUserName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-slate-300 flex items-center justify-center text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold truncate">{conv.otherUserName}</div>
                        <div className="text-[11px] text-slate-400 whitespace-nowrap">{formatTimestamp(messages.find(m => m.chatId === conv.chatId)?.timestamp || undefined) || ''}</div>
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

        {activeChat ? (
          <div className="messages-conversation bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-[calc(100vh-180px)]">
            <div className="messages-conversation__header shrink-0 px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={onCloseConversation}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  ←
                </button>
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenChatUserProfile}
                    className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center hover:ring-2 hover:ring-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {activeChatUser?.avatar ? (
                      <img src={activeChatUser.avatar} alt={activeChat.otherUserName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-500">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-semibold">{activeChat.otherUserName}</div>
                    {activeChat.listingTitle && <div className="text-sm text-slate-500 truncate">{activeChat.listingTitle}</div>}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-xs text-slate-400">{activeChat.chatId ? formatTimestamp(messages.find(m => m.chatId === activeChat.chatId)?.timestamp || undefined) : ''}</div>
            </div>
            <div id="chat-scroll" className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {chatMessages.length > 0 ? (
                chatMessages.map(message => {
                  const isMine = message.senderId === currentUser?.id;
                  return (
                    <div key={message.id} className={`max-w-[85%] ${isMine ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
                      <div className={`chat-bubble inline-flex flex-col gap-2 px-4 py-3 text-sm ${isMine ? 'chat-bubble--mine bg-emerald-600 text-white' : 'chat-bubble--incoming bg-slate-100 text-slate-900'}`}>
                        {!isMine && <div className="font-medium">{message.senderName}</div>}
                        {message.image ? (
                          <img
                            src={message.image}
                            alt="message attachment"
                            className="max-h-72 w-full rounded-3xl object-cover"
                          />
                        ) : null}
                        {message.content ? (
                          <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        ) : null}
                        {message.audio ? (
                          <audio controls src={message.audio} className="max-w-full" aria-label="Voice message" />
                        ) : null}
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] leading-none ${isMine ? 'text-emerald-100' : 'text-slate-400'}`}>
                          <span>{formatTimestamp(message.timestamp)}</span>
                          {isMine && <CheckCheck className="h-3.5 w-3.5 text-emerald-100" aria-label="Read" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-slate-400 py-14">No messages yet. Say hello to start the conversation.</div>
              )}
            </div>
            <div className="messages-conversation__composer shrink-0 border-t border-slate-100 bg-white px-4 py-4">
              <div className="flex flex-col gap-3">
                {chatImage ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={chatImage} alt="attachment preview" className="h-14 w-14 rounded-3xl object-cover" />
                      <div>
                        <div className="text-sm font-semibold">Photo ready to send</div>
                        <div className="text-xs text-slate-500">Tap send or remove</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => onSelectChatImage(null)} className="text-sm text-red-500">Remove</button>
                  </div>
                ) : null}
                {recordingError ? <div className="text-sm text-rose-600">{recordingError}</div> : null}
                {(isRecording || recordingAudio) ? (
                  <div className={`rounded-3xl border p-3 ${isRecording ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
                    <div className="flex items-center gap-3">
                      {recordingAudio ? (
                        <button
                          type="button"
                          onClick={toggleRecordingPlayback}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white hover:bg-slate-700"
                          aria-label={isPlayingRecording ? 'Pause voice preview' : 'Play voice preview'}
                          title={isPlayingRecording ? 'Pause preview' : 'Play preview'}
                        >
                          {isPlayingRecording ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                        </button>
                      ) : (
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white">
                          <Mic className="h-5 w-5 animate-pulse" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          <span>{isRecording ? 'Recording voice' : 'Voice preview'}</span>
                          <span className="tabular-nums">{formatDuration(recordingAudio ? Math.max(recordingSeconds, Math.ceil(playbackSeconds)) : recordingSeconds)}</span>
                        </div>
                        <div className="voice-waveform flex h-7 items-center gap-1 overflow-hidden" aria-label="Audio waveform progress">
                          {Array.from({ length: waveformBarCount }, (_, index) => {
                            const progress = recordingAudio && recordingSeconds > 0 ? playbackSeconds / recordingSeconds : isRecording ? 1 : 0;
                            const active = index / waveformBarCount <= progress;
                            const height = [10, 18, 13, 24, 16, 27, 12, 21, 29, 15, 23, 11, 19, 26, 14, 22][index % 16];
                            return <span key={index} className={`w-1.5 rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ height }} />;
                          })}
                        </div>
                      </div>
                    </div>
                    {recordingAudio ? (
                      <>
                        <audio
                          ref={playbackRef}
                          src={recordingAudio}
                          className="hidden"
                          onTimeUpdate={(event) => setPlaybackSeconds(event.currentTarget.currentTime)}
                          onEnded={() => {
                            setIsPlayingRecording(false);
                            setPlaybackSeconds(0);
                          }}
                        />
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={discardRecording} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                          <button type="button" onClick={sendRecording} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                            <Send className="h-4 w-4" /> Send voice
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="mt-2 text-xs font-medium text-rose-600">Tap the microphone button to stop and review</div>
                    )}
                  </div>
                ) : null}

                <div className="chat-composer flex items-center gap-2">
                  <button
                    type="button"
                    onClick={pickImage}
                    className="chat-composer__action inline-flex items-center justify-center h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    aria-label="Attach photo"
                    title="Attach photo"
                  >
                    <ImagePlus className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleRecording()}
                    className={`chat-composer__action relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${isRecording ? 'border-rose-300 bg-rose-50 text-rose-600 shadow-[0_0_0_5px_rgba(244,63,94,0.12)]' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'}`}
                    aria-label={isRecording ? 'Stop recording' : 'Record voice message'}
                    title={isRecording ? 'Stop recording and send' : 'Record voice message'}
                  >
                    {isRecording ? (
                      <MicOff className="h-5 w-5 animate-pulse" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(event) => onChangeMessage(event.target.value)}
                    placeholder="Write a message..."
                    className="chat-composer__input min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    type="button"
                    onClick={onSendMessage}
                    className="chat-composer__action inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                    aria-label="Send message"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:block bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center text-slate-500">
            Select a conversation to view the chat thread.
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
