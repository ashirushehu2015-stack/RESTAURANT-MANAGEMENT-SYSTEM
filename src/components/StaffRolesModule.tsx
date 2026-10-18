import React, { useState } from 'react';
import type { UserProfile, UserRole } from '../types';
import { 
  INITIAL_STAFF, 
  ROLE_DETAILS, 
  AVAILABLE_PERMISSIONS,
  type RoleDetail,
  type PermissionDefinition
} from '../data/staffData';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  KeyRound, 
  Clock, 
  Building2, 
  Check, 
  X, 
  AlertCircle, 
  Download, 
  Phone, 
  Mail, 
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
  UserPlus
} from 'lucide-react';

interface StaffRolesModuleProps {
  currentCashierName?: string;
  onSwitchUser?: (staff: UserProfile) => void;
}

type StaffTab = 'directory' | 'matrix' | 'shifts';

export const StaffRolesModule: React.FC<StaffRolesModuleProps> = ({
  currentCashierName = 'Prototype Cashier',
  onSwitchUser
}) => {
  const [activeTab, setActiveTab] = useState<StaffTab>('directory');

  // Load Staff List from localStorage or default to INITIAL_STAFF
  const [staffList, setStaffList] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('fulbe_restaurant_staff');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading staff', e);
    }
    return INITIAL_STAFF;
  });

  const saveStaffList = (newList: UserProfile[]) => {
    setStaffList(newList);
    try {
      localStorage.setItem('fulbe_restaurant_staff', JSON.stringify(newList));
    } catch (e) {
      console.error('Error saving staff', e);
    }
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State for Add / Edit Staff
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Waitstaff');
  const [formDept, setFormDept] = useState('Floor Dining Service');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPin, setFormPin] = useState('1234');
  const [formShift, setFormShift] = useState<'Morning (07:00 - 15:00)' | 'Evening (15:00 - 23:00)' | 'Night (23:00 - 07:00)' | 'Flexible'>('Morning (07:00 - 15:00)');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#1A1A1A');

  // Reset PIN Modal State
  const [pinResetModal, setPinResetModal] = useState<{ isOpen: boolean; staff: UserProfile | null; newPin: string }>({
    isOpen: false,
    staff: null,
    newPin: ''
  });

  // Filtered staff list
  const filteredStaff = staffList.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = departmentFilter === 'All' || s.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || (s.status || 'Active') === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Departments List
  const departments = ['All', ...Array.from(new Set(staffList.map(s => s.department)))];

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormName('');
    setFormRole('Waitstaff');
    setFormDept('Floor Dining Service');
    setFormEmail('');
    setFormPhone('');
    setFormPin('1234');
    setFormShift('Morning (07:00 - 15:00)');
    setFormDescription('');
    setFormColor('#2563EB');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (staff: UserProfile) => {
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormRole(staff.role);
    setFormDept(staff.department);
    setFormEmail(staff.email);
    setFormPhone(staff.phoneNumber || '');
    setFormPin(staff.pin || '1234');
    setFormShift(staff.shift || 'Morning (07:00 - 15:00)');
    setFormDescription(staff.description || '');
    setFormColor(staff.avatarColor || '#1A1A1A');
    setIsFormModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveStaffForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingStaff) {
      // Update existing
      const updated = staffList.map(s => {
        if (s.id === editingStaff.id) {
          return {
            ...s,
            name: formName,
            role: formRole,
            department: formDept,
            email: formEmail,
            phoneNumber: formPhone,
            pin: formPin,
            shift: formShift,
            description: formDescription,
            avatarColor: formColor
          };
        }
        return s;
      });
      saveStaffList(updated);
    } else {
      // Create new
      const nextId = `usr-${Date.now().toString().slice(-4)}`;
      const nextStaffId = `STF-2026-${String(staffList.length + 1).padStart(3, '0')}`;
      const roleDef = ROLE_DETAILS.find(r => r.role === formRole);

      const newStaff: UserProfile = {
        id: nextId,
        staffId: nextStaffId,
        name: formName,
        role: formRole,
        department: formDept,
        email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '.')}@fulberestaurant.com`,
        phoneNumber: formPhone,
        avatarColor: formColor,
        description: formDescription || `${formRole} at ${formDept}`,
        pin: formPin || '1234',
        status: 'Active',
        shift: formShift,
        isOnDuty: true,
        dateJoined: new Date().toISOString().split('T')[0],
        permissions: roleDef ? roleDef.defaultPermissions : []
      };

      saveStaffList([...staffList, newStaff]);
    }

    setIsFormModalOpen(false);
  };

  // Toggle On-Duty
  const handleToggleOnDuty = (staffId: string) => {
    const updated = staffList.map(s => {
      if (s.id === staffId) {
        return { ...s, isOnDuty: !s.isOnDuty };
      }
      return s;
    });
    saveStaffList(updated);
  };

  // Toggle Status (Active / On Leave / Suspended)
  const handleChangeStatus = (staffId: string, status: 'Active' | 'On Leave' | 'Suspended') => {
    const updated = staffList.map(s => {
      if (s.id === staffId) {
        return { ...s, status };
      }
      return s;
    });
    saveStaffList(updated);
  };

  // Save Reset PIN
  const handleSavePinReset = () => {
    if (!pinResetModal.staff || pinResetModal.newPin.length !== 4) return;
    const updated = staffList.map(s => {
      if (s.id === pinResetModal.staff?.id) {
        return { ...s, pin: pinResetModal.newPin };
      }
      return s;
    });
    saveStaffList(updated);
    setPinResetModal({ isOpen: false, staff: null, newPin: '' });
  };

  // Export Staff Directory to CSV
  const handleExportCSV = () => {
    const rows = [
      ['FULBE RESTAURANT - OFFICIAL STAFF DIRECTORY & ROSTER'],
      ['Generated On', new Date().toLocaleString()],
      ['Total Headcount', staffList.length],
      [''],
      ['STAFF ID', 'FULL NAME', 'OPERATIONAL ROLE', 'DEPARTMENT', 'PHONE', 'EMAIL', 'SHIFT', 'STATUS', 'ON DUTY']
    ];

    staffList.forEach(s => {
      rows.push([
        s.staffId,
        s.name,
        s.role,
        s.department,
        s.phoneNumber || 'N/A',
        s.email,
        s.shift || 'Flexible',
        s.status || 'Active',
        s.isOnDuty ? 'YES' : 'NO'
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fulbe_Staff_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-[#1A1A1A]">
      {/* TOP HEADER RIBBON */}
      <div className="bg-[#1A1A1A] text-white p-6 rounded-xl shadow-lg border border-[#333333] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#C8B282] text-[#1A1A1A]">
              Administration & HR
            </span>
            <span className="text-xs text-[#A8A29E] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C8B282]" /> Role-Based Access Control (RBAC)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-[#C8B282]" />
            Staff Directory & Role-Based Access Control
          </h1>
          <p className="text-xs text-[#A8A29E] mt-1 max-w-2xl">
            Configure employee roles, granular permissions, fast POS 4-digit PINs, and shift schedules for seamless dining and kitchen operations.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#262626] border border-[#404040] hover:bg-[#333333] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-[#C8B282]" />
            Export Staff CSV
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#C8B282] hover:bg-[#B39D6D] text-[#1A1A1A] text-xs font-bold rounded-lg transition-colors shadow-md uppercase tracking-wider"
          >
            <UserPlus className="w-4 h-4 text-[#1A1A1A]" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#73706B] uppercase tracking-wider">Total Headcount</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F0] flex items-center justify-center text-[#C8B282]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1A1A1A]">{staffList.length} Personnel</div>
          <div className="text-[11px] text-[#73706B] mt-1">
            Across {departments.length - 1} operational departments
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#73706B] uppercase tracking-wider">On Active Duty</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800">
            {staffList.filter(s => s.isOnDuty).length} Staff On Duty
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Active on Dining Floor & Kitchen
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#73706B] uppercase tracking-wider">Operational Roles</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF5FF] flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1A1A1A]">{ROLE_DETAILS.length} Configured</div>
          <div className="text-[11px] text-[#73706B] mt-1">
            General Manager to Floor Waitstaff
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#73706B] uppercase tracking-wider">Active Terminal Operator</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F0] flex items-center justify-center text-[#C8B282]">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-[#1A1A1A] truncate">{currentCashierName}</div>
          <div className="text-[11px] text-[#8C7642] font-semibold mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Quick Switch Ready
          </div>
        </div>
      </div>

      {/* INTERNAL TABS: DIRECTORY vs. MATRIX vs. SHIFTS */}
      <div className="flex border-b border-[#E5E2DA] gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 flex items-center gap-2 transition-all relative ${
            activeTab === 'directory' 
              ? 'text-[#1A1A1A] border-b-2 border-[#C8B282] font-bold' 
              : 'text-[#73706B] hover:text-[#1A1A1A]'
          }`}
        >
          <Users className="w-4 h-4 text-[#C8B282]" />
          Staff Directory & Profiles ({staffList.length})
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 flex items-center gap-2 transition-all relative ${
            activeTab === 'matrix' 
              ? 'text-[#1A1A1A] border-b-2 border-[#C8B282] font-bold' 
              : 'text-[#73706B] hover:text-[#1A1A1A]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#C8B282]" />
          Role Permissions Matrix
        </button>

        <button
          onClick={() => setActiveTab('shifts')}
          className={`pb-3 flex items-center gap-2 transition-all relative ${
            activeTab === 'shifts' 
              ? 'text-[#1A1A1A] border-b-2 border-[#C8B282] font-bold' 
              : 'text-[#73706B] hover:text-[#1A1A1A]'
          }`}
        >
          <Clock className="w-4 h-4 text-[#C8B282]" />
          Shift Roster & Floor Allocation
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STAFF DIRECTORY & PROFILES                                        */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* SEARCH & FILTER CONTROLS */}
          <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#73706B]" />
              <input
                type="text"
                placeholder="Search staff by name, ID, or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-xs focus:outline-none focus:border-[#C8B282]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#73706B] font-semibold">Department:</span>
                <select
                  value={departmentFilter}
                  onChange={e => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-xs font-medium focus:outline-none focus:border-[#C8B282]"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#73706B] font-semibold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-xs font-medium focus:outline-none focus:border-[#C8B282]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* STAFF TABLE */}
          <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-[#E5E2DA]">
                <thead className="bg-[#1A1A1A] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee & ID</th>
                    <th className="py-3 px-3">Role & Department</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Assigned Shift</th>
                    <th className="py-3 px-3 text-center">Duty Status</th>
                    <th className="py-3 px-3 text-center">Account Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DA]">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#73706B]">
                        No staff members found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map(staff => {
                      const roleDef = ROLE_DETAILS.find(r => r.role === staff.role);
                      const isCurrentOperating = staff.name === currentCashierName;

                      return (
                        <tr key={staff.id} className="hover:bg-[#FAF9F5] transition-colors">
                          {/* Name & ID */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
                                style={{ backgroundColor: staff.avatarColor || '#1A1A1A' }}
                              >
                                {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-[#1A1A1A] flex items-center gap-2">
                                  {staff.name}
                                  {isCurrentOperating && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FAF5EA] text-[#8C7642] border border-[#C8B282]/40">
                                      Active Operator
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-[#73706B] font-semibold">{staff.staffId}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role & Dept */}
                          <td className="py-3.5 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              roleDef?.badgeBg || 'bg-gray-100'
                            } ${roleDef?.badgeColor || 'text-gray-800'}`}>
                              {staff.role}
                            </span>
                            <div className="text-[11px] text-[#73706B] mt-0.5">{staff.department}</div>
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-3">
                            <div className="text-[11px] text-[#1A1A1A] font-medium flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#73706B]" /> {staff.phoneNumber || '—'}
                            </div>
                            <div className="text-[10px] text-[#73706B] truncate max-w-[160px] mt-0.5 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-[#73706B]" /> {staff.email}
                            </div>
                          </td>

                          {/* Shift */}
                          <td className="py-3.5 px-3">
                            <span className="font-medium text-[#1A1A1A]">{staff.shift || 'Flexible'}</span>
                            <div className="text-[10px] text-[#73706B]">PIN: ••••</div>
                          </td>

                          {/* On-Duty Toggle */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => handleToggleOnDuty(staff.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 mx-auto ${
                                staff.isOnDuty 
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                  : 'bg-gray-100 text-[#73706B] hover:bg-gray-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${staff.isOnDuty ? 'bg-emerald-600' : 'bg-gray-400'}`} />
                              {staff.isOnDuty ? 'On Duty' : 'Off Shift'}
                            </button>
                          </td>

                          {/* Account Status */}
                          <td className="py-3.5 px-3 text-center">
                            <select
                              value={staff.status || 'Active'}
                              onChange={e => handleChangeStatus(staff.id, e.target.value as any)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border focus:outline-none ${
                                staff.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : staff.status === 'On Leave'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              <option value="Active">Active</option>
                              <option value="On Leave">On Leave</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Fast Switch User */}
                              {onSwitchUser && (
                                <button
                                  onClick={() => onSwitchUser(staff)}
                                  title="Switch Terminal Operator to this staff member"
                                  className="p-1.5 text-[#73706B] hover:text-[#C8B282] hover:bg-[#FAF7F0] rounded transition-colors"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Reset PIN */}
                              <button
                                onClick={() => setPinResetModal({ isOpen: true, staff, newPin: '' })}
                                title="Change 4-digit PIN"
                                className="p-1.5 text-[#73706B] hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Profile */}
                              <button
                                onClick={() => handleOpenEditModal(staff)}
                                title="Edit staff profile"
                                className="p-1.5 text-[#73706B] hover:text-[#1A1A1A] hover:bg-[#FAF9F5] rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLE PERMISSIONS MATRIX                                           */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm">
            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-[#C8B282]" />
              Role-Based Access Control (RBAC) Permissions Matrix
            </h3>
            <p className="text-xs text-[#73706B] mb-5">
              Inspect authority boundaries across Food & Beverage operations, front POS cash till, inventory requisitions, and financial accounting.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1A1A1A] text-white uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 w-72">Permission Domain / Feature</th>
                    {ROLE_DETAILS.map(r => (
                      <th key={r.role} className="py-3 px-3 text-center">
                        <div className="font-bold text-white whitespace-nowrap">{r.displayName.split('/')[0]}</div>
                        <div className="text-[9px] text-[#C8B282] font-normal">{r.department.split('&')[0]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DA]">
                  {/* Group permissions by category */}
                  {Array.from(new Set(AVAILABLE_PERMISSIONS.map(p => p.category))).map(cat => {
                    const permsInCat = AVAILABLE_PERMISSIONS.filter(p => p.category === cat);
                    return (
                      <React.Fragment key={cat}>
                        <tr className="bg-[#FAF7F0] font-bold text-[#1A1A1A]">
                          <td colSpan={ROLE_DETAILS.length + 1} className="py-2 px-4 uppercase text-[10px] text-[#8C7642] tracking-wider">
                            {cat}
                          </td>
                        </tr>
                        {permsInCat.map(perm => (
                          <tr key={perm.id} className="hover:bg-[#FAF9F5]">
                            <td className="py-2.5 px-4 font-medium pl-6">
                              <div className="text-[#1A1A1A] font-bold">{perm.name}</div>
                              <div className="text-[10px] text-[#73706B]">{perm.description}</div>
                            </td>
                            {ROLE_DETAILS.map(r => {
                              const hasPermission = r.defaultPermissions.includes(perm.id);
                              return (
                                <td key={r.role} className="py-2.5 px-3 text-center">
                                  {hasPermission ? (
                                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                                      <Check className="w-3.5 h-3.5" />
                                    </span>
                                  ) : (
                                    <span className="text-[#D5D2C9] text-sm">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHIFT ROSTER & FLOOR ALLOCATION                                   */}
      {/* ========================================================================= */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Morning Shift */}
            <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden">
              <div className="p-4 bg-[#FAF7F0] border-b border-[#E5E2DA] flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#C8B282]" />
                    Morning Shift
                  </h4>
                  <span className="text-[10px] text-[#73706B] font-semibold">07:00 AM – 03:00 PM (Breakfast & Lunch)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF5EA] text-[#8C7642] border border-[#C8B282]/30">
                  {staffList.filter(s => (s.shift || '').includes('Morning')).length} Assigned
                </span>
              </div>
              <div className="p-4 space-y-3">
                {staffList.filter(s => (s.shift || '').includes('Morning')).map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF9F5] border border-[#E5E2DA]">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                        style={{ backgroundColor: s.avatarColor || '#1A1A1A' }}
                      >
                        {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-[#1A1A1A]">{s.name}</div>
                        <div className="text-[10px] text-[#73706B]">{s.role}</div>
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${s.isOnDuty ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Evening Shift */}
            <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden">
              <div className="p-4 bg-[#FAF7F0] border-b border-[#E5E2DA] flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Evening Shift
                  </h4>
                  <span className="text-[10px] text-[#73706B] font-semibold">03:00 PM – 11:00 PM (Dinner & Lounge)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF5EA] text-[#8C7642] border border-[#C8B282]/30">
                  {staffList.filter(s => (s.shift || '').includes('Evening')).length} Assigned
                </span>
              </div>
              <div className="p-4 space-y-3">
                {staffList.filter(s => (s.shift || '').includes('Evening')).map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF9F5] border border-[#E5E2DA]">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                        style={{ backgroundColor: s.avatarColor || '#1A1A1A' }}
                      >
                        {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-[#1A1A1A]">{s.name}</div>
                        <div className="text-[10px] text-[#73706B]">{s.role}</div>
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${s.isOnDuty ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Flexible / Night Shift */}
            <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden">
              <div className="p-4 bg-[#FAF7F0] border-b border-[#E5E2DA] flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    Flexible & Management
                  </h4>
                  <span className="text-[10px] text-[#73706B] font-semibold">General Oversight & Audit Duty</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF5EA] text-[#8C7642] border border-[#C8B282]/30">
                  {staffList.filter(s => !(s.shift || '').includes('Morning') && !(s.shift || '').includes('Evening')).length} Assigned
                </span>
              </div>
              <div className="p-4 space-y-3">
                {staffList.filter(s => !(s.shift || '').includes('Morning') && !(s.shift || '').includes('Evening')).map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF9F5] border border-[#E5E2DA]">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                        style={{ backgroundColor: s.avatarColor || '#1A1A1A' }}
                      >
                        {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-[#1A1A1A]">{s.name}</div>
                        <div className="text-[10px] text-[#73706B]">{s.role}</div>
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${s.isOnDuty ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT STAFF MEMBER                                           */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E5E2DA] max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-[#1A1A1A] text-white flex items-center justify-between border-b border-[#333333]">
              <div>
                <h3 className="text-base font-bold text-[#C8B282]">
                  {editingStaff ? 'Edit Staff Profile' : 'Register New Staff Member'}
                </h3>
                <p className="text-xs text-[#A8A29E]">
                  Configure role assignments, contact details, and POS PIN access.
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffForm} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-[#73706B] uppercase mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ibrahim Danladi"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-xs font-medium focus:outline-none focus:border-[#C8B282]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#73706B] uppercase mb-1">
                    Operational Role *
                  </label>
                  <select
                    value={formRole}
                    onChange={e => {
                      const r = e.target.value as UserRole;
                      setFormRole(r);
                      const def = ROLE_DETAILS.find(item => item.role === r);
                      if (def) setFormDept(def.department);
                    }}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-xs font-medium focus:outline-none focus:border-[#C8B282]"
                  >
                    {ROLE_DETAILS.map(r => (
                      <option key={r.role} value={r.role}>{r.displayName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#73706B] uppercase mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDept}
                    onChange={e => setFormDept(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-xs font-medium focus:outline-none focus:border-[#C8B282]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#73706B] uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="staff@fulberestaurant.com"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-xs font-medium focus:outline-none focus:border-[#C8B282]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#73706B] uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+234 801 234 5678"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-xs font-medium focus:outline-none focus:border-[#C8B282]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#73706B] uppercase mb-1">
                    4-Digit POS Quick PIN *
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="e.g. 5555"
                    value={formPin}
                    onChange={e => setFormPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-xs font-mono font-bold tracking-widest text-[#1A1A1A] focus:outline-none focus:border-[#C8B282]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#73706B] uppercase mb-1">
                    Assigned Shift Schedule
                  </label>
                  <select
                    value={formShift}
                    onChange={e => setFormShift(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-xs font-medium focus:outline-none focus:border-[#C8B282]"
                  >
                    <option value="Morning (07:00 - 15:00)">Morning (07:00 - 15:00)</option>
                    <option value="Evening (15:00 - 23:00)">Evening (15:00 - 23:00)</option>
                    <option value="Night (23:00 - 07:00)">Night (23:00 - 07:00)</option>
                    <option value="Flexible">Flexible / Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#73706B] uppercase mb-1">
                  Avatar Color
                </label>
                <div className="flex items-center gap-3">
                  {['#1A1A1A', '#8C4A27', '#059669', '#DC2626', '#2563EB', '#7C3AED', '#4F46E5', '#0D9488'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        formColor === color ? 'scale-125 border-[#C8B282]' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#73706B] uppercase mb-1">
                  Duties Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on assigned floor tables or kitchen duties..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-xs focus:outline-none focus:border-[#C8B282]"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E2DA] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#73706B] text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C8B282] hover:bg-[#B39D6D] text-[#1A1A1A] text-xs font-bold rounded-lg transition-colors shadow-sm uppercase tracking-wider"
                >
                  {editingStaff ? 'Save Changes' : 'Confirm & Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET 4-DIGIT PIN                                                  */}
      {/* ========================================================================= */}
      {pinResetModal.isOpen && pinResetModal.staff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E5E2DA] max-w-sm w-full p-6 text-[#1A1A1A] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DA]">
              <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C8B282]" />
                Reset 4-Digit Security PIN
              </h3>
              <button
                onClick={() => setPinResetModal({ isOpen: false, staff: null, newPin: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#73706B]">
              Enter a new 4-digit numeric PIN for <strong className="text-[#1A1A1A]">{pinResetModal.staff.name}</strong> ({pinResetModal.staff.role}):
            </p>

            <div>
              <input
                type="text"
                maxLength={4}
                autoFocus
                placeholder="4 digits (e.g. 9988)"
                value={pinResetModal.newPin}
                onChange={e => setPinResetModal(prev => ({ ...prev, newPin: e.target.value.replace(/\D/g, '') }))}
                className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#D5D2C9] rounded-lg text-center font-mono font-black text-lg tracking-widest text-[#1A1A1A] focus:outline-none focus:border-[#C8B282]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPinResetModal({ isOpen: false, staff: null, newPin: '' })}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#73706B] text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={pinResetModal.newPin.length !== 4}
                onClick={handleSavePinReset}
                className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] disabled:opacity-50 text-white text-xs font-bold rounded-lg uppercase tracking-wider"
              >
                Save New PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
