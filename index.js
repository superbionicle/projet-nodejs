const { on } = require("events");
const express = require("express");
const app = express();
const http = require("http");
const { emit } = require("process");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const port = 3000;

const userList = new Map(); // Map pour associer chaque id à un user
var salons = ["Salon 1", "Salon 2"]; // Liste des salons
let salonActuel; // Salon dans lequel on se situe

app.use(express.static(__dirname)); // Permet de gérer les fichiers de script, de style et d'HTML

// Pour créer notre app à partir d'un fichier html
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// Quand on se connecte
io.on("connection", (socket) => {
    // Variables
    var id = socket.id;
    var nom = "";
    var nb = userList.size;

    // Mise à jour à l'arrivée
    socket.emit("update", userList.size);

    // Affichage de tous les utilisateurs
    for (map of userList) {
        io.emit("init", map);
    }

    /**
     * Event "connexion" : comportement lorsqu'on se connecte avec un pseudo
     * @param pseudo chaine de caracètre représentant le pseudo de la personne qui se connecte
     */
    socket.on("connexion", (pseudo) => {
        // Pour se repérer à l'arriver
        // console.log("Personne : ", pseudo);
        // console.log("Liste des utilisateurs", userList);
        // console.log("Liste des salons :", salons);

        // Ajout à la liste des utilisateurs
        userList.set(id, pseudo); // On ajoute le couple (id,pseudo) à la map
        // console.log("Salon actuel :", salonActuel);

        // Initialisation des variables
        nom = pseudo;

        // Avertit tous les autres de l'arrivée dans le salon
        socket.broadcast.emit("chat message", pseudo + " est arrivé(e)");
        socket.emit("update", userList);

        // Permet d'afficher tous les salons
        for (salon of salons) {
            // console.log("Salon dispo : " + salon);
            socket.emit("salon", salon);
        }
    });

    /**
     * Event "mise à jour" : permet de mettre à jour le nombre d'utilisateurs sur la page HTML
     * @param nombreHTML entier représenant le nombre d'utilisateurs avant la maj indiqué sur la page HTML
     */
    socket.on("mise à jour", (nombreHTML) => {
        nombreHTML++;
        io.to(salonActuel).emit("connecte", nombreHTML);
        socket.emit("connecte", nombreHTML);
    });

    /**
     * Event "chat message" : permet d'afficher un message à tous les autres utilisateurs
     * @param message chaine de caractère représentant le message à envoyer
     */
    socket.on("chat message", (message) => {
        // console.log("Envoie pour ceux de", salonActuel);
        // console.log("Emetteur :", nom);
        socket.to(salonActuel).emit("chat message", nom + " : " + message);
    });

    // Permet d'afficher les utilisateurs présents

    /**
     * Event "utilisateurs" : permet d'afficher un utilisateur
     * @param nom chaine de caractères représentant le nom de l'utilisateur
     * @param id chaine de caractères représentant l'identifiant unique de l'utilisateur
     */
    socket.on("utilisateurs", () => {
        io.emit("liste", nom, id);
    });

    /**
     * Event "privé" : permet d'envoyer un message privé à un utilisateur connecté
     * @param id chaine de caractère représentant l'identifiant de la personne à qui on envoie le message privé
     * @param message chaine de caractère représentant le message à envoyer
     * @param nom chaine de caractère représentant le nom de l'expéditeur
     */
    socket.on("privé", (id, message, nom) => {
        // console.log("ID de destination :", id);
        io.to(id).emit(
            "chat message",
            "Message privé de " + nom + " : " + message
        );
    });

    /**
     * Event "switchSalon" : permet de changer de salon de discution
     * @param salon chaine de caractères désignant le salon de discussion
     */
    socket.on("switchSalon", (salon) => {
        // console.log("Entrée dans le salon " + salon);
        socket.broadcast.emit(
            "chat message",
            nom + " a rejoint le salon '" + salon + "'."
        );
        socket.join(salon);
        salonActuel = salon;
    });

    /**
     * Event "nouveau salon" : permet d'ajouter un nouveau salon à la liste de ceux existant
     * @param salon chaine de caractères représentant le nom du salon à ajouter à la liste
     */
    socket.on("nouveau salon", (salon) => {
        salons.push(salon);
        socket.emit("salon", salon);
    });

    /**
     * Event "disconnect" : permet de gérer la déconnexion
     */
    socket.on("disconnect", () => {
        // Si la personne s'est connectée avec un pseudo
        if (nom != "") {
            io.emit("deco", id);
            userList.delete(id); // On supprime l'identifiant de la map
            nb = userList.size; // On récupère le nombre d'utilisateurs
            socket.broadcast.emit("connecte", nb); // On met à jour le nombre d'utilisateurs sur la page
            socket.broadcast.emit("chat message", nom + " est parti(e)"); // On affiche un message aux autres utilisateurs
        }
    });
});

server.listen(port, () => {
    console.log("Go to http://localhost:" + port);
});