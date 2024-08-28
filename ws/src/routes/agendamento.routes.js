const express = require('express');
const router = express.Router();
const Horario = require('../models/horario');
const Agendamento = require('../models/agendamento');
const Cliente = require('../models/cliente');
const Barbearia = require('../models/barbearia');
const Servico = require('../models/servico');
const Colaborador = require('../models/colaborador');
const util = require('../util'); // Importar util
const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');

router.post('/', async (req, res) => {
    const db = mongoose.connection;
    const session = await db.startSession();
    session.startTransaction();
  
    try {
      const { clienteId, barbeariaId, servicoId, colaboradorId, data } = req.body;
  
      const cliente = await Cliente.findById(clienteId).select('nome endereco');
      const barbearia = await Barbearia.findById(barbeariaId).select('recipientId');
      const servico = await Servico.findById(servicoId).select('preco titulo comissao');
      const colaborador = await Colaborador.findById(colaboradorId).select('recipientId');
  
      // Verificação de conflito de horário
      const conflito = await Agendamento.findOne({
        colaboradorId: colaboradorId,
        data: new Date(data),
      });
  
      if (conflito) {
        throw new Error('Este colaborador já possui um agendamento neste horário.');
      }
  
      // PREÇO TOTAL DA TRANSAÇÃO
      const precoFinal = util.toCents(servico.preco) * 100;
  
      // CRIANDO PAGAMENTO MESTRE - Substituído por um pagamento fictício
      const createPayment = {
        data: {
          id: 'ficticio12345',
          status: 'paid',
        },
        error: false,
      };
  
      if (createPayment.error) {
        throw new Error(createPayment.message);
      }
  
      // CRIAR O AGENDAMENTO
      const agendamento = {
        clienteId,
        barbeariaId,
        servicoId,
        colaboradorId,
        data: new Date(data),
        valor: servico.preco,
        comissao: servico.comissao,
        transactionId: createPayment.data.id,
        dataCadastro: new Date(),
      };
  
      await new Agendamento(agendamento).save();
  
      await session.commitTransaction();
      session.endSession();
      res.json({ error: false, agendamento });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      res.json({ error: true, message: err.message });
    }
  });

  router.post('/filter', async (req, res) => {
    try {
      const { range, barbeariaId } = req.body;
  
      const agendamentos = await Agendamento.find({
        status: 'A',
        barbeariaId,
        data: {
          $gte: moment(range.start).startOf('day'),
          $lte: moment(range.end).endOf('day'),
        },
      }).populate([
        { path: 'servicoId', select: 'titulo duracao' },
        { path: 'colaboradorId', select: 'nome' },
        { path: 'clienteId', select: 'nome' },
      ]);
  
      res.json({ error: false, agendamentos });
    } catch (err) {
      res.json({ error: true, message: err.message });
    }
  });

  router.post('/dias-disponiveis', async (req, res) => {
    try {
        const { data, barbeariaId, servicoId } = req.body;
        const horarios = await Horario.find({ barbeariaId });
        const servico = await Servico.findById(servicoId).select('duracao');

        let agenda = [];
        let colaboradores = [];
        let lastDay = moment(data);

        // DURAÇÃO SERVIÇO
        const servicoMinutos = util.hourToMinutes(
            moment(servico.duracao).format('HH:mm')
        );

        const servicoSlots = util.sliceMinutes(
            servico.duracao,
            moment(servico.duracao).add(servicoMinutos, 'minutes'),
            util.SLOT_DURATION
        ).length;

        for (let i = 0; i <= 365 && agenda.length <= 7; i++) {
            const espacosValidos = horarios.filter(horario => {
                const diaSemanaDisponivel = horario.dias.includes(moment(lastDay).day());
                const servicoDisponivel = horario.especialidades.includes(servicoId);
                return diaSemanaDisponivel && servicoDisponivel;
            });
        
            if (espacosValidos.length > 0) {
                let todosHorariosDia = {};
        
                for (let spaco of espacosValidos) {
                    for (let colaborador of spaco.colaboradores) {
                        if (!todosHorariosDia[colaborador._id]) {
                            todosHorariosDia[colaborador._id] = [];
                        }
                        todosHorariosDia[colaborador._id] = [
                            ...todosHorariosDia[colaborador._id],
                            ...util.sliceMinutes(
                                util.mergeDateTime(lastDay, spaco.inicio),
                                util.mergeDateTime(lastDay, spaco.fim),
                                util.SLOT_DURATION
                            )
                        ];
                    }
                }
        
                for (let colaboradorKey of Object.keys(todosHorariosDia)) {
                    const agendamentos = await Agendamento.find({
                        colaboradorId: colaboradorKey,
                        data: {
                            $gte: moment(lastDay).startOf('day'),
                            $lte: moment(lastDay).endOf('day'),
                        },
                    }).select('data -_id');
        
                    let horariosOcupados = agendamentos.map((agendamento) => ({
                        inicio: moment(agendamento.data),
                        fim: moment(agendamento.data).add(servicoMinutos, 'minutes'),
                    }));
        
                    horariosOcupados = horariosOcupados
                        .map((horario) =>
                        util.sliceMinutes(horario.inicio, horario.fim, util.SLOT_DURATION, false)
                        )
                        .flat();
        
                    let horariosLivres = util.splitByValue(
                        todosHorariosDia[colaboradorKey].map(
                        (horario) => {
                            return horariosOcupados.includes(horario)
                            ? '-'
                            : horario;
                        }),
                        '-'
                    ).filter(space => space.length > 0);
        
                    horariosLivres = horariosLivres
                        .filter((horario) => horario.length >= servicoSlots);
        
                    horariosLivres = horariosLivres.map((slot) =>
                        slot.filter((horario, index) => slot.length - index >= servicoSlots)).flat();
        
                    horariosLivres = _.chunk(horariosLivres, 2);
        
                    if (horariosLivres.length == 0) {
                        todosHorariosDia = _.omit(todosHorariosDia, colaboradorKey);
                    } else {
                        todosHorariosDia[colaboradorKey] = horariosLivres;
                    }
                }   
        
                const totalEspecialistas = Object.keys(todosHorariosDia).length;
        
                if (totalEspecialistas > 0) {
                    colaboradores.push(Object.keys(todosHorariosDia));
                    agenda.push({
                        [lastDay.format('YYYY-MM-DD')]: todosHorariosDia,
                    });
                }
            }
        
            lastDay = lastDay.add(1, 'day');
        }
        
        // RECUPERANDO DADOS DOS COLABORADORES
        colaboradores = _.uniq(colaboradores.flat());

        colaboradores = await Colaborador.find({
            _id: { $in: colaboradores }, 
        }).select('nome foto');

        colaboradores = colaboradores.map(c => ({
            ...c._doc,
            nome: c.nome.split(' ')[0],
        }));

        res.json({
            error: false,
            colaboradores,
            agenda,
        });
    } catch (err) {
        res.json({ error: true, message: err.message });
    }
});

module.exports = router;
