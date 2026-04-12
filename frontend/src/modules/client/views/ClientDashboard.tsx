import React from 'react';
import { Sparkles } from 'lucide-react';

const ClientDashboard: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
      <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
        <Sparkles size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Módulo do Cliente</h2>
      <p className="text-slate-500 max-w-md">
        Seja bem-vindo! Estamos trabalhando para que você possa agendar seus cortes e serviços com total facilidade em poucos cliques.
      </p>
    </div>
  );
};

export default ClientDashboard;
