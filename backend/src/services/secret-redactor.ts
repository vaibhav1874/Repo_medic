/**
 * Secret Redaction Service
 * Detects sensitive credentials and redacts them with [REDACTED:<type>]
 * before files are passed into model context or logs.
 */

export interface RedactionResult {
  redactedText: string;
  foundSecrets: Array<{
    type: string;
    line: number;
  }>;
}

const SECRET_PATTERNS: Array<{ type: string; regex: RegExp }> = [
  // AWS Access Key ID
  { type: 'AWS_ACCESS_KEY', regex: /(?:AKIA[0-9A-Z]{16})/g },
  // AWS Secret Key heuristic
  { type: 'AWS_SECRET_KEY', regex: /(?:aws_secret_access_key|aws_secret_key)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi },
  // GitHub Personal Access Token / Fine-grained token
  { type: 'GITHUB_TOKEN', regex: /(?:ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})/g },
  // Slack Token
  { type: 'SLACK_TOKEN', regex: /(?:xox[baprs]-[0-9a-zA-Z-]{10,48})/g },
  // Private Key Headers
  { type: 'PRIVATE_KEY', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },
  // Generic Bearer Token
  { type: 'BEARER_TOKEN', regex: /(?:Bearer\s+[a-zA-Z0-9_\-\.]{20,})/gi },
  // Generic API Key in assignments: api_key = "..." or apiKey: "..."
  { type: 'API_KEY_ASSIGNMENT', regex: /(?:api_?key|secret_?key|auth_?token|client_?secret)\s*[:=]\s*["']([a-zA-Z0-9_\-]{16,})["']/gi },
  // Generic Password in assignments
  { type: 'PASSWORD_ASSIGNMENT', regex: /(?:password|passwd|pwd)\s*[:=]\s*["']([^"'\r\n]{6,})["']/gi },
];

export function redactSecrets(content: string): RedactionResult {
  let redacted = content;
  const foundSecrets: Array<{ type: string; line: number }> = [];

  for (const { type, regex } of SECRET_PATTERNS) {
    // Reset lastIndex for stateful regexes
    regex.lastIndex = 0;
    
    // Find lines for matches
    const matches = Array.from(content.matchAll(regex));
    for (const match of matches) {
      if (match.index !== undefined) {
        const line = content.substring(0, match.index).split('\n').length;
        foundSecrets.push({ type, line });
      }
    }

    // Perform replacement
    if (type === 'PRIVATE_KEY') {
      redacted = redacted.replace(regex, '[REDACTED:PRIVATE_KEY]');
    } else if (type === 'API_KEY_ASSIGNMENT' || type === 'PASSWORD_ASSIGNMENT' || type === 'AWS_SECRET_KEY') {
      redacted = redacted.replace(regex, (fullMatch, captureGroup) => {
        return fullMatch.replace(captureGroup, `[REDACTED:${type}]`);
      });
    } else {
      redacted = redacted.replace(regex, `[REDACTED:${type}]`);
    }
  }

  return {
    redactedText: redacted,
    foundSecrets,
  };
}
