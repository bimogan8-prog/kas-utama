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
  nama_user: string;
  kategori: string;
  nominal: number;
  keterangan: string;
  timestamp: number;
  type: TransactionType;
  notaUrl?: string; // Menambahkan field untuk URL foto nota
  isSynced?: boolean; 
}

export type Expense = Transaction;

export interface Stats {
  daily: number;
  monthly: number;
  yearly: number;
}