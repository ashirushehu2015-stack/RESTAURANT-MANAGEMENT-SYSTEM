import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  UtensilsCrossed, 
  Plus, 
  Search, 
  ShoppingBag, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Building2,
  Armchair,
  Info
} from 'lucide-react';
import type { RestaurantTable, TableFloor, TableStatus, TableShape } from '../types';
import { INITIAL_TABLES, GROUND_FLOOR_SEATS_TARGET, FIRST_FLOOR_SEATS_TARGET } from '../data/tableData';
import { formatNaira } from '../utils/formatters';

interface TableFloorPlanViewProps {
  orders?: any[];
  onOpenInPos: (tableNumber: string) => void;
  cashierName?: string;
}

export const TableFloorPlanView: React.FC<TableFloorPlanViewProps> = ({
  orders = [],
  onOpenInPos,
  cashierName = 'Prototype Cashier'
}) => {
  // Load tables from localStorage or default to INITIAL_TABLES
  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    try {
      const saved = localStorage.getItem('fulbe_restaurant_tables');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading tables from localStorage', e);
    }
    return INITIAL_TABLES;
  });

  const saveTables = (newTables: RestaurantTable[]) => {
    setTables(newTables);
    try {
      localStorage.setItem('fulbe_restaurant_tables', JSON.stringify(newTables));
    } catch (e) {
      console.error('Error saving tables to localStorage', e);
    }
  };

  // State Filters
  const [selectedFloor, setSelectedFloor] = useState<'All' | TableFloor>('Ground Floor');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [seatingModalTable, setSeatingModalTable] = useState<RestaurantTable | null>(null);
  const [walkInGuestName, setWalkInGuestName] = useState('');
  const [walkInPartySize, setWalkInPartySize] = useState<number>(2);
  const [walkInServer, setWalkInServer] = useState(cashierName);

  const [statusModalTable, setStatusModalTable] = useState<RestaurantTable | null>(null);
  const [newStatus, setNewStatus] = useState<TableStatus>('Available');
  const [statusNotes, setStatusNotes] = useState('');

  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableFloor, setNewTableFloor] = useState<TableFloor>('Ground Floor');
  const [newTableSeats, setNewTableSeats] = useState<number>(4);
  const [newTableShape, setNewTableShape] = useState<TableShape>('rectangular');
  const [newTableNotes, setNewTableNotes] = useState('');

  // Compute live floor metrics
  const groundFloorTables = tables.filter(t => t.floor === 'Ground Floor');
  const firstFloorTables = tables.filter(t => t.floor === 'First Floor');

  const groundFloorSeats = groundFloorTables.reduce((acc, t) => acc + t.seats, 0);
  const firstFloorSeats = firstFloorTables.reduce((acc, t) => acc + t.seats, 0);
  const totalSeats = tables.reduce((acc, t) => acc + t.seats, 0);

  // Active Floor Stats based on current view
  const currentViewTables = selectedFloor === 'All' 
    ? tables 
    : tables.filter(t => t.floor === selectedFloor);

  const viewTotalSeats = currentViewTables.reduce((acc, t) => acc + t.seats, 0);
  const viewOccupiedSeats = currentViewTables
    .filter(t => t.status === 'Occupied')
    .reduce((acc, t) => acc + (t.guestCount || t.seats), 0);
  const viewAvailableSeats = currentViewTables
    .filter(t => t.status === 'Available')
    .reduce((acc, t) => acc + t.seats, 0);
  const viewReservedSeats = currentViewTables
    .filter(t => t.status === 'Reserved')
    .reduce((acc, t) => acc + t.seats, 0);
  const occupancyPercentage = viewTotalSeats > 0 ? Math.round((viewOccupiedSeats / viewTotalSeats) * 100) : 0;

  // Filtered Tables
  const filteredTables = currentViewTables.filter(t => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesSearch = t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.currentGuestName && t.currentGuestName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Handlers
  const handleOpenSeatingModal = (table: RestaurantTable) => {
    setSeatingModalTable(table);
    setWalkInGuestName('');
    setWalkInPartySize(table.seats);
    setWalkInServer(cashierName);
  };

  const handleConfirmSeating = (openPosDirectly = false) => {
    if (!seatingModalTable) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = tables.map(t => {
      if (t.id === seatingModalTable.id) {
        return {
          ...t,
          status: 'Occupied' as TableStatus,
          currentGuestName: walkInGuestName.trim() || 'Walk-in Guest',
          guestCount: Number(walkInPartySize) || t.seats,
          assignedServer: walkInServer,
          seatedAt: now,
          orderTotal: t.orderTotal || 0
        };
      }
      return t;
    });

    saveTables(updated);
    const tableNumber = seatingModalTable.tableNumber;
    setSeatingModalTable(null);

    if (openPosDirectly) {
      onOpenInPos(tableNumber);
    }
  };

  const handleOpenStatusModal = (table: RestaurantTable) => {
    setStatusModalTable(table);
    setNewStatus(table.status);
    setStatusNotes(table.notes || '');
  };

  const handleConfirmStatusChange = () => {
    if (!statusModalTable) return;
    const updated = tables.map(t => {
      if (t.id === statusModalTable.id) {
        return {
          ...t,
          status: newStatus,
          notes: statusNotes.trim() || t.notes,
          currentGuestName: newStatus === 'Available' || newStatus === 'Cleaning' ? undefined : t.currentGuestName,
          guestCount: newStatus === 'Available' || newStatus === 'Cleaning' ? 0 : t.guestCount,
          orderTotal: newStatus === 'Available' || newStatus === 'Cleaning' ? 0 : t.orderTotal,
          seatedAt: newStatus === 'Available' ? undefined : t.seatedAt
        };
      }
      return t;
    });

    saveTables(updated);
    setStatusModalTable(null);
  };

  const handleClearTable = (tableId: string) => {
    const updated = tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'Available' as TableStatus,
          currentGuestName: undefined,
          guestCount: 0,
          orderTotal: 0,
          seatedAt: undefined,
          reservationTime: undefined
        };
      }
      return t;
    });
    saveTables(updated);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset floor plan to default layout (20 seats on Ground Floor, 10 seats on First Floor)?')) {
      saveTables(INITIAL_TABLES);
    }
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;

    const newTable: RestaurantTable = {
      id: `table-custom-${Date.now()}`,
      tableNumber: newTableNum.trim(),
      floor: newTableFloor,
      seats: Number(newTableSeats) || 2,
      shape: newTableShape,
      status: 'Available',
      guestCount: 0,
      notes: newTableNotes.trim()
    };

    saveTables([...tables, newTable]);
    setIsAddTableModalOpen(false);
    setNewTableNum('');
    setNewTableNotes('');
  };

  // Helper to render visual chair indicators
  const renderSeatChairs = (seats: number, status: TableStatus) => {
    const dots = [];
    const colorClass = 
      status === 'Occupied' ? 'bg-[#D48806] border-[#FFE58F]' :
      status === 'Reserved' ? 'bg-[#2F54EB] border-[#ADC6FF]' :
      status === 'Cleaning' ? 'bg-[#8C8C8C] border-[#D9D9D9]' :
      'bg-[#2D5A44] border-[#C4E2D2]';

    for (let i = 0; i < seats; i++) {
      dots.push(
        <span 
          key={i} 
          title={`Seat ${i + 1}`}
          className={`w-3.5 h-3.5 rounded-full border-2 ${colorClass} inline-flex items-center justify-center shadow-xs transition-transform hover:scale-110`}
        />
      );
    }
    return dots;
  };

  return (
    <div className="space-y-6">
      
      {/* Floor Plan Header Banner */}
      <div className="bg-[#0b1221] text-white p-5 rounded-sm border border-[#1a2333] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#C8B282] text-[#0b1221] text-[9px] font-bold uppercase tracking-wider rounded-xs">
              RESTAURANT SEATING ARCHITECTURE
            </span>
            <span className="text-[10px] text-[#A3A09A]">
              Capacity: {totalSeats} Seats ({groundFloorSeats} Ground + {firstFloorSeats} First Floor)
            </span>
          </div>
          <h1 className="text-xl font-serif font-bold text-white tracking-tight mt-1">
            Table & Floor Plan Layout
          </h1>
          <p className="text-xs text-[#A3A09A] mt-0.5">
            Real-time floor map monitoring, diner seat tracking, and direct POS terminal routing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1a2333] hover:bg-[#253247] text-[#C8B282] border border-[#2d3a4f] text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Layout
          </button>
          <button
            type="button"
            onClick={() => setIsAddTableModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2D5A44] hover:bg-[#244736] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* Floor Selection Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2DA] pb-2">
        <div className="flex gap-2">
          {/* Ground Floor Tab (20 Seats Target) */}
          <button
            type="button"
            onClick={() => setSelectedFloor('Ground Floor')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
              selectedFloor === 'Ground Floor'
                ? 'border-[#0b1221] text-[#0b1221] bg-white font-extrabold shadow-2xs'
                : 'border-transparent text-[#73706B] hover:text-[#1A1A1A] hover:bg-[#F5F2ED]'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#C8B282]" />
            <span>Ground Floor</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
              groundFloorSeats === GROUND_FLOOR_SEATS_TARGET 
                ? 'bg-[#E6F4EA] text-[#137333]' 
                : 'bg-[#FFF0F2] text-[#D93025]'
            }`}>
              {groundFloorSeats} Seats
            </span>
          </button>

          {/* First Floor Tab (10 Seats Target) */}
          <button
            type="button"
            onClick={() => setSelectedFloor('First Floor')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
              selectedFloor === 'First Floor'
                ? 'border-[#0b1221] text-[#0b1221] bg-white font-extrabold shadow-2xs'
                : 'border-transparent text-[#73706B] hover:text-[#1A1A1A] hover:bg-[#F5F2ED]'
            }`}
          >
            <Armchair className="w-4 h-4 text-[#C8B282]" />
            <span>First Floor (VIP / Lounge)</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
              firstFloorSeats === FIRST_FLOOR_SEATS_TARGET 
                ? 'bg-[#E6F4EA] text-[#137333]' 
                : 'bg-[#FFF0F2] text-[#D93025]'
            }`}>
              {firstFloorSeats} Seats
            </span>
          </button>

          {/* All Floors Overview */}
          <button
            type="button"
            onClick={() => setSelectedFloor('All')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
              selectedFloor === 'All'
                ? 'border-[#0b1221] text-[#0b1221] bg-white font-extrabold shadow-2xs'
                : 'border-transparent text-[#73706B] hover:text-[#1A1A1A] hover:bg-[#F5F2ED]'
            }`}
          >
            <span>All Floors</span>
            <span className="px-2 py-0.5 bg-[#F0F0F0] text-[#555] text-[10px] rounded-full font-bold">
              {totalSeats} Seats Total
            </span>
          </button>
        </div>

        {/* Floor Target Status Note */}
        <div className="flex items-center gap-1.5 text-xs text-[#73706B] bg-[#FAF8F5] px-3 py-1.5 rounded-sm border border-[#E5E2DA]">
          <Info className="w-3.5 h-3.5 text-[#C8B282]" />
          <span>Requirement: <strong>20 Seats</strong> Ground Floor • <strong>10 Seats</strong> First Floor</span>
        </div>
      </div>

      {/* KPI Ribbon for Selected Floor */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Floor Capacity */}
        <div className="bg-white p-3.5 border border-[#E5E2DA] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">
            {selectedFloor === 'All' ? 'Total Seating' : `${selectedFloor} Seats`}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-serif font-bold text-[#1A1A1A]">{viewTotalSeats}</span>
            <span className="text-xs text-[#73706B]">Seats</span>
          </div>
          <span className="text-[10px] text-[#2D5A44] font-medium block mt-1">
            {currentViewTables.length} Active Tables
          </span>
        </div>

        {/* Available Seats */}
        <div className="bg-white p-3.5 border border-[#E5E2DA] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">Available Seats</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-serif font-bold text-[#2D5A44]">{viewAvailableSeats}</span>
            <span className="text-xs text-[#73706B]">Free</span>
          </div>
          <span className="text-[10px] text-[#73706B] font-medium block mt-1">
            {currentViewTables.filter(t => t.status === 'Available').length} Tables Ready
          </span>
        </div>

        {/* Occupied Seats */}
        <div className="bg-white p-3.5 border border-[#E5E2DA] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">Occupied Seats</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-serif font-bold text-[#D48806]">{viewOccupiedSeats}</span>
            <span className="text-xs text-[#73706B]">Diners</span>
          </div>
          <span className="text-[10px] text-[#D48806] font-medium block mt-1">
            {currentViewTables.filter(t => t.status === 'Occupied').length} Tables Dining
          </span>
        </div>

        {/* Reserved Seats */}
        <div className="bg-white p-3.5 border border-[#E5E2DA] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">Reserved Seats</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-serif font-bold text-[#2F54EB]">{viewReservedSeats}</span>
            <span className="text-xs text-[#73706B]">Seats</span>
          </div>
          <span className="text-[10px] text-[#2F54EB] font-medium block mt-1">
            {currentViewTables.filter(t => t.status === 'Reserved').length} Booked
          </span>
        </div>

        {/* Floor Occupancy Rate */}
        <div className="bg-white p-3.5 border border-[#E5E2DA] shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">Occupancy Rate</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-serif font-bold text-[#0b1221]">{occupancyPercentage}%</span>
          </div>
          <div className="w-full bg-[#E5E2DA] h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-[#2D5A44] h-full transition-all duration-500" 
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-[#E5E2DA]">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['All', 'Available', 'Occupied', 'Reserved', 'Cleaning'].map((st) => (
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
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#8C8984] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search table or guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E5E2DA] text-xs text-[#1A1A1A] placeholder-[#8C8984] focus:outline-none focus:border-[#0b1221]"
          />
        </div>
      </div>

      {/* Floor Plan Table Cards Grid */}
      {/* Floor Plan Table Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTables.map((table) => {
          const isOccupied = table.status === 'Occupied';
          const isReserved = table.status === 'Reserved';
          const isCleaning = table.status === 'Cleaning';
          const isAvailable = table.status === 'Available';

          return (
            <div
              key={table.id}
              className={`bg-white border rounded-md p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md ${
                isOccupied ? 'border-[#FFE58F] bg-[#FFFDF9]' :
                isReserved ? 'border-[#ADC6FF] bg-[#F9FBFF]' :
                isCleaning ? 'border-[#D9D9D9] bg-[#FAFAFA]' :
                'border-[#E5E2DA] hover:border-[#2D5A44]'
              }`}
            >
              <div>
                {/* Header: Table Number, Floor & Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-3.5 pb-2.5 border-b border-[#F0EDE6]">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif font-bold text-lg text-[#1A1A1A] tracking-tight">
                        {table.tableNumber}
                      </h3>
                      <span className="text-[10px] font-semibold text-[#73706B] px-2 py-0.5 bg-[#F0EDE6] rounded-xs uppercase tracking-wider">
                        {table.shape}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block mt-0.5">
                      {table.floor}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs border shadow-2xs whitespace-nowrap flex-shrink-0 ${
                    isOccupied ? 'bg-[#FFF8E6] text-[#D48806] border-[#FFE58F]' :
                    isReserved ? 'bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]' :
                    isCleaning ? 'bg-[#F5F5F5] text-[#595959] border-[#D9D9D9]' :
                    'bg-[#F0F7F3] text-[#2D5A44] border-[#C4E2D2]'
                  }`}>
                    {table.status}
                  </span>
                </div>

                {/* Capacity & Visual Seat Chairs */}
                <div className="bg-[#FAF8F5] p-3 rounded-sm border border-[#EBE8E1] mb-3.5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#C8B282]" />
                      Capacity: <strong className="text-[#1A1A1A]">{table.seats} Seats</strong>
                    </span>
                    <span className="text-[10px] font-semibold text-[#8C8984]">
                      {isOccupied ? `${table.guestCount || table.seats} Guests Seated` : 'Ready to seat'}
                    </span>
                  </div>

                  {/* Visual Seat Indicators */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {renderSeatChairs(table.seats, table.status)}
                  </div>
                </div>

                {/* Structured Metadata Box - Zero Overlapping */}
                {isOccupied && (
                  <div className="bg-[#FAF8F5] p-3 rounded-sm border border-[#EBE8E1] mb-3.5 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#EBE8E1]">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-0.5">Guest / Party</span>
                        <span className="font-bold text-xs text-[#1A1A1A] block truncate" title={table.currentGuestName}>
                          {table.currentGuestName || 'Walk-in Guest'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-0.5">Server / Staff</span>
                        <span className="text-xs text-[#333] block truncate" title={table.assignedServer}>
                          {table.assignedServer || 'Prototype Cashier'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-0.5">Seated Time</span>
                        <span className="text-xs text-[#555] flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-[#A3A09A]" /> {table.seatedAt || 'Active'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8C8984] block mb-0.5">Current Bill</span>
                        <span className="text-xs font-bold text-[#D48806]">
                          {table.orderTotal ? formatNaira(table.orderTotal) : '₦0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isReserved && (
                  <div className="bg-[#F0F5FF] p-3 rounded-sm border border-[#ADC6FF] mb-3.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-[#2F54EB] block mb-0.5">Reserved For</span>
                        <span className="font-bold text-xs text-[#1A1A1A] block truncate" title={table.currentGuestName}>
                          {table.currentGuestName || 'Guest Reservation'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#2F54EB] block mb-0.5">Booking Time</span>
                        <span className="text-xs text-[#2F54EB] flex items-center gap-1 font-bold">
                          <Clock className="w-3 h-3 text-[#2F54EB]" /> {table.reservationTime || 'Scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isCleaning && (
                  <div className="p-3 bg-[#F5F5F5] text-xs text-[#595959] rounded-sm mb-3.5 border border-[#D9D9D9] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8C8C8C] flex-shrink-0" />
                    <span>Table is currently being cleared & sanitized for next diners.</span>
                  </div>
                )}

                {isAvailable && (
                  <div className="p-3 bg-[#F0F7F3] text-xs text-[#2D5A44] rounded-sm mb-3.5 border border-[#C4E2D2] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2D5A44] flex-shrink-0" />
                    <span>Table is spotless and ready for immediate walk-in guests.</span>
                  </div>
                )}

                {table.notes && (
                  <div className="text-[11px] text-[#73706B] bg-[#FAF8F5] px-2.5 py-1.5 rounded-xs border-l-2 border-[#C8B282] italic mb-3.5 line-clamp-2">
                    "{table.notes}"
                  </div>
                )}
              </div>

              {/* Action Buttons - Neat & Symmetrical */}
              <div className="pt-3 border-t border-[#E5E2DA] flex items-center gap-2">
                {/* Take Order in POS Button */}
                <button
                  type="button"
                  onClick={() => onOpenInPos(table.tableNumber)}
                  className="flex-1 py-2 px-3 bg-[#0b1221] hover:bg-[#1a2333] text-white text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 rounded-xs shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#C8B282] flex-shrink-0" />
                  <span className="truncate">Open in POS</span>
                </button>

                {/* Primary Action Button */}
                {isAvailable && (
                  <button
                    type="button"
                    onClick={() => handleOpenSeatingModal(table)}
                    className="py-2 px-3 bg-[#2D5A44] hover:bg-[#244736] text-white text-[11px] font-bold uppercase tracking-wider transition-colors rounded-xs shadow-xs flex-shrink-0"
                  >
                    Seat Guest
                  </button>
                )}

                {(isOccupied || isCleaning) && (
                  <button
                    type="button"
                    onClick={() => handleClearTable(table.id)}
                    className="py-2 px-3 bg-[#FAF8F5] hover:bg-[#F0EDE6] text-[#73706B] border border-[#E5E2DA] text-[11px] font-bold uppercase tracking-wider transition-colors rounded-xs flex-shrink-0"
                  >
                    Free Table
                  </button>
                )}

                {/* Quick Edit Status */}
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(table)}
                  title="Update Table Status"
                  className="p-2 border border-[#E5E2DA] bg-[#FAF8F5] text-[#73706B] hover:text-[#1A1A1A] hover:bg-[#F0EDE6] transition-colors rounded-xs flex items-center justify-center flex-shrink-0"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: SEAT WALK-IN GUEST */}
      {seatingModalTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E5E2DA] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Seat Diners at {seatingModalTable.tableNumber}
                </h3>
                <p className="text-xs text-[#73706B]">
                  {seatingModalTable.floor} • Capacity: {seatingModalTable.seats} Seats
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSeatingModalTable(null)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                  Guest or Party Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alhaji Sanusi Gusau"
                  value={walkInGuestName}
                  onChange={(e) => setWalkInGuestName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                    Number of Diners
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={seatingModalTable.seats + 2}
                    value={walkInPartySize}
                    onChange={(e) => setWalkInPartySize(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                    Assigned Server
                  </label>
                  <input
                    type="text"
                    value={walkInServer}
                    onChange={(e) => setWalkInServer(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="button"
                onClick={() => handleConfirmSeating(false)}
                className="flex-1 py-2.5 bg-[#FAF8F5] hover:bg-[#F0EDE6] text-[#1A1A1A] border border-[#E5E2DA] text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Mark Table Occupied
              </button>
              <button
                type="button"
                onClick={() => handleConfirmSeating(true)}
                className="flex-1 py-2.5 bg-[#2D5A44] hover:bg-[#244736] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Seat & Open POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE TABLE STATUS */}
      {statusModalTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E5E2DA] max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                  Update {statusModalTable.tableNumber}
                </h3>
                <p className="text-xs text-[#73706B]">{statusModalTable.floor}</p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalTable(null)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                  Change Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Available', 'Occupied', 'Reserved', 'Cleaning'] as TableStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`py-2 px-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                        newStatus === st
                          ? 'bg-[#0b1221] text-white border-[#0b1221]'
                          : 'bg-[#FAF8F5] text-[#73706B] border-[#E5E2DA] hover:border-[#1A1A1A]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Optional table or guest notes..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs focus:outline-none focus:border-[#0b1221]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#E5E2DA]">
              <button
                type="button"
                onClick={() => setStatusModalTable(null)}
                className="px-4 py-2 bg-[#FAF8F5] text-[#73706B] text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="flex-1 py-2 bg-[#0b1221] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1a2333]"
              >
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW TABLE */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddTable} className="bg-white border border-[#E5E2DA] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Add Table to Floor Plan
                </h3>
                <p className="text-xs text-[#73706B]">Configure table number, floor, seats and shape</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTableModalOpen(false)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                  Table Number / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table G-07 or Table F-04"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                    Floor Level *
                  </label>
                  <select
                    value={newTableFloor}
                    onChange={(e) => setNewTableFloor(e.target.value as TableFloor)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                  >
                    <option value="Ground Floor">Ground Floor (Target: 20 Seats)</option>
                    <option value="First Floor">First Floor (Target: 10 Seats)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                    Number of Seats *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={newTableSeats}
                    onChange={(e) => setNewTableSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#0b1221]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                  Table Style / Shape
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['rectangular', 'round', 'booth'] as TableShape[]).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => setNewTableShape(shape)}
                      className={`py-1.5 px-2 text-xs font-bold uppercase tracking-wider border capitalize transition-colors ${
                        newTableShape === shape
                          ? 'bg-[#0b1221] text-white border-[#0b1221]'
                          : 'bg-[#FAF8F5] text-[#73706B] border-[#E5E2DA]'
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#73706B] block mb-1">
                  Location / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Window side, Near entrance, Terrace view"
                  value={newTableNotes}
                  onChange={(e) => setNewTableNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DA] text-xs focus:outline-none focus:border-[#0b1221]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="button"
                onClick={() => setIsAddTableModalOpen(false)}
                className="px-4 py-2.5 bg-[#FAF8F5] text-[#73706B] text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#2D5A44] hover:bg-[#244736] text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Add Table to Floor
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
