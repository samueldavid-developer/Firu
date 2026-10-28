import React from 'react';
import type { Contrato, Propiedad, Inquilino } from '../types/database';

interface ContratoWithDetails extends Contrato {
  propiedad: Propiedad;
  inquilino: Inquilino;
}

interface ContractsTableProps {
  contracts: ContratoWithDetails[];
}

const ContractsTable: React.FC<ContractsTableProps> = ({ contracts }) => {
  return (
    <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-border-card flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Contratos activos</h3>
        <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
          {contracts.length} activos
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-border-card bg-bg-sidebar/50">
              <th className="px-6 py-4">Propiedad</th>
              <th className="px-6 py-4">Inquilino</th>
              <th className="px-6 py-4">Monto</th>
              <th className="px-6 py-4">Vence</th>
              <th className="px-6 py-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-card">
            {contracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-white group-hover:text-brand transition-colors">
                    {contract.propiedad.direccion}
                  </div>
                  <div className="text-xs text-gray-500">{contract.propiedad.tipo}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">{contract.inquilino.nombre}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-white">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(contract.monto_mensual)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {new Date(contract.fecha_fin).toLocaleDateString('es-AR')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${contract.estado === 'Activo'
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                    {contract.estado === 'Activo' ? 'Vigente' : contract.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractsTable;
