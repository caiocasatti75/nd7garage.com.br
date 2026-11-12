/**
 * ND7 GARAGE - Lógica da Aplicação Web
 * Interatividade, Filtros de Estoque e Integração WhatsApp
 * Suporte completo ao Painel Administrativo (LocalStorage)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Carrega informações da Loja e Veículos do LocalStorage (ou padrões)
  const currentStoreInfo = typeof getStoreInfo === 'function' ? getStoreInfo() : STORE_INFO;
  let allVehicles = typeof getVehicles === 'function' ? getVehicles() : VEHICLES_DATA;
  
  // O dono da loja decide quais veículos são exibidos no catálogo público!
  let visibleVehicles = allVehicles.filter(v => v.visible !== false);

  // Estado Global dos Filtros
  const state = {
    searchQuery: '',
    selectedCategory: 'all',
    selectedBrand: 'all',
    selectedTransmission: 'all',
    selectedFuel: 'all',
    sortBy: 'default',
    currentModalVehicle: null
  };

  // Elementos do DOM
  const vehiclesGrid = document.getElementById('vehiclesGrid');
  const searchInput = document.getElementById('searchInput');
  const brandFilter = document.getElementById('brandFilter');
  const transmissionFilter = document.getElementById('transmissionFilter');
  const fuelFilter = document.getElementById('fuelFilter');
  const sortSelect = document.getElementById('sortSelect');
  const categoryPillsContainer = document.getElementById('categoryPills');
  const resultsCountEl = document.getElementById('resultsCount');
  const filterResetBtn = document.getElementById('filterResetBtn');
  const navBadgeCount = document.querySelector('.nav-badge-count');
  
  // Modal Elements
  const vehicleModal = document.getElementById('vehicleModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalContent = document.getElementById('modalContent');

  // Trade-in Form
  const tradeinForm = document.getElementById('tradeinForm');

  // Header & Mobile Nav
  const header = document.querySelector('.header');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  // Inicialização
  applyStoreInfoToDOM(currentStoreInfo);
  initHeaderScroll();
  initMobileNav();
  initBrandOptions();
  renderCategoryPills();
  initEventListeners();

  // Conexão e sincronização com banco em nuvem (Supabase), se configurado
  const storedSbUrl = localStorage.getItem('nd7_supabase_url');
  const storedSbKey = localStorage.getItem('nd7_supabase_anon_key');
  if (storedSbUrl && storedSbKey && window.nd7db) {
    window.nd7db.config.provider = 'supabase';
    window.nd7db.config.supabaseUrl = storedSbUrl;
    window.nd7db.config.supabaseAnonKey = storedSbKey;
    window.nd7db.init();

    window.nd7db.getVehicles().then(dbVehicles => {
      if (Array.isArray(dbVehicles) && dbVehicles.length > 0) {
        allVehicles = dbVehicles;
        visibleVehicles = allVehicles.filter(v => v.visible !== false);
        initBrandOptions();
        renderVehicles();
        console.log(`[ND7 DB] Catálogo sincronizado com a nuvem: ${allVehicles.length} veículos carregados.`);
      }
    }).catch(err => {
      console.warn('[ND7 DB] Usando estoque local:', err);
    });
  }

  // Aplica informações dinâmicas da loja na página
  function applyStoreInfoToDOM(info) {
    if (!info) return;

    // Atualiza contatos do Topbar
    const topbarPhone = document.querySelector('.topbar-link[href^="tel:"]');
    if (topbarPhone && info.phone1) {
      topbarPhone.textContent = info.phone1;
      topbarPhone.href = `tel:+${info.phone1Raw || '551936293909'}`;
    }

    const topbarIg = document.querySelector('.topbar-link[href*="instagram"]');
    if (topbarIg && info.instagram) {
      const igSpan = topbarIg.querySelector('span');
      if (igSpan) igSpan.textContent = info.instagram;
      topbarIg.href = info.instagramUrl || 'https://www.instagram.com/nd7garage/';
    }

    // Botão de WhatsApp no Header
    const headerWaBtn = document.querySelector('.header-cta-group .btn-whatsapp');
    if (headerWaBtn && info.whatsapp) {
      const span = headerWaBtn.querySelector('span');
      if (span) span.textContent = info.whatsapp;
      headerWaBtn.href = `https://wa.me/${info.whatsappRaw || '5519995603366'}?text=${encodeURIComponent('Olá, equipe ND7 Garage! Gostaria de atendimento.')}`;
    }

    // Botão Flutuante do WhatsApp
    const floatWa = document.querySelector('.whatsapp-btn-pulse');
    if (floatWa && info.whatsappRaw) {
      floatWa.href = `https://wa.me/${info.whatsappRaw}?text=${encodeURIComponent('Olá, equipe ND7 Garage! Vim pelo site e gostaria de atendimento.')}`;
    }

    // Textos do Hero
    const heroTag = document.querySelector('.hero-tag');
    if (heroTag && info.heroTag) {
      heroTag.innerHTML = `<span class="dot"></span> ${info.heroTag}`;
    }

    const heroDesc = document.querySelector('.hero-description');
    if (heroDesc && info.heroDescription) {
      heroDesc.textContent = info.heroDescription;
    }

    // Seção Sobre
    const aboutTitle = document.querySelector('.about-section .section-title');
    if (aboutTitle && info.aboutTitle) {
      aboutTitle.textContent = info.aboutTitle;
    }

    const aboutText = document.querySelector('.about-section p');
    if (aboutText && info.aboutText) {
      aboutText.textContent = info.aboutText;
    }

    // Horários no card de localização
    if (info.hours && Array.isArray(info.hours)) {
      const hoursTable = document.querySelector('.hours-table');
      if (hoursTable) {
        hoursTable.innerHTML = info.hours.map(h => `
          <tr>
            <td class="day">${h.days}</td>
            <td class="time" ${h.hours.includes('Fechado') ? 'style="color: var(--color-text-subtle);"' : ''}>${h.hours}</td>
          </tr>
        `).join('');
      }
    }

    // Endereço e telefones no card de contato
    const contactTexts = document.querySelectorAll('.contact-text');
    contactTexts.forEach(ct => {
      const h5 = ct.querySelector('h5');
      if (!h5) return;
      if (h5.textContent.includes('Endereço') && info.address) {
        const ps = ct.querySelectorAll('p');
        if (ps[0]) ps[0].textContent = info.address;
        if (ps[1]) ps[1].innerHTML = `${info.city || "Santa Bárbara d'Oeste"} - ${info.state || "SP"}, CEP ${info.cep || "13456-625"}<br><em style="color: var(--color-gold);">(${info.reference || "Em frente ao Tivoli Shopping"})</em>`;
      }
      if (h5.textContent.includes('Telefones') && info.phone1) {
        ct.innerHTML = `
          <h5>Telefones Oficiais</h5>
          <p><a href="tel:+${info.phone1Raw || '551936293909'}">${info.phone1}</a> (Fixo Loja)</p>
          <p><a href="https://wa.me/${info.whatsappRaw || '5519995603366'}" target="_blank" rel="noopener noreferrer">${info.whatsapp}</a> (WhatsApp Plantão)</p>
        `;
      }
      if (h5.textContent.includes('E-mail') && info.email) {
        ct.innerHTML = `
          <h5>E-mail</h5>
          <p><a href="mailto:${info.email}">${info.email}</a></p>
        `;
      }
    });

    // Atualiza contadores dinâmicos de veículos prontos para entrega
    const count = visibleVehicles.length;
    const heroVehicleCount = document.getElementById('heroVehicleCount');
    if (heroVehicleCount) {
      heroVehicleCount.innerHTML = `${count}<span class="plus">+</span>`;
    }

    if (navBadgeCount) {
      navBadgeCount.textContent = count;
    }

    const igVehicleCount = document.getElementById('igVehicleCount');
    if (igVehicleCount) {
      igVehicleCount.textContent = count;
    }
  }

  // Scroll Header Effect
  function initHeaderScroll() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    });
  }

  // Mobile Navigation
  function initMobileNav() {
    mobileToggle?.addEventListener('click', () => {
      navMenu?.classList.toggle('open');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu?.classList.remove('open');
      });
    });
  }

  // Preenche opções de Marcas dinamicamente com base nos veículos visíveis
  function initBrandOptions() {
    if (!brandFilter) return;
    brandFilter.innerHTML = '<option value="all">Todas as Marcas</option>';
    const brands = [...new Set(visibleVehicles.map(v => v.brand))].sort();
    brands.forEach(brand => {
      const opt = document.createElement('option');
      opt.value = brand;
      opt.textContent = brand;
      brandFilter.appendChild(opt);
    });
  }

  // Renderiza Pills de Categorias com contadores dos visíveis
  function renderCategoryPills() {
    if (!categoryPillsContainer) return;
    
    const categories = [
      { id: 'all', label: 'Todos' },
      { id: 'SUV', label: 'SUVs' },
      { id: 'Sedan', label: 'Sedans' },
      { id: 'Hatch', label: 'Hatches' },
      { id: 'Picape', label: 'Picapes' },
      { id: 'Moto', label: 'Motos' }
    ];

    categoryPillsContainer.innerHTML = '';

    categories.forEach(cat => {
      const count = cat.id === 'all' 
        ? visibleVehicles.length 
        : visibleVehicles.filter(v => v.category === cat.id).length;

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `category-pill ${state.selectedCategory === cat.id ? 'active' : ''}`;
      pill.dataset.category = cat.id;
      pill.innerHTML = `
        ${cat.label}
        <span class="pill-count">${count}</span>
      `;

      pill.addEventListener('click', () => {
        state.selectedCategory = cat.id;
        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderVehicles();
      });

      categoryPillsContainer.appendChild(pill);
    });
  }

  // Filtra e Ordena os Veículos Visíveis
  function getFilteredVehicles() {
    return visibleVehicles.filter(car => {
      // Busca Textual
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase().trim();
        const fullText = `${car.name} ${car.brand} ${car.model} ${car.version} ${car.color} ${car.year}`.toLowerCase();
        if (!fullText.includes(query)) return false;
      }

      // Categoria
      if (state.selectedCategory !== 'all' && car.category !== state.selectedCategory) {
        return false;
      }

      // Marca
      if (state.selectedBrand !== 'all' && car.brand !== state.selectedBrand) {
        return false;
      }

      // Câmbio
      if (state.selectedTransmission !== 'all') {
        if (!car.transmission || !car.transmission.toLowerCase().includes(state.selectedTransmission.toLowerCase())) {
          return false;
        }
      }

      // Combustível
      if (state.selectedFuel !== 'all') {
        if (!car.fuel || !car.fuel.toLowerCase().includes(state.selectedFuel.toLowerCase())) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Ordenação
      switch (state.sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'year-desc':
          return b.year - a.year;
        case 'year-asc':
          return a.year - b.year;
        case 'km-asc':
          return (a.kmNumber || 999999) - (b.kmNumber || 999999);
        default:
          // Padrão: Destaques primeiro, depois ano
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.year - a.year;
      }
    });
  }

  // Renderiza Veículos no Grid
  function renderVehicles() {
    if (!vehiclesGrid) return;

    const filtered = getFilteredVehicles();

    // Atualiza contador
    if (resultsCountEl) {
      resultsCountEl.innerHTML = `Exibindo <span>${filtered.length}</span> ${filtered.length === 1 ? 'veículo disponível' : 'veículos disponíveis'}`;
    }

    if (filtered.length === 0) {
      vehiclesGrid.innerHTML = `
        <div class="no-results-box">
          <div class="no-results-icon">🚗</div>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Nenhum veículo exibido no momento</h3>
          <p style="color: var(--color-text-muted); max-width: 520px; margin: 0 auto 1.5rem;">
            ${visibleVehicles.length === 0 
              ? 'O proprietário da loja ainda não ativou veículos para exibição pública neste momento. Você pode gerenciar os veículos pelo Painel Administrativo.' 
              : 'Não encontramos veículos correspondentes aos filtros aplicados. Tente limpar os filtros ou fale com a nossa equipe no WhatsApp!'}
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            ${visibleVehicles.length > 0 ? `
              <button type="button" class="btn btn-primary" onclick="window.resetAllFilters()">
                Limpar Todos os Filtros
              </button>
            ` : `
              <a href="admin.html" class="btn btn-gold">
                Abrir Painel Administrativo
              </a>
            `}
            <a href="https://wa.me/${currentStoreInfo.whatsappRaw || '5519995603366'}?text=${encodeURIComponent('Olá! Gostaria de encomendar um veículo com a ND7 Garage.')}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp">
              Falar no WhatsApp
            </a>
          </div>
        </div>
      `;
      return;
    }

    vehiclesGrid.innerHTML = filtered.map(car => {
      const safeName = escapeHtml(car.name);
      const safeBrand = escapeHtml(car.brand);
      const safeVersion = escapeHtml(car.version || '');
      const safeCategory = escapeHtml(car.categoryLabel || car.category || '');
      const safeYear = escapeHtml(car.year);
      const safeKm = escapeHtml(car.km || 'N/A');
      const safeTransmission = escapeHtml(car.transmission || '-');
      const safeFuel = escapeHtml(car.fuel || '-');
      const safeId = escapeHtml(car.id);
      const safeImage = sanitizeUrl(car.image || 'assets/car-placeholder.png');

      // Badges sanitizadas
      const badgesHtml = (car.badges || []).slice(0, 2).map((b, i) => {
        const cls = i === 0 ? 'tag-primary' : 'tag-gold';
        return `<span class="badge-tag ${cls}">${escapeHtml(b)}</span>`;
      }).join('');

      const whatsMessage = encodeURIComponent(
        `Olá, equipe ND7 Garage! Tenho interesse no ${car.name} (${car.year}) anunciado por ${car.priceFormatted || 'R$ ' + Number(car.price || 0).toLocaleString('pt-BR')}. Poderiam me passar mais informações?`
      );
      const whatsUrl = `https://wa.me/${encodeURIComponent(currentStoreInfo.whatsappRaw || '5519995603366')}?text=${whatsMessage}`;

      return `
        <article class="car-card" data-id="${safeId}">
          <div class="car-card-media">
            <img 
              src="${safeImage}" 
              alt="${safeName}" 
              class="car-card-img" 
              loading="lazy"
              onerror="this.onerror=null; this.src='assets/car-placeholder.png';"
            />
            ${(Array.isArray(car.images) && car.images.length > 1) ? `
              <span class="car-card-photos-badge" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.78); backdrop-filter: blur(4px); color: #ffd54f; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 12px; border: 1px solid rgba(245,184,0,0.35); display: flex; align-items: center; gap: 0.35rem; z-index: 2;">
                📷 ${car.images.length} fotos
              </span>
            ` : ''}
          </div>

          <div class="car-card-body">
            <div class="car-card-header">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem; gap: 0.5rem; flex-wrap: wrap;">
                <span class="car-brand-subtitle">${safeBrand}</span>
                <span style="font-size: 0.72rem; font-weight: 700; color: #ffffff; text-transform: uppercase; background: rgba(255, 255, 255, 0.08); padding: 0.2rem 0.6rem; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.12);">${safeCategory}</span>
              </div>
              <h3 class="car-title" title="${safeName}">${safeName}</h3>
              <p class="car-version" title="${safeVersion}">${safeVersion}</p>
            </div>

            <div class="car-specs-grid">
              <div class="spec-cell" title="Ano de Fabricação">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Ano: <strong>${safeYear}</strong></span>
              </div>

              <div class="spec-cell" title="Quilometragem">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>KM: <strong>${safeKm}</strong></span>
              </div>

              <div class="spec-cell" title="Transmissão">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="6" cy="6" r="3"></circle>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="10" r="3"></circle>
                  <line x1="6" y1="9" x2="6" y2="15"></line>
                  <line x1="8.5" y1="7.5" x2="15.5" y2="9"></line>
                </svg>
                <span>Câmbio: <strong>${safeTransmission}</strong></span>
              </div>

              <div class="spec-cell" title="Combustível">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 22h12v-8a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v8z"></path>
                  <path d="M15 10l4-4v16"></path>
                  <circle cx="9" cy="5" r="2"></circle>
                </svg>
                <span>Comb.: <strong>${safeFuel}</strong></span>
              </div>
            </div>

            <div class="car-card-footer">
              <div class="car-price-row">
                <div>
                  <span class="car-price-label">Valor Especial</span>
                  <div class="car-price-val">
                    <span class="currency">R$</span>${(car.price || 0).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 700; color: #25d366; background: rgba(37, 211, 102, 0.1); border: 1px solid rgba(37, 211, 102, 0.25); padding: 0.3rem 0.65rem; border-radius: 6px;">
                    ● À Pronta Entrega
                  </span>
                </div>
              </div>

              <div class="car-card-actions">
                <button type="button" class="btn btn-outline btn-sm view-details-btn" data-id="${car.id}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Detalhes
                </button>
                <a href="${whatsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" title="Falar no WhatsApp">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.073-1.805-.412-1.343-.556-2.222-1.89-2.289-1.98-.066-.089-.548-.727-.548-1.388 0-.661.347-.986.47-.1.124-.124.271-.155.361-.155.09 0 .181.001.259.006.082.004.192-.031.3.23.111.272.38 1.008.413 1.08.033.072.055.156.007.251-.048.095-.072.155-.144.238-.072.083-.151.185-.216.249-.072.072-.147.151-.063.295.084.144.373.615.8 1.001.55.497 1.015.651 1.159.723.144.072.228.06.313-.037.085-.097.362-.421.459-.566.096-.144.193-.12.325-.072.133.048.843.397.988.469.144.072.241.108.277.168.036.06.036.348-.108.753z"/>
                  </svg>
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Adiciona listener para botões de detalhes
    document.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openVehicleModal(id);
      });
    });
  }

  // Modal de Detalhes
  function openVehicleModal(id) {
    const car = visibleVehicles.find(v => v.id === id) || allVehicles.find(v => v.id === id);
    if (!car || !modalContent) return;

    state.currentModalVehicle = car;

    updateModalHTML(car);
    vehicleModal?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function updateModalHTML(car) {
    const safeName = escapeHtml(car.name);
    const safeBrand = escapeHtml(car.brand);
    const safeModel = escapeHtml(car.model || '');
    const safeVersion = escapeHtml(car.version || '');
    const safeCategory = escapeHtml(car.categoryLabel || car.category || '');
    const safeYear = escapeHtml(car.year);
    const safeKm = escapeHtml(car.km || 'N/A');
    const safeTransmission = escapeHtml(car.transmission || '-');
    const safeFuel = escapeHtml(car.fuel || '-');
    const safeColor = escapeHtml(car.color || '-');
    const safeEngine = escapeHtml(car.engine || '-');
    const safeDescription = escapeHtml(car.description || 'Veículo em excelente estado de conservação, revisado e pronto para entrega. Laudo cautelar 100% aprovado e procedência garantida pela ND7 Garage.');
    const safePrice = Number(car.price || 0).toLocaleString('pt-BR');

    const badgesHtml = (car.badges || []).map(b => 
      `<span class="badge-tag tag-primary">${escapeHtml(b)}</span>`
    ).join('');

    const featuresHtml = (car.features || []).map(f => `
      <li class="modal-feature-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${escapeHtml(f)}</span>
      </li>
    `).join('');

    const whatsMessageCar = encodeURIComponent(
      `Olá! Estive no site da ND7 Garage e tenho interesse no veículo ${car.name} (${car.year}):\n` +
      `• Valor: ${car.priceFormatted || 'R$ ' + safePrice}\n` +
      `• Câmbio: ${car.transmission || 'Não informado'} | Km: ${car.km || 'Consulte'}\n\n` +
      `Gostaria de mais fotos e informações sobre as condições de negociação!`
    );
    const whatsCarUrl = `https://wa.me/${encodeURIComponent(currentStoreInfo.whatsappRaw || '5519995603366')}?text=${whatsMessageCar}`;

    const rawPhotos = (Array.isArray(car.images) && car.images.length > 0)
      ? car.images
      : [car.image || 'assets/car-placeholder.png'];
    const carPhotos = rawPhotos.map(p => sanitizeUrl(p));

    modalContent.innerHTML = `
      <div class="modal-grid">
        <!-- Coluna Esquerda: Galeria de Fotos e Especificações -->
        <div>
          <div class="modal-gallery-wrap">
            <div class="modal-gallery-main">
              <img 
                id="modalMainCarImg"
                src="${carPhotos[0]}" 
                alt="${safeName}" 
                onerror="this.onerror=null; this.src='assets/car-placeholder.png';"
              />
              ${carPhotos.length > 1 ? `
                <div class="modal-gallery-counter" id="modalPhotoCounter">
                  📷 1 / ${carPhotos.length}
                </div>
                <button type="button" class="modal-gallery-nav prev" id="modalPhotoPrev" aria-label="Foto anterior">‹</button>
                <button type="button" class="modal-gallery-nav next" id="modalPhotoNext" aria-label="Próxima foto">›</button>
              ` : ''}
            </div>

            ${carPhotos.length > 1 ? `
              <div class="modal-gallery-thumbs" id="modalGalleryThumbs">
                ${carPhotos.map((photo, i) => `
                  <div class="modal-gallery-thumb ${i === 0 ? 'active' : ''}" data-thumb-index="${i}" title="Foto ${i + 1}">
                    <img src="${photo}" alt="Miniatura ${i + 1}" onerror="this.src='assets/car-placeholder.png';" />
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div class="modal-specs-list">
            <div class="modal-spec-row">
              <span class="modal-spec-label">Marca</span>
              <span class="modal-spec-val">${safeBrand}</span>
            </div>
            <div class="modal-spec-row">
              <span class="modal-spec-label">Modelo</span>
              <span class="modal-spec-val">${safeModel}</span>
            </div>
            <div class="modal-spec-row">
              <span class="modal-spec-label">Ano Modelo</span>
              <span class="modal-spec-val">${safeYear}</span>
            </div>
            <div class="modal-spec-row">
              <span class="modal-spec-label">Quilometragem</span>
              <span class="modal-spec-val">${safeKm}</span>
            </div>
            <div class="modal-spec-row">
              <span class="modal-spec-label">Câmbio</span>
              <span class="modal-spec-val">${safeTransmission}</span>
            </div>
            <div class="modal-spec-row">
              <span class="modal-spec-label">Combustível</span>
              <span class="modal-spec-val">${safeFuel}</span>
            </div>
            <div class="modal-spec-row">
              <span class="modal-spec-label">Cor</span>
              <span class="modal-spec-val">${safeColor}</span>
            </div>
            <div class="modal-spec-row">
              <span class="modal-spec-label">Motorização</span>
              <span class="modal-spec-val">${safeEngine}</span>
            </div>
          </div>

          <div style="margin-top: 1.5rem;">
            <h4 style="font-size: 1.1rem; margin-bottom: 0.75rem; color: #ffffff;">Destaques & Opcionais</h4>
            <ul class="modal-features-list">
              ${featuresHtml || '<li class="modal-feature-item">Consulte os opcionais completos no WhatsApp.</li>'}
            </ul>
          </div>
        </div>

        <!-- Coluna Direita: Preço, Descrição e Contato Direto -->
        <div>
          <div style="margin-bottom: 1.25rem;">
            <span style="color: var(--color-primary); font-size: 0.85rem; font-weight: 800; text-transform: uppercase;">
              ${safeCategory}
            </span>
            <h2 style="font-size: 1.85rem; margin-top: 0.25rem;">${safeName}</h2>
            <p style="color: var(--color-text-subtle); font-size: 0.95rem;">${safeVersion}</p>
          </div>

          <div style="background: var(--color-bg-input); border-radius: var(--radius-sm); padding: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 0.8rem; color: var(--color-text-subtle); text-transform: uppercase; font-weight: 700;">Preço Especial</span>
              <div style="font-family: var(--font-heading); font-size: 2.1rem; font-weight: 800; color: #ffffff;">
                <span style="color: var(--color-primary); font-size: 1.2rem; margin-right: 0.25rem;">R$</span>${safePrice}
              </div>
            </div>
            <div style="text-align: right;">
              <span class="badge-tag tag-gold" style="font-size: 0.8rem;">100% Procedência</span>
              <p style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.25rem;">Aceita Troca na Negociação</p>
            </div>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 1.25rem;">
            ${car.featured ? '<span class="badge-tag tag-gold" style="font-size: 0.78rem;">⭐ Destaque Especial</span>' : ''}
            ${(car.badges || []).map(b => `<span class="badge-tag tag-primary" style="font-size: 0.75rem; background: rgba(229, 25, 38, 0.12); border: 1px solid rgba(229, 25, 38, 0.3); color: #ffffff;">${escapeHtml(b)}</span>`).join('')}
          </div>

          <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 1.05rem; margin-bottom: 0.5rem; color: #ffffff;">Sobre este Veículo</h4>
            <p style="color: var(--color-text-muted); font-size: 0.92rem; line-height: 1.6;">
              ${safeDescription}
            </p>
          </div>

          <div style="background: rgba(230, 57, 70, 0.08); border: 1px solid rgba(230, 57, 70, 0.25); border-radius: var(--radius-sm); padding: 1.25rem; margin-bottom: 1.5rem;">
            <h5 style="color: #ffffff; font-size: 0.95rem; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: var(--color-primary); font-size: 1.1rem;">📍</span> Atendimento Personalizado ND7 Garage
            </h5>
            <p style="color: var(--color-text-muted); font-size: 0.85rem; line-height: 1.5; margin: 0;">
              Fale direto com nossos consultores para receber vídeos detalhados do veículo, ficha técnica completa e agendar seu test drive exclusivo na loja.
            </p>
          </div>

          <!-- Ações de Contato Direto -->
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <a 
              href="${whatsCarUrl}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn btn-whatsapp" 
              style="width: 100%; justify-content: center; font-size: 1rem; padding: 0.85rem;"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.073-1.805-.412-1.343-.556-2.222-1.89-2.289-1.98-.066-.089-.548-.727-.548-1.388 0-.661.347-.986.47-.1.124-.124.271-.155.361-.155.09 0 .181.001.259.006.082.004.192-.031.3.23.111.272.38 1.008.413 1.08.033.072.055.156.007.251-.048.095-.072.155-.144.238-.072.083-.151.185-.216.249-.072.072-.147.151-.063.295.084.144.373.615.8 1.001.55.497 1.015.651 1.159.723.144.072.228.06.313-.037.085-.097.362-.421.459-.566.096-.144.193-.12.325-.072.133.048.843.397.988.469.144.072.241.108.277.168.036.06.036.348-.108.753z"/>
              </svg>
              Falar no WhatsApp
            </a>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <a 
                href="tel:+${currentStoreInfo.phone1Raw || '551936293909'}" 
                class="btn btn-outline btn-sm"
                style="font-size: 0.85rem; justify-content: center;"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Ligar na Loja
              </a>
              <a 
                href="https://wa.me/${currentStoreInfo.whatsappRaw || '5519995603366'}?text=${encodeURIComponent(`Olá! Quero agendar uma visita na ND7 Garage em Santa Bárbara d'Oeste para ver o ${car.name}. Qual o melhor horário?`)}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn btn-primary btn-sm"
                style="font-size: 0.85rem; justify-content: center;"
              >
                Agendar Visita
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Interatividade da Galeria de Fotos no Modal
    if (carPhotos.length > 1) {
      let currentIdx = 0;
      const mainImg = document.getElementById('modalMainCarImg');
      const counter = document.getElementById('modalPhotoCounter');
      const prevBtn = document.getElementById('modalPhotoPrev');
      const nextBtn = document.getElementById('modalPhotoNext');
      const thumbs = modalContent.querySelectorAll('#modalGalleryThumbs .modal-gallery-thumb');

      function goToPhoto(idx) {
        if (idx < 0) idx = carPhotos.length - 1;
        if (idx >= carPhotos.length) idx = 0;
        currentIdx = idx;
        if (mainImg) {
          mainImg.style.opacity = '0.35';
          setTimeout(() => {
            mainImg.src = carPhotos[currentIdx];
            mainImg.style.opacity = '1';
          }, 100);
        }
        if (counter) counter.textContent = `📷 ${currentIdx + 1} / ${carPhotos.length}`;
        thumbs.forEach((t, i) => {
          t.classList.toggle('active', i === currentIdx);
          if (i === currentIdx) {
            t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        });
      }

      prevBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        goToPhoto(currentIdx - 1);
      });

      nextBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        goToPhoto(currentIdx + 1);
      });

      thumbs.forEach((thumb) => {
        thumb.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(thumb.dataset.thumbIndex, 10);
          if (!isNaN(idx)) goToPhoto(idx);
        });
      });
    }
  }

  function closeModal() {
    vehicleModal?.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Event Listeners Gerais
  function initEventListeners() {
    // Busca Textual
    searchInput?.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderVehicles();
    });

    // Filtros de Select
    brandFilter?.addEventListener('change', (e) => {
      state.selectedBrand = e.target.value;
      renderVehicles();
    });

    transmissionFilter?.addEventListener('change', (e) => {
      state.selectedTransmission = e.target.value;
      renderVehicles();
    });

    fuelFilter?.addEventListener('change', (e) => {
      state.selectedFuel = e.target.value;
      renderVehicles();
    });

    sortSelect?.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderVehicles();
    });

    // Botão Limpar Filtros
    filterResetBtn?.addEventListener('click', () => {
      resetAllFilters();
    });

    // Fechar Modal
    modalCloseBtn?.addEventListener('click', closeModal);
    vehicleModal?.addEventListener('click', (e) => {
      if (e.target === vehicleModal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && vehicleModal?.classList.contains('open')) {
        closeModal();
      }
    });

    // Formulário de Avaliação (Trade-In)
    tradeinForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const marca = String(document.getElementById('tradeMarca')?.value || '').trim().slice(0, 50);
      const modelo = String(document.getElementById('tradeModelo')?.value || '').trim().slice(0, 50);
      const ano = String(document.getElementById('tradeAno')?.value || '').trim().slice(0, 20);
      const km = String(document.getElementById('tradeKm')?.value || '').trim().slice(0, 30);
      const nome = String(document.getElementById('tradeNome')?.value || '').trim().slice(0, 100);
      const fone = String(document.getElementById('tradeWhats')?.value || '').trim().slice(0, 30);
      const detalhes = String(document.getElementById('tradeDetalhes')?.value || '').trim().slice(0, 500);

      // Salva automaticamente o contato no CRM do Painel Administrativo (Nuvem e Local)
      const newLeadObj = {
        id: `lead_${Date.now()}`,
        name: nome || 'Cliente do Site',
        phone: fone,
        phoneRaw: fone.replace(/\D/g, ''),
        lookingFor: `Troca / Venda: ${marca} ${modelo} (${ano})`,
        budget: '',
        attendant: 'Aguardando',
        status: 'Novo Lead',
        source: 'Site (Avaliação de Troca)',
        notes: `KM: ${km}. ${detalhes}`,
        createdAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        updatedAt: new Date().toLocaleString('pt-BR')
      };

      if (window.nd7db && window.nd7db.config.provider === 'supabase') {
        window.nd7db.addLead(newLeadObj);
      }
      if (typeof addLead === 'function') {
        addLead(newLeadObj);
      }

      const msg = encodeURIComponent(
        `Olá, equipe ND7 Garage! Gostaria de uma avaliação para venda/troca do meu veículo:\n\n` +
        `• Modelo: ${marca} ${modelo}\n` +
        `• Ano: ${ano}\n` +
        `• KM: ${km}\n` +
        `• Meu Nome: ${nome}\n` +
        `• Contato: ${fone}\n` +
        (detalhes ? `• Detalhes/Opcionais: ${detalhes}\n\n` : `\n`) +
        `Aguardo o retorno de vocês!`
      );

      showToast('Proposta enviada! Redirecionando para o WhatsApp da ND7 Garage...');
      setTimeout(() => {
        window.open(`https://wa.me/${encodeURIComponent(currentStoreInfo.whatsappRaw || '5519995603366')}?text=${msg}`, '_blank', 'noopener,noreferrer');
      }, 700);
    });
  }

  // Reset de Filtros
  window.resetAllFilters = function() {
    state.searchQuery = '';
    state.selectedCategory = 'all';
    state.selectedBrand = 'all';
    state.selectedTransmission = 'all';
    state.selectedFuel = 'all';
    state.sortBy = 'default';

    if (searchInput) searchInput.value = '';
    if (brandFilter) brandFilter.value = 'all';
    if (transmissionFilter) transmissionFilter.value = 'all';
    if (fuelFilter) fuelFilter.value = 'all';
    if (sortSelect) sortSelect.value = 'default';

    document.querySelectorAll('.category-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.category === 'all');
    });

    renderVehicles();
    showToast('Filtros restaurados!');
  };

  // Toast Notification
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});
