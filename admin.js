/**
 * ND7 GARAGE - Painel Administrativo
 * Gerenciamento de Estoque, Seleção de Veículos Visíveis, Dados da Loja e Backup
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado Local do Painel
  let vehicles = getVehicles();
  let storeInfo = getStoreInfo();
  let leads = typeof getLeads === 'function' ? getLeads() : [];

  // Elementos do DOM
  const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
  const adminTabContents = document.querySelectorAll('.admin-tab-content');
  const tabCountBadge = document.getElementById('tabCountBadge');

  // KPIs Veículos
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiVisiveis = document.getElementById('kpiVisiveis');
  const kpiOcultos = document.getElementById('kpiOcultos');
  const kpiDestaques = document.getElementById('kpiDestaques');

  // Filtros de Tabela de Veículos
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminStatusFilter = document.getElementById('adminStatusFilter');
  const adminCategoryFilter = document.getElementById('adminCategoryFilter');
  const adminVehiclesTbody = document.getElementById('adminVehiclesTbody');

  // Botões de Ação Rápida de Veículos
  const btnToggleAllVisible = document.getElementById('btnToggleAllVisible');
  const btnToggleAllHidden = document.getElementById('btnToggleAllHidden');
  const btnSyncCarroSp = document.getElementById('btnSyncCarroSp');
  const btnAddNewCar = document.getElementById('btnAddNewCar');

  // Modal de Edição de Veículo
  const editCarModal = document.getElementById('editCarModal');
  const editModalCloseBtn = document.getElementById('editModalCloseBtn');
  const editModalCancelBtn = document.getElementById('editModalCancelBtn');
  const carEditForm = document.getElementById('carEditForm');
  const editModalTitle = document.getElementById('editModalTitle');

  // Elementos do CRM (Contatos & Leads - Caio & Eduardo)
  const leadsTabCountBadge = document.getElementById('leadsTabCountBadge');
  const kpiLeadsTotal = document.getElementById('kpiLeadsTotal');
  const kpiLeadsCaio = document.getElementById('kpiLeadsCaio');
  const kpiLeadsEduardo = document.getElementById('kpiLeadsEduardo');
  const kpiLeadsWaiting = document.getElementById('kpiLeadsWaiting');
  const leadSearchInput = document.getElementById('leadSearchInput');
  const leadAttendantFilter = document.getElementById('leadAttendantFilter');
  const leadStatusFilter = document.getElementById('leadStatusFilter');
  const btnAddNewLead = document.getElementById('btnAddNewLead');
  const adminLeadsTbody = document.getElementById('adminLeadsTbody');

  // Modal de Lead
  const leadModal = document.getElementById('leadModal');
  const leadModalCloseBtn = document.getElementById('leadModalCloseBtn');
  const leadModalCancelBtn = document.getElementById('leadModalCancelBtn');
  const leadForm = document.getElementById('leadForm');
  const leadModalTitle = document.getElementById('leadModalTitle');

  // Formulários
  const storeInfoForm = document.getElementById('storeInfoForm');
  const siteTextsForm = document.getElementById('siteTextsForm');

  // Backup
  const btnExportJson = document.getElementById('btnExportJson');
  const btnImportJson = document.getElementById('btnImportJson');
  const importFileInput = document.getElementById('importFileInput');
  const btnResetDefaults = document.getElementById('btnResetDefaults');

  // Wrapper principal protegido
  const adminAppWrapper = document.getElementById('adminAppWrapper');
  let isDashboardLoaded = false;

  function initAdminDashboardData() {
    if (isDashboardLoaded) return;
    isDashboardLoaded = true;
    vehicles = getVehicles();
    storeInfo = getStoreInfo();
    leads = getLeads();
    updateKPIs();
    renderAdminTable();
    updateLeadKPIs();
    renderAdminLeadsTable();
    populateStoreInfoForm();
    populateSiteTextsForm();
  }

  // Inicialização Segura: apenas listeners estruturais e segurança
  initTabs();
  initEventListeners();
  initLeadEventListeners();
  initSecurityAuth();

  // Troca de Abas
  function initTabs() {
    adminTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        adminTabBtns.forEach(b => b.classList.remove('active'));
        adminTabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(targetTab)?.classList.add('active');
      });
    });
  }

  // Atualiza KPIs
  function updateKPIs() {
    const total = vehicles.length;
    const visiveis = vehicles.filter(v => v.visible !== false).length;
    const ocultos = total - visiveis;
    const destaques = vehicles.filter(v => v.featured).length;

    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiVisiveis) kpiVisiveis.textContent = visiveis;
    if (kpiOcultos) kpiOcultos.textContent = ocultos;
    if (kpiDestaques) kpiDestaques.textContent = destaques;
    if (tabCountBadge) tabCountBadge.textContent = total;
  }

  // Filtra lista de veículos para a tabela do admin
  function getAdminFilteredVehicles() {
    const query = (adminSearchInput?.value || '').toLowerCase().trim();
    const status = adminStatusFilter?.value || 'all';
    const cat = adminCategoryFilter?.value || 'all';

    return vehicles.filter(v => {
      // Busca
      if (query) {
        const full = `${v.name} ${v.brand} ${v.model} ${v.version} ${v.year}`.toLowerCase();
        if (!full.includes(query)) return false;
      }

      // Status
      if (status === 'visible' && v.visible === false) return false;
      if (status === 'hidden' && v.visible !== false) return false;
      if (status === 'featured' && !v.featured) return false;

      // Categoria
      if (cat !== 'all' && v.category !== cat) return false;

      return true;
    });
  }

  // Renderiza Tabela de Veículos
  function renderAdminTable() {
    if (!adminVehiclesTbody) return;

    const filtered = getAdminFilteredVehicles();

    if (filtered.length === 0) {
      adminVehiclesTbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem 1rem; color: var(--color-text-subtle);">
            Nenhum veículo encontrado com os filtros aplicados.
          </td>
        </tr>
      `;
      return;
    }

    adminVehiclesTbody.innerHTML = filtered.map(car => {
      const isVisible = car.visible !== false;
      const isFeatured = !!car.featured;

      const safeId = escapeHtml(car.id);
      const safeName = escapeHtml(car.name);
      const safeBrand = escapeHtml(car.brand);
      const safeSub = escapeHtml(car.version || car.model || '');
      const safeCategory = escapeHtml(car.categoryLabel || car.category || '');
      const safeYear = escapeHtml(car.year);
      const safeKm = escapeHtml(car.km || 'N/A');
      const safeImage = sanitizeUrl(car.image || (Array.isArray(car.images) && car.images[0]) || 'assets/car-placeholder.png');
      const safePrice = Number(car.price || 0).toLocaleString('pt-BR');

      return `
        <tr data-id="${safeId}">
          <td>
            <div style="position: relative; width: 62px; height: 42px; border-radius: 6px; overflow: hidden; background: #0b0b12; display: inline-block;">
              <img 
                src="${safeImage}" 
                alt="${safeName}" 
                style="width: 100%; height: 100%; object-fit: cover;"
                onerror="this.onerror=null; this.src='assets/car-placeholder.png';"
              />
              ${(Array.isArray(car.images) && car.images.length > 1) ? `
                <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.85); color: #ffd54f; font-size: 0.58rem; font-weight: 800; padding: 0.1rem 0.25rem; border-radius: 3px; border: 1px solid rgba(245,184,0,0.4); line-height: 1;">
                  📷${car.images.length}
                </span>
              ` : ''}
            </div>
          </td>
          <td>
            <div class="car-title-cell">
              <div>
                <span class="car-name-bold">${safeName}</span>
                <span class="car-sub-text">${safeBrand} • ${safeSub}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="badge-tag tag-dark" style="font-size: 0.72rem;">${safeCategory}</span>
          </td>
          <td>
            <strong style="color: #ffffff;">${safeYear}</strong>
            <div style="font-size: 0.75rem; color: var(--color-text-subtle);">${safeKm}</div>
          </td>
          <td>
            <strong style="color: var(--color-gold); font-size: 1rem;">
              R$ ${safePrice}
            </strong>
          </td>
          <!-- Switch Toggle: Exibir no Site -->
          <td style="text-align: center;">
            <label class="switch" title="Clique para exibir ou ocultar no site público">
              <input 
                type="checkbox" 
                class="toggle-visibility" 
                data-id="${safeId}" 
                ${isVisible ? 'checked' : ''} 
              />
              <span class="slider-toggle"></span>
            </label>
            <div style="margin-top: 0.25rem;">
              <span class="status-badge ${isVisible ? 'active' : 'inactive'}">
                ${isVisible ? '● Visível' : '○ Oculto'}
              </span>
            </div>
          </td>
          <!-- Switch Toggle: Destaque -->
          <td style="text-align: center;">
            <label class="switch" title="Destacar no topo da lista">
              <input 
                type="checkbox" 
                class="star-toggle toggle-featured" 
                data-id="${safeId}" 
                ${isFeatured ? 'checked' : ''} 
              />
              <span class="slider-toggle"></span>
            </label>
          </td>
          <!-- Ações -->
          <td style="text-align: right;">
            <div class="action-btn-group" style="justify-content: flex-end;">
              <button 
                type="button" 
                class="icon-btn edit-car-btn" 
                data-id="${safeId}" 
                title="Editar Informações do Veículo"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button 
                type="button" 
                class="icon-btn danger delete-car-btn" 
                data-id="${safeId}" 
                title="Excluir este Veículo"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Listener para o Interruptor de Visibilidade (Exibir no Site)
    document.querySelectorAll('.toggle-visibility').forEach(sw => {
      sw.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const car = vehicles.find(v => v.id === id);
        if (car) {
          car.visible = e.target.checked;
          saveVehicles(vehicles);
          updateKPIs();
          renderAdminTable();
          showToast(`Veículo "${car.name}" agora está ${car.visible ? 'VISÍVEL' : 'OCULTO'} no site!`);
        }
      });
    });

    // Listener para o Interruptor de Destaque
    document.querySelectorAll('.toggle-featured').forEach(sw => {
      sw.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const car = vehicles.find(v => v.id === id);
        if (car) {
          car.featured = e.target.checked;
          saveVehicles(vehicles);
          updateKPIs();
          renderAdminTable();
          showToast(`Veículo "${car.name}" ${car.featured ? 'marcado como DESTAQUE ⭐' : 'removido dos destaques'}.`);
        }
      });
    });

    // Listener para Editar Veículo
    document.querySelectorAll('.edit-car-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openEditModal(id);
      });
    });

    // Listener para Excluir Veículo
    document.querySelectorAll('.delete-car-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const car = vehicles.find(v => v.id === id);
        if (car && confirm(`Deseja realmente excluir o veículo "${car.name}" da base de dados?`)) {
          vehicles = vehicles.filter(v => v.id !== id);
          saveVehicles(vehicles);
          updateKPIs();
          renderAdminTable();
          showToast(`Veículo "${car.name}" excluído.`);
        }
      });
    });
  }

  // Preenche Formulário da Loja
  function populateStoreInfoForm() {
    if (!storeInfoForm) return;
    document.getElementById('storeName').value = storeInfo.name || '';
    document.getElementById('storeSlogan').value = storeInfo.slogan || '';
    document.getElementById('storePhone1').value = storeInfo.phone1 || '';
    document.getElementById('storeWhatsapp').value = storeInfo.whatsapp || '';
    document.getElementById('storeEmail').value = storeInfo.email || '';
    document.getElementById('storeInstagram').value = storeInfo.instagram || '';
    document.getElementById('storeInstagramUrl').value = storeInfo.instagramUrl || '';
    document.getElementById('storeAddress').value = storeInfo.address || '';
    document.getElementById('storeReference').value = storeInfo.reference || '';
    document.getElementById('storeCity').value = storeInfo.city || '';
    document.getElementById('storeState').value = storeInfo.state || '';
    document.getElementById('storeCep').value = storeInfo.cep || '';

    // Horários
    if (storeInfo.hours && Array.isArray(storeInfo.hours)) {
      const h1 = storeInfo.hours.find(h => h.days.includes('Segunda'));
      const h2 = storeInfo.hours.find(h => h.days.includes('Sábado'));
      const h3 = storeInfo.hours.find(h => h.days.includes('Domingo'));
      if (h1) document.getElementById('hoursWeekdays').value = h1.hours;
      if (h2) document.getElementById('hoursSaturday').value = h2.hours;
      if (h3) document.getElementById('hoursSunday').value = h3.hours;
    }
  }

  // Preenche Formulário de Textos
  function populateSiteTextsForm() {
    if (!siteTextsForm) return;
    document.getElementById('heroTagInput').value = storeInfo.heroTag || '';
    document.getElementById('heroDescInput').value = storeInfo.heroDescription || '';
    document.getElementById('aboutTitleInput').value = storeInfo.aboutTitle || '';
    document.getElementById('aboutTextInput').value = storeInfo.aboutText || '';
  }

  // ==========================================================================
  // GERENCIAMENTO DE MÚLTIPLAS FOTOS DO VEÍCULO (UPLOAD DIRETO SEM LINK)
  // ==========================================================================
  let currentEditPhotos = [];

  function compressAndReadImage(file, maxDimension = 1280, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Gera dataURL comprimido JPEG para economizar espaço
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderPhotosPreviewGrid() {
    const container = document.getElementById('photosPreviewGrid');
    const countBadge = document.getElementById('photosCountBadge');
    if (!container) return;

    if (countBadge) {
      const total = currentEditPhotos.length;
      countBadge.textContent = total === 1 ? '1 foto' : `${total} fotos`;
    }

    if (currentEditPhotos.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 1.25rem 1rem; color: var(--color-text-subtle); font-size: 0.85rem; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.12);">
          Nenhuma foto selecionada ainda. Clique no quadro acima para escolher as fotos do veículo no seu computador ou celular.
        </div>
      `;
      return;
    }

    container.innerHTML = currentEditPhotos.map((photo, idx) => {
      const isCover = idx === 0;
      return `
        <div class="photo-preview-card ${isCover ? 'is-cover' : ''}" data-index="${idx}">
          <img src="${photo}" alt="Foto ${idx + 1}" onerror="this.src='assets/car-placeholder.png';" />
          ${isCover ? '<span class="photo-badge-cover">★ Capa</span>' : ''}
          
          <div class="photo-actions-overlay">
            <button type="button" class="photo-action-btn-del" data-action="delete-photo" data-index="${idx}" title="Excluir esta foto">
              ✕
            </button>
            
            <div class="photo-bottom-actions">
              <button type="button" class="photo-nav-btn" data-action="move-photo-left" data-index="${idx}" ${idx === 0 ? 'disabled' : ''} title="Mover para a esquerda">
                ◀
              </button>
              ${!isCover ? `
                <button type="button" class="photo-btn-make-cover" data-action="make-cover" data-index="${idx}" title="Definir como foto principal">
                  Tornar Capa
                </button>
              ` : '<span style="font-size: 0.65rem; color: var(--color-gold); font-weight: 700; padding: 0.2rem;">Principal</span>'}
              <button type="button" class="photo-nav-btn" data-action="move-photo-right" data-index="${idx}" ${idx === currentEditPhotos.length - 1 ? 'disabled' : ''} title="Mover para a direita">
                ▶
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async function handlePhotoFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    showToast(`Otimizando e carregando ${files.length} foto(s)...`);

    for (const file of files) {
      try {
        const dataUrl = await compressAndReadImage(file, 1280, 0.82);
        currentEditPhotos.push(dataUrl);
      } catch (err) {
        console.error('Erro ao processar imagem:', err);
      }
    }

    renderPhotosPreviewGrid();
    showToast(`✓ ${files.length} foto(s) adicionada(s) ao anúncio!`);
  }

  // Abre Modal de Edição ou Criação
  function openEditModal(carId = null) {
    if (!editCarModal) return;

    if (carId) {
      // Modo Edição
      const car = vehicles.find(v => v.id === carId);
      if (!car) return;

      editModalTitle.textContent = 'Editar Veículo';
      document.getElementById('editCarId').value = car.id;
      document.getElementById('editCarName').value = car.name || '';
      document.getElementById('editCarBrand').value = car.brand || '';
      document.getElementById('editCarModel').value = car.model || '';
      document.getElementById('editCarVersion').value = car.version || '';
      document.getElementById('editCarCategory').value = car.category || 'SUV';
      document.getElementById('editCarYear').value = car.year || 2020;
      document.getElementById('editCarPrice').value = car.price || 0;
      document.getElementById('editCarKm').value = car.km || '';
      document.getElementById('editCarTransmission').value = car.transmission || 'Automático';
      document.getElementById('editCarFuel').value = car.fuel || 'Flex';
      document.getElementById('editCarColor').value = car.color || '';
      
      // Carrega fotos existentes do veículo (múltiplas fotos)
      if (Array.isArray(car.images) && car.images.length > 0) {
        currentEditPhotos = [...car.images];
      } else if (car.image) {
        currentEditPhotos = [car.image];
      } else {
        currentEditPhotos = [];
      }
      document.getElementById('editCarImage').value = currentEditPhotos[0] || '';
      renderPhotosPreviewGrid();

      document.getElementById('editCarBadges').value = (car.badges || []).join(', ');
      document.getElementById('editCarDesc').value = car.description || '';
      document.getElementById('editCarFeatures').value = (car.features || []).join('\n');
      document.getElementById('editCarVisible').checked = car.visible !== false;
      document.getElementById('editCarFeatured').checked = !!car.featured;
    } else {
      // Modo Novo
      editModalTitle.textContent = 'Cadastrar Novo Veículo';
      carEditForm.reset();
      document.getElementById('editCarId').value = '';
      currentEditPhotos = [];
      document.getElementById('editCarImage').value = '';
      renderPhotosPreviewGrid();
      document.getElementById('editCarVisible').checked = true;
      document.getElementById('editCarFeatured').checked = false;
    }

    editCarModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeEditModal() {
    editCarModal?.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ==========================================================================
  // SINCRONIZAÇÃO INTELIGENTE COM O CARROSP (ESTOQUE E PREÇOS OFICIAIS)
  // ==========================================================================
  async function performCarroSpSync() {
    if (!btnSyncCarroSp) return;

    const originalHtml = btnSyncCarroSp.innerHTML;
    btnSyncCarroSp.disabled = true;
    btnSyncCarroSp.style.opacity = '0.85';
    btnSyncCarroSp.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
      </svg>
      <span>Sincronizando com CarroSP...</span>
    `;

    // Garante animação CSS de rotação
    if (!document.getElementById('syncSpinKeyframes')) {
      const style = document.createElement('style');
      style.id = 'syncSpinKeyframes';
      style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    try {
      // Feedback visual suave de processamento
      await new Promise(r => setTimeout(r, 650));

      let liveList = null;

      // 1. Tenta carregar dados ao vivo de vehicles_live.json se estiver rodando via servidor HTTP
      try {
        const response = await fetch('vehicles_live.json?t=' + Date.now());
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            liveList = data;
          }
        }
      } catch (err) {
        // Ignora erro de rede/CORS no protocolo file://
      }

      // 2. Se não carregou por fetch, usa os dados oficiais do CarroSP carregados por vehicles.js
      if (!liveList && typeof window !== 'undefined' && Array.isArray(window.CARROSP_OFFICIAL_STOCK) && window.CARROSP_OFFICIAL_STOCK.length > 0) {
        liveList = window.CARROSP_OFFICIAL_STOCK;
      }
      if (!liveList && typeof window !== 'undefined' && Array.isArray(window.CARROSP_LIVE_DATA) && window.CARROSP_LIVE_DATA.length > 0) {
        liveList = window.CARROSP_LIVE_DATA;
      }
      if (!liveList && typeof VEHICLES_DATA !== 'undefined' && Array.isArray(VEHICLES_DATA) && VEHICLES_DATA.length > 0) {
        liveList = VEHICLES_DATA;
      }

      if (!liveList || liveList.length === 0) {
        showToast('Nenhum dado do CarroSP disponível para sincronização no momento.');
        return;
      }

      if (!Array.isArray(vehicles) || vehicles.length === 0) {
        vehicles = getVehicles();
      }

      let updatedCount = 0;
      let priceChangesCount = 0;
      let newCount = 0;
      const priceChangesDetails = [];

      // Sincroniza cada veículo oficial do CarroSP
      liveList.forEach(carro => {
        // Encontra o veículo no banco local
        let match = vehicles.find(v => {
          if (carro.carrospId && (v.carrospId === carro.carrospId || v.id === `carrosp_${carro.carrospId}`)) {
            return true;
          }
          if (carro.id && v.id === carro.id) {
            return true;
          }
          const vBrand = (v.brand || '').trim().toLowerCase();
          const cBrand = (carro.brand || '').trim().toLowerCase();
          const vModel = (v.model || '').trim().toLowerCase();
          const cModel = (carro.model || '').trim().toLowerCase();
          const vYear = String(v.year || '').trim();
          const cYear = String(carro.year || '').trim();

          return vBrand === cBrand && vModel === cModel && vYear === cYear;
        });

        if (match) {
          // Atualiza preço se houver alteração
          if (match.price !== carro.price || match.priceFormatted !== carro.priceFormatted) {
            const oldPrice = match.priceFormatted || `R$ ${match.price}`;
            match.price = carro.price;
            match.priceFormatted = carro.priceFormatted;
            priceChangesCount++;
            priceChangesDetails.push(`${match.brand} ${match.model}: de ${oldPrice} para ${match.priceFormatted}`);
          }

          // Atualiza dados técnicos e fotos oficiais do CarroSP
          if (carro.image && (!match.image || match.image.includes('placeholder'))) {
            match.image = carro.image;
          }
          if (carro.transmission && carro.transmission !== 'Consulte' && carro.transmission !== '- -') {
            match.transmission = carro.transmission;
          }
          if (carro.fuel) match.fuel = carro.fuel;
          if (carro.km && carro.km !== 'Consulte') {
            match.km = carro.km;
            match.kmNumber = carro.kmNumber;
          }
          if (carro.url) match.url = carro.url;
          if (carro.color && (!match.color || match.color === 'Consulte')) match.color = carro.color;

          updatedCount++;
        } else {
          // Novo veículo publicado no CarroSP
          const newCar = {
            id: carro.id || `carrosp_${carro.carrospId || Date.now()}`,
            carrospId: carro.carrospId || '',
            name: carro.name || `${carro.brand} ${carro.model}`,
            brand: carro.brand || '',
            model: carro.model || '',
            version: carro.version || '',
            year: carro.year || '',
            price: carro.price || 0,
            priceFormatted: carro.priceFormatted || 'Consulte',
            km: carro.km || 'Consulte',
            kmNumber: carro.kmNumber || 0,
            transmission: carro.transmission || 'Manual',
            fuel: carro.fuel || 'Flex',
            color: carro.color || 'Prata',
            image: carro.image || 'assets/car-placeholder.png',
            images: carro.image ? [carro.image] : ['assets/car-placeholder.png'],
            category: carro.category || 'Sedan',
            categoryLabel: carro.categoryLabel || 'Sedan',
            url: carro.url || 'https://carrosp.com.br/santa-barbara-doeste-sp/nd7-garage/',
            visible: true,
            featured: carro.featured !== undefined ? carro.featured : (carro.price > 100000),
            badges: ["Laudo Cautelar Aprovado", "Garantia ND7", "Procedência"]
          };
          vehicles.unshift(newCar);
          newCount++;
          updatedCount++;
        }
      });

      // Salva no localStorage e atualiza tabela e indicadores
      saveVehicles(vehicles);
      updateKPIs();
      renderAdminTable();

      // Monta notificação amigável para o lojista
      let msg = `✓ Sincronização concluída com sucesso! ${updatedCount} veículos conferidos no CarroSP.`;
      if (priceChangesCount > 0) {
        msg += ` ${priceChangesCount} preço(s) atualizado(s) no estoque do site!`;
      }
      if (newCount > 0) {
        msg += ` ${newCount} novo(s) veículo(s) adicionado(s).`;
      }
      showToast(msg);

    } catch (err) {
      console.error('Erro na sincronização:', err);
      showToast('Erro ao sincronizar com CarroSP: ' + err.message);
    } finally {
      btnSyncCarroSp.innerHTML = originalHtml;
      btnSyncCarroSp.disabled = false;
      btnSyncCarroSp.style.opacity = '1';
    }
  }

  // Event Listeners Gerais
  function initEventListeners() {
    // Filtros da Tabela
    adminSearchInput?.addEventListener('input', renderAdminTable);
    adminStatusFilter?.addEventListener('change', renderAdminTable);
    adminCategoryFilter?.addEventListener('change', renderAdminTable);

    // Sincronizar Estoque e Preços com o CarroSP
    btnSyncCarroSp?.addEventListener('click', async () => {
      await performCarroSpSync();
    });

    // Ativar / Ocultar Todos
    btnToggleAllVisible?.addEventListener('click', () => {
      vehicles.forEach(v => v.visible = true);
      saveVehicles(vehicles);
      updateKPIs();
      renderAdminTable();
      showToast('Todos os veículos foram definidos como VISÍVEIS no site!');
    });

    btnToggleAllHidden?.addEventListener('click', () => {
      vehicles.forEach(v => v.visible = false);
      saveVehicles(vehicles);
      updateKPIs();
      renderAdminTable();
      showToast('Todos os veículos foram OCULTADOS do site!');
    });

    // Botão Novo Veículo
    btnAddNewCar?.addEventListener('click', () => {
      openEditModal(null);
    });

    // Fechar Modal
    editModalCloseBtn?.addEventListener('click', closeEditModal);
    editModalCancelBtn?.addEventListener('click', closeEditModal);
    editCarModal?.addEventListener('click', (e) => {
      if (e.target === editCarModal) closeEditModal();
    });

    // Gerenciador de Fotos Múltiplas do Veículo
    const photosDropzone = document.getElementById('photosDropzone');
    const photosInput = document.getElementById('editCarPhotosInput');
    const btnSelectPhotos = document.getElementById('btnSelectPhotos');
    const photosPreviewGrid = document.getElementById('photosPreviewGrid');

    photosDropzone?.addEventListener('click', (e) => {
      photosInput?.click();
    });

    btnSelectPhotos?.addEventListener('click', (e) => {
      e.stopPropagation();
      photosInput?.click();
    });

    photosDropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      photosDropzone.classList.add('dragover');
    });

    photosDropzone?.addEventListener('dragleave', () => {
      photosDropzone.classList.remove('dragover');
    });

    photosDropzone?.addEventListener('drop', async (e) => {
      e.preventDefault();
      photosDropzone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files) {
        await handlePhotoFiles(e.dataTransfer.files);
      }
    });

    photosInput?.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        await handlePhotoFiles(e.target.files);
        e.target.value = '';
      }
    });

    // Ações de Foto: Excluir, Tornar Capa, Mover
    photosPreviewGrid?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      e.stopPropagation();
      const action = btn.dataset.action;
      const idx = parseInt(btn.dataset.index, 10);
      if (isNaN(idx) || idx < 0 || idx >= currentEditPhotos.length) return;

      if (action === 'delete-photo') {
        currentEditPhotos.splice(idx, 1);
        renderPhotosPreviewGrid();
        showToast('Foto removida.');
      } else if (action === 'make-cover') {
        const chosen = currentEditPhotos.splice(idx, 1)[0];
        currentEditPhotos.unshift(chosen);
        renderPhotosPreviewGrid();
        showToast('Foto definida como CAPA principal do anúncio! ⭐');
      } else if (action === 'move-photo-left' && idx > 0) {
        const temp = currentEditPhotos[idx];
        currentEditPhotos[idx] = currentEditPhotos[idx - 1];
        currentEditPhotos[idx - 1] = temp;
        renderPhotosPreviewGrid();
      } else if (action === 'move-photo-right' && idx < currentEditPhotos.length - 1) {
        const temp = currentEditPhotos[idx];
        currentEditPhotos[idx] = currentEditPhotos[idx + 1];
        currentEditPhotos[idx + 1] = temp;
        renderPhotosPreviewGrid();
      }
    });

    // Submit Formulário de Veículo (Criar ou Atualizar)
    carEditForm?.addEventListener('submit', (e) => {
      e.preventDefault();

      const carId = document.getElementById('editCarId').value;
      const isNew = !carId;

      // Validação das fotos do anúncio
      if (!currentEditPhotos || currentEditPhotos.length === 0) {
        showToast('⚠️ Por favor, adicione pelo menos uma foto para o anúncio do veículo.');
        return;
      }

      const mainImage = currentEditPhotos[0] || 'assets/car-placeholder.png';
      const allImages = [...currentEditPhotos];

      const name = document.getElementById('editCarName').value.trim();
      const brand = document.getElementById('editCarBrand').value.trim().toUpperCase();
      const model = document.getElementById('editCarModel').value.trim();
      const version = document.getElementById('editCarVersion').value.trim();
      const category = document.getElementById('editCarCategory').value;
      const year = parseInt(document.getElementById('editCarYear').value, 10);
      const price = parseFloat(document.getElementById('editCarPrice').value);
      const km = document.getElementById('editCarKm').value.trim();
      const transmission = document.getElementById('editCarTransmission').value;
      const fuel = document.getElementById('editCarFuel').value;
      const color = document.getElementById('editCarColor').value.trim();
      
      const badges = document.getElementById('editCarBadges').value
        .split(',')
        .map(b => b.trim())
        .filter(Boolean);

      const description = document.getElementById('editCarDesc').value.trim();
      const features = document.getElementById('editCarFeatures').value
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      const visible = document.getElementById('editCarVisible').checked;
      const featured = document.getElementById('editCarFeatured').checked;

      // Extrai número do KM para ordenação
      const kmClean = km.replace(/\D/g, '');
      const kmNumber = kmClean ? parseInt(kmClean, 10) : 0;

      if (isNew) {
        // Gera ID novo
        const newId = 'nd7_' + Date.now();
        const newVehicle = {
          id: newId,
          name,
          brand,
          model,
          version,
          category,
          categoryLabel: category === 'Moto' ? 'Moto' : category,
          year,
          price,
          priceFormatted: 'R$ ' + price.toLocaleString('pt-BR'),
          transmission,
          fuel,
          color,
          km,
          kmNumber,
          image: mainImage,
          images: allImages,
          badges,
          description,
          features,
          visible,
          featured
        };
        vehicles.unshift(newVehicle);
        showToast(`Veículo "${name}" adicionado com sucesso com ${allImages.length} foto(s)!`);
      } else {
        // Atualiza existente
        const car = vehicles.find(v => v.id === carId);
        if (car) {
          car.name = name;
          car.brand = brand;
          car.model = model;
          car.version = version;
          car.category = category;
          car.year = year;
          car.price = price;
          car.priceFormatted = 'R$ ' + price.toLocaleString('pt-BR');
          car.km = km;
          car.kmNumber = kmNumber;
          car.transmission = transmission;
          car.fuel = fuel;
          car.color = color;
          car.image = mainImage;
          car.images = allImages;
          car.badges = badges;
          car.description = description;
          car.features = features;
          car.visible = visible;
          car.featured = featured;
          showToast(`Veículo "${name}" atualizado com sucesso com ${allImages.length} foto(s)!`);
        }
      }

      saveVehicles(vehicles);
      if (window.nd7db && window.nd7db.config.provider === 'supabase') {
        const savedCar = isNew ? vehicles[0] : vehicles.find(v => v.id === carId);
        if (savedCar) window.nd7db.saveVehicle(savedCar);
      }
      updateKPIs();
      renderAdminTable();
      closeEditModal();
    });

    // Submit Formulário da Loja
    storeInfoForm?.addEventListener('submit', (e) => {
      e.preventDefault();

      const phone1 = document.getElementById('storePhone1').value.trim();
      const whatsapp = document.getElementById('storeWhatsapp').value.trim();

      storeInfo.name = document.getElementById('storeName').value.trim();
      storeInfo.slogan = document.getElementById('storeSlogan').value.trim();
      storeInfo.phone1 = phone1;
      storeInfo.phone1Raw = phone1.replace(/\D/g, '');
      storeInfo.whatsapp = whatsapp;
      storeInfo.whatsappRaw = whatsapp.replace(/\D/g, '');
      storeInfo.email = document.getElementById('storeEmail').value.trim();
      storeInfo.instagram = document.getElementById('storeInstagram').value.trim();
      storeInfo.instagramUrl = document.getElementById('storeInstagramUrl').value.trim();
      storeInfo.address = document.getElementById('storeAddress').value.trim();
      storeInfo.reference = document.getElementById('storeReference').value.trim();
      storeInfo.city = document.getElementById('storeCity').value.trim();
      storeInfo.state = document.getElementById('storeState').value.trim();
      storeInfo.cep = document.getElementById('storeCep').value.trim();

      storeInfo.hours = [
        { days: "Segunda a Sexta", hours: document.getElementById('hoursWeekdays').value.trim() || "08:30 às 18:00" },
        { days: "Sábado", hours: document.getElementById('hoursSaturday').value.trim() || "08:30 às 13:00" },
        { days: "Domingo e Feriados", hours: document.getElementById('hoursSunday').value.trim() || "Fechado (Atendimento WhatsApp)" }
      ];

      saveStoreInfo(storeInfo);
      showToast('Dados da loja salvos e atualizados no site com sucesso!');
    });

    // Submit Formulário de Textos
    siteTextsForm?.addEventListener('submit', (e) => {
      e.preventDefault();

      storeInfo.heroTag = document.getElementById('heroTagInput').value.trim();
      storeInfo.heroDescription = document.getElementById('heroDescInput').value.trim();
      storeInfo.aboutTitle = document.getElementById('aboutTitleInput').value.trim();
      storeInfo.aboutText = document.getElementById('aboutTextInput').value.trim();

      saveStoreInfo(storeInfo);
      showToast('Textos do site salvos com sucesso!');
    });

    // Exportar Backup JSON
    btnExportJson?.addEventListener('click', () => {
      const backupData = {
        vehicles,
        storeInfo,
        leads,
        exportDate: new Date().toISOString()
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `nd7-garage-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Backup JSON exportado com sucesso!');
    });

    // Exportar Banco de Dados SQL (.sql)
    const btnExportSql = document.getElementById('btnExportSql');
    btnExportSql?.addEventListener('click', () => {
      let sql = `-- ============================================================================\n`;
      sql += `-- ND7 GARAGE - EXPORTAÇÃO COMPLETA DO BANCO DE DADOS (${new Date().toLocaleString('pt-BR')})\n`;
      sql += `-- ============================================================================\n\n`;

      // 1. DADOS DA LOJA
      sql += `-- 1. DADOS DA LOJA\n`;
      sql += `INSERT INTO store_info (setting_key, setting_value) VALUES\n`;
      const storeEntries = Object.entries(storeInfo).map(([k, v]) => {
        const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return `('${k.replace(/'/g, "''")}', '${valStr.replace(/'/g, "''")}')`;
      });
      sql += storeEntries.join(',\n') + `\nON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;\n\n`;

      // 2. ESTOQUE
      sql += `-- 2. ESTOQUE DE VEÍCULOS (${vehicles.length} modelos)\n`;
      if (vehicles.length > 0) {
        sql += `INSERT INTO vehicles (id, carrosp_id, name, brand, model, version, year_display, price, price_formatted, km, km_number, transmission, fuel, color, image_main, category, category_label, is_visible, is_featured) VALUES\n`;
        const vEntries = vehicles.map(v => {
          const id = (v.id || '').replace(/'/g, "''");
          const cid = (v.carrospId || '').replace(/'/g, "''");
          const name = (v.name || '').replace(/'/g, "''");
          const brand = (v.brand || '').replace(/'/g, "''");
          const model = (v.model || '').replace(/'/g, "''");
          const version = (v.version || '').replace(/'/g, "''");
          const year = String(v.year || '').replace(/'/g, "''");
          const price = Number(v.price) || 0;
          const priceFmt = (v.priceFormatted || '').replace(/'/g, "''");
          const km = (v.km || 'Consulte').replace(/'/g, "''");
          const kmNum = Number(v.kmNumber) || 0;
          const trans = (v.transmission || 'Manual').replace(/'/g, "''");
          const fuel = (v.fuel || 'Flex').replace(/'/g, "''");
          const color = (v.color || 'Não informado').replace(/'/g, "''");
          const img = (v.image || '').replace(/'/g, "''");
          const cat = (v.category || 'Carro').replace(/'/g, "''");
          const catLbl = (v.categoryLabel || cat).replace(/'/g, "''");
          const vis = v.visible !== false ? 'TRUE' : 'FALSE';
          const feat = Boolean(v.featured) ? 'TRUE' : 'FALSE';
          return `('${id}', '${cid}', '${name}', '${brand}', '${model}', '${version}', '${year}', ${price}, '${priceFmt}', '${km}', ${kmNum}, '${trans}', '${fuel}', '${color}', '${img}', '${cat}', '${catLbl}', ${vis}, ${feat})`;
        });
        sql += vEntries.join(',\n') + `\nON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_visible = EXCLUDED.is_visible;\n\n`;
      }

      // 3. LEADS DO CRM
      sql += `-- 3. CRM DE LEADS (${leads.length} contatos)\n`;
      if (leads.length > 0) {
        sql += `INSERT INTO leads (id, name, phone, phone_raw, email, looking_for, budget, attendant, status, notes, source) VALUES\n`;
        const leadEntries = leads.map(l => {
          const id = (l.id || '').replace(/'/g, "''");
          const name = (l.name || '').replace(/'/g, "''");
          const phone = (l.phone || '').replace(/'/g, "''");
          const phoneRaw = (l.phoneRaw || phone.replace(/\D/g, '')).replace(/'/g, "''");
          const email = (l.email || '').replace(/'/g, "''");
          const lookingFor = (l.lookingFor || '').replace(/'/g, "''");
          const budget = (l.budget || '').replace(/'/g, "''");
          const attendant = (l.attendant || 'Aguardando').replace(/'/g, "''");
          const status = (l.status || 'Novo Lead').replace(/'/g, "''");
          const notes = (l.notes || '').replace(/'/g, "''");
          const source = (l.source || 'Site').replace(/'/g, "''");
          return `('${id}', '${name}', '${phone}', '${phoneRaw}', '${email}', '${lookingFor}', '${budget}', '${attendant}', '${status}', '${notes}', '${source}')`;
        });
        sql += leadEntries.join(',\n') + `\nON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes;\n`;
      }

      const blob = new Blob([sql], { type: 'text/sql;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `nd7-garage-database-${new Date().toISOString().slice(0, 10)}.sql`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);

      showToast('Banco de dados SQL (.sql) exportado com sucesso!');
    });

    // Gerenciamento da Conexão Supabase
    const supabaseUrlInput = document.getElementById('supabaseUrlInput');
    const supabaseKeyInput = document.getElementById('supabaseKeyInput');
    const supabaseConfigForm = document.getElementById('supabaseConfigForm');
    const supabaseStatusBadge = document.getElementById('supabaseStatusBadge');
    const btnSyncToSupabase = document.getElementById('btnSyncToSupabase');

    function updateSupabaseStatusDisplay() {
      const storedUrl = localStorage.getItem('nd7_supabase_url') || '';
      const storedKey = localStorage.getItem('nd7_supabase_anon_key') || '';
      if (supabaseUrlInput) supabaseUrlInput.value = storedUrl;
      if (supabaseKeyInput) supabaseKeyInput.value = storedKey;

      if (storedUrl && storedKey) {
        if (supabaseStatusBadge) {
          supabaseStatusBadge.textContent = '● Nuvem Conectada (Supabase)';
          supabaseStatusBadge.style.background = 'rgba(0, 230, 118, 0.15)';
          supabaseStatusBadge.style.color = '#00e676';
          supabaseStatusBadge.style.border = '1px solid rgba(0, 230, 118, 0.3)';
        }
        if (window.nd7db) {
          window.nd7db.config.provider = 'supabase';
          window.nd7db.config.supabaseUrl = storedUrl;
          window.nd7db.config.supabaseAnonKey = storedKey;
          window.nd7db.init();
        }
      } else {
        if (supabaseStatusBadge) {
          supabaseStatusBadge.textContent = '○ Modo Local (Navegador)';
          supabaseStatusBadge.style.background = 'rgba(255, 255, 255, 0.08)';
          supabaseStatusBadge.style.color = '#bbb';
          supabaseStatusBadge.style.border = '1px solid rgba(255, 255, 255, 0.15)';
        }
      }
    }

    updateSupabaseStatusDisplay();

    supabaseConfigForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = (supabaseUrlInput?.value || '').trim();
      const key = (supabaseKeyInput?.value || '').trim();

      if (!url || !key) {
        if (confirm('Deseja desconectar a nuvem e voltar para o Modo Local?')) {
          localStorage.removeItem('nd7_supabase_url');
          localStorage.removeItem('nd7_supabase_anon_key');
          updateSupabaseStatusDisplay();
          showToast('Desconectado do Supabase. Operando em modo local.');
        }
        return;
      }

      localStorage.setItem('nd7_supabase_url', url);
      localStorage.setItem('nd7_supabase_anon_key', key);
      updateSupabaseStatusDisplay();
      showToast('Configurações do Supabase salvas e ativadas!');
    });

    btnSyncToSupabase?.addEventListener('click', async () => {
      const url = localStorage.getItem('nd7_supabase_url');
      const key = localStorage.getItem('nd7_supabase_anon_key');
      if (!url || !key) {
        alert('Por favor, informe e salve a URL e a Chave Anon do seu projeto Supabase antes de sincronizar.');
        return;
      }

      if (!window.nd7db || !window.nd7db.supabaseClient) {
        alert('Cliente Supabase não está pronto. Verifique as credenciais ou a conexão de internet.');
        return;
      }

      showToast('Iniciando sincronização com a nuvem...');
      let vCount = 0;
      let lCount = 0;

      for (const v of vehicles) {
        try {
          await window.nd7db.saveVehicle(v);
          vCount++;
        } catch (err) {
          console.warn('Erro ao sincronizar veículo:', v.id, err);
        }
      }

      for (const l of leads) {
        try {
          await window.nd7db.addLead(l);
          lCount++;
        } catch (err) {
          console.warn('Erro ao sincronizar lead:', l.id, err);
        }
      }

      showToast(`✓ Sucesso! ${vCount} veículos e ${lCount} contatos sincronizados com a nuvem!`);
    });

    // Importar Backup JSON com Validação de Segurança
    btnImportJson?.addEventListener('click', () => {
      const file = importFileInput?.files?.[0];
      if (!file) {
        alert('Por favor, selecione um arquivo .json de backup.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo de backup excede o limite seguro de 10MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (!parsed || typeof parsed !== 'object') {
            throw new Error('Arquivo de backup inválido.');
          }

          if (parsed.vehicles) {
            if (!Array.isArray(parsed.vehicles)) throw new Error('Formato inválido no catálogo de veículos.');
            vehicles = parsed.vehicles.filter(v => v && typeof v === 'object' && typeof v.name === 'string');
            saveVehicles(vehicles);
          }
          if (parsed.storeInfo && typeof parsed.storeInfo === 'object' && !Array.isArray(parsed.storeInfo)) {
            storeInfo = Object.assign({}, STORE_INFO, parsed.storeInfo);
            saveStoreInfo(storeInfo);
            populateStoreInfoForm();
            populateSiteTextsForm();
          }
          if (parsed.leads) {
            if (!Array.isArray(parsed.leads)) throw new Error('Formato inválido na base de contatos.');
            leads = parsed.leads.map(l => typeof sanitizeLead === 'function' ? sanitizeLead(l) : l).filter(Boolean);
            saveLeads(leads);
            updateLeadKPIs();
            renderAdminLeadsTable();
          }

          updateKPIs();
          renderAdminTable();
          showToast('Backup validado e importado com sucesso!');
        } catch (err) {
          alert('Erro de validação no backup: ' + (err.message || 'Arquivo JSON malformado.'));
        }
      };
      reader.readAsText(file);
    });

    // Restaurar Padrões
    btnResetDefaults?.addEventListener('click', () => {
      if (confirm('Atenção: Isso irá redefinir os 16 veículos originais do CarroSP, contatos padrão e dados da ND7 Garage. Deseja continuar?')) {
        resetToDefaultData();
        vehicles = getVehicles();
        storeInfo = getStoreInfo();
        leads = getLeads();
        updateKPIs();
        renderAdminTable();
        updateLeadKPIs();
        renderAdminLeadsTable();
        populateStoreInfoForm();
        populateSiteTextsForm();
        showToast('Dados restaurados para os padrões originais com sucesso!');
      }
    });
  }

  // ==========================================================================
  // GESTÃO DE CONTATOS & LEADS (CRM - ATENDIMENTOS CAIO & EDUARDO)
  // ==========================================================================
  function updateLeadKPIs() {
    const total = leads.length;
    const caio = leads.filter(l => l.attendant === 'Caio').length;
    const eduardo = leads.filter(l => l.attendant === 'Eduardo').length;
    const waiting = leads.filter(l => l.attendant === 'Aguardando' || !l.attendant).length;

    if (kpiLeadsTotal) kpiLeadsTotal.textContent = total;
    if (kpiLeadsCaio) kpiLeadsCaio.textContent = caio;
    if (kpiLeadsEduardo) kpiLeadsEduardo.textContent = eduardo;
    if (kpiLeadsWaiting) kpiLeadsWaiting.textContent = waiting;
    if (leadsTabCountBadge) leadsTabCountBadge.textContent = total;
  }

  function getFilteredLeads() {
    const query = (leadSearchInput?.value || '').toLowerCase().trim();
    const attendant = leadAttendantFilter?.value || 'all';
    const status = leadStatusFilter?.value || 'all';

    return leads.filter(l => {
      if (query) {
        const full = `${l.name} ${l.phone} ${l.lookingFor} ${l.notes || ''} ${l.budget || ''}`.toLowerCase();
        if (!full.includes(query)) return false;
      }

      if (attendant !== 'all') {
        if (attendant === 'Aguardando') {
          if (l.attendant && l.attendant !== 'Aguardando') return false;
        } else if (l.attendant !== attendant) {
          return false;
        }
      }

      if (status !== 'all' && l.status !== status) {
        return false;
      }

      return true;
    });
  }

  function renderAdminLeadsTable() {
    if (!adminLeadsTbody) return;

    const filtered = getFilteredLeads();

    if (filtered.length === 0) {
      adminLeadsTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--color-text-subtle);">
            Nenhum contato encontrado com os filtros selecionados.
          </td>
        </tr>
      `;
      return;
    }

    adminLeadsTbody.innerHTML = filtered.map(lead => {
      const safeId = escapeHtml(lead.id);
      const safeName = escapeHtml(lead.name);
      const safePhone = escapeHtml(lead.phone);
      const safeEmail = lead.email ? escapeHtml(lead.email) : '';
      const safeSource = escapeHtml(lead.source || 'Site');
      const safeCreatedAt = escapeHtml(lead.createdAt || '');
      const safeLookingFor = escapeHtml(lead.lookingFor || '');
      const safeBudget = lead.budget ? escapeHtml(lead.budget) : '';
      const safeNotes = lead.notes ? escapeHtml(lead.notes) : '<span style="color: var(--color-text-subtle); font-style: italic;">Sem observações</span>';
      const rawPhone = encodeURIComponent((lead.phoneRaw || lead.phone || '').replace(/\D/g, ''));
      const attendant = ['Caio', 'Eduardo', 'Aguardando'].includes(lead.attendant) ? lead.attendant : 'Aguardando';

      let attendantBadge = '';
      if (attendant === 'Caio') {
        attendantBadge = `<span class="badge-attendant badge-caio">👤 Caio</span>`;
      } else if (attendant === 'Eduardo') {
        attendantBadge = `<span class="badge-attendant badge-eduardo">👤 Eduardo</span>`;
      } else {
        attendantBadge = `<span class="badge-attendant badge-waiting">⏳ Aguardando</span>`;
      }

      let statusClass = 'lead-status-novo';
      if (lead.status === 'Em Atendimento') statusClass = 'lead-status-atendimento';
      else if (lead.status === 'Visita Agendada') statusClass = 'lead-status-visita';
      else if (lead.status === 'Venda Concluída') statusClass = 'lead-status-concluido';
      else if (lead.status === 'Arquivado') statusClass = 'lead-status-arquivado';

      const waUrl = `https://wa.me/55${rawPhone}`;
      const telUrl = `tel:${rawPhone}`;

      return `
        <tr data-id="${safeId}">
          <td>
            <div style="font-weight: 800; color: #ffffff; font-size: 1rem;">${safeName}</div>
            <div style="font-size: 0.82rem; color: var(--color-text-muted); font-family: monospace; margin-top: 0.15rem;">
              📞 ${safePhone}
            </div>
            ${safeEmail ? `<div style="font-size: 0.76rem; color: var(--color-text-subtle); margin-top: 0.1rem;">✉️ ${safeEmail}</div>` : ''}
            <div style="font-size: 0.72rem; color: var(--color-text-subtle); margin-top: 0.25rem;">
              Origem: <strong>${safeSource}</strong> • ${safeCreatedAt}
            </div>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--color-gold); font-size: 0.95rem;">
              ${safeLookingFor}
            </div>
            ${safeBudget ? `<div style="font-size: 0.78rem; color: var(--color-text-subtle); margin-top: 0.2rem;">Orçamento: <strong style="color: #fff;">${safeBudget}</strong></div>` : ''}
          </td>
          <td>
            <div class="attendant-select-cell">
              <div>${attendantBadge}</div>
              <select class="attendant-quick-select" data-id="${safeId}" title="Alterar atendente">
                <option value="Caio" ${attendant === 'Caio' ? 'selected' : ''}>👤 Caio</option>
                <option value="Eduardo" ${attendant === 'Eduardo' ? 'selected' : ''}>👤 Eduardo</option>
                <option value="Aguardando" ${attendant === 'Aguardando' ? 'selected' : ''}>⏳ Aguardando</option>
              </select>
            </div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 0.35rem;">
              <span class="lead-status-pill ${statusClass}">${escapeHtml(lead.status)}</span>
              <select class="lead-status-quick-select" data-id="${safeId}" title="Alterar status do contato" style="background: #14141d; border: 1px solid var(--color-border); color: #fff; font-size: 0.72rem; padding: 0.25rem 0.4rem; border-radius: 4px; cursor: pointer;">
                <option value="Novo Lead" ${lead.status === 'Novo Lead' ? 'selected' : ''}>🟡 Novo Lead</option>
                <option value="Em Atendimento" ${lead.status === 'Em Atendimento' ? 'selected' : ''}>🔵 Em Atendimento</option>
                <option value="Visita Agendada" ${lead.status === 'Visita Agendada' ? 'selected' : ''}>🟣 Visita Agendada</option>
                <option value="Venda Concluída" ${lead.status === 'Venda Concluída' ? 'selected' : ''}>🟢 Venda Concluída</option>
                <option value="Arquivado" ${lead.status === 'Arquivado' ? 'selected' : ''}>⚪ Arquivado</option>
              </select>
            </div>
          </td>
          <td>
            <div style="font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.35; max-width: 320px;">
              ${safeNotes}
            </div>
          </td>
          <td style="text-align: center;">
            <div class="lead-contact-actions" style="justify-content: center;">
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-contact-action btn-contact-wa" title="Conversar no WhatsApp">
                📲 WhatsApp
              </a>
              <a href="${telUrl}" class="btn-contact-action btn-contact-call" title="Ligar diretamente">
                📞 Ligar
              </a>
            </div>
          </td>
          <td style="text-align: right;">
            <div class="action-btn-group" style="justify-content: flex-end;">
              <button type="button" class="icon-btn edit-lead-btn" data-id="${safeId}" title="Editar todas as informações deste contato">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button type="button" class="icon-btn danger delete-lead-btn" data-id="${safeId}" title="Excluir este contato">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Listener para o Seletor Rápido de Atendente
    document.querySelectorAll('.attendant-quick-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const newAttendant = e.target.value;
        const lead = leads.find(l => l.id === id);
        if (lead) {
          lead.attendant = newAttendant;
          lead.updatedAt = new Date().toLocaleString('pt-BR');
          saveLeads(leads);
          updateLeadKPIs();
          renderAdminLeadsTable();
          showToast(`Atendimento de "${lead.name}" atribuído a: ${newAttendant}!`);
        }
      });
    });

    // Listener para o Seletor Rápido de Status
    document.querySelectorAll('.lead-status-quick-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.value;
        const lead = leads.find(l => l.id === id);
        if (lead) {
          lead.status = newStatus;
          lead.updatedAt = new Date().toLocaleString('pt-BR');
          saveLeads(leads);
          updateLeadKPIs();
          renderAdminLeadsTable();
          showToast(`Status de "${lead.name}" alterado para: ${newStatus}!`);
        }
      });
    });

    // Listeners de Edição Completa e Exclusão
    document.querySelectorAll('.edit-lead-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const btnEl = e.currentTarget;
        const id = btnEl.dataset.id;
        const lead = leads.find(l => l.id === id);
        if (lead) openLeadModal(lead);
      });
    });

    document.querySelectorAll('.delete-lead-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const btnEl = e.currentTarget;
        const id = btnEl.dataset.id;
        const lead = leads.find(l => l.id === id);
        if (!lead) return;
        if (confirm(`Deseja realmente remover o contato de "${lead.name}"?`)) {
          leads = leads.filter(l => l.id !== id);
          saveLeads(leads);
          updateLeadKPIs();
          renderAdminLeadsTable();
          showToast(`Contato de "${lead.name}" removido com sucesso.`);
        }
      });
    });
  }

  // Modal de Lead: Edição Completa de Todos os Campos ou Novo Cadastro
  function openLeadModal(lead = null) {
    if (!leadModal) return;

    if (lead) {
      if (leadModalTitle) leadModalTitle.textContent = `Editar Contato: ${lead.name}`;
      document.getElementById('leadFormId').value = lead.id || '';
      document.getElementById('leadFormName').value = lead.name || '';
      document.getElementById('leadFormPhone').value = lead.phone || '';
      if (document.getElementById('leadFormEmail')) {
        document.getElementById('leadFormEmail').value = lead.email || '';
      }
      document.getElementById('leadFormLookingFor').value = lead.lookingFor || '';
      document.getElementById('leadFormBudget').value = lead.budget || '';
      document.getElementById('leadFormAttendant').value = lead.attendant || 'Caio';
      document.getElementById('leadFormStatus').value = lead.status || 'Novo Lead';
      document.getElementById('leadFormSource').value = lead.source || 'Site';
      if (document.getElementById('leadFormCreatedAt')) {
        document.getElementById('leadFormCreatedAt').value = lead.createdAt || '';
      }
      document.getElementById('leadFormNotes').value = lead.notes || '';
    } else {
      if (leadModalTitle) leadModalTitle.textContent = 'Novo Contato / Lead';
      document.getElementById('leadFormId').value = '';
      document.getElementById('leadFormName').value = '';
      document.getElementById('leadFormPhone').value = '';
      if (document.getElementById('leadFormEmail')) {
        document.getElementById('leadFormEmail').value = '';
      }
      document.getElementById('leadFormLookingFor').value = '';
      document.getElementById('leadFormBudget').value = '';
      document.getElementById('leadFormAttendant').value = 'Caio';
      document.getElementById('leadFormStatus').value = 'Novo Lead';
      document.getElementById('leadFormSource').value = 'Loja Física';
      if (document.getElementById('leadFormCreatedAt')) {
        const now = new Date();
        document.getElementById('leadFormCreatedAt').value = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      document.getElementById('leadFormNotes').value = '';
    }

    leadModal.classList.add('open');
    leadModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLeadModal() {
    if (leadModal) {
      leadModal.classList.remove('open');
      leadModal.classList.remove('active');
    }
    document.body.style.overflow = '';
  }

  function initLeadEventListeners() {
    const leadSearchClearBtn = document.getElementById('leadSearchClearBtn');

    leadSearchInput?.addEventListener('input', (e) => {
      if (leadSearchClearBtn) {
        leadSearchClearBtn.style.display = e.target.value ? 'inline-flex' : 'none';
      }
      renderAdminLeadsTable();
    });

    leadSearchClearBtn?.addEventListener('click', () => {
      if (leadSearchInput) {
        leadSearchInput.value = '';
        leadSearchClearBtn.style.display = 'none';
        leadSearchInput.focus();
        renderAdminLeadsTable();
      }
    });

    leadAttendantFilter?.addEventListener('change', renderAdminLeadsTable);
    leadStatusFilter?.addEventListener('change', renderAdminLeadsTable);

    btnAddNewLead?.addEventListener('click', () => openLeadModal());
    leadModalCloseBtn?.addEventListener('click', closeLeadModal);
    leadModalCancelBtn?.addEventListener('click', closeLeadModal);

    leadModal?.addEventListener('click', (e) => {
      if (e.target === leadModal) closeLeadModal();
    });

    // Salvar / Atualizar Contato com Edição de Todos os Dados
    leadForm?.addEventListener('submit', (e) => {
      e.preventDefault();

      try {
        const id = (document.getElementById('leadFormId')?.value || '').trim();
        const name = (document.getElementById('leadFormName')?.value || '').trim();
        const phone = (document.getElementById('leadFormPhone')?.value || '').trim();
        const email = (document.getElementById('leadFormEmail')?.value || '').trim();
        const lookingFor = (document.getElementById('leadFormLookingFor')?.value || '').trim();
        const budget = (document.getElementById('leadFormBudget')?.value || '').trim();
        const attendant = document.getElementById('leadFormAttendant')?.value || 'Caio';
        const status = document.getElementById('leadFormStatus')?.value || 'Novo Lead';
        const source = (document.getElementById('leadFormSource')?.value || 'Loja Física').trim();
        const createdAt = (document.getElementById('leadFormCreatedAt')?.value || '').trim() || (new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        const notes = (document.getElementById('leadFormNotes')?.value || '').trim();
        const phoneRaw = phone.replace(/\D/g, '');

        if (!name || !phone) {
          alert('Por favor, informe ao menos o Nome e o Telefone do cliente.');
          return;
        }

        if (id) {
          // Edição de Contato Existente (Edição de tudo!)
          const idx = leads.findIndex(l => l.id === id);
          if (idx !== -1) {
            leads[idx] = {
              ...leads[idx],
              id,
              name,
              phone,
              phoneRaw,
              email,
              lookingFor,
              budget,
              attendant,
              status,
              source,
              createdAt,
              notes,
              updatedAt: new Date().toLocaleString('pt-BR')
            };
            showToast(`✓ Contato de "${name}" atualizado com sucesso!`);
          } else {
            // Caso raro de ID não encontrado, cria
            leads.unshift({
              id,
              name,
              phone,
              phoneRaw,
              email,
              lookingFor,
              budget,
              attendant,
              status,
              source,
              createdAt,
              notes,
              updatedAt: new Date().toLocaleString('pt-BR')
            });
            showToast(`✓ Contato de "${name}" salvo com sucesso!`);
          }
        } else {
          // Cadastro de Novo Contato / Lead
          const newId = `lead_${Date.now()}`;
          const newLead = {
            id: newId,
            name,
            phone,
            phoneRaw,
            email,
            lookingFor,
            budget,
            attendant,
            status,
            source: source || 'Manual',
            notes,
            createdAt: createdAt,
            updatedAt: new Date().toLocaleString('pt-BR')
          };
          leads.unshift(newLead);
          showToast(`✓ Novo contato "${name}" cadastrado e atribuído a ${attendant}!`);
        }

        saveLeads(leads);
        if (window.nd7db && window.nd7db.config.provider === 'supabase') {
          const leadToSync = id ? leads.find(l => l.id === id) : leads[0];
          if (leadToSync) window.nd7db.addLead(leadToSync);
        }
        updateLeadKPIs();
        renderAdminLeadsTable();
        closeLeadModal();
      } catch (err) {
        console.error('Erro ao cadastrar/editar lead:', err);
        alert('Erro ao salvar contato: ' + err.message);
      }
    });
  }

  // ==========================================================================
  // SEGURANÇA BLINDADA: CONTROLE DE ACESSO, HASH SHA-256, PROTEÇÃO BRUTE-FORCE,
  // TIMEOUT DE INATIVIDADE E AUTORIZAÇÃO POR E-MAIL CRIPTOGRÁFICA
  // ==========================================================================
  function initSecurityAuth() {
    const AUTH_KEY_PASS_HASH = 'nd7_admin_password_hash';
    const AUTH_KEY_EMAIL = 'nd7_auth_email';
    const AUTH_KEY_NAME = 'nd7_auth_name';
    const AUTH_KEY_SESSION = 'nd7_admin_session';
    const AUTH_KEY_REMEMBER = 'nd7_admin_remember';
    const AUTH_KEY_LOGS = 'nd7_auth_logs';
    const AUTH_KEY_OTP = 'nd7_pending_otp';
    const AUTH_KEY_EMAIL_WEBHOOK = 'nd7_email_webhook';
    const AUTH_KEY_EMAIL_APIKEY = 'nd7_email_apikey';
    const AUTH_KEY_ATTEMPTS = 'nd7_auth_failed_attempts';
    const AUTH_KEY_LOCKOUT = 'nd7_auth_lockout_until';

    // Hash SHA-256 de 'nd7garage_salt_v1nd7garage'
    const DEFAULT_PASS_HASH = '9b5835bfaf0c31bcd76b06db58dbdbe00300b7925f7eb8f5df1b4b74aec857ea';
    const DEFAULT_EMAIL = 'nd7garage@gmail.com';
    const DEFAULT_NAME = 'Proprietário ND7 Garage';
    const MAX_FAILED_ATTEMPTS = 5;
    const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutos de bloqueio
    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos de inatividade

    // Migração transparente de senhas legadas em texto puro
    const legacyPass = localStorage.getItem('nd7_admin_password');
    if (legacyPass) {
      if (typeof hashStringSHA256 === 'function') {
        hashStringSHA256(legacyPass).then(h => {
          localStorage.setItem(AUTH_KEY_PASS_HASH, h);
          localStorage.removeItem('nd7_admin_password');
        }).catch(() => {});
      }
    }

    // Elementos do Gate de Login
    const adminLoginGate = document.getElementById('adminLoginGate');
    const btnMethodPassword = document.getElementById('btnMethodPassword');
    const btnMethodEmail = document.getElementById('btnMethodEmail');
    const viewPassword = document.getElementById('viewPassword');
    const viewEmail = document.getElementById('viewEmail');
    const loginPasswordForm = document.getElementById('loginPasswordForm');
    const loginPasswordInput = document.getElementById('loginPasswordInput');
    const passwordErrorMsg = document.getElementById('passwordErrorMsg');
    const lockoutWarningMsg = document.getElementById('lockoutWarningMsg');
    const otpStatusNotice = document.getElementById('otpStatusNotice');
    const togglePasswordVisibility = document.getElementById('togglePasswordVisibility');
    const rememberMeCheck = document.getElementById('rememberMeCheck');
    const linkForgotPassword = document.getElementById('linkForgotPassword');

    // Elementos de Verificação OTP por E-mail
    const displayAuthPerson = document.getElementById('displayAuthPerson');
    const displayAuthEmail = document.getElementById('displayAuthEmail');
    const stepRequestOtp = document.getElementById('stepRequestOtp');
    const stepVerifyOtp = document.getElementById('stepVerifyOtp');
    const btnRequestOtpCode = document.getElementById('btnRequestOtpCode');
    const btnResendOtp = document.getElementById('btnResendOtp');
    const verifyOtpForm = document.getElementById('verifyOtpForm');
    const otpCodeInput = document.getElementById('otpCodeInput');
    const otpErrorMsg = document.getElementById('otpErrorMsg');

    // Botão de Logout
    const btnLogout = document.getElementById('btnLogout');

    // Elementos da Aba de Segurança
    const changePasswordForm = document.getElementById('changePasswordForm');
    const currentPasswordInput = document.getElementById('currentPasswordInput');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmNewPasswordInput = document.getElementById('confirmNewPasswordInput');
    const changePasswordMsg = document.getElementById('changePasswordMsg');

    const authEmailForm = document.getElementById('authEmailForm');
    const authPersonNameInput = document.getElementById('authPersonNameInput');
    const authEmailInput = document.getElementById('authEmailInput');
    const btnTestAuthEmail = document.getElementById('btnTestAuthEmail');
    const emailGatewayForm = document.getElementById('emailGatewayForm');
    const emailWebhookUrlInput = document.getElementById('emailWebhookUrlInput');
    const emailApiKeyInput = document.getElementById('emailApiKeyInput');
    const btnTestSilentEmail = document.getElementById('btnTestSilentEmail');
    const adminLastOtpDisplay = document.getElementById('adminLastOtpDisplay');
    const authLogsList = document.getElementById('authLogsList');

    let inactivityTimer = null;
    let lockoutInterval = null;

    // Getters de Credenciais
    function getStoredPasswordHash() {
      return localStorage.getItem(AUTH_KEY_PASS_HASH) || DEFAULT_PASS_HASH;
    }

    function getStoredEmail() {
      return localStorage.getItem(AUTH_KEY_EMAIL) || DEFAULT_EMAIL;
    }

    function getStoredName() {
      return localStorage.getItem(AUTH_KEY_NAME) || DEFAULT_NAME;
    }

    // Mascara o e-mail para exibição sigilosa no gate (ex: nd7garage@gmail.com -> n*****e@gmail.com)
    function maskEmail(emailStr) {
      if (!emailStr || !emailStr.includes('@')) return 'c*****o@nd7garage.com.br';
      const parts = emailStr.split('@');
      const user = parts[0];
      const domain = parts[1];
      if (user.length <= 2) {
        return user[0] + '***@' + domain;
      }
      return user[0] + '*****' + user[user.length - 1] + '@' + domain;
    }

    // Atualiza Informações Visuais do Responsável
    function updateAuthDisplay() {
      const name = getStoredName();
      const email = getStoredEmail();

      if (displayAuthPerson) displayAuthPerson.textContent = name;
      if (displayAuthEmail) displayAuthEmail.textContent = maskEmail(email);
      if (authPersonNameInput) authPersonNameInput.value = name;
      if (authEmailInput) authEmailInput.value = email;

      if (emailWebhookUrlInput) emailWebhookUrlInput.value = localStorage.getItem(AUTH_KEY_EMAIL_WEBHOOK) || '';
      if (emailApiKeyInput) emailApiKeyInput.value = localStorage.getItem(AUTH_KEY_EMAIL_APIKEY) || '';
    }

    // Sistema de "Lembrar de Mim" Seguro com Validade Real de 7 Dias
    function setRememberSession(days = 7) {
      const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem(AUTH_KEY_REMEMBER, JSON.stringify({ active: true, expiresAt: expiresAt }));
    }

    function isRememberValid() {
      try {
        const raw = localStorage.getItem(AUTH_KEY_REMEMBER);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (data && data.active && data.expiresAt && Date.now() < data.expiresAt) {
          return true;
        }
        localStorage.removeItem(AUTH_KEY_REMEMBER);
        return false;
      } catch (e) {
        localStorage.removeItem(AUTH_KEY_REMEMBER);
        return false;
      }
    }

    // Proteção Contra Ataques de Força Bruta (Lockout Progressivo)
    function getLockoutRemainingMs() {
      const until = parseInt(localStorage.getItem(AUTH_KEY_LOCKOUT) || '0', 10);
      const diff = until - Date.now();
      return diff > 0 ? diff : 0;
    }

    function updateLockoutUI() {
      const remainingMs = getLockoutRemainingMs();
      const submitBtn = loginPasswordForm?.querySelector('button[type="submit"]');

      if (remainingMs > 0) {
        const remainingSec = Math.ceil(remainingMs / 1000);
        if (lockoutWarningMsg) {
          lockoutWarningMsg.style.display = 'block';
          lockoutWarningMsg.textContent = `🛑 Bloqueio temporário de segurança. Aguarde ${remainingSec}s para tentar novamente.`;
        }
        if (submitBtn) submitBtn.disabled = true;
        if (!lockoutInterval) {
          lockoutInterval = setInterval(updateLockoutUI, 1000);
        }
        return true;
      } else {
        if (lockoutWarningMsg) lockoutWarningMsg.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
        if (lockoutInterval) {
          clearInterval(lockoutInterval);
          lockoutInterval = null;
        }
        return false;
      }
    }

    function registerFailedAttempt() {
      let attempts = parseInt(localStorage.getItem(AUTH_KEY_ATTEMPTS) || '0', 10) + 1;
      localStorage.setItem(AUTH_KEY_ATTEMPTS, attempts.toString());

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        localStorage.setItem(AUTH_KEY_LOCKOUT, (Date.now() + LOCKOUT_MS).toString());
        localStorage.removeItem(AUTH_KEY_ATTEMPTS);
        updateLockoutUI();
        showToast('⚠️ Acesso bloqueado por 5 minutos devido a tentativas consecutivas incorretas.');
      } else {
        const remaining = MAX_FAILED_ATTEMPTS - attempts;
        if (passwordErrorMsg) {
          passwordErrorMsg.style.display = 'block';
          passwordErrorMsg.textContent = `Senha incorreta. Você tem mais ${remaining} tentativa(s) antes do bloqueio temporário.`;
        }
      }
    }

    function clearFailedAttempts() {
      localStorage.removeItem(AUTH_KEY_ATTEMPTS);
      localStorage.removeItem(AUTH_KEY_LOCKOUT);
      updateLockoutUI();
    }

    // Monitoramento de Inatividade (Logout Automático após 30 Minutos)
    function resetInactivityTimer() {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      const isAuth = sessionStorage.getItem(AUTH_KEY_SESSION) === 'active' || isRememberValid();
      if (isAuth) {
        inactivityTimer = setTimeout(() => {
          logoutAdmin('Sua sessão foi encerrada após 30 minutos de inatividade por motivos de segurança.');
        }, INACTIVITY_LIMIT_MS);
      }
    }

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, resetInactivityTimer, { passive: true });
    });

    // Registro e Renderização de Logs de Acesso com Escaping XSS
    function getAuthLogs() {
      try {
        return JSON.parse(localStorage.getItem(AUTH_KEY_LOGS) || '[]');
      } catch (e) {
        return [];
      }
    }

    function recordAuthLog(method) {
      const logs = getAuthLogs();
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      logs.unshift({
        timestamp: formattedDate,
        method: method
      });

      if (logs.length > 10) logs.pop();

      localStorage.setItem(AUTH_KEY_LOGS, JSON.stringify(logs));
      renderAuthLogs();
    }

    function renderAuthLogs() {
      if (!authLogsList) return;
      const logs = getAuthLogs();

      if (logs.length === 0) {
        authLogsList.innerHTML = `<p style="font-style: italic; color: var(--color-text-subtle);">Nenhum acesso registrado no histórico local ainda.</p>`;
        return;
      }

      authLogsList.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
          ${logs.map(log => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; background: var(--color-bg-input); border-radius: 6px; border-left: 3px solid var(--color-gold);">
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--color-gold);"></span>
                <span style="font-weight: 600; color: #ffffff;">${escapeHtml(log.method)}</span>
              </div>
              <span style="font-size: 0.78rem; color: var(--color-text-subtle);">${escapeHtml(log.timestamp)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Verificação de Sessão Inicial e Gatekeeper
    function checkSession() {
      const isRemembered = isRememberValid();
      const hasActiveSession = sessionStorage.getItem(AUTH_KEY_SESSION) === 'active';
      return isRemembered || hasActiveSession;
    }

    function applySessionState() {
      updateLockoutUI();
      if (checkSession()) {
        adminAppWrapper?.classList.add('authenticated');
        adminLoginGate?.classList.add('hidden');
        initAdminDashboardData();
        resetInactivityTimer();
      } else {
        adminAppWrapper?.classList.remove('authenticated');
        adminLoginGate?.classList.remove('hidden');
      }
      updateAuthDisplay();
      renderAuthLogs();
    }

    // Logout Seguro com Limpeza Completa de Dados no DOM
    function logoutAdmin(customMsg) {
      sessionStorage.removeItem(AUTH_KEY_SESSION);
      localStorage.removeItem(AUTH_KEY_REMEMBER);
      sessionStorage.removeItem(AUTH_KEY_OTP);
      if (inactivityTimer) clearTimeout(inactivityTimer);

      if (adminVehiclesTbody) adminVehiclesTbody.innerHTML = '';
      if (adminLeadsTbody) adminLeadsTbody.innerHTML = '';
      if (authLogsList) authLogsList.innerHTML = '';
      isDashboardLoaded = false;

      adminAppWrapper?.classList.remove('authenticated');
      adminLoginGate?.classList.remove('hidden');

      btnMethodPassword?.click();
      if (loginPasswordInput) loginPasswordInput.value = '';
      if (passwordErrorMsg) passwordErrorMsg.style.display = 'none';

      if (customMsg) {
        showToast(customMsg);
      } else {
        showToast('Sessão encerrada com sucesso.');
      }
    }

    btnLogout?.addEventListener('click', () => logoutAdmin());

    // Alternar Métodos de Autenticação (Senha vs E-mail)
    btnMethodPassword?.addEventListener('click', () => {
      btnMethodPassword.classList.add('active');
      btnMethodEmail?.classList.remove('active');
      viewPassword?.classList.add('active');
      viewEmail?.classList.remove('active');
    });

    btnMethodEmail?.addEventListener('click', () => {
      btnMethodEmail.classList.add('active');
      btnMethodPassword?.classList.remove('active');
      viewEmail?.classList.add('active');
      viewPassword?.classList.remove('active');
    });

    linkForgotPassword?.addEventListener('click', (e) => {
      e.preventDefault();
      btnMethodEmail?.click();
    });

    // Mostrar / Ocultar Senha
    togglePasswordVisibility?.addEventListener('click', () => {
      if (loginPasswordInput) {
        const isPass = loginPasswordInput.type === 'password';
        loginPasswordInput.type = isPass ? 'text' : 'password';
        togglePasswordVisibility.textContent = isPass ? '🙈' : '👁️';
      }
    });

    // Submissão do Login por Senha (Verificação Criptográfica com SHA-256)
    loginPasswordForm?.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (updateLockoutUI()) {
        return;
      }

      const enteredPass = loginPasswordInput?.value || '';
      const enteredHash = await hashStringSHA256(enteredPass);
      const storedHash = getStoredPasswordHash();

      if (enteredHash === storedHash) {
        clearFailedAttempts();
        if (passwordErrorMsg) passwordErrorMsg.style.display = 'none';

        if (rememberMeCheck && rememberMeCheck.checked) {
          setRememberSession(7);
        } else {
          localStorage.removeItem(AUTH_KEY_REMEMBER);
        }

        sessionStorage.setItem(AUTH_KEY_SESSION, 'active');
        recordAuthLog('Senha do Painel (Hash SHA-256)');
        showToast('Login efetuado com sucesso! Bem-vindo ao painel da ND7 Garage.');
        loginPasswordForm.reset();
        applySessionState();
      } else {
        registerFailedAttempt();
        loginPasswordInput?.focus();
      }
    });

    // Geração Criptográfica e Disparo Silencioso de Código OTP por E-mail
    async function dispatchEmailCode(isTestFromAdmin = false) {
      const webhookUrl = (localStorage.getItem(AUTH_KEY_EMAIL_WEBHOOK) || '').trim();
      const apiKey = (localStorage.getItem(AUTH_KEY_EMAIL_APIKEY) || '').trim();
      const targetEmail = getStoredEmail();
      const personName = getStoredName();

      if (!webhookUrl && !isTestFromAdmin) {
        if (otpStatusNotice) {
          otpStatusNotice.style.display = 'block';
          otpStatusNotice.innerHTML = `⚠️ <strong>Serviço de e-mail não configurado:</strong> Cadastre a URL do Webhook na Aba de Segurança interna. Para entrar agora, utilize a <strong>Senha Mestra</strong> do painel.`;
        }
        showToast('⚠️ Configure a URL do Webhook na Aba de Segurança para ativar disparo por e-mail.');
        return;
      }

      // Geração com criptografia forte
      const randomBuf = new Uint32Array(1);
      window.crypto.getRandomValues(randomBuf);
      const otpCode = (100000 + (randomBuf[0] % 900000)).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const otpHash = await hashStringSHA256(otpCode, 'nd7_otp_salt');

      // Salva apenas o HASH criptográfico com limite de tentativas
      sessionStorage.setItem(AUTH_KEY_OTP, JSON.stringify({
        hash: otpHash,
        expiresAt: expiresAt,
        attemptsLeft: 3
      }));

      if (adminLastOtpDisplay && isTestFromAdmin) {
        adminLastOtpDisplay.textContent = otpCode;
      }

      // Disparo em segundo plano silencioso via Webhook, se configurado
      if (webhookUrl) {
        try {
          fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
            },
            body: JSON.stringify({
              to: targetEmail,
              email: targetEmail,
              name: personName,
              subject: `ND7 Garage - Código de Autorização: ${otpCode}`,
              code: otpCode,
              timestamp: new Date().toISOString()
            })
          }).catch(err => {
            console.warn('[ND7 Email Webhook] Disparo em background:', err);
          });
        } catch (err) {
          console.warn('[ND7 Email Webhook] Falha na requisição:', err);
        }
      }

      if (isTestFromAdmin) {
        showToast(`Código de teste gerado e disparado para o e-mail ${targetEmail}!`);
      } else {
        showToast(`Código confidencial enviado para o e-mail do proprietário (${maskEmail(targetEmail)})!`);
      }

      if (stepRequestOtp) stepRequestOtp.style.display = 'none';
      if (stepVerifyOtp) stepVerifyOtp.style.display = 'block';
      if (otpErrorMsg) otpErrorMsg.style.display = 'none';
      if (otpCodeInput) {
        otpCodeInput.value = '';
        otpCodeInput.focus();
      }
    }

    btnRequestOtpCode?.addEventListener('click', () => dispatchEmailCode(false));
    btnResendOtp?.addEventListener('click', () => dispatchEmailCode(false));

    // Salvar Configurações do Gateway de E-mail
    emailGatewayForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = (emailWebhookUrlInput?.value || '').trim();
      const key = (emailApiKeyInput?.value || '').trim();
      localStorage.setItem(AUTH_KEY_EMAIL_WEBHOOK, url);
      localStorage.setItem(AUTH_KEY_EMAIL_APIKEY, key);
      showToast('Configurações de Gateway de E-mail salvas com sucesso!');
    });

    btnTestSilentEmail?.addEventListener('click', () => {
      dispatchEmailCode(true);
    });

    // Validação Criptográfica do Código OTP
    verifyOtpForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const enteredCode = (otpCodeInput?.value || '').trim();

      let storedOtp = null;
      try {
        storedOtp = JSON.parse(sessionStorage.getItem(AUTH_KEY_OTP) || 'null');
      } catch (err) {
        storedOtp = null;
      }

      if (!storedOtp) {
        if (otpErrorMsg) {
          otpErrorMsg.style.display = 'block';
          otpErrorMsg.textContent = 'Nenhum código ativo. Solicite um novo código.';
        }
        return;
      }

      if (Date.now() > storedOtp.expiresAt) {
        sessionStorage.removeItem(AUTH_KEY_OTP);
        if (otpErrorMsg) {
          otpErrorMsg.style.display = 'block';
          otpErrorMsg.textContent = 'Este código expirou (limite de 5 min). Solicite um novo.';
        }
        return;
      }

      if (storedOtp.attemptsLeft <= 0) {
        sessionStorage.removeItem(AUTH_KEY_OTP);
        if (otpErrorMsg) {
          otpErrorMsg.style.display = 'block';
          otpErrorMsg.textContent = 'Limite de tentativas excedido para este código. Solicite um novo.';
        }
        return;
      }

      const enteredHash = await hashStringSHA256(enteredCode, 'nd7_otp_salt');

      if (enteredHash === storedOtp.hash) {
        if (otpErrorMsg) otpErrorMsg.style.display = 'none';
        sessionStorage.setItem(AUTH_KEY_SESSION, 'active');
        sessionStorage.removeItem(AUTH_KEY_OTP);

        recordAuthLog(`Autorização por E-mail (${getStoredName()})`);
        showToast('Acesso confirmado com sucesso via autorização por e-mail!');

        if (stepRequestOtp) stepRequestOtp.style.display = 'block';
        if (stepVerifyOtp) stepVerifyOtp.style.display = 'none';

        applySessionState();
      } else {
        storedOtp.attemptsLeft -= 1;
        sessionStorage.setItem(AUTH_KEY_OTP, JSON.stringify(storedOtp));
        if (otpErrorMsg) {
          otpErrorMsg.style.display = 'block';
          otpErrorMsg.textContent = `Código incorreto. Tentativas restantes: ${storedOtp.attemptsLeft}.`;
        }
        otpCodeInput?.focus();
      }
    });

    // Aba de Segurança: Alterar Senha Mestra com Criptografia SHA-256 e Validação de Complexidade
    changePasswordForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const current = (currentPasswordInput?.value || '').trim();
      const next = (newPasswordInput?.value || '').trim();
      const confirmNext = (confirmNewPasswordInput?.value || '').trim();

      const currentHash = await hashStringSHA256(current);
      if (currentHash !== getStoredPasswordHash()) {
        if (changePasswordMsg) {
          changePasswordMsg.style.display = 'block';
          changePasswordMsg.style.color = '#ff5252';
          changePasswordMsg.textContent = 'A senha atual informada está incorreta.';
        }
        currentPasswordInput?.focus();
        return;
      }

      if (next.length < 6 || !/\d/.test(next) || !/[a-zA-Z]/.test(next)) {
        if (changePasswordMsg) {
          changePasswordMsg.style.display = 'block';
          changePasswordMsg.style.color = '#ff5252';
          changePasswordMsg.textContent = 'A nova senha deve ter no mínimo 6 caracteres e conter letras e números para maior segurança.';
        }
        newPasswordInput?.focus();
        return;
      }

      if (next !== confirmNext) {
        if (changePasswordMsg) {
          changePasswordMsg.style.display = 'block';
          changePasswordMsg.style.color = '#ff5252';
          changePasswordMsg.textContent = 'A confirmação de senha não confere com a nova senha.';
        }
        confirmNewPasswordInput?.focus();
        return;
      }

      const newHash = await hashStringSHA256(next);
      localStorage.setItem(AUTH_KEY_PASS_HASH, newHash);
      localStorage.removeItem('nd7_admin_password');

      if (changePasswordMsg) {
        changePasswordMsg.style.display = 'block';
        changePasswordMsg.style.color = '#00c853';
        changePasswordMsg.textContent = '✓ Senha alterada e criptografada com sucesso! Guarde-a em local seguro.';
      }

      changePasswordForm.reset();
      showToast('Nova senha do painel criptografada e salva com sucesso!');
    });

    // Aba de Segurança: Salvar Responsável e E-mail Autorizado
    authEmailForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const personName = (authPersonNameInput?.value || '').trim();
      const emailVal = (authEmailInput?.value || '').trim();

      if (!personName || !emailVal) {
        alert('Por favor, preencha o nome do responsável e o e-mail de autorização.');
        return;
      }

      localStorage.setItem(AUTH_KEY_NAME, personName);
      localStorage.setItem(AUTH_KEY_EMAIL, emailVal);

      updateAuthDisplay();
      showToast('Responsável e e-mail para autorização atualizados com sucesso!');
    });

    // Aba de Segurança: Disparar Código de Teste para o E-mail
    btnTestAuthEmail?.addEventListener('click', () => {
      dispatchEmailCode(true);
    });

    // Inicializa verificação de sessão e gatekeeper
    applySessionState();
  }

  // Toast Seguro (com Escaping XSS)
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" stroke-width="2">
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
