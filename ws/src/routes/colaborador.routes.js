const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Colaborador = require('../models/colaborador');
const BarbeariaColaborador = require('../models/relationship/barbeariaColaborador');
const ColaboradorServico = require('../models/relationship/colaboradorServico');

router.post('/', async (req, res) => {
  const db = mongoose.connection;
  const session = await db.startSession();
  session.startTransaction();

  try {
    const { colaborador, barbeariaId } = req.body;
    let newColaborador = null;

    const existentColaborador = await Colaborador.findOne({
      $or: [
        { email: colaborador.email },
        { telefone: colaborador.telefone },
      ],
    });

    if (!existentColaborador) {
      
      newColaborador = await new Colaborador({
        ...colaborador,
        // recipientId: pagarmeReceiver.data.id,
      }).save({ session });
    }

    const colaboradorId = existentColaborador
      ? existentColaborador._id
      : newColaborador._id;

    // Relação com o salão
    const existentRelationship = await BarbeariaColaborador.findOne({
      barbeariaId,
      colaboradorId,
    });

    if (!existentRelationship) {
      await new BarbeariaColaborador({
        barbeariaId,
        colaboradorId,
        status: colaborador.vinculo,
      }).save({ session });
    }

    if (existentRelationship && existentRelationship.status === 'I') {
      await BarbeariaColaborador.findOneAndUpdate(
        {
          barbeariaId,
          colaboradorId,
        },
        { status: 'A' },
        { session }
      );
    }

    // Relação com os serviços / especialidades
    await ColaboradorServico.deleteMany({ colaboradorId }); // Limpa serviços antigos
    await ColaboradorServico.insertMany(
      colaborador.especialidades.map((servicoId) => ({
        servicoId,
        colaboradorId,
      }))
    );

    await session.commitTransaction();
    session.endSession();

    if (existentRelationship && existentColaborador) {
      res.json({ error: true, message: 'Colaborador já cadastrado!' });
    } else {
      res.json({ error: false });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.json({ error: true, message: err.message });
  }
});

router.put('/:colaboradorId', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { vinculo, vinculoId, especialidades } = req.body;
    const { colaboradorId } = req.params;

    // Atualizar o status do vínculo existente
    await BarbeariaColaborador.findByIdAndUpdate(vinculoId, { status: vinculo }, { session });

    // Verificar se as especialidades precisam ser atualizadas
    if (especialidades && especialidades.length > 0) {
      // Deletar as especialidades existentes do colaborador
      await ColaboradorServico.deleteMany({ colaboradorId }, { session });

      // Inserir novas especialidades
      const especialidadesToInsert = especialidades.map(servicoId => ({
        servicoId,
        colaboradorId,
      }));
      await ColaboradorServico.insertMany(especialidadesToInsert, { session });
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ error: false });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.json({ error: true, message: err.message });
  }
});

router.delete('/vinculo/:id', async (req, res) => {
    try {
      await BarbeariaColaborador.findByIdAndUpdate(req.params.id, { status: 'E' });
      res.json({ error: false });
    } catch (err) {
      res.json({ error: true, message: err.message });
    }
});

router.post('/filter', async (req, res) => {
  try {

    const colaboradores = await Colaborador.find(req.body.filters);
    res.json({ error: false, colaboradores });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

router.get('/barbearia/:barbeariaId', async (req, res) => {
  try {
    const { barbeariaId } = req.params;
    let listaColaboradores = [];

    // RECUPERAR VINCULOS
    const barbeariaColaboradores = await BarbeariaColaborador.find({
      barbeariaId,
      status: { $ne: 'E' },
    })
    .populate({ path: 'colaboradorId', select: '-senha' })
    .select('colaboradorId dataCadastro status');
    
    for (let vinculo of barbeariaColaboradores) {
      const especialidades = await ColaboradorServico.find({
        colaboradorId: vinculo.colaboradorId._id
      });

      listaColaboradores.push({
        ...vinculo._doc,
        especialidades: especialidades.map(
          (especialidade) => especialidade.servicoId._id,
        ),
      });
    }

    res.json({
      error: false,
      colaboradores: listaColaboradores.map((vinculo) => ({
        ...vinculo.colaboradorId._doc,
        vinculoId: vinculo._id,
        vinculo: vinculo.status,
        especialidades: vinculo.especialidades,
        dataCadatstro: vinculo.dataCadastro
      })),
    });

  } catch (err) {
    res.json({ error: true, message: err.message});
  }
});

module.exports = router;
