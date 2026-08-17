'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function UploadClient({ workspaceId }: { workspaceId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', workspaceId); // Added explicit workspace context

    try {
      const res = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
      } else {
        setSuccess(true);
        // Start job automatically
        const jobRes = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioAssetId: data.audioAsset.id, workspaceId })
        });
        const jobData = await jobRes.json();
        if (jobRes.ok) {
          router.push(`/dashboard/jobs/${jobData.jobId}`);
        } else {
          setError(jobData.error || 'Failed to start job');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred during upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          Select an audio file
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Upload your audio file to transcribe and process it using AI. Supported formats: MP3, WAV, M4A, WEBM up to 25MB.</p>
        </div>
        
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">Audio uploaded successfully!</div>
          </div>
        )}

        <div className="mt-5">
          <input
            type="file"
            accept="audio/mpeg, audio/mp3, audio/wav, audio/x-wav, audio/mp4, audio/x-m4a, audio/webm"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
}
