import express from 'express';
import { authService } from './auth.service.js';
import { loggerService } from '../../services/logger.service.js';
import { utilityService } from '../../services/utility.service.js';
// auth routes
export const authRoutes = express.Router();
authRoutes.post('/login', _login);
authRoutes.post('/signup', _signup);
authRoutes.post('/logout', _logout);
authRoutes.get('/api-keys', _getAPIKeys);
// auth controller functions
async function _login(req, res) {
    const { loginId, password, recaptchaToken } = req.body;
    try {
        await utilityService.verifyRecaptcha(recaptchaToken);
        const user = await authService.login(loginId, password);
        const loginToken = authService.getLoginToken(user);
        loggerService.info('User login: ', loginToken);
        res.cookie('loginToken', loginToken, { httpOnly: true, sameSite: 'none', secure: true });
        res.json(user);
    }
    catch (err) {
        const error = err;
        loggerService.error('Failed to Login ', error);
        if (error.message === 'Invalid reCAPTCHA')
            res.status(401).send({ err: 'Invalid reCAPTCHA' });
        else
            res.status(500).send({ err: 'Failed to Login' });
    }
}
async function _signup(req, res) {
    const { password, email, imgUrls, recaptchaToken } = req.body;
    try {
        await utilityService.verifyRecaptcha(recaptchaToken);
        const account = await authService.signup(email, password, imgUrls);
        loggerService.debug(`auth.route - new account created: ${JSON.stringify(account)}`);
        const user = await authService.login(email, password);
        const loginToken = authService.getLoginToken(user);
        loggerService.info('User signup: ', loginToken);
        res.cookie('loginToken', loginToken, { httpOnly: true, sameSite: 'none', secure: true });
        res.json(user);
    }
    catch (err) {
        const error = err;
        loggerService.error('Failed to Login ', error);
        if (error.message === 'Invalid reCAPTCHA')
            res.status(401).send({ err: 'Invalid reCAPTCHA' });
        else
            res.status(500).send({ err: 'Failed to Signup' });
    }
}
async function _logout(req, res) {
    try {
        res.clearCookie('loginToken');
        res.status(200).send({ msg: 'Logged out successfully' });
    }
    catch (err) {
        loggerService.error('Failed to logout ', err);
        res.status(500).send({ err: 'Failed to logout' });
    }
}
async function _getAPIKeys(req, res) {
    try {
        const apiKeys = authService.getFrontAPIKeys();
        res.json(apiKeys);
    }
    catch (err) {
        loggerService.error('Failed to fetch API keys', err);
        res.status(500).send({ err: 'Failed to fetch API keys' });
    }
}
