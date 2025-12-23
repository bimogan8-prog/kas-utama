export type TransactionType = 'income' | 'expense';

export interface User {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'worker';
}

export interface Transaction {
  id: string;
  uid: string;
  nama: string;
  kategori: string;
  nominal: number;
  keterangan: string;
  type: TransactionType;
  tanggal: string;
  timestamp: number;
  notaUrl?: string;
}
