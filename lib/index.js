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
        sign: {
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
        },
        verify: {
            signature: Joi.string().required(),
            algorithm: Joi.string().valid(algorithms).default('RS256'),
            publicKey: Joi.alternatives().try(Joi.binary(), Joi.string()).required()
        }
    }
};


exports.sign = (options, cb) => {

    const retVal = {};
    const schema = internals.schema.sign;
    let validOptions;

    if (typeof cb === 'function') {

        Joi.validate(options, schema, (err, result) => {

            if (err) {
                return cb(new Error('Invalid options passed to verify method'), null);
            }

            validOptions = result;
            result = internals.coercePayload(validOptions.payload);
            const sign = JWT.createSign(validOptions);

            sign.on('err', (err) => {

                // $lab:coverage:off$
                return cb(err, null);
                // $lab:coverage:on$
            });


            sign.on('done', (data) => {

                return cb(null, data);
            });

        });
    }

    validOptions = Joi.validate(options, schema);
    if (validOptions.error) {
        return {
            error: 'Invalid options object passed to sign method'
        };
    }
    validOptions.value.payload = internals.coercePayload(validOptions.value.payload);
    try {
        retVal.token = JWT.sign(validOptions.value);
    }

    catch (e) {
        // $lab:coverage:off$
        retVal.error = new Error(e.message);
        // $lab:coverage:on$
    }
    return retVal;

};

exports.verify = (options, cb) => {

    const schema = internals.schema.verify;
    let decoded;

    if (typeof cb === 'function') {

        Joi.validate(options, schema, (err, result) => {

            if (err) {
                return cb(new Error('Invalid options passed to verify method'), null);
            }

            decoded = exports.decode(result.signature);

            if (decoded === null) {
                return cb(new Error('JSON signature cannot be decoded'), null);
            }

            if (!internals.checkTs(decoded.payload)) {
                return cb(new Error('Token is not currently valid'), null);
            }

            const verify = JWT.createVerify(result);

            verify.on('err', (err) => {

                // $lab:coverage:off$
                return cb(err, null);
                // $lab:coverage:on$
            });

            verify.on('done', (data) => {

                return cb(null, data);
            });

        });
    }

    const res = Joi.validate(options, schema);
    if (res.error) {
        return false;
    }
    decoded = exports.decode(res.value.signature);
    if (decoded === null) {
        return false;
    }

    if (!internals.checkTs(decoded.payload)) {
        return false;
    }
    return JWT.verify(res.value.signature, res.value.algorithm, res.value.publicKey);

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
