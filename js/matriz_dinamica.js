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
var val = []; 
var strassen = function(a, b) {
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
    

    var M1 = strassen(A11.add(A22), B11.add(B22));
    var M2 = strassen(A21.add(A22), B11         );
    var M3 = strassen(A11         , B12.sub(B22));
    var M4 = strassen(A22         , B21.sub(B11));
    var M5 = strassen(A11.add(A12), B22         );
    var M6 = strassen(A21.sub(A11), B11.add(B12));
    var M7 = strassen(A12.sub(A22), B21.add(B22));

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

  for(var i=0;i<C.n;i++){
    for(var j=0;j<C.n;j++){
      //console.log(C.get(i,j));
      val.push(C.get(i,j));
    }
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
    var c = strassen(a,b);
    console.log("contador:"+cont);


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
      canvas.width = canvas.width;
      if (canvas.getContext) {
        var ctx = canvas.getContext('2d');

        //Creamos matriz A
        var r = new Path2D();
        var px = 70;  //posicion en x inicial de la matriz
        var py = 5;   //posicion en y inicial de la matriz
        
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
        px = 70;
        py = py+20;
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
          px=70;
          py=py+tamMin;
        }
        //Texto B =
        ctx.font = '30px serif';
        pmit = py-(tamMat/2);
        ctx.fillText("B =",10,pmit);

      }
    /*//Se agrega matriz A a animacion
    for(var i=0;i<filas_M1;i++){
      var coso3 = document.createElement("BR");
      document.getElementById("cajaSMa").appendChild(coso3);
      for(var q=0;q<colucnas_M2;q++){
        var caja4 = document.createElement("INPUT");
        caja4.setAttribute("size","2");
        caja4.setAttribute("value",A.get(i,q));
        document.getElementById("cajaSMa").appendChild(caja4);
        conta++;
      }
    }
    //Se agrega matriz B a animacion
    for(var i=0;i<filas_M1;i++){
      var coso3 = document.createElement("BR");
      document.getElementById("caja2").appendChild(coso3);
      for(var q=0;q<colucnas_M2;q++){
        var caja4 = document.createElement("INPUT");
        caja4.setAttribute("size","2");
        caja4.setAttribute("value",B.get(i,q));
        document.getElementById("caja2").appendChild(caja4);
        conta++;
      }
    }
    //Submatriz a 
    for(var i=0;i<filas_M1/2;i++){
      var coso3 = document.createElement("BR");
      document.getElementById("cajaSMa").appendChild(coso3);
      for(var q=0;q<colucnas_M2/2;q++){
        var caja4 = document.createElement("INPUT");
        caja4.setAttribute("size","2");
        caja4.setAttribute("value",A.get(i,q));
        document.getElementById("cajaSMa").appendChild(caja4);
        conta++;
      }
    }
    //Submatriz b
    for(var i=0;i<filas_M1/2;i++){
      var coso3 = document.createElement("BR");
      document.getElementById("cajaSMb").appendChild(coso3);
      for(var q=2;q<colucnas_M2;q++){
        var caja4 = document.createElement("INPUT");
        caja4.setAttribute("size","2");
        caja4.setAttribute("value",A.get(i,q));
        document.getElementById("cajaSMb").appendChild(caja4);
        conta++;
      }
    }
    //Submatriz c
    for(var i=2;i<filas_M1;i++){
      var coso3 = document.createElement("BR");
      document.getElementById("cajaSMc").appendChild(coso3);
      for(var q=0;q<colucnas_M2/2;q++){
        var caja4 = document.createElement("INPUT");
        caja4.setAttribute("size","2");
        caja4.setAttribute("value",A.get(i,q));
        document.getElementById("cajaSMc").appendChild(caja4);
        conta++;
      }
    }
    //Submatriz d
    for(var i=2;i<filas_M1;i++){
      var coso3 = document.createElement("BR");
      document.getElementById("cajaSMd").appendChild(coso3);
      for(var q=2;q<colucnas_M2;q++){
        var caja4 = document.createElement("INPUT");
        caja4.setAttribute("size","2");
        caja4.setAttribute("value",A.get(i,q));
        document.getElementById("cajaSMd").appendChild(caja4);
        conta++;
      }
    }

    //Submatriz e 
    for(var i=0;i<filas_M1/2;i++){
      var coso3 = document.createElement("BR");
      document.getElementById("cajaSMe").appendChild(coso3);
      for(var q=0;q<colucnas_M2/2;q++){
        var caja4 = document.createElement("INPUT");
        caja4.setAttribute("size","2");
        caja4.setAttribute("value",B.get(i,q));
        document.getElementById("cajaSMe").appendChild(caja4);
        conta++;
      }
    }
    //Submatriz f
    for(var i=0;i<filas_M1/2;i++){
      var coso3 = document.createElement("BR");
      document.getElementById("cajaSMf").appendChild(coso3);
      for(var q=2;q<colucnas_M2;q++){
        var caja4 = document.createElement("INPUT");
        caja4.setAttribute("size","2");
        caja4.setAttribute("value",B.get(i,q));
        document.getElementById("cajaSMf").appendChild(caja4);
        conta++;
      }
    }
    //Submatriz g
    for(var i=2;i<filas_M1;i++){
      var coso3 = document.createElement("BR");
      document.getElementById("cajaSMg").appendChild(coso3);
      for(var q=0;q<colucnas_M2/2;q++){
        var caja4 = document.createElement("INPUT");
        caja4.setAttribute("size","2");
        caja4.setAttribute("value",B.get(i,q));
        document.getElementById("cajaSMg").appendChild(caja4);
        conta++;
      }
    }
    //Submatriz h
    for(var i=2;i<filas_M1;i++){
      var coso3 = document.createElement("BR");
      document.getElementById("cajaSMh").appendChild(coso3);
      for(var q=2;q<colucnas_M2;q++){
        var caja4 = document.createElement("INPUT");
        caja4.setAttribute("size","2");
        caja4.setAttribute("value",B.get(i,q));
        document.getElementById("cajaSMh").appendChild(caja4);
        conta++;
      }
    }*/

    /*var btn = document.getElementById('prueba'),
    //caja = document.getElementById('caja'),
    //caj2 = document.getElementById('caja2'),
    cajSMa = document.getElementById('cajaSMa'),
    cajSMb = document.getElementById('cajaSMb'),
    cajSMc = document.getElementById('cajaSMc'),
    cajSMd = document.getElementById('cajaSMd'),
    contador = 0;

    function empezarAnimacion() {
      if(contador == 0){
        //caja.classList.add('animar');
        //caja2.classList.add('animar');
        cajaSMa.classList.add('animar');
        cajaSMb.classList.add('animar');
        cajaSMc.classList.add('animar');
        cajaSMd.classList.add('animar');
        contador = 1;
      }
      else {
        //caja.classList.remove('animar');
        //caja2.classList.remove('animar');
        cajaSMa.classList.remove('animar');
        cajaSMb.classList.remove('animar');
        cajaSMc.classList.remove('animar');
        cajaSMd.classList.remove('animar');
        contador = 0;
      }
    }
    empezarAnimacion();
    btn.addEventListener('click',empezarAnimacion,true);*/


  }