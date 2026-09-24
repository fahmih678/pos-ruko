'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/ClientShell';
import {
  Settings,
  Store,
  QrCode,
  Users,
  KeyRound,
  Save,
  Plus,
  CheckCircle2,
  AlertCircle,
  Shield,
  UserCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/format';

export default function SettingsPage() {
  const { user } = useApp();
  const [storeData, setStoreData] = useState({
    storeName: '',
    address: '',
    phone: '',
    receiptFooter: '',
    qrisText: '',
  });

  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // New Cashier Form Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
  });
  const [addingUser, setAddingUser] = useState(false);

  // Change Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.store) {
          setStoreData({
            storeName: data.store.storeName || '',
            address: data.store.address || '',
            phone: data.store.phone || '',
            receiptFooter: data.store.receiptFooter || '',
            qrisText: data.store.qrisText || '',
          });
        }
        if (data.users) {
          setUsersList(data.users);
        }
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      });

      if (!res.ok) throw new Error('Gagal menyimpan profil toko');

      setMessage({ type: 'success', text: 'Pengaturan profil toko berhasil diperbarui!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingStore(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUser(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat pengguna');

      setIsAddUserOpen(false);
      setNewUserData({ name: '', email: '', password: '', role: 'CASHIER' });
      setMessage({ type: 'success', text: `Akun kasir ${data.name} berhasil dibuat!` });
      fetchSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setAddingUser(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPass(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah password');

      setIsPasswordModalOpen(false);
      setNewPassword('');
      setMessage({ type: 'success', text: 'Password berhasil diperbarui!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setChangingPass(false);
    }
  };

  if (user?.role !== 'OWNER') {
    return (
      <div className="p-8 text-center text-slate-600">
        Halaman pengaturan hanya dapat diakses oleh Pemilik Toko.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-24 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Pengaturan Toko & Pengguna
        </h1>
        <p className="text-xs text-slate-500">
          Kelola profil ruko, format struk, dan akun kasir
        </p>
      </div>

      {message.text && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profil Toko Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Store className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-sm sm:text-base text-slate-900">
            Profil & Struk Ruko
          </h2>
        </div>

        <form onSubmit={handleSaveStore} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Toko / Ruko *
              </label>
              <input
                type="text"
                value={storeData.storeName}
                onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={storeData.phone}
                onChange={(e) => setStoreData({ ...storeData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Ruko
            </label>
            <textarea
              value={storeData.address}
              onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Kaki Struk (Footer)
            </label>
            <input
              type="text"
              value={storeData.receiptFooter}
              onChange={(e) => setStoreData({ ...storeData, receiptFooter: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingStore}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingStore ? 'Menyimpan...' : 'Simpan Profil Toko'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Manajemen Pengguna / Kasir Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-sm sm:text-base text-slate-900">
              Pengguna & Kasir
            </h2>
          </div>

          <button
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kasir</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {usersList.map((u) => (
            <div key={u.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">{u.name}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      u.role === 'OWNER'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {u.role === 'OWNER' ? 'Pemilik' : 'Kasir'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
              </div>

              <button
                onClick={() => {
                  setSelectedUserId(u.id);
                  setIsPasswordModalOpen(true);
                }}
                className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg flex items-center space-x-1 transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ganti Password</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Tambah Pengguna */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Tambah Akun Kasir Baru</h3>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kasir *
                </label>
                <input
                  type="text"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  required
                  placeholder="Misal: Rian Kasir"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email / Username *
                </label>
                <input
                  type="text"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  required
                  placeholder="rian@tokoruko.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  required
                  placeholder="Minimal 5 karakter"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
                >
                  {addingUser ? 'Menyimpan...' : 'Simpan Kasir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ganti Password */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Ganti Password Akun</h3>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Baru *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimal 5 karakter"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={changingPass}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
                >
                  {changingPass ? 'Menyimpan...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

