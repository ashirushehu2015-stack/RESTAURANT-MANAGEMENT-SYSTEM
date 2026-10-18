import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  ShoppingBag, 
  MapPin, 
  ShieldCheck,
  Building2,
  Armchair,
  Info
} from 'lucide-react';
import type { Reservation, ReservationStatus, RestaurantTable, TableFloor } from '../types';
import { INITIAL_RESERVATIONS } from '../data/reservationData';

interface ReservationsModuleProps {
  tables: RestaurantTable[];
  onUpdateTable: (tableId: string, updates: Partial<RestaurantTable>) => void;
  onOpenInPos: (tableNumber: string, customerName?: string) => void;
  onNavigateToFloorPlan?: () => void;
  cashierName?: string;
}

export const ReservationsModule: React.FC<ReservationsModuleProps> = ({
  tables,
  onUpdateTable,
  onOpenInPos,
  onNavigateToFloorPlan,
  cashierName = 'Prototype Cashier'
}) => {
  // Load reservations from localStorage or default
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const saved = localStorage.getItem('fulbe_restaurant_reservations');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading reservations', e);
    }
    return INITIAL_RESERVATIONS;
  });

  const saveReservations = (newList: Reservation[]) => {
    setReservations(newList);
    try {
      localStorage.setItem('fulbe_restaurant_reservations', JSON.stringify(newList));
    } catch (e) {
      console.error('Error saving reservations', e);
    }
  };

  // State Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [floorFilter, setFloorFilter] = useState<'All' | TableFloor>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [selectedFloor, setSelectedFloor] = useState<TableFloor>('Ground Floor');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [bookingTime, setBookingTime] = useState('02:00 PM');
  const [bookingDuration, setBookingDuration] = useState<number>(90);
  const [specialRequests, setSpecialRequests] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Success Toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // KPI Computations
  const totalBookings = reservations.length;
  const confirmedCount = reservations.filter(r => r.status === 'Confirmed').length;
  const seatedCount = reservations.filter(r => r.status === 'Seated').length;
  const completedCount = reservations.filter(r => r.status === 'Completed').length;
  const totalReservedSeats = reservations
    .filter(r => r.status === 'Confirmed')
    .reduce((sum, r) => sum + r.guestCount, 0);

  // Available tables for selected floor in modal
  const floorTablesForBooking = tables.filter(t => t.floor === selectedFloor);

  // Filtered reservations
  const filteredReservations = reservations.filter(r => {
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesFloor = floorFilter === 'All' || r.floor === floorFilter;
    const matchesSearch = 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phoneNumber.includes(searchQuery) ||
      r.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.specialRequests && r.specialRequests.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesFloor && matchesSearch;
  });

  // Action: Seat a Reserved Guest (Sync with Table & POS)
  const handleSeatGuest = (res: Reservation) => {
    // 1. Update reservation status to Seated
    const updatedReservations = reservations.map(r => 
      r.id === res.id ? { ...r, status: 'Seated' as ReservationStatus } : r
    );
    saveReservations(updatedReservations);

    // 2. Synchronize Table: mark as Occupied with guest name & party size
    onUpdateTable(res.tableId, {
      status: 'Occupied',
      currentGuestName: res.customerName,
      guestCount: res.guestCount,
      seatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      assignedServer: cashierName
    });

    showToast(`Guest "${res.customerName}" seated at ${res.tableNumber}. Opening POS cart...`);

    // 3. Open directly in POS
    setTimeout(() => {
      onOpenInPos(res.tableNumber, res.customerName);
    }, 600);
  };

  // Action: Cancel a Booking (Release Table on Floor Plan)
  const handleCancelBooking = (res: Reservation) => {
    if (!confirm(`Cancel reservation for "${res.customerName}" at ${res.tableNumber}? This will release the table.`)) return;

    const updatedReservations = reservations.map(r => 
      r.id === res.id ? { ...r, status: 'Cancelled' as ReservationStatus } : r
    );
    saveReservations(updatedReservations);

    // Release table back to Available if it was reserved
    const table = tables.find(t => t.id === res.tableId);
    if (table && table.status === 'Reserved') {
      onUpdateTable(res.tableId, {
        status: 'Available',
        currentGuestName: undefined,
        guestCount: 0,
        reservationTime: undefined
      });
    }

    showToast(`Reservation cancelled. ${res.tableNumber} is now Available.`);
  };

  // Action: Complete a Booking (Free Table)
  const handleCompleteBooking = (res: Reservation) => {
    const updatedReservations = reservations.map(r => 
      r.id === res.id ? { ...r, status: 'Completed' as ReservationStatus } : r
    );
    saveReservations(updatedReservations);

    // Reset table
    onUpdateTable(res.tableId, {
      status: 'Available',
      currentGuestName: undefined,
      guestCount: 0,
      orderTotal: 0,
      seatedAt: undefined,
      reservationTime: undefined
    });

    showToast(`Dining completed for "${res.customerName}". ${res.tableNumber} has been freed.`);
  };

  // Action: Create New Reservation with Collision Checking
  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!custName.trim() || !custPhone.trim() || !selectedTableId) {
      setValidationError('Please enter guest name, phone number, and select a table.');
      return;
    }

    const targetTable = tables.find(t => t.id === selectedTableId);
    if (!targetTable) {
      setValidationError('Selected table could not be found.');
      return;
    }

    // Capacity Check
    if (guestCount > targetTable.seats) {
      setValidationError(`${targetTable.tableNumber} only has ${targetTable.seats} seats. Please choose a table with at least ${guestCount} seats.`);
      return;
    }

    // Collision Check: Check if table already has an active Confirmed booking for the same time
    const collision = reservations.find(r => 
      r.tableId === selectedTableId && 
      r.status === 'Confirmed' && 
      r.reservationTime === bookingTime
    );

    if (collision) {
      setValidationError(`Collision Alert: ${targetTable.tableNumber} is already reserved for "${collision.customerName}" at ${bookingTime}. Please choose another table or time slot.`);
      return;
    }

    const newRes: Reservation = {
      id: `RES-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: custName.trim(),
      phoneNumber: custPhone.trim(),
      email: custEmail.trim() || undefined,
      guestCount: Number(guestCount) || 2,
      tableId: targetTable.id,
      tableNumber: targetTable.tableNumber,
      floor: targetTable.floor,
      reservationDate: 'Today',
      reservationTime: bookingTime,
      durationMinutes: Number(bookingDuration) || 90,
      status: 'Confirmed',
      specialRequests: specialRequests.trim() || undefined,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    saveReservations([newRes, ...reservations]);

    // Automatically synchronize table on Floor Plan: lock it as Reserved!
    onUpdateTable(targetTable.id, {
      status: 'Reserved',
      currentGuestName: newRes.customerName,
      reservationTime: newRes.reservationTime,
      guestCount: newRes.guestCount,
      notes: newRes.specialRequests
    });

    showToast(`Reservation confirmed! ${targetTable.tableNumber} is now locked as Reserved on the Floor Plan.`);

    // Reset form
    setIsNewBookingModalOpen(false);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setSpecialRequests('');
    setSelectedTableId('');
  };

  return (
    <div className="space-y-6">

      {/* Success Notification Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#0b1221] text-white border-l-4 border-[#C8B282] px-4 py-3 rounded-sm shadow-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#C8B282] flex-shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}
      
      {/* Reservations Header Banner */}
      <div className="bg-[#0b1221] text-white p-5 rounded-sm border border-[#1a2333] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#C8B282] text-[#0b1221] text-[9px] font-bold uppercase tracking-wider rounded-xs">
              SYNCHRONIZED RESERVATION ENGINE
            </span>
            <span className="text-[10px] text-[#A3A09A]">
              Real-time sync with 30 Seats (Ground: 20 • First: 10)
            </span>
          </div>
          <h1 className="text-xl font-serif font-bold text-white tracking-tight mt-1">
            Table Reservations & Collision Control
          </h1>
          <p className="text-xs text-[#A3A09A] mt-0.5">
            Synchronized with Floor Plan & POS to prevent double-booking, walk-in collisions, and capacity overruns.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsNewBookingModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2D5A44] hover:bg-[#244736] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Book Reservation
          </button>
        </div>
      </div>

      {/* Collision Prevention Status Banner */}
      <div className="bg-[#FAF8F5] border-l-4 border-[#2D5A44] p-3.5 rounded-sm border border-[#E5E2DA] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#2D5A44] flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
              Automatic Table Collision Guard Active
            </h4>
            <p className="text-[11px] text-[#73706B]">
              Every confirmed booking automatically locks its assigned table on the Floor Plan so cashiers and servers cannot accidentally seat walk-in diners.
            </p>
          </div>
        </div>

        {onNavigateToFloorPlan && (
          <button
            type="button"
            onClick={onNavigateToFloorPlan}
            className="px-3 py-1.5 bg-white border border-[#E5E2DA] hover:border-[#1A1A1A] text-[#1A1A1A] text-[11px] font-bold uppercase tracking-wider transition-colors"
          >
            View Live Floor Plan →
          </button>
        )}
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Bookings */}
        <div className="bg-white p-3.5 border border-[#E5E2DA] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">Total Bookings</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-serif font-bold text-[#1A1A1A]">{totalBookings}</span>
            <span className="text-xs text-[#73706B]">Guests</span>
          </div>
          <span className="text-[10px] text-[#73706B] font-medium block mt-1">Today's Schedule</span>
        </div>

        {/* Confirmed / Locked */}
        <div className="bg-white p-3.5 border border-[#E5E2DA] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">Confirmed & Locked</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-serif font-bold text-[#2F54EB]">{confirmedCount}</span>
            <span className="text-xs text-[#2F54EB]">Tables</span>
          </div>
          <span className="text-[10px] text-[#2F54EB] font-medium block mt-1">{totalReservedSeats} Seats Locked</span>
        </div>

        {/* Currently Seated */}
        <div className="bg-white p-3.5 border border-[#E5E2DA] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">Currently Seated</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-serif font-bold text-[#D48806]">{seatedCount}</span>
            <span className="text-xs text-[#D48806]">Dining</span>
          </div>
          <span className="text-[10px] text-[#D48806] font-medium block mt-1">Active in POS</span>
        </div>

        {/* Completed */}
        <div className="bg-white p-3.5 border border-[#E5E2DA] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">Completed</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-serif font-bold text-[#2D5A44]">{completedCount}</span>
            <span className="text-xs text-[#73706B]">Billed</span>
          </div>
          <span className="text-[10px] text-[#2D5A44] font-medium block mt-1">Tables Freed</span>
        </div>

        {/* Seating Capacity Guard */}
        <div className="bg-white p-3.5 border border-[#E5E2DA] shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">Total Venue Capacity</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-serif font-bold text-[#0b1221]">30</span>
            <span className="text-xs text-[#73706B]">Seats</span>
          </div>
          <span className="text-[10px] text-[#73706B] font-medium block mt-1">20 Ground • 10 First Floor</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-[#E5E2DA]">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'Confirmed', 'Seated', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? 'bg-[#0b1221] text-white'
                  : 'bg-[#FAF8F5] text-[#73706B] hover:text-[#1A1A1A] border border-[#E5E2DA]'
              }`}
            >
              {st}
            </button>
          ))}

          {/* Floor Quick Toggle */}
          <div className="h-4 w-px bg-[#E5E2DA] mx-1 hidden sm:block" />
          
          {(['All', 'Ground Floor', 'First Floor'] as const).map((fl) => (
            <button
              key={fl}
              type="button"
              onClick={() => setFloorFilter(fl)}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                floorFilter === fl
                  ? 'bg-[#2D5A44] text-white'
                  : 'bg-[#FAF8F5] text-[#73706B] hover:text-[#1A1A1A] border border-[#E5E2DA]'
              }`}
            >
              {fl === 'All' ? 'All Floors' : fl}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#8C8984] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guest, phone, table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E5E2DA] text-xs text-[#1A1A1A] placeholder-[#8C8984] focus:outline-none focus:border-[#0b1221]"
          />
        </div>
      </div>

      {/* Reservations List */}
      <div className="space-y-3">
        {filteredReservations.length === 0 ? (
          <div className="bg-white border border-[#E5E2DA] p-12 text-center rounded-sm">
            <CalendarIcon className="w-12 h-12 text-[#C8B282] mx-auto mb-3" />
            <h3 className="font-serif font-bold text-base text-[#1A1A1A]">No Reservations Found</h3>
            <p className="text-xs text-[#73706B] max-w-sm mx-auto mt-1">
              There are no reservations matching your current filter. Click "Book Reservation" to schedule guests and lock a table.
            </p>
          </div>
        ) : (
          filteredReservations.map((res) => {
            const isConfirmed = res.status === 'Confirmed';
            const isSeated = res.status === 'Seated';
            const isCompleted = res.status === 'Completed';
            const isCancelled = res.status === 'Cancelled';

            return (
              <div
                key={res.id}
                className={`bg-white border rounded-md p-4 transition-all duration-200 shadow-2xs hover:shadow-sm ${
                  isConfirmed ? 'border-l-4 border-l-[#2F54EB] border-y-[#E5E2DA] border-r-[#E5E2DA]' :
                  isSeated ? 'border-l-4 border-l-[#D48806] border-y-[#E5E2DA] border-r-[#E5E2DA] bg-[#FFFDF9]' :
                  isCompleted ? 'border-l-4 border-l-[#2D5A44] border-y-[#E5E2DA] border-r-[#E5E2DA]' :
                  'border-l-4 border-l-[#8C8C8C] border-y-[#E5E2DA] border-r-[#E5E2DA] opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Guest & Table details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-base text-[#1A1A1A]">
                        {res.customerName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E2DA] text-[#73706B] rounded-xs uppercase">
                        {res.id}
                      </span>
                      {/* Status Badge */}
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-xs border ${
                        isConfirmed ? 'bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]' :
                        isSeated ? 'bg-[#FFF8E6] text-[#D48806] border-[#FFE58F]' :
                        isCompleted ? 'bg-[#F0F7F3] text-[#2D5A44] border-[#C4E2D2]' :
                        'bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]'
                      }`}>
                        {res.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#555]">
                      <span className="flex items-center gap-1 font-semibold text-[#1A1A1A]">
                        <Building2 className="w-3.5 h-3.5 text-[#C8B282]" />
                        {res.tableNumber} ({res.floor})
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#A3A09A]" />
                        {res.guestCount} Guests
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#A3A09A]" />
                        {res.reservationTime} ({res.durationMinutes || 90}m)
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#A3A09A]" />
                        {res.phoneNumber}
                      </span>
                    </div>

                    {res.specialRequests && (
                      <p className="text-[11px] text-[#73706B] italic bg-[#FAF8F5] px-2.5 py-1 rounded-xs border-l-2 border-[#C8B282]">
                        "{res.specialRequests}"
                      </p>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                    {isConfirmed && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSeatGuest(res)}
                          className="py-2 px-3.5 bg-[#2D5A44] hover:bg-[#244736] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xs shadow-xs flex items-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#C8B282]" />
                          <span>Seat & Open POS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(res)}
                          className="py-2 px-3 bg-[#FAF8F5] hover:bg-[#FFF0F2] text-[#CF1322] border border-[#E5E2DA] text-xs font-bold uppercase tracking-wider transition-colors rounded-xs"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {isSeated && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenInPos(res.tableNumber, res.customerName)}
                          className="py-2 px-3.5 bg-[#0b1221] hover:bg-[#1a2333] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xs flex items-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#C8B282]" />
                          <span>Active POS Order</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompleteBooking(res)}
                          className="py-2 px-3 bg-[#FAF8F5] hover:bg-[#F0EDE6] text-[#2D5A44] border border-[#E5E2DA] text-xs font-bold uppercase tracking-wider transition-colors rounded-xs"
                        >
                          Complete & Free
                        </button>
                      </>
                    )}

                    {isCompleted && (
                      <span className="text-xs text-[#2D5A44] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Bill Settled
                      </span>
                    )}

                    {isCancelled && (
                      <span className="text-xs text-[#8C8C8C] italic">
                        Table released
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: NEW RESERVATION WITH COLLISION ENGINE */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateReservation} className="bg-white border border-[#E5E2DA] max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Book New Reservation
                </h3>
                <p className="text-xs text-[#73706B]">
                  Capacity-checked & synced with Ground (20 Seats) & First Floor (10 Seats)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBookingModalOpen(false)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            {/* Collision Error Alert */}
            {validationError && (
              <div className="p-3 bg-[#FFF1F0] border border-[#FFA39E] rounded-xs text-xs text-[#CF1322] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#CF1322] flex-shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Guest Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Aisha Yusuf"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0803 123 4567"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                  />
                </div>
              </div>

              {/* Guest Count & Floor Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                    Party Size (Diners) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                    Preferred Floor *
                  </label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => {
                      setSelectedFloor(e.target.value as TableFloor);
                      setSelectedTableId('');
                    }}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                  >
                    <option value="Ground Floor">Ground Floor (20 Seats Total)</option>
                    <option value="First Floor">First Floor (10 Seats Total)</option>
                  </select>
                </div>
              </div>

              {/* Table Selection with Capacity & Status Checks */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                  Assign Table ({selectedFloor}) *
                </label>
                <select
                  required
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                >
                  <option value="">-- Select an eligible table --</option>
                  {floorTablesForBooking.map((tbl) => {
                    const isTooSmall = tbl.seats < guestCount;
                    return (
                      <option 
                        key={tbl.id} 
                        value={tbl.id}
                        disabled={isTooSmall}
                      >
                        {tbl.tableNumber} ({tbl.seats} Seats, {tbl.shape}) — Current Status: {tbl.status} {isTooSmall ? '(Too small)' : ''}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-[#8C8984] mt-1 block">
                  Only tables with capacity $\ge$ party size ({guestCount} diners) are eligible.
                </span>
              </div>

              {/* Time Slot & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                    Booking Time Slot *
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                  >
                    {['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '03:00 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                    Estimated Duration
                  </label>
                  <select
                    value={bookingDuration}
                    onChange={(e) => setBookingDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                  >
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes (Standard)</option>
                    <option value={120}>120 Minutes (Executive / VIP)</option>
                  </select>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                  Special Dining Requests / Notes
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Anniversary cake, quiet corner, high chair, dietary preference..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs focus:outline-none focus:border-[#0b1221]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="button"
                onClick={() => setIsNewBookingModalOpen(false)}
                className="px-4 py-2.5 bg-[#FAF8F5] text-[#73706B] text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#2D5A44] hover:bg-[#244736] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Lock Table</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
