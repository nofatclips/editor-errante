//Application
var editorErrante = angular
	.module("EditorErrante", [])
	.config(function($routeProvider) {
		$routeProvider.when("/", {
			"templateUrl": "compose.html",
			"controller": "ComposeController"
		});
		$routeProvider.otherwise({
			"redirectTo": "/"
		});
	});

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

editorErrante.filter("spazioMancante", function() {
    var rx = /(.{0,5})[\.,;:\?\!][a-zA-Z](.{0,9})/;
    return function(theText) {
        var missingSpace = theText.match(rx);
        if (!missingSpace) return "";
        return missingSpace[0];
    };
});

editorErrante.filter("spazioDiTroppo", function() {
    var rx = /(.{0,5}) [\.,;:\?\!](.{0,9})/;
    return function(theText) {    
        var unrequiredSpace = theText.match(rx);
        if (!unrequiredSpace) return "";
        return unrequiredSpace[0];
    };
});

editorErrante.filter("spazioDopoApostrofo", function() {
    var exceptionsToTheRule = [
      / po$/
    ];
    var rx = /(.{0,5})' (.{0,9})/;
    return function(theText) {
        var foundSpace = theText.match(rx);
        if (!foundSpace) return "";
        for (var i=0, l=exceptionsToTheRule.length; i<l; i++) {
          if (foundSpace[1].match(exceptionsToTheRule[i])) return "";
        }
        return foundSpace[0];
    };
});

editorErrante.filter("puntiniSospensivi", function() {
    var rx = /(.{0,5})([^\.](\.\.|\.{4,})[^\.])(.{0,9})/;
    return function(theText) {
        var notThreeDots = theText.match(rx);
        if (!notThreeDots) return "";
        return {
            "num": notThreeDots[3].length,
            "context": notThreeDots[0]
        };
    };
});

editorErrante.filter("parolaMancante", function() {
    var theWord = function(word) {return new RegExp("\\W" + word + "\\W");}
    return function(word, theText) {
        if (!word) return "";
        if (theText.search(theWord(word)) === -1) {
            return word;
        }
        return "";
    };
});

editorErrante.directive("spiegazioneErrore", function() {
	return {
		"restrict": "A",
		link: function(scope, element, attributes) {
			element.bind("mouseenter", function() {
                if (!scope.blocca) {
                    scope.spiegazioneErrore = attributes.spiegazioneErrore;
                    scope.$apply();
                }
			}).bind("mouseleave", function() {
                if (!scope.blocca) {
                    scope.spiegazioneErrore = undefined;
                    scope.$apply();
                }
            }).bind("click", function() {
				scope.spiegazioneErrore = attributes.spiegazioneErrore;
                scope.erroreSelezionato = attributes.errore;
                console.log(scope.erroreSelezionato in scope.errors);
                scope.blocca = true;
				scope.$apply();
            });
		}
	}
});

editorErrante.directive("cliccaPerNascondere", function() {
    return function(scope, element) {
        element.bind("click", function() {
            scope.blocca = false;
            scope.spiegazioneErrore = undefined;
            console.log(scope.erroreSelezionato in scope.errors);
            scope.erroreSelezionato = undefined;
            scope.$apply();
        });
    };
});

//Controller
function EditorController($scope, Data) {
  $scope.data = Data;
}

//Controller
function ReportController($scope, $filter, Data) {

  $scope.data = Data;
  $scope.errors = {};

  $scope.isValid = function() {
	var numChar = $filter("numChar")($scope.data.ilRacconto);
    return numChar <= $scope.data.maxChar;
  };
  
  $scope.invalidInterpunction = function() {
    var context = $filter("spazioMancante")($scope.data.ilRacconto);
    $scope.errors.spaziaturaMancante = {
      "context": context
    };
    return context!=="";
  };

  $scope.invalidSpaces = function() {
    var context = $filter("spazioDiTroppo")($scope.data.ilRacconto);
    $scope.errors.spaziaturaTroppo = {
      "context": context
    };
    return context!=="";
  };

  $scope.spaceAfterApostrophe = function() {
    var context = $filter("spazioDopoApostrofo")($scope.data.ilRacconto);
    $scope.errors.apostrofo = {
      "context": context
    };
    return context!=="";
  };
  
  $scope.badEllipsis = function() {
    var context = $filter("puntiniSospensivi")($scope.data.ilRacconto);
    $scope.errors.dots = context;
    return context!=="";
  };
  
  $scope.missingWords = function() {
    var parola = $filter("parolaMancante"),
        testo = $scope.data.ilRacconto;
    var context = parola($scope.data.parola1, testo) || parola($scope.data.parola2, testo)
    $scope.errors.wordMissing = context;
	return context!=="";
  };

}

editorErrante.controller("ComposeController", function() {
});