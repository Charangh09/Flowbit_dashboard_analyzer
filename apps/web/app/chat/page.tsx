'use client';

import { useState } from 'react';

export default function ChatWithData() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const url = '/api/chat';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Chat error:', err);
      setResponse({ error: 'Failed to connect to Vanna AI server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">💬 Chat with Data</h1>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your invoices..."
          className="border p-2 flex-1 rounded"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </div>

      {response && (
        <div className="p-4 border rounded bg-gray-50">
          {response.error ? (
            <p className="text-red-600">{response.error}</p>
          ) : (
            <>
              {response.message && (
                <p className="font-medium mb-4">{response.message}</p>
              )}
              {response.rows && response.rows.length > 0 ? (
                <table className="w-full border-collapse border mt-2">
                  <thead>
                    <tr>
                      {Object.keys(response.rows[0]).map((key) => (
                        <th
                          key={key}
                          className="border px-4 py-2 text-left bg-gray-100"
                        >
                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {response.rows.map((row: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(row).map((val: any, i: number) => (
                          <td key={i} className="border px-4 py-2">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No data found.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
