import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router';
import { AppProvider, useApp } from '@context/AppContext';
import { OverviewTab } from './features/admin/OverviewTab';
import { BooksTab } from './features/admin/BooksTab';
import { UsersTab } from './features/admin/UsersTab';
import { EventsTab } from './features/admin/EventsTab';
import { CarouselTab } from './features/admin/CarouselTab';
import { LogsTab } from './features/admin/LogsTab';
import { BookModal } from './features/admin/BookModal';
import { useAdminDashboardData } from './features/admin/hooks/useAdminDashboardData';
import { useAdminEventEditor } from './features/admin/hooks/useAdminEventEditor';
import { useAdminBookEditor } from './features/admin/hooks/useAdminBookEditor';
import { apiJsonSend } from '@lib/api';
import { withToast, withToastSync } from '@lib/withToast';
import { Toaster } from 'sonner';
import { AdminLogin } from './features/admin/AdminLogin';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CalendarDays,
  GalleryHorizontalEnd,
  Activity,
  LogOut,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'books', label: 'Manajemen Buku', icon: BookOpen },
  { id: 'users', label: 'Manajemen Pengguna', icon: Users },
  { id: 'events', label: 'Agenda & Kegiatan', icon: CalendarDays },
  { id: 'carousel', label: 'Banner Carousel', icon: GalleryHorizontalEnd },
  { id: 'logs', label: 'Log & Transaksi', icon: Activity },
];

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    user,
    sessionToken,
    books,
    refreshBooks,
    refreshEvents,
    updateUserRole,
    carouselSlides,
    refreshCarousel,
    logout,
  } = useApp();

  const {
    stats,
    loadingDashboard,
    users,
    transactions,
    events,
    error,
    carouselReady,
    headers,
    loadDashboard,
  } = useAdminDashboardData({ sessionToken, refreshBooks, refreshEvents, refreshCarousel });

  const eventEditor = useAdminEventEditor({ headers, loadDashboard });
  const bookEditor = useAdminBookEditor({ headers, loadDashboard });

  const updateUser = (id, body, successMessage) =>
    withToast(
      async () => {
        await apiJsonSend(
          `/api/users/${encodeURIComponent(id)}${body.role ? '/role' : '/pro'}`,
          body,
          { method: 'PUT', headers },
        );

        if (body.role) {
          const isSelfRoleChange = user?.id === id;
          updateUserRole(id, body.role);
          if (!isSelfRoleChange) await loadDashboard();
          return;
        }

        await loadDashboard();
      },
      'Data pengguna belum dapat diperbarui.',
      successMessage,
    );

  const handleExportFull = () =>
    withToastSync(
      () =>
        import('@lib/excelExport').then((m) =>
          m.exportFullReportToExcel({ users, transactions, books, events, stats }),
        ),
      'Gagal mengekspor laporan.',
      (res) => `Laporan lengkap berhasil diunduh (${res.fileName})`,
    );

  return (
    <div className="min-h-screen bg-cream-50 text-ink-900 flex font-sans">
      {/* Sidebar Kiri */}
      <aside className="w-64 bg-brand-900 text-cream-50 flex flex-col justify-between shrink-0 shadow-lg">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-8 border-b border-brand-800 pb-4">
            <span className="font-serif text-lg font-bold text-cream-50 tracking-wide">
              Wahidiyah Book
            </span>
            <span className="text-[10px] bg-gold-500 text-ink-900 font-bold px-2 py-0.5 rounded shadow-sm">
              ADMIN
            </span>
          </div>

          <nav className="space-y-1.5 text-sm">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-brand-800 text-white shadow-inner font-bold border-l-4 border-gold-400'
                      : 'text-cream-200 hover:bg-brand-800/60 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-gold-400' : 'text-cream-300'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-brand-800/80 bg-brand-950/40">
          <div className="flex items-center justify-between text-xs text-cream-300">
            <span>Perpustakaan Digital</span>
            <button
              type="button"
              onClick={handleExportFull}
              className="text-gold-400 hover:text-gold-300 flex items-center gap-1 font-bold cursor-pointer"
              title="Ekspor Seluruh Data ke Excel"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Unduh Data
            </button>
          </div>
        </div>
      </aside>

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Atas */}
        <header className="h-16 bg-white border-b border-cream-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-serif font-bold text-brand-900 capitalize">
              {ADMIN_NAV_ITEMS.find((i) => i.id === activeTab)?.label || 'Panel Administrasi'}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-600">
                {user?.name || user?.email || 'Administrator'}
              </span>
              <div className="w-8 h-8 rounded-full bg-brand-700 text-cream-50 flex items-center justify-center font-bold text-xs shadow-sm">
                {(user?.name || 'A').slice(0, 2).toUpperCase()}
              </div>
            </div>
            {logout && (
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-ink-400 hover:text-semantic-danger hover:bg-cream-100 transition cursor-pointer"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        {/* Tab Body */}
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto min-w-0">
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex justify-between items-center">
              <span>{error}</span>
              <button
                type="button"
                onClick={loadDashboard}
                className="px-3 py-1 bg-white border border-red-300 rounded font-bold text-xs"
              >
                Muat Ulang
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              books={books}
              users={users}
              transactions={transactions}
              onExportFull={handleExportFull}
            />
          )}

          {activeTab === 'books' && (
            <BooksTab
              books={books}
              onAddBook={bookEditor.openBookModal}
              onEditBook={bookEditor.startEditBook}
              onDeleteBook={bookEditor.deleteBook}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              users={users}
              onUpdateRole={(id, nextRole) =>
                updateUser(id, { role: nextRole }, 'Role pengguna berhasil diperbarui.')
              }
            />
          )}

          {activeTab === 'events' && (
            <EventsTab
              events={events}
              eventForm={eventEditor.eventForm}
              setEventForm={eventEditor.setEventForm}
              isSavingEvent={eventEditor.isSavingEvent}
              submitEvent={eventEditor.submitEvent}
              deleteEvent={eventEditor.deleteEvent}
              currentCalDate={eventEditor.currentCalDate}
              setCurrentCalDate={eventEditor.setCurrentCalDate}
              selectedCalDate={eventEditor.selectedCalDate}
              setSelectedCalDate={eventEditor.setSelectedCalDate}
              agendaFilter={eventEditor.agendaFilter}
              setAgendaFilter={eventEditor.setAgendaFilter}
              editingEventId={eventEditor.editingEventId}
              editEvent={eventEditor.editEvent}
              cancelEditEvent={eventEditor.cancelEditEvent}
              toggleEventCarousel={eventEditor.toggleEventCarousel}
            />
          )}

          {activeTab === 'carousel' && (
            <CarouselTab
              slides={carouselSlides}
              carouselReady={carouselReady}
              refreshCarousel={refreshCarousel}
              sessionToken={sessionToken}
            />
          )}

          {activeTab === 'logs' && <LogsTab sessionToken={sessionToken} />}
        </main>
      </div>

      {/* Modal Tambah / Edit Buku */}
      {bookEditor.isBookModalOpen && (
        <BookModal
          isOpen={bookEditor.isBookModalOpen}
          editingBookId={bookEditor.editingBookId}
          onClose={bookEditor.closeBookModal}
          bookForm={bookEditor.bookForm}
          setBookForm={bookEditor.setBookForm}
          onSubmit={bookEditor.submitBook}
          isSavingBook={bookEditor.isSavingBook}
        />
      )}
    </div>
  );
}

function AdminRoot() {
  const { authReady, isLoggedIn, user } = useApp();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-brand-950 flex flex-col items-center justify-center text-cream-100 gap-3 font-sans">
        <span className="w-8 h-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
        <p className="text-xs font-serif tracking-wider text-cream-300">
          Memeriksa Sesi Administrator...
        </p>
      </div>
    );
  }

  if (!isLoggedIn || user?.role !== 'admin') {
    return <AdminLogin />;
  }

  return <AdminDashboardContent />;
}

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" richColors />
      <AdminRoot />
    </AppProvider>
  );
}
