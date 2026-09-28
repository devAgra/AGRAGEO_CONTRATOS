import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ContractGenerator from './pages/ContractGenerator';
import ProposalGenerator from './pages/ProposalGenerator';
import SavedModels from './pages/SavedModels';
import ClientList from './pages/ClientList';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="contratos" element={<ContractGenerator />} />
          <Route path="propostas" element={<ProposalGenerator />} />
          <Route path="modelos" element={<SavedModels />} />
          <Route path="clientes" element={<ClientList />} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
