/**
 * Layar Pengaturan Profil Akun dan Preferensi Pengguna.
 * Mengoordinasikan pembaharuan nama akun, penautan status WhatsApp,
 * riwayat langganan, pusat bantuan, dan keluar sesi.
 *
 * @module src/features/profile/EditProfileScreen
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useApp } from '@context/AppContext';
import { apiJsonSend, authHeaders } from '@lib/api';
import { LogoutConfirmDialog } from '../../components/layout/LogoutConfirmDialog';
import { ProfileAccountForm } from './ProfileAccountForm';
import { ProfileSubscriptionCard } from './ProfileSubscriptionCard';
import { ProfileNavigationLinks } from './ProfileNavigationLinks';
import { ProfileSessionSettings } from './ProfileSessionSettings';

/**
 * Komponen utama layar edit profil pengguna.
 *
 * @returns {import('react').JSX.Element}
 */
export const EditProfileScreen = () => {
  const { user, patchUser, sessionToken, navigateTo, logout } = useApp();

  const [name, setName] = useState(user.name || '');
  const [email] = useState(user.email || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const timeoutRef = useRef(null);

  const isNameChanged = name.trim() !== (user.name || '').trim();

  useEffect(() => {
    if (user.name) setName(user.name);
  }, [user.name]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama lengkap tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const payload = await apiJsonSend(
        '/api/users/profile',
        { name: name.trim() },
        { method: 'PUT', headers: authHeaders(sessionToken) },
      );

      if (payload.user) {
        patchUser(payload.user);
      } else {
        patchUser({ name: name.trim() });
      }

      setSavedSuccess(true);
      toast.success('Profil berhasil diperbarui!');
      timeoutRef.current = setTimeout(() => {
        setSavedSuccess(false);
      }, 2000);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyimpan perubahan profil ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmLogout = useCallback(() => {
    setLogoutModalOpen(false);
    logout();
  }, [logout]);

  return (
    <div className="min-h-[640px] flex flex-col px-4 sm:px-6 py-6 sm:py-8 bg-cream-50 pb-24 md:pb-12">
      <div className="mx-auto w-full max-w-content-narrow space-y-6">
        <ProfileAccountForm
          name={name}
          setName={setName}
          email={email}
          phone={user.phone}
          isSubmitting={isSubmitting}
          isNameChanged={isNameChanged}
          errorMessage={errorMessage}
          savedSuccess={savedSuccess}
          onSubmit={handleSave}
        />

        <ProfileSubscriptionCard onNavigate={navigateTo} />

        <ProfileNavigationLinks onNavigate={navigateTo} />

        <ProfileSessionSettings onRequestLogout={() => setLogoutModalOpen(true)} />
      </div>

      <LogoutConfirmDialog
        isOpen={logoutModalOpen}
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
};
