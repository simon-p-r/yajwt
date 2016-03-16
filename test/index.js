'use strict';

const Code = require('code');
const Fs = require('fs');
const Jwt = require('../lib/index.js');
const Lab = require('lab');
const Os = require('os');
const Path = require('path');

// fixtures
const PrivateKey = Fs.readFileSync(Path.resolve(__dirname, './fixtures/private.pem'));
const PublicKey = Fs.readFileSync(Path.resolve(__dirname, './fixtures/public.pem'));


// Set-up lab
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


const verifyOptions = (token) => {

    return {
        signature: token,
        publicKey: PublicKey,
        algorithm: 'RS256'
    };

};

const signingOptions = () => {

    return {
        header: {
            alg: 'RS256',
            // token type
            typ: 'JWT'
        },
        // payload can be object, buffer or string
        payload: {
            exp: '365d',
            nbf: '1d',
            host: Os.hostname(),
            port: 3000
        },
        privateKey: PrivateKey
    };
};



describe('Jwt', () => {


    it('should sign a payload sync', (done) => {

        const result = Jwt.sign(signingOptions());
        expect(result.token).to.be.a.string();
        expect(result.error).to.not.exist();
        done();

    });

    it('should return an error when signing a payload sync due to missing algorithm', (done) => {

        const ops = signingOptions();
        ops.header.alg = null;
        const result = Jwt.sign(ops);
        expect(result.token).to.not.exist();
        expect(result.error).to.exist();
        done();

    });

    it('should sign a payload async', (done) => {

        Jwt.sign(signingOptions(), (err, token) => {

            expect(err).to.not.exist();
            expect(token).to.be.a.string();
            done();

        });

    });

    it('should return an error when signing a payload async due to missing algorithm', (done) => {

        const ops = signingOptions();
        ops.header.alg = null;
        Jwt.sign(ops, (err, token) => {

            expect(err).to.exist();
            expect(token).to.not.exist();
            done();

        });

    });

    it('should verify a payload sync', (done) => {

        const result = Jwt.sign(signingOptions());
        const ops = verifyOptions(result.token);
        const valid = Jwt.verify(ops);
        expect(valid).to.be.true();
        done();

    });

    it('should return false when verify a payload sync due to missing signature', (done) => {

        const ops = verifyOptions();
        const valid = Jwt.verify(ops);
        expect(valid).to.be.false();
        done();

    });

    it('should return false when verify a payload sync due to an invalid signature', (done) => {

        const result = Jwt.sign(signingOptions());
        const ops = verifyOptions(result.token);
        ops.signature = 'This is invalid';
        const valid = Jwt.verify(ops);
        expect(valid).to.be.false();
        done();

    });


    it('should verify a payload async', (done) => {

        const result = Jwt.sign(signingOptions());
        const ops = verifyOptions(result.token);
        Jwt.verify(ops, (err, valid) => {

            expect(err).to.not.exist();
            expect(valid).to.be.true();
            done();

        });

    });

    it('should return an error when verifying a payload async due to missing signature', (done) => {

        const ops = verifyOptions();
        Jwt.verify(ops, (err, valid) => {

            expect(err).to.exist();
            expect(valid).to.be.null();
            done();

        });

    });


    it('should return an error when verifying a payload async due to invalid signature', (done) => {

        const result = Jwt.sign(signingOptions());
        const ops = verifyOptions(result.token);
        ops.signature = 'This is an invalid token';
        Jwt.verify(ops, (err, token) => {

            expect(err).to.exist();
            expect(token).to.be.null();
            done();

        });

    });

    it('should return an error when verifying a payload async due to mismatch in signing algorithm', (done) => {

        const result = Jwt.sign(signingOptions());
        const ops = verifyOptions(result.token);
        ops.algorithm = 'HS256';
        Jwt.verify(ops, (err, token) => {

            expect(err).to.exist();
            expect(token).to.be.null();
            done();

        });

    });

    it('should return an error when verifying a payload async due to invalid timestamps', (done) => {

        const signOps = signingOptions();
        signOps.payload.exp = (Math.floor(Date.now() / 1000)) - 1;
        const result = Jwt.sign(signOps);
        const ops = verifyOptions(result.token);
        Jwt.verify(ops, (err, token) => {

            expect(err).to.exist();
            expect(token).to.be.null();
            done();

        });

    });

    it('should fail verfiy on timestamp checking', (done) => {

        const signOps = signingOptions();
        signOps.payload.exp = 1000;
        signOps.payload.iat = 2000000000;
        delete signOps.payload.nbf;
        const result = Jwt.sign(signOps);
        const ops = verifyOptions(result.token);
        const verify = Jwt.verify(ops);
        expect(verify).to.be.false();
        done();

    });

    it('should fail verfiy on timestamp checking due to invalid nbf', (done) => {

        const signOps = signingOptions();
        signOps.payload.nbf = 2000000000;
        const result = Jwt.sign(signOps);
        const ops = verifyOptions(result.token);
        const verify = Jwt.verify(ops);
        expect(verify).to.be.false();
        done();

    });

    it('should pass verfiy on timestamp checking', (done) => {

        const signOps = signingOptions();
        signOps.payload.iat = '1d';
        delete signOps.payload.exp;
        const result = Jwt.sign(signOps);
        const ops = verifyOptions(result.token);
        const verify = Jwt.verify(ops);
        expect(verify).to.be.true();
        done();

    });

    it('should return a decoded json web token', (done) => {

        const result = Jwt.sign(signingOptions());
        const decoded = Jwt.decode(result.token);
        expect(decoded).to.be.an.object();
        expect(decoded.header.alg).to.equal('RS256');
        expect(decoded.payload.host).to.equal(Os.hostname());
        done();

    });



});
