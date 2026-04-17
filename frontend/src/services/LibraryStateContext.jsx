import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchLibraryState, saveLibraryState } from './api';

const LibraryStateContext = createContext(null);

const EMPTY_STATE = {
  users: [],
  books: [],
  transactions: [],
  studentData: {},
  notifications: [],
  receipts: [],
  renewalRequests: [],
  feedbackEntries: [],
  bookSuggestions: [],
  sentLog: [],
  otpLog: [],
  updatedAt: '',
};

export function LibraryStateProvider({ children }) {
  const [state, setState] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadState() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchLibraryState();
        if (!active) return;
        const payload = data?.state || data?.payload || EMPTY_STATE;
        setState({ ...EMPTY_STATE, ...payload });
      } catch (err) {
        console.error(err);
        setError('Failed to load MongoDB state');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadState();
    return () => {
      active = false;
    };
  }, []);

  async function persistState(nextState) {
    try {
      setSaving(true);
      const finalState = {
        ...nextState,
        updatedAt: new Date().toISOString(),
      };
      setState(finalState);
      await saveLibraryState(finalState);
    } catch (err) {
      console.error(err);
      setError('Failed to save MongoDB state');
    } finally {
      setSaving(false);
    }
  }

  const value = useMemo(() => ({
    state,
    setState,
    persistState,
    loading,
    saving,
    error,
  }), [state, loading, saving, error]);

  return (
    <LibraryStateContext.Provider value={value}>
      {children}
    </LibraryStateContext.Provider>
  );
}

export function useLibraryState() {
  const context = useContext(LibraryStateContext);
  if (!context) {
    throw new Error('useLibraryState must be used inside LibraryStateProvider');
  }
  return context;
}