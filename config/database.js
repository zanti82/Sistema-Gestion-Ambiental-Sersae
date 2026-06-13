const mongoose = require('mongoose');

function connectDB(){

    const uri = process.env.MONGO_URI;

    mongoose.connect(uri)
        .then(()=>{
            console.log(`MongoDB conectado en: ${uri}` );
        })
        .catch((error)=>{
            console.log(`Error conectando con MDB: ${error}`);
            process.exit(1);

        })
} 

module.exports = connectDB;