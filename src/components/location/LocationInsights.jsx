import { useState } from "react";
import { hasValidCoords } from "../../lib/geo";

export default function LocationInsights({
  hotspots = [],
  totalActiveCount = 0,
  lostCount = 0,
  foundCount = 0,
  userCoords = null,
  isNearMeActive = false,
  nearMeRadius = 250,
  nearbyCount = 0,
  onActivateNearMe,
  onClearNearMe,
  onChangeRadius,
  geoStatus = "idle", // idle | loading | success | error
  geoError = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const topHotspot = hotspots.length > 0 ? hotspots[0] : null;

  return (
    <div className="w-full bg-surface-container-low border-b border-outline-variant/20 transition-all">
      {/* Telemetry Summary Bar / Toggle Header */}
      <div className="px-margin-mobile py-2 flex flex-wrap items-center justify-between gap-2 text-label-sm text-on-surface-variant">
        
        {/* Left: Dynamic Top Hotspot & Active Count */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="flex items-center gap-1.5 font-medium text-on-surface">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span>{totalActiveCount} active reports</span>
          </span>
          <span className="text-outline hidden sm:inline">•</span>
          <span className="text-on-surface-variant text-[11.5px] truncate">
            {lostCount} Lost, {foundCount} Found
          </span>
          {topHotspot && (
            <>
              <span className="text-outline hidden md:inline">•</span>
              <span className="hidden md:flex items-center gap-1 text-[11.5px] text-amber-500 font-medium">
                <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                Top Hotspot: <strong className="text-on-surface">{topHotspot.zone}</strong> ({topHotspot.count})
              </span>
            </>
          )}
        </div>

        {/* Right: Insights & Near Me Toggle */}
        <div className="flex items-center gap-2">
          {isNearMeActive && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">near_me</span>
              {nearbyCount} within {nearMeRadius}m
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
            <span>{isOpen ? "Hide Insights" : "Location Insights"}</span>
            <span className="material-symbols-outlined text-[14px]">
              {isOpen ? "expand_less" : "expand_more"}
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible Location Insights & Near Me Controls */}
      {isOpen && (
        <div className="px-margin-mobile py-3 border-t border-outline-variant/15 bg-surface-container-lowest/80 flex flex-col gap-3">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Top Hotspots Overview Card */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-outline">
                  Campus Hotspot Intelligence
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono">
                  {hotspots.length} active zones
                </span>
              </div>

              {hotspots.length > 0 ? (
                <div className="space-y-1.5 mt-0.5">
                  {hotspots.slice(0, 3).map((spot, idx) => (
                    <div
                      key={spot.zone}
                      className="flex items-center justify-between text-body-sm py-1 border-b border-outline-variant/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] text-outline">#{idx + 1}</span>
                        <span className="font-medium text-on-surface truncate">{spot.zone}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            spot.activityLevel === "High"
                              ? "bg-rose-500/15 text-rose-500"
                              : spot.activityLevel === "Moderate"
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-blue-500/15 text-blue-500"
                          }`}
                        >
                          {spot.activityLevel}
                        </span>
                      </div>
                      <span className="text-[12px] font-mono text-on-surface-variant flex-shrink-0">
                        {spot.count} ({spot.lostCount}L / {spot.foundCount}F)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-outline italic">No active report hotspots currently.</p>
              )}
            </div>

            {/* Near Me Location Filter Card */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-outline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">my_location</span>
                    Near Me Reports
                  </span>
                  {isNearMeActive && (
                    <span className="text-[11px] font-semibold text-sky-500">
                      Active Filter
                    </span>
                  )}
                </div>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  Filter reports within walking distance of your current position. Permission is requested only when you click.
                </p>
              </div>

              {/* Geo Error Warning if permission was denied / failed */}
              {geoError && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11.5px] leading-tight flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[15px] flex-shrink-0">error</span>
                  <span>{geoError}</span>
                </div>
              )}

              {/* Action Buttons & Radius Selector */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/10">
                {!isNearMeActive ? (
                  <button
                    type="button"
                    onClick={onActivateNearMe}
                    disabled={geoStatus === "loading"}
                    className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-medium hover:bg-primary-container transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {geoStatus === "loading" ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Acquiring position…</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">near_me</span>
                        <span>Find Near Me</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Radius selection pills */}
                    <div className="flex items-center bg-surface-container p-0.5 rounded-lg">
                      {[100, 250, 500].map((rad) => (
                        <button
                          key={rad}
                          type="button"
                          onClick={() => {
                            if (onChangeRadius) onChangeRadius(rad);
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            nearMeRadius === rad
                              ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          {rad}m
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={onClearNearMe}
                      className="px-2.5 py-1 border border-outline-variant text-on-surface rounded-lg text-[11.5px] font-medium hover:bg-surface-container transition-colors"
                    >
                      Clear Near Me
                    </button>
                  </div>
                )}

                {isNearMeActive && userCoords && hasValidCoords(userCoords.latitude, userCoords.longitude) && (
                  <span className="text-[11px] font-mono text-outline">
                    ±{userCoords.accuracy ? Math.round(userCoords.accuracy) : 10}m accuracy
                  </span>
                )}
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
