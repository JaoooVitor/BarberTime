const mongoose = require('mongoose');

// Defina sua string de conexão aqui
const URI = 'mongodb+srv://jvsouza:root1234@clusterdev.qsdtj.mongodb.net/barber-time?retryWrites=true&w=majority&appName=ClusterDev';

// Não há necessidade de definir opções obsoletas
mongoose
  .connect(URI)
  .then(() => console.log('DB is Up!'))
  .catch((err) => console.log(err));
