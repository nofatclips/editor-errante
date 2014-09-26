"use strict"
// Router and Reverse Router

editorErrante.config(function($routeProvider) {
    $routeProvider.when("/", {
        "templateUrl": "compose.html",
        "controller": "ComposeController"
    }).when("/opzioni", {
        "templateUrl": "opzioni.html",
        "controller": "OpzioniController"
    }).when("/:p1?/:p2?/:date?", {
        "templateUrl": "compose.html",
        "controller": "ComposeController"
    }).otherwise({
        "redirectTo": "/"
    });
})

editorErrante.factory("neReverseRoute", ["$location", "Data", "Status", function(loc, Data, Status) {

    var orElse = null,
        where = "editor",
        theUrl = {
            "editor": {},
            "opzioni": {}
        };
    
    var reset = function () {
        orElse = null;
        where = "editor";
    }
    
    var setFunctionToCallIfAlreadyThere = function(otherwise) {
        orElse = otherwise;
        return this;
    }
    
    var setTheDestinationWhoseRouteIsNeeded = function(dest) {
        where = dest;
        return this;
    }
    
    theUrl["editor"]["NE"] = function() {
        var parola1 = Data.parola1 || "";
        var parola2 = Data.parola2 || "";
        var settima = Data.laData || "";
        return "/" + ((parola1 || parola2 || settima) ? (parola1 + "/" + parola2 + "/" + settima) : "");
    }

    theUrl["opzioni"]["NE"] = function() {
        return "/opzioni";
    }
    
    var updateUrlOrDoOtherwise = function() {
        var nuovaUrl = theUrl[where][Status.modo]();
        if (nuovaUrl === loc.path() && orElse) {
            orElse();
        } else {
            loc.path(nuovaUrl);
        }
        reset();
    };

    return {
        "altrimenti": setFunctionToCallIfAlreadyThere,
        "apri": setTheDestinationWhoseRouteIsNeeded,
        "go": updateUrlOrDoOtherwise
    }

}]);
