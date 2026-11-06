import React from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { clearSession } from '@lib/api';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Wahidiyah ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    try {
      clearSession();
    } catch {}
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-cream-50 rounded-3xl border border-semantic-danger/25 shadow-2xl p-7 text-center">
            <div className="w-14 h-14 rounded-2xl bg-semantic-dangerLight text-semantic-danger flex items-center justify-center mx-auto mb-4 border border-semantic-danger/30 shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-ink-900 mb-2">Terjadi Kendala Memuat Layar</h2>
            <p className="text-sm text-ink-400 mb-5 leading-relaxed">
              Komponen aplikasi mengalami kendala saat memuat data. Silakan muat ulang atau masuk
              kembali ke akun Anda.
            </p>
            {this.state.error && (
              <div className="bg-cream-100 border border-cream-300 rounded-2xl p-3.5 text-left text-xs font-mono text-ink-700 overflow-x-auto mb-6 max-h-36">
                {String(this.state.error.message || this.state.error)}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cream-200 hover:bg-cream-300 text-ink-700 font-bold text-xs transition"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-700 text-cream-50 font-bold text-xs transition shadow-md shadow-brand-700/20"
              >
                <LogIn className="w-4 h-4" />
                Ke Halaman Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
