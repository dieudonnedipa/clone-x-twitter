// --- Importations ---
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// --- Initialisation de l'application ---
const app = express();
const PORT = 4000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Chargement de la base de données ---
const dbPath = path.join(__dirname, 'db.json');
let database;

try {
  const rawData = fs.readFileSync(dbPath, 'utf-8');
  database = JSON.parse(rawData);
  console.log("Base de données chargée avec succès !");
} catch (error) {
  console.error("Erreur lors du chargement de la base de données :", error);
  process.exit(1); 
}

// --- Fonctions Utilitaires ---
const saveDatabase = () => {
  try {
    const data = JSON.stringify(database, null, 2);
    fs.writeFileSync(dbPath, data, 'utf-8');
    console.log(">>> Sauvegarde réussie ! Le fichier db.json a été mis à jour.");
  } catch (error) {
    console.error(">>> ERREUR PENDANT LA SAUVEGARDE :", error);
  }
};


// --- Routes de l'API ---

app.get('/api/users', (req, res) => {
  res.json(database.users);
});

app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const user = database.users.find(u => u.id == userId);
  
  if (user) { res.json(user); } 
  else { res.status(404).json({ error: "Utilisateur non trouvé" }); }
});


// --- LA ROUTE MODIFIÉE EST ICI ---
app.get('/api/tweets', (req, res) => {
  // On récupère le paramètre 'userId' de l'URL (ex: /api/tweets?userId=12)
  const { userId } = req.query;

  let allTweets = [...database.tweets]; // On prend tous les tweets par défaut

  // S'il y a un userId dans la requête, on filtre les tweets
  if (userId) {
    console.log(`Filtre activé : ne renvoyer que les tweets de l'utilisateur ${userId}`);
    allTweets = allTweets.filter(tweet => tweet.userId == userId);
  }

  // On trie le résultat (soit tous les tweets, soit les tweets filtrés)
  const sortedTweets = allTweets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(sortedTweets);
});


app.get('/api/tweets/:id', (req, res) => {
  const tweetId = req.params.id;
  const tweet = database.tweets.find(t => t.id == tweetId);
  
  if (tweet) { res.json(tweet); } 
  else { res.status(404).json({ error: "Tweet non trouvé" }); }
});

app.post('/api/tweets', (req, res) => {
  const newTweet = req.body;
  database.tweets.unshift(newTweet);
  saveDatabase();
  res.status(201).json(newTweet);
});

app.patch('/api/tweets/:id', (req, res) => {
  const tweetId = req.params.id;
  const { likedBy } = req.body;
  const tweetIndex = database.tweets.findIndex(t => t.id == tweetId);

  if (tweetIndex !== -1 && Array.isArray(likedBy)) {
    database.tweets[tweetIndex].likedBy = likedBy;
    saveDatabase();
    res.json(database.tweets[tweetIndex]);
  } else {
    res.status(404).json({ error: "Tweet non trouvé ou données invalides." });
  }
});

app.delete('/api/tweets/:id', (req, res) => {
  const tweetId = req.params.id;
  const tweetIndex = database.tweets.findIndex(t => t.id == tweetId);

  if (tweetIndex !== -1) {
    database.tweets.splice(tweetIndex, 1);
    saveDatabase();
    res.status(204).send();
  } else {
    res.status(404).json({ error: "Tweet non trouvé." });
  }
});


// --- Démarrage du serveur ---
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});