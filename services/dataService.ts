
import { Transaction, User } from '../types';
import { dbStore, USERS_DB } from '../db';

export const dataService = {
  authenticate: (username: string, password: string): User | null => {
    const user = USERS_DB.find(u => u.username === username && u.password === (password as any));
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return null;
  },

  addTransaction: async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const transactions = await dbStore.get();
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: transaction.timestamp || Date.now(),
      isSynced: false
    };
    transactions.push(newTransaction);
    await dbStore.save(transactions);
    return newTransaction;
  },

  getTransactions: async (filters: { uid?: string; date?: string; month?: string; year?: string; all?: boolean }): Promise<Transaction[]> => {
    let transactions = await dbStore.get();
    
    if (filters.all) {
      if (filters.uid) {
        return transactions.filter(e => e.uid === filters.uid).sort((a, b) => b.timestamp - a.timestamp);
      }
      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    }

    if (filters.uid) {
      transactions = transactions.filter(e => e.uid === filters.uid);
    }
    
    if (filters.date) {
      transactions = transactions.filter(e => {
        const d = new Date(e.timestamp);
        const filterD = new Date(filters.date!);
        return d.getFullYear() === filterD.getFullYear() &&
               d.getMonth() === filterD.getMonth() &&
               d.getDate() === filterD.getDate();
      });
    }

    if (filters.month && filters.year) {
      transactions = transactions.filter(e => {
        const d = new Date(e.timestamp);
        return d.getFullYear() === parseInt(filters.year!) &&
               (d.getMonth() + 1) === parseInt(filters.month!);
      });
    } else if (filters.year) {
      transactions = transactions.filter(e => {
        const d = new Date(e.timestamp);
        return d.getFullYear() === parseInt(filters.year!);
      });
    }

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  },

  deleteExpense: async (id: string) => {
    const current = await dbStore.get();
    const updated = current.filter(e => e.id !== id);
    await dbStore.save(updated);
  },

  getMasterStats: async () => {
    const all = await dbStore.get();
    return {
      count: all.length,
      income: all.filter(t => t.type === 'income').reduce((s, t) => s + t.nominal, 0),
      expense: all.filter(t => t.type === 'expense').reduce((s, t) => s + t.nominal, 0)
    };
  }
};
