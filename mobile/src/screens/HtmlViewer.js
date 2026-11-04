import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, fonts, type } from '../theme';

// DOCX/TXT via WebView — HTML sudah disanitasi server. user-select:none (§8.1)
const WITH_CSS = (html) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: ${fonts.sans}, sans-serif; font-size: 16px; line-height: 1.6;
         color: ${colors.ui.textPrimary}; padding: 12px; user-select: none; -webkit-user-select: none; }
  img { max-width: 100%; }
</style></head><body>${html || '<p>Konten kosong.</p>'}</body></html>`;

export default function HtmlViewer({ html }) {
  if (!html) {
    return (
      <View style={styles.empty}>
        <Text style={styles.text}>Konten tidak tersedia.</Text>
      </View>
    );
  }
  return (
    <WebView
      source={{ html: WITH_CSS(html) }}
      style={styles.flex}
      injectedJavaScript="document.addEventListener('contextmenu', e => e.preventDefault()); true;"
      onShouldStartLoadWithRequest={() => true}
      scrollEnabled
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { padding: 24, alignItems: 'center' },
  text: { fontFamily: fonts.sans, fontSize: type.small, color: colors.ui.textSecondary },
});
