import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Mail, Phone, Calendar, Shield, BadgeCheck, X, Check, Search, Filter } from 'lucide-react';
import { Employee } from '../types';

interface StaffManagementViewProps {
  currentUser: {
    id: string;
    username: string;
    role: 'admin' | 'customer';
    employeeRole?: string;
  };
  triggerToast: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
}

export default function StaffManagementView({ currentUser, triggerToast }: StaffManagementViewProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  // Add/Edit employee form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'Super Admin' | 'Manager' | 'Receptionist' | 'Chef' | 'Housekeeping Staff'>('Housekeeping Staff');
  const [status, setStatus] = useState<'Active' | 'On-Leave'>('Active');
  const [assignedArea, setAssignedArea] = useState('');

  // Check if current user has employee permission block (Super Admin or Manager can modify staff directory)
  const isSuperAdminOrManager = !currentUser.employeeRole || currentUser.employeeRole === 'Super Admin' || currentUser.employeeRole === 'Manager';

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      } else {
        const errorData = await res.json();
        console.error('Error fetching employees:', errorData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRole('Housekeeping Staff');
    setStatus('Active');
    setAssignedArea('');
    setEditingEmployee(null);
  };

  const startEdit = (emp: Employee) => {
    if (!isSuperAdminOrManager) {
      triggerToast('Permission Denied', 'Only Managers and Super Admins hold staff modification clearances.', 'error');
      return;
    }
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setRole(emp.role);
    setStatus(emp.status);
    setAssignedArea(emp.assignedArea || '');
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      triggerToast('Validation Error', 'Please fill out all mandatory description parameters.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = { name, email, phone, role, status, assignedArea };
      
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerToast(
          editingEmployee ? 'Profile Updated' : 'Staff Registered',
          editingEmployee ? `Employee ${name}'s parameters have been revised.` : `New profile created for ${name} as ${role}.`,
          'success'
        );
        setShowAddModal(false);
        resetForm();
        fetchEmployees();
      } else {
        const err = await res.json();
        triggerToast('Action Failed', err.error || 'Server rejected employee request', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Network Error', 'Could not establish connection to the management server.', 'error');
    }
  };

  const handleDelete = async (id: string, empName: string) => {
    if (!isSuperAdminOrManager) {
      triggerToast('Permission Denied', 'Only Managers and Super Admins hold staff deletion clearances.', 'error');
      return;
    }
    if (!window.confirm(`Are you absolutely sure you want to remove the employee record for "${empName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        triggerToast('Employee Deleted', `Successfully deleted the staff ledger of ${empName}.`, 'success');
        fetchEmployees();
      } else {
        const err = await res.json();
        triggerToast('Deletion Failed', err.error || 'Failed to remove employee.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleIcon = (empRole: string) => {
    switch (empRole) {
      case 'Super Admin':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'Manager':
        return <BadgeCheck className="w-4 h-4 text-amber-400" />;
      case 'Receptionist':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'Chef':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'Housekeeping Staff':
        return <Shield className="w-4 h-4 text-teal-400" />;
      default:
        return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || emp.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100" id="staff_management_view_wrapper">
      {/* Upper header action controller */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950/60 p-6 rounded-2xl border border-slate-900 shadow-md">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-amber-500" />
            Enterprise Staff Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure system access control credentials, assign sub-roles, and manage operations permissions.
          </p>
        </div>
        <div>
          {isSuperAdminOrManager ? (
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all duration-200 text-xs tracking-wide flex items-center gap-2 shadow-md hover:scale-[1.02] focus:scale-1"
              id="add_new_employee_button"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              ADD NEW EMPLOYEE
            </button>
          ) : (
            <div className="text-[11px] py-1 px-3 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
              Mode: Read-Only (Permit: Receptionist/Staff)
            </div>
          )}
        </div>
      </div>

      {/* Directory search filter toolbar */}
      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 flex flex-col md:flex-row gap-3 items-center justify-between" id="staff_directory_filters_bar">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or EMP ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 text-slate-200 pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:border-amber-500/80 transition-colors placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-[11px] text-slate-400 mr-2 shrink-0">Filter Role:</span>
          {['all', 'Super Admin', 'Manager', 'Receptionist', 'Chef', 'Housekeeping Staff'].map(r => (
            <button
              key={r}
              onClick={() => setSelectedRoleFilter(r)}
              className={`py-1 px-3 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all shrink-0 ${
                selectedRoleFilter === r 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-slate-950/20 rounded-xl border border-slate-900/50">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-4" />
          <p className="text-xs text-slate-400 font-medium">Syncing employee ledgers with the secure container...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="employees_cards_grid">
          {filteredEmployees.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-950/20 rounded-2xl border border-slate-900 flex flex-col items-center justify-center">
              <Shield className="w-12 h-12 text-slate-700 stroke-[1.5] mb-2" />
              <p className="text-xs text-slate-400 font-bold font-display">No Employee Records Match Your Query</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Please check your filters or register a new staff employee</p>
            </div>
          ) : (
            filteredEmployees.map(emp => (
              <div 
                key={emp.id} 
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/60 transition-all duration-300 shadow-md group relative overflow-hidden"
              >
                {/* Background decorative shine */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors" />

                {/* Card header with code credentials and actions */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold py-0.5 px-2 rounded bg-slate-900 border border-slate-800 text-amber-500 tracking-wide uppercase">
                      {emp.employeeId}
                    </span>
                    <h3 className="text-sm font-bold font-display tracking-tight text-white mt-2 group-hover:text-amber-400 transition-colors">
                      {emp.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    {isSuperAdminOrManager && (
                      <>
                        <button
                          onClick={() => startEdit(emp)}
                          className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-all hover:scale-105"
                          title="Edit employee parameters"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {emp.role !== 'Super Admin' && (
                          <button
                            onClick={() => handleDelete(emp.id, emp.name)}
                            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-all hover:scale-105"
                            title="Delete employee profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Details layout */}
                <div className="space-y-2 text-[11px] text-slate-300 border-t border-b border-slate-900 py-3.5 mb-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{emp.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Entered: {emp.joiningDate}</span>
                  </div>
                  {emp.assignedArea && (
                    <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-300 mt-1">
                      <strong className="text-amber-500/80">Duty:</strong> {emp.assignedArea}
                    </div>
                  )}
                </div>

                {/* Badges footer */}
                <div className="flex items-center justify-between gap-2 pt-1 font-mono">
                  <div className="flex items-center gap-1">
                    {getRoleIcon(emp.role)}
                    <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-300">
                      {emp.role}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold py-0.5 px-2 rounded-full border ${
                    emp.status === 'Active' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {emp.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Adding / Editing Modal Dialog pop up */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-4">
              <h3 className="text-base font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-500" />
                {editingEmployee ? 'Edit Staff Credentials' : 'Register New Employee'}
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Anand Sharma"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. anand@amberroyale.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Business Role</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Chef">Chef</option>
                    <option value="Housekeeping Staff">Housekeeping Staff</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Duty Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="On-Leave">On-Leave</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Assigned Area or Duty details (Optional)</label>
                <input
                  type="text"
                  value={assignedArea}
                  onChange={(e) => setAssignedArea(e.target.value)}
                  placeholder="e.g. Luxury Penthouse Suite Cleanliness or Kitchen Main Desks"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 text-slate-100"
                />
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-400">
                ⚠️ Note: Creating a staff member will automatically provision a system account. Staff password defaults to: <strong className="text-slate-200">staff123</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="py-2 px-4 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-bold border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold tracking-wide flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
