import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FilePlus,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  ArrowRight,
  CheckCircle,
  Send,
  AlertCircle,
} from 'lucide-react';
import { store } from '../store';

export default function Dashboard() {
  const navigate = useNavigate();
  const contracts = store.getContracts();
  const proposals = store.getProposals();
  const clients = store.getClients();

  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = contracts.filter(c => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const proposalsThisMonth = proposals.filter(p => {
      const d = new Date(p.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const signedContracts = contracts.filter(c => c.status === 'signed' || c.status === 'completed');
    const conversionRate = proposals.length > 0
      ? Math.round((signedContracts.length / proposals.length) * 100)
      : 0;
    const totalRevenue = contracts
      .filter(c => c.status === 'signed' || c.status === 'completed')
      .reduce((sum, c) => sum + c.value, 0);

    return {
      totalContracts: contracts.length,
      totalProposals: proposals.length,
      contractsThisMonth: thisMonth.length,
      proposalsThisMonth: proposalsThisMonth.length,
      conversionRate,
      totalRevenue,
      totalClients: clients.length,
    };
  }, [contracts, proposals, clients]);

  const recentContracts = contracts.slice(-5).reverse();
  const recentProposals = proposals.slice(-5).reverse();

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      draft: { cls: 'bg-amber-100 text-amber-800', label: 'Rascunho' },
      sent: { cls: 'bg-blue-100 text-blue-800', label: 'Enviado' },
      signed: { cls: 'bg-green-100 text-green-800', label: 'Assinado' },
      completed: { cls: 'bg-green-100 text-green-800', label: 'Concluído' },
      approved: { cls: 'bg-green-100 text-green-800', label: 'Aprovado' },
      rejected: { cls: 'bg-red-100 text-red-800', label: 'Rejeitado' },
    };
    const info = map[status] || { cls: 'bg-amber-100 text-amber-800', label: status };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.cls}`}>{info.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral da sua operação</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contratos Gerados</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.totalContracts}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {metrics.contractsThisMonth} este mês
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Propostas Enviadas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.totalProposals}</p>
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {metrics.proposalsThisMonth} este mês
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <FilePlus className="w-6 h-6 text-amber-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Taxa de Conversão</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.conversionRate}%</p>
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Propostas → Contratos
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                R$ {metrics.totalRevenue.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> {metrics.totalClients} clientes ativos
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/contratos')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-green-200 transition-all flex items-center gap-4 group cursor-pointer"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <FileText className="w-6 h-6 text-green-700" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">Novo Contrato</p>
            <p className="text-sm text-gray-500">Gerar contrato rapidamente</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-green-600 transition-colors" />
        </button>

        <button
          onClick={() => navigate('/propostas')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-amber-200 transition-all flex items-center gap-4 group cursor-pointer"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
            <FilePlus className="w-6 h-6 text-amber-700" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">Nova Proposta</p>
            <p className="text-sm text-gray-500">Criar proposta comercial</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-amber-600 transition-colors" />
        </button>

        <button
          onClick={() => navigate('/clientes')}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition-all flex items-center gap-4 group cursor-pointer"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <Users className="w-6 h-6 text-blue-700" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">Novo Cliente</p>
            <p className="text-sm text-gray-500">Cadastrar novo cliente</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-blue-600 transition-colors" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Contratos Recentes</h3>
            <button onClick={() => navigate('/contratos')} className="text-sm text-green-700 hover:underline">
              Ver todos
            </button>
          </div>
          {recentContracts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum contrato gerado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContracts.map(contract => (
                <div key={contract.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      {contract.status === 'signed' || contract.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : contract.status === 'sent' ? (
                        <Send className="w-4 h-4 text-blue-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{contract.clientName}</p>
                      <p className="text-xs text-gray-500">{contract.serviceType}</p>
                    </div>
                  </div>
                  {getStatusBadge(contract.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Propostas Recentes</h3>
            <button onClick={() => navigate('/propostas')} className="text-sm text-amber-700 hover:underline">
              Ver todas
            </button>
          </div>
          {recentProposals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FilePlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma proposta gerada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProposals.map(proposal => (
                <div key={proposal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <FilePlus className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{proposal.clientName}</p>
                      <p className="text-xs text-gray-500">
                        R$ {proposal.investment.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(proposal.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
