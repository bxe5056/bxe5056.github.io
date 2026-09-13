/**
 * Trigger a file download from a Blob via object URL.
 * Matches the createObjectURL + <a download> pattern used in category tools.
 *
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  if (!blob || !filename) return;

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Download a string as a text file.
 *
 * @param {string} text
 * @param {string} filename
 * @param {string} [mime='text/plain']
 */
export function downloadText(text, filename, mime = "text/plain") {
  const blob = new Blob([text == null ? "" : String(text)], { type: mime });
  downloadBlob(blob, filename);
}

/**
 * Download from a data URL or existing object URL (e.g. canvas.toDataURL / image preview).
 * Does not revoke the given URL - caller owns its lifetime.
 *
 * @param {string} dataUrl
 * @param {string} filename
 */
export function downloadDataUrl(dataUrl, filename) {
  if (!dataUrl || !filename) return;

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
