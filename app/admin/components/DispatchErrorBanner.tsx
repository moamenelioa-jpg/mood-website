"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DispatchErrorBanner
//
// Renders the last dispatch failure stored in order.shipDispatchError.
// Shows the error category, message, and a Retry button when applicable.
//
// Usage:
//   <DispatchErrorBanner error={order.shipDispatchError} onRetry={handleRetry} />
// ─────────────────────────────────────────────────────────────────────────────

export interface DispatchError {
  carrier: string;
  code: string;
  category: string;
  message: string;
  retryable: boolean;
  attempts?: number;
  durationMs?: number;
  at: string; // ISO string
}

interface Props {
  error: DispatchError | null | undefined;
  /** Called when admin clicks "Retry Dispatch". Parent should re-open dispatch form. */
  onRetry?: () => void;
  /** Whether a retry is currently in flight */
  retrying?: boolean;
}

// ── Category labels + colour classes ─────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: string; border: string; bg: string; text: string; badge: string }
> = {
  validation:      { label: "Validation error",     icon: "⚠️",  border: "border-yellow-400", bg: "bg-yellow-50",  text: "text-yellow-900", badge: "bg-yellow-100 text-yellow-800" },
  configuration:   { label: "Configuration error",  icon: "🔧",  border: "border-gray-400",   bg: "bg-gray-50",    text: "text-gray-900",   badge: "bg-gray-100 text-gray-700"   },
  order_state:     { label: "Order state error",     icon: "🔒",  border: "border-blue-400",   bg: "bg-blue-50",    text: "text-blue-900",   badge: "bg-blue-100 text-blue-800"   },
  carrier_reject:  { label: "Carrier rejected",      icon: "🚫",  border: "border-red-400",    bg: "bg-red-50",     text: "text-red-900",    badge: "bg-red-100 text-red-800"     },
  carrier_timeout: { label: "Carrier timed out",     icon: "⏱️",  border: "border-orange-400", bg: "bg-orange-50",  text: "text-orange-900", badge: "bg-orange-100 text-orange-800"},
  carrier_error:   { label: "Carrier API error",     icon: "📡",  border: "border-orange-400", bg: "bg-orange-50",  text: "text-orange-900", badge: "bg-orange-100 text-orange-800"},
  auth:            { label: "Authentication error",  icon: "🔑",  border: "border-purple-400", bg: "bg-purple-50",  text: "text-purple-900", badge: "bg-purple-100 text-purple-800"},
  unknown:         { label: "Unknown error",         icon: "❓",  border: "border-gray-400",   bg: "bg-gray-50",    text: "text-gray-900",   badge: "bg-gray-100 text-gray-700"   },
};

// ── Retry guidance per category ───────────────────────────────────────────────

const RETRY_GUIDANCE: Record<string, string> = {
  validation:      "Fix the highlighted fields, then dispatch again.",
  configuration:   "Go to Settings → Shipping and add valid API credentials for this carrier.",
  order_state:     "Refresh the order page — the status may have changed.",
  carrier_reject:  "Edit the recipient address or switch to a different carrier.",
  carrier_timeout: "The carrier API was slow. Wait a moment and retry.",
  carrier_error:   "A temporary carrier error occurred. Retry, or try a different carrier.",
  auth:            "Your carrier API key may have expired. Update it in Settings → Shipping.",
  unknown:         "An unexpected error occurred. Check the shipping logs for details.",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DispatchErrorBanner({ error, onRetry, retrying = false }: Props) {
  if (!error) return null;

  const config = CATEGORY_CONFIG[error.category] ?? CATEGORY_CONFIG.unknown;
  const guidance = RETRY_GUIDANCE[error.category] ?? RETRY_GUIDANCE.unknown;

  const formattedTime = (() => {
    try {
      return new Date(error.at).toLocaleString("en-EG", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return error.at;
    }
  })();

  return (
    <div
      role="alert"
      className={`rounded-lg border-l-4 p-4 ${config.border} ${config.bg} ${config.text} space-y-3`}
    >
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-lg">{config.icon}</span>
          <span className="font-semibold text-sm">{config.label}</span>
          {/* Error code badge */}
          <span className={`rounded px-1.5 py-0.5 text-xs font-mono ${config.badge}`}>
            {error.code}
          </span>
          {/* Carrier badge */}
          <span className="rounded bg-white/60 px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide">
            {error.carrier}
          </span>
        </div>

        {/* Retry button — only when retryable */}
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            disabled={retrying}
            className="shrink-0 rounded-md bg-white px-3 py-1 text-sm font-medium shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {retrying ? "Retrying…" : "Retry Dispatch"}
          </button>
        )}
      </div>

      {/* ── Error message ────────────────────────────────────────────────── */}
      <p className="text-sm">{error.message}</p>

      {/* ── Action guidance ──────────────────────────────────────────────── */}
      <p className="text-xs opacity-80">
        <span className="font-semibold">What to do: </span>{guidance}
      </p>

      {/* ── Debug metadata ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-60 font-mono">
        <span>Time: {formattedTime}</span>
        {error.attempts !== undefined && error.attempts > 1 && (
          <span>Attempts: {error.attempts}</span>
        )}
        {error.durationMs !== undefined && (
          <span>Duration: {error.durationMs}ms</span>
        )}
      </div>

      {/* ── Non-retryable hint ───────────────────────────────────────────── */}
      {!error.retryable && (
        <p className="text-xs opacity-70 italic">
          This error cannot be retried automatically. Fix the underlying issue first.
        </p>
      )}
    </div>
  );
}
