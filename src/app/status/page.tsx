"use client";

import { AppLayout } from "@/components/layout/sidebar";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ArrowLeft, RefreshCw, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  database: string;
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
      setConnected(res.ok);
      setError(null);
    } catch (err) {
      setConnected(false);
      setHealth(null);
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 3000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <AppLayout
      title="Connection Status"
      subtitle="Live health check for localhost connectivity"
      actions={
        <Button variant="secondary" onClick={checkHealth}>
          <RefreshCw className="h-4 w-4" />
          Refresh Now
        </Button>
      }
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div
          className={cn(
            "rounded-lg border-2 p-8 text-center transition-colors",
            connected
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          )}
        >
          <div className="mb-4 flex justify-center">
            {connected ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Wifi className="h-8 w-8 text-emerald-600" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <WifiOff className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>

          <div className="mb-2 flex items-center justify-center gap-2">
            <div
              className={cn(
                "h-3 w-3 rounded-full",
                connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              )}
            />
            <span
              className={cn(
                "text-lg font-semibold",
                connected ? "text-emerald-700" : "text-red-700"
              )}
            >
              {loading
                ? "Checking..."
                : connected
                  ? "Connected"
                  : "Disconnected"}
            </span>
          </div>

          <p className="text-base text-slate-700">
            If you see this page, localhost is connected!
          </p>

          {lastChecked && (
            <p className="mt-2 text-xs text-slate-500">
              Last checked: {lastChecked.toLocaleTimeString()} · Auto-refresh
              every 3 seconds
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">Error</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            API Response
          </h2>
          <pre className="overflow-x-auto rounded-md bg-slate-900 p-4 text-sm text-emerald-400">
            {health
              ? JSON.stringify(health, null, 2)
              : loading
                ? "Loading..."
                : "No response"}
          </pre>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Endpoint Details
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">URL</dt>
              <dd className="font-mono text-slate-700">/api/health</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Method</dt>
              <dd className="font-mono text-slate-700">GET</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Interval</dt>
              <dd className="font-mono text-slate-700">3000ms</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Database</dt>
              <dd
                className={cn(
                  "font-mono capitalize",
                  health?.database === "connected"
                    ? "text-emerald-600"
                    : "text-red-600"
                )}
              >
                {health?.database ?? "unknown"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="text-center">
          <Link href="/">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
