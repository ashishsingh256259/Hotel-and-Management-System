import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Mail, Phone, MapPin, X, ShieldAlert } from 'lucide-react';
import { Customer } from '../types';

interface CustomersViewProps {
  customers: Customer[];
  isAdmin: boolean;
  onAddCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  onEditCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  initialSearch?: string;
  onClearSearch?: () => void;
}

export default function CustomersView({ 
  customers, 
  isAdmin, 
  onAddCustomer, 
  onEditCustomer, 
  onDeleteCustomer,
  initialSearch = '',
  onClearSearch
}: CustomersViewProps) {
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form bounds
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setUsername('');
    setPassword('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email);
    setAddress(c.address);
    setUsername(''); // Not editable here
    setPassword('');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError('Name, Phone and Email are mandatory fields');
      return;
    }

    try {
      if (editingCustomer) {
        await onEditCustomer(editingCustomer.id, { name, phone, email, address });
      } else {
        await onAddCustomer({ name, phone, email, address });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save customer');
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" id="customers-view-container">
      {/* Top Banner & Search */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="customers-controls">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!e.target.value && onClearSearch) {
                onClearSearch();
              }
            }}
            className="pl-9 pr-10 py-2 w-full border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                if (onClearSearch) onClearSearch();
              }}
              className="absolute right-3 top-2.5 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Guest
          </button>
        )}
      </div>

      {/* Grid of customer details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" id="customers-list-grid">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100 text-slate-400">
            No guest records match your search.
          </div>
        ) : (
          filtered.map((c) => (
            <div 
              key={c.id} 
              className="bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 font-bold text-lg flex items-center justify-center">
                    {c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{c.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">ID: {c.id}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-50 pt-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{c.phone}</span>
                  </div>
                  {c.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-xs">{c.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end gap-3">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1 px-3 text-xs font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md inline-flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if(confirm(`Are you sure you want to delete guest "${c.name}"? This cascades to related logins and files.`)) {
                        onDeleteCustomer(c.id);
                      }
                    }}
                    className="p-1 px-3 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md inline-flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Customer Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCustomer ? 'Update Guest Profile' : 'Register New Guest'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scarlett Peterson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="guest@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Home/Company Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street name, City, ZIP State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Login Credentials section (only when ADDING customer) */}
              {!editingCustomer && (
                <div className="bg-slate-50/50 p-4 rounded-lg space-y-3 border border-slate-100">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Optional Portal Login Account
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium mb-1">Username (Default: email split)</span>
                      <input
                        type="text"
                        placeholder="john_88"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium mb-1">Password (Default: customer123)</span>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-md text-xs focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-1.5 px-4 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
