import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';
import { AuthenticationService } from '../authentication-service/authentication.service';
import { ConstantsService } from '../constants-service/constants.service';
import { ChatMessageModel } from '../../models/chat-message.model';

@Injectable()
export class ChatService {

  public chatMessages: ChatMessageModel[];
  private newMessageCount: number;

  private socket;

  constructor(
    public http: Http,
    public constantsService: ConstantsService,
    public authenticationService: AuthenticationService)
  {
    this.chatMessages = new Array<ChatMessageModel>();
    this.newMessageCount = 0;

    this.socket = io(this.constantsService.socketIOUrl);
    this.socket.on('chatEvent', function(data) {
      console.log("SocketIO chat event recieved: " + data);
      let message = ChatMessageModel.createFromJson(JSON.parse(data));
      this.chatMessages.push(message);
      this.chatMessages.sort((a, b) : number => {
        if (a.time < b.time) return 1;
        if (a.time > b.time) return -1;
        return 0;
      });
      if (message.getUsername() != this.authenticationService.getUsername())
        this.newMessageCount++;
    }.bind(this));
  }

  sendMessage(text: string) {
    let message = new ChatMessageModel();
    message.setUsername(this.authenticationService.getUsername());
    message.setTime(new Date());
    message.setText(text);
    this.socket.emit('chatEvent', JSON.stringify(message.toJson()));
    console.log("SocketIO chat event sent: " + message);
  }

  getNewMessageCount() {
    return this.newMessageCount;
  }

  resetNewMessageCount() {
    this.newMessageCount = 0;
  }
}