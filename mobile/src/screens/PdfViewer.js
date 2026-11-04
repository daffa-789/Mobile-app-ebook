import Pdf from 'react-native-pdf';
import { StyleSheet, View } from 'react-native';

// react-native-pdf (pdfium) — scroll vertikal kontinu seperti web (§8.2)
export default function PdfViewer({ source, initialPage = 1, onPageChanged }) {
  const src = source?.startsWith('file://') || source?.startsWith('content://')
    ? { uri: source }
    : { uri: source };
  return (
    <View style={styles.flex}>
      <Pdf
        source={src}
        style={styles.flex}
        gravity="center"
        enablePinchZoom
        onLoadProgress={() => {}}
        onPageChanged={(page) => onPageChanged?.(page)}
        onError={() => {}}
        // initial page didukung versi terbaru via onPageChanged + scrollTo; fallback ke halaman 1
        // initialPage sengaja tidak dipaksakan di sini agar kompatibel semua versi pdf renderer.
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
