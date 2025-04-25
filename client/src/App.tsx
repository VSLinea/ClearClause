import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [contract, setContract] = useState('');
  const [simplified, setSimplified] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSimplified('');
    try {
      const res = await fetch('http://localhost:3001/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contract }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setSimplified(data.summary);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-6 rounded shadow">
        <label className="block mb-2 font-semibold">Paste contract text:</label>
        <textarea
          className="w-full h-32 p-2 border rounded mb-4"
          value={contract}
          onChange={e => setContract(e.target.value)}
          required
          placeholder="Enter contract text here..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Simplifying...' : 'Simplify'}
        </button>
      </form>
      {error && <div className="text-red-600 mt-4">{error}</div>}
      {simplified && (
        <div className="mt-6 w-full max-w-lg bg-green-50 p-4 rounded shadow">
          <div className="font-semibold mb-2">Simplified Contract:</div>
          <div>{simplified}</div>
        </div>
      )}
    </div>
  )
}

export default App
