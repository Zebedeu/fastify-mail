import { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import Joi from 'joi'; // Ou outra biblioteca de validação

export type FastifyNodemailerOptions = SMTPTransport.Options;
export const createTestAccount = nodemailer.createTestAccount;
export const getTestMessageUrl = nodemailer.getTestMessageUrl;

const nodeMailerPlugin: FastifyPluginCallback<FastifyNodemailerOptions> = (
  fastify,
  options,
  done
) => {
  if (fastify.nodemailer) {
    return done(new Error("fastify-mail has been defined before "));
  }

  // Exemplo de validação de esquema com Joi
  const schema = Joi.object({
    host: Joi.string().required(),
    port: Joi.number().integer().min(1).max(65535).required(),
    secure: Joi.boolean().required(),
    auth: Joi.object({
      user: Joi.string().required(),
      pass: Joi.string().required(),
    }).required(),
    // Adicione outras opções que você considera obrigatórias ou importantes
  });

  const { error } = schema.validate(options);
  if (error) {
    return done(new Error(`Invalid Nodemailer options: ${error.message}`));
  }

  try {
    const transporter = nodemailer.createTransport(options);
    fastify
      .decorate("nodemailer", transporter)
      .decorateReply("nodemailer", { getter: () => fastify.nodemailer })
      .addHook("onClose", (fastify, done) => {
        fastify.nodemailer.close();
        done();
      });
    done();
  } catch (err: Error | any) {
    fastify.log.error('Erro ao criar o transportador Nodemailer:', err);
    done(new Error(`Failed to create Nodemailer transporter: ${err.message}`));
  }
};

const fastifyNodemailer = fp(nodeMailerPlugin, {
  fastify: "5.x",
  name: "fastify-mail",
});

export default fastifyNodemailer;

declare module "fastify" {
  interface FastifyReply {
    nodemailer: nodemailer.Transporter;
  }
  interface FastifyInstance {
    nodemailer: nodemailer.Transporter;
  }
}