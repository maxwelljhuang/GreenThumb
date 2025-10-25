'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Settings, Heart, Bookmark, Share2, History, Bell, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { useUser } from '@/contexts/user-context'
import { UserPreferences } from '@/types'

interface ProfileTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const profileTabs: ProfileTab[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'activity', label: 'Activity', icon: History },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
]

export function ProfileContent() {
  const { user, updateUser, updatePreferences } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)

  if (!user) {
    return (
      <div className="container-custom py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-forest mb-2">
            Please log in to view your profile
          </h3>
          <p className="text-dune">
            You need to be logged in to access your profile and preferences.
          </p>
        </div>
      </div>
    )
  }

  const handlePreferencesUpdate = (newPreferences: Partial<UserPreferences>) => {
    updatePreferences(newPreferences)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab user={user} isEditing={isEditing} onEditToggle={setIsEditing} />
      case 'preferences':
        return <PreferencesTab preferences={user.preferences || {} as any} onUpdate={handlePreferencesUpdate} />
      case 'activity':
        return <ActivityTab userId={user.id} />
      case 'notifications':
        return <NotificationsTab />
      case 'privacy':
        return <PrivacyTab />
      default:
        return <OverviewTab user={user} isEditing={isEditing} onEditToggle={setIsEditing} />
    }
  }

  return (
    <div className="container-custom py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-forest mb-2">
            Your Profile
          </h1>
          <p className="text-dune text-lg">
            Manage your preferences and account settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <div className="space-y-2">
                {profileTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-pine text-sand'
                        : 'text-dune hover:bg-sage/10'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ 
  user, 
  isEditing, 
  onEditToggle 
}: { 
  user: any
  isEditing: boolean
  onEditToggle: (editing: boolean) => void 
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-forest">{user.name || 'User'}</h2>
              <p className="text-dune">{user.email}</p>
              <p className="text-sm text-sage">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => onEditToggle(!isEditing)}
          >
            {isEditing ? 'Save' : 'Edit Profile'}
          </Button>
        </div>

        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 p-4 bg-sage/10 rounded-lg"
          >
            <div>
              <label className="block text-sm font-medium text-forest mb-2">Name</label>
              <input
                type="text"
                defaultValue={user.name}
                className="w-full px-3 py-2 border border-sage/20 rounded-lg focus:ring-2 focus:ring-pine focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest mb-2">Bio</label>
              <textarea
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2 border border-sage/20 rounded-lg focus:ring-2 focus:ring-pine focus:border-transparent"
              />
            </div>
          </motion.div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Heart className="h-8 w-8 text-pine mx-auto mb-2" />
          <div className="text-2xl font-bold text-forest">42</div>
          <div className="text-sm text-dune">Liked Products</div>
        </Card>
        <Card className="p-4 text-center">
          <Bookmark className="h-8 w-8 text-pine mx-auto mb-2" />
          <div className="text-2xl font-bold text-forest">18</div>
          <div className="text-sm text-dune">Saved Collections</div>
        </Card>
        <Card className="p-4 text-center">
          <Share2 className="h-8 w-8 text-pine mx-auto mb-2" />
          <div className="text-2xl font-bold text-forest">7</div>
          <div className="text-sm text-dune">Shared Items</div>
        </Card>
      </div>
    </div>
  )
}

// Preferences Tab Component
function PreferencesTab({ 
  preferences, 
  onUpdate 
}: { 
  preferences: UserPreferences
  onUpdate: (prefs: Partial<UserPreferences>) => void 
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-forest mb-4">Style Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest mb-2">Selected Moodboards</label>
            <div className="flex flex-wrap gap-2">
              {preferences.selectedMoodboards?.map((moodboard) => (
                <span
                  key={moodboard}
                  className="px-3 py-1 bg-sage/20 text-forest rounded-full text-sm"
                >
                  {moodboard}
                </span>
              )) || (
                <span className="text-dune text-sm">No moodboards selected</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-forest mb-2">Price Range</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-dune">${preferences.priceRange?.min || 0}</span>
              <span className="text-dune">-</span>
              <span className="text-sm text-dune">${preferences.priceRange?.max || 1000}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-forest mb-2">Preferred Categories</label>
            <div className="flex flex-wrap gap-2">
              {preferences.preferredCategories?.map((category) => (
                <span
                  key={category}
                  className="px-3 py-1 bg-pine/20 text-pine rounded-full text-sm"
                >
                  {category}
                </span>
              )) || (
                <span className="text-dune text-sm">No categories selected</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold text-forest mb-4">Recommendation Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-forest">Personalized Recommendations</div>
              <div className="text-sm text-dune">Get recommendations based on your preferences</div>
            </div>
            <input
              type="checkbox"
              defaultChecked={preferences.onboardingCompleted}
              className="h-4 w-4 text-pine focus:ring-pine border-sage/20 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-forest">Email Notifications</div>
              <div className="text-sm text-dune">Receive updates about new recommendations</div>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="h-4 w-4 text-pine focus:ring-pine border-sage/20 rounded"
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

// Activity Tab Component
function ActivityTab({ userId }: { userId: string }) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-forest mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {[
          { action: 'Liked', item: 'Vintage Leather Jacket', time: '2 hours ago' },
          { action: 'Saved', item: 'Sustainable Home Decor', time: '1 day ago' },
          { action: 'Shared', item: 'Eco-Friendly Skincare', time: '3 days ago' },
          { action: 'Searched', item: 'minimalist furniture', time: '1 week ago' },
        ].map((activity, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-sage/10 rounded-lg">
            <div className="w-2 h-2 bg-pine rounded-full"></div>
            <div className="flex-1">
              <span className="font-medium text-forest">{activity.action}</span>
              <span className="text-dune ml-2">{activity.item}</span>
            </div>
            <span className="text-sm text-dune">{activity.time}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// Notifications Tab Component
function NotificationsTab() {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-forest mb-4">Notification Settings</h3>
      <div className="space-y-4">
        {[
          { title: 'New Recommendations', description: 'Get notified when we find new products for you' },
          { title: 'Price Drops', description: 'Alert when saved items go on sale' },
          { title: 'Weekly Digest', description: 'Summary of your weekly activity' },
          { title: 'Product Updates', description: 'Updates about products you\'ve interacted with' },
        ].map((notification, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-sage/20 rounded-lg">
            <div>
              <div className="font-medium text-forest">{notification.title}</div>
              <div className="text-sm text-dune">{notification.description}</div>
            </div>
            <input
              type="checkbox"
              defaultChecked={index < 2}
              className="h-4 w-4 text-pine focus:ring-pine border-sage/20 rounded"
            />
          </div>
        ))}
      </div>
    </Card>
  )
}

// Privacy Tab Component
function PrivacyTab() {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-forest mb-4">Privacy Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-forest">Public Profile</div>
            <div className="text-sm text-dune">Allow others to see your collections</div>
          </div>
          <input
            type="checkbox"
            defaultChecked={false}
            className="h-4 w-4 text-pine focus:ring-pine border-sage/20 rounded"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-forest">Data Analytics</div>
            <div className="text-sm text-dune">Help improve recommendations with usage data</div>
          </div>
          <input
            type="checkbox"
            defaultChecked={true}
            className="h-4 w-4 text-pine focus:ring-pine border-sage/20 rounded"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-forest">Marketing Emails</div>
            <div className="text-sm text-dune">Receive promotional content and updates</div>
          </div>
          <input
            type="checkbox"
            defaultChecked={false}
            className="h-4 w-4 text-pine focus:ring-pine border-sage/20 rounded"
          />
        </div>
      </div>
    </Card>
  )
}
