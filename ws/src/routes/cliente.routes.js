const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment');
const Cliente = require('../models/cliente');
const BarbeariaCliente = require('../models/relationship/barbeariaCliente');

router.post('/', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { cliente, barbeariaId } = req.body;
        let newClient = null;

        // Verifica se o cliente já existe
        const existentClient = await Cliente.findOne({
            $or: [
                { email: cliente.email },
                { telefone: cliente.telefone },
            ],
        });

        if (!existentClient) {
            newClient = await new Cliente({
                ...cliente,
                // Removido customerId relacionado ao PayPal
            }).save({ session });
        }

        const clienteId = existentClient ? existentClient._id : newClient._id;

        // Verifica e atualiza a relação com a barbearia
        const existentRelationship = await BarbeariaCliente.findOne({
            barbeariaId,
            clienteId,
        });

        if (!existentRelationship) {
            await new BarbeariaCliente({
                barbeariaId,
                clienteId,
            }).save({ session });
        } else if (existentRelationship.status === 'I') {
            await BarbeariaCliente.findOneAndUpdate(
                { barbeariaId, clienteId },
                { status: 'A' },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        res.json({
            error: false,
            message: existentClient ? 'Cliente já cadastrado!' : 'Cliente cadastrado com sucesso!'
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.json({ error: true, message: err.message || 'Erro desconhecido' });
    }
});

router.post('/filter', async (req, res) => {
  try {
    const clientes = await Cliente.find(req.body.filters);
    res.json({ error: false, clientes });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

router.get('/barbearia/:barbeariaId', async (req, res) => {
  try {
    const clientes = await BarbeariaCliente.find({
      barbeariaId: req.params.barbeariaId,
      status: 'A',
    })
      .populate('clienteId')
      .select('clienteId dataCadastro');  // Incluí dataCadastro para formatar

    res.json({
      error: false,
      clientes: clientes.map((c) => ({
        ...c.clienteId._doc,
        vinculoId: c._id,
        dataCadastro: moment(c.dataCadastro).format('DD/MM/YYYY'),  // Formata a data
      })),
    });
  } catch (err) {
    res.json({ error: true, message: err.message || 'Erro desconhecido' });
  }
});

router.delete('/vinculo/:id', async (req, res) => {
  try {
    const result = await BarbeariaCliente.findByIdAndUpdate(
      req.params.id,
      { status: 'I' },
      { new: true }  // Retorna o documento atualizado
    );

    if (!result) {
      return res.status(404).json({ error: true, message: 'Vínculo não encontrado' });
    }

    res.json({ error: false, message: 'Vínculo desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message || 'Erro desconhecido' });
  }
});


module.exports = router;
