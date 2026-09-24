import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "cosmos_session";
const SECRET_KEY_STR = process.env.SESSION_SECRET || "cosmos-personel-takip-secret-key-2026-super-auth";

// Base64Url Yardımcıları (Edge ve Node uyumlu, Buffer gerektirmez)
export function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET_KEY_STR),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: string;
  email?: string | null;
}

export interface SessionPayload extends SessionUser {
  exp: number;
}

// Oturum Tokeni Oluştur (HMAC-SHA256 imzalı)
export async function createSessionToken(user: SessionUser): Promise<string> {
  const enc = new TextEncoder();
  // 7 günlük geçerlilik süresi
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload: SessionPayload = {
    ...user,
    exp,
  };
  const jsonStr = JSON.stringify(payload);
  const dataB64 = toBase64Url(enc.encode(jsonStr));

  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(dataB64));
  const sigB64 = toBase64Url(new Uint8Array(signature));

  return `${dataB64}.${sigB64}`;
}

// Oturum Tokenini Doğrula
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [dataB64, sigB64] = parts;

    const enc = new TextEncoder();
    const key = await getHmacKey();
    const signatureBytes = fromBase64Url(sigB64);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      enc.encode(dataB64)
    );

    if (!isValid) return null;

    const jsonBytes = fromBase64Url(dataB64);
    let jsonStr = "";
    for (let i = 0; i < jsonBytes.length; i++) {
      jsonStr += String.fromCharCode(jsonBytes[i]);
    }
    // UTF-8 decode
    const decodedStr = decodeURIComponent(escape(jsonStr));
    const payload: SessionPayload = JSON.parse(decodedStr);

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return {
      id: payload.id,
      username: payload.username,
      name: payload.name,
      role: payload.role,
      email: payload.email,
    };
  } catch (e) {
    return null;
  }
}

// Şifre Hashleme (PBKDF2 SHA-256)
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return `${toBase64Url(salt)}:${toBase64Url(new Uint8Array(derived))}`;
}

// Şifre Doğrulama
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Seed veya eski düz metin şifreler için uyumluluk
    if (!storedHash.includes(":")) {
      return password === storedHash || (password === "admin123" && storedHash === "admin");
    }

    const [saltStr, hashStr] = storedHash.split(":");
    const salt = fromBase64Url(saltStr);
    const enc = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derived = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt as unknown as BufferSource,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    const derivedB64 = toBase64Url(new Uint8Array(derived));
    return derivedB64 === hashStr;
  } catch {
    return false;
  }
}

// Server Component / API Route'lardan mevcut oturumu çek
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
