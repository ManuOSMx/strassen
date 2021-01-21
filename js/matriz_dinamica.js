  //valores rescatados de los inputs iniciales
  var filas_M1=parseInt(document.getElementById("fil1").value);
  var colucnas_M1=parseInt(document.getElementById("colus1").value);

  var filas_M2=parseInt(document.getElementById("fil2").value);
  var colucnas_M2=parseInt(document.getElementById("colus2").value);
// fin de valores rescatados de los inputs iniciales
  function cuadrizar_fila_1(){
      //creacion matriz1
      var caja = document.createElement("INPUT");
      caja.setAttribute("size","2");
      //caja.setAttribute("type","number");
      //document.body.appendChild(caja);
      document.getElementById("m1").appendChild(caja);
  }
  function cuadrizar_fila_2(){
      //creacion matriz2
      var caja2 = document.createElement("INPUT");
      caja2.setAttribute("size","2");
      //caja.setAttribute("type","number");
      //document.body.appendChild(caja);
      document.getElementById("m2").appendChild(caja2);
  }
  var veces_creadas=0;
  function crear(){
      //volvemos a obtener los valores
      var filas_M1=parseInt(document.getElementById("fil1").value);
  var colucnas_M1=parseInt(document.getElementById("colus1").value);

  var filas_M2=parseInt(document.getElementById("fil2").value);
  var colucnas_M2=parseInt(document.getElementById("colus2").value);
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
      var colucnas = parseInt(document.getElementById("colus1").value);
      for(var i=0;i<filas;i++){
          var coso = document.createElement("BR");
          document.getElementById("m1").appendChild(coso);
          for(var q=0;q<colucnas;q++){
              cuadrizar_fila_1();
         
            }
      }


      var filas2 = parseInt(document.getElementById("fil2").value);
      var colucnas2 = parseInt(document.getElementById("colus2").value);
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
      botonC.setAttribute("Onclick","calc();");//Envia los datos de la matriz
      //caja.setAttribute("type","number");
      document.getElementById("bot").appendChild(botonC);
     veces_creadas++;
  }
      }
  }

  function calc(){
//sacamos los valores
var filas_M1=parseInt(document.getElementById("fil1").value);
  var colucnas_M1=parseInt(document.getElementById("colus1").value);
  var filas_M2=parseInt(document.getElementById("fil2").value);
  var colucnas_M2=parseInt(document.getElementById("colus2").value);
  //sacamos valores
var contador_filas=0;
var contador_cols=0;
var c=0;
//var a = parseInt(document.matriz1.elements[0].value);
var conta=0;
var numero_de_cosos=0;
var numero_de_cosos2=0;
//calculamos numero de elementos de la matriz1 dibujada resultado
for(var i=0;i<filas_M1;i++){
          for(var q=0;q<colucnas_M1;q++){
         numero_de_cosos++;
            }
}
//calculamos numero de elementos de la matriz2 dibujada resultado
for(var i=0;i<filas_M2;i++){
          for(var q=0;q<colucnas_M2;q++){
         numero_de_cosos2++;
            }
}
//creamos un arreglo para la matriz resultado
var arreglo_resultados = [numero_de_cosos];
//convertimos a arreglos las matrices creadas para poderlas manipular
//principio matriz 1 matrizar
var matrizar1=new Array(2);
//INICIALIZAR MATRIZAR 1 DE 2 DIMENSIONES de n elementos
for(var n = 0; n<numero_de_cosos;n++){
matrizar1[n] = new Array(2);
}
//Fin de INICIALIZAR MATRIZAR 1 DE 2 DIMENSIONES de n elementos
var cosos_de_matrizar1=0;
for(var k = 0; k<filas_M1;k++){
for(var j= 0;j<colucnas_M1;j++){//se obtienen datos AQUI usar funciones strassen
 var n1=parseInt(document.matriz1.elements[cosos_de_matrizar1].value);
 matrizar1[k][j]=n1;
 cosos_de_matrizar1++;
}
}

/*probar matrizar1
for(var i=0; i<filas_M1; i++) {
for(var j=0; j<colucnas_M1; j++) {
  document.write(matrizar1[i][j]);
}
}*/

//fin matriz 1 matrizar
//principio matriz 2 matrizar
var matrizar2=new Array(2);
//INICIALIZAR MATRIZAR 1 DE 2 DIMENSIONES de n elementos
for(var n = 0; n<numero_de_cosos2;n++){
matrizar2[n] = new Array(2);
}
//Fin de INICIALIZAR MATRIZAR 1 DE 2 DIMENSIONES de n elementos
var cosos_de_matrizar2=0;
for(var k = 0; k<filas_M2;k++){
for(var j= 0;j<colucnas_M2;j++){
 var n2=parseInt(document.matriz2.elements[cosos_de_matrizar2].value);
 matrizar2[k][j]=n2;
 cosos_de_matrizar2++;
}
}
/*probar matrizar 2
for(var i=0; i<filas_M2; i++) {
for(var j=0; j<colucnas_M2; j++) {
  document.write(matrizar2[i][j]);
}
} */

//fin matriz 2 matrizar

//pricipio del calculo matriz resultado
var Matriz_result = new Array(2);
var cosos_de_resultado=0;
for(var k = 0; k<filas_M1;k++){
for(var j= 0;j<colucnas_M2;j++){
cosos_de_resultado++;
}
}
//INICIALIZAR matriz DE 2 DIMENSIONES de n elementos de resultado
for(var n = 0; n<cosos_de_resultado;n++){
Matriz_result[n] = new Array(2);
}
//Fin de INICIALIZAR matriz DE 2 DIMENSIONES de n elementos de resultado
//operar
//inicializo en con un valor 0 todas las posiciones
for(var k = 0; k<filas_M1;k++){
for(var j= 0;j<colucnas_M2;j++){
Matriz_result[k][j]=0;
}
}

//calculo

for(var i=0; i<filas_M1; i++) {
for(var j=0; j<colucnas_M2; j++) {
  for(var k=0;k<colucnas_M1;k++){
      
 Matriz_result[i][j]=Matriz_result[i][j]+ matrizar1[i][k]*matrizar2[k][j];

}

}
}



//final de calculo matriz resultado


//var n2=parseInt(document.matriz2.elements[0].value);
//  var n1=parseInt(document.matriz1.elements[0].value); pruebas
//inicio de insersion de resultados en inputs nuevos
arreglo_resultados[0]=+n1*n2;
for(var i=0;i<filas_M1;i++){
          var coso2 = document.createElement("BR");
        document.getElementById("resultado").appendChild(coso2);
          for(var q=0;q<colucnas_M2;q++){
      var caja3 = document.createElement("INPUT");
      caja3.setAttribute("size","2");
      
      caja3.setAttribute("value",Matriz_result[i][q]);
      //caja.setAttribute("type","number");
      //document.body.appendChild(caja);
      document.getElementById("resultado").appendChild(caja3);
         conta++;
            }
}




}