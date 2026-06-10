import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, ShieldAlert, X, Filter, Image, BedDouble, Users, HelpCircle, Calendar, Star, MessageSquare, LayoutGrid, Map, Compass, ArrowLeftRight, DoorClosed, Sparkles, AlertOctagon } from 'lucide-react';
import { Room, RoomType, RoomStatus, Review } from '../types';

interface RoomsViewProps {
  rooms: Room[];
  isAdmin: boolean;
  onAddRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  onEditRoom: (id: string, room: Partial<Room>) => Promise<void>;
  onDeleteRoom: (id: string) => Promise<void>;
  onBookRoom: (roomNumber: string) => void;
  reviews?: Review[];
  onAddReview?: (review: { roomNumber: string; rating: number; comment: string }) => Promise<void>;
}

export default function RoomsView({ 
  rooms, 
  isAdmin, 
  onAddRoom, 
  onEditRoom, 
  onDeleteRoom, 
  onBookRoom,
  reviews = [],
  onAddReview 
}: RoomsViewProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Floor plan interactive map states
  const [viewMode, setViewMode] = useState<'grid' | 'floorplan'>('grid');
  const [selectedFloor, setSelectedFloor] = useState<string>('1');
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);

  const roomsList = Array.isArray(rooms) ? rooms : [];

  const uniqueFloors = Array.from(new Set(roomsList.map(r => r.roomNumber.trim().charAt(0))))
    .filter(f => /^[0-9A-Za-z]$/.test(f))
    .sort();

  // If a selected floor does not exist anymore, fall back to the first available floor
  React.useEffect(() => {
    if (uniqueFloors.length > 0 && !uniqueFloors.includes(selectedFloor)) {
      setSelectedFloor(uniqueFloors[0]);
    }
  }, [roomsList, uniqueFloors, selectedFloor]);

  const floorRooms = roomsList.filter(r => r.roomNumber.trim().startsWith(selectedFloor));
  const topRowRooms = floorRooms.filter((_, idx) => idx % 2 === 0);
  const bottomRowRooms = floorRooms.filter((_, idx) => idx % 2 !== 0);
  const focusedRoom = roomsList.find(r => r.id === focusedRoomId) || floorRooms[0];

  const renderBlueprintRoomBlock = (room: Room) => {
    const isFocused = focusedRoom?.id === room.id;
    const isAvailable = room.status === 'Available';
    
    return (
      <button
        key={room.id}
        type="button"
        onClick={() => setFocusedRoomId(room.id)}
        className={`relative group/room w-28 h-24 rounded-xl border p-3 flex flex-col justify-between transition-all duration-300 cursor-pointer text-left select-none ${
          isFocused
            ? 'bg-[#122245] border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-2 ring-amber-500/50 scale-102 z-20'
            : 'bg-slate-950 border-slate-800 hover:bg-slate-900/60 hover:border-slate-700 hover:scale-101'
        }`}
      >
        {/* Pulsing indicator light at the top right of the blueprints room */}
        <div className="absolute top-2 right-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${
            isAvailable 
              ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' 
              : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]'
          } animate-pulse`} />
        </div>

        {/* Room Category tag */}
        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">
          {room.roomType.slice(0,3)} Suite
        </div>

        {/* Core room number display */}
        <div className="my-0.5">
          <span className={`text-sm font-extrabold font-mono tracking-tight transition-colors ${
            isFocused ? 'text-amber-400' : 'text-slate-200 group-hover/room:text-slate-100'
          }`}>
            #{room.roomNumber}
          </span>
        </div>

        {/* Price & guest summary line */}
        <div className="flex items-center justify-between border-t border-slate-800/40 pt-1.5 mt-1">
          <span className="text-[9px] font-bold text-amber-500/80 font-mono">₹{room.pricePerNight}</span>
          <span className="text-[8px] font-bold text-slate-400 font-mono">{room.capacity} G</span>
        </div>
      </button>
    );
  };

  // Form states
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('Standard');
  const [pricePerNight, setPricePerNight] = useState(100);
  const [capacity, setCapacity] = useState(2);
  const [status, setStatus] = useState<RoomStatus>('Available');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  // Reviews & Rating states
  const [activeReviewRoom, setActiveReviewRoom] = useState<Room | null>(null);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [reviewError, setReviewError] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const openAddModal = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setRoomType('Standard');
    setPricePerNight(100);
    setCapacity(2);
    setStatus('Available');
    setImageUrl('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.roomNumber);
    setRoomType(room.roomType);
    setPricePerNight(room.pricePerNight);
    setCapacity(room.capacity);
    setStatus(room.status);
    setImageUrl(room.imageUrl || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!roomNumber.trim()) {
      setError('Room number is required');
      return;
    }

    try {
      if (editingRoom) {
        await onEditRoom(editingRoom.id, {
          roomNumber,
          roomType,
          pricePerNight: Number(pricePerNight),
          capacity: Number(capacity),
          status,
          imageUrl: imageUrl.trim() || undefined
        });
      } else {
        await onAddRoom({
          roomNumber,
          roomType,
          pricePerNight: Number(pricePerNight),
          capacity: Number(capacity),
          status,
          imageUrl: imageUrl.trim() || undefined
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to persist room record');
    }
  };

  const filtered = roomsList.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType ? room.roomType === filterType : true;
    const matchesStatus = filterStatus ? room.status === filterStatus : true;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6" id="rooms-view-container">
      {/* Search and Filters Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4" id="rooms-controls">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3" id="rooms-search-filters">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Room Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 w-full appearance-none border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Room Types</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 w-full appearance-none border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
            </select>
          </div>
        </div>

        {/* Dynamic Catalog/Floor Plan Selector tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 select-none shrink-0" id="rooms-view-toggle">
          <button 
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'grid' 
                ? 'bg-white text-amber-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Catalog Grid</span>
          </button>
          <button 
            type="button"
            onClick={() => setViewMode('floorplan')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'floorplan' 
                ? 'bg-white text-amber-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Floor Plan Map</span>
          </button>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Room
          </button>
        )}
      </div>

      {viewMode === 'grid' ? (
        /* Rooms Cards/Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="rooms-data-grid">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100 text-slate-400">
            No rooms found match the criteria.
          </div>
        ) : (
          filtered.map((room) => {
            const roomReviews = reviews.filter(r => r.roomNumber === room.roomNumber);
            const averageRating = roomReviews.length > 0
              ? roomReviews.reduce((sum, r) => sum + r.rating, 0) / roomReviews.length
              : 0;

            return (
              <div 
                key={room.id}
                className="group bg-white rounded-xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Room Image Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    <img
                      src={room.imageUrl || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'}
                      alt={`Room ${room.roomNumber}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute top-3 left-3 z-10">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                        room.status === 'Available'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {room.status}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 z-10 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-black text-amber-400 uppercase tracking-widest shadow-sm">
                      {room.roomType}
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Royal Suite Cabin</span>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Room {room.roomNumber}</h3>
                      </div>
                      {/* Star Rating Display */}
                      <button 
                        onClick={() => {
                          setActiveReviewRoom(room);
                          setNewRating(5);
                          setNewComment('');
                          setReviewError('');
                        }}
                        className="flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-100 transition-all cursor-pointer select-none"
                        title="View all customer reviews"
                      >
                        <Star className={`w-3.5 h-3.5 ${averageRating > 0 ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold">
                          {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-dashed border-slate-100 py-3">
                      <div className="flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-slate-400 font-medium font-sans">Category</span>
                          <span className="font-bold text-slate-700">{room.roomType}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-slate-400 font-medium font-sans">Capacity</span>
                          <span className="font-bold text-slate-700">{room.capacity} Guests</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-xs text-slate-400 font-medium font-sans">Price per Night</span>
                      <span className="text-2xl font-black text-amber-600 font-mono">₹{room.pricePerNight}</span>
                    </div>

                    {/* Integrated Reviews trigger */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setActiveReviewRoom(room);
                          setNewRating(5);
                          setNewComment('');
                          setReviewError('');
                        }}
                        className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 hover:text-slate-800 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>
                          {roomReviews.length > 0 
                            ? `Reviews (${roomReviews.length}) & Opinions` 
                            : 'Be the first to review!'}
                        </span>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-50">
                      <button
                        onClick={() => onBookRoom(room.roomNumber)}
                        className={`w-full py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                          room.status === 'Available'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        disabled={room.status !== 'Available'}
                      >
                        <Calendar className="w-3.5 h-3.5 animate-pulse" />
                        {room.status === 'Available' ? 'Book Suite Now' : 'Currently Occupied'}
                      </button>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex justify-end gap-3 z-10">
                    <button
                      onClick={() => openEditModal(room)}
                      className="p-1 px-3 text-xs font-medium text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md inline-flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if(confirm(`Are you sure you want to delete Room ${room.roomNumber}?`)) {
                          onDeleteRoom(room.id);
                        }
                      }}
                      className="p-1 px-3 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md inline-flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      ) : (
        /* Interactive Floor Plan Wing Layout */
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-6 animate-fade-in" id="rooms-floor-plan">
          {/* Floor Selection Bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
            <span className="text-xs font-black text-slate-550 uppercase tracking-widest mr-2 flex items-center gap-1">
              <Compass className="w-4 h-4 text-amber-500" />
              <span>Select Active Level:</span>
            </span>
            {uniqueFloors.map((fl) => {
              const floorLabel = fl === '1' ? '1st Floor (Standard Core)' : 
                                 fl === '2' ? '2nd Floor (Royal Deluxe Wing)' : 
                                 fl === '3' ? '3rd Floor (Signature Penthouses)' : 
                                 `Level ${fl} Wing`;
              return (
                <button
                  key={fl}
                  type="button"
                  onClick={() => {
                    setSelectedFloor(fl);
                    setFocusedRoomId(null); // Reset focus when switching floors
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    selectedFloor === fl
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {floorLabel}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT / CENTER: Interactive Floor Blueprint Map */}
            <div className="lg:col-span-2 bg-[#0b1329] border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between min-h-[460px] shadow-inner select-none overflow-hidden">
              
              {/* CAD Radial / Line Blueprint background and annotations */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              
              {/* Technical indicators in corners */}
              <div className="flex items-center justify-between z-10 text-[9px] text-slate-500 font-mono tracking-widest uppercase pointer-events-none shrink-0 border-b border-slate-800/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-slate-500" />
                  <span>WING B BLUEPRINT &bull; AREA C</span>
                </div>
                <span>SCALE: 1:150px &bull; LEVEL WORKSTATION</span>
              </div>
              
              {/* Floor Plan Wing Map Layout containing suites and hallways */}
              <div className="my-auto py-8">
                {floorRooms.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center h-64 text-center p-6 space-y-3 z-10">
                    <AlertOctagon className="w-10 h-10 text-slate-600 animate-pulse" />
                    <div className="space-y-1">
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Blueprint Empty Zone</span>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed font-sans">
                        No active suite cabins have been registered for Floor Level {selectedFloor} yet. Use the 'Add Room' controller in standard inventory or add new suites starting with '{selectedFloor}' to map them.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Suites North Row (Even indices) */}
                    <div className="flex gap-4 justify-center items-stretch flex-wrap">
                      {topRowRooms.length === 0 ? (
                        <div className="text-[10px] text-slate-600 uppercase font-mono italic p-4">North Wing - Utilities Area</div>
                      ) : (
                        topRowRooms.map((room) => renderBlueprintRoomBlock(room))
                      )}
                    </div>
                    
                    {/* Simulated Corridor Hallway */}
                    <div className="relative bg-[#0d162a] border-y border-dashed border-slate-800/80 h-14 my-5 flex items-center justify-between px-6 z-10 rounded-sm">
                      {/* Left Elevator Loft representation */}
                      <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500 uppercase tracking-wider">
                        <DoorClosed className="w-3.5 h-3.5 text-slate-600" />
                        <span>Elevator Lobby A</span>
                      </div>
                      
                      {/* Running-man exit lights or hallway labels */}
                      <div className="absolute inset-x-0 mx-auto text-center flex items-center justify-center gap-2 text-[9px] font-mono text-slate-500/80 tracking-widest uppercase pointer-events-none">
                        <ArrowLeftRight className="w-3 h-3 text-slate-600" />
                        <span>Access Corridor &bull; Core Level {selectedFloor}</span>
                        <ArrowLeftRight className="w-3 h-3 text-slate-600 text-right" />
                      </div>
                      
                      {/* Right Stairs representation */}
                      <div className="font-mono text-[9px] text-slate-500 uppercase tracking-wider text-right">
                        <span>Stairs B &rarr;</span>
                      </div>
                    </div>
                    
                    {/* Suites South Row (Odd indices) */}
                    <div className="flex gap-4 justify-center items-stretch flex-wrap">
                      {bottomRowRooms.length === 0 ? (
                        <div className="text-[10px] text-slate-600 uppercase font-mono italic p-4">South Wing - Utilities Area</div>
                      ) : (
                        bottomRowRooms.map((room) => renderBlueprintRoomBlock(room))
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Blueprint Footer legend representation */}
              <div className="flex items-center justify-between border-t border-slate-800/40 pt-4 z-10 text-[10px] text-slate-500 font-mono tracking-widest uppercase pointer-events-none shrink-0">
                <span>Legend Map Code:</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" /> Available Room</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)] animate-pulse" /> Occupied Suite</span>
                </div>
              </div>
              
            </div>
            
            {/* RIGHT SIDEBAR: Focused Room Real-Time Spec Sheet */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between min-h-[460px]">
              {focusedRoom ? (
                <div className="h-full flex flex-col justify-between space-y-5 animate-fade-in">
                  
                  {/* Suite Identity Information Section */}
                  <div className="space-y-4">
                    {/* Visual header thumbnail */}
                    <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-100 shadow-inner">
                      <img
                        src={focusedRoom.imageUrl || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'}
                        alt={`Focused Room ${focusedRoom.roomNumber}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-95 hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-md ${
                          focusedRoom.status === 'Available'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          {focusedRoom.status}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-black text-amber-400 uppercase tracking-widest">
                        {focusedRoom.roomType} Suite
                      </div>
                    </div>
                    
                    {/* Suite Name and Category */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Selected Blueprint Zone</span>
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Suite Room {focusedRoom.roomNumber}</h3>
                    </div>
                    
                    {/* Technical details Grid */}
                    <div className="grid grid-cols-2 gap-4 text-xs border-y border-dashed border-slate-200 py-3.5">
                      <div className="space-y-1">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Suite Class</span>
                        <div className="flex items-center gap-1 text-slate-700 font-bold">
                          <BedDouble className="w-4 h-4 text-amber-500" />
                          <span>{focusedRoom.roomType}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Capacity Limits</span>
                        <div className="flex items-center gap-1 text-slate-700 font-bold">
                          <Users className="w-4 h-4 text-amber-500" />
                          <span>{focusedRoom.capacity} Suite Guests</span>
                        </div>
                      </div>
                    </div>

                    {/* Rent cost rate */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Rate Per Night:</span>
                      <div className="text-right">
                        <span className="text-xl font-black text-amber-600 font-mono">₹{focusedRoom.pricePerNight}</span>
                        <span className="text-[9px] text-slate-400 block tracking-tight font-sans">inclusive of standard utilities</span>
                      </div>
                    </div>

                    {/* Operational Check list */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 border-dashed space-y-2 text-xs">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Housekeeping & Status Details</span>
                      {focusedRoom.status === 'Available' ? (
                        <p className="text-emerald-700 font-medium leading-relaxed font-sans flex items-start gap-1.5 animate-pulse">
                          <span className="text-emerald-600 font-bold mt-[-3px]">&bull;</span>
                          <span>Pristine clean condition. Housekeeping has cleared this suite. Ready to accept smart reservations instantly.</span>
                        </p>
                      ) : (
                        <p className="text-slate-500 font-medium leading-relaxed font-sans flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold mt-[-3px]">&bull;</span>
                          <span>Currently occupied. Clean-up tasks schedule dispatched automatically upon reservation checklist logging checkout.</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Big Booking actions */}
                  <div className="pt-2">
                    {focusedRoom.status === 'Available' ? (
                      <button
                        type="button"
                        onClick={() => onBookRoom(focusedRoom.roomNumber)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-amber-500"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300 transform group-hover:scale-110" />
                        Book Suite #{focusedRoom.roomNumber} Now
                      </button>
                    ) : (
                      <button
                        disabled
                        type="button"
                        className="w-full bg-slate-250 text-slate-450 font-bold py-3 rounded-xl text-xs uppercase tracking-widest cursor-not-allowed border border-slate-300 text-center"
                      >
                        Suite Currently Occupied
                      </button>
                    )}
                  </div>
                  
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-150 text-slate-400 flex items-center justify-center border border-slate-200 shadow-inner">
                    <Compass className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">Select Suite Node</h4>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      Click any registered room block on the interactive floor level blueprint to see live clean conditions, and trigger the reservation modal.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* Add / Edit Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" id="room-form-modal">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Add New Room'}
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
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 104, 305"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Room Type *
                  </label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as RoomType)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RoomStatus)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Price Per Night (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Max Capacity (Guests) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Room Image URL</span>
                  <span className="text-[10px] text-slate-400 capitalize normal-case font-normal inline-flex items-center gap-0.5" title="Leave blank to auto-generate based on Room Type">
                    <HelpCircle className="w-3 h-3" /> Auto-assigns if blank
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="e.g. https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono text-xs text-slate-600"
                  />
                  <Image className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Provide a high-quality photo link to display in the main lobby suite catalogs.</p>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews & Ratings Detail Center Modal */}
      {activeReviewRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" id="reviews-detail-modal">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-2xl overflow-hidden my-8 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0 bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Customer Testimonials</span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Reviews for Room {activeReviewRoom.roomNumber} ({activeReviewRoom.roomType})
                </h3>
              </div>
              <button 
                onClick={() => setActiveReviewRoom(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {reviewError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}

              {/* Average Summary Section */}
              <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Overall Suite Rating</h4>
                  <p className="text-[11px] text-slate-500">Based on past customer evaluation scores.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex text-amber-400">
                    {(() => {
                      const roomRevList = reviews.filter(r => r.roomNumber === activeReviewRoom.roomNumber);
                      const avg = roomRevList.length > 0 
                        ? roomRevList.reduce((sum, r) => sum + r.rating, 0) / roomRevList.length 
                        : 0;
                      return (
                        <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-amber-200">
                          <span className="text-xl font-black text-slate-800 font-mono pr-1">{avg > 0 ? avg.toFixed(1) : '0.0'}</span>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`w-4 h-4 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                            />
                          ))}
                          <span className="text-xs text-slate-400 font-sans font-semibold pl-2">({roomRevList.length} reviews)</span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <MessageSquare className="w-4 h-4 text-slate-400" /> Past Guest Experiences
                </h4>
                {reviews.filter(r => r.roomNumber === activeReviewRoom.roomNumber).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 italic">No reviews yet for this suite cabin. Be the first to share your experience!</p>
                ) : (
                  <div className="space-y-4 divide-y divide-slate-50 max-h-64 overflow-y-auto pr-1">
                    {reviews
                      .filter(r => r.roomNumber === activeReviewRoom.roomNumber)
                      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((rev, index) => (
                        <div key={rev.id} className={`${index > 0 ? 'pt-4' : ''} space-y-1.5`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{rev.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-medium font-mono">
                              {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star 
                                key={s} 
                                className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                              />
                            ))}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-sans">{rev.comment}</p>
                        </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leave Review Form */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Leave a Guest Review</h4>
                
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
                  {/* Select Ratings Star */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Star Rating *
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star 
                            className={`w-6 h-6 transition-colors ${
                              star <= newRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Feedback / Comment *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Share your stay experience, suite comfort, cleanliness, and overall hotel service quality..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs font-sans bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={isSubmittingReview || !newComment.trim()}
                      onClick={async () => {
                        if (!newComment.trim()) return;
                        setReviewError('');
                        setIsSubmittingReview(true);
                        try {
                          if (onAddReview) {
                            await onAddReview({
                              roomNumber: activeReviewRoom.roomNumber,
                              rating: newRating,
                              comment: newComment.trim()
                            });
                            // Reset state
                            setNewComment('');
                            setNewRating(5);
                          }
                        } catch (err: any) {
                          setReviewError(err?.response?.data?.error || 'Failed to submit review.');
                        } finally {
                          setIsSubmittingReview(false);
                        }
                      }}
                      className={`px-5 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-1.5 ${
                        newComment.trim() 
                          ? 'bg-amber-600 hover:bg-amber-700 cursor-pointer' 
                          : 'bg-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Suite Review'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveReviewRoom(null)}
                className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
