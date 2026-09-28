import { useState, useEffect } from 'react';
import { store } from '../store';
import { Client, Contract, ContractClause } from '../types';
import { Plus, Trash2, FileDown, Save, Eye, Send, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Helper function for page breaks
    const checkPageBreak = (requiredSpace: number): number => {
      let y = (doc as any).__pageY || 20;
      if (y + requiredSpace > pageHeight - 30) {
        doc.addPage();
        y = 20;
      }
      return y;
    };

    const setY = (newY: number) => {
      (doc as any).__pageY = newY;
    };

    const getY = (): number => {
      return (doc as any).__pageY || 20;
    };

    // ===== HEADER =====
    // Green header bar
    doc.setFillColor(27, 94, 32);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Amber accent line
    doc.setFillColor(255, 143, 0);
    doc.rect(0, 45, pageWidth, 3, 'F');

    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, margin, 22);
    
    // Slogan
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(company.slogan, margin, 32);
    
    // Contact info in header
    doc.setFontSize(8);
    doc.text(`${company.phone} | ${company.email}`, margin, 40);

    // Contract number on right side
    doc.setFontSize(9);
    doc.text(`Contrato nº ${contract.number}`, pageWidth - margin, 22, { align: 'right' });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 30, { align: 'right' });

    let y = 60;
    setY(y);

    // ===== TITLE =====
    doc.setTextColor(27, 94, 32);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, y, { align: 'center' });
    y += 10;
    setY(y);

    // ===== PREAMBLE =====
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const preamble = `Pelo presente instrumento particular, as partes abaixo qualificadas celebram entre si este Contrato de Prestação de Serviços, mediante as cláusulas e condições seguintes:`;
    const preambleLines = doc.splitTextToSize(preamble, contentWidth);
    doc.text(preambleLines, margin, y);
    y += preambleLines.length * 5 + 8;
    setY(y);

    // ===== PARTIES =====
    // CONTRATADA
    y = checkPageBreak(40);
    setY(y);
    doc.setFillColor(27, 94, 32);
    doc.rect(margin, y - 4, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATADA', margin + 3, y + 1);
    y += 12;
    setY(y);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const contratadaInfo = [
      `${company.name}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${company.cnpj}`,
      `com sede em ${company.address}`,
      `contato: ${company.phone} | ${company.email}`,
    ];
    contratadaInfo.forEach(line => {
      doc.text(`• ${line}`, margin + 4, y);
      y += 5;
    });
    y += 4;
    setY(y);

    // CONTRATANTE
    y = checkPageBreak(40);
    setY(y);
    doc.setFillColor(255, 143, 0);
    doc.rect(margin, y - 4, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATANTE', margin + 3, y + 1);
    y += 12;
    setY(y);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const contratanteInfo = [
      `${client?.name || contract.clientName}${client?.document ? `, inscrito no CNPJ/CPF sob o nº ${client.document}` : ''}`,
      client?.address ? `com endereço em ${client.address}` : '',
      client?.contact ? `representado por ${client.contact}` : '',
      client?.email ? `contato: ${client.email}${client?.phone ? ` | ${client.phone}` : ''}` : '',
    ].filter(Boolean);
    contratanteInfo.forEach(line => {
      doc.text(`• ${line}`, margin + 4, y);
      y += 5;
    });
    y += 6;
    setY(y);

    // ===== CLAUSES =====
    let clauseNum = 1;
    const allClauses: { title: string; content: string }[] = [];

    // Clause 1 - Object
    allClauses.push({
      title: 'DO OBJETO',
      content: `O presente contrato tem por objeto a prestação de serviços de ${contract.serviceType} pela CONTRATADA ao CONTRATANTE, conforme especificações técnicas e condições estabelecidas neste instrumento.\n\n${contract.description ? `Detalhamento: ${contract.description}` : ''}`
    });

    // Clause 2 - Value
    allClauses.push({
      title: 'DO VALOR E FORMA DE PAGAMENTO',
      content: `Pela prestação dos serviços objeto deste contrato, o CONTRATANTE pagará à CONTRATADA o valor total de R$ ${contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${valorPorExtenso(contract.value)}), mediante ${contract.paymentMethod}, no prazo de ${contract.deadline}.\n\nParágrafo único: O não pagamento na data de vencimento acarretará multa de 2% (dois por cento) sobre o valor devido, acrescido de juros de mora de 1% (um por cento) ao mês.`
    });

    // Clause 3 - Timeline
    allClauses.push({
      title: 'DO PRAZO DE EXECUÇÃO',
      content: `Os serviços objeto deste contrato serão executados no período de ${contract.startDate ? formatDateBR(contract.startDate) : 'a definir'} a ${contract.endDate ? formatDateBR(contract.endDate) : 'a definir'}, podendo ser prorrogado mediante acordo escrito entre as partes.\n\nParágrafo único: A CONTRATADA deverá iniciar os serviços em até 5 (cinco) dias úteis após a assinatura deste contrato e/ou recebimento da ordem de serviço.`
    });

    // Add default clauses
    contract.clauses.forEach(clause => {
      allClauses.push({ title: clause.title.toUpperCase(), content: clause.content });
    });

    // Add custom clauses
    contract.customClauses.forEach(clause => {
      if (clause.title && clause.content) {
        allClauses.push({ title: clause.title.toUpperCase(), content: clause.content });
      }
    });

    // Final clause - Forum
    allClauses.push({
      title: 'DO FORO',
      content: `Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer dúvidas ou litígios oriundos deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.\n\nE por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença de 2 (duas) testemunhas.`
    });

    // Render clauses
    for (const clause of allClauses) {
      y = checkPageBreak(30);
      setY(y);
      
      // Clause header with green background
      doc.setFillColor(232, 245, 233);
      const headerText = `CLÁUSULA ${clauseNum}ª - ${clause.title}`;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const headerWidth = doc.getTextWidth(headerText) + 10;
      doc.rect(margin, y - 4, Math.min(headerWidth, contentWidth), 7, 'F');
      doc.setTextColor(27, 94, 32);
      doc.text(headerText, margin + 3, y + 1);
      y += 10;
      setY(y);

      // Clause content
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const contentLines = doc.splitTextToSize(clause.content, contentWidth - 8);
      
      for (const line of contentLines) {
        y = checkPageBreak(6);
        setY(y);
        doc.text(line, margin + 4, y);
        y += 4.5;
      }
      y += 6;
      setY(y);
      clauseNum++;
    }

    // ===== SIGNATURES =====
    y = checkPageBreak(60);
    setY(y);
    y += 10;
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text('São Paulo, _____ de ___________________ de _______.', pageWidth / 2, y, { align: 'center' });
    y += 25;
    setY(y);

    // Signature lines
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    
    // CONTRATADA signature
    doc.line(margin + 10, y, margin + 75, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATADA', margin + 25, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(company.name, margin + 15, y + 12);
    doc.text(`CNPJ: ${company.cnpj}`, margin + 15, y + 17);

    // CONTRATANTE signature
    doc.line(pageWidth - margin - 75, y, pageWidth - margin - 10, y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATANTE', pageWidth - margin - 65, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(client?.name || contract.clientName, pageWidth - margin - 70, y + 12);
    if (client?.document) {
      doc.text(`CNPJ/CPF: ${client.document}`, pageWidth - margin - 70, y + 17);
    }

    // Witnesses
    y += 35;
    setY(y);
    y = checkPageBreak(30);
    setY(y);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TESTEMUNHAS:', margin, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.line(margin + 5, y + 10, margin + 70, y + 10);
    doc.text('Nome:', margin + 5, y + 16);
    doc.text('CPF:', margin + 5, y + 22);

    doc.line(pageWidth - margin - 70, y + 10, pageWidth - margin - 5, y + 10);
    doc.text('Nome:', pageWidth - margin - 70, y + 16);
    doc.text('CPF:', pageWidth - margin - 70, y + 22);

    // ===== FOOTER ON ALL PAGES =====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(27, 94, 32);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
      
      // Footer text
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      doc.text(`${company.name} | CNPJ: ${company.cnpj} | ${company.address}`, pageWidth / 2, pageHeight - 13, { align: 'center' });
      doc.text(`${company.phone} | ${company.email}`, pageWidth / 2, pageHeight - 9, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
    }

    doc.save(`Contrato_${contract.number}_${(client?.name || contract.clientName).replace(/\s/g, '_')}.pdf`);
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
        <button onClick={() => { setShowForm(true); resetForm(); }} className="text-white font-medium py-2.5 px-5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}>
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
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={formData.clientId} onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value }))}>
                    <option value="">Selecione um cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {clients.length === 0 && <p className="text-xs text-amber-600 mt-1">Cadastre um cliente primeiro na seção Clientes</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Serviço</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={formData.serviceType} onChange={e => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}>
                    <option>Consultoria Ambiental</option><option>Consultoria Geotécnica</option><option>Licenciamento Ambiental</option><option>Estudo de Impacto Ambiental</option><option>Plano de Recuperação de Área Degradada</option><option>Georreferenciamento</option><option>Topografia</option><option>Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição do Serviço</label>
                <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" rows={3} placeholder="Descreva detalhadamente o serviço..." value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor (R$)</label>
                  <input type="number" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={formData.value} onChange={e => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Forma de Pagamento</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={formData.paymentMethod} onChange={e => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}>
                    <option>Boleto Bancário</option><option>Transferência Bancária</option><option>PIX</option><option>Cartão de Crédito</option><option>À vista</option><option>Parcelado (2x)</option><option>Parcelado (3x)</option><option>Parcelado (6x)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prazo de Pagamento</label>
                  <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={formData.deadline} onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Início</label>
                  <input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={formData.startDate} onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Término</label>
                  <input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={formData.endDate} onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))} />
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
                <button onClick={handleSave} className="text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}><Save className="w-4 h-4" /> Salvar Contrato</button>
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
            <div className="flex gap-3 mt-6 pt-4 border-t flex-wrap">
              <button onClick={() => generatePDF(previewContract)} className="text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}><FileDown className="w-4 h-4" /> Exportar PDF</button>
              <button onClick={() => { updateContractStatus(previewContract, 'sent'); setPreviewContract(null); }} className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2"><Send className="w-4 h-4" /> Marcar como Enviado</button>
              <button onClick={() => { updateContractStatus(previewContract, 'signed'); setPreviewContract(null); }} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Marcar como Assinado</button>
              <button onClick={() => setPreviewContract(null)} className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-5 rounded-lg transition-all">Fechar</button>
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

// Helper functions
function valorPorExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  
  function converterGrupo(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    let result = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    if (c > 0) result += centenas[c] + (n % 100 > 0 ? ' e ' : '');
    if (n % 100 < 20) {
      result += unidades[n % 100];
    } else {
      result += dezenas[d] + (u > 0 ? ' e ' + unidades[u] : '');
    }
    return result;
  }
  
  let extenso = '';
  if (inteiro > 0) {
    if (inteiro >= 1000000) {
      const milhoes = Math.floor(inteiro / 1000000);
      extenso += converterGrupo(milhoes) + (milhoes === 1 ? ' milhão' : ' milhões');
      const resto = inteiro % 1000000;
      if (resto > 0) extenso += ' ';
    }
    if (inteiro >= 1000 && inteiro < 1000000) {
      const mil = Math.floor(inteiro / 1000);
      if (mil === 1) extenso += 'mil';
      else extenso += converterGrupo(mil) + ' mil';
      const resto = inteiro % 1000;
      if (resto > 0 && resto < 100) extenso += ' e ';
      else if (resto > 0) extenso += ' ';
    }
    if (inteiro % 1000 > 0 && inteiro < 1000000) {
      extenso += converterGrupo(inteiro % 1000);
    }
    extenso += inteiro === 1 ? ' real' : ' reais';
  }
  
  if (centavos > 0) {
    if (inteiro > 0) extenso += ' e ';
    extenso += converterGrupo(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  }
  
  return extenso;
}

function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function ContractPreview({ contract, clients }: { contract: Contract; clients: Client[] }) {
  const company = store.getCompany();
  const client = clients.find(c => c.id === contract.clientId);
  const allClauses = [...contract.clauses, ...contract.customClauses];

  return (
    <div className="border rounded-lg p-8 bg-white">
      <div className="text-center border-b-2 pb-4 mb-6" style={{ borderColor: '#1B5E20' }}>
        <h2 className="text-xl font-bold" style={{ color: '#1B5E20' }}>{company.name}</h2>
        <p className="text-sm text-gray-500">{company.slogan}</p>
        <p className="text-xs text-gray-400 mt-1">CNPJ: {company.cnpj} | {company.phone} | {company.email}</p>
      </div>
      <h3 className="text-center font-bold text-lg mb-2" style={{ color: '#1B5E20' }}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h3>
      <p className="text-center text-sm text-gray-500 mb-6">Contrato nº {contract.number}</p>
      <div className="space-y-4 text-sm">
        <div className="p-3 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}>
          <h4 className="font-bold mb-1" style={{ color: '#1B5E20' }}>CONTRATADA:</h4>
          <p>{company.name} - CNPJ: {company.cnpj}</p>
          <p>{company.address}</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-50">
          <h4 className="font-bold mb-1 text-amber-800">CONTRATANTE:</h4>
          <p>{client?.name || contract.clientName}</p>
          <p>Documento: {client?.document || 'N/A'}</p>
          {client?.address && <p>{client.address}</p>}
        </div>
        <div>
          <h4 className="font-bold mb-1" style={{ color: '#1B5E20' }}>DO OBJETO:</h4>
          <p>Prestação de serviços de {contract.serviceType}. {contract.description}</p>
        </div>
        <div>
          <h4 className="font-bold mb-1" style={{ color: '#1B5E20' }}>DO VALOR:</h4>
          <p>R$ {contract.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({valorPorExtenso(contract.value)}) - Pagamento via {contract.paymentMethod} em {contract.deadline}.</p>
        </div>
        <div>
          <h4 className="font-bold mb-1" style={{ color: '#1B5E20' }}>DO PRAZO:</h4>
          <p>Período de {contract.startDate ? formatDateBR(contract.startDate) : 'a definir'} a {contract.endDate ? formatDateBR(contract.endDate) : 'a definir'}.</p>
        </div>
        {allClauses.map((clause, i) => (
          <div key={clause.id} className="border-l-4 pl-3" style={{ borderColor: '#1B5E20' }}>
            <h4 className="font-bold mb-1" style={{ color: '#1B5E20' }}>CLÁUSULA {i + 4}ª - {clause.title.toUpperCase()}:</h4>
            <p className="text-gray-700">{clause.content}</p>
          </div>
        ))}
        <div className="mt-8 grid grid-cols-2 gap-8 text-center">
          <div><div className="border-t border-gray-300 pt-2 mt-12"><p className="text-xs font-medium">CONTRATADA</p><p className="text-xs text-gray-500">{company.name}</p></div></div>
          <div><div className="border-t border-gray-300 pt-2 mt-12"><p className="text-xs font-medium">CONTRATANTE</p><p className="text-xs text-gray-500">{client?.name || contract.clientName}</p></div></div>
        </div>
      </div>
    </div>
  );
}
