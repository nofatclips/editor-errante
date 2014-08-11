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

editorErrante.filter("cercaParola", function() {
    return function(word) {
        return new RegExp("\\b" + word + "\\b", "i");
    }
}).filter("spaziaturaMancante", function() {
    var rx = /(.{0,5})[\.,;:\?\!][a-zA-Z](.{0,9})/;
    return function(theText) {
        var missingSpace = theText.match(rx);
        if (!missingSpace) return "";
        return missingSpace[0];
    };
}).filter("spaziaturaTroppo", function() {
    var rx = /(.{0,5}) [\.,;:\?\!](.{0,9})/;
    return function(theText) {    
        var unrequiredSpace = theText.match(rx);
        if (!unrequiredSpace) return "";
        return unrequiredSpace[0];
    };
}).filter("spazioDopoApostrofo", function (cercaParolaFilter) {
    var exceptionsToTheRule = [
      "po"
    ];
    var rx = /(.{0,5})' (.{0,9})/;
    return function (theText) {
        var foundSpace = theText.match(rx);
        if (!foundSpace) return "";
        var isException = exceptionsToTheRule.some(function (word) {
            return foundSpace[1].match(cercaParolaFilter(word));
        });
        return (isException)? "" : foundSpace[0];
    };
}).filter("puntiniSospensivi", function() {
    var rx = /(.{0,5})([^\.](\.\.|\.{4,})([^\.]|$))(.{0,9})/;
    return function(theText) {
        var notThreeDots = theText.match(rx);
        if (!notThreeDots) return "";
        return {
            "num": notThreeDots[3].length,
            "context": notThreeDots[0]
        };
    };
}).filter("parolaMancante", function (cercaParolaFilter) {
    return function(word, theText) {
        if (!word) return "";
        if (theText.search(cercaParolaFilter(word)) === -1) {
            return {"word": word};
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

function TastieraController($scope, Data) {
    $scope.data = Data;
    
    $scope.accentata = function(a,b,c) {
        console.debug(a,b,c);
        insertAtCursor(a);
    }
}

function ReportController($scope, $filter, Data) {

    $scope.data = Data;
    $scope.errors = {};
  
    var createContext = function(contextData) {
        if (!contextData) return {};
        if (typeof contextData === "string") return {"context": contextData};
        return contextData;
    };
    
    var detectError = function(errorName, theText) {
        var contextData = $filter(errorName)(theText || $scope.data.ilRacconto);
        $scope.errors[errorName] = createContext(contextData);
        return contextData!=="";        
    }

    $scope.isValid = function() {
        var numChar = $filter("numChar")($scope.data.ilRacconto);
        return numChar <= $scope.data.maxChar;
    };
  
    $scope.invalidInterpunction = function() {
        return detectError("spaziaturaMancante");
    };

    $scope.invalidSpaces = function() {
        return detectError("spaziaturaTroppo");
    };
    
    $scope.spaceAfterApostrophe = function() {
        return detectError("spazioDopoApostrofo");
    };
    
    $scope.badEllipsis = function() {
        return detectError("puntiniSospensivi");
    };

    $scope.missingWords2 = function() {
        return detectError("parolaMancante");
    };
    
  $scope.missingWords = function() {
    var parola = $filter("parolaMancante"),
        testo = $scope.data.ilRacconto;
    var context = parola($scope.data.parola1, testo) || parola($scope.data.parola2, testo)
    $scope.errors.parolaMancante = createContext(context);
	return context!=="";
  };

}

editorErrante.controller("ComposeController", function() {
});

function insertAtCursor(myValue) {
    var myField = document.getElementById("il-racconto");
    
    //Source: http://stackoverflow.com/questions/11076975/insert-text-into-textarea-at-cursor-position-javascript
    //IE support
    if (document.selection) {
        myField.focus();
        sel = document.selection.createRange();
        sel.text = myValue;
    }
    //MOZILLA and others
    else if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
}