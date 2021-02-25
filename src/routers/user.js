const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeMail, sendCancelationMail } = require('../email/accounts');

const router = new express.Router();

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            cb(new Error('Incorrect file type'));
        }

        cb(null, true);
    }
});

router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        const token =  await user.generateAuthToken();
        await user.save();
        sendWelcomeMail(user.email, user.name);
        res.status(201).send({ user, token });
    } catch {
        res.status(400).send(error)
    };
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token =  await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        res.status(400).send(); 
    };
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });

        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    };
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    };
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;
    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).send();
        }

        res.send(user);
    } catch (error) {
        res.status(500).send();
    };
});

router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });
    
    if (!isValidOperation) {
        return res.status(400).send('Invalid updates!');
    }

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });

        await req.user.save();
        res.send(req.user);
    } catch (error) {
        res.status(400).send();
    };
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        req.user.remove();
        sendCancelationMail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (error) {
        res.status(500).send();
    } 
});

// Avatar

router.post('/users/me/avatar', auth, upload.single('upload'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({error: error.message});
});

router.delete('/users/me/avatar', auth, async(req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch {
        res.status(404).send();
    }
});

module.exports = router;