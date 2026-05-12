import React from "react";
import { filterSwarmHistory, type SwarmCommunicationLinkForInsights, type SwarmHistoryFilter, type SwarmHistoryFilterKind } from "@/lib/swarm-insights";

export type SwarmHistoryPanelLink = SwarmCommunicationLinkForInsights & {
  fromAgentName: string;
  toAgentName: string;
  fromAgentId: number;
  toAgentId: number;
  channel: string;
  protocol: string;
  purpose: string;
};

export function SwarmHistoryPanel({
  link,
  filter,
  draft,
  highlighted = false,
  timeAgo,
  isSubmitting = false,
  onFilterChange,
  onDraftChange,
  onSubmit,
}: {
  link: SwarmHistoryPanelLink;
  filter: SwarmHistoryFilter;
  draft: string;
  highlighted?: boolean;
  timeAgo: (timestamp: number) => string;
  isSubmitting?: boolean;
  onFilterChange: (next: SwarmHistoryFilter) => void;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const filteredHistory = filterSwarmHistory(link.history, filter);
  const filterContext = [
    filter.kind === "all" ? "Alle Typen" : `Typ ${filter.kind}`,
    filter.query.trim() ? `Suche „${filter.query.trim()}“` : "ohne Suchbegriff",
  ].join(" · ");

  return (
    <div
      className={`min-w-0 rounded-2xl border px-3 py-3 ${highlighted ? "border-indigo-400 bg-indigo-50/80 shadow-sm" : "border-slate-200/80 bg-slate-50"}`}
      data-testid={`swarm-link-${link.id}`}
    >
      <p className="font-medium text-slate-950">{link.fromAgentName} → {link.toAgentName}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{link.channel} · {link.protocol}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{link.purpose}</p>
      <div className="mt-3 min-w-0 space-y-2 rounded-2xl border border-white/80 bg-white/90 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Nachrichtenverlauf</p>
            <p className="mt-1 text-xs text-slate-500">{filteredHistory.length} von {link.history.length} Einträgen sichtbar</p>
            <p className="mt-1 text-[11px] text-slate-400" data-testid={`swarm-filter-context-${link.id}`}>{filterContext}</p>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_160px]">
            <input
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400"
              placeholder="Verlauf durchsuchen"
              aria-label="Verlauf durchsuchen"
              value={filter.query}
              onChange={event => onFilterChange({ ...filter, query: event.target.value })}
            />
            <select
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none"
              aria-label="Nachrichtentyp filtern"
              value={filter.kind}
              onChange={event => onFilterChange({ ...filter, kind: event.target.value as SwarmHistoryFilterKind })}
            >
              <option value="all">Alle Typen</option>
              <option value="directive">directive</option>
              <option value="status">status</option>
              <option value="evidence">evidence</option>
              <option value="approval">approval</option>
            </select>
          </div>
        </div>
        {filteredHistory.slice(-6).map(message => (
          <div key={message.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
              <span>{message.senderAgentName} · {message.kind}</span>
              <span>{timeAgo(message.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{message.content}</p>
          </div>
        ))}
        {filteredHistory.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
            Keine Nachrichten entsprechen dem aktuellen Filterkontext.
          </p>
        ) : null}
        <div className="grid min-w-0 gap-2 xl:grid-cols-[minmax(0,1fr)_200px]">
          <textarea
            className="min-h-[88px] rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400"
            placeholder="Neue Nachricht für diesen Pfad dokumentieren"
            value={draft}
            onChange={event => onDraftChange(event.target.value)}
          />
          <button
            type="button"
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Nachricht wird protokolliert …" : "Nachricht protokollieren"}
          </button>
        </div>
      </div>
    </div>
  );
}
