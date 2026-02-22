"use client";

import { useEffect, useRef } from "react";
import { getQueue, removeFromQueue, type QueuedEntry } from "@/lib/offline-queue";
import { completeTask } from "@/app/actions/tasks";

async function processEntry(entry: QueuedEntry): Promise<boolean> {
  try {
    if (entry.action === "completeTask") {
      const id = (entry.payload as { id?: string })?.id;
      if (id) {
        await completeTask(id);
        await removeFromQueue(entry.id);
        return true;
      }
    }
  } catch {
    // Leave in queue for next sync
  }
  return false;
}

export function OfflineQueueSync() {
  const processing = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.onLine) return;

    const run = async () => {
      if (processing.current) return;
      processing.current = true;
      try {
        const queue = await getQueue();
        for (const entry of queue) {
          await processEntry(entry);
        }
      } finally {
        processing.current = false;
      }
    };

    run();
    const onOnline = () => run();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
