// Android interface declarations for Capacitor/WebView
declare global {
  interface Window {
    AndroidInterface?: {
      getStatusBarHeight: () => number;
      hideKeyboard: () => void;
      showKeyboard: () => void;
    };
  }
}

export {};

