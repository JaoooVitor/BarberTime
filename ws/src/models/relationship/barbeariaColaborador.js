const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const barbeariaColaborador = new Schema({
  barbeariaId: {
    type: mongoose.Types.ObjectId,
    ref: 'Barbearia',
    required: true,
  },
  colaboradorId: {
    type: mongoose.Types.ObjectId,
    ref: 'Colaborador',
    required: true,
  },
  status: {
    type: String,
    enum: ['A', 'I', 'E'],
    required: true,
    default: 'A',
  },
  dataCadastro: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('BarbeariaColaborador', barbeariaColaborador);