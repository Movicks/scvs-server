import { Injectable } from '@nestjs/common'
import { createHash, createSign, createVerify } from 'crypto'
import { promises as fs } from 'fs'

@Injectable()
export class CryptoService {
  async sha256(data: string | Buffer) {
    const h = createHash('sha256')
    h.update(data)
    return h.digest('hex')
  }

  async sign(data: string | Buffer) {
    const privateKey = await fs.readFile(process.env.SCVS_PRIVATE_KEY_PATH!, 'utf8')
    const signer = createSign('RSA-SHA256')
    signer.update(data)
    signer.end()
    return signer.sign(privateKey, 'base64')
  }

  async verify(data: string | Buffer, signature: string) {
    const publicKey = await fs.readFile(process.env.SCVS_PUBLIC_KEY_PATH!, 'utf8')
    const verifier = createVerify('RSA-SHA256')
    verifier.update(data)
    verifier.end()
    return verifier.verify(publicKey, Buffer.from(signature, 'base64'))
  }
}