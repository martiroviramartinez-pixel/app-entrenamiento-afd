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

// ---------- EJERCICIOS POR DEPORTE ----------
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
  },
  correr: {
    resistencia: ["Rodaje continuo 40min ritmo suave", "Series 6x800m ritmo medio, 2min descanso", "Tirada larga 60min progresiva"],
    fuerza: ["Cuestas 8x100m explosivas", "Series de 400m con recuperación activa", "Circuito de fuerza + carrera 30min"],
    perdida: ["Carrera continua 35min ritmo moderado", "HIIT 20min (1min fuerte / 1min suave)", "Rodaje suave 45min"]
  },
  caminar: {
    resistencia: ["Caminata continua 50min ritmo constante", "Caminata a paso ligero 40min", "Ruta larga 70min ritmo suave"],
    fuerza: ["Caminata con cuestas 30min", "Caminata con peso ligero 35min", "Intervalos rápido/lento 30min"],
    perdida: ["Caminata rápida 45min", "Caminata interválica 30min (3min rápido/2min suave)", "Ruta variada 50min"]
  }
};

// ---------- PLANIFICACIÓN ADAPTATIVA ----------
const nivelesOrden = ['principiante', 'intermedio', 'avanzado'];

function calcularAjusteAutomatico(nivelSeleccionado) {
  const registros = JSON.parse(localStorage.getItem('registrosRPE')) || [];
  const hace7dias = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recientes = registros.filter(r => (r.ts || 0) >= hace7dias);

  let nivelFinal = nivelSeleccionado;
  let mensajes = [];

  if (recientes.length >= 3) {
    const media = recientes.reduce((a, b) => a + b.rpe, 0) / recientes.length;
    let idx = nivelesOrden.indexOf(nivelSeleccionado);

    if (media >= 8 && idx > 0) {
      idx--;
      nivelFinal = nivelesOrden[idx];
      mensajes.push(`Tu esfuerzo medio la última semana fue muy alto (${media.toFixed(1)}/10). He bajado el nivel a "${nivelFinal}" para meter una semana de descarga.`);
    } else if (media <= 4 && idx < nivelesOrden.length - 1) {
      idx++;
      nivelFinal = nivelesOrden[idx];
      mensajes.push(`Tu esfuerzo medio la última semana fue bajo (${media.toFixed(1)}/10). He subido el nivel a "${nivelFinal}" para seguir progresando.`);
    } else {
      mensajes.push(`Tu esfuerzo medio la última semana (${media.toFixed(1)}/10) está en un rango adecuado. Mantengo el nivel "${nivelFinal}".`);
    }
  } else {
    mensajes.push(`Todavía no tengo suficientes registros de esfuerzo (necesito al menos 3) para ajustar el nivel automáticamente. Uso el nivel seleccionado: "${nivelFinal}".`);
  }

  const gruposBase = ['brazos', 'torso', 'core', 'piernas', 'gemelos'];
  const conteoZonas = { brazos: 0, torso: 0, core: 0, piernas: 0, gemelos: 0 };
  recientes.forEach(r => {
    if (r.zona === 'completo') {
      gruposBase.forEach(z => conteoZonas[z]++);
    } else if (conteoZonas.hasOwnProperty(r.zona)) {
      conteoZonas[r.zona]++;
    }
  });

  if (recientes.length >= 3) {
    const zonaMinima = gruposBase.reduce((min, z) => conteoZonas[z] < conteoZonas[min] ? z : min, gruposBase[0]);
    if (conteoZonas[zonaMinima] === 0) {
      const nombres = { brazos: 'brazos', torso: 'torso/pecho', core: 'core/abdomen', piernas: 'piernas', gemelos: 'gemelos' };
      mensajes.push(`Llevas toda la semana sin trabajar ${nombres[zonaMinima]}. Inclúyelo en tu próxima sesión.`);
    }
  }

  return { nivelFinal, mensajes };
}

function generarPlan() {
  const deporte = document.getElementById('deporte').value;
  const objetivo = document.getElementById('objetivo').value;
  const nivelSeleccionado = document.getElementById('nivel').value;
  const dias = parseInt(document.getElementById('dias').value);

  const { nivelFinal, mensajes } = calcularAjusteAutomatico(nivelSeleccionado);

  const lista = ejercicios[deporte][objetivo];
  let html = "";
  for (let i = 1; i <= dias; i++) {
    const ejercicio = lista[(i-1) % lista.length];
    html += `<div class="dia"><b>Día ${i}:</b> ${ejercicio} <br><small>Nivel: ${nivelFinal}</small></div>`;
  }
  document.getElementById('plan').innerHTML = html;
  document.getElementById('ajustePlan').innerHTML =
    `<div class="dia">🔄 <b>Ajuste automático:</b><ul>${mensajes.map(m => `<li>${m}</li>`).join('')}</ul></div>`;

  calcularZonas();

  const historialVolumen = JSON.parse(localStorage.getItem('volumenSemanal')) || [];
  historialVolumen.push(dias);
  localStorage.setItem('volumenSemanal', JSON.stringify(historialVolumen));
  comprobarRiesgoLesion(historialVolumen);

  const historialPlanes = JSON.parse(localStorage.getItem('historialPlanes')) || [];
  historialPlanes.push({ fecha: new Date().toLocaleDateString(), deporte, objetivo, nivelSeleccionado, nivelFinal, dias });
  localStorage.setItem('historialPlanes', JSON.stringify(historialPlanes));
}

// ---------- REGLA DEL 10% ----------
function comprobarRiesgoLesion(historial) {
  if (historial.length < 2) return;
  const anterior = historial[historial.length - 2];
  const actual = historial[historial.length - 1];
  const incremento = ((actual - anterior) / anterior) * 100;
  const aviso = document.getElementById('avisoLesion');
  if (incremento > 10) {
    aviso.innerText = `⚠️ Has aumentado tu volumen un ${incremento.toFixed(1)}% respecto a la semana anterior. Se recomienda no superar el 10% para evitar lesiones.`;
  } else {
    aviso.innerText = "";
  }
}

// ---------- REGISTRO DE RPE Y GRAFICO ----------
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
    options: { scales: { y: { min: 0, max: 10 } } }
  });
}

// ---------- ENTRENADOR IA ----------
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
  if (media >= 8) mensajes.push("Tu esfuerzo medio es muy alto (≥8/10). Cuidado con el sobreentrenamiento.");
  else if (media <= 3) mensajes.push("Tu esfuerzo medio es bajo (≤3/10). Podrías subir algo la intensidad.");
  else mensajes.push("Tu esfuerzo medio está en un rango saludable.");

  if (tendencia === "subiendo") mensajes.push("Tu esfuerzo percibido está subiendo. Vigila la fatiga acumulada.");
  else if (tendencia === "bajando") mensajes.push("Tu esfuerzo percibido está bajando: buena señal de adaptación.");

  if (historialVolumen.length >= 2) {
    const anterior = historialVolumen[historialVolumen.length - 2];
    const actual = historialVolumen[historialVolumen.length - 1];
    const incremento = ((actual - anterior) / anterior) * 100;
    if (incremento > 10) mensajes.push(`Has subido el volumen semanal un ${incremento.toFixed(1)}%, por encima del 10% recomendado.`);
  }

  const consejosObjetivo = {
    resistencia: "Para resistencia: prioriza sesiones largas en Zona 2 y no descuides el descanso.",
    fuerza: "Para fuerza: deja al menos 48h de descanso entre sesiones del mismo grupo muscular.",
    perdida: "Para pérdida de peso: combina sesiones continuas moderadas con alguna de alta intensidad."
  };
  mensajes.push(consejosObjetivo[objetivo]);

  caja.innerHTML = `<div class="dia">🤖 <b>Consejo del entrenador:</b><ul>${mensajes.map(m => `<li>${m}</li>`).join('')}</ul></div>`;
}

// ---------- NUTRICIÓN ----------
function calcularCalorias() {
  const peso = parseFloat(document.getElementById('peso').value);
  const altura = parseFloat(document.getElementById('altura').value);
  const edad = parseInt(document.getElementById('edad').value);
  const sexo = document.getElementById('sexo').value;
  const actividad = parseFloat(document.getElementById('actividad').value);
  const objetivo = document.getElementById('objetivo').value;

  let bmr;
  if (sexo === 'hombre') {
    bmr = 10 * peso + 6.25 * altura - 5 * edad + 5;
  } else {
    bmr = 10 * peso + 6.25 * altura - 5 * edad - 161;
  }
  const tdee = bmr * actividad;

  let objetivoCal = tdee;
  let nota = "Mantenimiento";
  if (objetivo === 'perdida') { objetivoCal = tdee - 500; nota = "Déficit calórico para pérdida de peso"; }
  else if (objetivo === 'fuerza') { objetivoCal = tdee + 250; nota = "Ligero superávit para ganancia muscular"; }

  localStorage.setItem('objetivoCalorico', Math.round(objetivoCal));

  document.getElementById('resultadoCalorias').innerHTML = `
    <div class="dia">
      <p>Metabolismo basal (BMR, fórmula Mifflin-St Jeor): <b>${Math.round(bmr)} kcal</b></p>
      <p>Gasto calórico total diario (TDEE): <b>${Math.round(tdee)} kcal</b></p>
      <p>${nota}: <b>${Math.round(objetivoCal)} kcal/día</b></p>
    </div>`;
  actualizarResumenDia();
}

function anadirCalorias() {
  const valor = parseInt(document.getElementById('caloriasInput').value);
  if (!valor) return;
  const hoy = new Date().toLocaleDateString();
  let registro = JSON.parse(localStorage.getItem('caloriasHoy')) || { fecha: hoy, total: 0 };
  if (registro.fecha !== hoy) { registro = { fecha: hoy, total: 0 }; }
  registro.total += valor;
  localStorage.setItem('caloriasHoy', JSON.stringify(registro));
  document.getElementById('caloriasInput').value = '';
  actualizarResumenDia();
}

function actualizarResumenDia() {
  const hoy = new Date().toLocaleDateString();
  const registro = JSON.parse(localStorage.getItem('caloriasHoy')) || { fecha: hoy, total: 0 };
  const objetivo = parseInt(localStorage.getItem('objetivoCalorico')) || null;

  let html = `<p>Consumidas hoy: <b>${registro.total} kcal</b></p>`;
  if (objetivo) {
    const restante = objetivo - registro.total;
    html += restante >= 0
      ? `<p>Objetivo diario: <b>${objetivo} kcal</b> — te quedan <b>${restante} kcal</b></p>`
      : `<p>Objetivo diario: <b>${objetivo} kcal</b> — has superado el objetivo en <b>${Math.abs(restante)} kcal</b></p>`;
  } else {
    html += `<p><small>Calcula antes tus necesidades calóricas para ver tu objetivo diario.</small></p>`;
  }
  document.getElementById('resumenDia').innerHTML = html;
}

// ---------- MODAL / OFERTA PRO (simulación, no cobra dinero real) ----------
function abrirModalPro() {
  document.getElementById('modalPro').style.display = 'flex';
}

function cerrarModalPro() {
  document.getElementById('modalPro').style.display = 'none';
  setTimeout(() => {
    if (localStorage.getItem('esPro') !== 'true') {
      document.getElementById('bannerOferta').style.display = 'flex';
    }
  }, 15000);
}

function cerrarBanner() {
  document.getElementById('bannerOferta').style.display = 'none';
}

function comprarPro() {
  localStorage.setItem('esPro', 'true');
  document.getElementById('modalPro').style.display = 'none';
  document.getElementById('bannerOferta').style.display = 'none';
  alert('✅ ¡Ya eres PRO! (Simulación para el proyecto — no se ha procesado ningún pago real)');
}

// ---------- AL CARGAR LA PÁGINA ----------
window.onload = function() {
  calcularZonas();
  const registros = JSON.parse(localStorage.getItem('registrosRPE')) || [];
  if (registros.length) dibujarGrafico(registros);
  actualizarResumenDia();

  setTimeout(() => {
    if (localStorage.getItem('esPro') !== 'true' && localStorage.getItem('modalVisto') !== 'true') {
      abrirModalPro();
      localStorage.setItem('modalVisto', 'true');
    }
  }, 20000);
};