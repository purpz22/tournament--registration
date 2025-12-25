import React, { useState } from 'react';
import { useAppStorage } from './hooks/useLocalStorage';
import AdminPanel from './components/AdminPanel';
import RegistrationFlow from './components/RegistrationFlow';

const App = () => {
  const { state, isLoaded, actions } = useAppStorage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  if (!isLoaded) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'zxczxc') {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  return (
    <>
      {isAdmin ? (
        <AdminPanel 
          state={state} 
          actions={actions} 
          onExit={() => setIsAdmin(false)} 
        />
      ) : (
        <>
          <RegistrationFlow 
            state={state} 
            onRegister={actions.registerPlayer}
            onSelectBox={actions.selectBox}
            onSwitchToAdmin={() => {
                setShowLogin(true);
                setLoginError(false);
                setPassword('');
            }}
          />
          
          {showLogin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in border border-gray-100">
                    <div className="bg-slate-900 p-4 text-white">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                             🔒 Admin Verification
                        </h3>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleLogin}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                                className={`w-full border rounded-lg p-3 outline-none transition-all ${loginError ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'}`}
                                placeholder="Enter admin password"
                            />
                            {loginError && <p className="text-red-600 text-sm mt-2 font-medium">Incorrect password. Please try again.</p>}
                            
                            <div className="flex gap-3 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setShowLogin(false)}
                                    className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-2.5 px-4 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium shadow-lg shadow-slate-900/20 transition"
                                >
                                    Login
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default App;