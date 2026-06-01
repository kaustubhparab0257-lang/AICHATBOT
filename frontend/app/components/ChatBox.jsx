"use client";

import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "firebase/auth";
import {
  Bot,
  ChevronDown,
  Command,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Send,
  Sparkles,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import FormattedMessage from "./FormattedMessage";
import { auth } from "../lib/firebase";
import {
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  subscribeToAuth,
} from "../lib/authStorage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const starters = [
  "Create a product launch checklist",
  "Explain JavaScript promises simply",
  "Write a polished project introduction",
];

const getServerUser = () => null;

const parseUser = (storedUser) => {
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

export default function ChatBox() {
  const router = useRouter();
  const storedUser = useSyncExternalStore(
    subscribeToAuth,
    getStoredUser,
    getServerUser
  );
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const chatEndRef = useRef(null);
  const profileRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const user = parseUser(storedUser);
  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }

    clearAuthSession();
    setProfileOpen(false);
    router.replace("/login");
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typing]);

  useEffect(() => {
    const closeProfile = (event) => {
      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", closeProfile);

    return () => {
      document.removeEventListener("mousedown", closeProfile);
    };
  }, []);

  useEffect(() => {
    // Initialize socket on client mount
    try {
      const s = io(API_URL);
      setSocket(s);

      s.on("connect", () => {
        console.log("Socket connected (client):", s.id);
      });

      s.on("receive_message", (data) => {
        console.log("Socket receive_message (client):", data && data.sender, data && data.id);
        setMessages((prev) => {
          if (!data) return prev;
          if (data.id && prev.some((m) => m.id === data.id)) {
            // duplicate (we already added locally), skip
            return prev;
          }
          return [...prev, data];
        });
      });

      s.on("disconnect", (reason) => {
        console.log("Socket disconnected (client):", reason);
      });

      return () => {
        s.off("receive_message");
        s.disconnect();
      };
    } catch (err) {
      console.error("Socket init failed:", err);
    }
  }, []);

  const sendMessage = async (presetMessage) => {
    const messageText = (presetMessage || input).trim();

    if (!messageText || loading) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const userMessage = {
      id,
      sender: "user",
      text: messageText,
      ts: Date.now(),
    };

    // Optimistically add the user's message to UI
    setMessages((prev) => [...prev, userMessage]);

    // Emit via socket if available (so server can broadcast to other clients)
    if (socket && socket.connected) {
      socket.emit("send_message", userMessage);
    } else {
      console.warn("Socket not connected; message will still be sent to backend via API.");
    }
    setInput("");
    setError("");
    setTyping(true);
    setLoading(true);
    setMobileSidebarOpen(false);

    try {
      const token = getAuthToken();

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.post(`${API_URL}/api/chat`, { message: messageText }, { headers });

      const botMessage = {
        id: `${id}-bot`,
        sender: "bot",
        text: res.data.reply,
        ts: Date.now(),
      };

      // Emit bot message via socket (server will broadcast)
      if (socket && socket.connected) {
        socket.emit("send_message", botMessage);
      } else {
        // If socket not available, add bot message locally so user sees reply
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Chat request failed:", error);

      if (error.response?.status === 401) {
        clearAuthSession();
        router.replace("/login");
        return;
      }

      const message =
        error.response?.data?.error ||
        "Could not reach the AI service. Check that the backend server is running.";
      setError(message);
    } finally {
      setTyping(false);
      setLoading(false);
    }
  };

  return (
    <div className="premium-shell relative flex h-screen overflow-hidden text-gray-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(139,92,246,0.14),transparent_28rem),radial-gradient(circle_at_90%_14%,rgba(236,72,153,0.12),transparent_24rem)]" />

      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`glass-panel fixed inset-y-3 left-3 z-50 flex flex-col rounded-[1.75rem] lg:relative lg:inset-auto lg:z-10 lg:m-3 ${
          sidebarCollapsed ? "lg:w-[92px]" : "lg:w-80"
        } ${mobileSidebarOpen ? "w-[min(21rem,calc(100vw-1.5rem))]" : "w-0 -translate-x-[110%] lg:translate-x-0"}`}
        animate={{
          width: sidebarCollapsed ? 92 : 320,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="flex h-full min-w-[92px] flex-col overflow-hidden p-4">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-violet-200">
                <WandSparkles className="h-6 w-6" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-lg font-black tracking-tight text-gray-900">
                    ChatGen AI
                  </p>
                  <p className="truncate text-xs font-medium text-gray-500">
                    Smart AI Conversations
                  </p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="rounded-xl border border-white/80 p-2 text-gray-500 transition hover:bg-white hover:text-gray-900 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={clearChat}
            className="group mb-4 flex h-12 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 px-4 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={messages.length === 0 && !error}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>New conversation</span>}
          </button>

          {!sidebarCollapsed && (
            <div className="mb-4 rounded-2xl border border-white/80 bg-white/60 px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Search className="h-4 w-4" />
                <span className="text-sm">Search conversations</span>
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            {!sidebarCollapsed && (
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
                Recent
              </p>
            )}
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
              Live
            </span>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {messages.length === 0 && !sidebarCollapsed && (
              <div className="rounded-2xl border border-dashed border-violet-200 bg-white/50 p-4 text-sm leading-6 text-gray-500">
                Your ChatGen AI conversation history will appear here after you
                send messages.
              </div>
            )}
            {messages
              .slice(-8)
              .reverse()
              .map((msg, index) => (
                <button
                  key={index}
                  className={`w-full rounded-2xl border border-white/80 bg-white/55 p-3 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-50 ${
                    sidebarCollapsed ? "flex justify-center" : ""
                  }`}
                >
                  {sidebarCollapsed ? (
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                  ) : (
                    <>
                      <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-gray-400">
                        {msg.sender === "user" ? (
                          <UserRound className="h-3.5 w-3.5" />
                        ) : (
                          <Bot className="h-3.5 w-3.5" />
                        )}
                        {msg.sender === "user" ? "You" : "ChatGen"}
                      </p>
                      <p className="truncate text-sm text-gray-600">
                        {msg.text}
                      </p>
                    </>
                  )}
                </button>
              ))}
          </div>

          <div className="mt-4 border-t border-white/70 pt-4">
            {!sidebarCollapsed && (
              <p className="mb-3 text-xs font-semibold text-gray-500">
                ChatGen AI - Smart AI Conversations
              </p>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              className="hidden h-11 w-full items-center justify-center rounded-2xl border border-white/80 bg-white/55 text-gray-500 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 lg:flex"
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </motion.aside>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col p-3 pl-3 lg:pl-0">
        <section className="glass-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem]">
          <header className="flex items-center justify-between gap-3 border-b border-white/80 px-4 py-3.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-2xl border border-white/80 bg-white/55 p-2.5 text-gray-600 shadow-sm transition hover:bg-violet-50 hover:text-violet-700 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/60 shadow-sm sm:flex">
                <Command className="h-5 w-5 text-violet-600" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-black tracking-tight text-gray-900 sm:text-lg">
                  ChatGen AI
                </h1>
                <p className="truncate text-sm text-gray-500">
                  Smart AI Conversations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="hidden rounded-2xl border border-white/80 bg-white/55 px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 sm:inline-flex"
              >
                Clear
              </button>
              {user ? (
                <div ref={profileRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    className="flex max-w-[190px] items-center gap-2 rounded-2xl border border-white/80 bg-white/65 px-2.5 py-2 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-50 sm:max-w-[250px] sm:px-3"
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                  >
                    <Avatar
                      src={user.avatar}
                      initial={userInitial}
                      className="h-9 w-9 text-sm"
                    />
                    <span className="hidden min-w-0 sm:block">
                      <span className="block truncate text-sm font-black text-gray-900">
                        {user.name}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        ChatGen profile
                      </span>
                    </span>
                    <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        className="absolute right-0 z-30 mt-3 w-80 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-2xl shadow-violet-200/60 backdrop-blur-2xl"
                        role="menu"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                      >
                        <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-3">
                          <Avatar
                            src={user.avatar}
                            initial={userInitial}
                            className="h-12 w-12 text-base"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-gray-900">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={logout}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-100"
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-200"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </button>
              )}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            {messages.length === 0 && (
              <motion.div
                className="flex min-h-full items-center justify-center"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mx-auto w-full max-w-3xl text-center">
                  <motion.div
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/80 bg-white/65 shadow-2xl shadow-violet-200"
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="h-9 w-9 text-violet-600" />
                  </motion.div>
                  <h2 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
                    ChatGen AI
                    <span className="block bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      Smart AI Conversations
                    </span>
                  </h2>
                  <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-gray-600">
                    Start a focused session with structured responses, markdown
                    formatting, and a clean professional workspace.
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {starters.map((starter, index) => (
                      <motion.button
                        key={starter}
                        onClick={() => sendMessage(starter)}
                        className="group rounded-3xl border border-white/80 bg-white/60 p-4 text-left text-sm font-bold leading-6 text-gray-700 shadow-xl shadow-violet-100/70 backdrop-blur transition hover:border-violet-300 hover:bg-violet-50"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * index }}
                        whileHover={{ y: -4 }}
                      >
                        <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 transition group-hover:bg-pink-100 group-hover:text-pink-600">
                          <MessageSquare className="h-4 w-4" />
                        </span>
                        {starter}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => (
                  <motion.div
                    key={`${msg.sender}-${index}`}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.24 }}
                  >
                    <div
                      className={`flex max-w-[92%] gap-3 sm:max-w-[78%] ${
                        msg.sender === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                          msg.sender === "user"
                            ? "bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white"
                            : "border border-white/80 bg-white/70 text-violet-600 shadow-sm"
                        }`}
                      >
                        {msg.sender === "user" ? (
                          <UserRound className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`rounded-[1.5rem] px-5 py-4 shadow-xl ${
                          msg.sender === "user"
                            ? "rounded-tr-md bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-sm leading-7 text-white shadow-violet-200"
                            : "rounded-tl-md border border-white/80 bg-white/72 shadow-violet-100/70 backdrop-blur"
                        }`}
                      >
                        {msg.sender === "user" ? (
                          msg.text
                        ) : (
                          <FormattedMessage text={msg.text} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {typing && (
              <motion.div
                className="mt-6 flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-violet-600 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-3xl border border-white/80 bg-white/70 px-4 py-3 text-sm text-gray-500 shadow-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple-500 [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-pink-500 [animation-delay:240ms]" />
                  <span className="ml-1">ChatGen AI is composing</span>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form
            className="sticky bottom-0 border-t border-white/80 bg-white/60 p-3 backdrop-blur-xl sm:p-4"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <div className="mx-auto flex max-w-4xl items-end gap-3 rounded-[1.5rem] border border-white/80 bg-white/75 p-2 shadow-2xl shadow-violet-100/70 transition focus-within:border-violet-300 focus-within:shadow-violet-200/70">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                rows={1}
                placeholder="Ask ChatGen AI anything..."
                className="max-h-32 min-h-12 min-w-0 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <motion.button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-violet-200 transition disabled:bg-none disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                whileHover={{ y: -2, scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Send message"
              >
                {loading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </motion.button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

function Avatar({ src, initial, className }) {
  if (src) {
    return (
      <img
        src={src}
        alt="Profile avatar"
        className={`${className} shrink-0 rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 font-black text-white`}
    >
      {initial}
    </span>
  );
}
