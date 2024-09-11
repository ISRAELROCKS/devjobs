const emailConfig = require('../config/email');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const { send } = require('process');
const util = require('util');

let transport = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    auth:{
        user: emailConfig.user,
        pass: emailConfig.pass
    }
});

transport.use('compile', hbs({
    viewEngine: {
        extName: '.handlebars',  // Especifica la extensión de los archivos de plantillas, en este caso ".handlebars".
        partialsDir: __dirname + '/../views/emails',  // Directorio donde se encuentran los "partials" de Handlebars, que son fragmentos reutilizables en las plantillas.
        layoutsDir: __dirname + '/../views/emails',   // Directorio que contiene los "layouts", estructuras generales que envuelven el contenido de las vistas.
        defaultLayout: 'reset.handlebars',  // Establece el layout predeterminado que se utilizará, en este caso 'reset.handlebars'.
    },
    viewPath: __dirname + '/../views/emails',  // Ruta donde se encuentran las vistas (templates) principales para los correos electrónicos.
    extName: '.handlebars'  // Reitera la extensión predeterminada para las vistas, asegurando que Nodemailer interprete correctamente los archivos como plantillas de Handlebars.
}));

exports.enviar = async (opciones) => {

    const opcionesEmail= {
        from: 'devJobs <noreply@devjobs.com',
        to: opciones.usuario.email,
        subject: opciones.subject,
        template: opciones.archivo,
        context:{
            resetUrl: opciones.resetUrl
        }
    }
    const sendMail= util.promisify(transport.sendMail, transport);
    return sendMail.call(transport, opcionesEmail);
}