// imports
const { Client } = require('pg');
const fs = require('fs'); // permet a node de lire des fichiers
const express = require('express');
const { log } = require('console');

// declarations
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'HelpRequestAPI',
    password: 'mdp',
    port: 5432,
});

client.connect();
const app = express();
const port = 8000;

// Add headers before the routes are defined
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(express.json());

// routes

// lister tous les tickets par date
app.get('/api/tickets', async (req, res) => {
    try {
        const data = await client.query('SELECT * FROM tickets ORDER BY created_at');
        res.status(200).json({ status: "success", data: data.rows })
    }
    catch (err) {
        res.status(400).json({ status: "fail", data: "Erreur serveur" })
    }
})

// ticket par ID
app.get('/api/tickets/:id', async (req, res) => {
    const id_tickets = parseInt(req.params.id);

    if (isNaN(id_tickets)) {
        res.status(406).json({ status: "fail", data: "Parametres incorrects" })

        return;
    }

    try {
        const data = await client.query('SELECT * FROM tickets WHERE id_ticket = $1', [id_tickets]);

        if (data.rowCount === 1) {
            res.status(200).json({ status: "success", data: data.rows[0] })

            return;
        }

        res.status(404).json({ status: "fail", data: "Ticket intouvable" })

    }
    catch (err) {
        res.status(400).json({ status: "fail", data: "Erreur serveur" })
    }

})
// ajouter un ticket
app.post('/api/tickets', async (req, res) => {
    const message = req.body.message;
    const user_id = parseInt(req.body.user_id);

    if (req.body.message.length === 0 || isNAN(req.body.user_id)) {
        res.status(412).json({ status: "fail", data: "content or user_id uncorrect" })
        return;
    }
    try {
        const data = await client.query('INSERT INTO tickets (message, user_id) VALUES ($1, $2) RETURNING *', [message, user_id]);
        res.status(201).json({ status: "success", data: data.rows[0] })
    }

    catch (err) {
        res.status(400).json({ status: "fail", data: "Erreur serveur" })
    }
})

// supprimer un ticket
app.delete('/api/tickets/:id', async (req, res) => {
    const id_ticket = parseInt(req.params.id);

    if (isNan(id_ticket)) {
        res.status(406).json({ status: "fail", data: "Parametres incorrects" })

        return;
    }
    try {
        const data = await client.query('DELETE FROM tickets WHERE id_ticket = $1', [id_ticket]);
        if (data.rowCount === 1) {
            res.status(202).json({ status: "success", data: "Ticket supprimé" })
        }
        else {
            res.status(404).json({ status: "fail", data: "Ticket introuvable" })
        }
    } catch (error) {
        res.status(400).json({ status: "fail", data: "Erreur serveur" })
    }
})

// update ticket
app.put('/api/tickets/:id', async (req, res) => {
    const id = req.params.id;
    const ticket = await client.query('SELECT * FROM tickets WHERE id_ticket = $1', [id]);
    if (ticket.rowCount === 1) {
        const data = await client.query('UPDATE tickets SET done = $2 WHERE id_ticket = $1', [id, !ticket.rows[0].done]);
        if (data.rowCount === 1) {
            res.json({ update: true })
        }
        else {
            res.json({ update: false })
        }
    }
    else {
        res.json({ done: false })
    }


})

// ecoute le port 8000
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
