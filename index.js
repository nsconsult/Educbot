// Description: Fichier principal du bot Telegram
// Auteur: Nazim ALI
require('dotenv').config(); // Charge les variables du fichier .env

const TelegramBot = require('node-telegram-bot-api');
const connectDB = require('./db');
const User = require('./models/User');

// Connecte à MongoDB
connectDB();

// Récupère le token du bot depuis les variables d'environnement
const token = process.env.TELEGRAM_BOT_TOKEN;

// Crée une instance du bot (mode polling pour le développement)
const bot = new TelegramBot(token, { polling: true });

console.log('Bot démarré...');

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
  
    // Vérifier ou créer l'utilisateur
    let user = await User.findOne({ telegramId });
    if (!user) {
      user = new User({ telegramId });
      await user.save();
    }
  
    bot.sendMessage(chatId, 'Bonjour ! Bienvenue sur le chatbot éducatif. Tape /quiz pour commencer un quiz ou /progression pour voir ta progression.');
  });
  

const quizzes = require('./quiz');

// Commande /quiz
bot.onText(/\/quiz/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  // Récupérer ou créer l'utilisateur
  let user = await User.findOne({ telegramId });
  if (!user) {
    user = new User({ telegramId });
    await user.save();
  }

  // Pour simplifier, nous utilisons le module "intro" pour le quiz
  const currentModule = 'intro';
  const quiz = quizzes[currentModule];

  if (quiz) {
    // Envoyer la question avec un clavier personnalisé
    bot.sendMessage(chatId, quiz.question, {
      reply_markup: {
        keyboard: quiz.answers.map(answer => [answer]),
        one_time_keyboard: true,
        resize_keyboard: true
      }
    });
    // Mettre à jour l'état de l'utilisateur pour indiquer qu'il est en train de répondre au quiz
    user.currentQuizModule = currentModule;
    await user.save();
  } else {
    bot.sendMessage(chatId, "Aucun quiz n'est disponible pour le moment.");
  }
});

// Écoute des réponses de quiz (attention : cette écoute se déclenchera pour tout message, alors il faut bien vérifier l'état de l'utilisateur)
bot.on('message', async (msg) => {
    // Ignorer les messages qui sont des commandes (/start, /quiz, etc.)
    if (msg.text.startsWith('/')) return;
  
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
  
    // Récupérer l'utilisateur
    let user = await User.findOne({ telegramId });
    if (!user || !user.currentQuizModule) {
      // Si l'utilisateur n'est pas en mode quiz, ne rien faire
      return;
    }
  
    const currentModule = user.currentQuizModule;
    const quiz = quizzes[currentModule];
  
    if (quiz) {
      if (msg.text === quiz.correctAnswer) {
        // Bonne réponse : augmenter le score et réinitialiser l'état du quiz
        user.score += 10; // par exemple, +10 points
        user.currentQuizModule = null;
        await user.save();
        bot.sendMessage(chatId, "Bonne réponse ! Tu gagnes 10 points.");
      } else {
        // Mauvaise réponse : réinitialiser l'état et proposer de réessayer (ou simplement informer)
        user.currentQuizModule = null;
        await user.save();
        bot.sendMessage(chatId, "Mauvaise réponse. Essaie encore en relançant /quiz.");
      }
    }
  });

bot.onText(/\/progression/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  // Récupérer l'utilisateur
  let user = await User.findOne({ telegramId });
  if (!user) {
    bot.sendMessage(chatId, "Aucun utilisateur trouvé. Tape /start pour commencer.");
    return;
  }

  // Préparer un message récapitulatif
  const progressionMessage = `
Votre progression :
- Score : ${user.score} points
- Module en cours : ${user.currentModule || "N/A"}
  `;
  bot.sendMessage(chatId, progressionMessage);
});

  
