const mongoose = require('mongoose');
const passport = require('passport');
const Vacantes = require('../Models/Vacantes');
const Usuarios = require('../Models/Usuarios');
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect : '/administracion',
    failureRedirect : '/iniciar-sesion', 
    failureFlash: true,
    badRequestMessage : 'Ambos campos son obligatorios'
});

//revisar si el usuario esta autenticado
exports.verificarUsuario = (req,res, next) => {
    //revisar el usuario
    if(req.isAuthenticated()){ // isAuthenticated: metedo de passport que te regresa true o false para la utentificacion
        return next(); //estan autenticados pasa al siguiente middleware
    }
    //redireccionarlos si no estan autenticados
    res.redirect('/iniciar-sesion');
};

exports.mostrarPanel = async (req,res) => {

    //consultar el usuario autenticado
    const vacantes = await Vacantes.find({autor: req.user._id});

    res.render('administracion',{
        nombrePgina: 'Panel de Administracion',
        tagline: 'Crea y Administra tus Vacantes Desde Aqui',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        vacantes
    })
};

//cerrar sesion
exports.cerrarSesion = (req, res, next) => {
    req.logout(function(err){
        if(err) {
            return next(err);
        }
        req.flash('correcto', 'cerrarste sesion correctamente')
        return res.redirect('/iniciar-sesion')
    });
};

//Formulario para rfeiniciar el password
exports.formRestablecerPassword = (req,res) => {
    res.render('reestablecer-password',{
        nombrePagina:'Restablece tu password',
        tagline: 'Si ya tienes una cuenta pero olvidast tu password, coloca tu email'
    })
};

//genera el token en la tabla de usuario
exports.enviarToken = async (req,res) => {
    const usuario = await Usuarios.findOne({email: req.body.email})
    //si non existe el usuario
    if(!usuario){
        req.flash('error','No existe esa cuenta');
        return res.redirect('/iniciar-sesion')
    }

    //el usuario existe, generar token
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;

    //guardar el usuario
    await usuario.save();
    const resetUrl = `http//${req.headers.host}/reestablecer-password/${usuario.token}`;
    
    //ENVAIR NOTIFICACION POR EMAIL
    await enviarEmail.enviar({
        usuario,
        subject:'Password Reset',
        resetUrl,
        archivo:'reset'
    });

    // correcto
    req.flash('correcto', 'Revisa tu email para las indicaciones');
    res.redirect('/iniciar-sesion');
};

//valida si el token es valido y el usuario existe, muestra la vista

exports.reestablecerPassword = async (req,res) => {
    const usuario = Usuarios.findOne({
        token: req.params.token,
        expira:{
            $gt: Date.now()
        }
    });
    if(!usuario){
        req.flash('error','el formulario ya no es valido, intenta de nuevo');
        return res.redirect('/reestrablecer-password');
    }
    //todo bien, mostrar el formulario
    res.render('nuevo-password',{
        nombrePagina: 'Nuevo Password'
    })
};

//guaradar password en la bd
exports.guardarPassword = async (req, res) => {
    try {
        // Buscar el usuario por token y expira
        const usuario = await Usuarios.findOne({
            token: req.params.token,
            expira: {
                $gt: Date.now()
            }
        });

        // Validar si el usuario no existe o el token es inválido
        if (!usuario) {
            req.flash('error', 'El formulario ya no es válido, intenta de nuevo');
            return res.redirect('/reestrablecer-password');
        }

        // Asignar el nuevo password y limpiar valores previos
        usuario.password = req.body.password;
        usuario.token = undefined;
        usuario.expira = undefined;

        // Guardar los cambios en el usuario
        await usuario.save();

        // Redirigir con un mensaje de éxito
        req.flash('correcto', 'Password modificado correctamente');
        res.redirect('/iniciar-sesion');
    } catch (error) {
        console.error('Error al guardar el password:', error);
        req.flash('error', 'Ocurrió un error al modificar el password');
        res.redirect('/reestrablecer-password');
    }
};
