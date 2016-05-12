'use strict';

const Ms = require('ms');
const Utils = require('basic-utils');

const internals = {};

internals.dateRegex = new RegExp(/^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/);
// internals.dataRegex = new RegExp(/^((0[1-9]|[12][0-9]|3[01])(\/)(0[13578]|1[02]))|((0[1-9]|[12][0-9])(\/)(02))|((0[1-9]|[12][0-9]|3[0])(\/)(0[469]|11))(\/)\d{4}$/);
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
                if (!Utils.isNan(Date.parse(payload[key]))) {
                    payload[key] = exports.msToSeconds(Date.parse(payload[key]));
                }
                else {
                    payload[key] = exports.msToSeconds(Ms(payload[key])) + secondsEpoch;
                }

            }
            else {
                payload[key] = exports.msToSeconds(payload[key]);
            }
        }

    }

    return payload;

};

exports.humaniseJoi = (error) => {

    return error.details.map((d) => {

        return d.message.replace(/["]/ig, '');
    }).join(', ');
};
