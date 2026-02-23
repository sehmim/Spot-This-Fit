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
import { Lock, ExternalLink, Search, RefreshCw, Eye, MessageSquare, Bot, User, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
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
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl flex flex-col">
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

function SearchRecordsTab({ records, loading }: { records: SearchRecord[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SearchRecord | null>(null);

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

function ConversationsTab({ conversations, loading }: { conversations: Conversation[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);

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

// ── Analytics Tab ─────────────────────────────────────────────────────────────

interface DailyPoint {
  date: string;        // "Feb 14"
  messages: number;
  searches: number;
  users: number;
  cumMessages: number;
  cumUsers: number;
}

function buildDailyTimeline(
  conversations: Conversation[],
  searchRecords: SearchRecord[],
): DailyPoint[] {
  // Collect all dates that appear in either dataset
  const dayMap = new Map<string, { messages: number; userSet: Set<string>; searches: number }>();

  const getKey = (d: Date) =>
    d.toLocaleDateString("en-CA"); // YYYY-MM-DD for stable sort

  const ensureDay = (key: string) => {
    if (!dayMap.has(key)) dayMap.set(key, { messages: 0, userSet: new Set(), searches: 0 });
    return dayMap.get(key)!;
  };

  for (const convo of conversations) {
    for (const msg of convo.messages) {
      const key = getKey(new Date(msg.created_at * 1000));
      const day = ensureDay(key);
      day.messages++;
      day.userSet.add(convo.senderId);
    }
  }

  for (const rec of searchRecords) {
    if (!rec.createdAt) continue;
    const key = getKey(rec.createdAt.toDate());
    ensureDay(key).searches++;
  }

  const sorted = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  let cumMessages = 0;
  let cumUsers = 0;
  const seenUsers = new Set<string>();

  return sorted.map(([isoDate, v]) => {
    cumMessages += v.messages;
    for (const u of v.userSet) {
      if (!seenUsers.has(u)) { seenUsers.add(u); cumUsers++; }
    }
    const label = new Date(isoDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      date: label,
      messages: v.messages,
      searches: v.searches,
      users: v.userSet.size,
      cumMessages,
      cumUsers,
    };
  });
}

const CHART_COLORS = {
  messages: "#7c3aed",
  users: "#a78bfa",
  searches: "#c4b5fd",
  cumMessages: "#7c3aed",
  cumUsers: "#a78bfa",
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AnalyticsTab({
  conversations,
  searchRecords,
  loading,
}: {
  conversations: Conversation[];
  searchRecords: SearchRecord[];
  loading: boolean;
}) {
  const timeline = buildDailyTimeline(conversations, searchRecords);

  const totalMessages = conversations.reduce((s, c) => s + c.messages.length, 0);
  const totalUsers = conversations.length;
  const totalSearches = searchRecords.length;

  // 7-day window
  const last7 = timeline.slice(-7);
  const prev7 = timeline.slice(-14, -7);
  const msgLast7 = last7.reduce((s, d) => s + d.messages, 0);
  const msgPrev7 = prev7.reduce((s, d) => s + d.messages, 0);
  const msgTrend = msgPrev7 === 0 ? null : Math.round(((msgLast7 - msgPrev7) / msgPrev7) * 100);

  const noData = timeline.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Usage & Growth</h2>
          <p className="text-xs text-muted-foreground">Across conversations and searches</p>
        </div>
        {loading && <RefreshCw className="size-4 animate-spin text-muted-foreground" />}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total Users" value={totalUsers} />
        <StatCard label="Total Messages" value={totalMessages} />
        <StatCard
          label="Messages (last 7d)"
          value={msgLast7}
          sub={
            msgTrend === null
              ? undefined
              : msgTrend >= 0
              ? `↑ ${msgTrend}% vs prev 7d`
              : `↓ ${Math.abs(msgTrend)}% vs prev 7d`
          }
        />
      </div>

      {noData ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card py-20 text-sm text-muted-foreground">
          <BarChart2 className="size-8 opacity-30" />
          <p>No data yet. Charts will appear once there is activity.</p>
        </div>
      ) : (
        <>
          {/* Daily activity bar chart */}
          <div className="rounded-xl border bg-card p-3 sm:p-5">
            <p className="mb-1 text-sm font-semibold">Daily Activity</p>
            <p className="mb-4 text-xs text-muted-foreground">Messages and unique users per day</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeline} barGap={2} barCategoryGap="30%" margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="messages" name="Messages" fill={CHART_COLORS.messages} radius={[3, 3, 0, 0]} />
                <Bar dataKey="users" name="Users" fill={CHART_COLORS.users} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cumulative growth area chart */}
          <div className="rounded-xl border bg-card p-3 sm:p-5">
            <p className="mb-1 text-sm font-semibold">Cumulative Growth</p>
            <p className="mb-4 text-xs text-muted-foreground">Total messages and unique users over time</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timeline} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.cumMessages} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_COLORS.cumMessages} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.cumUsers} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={CHART_COLORS.cumUsers} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumMessages"
                  name="Total messages"
                  stroke={CHART_COLORS.cumMessages}
                  strokeWidth={2}
                  fill="url(#gradMsg)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="cumUsers"
                  name="Total users"
                  stroke={CHART_COLORS.cumUsers}
                  strokeWidth={2}
                  fill="url(#gradUsers)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily searches bar chart — only if there are any */}
          {totalSearches > 0 && (
            <div className="rounded-xl border bg-card p-3 sm:p-5">
              <p className="mb-1 text-sm font-semibold">Daily Searches</p>
              <p className="mb-4 text-xs text-muted-foreground">Video search records created per day</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={timeline} barCategoryGap="30%" margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="searches" name="Searches" fill={CHART_COLORS.searches} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Dashboard Shell ───────────────────────────────────────────────────────────

type Tab = "analytics" | "conversations" | "searches";

function Dashboard() {
  const [tab, setTab] = useState<Tab>("analytics");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchRecords, setSearchRecords] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [convRes, recSnap] = await Promise.all([
        fetch(`${WEBHOOK_BASE}/admin/conversations?secret=${encodeURIComponent(ADMIN_SECRET)}&limit=500`),
        getDocs(query(collection(db, "videoSearches"), orderBy("createdAt", "desc"))),
      ]);

      if (convRes.ok) {
        const data: { messages: Message[] } = await convRes.json();
        const map = new Map<string, Message[]>();
        for (const msg of data.messages) {
          if (!map.has(msg.sender_id)) map.set(msg.sender_id, []);
          map.get(msg.sender_id)!.push(msg);
        }
        const convos: Conversation[] = Array.from(map.entries()).map(([senderId, msgs]) => ({
          senderId, messages: msgs, lastMessageAt: msgs[0].created_at,
        }));
        convos.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
        setConversations(convos);
      }

      setSearchRecords(recSnap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, videoUrl: data.videoUrl ?? "", frames: Array.isArray(data.frames) ? data.frames : [], createdAt: data.createdAt ?? null };
      }));
    } catch { /* keep existing data on error */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Spot This — Admin</h1>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mx-auto mt-4 flex max-w-6xl gap-0 border-b -mb-4">
          {(["analytics", "conversations", "searches"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 px-2 pb-3 text-xs font-medium transition-colors sm:flex-none sm:px-4 sm:text-sm",
                tab === t
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "analytics" ? (
                <span className="flex items-center justify-center gap-1 sm:gap-1.5">
                  <BarChart2 className="size-3.5 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Analytics</span>
                  <span className="xs:hidden sm:hidden">Stats</span>
                </span>
              ) : t === "conversations" ? (
                <span className="flex items-center justify-center gap-1 sm:gap-1.5">
                  <MessageSquare className="size-3.5 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Conversations</span>
                  <span className="xs:hidden sm:hidden">Chats</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1 sm:gap-1.5">
                  <Search className="size-3.5 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Search Records</span>
                  <span className="xs:hidden sm:hidden">Searches</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {tab === "analytics" ? (
          <AnalyticsTab conversations={conversations} searchRecords={searchRecords} loading={loading} />
        ) : tab === "conversations" ? (
          <ConversationsTab conversations={conversations} loading={loading} />
        ) : (
          <SearchRecordsTab records={searchRecords} loading={loading} />
        )}
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
