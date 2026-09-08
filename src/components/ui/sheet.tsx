import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      {children}
    </Drawer.Root>
  );
}

export function SheetContent({
  className,
  children,
  title,
}: {
  className?: string;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-foreground/30" />
      <Drawer.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] max-w-full flex-col overflow-hidden rounded-t-3xl bg-card text-card-foreground shadow-[var(--shadow-lift)] outline-none",
          className,
        )}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border" />
        <Drawer.Title className="sr-only">{title}</Drawer.Title>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          {children}
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}
