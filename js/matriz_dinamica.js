  //-----------------STRASSEN-----------------
// Scalar stuff
var Scalar = {};
(function () {
  "use strict";
  Scalar.mulFunc = function (first, second) {
    return first * second;
  };

  Scalar.addFunc = function (first, second) {
    return first + second;
  };

  Scalar.subFunc = function (first, second) {
    return first - second;
  };
})();

var valores = [];
// Matrix stuff
var Matrix = {};
(function () {
  "use strict";
  var Create2DArray = function (a, b) {
    var arr = [];
    for (var i = 0; i < a; i++) {
      arr[i] = [];
      for (var j = 0; j < b; j++) {
        arr[i][j] = 0.0;
      }
    }
    return arr;
  };

  var windower = function(win) {
    var _win = win || {};
    return {
      from_i: _win.from_i || 0,
      to_i:     _win.to_i || 0,
      from_j: _win.from_j || 0,
      to_j:     _win.to_j || 0
    };
  };

  var randomizer = function (matrix, from, to) {
    for (var i = 0; i < matrix.n; i++) {
      for (var j = 0; j < matrix.m; j++) {
        matrix.set(i, j, randomInt(from, to));
      }
    }
    return matrix;
  };

  var add = function(a, b) {
    if (a.n !== b.n || a.m !== b.m) {
      throw "incompatible matrices, different dimensions";
    }
    var c = Matrix.new(a.n, a.m, "(" + a.name + "+" + b.name + ")");
    for (var i = 0; i < c.n; i++) {
      for (var j = 0; j < c.m; j++) {
        var sum = Scalar.addFunc(a.get(i, j),b.get(i, j));
        c.set(i, j, sum);
      }
    }
    return c;
  };

  var sub = function(a, b) {
    if (a.n !== b.n || a.m !== b.m) {
      throw "incompatible matrices, different dimensions";
    }
    var c = Matrix.new(a.n, a.m, "(" + a.name + "-" + b.name + ")");
    for (var i = 0; i < c.n; i++) {
      for (var j = 0; j < c.m; j++) {
        var diff = Scalar.subFunc(a.get(i, j),b.get(i, j));
        c.set(i, j, diff);
      }
    }
    return c;
  };

  var mul = function(a, b, c) {
    if (a.m !== b.n) {
      throw "incompatible matrices";
    }
    for (var i = 0; i < a.n; i++) {
      for (var j = 0; j < b.m; j++) {
        var val = 0.0;
        for (var k = 0; k < a.m; k++) {
          var aCell = a.get(i, k);
          var bCell = b.get(k, j);
          var tmp = Scalar.mulFunc(aCell, bCell);
          val = Scalar.addFunc(val, tmp);
        }
        c.set(i, j, val);
      }
    }
  };

  Matrix.new = function(n, m, name) {
    var win = windower({to_i:n, to_j: m});
    return newWindowedMatrix(new Create2DArray(n,m), win, name);
  };

  var newWindowedMatrix = function (mat, windows, name) {
    var i0 = windows.from_i,
        i1 = windows.to_i,
        j0 = windows.from_j,
        j1 = windows.to_j;

    var partitioner = function(from_i, from_j, to_i, to_j, name) {
      var win = windower({
        from_i: i0 + from_i,
        to_i: i0 + to_i,
        from_j: j0 + from_j,
        to_j: j0 + to_j
      });
      return newWindowedMatrix(mat, win, name);
    };

    var checkRange = function(i, j) {
      if (i < i0)       {
        throw "i too low, was "+i+" but must be under " + i0 + " in matrix " + name;
      }
      if (i >= i1) {
        throw "i too high, was "+i+" but must not exceed " + i1 + " in matrix " + name;
      }
      if (j < j0)       {
        throw "j too low, was "+j+" but must be under " + j0 + " in matrix " + name;
      }
      if (j >= j1) {
        throw "j too high, was "+j+" but must not exceed " + j1 + " in matrix " + name;
      }
    };

    var getter = function(i, j) {
      var real_i = i + i0,
          real_j = j + j0;
      checkRange(real_i, real_j);
      return mat[real_i][real_j];
    };

    var setter = function(i, j, val) {
      var real_i = i + i0,
          real_j = j + j0;
      checkRange(real_i, real_j);
      mat[real_i][real_j] = val;
    };

    var latexifier = function () {
      var n = i1 - i0,
          m = j1 - j0;
      var str = "\\overset{" + name + n + "\\times" + m + "}{\\begin{bmatrix}\n";
      for (var i = i0; i < i1; i++) {

        for (var j = j0; j < j1; j++) {
          str += mat[i][j];
          if (j !== j1 - 1) {
            str += " & ";
          }
        }
        if (i !== i1 - 1) {
          str += "\\\\";
        }
      }
      return str + "\\end{bmatrix}}";
    };

    return {
      name: name || "",
      _mat: mat,
      partition: partitioner,
      randomize: function(from, to) { return randomizer(this, from, to); },
      add: function(other) { return add(this, other); },
      sub: function(other) { return sub(this, other); },
      get: getter,
      set: setter,
      toLaTeX: latexifier,
      n: i1 - i0,
      m: j1 - j0
    };
  };



  Matrix.stdMatrixMul = function (a, b) {
    var c = Matrix.new(a.n, b.m, "(" + a.name + b.name + ")");
    mul(a,b,c);
    return c;
  };

  var nextPow2 = function(n) {
    var currentPow2 = Math.floor(Math.log(n)/Math.log(2));
    return Math.pow(2, currentPow2 + 1);
  };

  var growNextPowerOf2 = function(orig) {
    if (orig.n !== orig.m) {
      throw "incompatible matrices, different dimensions";
    }

    var nextN = nextPow2(orig.n);
    if (nextN/2 === orig.n) {
      // Don't need to grow it
      return orig;
    }
    var grownMat = Matrix.new(nextN, nextN);
    for (var i = 0; i < orig.n; i++) {
      for (var j = 0; j < orig.n; j++) {
        grownMat.set(i, j, orig.get(i, j));
      }
    }
    return grownMat;
  };

var cont = 0;

var strassen = function(a, b,ln) {
  var n = a.n;
  
  var C = Matrix.new(n,n,"C"+cont);
  //console.log(n);
  cont++;
  if(n == 1){
    C.set(0,0,Scalar.mulFunc(a.get(0,0),b.get(0,0)));
    //console.log(C.name+": "+C.get(0,0));
  }
  else{
    var A = growNextPowerOf2(a);
    var B = growNextPowerOf2(b);
    var n = A.n;

    var A11 = A.partition(0,   0,   n/2, n/2, "A11");
    var A12 = A.partition(0,   n/2, n/2, n,   "A12");
    var A21 = A.partition(n/2, 0,   n,   n/2, "A21");
    var A22 = A.partition(n/2, n/2, n,   n,   "A22");

    var B11 = B.partition(0,   0,   n/2, n/2, "B11");
    var B12 = B.partition(0,   n/2, n/2, n,   "B12");
    var B21 = B.partition(n/2, 0,   n,   n/2, "B21");
    var B22 = B.partition(n/2, n/2, n,   n,   "B22");
    

    var M1 = strassen(A11.add(A22), B11.add(B22),ln);
    var M2 = strassen(A21.add(A22), B11         ,ln);
    var M3 = strassen(A11         , B12.sub(B22),ln);
    var M4 = strassen(A22         , B21.sub(B11),ln);
    var M5 = strassen(A11.add(A12), B22         ,ln);
    var M6 = strassen(A21.sub(A11), B11.add(B12),ln);
    var M7 = strassen(A12.sub(A22), B21.add(B22),ln);

    var C11 = M1.add(M4).sub(M5).add(M7);
    var C12 = M3.add(M5);
    var C21 = M2.add(M4);
    var C22 = M1.add(M3).sub(M2).add(M6);

    var halfN = C11.n;
    for (var i = 0; i < C.n; i++) {
      for (var j = 0; j < C.n; j++) {
        if (i < halfN && j < halfN) {
          C.set(i, j, C11.get(i, j));
        }
        else if (i < halfN && j >= halfN) {
          C.set(i, j, C12.get(i, j - halfN));
        }
        else if (i >= halfN && j < halfN) {
          C.set(i, j, C21.get(i - halfN, j));
        }
        else if (i >= halfN && j >= halfN) {
          C.set(i, j, C22.get(i - halfN, j - halfN));
        }
      }
    }
  }

  if(C.n >= ln){
    for(var i=0;i<C.n;i++){
      for(var j=0;j<C.n;j++){
        //console.log(C.get(i,j)+" "+ln);
        valores.push(C.get(i,j));
      }
    }
    //console.log("----------------");
  }
  return C;
};


  Matrix.strassenMatrixMul = function (a, b) {
    if (a.n !== b.n || a.m !== b.m) {
      throw "incompatible matrices, different dimensions";
    }
    if (a.n !== a.m) {
      throw "incompatible matrices, not square matrices";
    }
    var c = strassen(a,b,a.n/2);
    return c;
  };
})();
  //--------TERMINA STRASSEN-----------------------



// fin de valores rescatados de los inputs iniciales
  function cuadrizar_fila_1(){
      //creacion matriz1
      var caja = document.createElement("INPUT");
      caja.setAttribute("size","2");
      caja.setAttribute("value","0");
      //document.body.appendChild(caja);
      document.getElementById("m1").appendChild(caja);
  }
  function cuadrizar_fila_2(){
      //creacion matriz2
      var caja2 = document.createElement("INPUT");
      caja2.setAttribute("size","2");
      caja2.setAttribute("value","0");
      //document.body.appendChild(caja);
      document.getElementById("m2").appendChild(caja2);
  }
  var veces_creadas=0;
  function crear(){
      //volvemos a obtener los valores
    var filas_M1=parseInt(document.getElementById("fil1").value);
    var colucnas_M1=parseInt(document.getElementById("fil1").value);

    var filas_M2=parseInt(document.getElementById("fil1").value);
    var colucnas_M2=parseInt(document.getElementById("fil1").value);
    //fin volvemos a obtener los valores
    //comprobacion de todos los posibles errores
    if(colucnas_M1!=filas_M2){
      alert("Intente de nuevo por favor recuerde que la columna de la matriz 1 debe coincidir con las filas de la matriz 2");
      location.reload();
    }
    else{
      if(veces_creadas>0 || colucnas_M1!=filas_M2){
        alert("Borrando datos anteriores por favor vuelva a escribir nuevos");
        location.reload();
      }
      else{
        //si se pasan todas las condiciones crea los controles y formulario con el que identificaremos las matrices
        var filas = parseInt(document.getElementById("fil1").value);
        var colucnas = parseInt(document.getElementById("fil1").value);
        for(var i=0;i<filas;i++){
            var coso = document.createElement("BR");
            document.getElementById("m1").appendChild(coso);
            for(var q=0;q<colucnas;q++){
                cuadrizar_fila_1();         
            }
        }
        var filas2 = parseInt(document.getElementById("fil1").value);
        var colucnas2 = parseInt(document.getElementById("fil1").value);
        for(var i=0;i<filas2;i++){
          var coso2 = document.createElement("BR");
          document.getElementById("m2").appendChild(coso2);
          for(var q=0;q<colucnas2;q++){
            cuadrizar_fila_2();        
          }
        }
        var botonC = document.createElement("INPUT");
        botonC.setAttribute("Type","Button");
        botonC.setAttribute("Value","Calcular");
        botonC.setAttribute("id","botonCalc");
        botonC.setAttribute("Onclick","calc();");//Envia los datos de la matriz
        //caja.setAttribute("type","number");
        document.getElementById("bot").appendChild(botonC);
        veces_creadas++;
      }
    }
  }
  /*----------------------------------
  En la siguiente funcion se hara la multiplicacion por strassen
  ------------------------------*/
  function calc(){
    //sacamos los valores
    var filas_M1=parseInt(document.getElementById("fil1").value);
    var colucnas_M1=parseInt(document.getElementById("fil1").value);
    var filas_M2=parseInt(document.getElementById("fil1").value);
    var colucnas_M2=parseInt(document.getElementById("fil1").value);
    //Creacion de las matrices
    var A = Matrix.new(filas_M1,colucnas_M1,"A"); 
    var B = Matrix.new(filas_M2,colucnas_M2,"B");
    var C;
    
    var conta=0;
    
    //Se rellena matriz A
    var cosos_de_matrizar1=0;
    for(var k = 0; k<filas_M1;k++){
      for(var j= 0;j<colucnas_M1;j++){
        var n1=parseInt(document.matriz1.elements[cosos_de_matrizar1].value);
        A.set(k,j,n1);//<-----------------------Valores a matriz A
        cosos_de_matrizar1++;
      }
    }
    //Se rrellena matriz B
    var cosos_de_matrizar2=0;
    for(var k = 0; k<filas_M2;k++){
      for(var j= 0;j<colucnas_M2;j++){
        var n2=parseInt(document.matriz2.elements[cosos_de_matrizar2].value);
        B.set(k,j,n2);//<-----------------------Valores a matriz B
        cosos_de_matrizar2++;
      }
    }

    //Se calcula A*B con algoritmo de Strassen
    C = Matrix.strassenMatrixMul(A,B);
    
    //Se muestra C en la pagina
    for(var i=0;i<filas_M1;i++){
      var coso2 = document.createElement("BR");
      document.getElementById("resultado").appendChild(coso2);
      for(var q=0;q<colucnas_M2;q++){
        var caja3 = document.createElement("INPUT");
        caja3.setAttribute("size","2");
        caja3.setAttribute("value",C.get(i,q));
        document.getElementById("resultado").appendChild(caja3);
        conta++;
      }
    }
    //inicializacion de la animacion
    var tamMin = 25;
    var tamMat = tamMin*C.n;
    var canvas = document.getElementById('canvas');
      canvas.width = canvas.width;//limpia el canvas
      if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        //ctx.strokeStyle = "white";
        //ctx.
        //Creamos matriz A
        var r = new Path2D();
        var posInitY = 50;
        var px = 70;  //posicion en x inicial de la matriz
        var py = posInitY;   //posicion en y inicial de la matriz
        
        for(var i=0;i<C.n;i++){
          for(var j=0;j<C.n;j++){
            r.rect(px,py,tamMin,tamMin);
            if(A.get(i,j) >= -9 && A.get(i,j) < 10){
              ctx.font = '20px serif';
            }
            else if ((A.get(i,j) >= -99 && A.get(i,j) < -9) || (A.get(i,j) >= 10 && A.get(i,j) < 100) ){
              ctx.font = '14px serif';
            }
            else{
              ctx.font = '12px serif';
            }
            ctx.fillText(A.get(i,j),px+5,py+18);
            ctx.stroke(r);
            px = px+tamMin;
          }
          px=70;
          py=py+tamMin;
        }
        //Texto A =
        ctx.font = '30px serif';
        var pmit = py-(tamMat/2);
        ctx.fillText("A =",10,pmit);
        //Creamos matriz B
        px = 70+tamMat+100;
        py = posInitY;
        for(var i=0;i<C.n;i++){
          for(var j=0;j<C.n;j++){
            r.rect(px,py,tamMin,tamMin);
            if(B.get(i,j) >= -9 && B.get(i,j) < 10){
              ctx.font = '20px serif';
            }
            else if ((B.get(i,j) >= -99 && B.get(i,j) < -9) || (B.get(i,j) >= 10 && B.get(i,j) < 100) ){
              ctx.font = '14px serif';
            }
            else{
              ctx.font = '12px serif';
            }
            ctx.fillText(B.get(i,j),px+5,py+18);
            ctx.stroke(r);
            px = px+tamMin;
          }
          px=70+tamMat+100;
          py=py+tamMin;
        }
        //Texto B =
        ctx.font = '30px serif';
        pmit = py-(tamMat/2);
        px = 70+tamMat+40;
        ctx.fillText("B =",px,pmit);

      }
    //funcion para poner las letras de la "a" a la "h"
    function ponerLetrasA_H(nl){
      py = posInitY+tamMat+70+(tamMat/4);
      var espacio = 40;
      var letra;
      var newTamM = tamMat/2;
      px = 10+((espacio+newTamM)*nl);
      switch(nl){
        case 0: //para a
          letra = "a =";
        break;
        case 1: //para b
        letra = "b =";
        break;
        case 2: //para c
        letra = "c ="; 
        break;
        case 3: //para d
        letra = "d =";
        break;
        case 4: //para e
        letra = "e =";
        break;
        case 5: //para f
        letra = "f ="; 
        break;
        case 6: //para g
        letra = "g ="; 
        break;
        case 7: //para h
        letra = "h =";
        break;
        default: 
        break;
      }
      ctx.font = '20px serif';
      ctx.fillText(letra,px,py);
    }
    //funcion para pintar los recuadros de las matrices A y B
    async function pintarCuad(n){
      var newTamM = tamMat/2;
      switch(n){
        case 0: //para a
          py = posInitY;
          px = 70;  
        break;
        case 1: //para b
          py = posInitY;
          px = 70+newTamM; 
        break;
        case 2: //para c
          py = posInitY+newTamM;
          px = 70; 
        break;
        case 3: //para d
          py = posInitY+newTamM;
          px = 70+newTamM;
        break;
        case 4: //para e
          py = posInitY;
          px = 70+tamMat+100;
        break;
        case 5: //para f
          py = posInitY;
          px = 70+tamMat+100+newTamM; 
        break;
        case 6: //para g
          py = posInitY+newTamM;
          px = 70+tamMat+100;
        break;
        case 7: //para h
          py = posInitY+newTamM;
          px = 70+tamMat+100+newTamM;
        break;
        default: 
        break;
      }
      ctx.strokeStyle = "white";
      var rn = new Path2D();
      rn.rect(px,py,newTamM ,newTamM);
      ctx.stroke(rn);
      await sleep(400);
      ctx.strokeStyle = "black";
      ctx.stroke(rn);
    }
    //funcion para copiar las 8 submatrices
    function copiarSubMat(n){
      py = posInitY+tamMat+70;
      var espacio = 40;
      var newTamM = tamMat/2;
      px = 40+((espacio+newTamM)*n);
      var matriz;
      var inicioF;
      var finalF;
      var inicioC;
      var finalC;
      switch(n){
        case 0: //para a
          matriz = A;
          inicioF = 0;
          finalF = C.n/2;
          inicioC = 0;
          finalC = C.n/2;
        break;
        case 1: //para b
          matriz = A;
          inicioF = 0;
          finalF = C.n/2;
          inicioC = C.n/2;
          finalC = C.n; 
        break;
        case 2: //para c
          matriz = A;
          inicioF = C.n/2;
          finalF = C.n;
          inicioC = 0;
          finalC = C.n/2; 
        break;
        case 3: //para d
          matriz = A;
          inicioF = C.n/2;
          finalF = C.n;
          inicioC = C.n/2;
          finalC = C.n;
        break;
        case 4: //para e
          matriz = B;
          inicioF = 0;
          finalF = C.n/2;
          inicioC = 0;
          finalC = C.n/2;
        break;
        case 5: //para f
          matriz = B;
          inicioF = 0;
          finalF = C.n/2;
          inicioC = C.n/2;
          finalC = C.n; 
        break;
        case 6: //para g
          matriz = B;
          inicioF = C.n/2;
          finalF = C.n;
          inicioC = 0;
          finalC = C.n/2;
        break;
        case 7: //para h
          matriz = B;
          inicioF = C.n/2;
          finalF = C.n;
          inicioC = C.n/2;
          finalC = C.n;
        break;
        default: 
        break;
      }

      for(var i=inicioF;i<finalF;i++){
        for(var j=inicioC;j<finalC;j++){
          r.rect(px,py,tamMin,tamMin);
          if(matriz.get(i,j) >= -9 && matriz.get(i,j) < 10){
            ctx.font = '20px serif';
          }
          else if ((matriz.get(i,j) >= -99 && matriz.get(i,j) < -9) || (matriz.get(i,j) >= 10 && matriz.get(i,j) < 100) ){
            ctx.font = '14px serif';
          }
          else{
            ctx.font = '12px serif';
          }
          ctx.fillText(matriz.get(i,j),px+5,py+18);
          ctx.stroke(r);
          px = px+tamMin;
        }
        px=40+((espacio+newTamM)*n);
        py=py+tamMin;
      }


    }
    

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    //funcion para poner las formulas
    function ponerForm(n){
      var espacio;
      if(tamMat/2  < 40){
        espacio = 35;
      }
      else{
        espacio = (tamMat/2)+10;
      }
      py = posInitY+tamMat+130+(tamMat/2)+(espacio*n);
      px = 70;
      ctx.font = '25px serif';
      switch(n){
        case 0:
          ctx.fillText("P1: (a+d)(e+f) =",px,py);
        break;
        case 1:
          ctx.fillText("P2: (c+d)e =",px,py);
        break;
        case 2:
          ctx.fillText("P3: a(f+h) =",px,py);
        break;
        case 3:
          ctx.fillText("P4: d(g+e) =",px,py);
        break;
        case 4:
          ctx.fillText("P5: (a+b)d =",px,py);
        break;
        case 5:
          ctx.fillText("P6: (c+a)(e+f) =",px,py);
        break;
        case 6:
          ctx.fillText("P7: (b+d)(g+h) =",px,py);
        break;
        default:
        break;
      }
      

    }
    var contPos = 0;
    //funcion para poner las matrices resultado de P1 a P7
    function ponerMatRP1AP7(n){
      var espacio = ((tamMat/2)+10)*n;
      if(C.n/2 > 1){
        espacio = ((tamMat/2)+7)*n;
      }
      py = posInitY+tamMat+110+(tamMat/2)+espacio;
      px = 400;
      for(var i=0;i<C.n/2;i++){
        for(var j=0;j<C.n/2;j++){
          r.rect(px,py,tamMin,tamMin);
          if(valores[contPos] >= -9 && valores[contPos] < 10){
            ctx.font = '20px serif';
          }
          else if ((valores[contPos] >= -99 && valores[contPos] < -9) || (valores[contPos] >= 10 && valores[contPos] < 100) ){
            ctx.font = '14px serif';
          }
          else{
            ctx.font = '12px serif';
          }
          ctx.fillText(valores[contPos],px+5,py+18);
          contPos = contPos+1;
          ctx.stroke(r);
          px = px+tamMin;
        }
        px=400;
        py=py+tamMin;
      }
    }
    //funcion para poner las formulas finales
    function ponerFormFinales(n){
      var espacio;
      var espacioFormAnt;
      if(tamMat/2  < 40){
        espacio = 35;
        espacioFormAnt = 35*6;
      }
      else{
        espacio = (tamMat/2)+10;
        espacioFormAnt = ((tamMat/2)+10)*6;
      }
      py = posInitY+tamMat+130+90+(tamMat/2)+espacioFormAnt+(espacio*n);
      px = 70;
      ctx.font = '25px serif';
      switch(n){
        case 0:
          ctx.fillText("C11: P1+P4-P5+P7 =",px,py);
        break;
        case 1:
          ctx.fillText("C12: P3+P5 =",px,py);
        break;
        case 2:
          ctx.fillText("C21: P2+P4 =",px,py);
        break;
        case 3:
          ctx.fillText("C22: P1+P3-P2+P6 =",px,py);
        break;
        default:
        break;
      }
    }
    //funcion para poner las matrices resultado de C11 a C22
    var contIns = 0;
    function ponerMatRC111AC22(n){
      var espacio = ((tamMat/2)+10)*n;
      var espacioFormAnt = ((tamMat/2)+10)*6;
      if(C.n/2 > 1){
        espacio = ((tamMat/2)+7)*n;
        espacioFormAnt = ((tamMat/2)+7)*6;
      }
      py = posInitY+tamMat+110+90+(tamMat/2)+espacioFormAnt+espacio;
      px = 400;
      switch(n){
        case 0: //para a
          inicioF = 0;
          finalF = C.n/2;
          inicioC = 0;
          finalC = C.n/2;
        break;
        case 1: //para b
          inicioF = 0;
          finalF = C.n/2;
          inicioC = C.n/2;
          finalC = C.n; 
        break;
        case 2: //para c
          inicioF = C.n/2;
          finalF = C.n;
          inicioC = 0;
          finalC = C.n/2; 
        break;
        case 3: //para d
          inicioF = C.n/2;
          finalF = C.n;
          inicioC = C.n/2;
          finalC = C.n;
        break;
        default:
        break;
      }
      
      for(var i=inicioF;i<finalF;i++){
        for(var j=inicioC;j<finalC;j++){
          r.rect(px,py,tamMin,tamMin);
          if(C.get(i,j) >= -9 && C.get(i,j) < 10){
            ctx.font = '20px serif';
          }
          else if ((C.get(i,j) >= -99 && C.get(i,j) < -9) || (C.get(i,j) >= 10 && C.get(i,j) < 100) ){
            ctx.font = '14px serif';
          }
          else{
            ctx.font = '12px serif';
          }
          ctx.fillText(C.get(i,j),px+5,py+18);
          ctx.stroke(r);
          px = px+tamMin;
        }
        px=400;
        py=py+tamMin;
      }
    }
    function crearMatrizC(){
      var espacio = ((tamMat/2)+10)*4;
      var espacioFormAnt = ((tamMat/2)+10)*6;
      if(C.n/2 > 1){
        espacio = ((tamMat/2)+7)*4;
        espacioFormAnt = ((tamMat/2)+7)*6;
      }
      py = posInitY+tamMat+110+90+(tamMat/2)+espacioFormAnt+espacio+50;
      px = 70;

      ctx.font = '30px serif';
      var pmit = py+(tamMat/2);
      ctx.fillText("C =",10,pmit);

      for(var i=0;i<C.n;i++){
        for(var j=0;j<C.n;j++){
          r.rect(px,py,tamMin,tamMin);
          if(C.get(i,j) >= -9 && C.get(i,j) < 10){
            ctx.font = '20px serif';
          }
          else if ((C.get(i,j) >= -99 && C.get(i,j) < -9) || (C.get(i,j) >= 10 && C.get(i,j) < 100) ){
            ctx.font = '14px serif';
          }
          else{
            ctx.font = '12px serif';
          }
          ctx.fillText(C.get(i,j),px+5,py+18);
          ctx.stroke(r);
          px = px+tamMin;
        }
        px=70;
        py=py+tamMin;
      }
    }
    //funcion que inicia la animacion
    var btnI = document.getElementById('iniciar');
    async function empezarAnimacion() {
      for(var i=0;i<8;i++){
        ponerLetrasA_H(i);
        await sleep(1000);
        pintarCuad(i);
        await sleep(600);
        copiarSubMat(i)
        await sleep(600);
      }
      await sleep(300);
      for(var i=0;i<7;i++){
        ponerForm(i);
        await sleep(500);
        ponerMatRP1AP7(i);
        await sleep(900);
      }
      await sleep(400);
      for(var i=0;i<4;i++){
        ponerFormFinales(i);
        await sleep(500);
        ponerMatRC111AC22(i);
        await sleep(900);
      }
      await sleep(900);
      crearMatrizC();
    }
    btnI.addEventListener('click',empezarAnimacion,true);


  }