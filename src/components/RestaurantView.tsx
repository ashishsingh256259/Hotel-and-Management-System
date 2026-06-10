import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, ShieldAlert, X, Sparkles, ShoppingBag } from 'lucide-react';
import { FoodItem, FoodCategory } from '../types';

interface RestaurantViewProps {
  foodItems: FoodItem[];
  isAdmin: boolean;
  onAddFood: (food: Omit<FoodItem, 'id'>) => Promise<void>;
  onEditFood: (id: string, food: Partial<FoodItem>) => Promise<void>;
  onDeleteFood: (id: string) => Promise<void>;
}

export default function RestaurantView({ foodItems, isAdmin, onAddFood, onEditFood, onDeleteFood }: RestaurantViewProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);

  // Form bounds
  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Main Course');
  const [price, setPrice] = useState(15);
  const [availability, setAvailability] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  const openAddModal = () => {
    setEditingFood(null);
    setFoodName('');
    setCategory('Main Course');
    setPrice(15);
    setAvailability(true);
    setImageUrl('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (f: FoodItem) => {
    setEditingFood(f);
    setFoodName(f.foodName);
    setCategory(f.category);
    setPrice(f.price);
    setAvailability(f.availability);
    setImageUrl(f.imageUrl || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!foodName.trim() || price === undefined) {
      setError('Food item name and price are mandatory');
      return;
    }

    try {
      if (editingFood) {
        await onEditFood(editingRoomId(), {
          foodName,
          category,
          price: Number(price),
          availability,
          imageUrl: imageUrl.trim() || undefined
        });
      } else {
        await onAddFood({
          foodName,
          category,
          price: Number(price),
          availability,
          imageUrl: imageUrl.trim() || undefined
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save menu card item');
    }
  };

  const editingRoomId = () => editingFood ? editingFood.id : '';

  const filtered = foodItems.filter(item => {
    const matchesSearch = item.foodName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory ? item.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (cat: FoodCategory) => {
    switch (cat) {
      case 'Starter': return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'Main Course': return 'text-violet-700 bg-violet-50 border-violet-100';
      case 'Dessert': return 'text-pink-700 bg-pink-50 border-pink-100';
      case 'Beverage': return 'text-blue-700 bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="space-y-6" id="restaurant-view-container">
      {/* Banner Controllers */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="restaurant-controls">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search dishes or desserts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 w-full appearance-none border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Categories</option>
              <option value="Starter">Starter</option>
              <option value="Main Course">Main Course</option>
              <option value="Dessert">Dessert</option>
              <option value="Beverage">Beverage</option>
            </select>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Food Item
          </button>
        )}
      </div>

      {/* Grid of Menus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="restaurant-menu-grid">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100 text-slate-400">
            No dishes represent current search criteria.
          </div>
        ) : (
          filtered.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Highlight ribbon */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-violet-500 z-10" />

              {/* Culinary Dish Picture */}
              {item.imageUrl ? (
                <div className="w-full h-44 overflow-hidden relative bg-slate-100">
                  <img 
                    src={item.imageUrl} 
                    alt={item.foodName} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-xs text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-mono font-bold">
                    {item.category}
                  </div>
                </div>
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-amber-500/5 to-amber-600/10 flex items-center justify-center relative">
                  <span className="text-4xl text-amber-600/30 font-black uppercase select-none">{item.foodName[0]}</span>
                  <div className="absolute bottom-2 right-2 bg-slate-950/60 backdrop-blur-xs text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-mono font-bold">
                    {item.category}
                  </div>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-slate-800 text-base leading-snug line-clamp-2" title={item.foodName}>
                      {item.foodName}
                    </h3>
                    <span className={`inline-flex items-center shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.availability ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {item.availability ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline border-t border-slate-100 pt-3">
                  <span className="text-slate-400 text-xs font-semibold">Item Pricing</span>
                  <span className="text-xl font-black text-amber-600">₹{item.price.toFixed(2)}</span>
                </div>

                {isAdmin && (
                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                    <button
                      onClick={() => openEditModal(item)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer border border-transparent hover:border-amber-200"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if(confirm(`Are you sure you want to delete "${item.foodName}"?`)) {
                          onDeleteFood(item.id);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer border border-transparent hover:border-rose-200"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Food Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingFood ? `Modify "${editingFood.foodName}"` : 'Add Culinary Recipe'}
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
                  Food Item Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sizzling Ribeye Steak"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Food Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FoodCategory)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Beverage">Beverage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Kitchen Availability *
                  </label>
                  <select
                    value={availability ? 'true' : 'false'}
                    onChange={(e) => setAvailability(e.target.value === 'true')}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="true">In Stock (Available)</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  step={0.01}
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dish Image URL (Optional)
                  </label>
                  <span className="text-[10px] text-slate-450 font-medium">Or select a preset below</span>
                </div>
                <input
                  type="url"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />

                {/* Preset clickable chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: '🥘 Kebab', url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80' },
                    { label: '🍔 Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
                    { label: '🍝 Pasta', url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=800&q=80' },
                    { label: '🍰 Cake', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80' },
                    { label: '🍹 Mojito', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
                    { label: '🥩 Steak', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(p.url)}
                      className="px-2 py-1 text-[10px] font-bold text-slate-650 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-1.5 px-4 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors animate-pulse"
                >
                  Publish Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
