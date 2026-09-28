import { useState } from 'react';
import { store } from '../store';
import { CompanyData, ContractClause } from '../types';
import { Save, Palette, Building2, FileText, Plus, Trash2 } from 'lucide-react';

export default function Settings() {
  const [company, setCompany] = useState<CompanyData>(store.getCompany());
  const [clauses, setClauses] = useState<ContractClause[]>(store.getClauses());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'clauses' | 'visual'>('company');

  const handleSaveCompany = () => {
    store.setCompany(company);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveClauses = () => {
    store.setClauses(clauses);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addClause = () => {
    setClauses(prev => [...prev, { id: store.generateId(), title: 'Nova Cláusula', content: 'Conteúdo da cláusula...', isDefault: false }]);
  };

  const removeClause = (id: string) => {
    setClauses(prev => prev.filter(c => c.id !== id));
  };

  const updateClause = (id: string, field: 'title' | 'content', value: string) => {
    setClauses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 mt-1">Personalize sua empresa e documentos</p>
        </div>
        {saved && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium animate-fade-in">
            ✓ Salvo com sucesso!
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button onClick={() => setActiveTab('company')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'company' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Building2 className="w-4 h-4" /> Dados da Empresa
        </button>
        <button onClick={() => setActiveTab('clauses')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'clauses' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <FileText className="w-4 h-4" /> Cláusulas Padrão
        </button>
        <button onClick={() => setActiveTab('visual')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'visual' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Palette className="w-4 h-4" /> Identidade Visual
        </button>
      </div>

      {activeTab === 'company' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Empresa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Razão Social / Nome</label>
              <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={company.name} onChange={e => setCompany(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CNPJ</label>
              <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={company.cnpj} onChange={e => setCompany(prev => ({ ...prev, cnpj: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
            <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={company.address} onChange={e => setCompany(prev => ({ ...prev, address: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
              <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={company.phone} onChange={e => setCompany(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input type="email" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={company.email} onChange={e => setCompany(prev => ({ ...prev, email: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slogan</label>
            <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={company.slogan} onChange={e => setCompany(prev => ({ ...prev, slogan: e.target.value }))} />
          </div>
          <div className="pt-4">
            <button onClick={handleSaveCompany} className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /> Salvar Dados da Empresa
            </button>
          </div>
        </div>
      )}

      {activeTab === 'clauses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cláusulas Padrão dos Contratos</h3>
            <button onClick={addClause} className="border-2 border-green-700 text-green-700 hover:bg-green-50 font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Nova Cláusula
            </button>
          </div>
          <div className="space-y-4">
            {clauses.map(clause => (
              <div key={clause.id} className="border rounded-lg p-4 bg-gray-50 relative">
                <div className="flex items-center justify-between mb-2">
                  <input type="text" className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-medium" value={clause.title} onChange={e => updateClause(clause.id, 'title', e.target.value)} />
                  <button onClick={() => removeClause(clause.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" rows={3} value={clause.content} onChange={e => updateClause(clause.id, 'content', e.target.value)} />
              </div>
            ))}
          </div>
          <div className="pt-4">
            <button onClick={handleSaveClauses} className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /> Salvar Cláusulas
            </button>
          </div>
        </div>
      )}

      {activeTab === 'visual' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Identidade Visual dos Documentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor Primária</label>
              <div className="flex items-center gap-3">
                <input type="color" className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer" value={company.primaryColor} onChange={e => setCompany(prev => ({ ...prev, primaryColor: e.target.value }))} />
                <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={company.primaryColor} onChange={e => setCompany(prev => ({ ...prev, primaryColor: e.target.value }))} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Usada nos cabeçalhos e elementos principais</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor Secundária</label>
              <div className="flex items-center gap-3">
                <input type="color" className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer" value={company.secondaryColor} onChange={e => setCompany(prev => ({ ...prev, secondaryColor: e.target.value }))} />
                <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={company.secondaryColor} onChange={e => setCompany(prev => ({ ...prev, secondaryColor: e.target.value }))} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Usada em destaques e elementos de apoio</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pré-visualização</label>
            <div className="border rounded-lg overflow-hidden">
              <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${company.primaryColor} 0%, ${company.primaryColor}dd 100%)` }}>
                <h4 className="text-xl font-bold">{company.name}</h4>
                <p className="text-sm opacity-80 mt-1">{company.slogan}</p>
              </div>
              <div className="p-4 bg-white">
                <p className="text-sm text-gray-600">Este é um exemplo de como seus documentos serão apresentados com as cores selecionadas.</p>
                <div className="mt-3 flex gap-2">
                  <span className="px-3 py-1 rounded-full text-xs text-white" style={{ backgroundColor: company.primaryColor }}>Primária</span>
                  <span className="px-3 py-1 rounded-full text-xs text-white" style={{ backgroundColor: company.secondaryColor }}>Secundária</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4">
            <button onClick={handleSaveCompany} className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /> Salvar Identidade Visual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
