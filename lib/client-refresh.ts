/**
 * Background alignment: periodic `/api/bootstrap/today` refetch into the HQ store.
 * Tune cadence here; paired with last-active throttling in DashboardLayoutClient.
 */
export const PERIODIC_SNAPSHOT_REFRESH_MINUTES = 10;
