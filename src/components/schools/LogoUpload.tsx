/**
 * Logo Upload Component
 * For tenant/school logos with preview
 */

import React, { useState, useRef } from 'react';
import { Building2, Upload, X } from 'lucide-react';
import { validateFile, compressImage } from '../../utils/upload.utils';

interface LogoUploadProps {
  currentLogoUrl?: string;
  onUploadSuccess?: (logoUrl: string) => void;
  disabled?: boolean;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({
  currentLogoUrl,
  onUploadSuccess,
  disabled = false
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateFile(file, 'thumbnail');
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Compress image if needed
    let processedFile = file;
    if (file.size > 1024 * 1024) {
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

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = preview || currentLogoUrl;

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="relative w-full h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden group hover:border-gray-400 transition-colors">
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="School logo"
              className="w-full h-full object-contain p-4"
            />
            {!disabled && (
              <div
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                <div className="text-white text-center">
                  <Upload className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-sm">Change Logo</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-gray-400"
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <Building2 className="w-12 h-12 mb-2" />
            <span className="text-sm font-medium">Click to upload logo</span>
            <span className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (max 5MB)</span>
          </div>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* Actions - Only show if file is selected */}
      {selectedFile && !disabled && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onUploadSuccess && onUploadSuccess('')}
            disabled={uploading}
            className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : 'Use This Logo'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={uploading}
            className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
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

export default LogoUpload;

