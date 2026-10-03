import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/construction-daily-log-automation', destination: '/contractor-daily-logs', permanent: true },
      { source: '/contractor-change-order-workflow', destination: '/construction-change-orders', permanent: true },
      { source: '/construction-receipt-tracking', destination: '/contractor-receipt-capture', permanent: true },
      { source: '/permit-command', destination: '/permit-pathfinder', permanent: true },
    ];
  },
};

export default nextConfig;
