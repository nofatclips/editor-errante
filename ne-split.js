editorErrante.neSplit = function() {

    var splitTextInMaxRighe = function(str, misura, maxRighe, maxFontSize) {
        maxRighe = maxRighe || 100;
        var fontSize = (maxFontSize || 18) + 1;
        var ret;
        do {
            fontSize--;
            ret = splitTextWithLineFeed(str, misura, fontSize);
        } while (ret.length > maxRighe && fontSize>0);
        return ret;
    }

    var splitTextWithLineFeed = function(str, misura, fontSize) {
        fontSize = fontSize || 18;
        var paragrafi = str.split("\n");
        var ret = [];
        paragrafi.forEach(function(paragrafo) {
            ret = ret.concat(splitText(paragrafo, misura, fontSize));
        });
        return ret;
    }

    function splitText (str, misura, fontSize) {

        var parolaEntraNellaRiga = function (riga, parola, lunghezzaRiga) {
            return (parola.length + riga.length < lunghezzaRiga)
        }
        misura = misura || parolaEntraNellaRiga;
        fontSize = fontSize || 18;
        
        var parole = str.split(" "),
            numParole = parole.length,
            ret = [],
            lunghezzaRiga = 32,
            riga = parole[0];
            
        for (var i=1; i<numParole; i++) {
            if (misura(riga, parole[i], lunghezzaRiga, fontSize)) {
                riga+=" " + parole[i];
            } else {
                ret.push(riga);
                riga = parole[i];
            }
        }
        ret.push(riga);
        return ret;
    }
    
    return {
        "split": splitTextInMaxRighe
    }
    
}();