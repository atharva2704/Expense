'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell, ShellSection } from './app-shell';
import { Badge, Button, Card, EmptyState, Input, Modal, Select, SectionTitle, Textarea } from './ui';
import { api } from './api';
import { compactCurrency, fromPaise } from '../lib/money';
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square,
  Edit3,
  CircleDollarSign,
  Bell,
  MoveRight,
  Filter,
  Download,
  Upload,
  Save,
  Star,
  Repeat2,
  UserPlus,
  Users,
  Pencil,
  Archive,
  X,
  MoonStar,
  SunMedium
} from 'lucide-react';

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function isoLocal(dateStr, timeStr) {
  const date = dateStr || todayDate();
  const time = timeStr || nowTime();
  return new Date(`${date}T${time}:00`);
}

function fmtDateTime(value) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch {
    return String(value || '');
  }
}

function blankForm() {
  return {
    type: 'EXPENSE',
    personId: '',
    amount: '',
    itemPurpose: '',
    category: '',
    remarks: '',
    date: todayDate(),
    time: nowTime(),
    isPending: true
  };
}

function filterCounts(list) {
  return {
    expense: list.filter((x) => x.type === 'EXPENSE').length,
    payment: list.filter((x) => x.type === 'PAYMENT').length,
    pending: list.filter((x) => x.type === 'EXPENSE' && x.isPending).length
  };
}

function transactionTone(tx) {
  if (tx.type === 'PAYMENT') return 'green';
  if (tx.isPending) return 'yellow';
  return 'blue';
}

function transactionLabel(tx) {
  return tx.type === 'PAYMENT' ? 'Payment Received' : tx.isPending ? 'Pending' : 'Expense';
}

export function DashboardApp({ initialTab = 'dashboard' }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [boot, setBoot] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [people, setPeople] = useState([]);
  const [report, setReport] = useState(null);
  const [selected, setSelected] = useState([]);
  const [txFilters, setTxFilters] = useState({
    q: '',
    personId: '',
    category: '',
    status: 'all',
    type: 'all',
    from: '',
    to: ''
  });
  const [noteFilters, setNoteFilters] = useState({ q: '', type: 'all', unreadOnly: false });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editorForm, setEditorForm] = useState(blankForm());
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState('');
  const [personForm, setPersonForm] = useState({ id: '', name: '' });
  const [backupLoading, setBackupLoading] = useState(false);
  const [importMode, setImportMode] = useState('merge');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('gray');
  const QUICK_ITEMS = [
    { item: 'Tea', category: 'Food' },
    { item: 'Coffee', category: 'Food' },
    { item: 'Breakfast', category: 'Food' },
    { item: 'Lunch', category: 'Food' },
    { item: 'Dinner', category: 'Food' },
    { item: 'Snacks', category: 'Food' },
    { item: 'Fuel', category: 'Travel' },
    { item: 'Travel', category: 'Travel' },
    { item: 'Medicine', category: 'Health' },
    { item: 'Recharge', category: 'Utilities' }
  ];

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('expense-tracker-theme');
    const initial = stored || 'dark';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
    document.documentElement.classList.toggle('light', initial === 'light');
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('expense-tracker-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme, mounted]);

  async function loadBootstrap() {
    setLoading(true);
    try {
      const data = await api('/api/bootstrap');
      setBoot(data);
      setPeople(data.people || []);
      setFavorites(data.favorites || []);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setBalances(data.personBalances || []);
      setTransactions(data.recentTransactions || []);
      setReport(data.summary || null);
    } catch (err) {
      setMessage(err.message || 'Failed to load data');
      setMessageTone('red');
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions(filters = txFilters) {
    const params = new URLSearchParams();
    params.set('limit', '5000');
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== 'all' && value !== false && value != null) {
        params.set(key, String(value));
      }
    });
    const data = await api(`/api/transactions?${params.toString()}`);
    setTransactions(data.transactions || []);
    setBalances(data.balances || []);
  }

  async function loadNotifications(filters = noteFilters) {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.type && filters.type !== 'all') params.set('type', filters.type);
    if (filters.unreadOnly) params.set('unreadOnly', '1');
    const data = await api(`/api/notifications?${params.toString()}`);
    setNotifications(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
  }

  async function loadReport() {
    const data = await api('/api/reports/summary');
    setReport(data);
  }

  useEffect(() => {
    loadBootstrap();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => {
      if (activeTab === 'notifications') loadNotifications().catch(() => {});
      if (activeTab === 'reports') loadReport().catch(() => {});
      if (activeTab !== 'backup') {
        loadTransactions(txFilters).catch(() => {});
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab, mounted]);

  useEffect(() => {
    if (!mounted) return;
    setSelected([]);
    const timer = setTimeout(() => {
      loadTransactions(txFilters).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [txFilters, mounted]);

  useEffect(() => {
    if (!mounted || activeTab !== 'notifications') return;
    const timer = setTimeout(() => {
      loadNotifications(noteFilters).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [noteFilters, mounted, activeTab]);

  function showMessage(text, tone = 'gray') {
    setMessage(text);
    setMessageTone(tone);
    window.clearTimeout(window.__expenseTrackerMsgTimer);
    window.__expenseTrackerMsgTimer = window.setTimeout(() => setMessage(''), 3500);
  }

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  function openCreate(type = 'EXPENSE', preset = null) {
    setEditingTx(null);
    setEditorForm({
      ...blankForm(),
      type,
      ...preset,
      date: preset?.date || todayDate(),
      time: preset?.time || nowTime()
    });
    setEditorOpen(true);
  }

  function openEdit(tx) {
    setEditingTx(tx);
    const dt = new Date(tx.entryAt);
    const date = dt.toISOString().slice(0, 10);
    const time = dt.toTimeString().slice(0, 5);
    setEditorForm({
      type: tx.type,
      personId: tx.personId,
      amount: String(tx.amountPaise / 100),
      itemPurpose: tx.itemPurpose || '',
      category: tx.category || '',
      remarks: tx.remarks || '',
      date,
      time,
      isPending: tx.isPending
    });
    setEditorOpen(true);
  }

  async function saveTransaction() {
    try {
      const payload = {
        ...editorForm,
        entryAt: isoLocal(editorForm.date, editorForm.time).toISOString()
      };
      const path = editingTx ? `/api/transactions/${editingTx.id}` : '/api/transactions';
      await api(path, { method: editingTx ? 'PATCH' : 'POST', body: payload });
      showMessage(editingTx ? 'Record updated' : 'Record saved', 'green');
      setEditorOpen(false);
      setEditingTx(null);
      setEditorForm(blankForm());
      await Promise.all([loadBootstrap(), loadTransactions(txFilters)]);
    } catch (err) {
      showMessage(err.message || 'Save failed', 'red');
    }
  }

  async function deleteTransaction(id) {
    if (!window.confirm('Delete this record?')) return;
    await api(`/api/transactions/${id}`, { method: 'DELETE' });
    showMessage('Record deleted', 'yellow');
    await Promise.all([loadBootstrap(), loadTransactions(txFilters)]);
  }

  async function moveTransactionToPayment(id) {
    await api('/api/transactions/bulk', { method: 'POST', body: { action: 'moveToPayment', ids: [id], filters: txFilters } });
    showMessage('Moved to payment received', 'green');
    await Promise.all([loadBootstrap(), loadTransactions(txFilters)]);
  }

  function toggleSelection(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function selectAll() {
    setSelected(transactions.map((t) => t.id));
  }

  function clearSelection() {
    setSelected([]);
  }

  async function bulkAction(action) {
    if (!selected.length && action !== 'deleteAll') {
      showMessage('Select records first', 'yellow');
      return;
    }
    if (!window.confirm(action === 'deleteAll' ? 'Delete everything in the current view?' : 'Apply this action to the selected records?')) return;

    const payload = {
      action,
      ids: action === 'deleteAll' ? [] : selected,
      filters: txFilters
    };
    await api('/api/transactions/bulk', { method: 'POST', body: payload });
    setSelected([]);
    showMessage('Action completed', 'green');
    await Promise.all([loadBootstrap(), loadTransactions(txFilters)]);
  }

  async function markNotificationRead(id, nextRead = true) {
    await api(`/api/notifications/${id}`, { method: 'PATCH', body: { isRead: nextRead } });
    await loadNotifications(noteFilters);
  }

  async function deleteNotification(id) {
    await api(`/api/notifications/${id}`, { method: 'DELETE' });
    await loadNotifications(noteFilters);
  }

  async function bulkDeleteNotifications(all = false) {
    if (!window.confirm('Delete notifications?')) return;
    await api('/api/notifications', { method: 'DELETE', body: all ? { all: true } : { ids: notifications.filter((n) => selected.includes(n.id)).map((n) => n.id) } });
    await loadNotifications(noteFilters);
  }

  async function savePerson() {
    if (!personForm.name.trim()) return;
    const path = personForm.id ? `/api/people/${personForm.id}` : '/api/people';
    await api(path, { method: personForm.id ? 'PATCH' : 'POST', body: { name: personForm.name } });
    setPersonForm({ id: '', name: '' });
    await Promise.all([loadBootstrap(), activeTab === 'reports' ? loadReport() : Promise.resolve()]);
  }

  async function archivePerson(id) {
    if (!window.confirm('Archive this person?')) return;
    await api(`/api/people/${id}`, { method: 'DELETE' });
    await loadBootstrap();
  }

  async function exportData(format) {
    const res = await fetch(`/api/export?format=${format}`, { credentials: 'include' });
    if (!res.ok) {
      showMessage('Export failed', 'red');
      return;
    }
    const blob = await res.blob();
    const ext = format === 'json' ? 'json' : format;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-export.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage(`${format.toUpperCase()} exported`, 'green');
  }

  async function importFile(file) {
    if (!file) return;
    setBackupLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', importMode);
      await api('/api/import', { method: 'POST', body: formData, isForm: true });
      showMessage('Import completed', 'green');
      await Promise.all([loadBootstrap(), loadTransactions(txFilters), loadReport()]);
    } catch (err) {
      showMessage(err.message || 'Import failed', 'red');
    } finally {
      setBackupLoading(false);
    }
  }

  const visiblePeople = useMemo(() => {
    return people.filter((p) => p.name.toLowerCase().includes(personSearch.toLowerCase()));
  }, [people, personSearch]);

  const stats = boot?.summary?.totals || {
    todayExpense: 0,
    todayPayment: 0,
    weeklyExpense: 0,
    weeklyPayment: 0,
    monthlyExpense: 0,
    monthlyPayment: 0,
    expenseTotal: 0,
    paymentTotal: 0,
    netPendingTotal: 0,
    overallTotal: 0
  };

  const activeTransactions = transactions || [];
  const counts = filterCounts(activeTransactions);
  const personOptions = useMemo(() => people.filter((p) => !p.archivedAt), [people]);
  const recentItems = useMemo(() => favorites.slice(0, 6), [favorites]);

  const filteredPersonSummary = useMemo(() => {
    const expense = activeTransactions.filter((x) => x.type === 'EXPENSE').reduce((a, t) => a + t.amountPaise, 0);
    const payment = activeTransactions.filter((x) => x.type === 'PAYMENT').reduce((a, t) => a + t.amountPaise, 0);
    return {
      expense,
      payment,
      pending: Math.max(expense - payment, 0)
    };
  }, [activeTransactions]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <AppShell
      user={boot?.user}
      active={activeTab}
      unread={unreadCount}
      onToggleTheme={toggleTheme}
      theme={theme}
    >
      <div className="space-y-4">
        {message ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${messageTone === 'red' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200' : messageTone === 'green' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'}`}>
            {message}
          </div>
        ) : null}

        {activeTab === 'dashboard' && (
          <>

        <Card className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-2xl font-semibold">Home Dashboard</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Open, add, and calculate in seconds.</div>
            </div>
            <div className="sticky top-0 z-20 bg-zinc-50 pb-3 dark:bg-black">
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                <Button onClick={() => openCreate('EXPENSE')}><Plus className="mr-2 h-4 w-4" />Add Expense</Button>
                <Button variant="secondary" onClick={() => openCreate('PAYMENT')}><CircleDollarSign className="mr-2 h-4 w-4" />Add Payment Received</Button>
                <Button variant="secondary" onClick={() => loadBootstrap()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            {[   
              ['Today Expense', stats.todayExpense],
  ['Monthly Expense', stats.monthlyExpense],
  ['Payment Total', stats.paymentTotal],
  ['Net Pending', stats.netPendingTotal]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-zinc-100 p-2 md:p-3 dark:bg-zinc-900">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
                <div className="mt-1 text-base md:text-lg font-semibold">
                  {label === 'Unread' || label === 'People'
                    ? value
                    : fromPaise(value)}
              </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <SectionTitle eyebrow="Records" title="Recent Entries" subtitle="Search, filter, edit, delete, and move to payment received." />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:flex-wrap">
                <Button variant="secondary" onClick={selectAll}><CheckSquare className="mr-2 h-4 w-4" />Select All</Button>
                <Button variant="secondary" onClick={clearSelection}><Square className="mr-2 h-4 w-4" />Clear</Button>
                <Button variant="secondary" onClick={() => bulkAction('moveToPayment')}><MoveRight className="mr-2 h-4 w-4" />Move To Payment Received</Button>
                <Button variant="danger" onClick={() => bulkAction('delete') }><Trash2 className="mr-2 h-4 w-4" />Delete Selected</Button>
                <Button variant="danger" onClick={() => bulkAction('deleteAll') }><Trash2 className="mr-2 h-4 w-4" />Delete All</Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6">
              <Input placeholder="Search" value={txFilters.q} onChange={(e) => setTxFilters({ ...txFilters, q: e.target.value })} />
              <Select value={txFilters.personId} onChange={(e) => setTxFilters({ ...txFilters, personId: e.target.value })}>
                <option value="">All People</option>
                {personOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Select value={txFilters.category} onChange={(e) => setTxFilters({ ...txFilters, category: e.target.value })}>
                <option value="">All Categories</option>
                {[...new Set(activeTransactions.map((x) => x.category).filter(Boolean))].map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </Select>
              <Select value={txFilters.status} onChange={(e) => setTxFilters({ ...txFilters, status: e.target.value })}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </Select>
              <Input type="date" value={txFilters.from} onChange={(e) => setTxFilters({ ...txFilters, from: e.target.value })} />
              <Input type="date" value={txFilters.to} onChange={(e) => setTxFilters({ ...txFilters, to: e.target.value })} />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Filter className="h-3.5 w-3.5" />
              Filtered view: {counts.expense} expenses, {counts.payment} payments, {counts.pending} pending.
            </div>

            {txFilters.personId ? (
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <div className="rounded-2xl bg-zinc-100 p-2 md:p-3 dark:bg-zinc-900">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Expenses</div>
                  <div className="mt-1 text-lg font-semibold">{fromPaise(filteredPersonSummary.expense)}</div>
                </div>
                <div className="rounded-2xl bg-zinc-100 p-2 md:p-3 dark:bg-zinc-900">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Payments</div>
                  <div className="mt-1 text-lg font-semibold">{fromPaise(filteredPersonSummary.payment)}</div>
                </div>
                <div className="rounded-2xl bg-zinc-100 p-2 md:p-3 dark:bg-zinc-900">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Pending Balance</div>
                  <div className="mt-1 text-lg font-semibold">{fromPaise(filteredPersonSummary.pending)}</div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <div className="max-h-[620px] overflow-auto">
                {loading ? (
                  <div className="p-6 text-sm text-zinc-500">Loading records…</div>
                ) : activeTransactions.length ? (
                  <>
                <div className="md:hidden">
                  {activeTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="m-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <Badge tone={transactionTone(tx)}>
                          {transactionLabel(tx)}
                        </Badge>

                        <input
                          type="checkbox"
                          checked={selected.includes(tx.id)}
                          onChange={() => toggleSelection(tx.id)}
                        />
                      </div>

                      <div className="mt-3 flex items-start justify-between">
  <div>
    <div className="text-lg font-bold">
      {fromPaise(tx.amountPaise)}
    </div>

    <div className="text-sm text-zinc-400">
      {tx.personName}
    </div>
  </div>

  <div className="text-xs text-zinc-500">
    {fmtDateTime(tx.entryAt)}
  </div>
</div>

                      <div className="mt-2 text-sm">
                        <div>{tx.itemPurpose || 'No Item'}</div>

                        <div className="text-zinc-500">
                          {tx.category || 'No Category'}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-zinc-500">
                        {fmtDateTime(tx.entryAt)}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => openEdit(tx)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          onClick={() => deleteTransaction(tx.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        {tx.type === 'EXPENSE' && (
                          <Button
                            variant="ghost"
                            onClick={() => moveTransactionToPayment(tx.id)}
                          >
                            <MoveRight className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditorForm({
                              ...blankForm(),
                              type: tx.type,
                              personId: tx.personId,
                              amount: String(tx.amountPaise / 100),
                              itemPurpose: tx.itemPurpose || '',
                              category: tx.category || '',
                              remarks: tx.remarks || '',
                              date: todayDate(),
                              time: nowTime()
                            });
                            setEditorOpen(true);
                            setEditingTx(null);
                          }}
                        >
                          <Repeat2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                  <table className="hidden md:table w-full text-left text-sm">
                    <thead className="sticky top-0 bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th className="p-3"><input type="checkbox" checked={selected.length && selected.length === activeTransactions.length} onChange={() => selected.length === activeTransactions.length ? clearSelection() : selectAll()} /></th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Person</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Item / Purpose</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTransactions.map((tx) => (
                        <tr key={tx.id} className="border-t border-zinc-200/70 dark:border-zinc-800/70">
                          <td className="p-3"><input type="checkbox" checked={selected.includes(tx.id)} onChange={() => toggleSelection(tx.id)} /></td>
                          <td className="p-3"><Badge tone={transactionTone(tx)}>{transactionLabel(tx)}</Badge></td>
                          <td className="p-3 font-medium">{tx.personName}</td>
                          <td className="p-3">{fromPaise(tx.amountPaise)}</td>
                          <td className="p-3">
                            <div className="font-medium">{tx.itemPurpose || '—'}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{tx.remarks || 'Pending'}</div>
                          </td>
                          <td className="p-3">{tx.category || '—'}</td>
                          <td className="p-3 text-xs text-zinc-500 dark:text-zinc-400">{fmtDateTime(tx.entryAt)}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" onClick={() => openEdit(tx)}><Edit3 className="h-4 w-4" /></Button>
                              <Button variant="ghost" onClick={() => deleteTransaction(tx.id)}><Trash2 className="h-4 w-4" /></Button>
                              {tx.type === 'EXPENSE' ? <Button variant="ghost" onClick={() => moveTransactionToPayment(tx.id)}><MoveRight className="h-4 w-4" /></Button> : null}
                              <Button variant="ghost" onClick={() => {
                                setEditorForm({
                                  ...blankForm(),
                                  type: tx.type,
                                  personId: tx.personId,
                                  amount: String(tx.amountPaise / 100),
                                  itemPurpose: tx.itemPurpose || '',
                                  category: tx.category || '',
                                  remarks: tx.remarks || '',
                                  date: todayDate(),
                                  time: nowTime()
                                });
                                setEditorOpen(true);
                                setEditingTx(null);
                              }}><Repeat2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </>
                ) : (
                  <div className="p-6">
                    <EmptyState
                      title="No records found"
                      subtitle="Try another person, date range, or search term."
                      action={<Button onClick={() => openCreate('EXPENSE')}><Plus className="mr-2 h-4 w-4" />Add first record</Button>}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="hidden xl:block">
              <SectionTitle eyebrow="Quick Add" title="Recent & Favorite Items" subtitle="One tap repeat for common expenses." />
              <div className="mt-4 grid gap-2">
                {recentItems.length ? recentItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openCreate('EXPENSE', {
                      itemPurpose: item.label,
                      category: item.category || '',
                      amount: item.amountPaise ? String(item.amountPaise / 100) : ''
                    })}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  >
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{item.category || 'Quick item'}</div>
                    </div>
                    <div className="text-sm text-zinc-500">{item.amountPaise ? fromPaise(item.amountPaise) : ''}</div>
                  </button>
                )) : <EmptyState title="No quick items yet" subtitle="Save any expense as a quick item." />}
              </div>
            </Card>

            <Card>
              <SectionTitle eyebrow="People" title="Name Management" subtitle="Add, edit, delete, and search people." />
              <div className="mt-3 flex gap-2">
                <Input placeholder="Search person" value={personSearch} onChange={(e) => setPersonSearch(e.target.value)} />
                <Button onClick={() => { setPersonModalOpen(true); setPersonForm({ id: '', name: '' }); }}><UserPlus className="h-4 w-4" /></Button>
              </div>
              <div className="mt-3 max-h-72 overflow-auto space-y-2">
                {visiblePeople.map((person) => (
                  <div key={person.id} className="flex items-center justify-between rounded-2xl border border-zinc-200 px-3 py-3 dark:border-zinc-800">
                    <div>
                      <div className="font-medium">{person.name} {person.isDefault ? <Badge className="ml-2">Default</Badge> : null}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Pending {fromPaise(balances.find((b) => b.id === person.id)?.pendingPaise || 0)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" onClick={() => { setPersonModalOpen(true); setPersonForm({ id: person.id, name: person.name }); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" onClick={() => archivePerson(person.id)}><Archive className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
            </>
        )}
        {activeTab === 'notifications' ? (
          <Card>
            <SectionTitle eyebrow="Notifications" title="Notification Center" subtitle="Search, filter, read, and delete notifications." />
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <Input placeholder="Search notifications" value={noteFilters.q} onChange={(e) => setNoteFilters({ ...noteFilters, q: e.target.value })} />
              <Select value={noteFilters.type} onChange={(e) => setNoteFilters({ ...noteFilters, type: e.target.value })}>
                <option value="all">All Types</option>
                <option value="PAYMENT_RECEIVED">Payment Received</option>
                <option value="PENDING_ADDED">Pending Added</option>
                <option value="BALANCE_REDUCED">Balance Reduced</option>
                <option value="BALANCE_CLEARED">Balance Cleared</option>
                <option value="RECORD_DELETED">Record Deleted</option>
                <option value="BULK_DELETE">Bulk Delete</option>
                <option value="PERSON_ADDED">Person Added</option>
                <option value="PERSON_EDITED">Person Edited</option>
                <option value="PERSON_DELETED">Person Deleted</option>
                <option value="IMPORT_COMPLETED">Import Completed</option>
                <option value="EXPORT_COMPLETED">Export Completed</option>
              </Select>
              <Button variant="secondary" onClick={() => setNoteFilters({ ...noteFilters, unreadOnly: !noteFilters.unreadOnly })}>{noteFilters.unreadOnly ? 'Unread only' : 'Show all'}</Button>
            </div>
            <div className="mt-4 space-y-2">
              {notifications.length ? notifications.map((note) => (
                <div key={note.id} className={`rounded-2xl border p-4 ${note.isRead ? 'border-zinc-200 dark:border-zinc-800' : 'border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{note.title}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">{note.body}</div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{fmtDateTime(note.createdAt)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => markNotificationRead(note.id, !note.isRead)}>{note.isRead ? 'Unread' : 'Read'}</Button>
                      <Button variant="ghost" onClick={() => deleteNotification(note.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              )) : <EmptyState title="No notifications yet" subtitle="Activity will appear here automatically." />}
            </div>
          </Card>
        ) : null}

        {activeTab === 'reports' ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <SectionTitle eyebrow="Reports" title="Daily / Weekly / Monthly / Yearly" subtitle="Totals update instantly from your workspace records." />
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {[
                  ['Today', report?.totals?.todayExpense + report?.totals?.todayPayment || 0],
                  ['Weekly', report?.totals?.weeklyExpense + report?.totals?.weeklyPayment || 0],
                  ['Monthly', report?.totals?.monthlyExpense + report?.totals?.monthlyPayment || 0],
                  ['Expense', report?.totals?.expenseTotal || 0],
                  ['Payment', report?.totals?.paymentTotal || 0],
                  ['Pending', report?.totals?.netPendingTotal || 0]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-zinc-100 p-2 sm:p-3 dark:bg-zinc-900">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
                    <div className="mt-1 text-lg font-semibold">{fromPaise(value)}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle eyebrow="Person-wise" title="Per person balance" subtitle="Each user sees only their own workspace data." />
              <div className="mt-3 space-y-2 max-h-80 overflow-auto">
                {(report?.perPerson || []).map((row) => (
                  <div key={row.id} className="flex items-center justify-between rounded-2xl border border-zinc-200 px-3 py-3 dark:border-zinc-800">
                    <div className="font-medium">{row.name}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">{fromPaise(row.pendingPaise)}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle eyebrow="Category-wise" title="Category totals" subtitle="See where money is going." />
              <div className="mt-3 space-y-2 max-h-80 overflow-auto">
                {(report?.perCategory || []).map((row) => (
                  <div key={row.category} className="flex items-center justify-between rounded-2xl border border-zinc-200 px-3 py-3 dark:border-zinc-800">
                    <div className="font-medium">{row.category}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">{fromPaise(row.amountPaise)}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle eyebrow="Backups" title="Backup & Export" subtitle="Download or import XLSX, ODS, CSV, and JSON." />
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <Button onClick={() => exportData('xlsx')}><Download className="mr-2 h-4 w-4" />Export XLSX</Button>
                <Button variant="secondary" onClick={() => exportData('ods')}><Download className="mr-2 h-4 w-4" />Export ODS</Button>
                <Button variant="secondary" onClick={() => exportData('csv')}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
                <Button variant="secondary" onClick={() => exportData('json')}><Download className="mr-2 h-4 w-4" />Export JSON</Button>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
                <div className="mb-2 text-sm font-medium">Import backup</div>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Select value={importMode} onChange={(e) => setImportMode(e.target.value)} className="md:w-40">
                    <option value="merge">Merge</option>
                    <option value="replace">Replace active records</option>
                  </Select>
                  <Input type="file" accept=".json,.csv,.xlsx,.ods,.xls" onChange={(e) => importFile(e.target.files?.[0])} />
                </div>
                {backupLoading ? <div className="mt-2 text-sm text-zinc-500">Importing…</div> : null}
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'backup' ? (
          <Card>
            <SectionTitle eyebrow="Backup" title="Import and export data" subtitle="Create backups in JSON, CSV, XLSX, or ODS." />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Button onClick={() => exportData('xlsx')}><Download className="mr-2 h-4 w-4" />Download XLSX</Button>
              <Button variant="secondary" onClick={() => exportData('ods')}><Download className="mr-2 h-4 w-4" />Download ODS</Button>
              <Button variant="secondary" onClick={() => exportData('csv')}><Download className="mr-2 h-4 w-4" />Download CSV</Button>
              <Button variant="secondary" onClick={() => exportData('json')}><Download className="mr-2 h-4 w-4" />Download JSON</Button>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
              <div className="flex flex-col gap-2 md:flex-row">
                <Select value={importMode} onChange={(e) => setImportMode(e.target.value)} className="md:w-44">
                  <option value="merge">Merge</option>
                  <option value="replace">Replace active records</option>
                </Select>
                <Input type="file" accept=".json,.csv,.xlsx,.ods,.xls" onChange={(e) => importFile(e.target.files?.[0])} />
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <Modal
        open={editorOpen}
        title={editingTx ? 'Edit Record' : editorForm.type === 'PAYMENT' ? 'Add Payment Received' : 'Add Expense'}
        subtitle={editorForm.type === 'PAYMENT' ? 'Record a payment and reduce the selected person’s pending balance instantly.' : 'Record an expense in under 5 seconds.'}
        onClose={() => setEditorOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Type</label>
            <Select value={editorForm.type} onChange={(e) => setEditorForm({ ...editorForm, type: e.target.value })}>
              <option value="EXPENSE">Expense</option>
              <option value="PAYMENT">Payment Received</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              {editorForm.type === 'PAYMENT' ? 'Payment Received From' : 'Person Name'}
            </label>
            <Select value={editorForm.personId} onChange={(e) => setEditorForm({ ...editorForm, personId: e.target.value })}>
              <option value="">Select person</option>
              {personOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            {editorForm.type === 'PAYMENT' ? <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">This will reduce that person’s pending balance and create a payment entry.</div> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Amount</label>
            <Input autoFocus value={editorForm.amount} onChange={(e) => setEditorForm({ ...editorForm, amount: e.target.value })} placeholder="0.00" inputMode="decimal" className="text-2xl font-semibold" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <Input value={editorForm.category} onChange={(e) => setEditorForm({ ...editorForm, category: e.target.value })} placeholder="Food, Travel, Office…" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <Input type="date" value={editorForm.date} onChange={(e) => setEditorForm({ ...editorForm, date: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Time</label>
            <Input type="time" value={editorForm.time} onChange={(e) => setEditorForm({ ...editorForm, time: e.target.value })} />
          </div>
          {editorForm.type === 'EXPENSE' && (
  <div className="md:col-span-2">
    <label className="mb-2 block text-sm font-medium">
      Quick Entry
    </label>

    <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
            {QUICK_ITEMS.map((quick) => (
              <button
                key={quick.item}
                type="button"
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                onClick={() =>
                  setEditorForm({
                    ...editorForm,
                    itemPurpose: quick.item,
                    category: quick.category
                  })
                }
              >
                {quick.item}
              </button>
            ))}
          </div>
        </div>
      )}
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Item / Purpose</label>
            <Input value={editorForm.itemPurpose} onChange={(e) => setEditorForm({ ...editorForm, itemPurpose: e.target.value })} placeholder="Tea, lunch, cab, etc." />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
  <input
    type="checkbox"
    checked={editorForm.isPending}
    onChange={(e) =>
      setEditorForm({
        ...editorForm,
        isPending: e.target.checked
      })
    }
  />

  <label className="text-sm">
    Mark as Pending
  </label>
</div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Remarks</label>
            <Textarea rows={3} value={editorForm.remarks} onChange={(e) => setEditorForm({ ...editorForm, remarks: e.target.value, isPending: !e.target.value.trim() })} placeholder="Optional notes. Leave blank to mark as pending." />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditorOpen(false)}>Cancel</Button>
          <Button onClick={saveTransaction}><Save className="mr-2 h-4 w-4" />Save</Button>
        </div>
      </Modal>

      <Modal
        open={personModalOpen}
        title={personForm.id ? 'Edit Person' : 'Add Person'}
        subtitle="Manage names used across expenses and payments."
        onClose={() => setPersonModalOpen(false)}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })} placeholder="Enter person name" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPersonModalOpen(false)}>Cancel</Button>
            <Button onClick={async () => { await savePerson(); setPersonModalOpen(false); }}><Save className="mr-2 h-4 w-4" />Save Person</Button>
          </div>
        </div>
      </Modal>
      <button className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xl transition hover:scale-105 dark:bg-white dark:text-black lg:hidden" onClick={() => window.dispatchEvent(new Event('openQuickAdd'))}>
      + </button>
      {activeTab === 'dashboard' && (
        <button className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xl transition hover:scale-105 dark:bg-white dark:text-black lg:hidden" onClick={() => openCreate('EXPENSE')}>
          <Plus className="h-6 w-6" />
        </button>
      )}
    </AppShell>
  );
}
