import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";
import { findSmartMatches } from "../../lib/matchService";
import ItemImage from "../common/ItemImage";

export default function SmartMatchPanel({ limit = null, compact = false }) {
  const { items, dbLoaded } = useAppData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState("my"); // "my" | "all"

  const userId = user?.id;

  const matches = useMemo(() => {
    if (!dbLoaded || items.length === 0) return [];
    return findSmartMatches(items, userId, 40);
  }, [items, dbLoaded, userId]);

  const userMatches = useMemo(() => {
    if (!userId) return matches;
    return matches.filter(
      (m) => m.itemA.reportedBy === userId || m.itemB.reportedBy === userId
    );
  }, [matches, userId]);

  const displayedMatches = useMemo(() => {
    const list = filterMode === "my" && userMatches.length > 0 ? userMatches : matches;
    return limit ? list.slice(0, limit) : list;
  }, [filterMode, userMatches, matches, limit]);

  if (!dbLoaded) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-body-sm text-on-surface-variant">Analyzing campus reports…</span>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-outline-variant/20 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">auto_awesome</span>
            <h3 className="text-headline-sm text-on-surface">Smart Matches</h3>
            {matches.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary text-[11px] font-semibold">
                {matches.length} candidate{matches.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Algorithmic correlation comparing reported lost and found items.
          </p>
        </div>

        {!compact && (
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
            <button
              onClick={() => setFilterMode("my")}
              className={`px-3 py-1 text-label-sm rounded-md transition-colors ${
                filterMode === "my"
                  ? "bg-surface-container-lowest text-on-surface font-semibold shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              My Reports ({userMatches.length})
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 text-label-sm rounded-md transition-colors ${
                filterMode === "all"
                  ? "bg-surface-container-lowest text-on-surface font-semibold shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              All Campus ({matches.length})
            </button>
          </div>
        )}
      </div>

      {/* Match Cards */}
      {displayedMatches.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
          <span className="material-symbols-outlined text-outline text-3xl">pageview</span>
          <p className="text-body-md text-on-surface font-medium">No strong matches found yet</p>
          <p className="text-body-sm text-on-surface-variant max-w-sm">
            {filterMode === "my" && userMatches.length === 0 && matches.length > 0
              ? "No potential matches found for your reports yet. Switch to 'All Campus' to view general campus matches."
              : "When matching lost and found items are reported, potential correlations will automatically appear here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayedMatches.map((match, idx) => {
            const isUserLost = match.itemA.reportedBy === userId;
            const isUserFound = match.itemB.reportedBy === userId;
            const isUserMatch = isUserLost || isUserFound;

            return (
              <div
                key={`${match.itemA.id}-${match.itemB.id}-${idx}`}
                className={`border rounded-xl p-4 flex flex-col gap-3 transition-colors ${
                  isUserMatch
                    ? "border-primary/30 bg-primary-container/5"
                    : "border-outline-variant/20 bg-surface-container-lowest"
                }`}
              >
                {/* Match Banner */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                        match.strength === "Strong"
                          ? "bg-tertiary-container/30 text-tertiary"
                          : "bg-primary-container/30 text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">verified</span>
                      {match.matchScore}% Match Score ({match.strength})
                    </span>
                    {isUserMatch && (
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-semibold uppercase">
                        Your Report Involved
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-outline italic">Candidate correlation</span>
                </div>

                {/* Compared Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                  {/* Lost Item Side */}
                  <div className="bg-surface-container-low/60 rounded-lg p-3 border border-outline-variant/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-error-container/30 text-error uppercase">
                          LOST ITEM
                        </span>
                        <span className="text-[11px] text-outline font-mono">{match.itemA.tag || "—"}</span>
                      </div>
                      <div className="flex items-start gap-2.5 mt-2">
                        <div className="w-12 h-12 rounded bg-surface-container flex-shrink-0 overflow-hidden">
                          <ItemImage imagePath={match.itemA.image_path} alt={match.itemA.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-label-md text-on-surface font-semibold truncate">{match.itemA.name}</p>
                          <p className="text-body-sm text-on-surface-variant truncate">{match.itemA.location}</p>
                          <p className="text-[11px] text-outline mt-0.5">{match.itemA.date}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Found Item Side */}
                  <div className="bg-surface-container-low/60 rounded-lg p-3 border border-outline-variant/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-tertiary-container/30 text-tertiary uppercase">
                          FOUND ITEM
                        </span>
                        <span className="text-[11px] text-outline font-mono">{match.itemB.tag || "—"}</span>
                      </div>
                      <div className="flex items-start gap-2.5 mt-2">
                        <div className="w-12 h-12 rounded bg-surface-container flex-shrink-0 overflow-hidden">
                          <ItemImage imagePath={match.itemB.image_path} alt={match.itemB.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-label-md text-on-surface font-semibold truncate">{match.itemB.name}</p>
                          <p className="text-body-sm text-on-surface-variant truncate">{match.itemB.location}</p>
                          <p className="text-[11px] text-outline mt-0.5">{match.itemB.date}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Explanation Reasons */}
                <div className="bg-surface-container-low/40 rounded-lg p-2.5 border border-outline-variant/10">
                  <p className="text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                    Matching Reasons:
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {match.reasons.map((reason, rIdx) => (
                      <li
                        key={rIdx}
                        className="text-[11px] text-on-surface bg-surface-container px-2 py-0.5 rounded flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[12px] text-primary">check</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Footers */}
                <div className="flex justify-between items-center border-t border-outline-variant/15 pt-2.5">
                  <span className="text-[11px] text-on-surface-variant">
                    {isUserLost
                      ? "If this found item is yours, file an ownership claim to verify."
                      : "Matching helps suggest potential returns."}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      to="/browse"
                      className="px-3 py-1 bg-surface-container text-on-surface rounded-md text-label-sm font-medium hover:bg-surface-container-high transition-colors"
                    >
                      View in Browse
                    </Link>
                    {isUserLost && (
                      <button
                        onClick={() => navigate("/claims")}
                        className="px-3 py-1 bg-primary text-on-primary rounded-md text-label-sm font-medium hover:bg-primary-container transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        File Claim
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
