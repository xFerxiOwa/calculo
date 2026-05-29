const limiteInferior = document.getElementById('limiteInferior');
const limiteSuperior = document.getElementById('limiteSuperior');
const integrando = document.getElementById('integrando');

const integralRender = document.getElementById('integralRender');
const analizar = document.getElementById('analizar');
const pasos = document.getElementById('pasos');
const resumen = document.getElementById('resumen');

let campoActivo = integrando;

/* =========================================================
   CONFIGURACIÓN GENERAL
   ========================================================= */

function latexCampo(campo) {
    return campo.value.trim();
}

function renderizarMathJax() {
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetClear();
        MathJax.typesetPromise();
    }
}

function prepararCampos() {
    const campos = [limiteInferior, limiteSuperior, integrando];

    campos.forEach(campo => {
        campo.addEventListener('focusin', () => {
            campoActivo = campo;
        });

        campo.addEventListener('input', actualizarVistaIntegral);
    });

    document.querySelectorAll('[data-insert]').forEach(boton => {
        boton.addEventListener('click', () => {
            campoActivo.focus();

            campoActivo.executeCommand([
                'insert',
                boton.dataset.insert
            ]);

            actualizarVistaIntegral();
        });
    });

    document.getElementById('borrarCampo').addEventListener('click', () => {
        campoActivo.value = '';
        campoActivo.focus();
        actualizarVistaIntegral();
    });
}

function actualizarVistaIntegral() {
    const inferior = latexCampo(limiteInferior) || '?';
    const superior = latexCampo(limiteSuperior) || '?';
    const f = latexCampo(integrando) || 'f(x)';

    integralRender.innerHTML =
        `\\[
            I=\\int_{${inferior}}^{${superior}} ${f}\\,dx
        \\]`;

    renderizarMathJax();
}

/* =========================================================
   NORMALIZACIÓN DE LA ENTRADA DE MATHLIVE
   ========================================================= */

function normalizar(latex) {
    return latex
        .replaceAll('\\left', '')
        .replaceAll('\\right', '')
        .replaceAll('\\,', '')
        .replaceAll('\\!', '')
        .replaceAll('\\displaystyle', '')
        .replaceAll(' ', '')
        .replaceAll('−', '-')
        .replaceAll('\\cdot', '')
        .replaceAll('\\operatorname{ln}', '\\ln')
        .replaceAll('\\mathrm{e}', 'e')
        .replace(/\^\{(-?\d+(?:\.\d+)?)\}/g, '^$1')
        .replace(/e\^\{x\}/g, 'e^x')
        .replace(/x\^\{(\d+)\}/g, 'x^$1');
}

function esInfinitoPositivo(valor) {
    const limpio = normalizar(valor);

    return limpio === '\\infty' || limpio === '+\\infty';
}

function esInfinitoNegativo(valor) {
    return normalizar(valor) === '-\\infty';
}

function convertirNumero(valor) {
    const limpio = normalizar(valor);

    if (esInfinitoPositivo(limpio)) {
        return Infinity;
    }

    if (esInfinitoNegativo(limpio)) {
        return -Infinity;
    }

    const fraccion = limpio.match(
        /^\\frac\{(-?\d+(?:\.\d+)?)\}\{(-?\d+(?:\.\d+)?)\}$/
    );

    if (fraccion) {
        return Number(fraccion[1]) / Number(fraccion[2]);
    }

    const numero = Number(limpio);

    return Number.isFinite(numero) ? numero : null;
}

function mostrarNumero(numero) {
    if (!Number.isFinite(numero)) {
        return numero === Infinity ? '\\infty' : '-\\infty';
    }

    if (Math.abs(numero - Math.round(numero)) < 1e-10) {
        return `${Math.round(numero)}`;
    }

    return numero.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function maximoComunDivisor(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {
        const temporal = b;
        b = a % b;
        a = temporal;
    }

    return a;
}

function convertirAFraccion(numero) {
    if (!Number.isFinite(numero)) {
        return mostrarNumero(numero);
    }

    if (Math.abs(numero - Math.round(numero)) < 1e-10) {
        return `${Math.round(numero)}`;
    }

    for (let denominador = 2; denominador <= 1000; denominador++) {
        const numerador = Math.round(numero * denominador);

        if (Math.abs(numero - numerador / denominador) < 1e-9) {
            const divisor = maximoComunDivisor(numerador, denominador);
            const n = numerador / divisor;
            const d = denominador / divisor;

            if (n < 0) {
                return `-\\frac{${Math.abs(n)}}{${d}}`;
            }

            return `\\frac{${n}}{${d}}`;
        }
    }

    return mostrarNumero(numero);
}

/* =========================================================
   PRESENTACIÓN DE RESULTADOS
   ========================================================= */

function colocarResumen(caso, metodo, resultado) {
    resumen.innerHTML = `
        <div class="dato">
            <span>Caso</span>
            <strong>${caso}</strong>
        </div>

        <div class="dato">
            <span>Método</span>
            <strong>${metodo}</strong>
        </div>

        <div class="dato">
            <span>Resultado</span>
            <strong>${resultado}</strong>
        </div>
    `;
}

function nuevoPaso(numero, titulo, explicacion, latex) {
    const paso = document.createElement('article');

    paso.className = 'paso';

    paso.innerHTML = `
        <div class="numero">${numero}</div>

        <div class="contenido-paso">
            <h3>${titulo}</h3>
            <p>${explicacion}</p>

            <div class="latex">
                \\[
                    ${latex}
                \\]
            </div>
        </div>
    `;

    pasos.appendChild(paso);
}

function mostrarSolucion(solucion) {
    pasos.innerHTML = '';

    colocarResumen(
        solucion.caso,
        solucion.metodo,
        solucion.resultado
    );

    solucion.pasos.forEach((paso, indice) => {
        nuevoPaso(
            indice + 1,
            paso.titulo,
            paso.texto,
            paso.latex
        );
    });

    renderizarMathJax();
}

function mostrarNoSoportada(f, inferior, superior) {
    colocarResumen(
        'No determinado',
        'No identificado',
        'Pendiente'
    );

    pasos.innerHTML = `
        <div class="error">
            <h3>Integral aún no reconocida automáticamente</h3>

            <p>
                La integral ingresada fue:
            </p>

            <div class="latex">
                \\[
                    I=\\int_{${inferior}}^{${superior}} ${f}\\,dx
                \\]
            </div>

            <p>
                El simulador reconoce actualmente potencias, potencias
                desplazadas, algunas sustituciones con logaritmos,
                exponenciales, tipo arctan y discontinuidades racionales
                básicas.
            </p>
        </div>
    `;

    renderizarMathJax();
}

/* =========================================================
   INFORMACIÓN GENERAL DE LOS LÍMITES
   ========================================================= */

function casoDeLimites(inferior, superior) {
    if (
        esInfinitoNegativo(inferior) &&
        esInfinitoPositivo(superior)
    ) {
        return 'Caso 1: ambos límites infinitos';
    }

    if (esInfinitoPositivo(superior)) {
        return 'Caso 1: límite superior infinito';
    }

    if (esInfinitoNegativo(inferior)) {
        return 'Caso 1: límite inferior infinito';
    }

    return 'Límites numéricos';
}

/* =========================================================
   FAMILIA 1:
   Integral 1 / x^p con límite infinito
   ========================================================= */

function detectarPotenciaSimple(f, inferior, superior) {
    const limpio = normalizar(f);

    const coincidencia = limpio.match(
        /^\\frac\{1\}\{x\^(\d+(?:\.\d+)?)\}$/
    );

    if (!coincidencia || !esInfinitoPositivo(superior)) {
        return null;
    }

    const p = Number(coincidencia[1]);

    if (p === 1) {
        return {
            caso: 'Caso 1: límite superior infinito',
            metodo: 'Integral logarítmica',
            resultado: 'Diverge',

            pasos: [
                {
                    titulo: 'Reescribir como límite',
                    texto: 'El extremo superior es infinito.',
                    latex:
                        `I=\\lim_{b\\to\\infty}
                        \\int_{${inferior}}^b \\frac{1}{x}\\,dx`
                },

                {
                    titulo: 'Integrar',
                    texto: 'La integral de \\(1/x\\) es logarítmica.',
                    latex:
                        `\\int \\frac{1}{x}\\,dx=\\ln|x|`
                },

                {
                    titulo: 'Evaluar el límite',
                    texto: 'El logaritmo crece indefinidamente.',
                    latex:
                        `I=\\lim_{b\\to\\infty}
                        \\left[\\ln|x|\\right]_{${inferior}}^b
                        =\\infty`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'El resultado no es finito.',
                    latex:
                        `\\boxed{\\text{La integral diverge}}`
                }
            ]
        };
    }

    if (p > 1) {
        return {
            caso: 'Caso 1: límite superior infinito',
            metodo: 'Regla de potencias',
            resultado: 'Converge',

            pasos: [
                {
                    titulo: 'Reescribir como límite',
                    texto: 'Se sustituye el infinito por una variable.',
                    latex:
                        `I=\\lim_{b\\to\\infty}
                        \\int_{${inferior}}^b x^{-${p}}\\,dx`
                },

                {
                    titulo: 'Integrar',
                    texto: 'Se aplica la regla de potencias.',
                    latex:
                        `\\int x^{-${p}}\\,dx
                        =
                        \\frac{x^{1-${p}}}{1-${p}}`
                },

                {
                    titulo: 'Evaluar el límite',
                    texto: 'Como el exponente final es negativo, el término con \\(b\\) tiende a cero.',
                    latex:
                        `I=\\lim_{b\\to\\infty}
                        \\left[
                        \\frac{x^{1-${p}}}{1-${p}}
                        \\right]_{${inferior}}^b`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'La integral converge porque la potencia es mayor que uno.',
                    latex:
                        `\\boxed{\\text{La integral converge porque }p=${p}>1}`
                }
            ]
        };
    }

    return {
        caso: 'Caso 1: límite superior infinito',
        metodo: 'Regla de potencias',
        resultado: 'Diverge',

        pasos: [
            {
                titulo: 'Identificar la potencia',
                texto: 'La potencia no es suficiente para producir un área finita.',
                latex:
                    `I=\\int_{${inferior}}^{\\infty}
                    \\frac{1}{x^{${p}}}\\,dx`
            },

            {
                titulo: 'Conclusión',
                texto: 'La integral diverge para potencias menores o iguales que uno.',
                latex:
                    `\\boxed{\\text{La integral diverge porque }p=${p}\\leq1}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 2:
   A / (mx + c)^p
   Incluye 1 / (x + 1)^3
   ========================================================= */

function leerPotenciaLineal(f) {
    const limpio = normalizar(f);

    /*
        Reconoce:
        1/(x+1)^3
        2/(x-4)^2
        5/(2x+3)^4
        1/(-2x+3)^2
    */

    const coincidencia = limpio.match(
        /^\\frac\{([+-]?\d+(?:\.\d+)?)\}\{\(([-+]?\d*(?:\.\d+)?)x([+-]\d+(?:\.\d+)?)?\)\^(\d+)\}$/
    );

    if (!coincidencia) {
        return null;
    }

    const A = Number(coincidencia[1]);
    const textoM = coincidencia[2];
    const textoC = coincidencia[3] || '0';
    const p = Number(coincidencia[4]);

    let m;

    if (textoM === '' || textoM === '+') {
        m = 1;
    } else if (textoM === '-') {
        m = -1;
    } else {
        m = Number(textoM);
    }

    const c = Number(textoC);

    if (!Number.isFinite(A) || !Number.isFinite(m) || m === 0 || !Number.isFinite(c)) {
        return null;
    }

    return {
        A,
        m,
        c,
        p
    };
}

function expresionLineal(m, c) {
    let texto = '';

    if (m === 1) {
        texto = 'x';
    } else if (m === -1) {
        texto = '-x';
    } else {
        texto = `${m}x`;
    }

    if (c > 0) {
        texto += `+${c}`;
    }

    if (c < 0) {
        texto += `${c}`;
    }

    return texto;
}

function antiderivadaPotenciaLineal(A, m, c, p) {
    const lineal = expresionLineal(m, c);

    if (p === 1) {
        if (A === m) {
            return `\\ln|${lineal}|`;
        }

        return `\\frac{${A}}{${m}}\\ln|${lineal}|`;
    }

    if (A === 1 && m === 1) {
        return `-\\frac{1}{${p - 1}(${lineal})^{${p - 1}}}`;
    }

    return `-\\frac{${A}}{${m * (p - 1)}(${lineal})^{${p - 1}}}`;
}

function evaluarPotenciaLineal(A, m, c, p, x) {
    const base = m * x + c;

    if (p === 1) {
        return (A / m) * Math.log(Math.abs(base));
    }

    return (A / (m * (1 - p))) * Math.pow(base, 1 - p);
}

function detectarPotenciaLineal(f, inferior, superior) {
    const datos = leerPotenciaLineal(f);

    if (!datos) {
        return null;
    }

    const { A, m, c, p } = datos;

    const a = convertirNumero(inferior);
    const b = convertirNumero(superior);

    const lineal = expresionLineal(m, c);
    const puntoProblema = -c / m;
    const puntoLatex = mostrarNumero(puntoProblema);
    const funcion =
        `\\frac{${A}}{(${lineal})^{${p}}}`;
    const antiderivada =
        antiderivadaPotenciaLineal(A, m, c, p);

    const aFinito = Number.isFinite(a);
    const bFinito = Number.isFinite(b);

    /*
        Discontinuidad interna con dos límites numéricos.
    */

    if (
        aFinito &&
        bFinito &&
        a < puntoProblema &&
        puntoProblema < b
    ) {
        return {
            caso: `Caso 2: discontinuidad interna en x = ${puntoLatex}`,
            metodo: 'Sustitución simple',
            resultado: 'Diverge',

            pasos: [
                {
                    titulo: 'Detectar el punto problemático',
                    texto: 'Se iguala el denominador a cero para revisar si la función existe en todo el intervalo.',
                    latex:
                        `(${lineal})^{${p}}=0
                        \\quad\\Rightarrow\\quad
                        ${lineal}=0
                        \\quad\\Rightarrow\\quad
                        x=${puntoLatex}`
                },

                {
                    titulo: 'Comprobar su posición',
                    texto: 'El punto donde la función no existe se encuentra dentro del intervalo de integración.',
                    latex:
                        `${mostrarNumero(a)}
                        <
                        ${puntoLatex}
                        <
                        ${mostrarNumero(b)}`
                },

                {
                    titulo: 'Separar la integral',
                    texto: 'Una discontinuidad interna obliga a estudiar los dos lados por separado.',
                    latex:
                        `I=
                        \\lim_{r\\to ${puntoLatex}^{-}}
                        \\int_{${mostrarNumero(a)}}^{r}
                        ${funcion}\\,dx
                        +
                        \\lim_{s\\to ${puntoLatex}^{+}}
                        \\int_{s}^{${mostrarNumero(b)}}
                        ${funcion}\\,dx`
                },

                {
                    titulo: 'Aplicar sustitución',
                    texto: 'La expresión lineal del denominador se sustituye directamente.',
                    latex:
                        `u=${lineal},
                        \\qquad
                        du=${m}\\,dx`
                },

                {
                    titulo: 'Obtener la antiderivada',
                    texto: p === 1
                        ? 'La potencia \\(-1\\) produce una función logarítmica.'
                        : 'Se integra la potencia negativa mediante la regla de potencias.',
                    latex:
                        `\\int ${funcion}\\,dx
                        =
                        ${antiderivada}`
                },

                {
                    titulo: 'Evaluar el comportamiento lateral',
                    texto: 'Al acercarse al punto problemático, la antiderivada no produce un valor finito.',
                    latex:
                        `\\lim_{x\\to ${puntoLatex}}
                        ${antiderivada}
                        \\text{ no es finito}`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'Si una de las partes no converge, la integral completa diverge.',
                    latex:
                        `\\boxed{\\text{La integral diverge}}`
                }
            ]
        };
    }

    /*
        Discontinuidad en el extremo izquierdo.
    */

    if (
        aFinito &&
        Math.abs(a - puntoProblema) < 1e-10
    ) {
        return {
            caso: `Caso 2: discontinuidad en el extremo izquierdo x = ${puntoLatex}`,
            metodo: 'Sustitución simple',
            resultado: 'Diverge',

            pasos: [
                {
                    titulo: 'Detectar la discontinuidad',
                    texto: 'El denominador se anula exactamente en el límite inferior.',
                    latex:
                        `${lineal}=0
                        \\quad\\Rightarrow\\quad
                        x=${puntoLatex}`
                },

                {
                    titulo: 'Reescribir la integral',
                    texto: 'La aproximación debe hacerse por la derecha, desde dentro del intervalo.',
                    latex:
                        `I=
                        \\lim_{r\\to ${puntoLatex}^{+}}
                        \\int_r^{${superior}}
                        ${funcion}\\,dx`
                },

                {
                    titulo: 'Sustitución',
                    texto: 'Se sustituye la expresión lineal del denominador.',
                    latex:
                        `u=${lineal},
                        \\qquad
                        du=${m}\\,dx`
                },

                {
                    titulo: 'Antiderivada',
                    texto: 'Se integra la potencia resultante.',
                    latex:
                        `\\int ${funcion}\\,dx
                        =
                        ${antiderivada}`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'El límite lateral no produce un valor finito.',
                    latex:
                        `\\boxed{\\text{La integral diverge}}`
                }
            ]
        };
    }

    /*
        Discontinuidad en el extremo derecho.
    */

    if (
        bFinito &&
        Math.abs(b - puntoProblema) < 1e-10
    ) {
        return {
            caso: `Caso 2: discontinuidad en el extremo derecho x = ${puntoLatex}`,
            metodo: 'Sustitución simple',
            resultado: 'Diverge',

            pasos: [
                {
                    titulo: 'Detectar la discontinuidad',
                    texto: 'El denominador se anula exactamente en el límite superior.',
                    latex:
                        `${lineal}=0
                        \\quad\\Rightarrow\\quad
                        x=${puntoLatex}`
                },

                {
                    titulo: 'Reescribir la integral',
                    texto: 'La aproximación debe hacerse por la izquierda.',
                    latex:
                        `I=
                        \\lim_{r\\to ${puntoLatex}^{-}}
                        \\int_{${inferior}}^r
                        ${funcion}\\,dx`
                },

                {
                    titulo: 'Sustitución',
                    texto: 'Se sustituye la expresión lineal del denominador.',
                    latex:
                        `u=${lineal},
                        \\qquad
                        du=${m}\\,dx`
                },

                {
                    titulo: 'Antiderivada',
                    texto: 'Se integra la potencia resultante.',
                    latex:
                        `\\int ${funcion}\\,dx
                        =
                        ${antiderivada}`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'El límite lateral no es finito.',
                    latex:
                        `\\boxed{\\text{La integral diverge}}`
                }
            ]
        };
    }

    /*
        Integral finita sin discontinuidades dentro del intervalo.
        Aunque no sea impropia, el simulador puede calcularla.
    */

    if (aFinito && bFinito) {
        const valor =
            evaluarPotenciaLineal(A, m, c, p, b) -
            evaluarPotenciaLineal(A, m, c, p, a);

        const valorLatex = convertirAFraccion(valor);

        return {
            caso: 'Integral definida sin discontinuidades en el intervalo',
            metodo: 'Sustitución simple',
            resultado: `Valor: ${valorLatex}`,

            pasos: [
                {
                    titulo: 'Buscar puntos problemáticos',
                    texto: 'Se revisa dónde el denominador podría hacerse cero.',
                    latex:
                        `${lineal}=0
                        \\quad\\Rightarrow\\quad
                        x=${puntoLatex}`
                },

                {
                    titulo: 'Comprobar el intervalo',
                    texto: 'El punto problemático no está dentro del intervalo ingresado, así que la integral no es impropia por discontinuidad.',
                    latex:
                        `${puntoLatex}
                        \\notin
                        [${mostrarNumero(a)},${mostrarNumero(b)}]`
                },

                {
                    titulo: 'Aplicar sustitución',
                    texto: 'La expresión lineal del denominador permite una sustitución directa.',
                    latex:
                        `u=${lineal},
                        \\qquad
                        du=${m}\\,dx`
                },

                {
                    titulo: 'Integrar',
                    texto: 'Se obtiene la antiderivada.',
                    latex:
                        `\\int ${funcion}\\,dx
                        =
                        ${antiderivada}`
                },

                {
                    titulo: 'Evaluar',
                    texto: 'Se evalúa en los límites numéricos.',
                    latex:
                        `I=
                        \\left[
                        ${antiderivada}
                        \\right]_{${mostrarNumero(a)}}^{${mostrarNumero(b)}}
                        =
                        ${valorLatex}`
                },

                {
                    titulo: 'Resultado',
                    texto: 'La integral tiene valor finito.',
                    latex:
                        `\\boxed{I=${valorLatex}}`
                }
            ]
        };
    }

    /*
        Integral con límite infinito sin discontinuidad incluida.
    */

    if (
        p > 1 &&
        aFinito &&
        b === Infinity &&
        puntoProblema < a
    ) {
        const valor =
            0 - evaluarPotenciaLineal(A, m, c, p, a);

        const valorLatex = convertirAFraccion(valor);

        return {
            caso: 'Caso 1: límite superior infinito',
            metodo: 'Sustitución simple',
            resultado: `Converge a ${valorLatex}`,

            pasos: [
                {
                    titulo: 'Comprobar discontinuidades',
                    texto: 'El punto donde se anula el denominador queda fuera del intervalo de integración.',
                    latex:
                        `${lineal}=0
                        \\Rightarrow
                        x=${puntoLatex}
                        \\notin
                        [${mostrarNumero(a)},\\infty)`
                },

                {
                    titulo: 'Reescribir como límite',
                    texto: 'Se reemplaza el infinito por una variable.',
                    latex:
                        `I=
                        \\lim_{b\\to\\infty}
                        \\int_{${mostrarNumero(a)}}^b
                        ${funcion}\\,dx`
                },

                {
                    titulo: 'Sustitución',
                    texto: 'Se aplica sustitución simple.',
                    latex:
                        `u=${lineal},
                        \\qquad
                        du=${m}\\,dx`
                },

                {
                    titulo: 'Integrar',
                    texto: 'Se obtiene la antiderivada.',
                    latex:
                        `\\int ${funcion}\\,dx
                        =
                        ${antiderivada}`
                },

                {
                    titulo: 'Evaluar',
                    texto: 'La potencia del denominador hace que el término al infinito tienda a cero.',
                    latex:
                        `I=
                        \\lim_{b\\to\\infty}
                        \\left[
                        ${antiderivada}
                        \\right]_{${mostrarNumero(a)}}^b
                        =
                        ${valorLatex}`
                },

                {
                    titulo: 'Conclusión',
                    texto: 'El resultado es finito.',
                    latex:
                        `\\boxed{I=${valorLatex}\\quad\\text{La integral converge}}`
                }
            ]
        };
    }

    return null;
}

/* =========================================================
   FAMILIA 3:
   x / (1 + x²)²
   ========================================================= */

function detectarCuadratica(f, inferior, superior) {
    const limpio = normalizar(f);

    const formasAceptadas = [
        '\\frac{x}{(1+x^2)^2}',
        '\\frac{x}{(x^2+1)^2}'
    ];

    if (
        !formasAceptadas.includes(limpio) ||
        !esInfinitoPositivo(superior)
    ) {
        return null;
    }

    return {
        caso: 'Caso 1: límite superior infinito',
        metodo: 'Sustitución simple',
        resultado: 'Converge',

        pasos: [
            {
                titulo: 'Reescribir como límite',
                texto: 'El límite superior es infinito.',
                latex:
                    `I=
                    \\lim_{b\\to\\infty}
                    \\int_{${inferior}}^b
                    \\frac{x}{(1+x^2)^2}\\,dx`
            },

            {
                titulo: 'Aplicar sustitución',
                texto: 'Se utiliza la expresión interna del denominador.',
                latex:
                    `u=1+x^2,
                    \\qquad
                    du=2x\\,dx,
                    \\qquad
                    x\\,dx=\\frac{du}{2}`
            },

            {
                titulo: 'Integrar',
                texto: 'Se obtiene una potencia negativa de \\(u\\).',
                latex:
                    `\\int\\frac{x}{(1+x^2)^2}\\,dx
                    =
                    \\frac{1}{2}\\int u^{-2}\\,du
                    =
                    -\\frac{1}{2(1+x^2)}`
            },

            {
                titulo: 'Conclusión',
                texto: 'Al evaluar el límite se obtiene un valor finito.',
                latex:
                    `\\boxed{\\text{La integral converge}}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 4:
   1 / [x(ln x)^p]
   ========================================================= */

function detectarLogaritmica(f, inferior, superior) {
    const limpio = normalizar(f);

    const coincidencia =
        limpio.match(
            /^\\frac\{1\}\{x\(\\ln\(x\)\)\^(\d+)\}$/
        ) ||
        limpio.match(
            /^\\frac\{1\}\{x\\ln\^\{?(\d+)\}?\(x\)\}$/
        );

    if (
        !coincidencia ||
        !esInfinitoPositivo(superior)
    ) {
        return null;
    }

    const p = Number(coincidencia[1]);

    return {
        caso: 'Caso 1: límite superior infinito',
        metodo: 'Sustitución simple',
        resultado: p > 1 ? 'Converge' : 'Diverge',

        pasos: [
            {
                titulo: 'Reescribir como límite',
                texto: 'El extremo superior es infinito.',
                latex:
                    `I=
                    \\lim_{b\\to\\infty}
                    \\int_{${inferior}}^b
                    \\frac{1}{x(\\ln x)^{${p}}}\\,dx`
            },

            {
                titulo: 'Aplicar sustitución',
                texto: 'Aparecen \\(\\ln x\\) y su derivada \\(dx/x\\).',
                latex:
                    `u=\\ln x,
                    \\qquad
                    du=\\frac{dx}{x}`
            },

            {
                titulo: 'Transformar',
                texto: 'La integral se convierte en una potencia.',
                latex:
                    `\\int
                    \\frac{1}{x(\\ln x)^{${p}}}\\,dx
                    =
                    \\int u^{-${p}}\\,du`
            },

            {
                titulo: 'Conclusión',
                texto: p > 1
                    ? 'La potencia permite obtener un límite finito.'
                    : 'La potencia no genera un valor finito.',
                latex: p > 1
                    ? `\\boxed{\\text{La integral converge porque }p=${p}>1}`
                    : `\\boxed{\\text{La integral diverge porque }p=${p}\\leq1}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 5:
   e^x / (e^x + 1)
   ========================================================= */

function detectarExponencialLogaritmica(f, inferior, superior) {
    const limpio = normalizar(f);

    const formasAceptadas = [
        '\\frac{e^x}{e^x+1}',
        '\\frac{e^{x}}{e^{x}+1}'
    ];

    if (
        !formasAceptadas.includes(limpio) ||
        !esInfinitoPositivo(superior)
    ) {
        return null;
    }

    return {
        caso: 'Caso 1: límite superior infinito',
        metodo: 'Sustitución simple',
        resultado: 'Diverge',

        pasos: [
            {
                titulo: 'Reescribir como límite',
                texto: 'El extremo superior es infinito.',
                latex:
                    `I=
                    \\lim_{b\\to\\infty}
                    \\int_{${inferior}}^b
                    \\frac{e^x}{e^x+1}\\,dx`
            },

            {
                titulo: 'Aplicar sustitución',
                texto: 'El numerador corresponde a la derivada de la expresión del denominador.',
                latex:
                    `u=e^x+1,
                    \\qquad
                    du=e^x\\,dx`
            },

            {
                titulo: 'Integrar',
                texto: 'La sustitución produce una integral logarítmica.',
                latex:
                    `\\int\\frac{e^x}{e^x+1}\\,dx
                    =
                    \\int\\frac{du}{u}
                    =
                    \\ln(e^x+1)`
            },

            {
                titulo: 'Evaluar el límite',
                texto: 'El logaritmo crece sin límite cuando \\(b\\to\\infty\\).',
                latex:
                    `I=
                    \\lim_{b\\to\\infty}
                    \\left[
                    \\ln(e^x+1)
                    \\right]_{${inferior}}^b
                    =
                    \\infty`
            },

            {
                titulo: 'Conclusión',
                texto: 'El límite no produce un número finito.',
                latex:
                    `\\boxed{\\text{La integral diverge}}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 6:
   e^x / (e^{2x} + 1)
   ========================================================= */

function detectarExponencialArctan(f, inferior, superior) {
    const limpio = normalizar(f);

    const formasAceptadas = [
        '\\frac{e^x}{e^{2x}+1}',
        '\\frac{e^{x}}{e^{2x}+1}',
        '\\frac{e^x}{(e^x)^2+1}'
    ];

    if (!formasAceptadas.includes(limpio)) {
        return null;
    }

    const ambosInfinitos =
        esInfinitoNegativo(inferior) &&
        esInfinitoPositivo(superior);

    return {
        caso: ambosInfinitos
            ? 'Caso 1: ambos límites infinitos'
            : casoDeLimites(inferior, superior),

        metodo: 'Sustitución y forma arctan',

        resultado: ambosInfinitos
            ? 'Converge a π/2'
            : 'Converge',

        pasos: [
            {
                titulo: 'Identificar el caso',
                texto: ambosInfinitos
                    ? 'Con infinitos en ambos extremos se deben analizar las dos partes por separado.'
                    : 'Se analiza el intervalo impropio ingresado.',
                latex: ambosInfinitos
                    ? `I=
                    \\lim_{a\\to-\\infty}
                    \\int_a^0
                    \\frac{e^x}{e^{2x}+1}\\,dx
                    +
                    \\lim_{b\\to\\infty}
                    \\int_0^b
                    \\frac{e^x}{e^{2x}+1}\\,dx`
                    : `I=
                    \\int_{${inferior}}^{${superior}}
                    \\frac{e^x}{e^{2x}+1}\\,dx`
            },

            {
                titulo: 'Aplicar sustitución',
                texto: 'El denominador se convierte en una suma de cuadrados.',
                latex:
                    `u=e^x,
                    \\qquad
                    du=e^x\\,dx,
                    \\qquad
                    e^{2x}=u^2`
            },

            {
                titulo: 'Integrar',
                texto: 'Aparece la forma conocida de arco tangente.',
                latex:
                    `\\int\\frac{e^x}{e^{2x}+1}\\,dx
                    =
                    \\int\\frac{du}{u^2+1}
                    =
                    \\arctan(e^x)`
            },

            {
                titulo: 'Evaluar',
                texto: ambosInfinitos
                    ? 'Se evalúan ambos límites impropios.'
                    : 'Se evalúa la antiderivada en el intervalo.',
                latex: ambosInfinitos
                    ? `I=
                    \\left(\\frac{\\pi}{4}-0\\right)
                    +
                    \\left(\\frac{\\pi}{2}-\\frac{\\pi}{4}\\right)
                    =
                    \\frac{\\pi}{2}`
                    : `I=
                    \\left[
                    \\arctan(e^x)
                    \\right]_{${inferior}}^{${superior}}`
            },

            {
                titulo: 'Conclusión',
                texto: 'El resultado final es finito.',
                latex: ambosInfinitos
                    ? `\\boxed{
                    I=\\frac{\\pi}{2}
                    \\quad
                    \\text{La integral converge}
                    }`
                    : `\\boxed{\\text{La integral converge}}`
            }
        ]
    };
}

/* =========================================================
   FAMILIA 7:
   1 / (1 - x)
   ========================================================= */

function detectarDiscontinuidadBasica(f, inferior, superior) {
    const limpio = normalizar(f);

    const formasAceptadas = [
        '\\frac{1}{1-x}',
        '\\frac{1}{-x+1}'
    ];

    if (!formasAceptadas.includes(limpio)) {
        return null;
    }

    const a = convertirNumero(inferior);
    const b = convertirNumero(superior);

    if (
        !Number.isFinite(a) ||
        !Number.isFinite(b) ||
        !(a < 1 && 1 < b)
    ) {
        return null;
    }

    return {
        caso: 'Caso 2: discontinuidad interna en x = 1',
        metodo: 'Sustitución simple / logaritmo',
        resultado: 'Diverge',

        pasos: [
            {
                titulo: 'Detectar el punto problemático',
                texto: 'El denominador se iguala a cero.',
                latex:
                    `1-x=0
                    \\quad\\Rightarrow\\quad
                    x=1`
            },

            {
                titulo: 'Separar la integral',
                texto: 'El punto problemático está dentro del intervalo.',
                latex:
                    `I=
                    \\lim_{a\\to1^-}
                    \\int_{${inferior}}^a
                    \\frac{1}{1-x}\\,dx
                    +
                    \\lim_{b\\to1^+}
                    \\int_b^{${superior}}
                    \\frac{1}{1-x}\\,dx`
            },

            {
                titulo: 'Integrar',
                texto: 'La antiderivada es logarítmica.',
                latex:
                    `\\int\\frac{1}{1-x}\\,dx
                    =
                    -\\ln|1-x|`
            },

            {
                titulo: 'Evaluar',
                texto: 'Una de las partes presenta crecimiento infinito.',
                latex:
                    `\\lim_{a\\to1^-}
                    \\left[
                    -\\ln|1-x|
                    \\right]_{${inferior}}^a
                    =
                    +\\infty`
            },

            {
                titulo: 'Conclusión',
                texto: 'Si una parte diverge, toda la integral diverge.',
                latex:
                    `\\boxed{\\text{La integral diverge}}`
            }
        ]
    };
}

/* =========================================================
   ANALIZADOR PRINCIPAL
   ========================================================= */

function resolverIntegral(f, inferior, superior) {
    const detectores = [
        detectarPotenciaLineal,
        detectarDiscontinuidadBasica,
        detectarPotenciaSimple,
        detectarCuadratica,
        detectarLogaritmica,
        detectarExponencialLogaritmica,
        detectarExponencialArctan
    ];

    for (const detector of detectores) {
        const solucion = detector(f, inferior, superior);

        if (solucion) {
            return solucion;
        }
    }

    return null;
}

function analizarIntegral() {
    const f = latexCampo(integrando);
    const inferior = latexCampo(limiteInferior);
    const superior = latexCampo(limiteSuperior);

    if (!f || !inferior || !superior) {
        alert('Completa la función y los dos límites de integración.');
        return;
    }

    const solucion = resolverIntegral(f, inferior, superior);

    if (!solucion) {
        mostrarNoSoportada(f, inferior, superior);
        return;
    }

    mostrarSolucion(solucion);
}

analizar.addEventListener('click', analizarIntegral);

/* =========================================================
   EJEMPLOS PRECARGADOS
   ========================================================= */

const ejemplos = {
    potencia: {
        inferior: '1',
        superior: '\\infty',
        integrando: '\\frac{1}{x^2}'
    },

    logaritmo: {
        inferior: '4',
        superior: '\\infty',
        integrando: '\\frac{1}{x(\\ln(x))^3}'
    },

    exponencial: {
        inferior: '0',
        superior: '\\infty',
        integrando: '\\frac{e^x}{e^x+1}'
    },

    arctan: {
        inferior: '-\\infty',
        superior: '\\infty',
        integrando: '\\frac{e^x}{e^{2x}+1}'
    },

    discontinua: {
        inferior: '0',
        superior: '2',
        integrando: '\\frac{1}{1-x}'
    },

    sustitucion: {
        inferior: '-2',
        superior: '1',
        integrando: '\\frac{1}{(x+1)^3}'
    }
};

document.querySelectorAll('[data-ejemplo]').forEach(boton => {
    boton.addEventListener('click', () => {
        const ejemplo = ejemplos[boton.dataset.ejemplo];

        limiteInferior.value = ejemplo.inferior;
        limiteSuperior.value = ejemplo.superior;
        integrando.value = ejemplo.integrando;

        campoActivo = integrando;

        actualizarVistaIntegral();
        analizarIntegral();
    });
});

/* =========================================================
   INICIO
   ========================================================= */

window.addEventListener('DOMContentLoaded', async () => {
    await customElements.whenDefined('math-field');

    prepararCampos();
    actualizarVistaIntegral();

    /*
        Analiza automáticamente el ejercicio inicial:
        ∫ de -2 a 1 de 1/(x+1)^3 dx
    */

    analizarIntegral();
});