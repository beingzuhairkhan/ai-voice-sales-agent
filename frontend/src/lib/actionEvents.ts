import {
  PhoneCall,
  PhoneOff,
  Flame,
  Tag,
  MessageSquare,
  Send,
  Clock,
  CalendarCheck,
  FileText,
  Activity,
  type LucideIcon,
} from 'lucide-react';

import type { ActionType } from '@/types/api';

const map: Partial<
  Record<string, { icon: LucideIcon; color: string }>
> = {
  CALL_STARTED: {
    icon: PhoneCall,
    color: 'bg-brand-50 text-brand-600',
  },

  CALL_ENDED: {
    icon: PhoneOff,
    color: 'bg-ink-100 text-ink-600',
  },

  HOT_DETECTED: {
    icon: Flame,
    color: 'bg-hot-50 text-hot-600',
  },

  LEAD_CLASSIFIED: {
    icon: Tag,
    color: 'bg-warm-50 text-warm-600',
  },

  WHATSAPP_TRIGGERED: {
    icon: MessageSquare,
    color: 'bg-success-50 text-success-600',
  },

  WHATSAPP_SENT: {
    icon: Send,
    color: 'bg-success-50 text-success-600',
  },

  CALLBACK_REQUESTED: {
    icon: Clock,
    color: 'bg-cold-50 text-cold-600',
  },

  CALLBACK_BOOKED: {
    icon: CalendarCheck,
    color: 'bg-cold-50 text-cold-600',
  },

  FOLLOWUP_GENERATED: {
    icon: FileText,
    color: 'bg-brand-50 text-brand-600',
  },
};

/**
 * Returns the icon and color configuration for an action event.
 * Falls back to a generic Activity icon when the action type
 * is missing or not recognized.
 */
export function getActionEventStyle(
  type?: ActionType | string | null,
): {
  icon: LucideIcon;
  color: string;
} {
  return (
    map[type ?? ''] ?? {
      icon: Activity,
      color: 'bg-ink-100 text-ink-600',
    }
  );
}

/**
 * Converts an action type such as:
 *
 * CALL_STARTED
 *
 * into:
 *
 * Call Started
 *
 * Handles undefined/null values safely.
 */
export function formatActionLabel(
  type?: ActionType | string | null,
): string {
  if (!type) {
    return 'Unknown Action';
  }

  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}