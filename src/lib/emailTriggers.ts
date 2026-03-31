import { supabase } from '@/integrations/supabase/client';

/**
 * Fire an email trigger event. Checks if there's an enabled automation
 * for the event and sends the email via the transactional email system.
 * 
 * This runs client-side but only fires if admin has enabled the automation.
 */
export async function fireEmailTrigger(
  event: string,
  recipientEmail: string,
  templateData?: Record<string, any>
) {
  try {
    // Check if there's an enabled automation for this event
    const { data: automations, error } = await supabase
      .from('email_automations')
      .select('id, template_id, delay_minutes')
      .eq('trigger_event', event)
      .eq('enabled', true)
      .limit(1);

    if (error || !automations || automations.length === 0) return;

    const automation = automations[0];

    // Check if the template is also enabled
    const { data: template } = await supabase
      .from('email_templates')
      .select('id, enabled')
      .eq('id', automation.template_id)
      .eq('enabled', true)
      .maybeSingle();

    if (!template) return;

    // If there's a delay, we'd need a backend scheduler.
    // For now, delays > 0 are skipped (future: edge function cron)
    if (automation.delay_minutes > 0) {
      console.log(`[email-trigger] Skipping delayed automation (${automation.delay_minutes}min): ${event}`);
      return;
    }

    // Fire the email
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: automation.template_id,
        recipientEmail,
        idempotencyKey: `auto-${event}-${recipientEmail}-${Date.now()}`,
        templateData: templateData || {},
      },
    });

    console.log(`[email-trigger] Sent "${event}" email to ${recipientEmail}`);
  } catch (err) {
    console.error(`[email-trigger] Error firing ${event}:`, err);
  }
}
