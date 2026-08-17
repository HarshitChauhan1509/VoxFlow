'use client';

import { useEffect, useState } from 'react';

export function JobClient({ initialJob }: { initialJob: any }) {
  const [job, setJob] = useState(initialJob);

  useEffect(() => {
    if (job.status === 'COMPLETED' || job.status === 'FAILED') return;

    const evtSource = new EventSource(`/api/jobs/${job.id}/stream`);

    evtSource.onmessage = (event) => {
      try {
        if (event.data.includes('heartbeat')) return;
        const data = JSON.parse(event.data);
        
        setJob((prev: any) => ({ ...prev, ...data }));

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          evtSource.close();
          // Fetch final updated data
          window.location.reload();
        }
      } catch (e) {
        console.error('Failed to parse SSE data', e);
      }
    };

    evtSource.onerror = () => {
      evtSource.close();
    };

    return () => evtSource.close();
  }, [job.id, job.status]);

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <span className="text-sm font-medium text-gray-500 w-24">Status</span>
        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium ${
          job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          job.status === 'FAILED' ? 'bg-red-100 text-red-800' :
          job.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 animate-pulse' :
          'bg-gray-100 text-gray-800'
        }`}>
          {job.status}
        </span>
      </div>

      {job.error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700 font-semibold">Error</div>
          <div className="text-sm text-red-600 mt-1">{job.error}</div>
        </div>
      )}

      {job.transcript && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Transcript</h3>
          <div className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
            {job.transcript}
          </div>
        </div>
      )}

      {job.aiAnalysis && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI Analysis</h3>
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="font-semibold text-indigo-900 mb-2">Summary</p>
            <p className="text-indigo-800 mb-4">{job.aiAnalysis.summary}</p>
            
            <p className="font-semibold text-indigo-900 mb-2">Action Items</p>
            <ul className="list-disc pl-5 text-indigo-800 mb-4">
              {job.aiAnalysis.actionItems?.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <p className="font-semibold text-indigo-900 mb-1">Sentiment</p>
            <span className="inline-flex items-center rounded-md bg-indigo-200 px-2.5 py-0.5 text-sm font-medium text-indigo-800 uppercase tracking-wider">
              {job.aiAnalysis.sentiment}
            </span>
          </div>
        </div>
      )}

      {job.generatedAudioKey && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generated Audio Summary</h3>
          <audio controls className="w-full" src={`/api/audio/serve/${job.generatedAudioKey}`}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}
