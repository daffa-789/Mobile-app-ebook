import React, { useState } from 'react';
import { AppProvider, useApp } from '@context/AppContext';
import { OverviewTab } from './features/admin/OverviewTab';
import { BooksTab } from './features/admin/BooksTab';
import { UsersTab } from './features/admin/UsersTab';
import { EventsTab } from './features/admin/EventsTab';
import { CarouselTab } from './features/admin/CarouselTab';
import { LogsTab } from './features/admin/LogsTab';
import { BookModal } from './features/admin/BookModal';
import { AdminSidebar } from './features/admin/components/AdminSidebar';
import { AdminHeader } from './features/admin/components/AdminHeader';
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
  RefreshCw,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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

  const activeLabel = ADMIN_NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'Ringkasan';

  return (
    <div className="flex min-h-screen bg-cream-50 font-sans text-ink-900">
      <AdminSidebar
        items={ADMIN_NAV_ITEMS}
        activeTab={activeTab}
        onSelect={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onExportFull={handleExportFull}
        bookCount={books.length}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          title={activeLabel}
          user={user}
          onLogout={logout}
          onOpenMenu={() => setMobileNavOpen(true)}
          onRefresh={loadDashboard}
          isLoading={loadingDashboard}
          hasError={Boolean(error)}
        />

        <main className="relative flex-1 overflow-y-auto bg-cream-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {error && (
              <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-semantic-danger/30 bg-semantic-dangerLight px-4 py-3 text-sm text-semantic-danger">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={loadDashboard}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-semantic-danger/30 bg-ui-card px-3 py-1.5 text-xs font-bold transition hover:bg-cream-100 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Muat Ulang
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
          </div>
        </main>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-cream-200 bg-cream-50/80 px-4 py-3 text-[11px] text-ink-400 sm:px-6">
          <span>Wahidiyah Book • Panel Administrasi</span>
          <span className="hidden sm:inline">Perpustakaan Digital Wahidiyah</span>
        </footer>
      </div>

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-950/30 border-t-brand-950" />
        </div>
        <p className="font-serif text-sm tracking-wide text-cream-100">
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
