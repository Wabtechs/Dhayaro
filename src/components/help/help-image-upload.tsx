'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { ImageUp, Trash2, Loader2 } from 'lucide-react'

interface HelpImageData {
  id: string
  location: string
  imageData: string | null
  altText: string | null
}

interface Props {
  location: string
  altText?: string
}

export function HelpImageUpload({ location, altText }: Props) {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isSuperAdmin = user?.role === 'super_admin'
  const [image, setImage] = useState<HelpImageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/v1/help-images?locations=${encodeURIComponent(location)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setImage(data[0])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [location, token])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setUploading(true)
      try {
        const res = await fetch('/api/v1/help-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ location, imageData: dataUrl, altText: altText || '' }),
        })
        if (res.ok) {
          const updated = await res.json()
          setImage(updated)
        }
      } catch {}
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = async () => {
    setUploading(true)
    try {
      const res = await fetch(`/api/v1/help-images/${encodeURIComponent(location)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setImage(null)
    } catch {}
    setUploading(false)
  }

  if (loading) return null

  const hasImage = image?.imageData

  return (
    <div className="relative mt-6 mb-2">
      {hasImage ? (
        <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={image.imageData!}
            alt={image.altText || altText || ''}
            className="w-full max-h-80 object-contain bg-gray-50 dark:bg-gray-900"
          />
          {isSuperAdmin && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Remplacer l'image"
              >
                <ImageUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Supprimer l'image"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 text-red-500" />
                )}
              </button>
            </div>
          )}
        </div>
      ) : isSuperAdmin ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-8 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 transition-colors cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <>
              <ImageUp className="w-8 h-8" />
              <span className="text-sm">Ajouter une image d&apos;illustration</span>
            </>
          )}
        </button>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
