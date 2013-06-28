//Application
var editorErrante = angular.module("EditorErrante", []);

//Service
editorErrante.factory("Data", function() {
  return {
    "ilRacconto": "",
    "ilTitolo": "",
    "parola1": "",
    "parola2": "",
    "maxChar": 400
  };
});

editorErrante.filter("numChar", function() {
	return function(theText) {
		return theText.replace(/\n/g, "").replace(/\.\.\./g,"\u2026").length;
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
  
  var missingWord = function(word) {
	if (!word) return false
    if ($scope.data.ilRacconto.search(new RegExp("\\W" + word + "\\W")) === -1) {
      $scope.errors.wordMissing = word;
      return true;
    }
	return false
  }
  
  $scope.missingWords = function() {
	if (missingWord($scope.data.parola1)) return true;
	if (missingWord($scope.data.parola2)) return true;
	return false;
  };

}