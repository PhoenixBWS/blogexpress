import * as jose from 'jose';
import { readFile, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ALG = 'ECDH-ES+A256KW';
const ENC = 'A256GCM';

const importPublicKey = async (publicKey) => {
    if (typeof publicKey === 'string') {
        return jose.importSPKI(publicKey, ALG);
    }
    return publicKey;
};

const importPrivateKey = async (privateKey) => {
    if (typeof privateKey === 'string') {
        return jose.importPKCS8(privateKey, ALG);
    }
    return privateKey;
};

const generateKP = async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair(ALG, { crv: 'P-384', extractable: true });
    const exportedPrivateKey = await jose.exportPKCS8(privateKey);
    const exportedPublicKey = await jose.exportSPKI(publicKey);
    return { publicKey: exportedPublicKey, privateKey: exportedPrivateKey };
}

const saveKPToFiles = async ({ publicKey, privateKey }, publicKeyPath, privateKeyPath) => {
    await Promise.all([
        mkdir(dirname(publicKeyPath), { recursive: true }),
        mkdir(dirname(privateKeyPath), { recursive: true }),
    ]);
    await writeFile(publicKeyPath, publicKey, 'utf8');
    await writeFile(privateKeyPath, privateKey, 'utf8');
};

const getKeyPaths = () => {
    const moduleDir = dirname(fileURLToPath(import.meta.url));
    return {
        publicKeyPath: resolve(moduleDir, '..', 'private', 'public.key'),
        privateKeyPath: resolve(moduleDir, '..', 'private', 'private.key'),
    };
};

const loadPublicKeyFromFile = async (publicKeyPath) => {
    const publicKey = await readFile(publicKeyPath, 'utf8');
    return publicKey;
};

const loadPrivateKeyFromFile = async (privateKeyPath) => {
    const privateKey = await readFile(privateKeyPath, 'utf8');
    return privateKey;
};

const encrypt = async (payload) => {
    const { publicKeyPath } = getKeyPaths();
    const loadedPublicKey = await loadPublicKeyFromFile(publicKeyPath);
    const importedPublicKey = await importPublicKey(loadedPublicKey);
    const jwt = await new jose.EncryptJWT(payload)
        .setProtectedHeader({ alg: ALG, enc: ENC })
        .setIssuedAt()
        .setExpirationTime('7d')
        .encrypt(importedPublicKey);
    return jwt;
};

const decrypt = async (token) => {
    const { privateKeyPath } = getKeyPaths();
    const loadedPrivateKey = await loadPrivateKeyFromFile(privateKeyPath);
    const importedPrivateKey = await importPrivateKey(loadedPrivateKey);
    const { payload } = await jose.jwtDecrypt(token, importedPrivateKey, {
        algorithms: [ALG],
    });
    return payload;
};

// Uncomment the following code to generate and save the key pair when this module is run directly
//
// generateKP().then(({ publicKey, privateKey }) => {
//     const moduleDir = dirname(fileURLToPath(import.meta.url));
//     const publicKeyPath = resolve(moduleDir, '..', 'private', 'public.key');
//     const privateKeyPath = resolve(moduleDir, '..', 'private', 'private.key');
//     saveKPToFiles({ publicKey, privateKey }, publicKeyPath, privateKeyPath);
// }).catch((error) => {
//     console.error('Error generating key pair:', error);
// });

export { encrypt, decrypt };