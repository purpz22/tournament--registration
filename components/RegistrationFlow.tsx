import React, { useState } from 'react';
import { AppState, Player, Question, Box } from '../types';
import { CheckIcon, UserIcon } from './Icons';

interface RegistrationFlowProps {
  state: AppState;
  onRegister: (player: Player) => void;
  onSelectBox: (playerId: string, boxId: string) => void;
  onSwitchToAdmin: () => void;
}

const RegistrationFlow: React.FC<RegistrationFlowProps> = ({ state, onRegister, onSelectBox, onSwitchToAdmin }) => {
  const [step, setStep] = useState<'form' | 'boxes' | 'done'>('form');
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [boxToJoin, setBoxToJoin] = useState<Box | null>(null);
  
  // Form State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  // Derived
  const currentPlayer = state.players.find(p => p.id === currentPlayerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    const missing = state.questions.filter(q => q.required && !answers[q.id]?.trim());
    if (missing.length > 0) {
      setError(`Please answer: ${missing.map(q => q.label).join(', ')}`);
      return;
    }

    // Name heuristic: Use first text question or generic
    const nameQuestionId = state.questions.find(q => q.type === 'text')?.id || state.questions[0]?.id;
    const name = answers[nameQuestionId] || 'Anonymous';

    const newPlayer: Player = {
      id: `p_${Date.now()}`,
      name,
      answers,
      selectedBoxId: null,
      registeredAt: Date.now(),
    };

    onRegister(newPlayer);
    setCurrentPlayerId(newPlayer.id);
    setStep('boxes');
  };

  const handleBoxClick = (box: Box) => {
    if (!currentPlayer) {
        console.error("Player not found in state");
        return;
    }

    const count = state.players.filter(p => p.selectedBoxId === box.id).length;
    if (count >= box.capacity) {
        alert("This box is full!");
        return;
    }

    if (currentPlayer.selectedBoxId === box.id) {
        return; // Already in this box
    }

    // Open confirmation modal
    setBoxToJoin(box);
  };

  const confirmJoinBox = () => {
      if (currentPlayer && boxToJoin) {
          onSelectBox(currentPlayer.id, boxToJoin.id);
          setBoxToJoin(null);
      }
  };

  const handleRestart = () => {
      setStep('form');
      setAnswers({});
      setCurrentPlayerId(null);
  };

  const renderForm = () => (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-xl border border-gray-100 mt-4 md:mt-10 overflow-hidden animate-fade-in">
        {state.settings.bannerUrl && (
            <div className="w-full h-32 md:h-48 bg-gray-100 relative">
                <img 
                    src={state.settings.bannerUrl} 
                    alt="Event Banner" 
                    className="w-full h-full object-cover"
                    style={{ objectPosition: `center ${state.settings.bannerPosition ?? 50}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
        )}
        
        <div className="p-6 md:p-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">{state.settings.eventTitle}</h1>
                <p className="text-sm md:text-base text-gray-500">{state.settings.eventDescription}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {state.questions.map(q => (
                    <div key={q.id}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {q.label} {q.required && <span className="text-red-500">*</span>}
                        </label>
                        {q.description && <p className="text-xs text-gray-400 mb-2">{q.description}</p>}
                        
                        {q.type === 'textarea' ? (
                            <textarea 
                                value={answers[q.id] || ''}
                                onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                                className="w-full border-gray-300 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition text-base"
                                rows={3}
                            />
                        ) : (
                            <input 
                                type={q.type}
                                value={answers[q.id] || ''}
                                onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                                className="w-full border-gray-300 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition text-base"
                            />
                        )}
                    </div>
                ))}

                {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm">{error}</div>}

                <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-lg hover:bg-blue-700 transition transform hover:scale-[1.01] shadow-md active:scale-95"
                >
                    Register & Pick Box
                </button>
            </form>
            <div className="mt-8 pt-4 border-t text-center">
                <button onClick={onSwitchToAdmin} className="text-xs text-gray-300 hover:text-gray-500 transition p-2">
                    Admin Access
                </button>
            </div>
        </div>
    </div>
  );

  const renderBoxes = () => {
    // If user has selected a box, show details.
    const userBoxId = currentPlayer?.selectedBoxId;
    const showTeammates = state.settings.showTeammates ?? true;

    return (
        <div className="w-full max-w-6xl mx-auto p-4 mt-4 md:mt-8">
             <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {userBoxId ? "Your Team" : "Select Your Team"}
                </h2>
                <p className="text-gray-500 mt-2 text-sm md:text-base">
                    {userBoxId 
                        ? (showTeammates ? "You have joined a box. Here are your teammates." : "You have joined a box. Teammates are hidden by admin.")
                        : "Tap a box to join instantly."}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {state.boxes.map(box => {
                    const playersInBox = state.players.filter(p => p.selectedBoxId === box.id);
                    const isFull = playersInBox.length >= box.capacity;
                    const isMyBox = userBoxId === box.id;
                    const canSeeContent = isMyBox && showTeammates;
                    
                    const isClickable = !isFull && !userBoxId;

                    return (
                        <div 
                            key={box.id}
                            onClick={() => isClickable ? handleBoxClick(box) : null}
                            className={`
                                relative p-5 rounded-xl border-2 transition-all duration-200
                                ${isMyBox 
                                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105 ring-4 ring-blue-100 z-10' 
                                    : isFull 
                                        ? 'border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed' 
                                        : 'border-white bg-white shadow-md hover:shadow-xl hover:-translate-y-1 cursor-pointer active:scale-95'
                                }
                                ${isClickable ? 'hover:border-blue-300' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className={`font-bold text-lg leading-tight ${isMyBox ? 'text-blue-800' : 'text-gray-800'}`}>
                                    {box.name}
                                </h3>
                                <span className={`
                                    px-2 py-1 rounded text-xs font-bold whitespace-nowrap
                                    ${playersInBox.length >= box.capacity ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}
                                `}>
                                    {playersInBox.length} / {box.capacity}
                                </span>
                            </div>

                            <div className="space-y-2 min-h-[80px]">
                                {canSeeContent ? (
                                    // REVEALED PLAYERS
                                    <div className="animate-fade-in">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Teammates</p>
                                        <ul className="space-y-2">
                                            {playersInBox.map(p => (
                                                <li key={p.id} className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white p-2 rounded border border-blue-100">
                                                    <UserIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                    <span className="truncate">{p.name}</span>
                                                    {p.id === currentPlayer?.id && <span className="text-xs text-blue-500 flex-shrink-0 ml-auto">(You)</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    // HIDDEN STATE
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-4">
                                        {isFull ? (
                                            <span className="text-sm font-medium">Full</span>
                                        ) : (
                                            <>
                                                {isMyBox ? (
                                                    <div className="text-center">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mx-auto mb-2">
                                                            <span className="text-xl font-bold">🔒</span>
                                                        </div>
                                                        <span className="text-xs font-semibold text-blue-600">Hidden</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <span className="text-xl font-bold text-gray-300">+</span>
                                                        </div>
                                                        <span className="text-xs font-semibold">Join</span>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {userBoxId === box.id && (
                                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-blue-600 text-white p-1 rounded-full shadow-lg z-20">
                                    <CheckIcon className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {userBoxId && (
                 <div className="text-center mt-12 pb-10">
                    <button 
                        onClick={handleRestart}
                        className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition shadow-lg w-full sm:w-auto"
                    >
                        Start New Registration
                    </button>
                    <p className="text-xs text-gray-400 mt-2">Use this to register another player (Simulates new session)</p>
                </div>
            )}

            {/* Confirmation Modal */}
            {boxToJoin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold text-blue-600">?</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Join {boxToJoin.name}?</h3>
                        <p className="text-gray-500 mb-6 text-sm">
                            You are about to join this team.
                            {showTeammates 
                                ? " Once joined, you'll be able to see your hidden teammates."
                                : " Note: Teammates are currently hidden by the administrator."
                            }
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setBoxToJoin(null)}
                                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmJoinBox}
                                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 transition transform hover:scale-[1.02]"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-2 md:p-0">
      {step === 'form' ? renderForm() : renderBoxes()}
    </div>
  );
};

export default RegistrationFlow;