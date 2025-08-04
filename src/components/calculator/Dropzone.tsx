import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

type DropzoneProps = {
  onDrop: (files: File[]) => void;
};

export function Dropzone({ onDrop }: DropzoneProps) {
  const onDropCallback = useCallback((acceptedFiles: File[]) => {
    onDrop(acceptedFiles);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept: { 'text/csv': ['.csv'] },
  });

  return (
    <div {...getRootProps()} className="border-2 border-dashed p-4 text-center">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the CSV file here ...</p>
      ) : (
        <p>Drag 'n' drop CSV file here, or click to select</p>
      )}
      <Button>
        <Upload className="mr-2 h-4 w-4" /> Upload
      </Button>
    </div>
  );
} 