// ffmpegStatsClient.js

export class FFmpegStatsClient {
  constructor(url, { onUpdate, onOpen, onClose, onError } = {}) {
    this.url = url;
    this.ws = null;
    this.onUpdate = onUpdate || (() => {});
    this.onOpen = onOpen || (() => {});
    this.onClose = onClose || (() => {});
    this.onError = onError || (() => {});
    this.reconnectDelay = 2000;
    this._shouldReconnect = true;
  }

  connect() {
    if (this.ws) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.onOpen();
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.onUpdate(data);
      } catch (err) {
        console.error("Invalid FFmpeg stats payload", err);
      }
    };

    this.ws.onerror = (err) => {
      this.onError(err);
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.onClose();

      if (this._shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    };
  }

  disconnect() {
    this._shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}