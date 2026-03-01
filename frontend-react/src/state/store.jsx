import React, { createContext, useContext, useMemo, useReducer } from 'react';

const initialState = {
  apiBaseUrl: 'http://127.0.0.1:8000/api',
  health: { status: 'idle', error: '' },
  jobs: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'setApiBaseUrl':
      return { ...state, apiBaseUrl: action.payload };
    case 'healthLoading':
      return { ...state, health: { status: 'loading', error: '' } };
    case 'healthSuccess':
      return { ...state, health: { status: 'success', error: '' } };
    case 'healthError':
      return { ...state, health: { status: 'error', error: action.payload } };
    case 'jobAdded':
      return { ...state, jobs: [action.payload, ...state.jobs].slice(0, 20) };
    default:
      return state;
  }
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
