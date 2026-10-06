import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import ItemImage from "../components/common/ItemImage";
import { fetchMyClaims, normalizeDbClaim } from "../lib/claimService";

function StatusPill({ status }) {
  const variant =
    status === "Found"
      ? "bg-tertiary-container/20 text-tertiary"
      : status === "Resolved"
      ? "bg-surface-container-high text-on-surface-variant"
      : "bg-error-container/20 text-error";
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${variant}`}>
      {status}
    </span>
  );
}

function RecentReport({ item }) {
  return (
    <Link
      to="/browse"
      className="flex gap-3 p-3 hover:bg-surface-container-low transition-colors"
    >
      <ItemImage
        imagePath={item.image_path}
        alt={item.name}
        className="w-14 h-14 rounded-lg bg-surface-container overflow-hidden flex-shrink-0"
      />
      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="text-label-md text-on-surface font-medium truncate">{item.name}</p>
          <StatusPill status={item.status} />
        </div>
        <p className="text-body-sm text-on-surface-variant truncate">{item.location}</p>
        <div className="flex items-center gap-2 text-[11px] text-outline font-mono mt-0.5">
          <span className="truncate">{item.tag || "—"}</span>
          <span className="text-on-surface-variant/60">·</span>
          <span className="truncate">{item.date || "—"}</span>
        </div>
      </div>
    </Link>
  );
}

function ClaimsCard({ userId, isSecurity }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(() => !!userId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchMyClaims(userId)
      .then((rows) => {
        if (active) setClaims(rows.map(normalizeDbClaim));
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  const pendingClaims = claims.filter((c) => c.status === "Pending");

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-headline-sm text-on-surface">Your Claims</h3>
        {!loading && claims.length > 0 && (
          <span className="font-code-sm text-[11px] text-outline bg-surface-container-high px-2 py-0.5 rounded-full">
            {claims.length} total
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-body-sm text-on-surface-variant text-center py-2">
          Couldn\'t load claims.
        </div>
      ) : pendingClaims.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-center gap-1">
          <span className="material-symbols-outlined text-outline text-2xl">check_circle</span>
          <p className="text-body-sm text-on-surface-variant">
            No pending claims.
          </p>
          <p className="text-[11px] text-on-surface-variant/70">
            {isSecurity
              ? "Review incoming student claims on the Claims page."
              : "File a claim on a found item to get started."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingClaims.slice(0, 4).map((claim) => (
            <div
              key={claim.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/10"
            >
              {claim.itemImagePath && (
                <ItemImage
                  imagePath={claim.itemImagePath}
                  alt={claim.itemName}
                  className="w-10 h-10 rounded-md bg-surface-container overflow-hidden flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex flex-col gap-1">
                <p className="text-label-md text-on-surface font-medium truncate">{claim.itemName}</p>
                <p className="text-body-sm text-on-surface-variant truncate">{claim.itemLocation}</p>
                <div className="flex items-center gap-2 text-[11px] text-outline font-mono mt-0.5">
                  <span>{claim.status}</span>
                  <span className="text-on-surface-variant/60">·</span>
                  <span className="truncate">{claim.date}</span>
                </div>
              </div>
            </div>
          ))}
          {pendingClaims.length > 4 && (
            <p className="text-[11px] text-on-surface-variant/70 text-center mt-1">
              +{pendingClaims.length - 4} more pending claim{pendingClaims.length - 4 === 1 ? "" : "s"}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser, items, dbLoaded, totalCount, foundCount, lostCount, myReportsCount } =
    useAppData();
  const { user } = useAuth();
  const userId = user?.id || currentUser.id;
  const isSecurity =
    currentUser.role === "Security Desk" || currentUser.role === "security" || currentUser.role === "admin";

  // Real recent reports: items arrive newest-first from fetchAllItems().
  // Show up to 5 so the panel stays useful on desktop.
  const recentItems = dbLoaded ? items.slice(0, 5) : [];

  if (!dbLoaded) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 flex flex-col items-center justify-center">
        <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-5 text-body-md text-on-surface-variant">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col">
          <h1 className="text-display-lg text-on-surface">
            Good Morning, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Here is the latest from the campus recovery network.
          </p>
        </div>

        {/* Honest campus summary — real counts only */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-outline/20 text-on-surface-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">home</span>
            </div>
            <div>
              <h2 className="text-headline-sm text-on-surface">
                {items.length === 0
                  ? "No reports on campus yet"
                  : `${items.length} report${items.length === 1 ? "" : "s"} on campus`}
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                {items.length === 0
                  ? "Be the first to report a lost or found item."
                  : `Found: ${foundCount} · Lost: ${lostCount} · ${myReportsCount} reported by you.`}
              </p>
            </div>
          </div>
          <Link
            to="/browse"
            className="px-5 py-2 bg-primary text-on-primary rounded-lg text-label-lg font-medium hover:bg-primary-container transition-colors whitespace-nowrap"
          >
            Browse Reports
          </Link>
        </div>

        {/* Action Grid — real actions, unchanged */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/reports/lost"
            className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-lg bg-error-container text-on-error-container flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <div className="flex-1">
              <h3 className="text-headline-sm text-on-surface mb-1">Report Lost Item</h3>
              <p className="text-body-sm text-on-surface-variant">
                I lost something on campus and need to find it.
              </p>
            </div>
          </Link>
          <Link
            to="/reports/found"
            className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px]">where_to_vote</span>
            </div>
            <div className="flex-1">
              <h3 className="text-headline-sm text-on-surface mb-1">Report Found Item</h3>
              <p className="text-body-sm text-on-surface-variant">
                I found an item and want to return it to the owner.
              </p>
            </div>
          </Link>
        </div>

        {/* Real statistics — derived from live app state only */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-headline-sm text-on-surface px-1">Your Activity</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-center">
                <p className="text-display-lg text-primary">{totalCount}</p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">Total Reports</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-center">
                <p className="text-display-lg text-tertiary">{foundCount}</p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">Found</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-center">
                <p className="text-display-lg text-error">{lostCount}</p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">Lost</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-center">
                <p className="text-display-lg text-secondary">{myReportsCount}</p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">My Reports</p>
              </div>
            </div>

            {/* Real recent reports — newest first, from the database */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <h3 className="text-headline-sm text-on-surface">Recent Reports</h3>
                <p className="text-[11px] text-on-surface-variant/70 font-mono mt-0.5">
                  Newest first · {recentItems.length} shown
                </p>
              </div>
              <div className="px-4 pb-4 space-y-0">
                {recentItems.length > 0 ? (
                  recentItems.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 border-b border-outline-variant/10 last:border-0">
                      <RecentReport item={item} />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-1">
                    <span className="material-symbols-outlined text-outline text-3xl">check_circle</span>
                    <p className="text-body-sm text-on-surface-variant">No reports on campus yet.</p>
                    <p className="text-[11px] text-on-surface-variant/70">
                      Your report will appear here once it\'s submitted.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Real claims information — only when derivable from live data */}
          <div className="flex flex-col gap-4">
            <ClaimsCard key={userId} userId={userId} isSecurity={isSecurity} />

            {/* Honest convenience links */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 flex flex-col gap-3">
              <h3 className="text-headline-sm text-on-surface">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <Link
                  to="/reports/lost"
                  className="flex items-center gap-2 text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-error">search_off</span>
                  Report something lost
                </Link>
                <Link
                  to="/reports/found"
                  className="flex items-center gap-2 text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-tertiary">where_to_vote</span>
                  Report something found
                </Link>
                <Link
                  to={isSecurity ? "/claims" : "/browse"}
                  className="flex items-center gap-2 text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    {isSecurity ? "admin_panel_settings" : "search"}
                  </span>
                  {isSecurity ? "Review claims" : "Browse campus reports"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
