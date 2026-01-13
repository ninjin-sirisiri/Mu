/**
 * 入力がURLかコマンドかを判定
 */
export function parseInput(input: string): {
  type: 'url' | 'search' | 'command';
  value: string;
} {
  const trimmed = input.trim();

  // URLパターン
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    /^[\w-]+\.\w+/.test(trimmed)
  ) {
    return { type: 'url', value: trimmed };
  }

  // コマンドパターン（キーワードマッチ）
  // 実装: コマンドリストから検索

  // デフォルトは検索
  return { type: 'search', value: trimmed };
}
