import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { 
  Users, 
  KeyRound, 
  ShieldCheck, 
  X, 
  Check, 
  Lock, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface QuickStaffSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: UserProfile[];
  currentStaffId?: string;
  onSelectStaff: (staff: UserProfile) => void;
}

export const QuickStaffSwitchModal: React.FC<QuickStaffSwitchModalProps> = ({
  isOpen,
  onClose,
  staffList,
  currentStaffId,
  onSelectStaff
}) => {
  const [selectedStaff, setSelectedStaff] = useState<UserProfile | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectStaff = (staff: UserProfile) => {
    setSelectedStaff(staff);
    setEnteredPin('');
    setErrorMsg(null);
  };

  const handlePinInput = (digit: string) => {
    if (enteredPin.length < 4) {
      const newPin = enteredPin + digit;
      setEnteredPin(newPin);
      setErrorMsg(null);

      // Auto-verify if 4 digits
      if (newPin.length === 4 && selectedStaff) {
        verifyPin(newPin, selectedStaff);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const verifyPin = (pinToTest: string, staff: UserProfile) => {
    if (!staff.pin || staff.pin === pinToTest) {
      onSelectStaff(staff);
      onClose();
    } else {
      setErrorMsg('Incorrect 4-digit PIN. Please try again.');
      setEnteredPin('');
    }
  };

  const handleDirectSwitchWithoutPin = (staff: UserProfile) => {
    onSelectStaff(staff);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E2DA] max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-[#1A1A1A] text-white flex items-center justify-between border-b border-[#333333]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#C8B282] text-[#1A1A1A]">
                Rapid POS Terminal
              </span>
              <span className="text-xs text-[#A8A29E] flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-[#C8B282]" /> Staff Quick Switch
              </span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C8B282]" />
              Select Operating Staff Member
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {!selectedStaff ? (
            /* Step 1: Pick Staff Member */
            <div>
              <p className="text-xs text-[#73706B] mb-4">
                Choose your name from the active staff roster to switch duties:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {staffList.filter(s => s.status !== 'Suspended').map(staff => {
                  const isCurrent = staff.id === currentStaffId;
                  return (
                    <button
                      key={staff.id}
                      onClick={() => handleSelectStaff(staff)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        isCurrent 
                          ? 'border-[#C8B282] bg-[#FAF7F0] ring-1 ring-[#C8B282]' 
                          : 'border-[#E5E2DA] hover:border-[#C8B282] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                        style={{ backgroundColor: staff.avatarColor || '#1A1A1A' }}
                      >
                        {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#1A1A1A] truncate">{staff.name}</div>
                        <div className="text-[10px] text-[#73706B] truncate">{staff.role}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${staff.isOnDuty ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                          <span className="text-[9px] font-semibold text-[#73706B] uppercase">
                            {staff.isOnDuty ? 'On Duty' : 'Off Shift'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Step 2: 4-Digit PIN Pad */
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DA]">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: selectedStaff.avatarColor || '#1A1A1A' }}
                  >
                    {selectedStaff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A]">{selectedStaff.name}</h4>
                    <span className="text-[11px] text-[#73706B]">{selectedStaff.role} &bull; {selectedStaff.staffId}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="text-xs text-[#73706B] hover:text-[#1A1A1A] underline"
                >
                  Change User
                </button>
              </div>

              {/* PIN Dots */}
              <div className="text-center">
                <label className="block text-xs font-bold text-[#73706B] uppercase mb-2">
                  Enter 4-Digit Security PIN (Default: {selectedStaff.pin})
                </label>
                <div className="flex justify-center gap-3 my-2">
                  {[0, 1, 2, 3].map(idx => (
                    <div 
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        idx < enteredPin.length
                          ? 'bg-[#1A1A1A] border-[#1A1A1A] scale-110'
                          : 'border-[#D5D2C9] bg-white'
                      }`}
                    />
                  ))}
                </div>
                {errorMsg && (
                  <div className="text-xs font-bold text-rose-600 flex items-center justify-center gap-1 mt-2 animate-shake">
                    <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                  </div>
                )}
              </div>

              {/* PIN Keyboard */}
              <div className="max-w-[240px] mx-auto grid grid-cols-3 gap-2.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                  <button
                    key={digit}
                    onClick={() => handlePinInput(digit)}
                    className="h-12 rounded-xl bg-[#FAF9F5] hover:bg-[#EAE8E2] border border-[#E5E2DA] font-bold text-lg text-[#1A1A1A] transition-colors shadow-xs active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={() => setEnteredPin('')}
                  className="h-12 rounded-xl bg-[#FAF9F5] hover:bg-rose-50 hover:text-rose-700 border border-[#E5E2DA] text-xs font-bold text-[#73706B] transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => handlePinInput('0')}
                  className="h-12 rounded-xl bg-[#FAF9F5] hover:bg-[#EAE8E2] border border-[#E5E2DA] font-bold text-lg text-[#1A1A1A] transition-colors shadow-xs active:scale-95"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="h-12 rounded-xl bg-[#FAF9F5] hover:bg-[#EAE8E2] border border-[#E5E2DA] text-xs font-bold text-[#73706B] transition-colors"
                >
                  ⌫
                </button>
              </div>

              {/* Fast Bypass for Prototype Ease */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleDirectSwitchWithoutPin(selectedStaff)}
                  className="text-xs text-[#8C7642] hover:text-[#1A1A1A] font-semibold underline"
                >
                  Quick Unlock (Bypass PIN for Prototype)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
