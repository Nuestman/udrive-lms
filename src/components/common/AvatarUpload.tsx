/**
 * Avatar Upload Component
 * 
 * Reusable component for uploading user avatars
 */

import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { useAvatarUpload } from '../../hooks/useMedia';
import { validateFile, compressImage } from '../../utils/upload.utils';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onUploadSuccess?: (avatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32'
};

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onUploadSuccess,
  size = 'md'
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadAvatar, uploading, error } = useAvatarUpload();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, 'avatar');
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Compress image if it's large
    let processedFile = file;
    if (file.size > 1024 * 1024) { // If larger than 1MB
      try {
        processedFile = await compressImage(file, 800, 0.85);
      } catch (err) {
        console.error('Image compression failed:', err);
      }
    }

    setSelectedFile(processedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(processedFile);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const response = await uploadAvatar(selectedFile);
      onUploadSuccess?.(response.avatarUrl);
      setSelectedFile(null);
      setPreview(null);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = preview || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Preview */}
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 group`}>
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Camera className="w-8 h-8" />
          </div>
        )}

        {/* Overlay on hover */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Actions */}
      {selectedFile ? (
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            onClick={handleCancel}
            disabled={uploading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          Choose Photo
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {/* File Info */}
      {selectedFile && (
        <div className="text-xs text-gray-500">
          {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;

