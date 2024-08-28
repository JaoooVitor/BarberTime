const express = require('express');
const router = express.Router();
const Barbearia = require('../models/barbearia');
const Servico = require('../models/servico');
const turf = require('@turf/turf');

router.post('/', async (req, res) => {
    try {
        const barbearia = await new Barbearia(req.body).save();
        res.json({ barbearia })
    } catch (err) {
        res.json({ error: true, message: err.message })
    }
});

router.get('/servico/:barbeariaId', async (req, res) => {
    try {
        const { barbeariaId } = req.params;
        const servico = await Servico.find({
            barbeariaId,
            status: 'A'
        }).select('_id titulo');

        res.json({
            servico: servico.map((s) => ({ label: s.titulo, value: s._id })),    
        });

    } catch (err) {
        res.json({ error: true, message: err.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const barbearia = await Barbearia.findById(req.params.id).select(req.body.fields);

        // DISTANCIA
        const distance = turf.distance(
            turf.point(barbearia.geo.coordinates),
            turf.point([-18.9557133, -46.9829737])
        );

        res.json({ error: false, barbearia, distance })
    } catch (err) {
        res.json({ error: true, message: err.message });
    }
});

module.exports = router;