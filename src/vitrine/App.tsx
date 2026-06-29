import { useState, useEffect } from 'react';
import { ShoppingBag, X, Plus, Minus, Send, CheckCircle, Info, Heart, ArrowRight } from 'lucide-react';
import type { Product, Order, OrderItem } from '../shared/types';
import { getStoredProducts, saveStoredProducts, getStoredOrders, saveStoredOrders } from '../shared/mockData';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState('Ver Tudo');
  
  // Detalhes de tamanho e cor selecionados no modal
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  
  // Informações do cliente no checkout
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  // Carregar produtos e carrinho ao iniciar
  useEffect(() => {
    setProducts(getStoredProducts());
    
    // Atualizar produtos toda vez que a janela focar para manter sincronizado com o Admin
    const handleFocus = () => {
      setProducts(getStoredProducts());
    };
    window.addEventListener('focus', handleFocus);
    
    const savedCart = localStorage.getItem('mf_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Salvar carrinho localmente quando alterado
  const saveCart = (newCart: OrderItem[]) => {
    setCart(newCart);
    localStorage.setItem('mf_cart', JSON.stringify(newCart));
  };

  // Filtragem por categoria
  const categories = ['Ver Tudo', 'Vestidos', 'Conjuntos', 'Blusas', 'Calças'];
  const filteredProducts = activeCategory === 'Ver Tudo' 
    ? products 
    : products.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());

  // Adicionar ao carrinho
  const addToCart = (product: Product, size: string, color: string, quantity = 1) => {
    if (!size || !color) {
      alert('Por favor, selecione o tamanho e a cor antes de adicionar ao carrinho.');
      return;
    }

    // Verificar se tem estoque
    if (product.stock < quantity) {
      alert('Desculpe, não há estoque suficiente para esta quantidade.');
      return;
    }

    const existingIndex = cart.findIndex(
      item => item.productId === product.id && item.size === size && item.color === color
    );

    let newCart = [...cart];
    if (existingIndex > -1) {
      const newQty = newCart[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        alert(`Estoque máximo atingido. Apenas ${product.stock} unidades disponíveis.`);
        return;
      }
      newCart[existingIndex].quantity = newQty;
    } else {
      newCart.push({
        productId: product.id,
        name: product.name,
        size,
        color,
        quantity,
        price: product.price,
        image: product.images[0]
      });
    }

    saveCart(newCart);
    setIsCartOpen(true);
    setSelectedProduct(null); // Fecha o modal se estiver aberto
  };

  // Alterar quantidade no carrinho
  const updateQuantity = (index: number, delta: number) => {
    let newCart = [...cart];
    const item = newCart[index];
    const product = products.find(p => p.id === item.productId);
    
    if (!product) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      newCart.splice(index, 1);
    } else {
      if (newQty > product.stock) {
        alert(`Estoque máximo atingido. Apenas ${product.stock} unidades disponíveis.`);
        return;
      }
      item.quantity = newQty;
    }
    saveCart(newCart);
  };

  // Calcular total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Finalizar compra no WhatsApp
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName || !customerPhone || !customerAddress) {
      alert('Por favor, preencha todos os campos para a entrega.');
      return;
    }

    // Criar ID do Pedido
    const orderId = `ped-${Date.now().toString().slice(-4)}`;
    
    // Gerar objeto de pedido
    const newOrder: Order = {
      id: orderId,
      customerName,
      customerPhone,
      customerAddress,
      items: cart,
      total: cartTotal,
      status: 'pending',
      source: 'vitrine',
      nfeStatus: 'draft',
      createdAt: new Date().toISOString()
    };

    // 1. Atualizar estoque dos produtos
    const updatedProducts = products.map(prod => {
      const cartItemsForProd = cart.filter(item => item.productId === prod.id);
      if (cartItemsForProd.length > 0) {
        const totalPurchased = cartItemsForProd.reduce((sum, item) => sum + item.quantity, 0);
        return {
          ...prod,
          stock: Math.max(0, prod.stock - totalPurchased)
        };
      }
      return prod;
    });

    // Salvar novos produtos
    saveStoredProducts(updatedProducts);
    setProducts(updatedProducts);

    // 2. Salvar pedido no histórico do "banco"
    const currentOrders = getStoredOrders();
    saveStoredOrders([newOrder, ...currentOrders]);

    // 3. Montar mensagem para o WhatsApp
    const phoneStore = '5511999999999'; // Número fictício da loja
    let messageText = `*Novo Pedido - MissFashion (${orderId})*\n\n`;
    messageText += `*Cliente:* ${customerName}\n`;
    messageText += `*Telefone:* ${customerPhone}\n`;
    messageText += `*Endereço de Entrega:* ${customerAddress}\n\n`;
    messageText += `*Itens do Pedido:*\n`;

    cart.forEach(item => {
      messageText += `- ${item.name} (${item.size} / ${item.color}) x${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });

    messageText += `\n*Total do Pedido:* R$ ${cartTotal.toFixed(2)}\n\n`;
    messageText += `Aguardando confirmação de pagamento via PIX.`;

    const encodedText = encodeURIComponent(messageText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneStore}&text=${encodedText}`;

    // 4. Limpar carrinho e registrar sucesso
    saveCart([]);
    setCreatedOrderId(orderId);
    setCheckoutSuccess(true);
    setIsCartOpen(false);

    // Abrir o WhatsApp em uma nova aba
    window.open(whatsappUrl, '_blank');
  };

  // Abrir modal de detalhes e setar padrões
  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] || '');
    setSelectedColor(product.colors[0] || '');
  };

  return (
    <div className="vitrine-container">
      {/* HEADER DE VIDRO */}
      <header className="navbar">
        <div className="navbar-content">
          <a href="#" className="logo">
            MISS<span>FASHION</span>
          </a>
          
          <nav className="nav-links">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`nav-item ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </nav>

          <div className="nav-actions">
            <button 
              className="cart-trigger" 
              onClick={() => setIsCartOpen(true)}
              aria-label="Ver Carrinho"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
            <a href="/admin.html" className="admin-link-btn" title="Painel Administrativo">
              Painel Admin
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION EDITORIAL */}
      {activeCategory === 'Ver Tudo' && (
        <section className="hero">
          <div className="hero-content animate-fade-in">
            <span className="hero-subtitle">Coleção Premium 2026</span>
            <h1 className="hero-title">Sua essência retratada em cada detalhe</h1>
            <p className="hero-description">
              Descubra peças exclusivas desenhadas para mulheres que valorizam a elegância atemporal, o conforto e cortes de alfaiataria impecáveis.
            </p>
            <a href="#catalogo" className="hero-btn">
              Explorar Coleção <ArrowRight size={18} />
            </a>
          </div>
          <div className="hero-overlay"></div>
        </section>
      )}

      {/* GRADE DE PRODUTOS */}
      <main id="catalogo" className="main-content">
        <div className="section-header">
          <h2 className="section-title">
            {activeCategory === 'Ver Tudo' ? 'Nossos Favoritos' : activeCategory}
          </h2>
          <p className="section-subtitle">Peças selecionadas à mão e com entrega imediata</p>
        </div>

        <div className="products-grid">
          {filteredProducts.map(product => {
            const hasDiscount = !!product.originalPrice;
            const discountPct = hasDiscount 
              ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
              : 0;

            return (
              <div key={product.id} className="product-card">
                <div className="product-image-wrapper" onClick={() => openProductDetails(product)}>
                  <img src={product.images[0]} alt={product.name} loading="lazy" />
                  {hasDiscount && (
                    <span className="discount-badge">-{discountPct}%</span>
                  )}
                  {product.stock === 0 && (
                    <div className="out-of-stock-overlay">Esgotado</div>
                  )}
                  <button className="wishlist-btn" onClick={(e) => { e.stopPropagation(); alert('Adicionado aos favoritos!'); }}>
                    <Heart size={18} />
                  </button>
                </div>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name" onClick={() => openProductDetails(product)}>
                    {product.name}
                  </h3>
                  <div className="product-price-row">
                    <div className="prices">
                      {hasDiscount && (
                        <span className="price-original">R$ {product.originalPrice?.toFixed(2)}</span>
                      )}
                      <span className="price-current">R$ {product.price.toFixed(2)}</span>
                    </div>
                    <button 
                      className={`buy-btn-quick ${product.stock === 0 ? 'disabled' : ''}`}
                      disabled={product.stock === 0}
                      onClick={() => openProductDetails(product)}
                    >
                      Ver Opções
                    </button>
                  </div>
                  <div className="product-card-footer">
                    <span className={`stock-indicator ${product.stock < 5 ? 'low' : ''}`}>
                      {product.stock === 0 ? 'Indisponível' : product.stock < 5 ? `Apenas ${product.stock} un!` : 'Estoque disponível'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL DETALHES DO PRODUTO */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>
              <X size={20} />
            </button>
            <div className="modal-body-grid">
              <div className="modal-image-col">
                <img src={selectedProduct.images[0]} alt={selectedProduct.name} />
              </div>
              <div className="modal-info-col">
                <span className="product-category">{selectedProduct.category}</span>
                <h2 className="modal-product-title">{selectedProduct.name}</h2>
                
                <div className="modal-price-row">
                  {selectedProduct.originalPrice && (
                    <span className="price-original">R$ {selectedProduct.originalPrice.toFixed(2)}</span>
                  )}
                  <span className="price-current">R$ {selectedProduct.price.toFixed(2)}</span>
                </div>
                
                <p className="modal-description">{selectedProduct.description}</p>
                
                {/* GRADE DE SELEÇÃO DE TAMANHO */}
                <div className="selector-group">
                  <span className="selector-label">Selecione o Tamanho:</span>
                  <div className="selector-options">
                    {selectedProduct.sizes.map(size => (
                      <button
                        key={size}
                        className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SELEÇÃO DE COR */}
                <div className="selector-group">
                  <span className="selector-label">Selecione a Cor:</span>
                  <div className="selector-options">
                    {selectedProduct.colors.map(color => (
                      <button
                        key={color}
                        className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                        onClick={() => setSelectedColor(color)}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-action-row">
                  {selectedProduct.stock > 0 ? (
                    <button 
                      className="add-to-cart-big-btn"
                      onClick={() => addToCart(selectedProduct, selectedSize, selectedColor)}
                    >
                      <ShoppingBag size={20} /> Adicionar ao Carrinho
                    </button>
                  ) : (
                    <button className="add-to-cart-big-btn disabled" disabled>
                      Indisponível em Estoque
                    </button>
                  )}
                </div>

                <div className="modal-shipping-info">
                  <Info size={16} />
                  <span>Enviamos para todo o Brasil. Finalize seu pedido e combine o frete e pagamento diretamente via WhatsApp.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAVETA DO CARRINHO (CART DRAWER) */}
      <div className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="cart-drawer" onClick={e => e.stopPropagation()}>
          <div className="drawer-header">
            <h3>Seu Carrinho ({cartCount})</h3>
            <button className="drawer-close" onClick={() => setIsCartOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="drawer-body">
            {cart.length === 0 ? (
              <div className="empty-cart-view">
                <ShoppingBag size={48} className="empty-icon" />
                <p>Seu carrinho está vazio.</p>
                <button className="explore-btn-empty" onClick={() => setIsCartOpen(false)}>
                  Voltar às Compras
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cart.map((item, idx) => (
                    <div key={`${item.productId}-${item.size}-${item.color}`} className="cart-item">
                      <img src={item.image} alt={item.name} className="cart-item-img" />
                      <div className="cart-item-details">
                        <h4 className="cart-item-name">{item.name}</h4>
                        <span className="cart-item-meta">Tam: {item.size} | Cor: {item.color}</span>
                        <div className="cart-item-price-qty">
                          <span className="cart-item-price">R$ {(item.price * item.quantity).toFixed(2)}</span>
                          <div className="qty-selectors">
                            <button onClick={() => updateQuantity(idx, -1)}>
                              <Minus size={14} />
                            </button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(idx, 1)}>
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="checkout-form-container">
                  <h4>Dados de Entrega & Contato</h4>
                  <form onSubmit={handleCheckout}>
                    <input 
                      type="text" 
                      placeholder="Nome Completo" 
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                    <input 
                      type="tel" 
                      placeholder="WhatsApp (ex: 11999998888)" 
                      required
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                    />
                    <textarea 
                      placeholder="Endereço Completo para entrega (Rua, Número, CEP, Cidade/UF)" 
                      required
                      rows={3}
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                    />
                    
                    <div className="cart-totals">
                      <div className="total-row">
                        <span>Subtotal</span>
                        <span>R$ {cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="total-row">
                        <span>Frete</span>
                        <span className="free-shipping">Grátis</span>
                      </div>
                      <hr />
                      <div className="total-row grand-total">
                        <span>Total</span>
                        <span>R$ {cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <button type="submit" className="checkout-submit-btn">
                      <Send size={16} /> Finalizar Pedido no WhatsApp
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* POPUP DE SUCESSO DE COMPRA */}
      {checkoutSuccess && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade-in success-modal">
            <CheckCircle size={56} className="success-icon" />
            <h2>Pedido {createdOrderId} Gerado!</h2>
            <p>O seu pedido foi gerado localmente e você foi redirecionado ao WhatsApp da loja para concluir o pagamento.</p>
            <p className="success-instruction">Caso a janela do WhatsApp não tenha aberto automaticamente, clique no botão abaixo para entrar em contato.</p>
            <div className="success-actions">
              <button 
                className="add-to-cart-big-btn"
                onClick={() => {
                  setCheckoutSuccess(false);
                  setProducts(getStoredProducts()); // Atualiza estoque na tela
                }}
              >
                Voltar à Vitrine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h2>MISS<span>FASHION</span></h2>
            <p>Elegância e sofisticação no vestuário feminino. A melhor curadoria de moda com envio rápido para todo o país.</p>
          </div>
          <div className="footer-links">
            <h4>Páginas</h4>
            <ul>
              <li><a href="#" onClick={() => setActiveCategory('Ver Tudo')}>Vitrine</a></li>
              <li><a href="/admin.html">Painel Administrativo</a></li>
              <li><a href="https://github.com/webfcdigital" target="_blank" rel="noreferrer">GitHub Dev</a></li>
            </ul>
          </div>
          <div className="footer-contact">
            <h4>Contato</h4>
            <p>Suporte: (11) 99999-9999</p>
            <p>Email: contato@missfashion.com.br</p>
            <p>Atendimento: Seg a Sex, 9h às 18h</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} MissFashion. Desenvolvido por webfcdigital. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
