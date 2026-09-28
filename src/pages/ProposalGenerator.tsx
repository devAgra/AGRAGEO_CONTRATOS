import { useState, useEffect } from 'react';
import { store } from '../store';
import { Client, Proposal, ProposalItem } from '../types';
import { Plus, Trash2, FileDown, Save, Eye, Send } from 'lucide-react';
import jsPDF from 'jspdf';

export default function ProposalGenerator() {
  const [clients, setClients] = useState<Client[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [previewProposal, setPreviewProposal] = useState<Proposal | null>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    serviceType: 'Consultoria Ambiental',
    scope: '',
    timeline: '',
    investment: 0,
    paymentConditions: '30 dias após aprovação',
    differentials: ['Equipe técnica especializada', 'Metodologia própria', 'Relatórios detalhados'],
    items: [] as ProposalItem[],
  });

  useEffect(() => {
    setClients(store.getClients());
    setProposals(store.getProposals());
  }, []);

  const handleSave = () => {
    const client = clients.find(c => c.id === formData.clientId);
    if (!client) { alert('Selecione um cliente'); return; }
    const proposal: Proposal = {
      id: store.generateId(),
      number: store.generateNumber('PROP'),
      clientId: client.id,
      clientName: client.name,
      serviceType: formData.serviceType,
      scope: formData.scope,
      timeline: formData.timeline,
      investment: formData.investment,
      paymentConditions: formData.paymentConditions,
      differentials: formData.differentials,
      items: formData.items,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.addProposal(proposal);
    setProposals(store.getProposals());
    setShowForm(false);
    resetForm();
    alert('Proposta salva com sucesso!');
  };

  const resetForm = () => {
    setFormData({
      clientId: '', serviceType: 'Consultoria Ambiental', scope: '', timeline: '',
      investment: 0, paymentConditions: '30 dias após aprovação',
      differentials: ['Equipe técnica especializada', 'Metodologia própria', 'Relatórios detalhados'],
      items: [],
    });
  };

  const addItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { id: store.generateId(), description: '', quantity: 1, unitPrice: 0, total: 0 }] }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const updateItem = (id: string, field: keyof ProposalItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(i => {
        if (i.id !== id) return i;
        const updated = { ...i, [field]: value };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }),
    }));
  };

  const addDifferential = () => {
    setFormData(prev => ({ ...prev, differentials: [...prev.differentials, ''] }));
  };

  const removeDifferential = (index: number) => {
    setFormData(prev => ({ ...prev, differentials: prev.differentials.filter((_, i) => i !== index) }));
  };

  const updateDifferential = (index: number, value: string) => {
    setFormData(prev => ({ ...prev, differentials: prev.differentials.map((d, i) => i === index ? value : d) }));
  };

  const generatePDF = (proposal: Proposal) => {
    const company = store.getCompany();
    const client = clients.find(c => c.id === proposal.clientId);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(27, 94, 32);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(company.slogan, 14, 30);
    doc.text(`${company.phone} | ${company.email}`, 14, 36);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PROPOSTA COMERCIAL', pageWidth / 2, 55, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Proposta nº ${proposal.number}`, pageWidth / 2, 63, { align: 'center' });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 70, { align: 'center' });

    let y = 82;
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(client?.name || proposal.clientName, 14, y); y += 5;
    doc.text(`Documento: ${client?.document || 'N/A'}`, 14, y); y += 5;
    doc.text(`Contato: ${client?.contact || 'N/A'}`, 14, y);

    y += 14;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('1. APRESENTAÇÃO', 14, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 7;
    const introLines = doc.splitTextToSize(`A ${company.name} é uma empresa especializada em consultoria ambiental e geotécnica. Apresentamos esta proposta para atender às necessidades de ${client?.name || 'sua empresa'}.`, pageWidth - 28);
    doc.text(introLines, 14, y); y += introLines.length * 5 + 8;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('2. ESCOPO DO SERVIÇO', 14, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 7;
    const scopeLines = doc.splitTextToSize(proposal.scope || 'Serviço de ' + proposal.serviceType, pageWidth - 28);
    doc.text(scopeLines, 14, y); y += scopeLines.length * 5 + 8;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('3. CRONOGRAMA', 14, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 7;
    const timelineLines = doc.splitTextToSize(proposal.timeline || 'A definir conforme necessidade.', pageWidth - 28);
    doc.text(timelineLines, 14, y); y += timelineLines.length * 5 + 8;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('4. INVESTIMENTO', 14, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 7;
    doc.text(`Valor total: R$ ${proposal.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, y); y += 12;

    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('5. CONDIÇÕES DE PAGAMENTO', 14, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 7;
    const payLines = doc.splitTextToSize(proposal.paymentConditions, pageWidth - 28);
    doc.text(payLines, 14, y); y += payLines.length * 5 + 8;

    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('6. NOSSOS DIFERENCIAIS', 14, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 7;
    for (const diff of proposal.differentials.filter(d => d.trim())) {
      doc.text(`• ${diff}`, 18, y); y += 6;
    }

    y += 20;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.text('Estamos à disposição para esclarecer quaisquer dúvidas.', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.text('Atenciosamente,', pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, pageWidth / 2, y, { align: 'center' });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(150);
      doc.text(`${company.name} - Proposta Comercial`, pageWidth / 2, 290, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, 290, { align: 'right' });
    }

    doc.save(`Proposta_${proposal.number}.pdf`);
  };

  const updateProposalStatus = (proposal: Proposal, status: Proposal['status']) => {
    const updated = { ...proposal, status, updatedAt: new Date().toISOString() };
    store.updateProposal(updated);
    setProposals(store.getProposals());
  };

  const deleteProposal = (id: string) => {
    if (confirm('Deseja realmente excluir esta proposta?')) {
      const updated = proposals.filter(p => p.id !== id);
      store.setProposals(updated);
      setProposals(updated);
    }
  };

  const totalItems = formData.items.reduce((sum, item) => sum + item.total, 0);

  const ProposalStatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { cls: string; label: string }> = {
      draft: { cls: 'bg-amber-100 text-amber-800', label: 'Rascunho' },
      sent: { cls: 'bg-blue-100 text-blue-800', label: 'Enviada' },
      approved: { cls: 'bg-green-100 text-green-800', label: 'Aprovada' },
      rejected: { cls: 'bg-red-100 text-red-800', label: 'Rejeitada' },
    };
    const info = map[status] || { cls: 'bg-gray-100 text-gray-800', label: status };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.cls}`}>{info.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerador de Propostas</h1>
          <p className="text-gray-500 mt-1">Crie propostas comerciais profissionais</p>
        </div>
        <button onClick={() => { setShowForm(true); resetForm(); }} className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Proposta
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nova Proposta Comercial</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente *</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white" value={formData.clientId} onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value }))}>
                    <option value="">Selecione um cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Serviço</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white" value={formData.serviceType} onChange={e => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}>
                    <option>Consultoria Ambiental</option><option>Consultoria Geotécnica</option><option>Licenciamento Ambiental</option><option>Estudo de Impacto Ambiental</option><option>Plano de Recuperação de Área Degradada</option><option>Georreferenciamento</option><option>Topografia</option><option>Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Escopo do Serviço</label>
                <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white" rows={4} placeholder="Descreva detalhadamente o escopo..." value={formData.scope} onChange={e => setFormData(prev => ({ ...prev, scope: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cronograma</label>
                <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white" rows={3} placeholder="Descreva o cronograma de execução..." value={formData.timeline} onChange={e => setFormData(prev => ({ ...prev, timeline: e.target.value }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Investimento Total (R$)</label>
                  <input type="number" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white" value={formData.investment || totalItems} onChange={e => setFormData(prev => ({ ...prev, investment: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Condições de Pagamento</label>
                  <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white" value={formData.paymentConditions} onChange={e => setFormData(prev => ({ ...prev, paymentConditions: e.target.value }))} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Itens da Proposta (opcional)</label>
                  <button onClick={addItem} className="text-sm text-amber-700 hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> Adicionar Item</button>
                </div>
                {formData.items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 font-medium">Descrição</th>
                          <th className="text-left p-3 font-medium w-20">Qtd</th>
                          <th className="text-left p-3 font-medium w-32">Valor Unit.</th>
                          <th className="text-left p-3 font-medium w-32">Total</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map(item => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2"><input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="Descrição" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} /></td>
                            <td className="p-2"><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} /></td>
                            <td className="p-2"><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))} /></td>
                            <td className="p-2 text-sm font-medium text-gray-700">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="p-2"><button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="p-3 text-right font-semibold">Total dos itens:</td>
                          <td className="p-3 font-bold text-green-700">R$ {totalItems.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Diferenciais da Empresa</label>
                  <button onClick={addDifferential} className="text-sm text-amber-700 hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> Adicionar</button>
                </div>
                <div className="space-y-2">
                  {formData.differentials.map((diff, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-amber-500">★</span>
                      <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white" value={diff} onChange={e => updateDifferential(index, e.target.value)} placeholder="Diferencial..." />
                      <button onClick={() => removeDifferential(index)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2"><Save className="w-4 h-4" /> Salvar Proposta</button>
                <button onClick={() => setShowForm(false)} className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50 font-medium py-2 px-5 rounded-lg transition-all">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewProposal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Visualização da Proposta</h2>
              <button onClick={() => setPreviewProposal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <ProposalPreview proposal={previewProposal} clients={clients} />
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button onClick={() => generatePDF(previewProposal)} className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2"><FileDown className="w-4 h-4" /> Exportar PDF</button>
              <button onClick={() => { updateProposalStatus(previewProposal, 'sent'); setPreviewProposal(null); }} className="bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2"><Send className="w-4 h-4" /> Marcar como Enviada</button>
              <button onClick={() => setPreviewProposal(null)} className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50 font-medium py-2 px-5 rounded-lg transition-all">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center py-12">
          <FileDown className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Nenhuma proposta gerada</h3>
          <p className="text-gray-400 mt-1">Clique em "Nova Proposta" para começar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {proposals.slice().reverse().map(proposal => (
            <div key={proposal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900">{proposal.clientName}</h3>
                  <ProposalStatusBadge status={proposal.status} />
                </div>
                <p className="text-sm text-gray-500">{proposal.number} • {proposal.serviceType} • R$ {proposal.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-400 mt-1">Criada em {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewProposal(proposal)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Visualizar"><Eye className="w-5 h-5" /></button>
                <button onClick={() => generatePDF(proposal)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Exportar PDF"><FileDown className="w-5 h-5" /></button>
                <button onClick={() => deleteProposal(proposal.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalPreview({ proposal, clients }: { proposal: Proposal; clients: Client[] }) {
  const company = store.getCompany();
  const client = clients.find(c => c.id === proposal.clientId);

  return (
    <div className="border rounded-lg p-8 bg-white">
      <div className="rounded-lg p-6 mb-6 text-white" style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%)' }}>
        <h2 className="text-xl font-bold">{company.name}</h2>
        <p className="text-sm text-green-100 mt-1">{company.slogan}</p>
        <p className="text-xs text-green-200 mt-1">{company.phone} | {company.email}</p>
      </div>
      <h3 className="text-center font-bold text-xl mb-2">PROPOSTA COMERCIAL</h3>
      <p className="text-center text-sm text-gray-500 mb-6">Proposta nº {proposal.number} | Data: {new Date().toLocaleDateString('pt-BR')}</p>
      <div className="space-y-5 text-sm">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-bold text-green-800 mb-1">CLIENTE</h4>
          <p className="font-medium">{client?.name || proposal.clientName}</p>
          <p className="text-gray-500">{client?.document || ''}</p>
        </div>
        <div>
          <h4 className="font-bold text-green-800 mb-2">1. APRESENTAÇÃO</h4>
          <p className="text-gray-700">A {company.name} é uma empresa especializada em consultoria ambiental e geotécnica, com ampla experiência no mercado.</p>
        </div>
        <div>
          <h4 className="font-bold text-green-800 mb-2">2. ESCOPO DO SERVIÇO</h4>
          <p className="text-gray-700">{proposal.scope || 'Serviço de ' + proposal.serviceType}</p>
        </div>
        <div>
          <h4 className="font-bold text-green-800 mb-2">3. CRONOGRAMA</h4>
          <p className="text-gray-700">{proposal.timeline || 'A definir conforme necessidade.'}</p>
        </div>
        <div>
          <h4 className="font-bold text-green-800 mb-2">4. INVESTIMENTO</h4>
          {proposal.items.length > 0 && (
            <div className="border rounded-lg overflow-hidden mb-3">
              <table className="w-full text-sm">
                <thead className="bg-green-700 text-white">
                  <tr><th className="text-left p-2">Descrição</th><th className="text-center p-2">Qtd</th><th className="text-right p-2">Valor Unit.</th><th className="text-right p-2">Total</th></tr>
                </thead>
                <tbody>
                  {proposal.items.map(item => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">{item.description}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right font-medium">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-lg font-bold text-green-800 text-right">Total: R$ {proposal.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-500 text-right">Condições: {proposal.paymentConditions}</p>
        </div>
        <div>
          <h4 className="font-bold text-green-800 mb-2">5. NOSSOS DIFERENCIAIS</h4>
          <ul className="space-y-1">
            {proposal.differentials.filter(d => d.trim()).map((diff, i) => (
              <li key={i} className="flex items-center gap-2"><span className="text-amber-500">★</span><span className="text-gray-700">{diff}</span></li>
            ))}
          </ul>
        </div>
        <div className="text-center pt-4 border-t mt-6">
          <p className="text-gray-500">Estamos à disposição para esclarecer quaisquer dúvidas.</p>
          <p className="mt-2 font-semibold text-green-800">{company.name}</p>
        </div>
      </div>
    </div>
  );
}
