import { useState } from 'react'
import {
  User,
  Shield,
  Bell,
  Sliders,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'

export function SettingsPage() {
  const toast = useToast()
  const user = useAuthStore((state) => state.user)

  // Profile Form state
  const [name, setName] = useState(user?.name ?? 'Alex Morgan')
  const [email, setEmail] = useState(user?.email ?? 'alex@propertypro.app')

  // Password updating state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // App configurations state
  const [currency, setCurrency] = useState('INR')
  const [theme, setTheme] = useState('system')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Name and Email cannot be empty')
      return
    }
    toast.success('Profile details saved successfully')
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    toast.success('Password updated successfully')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleSavePreferences = () => {
    toast.success('Application preferences updated')
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Top Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-text">Workspace Settings</h1>
        <p className="text-sm text-muted">Update profile credentials, security credentials, notification channels and app configurations.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Nav Tabs */}
        <div className="flex flex-col gap-1.5 md:col-span-1">
          <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary-soft text-primary text-left">
            <User className="h-4 w-4" />
            Profile Details
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-text2 hover:bg-surface2 hover:text-text text-left">
            <Shield className="h-4 w-4" />
            Password & Security
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-text2 hover:bg-surface2 hover:text-text text-left">
            <Bell className="h-4 w-4" />
            Notification Channels
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-text2 hover:bg-surface2 hover:text-text text-left">
            <Sliders className="h-4 w-4" />
            Workspace Preferences
          </button>
        </div>

        {/* Right Settings Form Area */}
        <div className="flex flex-col gap-6 md:col-span-2">
          {/* Profile Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile details</CardTitle>
              <CardDescription>Manage user credentials associated with this account.</CardDescription>
            </CardHeader>
            <CardContent className="mt-4">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Input
                  label="Display Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@propertypro.app"
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit">Save Profile</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Credentials Card */}
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>Update your workspace password.</CardDescription>
            </CardHeader>
            <CardContent className="mt-4">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
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
                <div className="flex justify-end">
                  <Button type="submit">Update Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace Preferences</CardTitle>
              <CardDescription>Change language, currency thresholds and themes.</CardDescription>
            </CardHeader>
            <CardContent className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Reporting Currency"
                  options={[
                    { value: 'INR', label: 'INR (₹)' },
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'GBP', label: 'GBP (£)' },
                  ]}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
                <Select
                  label="Visual Theme"
                  options={[
                    { value: 'light', label: 'Light Theme' },
                    { value: 'dark', label: 'Dark Theme' },
                    { value: 'system', label: 'System Defaults' },
                  ]}
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
              </div>

              {/* Notification Toggles */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-text uppercase tracking-wider">Mailing Channels</h4>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text">Email Invoices & Reports</span>
                    <span className="text-xs text-muted">Receive billing invoices and maintenance alerts.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-focus/30"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text">SMS Reminders</span>
                    <span className="text-xs text-muted">Recieve text reminders for overdue rentals.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-focus/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSavePreferences}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
