import React from 'react';
import { Scissors } from 'lucide-react';

const BarberDashboard: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
        <Scissors size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Módulo do Barbeiro</h2>
      <p className="text-slate-500 max-w-md">
        Olá! Este módulo está sendo preparado. Em breve você poderá gerenciar sua agenda e clientes por aqui.
      </p>
    </div>
  );
};

export default BarberDashboard;
