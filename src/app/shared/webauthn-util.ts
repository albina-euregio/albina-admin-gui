import type {
  WebAuthnServiceAuthenticationCredential,
  WebAuthnServicePublicKeyCredentialCreationOptions,
  WebAuthnServicePublicKeyCredentialRequestOptions,
  WebAuthnServiceRegistrationCredential,
} from "app/providers/albina-api";

// The server exchanges challenges, credential IDs, signatures, etc. as base64url text (see
// eu.albina.webauthn.WebAuthnService on the server); the browser's WebAuthn API wants/returns
// ArrayBuffers. These convert between the two so the rest of the app never has to.

function base64UrlToBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// The server's `type` fields are typed as plain `string` (they come from an OpenAPI schema),
// but the browser's WebAuthn types require the literal "public-key" — always what the server
// sends, so it's rebuilt as a literal here rather than passed through.

export function toCreationOptions(
  options: WebAuthnServicePublicKeyCredentialCreationOptions,
): CredentialCreationOptions {
  return {
    publicKey: {
      challenge: base64UrlToBuffer(options.challenge),
      rp: options.rp,
      user: { ...options.user, id: base64UrlToBuffer(options.user.id) },
      pubKeyCredParams: options.pubKeyCredParams.map((p) => ({ type: "public-key", alg: p.alg })),
      authenticatorSelection: options.authenticatorSelection as AuthenticatorSelectionCriteria,
      attestation: options.attestation as AttestationConveyancePreference,
      excludeCredentials: options.excludeCredentials.map((c) => ({
        type: "public-key",
        id: base64UrlToBuffer(c.id),
      })),
      timeout: options.timeout,
    },
  };
}

export function toRequestOptions(
  options: WebAuthnServicePublicKeyCredentialRequestOptions,
  signal?: AbortSignal,
  mediation?: CredentialMediationRequirement,
): CredentialRequestOptions {
  return {
    signal,
    mediation,
    publicKey: {
      challenge: base64UrlToBuffer(options.challenge),
      rpId: options.rpId,
      allowCredentials: options.allowCredentials.map((c) => ({
        type: "public-key",
        id: base64UrlToBuffer(c.id),
      })),
      userVerification: options.userVerification as UserVerificationRequirement,
      timeout: options.timeout,
    },
  };
}

export function fromRegistrationCredential(credential: PublicKeyCredential): WebAuthnServiceRegistrationCredential {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      attestationObject: bufferToBase64Url(response.attestationObject),
    },
  };
}

export function fromAuthenticationCredential(credential: PublicKeyCredential): WebAuthnServiceAuthenticationCredential {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      signature: bufferToBase64Url(response.signature),
      userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : undefined,
    },
  };
}

export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}
