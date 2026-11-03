/**
 * Komponen Layar Masuk (Login Screen).
 * Menggunakan antarmuka autentikasi terpadu AuthScreen dengan tab aktif 'login'.
 *
 * @module src/features/auth/LoginScreen
 */

import { AuthScreen } from './AuthScreen';

/**
 * @param {object} props
 * @returns {import('react').JSX.Element}
 */
export const LoginScreen = (props) => <AuthScreen initialTab="login" {...props} />;
