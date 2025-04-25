// ==========================================
// Tenebris Tattoo - Lógica Principal (app.js)
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
  // ----------------------------------------------------
  // 1. Botón "Volver Arriba"
  // ----------------------------------------------------
  const backToTopButton = document.getElementById('back-to-top');
  if (backToTopButton) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopButton.classList.add('show');
      } else {
        backToTopButton.classList.remove('show');
      }
    });

    backToTopButton.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ----------------------------------------------------
  // 2. Cargar contenido subido desde el Panel de Admin
  // ----------------------------------------------------
  loadCustomAdminContent();

  // ----------------------------------------------------
  // 3. Filtros y Visor de Galería (Lightbox interactivo)
  // ----------------------------------------------------
  initPortfolioFilters();
  initGalleryModal();

  // ----------------------------------------------------
  // 4. Módulo de Videos bajo demanda (videos.html)
  // ----------------------------------------------------
  initVideoModule();

  // ----------------------------------------------------
  // 5. Sistema de Agenda con FullCalendar (agenda.html)
  // ----------------------------------------------------
  const calendarEl = document.getElementById('calendar');
  if (calendarEl && typeof FullCalendar !== 'undefined') {
    initAgenda(calendarEl);
  }
});

// ==========================================
// Cargar contenido dinámico desde el Panel de Admin
// ==========================================
function loadCustomAdminContent() {
  // 1. Fotos subidas desde admin.html
  const portfolioGrid = document.querySelector('.portfolio-grid');
  if (portfolioGrid) {
    try {
      const customPhotos = JSON.parse(localStorage.getItem('tenebris_custom_photos_v1') || '[]');
      if (customPhotos.length > 0) {
        customPhotos.forEach(photo => {
          const item = document.createElement('div');
          item.className = 'portfolio-item show';
          item.setAttribute('data-category', photo.category || 'blackwork');

          const tagLabels = {
            blackwork: 'Black & Grey',
            realismo: 'Realismo',
            fina: 'Línea Fina'
          };
          const tagText = tagLabels[photo.category] || 'Tenebris Tattoo';

          item.innerHTML = `
            <div class="portfolio-card" data-title="${photo.title}" data-tag="${tagText}">
              <img src="${photo.src}" alt="${photo.title}">
              <div class="portfolio-overlay">
                <span class="portfolio-tag">${tagText}</span>
                <div class="portfolio-title">${photo.title}</div>
                <div class="portfolio-zoom-hint"><i class="fas fa-search-plus"></i> Ver en pantalla completa</div>
              </div>
            </div>
          `;
          portfolioGrid.prepend(item);
        });
      }
    } catch (e) {
      console.warn('Error al cargar fotos personalizadas:', e);
    }
  }

  // 2. Videos agregados desde admin.html
  const videoGrid = document.querySelector('.video-grid');
  if (videoGrid) {
    try {
      const customVideos = JSON.parse(localStorage.getItem('tenebris_custom_videos_v1') || '[]');
      if (customVideos.length > 0) {
        customVideos.forEach(vid => {
          const card = document.createElement('div');
          card.className = 'video-card-modern';
          card.setAttribute('data-video-id', vid.id);
          card.setAttribute('data-video-url', vid.url);

          card.innerHTML = `
            <div class="video-card-header">
              <a href="${vid.url}" target="_blank" class="video-card-author">
                <i class="fab fa-tiktok"></i> @tenebris__tattoo
              </a>
              <span class="badge bg-warning text-dark fw-bold">Nuevo</span>
            </div>
            <div class="video-thumb-container" onclick="loadSingleVideo(this)">
              <img src="tattoo1.jpg" alt="${vid.title}" class="video-thumb-img">
              <div class="video-play-btn" title="Reproducir Video">
                <i class="fas fa-play"></i>
              </div>
            </div>
            <div class="video-title">${vid.title}</div>
            <small class="text-muted d-block mb-3">${vid.tags || '#tattoo #tenebristattoo'}</small>
            <div class="video-card-actions">
              <button class="btn btn-sm btn-tenebris-gold w-50" onclick="loadSingleVideo(this.closest('.video-card-modern').querySelector('.video-thumb-container'))">
                <i class="fas fa-play me-1"></i> Ver Aquí
              </button>
              <a href="${vid.url}" target="_blank" class="btn-tiktok-direct w-50">
                <i class="fab fa-tiktok"></i> En TikTok ↗
              </a>
            </div>
          `;
          videoGrid.prepend(card);
        });
      }
    } catch (e) {
      console.warn('Error al cargar videos personalizados:', e);
    }
  }
}

// ==========================================
// Módulo de Filtros de la Galería
// ==========================================
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  if (filterBtns.length === 0 || portfolioItems.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const filterValue = this.getAttribute('data-filter');

      portfolioItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category') || '';
        if (filterValue === 'all' || itemCategory.includes(filterValue)) {
          item.classList.remove('hide');
          item.classList.add('show');
        } else {
          item.classList.remove('show');
          item.classList.add('hide');
        }
      });
    });
  });
}

// ==========================================
// Módulo de Galería (Lightbox con Navegación)
// ==========================================
function initGalleryModal() {
  const galleryCards = document.querySelectorAll('.portfolio-card');
  const modalImg = document.getElementById('lightboxImage');
  const modalTitle = document.getElementById('lightboxTitle');
  const modalCategory = document.getElementById('lightboxCategory');
  const modalWhatsappLink = document.getElementById('lightboxWhatsappBtn');
  const lightboxModalEl = document.getElementById('lightboxModal');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  if (!lightboxModalEl || galleryCards.length === 0 || typeof bootstrap === 'undefined') {
    return;
  }

  const lightboxModal = new bootstrap.Modal(lightboxModalEl);
  let currentIndex = 0;
  let visibleCards = [];

  function updateVisibleCards() {
    visibleCards = Array.from(galleryCards).filter(card => {
      const parent = card.closest('.portfolio-item');
      return !parent || !parent.classList.contains('hide');
    });
  }

  function showImageAtIndex(index) {
    updateVisibleCards();
    if (visibleCards.length === 0) return;

    if (index < 0) index = visibleCards.length - 1;
    if (index >= visibleCards.length) index = 0;
    currentIndex = index;

    const currentCard = visibleCards[currentIndex];
    const img = currentCard.querySelector('img');
    const title = currentCard.getAttribute('data-title') || img.alt || 'Diseño Exclusivo';
    const category = currentCard.getAttribute('data-tag') || 'Tenebris Tattoo';

    if (modalImg && img) {
      modalImg.src = img.src;
      modalImg.alt = title;
    }
    if (modalTitle) modalTitle.textContent = title;
    if (modalCategory) modalCategory.textContent = category;

    if (modalWhatsappLink) {
      const message = `Hola Tenebris Tattoo, vi este tatuaje en su galería ("${title} - ${category}") y me gustaría cotizar una idea similar.`;
      modalWhatsappLink.href = `https://api.whatsapp.com/send?phone=573156595769&text=${encodeURIComponent(message)}`;
    }
  }

  galleryCards.forEach(card => {
    card.addEventListener('click', function () {
      updateVisibleCards();
      const idx = visibleCards.indexOf(card);
      showImageAtIndex(idx !== -1 ? idx : 0);
      lightboxModal.show();
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showImageAtIndex(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showImageAtIndex(currentIndex + 1);
    });
  }

  // Soporte para flechas del teclado
  document.addEventListener('keydown', function (e) {
    if (lightboxModalEl.classList.contains('show')) {
      if (e.key === 'ArrowLeft') showImageAtIndex(currentIndex - 1);
      if (e.key === 'ArrowRight') showImageAtIndex(currentIndex + 1);
    }
  });
}

// ==========================================
// Módulo de Agenda y Citas (FullCalendar)
// ==========================================
function initAgenda(calendarEl) {
  const modal = document.getElementById('modal');
  const closeModal = document.querySelector('.close');
  const form = document.getElementById('appointmentForm');
  const eventIdInput = document.getElementById('eventId');
  const saveBtn = document.getElementById('saveBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const whatsappBtn = document.getElementById('whatsappBtn');

  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notificationMessage');

  const eventSearch = document.getElementById('eventSearch');
  const searchBtn = document.getElementById('searchBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  const STORAGE_KEY = 'tenebris_tattoo_citas_v1';
  let selectedDate = null;
  let currentEvent = null;

  const STUDIO_PHONE = '573156595769';

  function loadStoredAppointments() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Filtrar y eliminar cualquier cita de prueba o hardcodeada que haya quedado en memoria
        const cleaned = parsed.filter(ev => {
          const title = (ev.title || '').toLowerCase();
          return !title.includes('carlos m') && !title.includes('valentina r');
        });
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    } catch (e) {
      console.warn('Error al leer de localStorage:', e);
    }
    // Calendario completamente limpio: solo citas reales del usuario
    return [];
  }

  function saveAppointmentsToStorage(eventsArray) {
    try {
      if (eventsArray) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsArray));
      } else if (calendar) {
        const events = calendar.getEvents().map(ev => ({
          id: ev.id,
          title: ev.title,
          start: ev.start ? ev.start.toISOString() : null,
          end: ev.end ? ev.end.toISOString() : null,
          description: ev.extendedProps.description || '',
          idea: ev.extendedProps.idea || '',
          className: ev.classNames ? ev.classNames[0] : 'event-custom'
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      }
    } catch (e) {
      console.warn('Error al guardar en localStorage:', e);
    }
  }

  function convertTo12Hour(timeStr) {
    if (!timeStr) return '';
    const [hourStr, minute] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }

  function showNotification(message) {
    if (!notification || !notificationMessage) return;
    notificationMessage.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 2800);
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    selectable: true,
    editable: true,
    displayEventTime: false,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana'
    },
    events: loadStoredAppointments(),
    eventDidMount: function (info) {
      const ideaText = info.event.extendedProps.idea ? ` | Idea: ${info.event.extendedProps.idea}` : '';
      const tooltipText = (info.event.extendedProps.description || '') + ideaText;

      if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        new bootstrap.Tooltip(info.el, {
          title: tooltipText || info.event.title,
          placement: 'top',
          trigger: 'hover'
        });
      }
    },
    eventDrop: function (info) {
      saveAppointmentsToStorage();
      showNotification(`Cita reprogramada al ${info.event.start.toLocaleDateString('es-ES')}`);
    },
    select: function (info) {
      selectedDate = info.start;
      currentEvent = null;
      if (form) form.reset();
      if (eventIdInput) eventIdInput.value = '';
      if (saveBtn) saveBtn.textContent = 'Guardar Cita';
      if (deleteBtn) deleteBtn.style.display = 'none';
      if (whatsappBtn) whatsappBtn.style.display = 'none';

      const fechaLegible = selectedDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const modalSub = document.getElementById('modalSubtitle');
      if (modalSub) {
        modalSub.textContent = `Fecha seleccionada: ${fechaLegible}`;
      }

      if (modal) modal.style.display = 'block';
    },
    eventClick: function (info) {
      currentEvent = info.event;
      if (eventIdInput) eventIdInput.value = currentEvent.id;

      let titleParts = currentEvent.title.split(' - ');
      const nameInput = document.getElementById('name');
      if (nameInput) nameInput.value = titleParts[0] || '';

      const horaInput = document.getElementById('hora');
      if (horaInput && currentEvent.start) {
        let eventDate = new Date(currentEvent.start);
        let hh = eventDate.getHours().toString().padStart(2, '0');
        let mm = eventDate.getMinutes().toString().padStart(2, '0');
        horaInput.value = `${hh}:${mm}`;
      }

      const telInput = document.getElementById('telefono');
      let desc = currentEvent.extendedProps.description || '';
      let tel = desc.replace('Teléfono: ', '').trim();
      if (telInput) telInput.value = tel;

      const ideaInput = document.getElementById('idea');
      if (ideaInput) {
        ideaInput.value = currentEvent.extendedProps.idea || '';
      }

      if (saveBtn) saveBtn.textContent = 'Guardar Cambios';
      if (deleteBtn) deleteBtn.style.display = 'inline-block';
      if (whatsappBtn) whatsappBtn.style.display = 'inline-block';

      const modalSub = document.getElementById('modalSubtitle');
      if (modalSub && currentEvent.start) {
        modalSub.textContent = `Cita: ${currentEvent.start.toLocaleDateString('es-ES')}`;
      }

      if (modal) modal.style.display = 'block';
    }
  });

  calendar.render();

  if (form) {
    form.onsubmit = function (event) {
      event.preventDefault();

      const nombre = document.getElementById('name').value.trim();
      const hora = document.getElementById('hora').value;
      const telefono = document.getElementById('telefono').value.trim();
      const ideaInput = document.getElementById('idea');
      const idea = ideaInput ? ideaInput.value.trim() : '';

      const formattedTime = convertTo12Hour(hora);
      const [h, m] = hora.split(':');

      let baseDate = currentEvent ? new Date(currentEvent.start) : new Date(selectedDate);
      baseDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

      if (currentEvent) {
        currentEvent.setProp('title', `${nombre} - ${formattedTime}`);
        currentEvent.setStart(baseDate);
        currentEvent.setExtendedProp('description', `Teléfono: ${telefono}`);
        currentEvent.setExtendedProp('idea', idea);
        saveAppointmentsToStorage();
        showNotification(`Cita actualizada: ${nombre} - ${formattedTime}`);
      } else {
        const duplicado = calendar.getEvents().find(ev => ev.start && ev.start.getTime() === baseDate.getTime());
        if (duplicado) {
          showNotification(`La hora ${formattedTime} ya se encuentra ocupada.`);
          return;
        }

        const newId = 'cita-' + Date.now();
        calendar.addEvent({
          id: newId,
          title: `${nombre} - ${formattedTime}`,
          start: baseDate,
          description: `Teléfono: ${telefono}`,
          idea: idea,
          className: 'event-custom'
        });
        saveAppointmentsToStorage();
        showNotification(`Cita registrada: ${nombre} - ${formattedTime}`);
      }

      if (modal) modal.style.display = 'none';
      form.reset();
      currentEvent = null;
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = function () {
      if (currentEvent && confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
        currentEvent.remove();
        saveAppointmentsToStorage();
        if (modal) modal.style.display = 'none';
        if (form) form.reset();
        showNotification('Cita eliminada con éxito');
        currentEvent = null;
      }
    };
  }

  if (whatsappBtn) {
    whatsappBtn.onclick = function () {
      const nombre = document.getElementById('name')?.value || '';
      const hora = document.getElementById('hora')?.value || '';
      const tel = document.getElementById('telefono')?.value || '';
      const idea = document.getElementById('idea')?.value || '';
      const fecha = currentEvent?.start
        ? currentEvent.start.toLocaleDateString('es-ES')
        : (selectedDate ? selectedDate.toLocaleDateString('es-ES') : 'la fecha acordada');

      const hora12 = convertTo12Hour(hora);
      const mensaje = `Hola Tenebris Tattoo, quiero confirmar mi cita:\n- Nombre: ${nombre}\n- Fecha: ${fecha}\n- Hora: ${hora12}\n- Teléfono: ${tel}${idea ? '\n- Idea del tatuaje: ' + idea : ''}`;

      const url = `https://api.whatsapp.com/send?phone=${STUDIO_PHONE}&text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
    };
  }

  if (closeModal) {
    closeModal.onclick = function () {
      if (modal) modal.style.display = 'none';
      if (form) form.reset();
      currentEvent = null;
    };
  }

  window.addEventListener('click', function (e) {
    if (modal && e.target === modal) {
      modal.style.display = 'none';
      if (form) form.reset();
      currentEvent = null;
    }
  });

  if (searchBtn && eventSearch) {
    searchBtn.onclick = function () {
      const term = eventSearch.value.toLowerCase().trim();
      calendar.getEvents().forEach(ev => {
        const titleMatch = ev.title.toLowerCase().includes(term);
        const descMatch = (ev.extendedProps.description || '').toLowerCase().includes(term);
        const ideaMatch = (ev.extendedProps.idea || '').toLowerCase().includes(term);

        if (!term || titleMatch || descMatch || ideaMatch) {
          ev.setProp('classNames', ['event-custom']);
        } else {
          ev.setProp('classNames', ['filtered-out']);
        }
      });
    };

    eventSearch.addEventListener('input', function () {
      if (!this.value.trim()) {
        calendar.getEvents().forEach(ev => ev.setProp('classNames', ['event-custom']));
      }
    });
  }

  if (clearSearchBtn && eventSearch) {
    clearSearchBtn.onclick = function () {
      eventSearch.value = '';
      calendar.getEvents().forEach(ev => {
        ev.setProp('classNames', ['event-custom']);
      });
    };
  }
}

// ==========================================
// Módulo de Videos de TikTok (videos.html)
// ==========================================
function initVideoModule() {
  const loadAllBtn = document.getElementById('loadAllVideosBtn');
  if (loadAllBtn) {
    loadAllBtn.addEventListener('click', function () {
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Cargando videos...';

      const containers = document.querySelectorAll('.video-thumb-container:not([data-loaded="true"])');
      containers.forEach((container, idx) => {
        setTimeout(() => {
          loadSingleVideo(container);
          if (idx === containers.length - 1) {
            loadAllBtn.innerHTML = '<i class="fas fa-check me-1"></i> Todos los videos cargados';
          }
        }, idx * 750);
      });
    });
  }
}

function triggerTikTokScript() {
  const oldScript = document.getElementById('tiktok-embed-script');
  if (oldScript) oldScript.remove();

  const script = document.createElement('script');
  script.id = 'tiktok-embed-script';
  script.src = 'https://www.tiktok.com/embed.js';
  script.async = true;
  document.body.appendChild(script);
}

function loadSingleVideo(container) {
  if (!container || container.getAttribute('data-loaded') === 'true') return;
  container.setAttribute('data-loaded', 'true');

  const card = container.closest('.video-card-modern');
  if (!card) return;
  const videoId = card.getAttribute('data-video-id');
  const videoUrl = card.getAttribute('data-video-url');

  container.innerHTML = `
    <div class="d-flex align-items-center justify-content-center h-100 w-100 bg-black">
      <blockquote class="tiktok-embed" cite="${videoUrl}" data-video-id="${videoId}" style="width: 100%; min-height: 460px; margin: 0 auto;">
        <section><a target="_blank" href="${videoUrl}">Cargando video de TikTok...</a></section>
      </blockquote>
    </div>
  `;

  triggerTikTokScript();
}

window.loadSingleVideo = loadSingleVideo;
