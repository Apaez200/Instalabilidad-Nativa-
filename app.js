const btnInstalar = document.getElementById('btn-instalar');
const instruccionesIos = document.getElementById('instrucciones-ios');
const estadoInstalacion = document.getElementById('estado-instalacion');
const btnPrepararCamara = document.getElementById('btn-preparar-camara');
const avisoPermiso = document.getElementById('aviso-permiso');
const detalleLente = document.getElementById('detalle-lente');
const btnConfirmarPermiso = document.getElementById('btn-confirmar-permiso');
const visorVideo = document.getElementById('visor-camara');
const estadoCamara = document.getElementById('estado-camara');
const btnAlternarCamara = document.getElementById('btn-alternar-camara');
const btnApagarCamara = document.getElementById('btn-apagar-camara');

let eventoInstalacion = null;
let flujoActivo = null;
let modo = 'environment';

function esIOS() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) ||
    (ua.indexOf('Macintosh') !== -1 && navigator.maxTouchPoints > 1);
}

function estaInstalada() {
  return navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
}

function configurarInstalacion() {
  if (esIOS() && !estaInstalada()) {
    instruccionesIos.hidden = false;
    estadoInstalacion.textContent = 'Sigue los pasos para instalar en iPhone.';
  }
}

window.addEventListener('beforeinstallprompt', function (evento) {
  evento.preventDefault();
  eventoInstalacion = evento;
  btnInstalar.hidden = false;
});

btnInstalar.addEventListener('click', function () {
  Promise.resolve(eventoInstalacion.prompt())
    .then(function () {
      return eventoInstalacion.userChoice;
    })
    .then(function (resultado) {
      if (resultado.outcome === 'accepted') {
        btnInstalar.hidden = true;
        estadoInstalacion.textContent = 'Aplicacion instalada.';
      }
      eventoInstalacion = null;
    })
    .catch(function (error) {
      console.log(error);
    });
});

function detenerCamara() {
  if (flujoActivo) {
    flujoActivo.getTracks().forEach(function (track) {
      track.stop();
    });
    flujoActivo = null;
  }
  visorVideo.srcObject = null;
}

function iniciarCamara() {
  detenerCamara();
  estadoCamara.textContent = 'Encendiendo camara ' +
    (modo === 'user' ? 'frontal' : 'trasera') + '...';

  navigator.mediaDevices.getUserMedia({ video: { facingMode: modo }, audio: false })
    .then(function (flujo) {
      flujoActivo = flujo;
      visorVideo.srcObject = flujo;
      visorVideo.play().catch(function (error) {
        console.log(error);
      });

      estadoCamara.textContent = 'Camara ' +
        (modo === 'user' ? 'frontal' : 'trasera') + ' encendida.';
      btnAlternarCamara.disabled = false;
      btnApagarCamara.disabled = false;
    })
    .catch(function (error) {
      if (error.name === 'NotAllowedError') {
        estadoCamara.textContent = 'Permiso denegado. Activa la camara en el navegador.';
      } else if (error.name === 'NotFoundError') {
        estadoCamara.textContent = 'No se encontro esa camara.';
      } else {
        estadoCamara.textContent = 'No se pudo encender la camara: ' + error.name;
      }
    });
}

btnPrepararCamara.addEventListener('click', function () {
  detalleLente.textContent = 'Se encendera la camara ' +
    (modo === 'user' ? 'frontal' : 'trasera') + '.';
  avisoPermiso.hidden = false;
});

btnConfirmarPermiso.addEventListener('click', function () {
  avisoPermiso.hidden = true;
  iniciarCamara();
});

btnAlternarCamara.addEventListener('click', function () {
  modo = modo === 'environment' ? 'user' : 'environment';
  iniciarCamara();
});

btnApagarCamara.addEventListener('click', function () {
  detenerCamara();
  btnAlternarCamara.disabled = true;
  btnApagarCamara.disabled = true;
  estadoCamara.textContent = 'Camara apagada.';
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(function () {})
    .catch(function (error) {
      console.log(error);
    });
}

configurarInstalacion();
