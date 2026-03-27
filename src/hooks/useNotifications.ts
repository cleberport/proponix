import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppNotification {
  id: string;
  message: string;
  type: 'viewed' | 'approved' | 'negotiation' | 'expired';
  read: boolean;
  createdAt: string;
  documentId?: string;
}

const STATUS_MESSAGES: Record<string, { message: (name: string) => string; type: AppNotification['type'] }> = {
  visualizado: { message: (n) => `${n || 'Um cliente'} visualizou sua proposta`, type: 'viewed' },
  aprovado: { message: (n) => `${n || 'Um cliente'} aprovou sua proposta!`, type: 'approved' },
  negociacao: { message: (n) => `${n || 'Um cliente'} quer negociar sua proposta`, type: 'negotiation' },
  expirado: { message: () => 'Uma proposta expirou', type: 'expired' },
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get recent proposal_links with status changes (last 30 days)
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data: links } = await supabase
        .from('proposal_links')
        .select('id, status, document_id, approver_name, updated_at, viewed_at, approved_at, negotiation_message')
        .eq('user_id', user.id)
        .gte('updated_at', since.toISOString())
        .order('updated_at', { ascending: false })
        .limit(20);

      if (!links) return;

      // Get document names for context
      const docIds = [...new Set(links.map(l => l.document_id))];
      const { data: docs } = await supabase
        .from('generated_documents')
        .select('id, client_name')
        .in('id', docIds);

      const docMap = new Map(docs?.map(d => [d.id, d.client_name]) || []);

      const notifs: AppNotification[] = [];

      for (const link of links) {
        const statusKey = link.status as string;
        const config = STATUS_MESSAGES[statusKey];
        if (!config) continue;
        // Only show notifications for statuses that are not 'enviado'
        if (statusKey === 'enviado') continue;

        const clientName = link.approver_name || docMap.get(link.document_id) || '';

        notifs.push({
          id: link.id,
          message: config.message(clientName),
          type: config.type,
          read: false,
          createdAt: link.updated_at,
          documentId: link.document_id,
        });
      }

      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime changes on proposal_links
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'proposal_links' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.length;

  const markAllRead = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, unreadCount, loading, markAllRead, refetch: fetchNotifications };
}
