const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const bcrypt = require('bcrypt');



const usuariosSchema = new mongoose.Schema({
    email:{
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    nombre:{
        type: String,
        requied: true,
    },
    password:{
        type: String,
        required: true,
        trim: true
    },
    token: String,
    expira: Date,
    imagen:String
});

//  metodo para hashear los psswors
usuariosSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next(); // deten la ejecucion del hasheo y continua con el siguiente middleware
    }
    //si no esta hasheado
    const hash = await bcrypt.hash(this. password, 12);
    this.password = hash;
    next();
});

//envia alerta cuando un usuario ya esta registrado

usuariosSchema.post('save', function(error,doc,next) {
    if(error.name === 'MongoServerError' && error.code === 11000 ){
        next('Ese correo ya esta registrado');
    } else {
        next(error);
    }
});

//autenticar usuarios
usuariosSchema.methods = {
    compararPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
    }
}

module.exports = mongoose.model('Usuarios' , usuariosSchema);