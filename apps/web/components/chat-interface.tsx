import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ChatResponse = {
  message: string;
  rows: Array<{
    [key: string]: string;
  }>;
};

export function ChatInterface({ onDataReceived }: { onDataReceived: (data: any[]) => void }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data: ChatResponse = await response.json();
      onDataReceived(data.rows);
    } catch (err) {
      setError('Failed to fetch data. Make sure the Vanna service is running.');
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask about the data</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., 'Show me spend by category' or 'Who are our top vendors?'"
              className="w-full p-2 border rounded-md"
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !question}
            className={`px-4 py-2 rounded-md bg-blue-500 text-white ${
              loading || !question ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            {loading ? 'Loading...' : 'Ask'}
          </button>
        </form>
      </CardContent>
      <div className="px-6 py-4 text-sm text-gray-500">
        Try asking about spending categories, top vendors, or invoice trends
      </div>
    </Card>
  );
}