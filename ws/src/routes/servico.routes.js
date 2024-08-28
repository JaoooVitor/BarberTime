const express = require('express');
const router = express.Router();
const aws = require('../services/aws');
const Servico = require('../models/servico');
const Arquivos = require('../models/arquivos');

// POST para adicionar um novo serviço
router.post('/', async (req, res) => {

  try {
    let errors = [];
    let arquivos = [];

    // Acessar arquivos enviados
    const files = req.files; // Isso é um array de arquivos

    if (files && files.length > 0) {
      for (const file of files) {
        const nameParts = file.originalname.split('.');
        const fileName = `${new Date().getTime()}.${nameParts[nameParts.length - 1]}`;
        const path = `servicos/${req.body.barbeariaId}/${fileName}`;

        const response = await aws.uploadToS3(file.buffer, path);

        if (response.error) {
          errors.push({ error: true, message: response.message.message });
        } else {
          arquivos.push(path);
        }
      }
    }

    if (errors.length > 0) {
      res.json(errors[0]);
      return false;
    }

    // CRIAR SERVIÇO
    let jsonServico = JSON.parse(req.body.servico);
    jsonServico.barbeariaId = req.body.barbeariaId;
    const servico = await new Servico(jsonServico).save();

    // CRIAR ARQUIVO
    arquivos = arquivos.map((arquivo) => ({
      referenciaId: servico._id,
      model: 'Servico',
      arquivo,
    }));
    await Arquivos.insertMany(arquivos);

    res.json({ error: false, arquivos });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

// PUT para atualizar um serviço
router.put('/:id', async (req, res) => {
    try {
      let errors = [];
      let arquivos = [];
  
      // Acessar arquivos enviados
      const files = req.files || []; // Verifique se req.files está definido
      console.log('Files:', files);
  
      if (files.length > 0) {
        for (const file of files) {
          // Verifique se file.buffer é um Buffer
          if (!Buffer.isBuffer(file.buffer)) {
            console.error('Arquivo não é um buffer:', file);
            errors.push({ error: true, message: 'O arquivo deve ser um Buffer.' });
            continue;
          }
  
          const nameParts = file.originalname.split('.');
          const fileName = `${new Date().getTime()}.${nameParts[nameParts.length - 1]}`;
          const path = `servicos/${req.body.barbeariaId}/${fileName}`;
  
          // Enviar para o S3
          const response = await aws.uploadToS3(file.buffer, path);
  
          if (response.error) {
            errors.push({ error: true, message: response.message.message });
          } else {
            arquivos.push(path);
          }
        }
      }
  
      if (errors.length > 0) {
        res.json(errors[0]);
        return;
      }
  
      // ATUALIZAR SERVIÇO
      let jsonServico;
      try {
        jsonServico = JSON.parse(req.body.servico);
      } catch (parseError) {
        console.error('Erro ao analisar JSON:', parseError);
        return res.json({ error: true, message: 'O JSON do serviço está malformado.' });
      }
  
      jsonServico.barbeariaId = req.body.barbeariaId;
      await Servico.findByIdAndUpdate(req.params.id, jsonServico);
  
      // CRIAR ARQUIVO
      arquivos = arquivos.map((arquivo) => ({
        referenciaId: req.params.id,
        model: 'Servico',
        arquivo,
      }));
      await Arquivos.insertMany(arquivos);
  
      res.json({ error: false });
    } catch (err) {
      console.error('Erro:', err); // Adicione um log para depuração
      res.json({ error: true, message: err.message });
    }
  });

  router.get('/barbearia/:barbeariaId', async (req, res) => {
    try {
      let servicosBarbearia = [];
      const servicos = await Servico.find({
        barbeariaId: req.params.barbeariaId,
        status: { $ne: 'E' },
      });
  
      for (let servico of servicos) {
        const arquivos = await Arquivos.find({
          model: 'Servico',
          referenciaId: servico._id,
        });
        servicosBarbearia.push({ ...servico._doc, arquivos });
      }
  
      res.json({
        error: false,
        servicos: servicosBarbearia,
      });
    } catch (err) {
      res.json({ error: true, message: err.message });
    }
  });
  
  router.delete('/remove-arquivo', async (req, res) => {
    try {
      const { id } = req.body;
  
      // EXCLUIR DA AWS
      await aws.deleteFileS3(id);
  
      // EXCLUIR DO BANCO DE DADOS
      const result = await Arquivos.findOneAndDelete({ arquivo: id });
  
      if (result) {
        res.json({ error: false, message: 'Arquivo excluído com sucesso!' });
      } else {
        res.json({ error: true, message: 'Arquivo não encontrado no banco de dados!' });
      }
    } catch (err) {
      res.json({ error: true, message: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await Servico.findByIdAndUpdate(req.params.id, { status: 'E' });
      res.json({ error: false });
    } catch (err) {
      res.json({ error: true, message: err.message });
    }
  })

  module.exports = router;
