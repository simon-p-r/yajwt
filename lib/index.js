'use strict';

const Joi = require('joi');
const JWT = require('jws');
const Ms = require('ms');

const algorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'];
const getTimestamp = () => {

    return Math.floor(Date.now() / 1000);
};

const internals = {
    schema: {
        sign: Joi.object().keys({
            header: Joi.object().keys({
                alg: Joi.string().valid(algorithms).default('RS256'),
                typ: Joi.string().valid('JWT').default('JWT')
            }).unknown().required(),
            payload: Joi.object().keys({
                aud: Joi.string(),
                exp: Joi.alternatives().try(Joi.number(), Joi.string()),
                iat: Joi.alternatives().try(Joi.number(), Joi.string()).default(getTimestamp()),
                iss: Joi.string(),
                jti: Joi.string(),
                nbf: Joi.alternatives().try(Joi.number(), Joi.string()),
                sub: Joi.string()
            }).unknown().required(),
            privateKey: Joi.alternatives().try(Joi.binary(), Joi.string()).required()
        }).unknown().required(),
        verify: {
            signature: Joi.string().required(),
            algorithm: Joi.string().valid(algorithms).default('RS256'),
            publicKey: Joi.alternatives().try(Joi.binary(), Joi.string()).required()
        }
    }
};


exports.isToken = JWT.isValid;

exports.sign = (options, cb) => {

    const schema = internals.schema.sign;

    Joi.validate(options, schema, (err, result) => {

        if (err) {
            return cb(new Error(internals.humaniseJoi(err)), null);
        }

        result.payload = internals.coercePayload(result.payload);
        const sign = JWT.createSign(result);

        sign.on('error', (err) => {

            return cb(err, null);
        });


        sign.on('done', (data) => {

            return cb(null, data);
        });

    });


};

exports.signSync = (options) => {

    const schema = internals.schema.sign;
    const validOptions = Joi.validate(options, schema);
    if (validOptions.error) {
        return {
            error: new Error(internals.humaniseJoi(validOptions.error))
        };
    }
    validOptions.value.payload = internals.coercePayload(validOptions.value.payload);
    const token = JWT.sign(validOptions.value);
    return {
        token
    };

};

exports.verify = (options, cb) => {

    const schema = internals.schema.verify;

    Joi.validate(options, schema, (err, result) => {

        if (err) {
            return cb(new Error(internals.humaniseJoi(err)), null);
        }

        const decoded = exports.decode(result.signature);

        if (decoded === null) {
            return cb(new Error('Token cannot be decoded as invalid format'), null);
        }

        if (!internals.checkTs(decoded.payload)) {
            return cb(new Error('JWT is not currently valid due to invalid timestamp'), null);
        }

        const verify = JWT.createVerify(result);

        verify.on('error', (err) => {

            return cb(err, null);
        });

        verify.on('done', (valid, data) => {

            if (valid) {
                return cb(null, data);
            }
            return cb(new Error('Token signature cannot be verified'), null);
        });

    });

};


exports.verifySync = (options) => {

    const schema = internals.schema.verify;
    const result = Joi.validate(options, schema);
    if (result.error) {
        return false;
    }
    const verifyOptions = result.value;
    const decoded = exports.decode(verifyOptions.signature);
    if (decoded === null) {
        return false;
    }

    if (!internals.checkTs(decoded.payload)) {
        return false;
    }
    return JWT.verify(verifyOptions.signature, verifyOptions.algorithm, verifyOptions.publicKey);
};


exports.decode = (jwt) => {

    return JWT.decode(jwt);
};



internals.checkTs = (payload) => {

    if (payload.iat > getTimestamp()) {
        return false;
    }

    if (payload.nbf > Math.floor(Date.now() / 1000)) {
        return false;
    }

    if (Math.floor(Date.now() / 1000) >= payload.exp) {
        return false;
    }
    return true;

};

internals.coercePayload = (payload) => {

    if (typeof payload.iat === 'string') {
        payload.iat = Ms(payload.iat);
    }

    if (typeof payload.nbf === 'string') {
        payload.nbf = Ms(payload.nbf);
    }

    if (typeof payload.exp === 'string') {
        payload.exp = Ms(payload.exp);
    }
    return payload;

};

internals.humaniseJoi = (error) => {

    return error.details.map((d) => {

        return d.message.replace(/["]/ig, '');
    }).join(', ');
};
