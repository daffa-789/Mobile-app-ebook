import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { colors, fonts, radius, type, spacing } from '../theme';
import { useAuth } from '../state/AuthContext';
import { getBookHtml } from '../api/books';
import { readableError } from '../api/client';
import { getDownload, verifyLocalFile } from '../storage/downloads';
import { downloadBookToDevice } from '../storage/downloadContent';
import { API_BASE_URL } from '../config';
import PdfViewer from './PdfViewer';
import HtmlViewer from './HtmlViewer';
import { toast } from '../components/Toast';

const PDF_EXTS = new Set(['pdf']);
const TEXT_EXTS = new Set(['docx', 'doc', 'odt', 'txt', 'md', 'csv', 'rtf']);

export default function ReaderScreen({ route, navigation }) {
  const { book } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  // FLAG_SECURE hanya di ReaderScreen (§10). Preview hatch: channel production saja.
  usePreventScreenCapture();
  const [stage, setStage] = useState('loading');
  const [error, setError] = useState('');
  const [html, setHtml] = useState('');
  const [localUri, setLocalUri] = useState(null);
  const [locked, setLocked] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [page, setPage] = useState(1);
  const savingRef = useRef(false);

  const ext = (book.contentExtension || book.contentType || '').replace('.', '').toLowerCase();

  const savePage = useCallback(async (p) => {
    if (savingRef.current || !user?.id) return;
    savingRef.current = true;
    try {
      const { setLastReadPage } = await import('../storage/downloads');
      await setLastReadPage(user.id, book.id, p);
      const { kvSet, readingProgressKey } = await import('../storage/kv');
      await kvSet(readingProgressKey(book.id), p);
    } finally {
      savingRef.current = false;
    }
  }, [user, book.id]);

  const open = useCallback(async () => {
    setStage('loading');
    setError('');
    setLocked(false);
    try {
      const dl = user?.id ? await getDownload(user.id, book.id).catch(() => null) : null;
      if (dl) {
        const check = await verifyLocalFile(user.id, book.id);
        if (check.ok) {
          setLocalUri(check.row.file_uri);
          setPage(check.row.last_read_page || 1);
          setStage('open');
          return;
        }
      }
      if (TEXT_EXTS.has(ext)) {
        const res = await getBookHtml(book.id);
        setHtml(res.html || '');
        setStage('open');
        return;
      }
      // PDF: selalu tulis ke berkas dulu lalu buka dari URI (§8.1)
      const pdfUrl = `${API_BASE_URL}/books/${encodeURIComponent(book.id)}/content`;
      setStage('downloading');
      const result = await downloadBookToDevice({
        userId: user?.id || 'guest',
        book: { ...book, __apiBase: API_BASE_URL },
        ext: ext || 'pdf',
        onProgress: setProgressPct,
      });
      void pdfUrl;
      setLocalUri(result.localUri);
      setStage('open');
    } catch (e) {
      if (e?.status === 403) {
        setLocked(true);
        setStage('locked');
        return;
      }
      setError(readableError(e));
      setStage('error');
    }
  }, [book, user, ext]);

  useEffect(() => { open(); }, [open]);

  // Tombol back fisik: simpan → lepas flag (cleanup hook) → pop (§19)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      savePage(page).finally(() => navigation.goBack());
      return true;
    });
    return () => sub.remove();
  }, [navigation, page, savePage]);

  useEffect(() => () => { void savePage(page); }, [savePage, page]);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Text onPress={() => savePage(page).finally(() => navigation.goBack())} accessibilityRole="button" accessibilityLabel="Kembali" style={styles.back}>‹ Kembali</Text>
      <Text style={styles.title} numberOfLines={1}>{book.title}</Text>
      <View style={{ width: 72 }} />
    </View>
  );

  if (stage === 'locked') {
    return (
      <View style={styles.center}>
        {header}
        <Text style={styles.lockTitle}>Buku ini khusus pembaca Pro</Text>
        <Text style={styles.lockSub}>Pembayaran dilakukan lewat browser.</Text>
        <Text
          onPress={() => Linking.openURL(`${API_BASE_URL.replace('/api', '')}/`)}
          accessibilityRole="link"
          style={styles.buyBtn}
        >Buka browser untuk beli Pro</Text>
        <Text onPress={() => navigation.goBack()} style={styles.link}>Kembali</Text>
      </View>
    );
  }

  if (stage === 'loading' || stage === 'downloading') {
    return (
      <View style={styles.center}>
        {header}
        <ActivityIndicator size="large" color={colors.brand[700]} />
        <Text style={styles.status}>
          {stage === 'downloading'
            ? `Mengunduh… ${Math.round(progressPct * 100)}%`
            : 'Memuat…'}
        </Text>
        <Text style={styles.hint}>Screenshot & rekaman layar dinonaktifkan selama membaca.</Text>
      </View>
    );
  }

  if (stage === 'error') {
    return (
      <View style={styles.center}>
        {header}
        <Text style={styles.err}>{error}</Text>
        <Text onPress={open} accessibilityRole="button" style={styles.link}>Coba lagi</Text>
        <Text onPress={() => navigation.goBack()} style={styles.link}>Kembali</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {header}
      {PDF_EXTS.has(ext) || localUri ? (
        <PdfViewer source={localUri} initialPage={page} onPageChanged={(p) => { setPage(p); }} />
      ) : (
        <ScrollView style={styles.flex} contentContainerStyle={styles.pad}>
          <HtmlViewer html={html} />
        </ScrollView>
      )}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Text style={styles.footerText}>Halaman {page || 1} · Screenshot diblokir</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ui.bg },
  center: { flex: 1, backgroundColor: colors.ui.bg, padding: spacing.md, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.ui.border,
  },
  back: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.body, color: colors.brand[700], width: 72 },
  title: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.body, color: colors.ui.textPrimary, flex: 1, textAlign: 'center' },
  status: { fontFamily: fonts.sans, fontSize: type.small, color: colors.ui.textSecondary },
  hint: { fontFamily: fonts.sans, fontSize: type.caption, color: colors.ui.textMuted, textAlign: 'center' },
  err: { fontFamily: fonts.sans, fontSize: type.small, color: colors.semantic.danger, textAlign: 'center' },
  lockTitle: { fontFamily: fonts.display, fontSize: 22, fontWeight: '700', color: colors.brand[800] },
  lockSub: { fontFamily: fonts.sans, fontSize: type.small, color: colors.ui.textSecondary },
  buyBtn: {
    fontFamily: fonts.sans, fontWeight: '700', fontSize: type.body, color: '#FFF',
    backgroundColor: colors.brand[700], paddingVertical: 12, paddingHorizontal: 18, borderRadius: radius.button,
  },
  link: { fontFamily: fonts.sans, fontWeight: '700', fontSize: type.small, color: colors.brand[700], marginTop: 12 },
  pad: { padding: spacing.md, paddingBottom: 24 },
  footer: { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.ui.border, alignItems: 'center' },
  footerText: { fontFamily: fonts.sans, fontSize: type.caption, color: colors.ui.textMuted },
});
