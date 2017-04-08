'use strict';

const Moment = require('moment');
const Ms = require('ms');
const Utils = require('basic-utils');

const internals = {};

internals.timeStampFields = ['exp', 'iat', 'nbf'];
internals.timeFormats = ['DD-MM-YYYY', 'DD-MM-YY', 'DD/MM/YYYY', 'DD/MM/YY'];
internals.msRegexp = new RegExp(/^((?:\d+)?\.?\d+) *(days?|d|years?|yrs?|y)?$/i);

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

                if (Moment(payload[key], internals.timeFormats, true).isValid()) {
                    payload[key] = exports.msToSeconds(Moment(payload[key], internals.timeFormats, true).valueOf());
                }
                else if (internals.msRegexp.test(payload[key])) {
                    payload[key] = exports.msToSeconds(Ms(payload[key])) + secondsEpoch;
                }
                else {
                    throw new Error(`Key name ${key} is not the correct time string format`);
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
