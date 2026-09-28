import { useState, useEffect } from 'react';
import { store } from '../store';
import { Model } from '../types';
import { Plus, Trash2, Copy, Edit3, FileText, FilePlus, Clock } from 'lucide-react';

export default function SavedModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [filter, setFilter] = useState<'all' | 'contract' | 'proposal'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', type: 'contract' as 'contract' | 'proposal', content: '' });

  useEffect(() => { setModels(store.getModels()); }, []);

  const handleSave = () => {
    if (!formData.name.trim()) { alert('Informe o nome do modelo'); return; }
    if (editingModel) {
      const updated = { ...editingModel, name: formData.name, type: formData.type, content: formData.content, updatedAt: new Date().toISOString(), version: editingModel.version + 1 };
      const allModels = models.map(m => m.id === updated.id ? updated : m);
      store.setModels(allModels); setModels(allModels);
    } else {
      const model: Model = { id: store.generateId(), name: formData.name, type: formData.type, content: formData.content, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 };
      store.addModel(model); setModels(store.getModels());
    }
    setShowForm(false); setEditingModel(null); resetForm();
  };

  const resetForm = () => { setFormData({ name: '', type: 'contract', content: '' }); };

  const handleEdit = (model: Model) => {
    setEditingModel(model);
    setFormData({ name: model.name, type: model.type, content: model.content });
    setShowForm(true);
  };

  const handleDuplicate = (model: Model) => {
    const newModel: Model = { ...model, id: store.generateId(), name: `${model.name} (cópia)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 };
    store.addModel(newModel); setModels(store.getModels());
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este modelo?')) {
      const updated = models.filter(m => m.id !== id);
      store.setModels(updated); setModels(updated);
    }
  };

  const filteredModels = models
    .filter(m => filter === 'all' || m.type === filter)
    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modelos Salvos</h1>
          <p className="text-gray-500 mt-1">Gerencie seus modelos de contratos e propostas</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingModel(null); resetForm(); }} className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Modelo
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-2">
          {(['all', 'contract', 'proposal'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? 'Todos' : f === 'contract' ? 'Contratos' : 'Propostas'}
            </button>
          ))}
        </div>
        <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white md:max-w-xs" placeholder="Buscar modelo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingModel ? 'Editar Modelo' : 'Novo Modelo'}</h2>
              <button onClick={() => { setShowForm(false); setEditingModel(null); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Modelo *</label>
                  <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" placeholder="Ex: Contrato Padrão" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as 'contract' | 'proposal' }))}>
                    <option value="contract">Contrato</option><option value="proposal">Proposta</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Conteúdo do Modelo</label>
                <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-mono text-sm" rows={15} placeholder="Conteúdo do modelo..." value={formData.content} onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={handleSave} className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all">{editingModel ? 'Atualizar Modelo' : 'Salvar Modelo'}</button>
                <button onClick={() => { setShowForm(false); setEditingModel(null); }} className="border-2 border-green-700 text-green-700 hover:bg-green-50 font-medium py-2 px-5 rounded-lg transition-all">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredModels.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Nenhum modelo encontrado</h3>
          <p className="text-gray-400 mt-1">Crie seu primeiro modelo para agilizar a geração de documentos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map(model => (
            <div key={model.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-green-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {model.type === 'contract' ? (
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-green-700" /></div>
                  ) : (
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><FilePlus className="w-4 h-4 text-amber-700" /></div>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${model.type === 'contract' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {model.type === 'contract' ? 'Contrato' : 'Proposta'}
                  </span>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> v{model.version}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{model.name}</h3>
              <p className="text-xs text-gray-400 mb-3">Atualizado em {new Date(model.updatedAt).toLocaleDateString('pt-BR')}</p>
              <p className="text-sm text-gray-500 mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{model.content || 'Sem conteúdo'}</p>
              <div className="flex items-center gap-2 pt-3 border-t">
                <button onClick={() => handleEdit(model)} className="flex-1 text-sm text-center py-1.5 text-green-700 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center gap-1"><Edit3 className="w-3.5 h-3.5" /> Editar</button>
                <button onClick={() => handleDuplicate(model)} className="flex-1 text-sm text-center py-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"><Copy className="w-3.5 h-3.5" /> Duplicar</button>
                <button onClick={() => handleDelete(model.id)} className="flex-1 text-sm text-center py-1.5 text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
