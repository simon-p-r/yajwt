'use strict';

const Ms = require('ms');
const Utils = require('basic-utils');

const internals = {};

internals.timeStampFields = ['exp', 'iat', 'nbf'];

exports.msToSeconds = (ms) => {

    return Math.floor(ms / 1000);
};

exports.checkTs = (payload) => {

    if (payload.iat > exports.msToSeconds(Date.now())) {
        return false;
    }

    if (payload.nbf > exports.msToSeconds(Date.now())) {
        return false;
    }

    if (exports.msToSeconds(Date.now()) >= payload.exp) {
        return false;
    }
    return true;

};

exports.coercePayload = (payload) => {

    const secondsEpoch = exports.msToSeconds(Date.now());

    for (let i = 0; i < internals.timeStampFields.length; ++i) {
        const key = internals.timeStampFields[i];
        if (payload[key]) {
            if (Utils.isString(payload[key])) {
                payload[key] = exports.msToSeconds(Ms(payload[key])) + secondsEpoch;
            }
            else {
                payload[key] = exports.msToSeconds(payload[key]);
            }
        }


    }


    // if (typeof payload.iat === 'string') {
    //     const iat = exports.msToSeconds(Ms(payload.iat));
    //     payload.iat = iat + secondsEpoch;
    // }
    // else {
    //    payload.iat = exports.msToSeconds(payload.iat);
    // }
    //
    // if (typeof payload.nbf === 'string') {
    //     const nbf = exports.msToSeconds(Ms(payload.nbf));
    //     payload.nbf = nbf + secondsEpoch;
    // }
    // else {
    //     payload.nbf = exports.msToSeconds(payload.nbf);
    // }
    //
    // if (typeof payload.exp === 'string') {
    //     const exp = exports.msToSeconds(Ms(payload.exp));
    //     payload.exp = exp + secondsEpoch;
    // }
    // else {
    //     payload.exp = exports.msToSeconds(payload.exp);
    // }

    return payload;

};

exports.humaniseJoi = (error) => {

    return error.details.map((d) => {

        return d.message.replace(/["]/ig, '');
    }).join(', ');
};
