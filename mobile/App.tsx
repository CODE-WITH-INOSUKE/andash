import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';

const BACKEND_URL = __DEV__ 
  ? 'http://10.0.2.2:3001' 
  : 'http://localhost:3001';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const injectedJS = `
    (function() {
      // AMOLED theme
      document.documentElement.style.backgroundColor = '#000000';
      document.body.style.backgroundColor = '#000000';
      
      // Auto-fullscreen on TV
      if (window.screen && window.screen.availHeight) {
        const isTV = window.screen.availWidth > 1280 && window.screen.availHeight > 720;
        if (isTV) {
          document.documentElement.requestFullscreen?.();
        }
      }
      
      // Keep screen awake
      if (navigator.wakeLock) {
        navigator.wakeLock.request('screen').catch(() => {});
      }
      
      // Prevent overscroll
      document.body.style.overscrollBehavior = 'none';
      
      // Touch-friendly adjustments
      const style = document.createElement('style');
      style.textContent = \`
        * { -webkit-tap-highlight-color: transparent; }
        input, button { touch-action: manipulation; }
      \`;
      document.head.appendChild(style);
      
      true;
    })();
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        translucent={false}
      />
      
      <WebView
        ref={webViewRef}
        source={{ uri: `${BACKEND_URL}/?platform=mobile` }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        userAgent={`Andash/${Platform.OS}/${Platform.Version}`}
        injectedJavaScript={injectedJS}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        allowsFullscreenVideo={false}
        androidLayerType="hardware"
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        overScrollMode="never"
        bounces={false}
      />
      
      {loading && (
        <View style={styles.loading}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading Andash...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#888888',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default App;
