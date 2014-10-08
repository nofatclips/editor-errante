"use strict"
//Application
var editorErrante = angular
	.module("EditorErrante", ["ngRoute", "LocalStorageModule", "neTextSplitter", "neCanvas"])
    .run(["Data", "Settings", "localStorageService", function(Data, Settings, store){
        window.addEventListener("beforeunload", function(ev) {
            if (Settings.salvaInUscita === "yes") {
                store.set("ilRacconto", Data.ilRacconto);
                store.set("ilTitolo", Data.ilTitolo);
                store.set("laFirma", Data.laFirma);
            }
        })
    }]).constant("Valori", 
        {"Interlinea": {
            "singola":  1.25,
            "doppia":   1.5,
            "tripla":   1.75
        }, "Margine": {
            "minimo":  10,
            "medio":   25,
            "ampio":   40
    }}).constant("Status", {
        "campoSelezionato": "il-racconto",
        "selezione": "ilRacconto",
        "modo": "NE"
    }).constant("Stile", {
        "font": "Cambria",
        "color": "white",
        "backgroundColor": '#0f3460'
});

//Service
editorErrante.factory("Data", ["localStorageService", function(store) {
  return {
    "ilRacconto": store.get("ilRacconto") || "",
    "ilTitolo": store.get("ilTitolo") || "",
    "parola1": "",
    "parola2": "",
    "laFirma": store.get("laFirma") || "",
    "laData": "",
    "maxChar": 400
  };
}]);

editorErrante.factory("Settings", ["localStorageService", "Valori", function(store, valori) {
  return {
    "allineaTitolo": store.get("allineaTitolo") || "left",
    "allineaRacconto": store.get("allineaRacconto") || "left",
    "allineaFirma": store.get("allineaFirma") || "right",
    "salvaInUscita": store.get("salvaInUscita") || "yes",
    "interlinea": store.get("interlinea") || valori.interlinea.singola,
    "margine": store.get("margine") || valori.margine.minimo
  };
}]);

editorErrante.filter("numChar", function() {
	return function(theText) {
		return theText
            .replace(/\n+/g, "\n")
            .replace(/\.\.\./g,"\u2026")
            .replace(/\s+/g," ")
            .length;
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
}).filter("spaziaturaMultipla", function() {
    var rx = /(.{0,5})[ \t][ \t]+(.{0,9})/;
    return function(theText) {    
        var duplicateSpace = theText.match(rx);
        if (!duplicateSpace) return "";
        return duplicateSpace[0];
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
}).filter("inizialeMaiuscola", function () {
    return function(s) {
        if (!s) return "";
        return s.charAt(0).toUpperCase() + s.slice(1);
    };
});

editorErrante.directive("carattere", function() {
    return {
        "restrict": "E",
        "link": function(scope, element, attributes) {
            element.html("<button>" + attributes.lettera + "</button>");
            element.bind("click", function() {
                scope.accentata(attributes.lettera);
            });
        }
    }
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
function EditorController($scope, $element, Data, Status) {
    $scope.data = Data;
    $element[0].addEventListener("focus", function(evt){
        Status.campoSelezionato = evt.target.id;
        Status.selezione = evt.target.attributes["ng-model"].value.substring(5); //substring elimina "data." dalla stringa
    }, true);
}

// Controller Tastierino
editorErrante.controller("TastieraController", ["$scope", "Data", "Status", function ($scope, Data, Status) {

    var insertAtCursor = function (myValue, textField) {
        if (!textField) return;
        var myField = document.getElementById(textField);
        
        //Source: http://stackoverflow.com/questions/11076975/insert-text-into-textarea-at-cursor-position-javascript
        if (document.selection) { //IE support
            myField.focus();
            document.selection.createRange().myValue;
        } else if (myField.selectionStart || myField.selectionStart == '0') { //MOZILLA and others
            var startPos = myField.selectionStart;
            myField.value = myField.value.substring(0, startPos)
                + myValue
                + myField.value.substring(myField.selectionEnd, myField.value.length);
            myField.focus();
            myField.selectionStart = startPos + myValue.length;
            myField.selectionEnd = myField.selectionStart;
        } else {
            myField.value += myValue;
        }
        
        return myField.value;
    }

    $scope.accentata = function(lettera) {
        $scope.$apply(function() {
            Data[Status.selezione] = insertAtCursor(lettera, Status.campoSelezionato);
        });
    }
}]);

editorErrante.controller("PulsantieraController", ["$scope", "neReverseRoute", "neImager", function ($scope, indirizzo, immagine) {
    immagine.setImage(document.getElementById('immagine-da-salvare'));
    immagine.setLink(document.getElementById('link-salvataggio'));

    $scope.updateUrl = function() {
        indirizzo.apri("editor").altrimenti(immagine.aggiorna).go();
    };
        
    $scope.vaiOpzioni = function() {
        indirizzo.apri("opzioni").go();
    }
    
    immagine.aggiorna();
    
}]);

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
    
    var errorToDetect = function(errorName, theText) {
        return function() {
            return detectError(errorName, theText);
        }   
    }

    $scope.isValid = function() {
        var numChar = $filter("numChar")($scope.data.ilRacconto);
        return numChar <= $scope.data.maxChar;
    };
  
    $scope.invalidInterpunction = errorToDetect("spaziaturaMancante");
    $scope.invalidSpaces = errorToDetect("spaziaturaTroppo");
    $scope.spaceAfterApostrophe = errorToDetect("spazioDopoApostrofo");
    $scope.doubleSpace = errorToDetect("spaziaturaMultipla");
    $scope.badEllipsis = errorToDetect("puntiniSospensivi");
    $scope.missingWords2 = errorToDetect("parolaMancante");
        
    $scope.missingWords = function() {
        var parola = $filter("parolaMancante"),
            testo = $scope.data.ilRacconto;
        var context = parola($scope.data.parola1, testo) || parola($scope.data.parola2, testo)
        $scope.errors.parolaMancante = createContext(context);
        return context!=="";
    };

}

editorErrante.controller("OpzioniController", ["$scope", "localStorageService", "Settings", "Valori", "neReverseRoute", function ($scope, store, Settings, valori, indirizzo) {

    $scope.settings = Settings;
    $scope.interlinea = valori.Interlinea;
    $scope.margine = valori.Margine;
    
    $scope.salva = function() {
        store.set("allineaTitolo", Settings.allineaTitolo);
        store.set("allineaRacconto", Settings.allineaRacconto);
        store.set("allineaFirma", Settings.allineaFirma);
        store.set("interlinea", Settings.interlinea);
        store.set("margine", Settings.margine);
        indirizzo.apri("editor").go();
    }

}]);

editorErrante.controller("ComposeController", ["$routeParams", "Data", function(parametri, Data) {
    Data.parola1 = parametri.p1;
    Data.parola2 = parametri.p2;
    Data.laData = parametri.date;
}]);