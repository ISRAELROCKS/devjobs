const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slug');
const shortid = require('shortid');

const vacantesSchema = new mongoose.Schema({
    titulo: {
        type: String ,
        required: 'El nombre la vacante es necesario',
        trim: true //trim recorta los espacios de mas
    },
    empresa: {
        type: String,
        trim: true
    },
    ubicacion:{
        type: String,
        trim: true, 
        requered: 'La ubicacion es obligatoria'
    },
    salario:{
        type: String,
        default: 0,
        trim: true
    },
    contrato:{
        type: String,
        trim: true
    },
    descripcion:{
        type: String,
        trim: true
    },
    url:{
        type: String,
        lowercase:true
    },
    skills: [String],
    candidatos: [{
        nombre: String,
        email: String,
        cv: String
    }],
    autor: {
        type: mongoose.Schema.ObjectId,
        ref: 'Usuarios',
        required: 'El autor es obligatorio'
    }
})

vacantesSchema.pre('save', function(next){

    //crear url 
    const url = slug(this.titulo)
    this.url = `${url}-${shortid.generate()}`;
    next();
});

//crear un indice
vacantesSchema.index({ titulo : 'text'});

module.exports = mongoose.model('Vacantes', vacantesSchema); 