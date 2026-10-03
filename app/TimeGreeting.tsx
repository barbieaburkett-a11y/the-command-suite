'use client';

import { useSyncExternalStore } from 'react';

type GreetingContext = 'public' | 'workspace';

function greetingPeriod() {
  const localPreview = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? new URLSearchParams(window.location.search).get('greetingPreview')
    : null;
  if (localPreview && ['morning', 'afternoon', 'evening', 'late'].includes(localPreview)) return localPreview;
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17) return 'evening';
  return 'late';
}

export default function TimeGreeting({ firstName, context = 'public' }: { firstName?: string; context?: GreetingContext }) {
  const period = useSyncExternalStore(() => () => {}, greetingPeriod, () => 'late');
  const salutation = period === 'morning' ? 'Good morning' : period === 'afternoon' ? 'Good afternoon' : period === 'evening' ? 'Good evening' : 'Welcome back';
  const publicMessage = period === 'morning' ? 'Good morning. Let’s get your office organized.' : period === 'afternoon' ? 'Good afternoon. Let’s keep every job moving.' : period === 'evening' ? 'Good evening. Let’s make tomorrow easier.' : 'Welcome back';
  const message = context === 'workspace' ? `${salutation}${firstName ? `, ${firstName}` : ''}.` : publicMessage;
  return <p className={`time-greeting time-greeting-${context}`} data-greeting-period={period} suppressHydrationWarning>{message}</p>;
}
