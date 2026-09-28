import { useState, useEffect } from 'react';
import { store } from '../store';
import { Client, Contract, ContractClause } from '../types';
import { Plus, Trash2, FileDown, Save, Eye, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function ContractGenerator() {
  const [clients, setClients] = useState<Client[]>([]);
  const [defaultClauses, setDefaultClauses] = useState<ContractClause[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    serviceType: 'Consultoria Ambiental',
    description: '',
    value: 0,
    paymentMethod: 'Boleto Bancário',
    deadline: '30 dias',
    startDate: '',
    endDate: '',
    selectedClauses: [] as string[],
    customClauses: [] as ContractClause[],
  });

  useEffect(() => {
    setClients(store.getClients());
    setDefaultClauses(store.getClauses());
    setContracts(store.getContracts());
  }, []);

  const handleSave = () => {
    const client = clients.find(c => c.id === formData.clientId);
    if (!client) { alert('Selecione um cliente'); return; }
    const selectedClauses = defaultClauses.filter(c => formData.selectedClauses.includes(c.id));
    const contract: Contract = {
      id: store.generateId(),
      number: store.generateNumber('CTR'),
      clientId: client.id,
      clientName: client.name,
      serviceType: formData.serviceType,
      description: formData.description,
      value: formData.value,
      paymentMethod: formData.paymentMethod,
      deadline: formData.deadline,
      startDate: formData.startDate,
      endDate: formData.endDate,
      clauses: selectedClauses,
      customClauses: formData.customClauses,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.addContract(contract);
    setContracts(store.getContracts());
    setShowForm(false);
    resetForm();
    alert('Contrato salvo com sucesso!');
  };

  const resetForm = () => {
    setFormData({
      clientId: '', serviceType: 'Consultoria Ambiental', description: '', value: 0,
      paymentMethod: 'Boleto Bancário', deadline: '30 dias', startDate: '', endDate: '',
      selectedClauses: defaultClauses.map(c => c.id), customClauses: [],
    });
  };

  const addCustomClause = () => {
    setFormData(prev => ({
      ...prev,
      customClauses: [...prev.customClauses, { id: store.generateId(), title: '', content: '', isDefault: false }],
    }));
  };

  const removeCustomClause = (id: string) => {
    setFormData(prev => ({ ...prev, customClauses: prev.customClauses.filter(c => c.id !== id) }));
  };

  const updateCustomClause = (id: string, field: 'title' | 'content', value: string) => {
    setFormData(prev => ({
      ...prev,
      customClauses: prev.customClauses.map(c => c.id === id ? { ...c, [field]: value } : c),
    }));
  };

  const generatePDF = (contract: Contract) => {
    const company = store.getCompany();
    const client = clients.find(c => c.id === contract.clientId);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(27, 94, 32);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(company.slogan, 14, 28);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, 50, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Contrato nº ${contract.number}`, pageWidth / 2, 58, { align: 'center' });

    let y = 72;
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATADA:', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(company.name, 14, y); y += 5;
    doc.text(`CNPJ: ${company.cnpj}`, 14, y); y += 5;
    doc.text(`Endereço: ${company.address}`, 14, y); y += 5;
    doc.text(`Contato: ${company.phone} | ${company.email}`, 14, y);

    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATANTE:', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(client?.name || contract.clientName, 14, y); y += 5;
    doc.text(`Documento: ${client?.document || 'N/A'}`, 14, y); y += 5;
    doc.text(`Endereço: ${client?.address || 'N/A'}`, 14, y);

    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('CLÁUSULA 1ª - DO OBJETO', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    const objLines = doc.splitTextToSize(`Prestação de serviços de ${contract.serviceType}. ${contract.description}`, pageWidth - 28);
    doc.text(objLines, 14, y);
    y += objLines.length * 5 + 8;

    doc.setFont('helvetica', 'bold');
    doc.text('CLÁUSULA 2ª - DO VALOR E PAGAMENTO', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    const valLines = doc.splitTextToSize(`O valor total dos serviços é de R$ ${contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, a ser pago via ${contract.paymentMethod}, no prazo de ${contract.deadline}.`, pageWidth - 28);
    doc.text(valLines, 14, y);
    y += valLines.length * 5 + 8;

    doc.setFont('helvetica', 'bold');
    doc.text('CLÁUSULA 3ª - DO PRAZO', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    const timeLines = doc.splitTextToSize(`Os serviços serão executados no período de ${contract.startDate || 'a definir'} a ${contract.endDate || 'a definir'}.`, pageWidth - 28);
    doc.text(timeLines, 14, y);
    y += timeLines.length * 5 + 8;

    let clauseNum = 4;
    const allClauses = [...contract.clauses, ...contract.customClauses];
    for (const clause of allClauses) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text(`CLÁUSULA ${clauseNum}ª - ${clause.title.toUpperCase()}`, 14, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      const clauseLines = doc.splitTextToSize(clause.content, pageWidth - 28);
      doc.text(clauseLines, 14, y);
      y += clauseLines.length * 5 + 8;
      clauseNum++;
    }

    y += 20;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.text('_______________________________', 30, y);
    doc.text('CONTRATADA', 45, y + 6);
    doc.text('_______________________________', 120, y);
    doc.text('CONTRATANTE', 135, y + 6);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`${company.name} - ${company.cnpj}`, pageWidth / 2, 290, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, 290, { align: 'right' });
    }

    doc.save(`Contrato_${contract.number}.pdf`);
  };

  const updateContractStatus = (contract: Contract, status: Contract['status']) => {
    const updated = { ...contract, status, updatedAt: new Date().toISOString() };
    store.updateContract(updated);
    setContracts(store.getContracts());
  };

  const deleteContract = (id: string) => {
    if (confirm('Deseja realmente excluir este contrato?')) {
      const updated = contracts.filter(c => c.id !== id);
      store.setContracts(updated);
      setContracts(updated);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { cls: string; label: string }> = {
      draft: { cls: 'bg-amber-100 text-amber-800', label: 'Rascunho' },
      sent: { cls: 'bg-blue-100 text-blue-800', label: 'Enviado' },
      signed: { cls: 'bg-green-100 text-green-800', label: 'Assinado' },
      completed: { cls: 'bg-green-100 text-green-800', label: 'Concluído' },
    };
    const info = map[status] || { cls: 'bg-gray-100 text-gray-800', label: status };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.cls}`}>{info.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerador de Contratos</h1>
          <p className="text-gray-500 mt-1">Crie e gerencie seus contratos profissionais</p>
        </div>
        <button onClick={() => { setShowForm(true); resetForm(); }} className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Contrato
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Novo Contrato</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente *</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white" value={formData.clientId} onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value }))}>
                    <option value="">Selecione um cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {clients.length === 0 && <p className="text-xs text-amber-600 mt-1">Cadastre um cliente primeiro na seção Clientes</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Serviço</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white" value={formData.serviceType} onChange={e => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}>
                    <option>Consultoria Ambiental</option>
                    <option>Consultoria Geotécnica</option>
                    <option>Licenciamento Ambiental</option>
                    <option>Estudo de Impacto Ambiental</option>
                    <option>Plano de Recuperação de Área Degradada</option>
                    <option>Georreferenciamento</option>
                    <option>Topografia</option>
                    <option>Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição do Serviço</label>
                <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white" rows={3} placeholder="Descreva detalhadamente o serviço..." value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor (R$)</label>
                  <input type="number" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white" value={formData.value} onChange={e => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Forma de Pagamento</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white" value={formData.paymentMethod} onChange={e => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}>
                    <option>Boleto Bancário</option><option>Transferência Bancária</option><option>PIX</option><option>Cartão de Crédito</option><option>À vista</option><option>Parcelado (2x)</option><option>Parcelado (3x)</option><option>Parcelado (6x)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prazo de Pagamento</label>
                  <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white" value={formData.deadline} onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Início</label>
                  <input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white" value={formData.startDate} onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Término</label>
                  <input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white" value={formData.endDate} onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cláusulas Padrão</label>
                <div className="space-y-2 border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                  {defaultClauses.map(clause => (
                    <label key={clause.id} className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1 rounded text-green-600 focus:ring-green-500" checked={formData.selectedClauses.includes(clause.id)} onChange={e => {
                        if (e.target.checked) { setFormData(prev => ({ ...prev, selectedClauses: [...prev.selectedClauses, clause.id] })); }
                        else { setFormData(prev => ({ ...prev, selectedClauses: prev.selectedClauses.filter(id => id !== clause.id) })); }
                      }} />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{clause.title}</p>
                        <p className="text-xs text-gray-500">{clause.content.substring(0, 100)}...</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Cláusulas Personalizadas</label>
                  <button onClick={addCustomClause} className="text-sm text-green-700 hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> Adicionar</button>
                </div>
                <div className="space-y-3">
                  {formData.customClauses.map((clause) => (
                    <div key={clause.id} className="border rounded-lg p-4 bg-gray-50 relative">
                      <button onClick={() => removeCustomClause(clause.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white mb-2" placeholder="Título da cláusula" value={clause.title} onChange={e => updateCustomClause(clause.id, 'title', e.target.value)} />
                      <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" rows={3} placeholder="Conteúdo da cláusula..." value={clause.content} onChange={e => updateCustomClause(clause.id, 'content', e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button onClick={handleSave} className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2"><Save className="w-4 h-4" /> Salvar Contrato</button>
                <button onClick={() => setShowForm(false)} className="border-2 border-green-700 text-green-700 hover:bg-green-50 font-medium py-2 px-5 rounded-lg transition-all">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewContract && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Visualização do Contrato</h2>
              <button onClick={() => setPreviewContract(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <ContractPreview contract={previewContract} clients={clients} />
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button onClick={() => generatePDF(previewContract)} className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2"><FileDown className="w-4 h-4" /> Exportar PDF</button>
              <button onClick={() => { updateContractStatus(previewContract, 'sent'); setPreviewContract(null); }} className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2"><Send className="w-4 h-4" /> Marcar como Enviado</button>
              <button onClick={() => setPreviewContract(null)} className="border-2 border-green-700 text-green-700 hover:bg-green-50 font-medium py-2 px-5 rounded-lg transition-all">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {contracts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center py-12">
          <FileDown className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Nenhum contrato gerado</h3>
          <p className="text-gray-400 mt-1">Clique em "Novo Contrato" para começar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {contracts.slice().reverse().map(contract => (
            <div key={contract.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900">{contract.clientName}</h3>
                  <StatusBadge status={contract.status} />
                </div>
                <p className="text-sm text-gray-500">{contract.number} • {contract.serviceType} • R$ {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-400 mt-1">Criado em {new Date(contract.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewContract(contract)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Visualizar"><Eye className="w-5 h-5" /></button>
                <button onClick={() => generatePDF(contract)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Exportar PDF"><FileDown className="w-5 h-5" /></button>
                <button onClick={() => deleteContract(contract.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContractPreview({ contract, clients }: { contract: Contract; clients: Client[] }) {
  const company = store.getCompany();
  const client = clients.find(c => c.id === contract.clientId);
  const allClauses = [...contract.clauses, ...contract.customClauses];

  return (
    <div className="border rounded-lg p-8 bg-white">
      <div className="text-center border-b pb-4 mb-6">
        <h2 className="text-xl font-bold text-green-800">{company.name}</h2>
        <p className="text-sm text-gray-500">{company.slogan}</p>
        <p className="text-xs text-gray-400 mt-1">CNPJ: {company.cnpj}</p>
      </div>
      <h3 className="text-center font-bold text-lg mb-6">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h3>
      <p className="text-center text-sm text-gray-500 mb-6">Contrato nº {contract.number}</p>
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-bold mb-1">CONTRATADA:</h4>
          <p>{company.name} - CNPJ: {company.cnpj}</p>
          <p>{company.address}</p>
        </div>
        <div>
          <h4 className="font-bold mb-1">CONTRATANTE:</h4>
          <p>{client?.name || contract.clientName}</p>
          <p>Documento: {client?.document || 'N/A'}</p>
        </div>
        <div>
          <h4 className="font-bold mb-1">DO OBJETO:</h4>
          <p>Prestação de serviços de {contract.serviceType}. {contract.description}</p>
        </div>
        <div>
          <h4 className="font-bold mb-1">DO VALOR:</h4>
          <p>R$ {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - Pagamento via {contract.paymentMethod} em {contract.deadline}.</p>
        </div>
        <div>
          <h4 className="font-bold mb-1">DO PRAZO:</h4>
          <p>Período de {contract.startDate || 'a definir'} a {contract.endDate || 'a definir'}.</p>
        </div>
        {allClauses.map((clause, i) => (
          <div key={clause.id}>
            <h4 className="font-bold mb-1">CLÁUSULA {i + 4}ª - {clause.title.toUpperCase()}:</h4>
            <p>{clause.content}</p>
          </div>
        ))}
        <div className="mt-8 grid grid-cols-2 gap-8 text-center">
          <div><div className="border-t border-gray-300 pt-2 mt-12"><p className="text-xs">CONTRATADA</p></div></div>
          <div><div className="border-t border-gray-300 pt-2 mt-12"><p className="text-xs">CONTRATANTE</p></div></div>
        </div>
      </div>
    </div>
  );
}
