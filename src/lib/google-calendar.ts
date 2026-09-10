import { createClient } from "@/lib/supabase/client";
import type { GoogleCalendarEvent } from "@/types/models";

interface GoogleEventsResponse {
  items?: {
    id: string;
    summary?: string;
    htmlLink: string;
    start?: { date?: string; dateTime?: string };
  }[];
}

/**
 * Fetches events directly from the Google Calendar API using the Google
 * access token Supabase captured at sign-in (`session.provider_token`).
 *
 * Google access tokens expire after about an hour, and Supabase doesn't
 * refresh this one automatically — if it's stale, this returns null so the
 * caller can prompt the user to sign in with Google again.
 */
export async function fetchGoogleCalendarEvents(
  monthStart: Date,
  monthEnd: Date,
): Promise<GoogleCalendarEvent[] | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.provider_token;
  if (!accessToken) return null;

  const params = new URLSearchParams({
    timeMin: monthStart.toISOString(),
    timeMax: monthEnd.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) return null;

  const data: GoogleEventsResponse = await response.json();

  return (data.items ?? [])
    .filter((event) => event.start?.date || event.start?.dateTime)
    .map((event) => {
      const isAllDay = Boolean(event.start?.date);
      const start = event.start!.date ?? event.start!.dateTime!;
      return {
        id: event.id,
        title: event.summary || "(ไม่มีชื่อ)",
        date: start.slice(0, 10),
        time: isAllDay ? null : start.slice(11, 16),
        htmlLink: event.htmlLink,
      };
    });
}
