/**
 * 簡易ファジー検索
 * 100行以内で実装（ミニマリズムの原則）
 */
export function fuzzySearch<T extends { label: string; keywords: string[] }>(
  query: string,
  items: T[]
): Array<{ item: T; score: number }> {
  const lowerQuery = query.toLowerCase();

  return items
    .map((item) => {
      const label = item.label.toLowerCase();
      const keywords = item.keywords.map((k) => k.toLowerCase());

      // スコア計算
      let score = 0;

      // ラベルに完全一致
      if (label === lowerQuery) score += 100;

      // ラベルに前方一致
      if (label.startsWith(lowerQuery)) score += 50;

      // ラベルに部分一致
      if (label.includes(lowerQuery)) score += 25;

      // キーワードに一致
      keywords.forEach((keyword) => {
        if (keyword.includes(lowerQuery)) score += 10;
      });

      return { item, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
}
