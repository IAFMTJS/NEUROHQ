"use client";

/**
 * Re-export so the tasks page can dynamic-import from here instead of
 * @/components/missions/YesterdayTasksSection, avoiding the shared missions
 * chunk that can trigger HMR "module factory not available" for app/actions.
 */
export { YesterdayTasksSection } from "@/components/missions/YesterdayTasksSection";
