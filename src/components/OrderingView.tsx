import React, { useState } from 'react';
import { ShoppingCart, ListCollapse, Play, X, ShieldAlert, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { FoodItem, FoodOrder, Customer, FoodOrderStatus } from '../types';

interface OrderingViewProps {
  foodItems: FoodItem[];
  foodOrders: FoodOrder[];
  customers: Customer[];
  isAdmin: boolean;
  currentUser: any;
  onPlaceOrder: (order: { customerId: string; items: { foodItemId: string; quantity: number }[] }) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: FoodOrderStatus) => Promise<void>;
}

export default function OrderingView({
  foodItems,
  foodOrders,
  customers,
  isAdmin,
  currentUser,
  onPlaceOrder,
  onUpdateOrderStatus
}: OrderingViewProps) {
  // Cart state
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [customerId, setCustomerId] = useState(currentUser.role === 'customer' ? currentUser.customerId || '' : '');
  const [activeTab, setActiveTab] = useState<'menu' | 'history'>('menu');
  const [cartOpen, setCartOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Client safety filter for customer-only orders
  const filteredFoodOrders = foodOrders.filter(o => {
    if (!isAdmin && o.customerId !== currentUser?.customerId) {
      return false;
    }
    return true;
  });

  const handleAddToCart = (id: string) => {
    setCart(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => {
      const copy = { ...prev };
      if (!copy[id]) return prev;
      copy[id] -= 1;
      if (copy[id] <= 0) {
        delete copy[id];
      }
      return copy;
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  // Calculations
  const cartItemsArray = Object.keys(cart).map(id => {
    const item = foodItems.find(f => f.id === id);
    return {
      item,
      quantity: cart[id]
    };
  }).filter(c => c.item !== undefined) as { item: FoodItem; quantity: number }[];

  const cartTotalAmount = cartItemsArray.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
  const cartItemsCount = cartItemsArray.reduce((sum, c) => sum + c.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const targetCustomerId = currentUser.role === 'customer' ? currentUser.customerId : customerId;
    if (!targetCustomerId) {
      setError('Please select a customer/guest profile for the order');
      return;
    }

    if (cartItemsArray.length === 0) {
      setError('Your shopping cart is empty');
      return;
    }

    const payloadItems = cartItemsArray.map(c => ({
      foodItemId: c.item.id,
      quantity: c.quantity
    }));

    try {
      await onPlaceOrder({
        customerId: targetCustomerId,
        items: payloadItems
      });
      setSuccess('Delicious meal order placed successfully!');
      setCart({});
      setCartOpen(false);
      setActiveTab('history');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to dispatch food order');
    }
  };

  const getOrderStatusBadge = (st: FoodOrderStatus) => {
    switch (st) {
      case 'Pending': return 'bg-amber-500/10 text-amber-900 border-amber-500/30';
      case 'Served': return 'bg-emerald-500/10 text-emerald-900 border-emerald-500/30';
      case 'Cancelled': return 'bg-slate-500/10 text-slate-800 border-slate-500/20';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6" id="ordering-view-container">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-100" id="ordering-tabs-header">
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-6 py-3 border-b-2 font-semibold text-sm transition-colors ${
            activeTab === 'menu' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Order Food & Drinks
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 border-b-2 font-semibold text-sm transition-colors flex items-center gap-1.5 ${
            activeTab === 'history' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Food Orders 
          <span className="w-5 h-5 rounded-full bg-slate-100 font-mono font-bold text-[10px] text-slate-600 flex items-center justify-center">
            {filteredFoodOrders.length}
          </span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {activeTab === 'menu' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="order-chef-board">
          {/* Menu Panel */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Culinary Chef Menu</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {foodItems.filter(f => f.availability).map(dish => (
                <div key={dish.id} className="bg-white rounded-xl border border-slate-100 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow overflow-hidden relative">
                  {/* Dish Image */}
                  {dish.imageUrl ? (
                    <div className="w-full h-36 overflow-hidden bg-slate-50 relative">
                      <img 
                        src={dish.imageUrl} 
                        alt={dish.foodName} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 left-2 bg-slate-900/60 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        {dish.category}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-amber-500/5 to-amber-600/10 flex items-center justify-center relative">
                      <span className="text-3xl text-amber-600/20 font-black uppercase">{dish.foodName[0]}</span>
                      <span className="absolute top-2 left-2 bg-slate-900/60 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        {dish.category}
                      </span>
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2 h-10" title={dish.foodName}>
                        {dish.foodName}
                      </h4>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-800">₹{dish.price.toFixed(2)}</span>
                      <button
                        onClick={() => handleAddToCart(dish.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        Add To Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Right Column */}
          <div className="lg:col-span-1 bg-white border border-slate-150 rounded-xl p-6 shadow-xs flex flex-col justify-between h-fit gap-4">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-amber-600" /> Active Tray
                </span>
                <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                  {cartItemsCount} Items
                </span>
              </div>

              {cartItemsArray.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Your kitchen tray is empty. Add delicacies from the left!
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto pr-1 my-3">
                  {cartItemsArray.map(({ item, quantity }) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs text-slate-700">
                      <div className="max-w-[130px] truncate">
                        <p className="font-semibold text-slate-800">{item.foodName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">₹{item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center font-mono"
                        >	-	</button>
                        <span className="font-bold">{quantity}</span>
                        <button 
                          type="button" 
                          onClick={() => handleAddToCart(item.id)}
                          className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center font-mono"
                        >	+	</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price block & Check out selector */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="flex justify-between font-extrabold text-slate-900 text-sm">
                <span>Tray Total:</span>
                <span className="text-amber-600">₹{cartTotalAmount.toFixed(2)}</span>
              </div>
              
              <button
                disabled={cartItemsArray.length === 0}
                onClick={() => setCartOpen(true)}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs"
              >
                Place Meal Order
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* History of Orders placed */
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden" id="order-history-board">
          <div className="overflow-x-auto">
            <table className="styled-table font-sans animate-fade-in">
              <thead className="text-[10px] text-amber-800 uppercase tracking-widest bg-amber-500/5 border-b border-amber-500/10">
                <tr>
                  <th scope="col" className="px-6 py-3.5 font-bold">Order ID</th>
                  <th scope="col" className="px-6 py-3.5 font-bold">Guest Name</th>
                  <th scope="col" className="px-6 py-3.5 font-bold">Ordered Items Menu</th>
                  <th scope="col" className="px-6 py-3.5 text-center font-bold font-mono">Items Count</th>
                  <th scope="col" className="px-6 py-3.5 text-right font-bold text-slate-500">Payment Cost</th>
                  <th scope="col" className="px-6 py-3.5 text-center font-bold">Tray Status</th>
                  <th scope="col" className="px-6 py-3.5 text-right font-bold">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredFoodOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No matching active meals orders found.
                    </td>
                  </tr>
                ) : (
                  filteredFoodOrders.map((o) => {
                    const cust = customers.find(c => c.id === o.customerId);
                    return (
                      <tr key={o.id} className="hover:bg-amber-500/5 text-slate-600 text-xs sm:text-sm transition-all duration-200 group/row">
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-700">
                          {o.id}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900 group-hover/row:text-slate-950">
                          {cust ? cust.name : 'Unknown Guest'}
                        </td>
                        <td className="px-6 py-3.5 max-w-[240px]">
                          <div className="space-y-1">
                            {o.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-slate-600 font-medium">
                                <span className="truncate">{it.foodName}</span>
                                <span className="text-amber-700 bg-amber-500/5 px-1.5 py-0.2 rounded font-mono text-[10px] pl-2 font-bold">x{it.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold text-slate-800">
                          {o.quantity}
                        </td>
                        <td className="px-6 py-3.5 text-right font-extrabold text-amber-600">
                          ₹{o.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`inline-flex px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-md border ${getOrderStatusBadge(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {o.status === 'Pending' ? (
                            <div className="flex gap-2 justify-end">
                              {isAdmin && (
                                <button
                                  onClick={() => onUpdateOrderStatus(o.id, 'Served')}
                                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-1.5 border border-emerald-200 rounded text-xs font-bold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                                >
                                  Serve Dish
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if(confirm('Cancel this food order?')) {
                                    onUpdateOrderStatus(o.id, 'Cancelled');
                                  }
                                }}
                                className="bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 px-3 py-1.5 rounded text-xs font-bold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-450 text-[11px] font-bold tracking-wide uppercase mr-2">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cart Checkout Dialog Modal */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-amber-500" /> Confirm Room Service Order
              </h3>
              <button 
                onClick={() => setCartOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {currentUser.role === 'admin' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Select Customer Profile *
                  </label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="">-- Choose Guest Profile --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center text-sm border border-slate-100">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Ordering For</p>
                    <p className="font-extrabold text-slate-800">{customers.find(c => c.id === currentUser.customerId)?.name}</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">Room Service</span>
                </div>
              )}

              {/* Order content invoice summary */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 text-xs">
                <span className="block font-bold text-slate-500 text-[10px] uppercase">Service Summary</span>
                {cartItemsArray.map(({ item, quantity }) => (
                  <div key={item.id} className="flex justify-between items-center text-slate-600">
                    <span>{item.foodName} x{quantity}</span>
                    <span>₹{(item.price * quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-200 pt-2 text-sm">
                  <span>Grand Total (Excl. Tax):</span>
                  <span className="text-amber-700">₹{cartTotalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="flex-1 py-1.5 px-4 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors animate-pulse"
                >
                  Confirm Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
