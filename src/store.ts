import { CompanyData, Client, Contract, Proposal, Model, ContractClause } from './types';

const STORAGE_KEYS = {
  company: 'agrageo_company',
  clients: 'agrageo_clients',
  contracts: 'agrageo_contracts',
  proposals: 'agrageo_proposals',
  models: 'agrageo_models',
  clauses: 'agrageo_clauses',
};

const defaultCompany: CompanyData = {
  name: 'AGRAGEO CONSULTORIA',
  cnpj: '00.000.000/0001-00',
  address: 'Rua das Consultorias, 1000 - São Paulo/SP',
  phone: '(11) 99999-9999',
  email: 'contato@agrageo.com.br',
  slogan: 'Soluções em Consultoria Ambiental e Geotécnica',
  logo: '',
  primaryColor: '#1B5E20',
  secondaryColor: '#FF8F00',
};

const defaultClauses: ContractClause[] = [
  {
    id: '1',
    title: 'Confidencialidade',
    content: 'As partes comprometem-se a manter em sigilo todas as informações trocadas durante a execução deste contrato, não podendo divulgá-las a terceiros sem prévia autorização por escrito da outra parte.',
    isDefault: true,
  },
  {
    id: '2',
    title: 'Responsabilidades da CONTRATADA',
    content: 'A CONTRATADA compromete-se a executar os serviços descritos neste instrumento com zelo, diligência e dentro dos padrões técnicos adequados, respondendo pela qualidade dos trabalhos realizados.',
    isDefault: true,
  },
  {
    id: '3',
    title: 'Responsabilidades do CONTRATANTE',
    content: 'O CONTRATANTE compromete-se a fornecer todas as informações e documentos necessários para a execução dos serviços, bem como a efetuar os pagamentos nas datas e condições estipuladas.',
    isDefault: true,
  },
  {
    id: '4',
    title: 'Prazo de Execução',
    content: 'Os serviços objeto deste contrato deverão ser executados dentro do prazo estipulado, podendo ser prorrogado mediante acordo entre as partes, em caso de força maior ou caso fortuito.',
    isDefault: true,
  },
  {
    id: '5',
    title: 'Rescisão',
    content: 'O presente contrato poderá ser rescindido por qualquer uma das partes, mediante aviso prévio por escrito com antecedência mínima de 30 (trinta) dias, sem ônus para a parte que não deu causa à rescisão.',
    isDefault: true,
  },
  {
    id: '6',
    title: 'Foro',
    content: 'Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer dúvidas ou litígios oriundos deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
    isDefault: true,
  },
];

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  getCompany: (): CompanyData => getItem(STORAGE_KEYS.company, defaultCompany),
  setCompany: (data: CompanyData) => setItem(STORAGE_KEYS.company, data),

  getClients: (): Client[] => getItem(STORAGE_KEYS.clients, []),
  setClients: (clients: Client[]) => setItem(STORAGE_KEYS.clients, clients),
  addClient: (client: Client) => {
    const clients = store.getClients();
    clients.push(client);
    store.setClients(clients);
  },

  getContracts: (): Contract[] => getItem(STORAGE_KEYS.contracts, []),
  setContracts: (contracts: Contract[]) => setItem(STORAGE_KEYS.contracts, contracts),
  addContract: (contract: Contract) => {
    const contracts = store.getContracts();
    contracts.push(contract);
    store.setContracts(contracts);
  },
  updateContract: (contract: Contract) => {
    const contracts = store.getContracts();
    const index = contracts.findIndex(c => c.id === contract.id);
    if (index >= 0) {
      contracts[index] = contract;
      store.setContracts(contracts);
    }
  },

  getProposals: (): Proposal[] => getItem(STORAGE_KEYS.proposals, []),
  setProposals: (proposals: Proposal[]) => setItem(STORAGE_KEYS.proposals, proposals),
  addProposal: (proposal: Proposal) => {
    const proposals = store.getProposals();
    proposals.push(proposal);
    store.setProposals(proposals);
  },
  updateProposal: (proposal: Proposal) => {
    const proposals = store.getProposals();
    const index = proposals.findIndex(p => p.id === proposal.id);
    if (index >= 0) {
      proposals[index] = proposal;
      store.setProposals(proposals);
    }
  },

  getModels: (): Model[] => getItem(STORAGE_KEYS.models, []),
  setModels: (models: Model[]) => setItem(STORAGE_KEYS.models, models),
  addModel: (model: Model) => {
    const models = store.getModels();
    models.push(model);
    store.setModels(models);
  },

  getClauses: (): ContractClause[] => getItem(STORAGE_KEYS.clauses, defaultClauses),
  setClauses: (clauses: ContractClause[]) => setItem(STORAGE_KEYS.clauses, clauses),

  generateId: (): string => Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
  generateNumber: (prefix: string): string => {
    const now = new Date();
    return `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  },
};
