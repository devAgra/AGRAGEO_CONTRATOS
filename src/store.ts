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
  email: 'agrageoconsultoria@gmail.com',
  slogan: 'Soluções em Consultoria Ambiental e Geotécnica',
  logo: '',
  primaryColor: '#1B5E20',
  secondaryColor: '#FF8F00',
};

const defaultClauses: ContractClause[] = [
  {
    id: '1',
    title: 'Confidencialidade',
    content: 'As partes comprometem-se a manter em sigilo todas as informações trocadas durante a execução deste contrato, não podendo divulgá-las a terceiros sem prévia autorização por escrito da outra parte.\n\nParágrafo único: A obrigação de confidencialidade permanecerá vigente mesmo após o término deste contrato, pelo prazo de 5 (cinco) anos.',
    isDefault: true,
  },
  {
    id: '2',
    title: 'Das Obrigações da CONTRATADA',
    content: 'A CONTRATADA compromete-se a executar os serviços descritos neste instrumento com zelo, diligência e dentro dos padrões técnicos adequados, respondendo pela qualidade dos trabalhos realizados.\n\nI - Designar profissionais qualificados para a execução dos serviços;\nII - Cumprir os prazos estabelecidos neste contrato;\nIII - Manter sigilo sobre as informações do CONTRATANTE;\nIV - Entregar relatórios técnicos completos ao final de cada etapa.',
    isDefault: true,
  },
  {
    id: '3',
    title: 'Das Obrigações do CONTRATANTE',
    content: 'O CONTRATANTE compromete-se a:\n\nI - Fornecer todas as informações e documentos necessários para a execução dos serviços;\nII - Efetuar os pagamentos nas datas e condições estipuladas;\nIII - Proporcionar acesso às áreas necessárias para execução dos serviços;\nIV - Designar um responsável para acompanhar a execução dos serviços.',
    isDefault: true,
  },
  {
    id: '4',
    title: 'Do Prazo e Cronograma',
    content: 'Os serviços objeto deste contrato deverão ser executados dentro do prazo estipulado, podendo ser prorrogado mediante acordo entre as partes, em caso de força maior ou caso fortuito.\n\nParágrafo primeiro: Qualquer alteração no cronograma deverá ser comunicada por escrito com antecedência mínima de 5 (cinco) dias úteis.\n\nParágrafo segundo: Atrasos causados por fatores alheios à vontade da CONTRATADA não serão considerados para fins de penalidade.',
    isDefault: true,
  },
  {
    id: '5',
    title: 'Da Rescisão',
    content: 'O presente contrato poderá ser rescindido:\n\nI - Por acordo entre as partes, mediante termo escrito;\nII - Por qualquer uma das partes, mediante aviso prévio por escrito com antecedência mínima de 30 (trinta) dias;\nIII - Por inadimplemento de qualquer das cláusulas contratuais, após notificação com prazo de 15 (quinze) dias para regularização.\n\nParágrafo único: Na hipótese de rescisão, a CONTRATADA fará jus ao recebimento dos serviços efetivamente prestados até a data da rescisão.',
    isDefault: true,
  },
  {
    id: '6',
    title: 'Das Penalidades',
    content: 'O descumprimento de qualquer cláusula deste contrato sujeitará a parte infratora ao pagamento de multa de 10% (dez por cento) sobre o valor total do contrato, sem prejuízo de perdas e danos.\n\nParágrafo único: A multa prevista neste instrumento não exclui a possibilidade de rescisão contratual e indenização por eventuais danos comprovados.',
    isDefault: true,
  },
  {
    id: '7',
    title: 'Da Propriedade Intelectual',
    content: 'Todos os relatórios, laudos, estudos e demais produtos técnicos elaborados pela CONTRATADA em decorrência deste contrato serão de propriedade do CONTRATANTE após a quitação integral dos valores devidos.\n\nParágrafo único: A CONTRATADA reserva-se o direito de utilizar os conhecimentos técnicos adquiridos durante a execução dos serviços, desde que não impliquem na divulgação de informações confidenciais do CONTRATANTE.',
    isDefault: true,
  },
  {
    id: '8',
    title: 'Das Disposições Gerais',
    content: 'Este contrato constitui o acordo integral entre as partes, prevalecendo sobre quaisquer entendimentos anteriores, verbais ou escritos.\n\nI - Qualquer modificação neste contrato deverá ser feita por escrito e assinada pelas partes;\nII - A tolerância de uma parte quanto ao descumprimento de qualquer obrigação pela outra não constituirá novação ou precedente;\nIII - As partes declaram que este contrato foi livremente ajustado, sem qualquer vício de consentimento.',
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
