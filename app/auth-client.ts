'use client';
import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { contractorAuth } from './contractor-auth';

export const authClient = createAuthClient({ plugins: [inferAdditionalFields<ReturnType<typeof contractorAuth>>()] });
