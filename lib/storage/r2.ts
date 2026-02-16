import crypto from 'crypto'

const S3_SERVICE = 's3'
const DEFAULT_REGION = 'auto'

type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  endpoint: string
  publicUrl: string
  region: string
  productsPrefix: string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function getR2Config(): R2Config {
  const accountId = requireEnv('R2_ACCOUNT_ID')
  const accessKeyId = requireEnv('R2_ACCESS_KEY_ID')
  const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY')
  const bucketName = requireEnv('R2_BUCKET_NAME')
  const publicUrl = requireEnv('R2_PUBLIC_URL').replace(/\/+$/, '')
  const endpointRaw =
    process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`
  const endpoint = endpointRaw.replace(/\/+$/, '')

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
    publicUrl,
    region: process.env.R2_REGION || DEFAULT_REGION,
    productsPrefix: (process.env.R2_PRODUCTS_PREFIX || 'products').replace(/^\/+|\/+$/g, ''),
  }
}

function hmac(key: Buffer | string, data: string) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest()
}

function sha256Hex(data: Buffer | string) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

function toDateStamp(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function encodeS3Path(path: string) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function buildSignatureKey(secretKey: string, dateStamp: string, region: string, service: string) {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  return hmac(kService, 'aws4_request')
}

function signRequest(options: {
  method: 'PUT' | 'DELETE'
  url: URL
  contentType?: string
  payloadHash: string
  accessKeyId: string
  secretAccessKey: string
  region: string
}) {
  const now = new Date()
  const amzDate = toAmzDate(now)
  const dateStamp = toDateStamp(now)

  const canonicalUri = options.url.pathname
  const host = options.url.host

  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${options.payloadHash}`,
    `x-amz-date:${amzDate}`,
  ]

  const signedHeaders = ['host', 'x-amz-content-sha256', 'x-amz-date']

  if (options.contentType) {
    canonicalHeaders.push(`content-type:${options.contentType}`)
    signedHeaders.push('content-type')
  }

  canonicalHeaders.sort()
  signedHeaders.sort()

  const canonicalRequest = [
    options.method,
    canonicalUri,
    '',
    `${canonicalHeaders.join('\n')}\n`,
    signedHeaders.join(';'),
    options.payloadHash,
  ].join('\n')

  const credentialScope = `${dateStamp}/${options.region}/${S3_SERVICE}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  const signingKey = buildSignatureKey(
    options.secretAccessKey,
    dateStamp,
    options.region,
    S3_SERVICE
  )
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(stringToSign, 'utf8')
    .digest('hex')

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${options.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders.join(';')}`,
    `Signature=${signature}`,
  ].join(', ')

  return {
    authorization,
    amzDate,
  }
}

export function buildProductImageKey(filename: string) {
  const { productsPrefix } = getR2Config()
  const clean = filename.toLowerCase().replace(/[^a-z0-9._-]/g, '-')
  return `${productsPrefix}/${Date.now()}-${clean}`
}

export function buildPublicFileUrl(key: string) {
  const { publicUrl } = getR2Config()
  return `${publicUrl}/${key}`
}

export function parseManagedR2KeyFromUrl(url: string): string | null {
  const { publicUrl } = getR2Config()
  if (!url.startsWith(`${publicUrl}/`)) {
    return null
  }
  return url.slice(publicUrl.length + 1)
}

export async function uploadBufferToR2(params: {
  key: string
  body: Buffer
  contentType: string
}) {
  const config = getR2Config()
  const path = `/${config.bucketName}/${encodeS3Path(params.key)}`
  const url = new URL(`${config.endpoint}${path}`)
  const payloadHash = sha256Hex(params.body)

  const { authorization, amzDate } = signRequest({
    method: 'PUT',
    url,
    contentType: params.contentType,
    payloadHash,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
  })

  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      Authorization: authorization,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'content-type': params.contentType,
      host: url.host,
    },
    body: new Uint8Array(params.body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`R2 upload failed (${response.status}): ${text}`)
  }
}

export async function deleteObjectFromR2(key: string) {
  const config = getR2Config()
  const path = `/${config.bucketName}/${encodeS3Path(key)}`
  const url = new URL(`${config.endpoint}${path}`)
  const payloadHash = sha256Hex('')

  const { authorization, amzDate } = signRequest({
    method: 'DELETE',
    url,
    payloadHash,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
  })

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      Authorization: authorization,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      host: url.host,
    },
  })

  if (!response.ok && response.status !== 404) {
    const text = await response.text()
    throw new Error(`R2 delete failed (${response.status}): ${text}`)
  }
}
