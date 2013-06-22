//Application
var numberToText = angular.module("EditorErrante", []);

//Service
numberToText.factory("Data", function() {
  return {
    "ilRacconto": "",
    "ilTitolo": "",
    "parola1": "",
    "parola2": "",
    "maxChar": 400
  };
});

//Controller
function Inserimento($scope, Data) {
  $scope.data = Data;
}

function Statistiche($scope, Data) {

  $scope.data = Data;
  $scope.errors = {};
  
  $scope.numChar = function() {
    return $scope.data.ilRacconto.length;
  };
  
  $scope.isValid = function() {
    return $scope.numChar() <= $scope.data.maxChar;
  };
  
  $scope.invalidInterpunction = function() {
    var rx = /(.{0,5})[\.,;:\?\!][a-zA-Z](.{0,9})/;
    var missingSpace = $scope.data.ilRacconto.match(rx);
    if (!missingSpace) return false;
    $scope.errors.spaziatura = {
      "context": missingSpace[0]
    };
    return true;
  };

  $scope.spaceAfterApostrophe = function() {
    var eccezioni = [
      / po$/
    ];
    var rx = /(.{0,5})' (.{0,9})/;
    var apoSpazio = $scope.data.ilRacconto.match(rx);
    if (!apoSpazio) return false;
    for (var i=0, l=eccezioni.length; i<l; i++) {
      if (apoSpazio[1].match(eccezioni[i])) return false;
    }
    $scope.errors.apostrofo = {
      "context": apoSpazio[0]
    };
    return true;
  };
  
  $scope.badEllipsis = function() {
    var rx = /(.{0,5})([^\.](\.\.|\.{4,})[^\.])(.{0,9})/;
    var puntiniSbagliati = $scope.data.ilRacconto.match(rx);
    if (!puntiniSbagliati) return false;
    $scope.errors.dots = {
      "num": puntiniSbagliati[3].length,
      "context": puntiniSbagliati[0]
    };
    return true;
  };
  
  $scope.senzaParole = function() {
    if ($scope.data.ilRacconto.indexOf($scope.data.parola1) === -1) {
      $scope.errors.manca = $scope.data.parola1;
      return true;
    }
    if ($scope.data.ilRacconto.indexOf($scope.data.parola2) === -1) {
      $scope.errors.manca = $scope.data.parola2;
      return true;
    }
    return false;
  };

}