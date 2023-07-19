const { MongoClient } = require('mongodb');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, './.env') });

const client = new MongoClient(process.env.DATABASE_URL);

async function connect() {
    let connection = null;
    console.log('Conectando...');

    try {
        connection = await client.connect();
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.log('No se pudo realizar la conexion a MongoDB');
    }
    return connection;
}

async function disconnectDB() {
    try {
        await client.close();
        console.log('Desconectado de MongoDB');
    } catch (error) {
        console.log('No se pudo realizar la desconexion de MongoDB');
    }
}

async function connectToDB(collectionName) {
    const connection = await connect();
    const db = await connection.db(process.env.DATABASE_NAME);
    const collection = await db.collection(collectionName);

    return collection;
}

async function generarCodigo(collection) {
    const documentMaxCod = await collection
        .find()
        .sort({ codigo: -1 })
        .limit(1)
        .toArray();
    const maxCod = documentMaxCod[0]?.codigo ?? 0;
    return maxCod + 1;
}

module.exports = { disconnectDB, connectToDB, generarCodigo };
