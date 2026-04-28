const fs = require('fs');

function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function getPngDimensions(buffer) {
  if (
    buffer.length < 24 ||
    buffer[0] !== 0x89 ||
    buffer[1] !== 0x50 ||
    buffer[2] !== 0x4e ||
    buffer[3] !== 0x47
  ) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function getGifDimensions(buffer) {
  const header = buffer.subarray(0, 6).toString('ascii');

  if (buffer.length < 10 || (header !== 'GIF87a' && header !== 'GIF89a')) {
    return null;
  }

  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  };
}

function getWebpDimensions(buffer) {
  if (
    buffer.length < 30 ||
    buffer.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    buffer.subarray(8, 12).toString('ascii') !== 'WEBP'
  ) {
    return null;
  }

  const chunkType = buffer.subarray(12, 16).toString('ascii');

  if (chunkType === 'VP8X') {
    return {
      width: readUInt24LE(buffer, 24) + 1,
      height: readUInt24LE(buffer, 27) + 1,
    };
  }

  if (chunkType === 'VP8L' && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);

    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

function getJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset < buffer.length) {
    while (buffer[offset] === 0xff) {
      offset += 1;
    }

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    if (offset + 1 >= buffer.length) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset);

    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      break;
    }

    if (
      (marker >= 0xc0 && marker <= 0xcf) &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      const segmentStart = offset + 2;

      return {
        height: buffer.readUInt16BE(segmentStart + 1),
        width: buffer.readUInt16BE(segmentStart + 3),
      };
    }

    offset += segmentLength;
  }

  return null;
}

function getImageDimensionsSync(filePath) {
  const buffer = fs.readFileSync(filePath);

  return getImageDimensions(buffer);
}

function getImageDimensions(buffer) {
  return (
    getPngDimensions(buffer) ||
    getGifDimensions(buffer) ||
    getWebpDimensions(buffer) ||
    getJpegDimensions(buffer)
  );
}

module.exports = {
  getImageDimensions,
  getImageDimensionsSync,
};
