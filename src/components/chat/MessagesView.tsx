import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Circle, Smile, Paperclip, X, CheckCircle2, BellOff, BellRing, Ban, Flag, ArrowLeft, Send } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { User, Message } from '@/app/chat/page';
import { optimizeImage } from '@/lib/cloudinary';

interface MessagesViewProps {
  currentUser: any;
  activeUser: User | null;
  setActiveUser: (u: User | null) => void;
  chatSidebarUsers: User[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  handleUserSelect: (user: User) => void;
  setSelectedProfile: (user: User) => void;
  messages: Message[];
  isTyping: boolean;
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (e: React.FormEvent) => void;
  handleTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (v: boolean) => void;
  mediaUrl: string | null;
  setMediaUrl: (v: string | null) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  toggleMute: () => void;
  handleBlock: () => void;
  setReportModalOpen: (v: boolean) => void;
  mutedUsers: Set<string>;
  blockedUsers: Set<string>;
  unreadSenders: Set<string>;
  setViewMode: (v: 'network' | 'messages') => void;
  loadMoreMessages: () => void;
  hasMoreMessages: boolean;
  isLoadingMoreMessages: boolean;
  router: any;
}

export default function MessagesView(props: MessagesViewProps) {
  
  const formatMessageDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  let lastRenderedDateGroup = '';

  return (
    <div className="h-[calc(100vh-130px)] md:h-[calc(100vh-180px)] min-h-[500px] flex bg-white border-y md:border border-slate-200 md:rounded-3xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 -mx-4 sm:mx-0">
      
      {/* Left Conversations Sidebar */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex-col bg-[#fdfdfd] shrink-0 ${props.activeUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            onClick={() => {
              props.setActiveUser(null);
              props.setViewMode('network');
              window.history.replaceState(null, '', '/chat'); 
            }}
            className="p-1.5 text-slate-500 hover:text-[#0f172a] hover:bg-slate-100 rounded-xl transition-colors"
            title="Back to Directory"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h2 className="text-base sm:text-lg font-black text-slate-900">Conversations</h2>
        </div>
        <div className="p-2 sm:p-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-slate-100 border-none rounded-lg text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0f172a] outline-none"
              value={props.searchTerm}
              onChange={(e) => props.setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {props.chatSidebarUsers.length === 0 ? (
              <p className="text-center text-xs font-medium text-slate-500 italic mt-10 p-4">No connected students to message.</p>
          ) : (
              props.chatSidebarUsers.map(user => (
                <div 
                  key={user._id} 
                  onClick={() => props.handleUserSelect(user)}
                  className={`flex items-center sm:items-start gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer transition-colors border-l-4
                    ${props.activeUser?._id === user._id ? 'bg-slate-100 border-l-[#0f172a]' : 'hover:bg-slate-50 border-l-transparent'}`}
                >
                  <div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); props.setSelectedProfile(user); }}>
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border border-slate-200">
                      <AvatarImage alt='user profile' src={optimizeImage(user.avatarUrl, 100, 100)} />
                      <AvatarFallback className="bg-white font-bold text-xs sm:text-sm">{user.firstName[0]}</AvatarFallback>
                    </Avatar>
                    {user.isOnline && <Circle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 absolute bottom-0 right-0 fill-emerald-500 text-white stroke-2" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={`text-xs sm:text-sm truncate pr-2 ${props.activeUser?._id === user._id ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                        {user.firstName} {user.lastName}
                      </h4>
                      <span className="text-[8px] sm:text-[10px] font-semibold text-slate-500 shrink-0">
                        {props.unreadSenders.has(user._id) ? <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 block"></span> : ''}
                      </span>
                    </div>
                    <p className={`text-[10px] sm:text-xs truncate ${props.unreadSenders.has(user._id) ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                      {props.unreadSenders.has(user._id) ? 'New message received' : 'Tap to view conversation...'}
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Active Chat Area */}
      <div className={`flex-1 flex-col min-w-0 bg-white ${!props.activeUser ? 'hidden md:flex' : 'flex'}`}>
        {!props.activeUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-sm border border-slate-100">
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-1.5 sm:mb-2">Select a Conversation</h3>
            <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-sm px-4">Choose a peer from the list to start messaging or search the directory.</p>
          </div>
        ) : (
          <>
            <div className="h-14 sm:h-16 px-3 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button 
                  onClick={() => {
                    props.setActiveUser(null);
                    window.history.replaceState(null, '', '/chat');
                  }}
                  // 🚀 RESTORED md:hidden so it hides on desktop
                  className="p-1.5 text-slate-500 hover:text-[#0f172a] hover:bg-slate-100 rounded-xl transition-colors md:hidden shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-sm sm:text-lg leading-tight cursor-pointer hover:underline truncate" onClick={() => props.setSelectedProfile(props.activeUser!)}>
                    {props.activeUser.firstName} {props.activeUser.lastName}
                  </h3>
                  <div className="text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 mt-0.5">
                    {props.activeUser.isOnline ? (
                      <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div> <span className="text-slate-600 truncate">Active now</span></>
                    ) : (
                      <><div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></div> <span className="text-slate-500 truncate">Offline</span></>
                    )}
                  </div>
                </div>
              </div>

              {/* 🚀 NEW: Desktop Close Chat Button (Hidden on Mobile) */}
              <button 
                onClick={() => {
                  props.setActiveUser(null);
                  window.history.replaceState(null, '', '/chat'); 
                }}
                className="hidden md:flex p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                title="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={props.chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white space-y-4 sm:space-y-6">
              {props.messages.length === 0 ? (
                <p className="text-center text-xs font-medium text-slate-500 italic mt-6 sm:mt-10">No previous messages. Say hi!</p>
              ) : (
                props.messages.map((msg, idx) => {
                  const isMe = msg.sender === props.currentUser?._id;
                  const showAvatar = !isMe && (idx === 0 || props.messages[idx - 1].sender !== msg.sender);
                  
                  const currentDateGroup = formatMessageDateGroup(msg.createdAt);
                  const showDateGroup = currentDateGroup !== lastRenderedDateGroup;
                  lastRenderedDateGroup = currentDateGroup;
                  
                  return (
                    <React.Fragment key={msg._id}>
                      {showDateGroup && (
                        <div className="flex justify-center mb-4 sm:mb-6 mt-3 sm:mt-4">
                          <span className="bg-slate-50 border border-slate-100 text-slate-500 text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider">
                            {currentDateGroup}
                          </span>
                        </div>
                      )}

                      <div className={`flex gap-2 sm:gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <div className="w-6 sm:w-8 shrink-0">
                            {showAvatar && (
                              <Avatar className="w-6 h-6 sm:w-8 sm:h-8 border border-slate-200 cursor-pointer" onClick={() => props.setSelectedProfile(props.activeUser!)}>
                                <AvatarImage alt='user profile' src={optimizeImage(props.activeUser?.avatarUrl, 100, 100)} />
                                <AvatarFallback className="text-[8px] sm:text-[10px] font-bold">{props.activeUser?.firstName[0]}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}

                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                          <div className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm shadow-sm ${
                            isMe 
                              ? 'bg-[#0f172a] text-white rounded-2xl rounded-tr-sm' 
                              : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'
                          }`}>
                            {msg.mediaUrl && <img src={msg.mediaUrl} alt="attachment" loading="lazy" decoding="async" className="max-w-full h-auto rounded-lg sm:rounded-xl mb-1.5 sm:mb-2 border border-black/10" />}
                            {msg.text && <div className="whitespace-pre-wrap font-medium leading-relaxed break-words">{msg.text}</div>}
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 mt-1 px-1 flex items-center gap-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              
              {props.isTyping && (
                <div className="flex justify-start gap-2 sm:gap-3">
                  <div className="w-6 sm:w-8 shrink-0"><Avatar className="w-6 h-6 sm:w-8 sm:h-8 border border-slate-200"><AvatarFallback className="text-[8px] sm:text-[10px]">{props.activeUser.firstName[0]}</AvatarFallback></Avatar></div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2 sm:py-3.5 shadow-sm flex items-center gap-1 sm:gap-1.5">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-2 sm:p-4 bg-white border-t border-slate-100 relative shrink-0">
              {props.mediaUrl && (
                <div className="absolute -top-20 sm:-top-24 left-2 sm:left-4 bg-white border border-slate-200 p-1.5 sm:p-2 rounded-xl shadow-lg">
                  <img src={props.mediaUrl} alt="Preview" className="h-16 sm:h-20 w-auto rounded-lg object-cover" />
                  <button type="button" onClick={() => props.setMediaUrl(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 sm:p-1 shadow-sm hover:bg-red-600"><X className="w-3 h-3" /></button>
                </div>
              )}
              
              {props.showEmojiPicker && (
                <div className="absolute bottom-16 sm:bottom-20 left-2 sm:left-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 max-w-[95vw]">
                  <EmojiPicker onEmojiClick={(e) => props.setNewMessage(prev => prev + e.emoji)} width={typeof window !== 'undefined' && window.innerWidth < 640 ? 300 : 320} height={350} />
                </div>
              )}

              <form onSubmit={props.handleSendMessage} className="flex items-center gap-1 sm:gap-2 bg-slate-50 border border-slate-200 rounded-full sm:rounded-2xl p-1 sm:p-1.5 focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <button type="button" onClick={() => props.fileInputRef.current?.click()} className="p-1.5 sm:p-2 text-slate-500 hover:text-[#0f172a] hover:bg-slate-200/50 rounded-full sm:rounded-xl transition-colors shrink-0">
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                  <input type="file" accept="image/*" className="hidden" ref={props.fileInputRef} onChange={props.handleImageChange} />
                </button>
                
                <input 
                  className="flex-1 bg-transparent border-none text-xs sm:text-sm font-medium focus:ring-0 px-1 sm:px-2 outline-none"
                  placeholder="Message..."
                  value={props.newMessage}
                  onChange={props.handleTyping}
                  onClick={() => props.setShowEmojiPicker(false)}
                />
                
                <button type="button" onClick={() => props.setShowEmojiPicker(!props.showEmojiPicker)} className="p-1.5 sm:p-2 text-slate-500 hover:text-[#0f172a] hover:bg-slate-200/50 rounded-full sm:rounded-xl transition-colors shrink-0 hidden sm:block">
                  <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <Button type="submit" disabled={(!props.newMessage.trim() && !props.mediaUrl)} className="bg-[#0f172a] hover:bg-slate-800 text-white rounded-full sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 h-auto ml-0.5 sm:ml-1 transition-colors disabled:opacity-50 shrink-0">
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:ml-0.5" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Right Profile Summary */}
      {props.activeUser && (typeof window !== 'undefined' && window.innerWidth >= 1024) && (
        <div className="w-72 border-l border-slate-200 bg-[#fdfdfd] flex-col shrink-0 hidden lg:flex">
          <div className="p-6 xl:p-8 flex flex-col items-center border-b border-slate-100">
            <Avatar className="w-20 h-20 xl:w-24 xl:h-24 border-4 border-white shadow-md mb-3 xl:mb-4 cursor-pointer" onClick={() => props.setSelectedProfile(props.activeUser!)}>
              <AvatarImage alt='user profile' src={optimizeImage(props.activeUser.avatarUrl, 100, 100)} />
              <AvatarFallback className="bg-slate-100 text-lg xl:text-xl font-black text-slate-600">{props.activeUser.firstName[0]}</AvatarFallback>
            </Avatar>
            <h3 className="text-lg xl:text-xl font-black text-slate-900 mb-1 text-center leading-tight">{props.activeUser.firstName} {props.activeUser.lastName}</h3>
            <p className="text-[10px] xl:text-xs font-semibold text-slate-500 text-center mb-1">{props.activeUser.department}</p>
            
            <p className="text-[10px] xl:text-xs font-semibold text-slate-500 text-center mb-4 xl:mb-6">
              {props.activeUser.isAlumni ? 'Alumni' : `Sem ${props.activeUser.semester?.replace(/\D/g, '')} • Sec ${props.activeUser.section || 'A'}`}
            </p>
            
            <button onClick={() => props.setSelectedProfile(props.activeUser!)} className="w-full py-2 xl:py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] xl:text-xs font-bold rounded-lg xl:rounded-xl shadow-sm transition-colors">
              View Full Profile
            </button>
          </div>

          <div className="p-4 xl:p-6 space-y-3 xl:space-y-4 mt-auto">
            <button onClick={props.toggleMute} className={`flex items-center gap-2 xl:gap-3 text-[10px] xl:text-xs font-bold transition-colors w-full ${props.mutedUsers.has(props.activeUser._id) ? 'text-orange-500 hover:text-orange-600' : 'text-slate-500 hover:text-slate-800'}`}>
              {props.mutedUsers.has(props.activeUser._id) ? <BellRing className="w-3.5 h-3.5 xl:w-4 xl:h-4" /> : <BellOff className="w-3.5 h-3.5 xl:w-4 xl:h-4" />}
              {props.mutedUsers.has(props.activeUser._id) ? 'Unmute Notifications' : 'Mute Notifications'}
            </button>
            <button onClick={props.handleBlock} className={`flex items-center gap-2 xl:gap-3 text-[10px] xl:text-xs font-bold transition-colors w-full ${props.blockedUsers.has(props.activeUser._id) ? 'text-slate-500 hover:text-slate-700' : 'text-red-500 hover:text-red-700'}`}>
              <Ban className="w-3.5 h-3.5 xl:w-4 xl:h-4" /> 
              {props.blockedUsers.has(props.activeUser._id) ? 'Unblock User' : 'Block User'}
            </button>
            <button onClick={() => props.setReportModalOpen(true)} className="flex items-center gap-2 xl:gap-3 text-[10px] xl:text-xs font-bold text-red-500 hover:text-red-700 transition-colors w-full">
              <Flag className="w-3.5 h-3.5 xl:w-4 xl:h-4" /> Report User
            </button>
          </div>
        </div>
      )}
    </div>
  );
}