let chart;

function calcular(){

    let f = document.getElementById("funcion").value.trim()
    let a = parseFloat(document.getElementById("a").value)
    let b = parseFloat(document.getElementById("b").value)
    let n = parseInt(document.getElementById("n").value)
    let expr = math.compile(f)

    if (!f || isNaN(a) || isNaN(b) || isNaN(n)){
        alert("Ingresa los datos correctamente, por favor :)"); 
        return;
    }
    try{
        let dx = (b-a)/n
        let area = 0

        for(let i=0;i<n;i++){
            let x = a + i*dx
            let y = expr.evaluate({x:x})
            area += y*dx
        }
        let pasos = generarPasos(f,a,b)
        document.getElementById("pasos").innerHTML = pasos
        document.getElementById("area").innerHTML = "\\[A \\approx "+area.toFixed(5)+"\\]"
    
        MathJax.typesetPromise()
        graficar(expr,a,b)
    }catch(error){
        alert("Error detectado en la función " + error.message); 
    }
}

//FUNCION 2 GENERAR PASOS DE LA SUMA DE RIEMMAN
function generarPasos(funcion, a, b) {
    let pasos = "";

    let match = funcion.match(/x\^(\d+)/);

    pasos += `\\[ A = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i)\\Delta x \\]`;
    pasos += `\\[ f(x) = ${funcion}, \\quad a=${a}, \\quad b=${b} \\]`;
    pasos += `\\[ \\Delta x = \\frac{${b}-${a}}{n}, \\quad x_i = ${a} + i\\Delta x \\]`;

    if (match) {
        let k = parseInt(match[1]);
        pasos += `\\[ f(x_i) = \\left(${a} + i\\frac{${b-a}}{n}\\right)^{${k}} \\]`;

        if (a === 0) {
            pasos += `\\[ A = \\lim_{n\\to\\infty} \\frac{${b}^{${k+1}}}{n^{${k+1}}} \\sum_{i=1}^{n} i^{${k}} \\]`;
            
            if (k === 1){
                pasos += `\\[ \\sum i = \\frac{n(n+1)}{2} \\]`;
            }
            if (k === 2){
                pasos += `\\[ \\sum i^2 = \\frac{n(n+1)(2n+1)}{6} \\]`;
            }
            if (k === 3){
                pasos += `\\[ \\sum i^3 = \\left(\\frac{n(n+1)}{2}\\right)^2 \\]`;
            }
        }

        //INTEGRAL XD
        pasos += `\\[ \\int_{${a}}^{${b}} x^{${k}} dx = \\frac{x^{${k+1}}}{${k+1}} \\Bigg|_{${a}}^{${b}} \\]`;
    }

    return pasos;
}



function graficar(expr,a,b){

let puntosX=[]
let puntosY=[]
let areaPositiva=[]
let areaNegativa=[]

let step=(b-a)/300

for(let x=a;x<=b;x+=step){

let y = expr.evaluate({x:x})

puntosX.push(Number(x.toFixed(2)))
puntosY.push(y)

if(y>=0){
areaPositiva.push(y)
areaNegativa.push(null)
}else{
areaPositiva.push(null)
areaNegativa.push(y)
}

}

if(chart){
chart.destroy()
}

chart = new Chart(document.getElementById("grafica"),{

type:'line',

data:{
labels:puntosX,

datasets:[

{
label:'f(x)',
data:puntosY,
borderColor:'#f6edff',
borderWidth:3,
pointRadius:0,
tension:0.3
},

{
label:'Área positiva',
data:areaPositiva,
fill:'origin',
backgroundColor:'rgba(203,129,255,0.35)',
borderWidth:0,
pointRadius:0
},

{
label:'Área negativa',
data:areaNegativa,
fill:'origin',
backgroundColor:'rgba(255,108,243,0.35)',
borderWidth:0,
pointRadius:0
}

]

},

options:{

responsive:true,

plugins:{
legend:{
position:'top',
labels:{
color:'white'
}
}
},

scales:{

x:{
grid:{
color:'#8d7ba4'
},
ticks:{
color:'white'
},
title:{
display:true,
text:'x',
color:'white'
}
},

y:{
grid:{
color:'#8d7ba4'
},
ticks:{
color:'white'
},
title:{
display:true,
text:'f(x)',
color:'white'
}
}

}

}

})

}