import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() server;
    players = [];
    cards = undefined;
    board = {};

    async handleConnection(client: Socket): Promise<void> {
        this.players.push({
            id: client.id,
            nick: client.id
        });

        // Notify connected clients of new player list
        this.server.emit(`welcome`, this.players);
        client.emit(`board`, this.board);
    }

    async handleDisconnect(client: Socket): Promise<void> {
        this.players = this.players.filter((player) => player.id !== client.id);

        // Notify connected clients of new player list
        this.server.emit(`goodbye`, { players: this.players, board: this.board });
    }

    @SubscribeMessage('nick')
    async onNick(client: Socket, nick: string): Promise<void> {
        this.players.find(player => player.id === client.id).nick = nick;
        this.server.emit('welcome', this.players);
    }

    @SubscribeMessage('reset')
    async onReset(client: Socket): Promise<void> {
        this.cards = undefined;
        this.board = {};
        this.server.emit('reset');
    }

    @SubscribeMessage('cards')
    async onCards(client: Socket, cards: string[]): Promise<void> {
        if (this.cards === undefined) {
            this.board = {};
            this.cards = cards;
            this.cards.sort(() => Math.random() - 0.5);
        }
    }

    @SubscribeMessage('pick')
    async onPick(client: Socket): Promise<void> {
        const cardName = this.cards.shift();
        this.board[cardName] = [100, 100];
        this.server.emit('picked', cardName);
    }

    @SubscribeMessage('dragend')
    async onDragEnd(client: Socket, data: any): Promise<void> {
        console.log(data);
        this.board[data.name] = [data.x, data.y];
        this.server.emit('dragend', data);
    }
}