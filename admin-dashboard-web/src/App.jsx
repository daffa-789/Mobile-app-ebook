import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-cream-50 text-ink-800 flex font-sans">
      {/* Sidebar Shell */}
      <aside className="w-64 bg-brand-900 text-cream-50 flex flex-col justify-between shrink-0">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-8">
            <span className="font-serif text-lg font-bold text-cream-50">Wahidiyah Book</span>
            <span className="text-[10px] bg-gold-500 text-ink-900 font-bold px-1.5 py-0.5 rounded">
              ADMIN
            </span>
          </div>
          <nav className="space-y-1 text-sm">
            <a
              href="/admin/overview"
              className="block px-3 py-2 rounded bg-brand-800 text-white font-medium"
            >
              Overview
            </a>
            <a
              href="/admin/books"
              className="block px-3 py-2 rounded text-cream-200 hover:bg-brand-800 transition"
            >
              Manajemen Buku
            </a>
            <a
              href="/admin/users"
              className="block px-3 py-2 rounded text-cream-200 hover:bg-brand-800 transition"
            >
              Manajemen Pengguna
            </a>
            <a
              href="/admin/events"
              className="block px-3 py-2 rounded text-cream-200 hover:bg-brand-800 transition"
            >
              Agenda & Kegiatan
            </a>
            <a
              href="/admin/carousel"
              className="block px-3 py-2 rounded text-cream-200 hover:bg-brand-800 transition"
            >
              Banner Carousel
            </a>
            <a
              href="/admin/logs"
              className="block px-3 py-2 rounded text-cream-200 hover:bg-brand-800 transition"
            >
              Log & Transaksi
            </a>
          </nav>
        </div>
        <div className="p-4 border-t border-brand-800 text-xs text-cream-300">
          Panel Manajemen Admin
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-cream-200 flex items-center justify-between px-6">
          <h2 className="text-lg font-serif font-bold text-brand-900">Dashboard Overview</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-500">Administrator</span>
            <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-card border border-cream-200 shadow-sm">
              <span className="text-xs text-ink-500 uppercase font-semibold">Total Pengguna</span>
              <p className="text-2xl font-bold text-brand-900 mt-1">—</p>
            </div>
            <div className="bg-white p-4 rounded-card border border-cream-200 shadow-sm">
              <span className="text-xs text-ink-500 uppercase font-semibold">Pengguna Pro</span>
              <p className="text-2xl font-bold text-gold-600 mt-1">—</p>
            </div>
            <div className="bg-white p-4 rounded-card border border-cream-200 shadow-sm">
              <span className="text-xs text-ink-500 uppercase font-semibold">Total Buku</span>
              <p className="text-2xl font-bold text-brand-900 mt-1">—</p>
            </div>
            <div className="bg-white p-4 rounded-card border border-cream-200 shadow-sm">
              <span className="text-xs text-ink-500 uppercase font-semibold">Total Transaksi</span>
              <p className="text-2xl font-bold text-brand-900 mt-1">—</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-card border border-cream-200 shadow-sm text-center py-12 text-ink-500">
            <p className="text-base font-medium">Scaffolding Workspace Admin Dashboard Siap</p>
            <p className="text-sm mt-1 text-ink-400">
              Komponen fitur admin akan dimigrasikan pada Milestone 3.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
