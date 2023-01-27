var socket = io();

var messages = document.getElementById("messages");
var form = document.getElementById("form");
var input = document.getElementById("input");
var pseudo = document.getElementById("name");
var salon = document.getElementById("salonCreation");
var personnes = document.getElementsByClassName("personne");

var private = false;
var privateID = "";
var idPrive = "";
var pseudoPerso = "";
var salonActuel = "";

// Permet de déclencher un comportement lorsqu'on appuie dessus
form.addEventListener("submit", function (e) {
    e.preventDefault(); // Empeche le rechargement

    // Si on rentre un message
    if (input.value) {
        // Création du message envoyé
        var item = document.createElement("li");
        item.classList = "me";
        window.scrollTo(0, document.body.scrollHeight);

        // Si on a décidé qu'il s'agissait d'un message privé à envoyer
        if (private) {
            socket.emit("privé", idPrive, input.value, pseudoPerso);
            // Instruction pour envoyer message
            item.textContent =
                "Vous envoyez à " +
                document.getElementById(idPrive).innerHTML +
                " : " +
                input.value;
            cancel();
        } else {
            // Envoie du message au reste des utilisateurs
            item.textContent = input.value;
            socket.emit("chat message", input.value); // donne l'instruction pour ajouter le message aux autres
        }
        messages.appendChild(item);
        console.log(item.innerHTML);
        input.value = ""; // reset la zone de saisie
    }
    // Si on rentre un pseudo
    else if (pseudo.value) {
        // Envoie du pseudo au serveur
        socket.emit("connexion", pseudo.value); // on envoie le pseudo
        document.getElementById("moi").outerHTML =
            '<p id="moi">Bienvenue, ' + pseudo.value + "</p>";
        pseudoPerso = pseudo.value;
        pseudo.value = "";

        // Changement des zones de saisie
        pseudo.style.display = "none"; // zone de pseudo disparait
        input.style.display = "none"; // zone de messages apparait

        // document.getElementById("form").style.display="none";

        // Création du message de bienvenue (visible uniquement pour lui)
        var item = document.createElement("li");
        item.textContent = "Bienvenue, choisissez un salon pour discuter."; // message de bienvenu
        item.className = "autres";
        messages.appendChild(item); // on ajoute au DOM
        window.scrollTo(0, document.body.scrollHeight); // on remet le scroll

        // MàJ des informations
        socket.emit("mise à jour", document.getElementById("nombre").innerHTML); // permet de mettre à jour le nb d'users en ligne
        socket.emit("utilisateurs");
        document.getElementById("salons").style.display = "block";
    }
});

// Méthodes pour gérer les comportements

// Permet de mettre à jour le nombre d'users
socket.on("connecte", (nombre) => {
    document.getElementById("nombre").outerHTML =
        '<span id="nombre">' + nombre + "</span>";
});

// Permet d'écrire un message dans le chat
socket.on("chat message", (message) => {
    var item = document.createElement("li");
    item.textContent = message;
    item.className = "autres";
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

// Permet d'ajouter un nom à la liste
socket.on("utilisateurs", (user) => {
    var item = document.createElement("li");
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

// MàJ des info lors de l'arrivée sur la page
socket.on("update", (taille) => {
    document.getElementById("nombre").outerHTML =
        '<span id="nombre">' + taille + "</span>";
});

// Permet de changer la liste
socket.on("liste", (nom, id) => {
    console.log("ID : " + id);
    console.log("Nom : " + nom);
    var item = document.createElement("button");
    item.id = id;
    item.textContent = nom;
    item.class = "personne";
    // item.onclick="MP(id)";
    item.setAttribute("onclick", "MP(id)");
    utilisateurs.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

// Permet de gérer la déconnexion
socket.on("deco", (id) => {
    console.log(id);
    document.getElementById(id).remove();
    console.log("OK");
});

// Permet d'actualiser la liste des personnes connectées
socket.on("init", ([id, nom]) => {
    var temp = document.getElementById(id);
    if (temp == null) {
        console.log("A rajouter");
        var item = document.createElement("button");
        item.id = id;
        item.className = "personne";
        item.textContent = nom;
        item.setAttribute("onclick", "MP(id)");
        utilisateurs.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    }
});

// Permet d'ajouter un salon
socket.on("salon", (nomSalon) => {
    console.log("Salon envoyé : " + nomSalon);
    console.log("Type :", typeof nomSalon);
    if (nomSalon != "") {
        var item = document.createElement("button");
        item.className = "salon";
        item.textContent = nomSalon;
        var param = "switchSalon('" + nomSalon + "')";
        item.setAttribute("onclick", param);
        // item.addEventListener("click",switchSalon(nomSalon));
        // item.onclick=switchSalon('nomSalon');
        salons.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    }
});

/**
 * fonction permettant de désigner la personne à qui on souhaite envoyer un message privé
 * @param id chaine de caractères représentant l'identifiant de la personne dont on souhaite envoyer un message privé
 */
function MP(id) {
    var user = document.getElementById(id);
    var bouton = document.getElementById("cancel");
    var panneau = document.getElementById("DM");

    panneau.style.display = "block";
    bouton.style.display = "block";

    private = true;
    idPrive = id;

    var nom = document.getElementById(id).innerHTML;
    console.log(nom);

    document.getElementById("destinataire").outerHTML =
        '<span id="destinataire">' + nom + "</span>";
}

/**
 * fonction permettant d'annuler l'envoi d'un message privé
 */
function cancel() {
    var panneau = document.getElementById("DM");
    var bouton = document.getElementById("cancel");
    panneau.style.display = "none";
    bouton.style.display = "none";
    private = false;
    privateID = "";
}

/**
 * fonction permettant de changer de salon
 * @param salon chaine de caractère représentant le nom du salon
 */
function switchSalon(salon) {
    console.log("Salon :", salon);
    document.getElementById("messages").innerHTML = "";
    var item = document.createElement("li");
    item.className = "autres";
    item.textContent = "Bienvenue dans le salon '" + salon + "'"; // message de bienvenu
    messages.appendChild(item); // on ajoute au DOM
    window.scrollTo(0, document.body.scrollHeight);
    document.getElementById("input").style.display = "block";
    socket.emit("switchSalon", salon);
}

/**
 * fonction permettant d'afficher la zone de création d'un nouveau salon
 */
function ajouterSalon() {
    console.log("Création zone ajout");
    document.getElementById("boutonSalon").style.display = "none";
    document.getElementById("ajoutSalon").style.display = "block";
}

/**
 * fonction permettant d'ajouter un nouveau salon à la liste de ceux existant
 */
function ajoutSalon() {
    console.log("Salon ajouté");

    document.getElementById("boutonSalon").style.display = "block";
    document.getElementById("ajoutSalon").style.display = "none";

    var valeur = document.getElementById("nouveauSalon").value;
    document.getElementById("nouveauSalon").value = "";
    socket.emit("nouveau salon", valeur);
}

/**
 * fonction permettant d'annuler la création d'un nouveau salon
 */
function cancelSalon() {
    console.log("Annulation création");
    document.getElementById("boutonSalon").style.display = "block";
    document.getElementById("ajoutSalon").style.display = "none";
    document.getElementById("nouveauSalon").value = "";
}
