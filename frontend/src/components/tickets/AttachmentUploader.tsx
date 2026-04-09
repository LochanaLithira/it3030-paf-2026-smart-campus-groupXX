import { useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUploadTicketAttachment } from '@/hooks/useTickets';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_ATTACHMENTS = 3;

interface AttachmentUploaderProps {
  ticketId: string;
  currentAttachmentCount: number;
  onUploadComplete?: () => void;
}

export function AttachmentUploader({
  ticketId,
  currentAttachmentCount,
  onUploadComplete,
}: AttachmentUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadAttachment = useUploadTicketAttachment();

  const canAddMore = currentAttachmentCount < MAX_ATTACHMENTS;

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 3MB';
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and WebP images are supported';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadAttachment.mutateAsync({
        ticketId,
        file: selectedFile,
      });

      // Clear selection
      setSelectedFile(null);
      setPreview(null);
      setError(null);

      // Reset file input
      const fileInput = document.getElementById('attachment-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onUploadComplete?.();
    } catch (err) {
      // Error is handled by the mutation
      console.error('Upload failed:', err);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);

    const fileInput = document.getElementById('attachment-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  if (!canAddMore) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              Maximum of {MAX_ATTACHMENTS} attachments reached. Delete an existing attachment to add more.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Input */}
      {!selectedFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Add an attachment</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max {MAX_ATTACHMENTS} images, 3MB each • JPG, PNG, WebP
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('attachment-upload')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <input
                id="attachment-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview & Upload */}
      {selectedFile && preview && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative aspect-video overflow-hidden rounded-lg border">
                <img
                  src={preview}
                  alt={selectedFile.name}
                  className="h-full w-full object-contain bg-muted"
                />
              </div>

              {/* File Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={uploadAttachment.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Upload Button */}
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploadAttachment.isPending}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadAttachment.isPending ? 'Uploading...' : 'Upload Attachment'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={uploadAttachment.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
