/**
 * This object represents the different statuses of voice connections. I had to add this manually because
 * Discord.js doesn't seem to expose this for some reason?
 */
export const VoiceStatus = {
    Ready: 0,
    Connecting: 1,
    Reconnecting: 2,
    Idle: 3,
    Nearly: 4,
    Disconnected: 5
};

/**
 * Data store keys--used when setting/getting with the data store.
 */
export const DataStoreKeys = {
    AudioEngineKey: "audio-engine"
};