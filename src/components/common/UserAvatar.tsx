import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserAvatarProps {
  user?: {
    avatar_url?: string | null
    full_name?: string | null
    username?: string | null
    email?: string | null
  } | null
  className?: string
  fallbackClassName?: string
}

/**
 * Generates initials from user data with consistent priority:
 * 1. Full name: First letter of first and last name (e.g., "Jan Mrkonjič" -> "JM")
 * 2. Username: First 2 characters
 * 3. Email: First 2 characters
 */
function getInitials(user?: UserAvatarProps['user']): string {
  if (!user) return 'U'

  // Priority 1: Full name
  if (user.full_name) {
    const names = user.full_name.trim().split(/\s+/)
    if (names.length >= 2) {
      // First letter of first name + first letter of last name
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    } else if (names.length === 1 && names[0].length >= 2) {
      // Single name: take first 2 characters
      return names[0].substring(0, 2).toUpperCase()
    }
  }

  // Priority 2: Username
  if (user.username && user.username.length >= 2) {
    return user.username.substring(0, 2).toUpperCase()
  }

  // Priority 3: Email
  if (user.email && user.email.length >= 2) {
    return user.email.substring(0, 2).toUpperCase()
  }

  return 'U'
}

export function UserAvatar({ user, className, fallbackClassName }: UserAvatarProps) {
  const initials = getInitials(user)

  return (
    <Avatar className={className}>
      <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || user?.username || 'User'} />
      <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
    </Avatar>
  )
}
