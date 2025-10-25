'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Home, Search, Heart, Bookmark, User, Settings } from 'lucide-react'

interface NavigationProps {
  className?: string
}

export function Navigation({ className }: NavigationProps) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState(pathname)

  const navigation = [
    { name: 'Feed', href: '/feed', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Liked', href: '/liked', icon: Heart },
    { name: 'Saved', href: '/saved', icon: Bookmark },
  ]

  return (
    <nav className={cn('flex items-center space-x-1', className)}>
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'flex items-center space-x-2 px-3 py-2',
                isActive
                  ? 'bg-pine text-sand hover:bg-forest'
                  : 'text-dune hover:text-forest hover:bg-sage/20'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.name}</span>
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}

interface MobileNavigationProps {
  className?: string
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Feed', href: '/feed', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Liked', href: '/liked', icon: Heart },
    { name: 'Saved', href: '/saved', icon: Bookmark },
  ]

  return (
    <nav className={cn('fixed bottom-0 left-0 right-0 bg-white border-t border-dune/20 px-4 py-2 z-50', className)}>
      <div className="flex justify-around">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'flex flex-col items-center space-y-1 px-3 py-2 h-auto',
                  isActive
                    ? 'text-pine'
                    : 'text-dune hover:text-forest'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.name}</span>
              </Button>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
