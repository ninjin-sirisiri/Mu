/** WebView state representation */
export interface WebViewState {
  /** Current URL of the WebView */
  currentUrl: string;
  /** Title of the current page */
  title: string;
  /** Whether the page is currently loading */
  isLoading: boolean;
  /** Whether navigation back is possible */
  canGoBack: boolean;
  /** Whether navigation forward is possible */
  canGoForward: boolean;
}

/** Navigation control functions */
export interface NavigationControls {
  /** Navigate to a specific URL */
  navigateTo: (url: string) => Promise<void>;
  /** Go back in history */
  goBack: () => Promise<void>;
  /** Go forward in history */
  goForward: () => Promise<void>;
  /** Reload the current page */
  reload: () => Promise<void>;
  /** Navigate to home page */
  goHome: () => Promise<void>;
}
