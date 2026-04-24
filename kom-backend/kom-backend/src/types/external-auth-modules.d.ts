declare module 'google-auth-library' {
  export type TokenPayload = {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    aud?: string | string[];
    azp?: string;
    iss?: string;
  };

  export class OAuth2Client {
    verifyIdToken(options: {
      idToken: string;
      audience?: string | string[];
    }): Promise<{
      getPayload(): TokenPayload | undefined;
    }>;
  }
}

declare module 'jose' {
  export function createRemoteJWKSet(url: URL): unknown;

  export function jwtVerify(
    jwt: string,
    key: unknown,
    options?: {
      issuer?: string;
      audience?: string | string[];
    },
  ): Promise<{
    payload: Record<string, unknown>;
  }>;
}