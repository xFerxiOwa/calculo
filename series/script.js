let chart;
function calcular(){
    let f = document.getElementById("funcion").value.trim();
    
    // Validamos que la función no esté vacía
    if (!f) {
        alert("Por favor, ingresa un término general.");
        return;
    }

    try {
        let expr = math.compile(f);
        let sumaParcial = 0;
        let historial = []; // Esta es la variable correcta
        let nValores = []; 

        for(let n = 1; n <= 1000; n++){
            let valorTermino = expr.evaluate({n: n});
            sumaParcial += valorTermino; 
        
            nValores.push(n);
            // CORRECCIÓN: Usar 'historial' en lugar de 'historialSumas'
            historial.push(sumaParcial); 
        }

        document.getElementById("area").innerHTML = `\\[ S_{1000} = ${sumaParcial.toFixed(5)} \\]`;
        document.getElementById("pasos").innerHTML = generarPasos(f);
        
        MathJax.typesetPromise(); 
        
        // Llamamos a la función de gráfica con la variable correcta
        graficarSerie(nValores, historial);

    } catch (error) {
        alert("Error en el cálculo: " + error.message);
    }
}

//FUNCION 2 GENERAR PASOS DE LA SUMA DE RIEMMAN
function generarPasos(funcion) {
    let pasos = "";
    
    // 1. Regex para cada tipo
    let regexGeo = /(\d*)\*?\(?([\d.]+)\)?\^n/;
    let regexP = /1\/n\^?([\d.]*)/;
    let regexTele = /1\/\(n\*\(n\+1\)\)/; // Detecta específicamente 1/(n*(n+1))

    let matchGeo = funcion.match(regexGeo);
    let matchP = funcion.match(regexP);
    let matchTele = funcion.match(regexTele);

    if (matchGeo) {
        let r = parseFloat(matchGeo[2]);
        let a = matchGeo[1] ? parseFloat(matchGeo[1]) : 1;
        pasos += `\\[ \\text{Serie Geométrica: } r = ${r} \\]`;
        if (Math.abs(r) < 1) {
            let sumaInf = a * r / (1 - r);
            pasos += `\\[ \\text{Converge: } |r| < 1. \\text{ Suma: } ${sumaInf.toFixed(4)} \\]`;
        } else {
            pasos += `\\[ \\text{Diverge: } |r| \\geq 1 \\]`;
        }
    } 
    else if (matchP) {
        let p = matchP[1] ? parseFloat(matchP[1]) : 1;
        pasos += `\\[ \\text{Serie P / Armónica: } p = ${p} \\]`;
        if (p > 1) {
            pasos += `\\[ \\text{Converge: } p > 1 \\]`;
        } else {
            pasos += `\\[ \\text{Diverge: } p \\leq 1 \\]`;
        }
    } 
    else if (matchTele) {
        pasos += `\\[ \\text{Serie Telescópica detectada} \\]`;
        pasos += `\\[ \\text{Forma: } \\sum \\left( \\frac{1}{n} - \frac{1}{n+1} \\right) \\]`;
        pasos += `\\[ \\text{Estado: Converge a 1 (si inicia en n=1)} \\]`;
    }
    else {
        pasos += `\\[ \\text{Criterio: Prueba del enésimo término} \\]`;
        // Intento de evaluar el límite simple
        let limite = math.evaluate(funcion.replace(/n/g, "1000000"));
        if (Math.abs(limite) > 0.0001) {
            pasos += `\\[ \\lim_{n \\to \\infty} a_n \\neq 0 \\implies \\text{Diverge} \\]`;
        } else {
            pasos += `\\[ \\text{El límite es 0, se requieren otros criterios.} \\]`;
        }
    }
    return pasos;
}


function graficarSerie(nValores, historial) {
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(document.getElementById("grafica"), {
        type: 'line',
        data: {
            labels: nValores,
            datasets: [{
                label: 'Suma Acumulada (Sn)',
                data: historial,
                borderColor: '#00e5ff',
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                fill: true,
                pointRadius: 1, // Puntos pequeños para 1000 datos
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { 
                    title: { display: true, text: 'n (términos)', color: 'white' },
                    ticks: { color: 'white', maxTicksLimit: 10 } 
                },
                y: { 
                    title: { display: true, text: 'Valor de la Suma', color: 'white' },
                    ticks: { color: 'white' } 
                }
            },
            plugins: {
                legend: { labels: { color: 'white' } }
            }
        }
    });
}