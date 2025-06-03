'use client';

import { useState } from 'react';

export default function TextGeneratePage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch('/api/text-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    if (res.ok) {
      setResult(JSON.stringify(data, null, 2));
    } else {
      setResult(`Error: ${data.error || 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Wklej swój tekst</h1>
      <textarea
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: '100%' }}
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Generuję...' : 'Generuj notatki'}
      </button>
      <pre>{result}</pre>
    </div>
  );
}