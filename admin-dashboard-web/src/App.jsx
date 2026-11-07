import React, { useState } from 'react';
import { AppProvider, useApp } from '@context/AppContext';
import { OverviewTab } from './features/admin/OverviewTab';
import { BooksTab } from './features/admin/BooksTab';
import { UsersTab } from './features/admin/UsersTab';
import { EventsTab } from './features/admin/EventsTab';
import { LogsTab } from './features/admin/LogsTab';
import { BookModal } from './features/admin/BookModal';
import { AdminSidebar } from './features/admin/components/AdminSidebar';
import { AdminHeader } from './features/admin/components/AdminHeader';
import { useAdminDashboardData } from './features/admin/hooks/useAdminDashboardData';
import { useAdminEventEditor } from './features/admin/hooks/useAdminEventEditor';
import { useAdminBookEditor } from './features/admin/hooks/useAdminBookEditor';
import { withToast, withToastSync } from '@lib/withToast';
import { Toaster } from 'sonner';
import { AdminLogin } from './features/admin/AdminLogin';
import { LayoutDashboard, BookOpen, Users, CalendarDays, Activity } from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'books', label: 'Manajemen Buku', icon: BookOpen },
  { id: 'users', label: 'Manajemen Pengguna', icon: Users },
  { id: 'events', label: 'Agenda & Kegiatan', icon: CalendarDays },
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
    refreshCarousel,
    logout,
  } = useApp();

  const { stats, users, transactions, events, error, headers, loadDashboard } =
    useAdminDashboardData({ sessionToken, refreshBooks, refreshEvents, refreshCarousel });

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
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          title={activeLabel}
          user={user}
          onLogout={logout}
          onOpenMenu={() => setMobileNavOpen(true)}
        />

        <main className="relative flex-1 overflow-y-auto bg-cream-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {error && (
              <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-semantic-danger/30 bg-semantic-dangerLight px-4 py-3 text-sm text-semantic-danger">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={loadDashboard}
                  className="shrink-0 rounded-lg border border-semantic-danger/30 bg-ui-card px-3 py-1.5 text-xs font-semibold transition hover:bg-cream-100 cursor-pointer"
                >
                  Muat ulang
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

            {activeTab === 'logs' && <LogsTab sessionToken={sessionToken} />}
          </div>
        </main>
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-50 font-sans">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-cream-300 border-t-brand-700" />
        <p className="text-sm text-ink-500">Memeriksa sesi…</p>
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
