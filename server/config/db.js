const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();


const app =  express();
// const dbURI = process.env.dbURI

const dbURI = 'mongodb+srv://yvonnemueni42:i0MvtsNC1fLPrFpO@cluster0.0dqbikh.mongodb.net/benefits'

async function connectDB() {
    try{
        await mongoose.connect(dbURI);
        console.log ('MongoDB connected successfully')
    }
    catch (err){
        console.log (' Database connection Failed', err); 
        process.exit(1);
    }
}

module.exports = { connectDB }
