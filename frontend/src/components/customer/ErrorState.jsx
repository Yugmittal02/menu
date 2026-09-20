import React from 'react';
import { LuCircleAlert, LuRefreshCw, LuPhoneCall, LuQrCode, LuUtensils } from 'react-icons/lu';

export default function ErrorState({
  title = 'Unable to Load Menu',
  message = 'We could not connect to this table or cafe menu. Please make sure your QR code is valid or ask the cafe staff.',
  onRetry,
  cafePhone,
}) {
  return (
    <div className="min-h-screen bg-[var(--cafe-background,#F7F4EC)] text-[var(--cafe-text,#222522)] flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-[var(--cafe-surface,#FFFFFF)] rounded-3xl p-7 border border-[var(--cafe-border,#E7E0D3)] shadow-xl text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <LuCircleAlert className="w-8 h-8" />
        </div>

        {/* Title */}
        <h2 className="font-serif text-2xl font-bold text-[var(--cafe-text,#222522)] mb-2">
          {title}
        </h2>

        {/* Description */}
        <p className="text-sm text-[var(--cafe-muted,#6A746B)] leading-relaxed mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="space-y-2.5">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full py-3.5 px-4 rounded-xl bg-[var(--cafe-primary,#173D32)] text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition shadow-md cursor-pointer"
            >
              <LuRefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          <a
            href="/c/demo/t/1"
            className="w-full py-3 px-4 rounded-xl border border-[var(--cafe-border,#E7E0D3)] text-[var(--cafe-text,#222522)] font-medium text-sm flex items-center justify-center gap-2 hover:bg-stone-50 transition cursor-pointer"
          >
            <LuUtensils className="w-4 h-4 text-[var(--cafe-muted,#6A746B)]" />
            Open Demo Menu
          </a>

          {cafePhone && (
            <a
              href={`tel:${cafePhone}`}
              className="w-full py-3 px-4 rounded-xl border border-[var(--cafe-border,#E7E0D3)] text-[var(--cafe-text,#222522)] font-medium text-sm flex items-center justify-center gap-2 hover:bg-stone-50 transition"
            >
              <LuPhoneCall className="w-4 h-4 text-[var(--cafe-muted,#6A746B)]" />
              Call Server / Staff
            </a>
          )}
        </div>

        {/* Footer tip */}
        <div className="mt-6 pt-5 border-t border-[var(--cafe-border,#E7E0D3)] flex items-center justify-center gap-1.5 text-xs text-[var(--cafe-muted,#6A746B)]">
          <LuQrCode className="w-3.5 h-3.5" />
          <span>Scan table QR code directly from camera</span>
        </div>
      </div>
    </div>
  );
}
