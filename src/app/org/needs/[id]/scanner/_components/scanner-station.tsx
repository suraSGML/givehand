"use client";

import * as React from "react";
import Link from "next/link";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Search,
  UserCheck,
  UserX,
  Volume2,
  VolumeX,
  Sparkles,
  Camera,
  RefreshCw,
} from "lucide-react";
import {
  processVolunteerCheckInAction,
  type VolunteerApplicationRecord,
} from "@/lib/actions/volunteers";

interface ScannerStationProps {
  needId: string;
  needTitle: string;
  initialApplications: VolunteerApplicationRecord[];
}

interface ScanResult {
  type: "check_in" | "check_out" | "error";
  volunteerName?: string;
  hoursLogged?: number;
  timestamp: string;
  message: string;
}

export function ScannerStation({
  needId,
  needTitle,
  initialApplications,
}: ScannerStationProps) {
  const [tokenInput, setTokenInput] = React.useState("");
  const [mode, setMode] = React.useState<"auto" | "check_in" | "check_out">("auto");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<ScanResult | null>(null);
  const [recentLogs, setRecentLogs] = React.useState<ScanResult[]>([]);
  const [activeTab, setActiveTab] = React.useState<"scanner" | "manual">("scanner");
  const [manualSearch, setManualSearch] = React.useState("");
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  // Filter for manual list
  const filteredVolunteers = React.useMemo(() => {
    return initialApplications.filter(
      (app) =>
        app.volunteer.fullName.toLowerCase().includes(manualSearch.toLowerCase()) ||
        (app.volunteer.phone && app.volunteer.phone.includes(manualSearch)) ||
        (app.checkInToken && app.checkInToken.toLowerCase().includes(manualSearch.toLowerCase()))
    );
  }, [initialApplications, manualSearch]);

  async function handleProcessToken(tokenToProcess: string) {
    if (!tokenToProcess.trim() || isProcessing) return;

    setIsProcessing(true);
    setLastResult(null);

    try {
      const res = await processVolunteerCheckInAction({
        tokenOrId: tokenToProcess.trim(),
        action: mode,
      });

      if (!res.success) {
        const errorResult: ScanResult = {
          type: "error",
          timestamp: new Date().toLocaleTimeString(),
          message: res.error || "Invalid pass or not authorized",
        };
        setLastResult(errorResult);
        setRecentLogs((prev) => [errorResult, ...prev.slice(0, 9)]);
        playAudioFeedback(false);
        setIsProcessing(false);
        return;
      }

      const isCheckIn = res.actionType === "check_in";
      const successResult: ScanResult = {
        type: res.actionType!,
        volunteerName: res.volunteerName,
        hoursLogged: res.hoursLogged,
        timestamp: res.timestamp || new Date().toLocaleTimeString(),
        message: isCheckIn
          ? `Checked In: ${res.volunteerName}`
          : `Checked Out: ${res.volunteerName} (${res.hoursLogged} hours logged)`,
      };

      setLastResult(successResult);
      setRecentLogs((prev) => [successResult, ...prev.slice(0, 9)]);
      playAudioFeedback(true);
      setTokenInput("");
      setIsProcessing(false);
    } catch (err: any) {
      const errorResult: ScanResult = {
        type: "error",
        timestamp: new Date().toLocaleTimeString(),
        message: err?.message || "Failed to process scan",
      };
      setLastResult(errorResult);
      setRecentLogs((prev) => [errorResult, ...prev.slice(0, 9)]);
      playAudioFeedback(false);
      setIsProcessing(false);
    }
  }

  function playAudioFeedback(isSuccess: boolean) {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.15); // E3
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/org/needs/${needId}/volunteers`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Live Check-In Station
              </h1>
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-md">
              {needTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-teal-600" />
                <span>Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-muted-foreground" />
                <span>Audio Muted</span>
              </>
            )}
          </button>

          {/* Mode Selector */}
          <div className="flex rounded-xl bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode("auto")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                mode === "auto" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setMode("check_in")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                mode === "check_in" ? "bg-background text-teal-600 shadow-sm" : "text-muted-foreground"
              }`}
            >
              Check-In
            </button>
            <button
              type="button"
              onClick={() => setMode("check_out")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                mode === "check_out" ? "bg-background text-emerald-600 shadow-sm" : "text-muted-foreground"
              }`}
            >
              Check-Out
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Camera / Laser Scanner vs Manual Phone Lookup */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("scanner")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "scanner"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>Scanner Terminal</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "manual"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Manual Phone Lookup (Offline Fallback)</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scanner Station Input & Camera Viewfinder */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "scanner" ? (
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              {/* Camera Scanner Viewport Mock */}
              <div className="relative aspect-video max-h-[300px] w-full overflow-hidden rounded-2xl bg-slate-950 flex flex-col items-center justify-center text-center p-6 border border-slate-800">
                {/* Viewfinder corner guides */}
                <div className="absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-teal-400 rounded-tl-lg" />
                <div className="absolute top-4 right-4 h-8 w-8 border-t-2 border-r-2 border-teal-400 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-teal-400 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-teal-400 rounded-br-lg" />

                {/* Animated Scan Line */}
                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 animate-pulse shadow-[0_0_12px_rgba(45,212,191,0.8)]" />

                <div className="relative z-10 space-y-2 text-slate-300">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-400 ring-4 ring-teal-500/10">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold">Camera Scanner Ready</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Hold volunteer QR code in front of lens or type/scan token below.
                  </p>
                </div>
              </div>

              {/* Direct Token Scanner Input (Supports USB Barcode/QR readers) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProcessToken(tokenInput);
                }}
                className="space-y-3"
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Scan or enter token (e.g. GHV-MKD01-PASS)..."
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="w-full rounded-2xl border border-input bg-background pl-10 pr-4 py-3 text-sm font-mono placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing || !tokenInput.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 text-xs font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                    <span>Process</span>
                  </button>
                </div>


              </form>

              {/* Real-time Result Banner */}
              {lastResult && (
                <div
                  className={`rounded-2xl border p-5 transition-all ${
                    lastResult.type === "check_in"
                      ? "border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-200"
                      : lastResult.type === "check_out"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {lastResult.type === "error" ? (
                      <AlertCircle className="h-6 w-6 shrink-0 text-rose-600 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {lastResult.type === "check_in"
                            ? "CHECK-IN VERIFIED"
                            : lastResult.type === "check_out"
                              ? "CHECK-OUT VERIFIED"
                              : "SCAN ERROR"}
                        </span>
                        <span className="text-xs opacity-75">• {lastResult.timestamp}</span>
                      </div>
                      <p className="text-sm font-semibold">{lastResult.message}</p>
                      {lastResult.hoursLogged && (
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          🎉 {lastResult.hoursLogged} hours recorded toward official service certificate!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Manual Search Tab */
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold">Offline / Phone Lookup</h3>
                <p className="text-xs text-muted-foreground">
                  Check in volunteers manually if their device battery died or QR is unreadable.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search volunteer name or phone number..."
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background pl-10 pr-4 py-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="divide-y divide-border/60 rounded-2xl border border-border/80 overflow-hidden">
                {filteredVolunteers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No matching volunteers found
                  </div>
                ) : (
                  filteredVolunteers.map((vol) => (
                    <div
                      key={vol.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-foreground">
                          {vol.volunteer.fullName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {vol.volunteer.phone || "No phone listed"} • Token:{" "}
                          <span className="font-mono">{vol.checkInToken || "—"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {vol.status !== "attended" && vol.status !== "completed" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleProcessToken(vol.checkInToken || vol.id)
                            }
                            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Check In
                          </button>
                        )}
                        {vol.status === "attended" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleProcessToken(vol.checkInToken || vol.id)
                            }
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Check Out
                          </button>
                        )}
                        {vol.status === "completed" && (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Session Activity Log */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-600" />
                <h3 className="font-display text-sm font-bold">Session Activity Log</h3>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {recentLogs.length} scans
              </span>
            </div>

            {recentLogs.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <QrCode className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">
                  Scanned attendees will be listed here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {recentLogs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-background/80 p-3 text-xs"
                  >
                    {log.type === "error" ? (
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    )}
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {log.message}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{log.timestamp}</span>
                        {log.hoursLogged && (
                          <span className="font-bold text-emerald-600">
                            +{log.hoursLogged} hrs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
