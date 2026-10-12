import type { ActivityType, Session } from './models';

export type HistoryActivityFilter = 'all' | ActivityType;
export type HistoryStatusFilter = 'all' | 'complete' | 'endedEarly';
export type HistorySortOrder = 'latest' | 'earliest';

export interface HistoryQuery {
  activity: HistoryActivityFilter;
  status: HistoryStatusFilter;
  sortOrder: HistorySortOrder;
}

export function selectHistorySessions(
  sessions: Session[],
  query: HistoryQuery,
): Session[] {
  return sessions
    .filter(
      (session) =>
        query.activity === 'all' || session.activityType === query.activity,
    )
    .filter((session) => {
      if (query.status === 'all') return true;
      return query.status === 'endedEarly' ? session.endedEarly : !session.endedEarly;
    })
    .sort((left, right) => {
      const leftDate = left.closedAt ?? left.createdAt;
      const rightDate = right.closedAt ?? right.createdAt;
      return query.sortOrder === 'latest'
        ? rightDate.localeCompare(leftDate)
        : leftDate.localeCompare(rightDate);
    });
}
