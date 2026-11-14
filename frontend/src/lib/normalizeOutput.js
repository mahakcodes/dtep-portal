// Output normalization and hashing for browser-reported coding grading.
// Must match the backend exactly (see API_CONTRACT.md, "Output normalization and hidden-case hashes").
//
// Rules:
// - Replace CRLF (\r\n) with LF (\n)
// - Strip ONLY the space character U+0020 from the end of each line
// - Strip trailing LF characters at the end
// - Tabs at line ends are kept and a lone \r is left untouched
// - Never use \s or the regex m flag

export const normalizeOutput = (t) =>
  t
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/ +$/, ''))
    .join('\n')
    .replace(/\n+$/, '')

// Lowercase SHA-256 hex of the UTF-8 bytes of `text`.
export const sha256Hex = async (text) => {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
