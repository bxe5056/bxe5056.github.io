import React, { useEffect, useMemo, useState } from "react";
import { FaCopy } from "react-icons/fa";
import { copyText } from "../../../utils/tools/clipboard";
import { consumeSessionPayload } from "../../../utils/tools/session";

const MODE_DECODE = "decode";
const MODE_SIGN = "sign";

const DEFAULT_HEADER = `{
  "alg": "HS256",
  "typ": "JWT"
}`;

const DEFAULT_PAYLOAD = `{
  "sub": "1234567890",
  "name": "Jane Doe",
  "iat": 1516239022
}`;

/** Unicode-safe Base64 decode (binary string → UTF-8 text). */
function decodeBase64(str) {
  const binary = atob(str);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Encode bytes as URL-safe Base64 without padding. */
function base64UrlEncodeBytes(bytes) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Encode a UTF-8 string as URL-safe Base64 without padding. */
function base64UrlEncodeString(str) {
  return base64UrlEncodeBytes(new TextEncoder().encode(str));
}

/** Decode JWT segment: URL-safe Base64 with optional padding. */
function decodeJwtSegment(segment) {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return JSON.parse(decodeBase64(padded));
}

function looksLikeJwt(text) {
  const parts = String(text).trim().split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

function looksLikeJsonObject(text) {
  const t = String(text).trim();
  if (!t.startsWith("{") || !t.endsWith("}")) return false;
  try {
    const parsed = JSON.parse(t);
    return parsed != null && typeof parsed === "object" && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

/**
 * Sign compact JWT with HMAC-SHA256 via Web Crypto.
 * @param {object} header
 * @param {object} payload
 * @param {string} secret
 * @returns {Promise<string>}
 */
async function signHs256(header, payload, secret) {
  if (!crypto?.subtle) {
    throw new Error("Web Crypto API is not available in this browser");
  }

  const alg = header?.alg;
  if (alg != null && String(alg).toUpperCase() !== "HS256") {
    throw new Error("Only HS256 is supported — other algorithms are disabled");
  }

  const normalizedHeader = { ...header, alg: "HS256", typ: header?.typ || "JWT" };
  const headerB64 = base64UrlEncodeString(JSON.stringify(normalizedHeader));
  const payloadB64 = base64UrlEncodeString(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
  const sigB64 = base64UrlEncodeBytes(new Uint8Array(signature));
  return `${signingInput}.${sigB64}`;
}

function extractSessionText(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.text === "string" && payload.text.length > 0) {
    return payload.text;
  }
  return null;
}

export default function JwtTool() {
  const [mode, setMode] = useState(MODE_DECODE);
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState("");
  const [headerText, setHeaderText] = useState(DEFAULT_HEADER);
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState("");
  const [signedToken, setSignedToken] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const payload = consumeSessionPayload();
    const text = extractSessionText(payload);
    if (text == null) return;

    if (looksLikeJwt(text)) {
      setMode(MODE_DECODE);
      setToken(text.trim());
      setStatus("Loaded JWT into decode from handoff");
      return;
    }

    if (looksLikeJsonObject(text) || payload?.type === "json") {
      setMode(MODE_SIGN);
      setPayloadText(text.trim());
      setStatus("Loaded JSON into sign payload from handoff");
      return;
    }

    // Ambiguous text: prefer decode token field
    setMode(MODE_DECODE);
    setToken(text);
    setStatus("Loaded text into decode from handoff");
  }, []);

  const headerAlgWarning = useMemo(() => {
    try {
      const parsed = JSON.parse(headerText);
      const alg = parsed?.alg;
      if (alg == null) return null;
      if (String(alg).toUpperCase() !== "HS256") {
        return `Header alg is "${alg}" — only HS256 can be signed here`;
      }
      return null;
    } catch {
      return null;
    }
  }, [headerText]);

  const canSign = !headerAlgWarning && Boolean(secret);

  const handleDecode = () => {
    setError(null);
    setStatus(null);
    try {
      const parts = token.trim().split(".");
      if (parts.length !== 3) throw new Error("Invalid JWT format");

      const header = decodeJwtSegment(parts[0]);
      const payload = decodeJwtSegment(parts[1]);
      const result = {
        header,
        payload,
        signature: parts[2],
      };
      setDecoded(JSON.stringify(result, null, 2));

      if (header?.alg && String(header.alg).toUpperCase() !== "HS256") {
        setStatus(
          `Decoded successfully. Note: alg is "${header.alg}" (this tool signs HS256 only).`
        );
      } else {
        setStatus("Decoded successfully");
      }
    } catch {
      setDecoded("");
      setError("Invalid JWT token");
    }
  };

  const handleSign = async () => {
    setError(null);
    setStatus(null);
    setSignedToken("");

    if (!secret) {
      setError("Enter a secret to sign");
      return;
    }

    let header;
    let payload;
    try {
      header = JSON.parse(headerText);
    } catch {
      setError("Header must be valid JSON");
      return;
    }
    try {
      payload = JSON.parse(payloadText);
    } catch {
      setError("Payload must be valid JSON");
      return;
    }

    if (header?.alg != null && String(header.alg).toUpperCase() !== "HS256") {
      setError("Only HS256 is supported — change header.alg or use Decode mode");
      return;
    }

    setSigning(true);
    try {
      const jwt = await signHs256(header, payload, secret);
      setSignedToken(jwt);
      setStatus("Signed with HS256 (secret never left this browser)");
    } catch (err) {
      setError(err?.message || "Failed to sign JWT");
    } finally {
      setSigning(false);
    }
  };

  const handleCopy = async (text, label) => {
    if (!text) return;
    const ok = await copyText(text);
    setStatus(ok ? `Copied ${label}` : "Could not copy to clipboard");
  };

  const handleUseSignedInDecode = () => {
    if (!signedToken) return;
    setToken(signedToken);
    setMode(MODE_DECODE);
    setStatus("Moved signed token into Decode");
  };

  return (
    <div className="space-y-6" data-tool="jwt">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setMode(MODE_DECODE);
              setError(null);
            }}
            className={`px-3 py-1.5 text-sm ${
              mode === MODE_DECODE
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Decode
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(MODE_SIGN);
              setError(null);
            }}
            className={`px-3 py-1.5 text-sm ${
              mode === MODE_SIGN
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Sign (HS256)
          </button>
        </div>
      </div>

      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Secrets and tokens are processed entirely in your browser and never
        sent to a server. Signing supports <strong>HS256 only</strong> — other
        algorithms are rejected.
      </p>

      {mode === MODE_DECODE && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JWT token
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full h-28 p-2 border rounded font-mono text-sm"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              spellCheck={false}
            />
          </div>
          <button
            type="button"
            onClick={handleDecode}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Decode JWT
          </button>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Decoded header &amp; payload
              </label>
              {decoded && (
                <button
                  type="button"
                  onClick={() => handleCopy(decoded, "decoded JSON")}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600"
                >
                  <FaCopy />
                  Copy
                </button>
              )}
            </div>
            <textarea
              value={decoded}
              readOnly
              className="w-full h-48 p-2 border rounded font-mono text-sm bg-gray-50"
              placeholder="Decoded JSON appears here…"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {mode === MODE_SIGN && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Header (alg must be HS256)
            </label>
            <textarea
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              className="w-full h-24 p-2 border rounded font-mono text-sm"
              spellCheck={false}
            />
            {headerAlgWarning && (
              <p className="mt-1 text-sm text-red-600">{headerAlgWarning}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payload (JSON)
            </label>
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="w-full h-36 p-2 border rounded font-mono text-sm"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full p-2 border rounded font-mono text-sm"
              placeholder="HMAC secret (stays in this browser)"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={handleSign}
            disabled={!canSign || signing}
            className={`px-4 py-2 rounded text-white ${
              !canSign || signing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-700"
            }`}
          >
            {signing ? "Signing…" : "Sign JWT"}
          </button>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Compact JWT
              </label>
              <div className="flex items-center gap-3">
                {signedToken && (
                  <>
                    <button
                      type="button"
                      onClick={handleUseSignedInDecode}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Open in Decode
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(signedToken, "JWT")}
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600"
                    >
                      <FaCopy />
                      Copy
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              value={signedToken}
              readOnly
              className="w-full h-28 p-2 border rounded font-mono text-sm bg-gray-50"
              placeholder="Signed token appears here…"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {status && !error && (
        <p className="text-sm text-gray-600" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
