import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function MunicipalRoute({ children }) {
  const [pass, setPass] = useState('');
  const [granted, setGranted] = useState(localStorage.getItem('municipal_pass') === '123456');
  const [error, setError] = useState(false);

  if (granted) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pass === '123456') {
      localStorage.setItem('municipal_pass', '123456');
      setGranted(true);
      setError(false);
      window.location.reload(); // Refresh to attach headers securely on first load
    } else {
      setError(true);
      setPass('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-slate-100">
        <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-800">Municipal Access</h2>
        <p className="text-slate-500 mb-8 text-sm">Enter the authority override password to access the municipal dashboard directly.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              type="password" 
              placeholder="Enter Password (123456)" 
              className={`w-full p-3 border rounded-xl bg-slate-50 focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-100 focus:border-blue-400'}`}
              value={pass}
              onChange={e => { setPass(e.target.value); setError(false); }}
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-2 text-left font-medium">Incorrect password. Hint: 123456</p>}
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition flex justify-center items-center text-white font-bold py-3 px-4 rounded-xl shadow-md">
            Unlock Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
