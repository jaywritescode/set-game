import alt from './calt';
import _ from 'lodash';
import MultiplayerActions from 'actions';

class MultiplayerStore {
  constructor() {
    this.my_player_id = undefined;
    this.players = {};
    this.cards = [];
    this.selected = new Set();
    this.current_state = 'WAITING_FOR_PLAYERS';

    this.bindListeners({
      handleUpdatePlayers: MultiplayerActions.UPDATE_PLAYERS,
      handleClearName: MultiplayerActions.CLEAR_NAME,
      handleReceiveMessage: MultiplayerActions.RECEIVE_MESSAGE,
    });
  }

  handleUpdatePlayers(players) {
    console.log('MultiplayerStore.handleUpdatePlayers: players = %O', players);
    this.players = players;
  }

  handleClearName() {
    console.log('MultiplayerStore.handleClearName');
    this.my_player_id = null;
  }

  handleReceiveMessage(message) {
    console.log('MultiplayerStore.handleReceiveMessage: message = %O', message);

    const
      handleAddPlayer = (data) => {
        let { my_player_id, players } = data;
        // race condition here -- we would like a way to uniquely identify each requester
        if (this.my_player_id === undefined) {
          this.my_player_id = my_player_id;
        }
        this.players = players;
        if (this.current_state == 'WAITING_FOR_PLAYERS' && _.size(this.players) > 1) {
          this.current_state = 'WAITING_FOR_CLICK_START';
        }
        return true;
      },
      handleChangeName = (data) => {
        let { old_name, new_name } = data;
        if (!(old_name && new_name)) {
          return false;
        }
        this.my_player_id = new_name
        this.players[new_name] = this.players[old_name];
        delete this.players[old_name];
        return true;
      },
      handleCountdownStart = (data) => {
        let { start_time } = data;
        this.current_state = 'START_AT_' + start_time
      };

    let actions = {
      'add-player': handleAddPlayer,
      'change-name': handleChangeName,
      'countdown-start': handleCountdownStart,
      'verify-set': (data) => {
        let { valid, cards_to_add, cards_to_remove, player, found, game_over } = data;
        if (!valid) {
          return false;
        }

        cards_to_remove.forEach((c) => {
          this.cards[_.findIndex(this.cards, _.matches(c))] = cards_to_add.pop();
        });
        while (cards_to_add.length) {
          this.cards.push(cards_to_add.pop());
        }

        this.players[player] = found;
      }
    };

    actions[message.action].call(this, message);
  }
}

module.exports = alt.createStore(MultiplayerStore, 'MultiplayerStore');
