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
  const zona = document.getElementById('zonaTrabajada').value;
  const fecha = new Date().toLocaleDateString();
  const ts = Date.now();

  const registros = JSON.parse(localStorage.getItem('registrosRPE')) || [];
  registros.push({ fecha, rpe, zona, ts });
  localStorage.setItem('registrosRPE', JSON.stringify(registros));

  dibujarGrafico(registros);
  actualizarMapaCorporal(registros);
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
  actualizarMapaCorporal(registros);
};
// ---------- ENTRENADOR IA (sistema experto basado en reglas) ----------
function entrenadorIA() {
  const registros = JSON.parse(localStorage.getItem('registrosRPE')) || [];
  const historialVolumen = JSON.parse(localStorage.getItem('volumenSemanal')) || [];
  const objetivo = document.getElementById('objetivo').value;
  const caja = document.getElementById('consejoIA');

  if (registros.length < 3) {
    caja.innerHTML = `<div class="dia">🤖 Necesito al menos 3 registros de esfuerzo guardados para poder analizarte bien. ¡Sigue registrando tus sesiones en el apartado 4!</div>`;
    return;
  }

  const media = registros.reduce((a, b) => a + b.rpe, 0) / registros.length;

  const ultimos = registros.slice(-3).map(r => r.rpe);
  const anteriores = registros.slice(-6, -3).map(r => r.rpe);
  let tendencia = "estable";
  if (anteriores.length) {
    const mediaUltimos = ultimos.reduce((a, b) => a + b, 0) / ultimos.length;
    const mediaAnteriores = anteriores.reduce((a, b) => a + b, 0) / anteriores.length;
    if (mediaUltimos - mediaAnteriores > 1) tendencia = "subiendo";
    else if (mediaAnteriores - mediaUltimos > 1) tendencia = "bajando";
  }

  let mensajes = [];

  if (media >= 8) {
    mensajes.push("Tu esfuerzo medio es muy alto (≥8/10). Cuidado con el sobreentrenamiento: intercala alguna sesión más suave.");
  } else if (media <= 3) {
    mensajes.push("Tu esfuerzo medio es bajo (≤3/10). Si tu objetivo lo permite, podrías subir algo la intensidad para seguir progresando.");
  } else {
    mensajes.push("Tu esfuerzo medio está en un rango saludable, ni demasiado alto ni demasiado bajo.");
  }

  if (tendencia === "subiendo") {
    mensajes.push("Tu esfuerzo percibido está subiendo en las últimas sesiones. Puede ser buena señal de progreso, pero vigila la fatiga acumulada.");
  } else if (tendencia === "bajando") {
    mensajes.push("Tu esfuerzo percibido está bajando: puede indicar que te estás adaptando bien (¡mejora de forma!) o que te falta estímulo.");
  }

  if (historialVolumen.length >= 2) {
    const anterior = historialVolumen[historialVolumen.length - 2];
    const actual = historialVolumen[historialVolumen.length - 1];
    const incremento = ((actual - anterior) / anterior) * 100;
    if (incremento > 10) {
      mensajes.push(`Has subido el volumen semanal un ${incremento.toFixed(1)}%, por encima del 10% recomendado. Riesgo de sobrecarga.`);
    }
  }

  const consejosObjetivo = {
    resistencia: "Para resistencia: prioriza sesiones largas en Zona 2 y no descuides el descanso entre series intensas.",
    fuerza: "Para fuerza: deja al menos 48h de descanso entre sesiones que trabajen el mismo grupo muscular.",
    perdida: "Para pérdida de peso: combina sesiones continuas moderadas con alguna de alta intensidad (HIIT), y cuida la alimentación."
  };
  mensajes.push(consejosObjetivo[objetivo]);

  caja.innerHTML = `<div class="dia">🤖 <b>Consejo del entrenador:</b><ul>${mensajes.map(m => `<li>${m}</li>`).join('')}</ul></div>`;
}
// ---------- MAPA CORPORAL ----------
function colorPorNivel(count) {
  if (count === 0) return '#334155';
  if (count === 1) return '#0ea5e9';
  if (count <= 3) return '#0284c7';
  return '#f97316';
}

function actualizarMapaCorporal(registros) {
  const hace7dias = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recientes = registros.filter(r => (r.ts || 0) >= hace7dias);

  const conteo = { brazos: 0, torso: 0, core: 0, piernas: 0, gemelos: 0 };

  recientes.forEach(r => {
    if (r.zona === 'completo') {
      conteo.brazos++; conteo.torso++; conteo.core++; conteo.piernas++; conteo.gemelos++;
    } else if (conteo.hasOwnProperty(r.zona)) {
      conteo[r.zona]++;
    }
  });

  const pares = {
    brazos: ['zona-brazos-izq', 'zona-brazos-der'],
    torso: ['zona-torso'],
    core: ['zona-core-rect'],
    piernas: ['zona-piernas-izq', 'zona-piernas-der'],
    gemelos: ['zona-gemelos-izq', 'zona-gemelos-der']
  };

  Object.keys(pares).forEach(zona => {
    const color = colorPorNivel(conteo[zona]);
    pares[zona].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('fill', color);
    });
  });
}