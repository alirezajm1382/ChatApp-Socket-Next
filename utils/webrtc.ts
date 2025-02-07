export class WebRTCConnection {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private ws: WebSocket | null = null;
  private clientId: string | null = null;
  private username: string | null = null;
  private onMessageCallback:
    | ((message: string, senderId: string, senderName: string) => void)
    | null = null;
  private onUserJoinedCallback: ((userId: string, username: string) => void) | null = null;
  private onUserLeftCallback: ((userId: string, username: string) => void) | null = null;

  constructor(username: string) {
    this.username = username;
  }

  private createPeerConnection(targetId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.ws) {
        this.ws.send(
          JSON.stringify({
            type: "ice-candidate",
            data: event.candidate,
            target: targetId,
          })
        );
      }
    };

    peerConnection.ondatachannel = (event) => {
      console.log("Received data channel");
      this.setupDataChannel(event.channel, targetId);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(
        `Connection state changed: ${peerConnection.connectionState}`
      );
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state: ${peerConnection.iceConnectionState}`);
    };

    this.peerConnections.set(targetId, peerConnection);
    return peerConnection;
  }

  private setupDataChannel(channel: RTCDataChannel, peerId: string) {
    channel.onmessage = (event) => {
      console.log("Received message:", event.data);
      if (this.onMessageCallback) {
        try {
          const { message, senderId, senderName } = JSON.parse(event.data);
          this.onMessageCallback(message, senderId, senderName);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      }
    };

    channel.onopen = () => {
      console.log(`Data channel is open with peer ${peerId}`);
    };

    channel.onclose = () => {
      console.log(`Data channel is closed with peer ${peerId}`);
      this.dataChannels.delete(peerId);
    };

    channel.onerror = (error) => {
      console.error(`Data channel error with peer ${peerId}:`, error);
    };

    this.dataChannels.set(peerId, channel);
  }

  public connect() {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:3001/ws`;
      console.log("Connecting to WebSocket server at:", wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (wsUrl.startsWith('wss://')) {
          const fallbackUrl = wsUrl.replace('wss://', 'ws://');
          console.log("Attempting fallback connection to:", fallbackUrl);
          this.ws = new WebSocket(fallbackUrl);
        }
      };

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        if (this.ws) {
          this.ws.send(JSON.stringify({
            type: "username",
            username: this.username
          }));
        }
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setTimeout(() => {
          console.log("Attempting to reconnect...");
          this.connect();
        }, 3000);
      };

      this.ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Received WebSocket message:", message);

          switch (message.type) {
            case "id":
              this.clientId = message.id;
              console.log("Received client ID:", this.clientId);
              break;

            case "userJoined":
              if (this.onUserJoinedCallback) {
                const username = message.username || message.id;
                this.onUserJoinedCallback(message.id, username);
              }
              await this.createOffer(message.id);
              break;

            case "userLeft":
              if (this.onUserLeftCallback) {
                const username = message.username || message.id;
                this.onUserLeftCallback(message.id, username);
              }
              this.dataChannels.delete(message.id);
              this.peerConnections.delete(message.id);
              break;

            case "offer":
              console.log("Received offer from:", message.from);
              await this.handleOffer(message.data, message.from);
              break;

            case "answer":
              console.log("Received answer from:", message.from);
              await this.handleAnswer(message.data, message.from);
              break;

            case "ice-candidate":
              console.log("Received ICE candidate from:", message.from);
              await this.handleIceCandidate(message.data, message.from);
              break;
          }
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
        }
      };
    } catch (error) {
      console.error("Error connecting to WebSocket server:", error);
    }
  }

  private async createOffer(targetId: string) {
    console.log("Creating offer for:", targetId);
    const peerConnection = this.createPeerConnection(targetId);
    const dataChannel = peerConnection.createDataChannel("chat");
    this.setupDataChannel(dataChannel, targetId);

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (this.ws) {
        this.ws.send(
          JSON.stringify({
            type: "offer",
            data: offer,
            target: targetId,
          })
        );
      }
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit, fromId: string) {
    console.log("Handling offer from:", fromId);
    try {
      const peerConnection = this.createPeerConnection(fromId);
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (this.ws) {
        this.ws.send(
          JSON.stringify({
            type: "answer",
            data: answer,
            target: fromId,
          })
        );
      }
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }

  private async handleAnswer(
    answer: RTCSessionDescriptionInit,
    fromId: string
  ) {
    console.log("Handling answer from:", fromId);
    const peerConnection = this.peerConnections.get(fromId);
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    }
  }

  private async handleIceCandidate(
    candidate: RTCIceCandidateInit,
    fromId: string
  ) {
    console.log("Handling ICE candidate from:", fromId);
    const peerConnection = this.peerConnections.get(fromId);
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    }
  }

  public sendMessage(message: string) {
    console.log("Sending message to all peers:", message);
    this.dataChannels.forEach((channel, peerId) => {
      if (channel.readyState === "open") {
        console.log("Sending to peer:", peerId);
        channel.send(
          JSON.stringify({
            message,
            senderId: this.clientId,
            senderName: this.username
          })
        );
      } else {
        console.log(
          "Channel not open for peer:",
          peerId,
          "State:",
          channel.readyState
        );
      }
    });
  }

  public onMessage(callback: (message: string, senderId: string, senderName: string) => void) {
    this.onMessageCallback = callback;
  }

  public onUserJoined(callback: (userId: string, username: string) => void) {
    this.onUserJoinedCallback = callback;
  }

  public onUserLeft(callback: (userId: string, username: string) => void) {
    this.onUserLeftCallback = callback;
  }
}
