import { useState, useEffect } from 'react'
import {
  User,
  Lock,
  Bell,
  Shield,
  ChevronRight,
  Camera,
  Save,
  Eye,
  EyeOff,
  Users,
  Plus,
  Trash2,
} from 'lucide-react'

import { useAuthStore } from '@/stores/authStore'
import { useFamilyMembersStore } from '@/stores/familyMembersStore'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'
import { useToast } from '@/hooks/useToast'

type Tab = 'profile' | 'password' | 'notifications' | 'family'

export function SettingsPage() {
  const toast = useToast()

  // ── Individual selectors to avoid infinite re-render ──────────────────────
  const user = useAuthStore((s) => s.user)
  const refreshMe = useAuthStore((s) => s.refreshMe)
  const signOut = useAuthStore((s) => s.signOut)

  const familyItems = useFamilyMembersStore((s) => s.items)
  const fetchFamily = useFamilyMembersStore((s) => s.fetch)
  const addMember = useFamilyMembersStore((s) => s.addMember)
  const removeMember = useFamilyMembersStore((s) => s.removeMember)

  const isAdmin = user?.roles.includes('admin')
  const isOwner = user?.roles.includes('owner')
  const isTenant = !isAdmin && !isOwner

  // ── Active tab ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // ── Profile form ──────────────────────────────────────────────────────────
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setPhone(user.phone ?? '')
    }
  }, [user?.name, user?.phone])

  // ── Password form ─────────────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  // ── Family ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isTenant) fetchFamily()
  }, [isTenant])

  const [famName, setFamName] = useState('')
  const [famRel, setFamRel] = useState('Spouse')
  const [famAge, setFamAge] = useState(30)
  const [famPhone, setFamPhone] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  const myFamily = familyItems.filter(
    (m) => m.tenantEmail?.toLowerCase() === user?.email?.toLowerCase(),
  )

  // ── Notification toggles (UI only) ────────────────────────────────────────
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [smsNotifs, setSmsNotifs] = useState(false)
  const [appNotifs, setAppNotifs] = useState(true)

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Name cannot be empty.'); return }
    setSaving(true)
    try {
      await apiClient.patch<ApiEnvelope<unknown>>('/auth/me', {
        firstName: name.split(' ')[0] ?? name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        phone: phone.trim(),
      })
      await refreshMe()
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPwd || !newPwd || !confirmPwd) { toast.error('Please fill all fields.'); return }
    if (newPwd !== confirmPwd) { toast.error('New passwords do not match.'); return }
    if (newPwd.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    setSavingPwd(true)
    try {
      await apiClient.post('/auth/change-password', { currentPassword: currentPwd, newPassword: newPwd })
      toast.success('Password changed. Please sign in again.')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      setTimeout(() => signOut(), 1500)
    } catch {
      toast.error('Incorrect current password.')
    } finally {
      setSavingPwd(false)
    }
  }

  const handleAddMember = async () => {
    if (!famName.trim()) return
    setAddingMember(true)
    try {
      await addMember({
        tenantEmail: user?.email ?? '',
        name: famName,
        relationship: famRel as any,
        age: famAge,
        phone: famPhone,
      })
      setFamName(''); setFamPhone(''); setFamAge(30)
      toast.success('Family member added!')
    } catch {
      toast.error('Failed to add member.')
    } finally {
      setAddingMember(false)
    }
  }

  // ── Role badge ────────────────────────────────────────────────────────────
  const roleBadge = isAdmin
    ? { label: 'Super Admin', color: 'var(--color-warning, #f59e0b)' }
    : isOwner
      ? { label: 'Property Owner', color: 'var(--color-accent, #6366f1)' }
      : { label: 'Tenant', color: 'var(--color-success, #10b981)' }

  // ── Tabs config ───────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Personal Info', icon: <User size={16} /> },
    { id: 'password', label: 'Password', icon: <Lock size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    ...(isTenant ? [{ id: 'family' as Tab, label: 'Family Members', icon: <Users size={16} /> }] : []),
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary, #f8fafc)', margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: 'var(--color-text-muted, #94a3b8)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Manage your account preferences
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {/* Avatar card */}
          <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.75rem' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', fontWeight: 700, color: '#fff',
                margin: '0 auto',
              }}>
                {(user?.name ?? '?')[0].toUpperCase()}
              </div>
              <button style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                background: '#6366f1', border: '2px solid #0f172a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
              }}>
                <Camera size={12} />
              </button>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #f8fafc)', fontSize: '0.9rem' }}>
              {user?.name ?? 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)', marginTop: '0.2rem' }}>
              {user?.email}
            </div>
            <span style={{
              display: 'inline-block', marginTop: '0.5rem',
              padding: '0.15rem 0.6rem', borderRadius: '999px',
              fontSize: '0.7rem', fontWeight: 600,
              background: `${roleBadge.color}22`,
              color: roleBadge.color, border: `1px solid ${roleBadge.color}55`,
            }}>
              {roleBadge.label}
            </span>
          </div>

          {/* Nav items */}
          <nav style={{ padding: '0.5rem' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.65rem 0.85rem', borderRadius: '10px', border: 'none',
                  background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: activeTab === tab.id ? '#818cf8' : 'var(--color-text-muted, #94a3b8)',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: activeTab === tab.id ? 600 : 400,
                  transition: 'all 0.15s', textAlign: 'left', marginBottom: '0.1rem',
                }}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
                )}
              </button>
            ))}
          </nav>

          {/* Admin-only section */}
          {isAdmin && (
            <div style={{
              padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)',
              margin: '0.5rem',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.75rem', borderRadius: '8px',
                background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '0.8rem',
              }}>
                <Shield size={14} />
                <span>Admin Privileges</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '1.75rem',
        }}>

          {/* ── PROFILE TAB ──────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary, #f8fafc)', marginTop: 0 }}>
                Personal Information
              </h2>
              <p style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: '0.25rem' }}>
                Update your name and contact details.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    style={inputStyle}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
                    value={user?.email ?? ''}
                    disabled
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    style={inputStyle}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  <input
                    style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
                    value={roleBadge.label}
                    disabled
                  />
                </div>
              </div>

              <button type="submit" disabled={saving} style={primaryBtnStyle}>
                <Save size={15} />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* ── PASSWORD TAB ─────────────────────────────────────────── */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary, #f8fafc)', marginTop: 0 }}>
                Change Password
              </h2>
              <p style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: '0.25rem' }}>
                After changing your password you will be signed out.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px', marginBottom: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={inputStyle}
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={eyeBtnStyle}>
                      {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={inputStyle}
                      type={showNew ? 'text' : 'password'}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} style={eyeBtnStyle}>
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <input
                    style={{
                      ...inputStyle,
                      borderColor: confirmPwd && confirmPwd !== newPwd ? '#f87171' : undefined,
                    }}
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Repeat new password"
                  />
                  {confirmPwd && confirmPwd !== newPwd && (
                    <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>

              <button type="submit" disabled={savingPwd} style={primaryBtnStyle}>
                <Lock size={15} />
                {savingPwd ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          )}

          {/* ── NOTIFICATIONS TAB ────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary, #f8fafc)', marginTop: 0 }}>
                Notification Preferences
              </h2>
              <p style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: '0.25rem' }}>
                Choose how you want to receive alerts.
              </p>

              {[
                { label: 'Email Notifications', desc: 'Receive updates via email', value: emailNotifs, set: setEmailNotifs },
                { label: 'SMS Notifications', desc: 'Get text messages for important alerts', value: smsNotifs, set: setSmsNotifs },
                { label: 'In-App Notifications', desc: 'See alerts inside PropertyPro', value: appNotifs, set: setAppNotifs },
              ].map((item) => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: '0.75rem',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #f8fafc)', fontSize: '0.9rem' }}>
                      {item.label}
                    </div>
                    <div style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.8rem' }}>
                      {item.desc}
                    </div>
                  </div>
                  <button
                    onClick={() => item.set(!item.value)}
                    style={{
                      width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
                      background: item.value ? '#6366f1' : 'rgba(255,255,255,0.1)',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: item.value ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              ))}

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={() => toast.success('Notification preferences saved!')}
                  style={primaryBtnStyle}
                >
                  <Save size={15} />
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* ── FAMILY TAB (tenants only) ─────────────────────────── */}
          {activeTab === 'family' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary, #f8fafc)', marginTop: 0 }}>
                Family Members
              </h2>
              <p style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: '0.25rem' }}>
                Add or remove family members living with you.
              </p>

              {/* Add member form */}
              <div style={{
                padding: '1rem', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary, #f8fafc)', marginBottom: '0.75rem' }}>
                  Add New Member
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr', gap: '0.75rem', alignItems: 'end' }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input style={inputStyle} value={famName} onChange={(e) => setFamName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Relationship</label>
                    <select
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      value={famRel}
                      onChange={(e) => setFamRel(e.target.value)}
                    >
                      {['Spouse', 'Child', 'Parent', 'Sibling', 'Other'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Age</label>
                    <input style={inputStyle} type="number" min={0} max={120} value={famAge} onChange={(e) => setFamAge(Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input style={inputStyle} value={famPhone} onChange={(e) => setFamPhone(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <button
                  onClick={handleAddMember}
                  disabled={addingMember || !famName.trim()}
                  style={{ ...primaryBtnStyle, marginTop: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                >
                  <Plus size={14} />
                  {addingMember ? 'Adding…' : 'Add Member'}
                </button>
              </div>

              {/* Members list */}
              {myFamily.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '2rem',
                  color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.9rem',
                }}>
                  <Users size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0 }}>No family members added yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {myFamily.map((m) => (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: '#fff', fontSize: '0.9rem',
                        }}>
                          {m.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #f8fafc)', fontSize: '0.88rem' }}>
                            {m.name}
                          </div>
                          <div style={{ color: 'var(--color-text-muted, #94a3b8)', fontSize: '0.78rem' }}>
                            {m.relationship} · Age {m.age}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMember(m.id)}
                        style={{
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: '8px', padding: '0.35rem 0.5rem', cursor: 'pointer', color: '#f87171',
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared micro-styles ────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--color-text-muted, #94a3b8)',
  marginBottom: '0.35rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.85rem',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: 'var(--color-text-primary, #f8fafc)',
  fontSize: '0.88rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.65rem 1.4rem',
  borderRadius: '10px',
  border: 'none',
  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.88rem',
  cursor: 'pointer',
}

const eyeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  right: '0.75rem',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  color: 'var(--color-text-muted, #94a3b8)',
  cursor: 'pointer',
  padding: 0,
}
