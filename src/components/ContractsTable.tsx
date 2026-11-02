import React from 'react';
import { Receipt } from 'lucide-react';
import type { Contrato, Inquilino } from '../types/database';

interface ContratoWithDetails extends Contrato {
  inquilino?: Inquilino;
}

interface ContractsTableProps {
  contracts: ContratoWithDetails[];
  /** Abre el comprobante / estado de pago del contrato seleccionado. */
  onViewReceipt?: (contract: ContratoWithDetails) => void;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

const formatVence = (fecha?: string) =>
  fecha ? new Date(fecha).toLocaleDateString('es-AR') : 'Indefinido';

const estadoBadge = (estado: Contrato['estado']) =>
  estado === 'Activo'
    ? 'bg-green-500/10 text-green-500 border-green-500/20'
    : 'bg-brand/10 text-brand border-brand/20';

const ContractsTable: React.FC<ContractsTableProps> = ({ contracts, onViewReceipt }) => {
  return (
    <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border-card flex items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-bold text-white">Contratos vigentes</h3>
        <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 shrink-0">
          {contracts.length} vigentes
        </span>
      </div>

      {/* Vista móvil: tarjetas apiladas (sin scroll horizontal) */}
      <div className="sm:hidden divide-y divide-border-card">
        {contracts.map((contract) => (
          <div key={contract.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {contract.inquilino?.nombre || 'Sin inquilino'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Cobro día {contract.dia_cobro} · Vence {formatVence(contract.fecha_fin)}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold border shrink-0 ${estadoBadge(contract.estado)}`}>
                {contract.estado}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-white shrink-0">
                {formatMoney(contract.monto_mensual)}
              </span>
              <button
                onClick={() => onViewReceipt?.(contract)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-border-card text-xs font-semibold text-gray-400 hover:text-brand hover:border-brand/30 hover:bg-brand/5 transition-all active:scale-95"
              >
                <Receipt size={14} />
                Ver comprobante
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vista tablet/escritorio: tabla */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-border-card bg-bg-sidebar/50">
              <th className="px-4 lg:px-6 py-4">Inquilino</th>
              <th className="px-4 lg:px-6 py-4">Monto</th>
              <th className="px-4 lg:px-6 py-4">Cobro</th>
              <th className="px-4 lg:px-6 py-4">Vence</th>
              <th className="px-4 lg:px-6 py-4">Estado</th>
              <th className="px-4 lg:px-6 py-4 text-right">Comprobante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-card">
            {contracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-4 lg:px-6 py-4">
                  <div className="text-sm font-semibold text-white group-hover:text-brand transition-colors">
                    {contract.inquilino?.nombre || 'Sin inquilino'}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4">
                  <div className="text-sm font-bold text-white">
                    {formatMoney(contract.monto_mensual)}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 text-sm text-gray-400">
                  Día {contract.dia_cobro}
                </td>
                <td className="px-4 lg:px-6 py-4 text-sm text-gray-400">
                  {formatVence(contract.fecha_fin)}
                </td>
                <td className="px-4 lg:px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${estadoBadge(contract.estado)}`}>
                    {contract.estado}
                  </span>
                </td>
                <td className="px-4 lg:px-6 py-4 text-right">
                  <button
                    onClick={() => onViewReceipt?.(contract)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-border-card text-xs font-semibold text-gray-400 hover:text-brand hover:border-brand/30 hover:bg-brand/5 transition-all active:scale-95"
                  >
                    <Receipt size={14} />
                    Ver comprobante
                  </button>
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
