const crypto = require('crypto');

const CLOUDINARY_API_BASE = 'https://api.cloudinary.com/v1_1';

function getCloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      'Faltan variables de Cloudinary: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET'
    );
  }

  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
  };
}

function signParams(params, apiSecret) {
  const payload = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
}

function buildPrivateDownloadUrl(asset) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const expiresAt = timestamp + (asset.expiresInSeconds || 60);
  const params = {
    expires_at: expiresAt,
    format: asset.format,
    public_id: asset.publicId,
    timestamp,
    type: asset.deliveryType || 'private',
  };
  const signature = signParams(params, apiSecret);
  const searchParams = new URLSearchParams({
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    ),
    api_key: apiKey,
    signature,
  });

  return `${CLOUDINARY_API_BASE}/${cloudName}/${asset.resourceType || 'raw'}/download?${searchParams.toString()}`;
}

async function uploadBuffer(file, options = {}) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const resourceType = options.resourceType || 'auto';
  const deliveryType = options.deliveryType || 'private';
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    timestamp,
    folder: options.folder,
    use_filename: true,
    unique_filename: true,
  };
  const signature = signParams(params, apiSecret);
  const formData = new FormData();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  formData.append('api_key', apiKey);
  formData.append('signature', signature);
  formData.append(
    'file',
    new Blob([file.buffer], { type: file.mimetype }),
    file.originalname
  );

  const response = await fetch(
    `${CLOUDINARY_API_BASE}/${cloudName}/${resourceType}/${deliveryType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'No se pudo subir el archivo');
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
    deliveryType: data.type,
    format: data.format,
    bytes: data.bytes,
  };
}

async function deleteAsset(publicId, resourceType = 'image', deliveryType = 'private') {
  if (!publicId) {
    return;
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    public_id: publicId,
    timestamp,
    type: deliveryType,
  };
  const signature = signParams(params, apiSecret);
  const formData = new FormData();

  formData.append('public_id', publicId);
  formData.append('timestamp', String(timestamp));
  formData.append('type', deliveryType);
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const response = await fetch(
    `${CLOUDINARY_API_BASE}/${cloudName}/${resourceType}/destroy`,
    {
      method: 'POST',
      body: formData,
    }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'No se pudo borrar el archivo');
  }
}

module.exports = {
  buildPrivateDownloadUrl,
  deleteAsset,
  uploadBuffer,
};
