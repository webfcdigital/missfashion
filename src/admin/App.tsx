import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, RefreshCw, 
  Plus, Trash2, Edit3, Eye, AlertCircle, FileText, 
  CheckCircle, ArrowLeftRight, Terminal, Power, Globe, ShoppingBag, Info
} from 'lucide-react';
import type { Product, Order, ShopeeConfig } from '../shared/types';
import { 
  getStoredProducts, saveStoredProducts, 
  getStoredOrders, saveStoredOrders,
  getStoredShopeeConfig, saveStoredShopeeConfig 
} from '../shared/mockData';


export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'shopee'>('dashboard');
  
  // Estados de dados
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopeeConfig, setShopeeConfig] = useState<ShopeeConfig>({ partnerId: '', shopId: '', isConnected: false });
  
  // Estados para CRUD de Produtos
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodCategory, setProdCategory] = useState('Vestidos');
  const [prodStock, setProdStock] = useState(10);
  const [prodSizeString, setProdSizeString] = useState('P, M, G');
  const [prodColorString, setProdColorString] = useState('Preto, Branco');
  const [prodImage, setProdImage] = useState('/images/vestido_floral.png'); // Imagem padrão

  // Estados de simulação & Logs
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Sistema administrativo inicializado.`,
    `[${new Date().toLocaleTimeString()}] Banco de dados local conectado via LocalStorage.`
  ]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isNfeLoading, setIsNfeLoading] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    setProducts(getStoredProducts());
    setOrders(getStoredOrders());
    setShopeeConfig(getStoredShopeeConfig());
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 49)]);
  };

  // CRUD - Salvar Produto (Novo ou Editado)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || prodPrice <= 0) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const sizes = prodSizeString.split(',').map(s => s.trim()).filter(Boolean);
    const colors = prodColorString.split(',').map(c => c.trim()).filter(Boolean);

    let updatedProducts = [...products];

    if (editingProduct) {
      // Editar
      updatedProducts = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: prodName,
            description: prodDescription,
            price: prodPrice,
            category: prodCategory,
            stock: prodStock,
            sizes,
            colors,
            shopeeStatus: p.shopeeStatus === 'synced' ? 'unsynced' : p.shopeeStatus // Força resync
          };
        }
        return p;
      });
      addLog(`Produto "${prodName}" atualizado com sucesso.`);
    } else {
      // Criar Novo
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: prodName,
        description: prodDescription,
        price: prodPrice,
        images: [prodImage],
        sizes,
        colors,
        category: prodCategory,
        stock: prodStock,
        shopeeStatus: 'unsynced',
        createdAt: new Date().toISOString()
      };
      updatedProducts = [newProduct, ...products];
      addLog(`Novo produto "${prodName}" cadastrado com sucesso.`);
    }

    saveStoredProducts(updatedProducts);
    setProducts(updatedProducts);
    closeProductModal();
  };

  const openProductModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setProdName(product.name);
      setProdDescription(product.description);
      setProdPrice(product.price);
      setProdCategory(product.category);
      setProdStock(product.stock);
      setProdSizeString(product.sizes.join(', '));
      setProdColorString(product.colors.join(', '));
      setProdImage(product.images[0]);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdDescription('');
      setProdPrice(0);
      setProdCategory('Vestidos');
      setProdStock(10);
      setProdSizeString('P, M, G');
      setProdColorString('Preto, Branco');
      setProdImage('/images/vestido_floral.png');
    }
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // CRUD - Excluir Produto
  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
      const updated = products.filter(p => p.id !== id);
      saveStoredProducts(updated);
      setProducts(updated);
      addLog(`Produto "${name}" removido do catálogo.`);
    }
  };

  // Simulação: Sincronização Shopee
  const handleSyncShopee = async () => {
    if (!shopeeConfig.isConnected) {
      alert('Por favor, ative a integração com a Shopee na aba "Integração" antes de sincronizar.');
      return;
    }

    setIsSyncing(true);
    addLog('Iniciando sincronização de catálogo com a API da Shopee v2...');

    // Simulando delay da rede/API
    setTimeout(() => {
      const updated = products.map(p => {
        if (p.shopeeStatus !== 'synced') {
          return {
            ...p,
            shopeeItemId: p.shopeeItemId || `shopee-item-${Math.floor(100000 + Math.random() * 900000)}`,
            shopeeStatus: 'synced' as const
          };
        }
        return p;
      });

      saveStoredProducts(updated);
      setProducts(updated);
      setIsSyncing(false);
      addLog('Sincronização Shopee concluída. Todos os estoques e preços foram enviados.');
      alert('Sincronização com a Shopee concluída com sucesso!');
    }, 2000);
  };

  // Simulação: Transmitir Nota Fiscal (NFe)
  const handleEmitNfe = (orderId: string) => {
    setIsNfeLoading(orderId);
    addLog(`Transmitindo dados de venda do pedido ${orderId} para a FocusNFe (Simulador SEFAZ)...`);

    setTimeout(() => {
      const updated = orders.map(ord => {
        if (ord.id === orderId) {
          return {
            ...ord,
            nfeNumber: `NFe-000${Math.floor(100 + Math.random() * 900)}`,
            nfeStatus: 'issued' as const
          };
        }
        return ord;
      });

      saveStoredOrders(updated);
      setOrders(updated);
      setIsNfeLoading(null);
      addLog(`Nota Fiscal emitida com sucesso para o pedido ${orderId}. Status: AUTORIZADA.`);
    }, 2500);
  };

  // Simulação: Receber Pedido Shopee via Webhook
  const handleSimulateShopeeWebhook = () => {
    if (!shopeeConfig.isConnected) {
      alert('Integração Shopee desativada. Ative-a para receber pedidos simulados.');
      return;
    }

    const randomProduct = products[Math.floor(Math.random() * products.length)];
    if (!randomProduct || randomProduct.stock <= 0) {
      alert('Cadastre produtos com estoque disponível para rodar a simulação.');
      return;
    }

    const qty = 1;
    const orderId = `ped-${Math.floor(1000 + Math.random() * 9000)}`;
    const shopeeOrderId = `SHP-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const newOrder: Order = {
      id: orderId,
      customerName: `Cliente Shopee #${Math.floor(100 + Math.random() * 900)}`,
      customerPhone: '5511999990000',
      customerAddress: 'Rua de Entrega Shopee, 123 - Centro, São Paulo - SP',
      items: [
        {
          productId: randomProduct.id,
          name: randomProduct.name,
          size: randomProduct.sizes[0] || 'M',
          color: randomProduct.colors[0] || 'Cor Única',
          quantity: qty,
          price: randomProduct.price,
          image: randomProduct.images[0]
        }
      ],
      total: randomProduct.price * qty,
      status: 'pending',
      source: 'shopee',
      shopeeOrderId,
      nfeStatus: 'draft',
      createdAt: new Date().toISOString()
    };

    // Baixa estoque do produto local
    const updatedProducts = products.map(p => {
      if (p.id === randomProduct.id) {
        return { ...p, stock: Math.max(0, p.stock - qty) };
      }
      return p;
    });

    saveStoredProducts(updatedProducts);
    setProducts(updatedProducts);

    const updatedOrders = [newOrder, ...orders];
    saveStoredOrders(updatedOrders);
    setOrders(updatedOrders);

    addLog(`Webhook Shopee: Novo pedido ${shopeeOrderId} recebido. Estoque do item "${randomProduct.name}" reduzido.`);
  };

  // Ligar/Desligar integração
  const toggleShopeeConnection = () => {
    const nextState = !shopeeConfig.isConnected;
    const newConf = { ...shopeeConfig, isConnected: nextState };
    setShopeeConfig(newConf);
    saveStoredShopeeConfig(newConf);
    addLog(`Integração com a Shopee ${nextState ? 'ATIVADA' : 'DESATIVADA'}.`);
  };

  // Salvar credenciais Shopee
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const newConf = { ...shopeeConfig, isConnected: true };
    setShopeeConfig(newConf);
    saveStoredShopeeConfig(newConf);
    addLog('Credenciais da Shopee salvas localmente.');
    alert('Configurações da Shopee salvas!');
  };

  // Alterar status do pedido
  const handleUpdateOrderStatus = (orderId: string, nextStatus: Order['status']) => {
    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        return { ...ord, status: nextStatus };
      }
      return ord;
    });
    saveStoredOrders(updated);
    setOrders(updated);
    addLog(`Status do pedido ${orderId} alterado para "${nextStatus}".`);
  };

  // Estatísticas para dashboard
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);
  const pendingOrdersCount = orders.filter(ord => ord.status === 'pending').length;
  const totalStockItems = products.reduce((sum, prod) => sum + prod.stock, 0);

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Miss<span>Fashion</span> Admin</h2>
        </div>
        <nav className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} /> Painel Geral
          </button>
          <button 
            className={`menu-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={18} /> Catálogo e Estoque
          </button>
          <button 
            className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingCart size={18} /> Gestão de Vendas
          </button>
          <button 
            className={`menu-item ${activeTab === 'shopee' ? 'active' : ''}`}
            onClick={() => setActiveTab('shopee')}
          >
            <ArrowLeftRight size={18} /> Integração Shopee
          </button>
        </nav>

        <div className="sidebar-footer">
          <a href="/index.html" className="view-shop-btn">
            <Globe size={16} /> Ver Loja Virtual
          </a>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="admin-main">
        {/* CABEÇALHO DO PAINEL */}
        <header className="admin-header">
          <div className="header-info">
            <h1>Área Administrativa</h1>
            <p>Gerencie sua loja, integre com a Shopee e emita NFe</p>
          </div>
          <div className="header-actions">
            {shopeeConfig.isConnected ? (
              <span className="shopee-status-badge active">
                <CheckCircle size={14} /> Shopee Conectada
              </span>
            ) : (
              <span className="shopee-status-badge inactive">
                <AlertCircle size={14} /> Shopee Desconectada
              </span>
            )}
          </div>
        </header>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="tab-content animate-fade-in">
            {/* CARDS INDICADORES */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon revenue"><ShoppingCart size={24} /></div>
                <div className="stat-data">
                  <span className="stat-label">Faturamento Total</span>
                  <span className="stat-value">R$ {totalRevenue.toFixed(2)}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orders"><ShoppingBag size={24} /></div>
                <div className="stat-data">
                  <span className="stat-label">Pedidos Pendentes</span>
                  <span className="stat-value">{pendingOrdersCount}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stock"><Package size={24} /></div>
                <div className="stat-data">
                  <span className="stat-label">Estoque Total</span>
                  <span className="stat-value">{totalStockItems} pçs</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon integration"><ArrowLeftRight size={24} /></div>
                <div className="stat-data">
                  <span className="stat-label">Integração Shopee</span>
                  <span className="stat-value">{shopeeConfig.isConnected ? 'Ativa' : 'Desativada'}</span>
                </div>
              </div>
            </div>

            <div className="dashboard-layout-grid">
              {/* PEDIDOS RECENTES */}
              <div className="dashboard-panel card-panel">
                <h3>Vendas Recentes</h3>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Cód.</th>
                        <th>Cliente</th>
                        <th>Origem</th>
                        <th>Valor</th>
                        <th>NFe</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(ord => (
                        <tr key={ord.id}>
                          <td className="bold">{ord.id}</td>
                          <td>{ord.customerName}</td>
                          <td>
                            <span className={`source-badge ${ord.source}`}>
                              {ord.source === 'shopee' ? 'Shopee' : 'Vitrine'}
                            </span>
                          </td>
                          <td>R$ {ord.total.toFixed(2)}</td>
                          <td>
                            {ord.nfeNumber ? (
                              <span className="nfe-badge success">{ord.nfeNumber}</span>
                            ) : (
                              <span className="nfe-badge pending">Pendente</span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${ord.status}`}>
                              {ord.status === 'pending' ? 'Pendente' : 
                               ord.status === 'preparing' ? 'Preparando' : 
                               ord.status === 'shipped' ? 'Enviado' : 'Entregue'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              {ord.nfeStatus === 'draft' && (
                                <button 
                                  className="action-btn text-success" 
                                  title="Emitir NFe"
                                  onClick={() => handleEmitNfe(ord.id)}
                                  disabled={isNfeLoading === ord.id}
                                >
                                  {isNfeLoading === ord.id ? (
                                    <RefreshCw size={14} className="spin" />
                                  ) : (
                                    <FileText size={14} />
                                  )}
                                </button>
                              )}
                              <button 
                                className="action-btn text-primary" 
                                title="Ver Detalhes"
                                onClick={() => setActiveTab('orders')}
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SIMULADOR E LOGS */}
              <div className="dashboard-panel card-panel logs-panel-wrapper">
                <div className="panel-header-row">
                  <h3>Central de Integração & Logs</h3>
                  <button 
                    className="simulate-order-btn" 
                    onClick={handleSimulateShopeeWebhook}
                    disabled={!shopeeConfig.isConnected}
                  >
                    Simular Pedido Webhook Shopee
                  </button>
                </div>
                
                <div className="terminal-view">
                  <div className="terminal-header">
                    <Terminal size={14} /> Console de Transmissão API Shopee/SEFAZ
                  </div>
                  <div className="terminal-body">
                    {logs.map((log, index) => (
                      <div key={index} className="log-line">{log}</div>
                    ))}
                  </div>
                </div>
                
                <div className="simulation-help">
                  <Info size={14} />
                  <span>Use o botão para simular um pedido vindo da Shopee. Isso baixará o estoque local e registrará a venda instantaneamente.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATÁLOGO E ESTOQUE */}
        {activeTab === 'products' && (
          <div className="tab-content animate-fade-in card-panel">
            <div className="panel-header-row">
              <h3>Catálogo de Roupas & Estoque</h3>
              <div className="panel-actions-row">
                <button 
                  className={`sync-shopee-btn ${isSyncing ? 'loading' : ''}`}
                  onClick={handleSyncShopee}
                  disabled={isSyncing}
                >
                  <RefreshCw size={16} className={isSyncing ? 'spin' : ''} /> 
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar com Shopee'}
                </button>
                <button className="add-product-btn" onClick={() => openProductModal(null)}>
                  <Plus size={16} /> Cadastrar Roupa
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Imagem</th>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Tamanhos / Cores</th>
                    <th>Shopee API</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => (
                    <tr key={prod.id}>
                      <td>
                        <img src={prod.images[0]} alt={prod.name} className="table-product-img" />
                      </td>
                      <td className="bold">{prod.name}</td>
                      <td>{prod.category}</td>
                      <td className="bold">R$ {prod.price.toFixed(2)}</td>
                      <td>
                        <span className={`stock-badge ${prod.stock < 5 ? 'low' : ''}`}>
                          {prod.stock} un
                        </span>
                      </td>
                      <td>
                        <div className="item-meta-tags">
                          <span>Tam: {prod.sizes.join('/')}</span>
                          <span>Cores: {prod.colors.join('/')}</span>
                        </div>
                      </td>
                      <td>
                        {prod.shopeeStatus === 'synced' ? (
                          <span className="api-status synced" title={`Shopee ID: ${prod.shopeeItemId}`}>
                            Sincronizado
                          </span>
                        ) : (
                          <span className="api-status unsynced">
                            Não Sincronizado
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="action-btn text-primary" onClick={() => openProductModal(prod)}>
                            <Edit3 size={14} />
                          </button>
                          <button className="action-btn text-danger" onClick={() => handleDeleteProduct(prod.id, prod.name)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: GESTÃO DE VENDAS */}
        {activeTab === 'orders' && (
          <div className="tab-content animate-fade-in card-panel">
            <h3>Gestão Unificada de Vendas</h3>
            <p className="tab-subtitle">Pedidos recebidos pela Vitrine Virtual e Shopee</p>

            <div className="table-responsive margin-top-lg">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Origem</th>
                    <th>Itens</th>
                    <th>Total</th>
                    <th>Nota Fiscal (NFe)</th>
                    <th>Status Pedido</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(ord => (
                    <tr key={ord.id}>
                      <td className="bold">{ord.id}</td>
                      <td>
                        <div className="customer-info-cell">
                          <strong>{ord.customerName}</strong>
                          <span>{ord.customerPhone}</span>
                          <span className="address-muted">{ord.customerAddress}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`source-badge ${ord.source}`}>
                          {ord.source === 'shopee' ? `Shopee (${ord.shopeeOrderId})` : 'Vitrine Virtual'}
                        </span>
                      </td>
                      <td>
                        <div className="ordered-items-cell">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="ordered-item-row">
                              {item.name} ({item.size}/{item.color}) x{item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="bold text-secondary">R$ {ord.total.toFixed(2)}</td>
                      <td>
                        {ord.nfeNumber ? (
                          <span className="nfe-badge success">{ord.nfeNumber}</span>
                        ) : (
                          <button 
                            className={`emit-nfe-action-btn ${isNfeLoading === ord.id ? 'loading' : ''}`}
                            onClick={() => handleEmitNfe(ord.id)}
                            disabled={isNfeLoading === ord.id}
                          >
                            {isNfeLoading === ord.id ? 'Emitindo...' : 'Emitir NFe'}
                          </button>
                        )}
                      </td>
                      <td>
                        <select 
                          className={`status-select ${ord.status}`}
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as Order['status'])}
                        >
                          <option value="pending">Pendente (Pago)</option>
                          <option value="preparing">Preparando Envio</option>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregue</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </td>
                      <td>{new Date(ord.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: INTEGRAÇÃO SHOPEE */}
        {activeTab === 'shopee' && (
          <div className="tab-content animate-fade-in shopee-integration-grid">
            <div className="card-panel">
              <h3>Configurações da API da Shopee v2</h3>
              <p className="tab-subtitle">Conecte sua conta de Vendedor ou Sandbox para sincronizar catálogo e pedidos</p>

              <div className="connection-switch-box margin-top-lg">
                <div className="switch-info">
                  <strong>Status da Conectividade</strong>
                  <p>Ligue a chave para habilitar a transmissão de dados e recepção de webhooks</p>
                </div>
                <button 
                  className={`connection-toggle-btn ${shopeeConfig.isConnected ? 'active' : ''}`}
                  onClick={toggleShopeeConnection}
                >
                  <Power size={18} /> {shopeeConfig.isConnected ? 'Desconectar API' : 'Conectar API'}
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="shopee-config-form margin-top-lg">
                <div className="form-group">
                  <label>Partner ID (Chave de Desenvolvedor Shopee)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 847293" 
                    value={shopeeConfig.partnerId}
                    onChange={e => setShopeeConfig({...shopeeConfig, partnerId: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Shop ID (ID da Loja Shopee Vendedor)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 198273645" 
                    value={shopeeConfig.shopId}
                    onChange={e => setShopeeConfig({...shopeeConfig, shopId: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Partner Key (Chave Secreta para Assinatura HMAC-SHA256)</label>
                  <input 
                    type="password" 
                    placeholder="••••••••••••••••••••••••••••••••••••" 
                    disabled={shopeeConfig.isConnected}
                  />
                  <small className="help-text">Esta chave de assinatura é tratada de forma segura e criptografada via HTTPS.</small>
                </div>

                <div className="form-actions-shopee">
                  <button type="submit" className="save-shopee-settings-btn">
                    Salvar Configurações e Testar Conexão
                  </button>
                </div>
              </form>
            </div>

            <div className="card-panel shopee-docs-panel">
              <h3>Como funciona a Integração?</h3>
              <div className="step-doc-list">
                <div className="step-doc-item">
                  <span className="step-number">1</span>
                  <div className="step-text">
                    <strong>Autenticação OAuth2</strong>
                    <p>O Vendedor concede permissão à aplicação MissFashion e a Shopee retorna o Access Token.</p>
                  </div>
                </div>
                <div className="step-doc-item">
                  <span className="step-number">2</span>
                  <div className="step-text">
                    <strong>Sincronização de Estoque</strong>
                    <p>As alterações feitas no catálogo local do Admin podem ser enviadas à Shopee usando chamadas do webhook ou via cron de sync.</p>
                  </div>
                </div>
                <div className="step-doc-item">
                  <span className="step-number">3</span>
                  <div className="step-text">
                    <strong>Webhook de Pedidos</strong>
                    <p>Sempre que um cliente compra seu anúncio na Shopee, o servidor da Shopee envia uma notificação Webhook em tempo real à nossa API, atualizando as vendas locais.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL CADASTRAR/EDITAR PRODUTO */}
      {isProductModalOpen && (
        <div className="modal-backdrop" onClick={closeProductModal}>
          <div className="modal-content admin-modal animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header-admin">
              <h3>{editingProduct ? 'Editar Roupa' : 'Cadastrar Nova Roupa'}</h3>
              <button className="modal-close-btn" onClick={closeProductModal}>×</button>
            </div>
            <form onSubmit={handleSaveProduct} className="admin-product-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Nome do Produto</label>
                  <input 
                    type="text" 
                    value={prodName} 
                    onChange={e => setProdName(e.target.value)} 
                    required 
                    placeholder="Ex: Vestido Midi Satin"
                  />
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <select value={prodCategory} onChange={e => setProdCategory(e.target.value)}>
                    <option value="Vestidos">Vestidos</option>
                    <option value="Conjuntos">Conjuntos</option>
                    <option value="Blusas">Blusas</option>
                    <option value="Calças">Calças</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descrição Detalhada</label>
                <textarea 
                  value={prodDescription} 
                  onChange={e => setProdDescription(e.target.value)} 
                  rows={3}
                  placeholder="Descreva o caimento, tecido, detalhes do design..."
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Preço de Venda (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={prodPrice} 
                    onChange={e => setProdPrice(parseFloat(e.target.value) || 0)} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Estoque Inicial</label>
                  <input 
                    type="number" 
                    value={prodStock} 
                    onChange={e => setProdStock(parseInt(e.target.value) || 0)} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Foto de Vitrine</label>
                  <select value={prodImage} onChange={e => setProdImage(e.target.value)}>
                    <option value="/images/vestido_floral.png">Vestido Floral</option>
                    <option value="/images/conjunto_alfaiataria.png">Conjunto Alfaiataria</option>
                    <option value="/images/blusa_tricot.png">Blusa Tricot</option>
                    <option value="/images/calca_jeans.png">Calça Jeans</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Tamanhos (separados por vírgula)</label>
                  <input 
                    type="text" 
                    value={prodSizeString} 
                    onChange={e => setProdSizeString(e.target.value)} 
                    placeholder="P, M, G, GG"
                  />
                </div>
                <div className="form-group">
                  <label>Cores (separados por vírgula)</label>
                  <input 
                    type="text" 
                    value={prodColorString} 
                    onChange={e => setProdColorString(e.target.value)} 
                    placeholder="Preto, Branco, Rosa"
                  />
                </div>
              </div>

              <div className="form-actions-modal">
                <button type="button" className="cancel-btn" onClick={closeProductModal}>Cancelar</button>
                <button type="submit" className="save-btn-modal">
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Roupa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
