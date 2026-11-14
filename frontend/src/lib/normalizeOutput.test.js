import { describe, it, expect } from 'vitest'
import { normalizeOutput, sha256Hex } from './normalizeOutput.js'

describe('normalizeOutput', () => {
  it('normalizes CRLF and strips trailing spaces and trailing newlines', () => {
    expect(normalizeOutput('a  \r\nb\n\n')).toBe('a\nb')
  })

  it('keeps trailing tabs and lone CR, strips only U+0020', () => {
    expect(normalizeOutput('a\t \nb\r ')).toBe('a\t\nb\r')
  })
})

describe('sha256Hex', () => {
  it('hashes the UTF-8 bytes of "a\\nb"', async () => {
    expect(await sha256Hex('a\nb')).toBe(
      '7e18f737311b2dc3b2f269dd78396b0351f14fb66efa879f768cb23181883c78'
    )
  })

  it('hashes normalize("8\\n")', async () => {
    expect(await sha256Hex(normalizeOutput('8\n'))).toBe(
      '2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3'
    )
  })
})
