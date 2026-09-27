// ---------- ZONAS DE FRECUENCIA CARDIACA ----------
function calcularZonas() {
  const edad = parseInt(document.getElementById('edad').value);
  const fcMax = 220 - edad;

  const zonas = [
    { nombre: "Zona 1 - Recuperación", min: 0.50, max: 0.60 },
    { nombre: "Zona 2 - Resistencia base", min: 0.60, max: 0.70 },
    { nombre: "Zona 3 - Aeróbica", min: 0.70, max: 0.80 },
    { nombre: "Zona 4 - Umbral", min: 0.80, max: 0.90 },
    { nombre: "Zona 5 - Máxima", min: 0.90, max: 1.00 },
  ];

  let html = `<p>FC máxima estimada (220 - edad): <b>${fcMax} ppm</b></p><ul>`;
  zonas.forEach(z => {
    html += `<li>${z.nombre}: ${Math.round(fcMax*z.min)} - ${Math.round(fcMax*z.max)} ppm</li>`;
  });
  html += `</ul>`;
  document.getElementById('zonas').innerHTML = html;
}

// ---------- GENERADOR DE PLAN SEMANAL ----------
const ejercicios = {
  natacion: {
    resistencia: ["Series 10x100m crol ritmo medio", "800m continuo suave", "Series 4x200m con 30s descanso"],
    fuerza: ["Series con palas 6x50m", "Patada con tabla 8x50m", "Series con pull-buoy 4x100m"],
    perdida: ["Circuito 30min ritmo variable", "Series cortas 20x25m rápido", "Nado continuo 40min suave"]
  },
  ciclismo: {
    resistencia: ["Salida larga 90min ritmo suave", "Series 6x5min umbral", "Rodillo 45min Z2"],
    fuerza: ["Series de cuestas 8x2min", "Salida con desarrollo pesado 40min", "Sprints 10x20s"],
    perdida: ["Salida continua 60min ritmo variable", "HIIT 20min series 1min/1min", "Salida suave 50min"]
  }
};

function generarPlan() {
  const deporte = document.getElementById('deporte').value;
  const objetivo = document.getElementById('objetivo').value;
  const nivel = document.getElementById('nivel').value;
  const dias = parseInt(document.getElementById('dias').value);

  const lista = ejercicios[deporte][objetivo];
  let html = "";

  for (let i = 1; i <= dias; i++) {
    const ejercicio = lista[(i-1) % lista.length];
    html += `<div class="dia"><b>Día ${i}:</b> ${ejercicio} <br><small>Nivel: ${nivel}</small></div>`;
  }

  document.getElementById('plan').innerHTML = html;
  calcularZonas();

  // Guardamos el volumen semanal planeado, para comparar semanas (regla del 10%)
  const semanaActual = dias;
  const historialVolumen = JSON.parse(localStorage.getItem('volumenSemanal')) || [];
  historialVolumen.push(semanaActual);
  localStorage.setItem('volumenSemanal', JSON.stringify(historialVolumen));
  comprobarRiesgoLesion(historialVolumen);
}

// ---------- REGLA DEL 10% (prevención de lesiones) ----------
function comprobarRiesgoLesion(historial) {
  if (historial.length < 2) return;
  const anterior = historial[historial.length - 2];
  const actual = historial[historial.length - 1];
  const incremento = ((actual - anterior) / anterior) * 100;

  const aviso = document.getElementById('avisoLesion');
  if (incremento > 10) {
    aviso.innerText = `⚠️ Has aumentado tu volumen un ${incremento.toFixed(1)}% respecto a la semana anterior. Se recomienda no superar el 10% para evitar lesiones por sobrecarga.`;
  } else {
    aviso.innerText = "";
  }
}

// ---------- REGISTRO DE RPE (ESFUERZO PERCIBIDO) Y GRAFICO ----------
let grafico;

function guardarRPE() {
  const rpe = parseInt(document.getElementById('rpe').value);
  const fecha = new Date().toLocaleDateString();

  const registros = JSON.parse(localStorage.getItem('registrosRPE')) || [];
  registros.push({ fecha, rpe });
  localStorage.setItem('registrosRPE', JSON.stringify(registros));

  dibujarGrafico(registros);
}

function dibujarGrafico(registros) {
  const ctx = document.getElementById('grafico').getContext('2d');
  const labels = registros.map(r => r.fecha);
  const datos = registros.map(r => r.rpe);

  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Esfuerzo percibido (RPE 1-10)',
        data: datos,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56,189,248,0.2)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      scales: { y: { min: 0, max: 10 } }
    }
  });
}

// Al cargar la página, pintamos lo que ya hubiera guardado
window.onload = function() {
  calcularZonas();
  const registros = JSON.parse(localStorage.getItem('registrosRPE')) || [];
  if (registros.length) dibujarGrafico(registros);
};