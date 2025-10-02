const WAV_CONFIG = {
  targetSampleRate: 16000,
  numberOfChannels: 1,
  bitsPerSample: 16,
  minBlobSize: 1000,
};

const createWavHeader = (dataSize: number): DataView => {
  const { targetSampleRate, numberOfChannels, bitsPerSample } = WAV_CONFIG;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = targetSampleRate * blockAlign;
  const fileSize = 36 + dataSize;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, fileSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  return view;
};

const resampleAudio = (
  inputData: Float32Array,
  inputSampleRate: number,
  targetSampleRate: number
): Float32Array => {
  const resampleRatio = targetSampleRate / inputSampleRate;
  const outputLength = Math.floor(inputData.length * resampleRatio);
  const outputSamples = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const sourceIndex = i / resampleRatio;
    const index = Math.floor(sourceIndex);
    const fraction = sourceIndex - index;

    if (index + 1 < inputData.length) {
      outputSamples[i] =
        inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
    } else {
      outputSamples[i] = inputData[Math.min(index, inputData.length - 1)] || 0;
    }
  }

  return outputSamples;
};

const validateAudioBlob = (arrayBuffer: ArrayBuffer): boolean => {
  if (arrayBuffer.byteLength === 0) {
    console.warn('Empty ArrayBuffer');
    return false;
  }

  const headerView = new Uint8Array(arrayBuffer);
  const allZeros = headerView
    .slice(0, Math.min(16, headerView.length))
    .every((byte) => byte === 0);

  if (allZeros) {
    console.warn('Audio data is empty (all bytes are 0)');
    return false;
  }

  return true;
};

export const convertWebMToWav = async (
  webmBlob: Blob
): Promise<Blob | null> => {
  try {
    if (webmBlob.size < WAV_CONFIG.minBlobSize) {
      console.warn('Blob too small to be valid audio:', webmBlob.size, 'bytes');
      return null;
    }

    // @ts-expect-error - webkitAudioContext for compatibility
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: WAV_CONFIG.targetSampleRate,
      latencyHint: 'playback',
    });

    const arrayBuffer = await webmBlob.arrayBuffer();

    if (!validateAudioBlob(arrayBuffer)) {
      audioContext.close();
      return null;
    }

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Failed to decode audio:', error);
      audioContext.close();
      return null;
    }

    if (!audioBuffer || audioBuffer.length === 0 || audioBuffer.duration === 0) {
      console.warn('Invalid or empty AudioBuffer');
      audioContext.close();
      return null;
    }

    const inputChannelData = audioBuffer.getChannelData(0);
    const outputSamples = resampleAudio(
      inputChannelData,
      audioBuffer.sampleRate,
      WAV_CONFIG.targetSampleRate
    );

    const dataSize = outputSamples.length * (WAV_CONFIG.bitsPerSample / 8);
    const view = createWavHeader(dataSize);

    let offset = 44;
    for (let i = 0; i < outputSamples.length; i++) {
      const sample = Math.max(-1, Math.min(1, outputSamples[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, Math.round(intSample), true);
      offset += 2;
    }

    audioContext.close();
    return new Blob([view.buffer as ArrayBuffer], { type: 'audio/wav' });
  } catch (error) {
    console.error('WebM to WAV conversion error:', error);
    return null;
  }
};
