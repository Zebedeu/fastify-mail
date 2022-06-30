import { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export type FastifyNodemailerOptions = SMTPTransport.Options;
export const createTestAccount = nodemailer.createTestAccount;
export const getTestMessageUrl = nodemailer.getTestMessageUrl;

const nodeMailerPlugin: FastifyPluginCallback<FastifyNodemailerOptions> = (
  fastify,
  options,
  done
) => {
  if (fastify.nodemailer)
    return done(new Error("fastify-mail has been defined before "));

  fastify
    .decorate("nodemailer", nodemailer.createTransport(options))
    .decorateRequest("nodemailer", { getter: () => fastify.nodemailer })
    .addHook("onClose", (fastify, done) => {
      fastify.nodemailer.close();
      done();
    });

  done();
};

const fastifyNodemailer = fp(nodeMailerPlugin, {
  fastify: "4.x",
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
