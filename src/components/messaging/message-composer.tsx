'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Paperclip, Send, X, Loader2 } from 'lucide-react';

interface MessageComposerProps {
  onSend: (content: string, imageUrl?: string) => Promise<void>;
  isSending?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageComposer({
  onSend,
  isSending = false,
  placeholder = 'Type a message...',
  disabled = false,
}: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = content.trim().length > 0 || imagePreview;
  const isDisabled = disabled || isSending || isUploading;

  const handleSend = async () => {
    if (!canSend || isDisabled) return;

    const messageContent = content.trim();
    setContent('');

    try {
      await onSend(messageContent, imagePreview || undefined);
      setImagePreview(null);
    } catch {
      // Restore content on error
      setContent(messageContent);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // TODO: Upload to storage and get URL
      // For now, using data URL as preview
      // In production, upload to Vercel Blob or similar
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-stone-200/60 bg-white/80 backdrop-blur-sm p-4">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 relative inline-block">
          <img
            src={imagePreview}
            alt="Attachment preview"
            className="max-h-32 rounded-lg border border-stone-200"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center hover:bg-stone-700 transition-colors"
            disabled={isDisabled}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors',
            isDisabled
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          )}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            maxLength={2000}
            className={cn(
              'w-full resize-none rounded-2xl border border-stone-200/60 bg-white px-4 py-3 pr-12',
              'text-sm text-stone-800 placeholder:text-stone-400',
              'focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500',
              'disabled:bg-stone-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend || isDisabled}
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
            canSend && !isDisabled
              ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md hover:shadow-lg hover:scale-105'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          )}
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Character count (show when approaching limit) */}
      {content.length > 1800 && (
        <div className="mt-1 text-xs text-right text-stone-400">
          {content.length}/2000
        </div>
      )}
    </div>
  );
}
