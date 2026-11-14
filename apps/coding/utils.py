import hashlib


def normalize_output(value):
    """Standardize CRLF and trim U+0020 spaces at line ends and final newlines."""
    normalized = value.replace('\r\n', '\n')
    normalized = '\n'.join(line.rstrip(' ') for line in normalized.split('\n'))
    return normalized.rstrip('\n')


def sha256_hex(value):
    """Return the lowercase SHA-256 hex digest of a UTF-8 string."""
    return hashlib.sha256(value.encode('utf-8')).hexdigest()
