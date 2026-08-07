import { useState } from 'react'
import { User, Plus, Trash2, Edit2, Users, Camera, Lock } from 'lucide-react'

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { useAuthStore, isAdmin } from '@/stores/authStore'
import { useFamilyMembersStore, type FamilyRelationship } from '@/stores/familyMembersStore'

export function SettingsPage() {
  const toast = useToast()
  const user = useAuthStore((state) => state.user)
  const isOwnerAdmin = isAdmin(user)

  const { familyMembers, addMember, updateMember, removeMember, getMembersByTenant } = useFamilyMembersStore((s) => ({
    familyMembers: s.items,
    addMember: s.addMember,
    updateMember: s.updateMember,
    removeMember: s.removeMember,
    getMembersByTenant: s.getMembersByTenant,
  }))

  const userEmail = user?.email ?? 'tenant@propertypro.app'
  const myFamilyMembers = getMembersByTenant(userEmail)

  // Personal Info Form State
  const [name, setName] = useState(user?.name ?? 'John Tenant')
  const [email, setEmail] = useState(userEmail)
  const [phone, setPhone] = useState('+91 98765 43210')
  const [address, setAddress] = useState('Flat 402, Green Park Residency, Hyderabad')
  const [emergencyContact, setEmergencyContact] = useState('+91 91234 56789 (Father)')
  const [profilePic, setProfilePic] = useState<string | null>(null)

  // Password Update Form State (specifically requested for owners)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Family Member Modal State
  const [familyModalOpen, setFamilyModalOpen] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [famName, setFamName] = useState('')
  const [famRel, setFamRel] = useState<FamilyRelationship>('Spouse')
  const [famAge, setFamAge] = useState<number>(30)
  const [famPhone, setFamPhone] = useState('')

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Name and Email cannot be empty.')
      return
    }
    toast.success('Personal Information Saved Successfully! 🎉')
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }
    toast.success('Password Updated Successfully! 🔒')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setProfilePic(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Open modal for adding or editing member
  const handleOpenFamilyModal = (memberId?: string) => {
    if (memberId) {
      const m = familyMembers.find((item) => item.id === memberId)
      if (m) {
        setEditingMemberId(m.id)
        setFamName(m.name)
        setFamRel(m.relationship)
        setFamAge(m.age)
        setFamPhone(m.phone)
      }
    } else {
      setEditingMemberId(null)
      setFamName('')
      setFamRel('Spouse')
      setFamAge(28)
      setFamPhone('')
    }
    setFamilyModalOpen(true)
  }

  const handleSaveFamilyMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!famName.trim()) {
      toast.error('Family member name is required.')
      return
    }

    if (editingMemberId) {
      updateMember(editingMemberId, {
        name: famName.trim(),
        relationship: famRel,
        age: Number(famAge),
        phone: famPhone.trim() || 'N/A',
      })
      toast.success('Family member updated successfully.')
    } else {
      addMember({
        tenantEmail: userEmail,
        name: famName.trim(),
        relationship: famRel,
        age: Number(famAge),
        phone: famPhone.trim() || 'N/A',
      })
      toast.success('Family member added successfully.')
    }

    setFamilyModalOpen(false)
  }

  const handleDeleteMember = (id: string, name: string) => {
    removeMember(id)
    toast.info(`Removed ${name} from family members.`)
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
          Profile & Settings <User className="h-5 w-5 text-primary" />
        </h1>
        <p className="text-sm text-muted mt-0.5">
          {isOwnerAdmin 
            ? 'Manage your owner profile, login credentials, and contact details.' 
            : 'Manage your personal credentials, profile photo, emergency contact, and family members.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* ─── PERSONAL INFORMATION CARD ─────────────────────────────────────── */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Personal Information
            </GlassCardTitle>
            <GlassCardDescription>
              {isOwnerAdmin ? 'Your essential owner profile details' : 'Your essential tenant profile information'}
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              {/* Profile Photo Uploader */}
              <div className="flex items-center gap-5 py-2 border-b border-border/40 pb-4">
                <div className="relative h-20 w-20 rounded-full bg-primary/20 border-2 border-primary/40 overflow-hidden flex items-center justify-center font-bold text-primary text-xl shrink-0">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span>{name.slice(0, 2).toUpperCase()}</span>
                  )}
                  <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer">
                    <Camera className="h-5 w-5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                  </label>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-text">Profile Picture</h4>
                  <p className="text-xs text-muted mt-0.5">Click photo to upload new avatar</p>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label={isOwnerAdmin ? "Username / Full Name" : "Full Name"} value={name} onChange={(e) => setName(e.target.value)} required />
                <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                {!isOwnerAdmin && (
                  <Input label="Emergency Contact" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} required />
                )}
              </div>

              {!isOwnerAdmin && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" className="font-bold">
                  Save Profile Settings
                </Button>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>

        {/* ─── PASSWORD UPDATE CARD (For Owner/Admin) ────────────────────────── */}
        {isOwnerAdmin && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" /> Update Password
              </GlassCardTitle>
              <GlassCardDescription>Change your login password securely</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input 
                    label="Current Password" 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required 
                  />
                  <Input 
                    label="New Password" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                  <Input 
                    label="Confirm New Password" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" className="font-bold">
                    Change Password
                  </Button>
                </div>
              </form>
            </GlassCardContent>
          </GlassCard>
        )}

        {/* ─── OPTIONAL FAMILY MEMBERS SECTION (Tenant only) ─────────────────── */}
        {!isOwnerAdmin && (
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <GlassCardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400" /> Family Members (Optional)
                  </GlassCardTitle>
                  <GlassCardDescription>Add family members residing with you in your rented property</GlassCardDescription>
                </div>

                <Button variant="primary" size="sm" onClick={() => handleOpenFamilyModal()} className="font-bold">
                  <Plus className="h-4 w-4" /> Add Family Member
                </Button>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              {myFamilyMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2 border border-dashed border-border/60 rounded-xl bg-surface2/30">
                  <Users className="h-8 w-8 text-muted/40" />
                  <p className="text-xs text-muted">No family members added yet.</p>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenFamilyModal()} className="text-xs text-primary">
                    + Add First Member
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {myFamilyMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-surface2/30 hover:border-primary/30 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                          {member.relationship.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text">{member.name}</p>
                          <p className="text-xs text-muted">
                            {member.relationship} · {member.age} yrs · {member.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleOpenFamilyModal(member.id)}
                          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        )}
      </div>

      {/* ─── ADD / EDIT FAMILY MEMBER MODAL ──────────────────────────────── */}
      <Modal open={familyModalOpen} onOpenChange={setFamilyModalOpen}>
        <div className="p-6 flex flex-col gap-4 max-w-md w-full">
          <div>
            <h3 className="text-lg font-bold text-text">
              {editingMemberId ? 'Edit Family Member' : 'Add Family Member'}
            </h3>
            <p className="text-xs text-muted mt-0.5">Fill in details for your family member.</p>
          </div>

          <form onSubmit={handleSaveFamilyMember} className="flex flex-col gap-4 mt-2">
            <Input
              label="Member Name"
              value={famName}
              onChange={(e) => setFamName(e.target.value)}
              placeholder="e.g. Sarah Tenant"
              required
            />

            <Select
              label="Relationship"
              options={[
                { value: 'Spouse', label: 'Spouse' },
                { value: 'Child', label: 'Child' },
                { value: 'Parent', label: 'Parent' },
                { value: 'Sibling', label: 'Sibling' },
                { value: 'Other', label: 'Other' },
              ]}
              value={famRel}
              onChange={(e) => setFamRel(e.target.value as FamilyRelationship)}
            />

            <Input
              label="Age"
              type="number"
              value={famAge}
              onChange={(e) => setFamAge(Number(e.target.value))}
              required
            />

            <Input
              label="Phone Number"
              value={famPhone}
              onChange={(e) => setFamPhone(e.target.value)}
              placeholder="e.g. +91 98765 12345 (or N/A)"
            />

            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setFamilyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingMemberId ? 'Update Member' : 'Add Member'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
