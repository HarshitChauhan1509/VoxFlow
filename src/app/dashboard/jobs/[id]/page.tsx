'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function JobDetailsPage() {
  const { id } = useParams() as { id: string };
  const [status, setStatus] = useState<string>('CONNECTING...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const evtSource = new EventSource(`/api/jobs/${id}/stream`);

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status) setStatus(data.status);
        if (data.error) setError(data.error);

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          evtSource.close();
        }
      } catch (e) {
        console.error('Failed to parse SSE data', e);
      }
    };

    evtSource.onerror = () => {
      console.error('EventSource failed.');
      evtSource.close();
      setStatus('DISCONNECTED');
    };

    return () => {
      evtSource.close();
    };
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Job Details: {id}
          </h2>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4 border-b pb-4">
            <span className="text-sm font-medium text-gray-500 w-24">Status</span>
            <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium ${
              status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              status === 'FAILED' ? 'bg-red-100 text-red-800' :
              status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 animate-pulse' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status}
            </span>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mt-4">
              <div className="text-sm text-red-700 font-semibold">Error</div>
              <div className="text-sm text-red-600 mt-1">{error}</div>
            </div>
          )}
          
          <div className="text-sm text-gray-500 mt-4">
            <p>Listen for real-time progress. Background workers are transcribing the audio, analyzing it via AI, and generating a synthesized summary.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
