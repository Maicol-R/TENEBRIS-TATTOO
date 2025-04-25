document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  const modal = document.getElementById('modal');
  const closeModal = document.querySelector('.close');
  const form = document.getElementById('appointmentForm');
  const eventIdInput = document.getElementById('eventId');
  const saveBtn = document.getElementById('saveBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  // Notificaciones
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notificationMessage');
  // Botones y campo de búsqueda ya definidos:
  const eventSearch = document.getElementById('eventSearch');
  const searchBtn = document.getElementById('searchBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  // Funcionalidad de búsqueda
  searchBtn.onclick = function () {
    const term = eventSearch.value.toLowerCase().trim();

    // Recorre todos los eventos del calendario
    calendar.getEvents().forEach(ev => {
      // Primero se restablece la clase original para cada evento
      ev.setProp('classNames', ['event-custom']);
      // Si hay un término y el título del evento no lo incluye...
      if (term && !ev.title.toLowerCase().includes(term)) {
        // Asigna la nueva clase que indica que no coincide
        ev.setProp('classNames', ['filtered-out']);
      }
    });
  };

  // Funcionalidad para limpiar la búsqueda
  clearSearchBtn.onclick = function () {
    eventSearch.value = "";
    calendar.getEvents().forEach(ev => {
      // Se restablece que todos los eventos tengan la clase original
      ev.setProp('classNames', ['event-custom']);
    });
  };


  let selectedDate; // Para crear nuevos eventos.
  let currentEvent = null; // Para identificar el evento en edición.

  // Función para convertir de 24h a 12h.
  function convertTo12Hour(timeStr) {
    const [hourStr, minute] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }

  // Función para mostrar notificaciones automáticamente.
  function showNotification(message) {
    notificationMessage.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 2000);
  }

  // Inicializar FullCalendar.
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    selectable: true,
    editable: true, // Permite arrastrar y soltar para reprogramar.
    displayEventTime: false,
    eventDidMount: function (info) {
      // Inicializar tooltip usando Bootstrap: muestra la descripción (por ejemplo, el teléfono).
      new bootstrap.Tooltip(info.el, {
        title: info.event.extendedProps.description || '',
        placement: 'top',
        trigger: 'hover'
      });
    },
    select: function (info) {
      // Modo creación: guardar la fecha seleccionada y reiniciar el modal.
      selectedDate = info.start;
      currentEvent = null;
      form.reset();
      eventIdInput.value = "";
      saveBtn.textContent = "Guardar Cita";
      deleteBtn.style.display = "none";
      modal.style.display = "block";
    },
    eventClick: function (info) {
      // Modo edición: carga los datos del evento en el formulario.
      currentEvent = info.event;
      eventIdInput.value = currentEvent.id;
      // Suponiendo que el título tiene el formato "Nombre - hora"  
      let titleParts = currentEvent.title.split(" - ");
      document.getElementById('name').value = titleParts[0];
      // Obtener la hora desde el objeto Date y formatearla a HH:MM
      let eventDate = new Date(currentEvent.start);
      let hh = eventDate.getHours().toString().padStart(2, '0');
      let mm = eventDate.getMinutes().toString().padStart(2, '0');
      document.getElementById('hora').value = `${hh}:${mm}`;
      // Extraer teléfono de la descripción (asumiendo formato "Teléfono: xxxx")
      let desc = currentEvent.extendedProps.description || "";
      let tel = desc.replace("Teléfono: ", "");
      document.getElementById('telefono').value = tel;

      saveBtn.textContent = "Guardar cambios";
      deleteBtn.style.display = "inline-block";
      modal.style.display = "block";
    }
  });

  calendar.render();

  // Manejar el envío del formulario (creación o edición).
  form.onsubmit = function (event) {
    event.preventDefault();

    const nombre = document.getElementById('name').value;
    const hora = document.getElementById('hora').value;
    const telefono = document.getElementById('telefono').value;
    const formattedTime = convertTo12Hour(hora);
    const [h, m] = hora.split(':');

    // En modo creación, usamos la fecha seleccionada almacenada.
    // En modo edición, usamos la fecha del evento actual.
    let baseDate = currentEvent ? new Date(currentEvent.start) : new Date(selectedDate);
    baseDate.setHours(parseInt(h), parseInt(m), 0, 0);

    if (currentEvent) {
      // Modo edición: actualizar el evento.
      currentEvent.setProp('title', `${nombre} - ${formattedTime}`);
      currentEvent.setStart(baseDate);
      currentEvent.setExtendedProp('description', `Teléfono: ${telefono}`);
      showNotification(`Cita actualizada: ${nombre} - ${formattedTime}`);
    } else {
      // Modo creación. Opcional: verificar duplicados.
      const duplicado = calendar.getEvents().find(ev => ev.start.getTime() === baseDate.getTime());
      if (duplicado) {
        showNotification(`La hora ${formattedTime} ya está registrada.`);
        return;
      }
      calendar.addEvent({
        title: `${nombre} - ${formattedTime}`,
        start: baseDate,
        description: `Teléfono: ${telefono}`,
        className: 'event-custom'
      });
      showNotification(`Cita registrada: ${nombre} - ${formattedTime}`);
    }

    modal.style.display = "none";
    form.reset();
    currentEvent = null;
  };

  // Manejar botón de eliminar en modo edición.
  deleteBtn.onclick = function () {
    if (currentEvent && confirm("¿Está seguro de eliminar la cita?")) {
      currentEvent.remove();
      modal.style.display = "none";
      form.reset();
      showNotification("Cita eliminada");
      currentEvent = null;
    }
  };

  // Cerrar el modal al hacer clic en la "X"
  closeModal.onclick = function () {
    modal.style.display = "none";
    form.reset();
    currentEvent = null;
  };

  // Funcionalidad de búsqueda: resaltar eventos cuyo título incluya el término buscado.
  searchBtn.onclick = function () {
    const term = eventSearch.value.toLowerCase().trim();
    calendar.getEvents().forEach(ev => {
      // Removemos la clase de resaltado por defecto.
      ev.setProp('classNames', ['event-custom']);
      if (term && !ev.title.toLowerCase().includes(term)) {
        // Si no coincide, podemos cambiar su opacidad (o alguna otra forma de ocultar resaltado).
        ev.setProp('classNames', ['filtered-out']);
      }
    });
  };

  clearSearchBtn.onclick = function () {
    eventSearch.value = "";
    calendar.getEvents().forEach(ev => {
      ev.setProp('classNames', ['event-custom']);
    });
  };
});

// Seleccionar el botón
const backToTopButton = document.getElementById('back-to-top');

// Mostrar el botón al hacer scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) { // Aparece después de 300px de scroll
        backToTopButton.classList.add('show');
    } else {
        backToTopButton.classList.remove('show');
    }
});
