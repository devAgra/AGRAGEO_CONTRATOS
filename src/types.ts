export interface CompanyData {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  slogan: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface Client {
  id: string;
  name: string;
  document: string;
  address: string;
  contact: string;
  email: string;
  phone: string;
}

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  isDefault: boolean;
}

export interface Contract {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  description: string;
  value: number;
  paymentMethod: string;
  deadline: string;
  startDate: string;
  endDate: string;
  clauses: ContractClause[];
  customClauses: ContractClause[];
  status: 'draft' | 'sent' | 'signed' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  scope: string;
  timeline: string;
  investment: number;
  paymentConditions: string;
  differentials: string[];
  items: ProposalItem[];
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Model {
  id: string;
  name: string;
  type: 'contract' | 'proposal';
  content: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface DashboardMetrics {
  totalContracts: number;
  totalProposals: number;
  contractsThisMonth: number;
  proposalsThisMonth: number;
  conversionRate: number;
  totalRevenue: number;
}
