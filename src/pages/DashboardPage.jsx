import { Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

export default function DashboardPage() {
  const { currentUser, items, dbLoaded, totalCount, foundCount, lostCount, myReportsCount } = useAppData();
  const recentItems = dbLoaded ? items.slice(0, 3) : [];

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

        {/* Honest summary — no invented matches or statistics */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-outline/20 text-on-surface-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">home</span>
            </div>
            <div>
              <h2 className="text-headline-sm text-on-surface">
                {dbLoaded
                  ? items.length === 0
                    ? "No reports on campus yet"
                    : `${items.length} report${items.length === 1 ? "" : "s"} on campus`
                  : "Loading campus reports…"}
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                {dbLoaded
                  ? items.length === 0
                    ? "Be the first to report a lost or found item."
                    : `Found: ${foundCount} · Lost: ${lostCount}.`
                  : "Fetching the latest reports from the campus network."}
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
              <h3 className="text-headline-sm text-on-surface mb-1">
                Report Lost Item
              </h3>
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
              <h3 className="text-headline-sm text-on-surface mb-1">
                Report Found Item
              </h3>
              <p className="text-body-sm text-on-surface-variant">
                I found an item and want to return it to the owner.
              </p>
            </div>
          </Link>
        </div>

        {/* Honest activity stats — computed from real DB items only, via AppDataContext */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-headline-sm text-on-surface px-1">
              Your Activity
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4">
                <p className="text-display-lg text-primary">
                  {dbLoaded ? totalCount : "—"}
                </p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">
                  Total Reports
                </p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4">
                <p className="text-display-lg text-tertiary">
                  {dbLoaded ? foundCount : "—"}
                </p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">
                  Found
                </p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4">
                <p className="text-display-lg text-error">
                  {dbLoaded ? lostCount : "—"}
                </p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">
                  Lost
                </p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4">
                <p className="text-display-lg text-secondary">
                  {dbLoaded ? myReportsCount : "—"}
                </p>
                <p className="text-label-sm text-on-surface-variant uppercase mt-1">
                  Your Reports
                </p>
              </div>
            </div>
          </div>

          {/* Real recent reports panel */}
          <div className="flex flex-col gap-4">
            <h3 className="text-headline-sm text-on-surface px-1">
              Recent Reports
            </h3>
            {dbLoaded && recentItems.length > 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col">
                {recentItems.map((item) => (
                  <Link
                    key={item.id}
                    to="/browse"
                    className="p-4 flex gap-3 hover:bg-surface-container-low transition-colors border-b border-outline-variant/10"
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-label-md text-on-surface font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-body-sm text-on-surface-variant truncate">
                        {item.location}
                      </p>
                      <p className="text-[10px] text-outline mt-1 font-mono">
                        {item.tag || "—"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center">
                <span className="material-symbols-outlined text-outline text-3xl">
                  {!dbLoaded ? "refresh" : "check_circle"}
                </span>
                <p className="text-body-sm text-on-surface-variant">
                  {!dbLoaded
                    ? "Loading recent reports…"
                    : "No recent reports yet."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
