"use strict"
// Splitter Module
editorErrante.factory("neSplitter", function() {

    var parolaEntraNellaRigaSimple = function (riga, parola, lunghezzaRiga) {
        return (parola.length + riga.length < lunghezzaRiga)
    }

    var parolaEntraNellaRigaConContesto = function (riga, parola) {
        context.font = 'normal ' + fontSize + 'pt Cambria';        
        context.fillStyle = 'white';
        context.textBaseline = 'alphabetic';
        return (context.measureText(riga + " " + parola).width < width);
    }
    
    var parolaEntraNellaRiga = function(riga, parole, lunghezzaRiga) {
        return (context)
            ?parolaEntraNellaRigaConContesto(riga, parole, lunghezzaRiga)
            :parolaEntraNellaRigaSimple(riga, parole, lunghezzaRiga);
    }

    var str = "",
        fontSize = 100,
        maxFontSize = 100,
        lines = [""],
        context = null,
        misura = parolaEntraNellaRiga,
        interlinea = 1.2,
        width = 394,
        height = 100;
    
    var setTextToSplit = function(text) {
        str = text;
        fontSize = maxFontSize;
        lines = [""];
    }
    
    var setMaxFontSize = function(size) {
        maxFontSize = size;
    }
    
    var setContext = function(ctx) {
        context = ctx;
    }
    
    var setLineHeightRatio = function(lineHeight) {
        interlinea = lineHeight;
    }
    
    var getCurrentFontSize = function() {
        return fontSize;
    }
    
    var getSplittedLines = function() {
        return lines;
    }
    
    var getLineHeight = function() {
        return Math.ceil(fontSize * interlinea);
    }
    
    var setNumeroPixel = function(h) {
        height = h;
    }
    
    var getNumeroRigheMax = function() {
        return Math.floor(height/getLineHeight());
    }
    
    var setLarghezzaPagina = function(l) {
        width = l;
    }

    var splitTextInMaxRighe = function() {
        var maxRighe = getNumeroRigheMax();
        var ret = splitTextWithLineFeed(str, fontSize);
        while (ret.length > maxRighe && fontSize > 0) {
            fontSize--;
            maxRighe = getNumeroRigheMax();
            ret = splitTextWithLineFeed();
        }
        lines = ret;
    }

    var splitTextWithLineFeed = function() {
        var paragrafi = str.split("\n");
        var ret = [];
        paragrafi.forEach(function(paragrafo) {
            ret = ret.concat(splitText(paragrafo, fontSize));
        });
        return ret;
    }

    function splitText (parag, fontSize) {
        
        var parole = parag.split(" "),
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
        "process": splitTextInMaxRighe,
        "setText": setTextToSplit,
        "setMaxFontSize": setMaxFontSize,
        "setContext": setContext,
        "getFontSize": getCurrentFontSize,
        "getLines": getSplittedLines,
        "getLineHeight": getLineHeight,
        "setHeight": setNumeroPixel,
        "setWidth": setLarghezzaPagina,
        "setLeading": setLineHeightRatio
    }
    
});