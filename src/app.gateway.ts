import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() server;
    players = [];

    async handleConnection(client: Socket): Promise<void> {
        this.players.push({
            id: client.id,
            nick: client.id
        });

        // Notify connected clients of new player list
        this.server.emit(`welcome`, this.players);
    }

    async handleDisconnect(client: Socket): Promise<void> {
        this.players = this.players.filter((player) => player.id !== client.id);

        // Notify connected clients of new player list
        this.server.emit(`welcome`, this.players);
    }

    @SubscribeMessage('nick')
    async onNick(client: Socket, nick: string): Promise<void> {
        this.players.find(player => player.id === client.id).nick = nick;
        this.server.emit('welcome', this.players);
    }
}