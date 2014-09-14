//Application
var editorErrante = angular
	.module("EditorErrante", [])
	.config(function($routeProvider) {
		$routeProvider.when("/", {
			"templateUrl": "compose.html",
			"controller": "ComposeController"
		}).when("/:p1/:p2/:date", {
			"templateUrl": "compose.html",
			"controller": "ComposeController"
		}).otherwise({
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
    "laFirma": "",
    "laData": "",
    "maxChar": 400
  };
});

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
function EditorController($scope, $location, $route, Data) {
    $scope.data = Data;
    $scope.updateUrl = function() {
        var parola1 = $scope.data.parola1 || "";
        var parola2 = $scope.data.parola2 || "";
        var settima = $scope.data.laData || "";
        var nuovaUrl = "/" + ((parola1 || parola2 || settima) ? (parola1 + "/" + parola2 + "/" + settima) : "");
        if (nuovaUrl === $location.path()) {
            $route.reload();
        } else {
            $location.path(nuovaUrl);
        }
    };
}

function TastieraController($scope, Data) {
    $scope.data = Data;
    $scope.accentata = function(lettera) {
        $scope.$apply(function() {
            $scope.data.ilRacconto = insertAtCursor(lettera);
        });
    }
}

function CanvasController($scope, Data) {

    $scope.data = Data;
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
    var interlinea = 24;
    
    var clearCanvas = function() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#0f3460';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    var redrawImage = function() {
        context.drawImage(logoErranti, center.x-(size.x/2), center.y-(size.y/2), size.x, size.y);
    }
    
    var redrawTitle = function() {
        context.font = 'bold 20pt Cambria';
        context.fillStyle = 'white';
        context.textBaseline = 'alphabetic';
        context.textAlign = "left";
        context.fillText($scope.data.ilTitolo.toUpperCase(), 20, 30, 374);
    }
    
    var redrawText = function() {
        context.font = '18pt Cambria';        
        context.fillStyle = 'white';
        context.textBaseline = 'alphabetic';
        context.textAlign = "left";
        var lines = splitTextWithLineFeed($scope.data.ilRacconto);
        lines.forEach(function(line, num) {
            posizioneUltimaRiga = 70 + num * interlinea;
            context.fillText(line.trim(), 10, posizioneUltimaRiga, 394);
        });
    }
    
    var redrawName = function() {
        context.font = 'italic 20pt Cambria';
        context.fillStyle = 'white';
        context.textBaseline = 'alphabetic';
        context.textAlign = "right";
        var posizioneFirma = Math.min(posizioneUltimaRiga + interlinea * 2, 540);
        context.fillText($scope.data.laFirma, 404, posizioneFirma, 390);
    }
    
    var redrawWords = function() {
        context.font = 'bold 20pt Cambria';
        context.fillStyle = 'white';
        context.textBaseline = 'middle';
        context.textAlign = "left";
        context.fillText(inizialeMaiuscola($scope.data.parola1), 5, center.y, 150);
        context.fillText(inizialeMaiuscola($scope.data.parola2), 254, center.y, 150);
    }
    
    var redrawNE = function() {
        context.font = '18pt Cambria';
        context.fillStyle = 'white';
        context.textBaseline = 'alphabetic';
        context.textAlign = "center";
        context.fillText("NarrantiErranti", center.x, 698);
    }
    
    var redrawSettimana = function() {
        if (!$scope.data.laData) return;
        context.font = '20pt Cambria';
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
    
    $scope.redrawJpeg = function() {
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
    
    var logoErranti = new Image();
    logoErranti.src = "erranti_sml.jpg";
    logoErranti.onload = $scope.redrawJpeg;
    
    //$scope.$watch(function() {return $scope.data}, $scope.redrawJpeg, true);

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

editorErrante.controller("ComposeController", function($routeParams, Data) {
    Data.parola1 = $routeParams.p1;
    Data.parola2 = $routeParams.p2;
    Data.laData = $routeParams.date;
});

var insertAtCursor = function (myValue) {
    var myField = document.getElementById("il-racconto");
    
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

var splitTextWithLineFeed = function(str) {
    var paragrafi = str.split("\n");
    var ret = [];
    paragrafi.forEach(function(paragrafo) {
        ret = ret.concat(splitText(paragrafo));
    });
    return ret;
}

var splitText = function(str) {    
    var parole = str.split(" "),
        numParole = parole.length,
        ret = [],
        lunghezzaRiga = 32,
        riga = parole[0];
    
    for (var i=1; i<numParole; i++) {
        if (parole[i].length + riga.length < lunghezzaRiga) {
            riga+=" " + parole[i];
        } else {
            ret.push(riga);
            riga = parole[i];
        }
    }
    ret.push(riga);
    return ret;
}

function inizialeMaiuscola(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}