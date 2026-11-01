import { Navigate, useParams } from 'react-router-dom';
import { useApp } from '@context/AppContext';
import { apiJson } from '@lib/api';

import { ADMIN_DEFAULT_TAB, ADMIN_TAB_SLUGS, tabIdFromPath } from '@lib/navigation';
import { withToast, withToastSync } from '@lib/withToast';
import { OverviewTab } from './OverviewTab';
import { BooksTab } from './BooksTab';
import { UsersTab } from './UsersTab';
import { EventsTab } from './EventsTab';
import { CarouselTab } from './CarouselTab';
import { LogsTab } from './LogsTab';
import { BookModal } from './BookModal';
import { AdminSkeleton } from '@ui/Skeleton';
import { useAdminDashboardData } from './hooks/useAdminDashboardData';
import { useAdminEventEditor } from './hooks/useAdminEventEditor';
import { useAdminBookEditor } from './hooks/useAdminBookEditor';

const isValidTabSlug = (slug) => slug === undefined || ADMIN_TAB_SLUGS.has(slug);

export const AdminDashboard = () => {
  const {
    user,
    sessionToken,
    books,
    refreshBooks,
    refreshEvents,
    updateUserRole,
    carouselSlides,
    refreshCarousel,
  } = useApp();

  const { tab: tabParam } = useParams();

  const activeTab =
    tabParam === undefined ? ADMIN_DEFAULT_TAB : tabIdFromPath(`/admin/${tabParam}`);

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
        await apiJson(`/api/users/${encodeURIComponent(id)}${body.role ? '/role' : '/pro'}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

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

  if (!isValidTabSlug(tabParam)) {
    return <Navigate to="/admin/beranda" replace />;
  }

  if (loadingDashboard && !stats) {
    return (
      <div className="min-h-screen bg-cream-50 text-ink-900">
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          <AdminSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 text-ink-900">
      <main
        aria-label="Panel Administrasi Wahidiyah Book"
        className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0"
      >
        {error && (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-semantic-danger/30 bg-semantic-dangerLight px-4 py-3 text-body font-medium text-semantic-danger"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={loadDashboard}
              aria-label="Muat ulang data dashboard"
              className="min-h-6 rounded-xl border border-semantic-danger/40 bg-cream-50 px-3 py-1.5 text-small font-bold text-semantic-danger transition hover:bg-semantic-dangerLight"
            >
              Coba muat ulang
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
              updateUser(id, { role: nextRole }, 'Role pengguna diperbarui.')
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
};
