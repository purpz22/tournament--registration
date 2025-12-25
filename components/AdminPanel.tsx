import React, { useState } from 'react';
import { AppState, Question, QuestionType, Player, Box } from '../types';
import { TrashIcon, EditIcon, PlusIcon, UserIcon } from './Icons';

interface AdminPanelProps {
  state: AppState;
  actions: {
    updateSettings: (title: string, desc: string, bannerUrl: string, bannerPosition: number, showTeammates: boolean) => void;
    addQuestion: (q: Question) => void;
    updateQuestion: (q: Question) => void;
    deleteQuestion: (id: string) => void;
    updateBox: (b: Box) => void;
    deletePlayer: (id: string) => void;
    movePlayer: (playerId: string, boxId: string | null) => void;
    resetData: () => void;
  };
  onExit: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ state, actions, onExit }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'questions' | 'boxes' | 'teams' | 'players'>('questions');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingBox, setEditingBox] = useState<Box | null>(null);

  // Settings State
  const [title, setTitle] = useState(state.settings.eventTitle);
  const [desc, setDesc] = useState(state.settings.eventDescription);
  const [banner, setBanner] = useState(state.settings.bannerUrl || '');
  const [bannerPos, setBannerPos] = useState(state.settings.bannerPosition ?? 50);
  const [showTeammates, setShowTeammates] = useState(state.settings.showTeammates ?? true);

  // Question Form State
  const [qLabel, setQLabel] = useState('');
  const [qDesc, setQDesc] = useState('');
  const [qType, setQType] = useState<QuestionType>('text');
  const [qRequired, setQRequired] = useState(true);

  // Box Form State
  const [bName, setBName] = useState('');
  const [bCap, setBCap] = useState(5);

  // Drag State
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);

  const handleSaveSettings = () => {
    actions.updateSettings(title, desc, banner, bannerPos, showTeammates);
    alert('Settings saved!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Limit size to ~2.5MB to be safe with LocalStorage (5MB total)
      if (file.size > 2.5 * 1024 * 1024) {
          alert("Image is too large (Max 2.5MB). Please compress it or use an external URL.");
          // Clear input
          e.target.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          const result = reader.result as string;
          setBanner(result);
      };
      reader.readAsDataURL(file);
      
      // Clear input so same file can be selected again
      e.target.value = '';
  };

  const handleSaveQuestion = () => {
    if (!qLabel.trim()) return;

    const newQuestion: Question = {
      id: editingQuestion ? editingQuestion.id : `q_${Date.now()}`,
      label: qLabel,
      description: qDesc,
      type: qType,
      required: qRequired,
      order: editingQuestion ? editingQuestion.order : state.questions.length,
    };

    if (editingQuestion) {
      actions.updateQuestion(newQuestion);
    } else {
      actions.addQuestion(newQuestion);
    }
    
    resetQuestionForm();
  };

  const handleSaveBox = () => {
      if (!editingBox || !bName.trim()) return;
      
      actions.updateBox({
          ...editingBox,
          name: bName,
          capacity: bCap
      });
      setEditingBox(null);
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQLabel('');
    setQDesc('');
    setQType('text');
    setQRequired(true);
  };

  const startEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQLabel(q.label);
    setQDesc(q.description || '');
    setQType(q.type);
    setQRequired(q.required);
  };

  const startEditBox = (b: Box) => {
      setEditingBox(b);
      setBName(b.name);
      setBCap(b.capacity);
  };

  // Drag & Drop Handlers
  const onDragStart = (e: React.DragEvent, playerId: string) => {
      setDraggedPlayerId(playerId);
      e.dataTransfer.setData("playerId", playerId);
      e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
  };

  const onDrop = (e: React.DragEvent, boxId: string | null) => {
      e.preventDefault();
      const playerId = e.dataTransfer.getData("playerId");
      if (playerId && draggedPlayerId === playerId) {
          actions.movePlayer(playerId, boxId);
      }
      setDraggedPlayerId(null);
  };

  // Helper to determine if banner is a data URL
  const isDataUrl = banner.startsWith('data:');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
            <span className="bg-red-500 text-xs px-2 py-1 rounded uppercase tracking-wider hidden sm:inline-block">Admin Mode</span>
            Dashboard
        </h1>
        <button onClick={onExit} className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition">
          Exit to App
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Sidebar */}
        <nav className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 overflow-x-auto md:overflow-y-auto flex-shrink-0">
          <div className="flex md:block p-2 md:p-4 gap-2">
              {[
                  { id: 'settings', label: 'Settings' },
                  { id: 'questions', label: 'Questions' },
                  { id: 'boxes', label: 'Boxes' },
                  { id: 'teams', label: 'Team Board' },
                  { id: 'players', label: 'Players' }
              ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                        px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors
                        ${activeTab === tab.id 
                            ? 'bg-indigo-50 text-indigo-700 md:w-full md:text-left' 
                            : 'text-gray-600 hover:bg-gray-50 md:w-full md:text-left'}
                    `}
                >
                    {tab.label}
                </button>
              ))}
          </div>
          <div className="hidden md:block p-4 mt-auto border-t border-gray-100">
             <button onClick={actions.resetData} className="text-red-600 text-sm hover:underline w-full text-left">
                Reset All Player Data
             </button>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-50">
            
            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Event Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea 
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                rows={4}
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                             <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={showTeammates} 
                                        onChange={(e) => setShowTeammates(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">Allow players to see their teammates</span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1 ml-14">
                                If disabled, players will only see a "Hidden" message even after joining a box.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                            
                            <div className="space-y-3">
                                {isDataUrl ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            disabled
                                            value="(Image Data Uploaded)"
                                            className="w-full border border-gray-300 rounded-md p-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed italic"
                                        />
                                        <button 
                                            onClick={() => setBanner('')}
                                            className="px-3 py-2 bg-red-100 text-red-600 rounded-md text-sm hover:bg-red-200 transition whitespace-nowrap"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                ) : (
                                    <input 
                                        type="text" 
                                        value={banner}
                                        onChange={(e) => setBanner(e.target.value)}
                                        placeholder="https://example.com/banner.gif"
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                    />
                                )}
                                
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 uppercase font-bold">OR Upload:</span>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                </div>
                            </div>

                            {banner && (
                                <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Preview & Adjust Position ({bannerPos}%)</label>
                                    <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 relative mb-2">
                                        <img 
                                            src={banner} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover transition-all" 
                                            style={{ objectPosition: `center ${bannerPos}%` }}
                                            onError={(e) => (e.currentTarget.style.display = 'none')} 
                                        />
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={bannerPos} 
                                        onChange={(e) => setBannerPos(Number(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>Top</span>
                                        <span>Center</span>
                                        <span>Bottom</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleSaveSettings}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition w-full md:w-auto"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Boxes Tab */}
            {activeTab === 'boxes' && (
                 <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Boxes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {state.boxes.map(box => {
                             const isEditing = editingBox?.id === box.id;
                             return (
                                 <div key={box.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                     {isEditing ? (
                                         <div className="space-y-3">
                                             <div>
                                                 <label className="block text-xs font-bold text-gray-500 uppercase">Box Name</label>
                                                 <input 
                                                     type="text" 
                                                     value={bName}
                                                     onChange={e => setBName(e.target.value)}
                                                     className="w-full border border-gray-300 rounded p-1 text-sm"
                                                 />
                                             </div>
                                             <div>
                                                 <label className="block text-xs font-bold text-gray-500 uppercase">Capacity</label>
                                                 <input 
                                                     type="number" 
                                                     value={bCap}
                                                     onChange={e => setBCap(parseInt(e.target.value))}
                                                     min="1"
                                                     className="w-full border border-gray-300 rounded p-1 text-sm"
                                                 />
                                             </div>
                                             <div className="flex gap-2">
                                                 <button onClick={handleSaveBox} className="flex-1 bg-green-600 text-white text-xs py-2 rounded">Save</button>
                                                 <button onClick={() => setEditingBox(null)} className="flex-1 bg-gray-200 text-gray-700 text-xs py-2 rounded">Cancel</button>
                                             </div>
                                         </div>
                                     ) : (
                                         <div>
                                             <div className="flex justify-between items-start mb-2">
                                                 <h3 className="font-bold text-lg text-gray-800">{box.name}</h3>
                                                 <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Cap: {box.capacity}</span>
                                             </div>
                                             <p className="text-xs text-gray-400 mb-4">ID: {box.id}</p>
                                             <button 
                                                 onClick={() => startEditBox(box)}
                                                 className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium py-2 rounded transition"
                                             >
                                                 Edit Box
                                             </button>
                                         </div>
                                     )}
                                 </div>
                             );
                        })}
                    </div>
                 </div>
            )}

            {/* Teams Management (Drag & Drop) */}
            {activeTab === 'teams' && (
                <div className="h-full flex flex-col">
                    <div className="mb-4 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Team Board</h2>
                        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded shadow-sm border">Drag players to move them between boxes</span>
                    </div>
                    
                    <div className="flex-1 overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max h-full">
                            {/* Unassigned Column */}
                            <div 
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, null)}
                                className="w-64 bg-gray-200 rounded-lg p-3 flex flex-col gap-2 border-2 border-dashed border-gray-300"
                            >
                                <h3 className="font-bold text-gray-700 uppercase text-sm mb-2 flex justify-between">
                                    Unassigned 
                                    <span className="bg-gray-300 text-gray-600 text-xs px-2 rounded-full">
                                        {state.players.filter(p => !p.selectedBoxId).length}
                                    </span>
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-2 min-h-[100px]">
                                    {state.players.filter(p => !p.selectedBoxId).map(player => (
                                        <div 
                                            key={player.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, player.id)}
                                            className="bg-white p-3 rounded shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition"
                                        >
                                            <p className="font-medium text-sm truncate">{player.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{player.id}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Box Columns */}
                            {state.boxes.map(box => {
                                const boxPlayers = state.players.filter(p => p.selectedBoxId === box.id);
                                const isFull = boxPlayers.length >= box.capacity;
                                
                                return (
                                    <div 
                                        key={box.id}
                                        onDragOver={onDragOver}
                                        onDrop={(e) => onDrop(e, box.id)}
                                        className={`w-64 rounded-lg p-3 flex flex-col gap-2 border transition-colors ${isFull ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}
                                    >
                                        <h3 className="font-bold text-gray-800 uppercase text-sm mb-2 flex justify-between items-center">
                                            <span className="truncate max-w-[150px]">{box.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${isFull ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
                                                {boxPlayers.length}/{box.capacity}
                                            </span>
                                        </h3>
                                        <div className="flex-1 overflow-y-auto space-y-2 min-h-[100px]">
                                            {boxPlayers.map(player => (
                                                <div 
                                                    key={player.id}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, player.id)}
                                                    className="bg-white p-3 rounded shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition group relative"
                                                >
                                                    <p className="font-medium text-sm truncate">{player.name}</p>
                                                    <button 
                                                        onClick={() => actions.movePlayer(player.id, null)}
                                                        className="absolute top-1 right-1 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                        title="Remove from box"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                            {boxPlayers.length === 0 && (
                                                <div className="h-20 border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                                                    Drop players here
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                        <h2 className="text-lg font-bold mb-4">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Question Label</label>
                                <input 
                                    type="text" 
                                    value={qLabel}
                                    onChange={(e) => setQLabel(e.target.value)}
                                    placeholder="e.g., What is your favorite color?"
                                    className="w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <input 
                                    type="text" 
                                    value={qDesc}
                                    onChange={(e) => setQDesc(e.target.value)}
                                    placeholder="Helper text for the user"
                                    className="w-full border border-gray-300 rounded-md p-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select 
                                        value={qType}
                                        onChange={(e) => setQType(e.target.value as QuestionType)}
                                        className="w-full border border-gray-300 rounded-md p-2"
                                    >
                                        <option value="text">Short Text</option>
                                        <option value="textarea">Long Text</option>
                                        <option value="email">Email</option>
                                        <option value="number">Number</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={qRequired}
                                            onChange={(e) => setQRequired(e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <span className="text-sm text-gray-700">Required</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button 
                                    onClick={handleSaveQuestion}
                                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                                >
                                    {editingQuestion ? 'Update' : 'Add'}
                                </button>
                                {editingQuestion && (
                                    <button 
                                        onClick={resetQuestionForm}
                                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Existing Questions</h2>
                        {state.questions.length === 0 && <p className="text-gray-500 italic">No questions added yet.</p>}
                        {state.questions.map((q, idx) => (
                            <div key={q.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-start group">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded font-mono">#{idx + 1}</span>
                                        <h3 className="font-medium text-gray-900">{q.label}</h3>
                                        {q.required && <span className="text-red-500 text-xs" title="Required">*</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{q.description || <i>No description</i>}</p>
                                    <span className="text-xs uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded mt-2 inline-block font-semibold">{q.type}</span>
                                </div>
                                <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEditQuestion(q)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => actions.deleteQuestion(q.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Players Tab */}
            {activeTab === 'players' && (
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-gray-500">Name</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Box</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Registered</th>
                                    <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {state.players.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                            No players have registered yet.
                                        </td>
                                    </tr>
                                )}
                                {state.players.map(player => (
                                    <tr key={player.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                    {player.name.charAt(0).toUpperCase()}
                                                </div>
                                                {player.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {player.selectedBoxId ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                                    {state.boxes.find(b => b.id === player.selectedBoxId)?.name || 'Unknown Box'}
                                                </span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(player.registeredAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => actions.deletePlayer(player.id)}
                                                className="text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            )}

        </main>
      </div>
    </div>
  );
};

export default AdminPanel;