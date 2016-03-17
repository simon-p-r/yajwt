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

        const result = Jwt.signSync(signingOptions());
        expect(result.token).to.be.a.string();
        expect(result.error).to.not.exist();
        done();

    });

    it('should return an error when signing a payload sync due to missing algorithm', (done) => {

        const ops = signingOptions();
        ops.header.alg = null;
        const result = Jwt.signSync(ops);
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

    it('should return an error when signing a payload async due invalid key', (done) => {

        const ops = signingOptions();
        ops.privateKey = PublicKey;
        Jwt.sign(ops, (err, token) => {

            expect(err).to.exist();
            expect(token).to.not.exist();
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

        const result = Jwt.signSync(signingOptions());
        const ops = verifyOptions(result.token);
        const valid = Jwt.verifySync(ops);
        expect(valid).to.be.true();
        done();

    });

    it('should return false when verifying a payload due to missing signature', (done) => {

        const ops = verifyOptions();
        const valid = Jwt.verifySync(ops);
        expect(valid).to.be.false();
        done();

    });

    it('should return false when verifying a payload due to an invalid signature', (done) => {

        const result = Jwt.signSync(signingOptions());
        const ops = verifyOptions(result.token);
        ops.signature = 'This is invalid';
        const valid = Jwt.verifySync(ops);
        expect(valid).to.be.false();
        done();

    });


    it('should verify a payload async', (done) => {

        const result = Jwt.signSync(signingOptions());
        const ops = verifyOptions(result.token);
        Jwt.verify(ops, (err, decoded) => {

            expect(err).to.not.exist();
            expect(decoded).to.exist();
            done();

        });

    });

    it('should return a joi error when verifying a payload async due to missing signature', (done) => {

        const ops = verifyOptions();
        Jwt.verify(ops, (err, decoded) => {

            expect(err).to.exist();
            expect(decoded).to.not.exist();
            done();

        });

    });


    it('should return an error when verifying a payload async due to invalid signature', (done) => {

        const result = Jwt.signSync(signingOptions());
        const ops = verifyOptions(result.token);
        ops.signature = 'This is an invalid token';
        Jwt.verify(ops, (err, decoded) => {

            expect(err).to.exist();
            expect(decoded).to.not.exist();
            done();

        });

    });

    it('should return an error when verifying a payload async due to mismatch in signing algorithm', (done) => {

        const result = Jwt.signSync(signingOptions());
        const ops = verifyOptions(result.token);
        ops.algorithm = 'HS256';
        Jwt.verify(ops, (err, decoded) => {

            expect(err).to.exist();
            expect(decoded).to.not.exist();
            done();

        });

    });


    it('should return an error when verifying a payload async due to invalid publicKey', (done) => {

        const result = Jwt.signSync(signingOptions());
        const ops = verifyOptions(result.token);
        ops.publicKey = PrivateKey;

        Jwt.verify(ops, (err, decoded) => {

            expect(err).to.exist();
            expect(decoded).to.not.exist();
            done();

        });

    });


    it('should return an error when verifying a payload async due to invalid timestamps', (done) => {

        const signOps = signingOptions();
        signOps.payload.exp = (Math.floor(Date.now() / 1000)) - 1;
        const result = Jwt.signSync(signOps);
        const ops = verifyOptions(result.token);
        Jwt.verify(ops, (err, decoded) => {

            expect(err).to.exist();
            expect(decoded).to.not.exist();
            done();

        });

    });

    it('should return false when verifying timestamp', (done) => {

        const signOps = signingOptions();
        signOps.payload.exp = 1000;
        signOps.payload.iat = 2000000000;
        delete signOps.payload.nbf;
        const result = Jwt.signSync(signOps);
        const ops = verifyOptions(result.token);
        const verify = Jwt.verifySync(ops);
        expect(verify).to.be.false();
        done();

    });

    it('should return false when verifying due to an invalid nbf timestamp', (done) => {

        const signOps = signingOptions();
        signOps.payload.nbf = 2000000000;
        const result = Jwt.signSync(signOps);
        const ops = verifyOptions(result.token);
        const verify = Jwt.verifySync(ops);
        expect(verify).to.be.false();
        done();

    });

    it('should return true when verifying a valid timestamp', (done) => {

        const signOps = signingOptions();
        signOps.payload.iat = '1d';
        delete signOps.payload.exp;
        const result = Jwt.signSync(signOps);
        const ops = verifyOptions(result.token);
        const verify = Jwt.verifySync(ops);
        expect(verify).to.be.true();
        done();

    });

    it('should return a decoded json web token', (done) => {

        const result = Jwt.signSync(signingOptions());
        const decoded = Jwt.decode(result.token);
        expect(decoded).to.be.an.object();
        expect(decoded.header.alg).to.equal('RS256');
        expect(decoded.payload.host).to.equal(Os.hostname());
        done();

    });



});
