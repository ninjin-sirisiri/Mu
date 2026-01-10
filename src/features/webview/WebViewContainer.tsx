import type React from 'react';

interface WebViewContainerProps {
  url: string;
}

/** Container for the WebView content area - transparent to show content webview behind */
export const WebViewContainer: React.FC<WebViewContainerProps> = ({ url: _url }) => {
  // The actual web content is rendered in the "content" webview (a sibling webview)
  // managed by the Rust backend. This component is transparent to allow
  // the content webview to show through.

  return <div className="h-full w-full" />;
};
