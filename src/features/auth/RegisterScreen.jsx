/**
 * Komponen Layar Pendaftaran (Register Screen).
 * Menggunakan antarmuka autentikasi terpadu AuthScreen dengan tab aktif 'register'.
 *
 * @module src/features/auth/RegisterScreen
 */

import { AuthScreen } from './AuthScreen';

/**
 * @param {object} props
 * @returns {import('react').JSX.Element}
 */
export const RegisterScreen = (props) => <AuthScreen initialTab="register" {...props} />;
