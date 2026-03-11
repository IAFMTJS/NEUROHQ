"use client";

import { useEffect, useRef } from "react";
import { getQueue, removeFromQueue, type QueuedEntry } from "@/lib/offline-queue";
import { completeTask, deleteTask, uncompleteTask, snoozeTask, skipNextOccurrence, rescheduleTask, duplicateTask, updateTask } from "@/app/actions/tasks";

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
    if (entry.action === "uncompleteTask") {
      const id = (entry.payload as { id?: string })?.id;
      if (id) {
        await uncompleteTask(id);
        await removeFromQueue(entry.id);
        return true;
      }
    }
    if (entry.action === "deleteTask") {
      const id = (entry.payload as { id?: string })?.id;
      if (id) {
        await deleteTask(id);
        await removeFromQueue(entry.id);
        return true;
      }
    }
    if (entry.action === "snoozeTask") {
      const id = (entry.payload as { id?: string })?.id;
      if (id) {
        await snoozeTask(id);
        await removeFromQueue(entry.id);
        return true;
      }
    }
    if (entry.action === "skipNextOccurrence") {
      const id = (entry.payload as { id?: string })?.id;
      if (id) {
        await skipNextOccurrence(id);
        await removeFromQueue(entry.id);
        return true;
      }
    }
    if (entry.action === "rescheduleTask") {
      const { id, due_date } = entry.payload as { id?: string; due_date?: string };
      if (id && due_date) {
        await rescheduleTask(id, due_date);
        await removeFromQueue(entry.id);
        return true;
      }
    }
    if (entry.action === "duplicateTask") {
      const { id, due_date } = entry.payload as { id?: string; due_date?: string };
      if (id && due_date) {
        await duplicateTask(id, due_date);
        await removeFromQueue(entry.id);
        return true;
      }
    }
    if (entry.action === "updateTask") {
      const { id, params } = entry.payload as { id?: string; params?: Parameters<typeof updateTask>[1] };
      if (id && params) {
        await updateTask(id, params);
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
