"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp, Check, Menu, MessageSquare, MoreHorizontal, Search, Sparkles, SquarePen, X,
} from "lucide-react";

type Message = { id: string; role: "user" | "assistant"; content: string; createdAt: number };
type Chat = { id: string; title: string; messages: Message[]; updatedAt: number };

const STORAGE_KEY = "sx83-chat-sessions-v1";
const starterPrompts = [
  "Explain a complex topic clearly",
  "Research a question and compare evidence",
  "Help me plan and structure a project",
];

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find((chat) => chat.id === activeId) || null;
  const messages = activeChat?.messages || [];

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Chat[];
        if (Array.isArray(parsed)) {
          setChats(parsed);
          if (parsed.length) setActiveId(parsed[0].id);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats, loaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: sending ? "smooth" : "auto", block: "end" });
  }, [messages.length, sending]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSidebarOpen(true);
        window.setTimeout(() => document.getElementById("chat-search")?.focus(), 80);
      }
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function createChat() {
    const chat: Chat = { id: makeId(), title: "New chat", messages: [], updatedAt: Date.now() };
    setChats((current) => [chat, ...current]);
    setActiveId(chat.id);
    setInput("");
    setError("");
    setSidebarOpen(false);
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function selectChat(id: string) {
    setActiveId(id);
    setSidebarOpen(false);
    setError("");
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    let chatId = activeId;
    let baseChat = activeChat;
    if (!baseChat) {
      chatId = makeId();
      baseChat = { id: chatId, title: content.slice(0, 42), messages: [], updatedAt: Date.now() };
      setActiveId(chatId);
    }

    const userMessage: Message = { id: makeId(), role: "user", content, createdAt: Date.now() };
    const nextMessages = [...baseChat.messages, userMessage];
    const title = baseChat.messages.length ? baseChat.title : content.replace(/\s+/g, " ").slice(0, 42);
    const updatedChat: Chat = { ...baseChat, id: chatId, title, messages: nextMessages, updatedAt: Date.now() };
    setChats((current) => [updatedChat, ...current.filter((chat) => chat.id !== chatId)]);
    setInput("");
    setError("");
    setSending(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const response = await fetch("/api/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-20).map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The assistant could not respond.");
      const assistantMessage: Message = {
        id: makeId(),
        role: "assistant",
        content: data.answer || "No response was returned.",
        createdAt: Date.now(),
      };
      setChats((current) => current.map((chat) => chat.id === chatId
        ? { ...chat, messages: [...chat.messages, assistantMessage], updatedAt: Date.now() }
        : chat));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed. Try again.");
    } finally {
      setSending(false);
      window.setTimeout(() => textareaRef.current?.focus(), 30);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function resizeInput(element: HTMLTextAreaElement) {
    element.style.height = "auto";
    element.style.height = Math.min(element.scrollHeight, 190) + "px";
  }

  function deleteCurrentChat() {
    if (!activeChat) return;
    const remaining = chats.filter((chat) => chat.id !== activeChat.id);
    setChats(remaining);
    setActiveId(remaining[0]?.id || "");
    setMenuOpen(false);
  }

  async function copyMessage(message: Message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(""), 1500);
    } catch {
      setError("Clipboard access is unavailable in this browser.");
    }
  }

  const visibleChats = chats.filter((chat) => chat.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="chat-app">
      <aside className={"chat-sidebar" + (sidebarOpen ? " is-open" : "")}>
        <div className="sidebar-top">
          <Link className="sx-brand" href="/" aria-label="SX83 home">
            <span className="sx-brand-mark">SX<span>83</span></span>
            <span className="sx-brand-name">SX83<small>INTELLIGENCE, IN CONVERSATION</small></span>
          </a>
          <button className="sidebar-icon mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X size={18}/></button>
        </div>
        <button className="new-chat-button" onClick={createChat}>
          <SquarePen size={16}/><span>New chat</span><kbd>⌘ K</kbd>
        </button>
        <div className="history-label">YOUR CONVERSATIONS</div>
        <label className="history-search">
          <Search size={15}/>
          <input id="chat-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats"/>
        </label>
        <div className="chat-history">
          {visibleChats.map((chat) => (
            <button key={chat.id} className={"history-item" + (chat.id === activeId ? " selected" : "")} onClick={() => selectChat(chat.id)}>
              <MessageSquare size={15}/><span>{chat.title}</span>
            </button>
          ))}
          {visibleChats.length === 0 && <div className="history-empty">{chats.length ? "No matching conversations" : "Your conversations will appear here."}</div>}
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-divider"/>
          <div className="account-row">
            <div className="account-avatar">83</div>
            <div className="account-copy"><strong>SectorX83</strong><span>Personal workspace</span></div>
            <span className="account-indicator"/>
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"/>}

      <section className="chat-main">
        <header className="chat-topbar">
          <div className="topbar-start">
            <button className="sidebar-icon" onClick={() => setSidebarOpen(true)} aria-label="Open conversations"><Menu size={19}/></button>
            <div className="topbar-brand">SX83 <span>/</span> <strong>{activeChat?.title || "New conversation"}</strong></div>
          </div>
          <div className="topbar-end">
            <div className="model-indicator"><span/> X83 RESEARCH</div>
            {activeChat && <div className="chat-menu-wrap">
              <button className="sidebar-icon" onClick={() => setMenuOpen((open) => !open)} aria-label="Conversation options"><MoreHorizontal size={19}/></button>
              {menuOpen && <div className="chat-menu"><button onClick={deleteCurrentChat}>Delete conversation</button></div>}
            </div>}
          </div>
        </header>

        <div className={"conversation-area" + (messages.length === 0 ? " is-empty" : "")}>
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-emblem"><Sparkles size={23}/></div>
              <div className="welcome-kicker">SECTORX83 · RESEARCH ASSISTANT</div>
              <h1>What are we<br/><span>thinking about?</span></h1>
              <p className="welcome-description">A clear space to ask, explore, build, and work through ideas.</p>
              <div className="starter-grid">
                {starterPrompts.map((prompt) => <button key={prompt} onClick={() => void sendMessage(prompt)}><span>{prompt}</span><ArrowUp size={15}/></button>)}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article key={message.id} className={"message-row " + message.role}>
                  {message.role === "assistant" && <div className="message-avatar"><Sparkles size={15}/></div>}
                  <div className="message-content">
                    <div className="message-author">{message.role === "user" ? "YOU" : "SX83"}</div>
                    <div className="message-text">{message.content}</div>
                    {message.role === "assistant" && <div className="message-actions">
                      <button onClick={() => void copyMessage(message)} aria-label="Copy response">{copiedId === message.id ? <Check size={14}/> : <span className="copy-glyph">▢</span>}{copiedId === message.id ? "Copied" : "Copy"}</button>
                    </div>}
                  </div>
                </article>
              ))}
              {sending && <article className="message-row assistant"><div className="message-avatar"><Sparkles size={15}/></div><div className="message-content"><div className="message-author">SX83</div><div className="thinking-indicator"><i/><i/><i/><span>Thinking</span></div></div></article>}
              <div ref={bottomRef}/>
            </div>
          )}
        </div>

        <div className="composer-zone">
          {error && <div className="chat-error"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={14}/></button></div>}
          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => { setInput(event.target.value); resizeInput(event.currentTarget); }}
              onKeyDown={handleInputKeyDown}
              placeholder="Message SX83…"
              rows={1}
              aria-label="Message SX83"
              disabled={sending}
            />
            <div className="composer-footer">
              <div className="composer-hint"><span className="composer-spark"><Sparkles size={13}/></span><span>Clear questions get better answers</span></div>
              <div className="composer-controls"><span className="enter-hint">ENTER TO SEND</span><button className="send-button" type="submit" disabled={!input.trim() || sending} aria-label="Send message">{sending ? <span className="send-spinner"/> : <ArrowUp size={17}/>}</button></div>
            </div>
          </form>
          <div className="disclaimer">SX83 can make mistakes. Verify important information with reliable sources.</div>
        </div>
      </section>
    </main>
  );
}
