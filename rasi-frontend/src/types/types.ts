export type UserRole = 'worker' | 'admin';
export type TransactionType = 'expense' | 'income';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface Transaction {
  id: string;
  uid: string;
  nama_user: string; // Mapping dari kolom 'name' di DB
  kategori: string;
  nominal: number;
  keterangan: string;
  timestamp: number; // Disimpan sebagai milliseconds untuk Frontend
  type: TransactionType;
  notaUrl?: string; 
  isSynced?: boolean; 
}

export type Expense = Transaction;

export interface Stats {
  daily: number;
  monthly: number;
  yearly: number;
}