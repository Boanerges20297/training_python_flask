import { useState, useEffect } from 'react';

export interface GoalValues {
  metaFaturamento: string;
  metaLucro: string;
  metaClientes: string;
}

const STORAGE_KEY = 'barbabyte_goals';

const DEFAULT_GOALS: GoalValues = {
  metaFaturamento: '0',
  metaLucro: '0',
  metaClientes: '0'
};

export function useGoals() {
  const [goals, setGoals] = useState<GoalValues>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao carregar metas:', e);
      }
    }
    return DEFAULT_GOALS;
  });

  // Salva no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  const updateGoal = (key: keyof GoalValues, value: string) => {
    setGoals(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    goals,
    updateGoal,
    // Helpers para valores numéricos
    numMetaFaturamento: parseFloat(goals.metaFaturamento) || 0,
    numMetaLucro: parseFloat(goals.metaLucro) || 0,
    numMetaClientes: parseFloat(goals.metaClientes) || 0
  };
}
