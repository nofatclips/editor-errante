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
function EditorController($scope, Data) {
  $scope.data = Data;
}

//Controller
function ReportController($scope, Data) {

  $scope.data = Data;
  $scope.errors = {};
  
  $scope.numChar = function() {
    // Righe vuote non contano
	// Tre puntini contano come singolo carattere
    return $scope.data.ilRacconto.replace(/\n/g, "").replace(/\.\.\./g,"\u2026").length;
  };
  
  $scope.isValid = function() {
    return $scope.numChar() <= $scope.data.maxChar;
  };
  
  $scope.invalidInterpunction = function() {
    var rx = /(.{0,5})[\.,;:\?\!][a-zA-Z](.{0,9})/;
    var missingSpace = $scope.data.ilRacconto.match(rx);
    if (!missingSpace) return false;
    $scope.errors.spaziaturaMancante = {
      "context": missingSpace[0]
    };
    return true;
  };

  $scope.invalidSpaces = function() {
    var rx = /(.{0,5}) [\.,;:\?\!](.{0,9})/;
    var unrequiredSpace = $scope.data.ilRacconto.match(rx);
    if (!unrequiredSpace) return false;
    $scope.errors.spaziaturaTroppo = {
      "context": unrequiredSpace[0]
    };
    return true;
  };

  $scope.spaceAfterApostrophe = function() {
    var exceptionsToTheRule = [
      / po$/
    ];
    var rx = /(.{0,5})' (.{0,9})/;
    var foundSpace = $scope.data.ilRacconto.match(rx);
    if (!foundSpace) return false;
    for (var i=0, l=exceptionsToTheRule.length; i<l; i++) {
      if (foundSpace[1].match(exceptionsToTheRule[i])) return false;
    }
    $scope.errors.apostrofo = {
      "context": foundSpace[0]
    };
    return true;
  };
  
  $scope.badEllipsis = function() {
    var rx = /(.{0,5})([^\.](\.\.|\.{4,})[^\.])(.{0,9})/;
    var notThreeDots = $scope.data.ilRacconto.match(rx);
    if (!notThreeDots) return false;
    $scope.errors.dots = {
      "num": notThreeDots[3].length,
      "context": notThreeDots[0]
    };
    return true;
  };
  
  $scope.missingWords = function() {
    if ($scope.data.ilRacconto.indexOf($scope.data.parola1) === -1) {
      $scope.errors.wordMissing = $scope.data.parola1;
      return true;
    }
    if ($scope.data.ilRacconto.indexOf($scope.data.parola2) === -1) {
      $scope.errors.wordMissing = $scope.data.parola2;
      return true;
    }
    return false;
  };

}