import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() server;
    players = [];
    cards = undefined;

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

    @SubscribeMessage('reset')
    async onReset(client: Socket): Promise<void> {
        this.cards = undefined;
        this.server.emit('reset');
    }

    @SubscribeMessage('cards')
    async onFrames(client: Socket, cards: string[]): Promise<void> {
        if (this.cards === undefined) {
            this.cards = cards;
            this.cards.sort(() => Math.random() - 0.5);
        }
    }

    @SubscribeMessage('pick')
    async onPick(client: Socket): Promise<void> {
        this.server.emit('picked', this.cards.shift());
    }

    @SubscribeMessage('dragend')
    async onDragEnd(client: Socket, data: Object): Promise<void> {
        console.log(data);
        this.server.emit('dragend', data);
    }
}