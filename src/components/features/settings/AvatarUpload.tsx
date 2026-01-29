import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, Trash2 } from 'lucide-react'
import { uploadAvatar } from '@/hooks/useProfile'
import { toast } from 'sonner'

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  username: string | null
  onUploadComplete: (url: string) => void
  onRemove: () => void
}

export function AvatarUpload({ currentAvatarUrl, username, onUploadComplete, onRemove }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = () => {
    if (!username) return '?'
    return username.substring(0, 2).toUpperCase()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setIsUploading(true)
    try {
      const url = await uploadAvatar(file)
      onUploadComplete(url)
      toast.success('Avatar uploaded successfully')
    } catch (error) {
      toast.error(`Failed to upload avatar: ${(error as Error).message}`)
    } finally {
      setIsUploading(false)
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={currentAvatarUrl || undefined} alt={username || 'User'} />
        <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={handleButtonClick}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Avatar
              </>
            )}
          </Button>
          
          {/* Remove Picture Button - only show if avatar exists */}
          {currentAvatarUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemove}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or GIF. Max 2MB.
        </p>
      </div>
    </div>
  )
}
