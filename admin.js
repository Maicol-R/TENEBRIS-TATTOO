// ==========================================
// Tenebris Tattoo - Lógica del Panel de Administración (admin.js)
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
  const ADMIN_PIN = '1234'; // Clave por defecto
  const STORAGE_KEY_CITAS = 'tenebris_tattoo_citas_v1';
  const STORAGE_KEY_CUSTOM_PHOTOS = 'tenebris_custom_photos_v1';
  const STORAGE_KEY_CUSTOM_VIDEOS = 'tenebris_custom_videos_v1';

  // Elementos del DOM
  const loginScreen = document.getElementById('loginScreen');
  const dashboardScreen = document.getElementById('dashboardScreen');
  const loginForm = document.getElementById('loginForm');
  const adminPinInput = document.getElementById('adminPin');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!loginForm) return;

  // 1. Manejo de Inicio de Sesión
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (adminPinInput.value.trim() === ADMIN_PIN) {
      sessionStorage.setItem('tenebris_admin_auth', 'true');
      showDashboard();
      showAdminToast('¡Bienvenido al Panel de Administración!');
    } else {
      alert('Contraseña incorrecta. Por favor intenta de nuevo.');
      adminPinInput.value = '';
      adminPinInput.focus();
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      sessionStorage.removeItem('tenebris_admin_auth');
      loginScreen.style.display = 'block';
      dashboardScreen.style.display = 'none';
      logoutBtn.style.display = 'none';
      adminPinInput.value = '';
    });
  }

  // Auto-login si la sesión está activa
  if (sessionStorage.getItem('tenebris_admin_auth') === 'true') {
    showDashboard();
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    renderAdminCitas();
    renderAdminPhotos();
    renderAdminVideos();
  }

  function showAdminToast(msg) {
    const toast = document.getElementById('adminToast');
    const toastMsg = document.getElementById('adminToastMessage');
    if (toast && toastMsg) {
      toastMsg.textContent = msg;
      toast.style.display = 'block';
      setTimeout(() => toast.style.display = 'none', 3000);
    }
  }

  // ==========================================
  // GESTIÓN DE CITAS
  // ==========================================
  function getStoredCitas() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CITAS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function renderAdminCitas() {
    const citas = getStoredCitas();
    const container = document.getElementById('citasListContainer');
    const statCitas = document.getElementById('statCitasCount');
    if (statCitas) statCitas.textContent = citas.length;

    if (!container) return;

    if (citas.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="fas fa-calendar-times fs-2 mb-2"></i>
          <p>No hay citas agendadas actualmente.</p>
        </div>
      `;
      return;
    }

    // Ordenar por fecha ascendente
    citas.sort((a, b) => new Date(a.start) - new Date(b.start));

    container.innerHTML = citas.map((cita, idx) => {
      const fecha = new Date(cita.start).toLocaleDateString('es-ES', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      });
      const telLimpio = (cita.description || '').replace('Teléfono: ', '').trim();
      const idea = cita.idea ? `<br><small class="text-warning">Idea: ${cita.idea}</small>` : '';

      return `
        <div class="admin-item-row flex-column flex-md-row gap-2">
          <div>
            <strong class="text-white fs-6">${cita.title}</strong>
            <div class="text-muted small">
              <i class="fas fa-calendar-day me-1"></i> ${fecha} | 
              <i class="fas fa-phone me-1"></i> ${telLimpio || 'No registrado'}
              ${idea}
            </div>
          </div>

          <div class="d-flex gap-2 align-self-end align-self-md-center">
            ${telLimpio ? `
              <a href="https://api.whatsapp.com/send?phone=57${telLimpio}&text=Hola%20${encodeURIComponent(cita.title.split(' - ')[0])},%20te%20escribimos%20de%20Tenebris%20Tattoo%20para%20confirmar%20tu%20cita." target="_blank" class="btn btn-sm btn-whatsapp-action">
                <i class="fab fa-whatsapp"></i> WhatsApp
              </a>
            ` : ''}
            <button class="btn btn-sm btn-outline-danger" onclick="deleteCita('${cita.id || idx}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.renderAdminCitas = renderAdminCitas;

  window.deleteCita = function (id) {
    if (!confirm('¿Deseas eliminar esta cita?')) return;
    let citas = getStoredCitas();
    citas = citas.filter((c, idx) => (c.id ? c.id !== id : idx.toString() !== id));
    localStorage.setItem(STORAGE_KEY_CITAS, JSON.stringify(citas));
    renderAdminCitas();
    showAdminToast('Cita eliminada correctamente');
  };

  // ==========================================
  // GESTIÓN DE FOTOS
  // ==========================================
  function getCustomPhotos() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CUSTOM_PHOTOS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  const uploadPhotoForm = document.getElementById('uploadPhotoForm');
  if (uploadPhotoForm) {
    uploadPhotoForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const fileInput = document.getElementById('photoFileInput');
      const title = document.getElementById('photoTitleInput').value.trim();
      const category = document.getElementById('photoCategorySelect').value;

      if (!fileInput.files || fileInput.files.length === 0) return;

      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = function (event) {
        const base64Image = event.target.result;
        const newPhoto = {
          id: 'photo-' + Date.now(),
          title: title,
          category: category,
          src: base64Image,
          date: new Date().toLocaleDateString('es-ES')
        };

        const photos = getCustomPhotos();
        photos.unshift(newPhoto);
        localStorage.setItem(STORAGE_KEY_CUSTOM_PHOTOS, JSON.stringify(photos));

        uploadPhotoForm.reset();
        renderAdminPhotos();
        showAdminToast('¡Tatuaje publicado en la galería con éxito!');
      };

      reader.readAsDataURL(file);
    });
  }

  function renderAdminPhotos() {
    const photos = getCustomPhotos();
    const container = document.getElementById('galleryListContainer');
    const statFotos = document.getElementById('statFotosCount');
    const countDisplay = document.getElementById('photoCountDisplay');

    if (statFotos) statFotos.textContent = photos.length + 13;
    if (countDisplay) countDisplay.textContent = photos.length + ' fotos personalizadas (+13 base)';

    if (!container) return;

    if (photos.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          <p>Se están mostrando las 13 fotos oficiales de la galería inicial.</p>
          <small>Usa el formulario de la izquierda para subir tus nuevos trabajos.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = photos.map(photo => `
      <div class="admin-item-row">
        <div class="d-flex align-items-center gap-3">
          <img src="${photo.src}" class="admin-thumb-preview" alt="${photo.title}">
          <div>
            <strong class="text-white d-block">${photo.title}</strong>
            <span class="badge bg-secondary text-uppercase small">${photo.category}</span>
            <small class="text-muted d-block">${photo.date || 'Subida reciente'}</small>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomPhoto('${photo.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
  }

  window.deleteCustomPhoto = function (id) {
    if (!confirm('¿Deseas eliminar esta foto de la galería?')) return;
    let photos = getCustomPhotos().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY_CUSTOM_PHOTOS, JSON.stringify(photos));
    renderAdminPhotos();
    showAdminToast('Foto eliminada');
  };

  // ==========================================
  // GESTIÓN DE VIDEOS DE TIKTOK
  // ==========================================
  function getCustomVideos() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CUSTOM_VIDEOS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  const addVideoForm = document.getElementById('addVideoForm');
  if (addVideoForm) {
    addVideoForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const url = document.getElementById('videoUrlInput').value.trim();
      const title = document.getElementById('videoTitleInput').value.trim();
      const tags = document.getElementById('videoTagsInput').value.trim();

      const idMatch = url.match(/video\/(\d+)/);
      const videoId = idMatch ? idMatch[1] : ('vid-' + Date.now());

      const newVideo = {
        id: videoId,
        url: url,
        title: title,
        tags: tags || '#tattoo #tenebristattoo',
        date: new Date().toLocaleDateString('es-ES')
      };

      const videos = getCustomVideos();
      videos.unshift(newVideo);
      localStorage.setItem(STORAGE_KEY_CUSTOM_VIDEOS, JSON.stringify(videos));

      addVideoForm.reset();
      renderAdminVideos();
      showAdminToast('¡Video de TikTok agregado exitosamente!');
    });
  }

  function renderAdminVideos() {
    const videos = getCustomVideos();
    const container = document.getElementById('videoListContainer');
    const statVideos = document.getElementById('statVideosCount');
    const countDisplay = document.getElementById('videoCountDisplay');

    if (statVideos) statVideos.textContent = videos.length + 6;
    if (countDisplay) countDisplay.textContent = videos.length + ' videos adicionales (+6 base)';

    if (!container) return;

    if (videos.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          <p>Se están mostrando los 6 videos oficiales iniciales.</p>
          <small>Pega el enlace de cualquier nuevo TikTok a la izquierda para agregarlo.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = videos.map(video => `
      <div class="admin-item-row">
        <div>
          <strong class="text-white d-block">${video.title}</strong>
          <small class="text-muted"><i class="fab fa-tiktok text-warning me-1"></i> ID: ${video.id}</small>
        </div>
        <div class="d-flex gap-2">
          <a href="${video.url}" target="_blank" class="btn btn-sm btn-outline-info">
            <i class="fas fa-external-link-alt"></i>
          </a>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomVideo('${video.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  window.deleteCustomVideo = function (id) {
    if (!confirm('¿Deseas eliminar este video?')) return;
    let videos = getCustomVideos().filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEY_CUSTOM_VIDEOS, JSON.stringify(videos));
    renderAdminVideos();
    showAdminToast('Video eliminado');
  };
});

