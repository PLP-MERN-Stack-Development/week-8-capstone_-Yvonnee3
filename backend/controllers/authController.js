const User = require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = 'secret'

//handle errors
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = {email:'', password:'', firstName:'', lastName:'', role:'', department:''};

    //duplicate email
    if (err.code === 11000) {
        errors.email = "that email is already registered"
        return errors
    }

    if (err.message === 'incorrect email') {
        errors.email = 'that email is not registered'
    }

    if(err.message === 'incorrect password') {
        errors.password = 'that password is incorrect'
    }

    //validation errors
    if (err.message.includes('user validation failed')) {
        Object.values(err.errors).forEach(({properties}) => {
            errors[properties.path] = properties.message
        });
    }
    return errors;
}

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({id}, JWT_SECRET, {
        expiresIn: maxAge
    })
}

module.exports.register = async(req, res) => {
    const {email, password, role, department, firstName, lastName, rank} = req.body;
    try {
        const userData = {
            email,
            password,
            firstName,
            lastName,
            role
        };

        if (role === 'employee') {
            userData.rank = rank;
            userData.department = department;
        }

        const user = await User.create(userData);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000, secure: true, sameSite: 'lax', path: '/'});
        res.status(201).json({
            user: user._id, 
            token, // Make sure to send the token in the response
            success: true
        });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({errors});
    }
}

module.exports.login = async(req, res) =>{
    const { email, password} = req.body;
    try { 
        const user = await User.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000, secure: true, sameSite: 'none'});
        res.status(200).json({ user: user._id, token});
        console.log(user)
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.logout = async (req, res) => {
    res.cookie('jwt', '', { maxAge: 1});
    res.redirect('/')
}

module.exports.getCurrentUser = async (req, res) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decodedToken.id).select('-password'); // Exclude password

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                rank: user.rank,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                createdAt: user.createdAt || null
            }
        });
    } catch (err) {
        console.error('Get current user error:', err.message);
        res.status(401).json({ error: 'Invalid token' });
    }
}
