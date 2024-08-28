const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const barbearia = new Schema({
  nome: String,
  foto: String,
  capa: String,
  email: String,
  senha: String,
  telefone: String,
  recipientId: String,
  endereco: {
    cidade: String,
    uf: String,
    cep: String,
    logradouro: String,
    numero: String,
    pais: String,
  },
  geo: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' },
  },
  dataCadastro: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Barbearia', barbearia);
