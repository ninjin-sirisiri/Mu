import type { Command } from './types';

// デフォルトコマンドのファクトリー関数
// 実際のアクションは外部から注入されます
export function createDefaultCommands(actions: {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  goHome: () => void;
  createTab: () => void;
  closeTab: () => void;
}): Command[] {
  return [
    {
      id: 'navigate-back',
      label: '戻る',
      description: '前のページに戻る',
      keywords: ['back', '戻る', 'もどる'],
      category: 'navigation',
      shortcut: 'Alt+←',
      action: actions.goBack,
    },
    {
      id: 'navigate-forward',
      label: '進む',
      description: '次のページに進む',
      keywords: ['forward', '進む', 'すすむ'],
      category: 'navigation',
      shortcut: 'Alt+→',
      action: actions.goForward,
    },
    {
      id: 'reload',
      label: '再読み込み',
      description: 'ページを再読み込み',
      keywords: ['reload', 'refresh', '再読み込み', 'リロード'],
      category: 'navigation',
      shortcut: 'Ctrl+R',
      action: actions.reload,
    },
    {
      id: 'home',
      label: 'ホーム',
      description: 'ホームページに移動',
      keywords: ['home', 'ホーム'],
      category: 'navigation',
      shortcut: '',
      action: actions.goHome,
    },
    {
      id: 'new-tab',
      label: '新しいタブ',
      description: '新しいタブを開く',
      keywords: ['new', 'tab', '新規', 'タブ'],
      category: 'tab',
      shortcut: 'Ctrl+T',
      action: actions.createTab,
    },
    {
      id: 'close-tab',
      label: 'タブを閉じる',
      description: '現在のタブを閉じる',
      keywords: ['close', 'tab', '閉じる', 'タブ'],
      category: 'tab',
      shortcut: 'Ctrl+W',
      action: actions.closeTab,
    },
  ];
}
