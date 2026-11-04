import { apiJson } from './client';

export const mySubscriptions = () => apiJson('/subscriptions/my', { method: 'GET' });
