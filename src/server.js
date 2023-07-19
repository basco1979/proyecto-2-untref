/* eslint-disable require-unicode-regexp */
const express = require('express');
const { connectToDB, disconnectDB, generarCodigo } = require('../connection_db.js');

const server = express();

const messageNotFound = JSON.stringify({ message: 'El código no corresponde a un mueble registrado' });
const messageMissingData = JSON.stringify({ message: 'Faltan datos relevantes' });
const messageErrorServer = JSON.stringify({ message: 'Se ha generado un error en el servidor' });

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Obtener los registros de todos los muebles (permite filtrar).

server.get('/api/v1/muebles', async (req, res) => {
    const { categoria, precio_gte, precio_lte } = req.query;
    let muebles = [];
    try {
        const collection = await connectToDB('muebles');
        if (categoria) muebles = await collection.find({ categoria }).sort({ nombre: 1}).toArray();
        else if (precio_gte) muebles = await collection.find({ precio: { $gte: Number(precio_gte) } }).sort({ precio: 1 }).toArray();
        else if (precio_lte) muebles = await collection.find({ precio: { $lte: Number(precio_lte) } }).sort({ precio: -1 }).toArray();
        else muebles = await collection.find().toArray();

        res.status(200).send(JSON.stringify({ payload: muebles }));
    } catch (error) {
        console.log(error.message);
        return res.status(500).send(messageErrorServer);
    } finally {
        await disconnectDB();
    }
});

// Obtener un registro en específico
server.get('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const collection = await connectToDB('muebles');
        const mueble = await collection.findOne({ codigo: { $eq: Number(codigo) } });
        if (!mueble) return res.status(400).send(messageNotFound);
        res.status(200).send(JSON.stringify({ payload: mueble }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send(messageErrorServer);
    } finally {
        await disconnectDB();
    }
});


// Crea un nuevo registro
server.post('/api/v1/muebles', async (req, res) => {
    const { nombre, precio, categoria } = req.body;
    if (!nombre && !precio && !categoria) {
        return res.status(400).send(messageMissingData);
    }

    try {
        const collection = await connectToDB('muebles');
        const mueble = {
            codigo: await generarCodigo(collection),
            nombre,
            precio,
            categoria
        };
        await collection.insertOne(mueble);
        return res.status(201).send(JSON.stringify({message: 'Registro creado', payload: mueble}));
    } catch (error) {
        console.log(error.message);
        res.status(500).send(messageErrorServer);
    } finally {
        await disconnectDB();
    }
});

// Modifica un registro en específico
server.put('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre, precio, categoria } = req.body;
    if (!nombre && !precio && !categoria) return res.status(400).send(messageMissingData);
    try {
        const collection = await connectToDB('muebles');
        let mueble = await collection.findOne({ codigo: Number(codigo) });
        if (!mueble) return res.status(400).send(messageNotFound);
        mueble = { nombre, precio, categoria};
        if (nombre) mueble.nombre = nombre;
        if (precio) mueble.precio = precio;
        if (categoria) mueble.categoria = categoria;
        await collection.updateOne({ codigo: Number(codigo) }, { $set: mueble });
        res.status(200).send(JSON.stringify({ message: 'Registro actualizado', payload: { codigo, ...mueble } }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send(messageErrorServer);
    } finally {
        await disconnectDB();
    }
});

// Elimina un registro en específico
server.delete('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;
    try {
        const collection = await connectToDB('muebles');
        const mueble = await collection.findOne({ codigo: { $eq: Number(codigo) } });
        if (!mueble) return res.status(400).send(messageNotFound);
        await collection.deleteOne({ codigo: Number(codigo) });
        return res.status(200).send({ message: 'Registro eliminado'});
    } catch (error) {
        console.log(error.message);
        res.status(500).send(messageErrorServer);
    } finally {
        await disconnectDB();
    }
});

// Control de rutas inexistentes
server.use('*', (req, res) => {
    res
        .status(404)
        .send(`<h1>Error 404</h1><h3>La URL indicada no existe en este servidor</h3>`);
});

server.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, () => {
    console.log(`Ejecutandose en ${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`);
});
