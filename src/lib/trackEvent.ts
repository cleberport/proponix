import { supabase } from '@/integrations/supabase/client';

/**
 * Track a platform event. Saves to the events table and triggers subscribed webhooks.
 * Non-blocking — does not throw on failure.
 */
export async function trackEvent(
  eventType: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.functions.invoke('track-event', {
      body: { event_type: eventType, metadata },
    });
  } catch {
    // Non-blocking: silently fail to avoid impacting UX
    console.warn('[trackEvent] Failed to track:', eventType);
  }
}
