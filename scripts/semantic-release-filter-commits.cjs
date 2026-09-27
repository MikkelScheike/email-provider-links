'use strict';

const { execFileSync } = require('node:child_process');

/**
 * semantic-release analyzeCommits plugin.
 * Keeps only commits that touch one of the configured path prefixes so each
 * package can release on its own schedule.
 * Prefixes must end with "/" so `packages/email-provider-links/` does not
 * also match `packages/email-provider-links-react-native/`.
 *
 * @param {{ pathPrefix?: string, pathPrefixes?: string[] }} pluginConfig
 * @param {{ commits: Array<{ hash: string }> }} context
 */
function analyzeCommits(pluginConfig, context) {
  const prefixes = [
    ...(pluginConfig.pathPrefixes ?? []),
    ...(pluginConfig.pathPrefix ? [pluginConfig.pathPrefix] : []),
  ];

  if (prefixes.length === 0) {
    return;
  }

  context.commits = context.commits.filter((commit) => {
    const output = execFileSync(
      'git',
      ['diff-tree', '--no-commit-id', '--name-only', '-r', '-m', commit.hash],
      { encoding: 'utf8' }
    );
    const files = output.split('\n').map((line) => line.trim()).filter(Boolean);
    return files.some((file) => prefixes.some((prefix) => file.startsWith(prefix)));
  });
}

module.exports = { analyzeCommits };
