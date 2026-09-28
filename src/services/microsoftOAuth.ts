import { EmailItem } from '../types';

export interface MicrosoftOAuthResult {
  token: string;
  userEmail: string;
  userName: string;
  emails: EmailItem[];
  count: number;
}

export interface MicrosoftOAuthOptions {
  tenant?: string;
  emailHint?: string;
  onSuccess?: (result: MicrosoftOAuthResult) => void;
  onError?: (error: string) => void;
}

/**
 * Initiates the authentic Microsoft OAuth 2.0 / Entra ID authentication flow.
 * Triggers a real redirect to Microsoft's login endpoint, ensuring the token
 * is retrieved only after a successful user sign-in.
 */
export async function initiateMicrosoftOAuth(options: MicrosoftOAuthOptions = {}): Promise<MicrosoftOAuthResult> {
  const query = new URLSearchParams();
  if (options.tenant) query.set('tenant', options.tenant);
  if (options.emailHint) query.set('email', options.emailHint);

  const urlRes = await fetch(`/api/auth/microsoft/url${query.toString() ? `?${query.toString()}` : ''}`);
  if (!urlRes.ok) {
    const errText = await urlRes.text();
    throw new Error(`Failed to initialize Microsoft login: ${errText || urlRes.statusText}`);
  }

  const { authUrl } = await urlRes.json();
  if (!authUrl) {
    throw new Error('Identity provider did not return an authorization URL.');
  }

  // Calculate centered popup dimensions
  const width = 600;
  const height = 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

  const popup = window.open(
    authUrl,
    'microsoft_oauth_sign_in',
    `width=${width},height=${height},left=${left},top=${top},status=yes,scrollbars=yes,resizable=yes`
  );

  // If popup blocked
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    const blockedError: any = new Error('Pop-up window was blocked by the browser. Please allow pop-ups or use the in-app Microsoft sign-in.');
    blockedError.isCancelled = true;
    blockedError.isPopupBlocked = true;
    if (options.onError) options.onError(blockedError.message);
    throw blockedError;
  }

  return new Promise<MicrosoftOAuthResult>((resolve, reject) => {
    let completed = false;

    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MSFT_AUTH_SUCCESS') {
        completed = true;
        window.removeEventListener('message', messageHandler);
        clearInterval(pollTimer);
        const result: MicrosoftOAuthResult = {
          token: event.data.token,
          userEmail: event.data.userEmail,
          userName: event.data.userName || event.data.userEmail.split('@')[0],
          emails: Array.isArray(event.data.emails) ? event.data.emails : [],
          count: event.data.count || 0,
        };
        if (options.onSuccess) options.onSuccess(result);
        resolve(result);
      } else if (event.data && event.data.type === 'MSFT_AUTH_ERROR') {
        completed = true;
        window.removeEventListener('message', messageHandler);
        clearInterval(pollTimer);
        const errorMsg = event.data.error || 'Microsoft authentication was declined or failed.';
        if (options.onError) options.onError(errorMsg);
        const err: any = new Error(errorMsg);
        reject(err);
      }
    };

    window.addEventListener('message', messageHandler);

    // Poll to detect if user closed the popup without signing in
    const pollTimer = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', messageHandler);
          if (!completed) {
            const cancelMsg = 'Microsoft authentication window was closed before sign-in completed.';
            if (options.onError) options.onError(cancelMsg);
            const cancelErr: any = new Error(cancelMsg);
            cancelErr.isCancelled = true;
            reject(cancelErr);
          }
        }
      } catch {
        // Cross-origin access error on closed check
      }
    }, 800);
  });
}
