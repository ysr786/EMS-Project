"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type Message = { _id: string; senderId: string; senderName: string; content: string; readBy: string[]; createdAt: string };
type Conversation = { _id: string; participants: string[]; participantNames: string[]; messages: Message[]; lastMessage: string; lastMessageAt: string };
type User = { _id: string; name: string; email: string; role: string };

const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
  superadmin: { label: "Superadmin", color: "text-purple-700", bg: "bg-purple-100" },
  admin:      { label: "Admin",      color: "text-blue-700",   bg: "bg-blue-100"   },
  hr_manager: { label: "HR Manager", color: "text-amber-700",  bg: "bg-amber-100"  },
  employee:   { label: "Employee",   color: "text-green-700",  bg: "bg-green-100"  },
};
const avatarColors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
function getColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MessagesClient({ currentUserId, currentUserName }: { currentUserId: string; currentUserName: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [deletingConv, setDeletingConv] = useState(false);

  async function deleteConversation() {
    if (!activeConv || !confirm("Delete this conversation? This cannot be undone.")) return;
    setDeletingConv(true);
    await fetch(`/api/messages/${activeConv._id}`, { method: "DELETE" });
    setDeletingConv(false);
    setActiveConv(null);
    fetchConversations();
  }

  const activeConvIdRef = useRef<string | null>(null);

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/messages");
    const data = await res.json();
    if (Array.isArray(data)) setConversations(data);
    setLoadingConvs(false);
  }, []);

  // poll conversations list every 10s
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // poll active conversation every 5s for new messages
  useEffect(() => {
    if (!activeConv) return;
    activeConvIdRef.current = activeConv._id;
    const interval = setInterval(async () => {
      if (!activeConvIdRef.current) return;
      const res = await fetch(`/api/messages/${activeConvIdRef.current}`);
      if (!res.ok) return;
      const data = await res.json();
      setActiveConv((prev) => {
        if (!prev || prev._id !== data._id) return prev;
        // only update if message count changed
        if (prev.messages.length === data.messages.length) return prev;
        return data;
      });
      fetchConversations();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeConv?._id, fetchConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  async function openConversation(conv: Conversation) {
    const res = await fetch(`/api/messages/${conv._id}`);
    const data = await res.json();
    setActiveConv(data);
    fetchConversations();
  }

  async function sendReply() {
    if (!message.trim() || !activeConv) return;
    setSending(true);
    const res = await fetch(`/api/messages/${activeConv._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    const data = await res.json();
    setActiveConv(data);
    setMessage("");
    setSending(false);
    fetchConversations();
  }

  async function openNewModal() {
    setShowNewModal(true);
    const res = await fetch("/api/messages/users");
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data);
  }

  async function startConversation() {
    if (!selectedUser || !newMessage.trim()) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: selectedUser._id, content: newMessage }),
    });
    const data = await res.json();
    setSending(false);
    setShowNewModal(false);
    setSelectedUser(null);
    setNewMessage("");
    setUserSearch("");
    await fetchConversations();
    setActiveConv(data);
  }

  function getOtherName(conv: Conversation) {
    const idx = conv.participants.indexOf(currentUserId);
    return conv.participantNames[idx === 0 ? 1 : 0] || "Unknown";
  }

  function getUnreadCount(conv: Conversation) {
    return conv.messages.filter((m) => m.senderId !== currentUserId && !m.readBy.includes(currentUserId)).length;
  }

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
        <div className="flex h-full">

          {/* Sidebar - conversation list */}
          <div className="w-80 border-r border-gray-100 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Inbox</h2>
              <button onClick={openNewModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex items-center justify-center h-32">
                  <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                  <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-400 text-xs">No conversations yet</p>
                  <p className="text-gray-300 text-xs mt-1">Click "New" to start one</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherName = getOtherName(conv);
                  const unread = getUnreadCount(conv);
                  const isActive = activeConv?._id === conv._id;
                  return (
                    <button key={conv._id} onClick={() => openConversation(conv)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 cursor-pointer ${isActive ? "bg-blue-50 border-l-2 border-l-blue-600" : ""}`}>
                      <div className={`w-10 h-10 ${getColor(otherName)} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 relative`}>
                        {getInitials(otherName)}
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${unread > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>{otherName}</p>
                          <span className="text-xs text-gray-400 shrink-0 ml-1">{timeAgo(conv.lastMessageAt)}</span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>{conv.lastMessage || "No messages yet"}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeConv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-semibold">Select a conversation</p>
                <p className="text-gray-400 text-sm mt-1">Choose from your inbox or start a new message</p>
                <button onClick={openNewModal}
                  className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Message
                </button>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className={`w-9 h-9 ${getColor(getOtherName(activeConv))} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {getInitials(getOtherName(activeConv))}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{getOtherName(activeConv)}</p>
                    <p className="text-xs text-gray-400">{activeConv.messages.length} message{activeConv.messages.length !== 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={deleteConversation} disabled={deletingConv}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shrink-0">
                    {deletingConv
                      ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                      : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                    Delete
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {activeConv.messages.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No messages yet. Say hello!</p>
                  )}
                  {activeConv.messages.map((msg) => {
                    const isMine = msg.senderId === currentUserId;
                    const isUnread = !isMine && !msg.readBy.includes(currentUserId);
                    return (
                      <div key={msg._id} className={`flex items-end gap-2.5 ${isMine ? "flex-row-reverse" : ""}`}>
                        {!isMine && (
                          <div className={`w-7 h-7 ${getColor(msg.senderName)} rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                            {getInitials(msg.senderName)}
                          </div>
                        )}
                        <div className={`max-w-[65%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                          {!isMine && <p className="text-xs text-gray-400 px-1">{msg.senderName}</p>}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? "bg-blue-600 text-white rounded-br-sm" : isUnread ? "bg-blue-50 border border-blue-200 text-gray-800 rounded-bl-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-2 px-1">
                            <p className="text-[10px] text-gray-400">{timeAgo(msg.createdAt)}</p>
                            {isUnread && (
                              <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">New</span>
                            )}
                            {isMine && (
                              <span className="text-[10px] text-gray-300">
                                {msg.readBy.length > 1 ? "✓✓ Read" : "✓ Sent"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Type a message... (Enter to send)"
                      rows={1}
                      className="flex-1 border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                    />
                    <button onClick={sendReply} disabled={sending || !message.trim()}
                      className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0">
                      {sending
                        ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* New message modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-[slideUp_0.3s_ease-out]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">New Message</h3>
              <button onClick={() => { setShowNewModal(false); setSelectedUser(null); setNewMessage(""); setUserSearch(""); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* User search */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">To</label>
                {selectedUser ? (
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className={`w-7 h-7 ${getColor(selectedUser.name)} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {getInitials(selectedUser.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                      <p className="text-xs text-gray-400">{selectedUser.email}</p>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-1">
                      {filteredUsers.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No users found</p>}
                      {filteredUsers.map((u, i) => {
                        const meta = roleMeta[u.role] || roleMeta.employee;
                        return (
                          <button key={u._id} onClick={() => setSelectedUser(u)}
                            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer">
                            <div className={`w-8 h-8 ${avatarColors[i % avatarColors.length]} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                              {getInitials(u.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                              <p className="text-xs text-gray-400 truncate">{u.email}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${meta.bg} ${meta.color}`}>{meta.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Message</label>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write your message..."
                  rows={4}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none" />
              </div>

              <button onClick={startConversation} disabled={!selectedUser || !newMessage.trim() || sending}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-all cursor-pointer">
                {sending
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Sending...</>
                  : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> Send Message</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
