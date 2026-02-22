"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lock, ExternalLink, Search, RefreshCw, Eye, MessageSquare, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_PASSWORD = "Bali123123!";
const SESSION_KEY = "stf_admin_auth";
const WEBHOOK_BASE = "https://spotthisfit-webhook.shadidhaque2014.workers.dev";
const ADMIN_SECRET = "Winter123";

// ── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onSuccess();
    } else {
      setError(true);
      setPassword("");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="size-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Admin Access</h1>
          <p className="text-center text-sm text-muted-foreground">
            Enter the admin password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              autoFocus
              className={cn(error && "border-destructive focus-visible:ring-destructive")}
            />
            {error && (
              <p className="text-xs text-destructive">Incorrect password.</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchRecord {
  id: string;
  videoUrl: string;
  frames: string[];
  createdAt: Timestamp | null;
}

interface Message {
  id: number;
  sender_id: string;
  role: "user" | "bot";
  content: string;
  created_at: number;
}

interface Conversation {
  senderId: string;
  messages: Message[];
  lastMessageAt: number;
}

// ── Detail Modal (search records) ─────────────────────────────────────────────

function RecordModal({
  record,
  onClose,
}: {
  record: SearchRecord | null;
  onClose: () => void;
}) {
  if (!record) return null;

  const date = record.createdAt
    ? record.createdAt.toDate().toLocaleString()
    : "—";

  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Search Record</DialogTitle>
          <DialogDescription className="break-all text-xs text-muted-foreground">
            ID: {record.id}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Video URL
            </span>
            <div className="flex items-center gap-2">
              <p className="flex-1 break-all rounded-md bg-muted/40 px-3 py-2 text-sm">
                {record.videoUrl}
              </p>
              <a
                href={record.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Created At
            </span>
            <p className="text-sm">{date}</p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Frames ({record.frames.length})
            </span>
            {record.frames.length === 0 ? (
              <p className="text-sm text-muted-foreground">No frames captured</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {record.frames.slice(0, 9).map((frame, i) => (
                  <div
                    key={i}
                    className="aspect-video overflow-hidden rounded-md border bg-muted/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={frame}
                      alt={`Frame ${i + 1}`}
                      className="size-full object-cover"
                    />
                  </div>
                ))}
                {record.frames.length > 9 && (
                  <div className="flex aspect-video items-center justify-center rounded-md border bg-muted/30 text-xs text-muted-foreground">
                    +{record.frames.length - 9} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Conversation Thread Modal ─────────────────────────────────────────────────

function ConversationModal({
  conversation,
  onClose,
}: {
  conversation: Conversation | null;
  onClose: () => void;
}) {
  if (!conversation) return null;

  // Show oldest first in the modal
  const messages = [...conversation.messages].reverse();

  return (
    <Dialog open={!!conversation} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-2xl flex flex-col">
        <DialogHeader>
          <DialogTitle>Conversation</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            User ID: {conversation.senderId} · {conversation.messages.length} messages
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pt-2 pr-1">
          {messages.map((msg) => {
            const isBot = msg.role === "bot";
            const time = new Date(msg.created_at * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const date = new Date(msg.created_at * 1000).toLocaleDateString();

            return (
              <div
                key={msg.id}
                className={cn("flex gap-2.5", isBot ? "flex-row" : "flex-row-reverse")}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-white",
                    isBot ? "bg-primary" : "bg-muted-foreground"
                  )}
                >
                  {isBot ? <Bot className="size-4" /> : <User className="size-4" />}
                </div>

                {/* Bubble */}
                <div className={cn("flex max-w-[75%] flex-col gap-1", isBot ? "items-start" : "items-end")}>
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                      isBot
                        ? "rounded-tl-sm bg-muted text-foreground"
                        : "rounded-tr-sm bg-primary text-primary-foreground"
                    )}
                  >
                    {msg.content.includes("lookaside.fbsbx.com") ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎬</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-xs">Instagram Reel</span>
                          <a
                            href={msg.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] underline opacity-70 hover:opacity-100 truncate max-w-[180px] block"
                          >
                            {msg.content.split("asset_id=")[1]?.split("&")[0] ?? "Open video"}
                          </a>
                        </div>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {date} · {time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Search Records Tab ────────────────────────────────────────────────────────

function SearchRecordsTab() {
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SearchRecord | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "videoSearches"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setRecords(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            videoUrl: data.videoUrl ?? "",
            frames: Array.isArray(data.frames) ? data.frames : [],
            createdAt: data.createdAt ?? null,
          };
        })
      );
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = records.filter(
    (r) =>
      r.videoUrl.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Searches</p>
          <p className="mt-1 text-2xl font-bold">{records.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Frames</p>
          <p className="mt-1 text-2xl font-bold">
            {records.reduce((sum, r) => sum + r.frames.length, 0)}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border bg-card p-4 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Avg Frames / Search</p>
          <p className="mt-1 text-2xl font-bold">
            {records.length === 0
              ? "—"
              : (records.reduce((sum, r) => sum + r.frames.length, 0) / records.length).toFixed(1)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by URL or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {search && (
          <Badge variant="secondary" className="shrink-0">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            <RefreshCw className="mr-2 size-4 animate-spin" />
            Loading records…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <p>{search ? "No records match your filter." : "No records found."}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">ID</th>
                <th className="hidden px-4 py-3 sm:table-cell">Video URL</th>
                <th className="px-4 py-3 text-center">Frames</th>
                <th className="hidden px-4 py-3 md:table-cell">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, i) => {
                const date = record.createdAt
                  ? record.createdAt.toDate().toLocaleDateString()
                  : "—";
                return (
                  <tr
                    key={record.id}
                    onClick={() => setSelected(record)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/30",
                      i !== filtered.length - 1 && "border-b"
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {record.id.slice(0, 8)}…
                    </td>
                    <td className="hidden max-w-xs px-4 py-3 sm:table-cell">
                      <span className="block truncate text-xs text-muted-foreground">
                        {record.videoUrl || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary">{record.frames.length}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                      {date}
                    </td>
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Eye className="size-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <RecordModal record={selected} onClose={() => setSelected(null)} />
    </>
  );
}

// ── Conversations Tab ─────────────────────────────────────────────────────────

function ConversationsTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${WEBHOOK_BASE}/admin/conversations?secret=${encodeURIComponent(ADMIN_SECRET)}&limit=500`
      );
      if (!res.ok) throw new Error("Unauthorized");
      const data: { messages: Message[] } = await res.json();

      // Group messages by sender_id, newest conversation first
      const map = new Map<string, Message[]>();
      for (const msg of data.messages) {
        if (!map.has(msg.sender_id)) map.set(msg.sender_id, []);
        map.get(msg.sender_id)!.push(msg);
      }

      const convos: Conversation[] = Array.from(map.entries()).map(([senderId, msgs]) => ({
        senderId,
        messages: msgs, // already DESC from API
        lastMessageAt: msgs[0].created_at,
      }));

      convos.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      setConversations(convos);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("stf_admin_secret");
    if (stored) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [fetchConversations]);

  const filtered = conversations.filter((c) =>
    c.senderId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Unique Users</p>
          <p className="mt-1 text-2xl font-bold">{conversations.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Messages</p>
          <p className="mt-1 text-2xl font-bold">
            {conversations.reduce((s, c) => s + c.messages.length, 0)}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border bg-card p-4 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Avg Messages / User</p>
          <p className="mt-1 text-2xl font-bold">
            {conversations.length === 0
              ? "—"
              : (
                  conversations.reduce((s, c) => s + c.messages.length, 0) /
                  conversations.length
                ).toFixed(1)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by user ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchConversations} disabled={loading} className="gap-2 shrink-0">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            <RefreshCw className="mr-2 size-4 animate-spin" />
            Loading conversations…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <MessageSquare className="size-8 opacity-30" />
            <p>{search ? "No conversations match your filter." : "No conversations yet."}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3 text-center">Messages</th>
                <th className="hidden px-4 py-3 md:table-cell">Last Message</th>
                <th className="hidden px-4 py-3 sm:table-cell">Preview</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((convo, i) => {
                const lastMsg = convo.messages[0];
                const date = new Date(convo.lastMessageAt * 1000).toLocaleString();
                const preview = lastMsg.content.slice(0, 60) + (lastMsg.content.length > 60 ? "…" : "");
                return (
                  <tr
                    key={convo.senderId}
                    onClick={() => setSelected(convo)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/30",
                      i !== filtered.length - 1 && "border-b"
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {convo.senderId}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary">{convo.messages.length}</Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                      {date}
                    </td>
                    <td className="hidden max-w-xs px-4 py-3 sm:table-cell">
                      <span className={cn(
                        "block truncate text-xs",
                        lastMsg.role === "bot" ? "text-primary/70" : "text-muted-foreground"
                      )}>
                        {lastMsg.role === "bot" ? "🤖 " : "👤 "}{preview}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Eye className="size-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConversationModal conversation={selected} onClose={() => setSelected(null)} />
    </>
  );
}

// ── Secret Prompt ─────────────────────────────────────────────────────────────

function SecretPrompt({ onSet }: { onSet: () => void }) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("stf_admin_secret");
    if (stored) {
      setValue(stored);
      setSaved(true);
    }
  }, []);

  function save() {
    sessionStorage.setItem("stf_admin_secret", value);
    setSaved(true);
    onSet();
  }

  if (saved) return null;

  return (
    <div className="mb-6 flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 p-4">
      <Input
        type="password"
        placeholder="Enter webhook secret to load conversations…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="flex-1"
      />
      <Button size="sm" onClick={save} disabled={!value}>
        Load
      </Button>
    </div>
  );
}

// ── Dashboard Shell ───────────────────────────────────────────────────────────

type Tab = "searches" | "conversations";

function Dashboard() {
  const [tab, setTab] = useState<Tab>("conversations");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">SpotThisFit Admin</h1>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
          {tab === "searches" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoading((l) => !l)}
              className="gap-2"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>

        {/* Tab bar */}
        <div className="mx-auto mt-4 flex max-w-6xl gap-1 border-b -mb-4">
          {(["conversations", "searches"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 pb-3 text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "conversations" ? (
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="size-3.5" /> Conversations
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Search className="size-3.5" /> Search Records
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "conversations" ? <ConversationsTab /> : <SearchRecordsTab />}
      </main>
    </div>
  );
}

// ── Page Entry ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === "1");
  }, []);

  if (authed === null) return null;
  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;
  return <Dashboard />;
}
