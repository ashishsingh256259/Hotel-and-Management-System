import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, AlertTriangle, Search, PlusCircle, MinusCircle, Edit, Trash2, Mail, Phone, ShoppingCart, Loader2, Save, X } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryViewProps {
  currentUser: any;
  triggerToast: (message: string, type?: 'success' | 'error') => void;
}

export default function InventoryView({ currentUser, triggerToast }: InventoryViewProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Add Item State
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Kitchen Stock');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('KG');
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Item State
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/inventory');
      setInventory(res.data);
    } catch (err) {
      triggerToast('Failed to pull restaurant ingredient inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !supplierName || !supplierPhone) {
      triggerToast('Missing required fields for inventory addition!', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/inventory', {
        itemName,
        category,
        quantity: Number(quantity),
        unit,
        lowStockThreshold: Number(lowStockThreshold),
        supplierName,
        supplierPhone,
        supplierEmail: supplierEmail || undefined
      });

      triggerToast(`Successfully added "${itemName}" to stock files.`, 'success');
      setInventory(prev => [res.data, ...prev]);

      // Reset Form fields
      setItemName('');
      setQuantity(0);
      setSupplierName('');
      setSupplierPhone('');
      setSupplierEmail('');
    } catch (err) {
      triggerToast('Failed to record new inventory item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSubmitting(true);
      const res = await axios.put(`/api/inventory/${editingItem.id}`, editingItem);
      triggerToast(`Inventory item updated successfully.`, 'success');
      setInventory(prev => prev.map(item => item.id === editingItem.id ? res.data : item));
      setEditingItem(null);
    } catch (err) {
      triggerToast('Failed to modify item properties', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to completely erase "${name}" from inventory?`)) return;

    try {
      await axios.delete(`/api/inventory/${id}`);
      triggerToast(`Removed "${name}" from active catalog records`, 'success');
      setInventory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      triggerToast('Failed to delete target inventory stock', 'error');
    }
  };

  const handleAdjustQuantity = async (id: string, delta: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + delta);
    try {
      const res = await axios.put(`/api/inventory/${id}`, { quantity: newQuantity });
      setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: newQuantity } : i));
      if (newQuantity <= res.data.lowStockThreshold) {
        triggerToast(`Warning: "${item.itemName}" stock level is critically low!`, 'error');
      }
    } catch (err) {
      triggerToast('Failed to save quantitative adjustment', 'error');
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    if (categoryFilter === 'All') return matchesSearch;
    return matchesSearch && item.category === categoryFilter;
  });

  // Calculate high-level stats
  const totalItems = inventory.length;
  const criticalItems = inventory.filter(i => i.quantity <= i.lowStockThreshold).length;
  const categoriesList = ['All', 'Kitchen Stock', 'Beverages & Soft Drinks', 'Baking Ingredients', 'Tableware & Cleansers'];

  return (
    <div className="space-y-6 animate-fade-in" id="inventory-view">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-150 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Stock Items Count</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{totalItems} Unique SKUs</h4>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-150 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> Critical Warnings
            </p>
            <h4 className="text-2xl font-black text-rose-600 mt-1">{criticalItems} Restock Warnings</h4>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">Active Supplying Firms</p>
            <h4 className="text-2xl font-black text-white mt-1">
              {Array.from(new Set(inventory.map(i => i.supplierName))).length} Firms Verified
            </h4>
          </div>
          <div className="p-3 bg-slate-950 text-amber-500 rounded-lg">
            <Mail className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column Box: Add / Edit Form Sheet */}
        <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-xs lg:col-span-4 space-y-4">
          <div>
            <span className="text-[9px] font-black tracking-widest text-[#d97706] uppercase">Stock Control</span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
              {editingItem ? 'Edit Culinary SKU Entry' : 'Register Stock SKU Code'}
            </h3>
            <p className="text-xs text-slate-450">
              {editingItem ? 'Modify ingredient descriptors and critical supplier lines below.' : 'Add raw materials, baked goods or cleaning supplies to system records.'}
            </p>
          </div>

          <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Ingredient / Item Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Premium White Basmati Rice"
                value={editingItem ? editingItem.itemName : itemName}
                onChange={e => editingItem ? setEditingItem({ ...editingItem, itemName: e.target.value }) : setItemName(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#d97706] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Asset Category</label>
                <select
                  value={editingItem ? editingItem.category : category}
                  onChange={e => editingItem ? setEditingItem({ ...editingItem, category: e.target.value }) : setCategory(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 focus:border-[#d97706] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all text-slate-700"
                >
                  <option value="Kitchen Stock">Kitchen Stock</option>
                  <option value="Beverages & Soft Drinks">Beverages & Soft Drinks</option>
                  <option value="Baking Ingredients">Baking Ingredients</option>
                  <option value="Tableware & Cleansers">Tableware & Cleansers</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Standard Measure Unit</label>
                <select
                  value={editingItem ? editingItem.unit : unit}
                  onChange={e => editingItem ? setEditingItem({ ...editingItem, unit: e.target.value }) : setUnit(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 focus:border-[#d97706] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all text-slate-700"
                >
                  <option value="KG">Kilograms (KG)</option>
                  <option value="Litre">Litres (L)</option>
                  <option value="Box">Boxes (Box)</option>
                  <option value="Piece">Pieces (Pcs)</option>
                  <option value="Bag">Bags (Bag)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Default quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="250"
                  value={editingItem ? editingItem.quantity : quantity}
                  onChange={e => editingItem ? setEditingItem({ ...editingItem, quantity: Number(e.target.value) }) : setQuantity(Number(e.target.value))}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#d97706] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Low Warning Bound</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="25"
                  value={editingItem ? editingItem.lowStockThreshold : lowStockThreshold}
                  onChange={e => editingItem ? setEditingItem({ ...editingItem, lowStockThreshold: Number(e.target.value) }) : setLowStockThreshold(Number(e.target.value))}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#d97706] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400">Supplier Enterprise Files</p>
              
              <div>
                <label className="text-[8px] uppercase font-black text-slate-505 block mb-1">Company/Partner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delta Farms Inc."
                  value={editingItem ? editingItem.supplierName : supplierName}
                  onChange={e => editingItem ? setEditingItem({ ...editingItem, supplierName: e.target.value }) : setSupplierName(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#d97706] focus:bg-white rounded-lg p-2.5 outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] uppercase font-black text-slate-505 block mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 99990..."
                    value={editingItem ? editingItem.supplierPhone : supplierPhone}
                    onChange={e => editingItem ? setEditingItem({ ...editingItem, supplierPhone: e.target.value }) : setSupplierPhone(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#d97706] text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[8px] uppercase font-black text-slate-505 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="order@delta.com"
                    value={editingItem ? editingItem.supplierEmail : supplierEmail}
                    onChange={e => editingItem ? setEditingItem({ ...editingItem, supplierEmail: e.target.value }) : setSupplierEmail(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:border-[#d97706] text-slate-700 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#d97706] hover:bg-[#b45309] disabled:bg-slate-350 text-white font-bold text-xs py-3 px-4 rounded-lg flex-1 cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {editingItem ? <Save className="w-3.5 h-3.5" /> : null}
                {submitting ? 'Committing record...' : editingItem ? 'Save SKU Edits' : 'Register Stock SKU'}
              </button>

              {editingItem && (
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs p-3 rounded-lg cursor-pointer transition-colors"
                  title="Cancel EDIT"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column Box: Stock lists (Span 8) */}
        <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-xs lg:col-span-8 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Digital Stock Ledger Logs</h3>
              <p className="text-xs text-slate-450">Track current units, warning status indicators, and coordinate orders.</p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-[9px] uppercase font-black rounded-lg border transition-colors cursor-pointer ${
                    categoryFilter === cat 
                      ? 'bg-slate-905 text-slate-950 border-slate-900 font-black' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'All' ? 'View All' : cat.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search raw material name, supplier brand contact..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs font-semibold pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#d97706] rounded-lg outline-hidden focus:bg-white w-full transition-all"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 text-[#d97706] animate-spin" />
              <p className="text-xs font-bold font-mono">Loading stocks list files... </p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center p-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-505">Storage locker list empty</p>
              <p className="text-[10px] text-slate-400 mt-1">Culinary stock SKUs will record here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    <td className="py-2.5">Stock Desc</td>
                    <td className="py-2.5">Category</td>
                    <td className="py-2.5">Current Stock Level</td>
                    <td className="py-2.5">Supplying Partner Info</td>
                    <td className="py-2.5 text-right">Administrative Actions</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px]">
                  {filteredInventory.map((item) => {
                    const isLow = item.quantity <= item.lowStockThreshold;
                    const isCritAndEmpty = item.quantity === 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-55/20 transition-colors">
                        <td className="py-3">
                          <p className="font-extrabold text-slate-900">{item.itemName}</p>
                          <p className="text-[8px] text-slate-400 font-mono uppercase mt-0.5">ID: {item.id}</p>
                        </td>
                        <td className="py-3 font-semibold text-slate-505 text-[10px]">
                          {item.category}
                        </td>
                        <td className="py-3">
                          <div className="space-y-1">
                            <span className={`text-xs font-mono font-black ${
                              isCritAndEmpty ? 'text-red-650' : isLow ? 'text-amber-600' : 'text-slate-800'
                            }`}>
                              {item.quantity} {item.unit}
                            </span>
                            {isLow && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-50 text-rose-700 uppercase tracking-widest border border-rose-100 inline-block animate-pulse">
                                critical stock
                              </span>
                            )}
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${
                                isCritAndEmpty ? 'bg-red-500 w-1' : isLow ? 'bg-amber-500 w-1/4' : 'bg-emerald-500 w-3/4'
                              }`} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 space-y-0.5">
                          <p className="font-bold text-slate-705 text-[10.5px]">{item.supplierName}</p>
                          <div className="flex gap-2 text-[9px] text-slate-400 font-semibold font-mono">
                            <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5 shrink-0" /> {item.supplierPhone}</span>
                            {item.supplierEmail && <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5 shrink-0" /> email</span>}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Adjustment controls */}
                            <button
                              onClick={() => handleAdjustQuantity(item.id, -1)}
                              className="text-slate-550 hover:text-slate-900 transition-colors p-1 rounded hover:bg-slate-100 active:scale-90 cursor-pointer"
                              title="Decrement unit quantity"
                            >
                              <MinusCircle className="w-4 h-4 text-red-500" />
                            </button>
                            <button
                              onClick={() => handleAdjustQuantity(item.id, 1)}
                              className="text-slate-550 hover:text-slate-900 transition-colors p-1 rounded hover:bg-slate-100 active:scale-90 cursor-pointer"
                              title="Increment unit quantity"
                            >
                              <PlusCircle className="w-4 h-4 text-emerald-500" />
                            </button>

                            <span className="w-px h-4 bg-slate-200 mx-1" />

                            {/* Full edits */}
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                window.scrollTo({ top: 320, behavior: 'smooth' });
                              }}
                              className="bg-slate-100 hover:bg-slate-200 p-1.5 rounded text-slate-700 transition-colors cursor-pointer active:scale-95"
                              title="Edit SKU Detail properties"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.itemName)}
                              className="bg-rose-50 hover:bg-rose-100 p-1.5 rounded text-rose-600 transition-colors cursor-pointer active:scale-95"
                              title="Delete SKU permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
