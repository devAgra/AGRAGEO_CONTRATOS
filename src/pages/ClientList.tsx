import { useState, useEffect } from 'react';
import { store } from '../store';
import { Client } from '../types';
import { Plus, Trash2, Edit3, Search, Users } from 'lucide-react';

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', document: '', address: '', contact: '', email: '', phone: '' });

  useEffect(() => { setClients(store.getClients()); }, []);

  const handleSave = () => {
    if (!formData.name.trim()) { alert('Informe o nome do cliente'); return; }
    if (editingClient) {
      const updated = clients.map(c => c.id === editingClient.id ? { ...c, ...formData } : c);
      store.setClients(updated); setClients(updated);
    } else {
      const client: Client = { id: store.generateId(), ...formData };
      store.addClient(client); setClients(store.getClients());
    }
    setShowForm(false); setEditingClient(null); resetForm();
  };

  const resetForm = () => { setFormData({ name: '', document: '', address: '', contact: '', email: '', phone: '' }); };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, document: client.document, address: client.address, contact: client.contact, email: client.email, phone: client.phone });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este cliente?')) {
      const updated = clients.filter(c => c.id !== id);
      store.setClients(updated); setClients(updated);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">Gerencie sua base de clientes</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingClient(null); resetForm(); }} className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" placeholder="Buscar por nome, documento ou e-mail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => { setShowForm(false); setEditingClient(null); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome / Razão Social *</label>
                <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" placeholder="Nome do cliente" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CNPJ / CPF</label>
                  <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" placeholder="00.000.000/0000-00" value={formData.document} onChange={e => setFormData(prev => ({ ...prev, document: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                  <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input type="email" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" placeholder="email@exemplo.com" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
                <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" placeholder="Rua, número, cidade/UF" value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pessoa de Contato</label>
                <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" placeholder="Nome do contato" value={formData.contact} onChange={e => setFormData(prev => ({ ...prev, contact: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={handleSave} className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all">{editingClient ? 'Atualizar' : 'Salvar'}</button>
                <button onClick={() => { setShowForm(false); setEditingClient(null); }} className="border-2 border-green-700 text-green-700 hover:bg-green-50 font-medium py-2 px-5 rounded-lg transition-all">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center py-12">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">{searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h3>
          <p className="text-gray-400 mt-1">{searchTerm ? 'Tente outro termo de busca' : 'Clique em "Novo Cliente" para começar'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-green-700">{client.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.document && `${client.document} • `}{client.email}</p>
                  <p className="text-xs text-gray-400">
                    {client.contact && `Contato: ${client.contact} • `}{client.phone && client.phone}{client.address && ` • ${client.address}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(client)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit3 className="w-5 h-5" /></button>
                <button onClick={() => handleDelete(client.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
