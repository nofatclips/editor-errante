"use strict"
//Application
var editorErrante = angular
	.module("EditorErrante", ["ngRoute", "LocalStorageModule", "neTextSplitter"])
    .run(["Data", "Settings", "localStorageService", function(Data, Settings, store){
        window.addEventListener("beforeunload", function(ev) {
            if (Settings.salvaInUscita === "yes") {
                store.set("ilRacconto", Data.ilRacconto);
                store.set("ilTitolo", Data.ilTitolo);
                store.set("laFirma", Data.laFirma);
            }
        })
    }]).constant("Interlinea", {
        "singola":  1.25,
        "doppia":   1.5,
        "tripla":   1.75
    }).constant("Status", {
        "campoSelezionato": "il-racconto",
        "selezione": "ilRacconto",
        "modo": "NE"
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

editorErrante.factory("Settings", ["localStorageService", "Interlinea", function(store, interlinea) {
  return {
    "allineaTitolo": store.get("allineaTitolo") || "left",
    "allineaRacconto": store.get("allineaRacconto") || "left",
    "allineaFirma": store.get("allineaFirma") || "right",
    "salvaInUscita": store.get("salvaInUscita") || "yes",
    "interlinea": store.get("interlinea") || interlinea.singola
  };
}]);

editorErrante.filter("numChar", function() {
	return function(theText) {
		return theText
            .replace(/\n+/g, "\n")
            .replace(/\.\.\./g,"\u2026")
//            .replace(/\s+/g," ")
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

editorErrante.controller("CanvasController", ["$scope", "$filter", "Data", "Settings", "neSplitter", "neReverseRoute", function ($scope, $filter, Data, Settings, split, indirizzo) {
    $scope.data = Data;
    var inizialeMaiuscola = $filter("inizialeMaiuscola");
    var picture = document.getElementById('immagine-da-salvare');
    var link = document.getElementById('link-salvataggio');
    var canvas = document.getElementById('quattrocento-jpeg');
    var context = canvas.getContext('2d');
    var center = {
        x: 207,
        y: 625
    }, size = {
        x: 85,
        y: 96
    };
    var posizioneUltimaRiga;
    split.setMaxFontSize(18);
    split.setHeight(442);
    split.setContext(context);
    split.setLeading(Settings.interlinea);

    $scope.updateUrl = function() {
        indirizzo.apri("editor").altrimenti(aggiorna).go();
    };
    
    var clearCanvas = function() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#0f3460';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    var redrawImage = function() {
        context.drawImage(logoErranti, center.x-(size.x/2), center.y-(size.y/2), size.x, size.y);
    }
    
    var allineaTesto = function(testo, allineamento, x, y, size) {
        if (allineamento === "left") {
            context.textAlign = "left";
            context.fillText(testo, x, y, size);
        } else if (allineamento === "right") {
            context.textAlign = "right";
            context.fillText(testo, x+size, y, size);
        } else if (allineamento === "middle") {
            context.textAlign = "center";
            context.fillText(testo, x+size/2, y, size);
        }
    }
    
    var redrawTitle = function() {
        context.font = 'bold 20pt Cambria';
        context.fillStyle = 'white';
        context.textBaseline = 'alphabetic';
        allineaTesto (Data.ilTitolo.toUpperCase(), Settings.allineaTitolo, 20, 30, 374);
    }
    
    var redrawText = function() {
        context.font = 'normal 18pt Cambria';        
        context.fillStyle = 'white';
        context.textBaseline = 'alphabetic';
        split.setText(Data.ilRacconto);
        split.process();
        var lines = split.getLines();
        var h = split.getLineHeight();
        context.font = 'normal ' + split.getFontSize() + 'pt Cambria';
        lines.forEach(function(line, num) {
            posizioneUltimaRiga = 70 + num * h;
            allineaTesto(line.trim(), Settings.allineaRacconto, 10, posizioneUltimaRiga, 394);
        });
    }
    
    var redrawName = function() {
        context.font = 'italic 20pt Cambria';
        context.fillStyle = 'white';
        context.textBaseline = 'alphabetic';
        var posizioneFirma = Math.min(posizioneUltimaRiga + split.getLineHeight() + 20, 540);
        allineaTesto(Data.laFirma, Settings.allineaFirma, 14, posizioneFirma, 390);
    }
    
    var redrawWords = function() {
        context.font = 'bold 20pt Cambria';
        context.fillStyle = 'white';
        context.textBaseline = 'middle';
        context.textAlign = "right";
        context.fillText(inizialeMaiuscola($scope.data.parola1), 155, center.y, 150);
        context.textAlign = "left";
        context.fillText(inizialeMaiuscola($scope.data.parola2), 254, center.y, 150);
    }
    
    var redrawNE = function() {
        context.font = 'normal 18pt Cambria';
        context.fillStyle = 'white';
        context.textBaseline = 'alphabetic';
        context.textAlign = "center";
        context.fillText("NarrantiErranti", center.x, 698);
    }
    
    var redrawSettimana = function() {
        if (!$scope.data.laData) return;
        context.font = 'normal 20pt Cambria';
        context.fillStyle = 'white';
        context.textBaseline = 'alphabetic';
        context.textAlign = "center";
        context.fillText("Settimana " + $scope.data.laData, center.x, 570);
    }
    
    var updateImage = function() {
        picture.src = canvas.toDataURL("image/png");
        link.href = picture.src;
        link.download = ($scope.data.ilTitolo || "senzatitolo") + ".png";
    }
    
    var aggiorna = function() {
        clearCanvas();
        redrawImage();
        redrawTitle();
        redrawText();
        redrawName();
        redrawWords();
        redrawNE();
        redrawSettimana();
        updateImage();
    }
    
    $scope.redrawJpeg = aggiorna;
    
    $scope.vaiOpzioni = function() {
        indirizzo.apri("opzioni").go();
    }
    
    var logoErranti = new Image();
    logoErranti.src = "erranti_sml.jpg";
    logoErranti.onload = aggiorna;
    
    //$scope.$watch(function() {return $scope.data}, $scope.redrawJpeg, true);

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

editorErrante.controller("OpzioniController", ["$scope", "localStorageService", "Settings", "Interlinea", "neReverseRoute", function ($scope, store, Settings, Interlinea, indirizzo) {

    $scope.settings = Settings;
    $scope.valori = Interlinea;
    
    $scope.salva = function() {
        store.set("allineaTitolo", Settings.allineaTitolo);
        store.set("allineaRacconto", Settings.allineaRacconto);
        store.set("allineaFirma", Settings.allineaFirma);
        store.set("interlinea", Settings.interlinea);
        indirizzo.apri("editor").go();
    }

}]);

editorErrante.controller("ComposeController", ["$routeParams", "Data", function(parametri, Data) {
    Data.parola1 = parametri.p1;
    Data.parola2 = parametri.p2;
    Data.laData = parametri.date;
}]);