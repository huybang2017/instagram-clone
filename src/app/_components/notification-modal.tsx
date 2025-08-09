"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

type Variant = "info" | "success" | "warning" | "error";

interface Action {
  label: string;
  onClick: () => void;
  loading?: boolean;
}

interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: Variant;
  primaryAction?: Action;
  secondaryAction?: Action;
}

const variantIcon: Record<
  Variant,
  React.ComponentType<{ className?: string }>
> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const variantClasses: Record<Variant, string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
};

export function NotificationModal({
  open,
  onOpenChange,
  title,
  description,
  variant = "info",
  primaryAction,
  secondaryAction,
}: NotificationModalProps) {
  const Icon = variantIcon[variant];
  const color = variantClasses[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[90vw] max-w-md overflow-hidden p-0"
        showCloseButton
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
          <div className={`rounded-full bg-current/10 p-2 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          {description ? (
            <DialogDescription className="text-sm leading-relaxed">
              {description}
            </DialogDescription>
          ) : null}
        </div>

        {/* Footer */}
        {(primaryAction ?? secondaryAction) && (
          <DialogFooter className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
            {secondaryAction ? (
              <Button
                type="button"
                variant="ghost"
                onClick={secondaryAction.onClick}
                disabled={primaryAction?.loading}
              >
                {secondaryAction.label}
              </Button>
            ) : null}
            {primaryAction ? (
              <Button
                type="button"
                onClick={primaryAction.onClick}
                disabled={primaryAction.loading}
                className={
                  variant === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : variant === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : variant === "warning"
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-blue-600 hover:bg-blue-700"
                }
              >
                {primaryAction.loading ? "Đang xử lý..." : primaryAction.label}
              </Button>
            ) : null}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NotificationModal;
