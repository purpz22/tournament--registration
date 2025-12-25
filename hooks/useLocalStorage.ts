import { useState, useEffect } from 'react';
import { AppState, Player, Question, Box } from '../types';
import { INITIAL_STATE, STORAGE_KEY } from '../constants';

export const useAppStorage = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load state", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save to storage on change
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save state to localStorage", e);
        // We could alert here, but it might spam. 
        // Logic in AdminPanel should prevent huge uploads, but if it happens:
        if ((e as any).name === 'QuotaExceededError') {
             console.warn("Local Storage Quota Exceeded");
        }
      }
    }
  }, [state, loaded]);

  const updateSettings = (title: string, desc: string, bannerUrl: string, bannerPosition: number = 50, showTeammates: boolean = true) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, eventTitle: title, eventDescription: desc, bannerUrl, bannerPosition, showTeammates } }));
  };

  const addQuestion = (question: Question) => {
    setState(prev => ({ ...prev, questions: [...prev.questions, question] }));
  };

  const updateQuestion = (updated: Question) => {
    setState(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === updated.id ? updated : q)
    }));
  };

  const deleteQuestion = (id: string) => {
    setState(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const updateBox = (updated: Box) => {
    setState(prev => ({
      ...prev,
      boxes: prev.boxes.map(b => b.id === updated.id ? updated : b)
    }));
  };

  const registerPlayer = (player: Player) => {
    setState(prev => ({ ...prev, players: [...prev.players, player] }));
  };

  const deletePlayer = (id: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== id)
    }));
  };

  const selectBox = (playerId: string, boxId: string) => {
    setState(prev => {
      // Validation: Check if box is full
      const boxPlayers = prev.players.filter(p => p.selectedBoxId === boxId);
      const box = prev.boxes.find(b => b.id === boxId);
      
      if (!box || boxPlayers.length >= box.capacity) {
        return prev; // Or throw error
      }

      return {
        ...prev,
        players: prev.players.map(p => p.id === playerId ? { ...p, selectedBoxId: boxId } : p)
      };
    });
  };

  // Admin action to force move a player (bypassing capacity checks if needed, or strictly adhering)
  // For admin, we usually allow overriding, but let's stick to valid moves for now or just simple ID swap
  const movePlayer = (playerId: string, targetBoxId: string | null) => {
      setState(prev => ({
          ...prev,
          players: prev.players.map(p => p.id === playerId ? { ...p, selectedBoxId: targetBoxId } : p)
      }));
  };

  const resetData = () => {
    if(confirm("Are you sure? This will delete all player data.")) {
        setState(prev => ({ ...prev, players: [] }));
    }
  };

  return {
    state,
    isLoaded: loaded,
    actions: {
      updateSettings,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      updateBox,
      registerPlayer,
      deletePlayer,
      selectBox,
      movePlayer,
      resetData
    }
  };
};