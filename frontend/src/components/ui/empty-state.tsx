import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {icon && (
        <div className="mb-4 text-6xl">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-forest mb-2">
        {title}
      </h3>
      <p className="text-dune text-sm max-w-md mb-6">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

interface EmptySearchProps {
  query: string
  onClearSearch: () => void
}

export function EmptySearch({ query, onClearSearch }: EmptySearchProps) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={`We couldn't find any products matching "${query}". Try adjusting your search terms or filters.`}
      action={{
        label: 'Clear search',
        onClick: onClearSearch,
      }}
    />
  )
}

interface EmptyFeedProps {
  onRefresh: () => void
}

export function EmptyFeed({ onRefresh }: EmptyFeedProps) {
  return (
    <EmptyState
      icon="🏠"
      title="No recommendations yet"
      description="We're working on finding products that match your style. Check back soon for personalized recommendations."
      action={{
        label: 'Refresh',
        onClick: onRefresh,
      }}
    />
  )
}

interface EmptySavedProps {
  onBrowse: () => void
}

export function EmptySaved({ onBrowse }: EmptySavedProps) {
  return (
    <EmptyState
      icon="💾"
      title="No saved items"
      description="Start saving products you love to see them here. Browse our recommendations to find items you'll want to save."
      action={{
        label: 'Browse products',
        onClick: onBrowse,
      }}
    />
  )
}
